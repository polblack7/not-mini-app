from __future__ import annotations

import logging

from aiogram import Bot
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from core.config import get_settings
from core.db import get_db


_bot: Bot | None = None


def get_bot() -> Bot | None:
    global _bot
    settings = get_settings()
    if not settings.bot_token:
        return None
    if _bot is None:
        _bot = Bot(token=settings.bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    return _bot


async def notify_wallet(wallet_address: str, message: str) -> None:
    db = get_db()
    mapping = await db.telegram_users.find_one({"wallet_address": wallet_address})
    if not mapping:
        return
    bot = get_bot()
    if not bot:
        return
    chat_id = mapping.get("chat_id")
    if not chat_id:
        return
    try:
        await bot.send_message(chat_id=chat_id, text=message)
    except Exception as exc:  # pragma: no cover - best effort
        logging.warning("Telegram notify failed: %s", exc)
