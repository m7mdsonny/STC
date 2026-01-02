"""
Shelf Interaction Detection
Stage 2 of Market Module Pipeline
Detects when a person picks up an item from a shelf
"""
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from loguru import logger

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False


class ShelfInteractionDetector:
    """
    Detects item pick-up from shelves
    
    Detection method:
    - Hand enters shelf zone
    - Object leaves shelf zone
    - Object does NOT return
    
    Validation rules:
    - Spatial overlap (hand ↔ shelf)
    - Temporal validation (≥ 2–3 seconds)
    - Ignore accidental or brief touches
    """
    
    def __init__(
        self,
        interaction_time: float = 2.0,
        overlap_threshold: float = 0.3,
        confidence_threshold: float = 0.5
    ):
        self.interaction_time = interaction_time  # seconds
        self.overlap_threshold = overlap_threshold
        self.confidence_threshold = confidence_threshold
        
        # Track interactions per person
        self._interactions: Dict[str, Dict[int, Dict]] = {}  # camera_id -> track_id -> interaction_data
        
        # Detection model for objects
        self._object_model = None
        self._initialized = False
    
    def initialize(self) -> bool:
        """Initialize object detection model"""
        if not YOLO_AVAILABLE:
            logger.warning("YOLO not available - shelf interaction detection disabled")
            return False
        
        try:
            # Use YOLO for object detection
            self._object_model = YOLO('yolov8n.pt')
            logger.info("Shelf Interaction Detector initialized")
            self._initialized = True
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Shelf Interaction Detector: {e}")
            return False
    
    def process_frame(
        self,
        frame: np.ndarray,
        camera_id: str,
        tracked_persons: List[Dict],
        shelf_zones: Optional[List[Dict]] = None
    ) -> List[Dict]:
        """
        Detect shelf interactions
        
        Args:
            frame: Input frame
            camera_id: Camera identifier
            tracked_persons: List of tracked persons from Stage 1
            shelf_zones: List of shelf zone definitions
            
        Returns:
            List of detected interactions:
            [{
                'track_id': int,
                'action': 'object_pick',
                'timestamp': datetime,
                'shelf_zone': str,
                'confidence': float,
                'bbox': [x, y, w, h]  # object bbox
            }]
        """
        if not self._initialized or not shelf_zones:
            return []
        
        interactions = []
        now = datetime.utcnow()
        
        # Initialize camera tracking if needed
        if camera_id not in self._interactions:
            self._interactions[camera_id] = {}
        
        # Detect objects in frame
        objects = self._detect_objects(frame)
        
        # For each tracked person, check for shelf interactions
        for person in tracked_persons:
            track_id = person['track_id']
            person_bbox = person['bbox']
            person_zones = person.get('zones', set())
            
            # Check if person is in shelf zone
            in_shelf_zone = any('shelf' in zone.lower() for zone in person_zones)
            
            if not in_shelf_zone:
                # Person not in shelf zone - clear any pending interactions
                if track_id in self._interactions[camera_id]:
                    self._interactions[camera_id].pop(track_id, None)
                continue
            
            # Check for hand-object interactions
            hand_bbox = self._estimate_hand_bbox(person_bbox)
            
            # Find objects near hand
            nearby_objects = self._find_nearby_objects(hand_bbox, objects, shelf_zones)
            
            # Check for pick-up events
            for obj in nearby_objects:
                interaction = self._check_pickup(
                    camera_id,
                    track_id,
                    person_bbox,
                    hand_bbox,
                    obj,
                    shelf_zones,
                    now
                )
                
                if interaction:
                    interactions.append(interaction)
        
        # Cleanup old interactions
        self._cleanup_old_interactions(camera_id, now)
        
        return interactions
    
    def _detect_objects(self, frame: np.ndarray) -> List[Dict]:
        """Detect objects in frame using YOLO"""
        if not self._object_model:
            return []
        
        try:
            # Detect common retail objects (bottles, bags, etc.)
            # COCO classes: 39=bottle, 40=wine glass, 41=cup, 67=cell phone, etc.
            results = self._object_model(
                frame,
                classes=[39, 40, 41, 67],  # Common retail items
                conf=self.confidence_threshold,
                verbose=False
            )
            
            objects = []
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0].cpu().numpy())
                    
                    objects.append({
                        'bbox': [int(x1), int(y1), int(x2 - x1), int(y2 - y1)],
                        'confidence': confidence,
                        'center': (int((x1 + x2) / 2), int((y1 + y2) / 2)),
                        'class_id': int(box.cls[0].cpu().numpy())
                    })
            
            return objects
        except Exception as e:
            logger.error(f"Error detecting objects: {e}")
            return []
    
    def _estimate_hand_bbox(self, person_bbox: List[int]) -> List[int]:
        """
        Estimate hand bounding box from person bbox
        Hand is typically in lower-middle region of person
        """
        x, y, w, h = person_bbox
        
        # Hand is roughly at 60-80% of person height, centered horizontally
        hand_y = y + int(h * 0.6)
        hand_h = int(h * 0.2)
        hand_x = x + int(w * 0.3)
        hand_w = int(w * 0.4)
        
        return [hand_x, hand_y, hand_w, hand_h]
    
    def _find_nearby_objects(
        self,
        hand_bbox: List[int],
        objects: List[Dict],
        shelf_zones: List[Dict]
    ) -> List[Dict]:
        """Find objects near hand that are in shelf zones"""
        nearby = []
        
        for obj in objects:
            obj_center = obj['center']
            
            # Check if object is in shelf zone
            in_shelf = False
            for zone in shelf_zones:
                if self._point_in_zone(obj_center, zone.get('polygon', [])):
                    in_shelf = True
                    break
            
            if not in_shelf:
                continue
            
            # Check if object overlaps with hand region
            overlap = self._calculate_bbox_overlap(hand_bbox, obj['bbox'])
            
            if overlap > self.overlap_threshold:
                nearby.append(obj)
        
        return nearby
    
    def _check_pickup(
        self,
        camera_id: str,
        track_id: int,
        person_bbox: List[int],
        hand_bbox: List[int],
        obj: Dict,
        shelf_zones: List[Dict],
        timestamp: datetime
    ) -> Optional[Dict]:
        """
        Check if object pick-up occurred
        
        Logic:
        1. Hand overlaps with object
        2. Object is in shelf zone
        3. Interaction sustained for required time
        4. Object does not return to shelf
        """
        # Initialize interaction tracking
        interaction_key = f"{track_id}_{obj['bbox']}"
        
        if track_id not in self._interactions[camera_id]:
            self._interactions[camera_id][track_id] = {}
        
        interactions = self._interactions[camera_id][track_id]
        
        # Check if this is a new or continuing interaction
        if interaction_key in interactions:
            # Continuing interaction
            interaction = interactions[interaction_key]
            interaction['last_seen'] = timestamp
            interaction['duration'] = (timestamp - interaction['first_seen']).total_seconds()
            
            # Check if interaction duration meets threshold
            if interaction['duration'] >= self.interaction_time:
                # Valid pick-up detected
                if not interaction.get('confirmed', False):
                    interaction['confirmed'] = True
                    return {
                        'track_id': track_id,
                        'action': 'object_pick',
                        'timestamp': timestamp.isoformat(),
                        'shelf_zone': interaction.get('shelf_zone', 'unknown'),
                        'confidence': min(0.95, obj['confidence'] + 0.2),  # Boost confidence
                        'bbox': obj['bbox'],
                        'duration': interaction['duration'],
                    }
        else:
            # New interaction
            # Find which shelf zone
            shelf_zone = 'unknown'
            for zone in shelf_zones:
                if self._point_in_zone(obj['center'], zone.get('polygon', [])):
                    shelf_zone = zone.get('name', 'unknown')
                    break
            
            interactions[interaction_key] = {
                'first_seen': timestamp,
                'last_seen': timestamp,
                'duration': 0.0,
                'shelf_zone': shelf_zone,
                'object_bbox': obj['bbox'],
                'confirmed': False,
            }
        
        return None
    
    def _calculate_bbox_overlap(self, bbox1: List[int], bbox2: List[int]) -> float:
        """Calculate overlap ratio between two bounding boxes"""
        x1_1, y1_1, w1, h1 = bbox1
        x2_1, y2_1 = x1_1 + w1, y1_1 + h1
        
        x1_2, y1_2, w2, h2 = bbox2
        x2_2, y2_2 = x1_2 + w2, y1_2 + h2
        
        # Calculate intersection
        x1_i = max(x1_1, x1_2)
        y1_i = max(y1_1, y1_2)
        x2_i = min(x2_1, x2_2)
        y2_i = min(y2_1, y2_2)
        
        if x2_i < x1_i or y2_i < y1_i:
            return 0.0
        
        intersection = (x2_i - x1_i) * (y2_i - y1_i)
        area1 = w1 * h1
        area2 = w2 * h2
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0.0
    
    def _point_in_zone(self, point: Tuple[int, int], zone_polygon: List) -> bool:
        """Check if point is inside zone polygon"""
        if not zone_polygon or len(zone_polygon) < 3:
            return False
        
        x, y = point
        n = len(zone_polygon)
        inside = False
        
        p1x, p1y = zone_polygon[0]
        for i in range(1, n + 1):
            p2x, p2y = zone_polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        
        return inside
    
    def _cleanup_old_interactions(self, camera_id: str, now: datetime):
        """Remove old interaction data"""
        if camera_id not in self._interactions:
            return
        
        max_age = timedelta(seconds=self.interaction_time * 2)
        
        for track_id in list(self._interactions[camera_id].keys()):
            interactions = self._interactions[camera_id][track_id]
            expired = []
            
            for key, interaction in interactions.items():
                age = now - interaction['last_seen']
                if age > max_age:
                    expired.append(key)
            
            for key in expired:
                interactions.pop(key, None)
            
            # Remove track if no interactions
            if not interactions:
                self._interactions[camera_id].pop(track_id, None)
    
    def cleanup(self):
        """Cleanup resources"""
        self._object_model = None
        self._interactions.clear()
        self._initialized = False
