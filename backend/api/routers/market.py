from __future__ import annotations

from fastapi import APIRouter, Depends

from api.auth import get_current_user
from api.responses import ok
from core.mock_data import generate_opportunities
from core.trading_adapter import get_adapter

router = APIRouter(prefix="", tags=["market"])


@router.get("/market/analysis")
async def market_analysis(user: dict = Depends(get_current_user)):
    adapter = get_adapter()
    summary = adapter.get_stats(user["wallet_address"], filters={})
    return ok({"summary": summary})


@router.get("/market/opportunities")
async def market_opportunities(user: dict = Depends(get_current_user)):
    opportunities = generate_opportunities(user["wallet_address"], count=4)
    return ok(opportunities)
