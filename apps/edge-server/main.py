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

# CRITICAL: Wrap imports in try-except to prevent crashes when file is opened directly
try:
    from config.settings import settings
    from app.core.license import LocalLicenseStore
    
    settings.ensure_directories()
except Exception as e:
    # If running as script, print error; if importing, just warn
    if __name__ == "__main__":
        print(f"Error loading configuration: {e}")
        print("\nPress Enter to exit...")
        input()
        sys.exit(1)
    else:
        # Re-raise if importing from another module
        raise

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

    # CRITICAL: Check cached license first - avoid repeated online validation
    # Only validate online if cache is missing or expired
    if license_store.data and license_store.data.get('license_key') == settings.LICENSE_KEY:
        # Check if cached license is still valid (within grace or not expired)
        if license_store.is_within_grace(settings.LICENSE_KEY, state.hardware_id):
            state.license_data = license_store.data
            state.is_licensed = True
            logger.debug("Using cached license - skipping online validation")
            return True

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

    # Only validate online if cache check failed or license key changed
    logger.debug("Cache check failed - validating license online")
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
            logger.warning("AI manager not initialized - skipping frame processing")
            return
        
        # CRITICAL: Log if no modules enabled (common issue)
        if not enabled_modules:
            logger.debug(f"Camera {camera_id}: No enabled modules for AI processing")
        
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
        
        # Send alerts, events, and analytics to Cloud
        if state.db and state.is_connected:
            # Send alerts (critical events requiring attention)
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
            
            # Send events (general events for tracking)
            for event in results.get('events', []):
                event_data = {
                    'camera_id': camera_id,
                    'type': event.get('type') or event.get('event_type', 'event'),
                    'severity': event.get('severity', 'info'),
                    'metadata': event,
                }
                await state.db.create_event(event_data)
            
            # CRITICAL: Send analytics (detections and module activity) to Cloud
            # Analytics include all detections and module processing results for dashboard analytics
            detections = results.get('detections', [])
            module_activity = results.get('modules', {})
            
            # CRITICAL: Send analytics events for all modules in a single batch to prevent nonce collisions
            # Batch sending reduces requests from N (modules) to 1, eliminating nonce race conditions
            modules_processed = list(module_activity.keys()) if module_activity else []
            
            # CRITICAL: Collect all analytics events and send in batch
            analytics_events = []
            
            # If no modules_processed but we have enabled_modules, send analytics for enabled modules anyway
            if not modules_processed and enabled_modules:
                # Collect analytics for each enabled module even if no detections
                for module_id in enabled_modules:
                    module_detections = [d for d in detections if d.get('module') == module_id]
                    
                    analytics_events.append({
                        'camera_id': camera_id,
                        'type': 'analytics',
                        'severity': 'info',
                        'module': module_id,  # CRITICAL: Set module in top-level so EventController extracts it to ai_module
                        'metadata': {
                            'detections': module_detections,
                            'module_activity': {},
                            'detection_count': len(module_detections),
                            'module': module_id,
                        },
                    })
            
            elif modules_processed:
                # Collect analytics for each processed module
                for module_id in modules_processed:
                    module_detections = [d for d in detections if d.get('module') == module_id]
                    module_data = module_activity.get(module_id, {})
                    
                    analytics_events.append({
                        'camera_id': camera_id,
                        'type': 'analytics',
                        'severity': 'info',
                        'module': module_id,  # CRITICAL: Set module in top-level so EventController extracts it to ai_module
                        'metadata': {
                            'detections': module_detections,
                            'module_activity': module_data,
                            'detection_count': len(module_detections),
                            'module': module_id,
                        },
                    })
            
            # CRITICAL: Send all analytics events in TRUE batch (single request = single nonce = zero collisions!)
            if analytics_events:
                # Use batch endpoint - all events in one request = one nonce = no race conditions!
                await state.db.submit_analytics_batch(analytics_events)
            elif detections:
                # Fallback: If no module_activity but we have detections, send aggregate analytics
                # CRITICAL: Extract module from first detection if available, otherwise use enabled_modules[0]
                first_module = None
                if detections:
                    first_module = detections[0].get('module')
                if not first_module and enabled_modules:
                    first_module = enabled_modules[0]
                
                if first_module:  # Only send if we have a module
                    analytics_data = {
                        'camera_id': camera_id,
                        'type': 'analytics',
                        'severity': 'info',
                        'module': first_module,  # CRITICAL: Set module on top level for EventController extraction
                        'metadata': {
                            'detections': detections,
                            'enabled_modules': enabled_modules,
                            'detection_count': len(detections),
                            'module': first_module,  # Also in metadata for consistency
                        },
                    }
                    await state.db.submit_analytics(analytics_data)
            
            # Log AI processing for debugging
            if detections or modules_processed:
                # Use debug level to reduce log noise (AI processing is normal operation)
                logger.debug(f"AI processing: Camera {camera_id} - {len(detections)} detections, {len(modules_processed)} modules: {modules_processed}")
            
            # CRITICAL: Log if analytics were sent (for debugging analytics tracking)
            analytics_sent = len(modules_processed) if modules_processed else (1 if detections else 0)
            if analytics_sent > 0:
                # Use debug level to reduce log noise (successful analytics are normal operation)
                logger.debug(f"Analytics sent: Camera {camera_id} - {analytics_sent} analytics event(s) sent to Cloud")

    camera_service.register_processor(ai_processor)

    # CRITICAL: Start camera service to enable camera processing
    # Without this, cameras added from sync won't start processing
    await camera_service.start()

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

    try:
        connected = await initialize_database()
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        import traceback
        logger.debug(traceback.format_exc())
        connected = False

    try:
        licensed = await validate_license()
    except Exception as e:
        logger.error(f"License validation failed: {e}")
        import traceback
        logger.debug(traceback.format_exc())
        licensed = False

    if licensed and connected:
        try:
            registered = await register_server()
        except Exception as e:
            logger.error(f"Server registration failed: {e}")
            import traceback
            logger.debug(traceback.format_exc())
            registered = False

        if registered:
            try:
                await start_services()
                logger.info("Server is FULLY OPERATIONAL")
            except Exception as e:
                logger.error(f"Failed to start services: {e}")
                import traceback
                logger.debug(traceback.format_exc())
                logger.warning("Server running with limited functionality")
        else:
            logger.warning("Server registration failed")
    elif licensed and not connected:
        try:
            await start_services()
            logger.warning("Running OFFLINE using cached license - cloud features paused")
        except Exception as e:
            logger.error(f"Failed to start services: {e}")
            import traceback
            logger.debug(traceback.format_exc())
    else:
        logger.warning("Running in SETUP MODE - visit /setup")

    logger.info("=" * 60)
    # Show localhost URL for user access (0.0.0.0 is correct for binding, but not for browser access)
    display_host = "localhost" if settings.SERVER_HOST == "0.0.0.0" else settings.SERVER_HOST
    logger.info(f"API: http://{display_host}:{settings.SERVER_PORT}")
    logger.info(f"Setup: http://{display_host}:{settings.SERVER_PORT}/setup")
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
    try:
        uvicorn.run(
            "main:app",
            host=settings.SERVER_HOST,
            port=settings.SERVER_PORT,
            reload=settings.DEBUG,
            log_level="warning"
        )
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"\n{'='*60}")
        print(f"Server error: {e}")
        print(f"{'='*60}")
        import traceback
        traceback.print_exc()
        print(f"\n{'='*60}")
        print("Press Enter to exit...")
        try:
            input()
        except (EOFError, KeyboardInterrupt):
            pass


if __name__ == "__main__":
    try:
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
    except KeyboardInterrupt:
        print("\nShutting down gracefully...")
        sys.exit(0)
    except Exception as e:
        print(f"\n{'='*60}")
        print(f"FATAL ERROR: {e}")
        print(f"{'='*60}")
        import traceback
        traceback.print_exc()
        print(f"\n{'='*60}")
        print("Press Enter to exit...")
        try:
            input()
        except (EOFError, KeyboardInterrupt):
            pass
        sys.exit(1)
