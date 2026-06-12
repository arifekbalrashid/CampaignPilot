"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """All app settings loaded from environment / .env file."""

    # Database
    database_url: str = "mysql+asyncmy://root:password@localhost:3306/campaignpilot"

    # AI
    gemini_api_key: str = ""

    # Channel Service
    channel_service_url: str = "http://localhost:8001"

    # CRM Callback (used by channel service)
    crm_callback_url: str = "http://localhost:8000/api/receipts"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000"
    
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
