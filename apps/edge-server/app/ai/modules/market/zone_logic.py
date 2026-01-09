"""
Zone Logic
Stage 5 of Market Module Pipeline
Tracks person movement across zones (Shelf, Checkout, Exit)
"""
from typing import Dict, List, Optional, Set, Tuple
from datetime import datetime
from collections import defaultdict
from loguru import logger


class ZoneLogic:
    """
    Zone Logic Engine
    
    Zones:
    - Shelf Zone
    - Checkout Zone
    - Exit Zone
    
    Logic:
    - Person exits store
    - Person NEVER enters checkout zone
    - Object was previously picked
    """
    
    def __init__(self):
        # Track zone history per person
        self._zone_history: Dict[str, Dict[int, List[str]]] = defaultdict(lambda: defaultdict(list))
        
        # Track object picks per person
        self._object_picks: Dict[str, Dict[int, List[Dict]]] = defaultdict(lambda: defaultdict(list))
        
        # Track checkout status per person
        self._checkout_status: Dict[str, Dict[int, bool]] = defaultdict(dict)
    
    def process_zones(
        self,
        camera_id: str,
        tracked_persons: List[Dict],
        interactions: List[Dict]
    ) -> List[Dict]:
        """
        Process zone logic
        
        Args:
            camera_id: Camera identifier
            tracked_persons: List of tracked persons with current zones
            interactions: List of detected interactions (object picks)
            
        Returns:
            List of zone-based events:
            [{
                'track_id': int,
                'event': 'exit_without_checkout',
                'zones_visited': List[str],
                'object_picks': int,
                'timestamp': datetime
            }]
        """
        events = []
        now = datetime.utcnow()
        
        # Update zone history
        for person in tracked_persons:
            track_id = person['track_id']
            current_zones = person.get('zones', set())
            
            # Update zone history
            if current_zones:
                for zone in current_zones:
                    history = self._zone_history[camera_id][track_id]
                    if not history or history[-1] != zone:
                        history.append(zone)
                        logger.debug(f"Track {track_id} entered zone: {zone}")
        
        # Update object picks
        for interaction in interactions:
            if interaction.get('action') == 'object_pick':
                track_id = interaction['track_id']
                self._object_picks[camera_id][track_id].append({
                    'timestamp': interaction.get('timestamp'),
                    'shelf_zone': interaction.get('shelf_zone'),
                })
        
        # Check for exit without checkout
        for person in tracked_persons:
            track_id = person['track_id']
            current_zones = person.get('zones', set())
            
            # Check if person is in exit zone
            in_exit = any('exit' in zone.lower() for zone in current_zones)
            
            if in_exit:
                # Check if person had object picks
                object_picks = self._object_picks[camera_id].get(track_id, [])
                
                if object_picks:
                    # Check if person visited checkout
                    zones_visited = self._zone_history[camera_id].get(track_id, [])
                    visited_checkout = any('checkout' in zone.lower() for zone in zones_visited)
                    
                    if not visited_checkout:
                        # Exit without checkout detected
                        events.append({
                            'track_id': track_id,
                            'event': 'exit_without_checkout',
                            'zones_visited': list(set(zones_visited)),
                            'object_picks': len(object_picks),
                            'timestamp': now.isoformat(),
                        })
                        logger.info(f"Track {track_id} exited without checkout")
            
            # Check if person is in checkout zone
            in_checkout = any('checkout' in zone.lower() for zone in current_zones)
            if in_checkout:
                self._checkout_status[camera_id][track_id] = True
    
    def get_track_summary(self, camera_id: str, track_id: int) -> Optional[Dict]:
        """Get summary of track's zone activity"""
        zones_visited = self._zone_history[camera_id].get(track_id, [])
        object_picks = self._object_picks[camera_id].get(track_id, [])
        visited_checkout = self._checkout_status[camera_id].get(track_id, False)
        
        return {
            'track_id': track_id,
            'zones_visited': list(set(zones_visited)),
            'object_picks_count': len(object_picks),
            'visited_checkout': visited_checkout,
        }
    
    def cleanup_track(self, camera_id: str, track_id: int):
        """Cleanup track data"""
        self._zone_history[camera_id].pop(track_id, None)
        self._object_picks[camera_id].pop(track_id, None)
        self._checkout_status[camera_id].pop(track_id, None)
    
    def cleanup(self):
        """Cleanup all resources"""
        self._zone_history.clear()
        self._object_picks.clear()
        self._checkout_status.clear()
