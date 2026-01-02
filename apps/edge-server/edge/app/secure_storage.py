"""
Secure Storage for Edge Credentials
Encrypts sensitive data at rest using machine-specific key
"""
import json
import base64
import hashlib
import platform
from pathlib import Path
from typing import Optional, Dict, Any
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from loguru import logger


class SecureStorage:
    """
    Secure storage for Edge Server credentials
    
    Uses machine-specific key derivation to encrypt secrets at rest.
    Secrets are never stored in plaintext.
    """
    
    def __init__(self, storage_dir: Optional[Path] = None):
        """
        Initialize secure storage
        
        Args:
            storage_dir: Directory for storage files (default: config directory)
        """
        if storage_dir is None:
            self.storage_dir = Path(__file__).parent.parent.parent / "config"
        else:
            self.storage_dir = Path(storage_dir)
        
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.encrypted_file = self.storage_dir / "edge_credentials.enc"
        self._cipher = None
        self._init_cipher()
    
    def _get_machine_key(self) -> bytes:
        """
        Generate machine-specific key for encryption
        
        Uses machine hostname and platform info to create a stable key
        that is unique per machine but consistent across restarts.
        """
        try:
            # Use machine-specific identifiers
            machine_id = platform.node()  # Hostname
            platform_info = f"{platform.system()}-{platform.machine()}"
            
            # Combine to create unique machine identifier
            machine_string = f"{machine_id}-{platform_info}"
            
            # Derive key using PBKDF2
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b'stc_edge_server_salt',  # Fixed salt for consistency
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(machine_string.encode('utf-8')))
            return key
        except Exception as e:
            logger.error(f"Failed to generate machine key: {e}")
            # Fallback: use a default key (less secure but functional)
            return Fernet.generate_key()
    
    def _init_cipher(self):
        """Initialize encryption cipher"""
        try:
            key = self._get_machine_key()
            self._cipher = Fernet(key)
        except Exception as e:
            logger.error(f"Failed to initialize cipher: {e}")
            self._cipher = None
    
    def _encrypt_data(self, data: Dict[str, Any]) -> bytes:
        """
        Encrypt configuration data
        
        Args:
            data: Dictionary to encrypt
            
        Returns:
            Encrypted bytes
        """
        if not self._cipher:
            raise RuntimeError("Cipher not initialized")
        
        json_data = json.dumps(data, ensure_ascii=False)
        encrypted = self._cipher.encrypt(json_data.encode('utf-8'))
        return encrypted
    
    def _decrypt_data(self, encrypted_data: bytes) -> Dict[str, Any]:
        """
        Decrypt configuration data
        
        Args:
            encrypted_data: Encrypted bytes
            
        Returns:
            Decrypted dictionary
        """
        if not self._cipher:
            raise RuntimeError("Cipher not initialized")
        
        decrypted = self._cipher.decrypt(encrypted_data)
        data = json.loads(decrypted.decode('utf-8'))
        return data
    
    def save_credentials(self, edge_key: str, edge_secret: str, cloud_base_url: str) -> bool:
        """
        Save encrypted credentials
        
        Args:
            edge_key: Edge server key
            edge_secret: Edge server secret (will be encrypted)
            cloud_base_url: Cloud API base URL
            
        Returns:
            True if successful
        """
        try:
            data = {
                'edge_key': edge_key,
                'edge_secret': edge_secret,  # Will be encrypted
                'cloud_base_url': cloud_base_url,
            }
            
            encrypted = self._encrypt_data(data)
            
            # Write encrypted data to file
            with open(self.encrypted_file, 'wb') as f:
                f.write(encrypted)
            
            # Set restrictive permissions (Unix only)
            try:
                import os
                os.chmod(self.encrypted_file, 0o600)  # Read/write for owner only
            except Exception:
                pass  # Windows doesn't support chmod
            
            logger.info(f"Credentials saved securely to {self.encrypted_file}")
            return True
        except Exception as e:
            logger.error(f"Failed to save credentials: {e}")
            return False
    
    def load_credentials(self) -> Optional[Dict[str, str]]:
        """
        Load and decrypt credentials
        
        Returns:
            Dictionary with edge_key, edge_secret, cloud_base_url or None if not found
        """
        if not self.encrypted_file.exists():
            logger.debug("No encrypted credentials file found")
            return None
        
        try:
            with open(self.encrypted_file, 'rb') as f:
                encrypted_data = f.read()
            
            data = self._decrypt_data(encrypted_data)
            logger.info("Credentials loaded successfully from secure storage")
            return data
        except Exception as e:
            logger.error(f"Failed to load credentials: {e}")
            return None
    
    def delete_credentials(self) -> bool:
        """
        Delete encrypted credentials file
        
        Returns:
            True if successful
        """
        try:
            if self.encrypted_file.exists():
                self.encrypted_file.unlink()
                logger.info("Credentials file deleted")
            return True
        except Exception as e:
            logger.error(f"Failed to delete credentials: {e}")
            return False
    
    def has_credentials(self) -> bool:
        """Check if credentials file exists"""
        return self.encrypted_file.exists()
