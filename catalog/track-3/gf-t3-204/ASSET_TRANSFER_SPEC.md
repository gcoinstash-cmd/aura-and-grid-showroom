# ASSET TRANSFER SPECIFICATION
## Standard Commercial Asset Transfer Specification (APA Buyout Track)
### Software Reference: APEX-204 Institutional Execution Core

---

## 1. Transfer Scope & Structure

This document establishes the technical handoff and title conveyance specification for the complete codebase, algorithmic models, and containerized deployment infrastructure of **APEX-204**.

- **Transfer Structure**: Direct standalone repository transfer under an outright Asset Purchase Agreement (APA).
- **Zero-SaaS Architecture**: The software is transferred as a fully self-hosted, turnkey executable asset. There are zero cloud subscriptions, zero per-seat licensing tiers, zero per-node telemetry fees, and zero vendor-dependent runtime callbacks.
- **Clean Title Warranty**: The asset is delivered free and clear of all liens, encumbrances, security interests, and third-party royalty claims.
- **Support & Maintenance Baseline**: As an outright IP purchase, operational governance transfers entirely to the acquiring entity upon repository handoff; no third-party SaaS SLAs apply.

---

## 2. Technical Asset Manifest

The delivered transfer package includes the following primary components:

1. **Algorithmic Execution Core (`engine.py`, `models.py`)**:
   - Almgren-Chriss (2000) optimal liquidation trajectory engine.
   - Intraday VWAP volume profile slicing module.
   - TWAP linear scheduler with anti-gaming sizing and timing jitter.
   - Smart Order Router (SOR) multi-venue dispatcher.
2. **Turnkey API Microservice (`main.py`, `requirements.txt`)**:
   - Complete FastAPI service implementing OpenAPI 3.1 endpoints.
   - Dynamic volume shock and spread widening simulation triggers.
   - Chained SHA-256 transaction audit ledger exporter.
3. **Automated Verification Suite (`test_execution_engine.py`)**:
   - 10 automated test suites verifying mathematical invariants, zero-residual slice conservation, and cryptographic chain immutability.
4. **Execution Terminal (`src/`, `index.html`, `vite.config.ts`)**:
   - High-density institutional trading cockpit with real-time SVG trajectory plotting, intraday volume histogram, and Web Audio synthesizer alerts.
5. **Turnkey Container Topology (`Dockerfile`)**:
   - Multi-stage production container ready for immediate cloud deployment.

---

## 3. Container Verification & Cloud Run Deployment

The service is packaged using a production-hardened multi-stage Dockerfile adhering to non-root execution principles.

### 3.1 Container Architecture
- **Base Image**: `python:3.11-slim`
- **Security User**: Non-root service account (`apex`, UID `10001`)
- **Port Protocol**: Dynamic port binding via standard `PORT` environment variable (defaults to `8080`)
- **Automated Build Gate**: Automated execution of `python test_execution_engine.py` during image compilation

### 3.2 Environment Variables

| Variable Name | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `8080` | Network port for inbound HTTP/REST traffic |
| `HOST` | Optional | `0.0.0.0` | Network interface binding address |
| `PYTHONUNBUFFERED` | Required | `1` | Disables stream buffering for real-time stdout/stderr log capture |
| `PYTHONDONTWRITEBYTECODE` | Required | `1` | Prevents disk write of compiled bytecode |

### 3.3 Google Cloud Run Deployment Protocol

To deploy the container to Google Cloud Run, execute the following commands:

```bash
# 1. Build and tag the production container
docker build -t gcr.io/${PROJECT_ID}/apex-execution-engine:latest .

# 2. Push to Google Artifact Registry / Container Registry
docker push gcr.io/${PROJECT_ID}/apex-execution-engine:latest

# 3. Deploy turnkey service to Cloud Run
gcloud run deploy apex-execution-engine \
  --image gcr.io/${PROJECT_ID}/apex-execution-engine:latest \
  --platform managed \
  --region us-east1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10
```

---

## 4. Cryptographic SHA-256 Audit Chain Verification Guide

To verify the tamper-evident immutability of an exported execution fill tape:

### 4.1 Hash Chaining Equation
Each slice record $k \in \{1, \dots, N\}$ binds cryptographically to the prior block hash:

$$H_0 = \text{SHA-256}(\text{"GENESIS|" } \,\|\, \text{OrderID} \,\|\, \text{Symbol} \,\|\, \text{Notional} \,\|\, \text{Timestamp})$$
$$H_k = \text{SHA-256}(H_{k-1} \,\|\, \text{SliceID} \,\|\, n_k \,\|\, P_k \,\|\, \text{Venue} \,\|\, \text{Status})$$

### 4.2 Verification Protocol
1. Retrieve the execution record via `GET /api/orders/{order_id}/audit` or export the fill tape CSV.
2. For each record $k = 1 \dots N$, reconstruct the canonical string:
   `CanonicalPayload = H_{k-1} + "|" + SliceID + "|" + Quantity + "|" + FillPrice + "|" + Venue + "|" + Status`
3. Compute `SHA256(CanonicalPayload)`.
4. Confirm `ComputedHash == RecordedHash`.
5. If any single character, fraction, or price point has been altered retroactively, the computed hash will diverge, confirming cryptographic integrity rejection.

---

## 5. Technical Warranty & Delivery Attestation

The acquiring entity receives the codebase under full IP title assignment, with clean-room provenance and zero third-party copyleft entanglements.
