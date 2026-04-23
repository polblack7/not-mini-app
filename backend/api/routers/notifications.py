from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter, Depends

from api.auth import get_current_user
from api.responses import ok
from api.schemas import NotificationReadRequest
from api.services import format_doc
from core.db import get_db

router = APIRouter(prefix="", tags=["notifications"])


@router.get(
    "/notifications",
    summary="List notifications",
    description="Returns the most recent notifications for the authenticated wallet, newest first. Default limit is 20.",
    response_model=None,
)
async def list_notifications(limit: int = 20, user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = (
        db.notifications.find({"wallet_address": user["wallet_address"]})
        .sort("created_at", -1)
        .limit(limit)
    )
    items = [format_doc(doc) async for doc in cursor]
    return ok(items)


@router.post(
    "/notifications/read",
    summary="Mark notifications as read",
    description="Marks the specified notification IDs as read. Only affects notifications belonging to the authenticated wallet.",
    response_model=None,
)
async def mark_read(payload: NotificationReadRequest, user: dict = Depends(get_current_user)):
    db = get_db()
    if not payload.ids:
        return ok({"updated": 0})
    await db.notifications.update_many(
        {"wallet_address": user["wallet_address"], "_id": {"$in": [ObjectId(i) for i in payload.ids]}},
        {"$set": {"read": True}},
    )
    return ok({"updated": len(payload.ids)})
