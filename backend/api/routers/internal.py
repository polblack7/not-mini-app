from __future__ import annotations

from fastapi import APIRouter, Depends, Header

from api.errors import ApiException
from api.responses import ok
from api.schemas import InternalEvent
from api.services import create_log, create_notification
from api.telegram import notify_wallet
from core.config import get_settings
from core.db import get_db
from core.utils import now_utc

router = APIRouter(prefix="/internal", tags=["internal"])


async def verify_internal_key(x_internal_key: str | None = Header(default=None)) -> None:
    settings = get_settings()
    if not settings.internal_api_key or x_internal_key != settings.internal_api_key:
        raise ApiException(status_code=401, code="AUTH_INVALID", message="Invalid internal key")


@router.post("/event")
async def internal_event(payload: InternalEvent, _=Depends(verify_internal_key)):
    db = get_db()
    wallet = payload.wallet_address
    event_type = payload.type
    data = payload.payload

    if event_type == "op":
        op = {
            "wallet_address": wallet,
            "timestamp": data.get("timestamp", now_utc()),
            "pair": data.get("pair", ""),
            "dex": data.get("dex", ""),
            "profit": float(data.get("profit", 0)),
            "fees": float(data.get("fees", 0)),
            "exec_time_ms": int(data.get("exec_time_ms", 0)),
            "status": data.get("status", "success"),
            "error_message": data.get("error_message"),
        }
        await db.ops.insert_one(op)
        if op["status"] == "success":
            user = await db.users.find_one({"wallet_address": wallet})
            total_profit = (user.get("total_profit", 0.0) if user else 0.0) + op["profit"]
            successful = (user.get("successful_arbs", 0) if user else 0) + 1
            avg = total_profit / successful if successful else 0.0
            await db.users.update_one(
                {"wallet_address": wallet},
                {
                    "$set": {
                        "total_profit": total_profit,
                        "successful_arbs": successful,
                        "avg_profitability": avg,
                    }
                },
                upsert=True,
            )
        await create_notification(wallet, "deal", "Deal completed", f"Profit {op['profit']}")
        await notify_wallet(wallet, f"Deal completed: {op['pair']} profit {op['profit']}")

    elif event_type == "log":
        await create_log(wallet, data.get("level", "info"), data.get("message", ""), data.get("context"))

    elif event_type == "notification":
        await create_notification(
            wallet, data.get("type", "info"), data.get("title", "Update"), data.get("message", "")
        )
        await notify_wallet(wallet, f"{data.get('title', 'Update')}: {data.get('message', '')}")

    elif event_type == "opportunity":
        await create_notification(
            wallet,
            "opportunity",
            data.get("title", "Opportunity found"),
            data.get("message", "New route detected"),
        )
        await notify_wallet(wallet, f"Opportunity: {data.get('message', 'New route detected')}")

    elif event_type == "status":
        await db.bot_state.update_one(
            {"wallet_address": wallet},
            {
                "$set": {
                    "status": data.get("status", "error"),
                    "last_error": data.get("last_error"),
                    "last_change_at": now_utc(),
                }
            },
            upsert=True,
        )
        await create_notification(wallet, "error", "Critical error", data.get("last_error", ""))
        await notify_wallet(wallet, f"Critical error: {data.get('last_error', '')}")

    else:
        raise ApiException(status_code=400, code="EVENT_INVALID", message="Unknown event type")

    return ok({"status": "accepted"})


@router.get("/active-users")
async def active_users(_=Depends(verify_internal_key)):
    db = get_db()
    cursor = db.bot_state.find({"status": "active"}, {"wallet_address": 1})
    wallets = [doc.get("wallet_address") async for doc in cursor]
    return ok(wallets)
