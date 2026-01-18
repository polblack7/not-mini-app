from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt
from jwt import PyJWTError
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from api.errors import ApiException
from core.config import get_settings
from core.db import get_db


security = HTTPBearer()


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
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    wallet_address = decode_token(credentials.credentials)
    db = get_db()
    user = await db.users.find_one({"wallet_address": wallet_address})
    if not user:
        raise ApiException(status_code=401, code="AUTH_INVALID", message="User not found")
    return user
