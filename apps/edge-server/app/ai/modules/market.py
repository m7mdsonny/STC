"""
Market Module - Suspicious Behavior & Loss Prevention
Enterprise AI module for retail environments

This module implements a multi-stage AI pipeline for detecting
suspicious behavior in retail settings. It NEVER accuses theft,
only reports risk-based suspicious behavior.
"""
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
import yaml
from loguru import logger

from app.ai.base import BaseAIModule
from config.settings import settings

# Import market module components
try:
    from app.ai.modules.market.person_tracking import PersonTracker
    from app.ai.modules.market.shelf_interaction import ShelfInteractionDetector
    from app.ai.modules.market.temporal_filter import TemporalFilter
    from app.ai.modules.market.pose_concealment import PoseConcealmentDetector
    from app.ai.modules.market.zone_logic import ZoneLogic
    from app.ai.modules.market.risk_engine import RiskEngine
    from app.ai.modules.market.event_dispatcher import EventDispatcher
except ImportError as e:
    logger.error(f"Failed to import market module components: {e}")
    raise


class MarketModule(BaseAIModule):
    """
    Market Module - Suspicious Behavior & Loss Prevention
    
    Multi-stage AI pipeline:
    1. Person Detection & Tracking
    2. Shelf Interaction Detection
    3. Temporal Filtering
    4. Pose-Based Concealment Detection
    5. Zone Logic
    6. Risk Scoring Engine
    7. Event Dispatcher
    """
    
    def __init__(self, confidence_threshold: float = 0.5):
        super().__init__(
            module_id="market",
            module_name="Market - Suspicious Behavior Detection",
            confidence_threshold=confidence_threshold
        )
        
        # Load configuration
        self.config = self._load_config()
        
        # Initialize pipeline components
        self._person_tracker = None
        self._shelf_interaction = None
        self._temporal_filter = None
        self._pose_concealment = None
        self._zone_logic = None
        self._risk_engine = None
        self._event_dispatcher = None
        
        # Per-camera zone definitions
        self._zones: Dict[str, Dict] = {}  # camera_id -> {zone_name: polygon}
    
    def _load_config(self) -> Dict:
        """Load configuration from YAML file"""
        try:
            config_path = Path(__file__).parent / "market" / "config.yaml"
            if config_path.exists():
                with open(config_path, 'r') as f:
                    config = yaml.safe_load(f)
                    logger.info("Market module config loaded")
                    return config
            else:
                logger.warning(f"Market config not found at {config_path}, using defaults")
                return {}
        except Exception as e:
            logger.error(f"Error loading market config: {e}")
            return {}
    
    def initialize(self) -> bool:
        """Initialize all pipeline components"""
        try:
            # Initialize components with config
            detection_config = self.config.get('detection', {})
            tracking_config = self.config.get('tracking', {})
            
            # Stage 1: Person Tracking
            self._person_tracker = PersonTracker(
                confidence_threshold=detection_config.get('person_confidence', 0.5),
                track_expiry=tracking_config.get('track_expiry', 300)
            )
            if not self._person_tracker.initialize():
                logger.warning("Person Tracker initialization failed - module will be limited")
            
            # Stage 2: Shelf Interaction
            self._shelf_interaction = ShelfInteractionDetector(
                interaction_time=detection_config.get('shelf_interaction_time', 2.0),
                overlap_threshold=detection_config.get('shelf_interaction_overlap', 0.3),
                confidence_threshold=detection_config.get('person_confidence', 0.5)
            )
            if not self._shelf_interaction.initialize():
                logger.warning("Shelf Interaction Detector initialization failed - module will be limited")
            
            # Stage 3: Temporal Filter
            self._temporal_filter = TemporalFilter(
                min_tracking_duration=detection_config.get('min_tracking_duration', 3.0),
                max_track_gap=detection_config.get('max_track_gap', 1.0)
            )
            
            # Stage 4: Pose Concealment
            concealment_config = detection_config.get('concealment_zones', ['pocket', 'waist', 'bag'])
            self._pose_concealment = PoseConcealmentDetector(
                confidence_threshold=detection_config.get('concealment_confidence', 0.7),
                concealment_zones=concealment_config
            )
            if not self._pose_concealment.initialize():
                logger.warning("Pose Concealment Detector initialization failed - module will be limited")
            
            # Stage 5: Zone Logic
            self._zone_logic = ZoneLogic()
            
            # Stage 6: Risk Engine
            self._risk_engine = RiskEngine(config=self.config)
            
            # Stage 7: Event Dispatcher
            self._event_dispatcher = EventDispatcher(config=self.config)
            
            self._initialized = True
            logger.info("Market Module initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Market Module: {e}")
            self._initialized = False
            return False
    
    def process_frame(
        self,
        frame: np.ndarray,
        camera_id: str,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Process frame through multi-stage pipeline
        
        Args:
            frame: Input frame
            camera_id: Camera identifier
            metadata: Optional metadata (zones, etc.)
            
        Returns:
            {
                'detections': [...],
                'events': [...],
                'alerts': [...],
                'metadata': {...}
            }
        """
        if not self.is_enabled():
            return {'detections': [], 'events': [], 'alerts': []}
        
        results = {
            'detections': [],
            'events': [],
            'alerts': [],
        }
        
        try:
            # Update zones from metadata
            if metadata and 'zones' in metadata:
                self._zones[camera_id] = metadata['zones']
            
            zones = self._zones.get(camera_id, {})
            
            # Extract shelf zones
            shelf_zones = [
                {'name': name, 'polygon': polygon}
                for name, polygon in zones.items()
                if 'shelf' in name.lower()
            ]
            
            # Stage 1: Person Detection & Tracking
            tracked_persons = []
            if self._person_tracker:
                try:
                    tracked_persons = self._person_tracker.process_frame(
                        frame, camera_id, zones
                    )
                except Exception as e:
                    logger.error(f"Person tracking error: {e}")
                    if not self.config.get('behavior', {}).get('graceful_failure', True):
                        raise
            
            if not tracked_persons:
                return results
            
            # Stage 2: Shelf Interaction Detection
            interactions = []
            if self._shelf_interaction:
                try:
                    interactions = self._shelf_interaction.process_frame(
                        frame, camera_id, tracked_persons, shelf_zones
                    )
                except Exception as e:
                    logger.error(f"Shelf interaction error: {e}")
                    if not self.config.get('behavior', {}).get('graceful_failure', True):
                        raise
            
            # Stage 3: Temporal Filtering
            filtered_interactions = []
            if self._temporal_filter:
                try:
                    filtered_interactions = self._temporal_filter.filter_interactions(
                        camera_id, tracked_persons, interactions
                    )
                except Exception as e:
                    logger.error(f"Temporal filtering error: {e}")
                    if not self.config.get('behavior', {}).get('graceful_failure', True):
                        raise
            else:
                filtered_interactions = interactions
            
            # Stage 4: Pose-Based Concealment Detection
            concealments = []
            if self._pose_concealment:
                try:
                    concealments = self._pose_concealment.process_frame(
                        frame, camera_id, tracked_persons, filtered_interactions
                    )
                except Exception as e:
                    logger.error(f"Pose concealment error: {e}")
                    if not self.config.get('behavior', {}).get('graceful_failure', True):
                        raise
            
            # Stage 5: Zone Logic
            zone_events = []
            if self._zone_logic:
                try:
                    zone_events = self._zone_logic.process_zones(
                        camera_id, tracked_persons, filtered_interactions
                    )
                except Exception as e:
                    logger.error(f"Zone logic error: {e}")
                    if not self.config.get('behavior', {}).get('graceful_failure', True):
                        raise
            
            # Stage 6: Risk Scoring
            actions = []
            if filtered_interactions:
                actions.append('object_pick')
            if concealments:
                actions.append('concealment')
            if zone_events:
                actions.append('exit_without_checkout')
            
            risk_result = None
            if self._risk_engine:
                try:
                    risk_result = self._risk_engine.calculate_risk_score(
                        actions, filtered_interactions, concealments, zone_events
                    )
                except Exception as e:
                    logger.error(f"Risk scoring error: {e}")
                    if not self.config.get('behavior', {}).get('graceful_failure', True):
                        raise
            
            # Stage 7: Event Dispatcher
            if risk_result and self._risk_engine.should_generate_alert(risk_result['risk_level']):
                # Get track_id from first interaction or tracked person
                track_id = 0
                if filtered_interactions:
                    track_id = filtered_interactions[0].get('track_id', 0)
                elif tracked_persons:
                    track_id = tracked_persons[0].get('track_id', 0)
                
                # Get person bbox for snapshot
                person_bbox = None
                for person in tracked_persons:
                    if person.get('track_id') == track_id:
                        person_bbox = person.get('bbox')
                        break
                
                # Create event
                if self._event_dispatcher:
                    event = self._event_dispatcher.create_event(
                        module='market',
                        event_type='suspicious_behavior',
                        risk_score=risk_result['risk_score'],
                        risk_level=risk_result['risk_level'],
                        track_id=track_id,
                        camera_id=camera_id,
                        confidence=risk_result['confidence'],
                        actions=actions,
                        metadata={
                            'contributing_factors': risk_result['contributing_factors'],
                            'interactions_count': len(filtered_interactions),
                            'concealments_count': len(concealments),
                            'zone_events_count': len(zone_events),
                        }
                    )
                    
                    # Capture snapshot
                    snapshot = None
                    if self._event_dispatcher:
                        snapshot = self._event_dispatcher.capture_snapshot(
                            frame, event, person_bbox
                        )
                    
                    if snapshot is not None:
                        event['snapshot'] = snapshot
                    
                    results['events'].append(event)
                    
                    # Create alert
                    alert = self._event_dispatcher.create_alert(event)
                    results['alerts'].append(alert)
                    
                    # Add detection metadata
                    results['detections'].append({
                        'type': 'suspicious_behavior',
                        'track_id': track_id,
                        'risk_score': risk_result['risk_score'],
                        'risk_level': risk_result['risk_level'],
                        'camera_id': camera_id,
                        'timestamp': datetime.utcnow().isoformat(),
                    })
        
        except Exception as e:
            logger.error(f"Error processing frame in Market Module: {e}")
            if not self.config.get('behavior', {}).get('graceful_failure', True):
                raise
        
        return results
    
    def cleanup(self):
        """Cleanup all resources"""
        if self._person_tracker:
            self._person_tracker.cleanup()
        if self._shelf_interaction:
            self._shelf_interaction.cleanup()
        if self._temporal_filter:
            self._temporal_filter.cleanup()
        if self._pose_concealment:
            self._pose_concealment.cleanup()
        if self._zone_logic:
            self._zone_logic.cleanup()
        
        self._person_tracker = None
        self._shelf_interaction = None
        self._temporal_filter = None
        self._pose_concealment = None
        self._zone_logic = None
        self._risk_engine = None
        self._event_dispatcher = None
        
        super().cleanup()
