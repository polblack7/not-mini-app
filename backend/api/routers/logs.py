from __future__ import annotations

from fastapi import APIRouter, Depends

from api.auth import get_current_user
from api.responses import ok
from api.services import format_doc
from core.db import get_db

router = APIRouter(prefix="", tags=["logs"])


@router.get(
    "/logs/recent",
    summary="Recent bot logs",
    description="Returns the most recent structured log entries for the authenticated wallet, newest first. Default limit is 20. Log levels: `info`, `warning`, `error`.",
    response_model=None,
)
async def recent_logs(limit: int = 20, user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.logs.find({"wallet_address": user["wallet_address"]}).sort("created_at", -1).limit(limit)
    items = [format_doc(doc) async for doc in cursor]
    return ok(items)
