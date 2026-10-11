# GF-T3-151 // ApexLimit Order Matching & Real-Time Risk Liquidation Engine
**Classification:** Track 3 — F1 Skunkworks Production Reference Engine & Working Service Architecture  
**License Provenance:** 100% Permissive Clean-Room IP (`MIT` / `Apache-2.0` / `BSD-3-Clause` — Zero Viral Copyleft)  
**Verified Test Coverage:** `95.27%` Line & Branch Coverage (`21/21` deterministic offline tests passing)  

---

## Overview

**ApexLimit (`GF-T3-151`)** is a standalone, deterministic Price-Time Priority (FIFO) Central Limit Order Book (CLOB) and synchronous pre-trade margin risk engine engineered in **Python 3.11 (FastAPI / Pydantic v2)** with an interactive **React 19 / TypeScript Level-2 Telemetry HUD**.

All price and quantity operations execute in **$10^8$ fixed-point scaled 64-bit integer arithmetic**, eliminating IEEE-754 floating-point drift across order matching, $O(1)$ queue cancellation, collateral haircut valuation, and automated liquidation cascades.

---

## Institutional Data Room Contents

| File / Directory | Description |
| :--- | :--- |
| [`APA_SCHEDULE_A_ASSETS.md`](./APA_SCHEDULE_A_ASSETS.md) | Schedule A transferred deliverables, Schedule B seller IP exclusions, and Clean-Room warranty |
| [`OPENAPI_CONTRACT.yaml`](./OPENAPI_CONTRACT.yaml) | Canonical OpenAPI `3.1.0` YAML contract (`openapi.json` also included) |
| [`DEPLOYMENT_RUNBOOK.md`](./DEPLOYMENT_RUNBOOK.md) | Turnkey `< 15 minute` buyer deployment guide (Local Docker, `.env`, Cloud Run, Render) |
| [`ACQUIRE_LISTING_DRAFT.md`](./ACQUIRE_LISTING_DRAFT.md) | Confidential Information Memorandum (CIM), avoided-cost ROI analysis, and Micro-APA terms |
| [`ENGINE_SPEC.md`](./ENGINE_SPEC.md) | Fixed-point mathematical proofs, state transition matrices, and PostgreSQL/AlloyDB Level-2 audit DDL |
| [`LEGAL_IP_AUDIT.md`](./LEGAL_IP_AUDIT.md) | SPDX dependency Bill of Materials and 100% Permissive Clean-Room certification |
| [`VERIFICATION_SUITE/`](./VERIFICATION_SUITE/) | Air-gapped Pytest unit and API gateway test suite (`95.27%` verified coverage) |

---

## Quick Start (100% Offline Verification)

### 1. Run Deterministic Pytest Suite
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt pytest-cov
pytest --cov=src --cov-report=term-missing -v
```

### 2. Build & Run Hardened Non-Root Docker Container (`UID 10001`)
```bash
docker build -t gf-t3-151-apexlimit:1.0.0 .
docker run --rm -p 8080:8080 --env-file .env.example gf-t3-151-apexlimit:1.0.0
```

### 3. Run Interactive Telemetry HUD (Optional Frontend Dev Server)
```bash
npm install
npm run dev
```

---

## Product Truth & Security Disclosure

- **Product Truth Label:** Working Service Engine & Production Reference Architecture operating on deterministic in-memory state and sample seed data.
- **Zero Hardcoded Secrets:** Strictly configured via `.env.example` environment variables with zero external network or third-party API key dependencies.
- **Not Financial Advice:** Customer-specific production configuration, regulatory licensing, and live risk governance are required prior to deployment in regulated financial markets.
