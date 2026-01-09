"""
Base AI Module
All AI modules inherit from this base class
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
import numpy as np
from loguru import logger


class BaseAIModule(ABC):
    """
    Base class for all AI processing modules
    All modules must implement process_frame method
    """
    
    def __init__(self, module_id: str, module_name: str, confidence_threshold: float = 0.5):
        self.module_id = module_id
        self.module_name = module_name
        self.confidence_threshold = confidence_threshold
        self.enabled = False
        self._initialized = False

    @abstractmethod
    def initialize(self) -> bool:
        """
        Initialize the AI module (load models, etc.)
        Returns True if successful
        """
        pass

    @abstractmethod
    def process_frame(
        self, 
        frame: np.ndarray, 
        camera_id: str,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Process a single frame
        
        Args:
            frame: OpenCV frame (numpy array)
            camera_id: Camera identifier
            metadata: Optional metadata (faces database, vehicles database, etc.)
            
        Returns:
            Dict with results:
            {
                'detections': [...],
                'events': [...],
                'alerts': [...],
                'metadata': {...}
            }
        """
        pass

    def enable(self):
        """Enable the module"""
        if not self._initialized:
            if self.initialize():
                self.enabled = True
                logger.info(f"AI Module '{self.module_name}' enabled")
            else:
                logger.error(f"Failed to initialize AI Module '{self.module_name}'")
        else:
            self.enabled = True

    def disable(self):
        """Disable the module"""
        self.enabled = False
        logger.info(f"AI Module '{self.module_name}' disabled")

    def is_enabled(self) -> bool:
        """Check if module is enabled"""
        return self.enabled and self._initialized

    def set_confidence_threshold(self, threshold: float):
        """Update confidence threshold"""
        self.confidence_threshold = max(0.0, min(1.0, threshold))
        logger.debug(f"Module '{self.module_name}' confidence threshold: {self.confidence_threshold}")

    def cleanup(self):
        """Cleanup resources"""
        self.enabled = False
        self._initialized = False



