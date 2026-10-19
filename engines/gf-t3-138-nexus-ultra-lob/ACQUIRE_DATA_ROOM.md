# ACQUIRE_DATA_ROOM — T3-NEXUS-ORDERBOOK

> **ENTERPRISE AUDIT-READY DATA ROOM // SEALED & VERIFIED**
> **NIST SP 800-218 SSDF v1.1 Clean-Room Certified // Zero Viral Copyleft (MIT/Apache-2.0)**


**Asset ID:** T3-NEXUS-01 · **Product:** NEXUS-ORDERBOOK · **Pricing track:** Track 3 (F1 Skunkworks) · **Sector:** FinTech / Quant
**Data-room version:** 1.0 · **Prepared:** 2026-10-04 · **Owner:** GhostFactoryOS (ZoMae Media LLC)

> **Product Truth label: Deployable Source Template (Track 3 candidate).**
> Source code, schema, tests and container files are present and were exercised **locally only**. The service
> has **not** been deployed, load-tested, security-reviewed or run against a database. It uses in-memory state and
> sample/simulated orders. It is **not** a production service. Customer-specific production configuration is required.
> License, not ownership transfer, unless a signed micro-APA says otherwise. Not legal, financial or compliance advice.

---

## 1. What this is (plain English)

A small **matching engine**: it holds buy and sell orders for a trading pair (e.g. `BTC-USDT`), pairs them by
**best price first, then first-come-first-served**, and publishes the results over REST and WebSockets.
Think of it as the "transmission" of an exchange: it does the matching and nothing else.

## 2. Architecture summary

| Layer | File | What it does |
|---|---|---|
| Domain models | `src/models.py` | Pydantic v2 request/record/trade/depth models, `Decimal` money math (ENGINE_SPEC §3) |
| Matching core | `src/engine.py` | In-memory order book: hash map of orders, sorted price ladders, doubly-linked FIFO queue per price (ENGINE_SPEC §4.3) |
| Service layer | `src/main.py` | FastAPI app: REST endpoints + 2 WebSocket channels; single-process, single event loop (ENGINE_SPEC §6) |
| Schema | `migrations/001_initial_schema.sql` | PostgreSQL 16 DDL: instruments, orders, trades, SHA-256 audit hash-chain trigger (ENGINE_SPEC §5) |
| Packaging | `Dockerfile`, `docker-compose.yml`, `deploy_cloud_run.sh` | Multi-stage non-root image; local Postgres+Redis stack; Cloud Run script (ENGINE_SPEC §7) |
| Tests | `tests/` | 73 tests (see §4) |

**Matching rules implemented:** price-time priority; trades execute at the resting (maker) price; LIMIT and MARKET
orders; GTC and IOC; self-trade prevention `CANCEL_TAKER` and `CANCEL_MAKER`; maker rebate / taker fee per ENGINE_SPEC §4.2.

**Concurrency model:** mutating handlers are `async def` with no `await` between read and write, so each order is
processed atomically on one event loop. Run with `--workers 1`. Horizontal scaling would require partitioning symbols
across processes (not implemented).

## 3. API endpoints

| Method & path | Purpose | Notes |
|---|---|---|
| `GET /healthz` | Liveness probe | Returns `status`, `uptime_seconds`, `active_symbols`, `memory_usage_mb` |
| `POST /api/v1/orders` | Submit order | `201` result; `400` business rejection; `422` malformed |
| `DELETE /api/v1/orders/{order_id}` | Cancel resting order | `404` if not found / already filled |
| `GET /api/v1/orderbook/l2?symbol=&depth=` | L2 depth snapshot | `depth` 1–200, default 50 |
| `GET /api/v1/trades/recent?symbol=&limit=` | Recent trades | `limit` 1–500, default 50; last 10,000 kept in memory |
| `WS /ws/v1/market-depth` | Depth diffs | First frame = full snapshot (diff vs empty book); then diffs on a `TICK_INTERVAL_MS` heartbeat or immediately on best-bid/offer change. Quantity `0.00000000` = level deleted |
| `WS /ws/v1/trade-stream` | Trade ticks | One message per trade; slow consumers are disconnected (close code 1013) |
| `GET /openapi.json`, `/docs` | Auto-generated OpenAPI 3.1 | Reference contract copy from the spec: `docs/openapi.yaml` |

