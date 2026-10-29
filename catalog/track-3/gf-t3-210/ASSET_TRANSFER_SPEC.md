# ASSET TRANSFER SPECIFICATION
## Asset Classification: Enterprise Reference Core
## Asset Identifier: GF-T3-210 (APEX-210 Real-Time LOB Microstructure Engine)
## Handoff Protocol: Standard Commercial Asset Transfer Specification
## Transaction Structure: Standalone Repository Buyout via Asset Purchase Agreement (APA)

---

## 1. Technical Transfer Architecture & Repository Handoff

The APEX-210 software asset is engineered as a fully decoupled, standalone clean-room codebase designed for immediate, turnkey ingestion into the acquiring entity's private version control system and CI/CD pipelines.

### Primary Deliverable Assets Included in Transfer
1. **Core Matching Engine (`engine.py`)**:
   - Discrete price-time priority FIFO order book with Level 2 / Level 3 depth structures.
   - Real-time queue tracker calculating participant child order priority, units ahead, and distance to touch.
   - Hawkes point process intensity simulator with branching ratio stationarity calculations.
   - Kyle's Lambda regression and Amihud illiquidity impact estimators.
   - Cryptographic SHA-256 state ledger with integrity verification probe.

2. **Automated Verification Test Suite (`test_lob_engine.py`)**:
   - Deterministic test cases validating FIFO conservation, spread non-negativity (Ask >= Bid), Hawkes decay, and tamper resistance.

3. **Production Containerization (`Dockerfile`)**:
   - Multi-stage build deploying unprivileged non-root runner (`lobuser`, UID 10001).
   - Dynamic port binding compatible with Google Cloud Run, AWS ECS, or bare-metal Kubernetes.

4. **Institutional Trading Cockpit (`/src` React / TypeScript Application)**:
   - High-frequency DOM depth ladder with cumulative volume visual bars.
   - Interactive child order submission and real-time FIFO queue advancement.
   - Real-time trade tape with permanent price impact tracking.
   - Dynamic Hawkes intensity graph and market stress injectors ("Inject Cancel Wave", "Trigger Flash Sweep").

5. **Complete Documentation Suite**:
   - `ENGINE_SPEC.md`: Exhaustive mathematical specifications and OpenAPI 3.1 contract.
   - `LEGAL_IP_AUDIT.md`: Clean-room provenance attestation and NIST SP 800-218 SSDF v1.1 checklist.
   - `ASSET_TRANSFER_SPEC.md`: Standalone transfer specification.

---

## 2. Clean IP Assignment & Ownership Handoff Protocol

### A. Asset Transfer Package Delivery
Handoff occurs via bare Git repository transfer:
```bash
git clone --bare <PRIVATE_SOURCE_URI> apex-210-lob-core.git
cd apex-210-lob-core.git
git push --mirror <ACQUIRING_ENTITY_PRIVATE_VCS_URI>
```

### B. Clean Title Warranty
Upon execution of the standard Commercial Asset Purchase Agreement:
- Sole proprietor relinquishes all title, copyright, ownership, and moral rights in favor of the acquiring entity.
- The asset is free of any third-party claims, liens, royalties, or encumbrances.
- All code is 100% clean-room developed under permissive licensing (MIT/BSD dependencies only).

---

## 3. Deployment & Operational Runbook

### Step 1: Automated Test Suite Verification
Prior to production containerization, execute the deterministic verification suite:
```bash
python3 test_lob_engine.py
```
Expected output: 5 passing test vectors in under 0.05 seconds.

### Step 2: Container Compilation & Deployment
Build the hardened, non-root container image:
```bash
docker build -t apex210-lob-core:1.0.0 .
docker run -p 8080:8080 apex210-lob-core:1.0.0
```
Verify endpoint responsiveness:
```bash
curl http://localhost:8080/health
```

---

## 4. Operational Boundaries & Zero-SaaS SLA Disclaimer

1. **Direct Repositories Only**: This asset is transferred solely as standalone source code and containerized reference infrastructure.
2. **Zero SaaS SLA or Hosted Maintenance**: The sole proprietor provides zero ongoing operational hosting, multi-tenant cloud service level agreements (SLAs), per-seat support tiers, or continuous monitoring services.
3. **Turnkey Independence**: Full operational control, maintenance, deployment schedules, and architectural extensions transition unconditionally to the acquiring organization upon transfer completion.
