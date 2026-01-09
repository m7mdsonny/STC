import asyncio
import os
import platform
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

BASE_DIR = Path(__file__).parent
sys.path.insert(0, str(BASE_DIR))
os.chdir(BASE_DIR)

from config.settings import settings
from app.core.license import LocalLicenseStore

settings.ensure_directories()

logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
    level=settings.LOG_LEVEL,
    colorize=True
)

try:
    logger.add(
        settings.log_file,
        rotation="10 MB",
        retention="7 days",
        level=settings.LOG_LEVEL,
        encoding="utf-8"
    )
except Exception as e:
    logger.warning(f"Could not setup file logging: {e}")


class EdgeServerState:
    def __init__(self):
        self.db = None
        self.server_id = None
        self.license_data = None
        self.is_licensed = False
        self.is_connected = False
        self.hardware_id = platform.node()
        self.edge_id = None  # Edge ID for Cloud registration
        self.cameras = {}
        self.modules_loaded = False
        self.ai_manager = None  # AI Module Manager
        self.camera_service = None  # Camera Service
        self.sync_service = None  # Sync Service


state = EdgeServerState()


async def initialize_database():
    from app.core.database import CloudDatabase
    state.db = CloudDatabase()

    if not settings.is_configured():
        logger.warning("Server not configured - visit /setup to configure")
        return False

    connected = await state.db.connect()
    state.is_connected = connected

    if not connected:
        logger.warning("Could not connect to cloud - running offline")
        return False

    logger.info("Connected to cloud control plane")
    return True


async def validate_license():
    license_store = LocalLicenseStore()

    # Check for free trial if no license key
    if not settings.has_license() or settings.LICENSE_KEY.lower() in ("", "trial", "free"):
        if license_store._check_free_trial_eligibility("TRIAL", state.hardware_id):
            state.license_data = license_store.data
            state.is_licensed = True
            trial_days = license_store.get_trial_days_remaining()
            logger.info(f"14-day free trial active - {trial_days} days remaining")
            return True
        logger.warning("No license key configured and trial not available")
        return False

    if not state.db:
        if license_store.is_within_grace(settings.LICENSE_KEY, state.hardware_id):
            state.license_data = license_store.data
            state.is_licensed = True
            logger.info("Using cached license within grace period (offline)")
            return True
        return False

    valid, license_data = await state.db.validate_license(settings.LICENSE_KEY, hardware_id=state.hardware_id)

    if valid:
        state.is_licensed = True
        state.license_data = license_data
        license_store.update_from_cloud(settings.LICENSE_KEY, license_data, state.hardware_id)
        logger.info(
            "License valid - expires at {} (grace {} days)",
            license_data.get('expires_at'),
            license_data.get('grace_days', 14),
        )
        return True

    if license_store.is_within_grace(settings.LICENSE_KEY, state.hardware_id):
        state.is_licensed = True
        state.license_data = license_store.data
        logger.warning("License validation failed online; using cached license within grace period")
        return True

    logger.warning("Invalid or expired license beyond grace period")
    return False


async def register_server():
    if not state.db or not state.is_licensed:
        return False

    import socket
    import uuid
    hostname = socket.gethostname()

    # Generate or use existing edge_id
    if not state.edge_id:
        state.edge_id = str(uuid.uuid4())

    # Registration happens via heartbeat, but we can set server_id from hardware_id
    state.server_id = state.edge_id

    # Send initial heartbeat to register
    success = await state.db.heartbeat(
        edge_id=state.edge_id,
        version=settings.APP_VERSION,
        system_info=state.db._get_system_info(),
        organization_id=state.license_data.get('organization_id') if state.license_data else None,
        license_id=state.license_data.get('license_id') if state.license_data else None,
    )

    if success:
        logger.info(f"Server registered with edge_id: {state.edge_id}")
        return True

    return False


