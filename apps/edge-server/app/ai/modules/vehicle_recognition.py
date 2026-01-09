"""
Vehicle Recognition Module
Recognizes vehicles and reads license plates
"""
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime
from loguru import logger

from app.ai.base import BaseAIModule
from config.settings import settings


class VehicleRecognitionModule(BaseAIModule):
    """
    Vehicle Recognition AI Module
    Detects vehicles and recognizes license plates
    """
    
    def __init__(self, confidence_threshold: float = 0.5):
        super().__init__(
            module_id="vehicle",
            module_name="Vehicle Recognition",
            confidence_threshold=confidence_threshold
        )
        self.vehicle_database: Dict[str, Dict] = {}  # plate_number -> vehicle_data
        self._vehicle_model = None
        self._plate_reader = None

    def initialize(self) -> bool:
        """Initialize vehicle recognition models"""
        try:
            from ultralytics import YOLO
            import cv2
            
            # Load vehicle detection model
            try:
                self._vehicle_model = YOLO('yolov8n.pt')
                logger.info("Vehicle Recognition module initialized with YOLOv8")
            except Exception as e:
                logger.warning(f"Could not load YOLOv8 model: {e}")
                self._vehicle_model = None
            
            # Load license plate reader
            try:
                import easyocr
                self._plate_reader = easyocr.Reader(['en'], gpu=False)
                logger.info("License plate reader initialized with EasyOCR")
            except ImportError:
                logger.warning("EasyOCR not installed. Install with: pip install easyocr")
                self._plate_reader = None
            except Exception as e:
                logger.warning(f"Could not initialize EasyOCR: {e}")
                self._plate_reader = None
            
            self._cv2 = cv2
            self._initialized = True
            return True
        except ImportError:
            logger.warning("Required libraries not installed")
            self._initialized = False
            return False
        except Exception as e:
            logger.error(f"Failed to initialize Vehicle Recognition: {e}")
            return False

    def process_frame(
        self,
        frame: np.ndarray,
        camera_id: str,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Process frame for vehicle recognition"""
        if not self.is_enabled():
            return {'detections': [], 'events': [], 'alerts': []}

        # Update vehicle database from metadata
        if metadata and 'vehicles_database' in metadata:
            self.vehicle_database = {
                vehicle.get('plate_number'): vehicle
                for vehicle in metadata.get('vehicles_database', [])
            }

        results = {
            'detections': [],
            'events': [],
            'alerts': [],
        }

        try:
            # TODO: Implement vehicle recognition
            # 1. Detect vehicles in frame
            # 2. Extract license plate region
            # 3. Read license plate text
            # 4. Match against database
            
            vehicles = self._detect_vehicles(frame)
            
            for vehicle in vehicles:
                if vehicle.get('confidence', 0) > self.confidence_threshold:
                    # Extract and read license plate
                    plate_text = self._read_license_plate(vehicle, frame)
                    
                    detection = {
                        'type': 'vehicle',
                        'camera_id': camera_id,
                        'timestamp': datetime.utcnow().isoformat(),
                        'bbox': vehicle.get('bbox'),
                        'confidence': vehicle.get('confidence', 0.0),
                        'vehicle_type': vehicle.get('type'),  # car, truck, motorcycle, etc.
                        'license_plate': plate_text,
                    }
                    
                    # Check if vehicle is in database
                    if plate_text and plate_text in self.vehicle_database:
                        vehicle_info = self.vehicle_database[plate_text]
                        detection['vehicle_id'] = vehicle_info.get('id')
                        detection['vehicle_name'] = vehicle_info.get('name')
                        detection['owner'] = vehicle_info.get('owner')
                        
                        # Create event for recognized vehicle
                        results['events'].append({
                            'type': 'vehicle_recognized',
                            'camera_id': camera_id,
                            'vehicle_id': vehicle_info.get('id'),
                            'plate_number': plate_text,
                            'timestamp': datetime.utcnow().isoformat(),
                        })
                    else:
                        # Unknown vehicle
                        detection['vehicle_id'] = None
                        
                        # Create alert for unknown vehicle
                        results['alerts'].append({
                            'type': 'unknown_vehicle',
                            'camera_id': camera_id,
                            'severity': 'medium',
                            'title': 'Unknown Vehicle Detected',
                            'description': f'Unknown vehicle with plate {plate_text} detected',
                            'timestamp': datetime.utcnow().isoformat(),
                            'metadata': {
                                'plate_number': plate_text,
                                'bbox': vehicle.get('bbox'),
                            }
                        })
                    
                    results['detections'].append(detection)

        except Exception as e:
            logger.error(f"Error processing frame in Vehicle Recognition: {e}")

        return results

    def _detect_vehicles(self, frame: np.ndarray) -> List[Dict]:
        """Detect vehicles in frame using YOLOv8"""
        if not self._vehicle_model:
            return []
        
        try:
            # Vehicle classes in COCO: car(2), motorcycle(3), bus(5), truck(7)
            results = self._vehicle_model(frame, classes=[2, 3, 5, 7], conf=self.confidence_threshold, verbose=False)
            
            detections = []
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0].cpu().numpy())
                    class_id = int(box.cls[0].cpu().numpy())
                    
                    # Map class IDs to vehicle types
                    vehicle_types = {2: 'car', 3: 'motorcycle', 5: 'bus', 7: 'truck'}
                    vehicle_type = vehicle_types.get(class_id, 'vehicle')
                    
                    detections.append({
                        'bbox': [int(x1), int(y1), int(x2 - x1), int(y2 - y1)],
                        'confidence': confidence,
                        'type': vehicle_type
                    })
            
            return detections
        except Exception as e:
            logger.error(f"Error detecting vehicles: {e}")
            return []

    def _read_license_plate(self, vehicle: Dict, frame: np.ndarray) -> Optional[str]:
        """Extract and read license plate text"""
        if not self._plate_reader:
            return None
        
        try:
            x, y, w, h = vehicle.get('bbox', [0, 0, 0, 0])
            
            # Extract vehicle region (focus on lower part where plate usually is)
            vehicle_roi = frame[y:y+h, x:x+w]
            if vehicle_roi.size == 0:
                return None
            
            # Focus on lower 30% of vehicle (where license plate is)
            plate_region = vehicle_roi[int(h*0.7):, :]
            
            if plate_region.size == 0:
                return None
            
            # Preprocess for OCR
            gray = self._cv2.cvtColor(plate_region, self._cv2.COLOR_BGR2GRAY)
            # Enhance contrast
            gray = self._cv2.convertScaleAbs(gray, alpha=1.5, beta=30)
            
            # Run OCR
            results = self._plate_reader.readtext(gray)
            
            if results:
                # Get text with highest confidence
                best_result = max(results, key=lambda x: x[2] if len(x) > 2 else 0)
                plate_text = best_result[1] if len(best_result) > 1 else ''
                
                # Clean text (remove spaces, special chars)
                plate_text = ''.join(c for c in plate_text if c.isalnum() or c in '-_')
                
                return plate_text.upper() if plate_text else None
            
            return None
        except Exception as e:
            logger.error(f"Error reading license plate: {e}")
            return None

