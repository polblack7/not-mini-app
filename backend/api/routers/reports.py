from __future__ import annotations

import csv
import io
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse, StreamingResponse

from api.auth import get_current_user
from api.responses import ok
from api.services import format_doc
from core.db import get_db
from core.mock_data import compute_summary

router = APIRouter(prefix="", tags=["reports"])


def _build_query(
    wallet_address: str,
    from_ts: Optional[datetime],
    to_ts: Optional[datetime],
    pair: Optional[str],
    dex: Optional[str],
):
    query: dict = {"wallet_address": wallet_address}
    if from_ts or to_ts:
        query["timestamp"] = {}
        if from_ts:
            query["timestamp"]["$gte"] = from_ts
        if to_ts:
            query["timestamp"]["$lte"] = to_ts
    if pair:
        query["pair"] = pair
    if dex:
        query["dex"] = dex
    return query


@router.get("/ops")
async def ops(
    user: dict = Depends(get_current_user),
    from_ts: Optional[datetime] = Query(None, alias="from"),
    to_ts: Optional[datetime] = Query(None, alias="to"),
    pair: Optional[str] = None,
    dex: Optional[str] = None,
    limit: int = 200,
):
    db = get_db()
    query = _build_query(user["wallet_address"], from_ts, to_ts, pair, dex)
    cursor = db.ops.find(query).sort("timestamp", -1).limit(limit)
    ops_items = [format_doc(doc) async for doc in cursor]
    return ok(ops_items)


@router.get("/stats/summary")
async def stats_summary(
    user: dict = Depends(get_current_user),
    from_ts: Optional[datetime] = Query(None, alias="from"),
    to_ts: Optional[datetime] = Query(None, alias="to"),
    pair: Optional[str] = None,
    dex: Optional[str] = None,
):
    db = get_db()
    query = _build_query(user["wallet_address"], from_ts, to_ts, pair, dex)
    ops_items = await db.ops.find(query).to_list(length=1000)
    summary = compute_summary(ops_items)
    return ok(summary)


@router.get("/export/csv")
async def export_csv(
    user: dict = Depends(get_current_user),
    from_ts: Optional[datetime] = Query(None, alias="from"),
    to_ts: Optional[datetime] = Query(None, alias="to"),
    pair: Optional[str] = None,
    dex: Optional[str] = None,
):
    db = get_db()
    query = _build_query(user["wallet_address"], from_ts, to_ts, pair, dex)
    ops_items = await db.ops.find(query).sort("timestamp", -1).to_list(length=2000)

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["timestamp", "pair", "dex", "profit", "fees", "exec_time_ms", "status", "error_message"])
    for op in ops_items:
        writer.writerow(
            [
                op.get("timestamp"),
                op.get("pair"),
                op.get("dex"),
                op.get("profit"),
                op.get("fees"),
                op.get("exec_time_ms"),
                op.get("status"),
                op.get("error_message"),
            ]
        )

    buffer.seek(0)
    headers = {"Content-Disposition": "attachment; filename=ops.csv"}
    return StreamingResponse(buffer, media_type="text/csv", headers=headers)


@router.get("/export/json")
async def export_json(
    user: dict = Depends(get_current_user),
    from_ts: Optional[datetime] = Query(None, alias="from"),
    to_ts: Optional[datetime] = Query(None, alias="to"),
    pair: Optional[str] = None,
    dex: Optional[str] = None,
):
    db = get_db()
    query = _build_query(user["wallet_address"], from_ts, to_ts, pair, dex)
    ops_items = await db.ops.find(query).sort("timestamp", -1).to_list(length=2000)
    payload = [format_doc(doc) for doc in ops_items]
    headers = {"Content-Disposition": "attachment; filename=ops.json"}
    return JSONResponse(content=jsonable_encoder(ok(payload)), headers=headers)
