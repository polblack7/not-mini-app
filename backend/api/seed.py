from __future__ import annotations

from core.mock_data import generate_logs, generate_notifications, generate_ops
from core.utils import now_utc
from core.db import get_db


async def ensure_mock_seed(wallet_address: str) -> None:
    db = get_db()
    if await db.ops.count_documents({"wallet_address": wallet_address}) == 0:
        ops = generate_ops(wallet_address)
        await db.ops.insert_many(ops)

    if await db.logs.count_documents({"wallet_address": wallet_address}) == 0:
        logs = generate_logs(wallet_address)
        await db.logs.insert_many(logs)

    if await db.notifications.count_documents({"wallet_address": wallet_address}) == 0:
        notifications = generate_notifications(wallet_address)
        await db.notifications.insert_many(notifications)

    if await db.bot_state.count_documents({"wallet_address": wallet_address}) == 0:
        await db.bot_state.insert_one(
            {
                "wallet_address": wallet_address,
                "status": "stopped",
                "last_change_at": now_utc(),
                "last_error": None,
            }
        )
