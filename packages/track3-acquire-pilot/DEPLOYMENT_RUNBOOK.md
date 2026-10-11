# TURNKEY BUYER DEPLOYMENT RUNBOOK (`GF-T3-151`)
**Target Asset:** `GF-T3-151 // ApexLimit Order Matching & Real-Time Risk Liquidation Engine`  
**Deploy Target SLA:** `< 15 Minutes` (Local Docker, Google Cloud Run, or Render Blueprint)  
**Runtime Stack:** Python 3.11+ · FastAPI · Uvicorn · Non-Root Distroless/Slim Container (`UID 10001`)

---

## STEP 1: LOCAL DOCKER & OFFLINE PYTEST VERIFICATION

The ApexLimit Engine is engineered to run completely offline with **zero external network or third-party API dependencies**.

### 1.1 Run the Offline Verification Suite (`>95%` Coverage)
```bash
cd packages/track3-acquire-pilot

# Create isolated Python 3.11+ virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt pytest-cov

# Execute deterministic unit + gateway verification suite
pytest --cov=src --cov-report=term-missing -v
```

### 1.2 Build & Launch the Hardened Docker Container
```bash
# Build multi-stage non-root image (UID/GID 10001:10001)
docker build -t gf-t3-151-apexlimit:1.0.0 .

# Run container on port 8080
docker run --rm -p 8080:8080 --env-file .env.example gf-t3-151-apexlimit:1.0.0
```
*(Alternatively, run `docker compose up --build` using the included `docker-compose.yml`.)*

### 1.3 Smoke-Test Live Endpoints
```bash
# 1. Check Engine Telemetry & Health Probe
curl -s http://localhost:8080/health | python3 -m json.tool

# 2. Inspect Pre-Seeded BTC-USD Level 2 Orderbook
curl -s "http://localhost:8080/v1/orderbook/BTC-USD?depth=5" | python3 -m json.tool

# 3. Deposit Collateral & Submit a Crossing Limit Order
curl -s -X POST http://localhost:8080/v1/risk/deposit \
  -H "Content-Type: application/json" \
  -d '{"account_id": "buyer_test_01", "amount": 250000.0, "asset_id": "USD"}'

curl -s -X POST http://localhost:8080/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "client_order_id": "buy_cross_001",
    "account_id": "buyer_test_01",
    "symbol": "BTC-USD",
    "side": "BUY",
    "order_type": "LIMIT",
    "price": 65050.0,
    "quantity": 0.5
  }' | python3 -m json.tool
```
Interactive Swagger / OpenAPI 3.1 documentation is automatically served at `http://localhost:8080/docs`.

---

## STEP 2: ENVIRONMENT VARIABLES CONFIGURATION (`.env.example`)

Copy `.env.example` to `.env` for local customization or inject these variables into your cloud secret manager:

```bash
cp .env.example .env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `8080` | HTTP listener port exposed by Uvicorn and the Docker container |
| `HOST` | `0.0.0.0` | Bind interface address |
| `APP_ENV` | `development` | Environment profile (`development`, `staging`, `production`) |
| `LOG_LEVEL` | `INFO` | Structured JSON logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `PRECISION_SCALE` | `100000000` | Fixed-point $10^8$ integer scaling constant (prevents IEEE-754 float drift) |
| `DEFAULT_INITIAL_MARGIN_BPS` | `1000` | Default initial margin requirement in basis points (`1000 bps = 10%` / `10x` max leverage) |
| `DEFAULT_MAINTENANCE_MARGIN_BPS` | `500` | Default maintenance margin liquidation threshold (`500 bps = 5%`) |
| `DATABASE_URL` | *(Optional)* | PostgreSQL / AlloyDB connection string for Level-2 audit persistence |

---

## STEP 3: 1-CLICK CLOUD DEPLOYMENT (CLOUD RUN & RENDER)

### Option A: Google Cloud Run (1-Command Serverless Container Deploy)
Ensure the Google Cloud SDK (`gcloud`) is authenticated to your target GCP project, then execute:

```bash
gcloud run deploy gf-t3-151-apexlimit-engine \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars="APP_ENV=production,LOG_LEVEL=INFO,PRECISION_SCALE=100000000"
```

Verify your deployed Cloud Run URL:
```bash
SERVICE_URL=$(gcloud run services describe gf-t3-151-apexlimit-engine --region us-central1 --format='value(status.url)')
curl -i "$SERVICE_URL/healthz"
```

### Option B: Render.com Container Web Service Deploy
1. Push this directory to your private GitHub/GitLab repository.
2. In the **Render Dashboard**, click **New + → Web Service** (or **Blueprint**).
3. Select **Docker** as the runtime environment:
   - **Dockerfile Path:** `./Dockerfile`
   - **Port:** `8080`
   - **Health Check Path:** `/healthz`
4. Click **Create Web Service** — Render will build the multi-stage container and verify `/healthz` (`HTTP 200 OK`) automatically.
