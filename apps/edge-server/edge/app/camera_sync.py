"""
Camera Sync Service
Syncs cameras from Cloud and maintains local cache
"""
import sqlite3
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional
from loguru import logger

from .config_store import ConfigStore
from .cloud_client import CloudClient
from .status_service import StatusService
from .error_store import ErrorStore


class CameraSyncService:
    """Manages camera synchronization from Cloud"""
    
    def __init__(
        self,
        config: ConfigStore,
        cloud_client: CloudClient,
        status_service: StatusService,
        error_store: ErrorStore,
        data_dir: Optional[Path] = None
    ):
        self.config = config
        self.cloud_client = cloud_client
        self.status_service = status_service
        self.error_store = error_store
        
        if data_dir is None:
            self.data_dir = Path(__file__).parent.parent.parent / "data"
        else:
            self.data_dir = Path(data_dir)
        
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.db_file = self.data_dir / "edge.db"
        self._init_database()
    
    def _init_database(self):
        """Initialize SQLite database"""
        try:
            conn = sqlite3.connect(self.db_file)
            cursor = conn.cursor()
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS cameras (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    camera_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    rtsp_url TEXT,
                    location TEXT,
                    status TEXT,
                    config TEXT,
                    synced_at TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
            conn.close()
            logger.info(f"Camera database initialized: {self.db_file}")
        except Exception as e:
            self.error_store.add_error("camera_sync", f"Failed to initialize database: {e}", e)
    
    async def sync_cameras(self) -> bool:
        """
        Sync cameras from Cloud
        
        Returns:
            True if successful
        """
        try:
            # Get cameras from Cloud
            success, cameras = await self.cloud_client.get_cameras()
            
            if not success:
                self.error_store.add_error("camera_sync", "Failed to fetch cameras from Cloud")
                return False
            
            # Update local database
            conn = sqlite3.connect(self.db_file)
            cursor = conn.cursor()
            
            # Clear existing cameras
            cursor.execute("DELETE FROM cameras")
            
            # Insert new cameras
            import json
            from datetime import datetime
            
            for camera in cameras:
                cursor.execute("""
                    INSERT OR REPLACE INTO cameras 
                    (camera_id, name, rtsp_url, location, status, config, synced_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    camera.get("camera_id"),
                    camera.get("name"),
                    camera.get("rtsp_url"),
                    camera.get("location"),
                    camera.get("status", "offline"),
                    json.dumps(camera.get("config", {})),
                    datetime.utcnow().isoformat()
                ))
            
            conn.commit()
            conn.close()
            
            # Update status
            self.status_service.update_cameras_synced(len(cameras))
            
            logger.info(f"Synced {len(cameras)} cameras from Cloud")
            return True
        
        except Exception as e:
            self.error_store.add_error("camera_sync", f"Camera sync error: {e}", e)
            return False
    
    def get_cameras(self) -> List[Dict[str, Any]]:
        """Get cameras from local database"""
        try:
            conn = sqlite3.connect(self.db_file)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM cameras ORDER BY name")
            rows = cursor.fetchall()
            
            cameras = []
            import json
            for row in rows:
                camera = dict(row)
                if camera.get("config"):
                    camera["config"] = json.loads(camera["config"])
                cameras.append(camera)
            
            conn.close()
            return cameras
        
        except Exception as e:
            self.error_store.add_error("camera_sync", f"Failed to get cameras: {e}", e)
            return []
