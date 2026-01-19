"""
HMAC Signer
Implements HMAC-SHA256 signing for Cloud API requests
"""
import hmac
import hashlib
import time
import uuid
import threading
from typing import Dict, Optional
from loguru import logger


class HMACSigner:
    """Handles HMAC signature generation for Edge Server requests"""
    
    # Class-level nonce counter and lock for thread-safe unique nonce generation
    _nonce_counter = 0
    _nonce_lock = threading.Lock()
    _last_timestamp = 0
    
    def __init__(self, edge_key: str, edge_secret: str):
        self.edge_key = edge_key
        self.edge_secret = edge_secret
    
    def generate_signature(
        self,
        method: str,
        path: str,
        body: bytes = b"",
        timestamp: Optional[int] = None
    ) -> Dict[str, str]:
        """
        Generate HMAC signature for a request
        
        Args:
            method: HTTP method (GET, POST, etc.)
            path: Request path (e.g., /api/v1/edges/heartbeat)
            body: Request body as bytes
            timestamp: Unix timestamp (defaults to current time)
        
        Returns:
            Dict with headers: X-EDGE-KEY, X-EDGE-TIMESTAMP, X-EDGE-SIGNATURE, X-EDGE-NONCE
        """
        if timestamp is None:
            timestamp = int(time.time())
        
        # Generate unique nonce for replay protection (required by Cloud)
        # CRITICAL: Use timestamp + counter + UUID to ensure absolute uniqueness
        # even under high concurrency or retry scenarios
        with HMACSigner._nonce_lock:
            current_timestamp = time.time_ns()  # Nanosecond precision
            
            # Reset counter if timestamp changed (new second)
            if current_timestamp // 1_000_000_000 != HMACSigner._last_timestamp // 1_000_000_000:
                HMACSigner._nonce_counter = 0
            
            HMACSigner._nonce_counter += 1
            HMACSigner._last_timestamp = current_timestamp
            
            # Combine timestamp (ns), counter, and UUID for absolute uniqueness
            nonce = f"{current_timestamp}-{HMACSigner._nonce_counter}-{uuid.uuid4().hex[:16]}"
        
        # Calculate body hash
        body_hash = hashlib.sha256(body).hexdigest()
        
        # Construct message: method|path|timestamp|body_hash
        # NOTE: Cloud uses request.path() which includes full path without query string
        message = f"{method}|{path}|{timestamp}|{body_hash}"
        
        # Generate HMAC signature
        signature = hmac.new(
            self.edge_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return {
            "X-EDGE-KEY": self.edge_key,
            "X-EDGE-TIMESTAMP": str(timestamp),
            "X-EDGE-SIGNATURE": signature,
            "X-EDGE-NONCE": nonce,
        }
    
    def verify_timestamp(self, timestamp: int, window_seconds: int = 300) -> bool:
        """
        Verify timestamp is within acceptable window (default 5 minutes)
        
        Args:
            timestamp: Timestamp to verify
            window_seconds: Acceptable time window in seconds
        
        Returns:
            True if timestamp is within window
        """
        current_time = int(time.time())
        time_diff = abs(current_time - timestamp)
        return time_diff <= window_seconds
