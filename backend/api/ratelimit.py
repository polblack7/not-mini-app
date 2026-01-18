from __future__ import annotations

import time
from collections import defaultdict
from typing import Callable

from fastapi import Request

from api.errors import ApiException

RATE_LIMIT_BUCKET: dict[str, list[float]] = defaultdict(list)


def rate_limiter(limit: int = 60, window_seconds: int = 60) -> Callable:
    async def _limit(request: Request) -> None:
        client_host = request.client.host if request.client else "unknown"
        key = f"{client_host}:{request.url.path}"
        now = time.time()
        bucket = RATE_LIMIT_BUCKET[key]
        bucket[:] = [ts for ts in bucket if now - ts < window_seconds]
        if len(bucket) >= limit:
            raise ApiException(status_code=429, code="RATE_LIMIT", message="Too many requests")
        bucket.append(now)

    return _limit
