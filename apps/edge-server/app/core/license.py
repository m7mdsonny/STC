"""
License Management Module
Handles license validation, caching, and 14-day free trial
"""
import json
from datetime import datetime, date, timedelta
from pathlib import Path
from typing import Any, Dict, Optional

from loguru import logger

from config.settings import settings


class LocalLicenseStore:
    """
    Persist license validation data locally to allow offline grace periods.
    Supports 14-day free trial for new installations.
    """

    def __init__(self, path: Optional[str] = None):
        self.path = Path(path or settings.license_cache_path)
        self.data: Dict[str, Any] = {}
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._load()

    def _load(self) -> None:
        """Load cached license data"""
        if not self.path.exists():
            self.data = {}
            return

        try:
            with self.path.open("r", encoding="utf-8") as f:
                self.data = json.load(f)
        except Exception as exc:
            logger.warning(f"Failed to load license cache: {exc}")
            self.data = {}

    def save(self) -> None:
        """Save license data to cache"""
        try:
            with self.path.open("w", encoding="utf-8") as f:
                json.dump(self.data, f, default=str, indent=2)
        except Exception as exc:
            logger.warning(f"Failed to persist license cache: {exc}")

    def update_from_cloud(
        self, 
        license_key: str, 
        payload: Dict[str, Any], 
        hardware_id: Optional[str]
    ) -> None:
        """Update license cache from Cloud validation response"""
        expires_at = payload.get("expires_at")
        grace_days = payload.get("grace_days", 14)
        license_id = payload.get("license_id")
        organization_id = payload.get("organization_id")

        self.data = {
            "license_key": license_key,
            "license_id": license_id,
            "organization_id": organization_id,
            "expires_at": expires_at,
            "grace_days": grace_days,
            "hardware_id": hardware_id,
            "last_validated": datetime.utcnow().isoformat(),
            "is_trial": payload.get("is_trial", False),
            "trial_started_at": payload.get("trial_started_at") or (
                datetime.utcnow().isoformat() if payload.get("is_trial") else None
            ),
        }
        self.save()

    def is_within_grace(
        self, 
        license_key: str, 
        hardware_id: Optional[str]
    ) -> bool:
        """
        Check if license is within grace period (14 days after expiration)
        Also checks for 14-day free trial for new installations
        """
        if not self.data:
            # No cached data - check if we should start a free trial
            return self._check_free_trial_eligibility(license_key, hardware_id)

        cached_key = self.data.get("license_key")
        cached_hw = self.data.get("hardware_id")

        if cached_key != license_key:
            return False

        if cached_hw and hardware_id and cached_hw != hardware_id:
            return False

        # Check if it's a free trial
        is_trial = self.data.get("is_trial", False)
        if is_trial:
            trial_started = self.data.get("trial_started_at")
            if trial_started:
                try:
                    trial_start = datetime.fromisoformat(trial_started).date()
                    trial_end = trial_start + timedelta(days=14)
                    today = date.today()
                    
                    if today <= trial_end:
                        logger.info(f"Free trial active: {trial_end - today} days remaining")
                        return True
                    else:
                        logger.warning("Free trial expired")
                        return False
                except Exception as e:
                    logger.error(f"Error parsing trial date: {e}")

        # Check grace period for expired licenses
        try:
            expires_at = self._parse_date(self.data.get("expires_at"))
        except Exception:
            return False

        grace_days = int(self.data.get("grace_days", 14))
        grace_limit = expires_at + timedelta(days=grace_days)
        today = date.today()

        return today <= grace_limit

    def _check_free_trial_eligibility(
        self, 
        license_key: str, 
        hardware_id: Optional[str]
    ) -> bool:
        """
        Check if this installation is eligible for 14-day free trial
        Trial is available if:
        1. No license key is provided (empty or "trial")
        2. This is a new installation (no cached data)
        """
        if not license_key or license_key.lower() in ("", "trial", "free"):
            # Start free trial
            self.data = {
                "license_key": "TRIAL",
                "license_id": None,
                "organization_id": None,
                "expires_at": None,
                "grace_days": 0,
                "hardware_id": hardware_id,
                "last_validated": datetime.utcnow().isoformat(),
                "is_trial": True,
                "trial_started_at": datetime.utcnow().isoformat(),
            }
            self.save()
            logger.info("14-day free trial started")
            return True
        
        return False

    def _parse_date(self, value: Any) -> date:
        """Parse date from various formats"""
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace('Z', '+00:00')).date()
            except:
                return datetime.strptime(value, "%Y-%m-%d").date()
        raise ValueError("Unsupported date format")

    def get_trial_days_remaining(self) -> Optional[int]:
        """Get remaining days in free trial"""
        if not self.data.get("is_trial"):
            return None
        
        trial_started = self.data.get("trial_started_at")
        if not trial_started:
            return None
        
        try:
            trial_start = datetime.fromisoformat(trial_started).date()
            trial_end = trial_start + timedelta(days=14)
            today = date.today()
            
            if today > trial_end:
                return 0
            
            return (trial_end - today).days
        except Exception:
            return None

    def is_trial_active(self) -> bool:
        """Check if free trial is currently active"""
        return self.data.get("is_trial", False) and self.get_trial_days_remaining() is not None and self.get_trial_days_remaining() > 0