async def start_services():
    from app.services.sync import SyncService
    from app.services.camera import CameraService
    from app.ai.manager import AIModuleManager

    # Initialize AI Module Manager
    ai_manager = AIModuleManager()
    state.ai_manager = ai_manager

    # Initialize Camera Service
    camera_service = CameraService()
    state.camera_service = camera_service

    # Register AI processor with camera service
    async def ai_processor(camera_id: str, frame, enabled_modules: list):
        """Process frame through AI modules"""
        if not state.ai_manager:
            return
        
        # Get metadata from sync service
        metadata = {}
        if state.sync_service:
            metadata = {
                'faces_database': state.sync_service.get_faces(),
                'vehicles_database': state.sync_service.get_vehicles(),
                'rules': state.sync_service.get_rules(),
            }
        
        # Process frame
        results = state.ai_manager.process_frame(
            frame=frame,
            camera_id=camera_id,
            enabled_modules=enabled_modules,
            metadata=metadata
        )
        
        # Send alerts and events to Cloud
        if state.db and state.is_connected:
            for alert in results.get('alerts', []):
                alert_data = {
                    'camera_id': camera_id,
                    'module': alert.get('module', 'unknown'),
                    'type': alert.get('type') or alert.get('event_type', 'alert'),
                    'severity': alert.get('severity', 'medium'),
                    'title': alert.get('title', 'Alert'),
                    'description': alert.get('description'),
                    'metadata': alert.get('metadata', {}),
                }
                await state.db.create_alert(alert_data)
            
            for event in results.get('events', []):
                event_data = {
                    'camera_id': camera_id,
                    'type': event.get('type') or event.get('event_type', 'event'),
                    'severity': event.get('severity', 'info'),
                    'metadata': event,
                }
                await state.db.create_event(event_data)

    camera_service.register_processor(ai_processor)

    # Initialize Sync Service
    sync_service = SyncService(state.db)
    state.sync_service = sync_service

    # Start sync service
    asyncio.create_task(sync_service.run())

    # Enable AI modules based on license
    if state.license_data:
        enabled_modules = state.license_data.get('modules', [])
        if enabled_modules:
            ai_manager.enable_modules(enabled_modules)
            logger.info(f"Enabled AI modules: {', '.join(enabled_modules)}")

    logger.info("Services started")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info("=" * 60)

    connected = await initialize_database()

    licensed = await validate_license()

    if licensed and connected:
        registered = await register_server()

        if registered:
            await start_services()
            logger.info("Server is FULLY OPERATIONAL")
        else:
            logger.warning("Server registration failed")
    elif licensed and not connected:
        await start_services()
        logger.warning("Running OFFLINE using cached license - cloud features paused")
    else:
        logger.warning("Running in SETUP MODE - visit /setup")

    logger.info("=" * 60)
    logger.info(f"API: http://{settings.SERVER_HOST}:{settings.SERVER_PORT}")
    logger.info(f"Setup: http://{settings.SERVER_HOST}:{settings.SERVER_PORT}/setup")
    logger.info("=" * 60)

    yield

    logger.info("Shutting down...")
    
    # Cleanup services
    if state.camera_service:
        await state.camera_service.stop()
    
    if state.ai_manager:
        state.ai_manager.cleanup()
    
    if state.sync_service:
        await state.sync_service.stop()
    
    if state.db:
        await state.db.disconnect()
    
    logger.info("Shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import routes, setup
app.include_router(setup.router)
app.include_router(routes.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "connected": state.is_connected,
        "licensed": state.is_licensed,
        "server_id": state.server_id
    }


@app.get("/health")
async def health():
    return {
        "healthy": state.is_connected and state.is_licensed,
        "connected": state.is_connected,
        "licensed": state.is_licensed,
        "server_id": state.server_id
    }


def main():
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=settings.DEBUG,
        log_level="warning"
    )


if __name__ == "__main__":
    if platform.system() == "Windows" and len(sys.argv) > 1:
        cmd = sys.argv[1].lower()
        if cmd in ("install", "remove", "start", "stop"):
            try:
                from app.service.windows import handle_service_command
                handle_service_command(cmd)
            except ImportError as e:
                print(f"Error: {e}")
                print("Install pywin32: pip install pywin32")
                sys.exit(1)
        else:
            main()
    else:
        main()
