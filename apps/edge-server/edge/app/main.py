"""
Edge Server Main Entry Point
FastAPI application with Setup, Status, and Errors pages
"""
import asyncio
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Depends, Header, HTTPException
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
from .enterprise_monitoring import EnterpriseMonitoringService


# Global services (will be initialized in lifespan)
config: ConfigStore = None
error_store: ErrorStore = None
status_service: StatusService = None
cloud_client: CloudClient = None
heartbeat_service: HeartbeatService = None
camera_sync: CameraSyncService = None
event_sender: EventSenderService = None
command_listener: CommandListenerService = None
enterprise_monitoring: EnterpriseMonitoringService = None


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
    global enterprise_monitoring
    
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
        enterprise_monitoring = EnterpriseMonitoringService(cloud_client, config, status_service, error_store)
        
        # Start services
        await heartbeat_service.start()
        await event_sender.start()
        await command_listener.start()
        
        # Initial camera sync
        await camera_sync.sync_cameras()
        
        # Initial scenario fetch for enterprise monitoring
        await enterprise_monitoring.fetch_scenarios()
        
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

# Import security functions for HMAC verification
from typing import Optional
import hmac
import hashlib
import time


async def verify_hmac_signature(
    request: Request,
    x_edge_key: Optional[str] = Header(default=None, alias="X-EDGE-KEY"),
    x_edge_timestamp: Optional[str] = Header(default=None, alias="X-EDGE-TIMESTAMP"),
    x_edge_signature: Optional[str] = Header(default=None, alias="X-EDGE-SIGNATURE"),
):
    """Verify HMAC signature for Cloud commands"""
    # Require HTTPS
    if request.url.scheme != "https":
        raise HTTPException(
            status_code=403,
            detail="HTTPS is required for all API access"
        )
    
    # Check required headers
    if not x_edge_key or not x_edge_timestamp or not x_edge_signature:
        raise HTTPException(
            status_code=401,
            detail="HMAC headers are required (X-EDGE-KEY, X-EDGE-TIMESTAMP, X-EDGE-SIGNATURE)"
        )
    
    # Load edge credentials from config (access global config)
    global config
    if not config or not config.is_setup_completed():
        raise HTTPException(
            status_code=503,
            detail="Edge Server not configured"
        )
    
    cloud_config = config.get_cloud_config()
    stored_edge_key = cloud_config.get("edge_key")
    stored_edge_secret = cloud_config.get("edge_secret")
    
    if not stored_edge_key or not stored_edge_secret:
        raise HTTPException(
            status_code=401,
            detail="Edge credentials not configured"
        )
    
    # Verify edge_key matches
    if stored_edge_key != x_edge_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid edge key"
        )
    
    # Verify timestamp (within 5 minutes)
    try:
        request_time = int(x_edge_timestamp)
        current_time = int(time.time())
        if abs(current_time - request_time) > 300:
            raise HTTPException(
                status_code=401,
                detail="Timestamp out of range (replay attack protection)"
            )
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid timestamp"
        )
    
    # Verify signature
    body_bytes = await request.body()
    body_hash = hashlib.sha256(body_bytes or b"").hexdigest()
    signature_string = f"{request.method}|{request.url.path}|{x_edge_timestamp}|{body_hash}"
    
    expected_signature = hmac.new(
        stored_edge_secret.encode("utf-8"),
        signature_string.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(expected_signature, x_edge_signature):
        raise HTTPException(
            status_code=401,
            detail="Invalid signature"
        )


# Command endpoints (for Cloud to send commands) - HMAC PROTECTED
@app.post("/api/v1/commands/restart", dependencies=[Depends(verify_hmac_signature)])
async def restart_command(request: Request):
    """Handle restart command from Cloud (HMAC authenticated)"""
    if not command_listener:
        return JSONResponse(
            status_code=503,
            content={"success": False, "error": "Command listener not initialized"}
        )
    
    result = await command_listener.execute_restart()
    return JSONResponse(content=result)


@app.post("/api/v1/commands/sync_config", dependencies=[Depends(verify_hmac_signature)])
async def sync_config_command(request: Request):
    """Handle sync-config command from Cloud (HMAC authenticated)"""
    if not command_listener:
        return JSONResponse(
            status_code=503,
            content={"success": False, "error": "Command listener not initialized"}
        )
    
    result = await command_listener.execute_sync_config()
    return JSONResponse(content=result)


# Legacy endpoints (for backward compatibility) - Also HMAC PROTECTED
@app.post("/api/v1/system/restart", dependencies=[Depends(verify_hmac_signature)])
async def restart_command_legacy(request: Request):
    """Handle restart command from Cloud (legacy endpoint, HMAC authenticated)"""
    if not command_listener:
        return JSONResponse(
            status_code=503,
            content={"success": False, "error": "Command listener not initialized"}
        )
    
    result = await command_listener.execute_restart()
    return JSONResponse(content=result)


@app.post("/api/v1/system/sync-config", dependencies=[Depends(verify_hmac_signature)])
async def sync_config_command_legacy(request: Request):
    """Handle sync-config command from Cloud (legacy endpoint, HMAC authenticated)"""
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
