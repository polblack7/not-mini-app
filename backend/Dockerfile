FROM python:3.11-slim-bookworm

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
ENV FLASH_LOAN_ABI_PATH=/app/artifacts/FlashLoan.json

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--root-path", "/api"]
