from __future__ import annotations

from fastapi import APIRouter, Depends

from api.auth import get_current_user
from api.responses import ok
from api.schemas import Profile
from core.db import get_db

router = APIRouter(prefix="", tags=["profile"])


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    db = get_db()
    ops = await db.ops.find({"wallet_address": user["wallet_address"]}).to_list(length=10000)
    successes = [op for op in ops if op.get("status") == "success"]
    total_profit = sum(op["profit"] for op in successes)
    avg_profitability = total_profit / len(successes) if successes else 0.0
    profile = Profile(
        wallet_address=user["wallet_address"],
        created_at=user.get("created_at"),
        last_login=user.get("last_login"),
        total_profit=round(total_profit, 4),
        successful_arbs=len(successes),
        avg_profitability=round(avg_profitability, 4),
    )
    return ok(profile.model_dump())
