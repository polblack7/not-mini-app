from __future__ import annotations

from typing import Protocol

from core.mock_data import compute_kpis, compute_summary, generate_logs, generate_ops


class TradingBotAdapter(Protocol):
    def start(self, wallet_address: str, settings: dict) -> None: ...

    def stop(self, wallet_address: str) -> None: ...

    def status(self, wallet_address: str) -> dict: ...

    def get_kpis(self, wallet_address: str) -> dict: ...

    def get_ops(self, wallet_address: str, filters: dict) -> list: ...

    def get_stats(self, wallet_address: str, filters: dict) -> dict: ...

    def get_logs(self, wallet_address: str, limit: int) -> list: ...


class MockTradingBotAdapter:
    def start(self, wallet_address: str, settings: dict) -> None:
        return None

    def stop(self, wallet_address: str) -> None:
        return None

    def status(self, wallet_address: str) -> dict:
        return {"status": "active", "last_error": None}

    def get_kpis(self, wallet_address: str) -> dict:
        ops = generate_ops(wallet_address, count=24)
        return compute_kpis(ops)

    def get_ops(self, wallet_address: str, filters: dict) -> list:
        return generate_ops(wallet_address, count=30)

    def get_stats(self, wallet_address: str, filters: dict) -> dict:
        ops = generate_ops(wallet_address, count=30)
        return compute_summary(ops)

    def get_logs(self, wallet_address: str, limit: int) -> list:
        return generate_logs(wallet_address, count=limit)


def get_adapter() -> TradingBotAdapter:
    return MockTradingBotAdapter()
