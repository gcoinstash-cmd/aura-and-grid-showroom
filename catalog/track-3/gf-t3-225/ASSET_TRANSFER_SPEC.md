# GF-T3-225 — Standalone Asset Purchase Agreement (APA) Transfer Specification

## 1. Sovereign Title Transfer Overview
- **Asset Title**: `GF-T3-225`
- **Transfer Instrument**: Direct Standalone Repository Asset Purchase Agreement (APA).
- **Commercial Acquisition Actions**:
  - `ACQUIRE TITLE (APA)` — Full sovereign assignment of source code, mathematical kernels, PostgreSQL/Supabase schema definitions, container manifests, and verification test suites.
  - `INQUIRE VAULT BUYOUT` — Institutional due-diligence room inspection and cryptographic repository escrow transfer.

---

## 2. Clean Title Warranty & IP Assignment Scope
1. **100% Sovereign Ownership Assignment**:
   Upon execution of the Asset Purchase Agreement, Aura & Grid assigns all right, title, and interest in and to the `GF-T3-225` codebase, documentation, and database schemas to the Acquiring Principal, free and clear of any liens, encumbrances, or royalty obligations.
2. **Clean-Room Mathematical Warranty**:
   All FP8 E4M3 and E5M2 quantization encoders, dynamic microscaling algorithms, FP32 accumulation loops, and dequantization epilogues are warranted to be original, clean-room engineering creations with zero external proprietary dependencies.
3. **Database & Telemetry Portability**:
   Includes full PostgreSQL partitioned table definitions (`gf_t3_225_gemm_runs`, `gf_t3_225_tile_telemetry`, `gf_t3_225_security_audit`) with pre-configured Row-Level Security (RLS) policies and composite B-Tree / BRIN indexes.

---

## 3. Zero-SaaS SLA & Autonomous Operation Disclaimer
- **No Recurring Hosting Lock-In**:
  `GF-T3-225` is delivered as a self-contained, air-gap-capable software chassis. There are zero mandatory external SaaS calls, zero telemetry phone-home beacons, and zero recurring meter dependencies.
- **As-Is Sovereign Hardware Deployment**:
  Following repository handoff and automated test suite verification (`test_fp8_gemm_engine.py` and `fp8Engine.test.ts` passing at >80% coverage), the Acquiring Principal assumes full operational command of the deployed containers and database instances without ongoing vendor SLA entanglement.

---

## 4. Handoff Verification Manifest
- [x] `engine.py` — Standalone FastAPI FP8 Mixed-Precision GEMM & Microscaling Engine
- [x] `test_fp8_gemm_engine.py` — Pytest Verification Suite (SNR Parity, Outlier Scales, 50% Memory Reduction)
- [x] `src/lib/fp8Engine.ts` — TypeScript Bit-Exact FP8 E4M3/E5M2 Core & GridSync Zero-Trust Sanitizer
- [x] `src/lib/fp8Engine.test.ts` — Vitest Verification Suite (>80% Pass Rate & Boundary Gates)
- [x] `supabase_schema.sql` — Partitioned PostgreSQL / Supabase Persistence Schema with RLS Policies
- [x] `Dockerfile` — 1-Click Google Cloud Run Deployment Container
- [x] `ENGINE_SPEC.md` & `LEGAL_IP_AUDIT.md` — Full Technical & NIST SP 800-218 SSDF v1.1 Documentation
