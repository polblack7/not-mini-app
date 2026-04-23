from __future__ import annotations

from fastapi import APIRouter, Depends

from api.auth import get_current_user
from api.responses import ok
from core.db import get_db

router = APIRouter(prefix="", tags=["market"])


@router.get(
    "/market/opportunities",
    summary="Live arbitrage opportunities",
    description="Returns the 4 most recent arbitrage opportunities detected by the DEX monitor for the authenticated wallet, sorted by detection time descending.",
    response_model=None,
)
async def market_opportunities(user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.opportunities.find(
        {"wallet_address": user["wallet_address"]},
        {"_id": 0},
    ).sort("timestamp", -1).limit(4)
    opportunities = await cursor.to_list(length=4)
    return ok(opportunities)
