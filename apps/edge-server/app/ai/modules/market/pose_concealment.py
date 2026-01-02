"""
Pose-Based Concealment Detection
Stage 4 of Market Module Pipeline
Detects concealment behavior using pose/skeleton estimation
"""
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from loguru import logger

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logger.warning("OpenCV not available - concealment detection will be limited")


class PoseConcealmentDetector:
    """
    Detects concealment behavior using pose estimation
    
    Detection method:
    - Use pose/skeleton estimation
    - Detect hand movement toward:
      - Pocket
      - Waist
      - Bag
    - Trigger only when:
      - Object visibility disappears near body
    - NO face analysis allowed
    """
    
    def __init__(
        self,
        confidence_threshold: float = 0.7,
        concealment_zones: Optional[List[str]] = None
    ):
        self.confidence_threshold = confidence_threshold
        self.concealment_zones = concealment_zones or ['pocket', 'waist', 'bag']
        
        # Pose model (using MediaPipe or similar)
        self._pose_model = None
        self._initialized = False
    
    def initialize(self) -> bool:
        """Initialize pose estimation model"""
        try:
            # Try MediaPipe for pose estimation
            try:
                import mediapipe as mp
                self._pose_model = mp.solutions.pose.Pose(
                    static_image_mode=False,
                    model_complexity=1,
                    enable_segmentation=False,
                    min_detection_confidence=0.5,
                    min_tracking_confidence=0.5
                )
                logger.info("Pose Concealment Detector initialized with MediaPipe")
                self._initialized = True
                return True
            except ImportError:
                logger.warning("MediaPipe not available - using fallback method")
                # Fallback: use simple hand position estimation
                self._initialized = True
                return True
        except Exception as e:
            logger.error(f"Failed to initialize Pose Concealment Detector: {e}")
            return False
    
    def process_frame(
        self,
        frame: np.ndarray,
        camera_id: str,
        tracked_persons: List[Dict],
        interactions: List[Dict]
    ) -> List[Dict]:
        """
        Detect concealment behavior
        
        Args:
            frame: Input frame
            camera_id: Camera identifier
            tracked_persons: List of tracked persons
            interactions: List of detected interactions (object picks)
            
        Returns:
            List of concealment detections:
            [{
                'track_id': int,
                'action': 'concealment',
                'target_zone': str,  # pocket, waist, bag
                'confidence': float,
                'timestamp': datetime
            }]
        """
        if not self._initialized:
            return []
        
        concealments = []
        now = datetime.utcnow()
        
        # Only check persons with active interactions
        persons_with_interactions = {
            interaction['track_id']: interaction
            for interaction in interactions
        }
        
        for person in tracked_persons:
            track_id = person['track_id']
            
            # Skip if no active interaction
            if track_id not in persons_with_interactions:
                continue
            
            # Extract person region from frame
            person_bbox = person['bbox']
            x, y, w, h = person_bbox
            
            # Ensure bbox is within frame bounds
            h_frame, w_frame = frame.shape[:2]
            x = max(0, min(x, w_frame - 1))
            y = max(0, min(y, h_frame - 1))
            w = min(w, w_frame - x)
            h = min(h, h_frame - y)
            
            if w <= 0 or h <= 0:
                continue
            
            person_roi = frame[y:y+h, x:x+w]
            
            # Detect pose
            pose_result = self._detect_pose(person_roi)
            
            if not pose_result:
                continue
            
            # Check for concealment motion
            concealment = self._check_concealment(
                track_id,
                person_bbox,
                pose_result,
                persons_with_interactions[track_id],
                now
            )
            
            if concealment:
                concealments.append(concealment)
        
        return concealments
    
    def _detect_pose(self, person_roi: np.ndarray) -> Optional[Dict]:
        """Detect pose keypoints in person region"""
        if self._pose_model is None:
            # Fallback: estimate hand positions from bbox
            h, w = person_roi.shape[:2]
            return {
                'left_wrist': (int(w * 0.3), int(h * 0.7)),
                'right_wrist': (int(w * 0.7), int(h * 0.7)),
                'left_hip': (int(w * 0.35), int(h * 0.85)),
                'right_hip': (int(w * 0.65), int(h * 0.85)),
                'method': 'fallback'
            }
        
        try:
            # Convert BGR to RGB for MediaPipe
            if len(person_roi.shape) == 3:
                rgb_roi = cv2.cvtColor(person_roi, cv2.COLOR_BGR2RGB)
            else:
                rgb_roi = person_roi
            
            # Detect pose
            results = self._pose_model.process(rgb_roi)
            
            if not results.pose_landmarks:
                return None
            
            landmarks = results.pose_landmarks.landmark
            
            # Extract key points
            # MediaPipe pose landmarks: https://google.github.io/mediapipe/solutions/pose.html
            keypoints = {}
            
            # Wrists
            if landmarks[15].visibility > 0.5:  # Left wrist
                keypoints['left_wrist'] = (
                    int(landmarks[15].x * person_roi.shape[1]),
                    int(landmarks[15].y * person_roi.shape[0])
                )
            if landmarks[16].visibility > 0.5:  # Right wrist
                keypoints['right_wrist'] = (
                    int(landmarks[16].x * person_roi.shape[1]),
                    int(landmarks[16].y * person_roi.shape[0])
                )
            
            # Hips
            if landmarks[23].visibility > 0.5:  # Left hip
                keypoints['left_hip'] = (
                    int(landmarks[23].x * person_roi.shape[1]),
                    int(landmarks[23].y * person_roi.shape[0])
                )
            if landmarks[24].visibility > 0.5:  # Right hip
                keypoints['right_hip'] = (
                    int(landmarks[24].x * person_roi.shape[1]),
                    int(landmarks[24].y * person_roi.shape[0])
                )
            
            keypoints['method'] = 'mediapipe'
            return keypoints
            
        except Exception as e:
            logger.error(f"Error detecting pose: {e}")
            return None
    
    def _check_concealment(
        self,
        track_id: int,
        person_bbox: List[int],
        pose_result: Dict,
        interaction: Dict,
        timestamp: datetime
    ) -> Optional[Dict]:
        """
        Check if concealment motion is detected
        
        Logic:
        - Hand moves toward pocket/waist/bag
        - Object visibility decreases near body
        """
        x, y, w, h = person_bbox
        
        # Get hand positions
        left_wrist = pose_result.get('left_wrist')
        right_wrist = pose_result.get('right_wrist')
        left_hip = pose_result.get('left_hip')
        right_hip = pose_result.get('right_hip')
        
        if not (left_wrist or right_wrist) or not (left_hip or right_hip):
            return None
        
        # Check if hand is near hip/pocket area
        concealment_detected = False
        target_zone = None
        confidence = 0.0
        
        # Define proximity threshold (pixels in person bbox space)
        proximity_threshold = min(w, h) * 0.15
        
        if left_wrist and left_hip:
            distance = np.sqrt(
                (left_wrist[0] - left_hip[0])**2 + 
                (left_wrist[1] - left_hip[1])**2
            )
            if distance < proximity_threshold:
                concealment_detected = True
                target_zone = 'pocket'  # or 'waist'
                confidence = 1.0 - (distance / proximity_threshold)
        
        if right_wrist and right_hip:
            distance = np.sqrt(
                (right_wrist[0] - right_hip[0])**2 + 
                (right_wrist[1] - right_hip[1])**2
            )
            if distance < proximity_threshold:
                if not concealment_detected or distance < proximity_threshold * 0.8:
                    concealment_detected = True
                    target_zone = 'pocket'  # or 'waist'
                    confidence = max(confidence, 1.0 - (distance / proximity_threshold))
        
        if concealment_detected and confidence >= self.confidence_threshold:
            return {
                'track_id': track_id,
                'action': 'concealment',
                'target_zone': target_zone,
                'confidence': min(0.95, confidence),
                'timestamp': timestamp.isoformat(),
            }
        
        return None
    
    def cleanup(self):
        """Cleanup resources"""
        if self._pose_model:
            try:
                self._pose_model.close()
            except:
                pass
        self._pose_model = None
        self._initialized = False
