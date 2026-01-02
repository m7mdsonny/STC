"""
Configuration Store
Manages reading and writing config.json
"""
import json
import os
from pathlib import Path
from typing import Optional, Dict, Any
from loguru import logger


class ConfigStore:
    """Manages Edge Server configuration"""
    
    def __init__(self, config_dir: Optional[Path] = None):
        if config_dir is None:
            # Default to edge/config directory
            self.config_dir = Path(__file__).parent.parent.parent / "config"
        else:
            self.config_dir = Path(config_dir)
        
        self.config_dir.mkdir(parents=True, exist_ok=True)
        self.config_file = self.config_dir / "config.json"
        self.schema_file = self.config_dir / "config.schema.json"
        self._config: Dict[str, Any] = {}
        self._load()
    
    def _load(self):
        """Load configuration from file"""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    self._config = json.load(f)
                logger.info(f"Configuration loaded from {self.config_file}")
            except Exception as e:
                logger.error(f"Failed to load config: {e}")
                self._config = {}
        else:
            logger.info("No existing configuration found - using defaults")
            self._config = {
                "setup_completed": False,
                "cloud_base_url": "",
                "edge_key": "",
                "edge_secret": "",
                "server_port": 8090,
                "heartbeat_interval": 30,
            }
    
    def _save(self):
        """Save configuration to file"""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self._config, f, indent=2, ensure_ascii=False)
            logger.info(f"Configuration saved to {self.config_file}")
            return True
        except Exception as e:
            logger.error(f"Failed to save config: {e}")
            return False
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value"""
        return self._config.get(key, default)
    
    def set(self, key: str, value: Any) -> bool:
        """Set configuration value and save"""
        self._config[key] = value
        return self._save()
    
    def update(self, updates: Dict[str, Any]) -> bool:
        """Update multiple configuration values"""
        self._config.update(updates)
        return self._save()
    
    def is_setup_completed(self) -> bool:
        """Check if setup is completed"""
        return self._config.get("setup_completed", False)
    
    def get_cloud_config(self) -> Dict[str, str]:
        """Get cloud connection configuration"""
        return {
            "base_url": self._config.get("cloud_base_url", ""),
            "edge_key": self._config.get("edge_key", ""),
            "edge_secret": self._config.get("edge_secret", ""),
        }
    
    def set_cloud_config(self, base_url: str, edge_key: str, edge_secret: str) -> bool:
        """Set cloud connection configuration"""
        return self.update({
            "cloud_base_url": base_url.rstrip('/'),
            "edge_key": edge_key,
            "edge_secret": edge_secret,
            "setup_completed": True,
        })
    
    def get_all(self) -> Dict[str, Any]:
        """Get all configuration"""
        return self._config.copy()
    
    def reset(self):
        """Reset configuration to defaults"""
        self._config = {
            "setup_completed": False,
            "cloud_base_url": "",
            "edge_key": "",
            "edge_secret": "",
            "server_port": 8090,
            "heartbeat_interval": 30,
        }
        self._save()
        logger.info("Configuration reset to defaults")
