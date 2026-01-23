# not-mini-app Backend API (Full Detail)

This document describes every request and every internal step of the not-mini-app backend.
The system is an MVP for a Telegram Mini App + bot that controls an arbitrage bot.
The trading logic is mocked; the API handles auth, storage, notifications, and orchestration.

## Architecture and processes

- FastAPI API server (`backend/api/`) exposes REST endpoints.
- MongoDB stores all persistent data for the API and bot.
- Telegram bot (`backend/bot/`) registers chat IDs and opens the Mini App.
- External trading bot or adapter is expected to call `/internal/event` (not implemented here).

## File and module map

- `backend/api/main.py` FastAPI app setup, CORS config, exception handlers, rate limit dependency, router registration.
- `backend/api/routers/auth.py` `POST /auth/login`.
- `backend/api/routers/profile.py` `GET /me`.
- `backend/api/routers/settings.py` `GET /settings`, `PUT /settings`.
- `backend/api/routers/bot.py` `POST /bot/start`, `POST /bot/stop`, `GET /bot/status`.
- `backend/api/routers/reports.py` `GET /ops`, `GET /stats/summary`, `GET /export/csv`, `GET /export/json`.
- `backend/api/routers/market.py` `GET /market/analysis`, `GET /market/opportunities`.
- `backend/api/routers/notifications.py` `GET /notifications`, `POST /notifications/read`.
- `backend/api/routers/logs.py` `GET /logs/recent`.
- `backend/api/routers/internal.py` `POST /internal/event`, `GET /internal/active-users`.
- `backend/api/auth.py` JWT encoding/decoding and `get_current_user`.
- `backend/api/ratelimit.py` in-memory per-IP/per-path limiter.
- `backend/api/seed.py` mock data seeding on first login.
- `backend/api/services.py` DB helpers: `format_doc`, `create_notification`, `create_log`.
- `backend/api/telegram.py` Telegram messaging helper for wallet notifications.
- `backend/api/schemas.py` Pydantic schemas for requests and responses.
- `backend/api/errors.py` `ApiException` used for structured errors.
- `backend/api/responses.py` `ok(...)` and `error(...)` response helpers.
- `backend/core/config.py` environment loading and `Settings` dataclass.
- `backend/core/db.py` Mongo connection and index creation.
- `backend/core/utils.py` wallet regex, UTC timestamps, token hashing.
- `backend/core/mock_data.py` mock ops/logs/notifications/opportunities and KPI calculations.
- `backend/core/trading_adapter.py` adapter protocol and mock adapter.
- `backend/bot/main.py` Telegram bot entrypoint.

## Startup behavior (API server)

- The FastAPI app is created with title `ØNE-ARB API` and version `0.1.0`.
- CORS is enabled:
  - `CORS_ORIGINS` is split by commas and whitespace is trimmed.
  - If the resulting list is empty, it falls back to `http://localhost:5173`.
  - `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`.
- On startup:
  - `logging.basicConfig(level=INFO)` is called.
  - Mongo indexes are created by `init_indexes()`.
- Exception handlers:
  - `ApiException` returns `{ ok: false, error: { code, message } }` with the same status code.
  - `HTTPException` with a dict `{ code, message }` is returned as-is.
  - Other `HTTPException` values return `{ code: "HTTP_ERROR", message: <detail> }`.
  - Validation errors return `{ code: "VALIDATION_ERROR", message: "Invalid request payload" }` (422).
- Rate limiter:
  - `rate_limiter()` dependency is applied to every router.

## Configuration (.env)

Loaded from `not-mini-app/.env` via `core/config.py`.

- `MONGO_URL` MongoDB DSN (default `mongodb://localhost:27017/onearb`).
- `BOT_TOKEN` Telegram bot token (optional for API, required for bot and Telegram notifications).
- `JWT_SECRET` JWT signing key (HS256).
- `JWT_TTL_MINUTES` JWT expiry time in minutes (default `10080`).
- `ACCESS_TOKEN_MASTER` optional master token for first login or token rotation.
- `INTERNAL_API_KEY` shared secret for internal endpoints.
- `CORS_ORIGINS` comma-separated origins for CORS (default `http://localhost:5173`).
- `MINIAPP_URL` URL used by the Telegram bot "Open ØNE-ARB" button.

