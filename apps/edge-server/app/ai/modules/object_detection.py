"""
Object Detection Module
General purpose object detection
"""
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime
from loguru import logger

from app.ai.base import BaseAIModule
from config.settings import settings


class ObjectDetectionModule(BaseAIModule):
    """
    Object Detection AI Module
    General purpose object detection (COCO classes)
    """
    
    def __init__(self, confidence_threshold: float = 0.5):
        super().__init__(
            module_id="object",
            module_name="Object Detection",
            confidence_threshold=confidence_threshold
        )
        self.target_classes = ['person', 'car', 'truck', 'bus', 'motorcycle', 'bicycle', 'bag', 'backpack']
        self._model = None

    def initialize(self) -> bool:
        """Initialize object detection model"""
        try:
            from ultralytics import YOLO
            
            # Load YOLOv8 model
            try:
                self._model = YOLO('yolov8n.pt')  # nano model
                logger.info("Object Detection module initialized with YOLOv8")
            except Exception as e:
                logger.warning(f"Could not load YOLOv8 model: {e}")
                self._model = None
            
            # COCO class names (YOLOv8 uses COCO dataset)
            self._class_names = [
                'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck',
                'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench',
                'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra',
                'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
                'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove',
                'skateboard', 'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup',
                'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange',
                'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
                'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
                'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
                'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier',
                'toothbrush'
            ]
            
            self._initialized = True
            return True
        except ImportError:
            logger.warning("ultralytics not installed. Install with: pip install ultralytics")
            self._initialized = False
            return False
        except Exception as e:
            logger.error(f"Failed to initialize Object Detection: {e}")
            return False

    def process_frame(
        self,
        frame: np.ndarray,
        camera_id: str,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Process frame for object detection"""
        if not self.is_enabled():
            return {'detections': [], 'events': [], 'alerts': []}

        results = {
            'detections': [],
            'events': [],
            'alerts': [],
        }

        try:
            # TODO: Implement object detection
            # 1. Detect objects in frame using YOLOv8
            # 2. Filter by target classes
            # 3. Filter by confidence threshold
            # 4. Generate detections and events
            
            detections = self._detect_objects(frame)
            
            for obj in detections:
                if obj.get('confidence', 0) > self.confidence_threshold:
                    class_name = obj.get('class')
                    
                    # Only process target classes
                    if class_name not in self.target_classes:
                        continue
                    
                    detection = {
                        'type': 'object',
                        'camera_id': camera_id,
                        'timestamp': datetime.utcnow().isoformat(),
                        'bbox': obj.get('bbox'),
                        'confidence': obj.get('confidence', 0.0),
                        'class': class_name,
                        'class_id': obj.get('class_id'),
                    }
                    results['detections'].append(detection)
                    
                    # Create event for important objects
                    if class_name in ['bag', 'backpack']:
                        results['events'].append({
                            'type': 'object_detected',
                            'camera_id': camera_id,
                            'object_class': class_name,
                            'confidence': obj.get('confidence'),
                            'timestamp': datetime.utcnow().isoformat(),
                        })

        except Exception as e:
            logger.error(f"Error processing frame in Object Detection: {e}")

        return results

    def _detect_objects(self, frame: np.ndarray) -> List[Dict]:
        """Detect objects in frame using YOLOv8"""
        if not self._model:
            return []
        
        try:
            results = self._model(frame, conf=self.confidence_threshold, verbose=False)
            
            detections = []
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0].cpu().numpy())
                    class_id = int(box.cls[0].cpu().numpy())
                    class_name = self._class_names[class_id] if class_id < len(self._class_names) else f'class_{class_id}'
                    
                    detections.append({
                        'bbox': [int(x1), int(y1), int(x2 - x1), int(y2 - y1)],
                        'confidence': confidence,
                        'class': class_name,
                        'class_id': class_id
                    })
            
            return detections
        except Exception as e:
            logger.error(f"Error detecting objects: {e}")
            return []

