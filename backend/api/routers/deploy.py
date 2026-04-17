from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends

from api.auth import get_current_user
from api.errors import ApiException
from api.responses import ok
from core.config import get_settings
from core.crypto import decrypt_private_key
from core.db import get_db
from core.utils import now_utc

router = APIRouter(prefix="/deploy", tags=["deploy"])

# Aave V3 PoolAddressesProvider per network (mirrors not-bot/scripts/deploy.js)
_ADDRESSES_PROVIDER = {
    "sepolia": "0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A",
    "mainnet": "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
}


_ARTIFACT_SUBPATH = Path("contracts") / "FlashLoan.sol" / "FlashLoan.json"


def _find_artifact(configured_path: str = "") -> Optional[Path]:
    """Locate the compiled FlashLoan Hardhat artifact.

    Resolution order:
    1. FLASH_LOAN_ABI_PATH env var (full path to FlashLoan.json)
    2. Walk up from this file looking for not-bot/artifacts/ (works locally)
    """
    if configured_path:
        p = Path(configured_path)
        if p.exists():
            return p

    here = Path(__file__).resolve()
    for parent in here.parents:
        candidate = parent / "not-bot" / "artifacts" / _ARTIFACT_SUBPATH
        if candidate.exists():
            return candidate
    return None


async def _deploy(rpc_url: str, private_key: str, network: str, abi_path: str = "") -> dict:
    """Deploy FlashLoan.sol and return {address, tx_hash}. Runs in a thread."""
    from web3 import Web3

    addresses_provider = _ADDRESSES_PROVIDER.get(network)
    if not addresses_provider:
        raise ValueError(f"Unsupported network for deploy: {network}. Use 'sepolia' or 'mainnet'.")

    artifact_path = _find_artifact(abi_path)
    if artifact_path is None:
        raise FileNotFoundError(
            "FlashLoan artifact not found. "
            "Run `npx hardhat compile` in not-bot/ first, or run `make contract-compile`."
        )

    artifact = json.loads(artifact_path.read_text())
    abi = artifact["abi"]
    bytecode = artifact["bytecode"]

    def _blocking_deploy() -> dict:
        import logging as _logging
        log = _logging.getLogger(__name__)

        w3 = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={"timeout": 120}))
        account = w3.eth.account.from_key(private_key)
        sender = account.address

        chain_id = w3.eth.chain_id
        gas_price = w3.eth.gas_price
        nonce = w3.eth.get_transaction_count(sender)
        balance = w3.eth.get_balance(sender)

        log.info(
            "Deploy attempt: network=%s chain_id=%s sender=%s balance_eth=%.6f gas_price_gwei=%.2f",
            network, chain_id, sender,
            balance / 1e18,
            gas_price / 1e9,
        )

        FlashLoan = w3.eth.contract(abi=abi, bytecode=bytecode)
        constructor_call = FlashLoan.constructor(w3.to_checksum_address(addresses_provider))

        try:
            gas_est = constructor_call.estimate_gas({"from": sender})
            gas_limit = int(gas_est * 1.2)
            log.info("Gas estimate: %d  limit: %d", gas_est, gas_limit)
        except Exception as exc:
            log.warning("Gas estimation failed (%s) — using fixed 2_000_000", exc)
            gas_limit = 2_000_000

        tx = constructor_call.build_transaction({
            "from": sender,
            "nonce": nonce,
            "gasPrice": int(gas_price * 1.1),
            "gas": gas_limit,
            "chainId": chain_id,
        })

        signed = w3.eth.account.sign_transaction(tx, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        log.info("Deploy tx sent: %s", tx_hash.hex())
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)

        if receipt["status"] != 1:
            raise RuntimeError("Contract deployment transaction reverted")

        log.info("Deployed at %s", receipt["contractAddress"])
        return {
            "address": receipt["contractAddress"],
            "tx_hash": tx_hash.hex(),
        }

    return await asyncio.to_thread(_blocking_deploy)


@router.post(
    "/contract",
    summary="Deploy FlashLoan smart contract",
    description=(
        "Compiles (artifact must exist) and deploys `FlashLoan.sol` to the configured network "
        "using the wallet's stored private key. On success the contract address is written to "
        "the user's settings so auto-execution activates immediately.\n\n"
        "**Prerequisites:**\n"
        "- `WALLET_ENCRYPTION_KEY` must be set on the server\n"
        "- `ETH_RPC_URL` must be set on the server (points at the target network)\n"
        "- The user must have stored their private key via `PUT /settings/wallet-key`\n"
        "- The FlashLoan artifact must exist (`make contract-compile`)"
    ),
    response_model=None,
)
async def deploy_contract(user: dict = Depends(get_current_user)):
    app_settings = get_settings()

    if not app_settings.wallet_encryption_key:
        raise ApiException(
            status_code=503,
            code="ENCRYPTION_NOT_CONFIGURED",
            message="Wallet encryption is not configured on this server",
        )
    if not app_settings.eth_rpc_url:
        raise ApiException(
            status_code=503,
            code="RPC_NOT_CONFIGURED",
            message="ETH_RPC_URL is not configured on this server",
        )

    wallet = user["wallet_address"]
    db = get_db()

    settings_doc = await db.settings.find_one({"wallet_address": wallet})
    encrypted_key = settings_doc.get("encrypted_private_key") if settings_doc else None
    if not encrypted_key:
        raise ApiException(
            status_code=400,
            code="NO_WALLET_KEY",
            message="Store your private key first via Settings → Auto-execute",
        )

    try:
        private_key = decrypt_private_key(encrypted_key, wallet, app_settings.wallet_encryption_key)
    except Exception as exc:
        raise ApiException(
            status_code=500,
            code="DECRYPTION_FAILED",
            message=f"Failed to decrypt wallet key: {exc}",
        )

    try:
        result = await _deploy(
            app_settings.deploy_rpc_url,
            private_key,
            app_settings.deploy_network,
            app_settings.flash_loan_abi_path,
        )
    except FileNotFoundError as exc:
        raise ApiException(status_code=503, code="ARTIFACT_MISSING", message=str(exc))
    except ValueError as exc:
        raise ApiException(status_code=400, code="DEPLOY_CONFIG_ERROR", message=str(exc))
    except Exception as exc:
        raise ApiException(status_code=500, code="DEPLOY_FAILED", message=str(exc))
    finally:
        del private_key

    contract_address = result["address"]
    await db.settings.update_one(
        {"wallet_address": wallet},
        {
            "$set": {
                "flash_loan_contract": contract_address,
                "updated_at": now_utc(),
            }
        },
        upsert=True,
    )

    return ok({
        "address": contract_address,
        "tx_hash": result["tx_hash"],
        "network": app_settings.deploy_network,
    })
