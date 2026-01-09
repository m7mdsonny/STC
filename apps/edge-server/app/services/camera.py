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
        try:
            if stream.capture:
                stream.capture.release()

            capture = cv2.VideoCapture(stream.rtsp_url)

            if not capture.isOpened():
                logger.warning(f"Failed to connect: {stream.name}")
                return False

            capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)

            stream.capture = capture
            stream.is_active = True
            stream.error_count = 0

            logger.info(f"Connected to camera: {stream.name}")
            return True

        except Exception as e:
            logger.error(f"Camera connection error: {e}")
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
        stream = self.cameras.get(camera_id)
        if not stream:
            return

        connected = await asyncio.get_event_loop().run_in_executor(
            self._executor,
            self._connect_camera,
            stream
        )

        if not connected:
            return

        while self._running and stream.is_active:
            try:
                frame = await asyncio.get_event_loop().run_in_executor(
                    self._executor,
                    self._read_frame,
                    stream
                )

                if frame is not None:
                    for processor in self.processors:
                        try:
                            # Processor should be async: async def processor(camera_id, frame, enabled_modules)
                            if asyncio.iscoroutinefunction(processor):
                                await processor(camera_id, frame, stream.enabled_modules)
                            else:
                                # Sync processor
                                await asyncio.get_event_loop().run_in_executor(
                                    self._executor,
                                    processor,
                                    camera_id,
                                    frame,
                                    stream.enabled_modules
                                )
                        except Exception as e:
                            logger.error(f"Processor error: {e}")

                await asyncio.sleep(self._frame_interval)

            except Exception as e:
                logger.error(f"Processing error: {e}")
                await asyncio.sleep(1)

        if stream.capture:
            stream.capture.release()
            stream.capture = None

    def get_camera_status(self, camera_id: str) -> Optional[Dict]:
        stream = self.cameras.get(camera_id)
        if not stream:
            return None

        return {
            "id": stream.id,
            "name": stream.name,
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
