from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from jwt import PyJWTError
from fastapi import Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from api.errors import ApiException
from core.config import get_settings
from core.db import get_db


security = HTTPBearer(auto_error=False)


def create_access_token(wallet_address: str) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_ttl_minutes)
    payload = {"sub": wallet_address, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_token(token: str) -> str:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except PyJWTError as exc:
        raise ApiException(status_code=401, code="AUTH_INVALID", message="Invalid token") from exc
    wallet_address = payload.get("sub")
    if not wallet_address:
        raise ApiException(status_code=401, code="AUTH_INVALID", message="Invalid token payload")
    return wallet_address


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    token: Optional[str] = Query(
        None,
        description="Fallback JWT for download links (`/api/export/csv?token=...`) "
                    "where Authorization headers can't be set (mobile WebViews).",
    ),
):
    # Prefer the standard Authorization header; fall back to ?token=... so that
    # Telegram Mini Apps can open download links in an external browser without
    # losing auth context. Both paths go through the same decode_token check.
    raw_token = credentials.credentials if credentials else token
    if not raw_token:
        raise ApiException(status_code=401, code="AUTH_REQUIRED", message="Authentication required")
    wallet_address = decode_token(raw_token)
    db = get_db()
    user = await db.users.find_one({"wallet_address": wallet_address})
    if not user:
        raise ApiException(status_code=401, code="AUTH_INVALID", message="User not found")
    return user
