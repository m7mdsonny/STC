"""
Command Listener Service
Listens for and executes commands from Cloud
"""
import asyncio
import subprocess
import sys
from typing import Dict, Any, Optional
from loguru import logger

from .cloud_client import CloudClient
from .status_service import StatusService
from .error_store import ErrorStore
from .camera_sync import CameraSyncService


class CommandListenerService:
    """Manages receiving and executing commands from Cloud"""
    
    def __init__(
        self,
        cloud_client: CloudClient,
        status_service: StatusService,
        error_store: ErrorStore,
        camera_sync: CameraSyncService
    ):
        self.cloud_client = cloud_client
        self.status_service = status_service
        self.error_store = error_store
        self.camera_sync = camera_sync
        self._running = False
        self._task: Optional[asyncio.Task] = None
    
    async def start(self):
        """Start command listener service"""
        if self._running:
            return
        
        self._running = True
        self._task = asyncio.create_task(self._listener_loop())
        logger.info("Command listener service started")
    
    async def stop(self):
        """Stop command listener service"""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Command listener service stopped")
    
    async def _listener_loop(self):
        """Main command listener loop"""
        # Note: In a real implementation, this would poll Cloud API for commands
        # or use WebSocket/SSE for real-time command delivery
        # For now, commands are handled via HTTP endpoints (see main.py)
        while self._running:
            await asyncio.sleep(60)  # Poll every minute
    
    async def execute_restart(self) -> Dict[str, Any]:
        """
        Execute restart command
        
        Returns:
            Result dictionary
        """
        try:
            logger.info("Restart command received")
            
            # Update status
            self.status_service.update_last_command({
                "command": "restart",
                "status": "executing"
            })
            
            # Schedule restart (give time for response)
            asyncio.create_task(self._schedule_restart())
            
            return {
                "success": True,
                "message": "Restart scheduled"
            }
        
        except Exception as e:
            self.error_store.add_error("command", f"Restart command error: {e}", e)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _schedule_restart(self):
        """Schedule restart after delay"""
        await asyncio.sleep(2)  # Give time for HTTP response
        
        # Restart by stopping and letting service manager restart it
        logger.info("Restarting Edge Server...")
        sys.exit(0)  # Service manager will restart
    
    async def execute_sync_config(self) -> Dict[str, Any]:
        """
        Execute sync-config command
        
        Returns:
            Result dictionary
        """
        try:
            logger.info("Sync config command received")
            
            # Update status
            self.status_service.update_last_command({
                "command": "sync-config",
                "status": "executing"
            })
            
            # Sync cameras
            success = await self.camera_sync.sync_cameras()
            
            if success:
                self.status_service.update_last_command({
                    "command": "sync-config",
                    "status": "completed"
                })
                return {
                    "success": True,
                    "message": "Configuration synced successfully"
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to sync cameras"
                }
        
        except Exception as e:
            self.error_store.add_error("command", f"Sync config command error: {e}", e)
            return {
                "success": False,
                "error": str(e)
            }
