from __future__ import annotations

from typing import Protocol


class TradingBotAdapter(Protocol):
    def start(self, wallet_address: str, settings: dict) -> None: ...

    def stop(self, wallet_address: str) -> None: ...

    def status(self, wallet_address: str) -> dict: ...


class MockTradingBotAdapter:
    def start(self, wallet_address: str, settings: dict) -> None:
        return None

    def stop(self, wallet_address: str) -> None:
        return None

    def status(self, wallet_address: str) -> dict:
        return {"status": "active", "last_error": None}


def get_adapter() -> TradingBotAdapter:
    return MockTradingBotAdapter()
