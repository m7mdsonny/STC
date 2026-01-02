"""
AI Module Manager
Manages all AI processing modules
"""
from typing import Dict, List, Optional, Any
import numpy as np
from loguru import logger

from app.ai.base import BaseAIModule
from config.settings import settings


class AIModuleManager:
    """
    Manages all AI processing modules
    Loads, enables/disables, and processes frames through modules
    """
    
    def __init__(self):
        self.modules: Dict[str, BaseAIModule] = {}
        self._load_modules()

    def _load_modules(self):
        """Load all available AI modules"""
        try:
            # Import all modules
            from app.ai.modules.face_recognition import FaceRecognitionModule
            from app.ai.modules.people_counter import PeopleCounterModule
            from app.ai.modules.fire_detection import FireDetectionModule
            from app.ai.modules.intrusion_detection import IntrusionDetectionModule
            from app.ai.modules.vehicle_recognition import VehicleRecognitionModule
            from app.ai.modules.attendance import AttendanceModule
            from app.ai.modules.loitering import LoiteringDetectionModule
            from app.ai.modules.crowd_detection import CrowdDetectionModule
            from app.ai.modules.object_detection import ObjectDetectionModule
            from app.ai.modules.market import MarketModule

            # Register modules
            self.modules['face'] = FaceRecognitionModule(
                confidence_threshold=settings.FACE_CONFIDENCE
            )
            self.modules['counter'] = PeopleCounterModule(
                confidence_threshold=settings.OBJECT_CONFIDENCE
            )
            self.modules['fire'] = FireDetectionModule(
                confidence_threshold=settings.FIRE_CONFIDENCE
            )
            self.modules['intrusion'] = IntrusionDetectionModule(
                confidence_threshold=settings.OBJECT_CONFIDENCE
            )
            self.modules['vehicle'] = VehicleRecognitionModule(
                confidence_threshold=settings.OBJECT_CONFIDENCE
            )
            self.modules['attendance'] = AttendanceModule(
                confidence_threshold=settings.FACE_CONFIDENCE
            )
            self.modules['loitering'] = LoiteringDetectionModule(
                confidence_threshold=settings.OBJECT_CONFIDENCE
            )
            self.modules['crowd'] = CrowdDetectionModule(
                confidence_threshold=settings.OBJECT_CONFIDENCE
            )
            self.modules['object'] = ObjectDetectionModule(
                confidence_threshold=settings.OBJECT_CONFIDENCE
            )
            self.modules['market'] = MarketModule(
                confidence_threshold=settings.OBJECT_CONFIDENCE
            )

            logger.info(f"Loaded {len(self.modules)} AI modules")
        except ImportError as e:
            logger.warning(f"Some AI modules could not be loaded: {e}")
            logger.warning("AI processing will be limited")

    def enable_modules(self, module_ids: List[str]):
        """Enable specific modules"""
        for module_id in module_ids:
            if module_id in self.modules:
                self.modules[module_id].enable()
            else:
                logger.warning(f"Unknown module: {module_id}")

    def disable_modules(self, module_ids: List[str]):
        """Disable specific modules"""
        for module_id in module_ids:
            if module_id in self.modules:
                self.modules[module_id].disable()

    def process_frame(
        self,
        frame: np.ndarray,
        camera_id: str,
        enabled_modules: List[str],
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Process frame through enabled modules
        
        Returns:
            {
                'detections': [...],
                'events': [...],
                'alerts': [...],
                'modules': {...}
            }
        """
        results = {
            'detections': [],
            'events': [],
            'alerts': [],
            'modules': {},
        }

        for module_id in enabled_modules:
            if module_id not in self.modules:
                continue

            module = self.modules[module_id]
            if not module.is_enabled():
                continue

            try:
                module_result = module.process_frame(frame, camera_id, metadata)
                
                # Aggregate results
                if 'detections' in module_result:
                    results['detections'].extend(module_result['detections'])
                
                if 'events' in module_result:
                    results['events'].extend(module_result['events'])
                
                if 'alerts' in module_result:
                    results['alerts'].extend(module_result['alerts'])
                
                results['modules'][module_id] = {
                    'processed': True,
                    'detections_count': len(module_result.get('detections', [])),
                }

            except Exception as e:
                logger.error(f"Error processing frame with module '{module_id}': {e}")
                results['modules'][module_id] = {
                    'processed': False,
                    'error': str(e),
                }

        return results

    def get_module(self, module_id: str) -> Optional[BaseAIModule]:
        """Get a specific module"""
        return self.modules.get(module_id)

    def list_modules(self) -> List[Dict]:
        """List all available modules"""
        return [
            {
                'id': module_id,
                'name': module.module_name,
                'enabled': module.is_enabled(),
            }
            for module_id, module in self.modules.items()
        ]

    def cleanup(self):
        """Cleanup all modules"""
        for module in self.modules.values():
            module.cleanup()
        self.modules.clear()



