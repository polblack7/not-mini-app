# ØNE-ARB Telegram Mini App + Bot Backend

MVP for a Telegram Mini App (React) with a Python backend (FastAPI + aiogram) that controls an external arbitrage bot via a thin adapter stub. The trading/arbitrage logic is intentionally **not** implemented.

## Structure

- `frontend/` - Telegram Mini App UI (React + Vite)
- `backend/api/` - FastAPI REST API
- `backend/bot/` - Telegram bot (aiogram v3, polling)
- `backend/core/` - shared config/db/adapter code
- `infra/` - docker-compose with MongoDB

## Quick Start (Local)

1) Start MongoDB

```bash
cd infra
docker-compose up -d
```

2) Configure environment

```bash
cp .env.example .env
```

Fill in `BOT_TOKEN`, `JWT_SECRET`, `ACCESS_TOKEN_MASTER`, `INTERNAL_API_KEY`, and `MINIAPP_URL`.

For the frontend, create `frontend/.env` from `frontend/.env.example` if you need a custom API base URL.

3) Run the API

```bash
cd backend
pip install -r requirements.txt
uvicorn api.main:app --reload
```

4) Run the bot

```bash
cd backend
python -m bot.main
```

5) Run the frontend

```bash
cd frontend
npm install
npm run dev
```

## Telegram Bot Setup

- Create a bot via BotFather and copy `BOT_TOKEN` into `.env`.
- Set the Mini App URL in BotFather and in `.env` as `MINIAPP_URL`.
- Use `/start` to get a button that opens the Mini App.
- The bot runs in polling mode for the MVP.

## Testing the Mini App outside Telegram

Open `http://localhost:5173` in your browser. The app uses the Telegram WebApp SDK when it is available, but it will work in dev mode without Telegram.

## Adapter Integration

The adapter lives in `backend/core/trading_adapter.py`. The default is `MockTradingBotAdapter`.

To wire a real adapter:

1) Implement `RealTradingBotAdapter` with the same methods as `TradingBotAdapter`.
2) Update `get_adapter()` in `backend/core/trading_adapter.py` to return the real adapter.

## Internal Events

The API exposes:

- `POST /internal/event` (protected by `INTERNAL_API_KEY`)

Payload:

```json
{
  "wallet_address": "0x...",
  "type": "op | log | notification | opportunity | status",
  "payload": {}
}
```

The endpoint stores ops/logs/notifications, updates bot state, and sends a Telegram message if `chat_id` is known.
