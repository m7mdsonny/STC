"""
Face Recognition Module
Detects and recognizes faces in video frames
"""
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime
from loguru import logger

from app.ai.base import BaseAIModule
from config.settings import settings


class FaceRecognitionModule(BaseAIModule):
    """
    Face Recognition AI Module
    Detects faces and matches them against registered faces database
    """
    
    def __init__(self, confidence_threshold: float = 0.6):
        super().__init__(
            module_id="face",
            module_name="Face Recognition",
            confidence_threshold=confidence_threshold
        )
        self.face_database: Dict[str, Dict] = {}  # face_id -> face_data
        self._model = None

    def initialize(self) -> bool:
        """Initialize face recognition model"""
        try:
            import face_recognition
            import cv2
            
            # Load face recognition models
            # face_recognition uses dlib's HOG + Linear SVM for detection
            # and dlib's face recognition model for encoding
            
            self._face_recognition = face_recognition
            self._cv2 = cv2
            
            # Pre-load models (they load on first use)
            logger.info("Face Recognition module initialized with face_recognition library")
            self._initialized = True
            return True
        except ImportError:
            logger.warning("face_recognition library not installed. Install with: pip install face-recognition dlib")
            logger.warning("Falling back to OpenCV face detection only")
            try:
                import cv2
                # Load OpenCV DNN face detector as fallback
                self._cv2 = cv2
                self._face_recognition = None
                self._face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
                if self._face_detector.empty():
                    logger.error("Failed to load OpenCV face detector")
                    return False
                logger.info("Face Recognition module initialized with OpenCV (detection only)")
                self._initialized = True
                return True
            except Exception as e:
                logger.error(f"Failed to initialize Face Recognition: {e}")
                return False
        except Exception as e:
            logger.error(f"Failed to initialize Face Recognition: {e}")
            return False

    def process_frame(
        self,
        frame: np.ndarray,
        camera_id: str,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Process frame for face detection and recognition
        
        Args:
            frame: Video frame
            camera_id: Camera ID
            metadata: Should contain 'faces_database' with registered faces
            
        Returns:
            Dict with detections, events, and alerts
        """
        if not self.is_enabled():
            return {'detections': [], 'events': [], 'alerts': []}

        # Update face database from metadata if provided
        if metadata and 'faces_database' in metadata:
            self.face_database = {
                face.get('id'): face
                for face in metadata.get('faces_database', [])
            }

        results = {
            'detections': [],
            'events': [],
            'alerts': [],
        }

        try:
            # TODO: Replace with actual face detection and recognition
            # Example workflow:
            # 1. Detect faces in frame using face detector
            # 2. Extract face embeddings for each detected face
            # 3. Compare embeddings with registered faces database
            # 4. Match faces with confidence scores
            # 5. Generate events/alerts for recognized faces
            
            # Placeholder implementation
            # In production, use libraries like:
            # - face_recognition.compare_faces()
            # - InsightFace model inference
            # - Custom trained models
            
            detected_faces = self._detect_faces(frame)
            
            for face_data in detected_faces:
                # Try to recognize face
                recognized = self._recognize_face(face_data, frame)
                
                detection = {
                    'type': 'face',
                    'camera_id': camera_id,
                    'timestamp': datetime.utcnow().isoformat(),
                    'bbox': face_data.get('bbox'),
                    'confidence': face_data.get('confidence', 0.0),
                    'recognized': recognized is not None,
                }
                
                if recognized:
                    detection['person_id'] = recognized.get('person_id')
                    detection['person_name'] = recognized.get('person_name')
                    detection['match_confidence'] = recognized.get('confidence')
                    
                    # Create event for recognized face
                    results['events'].append({
                        'type': 'face_recognized',
                        'camera_id': camera_id,
                        'person_id': recognized.get('person_id'),
                        'person_name': recognized.get('person_name'),
                        'confidence': recognized.get('confidence'),
                        'timestamp': datetime.utcnow().isoformat(),
                    })
                else:
                    # Unknown face detected
                    detection['person_id'] = None
                    detection['person_name'] = 'Unknown'
                    
                    # Create alert for unknown face (if configured)
                    if face_data.get('confidence', 0) > self.confidence_threshold:
                        results['alerts'].append({
                            'type': 'unknown_face',
                            'camera_id': camera_id,
                            'severity': 'medium',
                            'title': 'Unknown Face Detected',
                            'description': f'Unknown face detected in camera {camera_id}',
                            'timestamp': datetime.utcnow().isoformat(),
                            'metadata': {
                                'bbox': face_data.get('bbox'),
                                'confidence': face_data.get('confidence'),
                            }
                        })

                results['detections'].append(detection)

        except Exception as e:
            logger.error(f"Error processing frame in Face Recognition: {e}")

        return results

    def _detect_faces(self, frame: np.ndarray) -> List[Dict]:
        """
        Detect faces in frame
        
        Returns:
            List of face detections with bbox and confidence
        """
        faces = []
        
        try:
            if self._face_recognition:
                # Use face_recognition library (more accurate)
                rgb_frame = self._cv2.cvtColor(frame, self._cv2.COLOR_BGR2RGB)
                face_locations = self._face_recognition.face_locations(rgb_frame, model='hog')
                
                for top, right, bottom, left in face_locations:
                    faces.append({
                        'bbox': [left, top, right - left, bottom - top],
                        'confidence': 0.95,  # face_recognition doesn't provide confidence
                        'location': (top, right, bottom, left)  # For encoding
                    })
            else:
                # Fallback to OpenCV
                gray = self._cv2.cvtColor(frame, self._cv2.COLOR_BGR2GRAY)
                face_rects = self._face_detector.detectMultiScale(
                    gray,
                    scaleFactor=1.1,
                    minNeighbors=5,
                    minSize=(30, 30)
                )
                
                for (x, y, w, h) in face_rects:
                    faces.append({
                        'bbox': [int(x), int(y), int(w), int(h)],
                        'confidence': 0.85,  # OpenCV doesn't provide confidence
                        'location': None
                    })
        except Exception as e:
            logger.error(f"Error detecting faces: {e}")
        
        return faces

    def _recognize_face(self, face_data: Dict, frame: np.ndarray) -> Optional[Dict]:
        """
        Recognize a detected face against database
        
        Returns:
            Dict with person_id, person_name, confidence if matched, else None
        """
        if not self._face_recognition or not face_data.get('location'):
            return None
        
        if not self.face_database:
            return None
        
        try:
            rgb_frame = self._cv2.cvtColor(frame, self._cv2.COLOR_BGR2RGB)
            top, right, bottom, left = face_data['location']
            
            # Extract face encoding
            face_encoding = self._face_recognition.face_encodings(
                rgb_frame,
                [(top, right, bottom, left)]
            )
            
            if not face_encoding:
                return None
            
            face_encoding = face_encoding[0]
            
            # Compare with database
            best_match = None
            best_distance = float('inf')
            
            for person_id, person_data in self.face_database.items():
                stored_encoding = person_data.get('embedding')
                if not stored_encoding:
                    continue
                
                # Convert list to numpy array if needed
                if isinstance(stored_encoding, list):
                    stored_encoding = np.array(stored_encoding)
                
                # Calculate distance
                distance = self._face_recognition.face_distance([stored_encoding], face_encoding)[0]
                
                if distance < best_distance:
                    best_distance = distance
                    best_match = {
                        'person_id': person_id,
                        'person_name': person_data.get('name', 'Unknown'),
                        'confidence': 1.0 - distance,  # Convert distance to confidence
                        'distance': distance
                    }
            
            # Return match if confidence is above threshold
            if best_match and best_match['confidence'] > self.confidence_threshold:
                return best_match
            
        except Exception as e:
            logger.error(f"Error recognizing face: {e}")
        
        return None

    def add_face_to_database(self, person_id: str, person_name: str, face_image: np.ndarray):
        """Add a face to the recognition database from image"""
        try:
            if self._face_recognition:
                rgb_image = self._cv2.cvtColor(face_image, self._cv2.COLOR_BGR2RGB)
                face_encodings = self._face_recognition.face_encodings(rgb_image)
                
                if face_encodings:
                    embedding = face_encodings[0]
                    self.face_database[person_id] = {
                        'id': person_id,
                        'name': person_name,
                        'embedding': embedding.tolist(),  # Convert to list for JSON serialization
                    }
                    logger.info(f"Added face to database: {person_name} ({person_id})")
                    return True
                else:
                    logger.warning(f"No face found in image for {person_name}")
                    return False
            else:
                logger.warning("Face recognition not available - cannot add face to database")
                return False
        except Exception as e:
            logger.error(f"Error adding face to database: {e}")
            return False

