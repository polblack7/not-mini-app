from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes


def _derive_key(master_key: str, wallet_address: str) -> bytes:
    """Derive a per-user Fernet key from master key + wallet address via HKDF."""
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=hashlib.sha256(wallet_address.lower().encode()).digest(),
        info=b"onearb-wallet-key",
    )
    raw = hkdf.derive(master_key.encode())
    return base64.urlsafe_b64encode(raw)


def encrypt_private_key(private_key: str, wallet_address: str, master_key: str) -> str:
    """Encrypt a private key using a per-user derived Fernet key."""
    fernet = Fernet(_derive_key(master_key, wallet_address))
    return fernet.encrypt(private_key.encode()).decode()


def decrypt_private_key(ciphertext: str, wallet_address: str, master_key: str) -> str:
    """Decrypt a private key using a per-user derived Fernet key."""
    fernet = Fernet(_derive_key(master_key, wallet_address))
    return fernet.decrypt(ciphertext.encode()).decode()
