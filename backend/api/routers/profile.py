from __future__ import annotations

from fastapi import APIRouter, Depends

from api.auth import get_current_user
from api.responses import ok
from api.schemas import Profile

router = APIRouter(prefix="", tags=["profile"])


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    profile = Profile(
        wallet_address=user["wallet_address"],
        created_at=user.get("created_at"),
        last_login=user.get("last_login"),
        total_profit=user.get("total_profit", 0.0),
        successful_arbs=user.get("successful_arbs", 0),
        avg_profitability=user.get("avg_profitability", 0.0),
    )
    return ok(profile.model_dump())
