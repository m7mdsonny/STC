import asyncio
import cv2
import numpy as np
from typing import Dict, Optional, Callable, List, Any
from datetime import datetime
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
from loguru import logger

from config.settings import settings


@dataclass
class CameraStream:
    id: str
    name: str
    rtsp_url: str
    enabled_modules: List[str]
    capture: Optional[cv2.VideoCapture] = None
    is_active: bool = False
    last_frame: Optional[np.ndarray] = None
    last_frame_time: Optional[datetime] = None
    error_count: int = 0


class CameraService:
    def __init__(self):
        self.cameras: Dict[str, CameraStream] = {}
        self.processors: List[Callable] = []
        self._running = False
        self._executor = ThreadPoolExecutor(max_workers=settings.MAX_CAMERAS)
        self._frame_interval = 1.0 / settings.PROCESSING_FPS

    def register_processor(self, processor: Callable):
        """Register async processor function: async def processor(camera_id, frame, enabled_modules)"""
        self.processors.append(processor)

    async def add_camera(self, camera_id: str, name: str, rtsp_url: str, modules: List[str] = None) -> bool:
        if camera_id in self.cameras:
            logger.warning(f"Camera {camera_id} already exists")
            return False

        if len(self.cameras) >= settings.MAX_CAMERAS:
            logger.warning("Maximum cameras reached")
            return False

        stream = CameraStream(
            id=camera_id,
            name=name,
            rtsp_url=rtsp_url,
            enabled_modules=modules or []
        )

        self.cameras[camera_id] = stream
        logger.info(f"Camera added: {name} ({camera_id})")

        if self._running:
            asyncio.create_task(self._process_camera(camera_id))

        return True

    async def remove_camera(self, camera_id: str) -> bool:
        if camera_id not in self.cameras:
            return False

        stream = self.cameras[camera_id]
        stream.is_active = False

        if stream.capture:
            stream.capture.release()

        del self.cameras[camera_id]
        logger.info(f"Camera removed: {camera_id}")
        return True

    async def start(self):
        self._running = True
        logger.info("Camera service started")

        for camera_id in list(self.cameras.keys()):
            asyncio.create_task(self._process_camera(camera_id))

    async def stop(self):
        self._running = False

        for stream in self.cameras.values():
            stream.is_active = False
            if stream.capture:
                stream.capture.release()

        logger.info("Camera service stopped")

    def _connect_camera(self, stream: CameraStream) -> bool:
        """
        Connect to camera RTSP stream with real validation
        
        Returns True only if:
        - RTSP URL is valid
        - Connection is established
        - At least one frame can be read (proves stream is active)
        """
        try:
            if stream.capture:
                stream.capture.release()
                stream.capture = None

            # Validate RTSP URL format
            if not stream.rtsp_url or not stream.rtsp_url.startswith('rtsp://'):
                logger.error(f"Invalid RTSP URL format: {stream.rtsp_url}")
                return False

            # Attempt connection with timeout
            capture = cv2.VideoCapture(stream.rtsp_url)
            capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            
            # Set connection timeout (5 seconds)
            capture.set(cv2.CAP_PROP_TIMEOUT, 5000)

            if not capture.isOpened():
                logger.warning(f"Failed to open RTSP stream: {stream.name} ({stream.rtsp_url})")
                return False

            # REAL VALIDATION: Try to read at least one frame to prove stream is active
            ret, frame = capture.read()
            if not ret or frame is None:
                logger.warning(f"RTSP stream opened but no frame received: {stream.name}")
                capture.release()
                return False

            # Connection successful - stream is real and active
            stream.capture = capture
            stream.is_active = True
            stream.error_count = 0
            stream.last_frame = frame
            stream.last_frame_time = datetime.utcnow()

            logger.info(f"Successfully connected to camera: {stream.name} (RTSP validated)")
            return True

        except Exception as e:
            logger.error(f"Camera connection error for {stream.name}: {e}")
            if stream.capture:
                stream.capture.release()
                stream.capture = None
            return False

    def _read_frame(self, stream: CameraStream) -> Optional[np.ndarray]:
        if not stream.capture or not stream.is_active:
            return None

        try:
            ret, frame = stream.capture.read()

            if not ret or frame is None:
                stream.error_count += 1
                if stream.error_count > 10:
                    stream.is_active = False
                return None

            stream.error_count = 0
            stream.last_frame = frame
            stream.last_frame_time = datetime.utcnow()

            return frame

        except Exception as e:
            logger.error(f"Frame read error: {e}")
            return None

    async def _process_camera(self, camera_id: str):
        """
        Process camera stream with auto-recovery
        
        Features:
        - Real RTSP connection validation
        - Automatic reconnection on failure (INFINITE RETRY - no manual intervention)
        - Exponential backoff for retries (capped at 60 seconds)
        - Zero human intervention required
        """
        stream = self.cameras.get(camera_id)
        if not stream:
            return

        retry_count = 0
        # CRITICAL: No max_retries - infinite retry for auto-recovery
        base_retry_delay = 5  # seconds
        max_retry_delay = 60  # Cap exponential backoff at 60 seconds

        while self._running:
            # Attempt connection
            connected = await asyncio.get_event_loop().run_in_executor(
                self._executor,
                self._connect_camera,
                stream
            )

            if not connected:
                retry_count += 1
                # CRITICAL: Infinite retry - never stop trying
                # Exponential backoff capped at max_retry_delay
                retry_delay = min(base_retry_delay * (2 ** (retry_count - 1)), max_retry_delay)
                logger.warning(f"Camera {camera_id} connection failed. Auto-recovering in {retry_delay}s (attempt {retry_count}, infinite retry enabled)")
                await asyncio.sleep(retry_delay)
                continue

            # Connection successful - reset retry count
            if retry_count > 0:
                logger.info(f"Camera {camera_id} reconnected successfully after {retry_count} attempts (auto-recovery)")
            retry_count = 0

            # Process frames
            consecutive_errors = 0
            max_consecutive_errors = 10

            while self._running and stream.is_active:
                try:
                    frame = await asyncio.get_event_loop().run_in_executor(
                        self._executor,
                        self._read_frame,
                        stream
                    )

                    if frame is not None:
                        consecutive_errors = 0
                        
                        # Process frame with all registered processors
                        for processor in self.processors:
                            try:
                                if asyncio.iscoroutinefunction(processor):
                                    await processor(camera_id, frame, stream.enabled_modules)
                                else:
                                    await asyncio.get_event_loop().run_in_executor(
                                        self._executor,
                                        processor,
                                        camera_id,
                                        frame,
                                        stream.enabled_modules
                                    )
                            except Exception as e:
                                logger.error(f"Processor error for camera {camera_id}: {e}")

                        await asyncio.sleep(self._frame_interval)
                    else:
                        consecutive_errors += 1
                        if consecutive_errors >= max_consecutive_errors:
                            logger.warning(f"Camera {camera_id}: Too many consecutive frame read errors. Reconnecting...")
                            stream.is_active = False
                            if stream.capture:
                                stream.capture.release()
                                stream.capture = None
                            break
                        await asyncio.sleep(1)

                except Exception as e:
                    logger.error(f"Processing error for camera {camera_id}: {e}")
                    consecutive_errors += 1
                    if consecutive_errors >= max_consecutive_errors:
                        logger.warning(f"Camera {camera_id}: Too many errors. Reconnecting...")
                        stream.is_active = False
                        if stream.capture:
                            stream.capture.release()
                            stream.capture = None
                        break
                    await asyncio.sleep(1)

            # Connection lost - will retry in outer loop
            if stream.capture:
                stream.capture.release()
                stream.capture = None
            logger.info(f"Camera {camera_id} disconnected. Will attempt reconnection...")
            await asyncio.sleep(base_retry_delay)

    def get_camera_status(self, camera_id: str) -> Optional[Dict]:
        """
        Get real-time camera status
        
        Status is based on:
        - Stream connection state (is_active)
        - Last frame received timestamp
        - Error count
        """
        stream = self.cameras.get(camera_id)
        if not stream:
            return None

        # Determine status based on real stream availability
        status = "offline"
        if stream.is_active and stream.capture and stream.capture.isOpened():
            if stream.last_frame_time:
                # Check if last frame was recent (within 30 seconds)
                time_since_last_frame = (datetime.utcnow() - stream.last_frame_time).total_seconds()
                if time_since_last_frame < 30:
                    status = "online"
                else:
                    status = "error"  # Stream open but no recent frames
            else:
                status = "error"  # Stream open but no frames received yet
        else:
            status = "offline"  # Stream not connected

        return {
            "camera_id": stream.id,  # Use camera_id for Cloud API compatibility
            "status": status,  # Real status based on stream availability
            "is_active": stream.is_active,
            "last_frame_time": stream.last_frame_time.isoformat() if stream.last_frame_time else None,
            "error_count": stream.error_count
        }

    def get_all_status(self) -> List[Dict]:
        return [self.get_camera_status(cid) for cid in self.cameras]

    def get_frame(self, camera_id: str) -> Optional[np.ndarray]:
        stream = self.cameras.get(camera_id)
        if stream and stream.last_frame is not None:
            return stream.last_frame.copy()
        return None

    def get_frame_jpeg(self, camera_id: str, quality: int = 80) -> Optional[bytes]:
        frame = self.get_frame(camera_id)
        if frame is None:
            return None

        try:
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
            return buffer.tobytes()
        except:
            return None
