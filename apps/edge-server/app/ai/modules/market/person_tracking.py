"""
Person Detection & Tracking
Stage 1 of Market Module Pipeline
Uses YOLO for detection and ByteTrack for tracking
"""
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
from loguru import logger

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logger.warning("ultralytics not available - person tracking will be limited")

try:
    from byte_tracker import BYTETracker
    BYTETRACK_AVAILABLE = True
except ImportError:
    BYTETRACK_AVAILABLE = False
    logger.warning("byte_tracker not available - using simple tracking")


class PersonTracker:
    """
    Person Detection & Tracking
    - Detects people using YOLO
    - Tracks across frames using ByteTrack (or fallback)
    - Assigns temporary track_id
    - Tracks across zones (Shelf, Checkout, Exit)
    - NO identity persistence
    - track_id expires automatically
    """
    
    def __init__(self, confidence_threshold: float = 0.5, track_expiry: int = 300):
        self.confidence_threshold = confidence_threshold
        self.track_expiry = track_expiry  # seconds
        
        # Detection model
        self._detection_model = None
        
        # Tracking
        self._trackers: Dict[str, any] = {}  # camera_id -> tracker
        self._tracks: Dict[str, Dict[int, Dict]] = defaultdict(dict)  # camera_id -> track_id -> track_data
        self._track_created: Dict[str, Dict[int, datetime]] = defaultdict(dict)  # track creation time
        
        # Zone tracking per track
        self._track_zones: Dict[str, Dict[int, set]] = defaultdict(lambda: defaultdict(set))
        
        self._initialized = False
    
    def initialize(self) -> bool:
        """Initialize detection model"""
        if not YOLO_AVAILABLE:
            logger.warning("YOLO not available - person tracking disabled")
            return False
        
        try:
            # Use YOLOv8n (nano) for speed, or yolov8s for better accuracy
            self._detection_model = YOLO('yolov8n.pt')
            logger.info("Person Tracker initialized with YOLOv8")
            self._initialized = True
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Person Tracker: {e}")
            return False
    
    def process_frame(
        self,
        frame: np.ndarray,
        camera_id: str,
        zones: Optional[Dict[str, List]] = None
    ) -> List[Dict]:
        """
        Process frame for person detection and tracking
        
        Args:
            frame: Input frame
            camera_id: Camera identifier
            zones: Zone definitions {zone_name: [polygon_points]}
            
        Returns:
            List of tracked persons:
            [{
                'track_id': int,
                'bbox': [x, y, w, h],
                'center': (x, y),
                'confidence': float,
                'zones': set,  # zones this person is in
                'age': float  # seconds since first detection
            }]
        """
        if not self._initialized or not self._detection_model:
            return []
        
        try:
            # Detect people (class 0 in COCO)
            results = self._detection_model(
                frame,
                classes=[0],  # person class only
                conf=self.confidence_threshold,
                verbose=False
            )
            
            # Extract detections
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
            
            # Update tracker
            tracked_persons = self._update_tracking(camera_id, detections, zones)
            
            # Cleanup expired tracks
            self._cleanup_expired_tracks(camera_id)
            
            return tracked_persons
            
        except Exception as e:
            logger.error(f"Error in person tracking: {e}")
            return []
    
    def _update_tracking(
        self,
        camera_id: str,
        detections: List[Dict],
        zones: Optional[Dict[str, List]] = None
    ) -> List[Dict]:
        """Update tracking with new detections"""
        if not detections:
            # Update existing tracks (mark as not seen this frame)
            for track_id in list(self._tracks[camera_id].keys()):
                self._tracks[camera_id][track_id]['seen'] = False
            return []
        
        # Initialize tracker for camera if needed
        if camera_id not in self._trackers:
            if BYTETRACK_AVAILABLE:
                self._trackers[camera_id] = BYTETracker()
            else:
                # Simple fallback tracker (IoU-based)
                self._trackers[camera_id] = SimpleTracker()
        
        # Convert detections to tracker format
        tracker_detections = []
        for det in detections:
            x, y, w, h = det['bbox']
            tracker_detections.append([x, y, x + w, y + h, det['confidence']])
        
        # Update tracker
        tracker = self._trackers[camera_id]
        if BYTETRACK_AVAILABLE:
            tracked_objects = tracker.update(np.array(tracker_detections), frame=None)
        else:
            tracked_objects = tracker.update(tracker_detections)
        
        # Process tracked objects
        tracked_persons = []
        now = datetime.utcnow()
        
        for track in tracked_objects:
            track_id = int(track[4]) if len(track) > 4 else None
            
            if track_id is None:
                continue
            
            # Get bbox
            x1, y1, x2, y2 = track[0], track[1], track[2], track[3]
            bbox = [int(x1), int(y1), int(x2 - x1), int(y2 - y1)]
            center = (int((x1 + x2) / 2), int((y1 + y2) / 2))
            
            # Initialize track if new
            if track_id not in self._tracks[camera_id]:
                self._tracks[camera_id][track_id] = {
                    'bbox': bbox,
                    'center': center,
                    'confidence': track[5] if len(track) > 5 else 0.5,
                    'seen': True,
                    'first_seen': now,
                    'last_seen': now,
                }
                self._track_created[camera_id][track_id] = now
            else:
                # Update existing track
                self._tracks[camera_id][track_id].update({
                    'bbox': bbox,
                    'center': center,
                    'seen': True,
                    'last_seen': now,
                })
            
            # Check zones
            track_zones = set()
            if zones:
                for zone_name, zone_polygon in zones.items():
                    if self._point_in_zone(center, zone_polygon):
                        track_zones.add(zone_name)
                        self._track_zones[camera_id][track_id].add(zone_name)
            
            # Calculate track age
            first_seen = self._track_created[camera_id].get(track_id, now)
            age = (now - first_seen).total_seconds()
            
            tracked_persons.append({
                'track_id': track_id,
                'bbox': bbox,
                'center': center,
                'confidence': self._tracks[camera_id][track_id]['confidence'],
                'zones': track_zones,
                'age': age,
            })
        
        return tracked_persons
    
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
    
    def _cleanup_expired_tracks(self, camera_id: str):
        """Remove expired tracks"""
        now = datetime.utcnow()
        expired = []
        
        for track_id, created_time in self._track_created[camera_id].items():
            age = (now - created_time).total_seconds()
            if age > self.track_expiry:
                expired.append(track_id)
        
        for track_id in expired:
            self._tracks[camera_id].pop(track_id, None)
            self._track_created[camera_id].pop(track_id, None)
            self._track_zones[camera_id].pop(track_id, None)
    
    def get_track_history(self, camera_id: str, track_id: int) -> Optional[Dict]:
        """Get track history (zones visited, etc.)"""
        if camera_id not in self._tracks or track_id not in self._tracks[camera_id]:
            return None
        
        return {
            'track_id': track_id,
            'zones_visited': list(self._track_zones[camera_id].get(track_id, set())),
            'first_seen': self._track_created[camera_id].get(track_id),
            'last_seen': self._tracks[camera_id][track_id].get('last_seen'),
        }
    
    def cleanup(self):
        """Cleanup resources"""
        self._detection_model = None
        self._trackers.clear()
        self._tracks.clear()
        self._track_created.clear()
        self._track_zones.clear()
        self._initialized = False