## Common request/response conventions

- Requests are JSON; use `Content-Type: application/json`.
- Protected endpoints require `Authorization: Bearer <jwt>`.
- Internal endpoints require `X-Internal-Key: <INTERNAL_API_KEY>`.
- Default response envelope:

```json
{ "ok": true, "data": {} }
```

- Error response envelope:

```json
{ "ok": false, "error": { "code": "ERROR_CODE", "message": "Human readable message" } }
```

- Datetimes are stored in UTC (timezone-aware) and serialized by FastAPI/JSONResponse.
- `access_token` in `/auth/login` is not a JWT; it is a separate shared secret hashed into `users.access_token_hash`.

## Rate limiting

- Key format: `<client_ip>:<request_path>`.
- Limit: 60 requests per 60 seconds per key.
- Implemented in memory; resets on process restart.
- Query parameters are not part of the key.
- No user-based or token-based limit is applied.

## Authentication and security

- JWT payload: `{ "sub": "<wallet_address>", "exp": <expiry> }`.
- Algorithm: HS256 using `JWT_SECRET`.
- `get_current_user`:
  - Validates the token and extracts the wallet address.
  - Fetches the user from MongoDB.
  - If missing or invalid, raises `AUTH_INVALID`.
- Missing `Authorization` header triggers a `HTTPException` from FastAPI's `HTTPBearer`.
- Internal routes validate `X-Internal-Key` and reject requests with `AUTH_INVALID` (401).

## MongoDB collections and fields

All collections are in the default database for `MONGO_URL` (default database name: `onearb`).

### `users`

- `wallet_address` string, unique index.
- `access_token_hash` string, SHA256 hex of the `access_token` from `/auth/login`.
- `created_at` UTC datetime set on first login.
- `last_login` UTC datetime updated on every login.
- `total_profit` float, updated by internal `op` events.
- `successful_arbs` int, updated by internal `op` events.
- `avg_profitability` float, computed as `total_profit / successful_arbs`.

### `settings`

- `wallet_address` string, unique index.
- `min_profit_pct` float, default `0.3`.
- `loan_limit` float, default `3.0`.
- `dex_list` list of strings.
- `pairs` list of strings.
- `scan_frequency_sec` int, default `15`.
- `updated_at` UTC datetime.

### `ops`

- `wallet_address` string, indexed.
- `timestamp` UTC datetime (from payload or `now_utc()`).
- `pair` string.
- `dex` string.
- `profit` float.
- `fees` float.
- `exec_time_ms` int.
- `status` string (`"success"` or `"fail"`).
- `error_message` string or `null`.

### `notifications`

- `wallet_address` string, indexed.
- `created_at` UTC datetime.
- `type` string (`"info"`, `"deal"`, `"error"`, `"opportunity"`).
- `title` string.
- `message` string.
- `read` bool (default `false`).

### `logs`

- `wallet_address` string, indexed.
- `created_at` UTC datetime.
- `level` string (`"info"`, `"warning"`, `"error"`).
- `message` string.
- `context` object.

### `bot_state`

- `wallet_address` string, unique index.
- `status` string (`"active"`, `"stopped"`, or `"error"` from internal events).
- `last_error` string or `null`.
- `last_change_at` UTC datetime.

### `telegram_users`

- `telegram_user_id` int, unique index.
- `chat_id` int (set by `/start` in the bot).
- `wallet_address` string, indexed.

### `_id` mapping in responses

- `format_doc` replaces Mongo `_id` with `id` (string) in list responses.

## MongoDB indexes

Created at startup by `init_indexes()`:

- `users.wallet_address` unique.
- `settings.wallet_address` unique.
- `ops.wallet_address` index.
- `notifications.wallet_address` index.
- `logs.wallet_address` index.
- `bot_state.wallet_address` unique.
- `telegram_users.telegram_user_id` unique.
- `telegram_users.wallet_address` index.

## Mock data and seed behavior

`ensure_mock_seed(wallet_address)` runs during `/auth/login`.

