"""
Event Dispatcher
Handles event output formatting for Market Module
"""
from typing import Dict, List, Optional
from datetime import datetime
import numpy as np
from loguru import logger

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


class EventDispatcher:
    """
    Event Dispatcher for Market Module
    
    Formats events according to standard Edge event output format
    Handles snapshot capture (with face blurring)
    """
    
    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize event dispatcher
        
        Args:
            config: Configuration dict
        """
        self.config = config or {}
        self.snapshots_enabled = self.config.get('snapshots', {}).get('enabled', True)
        self.only_high_risk = self.config.get('snapshots', {}).get('only_high_risk', True)
        self.face_blur = self.config.get('snapshots', {}).get('face_blur', True)
    
    def create_event(
        self,
        module: str,
        event_type: str,
        risk_score: int,
        risk_level: str,
        track_id: int,
        camera_id: str,
        confidence: float,
        actions: List[str],
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Create standard Edge event
        
        Args:
            module: Module name ('market')
            event_type: Event type ('suspicious_behavior')
            risk_score: Calculated risk score
            risk_level: Risk level (low, medium, high, critical)
            track_id: Person track ID
            camera_id: Camera identifier
            confidence: Detection confidence
            actions: List of detected actions
            metadata: Additional metadata
            
        Returns:
            Standard Edge event dict
        """
        event = {
            'module': module,
            'event_type': event_type,
            'risk_score': risk_score,
            'risk_level': risk_level,
            'track_id': track_id,
            'camera_id': camera_id,
            'confidence': confidence,
            'actions': actions,
            'timestamp': datetime.utcnow().isoformat(),
        }
        
        if metadata:
            event['metadata'] = metadata
        
        return event
    
    def create_alert(
        self,
        event: Dict,
        title: Optional[str] = None,
        description: Optional[str] = None
    ) -> Dict:
        """
        Create alert from event
        
        Args:
            event: Event dict
            title: Alert title (optional)
            description: Alert description (optional)
            
        Returns:
            Alert dict
        """
        risk_level = event.get('risk_level', 'medium')
        
        # Map risk level to severity
        severity_map = {
            'low': 'info',
            'medium': 'warning',
            'high': 'high',
            'critical': 'critical',
        }
        
        alert = {
            'module': event.get('module', 'market'),
            'type': event.get('event_type', 'suspicious_behavior'),
            'severity': severity_map.get(risk_level, 'warning'),
            'title': title or f'Suspicious Behavior Detected - {risk_level.upper()} Risk',
            'description': description or self._generate_description(event),
            'camera_id': event.get('camera_id'),
            'timestamp': event.get('timestamp'),
            'metadata': {
                'risk_score': event.get('risk_score'),
                'risk_level': risk_level,
                'track_id': event.get('track_id'),
                'confidence': event.get('confidence'),
                'actions': event.get('actions', []),
                **event.get('metadata', {})
            }
        }
        
        return alert
    
    def _generate_description(self, event: Dict) -> str:
        """Generate human-readable description"""
        risk_level = event.get('risk_level', 'medium')
        actions = event.get('actions', [])
        
        action_descriptions = {
            'object_pick': 'Item picked from shelf',
            'concealment': 'Concealment motion detected',
            'exit_without_checkout': 'Exited without checkout',
        }
        
        action_text = ', '.join([
            action_descriptions.get(action, action)
            for action in actions
        ])
        
        return f"{risk_level.upper()} risk suspicious behavior detected. {action_text}."
    
    def capture_snapshot(
        self,
        frame: np.ndarray,
        event: Dict,
        person_bbox: Optional[List[int]] = None
    ) -> Optional[np.ndarray]:
        """
        Capture snapshot with face blurring
        
        Args:
            frame: Original frame
            event: Event dict
            person_bbox: Person bounding box (optional)
            
        Returns:
            Snapshot frame (with faces blurred) or None
        """
        if not self.snapshots_enabled:
            return None
        
        risk_level = event.get('risk_level', 'low')
        
        # Only capture High/Critical if configured
        if self.only_high_risk and risk_level not in ['high', 'critical']:
            return None
        
        if not CV2_AVAILABLE:
            return frame.copy()
        
        try:
            snapshot = frame.copy()
            
            # Blur faces if enabled
            if self.face_blur:
                snapshot = self._blur_faces(snapshot, person_bbox)
            
            return snapshot
        except Exception as e:
            logger.error(f"Error capturing snapshot: {e}")
            return None
    
    def _blur_faces(self, frame: np.ndarray, person_bbox: Optional[List[int]] = None) -> np.ndarray:
        """
        Blur faces in frame
        
        Args:
            frame: Input frame
            person_bbox: Person bounding box (optional, for targeted blurring)
            
        Returns:
            Frame with faces blurred
        """
        try:
            # Simple approach: blur upper portion of person bbox (where face typically is)
            if person_bbox:
                x, y, w, h = person_bbox
                
                # Face is typically in upper 30% of person bbox
                face_y = y
                face_h = int(h * 0.3)
                face_roi = frame[face_y:face_y+face_h, x:x+w]
                
                # Blur the ROI
                blurred_roi = cv2.GaussianBlur(face_roi, (51, 51), 0)
                frame[face_y:face_y+face_h, x:x+w] = blurred_roi
            
            return frame
        except Exception as e:
            logger.error(f"Error blurring faces: {e}")
            return frame