class SimpleTracker:
    """
    Simple IoU-based tracker (fallback when ByteTrack not available)
    """
    def __init__(self):
        self.tracks = {}
        self.next_id = 1
        self.iou_threshold = 0.3
    
    def update(self, detections: List[List]) -> List:
        """Update tracks with new detections"""
        if not detections:
            return []
        
        # Match detections to existing tracks
        matched = set()
        tracked = []
        
        for track_id, track_bbox in self.tracks.items():
            best_iou = 0
            best_idx = -1
            
            for idx, det in enumerate(detections):
                if idx in matched:
                    continue
                
                iou = self._calculate_iou(track_bbox, det[:4])
                if iou > best_iou and iou > self.iou_threshold:
                    best_iou = iou
                    best_idx = idx
            
            if best_idx >= 0:
                # Update track
                det = detections[best_idx]
                self.tracks[track_id] = det[:4]
                tracked.append([*det[:4], det[4] if len(det) > 4 else 0.5, track_id])
                matched.add(best_idx)
            else:
                # Track lost - keep for a few frames
                pass
        
        # Create new tracks for unmatched detections
        for idx, det in enumerate(detections):
            if idx not in matched:
                track_id = self.next_id
                self.next_id += 1
                self.tracks[track_id] = det[:4]
                tracked.append([*det[:4], det[4] if len(det) > 4 else 0.5, track_id])
        
        return tracked
    
    def _calculate_iou(self, box1: List, box2: List) -> float:
        """Calculate IoU between two boxes"""
        x1_1, y1_1, x2_1, y2_1 = box1
        x1_2, y1_2, x2_2, y2_2 = box2
        
        # Calculate intersection
        x1_i = max(x1_1, x1_2)
        y1_i = max(y1_1, y1_2)
        x2_i = min(x2_1, x2_2)
        y2_i = min(y2_1, y2_2)
        
        if x2_i < x1_i or y2_i < y1_i:
            return 0.0
        
        intersection = (x2_i - x1_i) * (y2_i - y1_i)
        area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0.0
