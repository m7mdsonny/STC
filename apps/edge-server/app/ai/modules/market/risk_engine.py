"""
Risk Scoring Engine
Core intelligence of Market Module
Implements weighted scoring (NOT IF/ELSE logic)
"""
from typing import Dict, List, Optional
from datetime import datetime
from loguru import logger


class RiskEngine:
    """
    Weighted Risk Scoring Engine
    
    Scoring is based on multiple weak signals with configurable weights.
    NOT simple IF/ELSE logic.
    """
    
    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize risk engine with configuration
        
        Args:
            config: Configuration dict with weights and thresholds
        """
        # Default weights
        self.weights = {
            'object_picked': 30,
            'object_not_returned': 15,
            'concealment_motion': 40,
            'exit_without_checkout': 35,
        }
        
        # Default thresholds
        self.thresholds = {
            'low': 0,
            'medium': 60,
            'high': 90,
            'critical': 110,
        }
        
        # Load from config if provided
        if config:
            if 'risk_weights' in config:
                self.weights.update(config['risk_weights'])
            if 'risk_thresholds' in config:
                self.thresholds.update(config['risk_thresholds'])
    
    def calculate_risk_score(
        self,
        actions: List[str],
        interactions: List[Dict],
        concealments: List[Dict],
        zone_events: List[Dict]
    ) -> Dict:
        """
        Calculate weighted risk score
        
        Args:
            actions: List of action types detected
            interactions: List of interaction detections
            concealments: List of concealment detections
            zone_events: List of zone-based events
            
        Returns:
            {
                'risk_score': int,
                'risk_level': str,  # low, medium, high, critical
                'contributing_factors': List[str],
                'confidence': float
            }
        """
        score = 0
        contributing_factors = []
        
        # Object picked
        if 'object_pick' in actions or any(i.get('action') == 'object_pick' for i in interactions):
            score += self.weights['object_picked']
            contributing_factors.append('object_picked')
        
        # Object not returned (assumed if picked and not at checkout)
        object_picks = [i for i in interactions if i.get('action') == 'object_pick']
        if object_picks:
            # Check if person visited checkout
            has_checkout = any('checkout' in str(e.get('zones_visited', [])).lower() for e in zone_events)
            if not has_checkout:
                score += self.weights['object_not_returned']
                contributing_factors.append('object_not_returned')
        
        # Concealment motion
        if concealments:
            score += self.weights['concealment_motion']
            contributing_factors.append('concealment_motion')
        
        # Exit without checkout
        exit_events = [e for e in zone_events if e.get('event') == 'exit_without_checkout']
        if exit_events:
            score += self.weights['exit_without_checkout']
            contributing_factors.append('exit_without_checkout')
        
        # Determine risk level
        risk_level = self._determine_risk_level(score)
        
        # Calculate confidence based on number of factors
        confidence = min(0.95, 0.5 + (len(contributing_factors) * 0.15))
        
        return {
            'risk_score': score,
            'risk_level': risk_level,
            'contributing_factors': contributing_factors,
            'confidence': confidence,
        }
    
    def _determine_risk_level(self, score: int) -> str:
        """Determine risk level from score"""
        if score >= self.thresholds['critical']:
            return 'critical'
        elif score >= self.thresholds['high']:
            return 'high'
        elif score >= self.thresholds['medium']:
            return 'medium'
        else:
            return 'low'
    
    def should_generate_alert(self, risk_level: str) -> bool:
        """Determine if alert should be generated"""
        # Only High and Critical generate alerts
        return risk_level in ['high', 'critical']
    
    def get_risk_description(self, risk_level: str) -> str:
        """Get human-readable risk description"""
        descriptions = {
            'low': 'Low Risk - Normal behavior observed',
            'medium': 'Medium Risk - Some suspicious activity detected',
            'high': 'High Risk - Suspicious behavior detected',
            'critical': 'Critical Risk - Multiple suspicious behaviors detected',
        }
        return descriptions.get(risk_level, 'Unknown Risk Level')
