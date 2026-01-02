"""
Enterprise Monitoring Service
Fetches scenario configurations from Cloud and sends normalized events
"""
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
from loguru import logger

from .cloud_client import CloudClient
from .config_store import ConfigStore
from .status_service import StatusService
from .error_store import ErrorStore


class EnterpriseMonitoringService:
    """
    Enterprise Monitoring Service for Edge Server
    
    Responsibilities:
    - Fetch scenario configurations from Cloud
    - Cache configurations
    - Detect events based on scenarios
    - Send normalized events to Cloud
    
    Edge MUST NOT:
    - Make alert decisions (Cloud does this)
    - Hardcode business logic
    - Store scenario rules locally
    """
    
    def __init__(
        self,
        cloud_client: CloudClient,
        config: ConfigStore,
        status_service: StatusService,
        error_store: ErrorStore
    ):
        self.cloud_client = cloud_client
        self.config = config
        self.status_service = status_service
        self.error_store = error_store
        
        # Cache for scenario configurations
        self._scenario_cache: Dict[str, Dict] = {}
        self._cache_timestamp: Optional[datetime] = None
        self._cache_ttl_seconds = 300  # 5 minutes cache TTL
        
        # Camera-to-scenario bindings cache
        self._camera_bindings_cache: Dict[str, List[str]] = {}
    
    async def fetch_scenarios(self, organization_id: Optional[int] = None) -> Dict[str, Dict]:
        """
        Fetch active scenario configurations from Cloud
        
        Args:
            organization_id: Organization ID (optional, will use from config)
            
        Returns:
            Dictionary of scenario configurations keyed by scenario_type
        """
        try:
            # Check cache
            if self._is_cache_valid():
                logger.debug("Using cached scenario configurations")
                return self._scenario_cache
            
            # Fetch from Cloud
            # Note: _request method signature may vary, using direct API call
            path = "/api/v1/ai-scenarios"
            if organization_id:
                path += f"?organization_id={organization_id}"
            
            success, response = await self.cloud_client._request(
                "GET",
                path
            )
            
            if not success or not response:
                logger.warning("Failed to fetch scenarios from Cloud")
                return self._scenario_cache  # Return cached if available
            
            # Response is an array of scenarios
            scenarios = response if isinstance(response, list) else (response.get('data', []) if isinstance(response, dict) else [])
            
            # Build cache
            self._scenario_cache = {}
            self._camera_bindings_cache = {}
            
            for scenario in scenarios:
                scenario_type = scenario.get('scenario_type')
                module = scenario.get('module')
                enabled = scenario.get('enabled', False)
                camera_bindings = scenario.get('camera_bindings', [])
                
                if not enabled:
                    continue
                
                # Store scenario config
                cache_key = f"{module}:{scenario_type}"
                self._scenario_cache[cache_key] = {
                    'id': scenario.get('id'),
                    'module': module,
                    'scenario_type': scenario_type,
                    'name': scenario.get('name'),
                    'severity_threshold': scenario.get('severity_threshold', 70),
                    'rules': scenario.get('rules', []),
                }
                
                # Build camera bindings cache
                for binding in camera_bindings:
                    if binding.get('enabled', False):
                        camera_id = binding.get('camera_id')
                        if camera_id:
                            if camera_id not in self._camera_bindings_cache:
                                self._camera_bindings_cache[camera_id] = []
                            self._camera_bindings_cache[camera_id].append(cache_key)
            
            self._cache_timestamp = datetime.utcnow()
            logger.info(f"Fetched {len(self._scenario_cache)} active scenarios from Cloud")
            
            return self._scenario_cache
            
        except Exception as e:
            self.error_store.add_error("enterprise_monitoring", f"Failed to fetch scenarios: {e}", e)
            logger.error(f"Error fetching scenarios: {e}")
            return self._scenario_cache  # Return cached if available
    
    def _is_cache_valid(self) -> bool:
        """Check if cache is still valid"""
        if not self._cache_timestamp or not self._scenario_cache:
            return False
        
        elapsed = (datetime.utcnow() - self._cache_timestamp).total_seconds()
        return elapsed < self._cache_ttl_seconds
    
    def is_scenario_enabled(self, module: str, scenario_type: str, camera_id: str) -> bool:
        """
        Check if scenario is enabled for camera
        
        Args:
            module: Module name ('market' or 'factory')
            scenario_type: Scenario type
            camera_id: Camera identifier
            
        Returns:
            True if scenario is enabled for this camera
        """
        cache_key = f"{module}:{scenario_type}"
        
        # Check if scenario exists in cache
        if cache_key not in self._scenario_cache:
            return False
        
        # Check camera binding
        if camera_id not in self._camera_bindings_cache:
            return False
        
        return cache_key in self._camera_bindings_cache[camera_id]
    
    def create_normalized_event(
        self,
        module: str,
        scenario_type: str,
        camera_id: str,
        risk_signals: Dict[str, Any],
        confidence: float
    ) -> Dict[str, Any]:
        """
        Create normalized enterprise monitoring event
        
        Args:
            module: Module name ('market' or 'factory')
            scenario_type: Scenario type
            camera_id: Camera identifier
            risk_signals: Risk signals detected
            confidence: Detection confidence (0.0-1.0)
            
        Returns:
            Normalized event dictionary
        """
        return {
            "event_type": scenario_type,
            "severity": "medium",  # Default, Cloud will determine actual severity
            "occurred_at": datetime.utcnow().isoformat(),
            "camera_id": camera_id,
            "meta": {
                "module": module,
                "scenario": scenario_type,
                "risk_signals": risk_signals,
                "confidence": confidence,
            }
        }
    
    async def send_enterprise_event(
        self,
        module: str,
        scenario_type: str,
        camera_id: str,
        risk_signals: Dict[str, Any],
        confidence: float
    ) -> bool:
        """
        Send enterprise monitoring event to Cloud
        
        Args:
            module: Module name ('market' or 'factory')
            scenario_type: Scenario type
            camera_id: Camera identifier
            risk_signals: Risk signals detected
            confidence: Detection confidence (0.0-1.0)
            
        Returns:
            True if event was sent successfully
        """
        # Check if scenario is enabled for this camera
        if not self.is_scenario_enabled(module, scenario_type, camera_id):
            logger.debug(f"Scenario {module}:{scenario_type} not enabled for camera {camera_id}")
            return False
        
        # Create normalized event
        event_data = self.create_normalized_event(
            module=module,
            scenario_type=scenario_type,
            camera_id=camera_id,
            risk_signals=risk_signals,
            confidence=confidence
        )
        
        # Send to Cloud
        success = await self.cloud_client.send_event(event_data)
        
        if success:
            logger.info(f"Enterprise monitoring event sent: {module}:{scenario_type} (camera: {camera_id})")
            self.status_service.increment_events_sent()
        else:
            logger.warning(f"Failed to send enterprise monitoring event: {module}:{scenario_type}")
        
        return success
    
    async def refresh_cache(self):
        """Manually refresh scenario cache"""
        self._cache_timestamp = None
        await self.fetch_scenarios()
