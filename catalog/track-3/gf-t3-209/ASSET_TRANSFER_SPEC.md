# ASSET_TRANSFER_SPEC.md
## GF-T3-209: APEX-209 Multi-Regime VaR & Expected Shortfall Risk Engine
### Technical Specification for Standalone Asset Purchase Agreement (APA) Handoff
**Framework:** Standard Commercial Asset Transfer Specification  
**Asset Category:** Enterprise Reference Core (Track 3)  
**Transfer Type:** Complete Standalone Code Repository Handoff  

---

## 1. Scope of Asset Transfer

This transfer specification establishes the technical boundary and deliverable package for perpetual intellectual property assignment to the purchasing entity:

### 1.1 Included Digital Deliverables
1. **Core Quantitative Engine (`engine.py`)**:
   - Complete algorithmic implementation of Peaks-Over-Threshold Extreme Value Theory (EVT) with Generalized Pareto Distribution (GPD).
   - Parametric Cornish-Fisher expansion module with higher-moment adjustment.
   - Hull-White historical simulation with rolling EWMA volatility updating.
   - 10,000-path correlated multi-asset Monte Carlo simulation via Cholesky decomposition.
   - Regulatory backtesting suite (Kupiec POF Likelihood Ratio and Christoffersen Independence tests).
   - Append-only SHA-256 cryptographic audit ledger and verification engine.

2. **Automated Verification Suite (`test_risk_engine.py`)**:
   - Pytest and unittest compliant validation suite verifying mathematical coherence (ES >= VaR), parameter bounds, Gaussian convergence, and cryptographic tamper rejection.

3. **Turnkey Container Infrastructure (`Dockerfile`)**:
   - Multi-stage non-root hardened container (UID 10001) with dynamic port binding for instant Google Cloud Run and Kubernetes deployment.

4. **Production Architecture & Schemas (`ENGINE_SPEC.md`)**:
   - Complete architectural topology, algorithmic derivations, OpenAPI 3.1 protocol definitions, and PostgreSQL/AlloyDB DDL schemas.

5. **Clean-Room Attestation & SBOM (`LEGAL_IP_AUDIT.md`)**:
   - 100% clean-room provenance attestation, zero reciprocal copyleft certification, and NIST SP 800-218 SSDF v1.1 alignment.

6. **Institutional Visual Risk Terminal (`src/`)**:
   - High-density institutional quant cockpit with multi-regime distribution curves, dynamic VaR/ES curtains, Q-Q plots, stress shock triggers, and ledger inspection.

---

## 2. IP Assignment & Commercial Terms Alignment

### 2.1 Perpetual Title Assignment
All rights, title, and interest in and to the source code, mathematical algorithms, data schemas, and documentation are transferred perpetually to the purchaser upon execution of a standard Asset Purchase Agreement.

### 2.2 Rejection of Licensing Models
Consistent with sole proprietorship asset purchase standards:
- **No Per-Seat or Per-User Fees**: The codebase operates without seat count limits.
- **No Per-Node or Core Licensing**: Deployment is unrestricted across internal clusters, cloud instances, and on-premises infrastructure.
- **No Recurring Subscription Obligations**: Zero maintenance subscriptions or license renewals.
- **Direct Standalone Repository Transfer**: The asset is transferred as a complete, unencumbered Git repository.

### 2.3 Disclaimer of SaaS Support SLAs
The transferor delivers the codebase as a verified, self-contained reference core. The transferor does not provide ongoing operational SaaS hosting, 24/7 incident response, or ongoing managed service level agreements (SLAs). The purchasing organization assumes operational custody of container deployments and database configurations.

---

## 3. Turnkey Deployment & Verification Procedure

### 3.1 Local Environment Scaffolding
```bash
# Verify Python 3.10+ installation
python3 --version

# Execute automated test suite
python3 test_risk_engine.py

# Launch quantitative risk terminal
npm run dev
```

### 3.2 Container Build & Cloud Run Dispatch
```bash
# Build multi-stage hardened image
docker build -t apex209-risk-engine:latest .

# Run unprivileged container locally on port 8080
docker run -p 8080:8080 apex209-risk-engine:latest
```

### 3.3 Handoff Acceptance Criteria
The receiving quant engineering team verifies transfer completion against three objective criteria:
1. All automated tests in `test_risk_engine.py` pass with zero failures.
2. The cryptographic audit ledger verifies chain integrity from genesis block to current head.
3. The multi-regime risk terminal renders synchronized Cornish-Fisher, Hull-White, and EVT GPD metrics matching the derivation formulas in `ENGINE_SPEC.md`.
