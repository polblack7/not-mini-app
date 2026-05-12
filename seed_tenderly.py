"""One-shot Tenderly bootstrap for the Mini App backend database.

Seeds the local Mongo with:
    * the deployer wallet from setup-tenderly.js as the "test user"
    * encrypted private key so the monitor can auto-execute
    * working Strategy settings preconfigured for the Tenderly TestNet
    * the deployed FlashLoan address
    * starting bot_state (stopped)

Run after `make setup-tenderly`. Requires:
    PRIVATE_KEY            -- the deployer private key (must match the Tenderly wallet)
    WALLET_ENCRYPTION_KEY  -- master key for the per-user Fernet derivation
    MONGO_URL              -- pointed at the Mongo the backend uses

Usage:
    python3 not-mini-app/seed_tenderly.py
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Reuse backend's crypto implementation so the encrypted blob is decryptable
# by api/routers/settings.py and the monitor's executor.py.
THIS = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS / "backend"))
from core.crypto import encrypt_private_key  # noqa: E402

from motor.motor_asyncio import AsyncIOMotorClient  # noqa: E402


def _load_dotenv() -> None:
    """Tiny dotenv loader -- avoids extra dep."""
    repo_root = THIS.parent
    env_path = repo_root / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        os.environ.setdefault(k, v)


def _load_deployed() -> dict:
    deployed_path = THIS.parent / "not-bot" / "deployed.json"
    if not deployed_path.exists():
        raise SystemExit(
            "not-bot/deployed.json not found -- run `make setup-tenderly` first."
        )
    return json.loads(deployed_path.read_text())


async def main() -> None:
    _load_dotenv()

    private_key = os.getenv("PRIVATE_KEY", "").strip()
    if not private_key.startswith("0x") or len(private_key) != 66:
        raise SystemExit("PRIVATE_KEY missing or malformed in .env")

    master_key = os.getenv("WALLET_ENCRYPTION_KEY", "").strip()
    if not master_key:
        raise SystemExit("WALLET_ENCRYPTION_KEY missing in .env")

    mongo_url = os.getenv("MONGO_URL", "").strip()
    if not mongo_url:
        raise SystemExit("MONGO_URL missing in .env")

    deployed = _load_deployed()
    wallet = deployed["deployer"].lower()
    contract_address = deployed["address"]
    abi_path = str(
        (THIS.parent / "not-bot" / "artifacts" / "contracts" / "FlashLoan.sol" / "FlashLoan.json").resolve()
    )
    chain_id = int(deployed.get("chainId") or 1)

    encrypted = encrypt_private_key(private_key, wallet, master_key)

    client = AsyncIOMotorClient(mongo_url, tz_aware=True)
    db = client.get_default_database()
    now = datetime.now(timezone.utc)

    # ── users -------------------------------------------------------------
    await db.users.update_one(
        {"wallet_address": wallet},
        {
            "$set": {
                "access_token_hash": "tenderly-bootstrap",
                "last_login": now,
            },
            "$setOnInsert": {
                "created_at": now,
                "total_profit": 0.0,
                "successful_arbs": 0,
                "avg_profitability": 0.0,
            },
        },
        upsert=True,
    )

    # ── settings: strategy + flash loan binding + encrypted key ----------
    await db.settings.update_one(
        {"wallet_address": wallet},
        {
            "$set": {
                "encrypted_private_key": encrypted,
                "flash_loan_contract": contract_address,
                "flash_loan_contract_abi_path": abi_path,
                # Strategy tuned to what Tenderly + our adapters actually execute.
                "pairs": [
                    "USDC/USDT",
                    "WBTC/CBBTC",
                    "ETH/USDC",
                    "ETH/USDT",
                    "ETH/DAI",
                ],
                "dex_list": [
                    "Uniswap V2",
                    "Uniswap V3",
                    "SushiSwap",
                    "Curve",
                    "Balancer V2",
                    "Fluid DEX",
                ],
                "min_profit_pct": 0.05,
                "loan_limit": 10.0,
                "scan_frequency_sec": 15,
                "updated_at": now,
            }
        },
        upsert=True,
    )

    # ── bot_state ---------------------------------------------------------
    await db.bot_state.update_one(
        {"wallet_address": wallet},
        {"$set": {"status": "stopped", "last_change_at": now, "last_error": None}},
        upsert=True,
    )

    print("Tenderly bootstrap seeded:")
    print(f"  wallet:          {wallet}")
    print(f"  chain_id:        {chain_id}")
    print(f"  flash_loan:      {contract_address}")
    print(f"  abi_path:        {abi_path}")
    print(f"  encrypted key:   stored ({len(encrypted)} bytes)")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
