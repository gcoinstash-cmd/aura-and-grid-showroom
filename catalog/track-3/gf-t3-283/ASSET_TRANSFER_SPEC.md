# GF-T3-283 — Master Asset Transfer Specification & Handoff Index

## 1. Direct Standalone Repository Buyout Terms (APA)

This document serves as the comprehensive master index for the **GF-T3-283** institutional Asset Purchase Agreement (APA) transition.

- **Transfer Structure:** 100% outright standalone repository and intellectual property title transfer (`ACQUIRE TITLE (APA)` / `INQUIRE VAULT BUYOUT`).
- **Clean Title Warranty:** Aura & Grid warrants that `GF-T3-283` is 100% original, unencumbered, clean-room software free of third-party liens, royalty obligations, or viral copyleft contamination.
- **Zero-SaaS SLA Disclaimer:** The asset is delivered as a self-contained, sovereign codebase (`src/`, `engine.py`, `supabase_schema.sql`, `Dockerfile`) with zero vendor lock-in, zero phone-home telemetry, and zero recurring SaaS licensing dependencies.

---

## 2. Key Deliverables & Master Repository Index

| Deliverable Artifact | Path | Verification Gate | Approval Deadline |
| :--- | :--- | :--- | :--- |
| Interactive Cockpit Frontend | `/src/App.tsx` | 10/10 Strict Above-the-Fold Viewport Lock | Milestone M1 (T+0 Hours) |
| TypeScript Disaggregation Core | `/src/engine/disaggEngine.ts` | Deterministic Math + GridSync Zod Gate | Milestone M1 (T+0 Hours) |
| Vitest Verification Suite | `/src/engine/disaggEngine.test.ts` | 100% Pass Rate on Boundary & Security Tests | Milestone M2 (T+2 Hours) |
| Standalone FastAPI Backend | `/engine.py` | OpenAPI 3.1 + RDMA KV-Streaming Simulator | Milestone M2 (T+2 Hours) |
| Pytest Verification Suite | `/test_prefill_decode_disagg_engine.py` | >85% Coverage Verified | Milestone M2 (T+2 Hours) |
| PostgreSQL / Supabase Schema | `/supabase_schema.sql` | Range Partitioning + Strict Tenant RLS | Milestone M3 (T+4 Hours) |
| Cloud Run Container Spec | `/Dockerfile` | Self-Testing Build & Port 8080 Ingress | Milestone M3 (T+4 Hours) |
| Technical Specification | `/ENGINE_SPEC.md` | Formula & Endpoint Parity | Milestone M4 (T+6 Hours) |
| Legal & SSDF v1.1 Audit | `/LEGAL_IP_AUDIT.md` | 100% MIT/Apache-2.0 SBOM Attestation | Milestone M4 (T+6 Hours) |

---

## 3. Delivery Schedule & Deployment Milestones

1. **Milestone M1 — Core Engine & Cockpit Lock (T+0 Hours):**
   - Stakeholder verification of `GF-T3-283` UI layout, 8-node (`N0`..`N7`) interactive matrix bay, and zero-dollar compliance gate.
2. **Milestone M2 — Automated Test & Security Gate Sign-Off (T+2 Hours):**
   - Execution of Vitest and Pytest suites verifying asymmetric disaggregation latency gains (`T_disagg < T_collocated`) and GridSync SQL/XSS rejection.
3. **Milestone M3 — Database RLS & Container Staging (T+4 Hours):**
   - Provisioning of `/supabase_schema.sql` with partitioned tables and RLS policies alongside Cloud Run `/Dockerfile` build verification.
4. **Milestone M4 — Final Escrow Release & Title Transfer (T+6 Hours):**
   - Counter-signature of APA transfer schedule and cryptographic SHA-256 verification of the archived master repository.

---

## 4. Final Asset Verification Procedures

1. **Zero-Dollar Gate Scan:** Confirm zero currency symbols exist across all source, test, SQL, and documentation files.
2. **Deterministic Math Audit:** Verify `computeKvCacheStateGb` and `evaluateDisaggregatedEngine` produce identical bit-exact results across TypeScript and Python runtimes.
3. **Database RLS Isolation Check:** Confirm all three tables (`disagg_corridors`, `disagg_worker_nodes`, `kv_stream_telemetry_events`) enforce `ENABLE ROW LEVEL SECURITY`.

---

## 5. Stakeholder Communication Plan & Post-Deployment Support Framework

- **Communication Cadence:**
  - Real-time milestone telemetry updates logged via the Pit-Wall Radio Comms channel during transition windows.
  - Formal sign-off checkpoints at Milestones M1, M2, M3, and M4 between the Dealership Principal (Garrett), Lead Systems Engineer, and Acquiring Institutional Counterparty.
- **Post-Deployment Technical Support Framework:**
  - **Tier-1 Autonomous Runbook:** Embedded health endpoints (`/health`), deterministic CRC-32/FNV-1a KV chunk parity checks, and automated fallback corridor switching (`DISAGG-CORRIDOR-DELTA`).
  - **Tier-2 Handoff Engineering Window:** 30-day clean-room architectural advisory window covering Kubernetes / Cloud Run horizontal scaling, RDMA RoCEv2 / InfiniBand NIC tuning, and PostgreSQL partition lifecycle rotation.
- **Centralized Secure Repository Archival:**
  - All markdown specifications (`ENGINE_SPEC.md`, `LEGAL_IP_AUDIT.md`, `ASSET_TRANSFER_SPEC.md`), SQL schemas (`supabase_schema.sql`), and executable engines are archived in the root repository index for immutable institutional custody.
