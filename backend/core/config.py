import os
from pathlib import Path

from dotenv import load_dotenv
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    bot_token: str
    mongo_url: str
    jwt_secret: str
    access_token_master: str
    internal_api_key: str
    cors_origins: str
    miniapp_url: str
    jwt_ttl_minutes: int


_cached_settings: Settings | None = None

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(ENV_PATH)


def get_settings() -> Settings:
    global _cached_settings
    if _cached_settings is not None:
        return _cached_settings

    _cached_settings = Settings(
        bot_token=os.getenv("BOT_TOKEN", ""),
        mongo_url=os.getenv("MONGO_URL", "mongodb://localhost:27017/onearb"),
        jwt_secret=os.getenv("JWT_SECRET", "dev-secret"),
        access_token_master=os.getenv("ACCESS_TOKEN_MASTER", ""),
        internal_api_key=os.getenv("INTERNAL_API_KEY", ""),
        cors_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173"),
        miniapp_url=os.getenv("MINIAPP_URL", ""),
        jwt_ttl_minutes=int(os.getenv("JWT_TTL_MINUTES", "10080")),
    )
    return _cached_settings
