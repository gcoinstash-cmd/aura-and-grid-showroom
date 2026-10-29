# ASSET TRANSFER SPECIFICATION
## APEX-208 Options Surface & Volatility Calibration Engine (GF-T3-208)

---

### 1. Direct Standalone Repository Transfer Protocol

This technical transfer specification defines the procedure for executing an outright clean-room repository handover of the APEX-208 Production Reference Core from the independent software developer (Sole Proprietor) to the acquiring enterprise under a standard Asset Purchase Agreement (APA).

1. **Transaction Structure**: Outright intellectual property assignment and physical repository handoff. This transaction is structured exclusively as a permanent assignment of code artifacts, architectural blueprints, test fixtures, and mathematical derivations.
2. **Zero-SaaS & Zero Recurring Overhead Model**:
   - The asset operates with zero external SaaS dependencies, zero vendor lock-in, and zero mandatory cloud subscriptions.
   - No per-seat licenses, per-node charges, or per-core royalty structures apply.
   - Upon closing and git mirror handoff, the acquiring enterprise assumes full autonomous operational custody without reliance on the original developer.
3. **Standalone Deployment Guarantee**: The codebase compiles, tests, and deploys as a self-contained container without calling external proprietary licensing verification servers.

---

### 2. Deliverables & Repository Inventory

The transfer payload comprises the complete, unencumbered version-controlled repository containing:

1. **Numerical Computational Core**:
   - `engine.py`: Standalone numerical Python engine (SABR Hagan 2002 closed-form, Black-76 pricer, Brenner-Subrahmanyam seeded Newton-Raphson root solver, analytical Greeks, Nelder-Mead simplex optimizer, and SHA-256 state ledger).
   - `src/quant/`: Pure TypeScript dual-core implementation providing zero-latency in-browser mathematical evaluation matching the Python backend to 1e-7 tolerance.
2. **Deterministic Test Verification Suite**:
   - `test_vol_surface.py`: Automated test harness verifying numerical inversion tolerance (<1e-4 pts), parameter boundaries, calendar/butterfly arbitrage detection, and cryptographic tamper resistance.
3. **Turnkey Containerization**:
   - `Dockerfile`: Multi-stage non-root container with dynamic PORT binding, pre-configured for Google Cloud Run or Kubernetes container orchestration.
4. **Architectural & Legal Documentation**:
   - `ENGINE_SPEC.md`: Exhaustive mathematical derivations, OpenAPI 3.1 contracts, and PostgreSQL 16+ DDL schema.
   - `LEGAL_IP_AUDIT.md`: Clean-room authorship warranty, permissive MIT/BSD dependency audit, and NIST SP 800-218 SSDF v1.1 compliance checklist.
   - `ASSET_TRANSFER_SPEC.md`: This repository transfer and post-closing operational specification.

---

### 3. Turnkey Container Deployment Verification

The acquiring engineering team can execute immediate standalone verification and production staging using the standard container toolchain:

#### Step 1: Automated Regression Test Execution
```bash
python3 test_vol_surface.py
```
Expected output: 7 passed tests in < 15ms.

#### Step 2: Container Image Compilation
```bash
docker build -t apex208-core:latest .
```

#### Step 3: Local Container Execution
```bash
docker run -d --name apex208 -p 3000:3000 apex208-core:latest
```

#### Step 4: Health Check Verification
```bash
curl -s http://localhost:3000/health
```
Expected JSON response:
```json
{
  "status": "HEALTHY",
  "module": "APEX-208-VOL-ENGINE",
  "ledger_height": 1,
  "timestamp": 1792248000.0
}
```

---

### 4. Clean Title Warranty & Closing Disclaimers

1. **Title Warranty**: The developer warrants full legal and beneficial ownership of all proprietary code elements in APEX-208, free from any third-party encumbrance, security interest, or copyright pledge.
2. **Standard Commercial Asset Transfer Specification**: Transfer governance adheres to standard commercial asset purchase principles.
3. **No Ongoing Service Level Agreement (SLA)**: As an outright asset transfer, the software is provided as a production reference core for internal engineering integration. Ongoing monitoring, hosting, and production operations are the sole prerogative of the acquirer.
