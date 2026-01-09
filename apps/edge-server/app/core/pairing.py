"""
Edge Server Pairing Module
Generates pairing tokens/API keys for easy Cloud onboarding
"""
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict
from pathlib import Path
import json

from loguru import logger

from config.settings import settings


class PairingManager:
    """
    Manages Edge Server pairing with Cloud platform
    Generates one-time pairing tokens and API keys
    """
    
    def __init__(self):
        self.pairing_file = Path(settings.DATA_DIR) / "pairing.json"
        self.pairing_file.parent.mkdir(parents=True, exist_ok=True)
        self._pairing_data: Dict = {}
        self._load()

    def _load(self):
        """Load pairing data from disk"""
        if self.pairing_file.exists():
            try:
                with self.pairing_file.open('r', encoding='utf-8') as f:
                    self._pairing_data = json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load pairing data: {e}")
                self._pairing_data = {}

    def _save(self):
        """Save pairing data to disk"""
        try:
            with self.pairing_file.open('w', encoding='utf-8') as f:
                json.dump(self._pairing_data, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save pairing data: {e}")

    def generate_pairing_token(self, expires_hours: int = 24) -> str:
        """
        Generate a one-time pairing token
        
        Args:
            expires_hours: Token validity period in hours (default 24)
            
        Returns:
            Pairing token string (e.g., "EDGE-XXXX-XXXX-XXXX")
        """
        # Generate secure random token
        token_bytes = secrets.token_bytes(16)
        token_hex = token_bytes.hex().upper()
        
        # Format as EDGE-XXXX-XXXX-XXXX
        token = f"EDGE-{token_hex[:4]}-{token_hex[4:8]}-{token_hex[8:12]}-{token_hex[12:16]}"
        
        # Store token with expiration
        expires_at = datetime.utcnow() + timedelta(hours=expires_hours)
        
        self._pairing_data['pairing_token'] = {
            'token': token,
            'created_at': datetime.utcnow().isoformat(),
            'expires_at': expires_at.isoformat(),
            'used': False,
        }
        
        self._save()
        
        logger.info(f"Generated pairing token (expires in {expires_hours} hours)")
        return token

    def validate_pairing_token(self, token: str) -> bool:
        """
        Validate a pairing token
        
        Args:
            token: Token to validate
            
        Returns:
            True if token is valid and unused
        """
        pairing_info = self._pairing_data.get('pairing_token')
        
        if not pairing_info:
            return False
        
        if pairing_info.get('used', False):
            logger.warning("Pairing token already used")
            return False
        
        if pairing_info.get('token') != token:
            return False
        
        # Check expiration
        try:
            expires_at = datetime.fromisoformat(pairing_info['expires_at'])
            if datetime.utcnow() > expires_at:
                logger.warning("Pairing token expired")
                return False
        except Exception as e:
            logger.error(f"Error checking token expiration: {e}")
            return False
        
        return True

    def mark_token_used(self, token: str):
        """Mark a pairing token as used"""
        pairing_info = self._pairing_data.get('pairing_token')
        if pairing_info and pairing_info.get('token') == token:
            pairing_info['used'] = True
            pairing_info['used_at'] = datetime.utcnow().isoformat()
            self._save()

    def generate_api_key(self) -> str:
        """
        Generate a persistent API key for Cloud authentication
        
        Returns:
            API key string
        """
        # Generate secure API key
        api_key = secrets.token_urlsafe(32)
        
        # Store API key
        self._pairing_data['api_key'] = {
            'key': api_key,
            'created_at': datetime.utcnow().isoformat(),
        }
        
        self._save()
        
        logger.info("Generated API key for Cloud authentication")
        return api_key

    def get_api_key(self) -> Optional[str]:
        """Get stored API key"""
        api_key_info = self._pairing_data.get('api_key')
        if api_key_info:
            return api_key_info.get('key')
        return None

    def get_pairing_info(self) -> Dict:
        """
        Get current pairing information for display
        
        Returns:
            Dict with pairing token, API key, and status
        """
        pairing_info = self._pairing_data.get('pairing_token', {})
        api_key_info = self._pairing_data.get('api_key', {})
        
        return {
            'pairing_token': pairing_info.get('token') if not pairing_info.get('used') else None,
            'pairing_token_expires_at': pairing_info.get('expires_at'),
            'pairing_token_used': pairing_info.get('used', False),
            'api_key': api_key_info.get('key'),
            'api_key_created_at': api_key_info.get('created_at'),
            'is_paired': bool(settings.LICENSE_KEY and settings.LICENSE_KEY != "TRIAL"),
        }

    def clear_pairing_data(self):
        """Clear all pairing data (for reset)"""
        self._pairing_data = {}
        self._save()
        logger.info("Pairing data cleared")



