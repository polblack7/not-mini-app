from __future__ import annotations

from fastapi import APIRouter

from api.auth import create_access_token
from api.errors import ApiException
from api.responses import ok
from api.schemas import LoginRequest, LoginResponse, Profile
from api.seed import ensure_mock_seed
from core.config import get_settings
from core.db import get_db
from core.utils import hash_token, is_valid_wallet, now_utc

router = APIRouter(prefix="/auth", tags=["auth"])


def _build_profile(user: dict) -> Profile:
    return Profile(
        wallet_address=user["wallet_address"],
        created_at=user.get("created_at"),
        last_login=user.get("last_login"),
        total_profit=user.get("total_profit", 0.0),
        successful_arbs=user.get("successful_arbs", 0),
        avg_profitability=user.get("avg_profitability", 0.0),
    )


@router.post("/login")
async def login(payload: LoginRequest):
    if not is_valid_wallet(payload.wallet_address):
        raise ApiException(status_code=400, code="WALLET_INVALID", message="Invalid wallet address")

    db = get_db()
    settings = get_settings()
    token_hash = hash_token(payload.access_token)
    user = await db.users.find_one({"wallet_address": payload.wallet_address})

    if user:
        stored_hash = user.get("access_token_hash")
        master_ok = bool(settings.access_token_master) and payload.access_token == settings.access_token_master
        if stored_hash and stored_hash != token_hash and not master_ok:
            raise ApiException(status_code=401, code="AUTH_INVALID", message="Access token mismatch")
        if stored_hash != token_hash and master_ok:
            await db.users.update_one(
                {"wallet_address": payload.wallet_address}, {"$set": {"access_token_hash": token_hash}}
            )
    else:
        if settings.access_token_master and payload.access_token != settings.access_token_master:
            raise ApiException(status_code=401, code="AUTH_INVALID", message="Access token invalid")
        user = {
            "wallet_address": payload.wallet_address,
            "created_at": now_utc(),
            "last_login": now_utc(),
            "total_profit": 0.0,
            "successful_arbs": 0,
            "avg_profitability": 0.0,
            "access_token_hash": token_hash,
        }
        await db.users.insert_one(user)

    await db.users.update_one(
        {"wallet_address": payload.wallet_address}, {"$set": {"last_login": now_utc()}}
    )

    if payload.telegram_user_id:
        await db.telegram_users.update_one(
            {"telegram_user_id": payload.telegram_user_id},
            {"$set": {"wallet_address": payload.wallet_address}},
            upsert=True,
        )

    await ensure_mock_seed(payload.wallet_address)

    token = create_access_token(payload.wallet_address)
    user = await db.users.find_one({"wallet_address": payload.wallet_address})
    profile = _build_profile(user)
    response = LoginResponse(token=token, profile=profile)
    return ok(response.model_dump())
