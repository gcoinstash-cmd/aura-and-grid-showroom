# ASSET_TRANSFER_SPEC.md
## APEX-203 Quant Kalman Filter & Statistical Arbitrage Engine
### Asset Purchase Agreement (APA) Technical Handoff & Turnkey Deployment Specification

---

## 1. Asset Purchase Agreement (APA) & Clean Title Terms

### 1.1 Direct Repository Transfer & Intellectual Property Assignment
- **Transfer Mechanism**: Turnkey git repository handoff containing the complete source code, test suites, Docker configuration, and OpenAPI 3.1 specifications.
- **Title Warranty**: The Seller warrants clean, unencumbered title to all proprietary algorithms (2D Kalman Filter hedge ratio extraction, Welford $O(1)$ rolling Z-score, Ornstein-Uhlenbeck half-life estimation, and SHA-256 chained signal auditing).
- **Licensing Terms**: Unrestricted ownership assignment under permissive MIT clean-room terms. **Zero-SaaS SLA**, zero per-seat licensing, zero node-locking, and zero recurring royalties.

---

## 2. Google Cloud Run Turnkey Deployment Guide

APEX-203 is pre-configured for instant containerized deployment on Google Cloud Run via the provided `Dockerfile`.

### 2.1 Build & Push Container Image
```bash
# Set GCP Project and Region variables
export GCP_PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
export IMAGE_NAME="gcr.io/${GCP_PROJECT_ID}/apex203-quant-engine:latest"

# Build container image using Google Cloud Build
gcloud builds submit --tag ${IMAGE_NAME} .
```

### 2.2 Deploy to Cloud Run
```bash
gcloud run deploy apex203-quant-service \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars PYTHONUNBUFFERED=1
```

### 2.3 Environment Variables
- `PORT`: Automatically injected by Cloud Run (defaults to `8080`).
- `PYTHONUNBUFFERED`: Set to `1` for immediate stdout telemetry logging.

---

## 3. Cryptographic SHA-256 Audit Chain Verification Protocol

APEX-203 guarantees non-repudiation and zero-tamper institutional compliance for all quantitative trading signals via hash-linked block chaining.

### 3.1 Verification Algorithm (`verify_integrity()`)
1. Starts from Genesis Block ($H_0 = 0^{64}$).
2. Iterates sequentially through all blocks from index $1$ to $N$.
3. Recomputes $H_i = \text{SHA-256}(i \mathbin{\Vert} H_{i-1} \mathbin{\Vert} \text{timestamp} \mathbin{\Vert} \text{payload})$.
4. Returns `isValid: true` if every block hash matches and previous hash references remain unbroken. If any trade log is modified post-execution, hash divergence is instantly detected at the exact offending index.

### 3.2 Automated Testing & Verification
```bash
# Run full unit and integration test suite via pytest
python3 -m unittest discover -s tests -p "test_*.py" -v
```
