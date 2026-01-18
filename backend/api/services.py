from __future__ import annotations

from typing import Any

from core.db import get_db
from core.utils import now_utc


def format_doc(doc: dict) -> dict:
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


async def create_notification(wallet_address: str, ntype: str, title: str, message: str) -> None:
    db = get_db()
    await db.notifications.insert_one(
        {
            "wallet_address": wallet_address,
            "created_at": now_utc(),
            "type": ntype,
            "title": title,
            "message": message,
            "read": False,
        }
    )


async def create_log(wallet_address: str, level: str, message: str, context: dict | None = None) -> None:
    db = get_db()
    await db.logs.insert_one(
        {
            "wallet_address": wallet_address,
            "created_at": now_utc(),
            "level": level,
            "message": message,
            "context": context or {},
        }
    )
