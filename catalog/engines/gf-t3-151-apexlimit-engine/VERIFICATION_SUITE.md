# VERIFICATION SUITE — OFFLINE PYTEST & COVERAGE SPECIFICATION
## Target Asset: `GF-T3-151` (`ApexLimit Order Matching & Real-Time Risk Liquidation Engine`)

---

## 1. Zero-Network Due Diligence Guarantee
The `GF-T3-151` verification suite is engineered to execute **100% offline** in an air-gapped environment:
- **Zero External Network Calls:** No live database, Redis cluster, or external exchange WebSocket is required to run the test suite.
- **Deterministic In-Memory Fixtures:** All order book levels, multi-asset collateral balances, and FastAPI HTTP gateway routes are tested using deterministic in-memory fixtures and `fastapi.testclient.TestClient`.
- **Coverage Enforcement Gate:** Configured via `pytest.ini` and `./VERIFICATION_SUITE` to enforce a strict `>80%` minimum code coverage threshold (`--cov-fail-under=80`). Current verified coverage is **95.27%**.

---

## 2. Test Runner Configuration (`pytest.ini`)

```ini
[pytest]
pythonpath = .
asyncio_mode = auto
asyncio_default_fixture_loop_scope = function
testpaths = tests
addopts = -v --tb=short
```

---

## 3. Running the Verification Suite

### Option A: One-Command Executable Runner
```bash
chmod +x ./VERIFICATION_SUITE
./VERIFICATION_SUITE
```

### Option B: Direct `pytest` Invocation
```bash
PYTHONPATH=. pytest tests/ --cov=src --cov-report=term-missing --cov-fail-under=80 -v
```

---

## 4. Verified Coverage Matrix (21/21 Tests Passing — 95.27% Coverage)

| Module Path | Statements | Missed | Coverage % | Verified Subsystems |
| :--- | :---: | :---: | :---: | :--- |
| `src/__init__.py` | 0 | 0 | **100%** | Package root initialization |
| `src/core/__init__.py` | 3 | 0 | **100%** | Core exports |
| `src/core/matching_engine.py` | 270 | 12 | **96%** | $10^8$ fixed-point math, FIFO queues, LIMIT/MARKET/STOP_LIMIT, L2 snapshots |
| `src/core/risk_manager.py` | 182 | 14 | **92%** | Haircut equity ($w_c$), pre-trade IM/MM margin lock, liquidation sentinel |
| `src/main.py` | 137 | 2 | **99%** | FastAPI REST gateway (`/health`, `/healthz`, `/v1/orders`, `/v1/orderbook`, `/v1/risk/*`) |
| **TOTAL** | **592** | **28** | **95.27%** | **Exceeds >80% Monopoly Vault Gate 5 Requirement** |

---

## 5. Test Inventory Breakdown (`tests/`)

### Suite 1: Core Mathematical & Matching Invariants (`tests/test_matching_engine.py` — 13 Tests)
1. `test_zero_float_precision_invariants` — Verifies $10^8$ integer scaling (`0.1 + 0.2 == 0.3` exact micro-tick representation).
2. `test_orderbook_insert_and_l2_snapshot` — Validates bid/ask sorting and L2 depth aggregation.
3. `test_crossing_spread_full_execution` — Validates immediate taker fill against resting maker liquidity.
4. `test_price_time_priority_fifo_queue` — Confirms strict FIFO execution order at identical price levels.
5. `test_market_order_execution_and_unfilled_cancellation` — Verifies market order depth sweep and IOC cancellation of residual quantity.
6. `test_stop_limit_order_triggering` — Confirms conditional `STOP_LIMIT` activation upon trade price breach.
7. `test_order_cancellation_and_level_cleanup` — Verifies $O(1)$ cancellation and empty price-level pruning.
8. `test_client_order_id_idempotency` — Prevents duplicate order submission for identical `client_order_id`.
9. `test_risk_margin_lock_and_rejection_on_insufficient_collateral` — Rejects under-collateralized orders pre-trade.
10. `test_risk_margin_approval_and_lock_release` — Confirms initial margin lock and release upon order cancellation.
11. `test_liquidation_sentinel_trigger_on_adverse_mark_move` — Triggers automatic liquidation when account equity falls below maintenance margin ($MM$).
12. `test_multi_collateral_haircut_equity` — Verifies weighted collateral haircut calculations (`USD=1.00`, `USDT=0.98`, `BTC=0.90`, `ETH=0.85`).
13. `test_telemetry_and_latency_reporting` — Validates runtime telemetry counters and memory fence status.

### Suite 2: FastAPI REST Gateway & Edge-Case Suite (`tests/test_api_gateway.py` — 8 Tests)
14. `test_health_and_healthz_probes` — Verifies `/health` and `/healthz` readiness probes.
15. `test_l2_orderbook_snapshot` — Tests `GET /v1/orderbook/BTC-USD` seeded liquidity depth.
16. `test_deposit_usd_and_crypto_collateral_and_margin_query` — Tests `POST /v1/risk/deposit` and `GET /v1/risk/margin/{account_id}`.
17. `test_submit_resting_order_and_cancel_flow` — Tests `POST /v1/orders` and `DELETE /v1/orders/{order_id}` lifecycle including `404` idempotency.
18. `test_submit_crossing_order_full_fill_and_settlement` — Tests full crossing execution and risk ledger settlement via REST API.
19. `test_pre_trade_risk_rejection_400` — Confirms `HTTP 400 Bad Request` (`PRE_TRADE_RISK_REJECTION`) on excessive leverage.
20. `test_mark_price_update_and_liquidation_cascade_endpoint` — Tests `POST /v1/risk/mark-price` and `POST /v1/risk/liquidate/{account_id}` cascade clearing.
21. `test_matching_engine_sell_stop_and_market_edge_cases` — Covers sell-side stop-limit triggering, untriggered stop cancellation, and market sell sweeps.
