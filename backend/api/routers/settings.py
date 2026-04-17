from __future__ import annotations

from fastapi import APIRouter, Depends

from api.auth import get_current_user
from api.errors import ApiException
from api.responses import ok
from api.schemas import SettingsPayload, SettingsResponse, WalletKeyPayload
from core.config import get_settings as get_app_settings
from core.crypto import encrypt_private_key
from core.db import get_db
from core.utils import now_utc

router = APIRouter(prefix="", tags=["settings"])


@router.get(
    "/settings",
    summary="Get bot settings",
    description="Returns the current strategy settings. If no settings exist for the user yet, a default document is created and returned.",
    response_model=None,
)
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
        flash_loan_contract=settings.get("flash_loan_contract", ""),
        flash_loan_contract_abi_path=settings.get("flash_loan_contract_abi_path", ""),
        updated_at=settings.get("updated_at"),
        has_wallet_key=bool(settings.get("encrypted_private_key")),
    )
    return ok(payload.model_dump())


@router.put(
    "/settings",
    summary="Update bot settings",
    description="Overwrites the user's strategy settings (profit threshold, loan limit, DEX list, trading pairs, scan frequency).",
    response_model=None,
)
async def update_settings(payload: SettingsPayload, user: dict = Depends(get_current_user)):
    db = get_db()
    updated = payload.model_dump()
    updated["updated_at"] = now_utc()
    await db.settings.update_one(
        {"wallet_address": user["wallet_address"]},
        {"$set": {**updated, "wallet_address": user["wallet_address"]}},
        upsert=True,
    )
    settings = await db.settings.find_one({"wallet_address": user["wallet_address"]})
    response = SettingsResponse(
        **updated,
        has_wallet_key=bool(settings.get("encrypted_private_key") if settings else False),
    )
    return ok(response.model_dump())


@router.put(
    "/settings/wallet-key",
    summary="Store encrypted wallet private key",
    description=(
        "Encrypts the provided Ethereum private key with a per-user derived key (HKDF + Fernet) "
        "and stores it. Required for auto-execution of trades by the DEX monitor.\n\n"
        "Returns `503` if `WALLET_ENCRYPTION_KEY` is not configured on the server."
    ),
    response_model=None,
)
async def set_wallet_key(payload: WalletKeyPayload, user: dict = Depends(get_current_user)):
    app_settings = get_app_settings()
    if not app_settings.wallet_encryption_key:
        raise ApiException(
            status_code=503,
            code="ENCRYPTION_NOT_CONFIGURED",
            message="Wallet encryption is not configured on this server",
        )

    wallet = user["wallet_address"]
    encrypted = encrypt_private_key(
        payload.private_key, wallet, app_settings.wallet_encryption_key
    )

    db = get_db()
    await db.settings.update_one(
        {"wallet_address": wallet},
        {"$set": {"encrypted_private_key": encrypted, "updated_at": now_utc()}},
        upsert=True,
    )
    return ok({"has_wallet_key": True})


@router.delete(
    "/settings/wallet-key",
    summary="Remove wallet private key",
    description="Removes the stored encrypted private key. Auto-execution will be disabled until a new key is provided.",
    response_model=None,
)
async def delete_wallet_key(user: dict = Depends(get_current_user)):
    db = get_db()
    await db.settings.update_one(
        {"wallet_address": user["wallet_address"]},
        {"$unset": {"encrypted_private_key": ""}, "$set": {"updated_at": now_utc()}},
    )
    return ok({"has_wallet_key": False})
