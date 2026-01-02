"""
Heartbeat Service
Sends periodic heartbeats to Cloud
"""
import asyncio
import platform
import socket
from typing import Optional
from loguru import logger

from .config_store import ConfigStore
from .cloud_client import CloudClient
from .status_service import StatusService
from .error_store import ErrorStore


class HeartbeatService:
    """Manages periodic heartbeat to Cloud"""
    
    def __init__(
        self,
        config: ConfigStore,
        cloud_client: CloudClient,
        status_service: StatusService,
        error_store: ErrorStore,
        version: str = "1.0.0"
    ):
        self.config = config
        self.cloud_client = cloud_client
        self.status_service = status_service
        self.error_store = error_store
        self.version = version
        self._running = False
        self._task: Optional[asyncio.Task] = None
    
    async def start(self):
        """Start heartbeat service"""
        if self._running:
            return
        
        self._running = True
        self._task = asyncio.create_task(self._heartbeat_loop())
        logger.info("Heartbeat service started")
    
    async def stop(self):
        """Stop heartbeat service"""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Heartbeat service stopped")
    
    def _get_system_info(self) -> dict:
        """Get system information"""
        try:
            import psutil
            return {
                "hostname": socket.gethostname(),
                "os": platform.system(),
                "os_version": platform.release(),
                "cpu_count": psutil.cpu_count(),
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory_total": psutil.virtual_memory().total,
                "memory_used": psutil.virtual_memory().used,
                "memory_percent": psutil.virtual_memory().percent,
                "internal_ip": self._get_internal_ip(),
                "public_ip": None,  # Can be fetched from external service if needed
            }
        except Exception as e:
            logger.warning(f"Failed to get system info: {e}")
            return {
                "hostname": socket.gethostname(),
                "os": platform.system(),
            }
    
    def _get_internal_ip(self) -> Optional[str]:
        """Get internal IP address"""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return None
    
    async def _heartbeat_loop(self):
        """Main heartbeat loop"""
        interval = self.config.get("heartbeat_interval", 30)
        
        while self._running:
            try:
                # Check if setup is completed
                if not self.config.is_setup_completed():
                    await asyncio.sleep(interval)
                    continue
                
                # Get system info
                system_info = self._get_system_info()
                
                # Get cameras status (if available)
                cameras_status = []  # Will be populated by camera_sync service
                
                # Send heartbeat
                success = await self.cloud_client.send_heartbeat(
                    version=self.version,
                    online=True,
                    system_info=system_info,
                    cameras_status=cameras_status
                )
                
                # Update status
                self.status_service.update_heartbeat(success)
                
                if success:
                    logger.debug("Heartbeat sent successfully")
                else:
                    logger.warning("Heartbeat failed")
                
            except Exception as e:
                self.error_store.add_error("heartbeat", f"Heartbeat error: {e}", e)
                self.status_service.update_heartbeat(False)
            
            # Wait for next interval
            await asyncio.sleep(interval)
