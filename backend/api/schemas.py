from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class ApiError(BaseModel):
    code: str
    message: str


class ApiResponse(BaseModel):
    ok: bool
    data: Optional[Any] = None
    error: Optional[ApiError] = None


class LoginRequest(BaseModel):
    wallet_address: str = Field(..., description="Ethereum wallet address")
    access_token: str = Field(..., min_length=3)
    telegram_user_id: Optional[int] = None


class Profile(BaseModel):
    wallet_address: str
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    total_profit: float = 0.0
    successful_arbs: int = 0
    avg_profitability: float = 0.0


class LoginResponse(BaseModel):
    token: str
    profile: Profile


class SettingsPayload(BaseModel):
    min_profit_pct: float = 0.3
    loan_limit: float = 3.0
    dex_list: list[str] = Field(default_factory=list)
    pairs: list[str] = Field(default_factory=list)
    scan_frequency_sec: int = 15


class SettingsResponse(SettingsPayload):
    updated_at: Optional[datetime] = None


class BotKpis(BaseModel):
    current_profit: float
    completed_deals: int
    avg_profitability: float


class BotStatusResponse(BaseModel):
    status: str
    last_error: Optional[str] = None
    kpis: BotKpis


class OpRecord(BaseModel):
    id: Optional[str] = None
    timestamp: datetime
    pair: str
    dex: str
    profit: float
    fees: float
    exec_time_ms: int
    status: str
    error_message: Optional[str] = None


class StatsSummary(BaseModel):
    total_profit: float
    successful_arbs: int
    avg_profitability: float
    success_rate: float


class Notification(BaseModel):
    id: Optional[str] = None
    created_at: datetime
    type: str
    title: str
    message: str
    read: bool = False


class NotificationReadRequest(BaseModel):
    ids: list[str]


class LogEntry(BaseModel):
    id: Optional[str] = None
    created_at: datetime
    level: str
    message: str
    context: Optional[dict[str, Any]] = None


class InternalEvent(BaseModel):
    wallet_address: str
    type: str
    payload: dict[str, Any]
