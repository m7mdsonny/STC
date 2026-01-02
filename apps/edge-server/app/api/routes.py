from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
import io

from config.settings import settings

router = APIRouter(tags=["API"])


class CameraConfig(BaseModel):
    id: str
    name: str
    rtsp_url: str
    enabled_modules: List[str] = []


class AlertCreate(BaseModel):
    camera_id: str
    module: str
    type: str
    severity: str
    title: str
    description: Optional[str] = None
    metadata: Optional[Dict] = None


class CommandRequest(BaseModel):
    command_id: Optional[int] = None
    command_type: str
    camera_id: Optional[str] = None
    module: Optional[str] = None
    parameters: Optional[Dict] = None
    image_reference: Optional[str] = None


@router.get("/status")
async def get_status(request: Request):
    from main import state

    return {
        "server": {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "uptime": "running"
        },
        "connection": {
            "cloud": state.is_connected,
            "licensed": state.is_licensed
        },
        "license": {
            "valid": state.is_licensed,
            "plan": state.license_data.get('plan') if state.license_data else None,
            "max_cameras": state.license_data.get('max_cameras') if state.license_data else 0,
            "modules": state.license_data.get('modules') if state.license_data else []
        },
        "cameras": {
            "active": len(state.cameras),
            "max": settings.MAX_CAMERAS
        }
    }


@router.get("/cameras")
async def list_cameras(request: Request):
    from main import state

    if not state.db or not state.is_licensed:
        raise HTTPException(status_code=503, detail="Server not ready")

    org_id = state.license_data.get('organization_id')
    if not org_id:
        return []

    cameras = await state.db.get_cameras(org_id)
    return cameras


@router.post("/cameras")
async def add_camera(camera: CameraConfig, request: Request):
    from main import state

    if len(state.cameras) >= settings.MAX_CAMERAS:
        raise HTTPException(status_code=400, detail="Maximum cameras reached")

    state.cameras[camera.id] = camera.dict()
    return {"success": True, "camera_id": camera.id}


@router.delete("/cameras/{camera_id}")
async def remove_camera(camera_id: str, request: Request):
    from main import state

    if camera_id not in state.cameras:
        raise HTTPException(status_code=404, detail="Camera not found")

    del state.cameras[camera_id]
    return {"success": True}


@router.get("/alerts")
async def list_alerts(request: Request, limit: int = 50):
    from main import state

    if not state.db or not state.is_licensed:
        raise HTTPException(status_code=503, detail="Server not ready")

    return {"alerts": [], "total": 0}


@router.post("/alerts")
async def create_alert(alert: AlertCreate, request: Request):
    from main import state

    if not state.db or not state.is_licensed:
        raise HTTPException(status_code=503, detail="Server not ready")

    org_id = state.license_data.get('organization_id')

    alert_data = {
        "organization_id": org_id,
        "edge_server_id": state.server_id,
        "camera_id": alert.camera_id,
        "module": alert.module,
        "type": alert.type,
        "severity": alert.severity,
        "title": alert.title,
        "description": alert.description,
        "metadata": alert.metadata or {},
        "status": "new"
    }

    success, alert_id = await state.db.create_alert(alert_data)

    if success:
        return {"success": True, "alert_id": alert_id}

    raise HTTPException(status_code=500, detail="Failed to create alert")


@router.get("/modules")
async def list_modules(request: Request):
    from main import state

    available_modules = [
        {"id": "face", "name": "Face Recognition", "description": "Detect and recognize faces"},
        {"id": "counter", "name": "People Counter", "description": "Count people entering/exiting"},
        {"id": "fire", "name": "Fire Detection", "description": "Detect fire and smoke"},
        {"id": "intrusion", "name": "Intrusion Detection", "description": "Detect unauthorized access"},
        {"id": "vehicle", "name": "Vehicle Recognition", "description": "Read license plates"},
        {"id": "attendance", "name": "Attendance", "description": "Track employee attendance"},
        {"id": "loitering", "name": "Loitering Detection", "description": "Detect people loitering"},
        {"id": "crowd", "name": "Crowd Detection", "description": "Detect and analyze crowd density"},
        {"id": "object", "name": "Object Detection", "description": "General purpose object detection"}
    ]

    licensed_modules = []
    if state.license_data:
        licensed_modules = state.license_data.get('modules', [])

    for module in available_modules:
        module['enabled'] = module['id'] in licensed_modules

    return available_modules


@router.get("/automation")
async def list_automation(request: Request):
    from main import state

    if not state.db or not state.is_licensed:
        return []

    org_id = state.license_data.get('organization_id')
    if not org_id:
        return []

    rules = await state.db.get_automation_rules(org_id)
    return rules


