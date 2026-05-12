"""Seed the Tenderly test user/settings into Mongo.

Runs INSIDE the API container (eth_account / cryptography deps pre-installed).
Invoke via:
    docker compose exec \\
      -e FLASH_LOAN_CONTRACT=0x... \\
      api python /app/scripts/seed_tenderly.py

Environment expected:
    PRIVATE_KEY              -- Tenderly deployer EOA (gets wallet derived from it)
    WALLET_ENCRYPTION_KEY    -- master key for Fernet derivation
    MONGO_URL                -- backend Mongo
    FLASH_LOAN_CONTRACT      -- deployed FlashLoan address on Tenderly
    FLASH_LOAN_ABI_PATH      -- optional; defaults to mounted artifact path
"""
from __future__ import annotations

import asyncio
import os
import sys
from datetime import datetime, timezone

# Backend modules are at /app/core/ etc.
sys.path.insert(0, "/app")

from core.crypto import encrypt_private_key  # noqa: E402
from eth_account import Account  # noqa: E402
from motor.motor_asyncio import AsyncIOMotorClient  # noqa: E402


def _require(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        sys.exit(f"missing env var: {name}")
    return value


async def main() -> None:
    private_key = _require("PRIVATE_KEY")
    master_key = _require("WALLET_ENCRYPTION_KEY")
    mongo_url = _require("MONGO_URL")
    contract = _require("FLASH_LOAN_CONTRACT")
    abi_path = os.environ.get(
        "FLASH_LOAN_ABI_PATH",
        "/not-bot-artifacts/contracts/FlashLoan.sol/FlashLoan.json",
    )

    wallet = Account.from_key(private_key).address.lower()
    encrypted = encrypt_private_key(private_key, wallet, master_key)

    client = AsyncIOMotorClient(mongo_url, tz_aware=True)
    db = client.get_default_database()
    now = datetime.now(timezone.utc)

    await db.users.update_one(
        {"wallet_address": wallet},
        {
            "$set": {"access_token_hash": "tenderly-bootstrap", "last_login": now},
            "$setOnInsert": {
                "created_at": now,
                "total_profit": 0.0,
                "successful_arbs": 0,
                "avg_profitability": 0.0,
            },
        },
        upsert=True,
    )

    await db.settings.update_one(
        {"wallet_address": wallet},
        {
            "$set": {
                "encrypted_private_key": encrypted,
                "flash_loan_contract": contract,
                "flash_loan_contract_abi_path": abi_path,
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

    await db.bot_state.update_one(
        {"wallet_address": wallet},
        {"$set": {"status": "active", "last_change_at": now, "last_error": None}},
        upsert=True,
    )

    print(f"seeded wallet={wallet}")
    print(f"  flash_loan_contract={contract}")
    print(f"  abi_path={abi_path}")
    print(f"  encrypted_key={len(encrypted)} chars")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
