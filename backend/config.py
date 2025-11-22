from functools import lru_cache
import os
from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )
    PROJECT_NAME: str = "Readme Miner"
    DATABASE_URL: str
    GOOGLE_CLIENT_ID: str
    # Prefer GEMINI_API_KEY; fallback to GOOGLE_API_KEY for compatibility
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
    # Prefer JWT_SECRET; fallback to legacy SECRET_KEY for compatibility
    JWT_SECRET: str = os.getenv("JWT_SECRET") or os.getenv("SECRET_KEY", "")
    FRONTEND_URL: AnyHttpUrl = "http://localhost:3000"
    MAX_REPO_SIZE_MB: int = 200
    LOG_LEVEL: str = "info"

    # class Config is deprecated in Pydantic v2; using model_config above.

@lru_cache
def get_settings() -> Settings:
    return Settings()
