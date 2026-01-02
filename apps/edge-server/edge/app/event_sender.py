"""
Event Sender Service
Sends events to Cloud in real-time
"""
import asyncio
from typing import Dict, Any, Optional
from loguru import logger

from .cloud_client import CloudClient
from .status_service import StatusService
from .error_store import ErrorStore


class EventSenderService:
    """Manages sending events to Cloud"""
    
    def __init__(
        self,
        cloud_client: CloudClient,
        status_service: StatusService,
        error_store: ErrorStore
    ):
        self.cloud_client = cloud_client
        self.status_service = status_service
        self.error_store = error_store
        self._queue: asyncio.Queue = asyncio.Queue()
        self._running = False
        self._task: Optional[asyncio.Task] = None
    
    async def start(self):
        """Start event sender service"""
        if self._running:
            return
        
        self._running = True
        self._task = asyncio.create_task(self._sender_loop())
        logger.info("Event sender service started")
    
    async def stop(self):
        """Stop event sender service"""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Event sender service stopped")
    
    async def send_event(self, event_data: Dict[str, Any]):
        """
        Queue an event to be sent
        
        Args:
            event_data: Event data dictionary
        """
        await self._queue.put(event_data)
    
    async def _sender_loop(self):
        """Main event sender loop"""
        while self._running:
            try:
                # Wait for event with timeout
                try:
                    event_data = await asyncio.wait_for(self._queue.get(), timeout=1.0)
                except asyncio.TimeoutError:
                    continue
                
                # Send event to Cloud
                success = await self.cloud_client.send_event(event_data)
                
                if success:
                    self.status_service.increment_events_sent()
                    logger.debug(f"Event sent: {event_data.get('type', 'unknown')}")
                else:
                    logger.warning(f"Failed to send event: {event_data.get('type', 'unknown')}")
                    # Re-queue event for retry (optional)
                    # await self._queue.put(event_data)
            
            except Exception as e:
                self.error_store.add_error("event_sender", f"Event sender error: {e}", e)
