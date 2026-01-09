"""
Loitering Detection Module
Detects people loitering in areas for extended periods
"""
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from loguru import logger

from app.ai.base import BaseAIModule
from config.settings import settings


class LoiteringDetectionModule(BaseAIModule):
    """
    Loitering Detection AI Module
    Detects people staying in an area for too long
    """
    
    def __init__(self, confidence_threshold: float = 0.5):
        super().__init__(
            module_id="loitering",
            module_name="Loitering Detection",
            confidence_threshold=confidence_threshold
        )
        self.tracking_data: Dict[str, Dict] = {}  # track_id -> {start_time, location, duration}
        self.loitering_threshold_seconds = 60  # Alert if person stays > 60 seconds

    def initialize(self) -> bool:
        """Initialize loitering detection"""
        try:
            # TODO: Load person detection and tracking models
            logger.info("Loitering Detection module initialized (placeholder - replace with actual model)")
            self._initialized = True
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Loitering Detection: {e}")
            return False

    def process_frame(
        self,
        frame: np.ndarray,
        camera_id: str,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Process frame for loitering detection"""
        if not self.is_enabled():
            return {'detections': [], 'events': [], 'alerts': []}

        results = {
            'detections': [],
            'events': [],
            'alerts': [],
        }

        try:
            # TODO: Implement loitering detection
            # 1. Detect and track people
            # 2. Calculate time spent in same location
            # 3. Alert if exceeds threshold
            
            tracked_people = self._track_people(camera_id, frame)
            now = datetime.utcnow()
            
            for person in tracked_people:
                track_id = person.get('track_id')
                location = person.get('location')  # Center point of bbox
                
                if track_id not in self.tracking_data:
                    # New person detected
                    self.tracking_data[track_id] = {
                        'start_time': now,
                        'location': location,
                        'last_seen': now,
                    }
                else:
                    # Update tracking
                    track_data = self.tracking_data[track_id]
                    track_data['last_seen'] = now
                    
                    # Check if person is in same location (within threshold)
                    if self._is_same_location(location, track_data['location']):
                        duration = (now - track_data['start_time']).total_seconds()
                        
                        if duration > self.loitering_threshold_seconds:
                            # Loitering detected
                            detection = {
                                'type': 'loitering',
                                'camera_id': camera_id,
                                'timestamp': now.isoformat(),
                                'track_id': track_id,
                                'duration_seconds': duration,
                                'bbox': person.get('bbox'),
                            }
                            results['detections'].append(detection)
                            
                            # Create alert
                            results['alerts'].append({
                                'type': 'loitering',
                                'camera_id': camera_id,
                                'severity': 'medium',
                                'title': 'Loitering Detected',
                                'description': f'Person loitering for {int(duration)} seconds',
                                'timestamp': now.isoformat(),
                                'metadata': {
                                    'track_id': track_id,
                                    'duration_seconds': duration,
                                    'bbox': person.get('bbox'),
                                }
                            })
                            
                            results['events'].append({
                                'type': 'loitering',
                                'camera_id': camera_id,
                                'duration_seconds': duration,
                                'timestamp': now.isoformat(),
                            })
                    else:
                        # Person moved, reset tracking
                        track_data['start_time'] = now
                        track_data['location'] = location

        except Exception as e:
            logger.error(f"Error processing frame in Loitering Detection: {e}")

        return results

    def _track_people(self, camera_id: str, frame: np.ndarray) -> List[Dict]:
        """Track people in frame"""
        # TODO: Use person detection + tracking (DeepSORT)
        return []

    def _is_same_location(self, loc1: tuple, loc2: tuple, threshold: float = 50.0) -> bool:
        """Check if two locations are the same (within threshold pixels)"""
        if not loc1 or not loc2:
            return False
        distance = ((loc1[0] - loc2[0])**2 + (loc1[1] - loc2[1])**2)**0.5
        return distance < threshold



