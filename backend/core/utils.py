import hashlib
import re
from datetime import datetime, timezone

WALLET_RE = re.compile(r"^0x[a-fA-F0-9]{40}$")


def is_valid_wallet(wallet_address: str) -> bool:
    return bool(WALLET_RE.match(wallet_address))


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
