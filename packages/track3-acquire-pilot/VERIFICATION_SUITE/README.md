# VERIFICATION SUITE — OFFLINE PYTEST & COVERAGE SPECIFICATION
## Target Asset: `GF-T3-151` (`ApexLimit Order Matching & Real-Time Risk Liquidation Engine`)
**License Standard:** 100% Permissive Clean-Room IP (`MIT` / `Apache-2.0` / `BSD-3-Clause`)

---

## 1. Zero-Network Due Diligence Guarantee
The `GF-T3-151` verification suite in `VERIFICATION_SUITE/` is engineered to execute **100% offline** in an air-gapped environment:
- **Zero External Network Calls:** No live database, Redis cluster, or external exchange WebSocket is required to run the test suite.
- **Deterministic In-Memory Fixtures:** All order book levels, multi-asset collateral balances, and FastAPI HTTP gateway routes are tested using deterministic in-memory fixtures and `fastapi.testclient.TestClient`.
- **Coverage Enforcement Gate:** Exceeds the Track 3 `>80%` code coverage requirement with **95.27% verified coverage** (`21/21` passing tests).

---

## 2. Running the Verification Suite

From the repository root:
```bash
pytest packages/track3-acquire-pilot/VERIFICATION_SUITE/ -q
```

Or with full branch and line coverage reporting:
```bash
pytest packages/track3-acquire-pilot/VERIFICATION_SUITE/ --cov=packages/track3-acquire-pilot/src --cov-report=term-missing --cov-fail-under=80
```

---

## 3. Verified Coverage Matrix (`21/21` Tests Passing — `95.27%` Coverage)

| Module Path | Statements | Missed | Coverage % | Verified Subsystems |
| :--- | :---: | :---: | :---: | :--- |
| `src/__init__.py` | 0 | 0 | **100%** | Package root initialization |
| `src/core/__init__.py` | 3 | 0 | **100%** | Core exports |
| `src/core/matching_engine.py` | 270 | 12 | **96%** | $10^8$ fixed-point math, FIFO queues, LIMIT/MARKET/STOP_LIMIT, L2 snapshots |
| `src/core/risk_manager.py` | 182 | 14 | **92%** | Haircut equity ($w_c$), pre-trade IM/MM margin lock, liquidation sentinel |
| `src/main.py` | 137 | 2 | **99%** | FastAPI REST gateway (`/health`, `/healthz`, `/v1/orders`, `/v1/orderbook`, `/v1/risk/*`) |
| **TOTAL** | **592** | **28** | **95.27%** | **Exceeds >80% Monopoly Vault Gate 5 Requirement** |
