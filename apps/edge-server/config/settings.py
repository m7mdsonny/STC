import os
from typing import Optional, List
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "STC AI-VAP Edge Server"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False

    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8080

    CLOUD_API_URL: str = ""
    CLOUD_API_KEY: Optional[str] = None

    LICENSE_KEY: str = ""

    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "logs"

    SYNC_INTERVAL: int = 30
    HEARTBEAT_INTERVAL: int = 60

    DATA_DIR: str = "data"

    MAX_CAMERAS: int = 16
    PROCESSING_FPS: int = 5

    FACE_CONFIDENCE: float = 0.6
    OBJECT_CONFIDENCE: float = 0.5
    FIRE_CONFIDENCE: float = 0.7

    MQTT_BROKER: Optional[str] = None
    MQTT_PORT: int = 1883

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    @property
    def log_file(self) -> str:
        return os.path.join(self.LOG_DIR, "edge_server.log")

    @property
    def offline_queue_dir(self) -> str:
        return os.path.join(self.DATA_DIR, "offline_queue")

    @property
    def cache_dir(self) -> str:
        return os.path.join(self.DATA_DIR, "cache")

    @property
    def models_dir(self) -> str:
        return os.path.join(self.DATA_DIR, "models")

    @property
    def license_cache_path(self) -> str:
        return os.path.join(self.DATA_DIR, "license_cache.json")

    def ensure_directories(self):
        dirs = [self.LOG_DIR, self.DATA_DIR, self.offline_queue_dir, self.cache_dir, self.models_dir]
        for d in dirs:
            os.makedirs(d, exist_ok=True)

    def is_configured(self) -> bool:
        return bool(self.CLOUD_API_URL)

    def has_license(self) -> bool:
        return bool(self.LICENSE_KEY)


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
