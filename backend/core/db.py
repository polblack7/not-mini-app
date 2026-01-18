from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient

from core.config import get_settings


_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        settings = get_settings()
        _client = AsyncIOMotorClient(settings.mongo_url)
    return _client


def get_db():
    client = get_client()
    return client.get_default_database()


async def init_indexes() -> None:
    db = get_db()
    await db.users.create_index("wallet_address", unique=True)
    await db.settings.create_index("wallet_address", unique=True)
    await db.ops.create_index("wallet_address")
    await db.notifications.create_index("wallet_address")
    await db.logs.create_index("wallet_address")
    await db.bot_state.create_index("wallet_address", unique=True)
    await db.telegram_users.create_index("telegram_user_id", unique=True)
    await db.telegram_users.create_index("wallet_address")