- If a collection has no documents for the wallet, it inserts mock data:
  - `ops` from `generate_ops(wallet_address, count=30)`.
  - `logs` from `generate_logs(wallet_address, count=12)`.
  - `notifications` from `generate_notifications(wallet_address, count=5)`.
  - `bot_state` with `status="stopped"`, `last_error=None`, `last_change_at=now_utc()`.
- Seeding uses `count_documents` and only runs when the collection is empty for that wallet.

Mock data is deterministic per wallet address (seeded by summing character codes).

### `generate_ops`

- Count default: 30.
- Timestamp spread across the last ~24 hours.
- `profit` range: -0.05 .. 0.24.
- `fees` range: 0.001 .. 0.02.
- `exec_time_ms` range: 180 .. 1450.
- `status` is `"success"` if profit > 0 else `"fail"`.
- `error_message` is `"Slippage exceeded"` for failures.

### `generate_logs`

- Count default: 12.
- Timestamps spaced 6 minutes apart.
- `level` is one of `info`, `warning`, `error`.
- `message` is chosen from a fixed list.
- `context` includes `{ "tick": <n> }`.

### `generate_notifications`

- Count default: 5.
- Fixed set of example items (opportunity, deal, error, start, stop).
- `read` is `false`.

### `generate_opportunities`

- Count default: 4.
- `id` format: `opp-<n>`.
- `expected_profit_pct` range: 0.2 .. 1.4.
- `liquidity_score` range: 0.6 .. 0.98.
- `pair` and `dex` chosen from fixed lists.

### KPI calculations

- `compute_kpis(ops)`:
  - `current_profit` = sum of `profit` for `status == "success"`.
  - `completed_deals` = count of successful ops.
  - `avg_profitability` = `current_profit / completed_deals` (0 if none).
  - Values are rounded to 4 decimals.
- `compute_summary(ops)`:
  - Uses `compute_kpis`.
  - `success_rate` = `completed_deals / total` (rounded to 4 decimals).

## Trading adapter

Defined in `backend/core/trading_adapter.py`.

- `TradingBotAdapter` protocol defines:
  - `start`, `stop`, `status`, `get_kpis`, `get_ops`, `get_stats`, `get_logs`.
- `MockTradingBotAdapter` implementation:
  - `start` and `stop` are no-ops.
  - `status` returns `{ "status": "active", "last_error": null }`.
  - `get_kpis`, `get_ops`, `get_stats`, `get_logs` return mock data.
- `get_adapter()` always returns `MockTradingBotAdapter` (no real adapter wired).

## Telegram bot details

- The bot runs separately via `python -m bot.main`.
- `/start`:
  - Upserts `telegram_user_id` and `chat_id` into `telegram_users`.
  - Replies with an inline button labeled "Open ØNE-ARB" using `MINIAPP_URL` (or `https://example.com` as fallback).
- `/help`:
  - Sends a static help message.
- The bot uses HTML parse mode.
- Telegram notifications:
  - `notify_wallet` looks up a wallet's `chat_id` in `telegram_users`.
  - If mapping or token is missing, it silently returns.
  - It logs a warning on send failure but does not raise.

## End-to-end runtime flow

1. User runs `/start` in Telegram; the bot stores `telegram_user_id` + `chat_id`.
2. Client calls `POST /auth/login` with wallet and access token.
3. API validates, creates or updates the user, seeds mock data if needed, and returns a JWT.
4. Client uses JWT to call `/me`, `/settings`, `/bot/*`, `/notifications`, `/logs`, `/ops`, etc.
5. External adapter sends operational data to `POST /internal/event`.
6. Internal events update Mongo and trigger notifications + Telegram messages.
7. UI reads the latest state via `/bot/status` and report endpoints.

## Endpoint reference (every request)

All endpoints are rate-limited by the global rate limiter.

### `POST /auth/login`

- Auth: none.
- Body (JSON):
  - `wallet_address` string, required, must match `^0x[a-fA-F0-9]{40}$`.
  - `access_token` string, required, min length 3.
  - `telegram_user_id` int, optional.
