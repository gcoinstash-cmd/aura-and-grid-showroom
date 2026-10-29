# ASSET_TRANSFER_SPEC.md: STANDALONE REPOSITORY ASSET PURCHASE SPECIFICATION
**Asset Reference:** GF-T3-207  
**System Designation:** APEX-207 AMM Dynamic Liquidity & Impermanent Loss Engine  
**Asset Category:** Enterprise Reference Core  
**Governing Transfer Protocol:** Standard Commercial Asset Transfer Specification  
**Transaction Structure:** Direct Standalone Repository Asset Purchase Agreement (APA) Assignment  

---

## 1. REPOSITORY ASSET BOUNDARY

Under the Standard Commercial Asset Transfer Specification, 100% of the worldwide rights, title, interest, patents, copyrights, algorithms, and documentation comprising asset GF-T3-207 are transferred as an atomic, standalone codebase:

### 1.1 In-Scope Deliverables
1. **Core Quantitative Engine (`engine.py`):** Standalone FastAPI and Python module providing concentrated virtual reserve calculations, tick spacing, dynamic volatility-scaled fee adjustments, and SHA-256 state ledger.
2. **Verification & Assertion Suite (`test_amm_engine.py`):** Automated test suite validating reserve invariant conservation, mathematical bounds of impermanent loss across extreme price divergence (k in [0.1, 10.0]), capital efficiency scaling, and cryptographic tamper rejection.
3. **Turnkey Container Deployment (`Dockerfile`):** Multi-stage non-root container with dynamic port binding for container execution environments.
4. **Architectural Specification (`ENGINE_SPEC.md`):** Complete mathematical derivations, OpenAPI 3.1 contracts, normalized PostgreSQL DDL migrations, and benchmark matrices.
5. **Clean-Room Attestation (`LEGAL_IP_AUDIT.md`):** NIST SP 800-218 SSDF v1.1 compliance checklist, dependency SBOM, and zero-copyleft certification.
6. **Institutional Terminal Frontend (`/src/*`):** High-fidelity, real-time quantitative operator cockpit implementing interactive tick adjustment, depth curve visualizations, and cryptographic ledger verification.

---

## 2. CLEAN TITLE & UNENCUMBERED WARRANTY

The transferring entity warrants and represents that:
- **Sole & Exclusive Ownership:** The asset was authored exclusively by the transferring sole proprietor as an unencumbered work of independent creation.
- **Absence of Liens:** The repository is free and clear of all liens, encumbrances, security interests, pledges, mortgages, or claims of any nature.
- **Zero Third-Party Royalties:** No third party possesses any royalty rights, trailing commissions, profit participations, or lingering licensing fees tied to the operation of the engine.
- **Zero Copyleft Contamination:** The asset contains no GPL, AGPL, SSPL, or reciprocal copyleft dependencies that would obligate the assignee to disclose downstream proprietary systems.

---

## 3. ZERO-SAAS & PER-NODE DISCLAIMER

- **Direct Repo Transfer Only:** The transaction is structured exclusively as a definitive capital asset transfer.
- **Zero Subscription Agreements:** The asset carries no recurring software-as-a-service (SaaS) subscription tiers, per-seat licensing, or per-node runtime meters.
- **Zero Hosted Maintenance SLAs:** Following completion of the git repository handoff and cryptographic commit hash verification, the purchasing entity assumes full operational, deployment, and infrastructure sovereignty. The transferor provides no persistent hosting, ongoing operational support, or system uptime guarantees.

---

## 4. TURNKEY DEPLOYMENT PROTOCOL

### Step 1: Git Repository Mirroring
Clone or mirror the transfer repository into the enterprise internal VCS:
```bash
git clone git@enterprise-internal.corp:quant-core/gf-t3-207-apex.git
cd gf-t3-207-apex
```

### Step 2: Verification of Core Suite
Run the mathematical verification suite to confirm invariant conservation and cryptographic ledger integrity:
```bash
python3 test_amm_engine.py
```

### Step 3: Turnkey Container Packaging
Build the production container image:
```bash
docker build -t apex-207-amm-core:latest .
```

### Step 4: Container Orchestration
Deploy the container with dynamic port binding. The engine automatically accepts the target port from the runtime environment variable:
```bash
docker run -p 3000:3000 -e PORT=3000 apex-207-amm-core:latest
```
