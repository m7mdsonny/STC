"""
Fire Detection Module
Detects fire and smoke in video frames
"""
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime
from loguru import logger

from app.ai.base import BaseAIModule
from config.settings import settings


class FireDetectionModule(BaseAIModule):
    """
    Fire Detection AI Module
    Detects fire and smoke using computer vision
    """
    
    def __init__(self, confidence_threshold: float = 0.7):
        super().__init__(
            module_id="fire",
            module_name="Fire Detection",
            confidence_threshold=confidence_threshold
        )
        self._model = None

    def initialize(self) -> bool:
        """Initialize fire detection model"""
        try:
            from ultralytics import YOLO
            import cv2
            
            # Try to load custom fire detection model
            # If not available, use YOLOv8 with custom training or color-based detection
            try:
                # Try custom model first
                self._model = YOLO('fire_detection.pt')  # Custom trained model
                logger.info("Fire Detection module initialized with custom model")
            except:
                # Fallback to YOLOv8 for general object detection
                try:
                    self._model = YOLO('yolov8n.pt')
                    logger.info("Fire Detection module initialized with YOLOv8 (general detection)")
                except:
                    self._model = None
                    logger.warning("No YOLOv8 model available, using color-based detection")
            
            self._cv2 = cv2
            self._initialized = True
            return True
        except ImportError:
            logger.warning("ultralytics not installed. Using color-based fire detection only")
            import cv2
            self._cv2 = cv2
            self._model = None
            self._initialized = True
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Fire Detection: {e}")
            return False

    def process_frame(
        self,
        frame: np.ndarray,
        camera_id: str,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Process frame for fire detection"""
        if not self.is_enabled():
            return {'detections': [], 'events': [], 'alerts': []}

        results = {
            'detections': [],
            'events': [],
            'alerts': [],
        }

        try:
            # TODO: Implement fire detection
            # 1. Detect fire regions in frame
            # 2. Detect smoke regions
            # 3. Calculate confidence scores
            # 4. Generate alerts for high-confidence detections
            
            fire_detections = self._detect_fire(frame)
            smoke_detections = self._detect_smoke(frame)
            
            for fire in fire_detections:
                if fire.get('confidence', 0) > self.confidence_threshold:
                    detection = {
                        'type': 'fire',
                        'camera_id': camera_id,
                        'timestamp': datetime.utcnow().isoformat(),
                        'bbox': fire.get('bbox'),
                        'confidence': fire.get('confidence', 0.0),
                    }
                    results['detections'].append(detection)
                    
                    # Create critical alert
                    results['alerts'].append({
                        'type': 'fire_detected',
                        'camera_id': camera_id,
                        'severity': 'critical',
                        'title': 'Fire Detected!',
                        'description': f'Fire detected in camera {camera_id}',
                        'timestamp': datetime.utcnow().isoformat(),
                        'metadata': {
                            'bbox': fire.get('bbox'),
                            'confidence': fire.get('confidence'),
                        }
                    })
                    
                    results['events'].append({
                        'type': 'fire_detected',
                        'camera_id': camera_id,
                        'confidence': fire.get('confidence'),
                        'timestamp': datetime.utcnow().isoformat(),
                    })
            
            for smoke in smoke_detections:
                if smoke.get('confidence', 0) > self.confidence_threshold:
                    detection = {
                        'type': 'smoke',
                        'camera_id': camera_id,
                        'timestamp': datetime.utcnow().isoformat(),
                        'bbox': smoke.get('bbox'),
                        'confidence': smoke.get('confidence', 0.0),
                    }
                    results['detections'].append(detection)
                    
                    # Create high severity alert
                    results['alerts'].append({
                        'type': 'smoke_detected',
                        'camera_id': camera_id,
                        'severity': 'high',
                        'title': 'Smoke Detected',
                        'description': f'Smoke detected in camera {camera_id}',
                        'timestamp': datetime.utcnow().isoformat(),
                        'metadata': {
                            'bbox': smoke.get('bbox'),
                            'confidence': smoke.get('confidence'),
                        }
                    })

        except Exception as e:
            logger.error(f"Error processing frame in Fire Detection: {e}")

        return results

    def _detect_fire(self, frame: np.ndarray) -> List[Dict]:
        """Detect fire in frame"""
        if self._model:
            # Use YOLOv8 model if available
            try:
                results = self._model(frame, conf=self.confidence_threshold, verbose=False)
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
                logger.error(f"Error in model-based fire detection: {e}")
        
        # Fallback to color-based detection
        return self._detect_fire_color(frame)

    def _detect_smoke(self, frame: np.ndarray) -> List[Dict]:
        """Detect smoke in frame"""
        # Use color-based detection for smoke
        return self._detect_smoke_color(frame)

    def _detect_fire_color(self, frame: np.ndarray) -> List[Dict]:
        """Color-based fire detection (fallback)"""
        try:
            # Convert to HSV
            hsv = self._cv2.cvtColor(frame, self._cv2.COLOR_BGR2HSV)
            
            # Fire color range (red/orange/yellow)
            lower_fire = np.array([0, 50, 50])
            upper_fire = np.array([35, 255, 255])
            
            mask = self._cv2.inRange(hsv, lower_fire, upper_fire)
            
            # Find contours
            contours, _ = self._cv2.findContours(mask, self._cv2.RETR_EXTERNAL, self._cv2.CHAIN_APPROX_SIMPLE)
            
            detections = []
            for contour in contours:
                area = self._cv2.contourArea(contour)
                if area > 500:  # Minimum fire area
                    x, y, w, h = self._cv2.boundingRect(contour)
                    # Estimate confidence based on area and color intensity
                    confidence = min(0.9, 0.5 + (area / 10000))
                    detections.append({
                        'bbox': [x, y, w, h],
                        'confidence': confidence
                    })
            
            return detections
        except Exception as e:
            logger.error(f"Error in color-based fire detection: {e}")
            return []

    def _detect_smoke_color(self, frame: np.ndarray) -> List[Dict]:
        """Color-based smoke detection"""
        try:
            # Convert to grayscale
            gray = self._cv2.cvtColor(frame, self._cv2.COLOR_BGR2GRAY)
            
            # Smoke appears as gray/white regions with specific texture
            # Use threshold and morphology
            _, thresh = self._cv2.threshold(gray, 200, 255, self._cv2.THRESH_BINARY)
            
            # Morphological operations to find smoke-like regions
            kernel = np.ones((5, 5), np.uint8)
            thresh = self._cv2.morphologyEx(thresh, self._cv2.MORPH_CLOSE, kernel)
            
            contours, _ = self._cv2.findContours(thresh, self._cv2.RETR_EXTERNAL, self._cv2.CHAIN_APPROX_SIMPLE)
            
            detections = []
            for contour in contours:
                area = self._cv2.contourArea(contour)
                if area > 1000:  # Minimum smoke area
                    x, y, w, h = self._cv2.boundingRect(contour)
                    confidence = min(0.8, 0.4 + (area / 20000))
                    detections.append({
                        'bbox': [x, y, w, h],
                        'confidence': confidence
                    })
            
            return detections
        except Exception as e:
            logger.error(f"Error in color-based smoke detection: {e}")
            return []

