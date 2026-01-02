"""
Cloud Client
Handles all communication with Cloud API using HMAC authentication
"""
import httpx
import asyncio
from typing import Optional, Dict, Any, Tuple
from loguru import logger

from .signer import HMACSigner
from .error_store import ErrorStore


class CloudClient:
    """Manages all Cloud API communication with HMAC authentication"""
    
    def __init__(self, base_url: str, edge_key: str, edge_secret: str, error_store: ErrorStore):
        self.base_url = base_url.rstrip('/')
        self.signer = HMACSigner(edge_key, edge_secret)
        self.error_store = error_store
        self.client: Optional[httpx.AsyncClient] = None
        self._connected = False
    
    async def connect(self) -> bool:
        """Initialize HTTP client"""
        try:
            self.client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=30.0,
                follow_redirects=True
            )
            self._connected = True
            return True
        except Exception as e:
            self.error_store.add_error("cloud", f"Failed to initialize client: {e}", e)
            return False
    
    async def disconnect(self):
        """Close HTTP client"""
        if self.client:
            await self.client.aclose()
            self.client = None
        self._connected = False
    
    async def _request(
        self,
        method: str,
        path: str,
        json_data: Optional[Dict[str, Any]] = None,
        retry: bool = False
    ) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Make authenticated request to Cloud API
        
        Args:
            method: HTTP method
            path: API path
            json_data: Request body (optional)
            retry: Whether to retry on failure
        
        Returns:
            Tuple of (success, response_data)
        """
        if not self.client:
            await self.connect()
        
        if not self.client:
            return False, None
        
        # Prepare body
        body = b""
        if json_data:
            import json
            body = json.dumps(json_data, ensure_ascii=False).encode('utf-8')
        
        # Generate HMAC signature
        headers = self.signer.generate_signature(method, path, body)
        headers["Content-Type"] = "application/json"
        headers["Accept"] = "application/json"
        
        try:
            response = await self.client.request(
                method,
                path,
                headers=headers,
                content=body if body else None
            )
            
            if response.status_code in (200, 201):
                try:
                    data = response.json()
                    return True, data
                except Exception:
                    return True, {"status": "success"}
            elif response.status_code == 401:
                error_msg = "Authentication failed - check edge_key and edge_secret"
                self.error_store.add_error("auth", error_msg)
                return False, {"error": error_msg}
            else:
                error_msg = f"Cloud API error: {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg = error_data.get("message", error_msg)
                except Exception:
                    pass
                self.error_store.add_error("cloud", error_msg)
                return False, {"error": error_msg}
        
        except httpx.TimeoutException:
            error_msg = "Request timeout - Cloud API not responding"
            self.error_store.add_error("cloud", error_msg)
            return False, {"error": error_msg}
        except Exception as e:
            error_msg = f"Request failed: {str(e)}"
            self.error_store.add_error("cloud", error_msg, e)
            return False, {"error": error_msg}
    
    async def test_connection(self) -> Tuple[bool, Optional[str]]:
        """
        Test connection to Cloud API
        
        Returns:
            Tuple of (success, error_message)
        """
        # Try to get cameras endpoint (requires HMAC auth)
        success, data = await self._request("GET", "/api/v1/edges/cameras")
        
        if success:
            return True, None
        else:
            error = data.get("error", "Connection test failed") if data else "Connection test failed"
            return False, error
    
    async def send_heartbeat(
        self,
        version: str,
        online: bool = True,
        system_info: Optional[Dict[str, Any]] = None,
        cameras_status: Optional[list] = None
    ) -> bool:
        """
        Send heartbeat to Cloud
        
        Args:
            version: Edge Server version
            online: Online status
            system_info: System information dict
            cameras_status: List of camera status dicts
        
        Returns:
            True if successful
        """
        payload = {
            "version": version,
            "online": online,
        }
        
        if system_info:
            payload["system_info"] = system_info
        
        if cameras_status:
            payload["cameras_status"] = cameras_status
        
        success, _ = await self._request("POST", "/api/v1/edges/heartbeat", json_data=payload)
        return success
    
    async def get_cameras(self) -> Tuple[bool, list]:
        """
        Get cameras from Cloud
        
        Returns:
            Tuple of (success, cameras_list)
        """
        success, data = await self._request("GET", "/api/v1/edges/cameras")
        
        if success and data:
            cameras = data.get("cameras", [])
            return True, cameras
        else:
            return False, []
    
    async def send_event(self, event_data: Dict[str, Any]) -> bool:
        """
        Send event to Cloud
        
        Args:
            event_data: Event data dictionary
        
        Returns:
            True if successful
        """
        success, _ = await self._request("POST", "/api/v1/edges/events", json_data=event_data)
        return success