- Behavior:
  - Validates the wallet format.
  - Hashes `access_token` with SHA256 (`access_token_hash`).
  - If user exists:
    - If stored hash exists and does not match, and `access_token` is not `ACCESS_TOKEN_MASTER`: `AUTH_INVALID` (401).
    - If stored hash differs and `access_token` matches `ACCESS_TOKEN_MASTER`: updates the stored hash.
  - If user does not exist:
    - If `ACCESS_TOKEN_MASTER` is set and the token does not match it: `AUTH_INVALID` (401).
    - Otherwise, inserts a new user with default stats and stores `access_token_hash`.
  - Updates `last_login` timestamp.
  - If `telegram_user_id` is provided: upserts mapping `{ telegram_user_id -> wallet_address }`.
  - Calls `ensure_mock_seed(wallet_address)`.
  - Creates JWT token with `sub=wallet_address`.
- Response (200):
  - `{ token, profile }` inside the `ok` envelope.
  - `profile` fields: `wallet_address`, `created_at`, `last_login`, `total_profit`, `successful_arbs`, `avg_profitability`.
- Errors:
  - `WALLET_INVALID` (400).
  - `AUTH_INVALID` (401).

### `GET /me`

- Auth: Bearer JWT.
- Response:
  - Current user profile built from the `users` document.

### `GET /settings`

- Auth: Bearer JWT.
- Behavior:
  - Reads the `settings` doc for the wallet.
  - If missing, creates defaults:
    - `min_profit_pct=0.3`
    - `loan_limit=3.0`
    - `dex_list=["Uniswap","SushiSwap","Curve"]`
    - `pairs=["ETH/USDT","WBTC/ETH"]`
    - `scan_frequency_sec=15`
    - `updated_at=now_utc()`
- Response:
  - Settings payload with `updated_at`.

### `PUT /settings`

- Auth: Bearer JWT.
- Body (JSON):
  - `min_profit_pct` float
  - `loan_limit` float
  - `dex_list` list of strings
  - `pairs` list of strings
  - `scan_frequency_sec` int
- Behavior:
  - Upserts the settings for the wallet.
  - Updates `updated_at` to `now_utc()`.
- Response:
  - The saved settings payload.

### `POST /bot/start`

- Auth: Bearer JWT.
- Behavior:
  - Loads settings from `settings` collection (or `{}` if missing).
  - Calls `adapter.start(wallet_address, settings)`.
  - Upserts `bot_state` to `{ status: "active", last_change_at: now_utc(), last_error: null }`.
  - Creates a notification: type `info`, title `Bot started`, message `Monitoring enabled`.
- Response:
  - `{ "status": "active" }`.

### `POST /bot/stop`

- Auth: Bearer JWT.
- Behavior:
  - Calls `adapter.stop(wallet_address)`.
  - Upserts `bot_state` to `{ status: "stopped", last_change_at: now_utc() }`.
  - Creates a notification: type `info`, title `Bot stopped`, message `Monitoring paused`.
- Response:
  - `{ "status": "stopped" }`.

### `GET /bot/status`

- Auth: Bearer JWT.
- Behavior:
  - Reads `bot_state` for the wallet (default `status="stopped"` if missing).
  - Reads up to 200 ops for the wallet (no sort order).
  - Computes KPIs via `compute_kpis`.
- Response:
  - `{ status, last_error, kpis }`, where `kpis` has:
    - `current_profit`
    - `completed_deals`
    - `avg_profitability`

### `GET /market/analysis`

- Auth: Bearer JWT.
- Behavior:
  - Calls `adapter.get_stats(wallet_address, filters={})`.
  - In the mock adapter, this is a summary of generated ops.
- Response:
  - `{ "summary": { total_profit, successful_arbs, avg_profitability, success_rate } }`.

### `GET /market/opportunities`

- Auth: Bearer JWT.
- Behavior:
  - Returns `generate_opportunities(wallet_address, count=4)`.
- Response: list of objects:
  - `id`, `pair`, `dex`, `expected_profit_pct`, `liquidity_score`.

### `GET /ops`

- Auth: Bearer JWT.
- Query parameters:
  - `from` optional ISO datetime (mapped to `from_ts`).
  - `to` optional ISO datetime (mapped to `to_ts`).
  - `pair` optional string.
  - `dex` optional string.
  - `limit` int, default 200.
