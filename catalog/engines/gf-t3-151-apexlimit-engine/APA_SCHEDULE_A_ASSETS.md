# SCHEDULE A — MICRO-ASSET PURCHASE AGREEMENT (APA) ASSET SCHEDULE
**Document Reference:** `GF-APA-SCH-A-2026-T3-151`  
**Target Acquisition Asset:** `GF-T3-151 // ApexLimit Order Matching & Real-Time Risk Liquidation Engine`  
**Transaction Venue:** Acquire.com Institutional Micro-APA Data Room  
**Asset Tier Classification:** Track 3 — F1 Skunkworks Production Reference Engine (Vertical B: Algorithmic Liquidity & Institutional FinTech Risk)  
**Baseline APA Floor / Monopoly Vault Bracket:** `$35,000 – $65,000 USD` (Baseline Floor) | `$75,000 – $150,000+ USD` (Exclusive Monopoly Vault Buyout)

---

## 1. INCLUDED INTELLECTUAL PROPERTY & DELIVERABLES (TRANSFERRED ASSETS)

Upon execution of the Micro-Asset Purchase Agreement ("Micro-APA") and settlement of closing consideration, Buyer acquires defined title and commercial rights to the following standalone software artifacts Located in `./packages/track3-acquire-pilot/` (`GF-T3-151`):

### 1.1 Core Deterministic Source Code (`src/`)
| File Path | Module Classification | Technical Description |
| :--- | :--- | :--- |
| `src/core/matching_engine.py` | Matching Core | Deterministic in-memory Price-Time Priority (FIFO) Central Limit Order Book (CLOB) with $10^8$ fixed-point scaled integer arithmetic, $O(1)$ hash-to-queue order cancellation, stop-limit trigger cascades, and nanosecond telemetry counters. |
| `src/core/risk_manager.py` | Pre-Trade Risk & Liquidation Sentinel | Synchronous pre-trade initial/maintenance margin lock calculator, multi-collateral haircut valuation engine, mark-price stress evaluator, and automated liquidation cascade trigger. |
| `src/main.py` | Async API Gateway | FastAPI / Uvicorn REST ingress gateway enforcing Pydantic v2 request validation, structured JSON audit logging, and deterministic error envelopes. |
| `src/App.tsx` | Operator Telemetry HUD | React 19 / TypeScript interactive L2 orderbook depth visualizer, margin stress console, and execution telemetry dashboard. |

### 1.2 Mathematical Proofs, Database Schemas & API Contracts
| File Path | Deliverable Type | Technical Description |
| :--- | :--- | :--- |
| `ENGINE_SPEC.md` | Mathematical & SQL Specification | Complete fixed-point mathematical proofs, state machine transition matrices, and PostgreSQL / AlloyDB Level-2 append-only audit ledger DDL schemas with Row-Level Security (RLS) policies. |
| `OPENAPI_CONTRACT.yaml` | OpenAPI 3.1.0 YAML Contract | Canonical OpenAPI 3.1.0 specification documenting all REST endpoints, request/response schemas, validation rules, and HTTP status codes. |
| `openapi.json` | OpenAPI 3.1.0 JSON Contract | Machine-readable JSON equivalent of the OpenAPI 3.1.0 contract for automated SDK and client generation. |

### 1.3 Turnkey Deployment & Infrastructure Scripts
| File Path | Deliverable Type | Technical Description |
| :--- | :--- | :--- |
| `Dockerfile` | Multi-Stage Container | Hardened `python:3.11-slim` multi-stage production container running under non-root UID/GID `10001:10001` with built-in HTTP `/healthz` probes. |
| `docker-compose.yml` | Local Orchestration | Turnkey local container composition mapping port `8080:8080` with environment injection. |
| `.env.example` | Environment Template | Sanitized configuration template containing zero hardcoded secrets or private keys. |
| `DEPLOYMENT_RUNBOOK.md` | Buyer Operations Guide | 3-step buyer setup covering local Docker verification, environment configuration, and 1-click Cloud Run / Render deployment. |