@router.get("/system/info")
async def system_info():
    import platform
    import psutil

    return {
        "os": platform.system(),
        "os_version": platform.release(),
        "python": platform.python_version(),
        "cpu_count": psutil.cpu_count(),
        "cpu_percent": psutil.cpu_percent(),
        "memory_total": psutil.virtual_memory().total,
        "memory_used": psutil.virtual_memory().used,
        "memory_percent": psutil.virtual_memory().percent,
        "disk_total": psutil.disk_usage('/').total,
        "disk_used": psutil.disk_usage('/').used,
        "disk_percent": psutil.disk_usage('/').percent
    }


# Pairing endpoints
@router.get("/pairing/info")
async def get_pairing_info(request: Request):
    """Get current pairing information"""
    from app.core.pairing import PairingManager
    
    manager = PairingManager()
    info = manager.get_pairing_info()
    
    return info


@router.post("/pairing/generate-token")
async def generate_pairing_token(request: Request):
    """Generate a one-time pairing token"""
    from app.core.pairing import PairingManager
    
    manager = PairingManager()
    token = manager.generate_pairing_token(expires_hours=24)
    
    return {
        "pairing_token": token,
        "expires_in_hours": 24,
        "message": "Copy this token and paste it in the Cloud platform to pair this Edge Server"
    }


@router.post("/pairing/generate-api-key")
async def generate_api_key(request: Request):
    """Generate a persistent API key for Cloud authentication"""
    from app.core.pairing import PairingManager
    
    manager = PairingManager()
    api_key = manager.generate_api_key()
    
    return {
        "api_key": api_key,
        "message": "Use this API key in Cloud API authentication"
    }


# AI Command execution
@router.post("/commands")
async def execute_command(command: CommandRequest, request: Request):
    """Execute AI command from Cloud"""
    from main import state
    from app.ai.manager import AIModuleManager
    from app.services.camera import CameraService
    
    if not state.is_licensed:
        raise HTTPException(status_code=403, detail="Server not licensed")
    
    try:
        # Get AI module manager
        ai_manager = getattr(state, 'ai_manager', None)
        if not ai_manager:
            ai_manager = AIModuleManager()
            state.ai_manager = ai_manager
        
        # Get camera service
        camera_service = getattr(state, 'camera_service', None)
        if not camera_service:
            camera_service = CameraService()
            state.camera_service = camera_service
        
        # Get frame from camera if camera_id provided
        frame = None
        if command.camera_id:
            frame = camera_service.get_frame(command.camera_id)
            if frame is None:
                raise HTTPException(status_code=404, detail=f"Camera {command.camera_id} not found or not active")
        
        # Execute command based on type
        result = {
            "command_id": command.command_id,
            "command_type": command.command_type,
            "status": "executed",
            "timestamp": datetime.utcnow().isoformat(),
            "result": {}
        }
        
        if command.command_type == "ai_inference" and frame is not None:
            # Process frame through AI modules
            enabled_modules = [command.module] if command.module else []
            ai_result = ai_manager.process_frame(
                frame=frame,
                camera_id=command.camera_id or "unknown",
                enabled_modules=enabled_modules,
                metadata=command.parameters or {}
            )
            result["result"] = ai_result
        
        # Acknowledge command to Cloud
        if command.command_id and state.db:
            await state.db.acknowledge_command(
                edge_id=state.server_id or state.hardware_id,
                command_id=command.command_id,
                status="executed",
                result=result["result"]
            )
        
        return result
        
    except Exception as e:
        from loguru import logger
        logger.error(f"Error executing command: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Snapshot endpoint
@router.get("/cameras/{camera_id}/snapshot")
async def get_snapshot(camera_id: str, request: Request):
    """Get camera snapshot"""
    from main import state
    from app.services.camera import CameraService
    
    camera_service = getattr(state, 'camera_service', None)
    if not camera_service:
        camera_service = CameraService()
        state.camera_service = camera_service
    
    frame_jpeg = camera_service.get_frame_jpeg(camera_id, quality=85)
    
    if frame_jpeg is None:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found or no frame available")
    
    return Response(
        content=frame_jpeg,
        media_type="image/jpeg",
        headers={
            "Content-Disposition": f"inline; filename=snapshot_{camera_id}.jpg"
        }
    )


# Stream endpoint
@router.get("/cameras/{camera_id}/stream")
async def get_stream(camera_id: str, request: Request):
    """Get camera stream URL"""
    from main import state
    
    if camera_id not in state.cameras:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")
    
    # Return HLS stream URL
    # In production, implement actual HLS streaming
    stream_url = f"http://{settings.SERVER_HOST}:{settings.SERVER_PORT}/streams/{camera_id}/playlist.m3u8"
    
    return {
        "stream_url": stream_url,
        "stream_type": "hls",
        "camera_id": camera_id
    }


# Health endpoint
@router.get("/health")
async def health_check():
    """Health check endpoint"""
    from main import state
    
    return {
        "healthy": state.is_connected and state.is_licensed,
        "connected": state.is_connected,
        "licensed": state.is_licensed,
        "server_id": state.server_id,
        "version": settings.APP_VERSION
    }
