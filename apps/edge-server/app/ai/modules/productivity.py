"""
Productivity Monitoring Module
Monitors productivity metrics and work patterns
"""
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime
from loguru import logger

from app.ai.base import BaseAIModule
from config.settings import settings


class ProductivityModule(BaseAIModule):
    """
    Productivity Monitoring AI Module
    Monitors work productivity, activity patterns, and operational efficiency
    """
    
    def __init__(self, confidence_threshold: float = 0.5):
        super().__init__(
            module_id="productivity",
            module_name="Productivity Monitoring",
            confidence_threshold=confidence_threshold
        )
        self.productivity_data: Dict[str, Dict] = {}  # camera_id -> productivity metrics
        self._model = None

    def initialize(self) -> bool:
        """Initialize productivity monitoring"""
        try:
            from ultralytics import YOLO
            
            try:
                self._model = YOLO('yolov8n.pt')
                logger.info("Productivity Monitoring module initialized with YOLOv8")
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
            logger.error(f"Failed to initialize Productivity Monitoring: {e}")
            return False

    def process_frame(
        self,
        frame: np.ndarray,
        camera_id: str,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Process frame for productivity monitoring"""
        if not self.is_enabled():
            return {'detections': [], 'events': [], 'alerts': [], 'module': 'productivity'}

        # Initialize productivity data for camera if not exists
        if camera_id not in self.productivity_data:
            self.productivity_data[camera_id] = {
                'activity_count': 0,
                'person_hours': 0,
                'efficiency_score': 0.0,
            }

        results = {
            'detections': [],
            'events': [],
            'alerts': [],
            'module': 'productivity',
        }

        try:
            # Detect people and activities
            people = self._detect_people(frame)
            activities = self._detect_activities(frame, people)
            
            # Calculate productivity metrics
            metrics = self._calculate_productivity(camera_id, people, activities)
            
            # Create detection for analytics
            detection = {
                'type': 'productivity',
                'camera_id': camera_id,
                'timestamp': datetime.utcnow().isoformat(),
                'people_count': len(people),
                'activities_count': len(activities),
                'metrics': metrics,
                'module': 'productivity',
            }
            results['detections'].append(detection)
            
            # Update productivity data
            self.productivity_data[camera_id]['activity_count'] += len(activities)
            self.productivity_data[camera_id]['person_hours'] += len(people) * (1.0 / 3600)  # per frame
            
            # Create productivity event
            results['events'].append({
                'type': 'productivity_update',
                'camera_id': camera_id,
                'people_count': len(people),
                'activities_count': len(activities),
                'efficiency_score': metrics.get('efficiency_score', 0.0),
                'timestamp': datetime.utcnow().isoformat(),
                'module': 'productivity',
                'metadata': {
                    'activity_rate': metrics.get('activity_rate', 0),
                    'utilization': metrics.get('utilization', 0)
                }
            })

        except Exception as e:
            logger.error(f"Error processing frame in Productivity Monitoring: {e}")

        return results

    def _detect_people(self, frame: np.ndarray) -> List[Dict]:
        """Detect people in frame"""
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
                        'confidence': confidence,
                        'center': (int((x1 + x2) / 2), int((y1 + y2) / 2))
                    })
            
            return detections
        except Exception as e:
            logger.error(f"Error detecting people: {e}")
            return []

    def _detect_activities(self, frame: np.ndarray, people: List[Dict]) -> List[Dict]:
        """Detect work activities (movement, interactions)"""
        activities = []
        
        # Simple activity detection based on people presence
        # In a full implementation, this would use pose estimation or activity recognition
        if people:
            activities.append({
                'type': 'active_work',
                'people_involved': len(people),
                'confidence': 0.7
            })
        
        return activities

    def _calculate_productivity(self, camera_id: str, people: List[Dict], activities: List[Dict]) -> Dict:
        """Calculate productivity metrics"""
        metrics = {
            'people_count': len(people),
            'activity_rate': len(activities),
            'utilization': 0.0,
            'efficiency_score': 0.0
        }
        
        if people:
            # Calculate utilization: activity rate per person
            metrics['utilization'] = len(activities) / len(people) if len(people) > 0 else 0
            
            # Calculate efficiency score (0-100)
            # Higher score with more activities and consistent presence
            activity_score = min(len(activities) * 20, 100)  # Max 100 for 5+ activities
            presence_score = min(len(people) * 10, 50)  # Max 50 for 5+ people
            metrics['efficiency_score'] = (activity_score + presence_score) / 1.5
        
        return metrics

    def get_productivity(self, camera_id: str) -> Dict:
        """Get productivity data for camera"""
        return self.productivity_data.get(camera_id, {
            'activity_count': 0,
            'person_hours': 0,
            'efficiency_score': 0.0,
        })
