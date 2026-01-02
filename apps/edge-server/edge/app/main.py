"""
Edge Server Main Entry Point
FastAPI application with Setup, Status, and Errors pages
"""
import asyncio
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Depends, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

# Add parent directory to path
BASE_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BASE_DIR / "app"))

# Import modules using relative imports
from .config_store import ConfigStore
from .error_store import ErrorStore
from .status_service import StatusService
from .cloud_client import CloudClient
from .heartbeat import HeartbeatService
from .camera_sync import CameraSyncService
from .event_sender import EventSenderService
from .command_listener import CommandListenerService
from .web_ui import router as web_ui_router


# Global services (will be initialized in lifespan)
config: ConfigStore = None
error_store: ErrorStore = None
status_service: StatusService = None
cloud_client: CloudClient = None
heartbeat_service: HeartbeatService = None
camera_sync: CameraSyncService = None
event_sender: EventSenderService = None
command_listener: CommandListenerService = None


# Setup logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
    level="INFO",
    colorize=True
)

# Add file logging
logs_dir = BASE_DIR / "logs"
logs_dir.mkdir(parents=True, exist_ok=True)
logger.add(
    logs_dir / "edge.log",
    rotation="10 MB",
    retention="7 days",
    level="INFO",
    encoding="utf-8"
)
logger.add(
    logs_dir / "errors.log",
    rotation="10 MB",
    retention="7 days",
    level="ERROR",
    encoding="utf-8"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global config, error_store, status_service, cloud_client
    global heartbeat_service, camera_sync, event_sender, command_listener
    
    logger.info("=" * 60)
    logger.info("Starting STC Edge Server")
    logger.info("=" * 60)
    
    # Initialize services
    config = ConfigStore()
    error_store = ErrorStore()
    status_service = StatusService()
    
    # Check if setup is completed
    if config.is_setup_completed():
        cloud_config = config.get_cloud_config()
        cloud_client = CloudClient(
            cloud_config["base_url"],
            cloud_config["edge_key"],
            cloud_config["edge_secret"],
            error_store
        )
        
        await cloud_client.connect()
        
        # Initialize services
        camera_sync = CameraSyncService(config, cloud_client, status_service, error_store)
        event_sender = EventSenderService(cloud_client, status_service, error_store)
        command_listener = CommandListenerService(cloud_client, status_service, error_store, camera_sync)
        heartbeat_service = HeartbeatService(config, cloud_client, status_service, error_store)
        
        # Start services
        await heartbeat_service.start()
        await event_sender.start()
        await command_listener.start()
        
        # Initial camera sync
        await camera_sync.sync_cameras()
        
        status_service.set_state("Online")
        logger.info("Edge Server is OPERATIONAL")
    else:
        status_service.set_state("Setup Required")
        logger.info("Edge Server requires setup - visit /setup")
    
    logger.info(f"Web UI: http://localhost:{config.get('server_port', 8090)}")
    logger.info("=" * 60)
    
    yield
    
    # Cleanup
    logger.info("Shutting down Edge Server...")
    
    if heartbeat_service:
        await heartbeat_service.stop()
    if event_sender:
        await event_sender.stop()
    if command_listener:
        await command_listener.stop()
    if cloud_client:
        await cloud_client.disconnect()
    
    logger.info("Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="STC Edge Server",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include web UI routes
app.include_router(web_ui_router)

# Command endpoints (for Cloud to send commands) - HMAC authenticated
import hmac
import hashlib
import time

async def verify_cloud_hmac(request: Request):
    """Verify HMAC signature from Cloud for command endpoints"""
    # Require HTTPS
    if request.url.scheme != "https":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HTTPS is required for all API access"
        )
    
    # Get HMAC headers
    edge_key = request.headers.get("X-EDGE-KEY")
    timestamp = request.headers.get("X-EDGE-TIMESTAMP")
    signature = request.headers.get("X-EDGE-SIGNATURE")
    
    if not edge_key or not timestamp or not signature:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing required authentication headers"
        )
    
    # Load edge credentials from config
    config = ConfigStore()
    if not config.is_setup_completed():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Edge Server not configured"
        )
    
    cloud_config = config.get_cloud_config()
    stored_edge_key = cloud_config.get("edge_key")
    stored_edge_secret = cloud_config.get("edge_secret")
    
    if not stored_edge_key or not stored_edge_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Edge Server credentials not configured"
        )
    
    # Verify edge_key matches
    if edge_key != stored_edge_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid edge key"
        )
    
    # Verify timestamp (replay protection)
    try:
        request_time = int(timestamp)
        current_time = int(time.time())
        time_diff = abs(current_time - request_time)
        
        if time_diff > 300:  # 5 minutes
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Request timestamp is too old or too far in the future"
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid timestamp"
        )
    
    # Verify signature
    body_bytes = await request.body()
    body_hash = hashlib.sha256(body_bytes or b"").hexdigest()
    signature_string = f"{request.method}|{request.url.path}|{timestamp}|{body_hash}"
    expected_signature = hmac.new(
        stored_edge_secret.encode('utf-8'),
        signature_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(expected_signature, signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature"
        )
    
    # Store body for use in endpoint
    request.state.body = body_bytes


@app.post("/api/v1/commands/restart", dependencies=[Depends(verify_cloud_hmac)])
async def restart_command(request: Request):
    """Handle restart command from Cloud (HMAC authenticated)"""
    if not command_listener:
        return JSONResponse(
            status_code=503,
            content={"success": False, "error": "Command listener not initialized"}
        )
    
    result = await command_listener.execute_restart()
    return JSONResponse(content=result)


@app.post("/api/v1/commands/sync_config", dependencies=[Depends(verify_cloud_hmac)])
async def sync_config_command(request: Request):
    """Handle sync-config command from Cloud (HMAC authenticated)"""
    if not command_listener:
        return JSONResponse(
            status_code=503,
            content={"success": False, "error": "Command listener not initialized"}
        )
    
    result = await command_listener.execute_sync_config()
    return JSONResponse(content=result)


@app.get("/api/v1/status")
async def api_status():
    """API status endpoint"""
    if not status_service:
        return JSONResponse(
            status_code=503,
            content={"status": "initializing"}
        )
    
    return JSONResponse(content=status_service.get_status())


@app.get("/health")
async def health():
    """Health check endpoint"""
    return JSONResponse(content={"healthy": True})


if __name__ == "__main__":
    import uvicorn
    
    # Get port from config
    config_temp = ConfigStore()
    port = config_temp.get("server_port", 8090)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        log_level="warning"
    )
