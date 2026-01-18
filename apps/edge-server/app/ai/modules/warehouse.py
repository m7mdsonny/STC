"""
Warehouse Monitoring Module
Monitors warehouse activities and inventory management
"""
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime
from loguru import logger

from app.ai.base import BaseAIModule
from config.settings import settings


class WarehouseModule(BaseAIModule):
    """
    Warehouse Monitoring AI Module
    Monitors warehouse activities, inventory movements, and safety compliance
    """
    
    def __init__(self, confidence_threshold: float = 0.5):
        super().__init__(
            module_id="warehouse",
            module_name="Warehouse Monitoring",
            confidence_threshold=confidence_threshold
        )
        self.activity_log: Dict[str, List] = {}  # camera_id -> list of activities
        self._model = None

    def initialize(self) -> bool:
        """Initialize warehouse monitoring"""
        try:
            from ultralytics import YOLO
            
            try:
                self._model = YOLO('yolov8n.pt')
                logger.info("Warehouse Monitoring module initialized with YOLOv8")
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
            logger.error(f"Failed to initialize Warehouse Monitoring: {e}")
            return False

    def process_frame(
        self,
        frame: np.ndarray,
        camera_id: str,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Process frame for warehouse monitoring"""
        if not self.is_enabled():
            return {'detections': [], 'events': [], 'alerts': [], 'module': 'warehouse'}

        # Initialize activity log for camera if not exists
        if camera_id not in self.activity_log:
            self.activity_log[camera_id] = []

        results = {
            'detections': [],
            'events': [],
            'alerts': [],
            'module': 'warehouse',
        }

        try:
            # Detect objects in warehouse (forklifts, pallets, people, boxes)
            detections = self._detect_warehouse_objects(frame)
            
            # Analyze warehouse activities
            activities = self._analyze_activities(camera_id, detections, metadata)
            
            for detection in detections:
                detection.update({
                    'camera_id': camera_id,
                    'timestamp': datetime.utcnow().isoformat(),
                    'module': 'warehouse',
                })
                results['detections'].append(detection)
            
            # Create events for significant activities
            for activity in activities:
                results['events'].append({
                    'type': 'warehouse_activity',
                    'camera_id': camera_id,
                    'activity_type': activity.get('type'),
                    'description': activity.get('description'),
                    'timestamp': datetime.utcnow().isoformat(),
                    'module': 'warehouse',
                    'metadata': activity.get('metadata', {})
                })
                
                # Generate alerts for critical activities
                if activity.get('critical', False):
                    results['alerts'].append({
                        'type': 'warehouse_alert',
                        'camera_id': camera_id,
                        'severity': activity.get('severity', 'medium'),
                        'title': activity.get('title', 'Warehouse Activity Alert'),
                        'description': activity.get('description'),
                        'timestamp': datetime.utcnow().isoformat(),
                        'module': 'warehouse',
                        'metadata': activity.get('metadata', {})
                    })

        except Exception as e:
            logger.error(f"Error processing frame in Warehouse Monitoring: {e}")

        return results

    def _detect_warehouse_objects(self, frame: np.ndarray) -> List[Dict]:
        """Detect warehouse objects (forklifts, pallets, boxes, people)"""
        if not self._model:
            return []
        
        try:
            # Detect relevant objects: person (0), forklift/car (2, 3, 5, 7)
            # Person=0, Car=2, Motorcycle=3, Bus=5, Truck=7
            results = self._model(frame, classes=[0, 2, 3, 5, 7], conf=self.confidence_threshold, verbose=False)
            
            detections = []
            class_names = {0: 'person', 2: 'car', 3: 'motorcycle', 5: 'bus', 7: 'truck'}
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0].cpu().numpy())
                    class_id = int(box.cls[0].cpu().numpy())
                    class_name = class_names.get(class_id, 'unknown')
                    
                    detections.append({
                        'type': class_name,
                        'bbox': [int(x1), int(y1), int(x2 - x1), int(y2 - y1)],
                        'confidence': confidence,
                        'class_id': class_id
                    })
            
            return detections
        except Exception as e:
            logger.error(f"Error detecting warehouse objects: {e}")
            return []

    def _analyze_activities(self, camera_id: str, detections: List[Dict], metadata: Optional[Dict]) -> List[Dict]:
        """Analyze warehouse activities from detections"""
        activities = []
        
        # Count different object types
        person_count = sum(1 for d in detections if d.get('type') == 'person')
        vehicle_count = sum(1 for d in detections if d.get('type') in ['car', 'truck'])
        
        # Create activity for movement detection
        if person_count > 0 or vehicle_count > 0:
            activity = {
                'type': 'movement_detected',
                'description': f'Movement detected: {person_count} person(s), {vehicle_count} vehicle(s)',
                'critical': vehicle_count > 0,  # Vehicle movement is more critical
                'severity': 'high' if vehicle_count > 0 else 'medium',
                'title': 'Warehouse Movement Detected',
                'metadata': {
                    'person_count': person_count,
                    'vehicle_count': vehicle_count,
                    'total_objects': len(detections)
                }
            }
            activities.append(activity)
            self.activity_log[camera_id].append(activity)
        
        # Keep only recent activities (last 100)
        if len(self.activity_log[camera_id]) > 100:
            self.activity_log[camera_id] = self.activity_log[camera_id][-100:]
        
        return activities
