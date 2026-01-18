"""
Audience Analytics Module
Analyzes audience behavior and demographics
"""
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime
from loguru import logger

from app.ai.base import BaseAIModule
from config.settings import settings


class AudienceModule(BaseAIModule):
    """
    Audience Analytics AI Module
    Analyzes audience demographics, behavior patterns, and engagement metrics
    """
    
    def __init__(self, confidence_threshold: float = 0.5):
        super().__init__(
            module_id="audience",
            module_name="Audience Analytics",
            confidence_threshold=confidence_threshold
        )
        self.analytics_data: Dict[str, Dict] = {}  # camera_id -> analytics data
        self._model = None

    def initialize(self) -> bool:
        """Initialize audience analytics"""
        try:
            from ultralytics import YOLO
            
            try:
                self._model = YOLO('yolov8n.pt')
                logger.info("Audience Analytics module initialized with YOLOv8")
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
            logger.error(f"Failed to initialize Audience Analytics: {e}")
            return False

    def process_frame(
        self,
        frame: np.ndarray,
        camera_id: str,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Process frame for audience analytics"""
        if not self.is_enabled():
            return {'detections': [], 'events': [], 'alerts': [], 'module': 'audience'}

        # Initialize analytics data for camera if not exists
        if camera_id not in self.analytics_data:
            self.analytics_data[camera_id] = {
                'total_people': 0,
                'engagement_time': 0,
                'peak_hours': {},
            }

        results = {
            'detections': [],
            'events': [],
            'alerts': [],
            'module': 'audience',
        }

        try:
            # Detect people in audience
            people = self._detect_people(frame)
            
            # Calculate audience metrics
            metrics = self._calculate_metrics(camera_id, people, frame)
            
            # Create detection for analytics
            detection = {
                'type': 'audience',
                'camera_id': camera_id,
                'timestamp': datetime.utcnow().isoformat(),
                'people_count': len(people),
                'metrics': metrics,
                'module': 'audience',
            }
            results['detections'].append(detection)
            
            # Update analytics data
            self.analytics_data[camera_id]['total_people'] = max(
                self.analytics_data[camera_id]['total_people'],
                len(people)
            )
            
            # Create analytics event
            results['events'].append({
                'type': 'audience_analytics',
                'camera_id': camera_id,
                'people_count': len(people),
                'metrics': metrics,
                'timestamp': datetime.utcnow().isoformat(),
                'module': 'audience',
                'metadata': {
                    'density': metrics.get('density', 0),
                    'distribution': metrics.get('distribution', {})
                }
            })

        except Exception as e:
            logger.error(f"Error processing frame in Audience Analytics: {e}")

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
                        'confidence': confidence,
                        'center': (int((x1 + x2) / 2), int((y1 + y2) / 2))
                    })
            
            return detections
        except Exception as e:
            logger.error(f"Error detecting people: {e}")
            return []

    def _calculate_metrics(self, camera_id: str, people: List[Dict], frame: np.ndarray) -> Dict:
        """Calculate audience analytics metrics"""
        metrics = {
            'people_count': len(people),
            'density': 0.0,
            'distribution': {}
        }
        
        if not people:
            return metrics
        
        # Calculate density (people per area)
        frame_area = frame.shape[0] * frame.shape[1]
        metrics['density'] = len(people) / (frame_area / 10000) if frame_area > 0 else 0
        
        # Calculate spatial distribution (left, center, right regions)
        frame_width = frame.shape[1]
        left_count = sum(1 for p in people if p.get('center', (0, 0))[0] < frame_width / 3)
        center_count = sum(1 for p in people if frame_width / 3 <= p.get('center', (0, 0))[0] < 2 * frame_width / 3)
        right_count = sum(1 for p in people if p.get('center', (0, 0))[0] >= 2 * frame_width / 3)
        
        metrics['distribution'] = {
            'left': left_count,
            'center': center_count,
            'right': right_count
        }
        
        return metrics

    def get_analytics(self, camera_id: str) -> Dict:
        """Get analytics data for camera"""
        return self.analytics_data.get(camera_id, {
            'total_people': 0,
            'engagement_time': 0,
            'peak_hours': {},
        })
