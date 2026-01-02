"""
Temporal Filtering
Stage 3 of Market Module Pipeline
Filters out short interactions and broken track chains
"""
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
from loguru import logger


class TemporalFilter:
    """
    Temporal Filtering Stage
    
    Functions:
    - Ignore short interactions
    - Confirm sustained possession
    - Require continuous tracking
    - Discard broken track chains
    """
    
    def __init__(
        self,
        min_tracking_duration: float = 3.0,
        max_track_gap: float = 1.0
    ):
        self.min_tracking_duration = min_tracking_duration  # seconds
        self.max_track_gap = max_track_gap  # seconds
        
        # Track history per person
        self._track_history: Dict[str, Dict[int, List[Dict]]] = defaultdict(lambda: defaultdict(list))
        
        # Track gaps (missing frames)
        self._track_gaps: Dict[str, Dict[int, datetime]] = defaultdict(dict)
    
    def filter_interactions(
        self,
        camera_id: str,
        tracked_persons: List[Dict],
        interactions: List[Dict]
    ) -> List[Dict]:
        """
        Filter interactions based on temporal criteria
        
        Args:
            camera_id: Camera identifier
            tracked_persons: List of tracked persons
            interactions: List of detected interactions
            
        Returns:
            Filtered list of interactions that meet temporal requirements
        """
        now = datetime.utcnow()
        filtered = []
        
        # Update track history
        for person in tracked_persons:
            track_id = person['track_id']
            self._update_track_history(camera_id, track_id, person, now)
        
        # Filter interactions
        for interaction in interactions:
            track_id = interaction['track_id']
            
            # Check track continuity
            if not self._is_track_continuous(camera_id, track_id, now):
                logger.debug(f"Track {track_id} has gaps - filtering out interaction")
                continue
            
            # Check minimum tracking duration
            track_age = self._get_track_age(camera_id, track_id)
            if track_age < self.min_tracking_duration:
                logger.debug(f"Track {track_id} too short ({track_age}s) - filtering out")
                continue
            
            # Check interaction duration
            interaction_duration = interaction.get('duration', 0.0)
            if interaction_duration < self.min_tracking_duration * 0.5:
                logger.debug(f"Interaction too short ({interaction_duration}s) - filtering out")
                continue
            
            # Passes all filters
            filtered.append(interaction)
        
        # Cleanup old history
        self._cleanup_old_history(camera_id, now)
        
        return filtered
    
    def _update_track_history(
        self,
        camera_id: str,
        track_id: int,
        person: Dict,
        timestamp: datetime
    ):
        """Update track history"""
        history = self._track_history[camera_id][track_id]
        
        # Add current state
        history.append({
            'timestamp': timestamp,
            'bbox': person['bbox'],
            'center': person['center'],
            'zones': person.get('zones', set()),
        })
        
        # Check for gaps
        if len(history) > 1:
            prev_timestamp = history[-2]['timestamp']
            gap = (timestamp - prev_timestamp).total_seconds()
            
            if gap > self.max_track_gap:
                # Track gap detected
                self._track_gaps[camera_id][track_id] = timestamp
                logger.debug(f"Track {track_id} gap detected: {gap:.2f}s")
        
        # Keep only recent history (last 10 seconds)
        cutoff = timestamp - timedelta(seconds=10)
        self._track_history[camera_id][track_id] = [
            entry for entry in history
            if entry['timestamp'] > cutoff
        ]
    
    def _is_track_continuous(self, camera_id: str, track_id: int, now: datetime) -> bool:
        """Check if track is continuous (no large gaps)"""
        if track_id not in self._track_history[camera_id]:
            return False
        
        # Check if there's a recent gap
        if track_id in self._track_gaps[camera_id]:
            gap_time = self._track_gaps[camera_id][track_id]
            time_since_gap = (now - gap_time).total_seconds()
            
            # If gap was recent, track is not continuous
            if time_since_gap < self.min_tracking_duration:
                return False
        
        # Check history for continuity
        history = self._track_history[camera_id][track_id]
        if len(history) < 2:
            return True
        
        # Check gaps in recent history
        for i in range(1, len(history)):
            gap = (history[i]['timestamp'] - history[i-1]['timestamp']).total_seconds()
            if gap > self.max_track_gap:
                return False
        
        return True
    
    def _get_track_age(self, camera_id: str, track_id: int) -> float:
        """Get track age in seconds"""
        if track_id not in self._track_history[camera_id]:
            return 0.0
        
        history = self._track_history[camera_id][track_id]
        if not history:
            return 0.0
        
        first_seen = history[0]['timestamp']
        last_seen = history[-1]['timestamp']
        
        return (last_seen - first_seen).total_seconds()
    
    def _cleanup_old_history(self, camera_id: str, now: datetime):
        """Remove old track history"""
        cutoff = now - timedelta(seconds=30)  # Keep 30 seconds of history
        
        for track_id in list(self._track_history[camera_id].keys()):
            history = self._track_history[camera_id][track_id]
            self._track_history[camera_id][track_id] = [
                entry for entry in history
                if entry['timestamp'] > cutoff
            ]
            
            # Remove track if no history
            if not self._track_history[camera_id][track_id]:
                self._track_history[camera_id].pop(track_id, None)
                self._track_gaps[camera_id].pop(track_id, None)
    
    def get_track_summary(self, camera_id: str, track_id: int) -> Optional[Dict]:
        """Get summary of track history"""
        if track_id not in self._track_history[camera_id]:
            return None
        
        history = self._track_history[camera_id][track_id]
        if not history:
            return None
        
        zones_visited = set()
        for entry in history:
            zones_visited.update(entry.get('zones', set()))
        
        return {
            'track_id': track_id,
            'duration': self._get_track_age(camera_id, track_id),
            'zones_visited': list(zones_visited),
            'continuous': self._is_track_continuous(camera_id, track_id, datetime.utcnow()),
            'history_length': len(history),
        }
    
    def cleanup(self):
        """Cleanup resources"""
        self._track_history.clear()
        self._track_gaps.clear()