- Behavior:
  - Builds Mongo query by wallet + optional timestamp range + pair/dex.
  - Sorts by `timestamp` descending.
  - Converts `_id` to `id` using `format_doc`.
- Response:
  - List of op records in the `ok` envelope.

### `GET /stats/summary`

- Auth: Bearer JWT.
- Query parameters: same as `/ops`.
- Behavior:
  - Loads up to 1000 ops for the wallet and filters.
  - Computes summary metrics with `compute_summary`.
- Response:
  - `{ total_profit, successful_arbs, avg_profitability, success_rate }`.

### `GET /export/csv`

- Auth: Bearer JWT.
- Query parameters: same as `/ops`.
- Behavior:
  - Loads up to 2000 ops for the wallet and filters.
  - Writes CSV with header:
    - `timestamp,pair,dex,profit,fees,exec_time_ms,status,error_message`
- Response:
  - `text/csv` streaming response.
  - Header: `Content-Disposition: attachment; filename=ops.csv`.
  - Note: no `ok` envelope.

### `GET /export/json`

- Auth: Bearer JWT.
- Query parameters: same as `/ops`.
- Behavior:
  - Loads up to 2000 ops for the wallet and filters.
  - Converts `_id` to `id` for each op.
- Response:
  - JSON response with `ok` envelope.
  - Header: `Content-Disposition: attachment; filename=ops.json`.

### `GET /notifications`

- Auth: Bearer JWT.
- Query parameters:
  - `limit` int, default 20.
- Behavior:
  - Sorts by `created_at` descending.
  - Converts `_id` to `id`.
- Response:
  - List of notifications in the `ok` envelope.

### `POST /notifications/read`

- Auth: Bearer JWT.
- Body (JSON):
  - `ids`: list of string ObjectIds.
- Behavior:
  - If `ids` is empty, returns `{ updated: 0 }`.
  - Converts each id to `ObjectId` and sets `read=true`.
  - Returns `updated` equal to the input length (not the actual modified count).
- Response:
  - `{ "updated": <len(ids)> }`.
- Notes:
  - Invalid ObjectId strings will raise an error.

### `GET /logs/recent`

- Auth: Bearer JWT.
- Query parameters:
  - `limit` int, default 20.
- Behavior:
  - Sorts by `created_at` descending.
  - Converts `_id` to `id`.
- Response:
  - List of log entries in the `ok` envelope.

### `POST /internal/event`

- Auth: `X-Internal-Key` required.
- Body (JSON):
  - `wallet_address` string.
  - `type` string: `op`, `log`, `notification`, `opportunity`, `status`.
  - `payload` object: content depends on `type`.
- Behavior by `type`:
  - `op`:
    - Inserts an op record with:
      - `timestamp` default `now_utc()`.
      - `pair` default `""`.
      - `dex` default `""`.
      - `profit` cast to float (default `0`).
      - `fees` cast to float (default `0`).
      - `exec_time_ms` cast to int (default `0`).
      - `status` default `"success"`.
      - `error_message` from payload.
    - If `status == "success"`:
      - Updates `users.total_profit`, `users.successful_arbs`, `users.avg_profitability`.
    - Always creates a notification: type `deal`, title `Deal completed`, message `Profit <profit>`.
    - Sends Telegram message: `Deal completed: <pair> profit <profit>`.
  - `log`:
    - Inserts a log entry with `level`, `message`, and `context`.
  - `notification`:
    - Inserts a notification with `type`, `title`, `message`.
    - Sends Telegram message `<title>: <message>`.
  - `opportunity`:
    - Inserts a notification with type `opportunity`.
    - Sends Telegram message `Opportunity: <message>`.
  - `status`:
    - Upserts `bot_state` with `status`, `last_error`, `last_change_at`.
    - Inserts a notification with type `error`, title `Critical error`.
    - Sends Telegram message `Critical error: <last_error>`.
  - Unknown `type` -> `EVENT_INVALID` (400).
- Response:
  - `{ "status": "accepted" }`.

### `GET /internal/active-users`

- Auth: `X-Internal-Key` required.
- Behavior:
  - Returns `wallet_address` for all `bot_state` records where `status == "active"`.
- Response:
  - List of wallet addresses in the `ok` envelope.



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

