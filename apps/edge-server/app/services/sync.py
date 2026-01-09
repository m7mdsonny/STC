import asyncio
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path
from loguru import logger

from config.settings import settings


class OfflineQueue:
    def __init__(self):
        self.queue_dir = Path(settings.offline_queue_dir)
        self.queue_dir.mkdir(parents=True, exist_ok=True)
        self.queue_file = self.queue_dir / "pending.json"
        self._queue: List[Dict] = []
        self._load()

    def _load(self):
        try:
            if self.queue_file.exists():
                with open(self.queue_file, 'r', encoding='utf-8') as f:
                    self._queue = json.load(f)
        except Exception as e:
            logger.warning(f"Could not load offline queue: {e}")
            self._queue = []

    def _save(self):
        try:
            with open(self.queue_file, 'w', encoding='utf-8') as f:
                json.dump(self._queue, f, default=str)
        except Exception as e:
            logger.warning(f"Could not save offline queue: {e}")

    def add(self, item_type: str, data: Dict):
        self._queue.append({
            "type": item_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        })
        self._save()

    def get_pending(self) -> List[Dict]:
        return self._queue.copy()

    def clear(self):
        self._queue = []
        self._save()

    def remove(self, count: int):
        self._queue = self._queue[count:]
        self._save()

    @property
    def size(self) -> int:
        return len(self._queue)


class SyncService:
    def __init__(self, db):
        self.db = db
        self.offline_queue = OfflineQueue()
        self._running = False
        self._last_sync = None
        self._last_heartbeat = None

        self.cached_faces: List[Dict] = []
        self.cached_vehicles: List[Dict] = []
        self.cached_rules: List[Dict] = []
        self.cached_cameras: List[Dict] = []

    async def run(self):
        self._running = True
        logger.info("Sync service started")

        while self._running:
            try:
                await self._heartbeat()
                await self._sync_pending()
                await self._sync_configuration()
                await self._poll_commands()
            except Exception as e:
                logger.error(f"Sync error: {e}")

            await asyncio.sleep(settings.SYNC_INTERVAL)

    async def stop(self):
        self._running = False
        logger.info("Sync service stopped")

    async def _heartbeat(self):
        from main import state

        if not state.edge_id and not state.server_id:
            return

        now = datetime.utcnow()

        if self._last_heartbeat:
            elapsed = (now - self._last_heartbeat).total_seconds()
            if elapsed < settings.HEARTBEAT_INTERVAL:
                return

        edge_id = state.edge_id or state.server_id or state.hardware_id
        system_info = self.db._get_system_info() if self.db else None

        success = await self.db.heartbeat(
            edge_id=edge_id,
            version=settings.APP_VERSION,
            system_info=system_info,
            organization_id=state.license_data.get('organization_id') if state.license_data else None,
            license_id=state.license_data.get('license_id') if state.license_data else None,
        )

        if success:
            self._last_heartbeat = now
            logger.debug("Heartbeat sent")
        else:
            logger.warning("Heartbeat failed")

    async def _sync_pending(self):
        if self.offline_queue.size == 0:
            return

        logger.info(f"Syncing {self.offline_queue.size} pending items")

        pending = self.offline_queue.get_pending()
        synced = 0

        for item in pending:
            try:
                item_type = item['type']
                data = item['data']

                if item_type == 'alert':
                    success, _ = await self.db.create_alert(data)
                elif item_type == 'event':
                    success = await self.db.create_event(data)
                elif item_type == 'attendance':
                    success = await self.db.log_attendance(data)
                else:
                    success = True

                if success:
                    synced += 1
                else:
                    break

            except Exception as e:
                logger.error(f"Failed to sync item: {e}")
                break

        if synced > 0:
            self.offline_queue.remove(synced)
            logger.info(f"Synced {synced} items")

    async def _sync_configuration(self):
        from main import state

        if not state.license_data:
            return

        org_id = state.license_data.get('organization_id')
        if not org_id:
            return

        try:
            self.cached_faces = await self.db.get_registered_faces(org_id)
            self.cached_vehicles = await self.db.get_registered_vehicles(org_id)
            self.cached_rules = await self.db.get_automation_rules(org_id)
            self.cached_cameras = await self.db.get_cameras(org_id)

            self._last_sync = datetime.utcnow()

            logger.debug(f"Synced: {len(self.cached_faces)} faces, "
                        f"{len(self.cached_vehicles)} vehicles, "
                        f"{len(self.cached_rules)} rules, "
                        f"{len(self.cached_cameras)} cameras")

        except Exception as e:
            logger.error(f"Configuration sync failed: {e}")

    async def _poll_commands(self):
        from main import state

        edge_id = state.edge_id or state.server_id
        if not edge_id:
            return

        try:
            commands = await self.db.fetch_pending_commands(edge_id)
        except Exception as exc:
            logger.error(f"Failed to fetch commands: {exc}")
            return

        if not commands:
            return

        for command in commands:
            cmd_id = command.get('id')
            cmd_type = command.get('command_type')
            payload = command.get('payload')
            logger.info(f"Received command {cmd_id}: {cmd_type}")

            # TODO: route command to integrations (Modbus/Arduino/GPIO)
            handled = True
            result: Dict[str, Any] = {
                "received_at": datetime.utcnow().isoformat(),
                "payload": payload,
                "note": "Command acknowledged by edge",
            }

            if handled and cmd_id:
                edge_id = state.edge_id or state.server_id
                await self.db.acknowledge_command(edge_id, cmd_id, status="acknowledged", result=result)

    def queue_alert(self, alert_data: Dict):
        self.offline_queue.add('alert', alert_data)

    def queue_event(self, event_data: Dict):
        self.offline_queue.add('event', event_data)

    def queue_attendance(self, attendance_data: Dict):
        self.offline_queue.add('attendance', attendance_data)

    def get_faces(self) -> List[Dict]:
        return self.cached_faces

    def get_vehicles(self) -> List[Dict]:
        return self.cached_vehicles

    def get_rules(self) -> List[Dict]:
        return self.cached_rules

    def get_cameras(self) -> List[Dict]:
        return self.cached_cameras
