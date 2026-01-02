"""
Error Store
Manages error logging and retrieval for Errors page
"""
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
from collections import deque
from loguru import logger


class ErrorStore:
    """Stores and retrieves errors for display in UI"""
    
    MAX_ERRORS = 100
    
    def __init__(self, logs_dir: Optional[Path] = None):
        if logs_dir is None:
            self.logs_dir = Path(__file__).parent.parent.parent / "logs"
        else:
            self.logs_dir = Path(logs_dir)
        
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        self.errors_file = self.logs_dir / "errors.log"
        self._errors: deque = deque(maxlen=self.MAX_ERRORS)
        self._load_errors()
    
    def _load_errors(self):
        """Load errors from log file"""
        if self.errors_file.exists():
            try:
                with open(self.errors_file, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    # Read last MAX_ERRORS lines
                    for line in lines[-self.MAX_ERRORS:]:
                        try:
                            error_data = json.loads(line.strip())
                            self._errors.append(error_data)
                        except json.JSONDecodeError:
                            # Skip invalid JSON lines
                            continue
            except Exception as e:
                logger.warning(f"Failed to load errors from file: {e}")
    
    def add_error(
        self,
        module: str,
        message: str,
        exception: Optional[Exception] = None,
        stack_trace: Optional[str] = None
    ):
        """
        Add an error to the store
        
        Args:
            module: Module name (heartbeat, cloud, command, auth, etc.)
            message: Error message
            exception: Exception object (optional)
            stack_trace: Stack trace string (optional)
        """
        error_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "module": module,
            "message": message,
            "stack_trace": stack_trace or (str(exception) if exception else None),
        }
        
        # Add to in-memory store
        self._errors.append(error_data)
        
        # Write to log file
        try:
            with open(self.errors_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(error_data, ensure_ascii=False) + '\n')
        except Exception as e:
            logger.error(f"Failed to write error to file: {e}")
        
        logger.error(f"[{module}] {message}")
    
    def get_errors(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get recent errors
        
        Args:
            limit: Maximum number of errors to return
        
        Returns:
            List of error dictionaries
        """
        return list(self._errors)[-limit:]
    
    def clear_errors(self):
        """Clear all errors"""
        self._errors.clear()
        if self.errors_file.exists():
            try:
                self.errors_file.unlink()
            except Exception as e:
                logger.warning(f"Failed to delete errors file: {e}")
    
    def get_error_count(self) -> int:
        """Get total number of stored errors"""
        return len(self._errors)