Subscribe frame: `{"action":"subscribe","channel":"market-depth"|"trade-stream","symbol":"BTC-USDT"}`.

**Intentional rejections (`400`):** `time_in_force=FOK` and `stp_mode=DECREMENT_AND_CANCEL` (declared in the spec's
contract but **not implemented** by the spec's engine code — rejected explicitly rather than silently mis-handled);
LIMIT order without a price; unknown symbol; duplicate `(trader_id, client_order_id)`.

## 4. Test results (real output, run 2026-10-04, Python 3.11.15 / macOS arm64)

| Command | Result | Coverage |
|---|---|---|
| `pytest tests/ -v --cov=src --cov-report=term-missing` (all) | **73 passed, 0 failed** (stable across 8 repeated runs) | **99%** (511 stmts, 7 missed) |
| `pytest tests/test_engine.py tests/test_engine_extended.py -v --cov=src --cov-report=term-missing` | **34 passed, 0 failed** | **60%** — `src/main.py` is 0% because the API tests are in `tests/test_api.py` |

Per-module coverage, full suite: `engine.py` 100% · `models.py` 100% · `main.py` 97% (uncovered: slow-consumer close
branch, two WebSocket disconnect handlers, module-level `app = create_app()`).

| Test file | Tests | Scope |
|---|---|---|
| `tests/test_engine.py` | 7 | Verbatim ENGINE_SPEC §8 suite (imports changed to package style) |
| `tests/test_engine_extended.py` | 27 | Sell side, multi-level sweeps, FIFO, STP variants, fee law, 2,000-order seeded randomized invariant check, model validation |
| `tests/test_api.py` | 39 | Every REST route and status code, both WebSocket channels, protocol errors, slow-consumer drop |

**Local smoke test:** `uvicorn src.main:app --loop uvloop --http httptools` started, `/healthz` returned HTTP 200,
a resting SELL and crossing BUY produced a trade at the maker price, L2 snapshot reflected the remainder.

**Not measured:** the throughput and latency targets in ENGINE_SPEC §2.3 (25,000 matches/s, P99 ≤ 380 µs) were
**not benchmarked** and are targets, not results.

## 5. Deviations from ENGINE_SPEC.md (full disclosure)

| # | Deviation | Why |
|---|---|---|
| 1 | **Bug fix `T3-FIX-001`** in `engine.py::process_order`: an STP-cancelled taker is no longer overwritten to `FILLED` | The spec's own test `test_self_trade_prevention_cancel_taker` **failed against the spec's own engine** (6 pass / 1 fail baseline). One-line fix, marked in source |
| 2 | Imports changed to `from src.models import …` | Spec used bare `from models import` which conflicts with `src.main:app` in the Dockerfile and `--cov=src` |
| 3 | `src/main.py` authored by us | Spec §6 gives only an OpenAPI/WebSocket contract, no Python |
| 4 | `docker-compose.yml`: DB credentials read from `.env` instead of hard-coded; mount points at `migrations/001_initial_schema.sql` | Spec hard-coded `nexus_vault_pass` and mounted a non-existent `init.sql` |
| 5 | `requirements-dev.txt` added (`httpx`) | Needed by the API test client; isolated from the runtime image (see §7) |
| 6 | Added `tests/test_engine_extended.py`, `tests/test_api.py`, `pytest.ini`, `.env.example`, `.gitignore`, `LICENSE`, `docs/openapi.yaml` | Coverage of service layer; intake-gate hygiene |

Everything else in `models.py`, `engine.py`, the SQL, Dockerfile, deploy script and spec test file is the spec text unchanged.

## 6. Known limitations and open items (read before relying on any claim)

1. **No persistence wired.** `asyncpg`/`redis` are in `requirements.txt` but unused by `src/`. The SQL schema has **never been executed against a PostgreSQL instance**. State is lost on restart.
2. **No authentication, RBAC or audit logging** in the service layer. `deploy_cloud_run.sh` uses `--allow-unauthenticated`: deploying it as-is would expose an open matching engine to the internet.
3. **Migrations are not idempotent** (plain `CREATE TABLE`, no Alembic/Prisma). The `orders` table comment says "partitioned monthly" but the DDL does not partition.
4. **Container image never built; Cloud Run never deployed.** `docker` and `gcloud` are not installed on the build machine. The Dockerfile, compose file and deploy script are unexecuted spec text (compose fixes in §5 are likewise untested).
5. **Not implemented:** `FOK`, `DECREMENT_AND_CANCEL`, tick/step-size and min/max-quantity enforcement from the `instruments` table, fill-or-kill/iceberg order types, cross-restart idempotency.
6. **Local runtime is Python 3.11**; the Dockerfile targets 3.12. The pinned dependencies were installed on 3.11 only.
7. No load, soak, fuzz, security or penetration testing has been performed.
8. The audit-chain trigger reads "latest hash" without locking; concurrent inserts could fork the chain. Needs review before any production use.

## 7. IP, licensing and MIT clean-room declaration

**Declaration (GhostFactoryOS statement of fact, not a legal opinion):**
- The source in `src/`, `tests/`, `migrations/` and packaging files was authored by GhostFactoryOS from its own
  `ENGINE_SPEC.md`, with AI-assisted generation. No third-party source code was copied into this repository.
- The repository is offered under the **MIT License** (`LICENSE`, © ZoMae Media LLC).
- The matching algorithm (price-time priority limit order book) is a publicly known technique; no patent search has been performed.

**Dependency licenses** (read from installed package metadata, `.venv`, 2026-10-04; no GPL/AGPL/SSPL/non-commercial/BSL found):

| Package | License | | Package | License |
|---|---|---|---|---|
| fastapi 0.115.0 | MIT (metadata field blank; MIT per upstream) | | starlette 0.38.6 | BSD-3-Clause |
| pydantic 2.9.2 / pydantic-core | MIT | | uvicorn 0.31.0 | BSD-3-Clause |
| asyncpg 0.29.0 | Apache-2.0 | | uvloop 0.20.0 | Apache-2.0 / MIT |
| redis 5.1.0 | MIT | | httptools 0.6.4 | MIT |
| python-dotenv 1.0.1 | BSD-3-Clause | | anyio, h11, click, idna, sniffio, watchfiles, websockets, PyYAML, typing-extensions, annotated-types, async-timeout | MIT / BSD / Apache / PSF |
| pytest 8.3.3, pytest-cov, pytest-asyncio | MIT / MIT / Apache-2.0 | | httpx 0.27.2, httpcore (dev only) | BSD-3-Clause |

**Disclosed exception:** `certifi` (**MPL-2.0**, file-level weak copyleft) is installed transitively by `httpx`. It is
confined to `requirements-dev.txt` and is **not** installed in the runtime Docker image. If your policy bans MPL-2.0
in the test toolchain, replace `httpx`-based tests with `websockets`/`urllib`. The spec's "zero copyleft of any kind"
phrasing therefore applies to the **runtime** dependency set only.

**Open diligence items:** formal chain-of-title review (AI-assisted authorship); SBOM generation (e.g. CycloneDX);
automated license scan in CI (`pip-licenses --fail-on=...`) — not yet set up; `fastapi` license metadata blank in wheel.

## 8. Asset schedule and exclusions (for any micro-APA)

**Included in a micro-APA for this asset only:** this repository's source tree, schema, tests, container files and this data room.
**Always excluded:** GhostFactoryOS and Aura & Grid brands, shared design tokens/components/frameworks, factory prompts and
pipelines, internal know-how, rights to future products, and any other asset in the portfolio.

## 9. Track 3 vault-gate status (honest scorecard)

| Requirement | Status | Evidence / gap |
|---|---|---|
| 1. Proprietary algorithmic logic | **Partial** | Deterministic price-time-priority matcher with invariant tests; no further quantitative models |
| 2. Clean-room IP | **Partial** | Runtime set permissive; one MPL-2.0 dev-only transitive; chain-of-title review pending |
| 3. Enterprise hardening | **Open** | `.env` separation done; migrations not idempotent; no RBAC; audit log exists only as unexecuted SQL |
| 4. Niche domain specialization | **Met** | FinTech / quant matching engine |
| 5. Turnkey 15-minute deploy | **Open** | Scripts present but never run; coverage 99% and OpenAPI 3.1 are met |

Until items 3 and 5 are closed, this asset should be presented as a **Deployable Source Template**, not as a *Working Service Engine*.
