# ACTIVE_STATE.md — Canonical Commercial & Telemetry Synchronization Anchor

> **TURN-0 MANDATORY BOOT DIRECTIVE**: Every incoming engineering session, automation workflow, or copy review MUST load this file on Turn 0 as the authoritative single source of truth for all public showroom builds, Acquire.com deal-room materials, and buyer-facing communications. Where legacy workspace notes differ on public positioning, **`ACTIVE_STATE.md` takes strict precedence**.

---

## 1. COMMERCIAL IDENTITY & TRANSACTION STRUCTURE

| Telemetry Field | Canonical Active Value |
| :--- | :--- |
| **Commercial Public Name** | **Aura & Grid** |
| **Entity Status** | **Sole Entrepreneur / Independent Software Architect** |
| **Transaction Type** | **Pure Asset Purchase Agreement (APA) via Acquire.com Escrow** |
| **Conveyance Standard** | **100% Pure Software Asset Sale (Direct Turnkey APA Title Transfer)** — full source code, database schemas, and deployment scripts conveyed directly by sole developer; zero debt, zero equity, zero assumed corporate liabilities, zero recurring seat licenses |
| **IP Boundary Disclosure** | *"Seller trademarks, creator development tooling, and parent catalog rights remain reserved by independent seller."* |

---

## 2. PUBLIC COMMERCIAL SCOPE & VALUATION ANCHORS

- **Public Scope**: **5 Sealed Micro-Clusters (`MC-01` through `MC-05`) — 51 Units / 17 Triads** (Units `#338`–`#354`)
  - Each triad pairs: (1) a containerized FastAPI Python 3.11 compute engine, (2) an interactive SCADA telemetry cockpit preview, and (3) a React 19 operator utility backed by PostgreSQL 16 RLS schemas.
- **Portfolio Batch Asking Price**: **$805,000 USD** (5-Cluster Portfolio APA)
- **Standalone Micro-Cluster Asking Range**: **$145K–$185K** (**$145,000 – $185,000 USD** individual turnkey buyout)
- **Retail Replacement Benchmark**: **$1,173,000 USD** (ASC 350-40 Cost-to-Rebuild Scope across 17 Triads)

| Micro-Cluster | Architecture Domain | Scope | Dyno Tests | Standalone APA Ask |
| :--- | :--- | :--- | :--- | :--- |
| **`MC-01`** | Ultra-Low Latency Attention & KV Memory Fabrics (`#338`, `#340`, `#345`, `#354`) | 4 Triads / 12 Units | `26/26 PASS` | **$185,000** |
| **`MC-02`** | Distributed High-Throughput & Speculative Scheduling (`#346`, `#347`, `#348`) | 3 Triads / 9 Units | `19/19 PASS` | **$145,000** |
| **`MC-03`** | Extreme Quantization & Sub-Byte Compression Cores (`#342`, `#352`, `#353`) | 3 Triads / 9 Units | `19/19 PASS` | **$145,000** |
| **`MC-04`** | Distributed Mesh Parallelism & Inter-Node Interconnects (`#339`, `#341`, `#343`, `#350`) | 4 Triads / 12 Units | `23/23 PASS` | **$185,000** |
| **`MC-05`** | Zero-Overhead Hardware Acceleration & Host-GPU Fabrics (`#344`, `#349`, `#351`) | 3 Triads / 9 Units | `18/18 PASS` | **$145,000** |
| **TOTAL** | **Full 5-Cluster Commercial Lot** | **17 Triads / 51 Units** | **`105/105 PASS`** | **$805,000** |

> **Strict Financial Redaction Invariant**: Internal reserve floors, walk-away thresholds, wholesale benchmarks, and panic-floor figures are strictly private internal planning metrics and must **NEVER** appear in compiled showroom markup (`site/index.html`) or external buyer collateral.

---

## 3. EXCLUDED VOCABULARY (STRICT PUBLIC & DEAL-ROOM BAN)

All public showroom code (`scripts/site/build_commercial_showroom.mjs`, `site/index.html`, `index.html`, `dist/index.html`) and external Acquire.com deal assets MUST strictly exclude the following terms (enforced automatically by `npm run audit:commercial`):

1. **`Ghost Factory OS` / `GhostFactoryOS` / `GF-T1` / `GF-T2` / `GF-T3`** — Strictly internal workspace nomenclature only. Never expose publicly; use **Aura & Grid** or **Independent Systems Architect**.
2. **`AI`** (including `LLM` and `inference`) — Frame strictly around *high-performance distributed systems*, *compute infrastructure*, *parallel execution*, and *high-throughput data processing*.
3. **`autonomous`** — Frame strictly around *mission-critical edge computing*, *real-time distributed telemetry*, and *low-latency FinTech infrastructure*.
4. **`automated`** — Frame strictly around *verified deterministic test suites* and *105/105 passing test gates*.
5. **`agents` / `agent`** — Frame strictly around *distributed services*, *deterministic state machines*, or *consensus workers*.
6. **Unverified Marketing Claims** — Never claim `production-ready` or `enterprise-grade`; cockpits must carry clear *simulated sample data* previews disclosures.

---

## 4. GIT TELEMETRY & DYNO VERIFICATION STATUS

- **Last Verified Baseline Commit (`main`)**: `0892a42` (`chore(copy): purge internal studio branding and replace AI terminology with high-performance systems architecture`)
- **Dual-Exhaust Remote Sync**: `origin` configured to push simultaneously to `aura-and-grid.git` (master repo) and `aura-and-grid-showroom.git` (Render live static showroom).
- **Dyno & Test Suite Verification**: **`105/105` deterministic pytest & dyno gates passing (`4/4 VERIFIED GATES` sealed)** across all 17 triads; clean-room permissive licensing (`MIT / Apache-2.0`).
- **Canonical Build & Audit Pipeline**:
  - Showroom Compiler: `scripts/site/build_commercial_showroom.mjs`
  - Manifest Cross-Check Source: `docs/deal-room/MICRO_CLUSTERS_COMMERCIAL_MANIFEST.md`
  - Render CI/CD Gate (`render.yaml`): `npm run build && npm run audit:commercial` (`staticPublishPath: ./site`)
