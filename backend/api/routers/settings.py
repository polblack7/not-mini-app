from __future__ import annotations

from fastapi import APIRouter, Depends

from api.auth import get_current_user
from api.responses import ok
from api.schemas import SettingsPayload, SettingsResponse
from core.db import get_db
from core.utils import now_utc

router = APIRouter(prefix="", tags=["settings"])


@router.get("/settings")
async def get_settings(user: dict = Depends(get_current_user)):
    db = get_db()
    settings = await db.settings.find_one({"wallet_address": user["wallet_address"]})
    if not settings:
        settings = {
            "wallet_address": user["wallet_address"],
            "min_profit_pct": 0.3,
            "loan_limit": 3.0,
            "dex_list": ["Uniswap", "SushiSwap", "Curve"],
            "pairs": ["ETH/USDT", "WBTC/ETH"],
            "scan_frequency_sec": 15,
            "updated_at": now_utc(),
        }
        await db.settings.insert_one(settings)

    payload = SettingsResponse(
        min_profit_pct=settings.get("min_profit_pct", 0.3),
        loan_limit=settings.get("loan_limit", 3.0),
        dex_list=settings.get("dex_list", []),
        pairs=settings.get("pairs", []),
        scan_frequency_sec=settings.get("scan_frequency_sec", 15),
        updated_at=settings.get("updated_at"),
    )
    return ok(payload.model_dump())


@router.put("/settings")
async def update_settings(payload: SettingsPayload, user: dict = Depends(get_current_user)):
    db = get_db()
    updated = payload.model_dump()
    updated["updated_at"] = now_utc()
    await db.settings.update_one(
        {"wallet_address": user["wallet_address"]},
        {"$set": {**updated, "wallet_address": user["wallet_address"]}},
        upsert=True,
    )
    response = SettingsResponse(**updated)
    return ok(response.model_dump())
