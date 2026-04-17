from __future__ import annotations

import logging

from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from api.errors import ApiException
from api.ratelimit import rate_limiter
from api.responses import error
from api.routers import auth, bot, deploy, internal, logs, market, notifications, profile, reports, settings
from core.config import get_settings
from core.db import init_indexes

app = FastAPI(
    title="ØNE-ARB API",
    version="0.1.0",
    description=(
        "Backend API for the ØNE-ARB Telegram Mini App.\n\n"
        "## Authentication\n"
        "Most endpoints require a JWT Bearer token obtained from `POST /auth/login`.\n"
        "Pass it as `Authorization: Bearer <token>`.\n\n"
        "## Internal endpoints\n"
        "Routes under `/internal/*` are for the DEX monitor service only "
        "and require the `X-Internal-Key` header."
    ),
    openapi_tags=[
        {"name": "auth",          "description": "Obtain and refresh JWT tokens."},
        {"name": "profile",       "description": "Authenticated user profile and lifetime stats."},
        {"name": "settings",      "description": "Bot strategy settings and wallet key management."},
        {"name": "bot",           "description": "Start / stop the trading bot and read live KPIs."},
        {"name": "reports",       "description": "Trade history, aggregated stats, and data export."},
        {"name": "market",        "description": "Live arbitrage opportunities detected by the monitor."},
        {"name": "notifications", "description": "In-app notifications feed."},
        {"name": "logs",          "description": "Structured bot execution logs."},
        {"name": "deploy",        "description": "One-click smart contract deployment."},
        {"name": "internal",      "description": "Internal endpoints used by the DEX monitor service (X-Internal-Key required)."},
    ],
)

settings_env = get_settings()
origins = [origin.strip() for origin in settings_env.cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)





@app.on_event("startup")
async def startup() -> None:
    logging.basicConfig(level=logging.INFO)
    await init_indexes()


@app.exception_handler(ApiException)
async def api_exception_handler(request: Request, exc: ApiException):
    return JSONResponse(status_code=exc.status_code, content=error(exc.detail["code"], exc.detail["message"]))


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=error(exc.detail["code"], exc.detail["message"]))
    return JSONResponse(status_code=exc.status_code, content=error("HTTP_ERROR", str(exc.detail)))


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content=error("VALIDATION_ERROR", "Invalid request payload"))


rate_limit = Depends(rate_limiter())

app.include_router(auth.router, dependencies=[rate_limit])
app.include_router(profile.router, dependencies=[rate_limit])
app.include_router(settings.router, dependencies=[rate_limit])
app.include_router(bot.router, dependencies=[rate_limit])
app.include_router(reports.router, dependencies=[rate_limit])
app.include_router(market.router, dependencies=[rate_limit])
app.include_router(notifications.router, dependencies=[rate_limit])
app.include_router(logs.router, dependencies=[rate_limit])
app.include_router(deploy.router, dependencies=[rate_limit])
app.include_router(internal.router, dependencies=[rate_limit])