### 1.4 Automated Verification & Legal Diligence Suite
| File Path | Deliverable Type | Technical Description |
| :--- | :--- | :--- |
| `tests/test_matching_engine.py` | Core Unit Test Suite | Deterministic verification of FIFO matching, Crossing spread fills, stop-limit activation, idempotency, and margin locks. |
| `tests/test_api_gateway.py` | Gateway Integration Suite | Offline `TestClient` verification of all OpenAPI 3.1 endpoints, error envelopes, and liquidation cascades with zero external network dependencies. |
| `pytest.ini` & `VERIFICATION_SUITE.md` | Test Runner Config & Report | Configured Pytest runner enforcing **>80% branch/statement coverage** (verified at **>95% coverage**). |
| `LEGAL_IP_AUDIT.md` | Clean-Room IP Certificate | Complete SPDX dependency bill of materials (SBOM) and clean-room provenance certification. |

---

## 2. EXPLICITLY EXCLUDED ASSETS (RETAINED SELLER IP)

> [!IMPORTANT]
> **Micro-APA Carve-Out Invariant:** This transaction is a selective single-asset acquisition of `GF-T3-151` only. It is **NOT** a purchase of Seller's parent operating foundry, dealership platform, or broader asset portfolio.

The following assets, brands, systems, and intellectual property are **strictly excluded** from this Schedule A and remain the sole, permanent, and exclusive property of Seller (**ZoMae Media LLC / GhostFactoryOS**):

1. **GhostFactoryOS™ Brand & Foundry Infrastructure:**
   - All trademarks, service marks, trade names, logos, domain names, and goodwill associated with **GhostFactoryOS™**.
   - Internal factory generation pipelines, 70/30 AI Studio-to-Antigravity build harnesses, automated audit scripts (`assert-*.mjs`), and proprietary prompt engineering libraries.
2. **Aura & Grid™ Brand & Public Dealership Showroom:**
   - All trademarks, trade dress, domain names, and storefront infrastructure associated with **Aura & Grid™** (`aura-and-grid-showroom`).
3. **Executive Dealership Consoles & Valuation Engines:**
   - The **Ghost Factory Command Console (`ghost-factory-console`)**, Screen 1–7 executive cockpit interfaces, ASC 350-40 valuation calculators, Factory Production Volume Simulator, and private deal room software.
4. **Master Fleet Catalog & 80% Sovereign Retention Vault:**
   - All other **159 digital vehicles, SCADA flagships, and service engines** in the 160-unit Master Fleet Catalog (`86 Track 1 + 51 Track 2 + 22 other Track 3 engines`).
   - The **80% Permanently Retained Vault Floor (128 vaulted units)** and all future products, engines, or derivatives manufactured by GhostFactoryOS.
5. **Shared Design Systems & Cross-Portfolio Harnesses:**
   - Seller's shared UI component tokens, Universal Track 2 Telemetry Harness (`Track2Harness.tsx`), and multi-tenant licensing ledgers (Buyer receives a non-exclusive, perpetual internal right to the UI code embedded in `GF-T3-151/src/App.tsx` solely as part of the Acquired Asset).

---

## 3. CLEAN-ROOM & ZERO-COPYLEFT IP WARRANTY CLAUSE

Seller hereby represents, warrants, and covenants to Buyer as an express condition of closing:

1. **100% Clean-Room Permissive Provenance:**
   - All source code, mathematical models (`10^8` fixed-point scaling), state machines, and documentation in `GF-T3-151` were independently authored from first principles without reference to, or incorporation of, any third-party proprietary or confidential source code.
2. **Strict Permissive Dependency Chain (`MIT` / `Apache-2.0` / `BSD-3-Clause`):**
   - Every direct and transitive third-party library required to build, test, and execute the Acquired Asset (`fastapi`, `pydantic`, `uvicorn`, `httpx`, `pytest`, `python-jose`, `passlib`, `react`, `lucide-react`) is governed exclusively by permissive open-source licenses (`MIT`, `Apache-2.0`, or `BSD-3-Clause`).
3. **Zero Copyleft Contamination Warranty (`0 GPL / AGPL / SSPL`):**
   - Zero bytes of the Acquired Asset contain, link to (statically or dynamically), or depend upon any software licensed under the GNU General Public License (`GPL` v1/v2/v3), GNU Affero General Public License (`AGPL` v1/v3), GNU Lesser General Public License (`LGPL`), Server Side Public License (`SSPL`), or any reciprocal viral license that would obligate Buyer to disclose, distribute, or open-source its proprietary code or derivative works.
4. **Product Truth & Operational Readiness Disclosure:**
   - The Acquired Asset is delivered as a verified **Production Reference Engine & Deployable Source Architecture** operating on deterministic in-memory state and sample seed data. Buyer is solely responsible for customer-specific production configuration, regulatory compliance, exchange connectivity certification, and live financial risk governance in Buyer's target jurisdiction.
