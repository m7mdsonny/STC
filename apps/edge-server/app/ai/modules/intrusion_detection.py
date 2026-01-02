"""
Intrusion Detection Module
Detects unauthorized access to defined zones
"""
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime
from loguru import logger

from app.ai.base import BaseAIModule
from config.settings import settings


class IntrusionDetectionModule(BaseAIModule):
    """
    Intrusion Detection AI Module
    Detects unauthorized access to restricted zones
    """
    
    def __init__(self, confidence_threshold: float = 0.5):
        super().__init__(
            module_id="intrusion",
            module_name="Intrusion Detection",
            confidence_threshold=confidence_threshold
        )
        self.zones: Dict[str, List] = {}  # camera_id -> list of zones
        self._model = None

    def initialize(self) -> bool:
        """Initialize intrusion detection model"""
        try:
            from ultralytics import YOLO
            
            try:
                self._model = YOLO('yolov8n.pt')
                logger.info("Intrusion Detection module initialized with YOLOv8")
            except Exception as e:
                logger.warning(f"Could not load YOLOv8 model: {e}")
                self._model = None
            
            self._initialized = True
            return True
        except ImportError:
            logger.warning("ultralytics not installed. Install with: pip install ultralytics")
            self._initialized = False
            return False
        except Exception as e:
            logger.error(f"Failed to initialize Intrusion Detection: {e}")
            return False

    def process_frame(
        self,
        frame: np.ndarray,
        camera_id: str,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Process frame for intrusion detection"""
        if not self.is_enabled():
            return {'detections': [], 'events': [], 'alerts': []}

        # Update zones from metadata if provided
        if metadata and 'zones' in metadata:
            self.zones[camera_id] = metadata.get('zones', [])

        results = {
            'detections': [],
            'events': [],
            'alerts': [],
        }

        try:
            # TODO: Implement intrusion detection
            # 1. Detect objects/people in frame
            # 2. Check if they're in restricted zones
            # 3. Generate alerts for intrusions
            
            detections = self._detect_objects(frame)
            zones = self.zones.get(camera_id, [])
            
            for detection in detections:
                if detection.get('confidence', 0) > self.confidence_threshold:
                    # Check if detection is in restricted zone
                    in_restricted_zone = self._check_zone(detection, zones)
                    
                    if in_restricted_zone:
                        results['detections'].append({
                            'type': 'intrusion',
                            'camera_id': camera_id,
                            'timestamp': datetime.utcnow().isoformat(),
                            'bbox': detection.get('bbox'),
                            'confidence': detection.get('confidence', 0.0),
                            'zone': in_restricted_zone.get('name') if isinstance(in_restricted_zone, dict) else None,
                        })
                        
                        # Create alert
                        results['alerts'].append({
                            'type': 'intrusion',
                            'camera_id': camera_id,
                            'severity': 'high',
                            'title': 'Intrusion Detected',
                            'description': f'Unauthorized access detected in camera {camera_id}',
                            'timestamp': datetime.utcnow().isoformat(),
                            'metadata': {
                                'bbox': detection.get('bbox'),
                                'confidence': detection.get('confidence'),
                                'zone': in_restricted_zone.get('name') if isinstance(in_restricted_zone, dict) else None,
                            }
                        })
                        
                        results['events'].append({
                            'type': 'intrusion',
                            'camera_id': camera_id,
                            'zone': in_restricted_zone.get('name') if isinstance(in_restricted_zone, dict) else None,
                            'timestamp': datetime.utcnow().isoformat(),
                        })

        except Exception as e:
            logger.error(f"Error processing frame in Intrusion Detection: {e}")

        return results

    def _detect_objects(self, frame: np.ndarray) -> List[Dict]:
        """Detect objects/people in frame using YOLOv8"""
        if not self._model:
            return []
        
        try:
            # Detect people (class 0) and vehicles
            results = self._model(frame, classes=[0, 2, 3, 5, 7], conf=self.confidence_threshold, verbose=False)
            
            detections = []
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0].cpu().numpy())
                    
                    detections.append({
                        'bbox': [int(x1), int(y1), int(x2 - x1), int(y2 - y1)],
                        'confidence': confidence,
                        'center': (int((x1 + x2) / 2), int((y1 + y2) / 2))
                    })
            
            return detections
        except Exception as e:
            logger.error(f"Error detecting objects: {e}")
            return []

    def _check_zone(self, detection: Dict, zones: List[Dict]) -> Optional[Dict]:
        """Check if detection is in restricted zone"""
        # TODO: Implement zone checking logic
        # Check if bbox center or any point is within zone polygon
        return None

