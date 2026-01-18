from __future__ import annotations

import random
from datetime import timedelta

from core.utils import now_utc

DEXES = ["Uniswap", "SushiSwap", "Curve", "Balancer", "PancakeSwap"]
PAIRS = ["ETH/USDT", "WBTC/ETH", "ETH/DAI", "ARB/ETH", "UNI/USDC"]


def _rng(wallet_address: str) -> random.Random:
    seed = sum(ord(ch) for ch in wallet_address)
    return random.Random(seed)


def generate_ops(wallet_address: str, count: int = 30) -> list[dict]:
    rng = _rng(wallet_address)
    now = now_utc()
    ops: list[dict] = []
    for i in range(count):
        ts = now - timedelta(hours=24 * (count - i) / count)
        pair = rng.choice(PAIRS)
        dex = rng.choice(DEXES)
        profit = round(rng.uniform(-0.05, 0.24), 4)
        fees = round(rng.uniform(0.001, 0.02), 4)
        exec_time = rng.randint(180, 1450)
        status = "success" if profit > 0 else "fail"
        ops.append(
            {
                "wallet_address": wallet_address,
                "timestamp": ts,
                "pair": pair,
                "dex": dex,
                "profit": profit,
                "fees": fees,
                "exec_time_ms": exec_time,
                "status": status,
                "error_message": "" if status == "success" else "Slippage exceeded",
            }
        )
    return ops


def generate_logs(wallet_address: str, count: int = 12) -> list[dict]:
    rng = _rng(wallet_address)
    levels = ["info", "warning", "error"]
    messages = [
        "Scanner tick completed",
        "Liquidity snapshot updated",
        "Price impact above threshold",
        "Adapter heartbeat ok",
        "Execution delayed by RPC",
        "Profit window met",
        "Route rejected due to gas cost",
    ]
    now = now_utc()
    logs: list[dict] = []
    for i in range(count):
        ts = now - timedelta(minutes=6 * (count - i))
        logs.append(
            {
                "wallet_address": wallet_address,
                "created_at": ts,
                "level": rng.choice(levels),
                "message": rng.choice(messages),
                "context": {"tick": i + 1},
            }
        )
    return logs


def generate_notifications(wallet_address: str, count: int = 5) -> list[dict]:
    now = now_utc()
    items = [
        ("opportunity", "New opportunity", "Route ETH/USDT via Uniswap > Curve"),
        ("deal", "Deal completed", "+0.12 ETH net profit"),
        ("error", "Critical error", "Gas price spike interrupted execution"),
        ("info", "Bot started", "Monitoring enabled"),
        ("info", "Bot stopped", "Monitoring paused"),
    ]
    notifications = []
    for i, item in enumerate(items[:count]):
        ntype, title, message = item
        notifications.append(
            {
                "wallet_address": wallet_address,
                "created_at": now - timedelta(hours=2 * (count - i)),
                "type": ntype,
                "title": title,
                "message": message,
                "read": False,
            }
        )
    return notifications


def compute_kpis(ops: list[dict]) -> dict:
    if not ops:
        return {"current_profit": 0.0, "completed_deals": 0, "avg_profitability": 0.0}
    profit = sum(op["profit"] for op in ops if op["status"] == "success")
    successes = [op for op in ops if op["status"] == "success"]
    avg_profit = profit / len(successes) if successes else 0.0
    return {
        "current_profit": round(profit, 4),
        "completed_deals": len(successes),
        "avg_profitability": round(avg_profit, 4),
    }


def compute_summary(ops: list[dict]) -> dict:
    kpis = compute_kpis(ops)
    total = len(ops)
    success_rate = (kpis["completed_deals"] / total) if total else 0.0
    return {
        "total_profit": kpis["current_profit"],
        "successful_arbs": kpis["completed_deals"],
        "avg_profitability": kpis["avg_profitability"],
        "success_rate": round(success_rate, 4),
    }


def generate_opportunities(wallet_address: str, count: int = 4) -> list[dict]:
    rng = _rng(wallet_address)
    opportunities = []
    for i in range(count):
        pair = rng.choice(PAIRS)
        dex = rng.choice(DEXES)
        opportunities.append(
            {
                "id": f"opp-{i+1}",
                "pair": pair,
                "dex": dex,
                "expected_profit_pct": round(rng.uniform(0.2, 1.4), 2),
                "liquidity_score": round(rng.uniform(0.6, 0.98), 2),
            }
        )
    return opportunities
