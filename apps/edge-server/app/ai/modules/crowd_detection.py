"""
Crowd Detection Module
Detects and analyzes crowd density
"""
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime
from loguru import logger

from app.ai.base import BaseAIModule
from config.settings import settings


class CrowdDetectionModule(BaseAIModule):
    """
    Crowd Detection AI Module
    Detects crowd density and generates alerts for overcrowding
    """
    
    def __init__(self, confidence_threshold: float = 0.5):
        super().__init__(
            module_id="crowd",
            module_name="Crowd Detection",
            confidence_threshold=confidence_threshold
        )
        self.density_threshold = 0.7  # Alert if density > 70%
        self.count_threshold = 10  # Alert if count > 10 people
        self._model = None

    def initialize(self) -> bool:
        """Initialize crowd detection"""
        try:
            from ultralytics import YOLO
            
            try:
                self._model = YOLO('yolov8n.pt')
                logger.info("Crowd Detection module initialized with YOLOv8")
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
            logger.error(f"Failed to initialize Crowd Detection: {e}")
            return False

    def process_frame(
        self,
        frame: np.ndarray,
        camera_id: str,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Process frame for crowd detection"""
        if not self.is_enabled():
            return {'detections': [], 'events': [], 'alerts': []}

        results = {
            'detections': [],
            'events': [],
            'alerts': [],
        }

        try:
            # TODO: Implement crowd detection
            # 1. Detect all people in frame
            # 2. Calculate density (people per area)
            # 3. Count total people
            # 4. Generate alerts if thresholds exceeded
            
            people = self._detect_people(frame)
            frame_area = frame.shape[0] * frame.shape[1]
            
            # Calculate density
            person_count = len(people)
            density = person_count / (frame_area / 10000) if frame_area > 0 else 0  # People per 10k pixels
            
            detection = {
                'type': 'crowd',
                'camera_id': camera_id,
                'timestamp': datetime.utcnow().isoformat(),
                'person_count': person_count,
                'density': density,
            }
            results['detections'].append(detection)
            
            # Check thresholds
            if person_count > self.count_threshold or density > self.density_threshold:
                # Create alert
                results['alerts'].append({
                    'type': 'crowd',
                    'camera_id': camera_id,
                    'severity': 'high' if person_count > self.count_threshold * 2 else 'medium',
                    'title': 'Crowd Detected',
                    'description': f'Crowd detected: {person_count} people (density: {density:.2f})',
                    'timestamp': datetime.utcnow().isoformat(),
                    'metadata': {
                        'person_count': person_count,
                        'density': density,
                    }
                })
                
                results['events'].append({
                    'type': 'crowd',
                    'camera_id': camera_id,
                    'person_count': person_count,
                    'density': density,
                    'timestamp': datetime.utcnow().isoformat(),
                })

        except Exception as e:
            logger.error(f"Error processing frame in Crowd Detection: {e}")

        return results

    def _detect_people(self, frame: np.ndarray) -> List[Dict]:
        """Detect people in frame using YOLOv8"""
        if not self._model:
            return []
        
        try:
            # Person class ID is 0
            results = self._model(frame, classes=[0], conf=self.confidence_threshold, verbose=False)
            
            detections = []
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0].cpu().numpy())
                    
                    detections.append({
                        'bbox': [int(x1), int(y1), int(x2 - x1), int(y2 - y1)],
                        'confidence': confidence
                    })
            
            return detections
        except Exception as e:
            logger.error(f"Error detecting people: {e}")
            return []

