from __future__ import annotations

from fastapi import APIRouter, Depends

from api.auth import get_current_user
from api.responses import ok
from api.services import create_notification
from core.db import get_db
from core.mock_data import compute_kpis
from core.trading_adapter import get_adapter
from core.utils import now_utc

router = APIRouter(prefix="", tags=["bot"])


@router.post("/bot/start")
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


@router.post("/bot/stop")
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


@router.get("/bot/status")
async def bot_status(user: dict = Depends(get_current_user)):
    db = get_db()
    state = await db.bot_state.find_one({"wallet_address": user["wallet_address"]})
    status = state.get("status") if state else "stopped"
    last_error = state.get("last_error") if state else None
    ops = await db.ops.find({"wallet_address": user["wallet_address"]}).to_list(length=200)
    kpis = compute_kpis(ops)
    return ok({"status": status, "last_error": last_error, "kpis": kpis})
