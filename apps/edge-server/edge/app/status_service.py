"""
Status Service
Tracks Edge Server status and metrics
"""
import psutil
import platform
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from loguru import logger


class StatusService:
    """Manages Edge Server status and metrics"""
    
    def __init__(self):
        self.start_time = datetime.utcnow()
        self.last_heartbeat: Optional[datetime] = None
        self.cloud_connected = False
        self.cameras_synced_count = 0
        self.events_sent_today = 0
        self.last_command: Optional[Dict[str, Any]] = None
        self.state = "Setup Required"  # Setup Required / Online / Offline / Degraded
    
    def update_heartbeat(self, success: bool):
        """Update heartbeat status"""
        if success:
            self.last_heartbeat = datetime.utcnow()
            self.cloud_connected = True
            if self.state == "Offline" or self.state == "Degraded":
                self.state = "Online"
        else:
            self.cloud_connected = False
            if self.state == "Online":
                self.state = "Degraded"
    
    def update_cameras_synced(self, count: int):
        """Update cameras synced count"""
        self.cameras_synced_count = count
    
    def increment_events_sent(self):
        """Increment events sent counter"""
        self.events_sent_today += 1
    
    def update_last_command(self, command: Dict[str, Any]):
        """Update last received command"""
        self.last_command = {
            **command,
            "received_at": datetime.utcnow().isoformat(),
        }
    
    def set_state(self, state: str):
        """Set Edge Server state"""
        valid_states = ["Setup Required", "Online", "Offline", "Degraded"]
        if state in valid_states:
            self.state = state
        else:
            logger.warning(f"Invalid state: {state}")
    
    def get_status(self) -> Dict[str, Any]:
        """Get current status for Status page"""
        # Calculate uptime
        uptime_seconds = (datetime.utcnow() - self.start_time).total_seconds()
        uptime_hours = int(uptime_seconds // 3600)
        uptime_minutes = int((uptime_seconds % 3600) // 60)
        
        # Get system metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        
        return {
            "edge_state": self.state,
            "last_heartbeat": self.last_heartbeat.isoformat() if self.last_heartbeat else None,
            "cloud_connectivity": "Connected" if self.cloud_connected else "Disconnected",
            "cameras_synced_count": self.cameras_synced_count,
            "events_sent_today": self.events_sent_today,
            "uptime": f"{uptime_hours}h {uptime_minutes}m",
            "cpu_usage": f"{cpu_percent:.1f}%",
            "ram_usage": f"{memory.percent:.1f}%",
            "ram_total_gb": f"{memory.total / (1024**3):.2f}",
            "ram_used_gb": f"{memory.used / (1024**3):.2f}",
            "last_command": self.last_command,
            "system_info": {
                "os": platform.system(),
                "os_version": platform.release(),
                "hostname": platform.node(),
            }
        }
