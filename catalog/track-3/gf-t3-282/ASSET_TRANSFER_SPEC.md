# GF-T3-282 · Sovereign Asset Purchase Agreement (APA) Transfer Specification

## 1. Direct Standalone Repository Acquisition Scope
This specification governs the complete, unencumbered Asset Purchase Agreement (APA) transfer of the **GF-T3-282** Track 3 Flagship Ultra-Wide Dynamic Quantization Calibration & Hardware-Accelerated FP8 Weight-Activation Engine from **Aura & Grid** (Dealership Principal: Garrett) to the acquiring institutional counterparty.

### Included Sovereign Deliverables:
1. **Frontend Telemetry Cockpit (`/src/App.tsx`, `/src/lib/fp8Engine.ts`)**: High-density 10/10 viewport-locked React 19 + TypeScript cockpit with real-time FP8-E4M3 / FP8-E5M2 quantization math, scale factor calibration, and outlier spike diagnostics.
2. **Backend Execution Kernel (`/engine.py`)**: Standalone FastAPI microservice implementing per-tensor and per-token FP8 quantization, dynamic clipping, and hardware bandwidth saturation modeling.
3. **Database Persistence Layer (`/supabase_schema.sql`)**: Range-partitioned PostgreSQL / Supabase schema with foreign keys, composite B-Tree indexes, and strict tenant-isolated Row-Level Security (RLS) policies.
4. **Automated Verification Suites (`/src/lib/fp8Engine.test.ts`, `/test_fp8_quantization_engine.py`)**: Self-contained Vitest and Pytest test suites verifying quantization accuracy, clipping bounds, and GridSync Zero-Trust security gates.
5. **Air-Gapped Containerization (`/Dockerfile`)**: Multi-stage hardened container definition ready for autonomous local CI/CD pipelines or 1-click cluster deployment without external cloud lock-in.

---

## 2. Clean Title Warranty & Zero Encumbrance
- **100% Outright IP Conveyance**: Upon execution of the APA transfer, 100% of copyright, source code title, schema architecture, and derivative modification rights transfer outright to the acquiring entity.
- **Zero Royalties or Recurring Meters**: The codebase contains zero telemetry phone-home beacons, zero license key expiration timers, and zero ongoing usage royalties.

---

## 3. Zero-SaaS SLA Disclaimer ("As-Is" Sovereign Transfer)
- **Standalone Asset Transfer Only**: GF-T3-282 is conveyed strictly as a self-contained capital software asset under an Asset Purchase Agreement (APA).
- **No Managed SaaS Obligation**: Aura & Grid provides zero hosted SaaS subscriptions, zero managed uptime SLAs, and zero post-closing operational hosting obligations. The acquiring institution assumes full sovereign operational control across its own air-gapped or cloud-native clusters upon repository delivery.
