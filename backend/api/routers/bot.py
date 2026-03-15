from __future__ import annotations

from fastapi import APIRouter, Depends

from api.auth import get_current_user
from api.responses import ok
from api.services import create_notification
from core.db import get_db
from core.trading_adapter import get_adapter
from core.utils import now_utc

router = APIRouter(prefix="", tags=["bot"])


@router.post(
    "/bot/start",
    summary="Start the trading bot",
    description="Activates the bot for the authenticated wallet. Updates `bot_state` to `active` and emits a notification.",
    response_model=None,
)
async def start_bot(user: dict = Depends(get_current_user)):
    db = get_db()
    settings = await db.settings.find_one({"wallet_address": user["wallet_address"]}) or {}
    adapter = get_adapter()
    adapter.start(user["wallet_address"], settings)
    await db.bot_state.update_one(
        {"wallet_address": user["wallet_address"]},
        {"$set": {"status": "active", "last_change_at": now_utc(), "last_error": None}},
        upsert=True,
    )
    await create_notification(user["wallet_address"], "info", "Bot started", "Monitoring enabled")
    return ok({"status": "active"})


@router.post(
    "/bot/stop",
    summary="Stop the trading bot",
    description="Deactivates the bot for the authenticated wallet. Updates `bot_state` to `stopped` and emits a notification.",
    response_model=None,
)
async def stop_bot(user: dict = Depends(get_current_user)):
    db = get_db()
    adapter = get_adapter()
    adapter.stop(user["wallet_address"])
    await db.bot_state.update_one(
        {"wallet_address": user["wallet_address"]},
        {"$set": {"status": "stopped", "last_change_at": now_utc()}},
        upsert=True,
    )
    await create_notification(user["wallet_address"], "info", "Bot stopped", "Monitoring paused")
    return ok({"status": "stopped"})


@router.get(
    "/bot/status",
    summary="Get bot status and KPIs",
    description=(
        "Returns the current bot state (`active` / `stopped` / `error`) and live KPIs "
        "computed from the wallet's trade history:\n\n"
        "- `current_profit` — total ETH profit from successful trades\n"
        "- `completed_deals` — number of successful trades\n"
        "- `avg_profitability` — average profit per successful trade"
    ),
    response_model=None,
)
async def bot_status(user: dict = Depends(get_current_user)):
    db = get_db()
    state = await db.bot_state.find_one({"wallet_address": user["wallet_address"]})
    status = state.get("status") if state else "stopped"
    last_error = state.get("last_error") if state else None
    ops = await db.ops.find({"wallet_address": user["wallet_address"]}).to_list(length=200)
    successes = [op for op in ops if op.get("status") == "success"]
    profit = sum(op["profit"] for op in successes)
    kpis = {
        "current_profit": round(profit, 4),
        "completed_deals": len(successes),
        "avg_profitability": round(profit / len(successes), 4) if successes else 0.0,
    }
    return ok({"status": status, "last_error": last_error, "kpis": kpis})
