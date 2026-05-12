from __future__ import annotations

from fastapi import APIRouter, Depends, Header

from api.errors import ApiException
from api.responses import ok
from api.schemas import FlashLoanContractPayload, InternalEvent
from api.services import create_log, create_notification
from api.telegram import notify_wallet
from core.config import get_settings
from core.db import get_db
from core.utils import now_utc

router = APIRouter(prefix="/internal", tags=["internal"])


async def verify_internal_key(x_internal_key: str | None = Header(default=None)) -> None:
  settings = get_settings()
  if not settings.internal_api_key or x_internal_key != settings.internal_api_key:
    raise ApiException(status_code=401, code="AUTH_INVALID", message="Invalid internal key")


@router.post(
  "/event",
  summary="Ingest DEX monitor event",
  description=(
    "Accepts events from the DEX monitor service. Requires `X-Internal-Key` header.\n\n"
    "Supported event `type` values:\n\n"
    "- `op` -- completed trade operation (writes to `ops`, updates user KPIs)\n"
    "- `log` -- structured log entry\n"
    "- `notification` -- push notification to the user\n"
    "- `opportunity` -- detected arbitrage opportunity\n"
    "- `status` -- bot status change (`active` / `stopped` / `error`)"
  ),
  response_model=None,
)
async def internal_event(payload: InternalEvent, _=Depends(verify_internal_key)):
  db = get_db()
  wallet = payload.wallet_address.lower()
  event_type = payload.type
  data = payload.payload

  if event_type == "op":
    op = {
      "wallet_address": wallet,
      "timestamp": data.get("timestamp", now_utc()),
      "pair": data.get("pair", ""),
      "dex": data.get("dex", ""),
      "profit": float(data.get("profit", 0)),
      "fees": float(data.get("fees", 0)),
      "exec_time_ms": int(data.get("exec_time_ms", 0)),
      "status": data.get("status", "success"),
      "error_message": data.get("error_message"),
    }
    await db.ops.insert_one(op)
    if op["status"] == "success":
      user = await db.users.find_one({"wallet_address": wallet})
      total_profit = (user.get("total_profit", 0.0) if user else 0.0) + op["profit"]
      successful = (user.get("successful_arbs", 0) if user else 0) + 1
      avg = total_profit / successful if successful else 0.0
      await db.users.update_one(
        {"wallet_address": wallet},
        {
          "$set": {
            "total_profit": total_profit,
            "successful_arbs": successful,
            "avg_profitability": avg,
          }
        },
        upsert=True,
      )
      await create_notification(wallet, "deal", "Deal completed", f"Profit {op['profit']}")
      await notify_wallet(wallet, f"Deal completed: {op['pair']} profit {op['profit']}")

  elif event_type == "log":
    await create_log(wallet, data.get("level", "info"), data.get("message", ""), data.get("context"))

  elif event_type == "notification":
    await create_notification(
      wallet, data.get("type", "info"), data.get("title", "Update"), data.get("message", "")
    )
    await notify_wallet(wallet, f"{data.get('title', 'Update')}: {data.get('message', '')}")

  elif event_type == "opportunity":
    await db.opportunities.insert_one({
      "wallet_address": wallet,
      "pair": data.get("pair", ""),
      "buy_dex": data.get("buy_dex", ""),
      "sell_dex": data.get("sell_dex", ""),
      "expected_profit_pct": float(data.get("expected_profit_pct", 0)),
      "liquidity_score": float(data.get("liquidity_score", 0)),
      "gas_price_gwei": float(data.get("gas_price_gwei", 0)),
      "timestamp": data.get("timestamp", now_utc()),
    })
    await create_notification(
      wallet,
      "opportunity",
      data.get("title", "Opportunity found"),
      data.get("message", "New route detected"),
    )
    tg_message = (
      f"<b>Arbitrage opportunity</b>\n"
      f"Pair: <b>{data.get('pair', '--')}</b>\n"
      f"Buy on: {data.get('buy_dex', '--')}\n"
      f"Sell on: {data.get('sell_dex', '--')}\n"
      f"Expected profit: <b>{float(data.get('expected_profit_pct', 0)):.2f}%</b>\n"
      f"Gas: {float(data.get('gas_price_gwei', 0)):.1f} Gwei"
    )
    await notify_wallet(wallet, tg_message)

  elif event_type == "status":
    last_error = data.get("last_error")
    await db.bot_state.update_one(
      {"wallet_address": wallet},
      {
        "$set": {
          "status": data.get("status", "error"),
          "last_error": last_error,
          "last_change_at": now_utc(),
        }
      },
      upsert=True,
    )
    if last_error:
      await create_notification(wallet, "error", "Critical error", last_error)
      await notify_wallet(wallet, f"Critical error: {last_error}")

  else:
    raise ApiException(status_code=400, code="EVENT_INVALID", message="Unknown event type")

  return ok({"status": "accepted"})


@router.get(
  "/active-users",
  summary="List wallets with active bot",
  description="Returns wallet addresses whose bot state is `active`. Used by the DEX monitor supervisor to determine which wallets to scan. Requires `X-Internal-Key` header.",
  response_model=None,
)
async def active_users(_=Depends(verify_internal_key)):
  db = get_db()
  cursor = db.bot_state.find({"status": "active"}, {"wallet_address": 1})
  wallets = [doc.get("wallet_address") async for doc in cursor]
  return ok(wallets)


@router.get(
  "/wallet-key/{wallet_address}",
  summary="Get encrypted wallet key",
  description="Returns the Fernet-encrypted private key for the given wallet address, or `null` if none is stored. Used by the DEX monitor to sign transactions. Requires `X-Internal-Key` header.",
  response_model=None,
)
async def get_wallet_key(wallet_address: str, _=Depends(verify_internal_key)):
  db = get_db()
  settings = await db.settings.find_one(
    {"wallet_address": wallet_address.lower()},
    {"encrypted_private_key": 1},
  )
  if not settings or not settings.get("encrypted_private_key"):
    return ok({"encrypted_private_key": None})
  return ok({"encrypted_private_key": settings["encrypted_private_key"]})


@router.put(
  "/flash-loan-contract",
  summary="Set flash loan contract address",
  description=(
    "Updates `flash_loan_contract` (and optionally `flash_loan_contract_abi_path`) "
    "in the wallet's settings. Called automatically by `make deploy` after a successful "
    "Hardhat deployment. Requires `X-Internal-Key` header."
  ),
  response_model=None,
)
async def set_flash_loan_contract(payload: FlashLoanContractPayload, _=Depends(verify_internal_key)):
  db = get_db()
  wallet = payload.wallet_address.lower()
  update: dict = {
    "flash_loan_contract": payload.flash_loan_contract,
    "updated_at": now_utc(),
  }
  if payload.flash_loan_contract_abi_path:
    update["flash_loan_contract_abi_path"] = payload.flash_loan_contract_abi_path
  await db.settings.update_one(
    {"wallet_address": wallet},
    {"$set": update},
    upsert=True,
  )
  return ok({"wallet_address": wallet, "flash_loan_contract": payload.flash_loan_contract})
