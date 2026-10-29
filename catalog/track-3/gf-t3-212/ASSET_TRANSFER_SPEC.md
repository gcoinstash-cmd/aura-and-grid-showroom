# TECHNICAL ASSET TRANSFER SPECIFICATION

**Asset Reference**: GF-T3-212 / APEX-212 Multi-Agent BFT Consensus Engine  
**Catalog Classification**: Enterprise Reference Core  
**Transfer Paradigm**: Full Autonomous Repository Assignment (Clean Standalone Handoff)  
**Governing Standard**: Standard Commercial Asset Transfer Specification  
**Operational Support**: Zero-SaaS Support Model (Autonomous Self-Sustaining Architecture)  

---

## 1. Scope of Asset Deliverable

This technical asset transfer delivers 100% complete, unencumbered ownership of the standalone codebase, architectural specifications, container definitions, and automated test harnesses comprising the APEX-212 distributed consensus engine:

1. **Production Engine Implementation**:
   - `engine.py`: Standalone FastAPI service executing PBFT 3-phase consensus, randomized leader timeouts, view-change transitions, and Merkle-Patricia state trie operations.
2. **Automated Verification Suite**:
   - `test_consensus_engine.py`: Full pytest harness covering safety invariants under Byzantine equivocation, liveness recovery, Merkle root determinism, and SHA-256 chain immutability.
3. **Container & Deployment Infrastructure**:
   - `Dockerfile`: Multi-stage non-root container with dynamic PORT environment variable binding, compliant with Google Cloud Run and Kubernetes runtimes.
4. **Architectural & Security Documentation**:
   - `ENGINE_SPEC.md`: Formal quorum proofs (n >= 3f + 1), OpenAPI 3.1 contracts, and PostgreSQL DDL schema.
   - `LEGAL_IP_AUDIT.md`: Clean-room provenance attestation, CycloneDX SBOM, and NIST SP 800-218 SSDF v1.1 compliance audit.
5. **Mission Control Operator Terminal**:
   - Fully interactive cockpit interface built with React and Tailwind CSS providing real-time state machine inspection, Byzantine chaos simulation, and live Merkle root verification.

---

## 2. Clean-Title Intellectual Property Assignment Protocol

1. **All-Inclusive Transfer**: Upon execution of the definitive Asset Purchase Agreement (APA), the purchaser receives full, perpetual, worldwide, irrevocable ownership of all copyrights, patents, proprietary methods, software architectures, and trade secrets embodied within this repository.
2. **Sole Proprietor Execution**: The asset is held directly by an independent sole proprietor, guaranteeing zero cap-table encumbrances, zero venture liens, and zero corporate subsidiary entanglements.
3. **No Ongoing Royalties or Subscriptions**: The transaction is structured as a one-time clean-break repository handoff. There are zero per-seat licensing tiers, zero per-node fees, and zero recurring maintenance obligations.
4. **Zero-SaaS Support Disclaimer**: The software is transferred as a deterministic reference implementation. The purchaser assumes operational custodianship, deployment management, and internal tailoring.

---

## 3. Turnkey Deployment Verification & Ingestion Procedure

To verify and deploy the repository immediately upon ingestion:

### Step 1: Automated Verification Suite Execution
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest test_consensus_engine.py -v
```

### Step 2: Standalone Engine Execution
```bash
uvicorn engine:app --host 0.0.0.0 --port 3000 --workers 1
```

### Step 3: Container Deployment to Cloud Infrastructure
```bash
docker build -t apex-212-consensus:1.0.0 .
docker run -d -p 3000:3000 --name apex-node-alpha apex-212-consensus:1.0.0
```

### Step 4: Health & Quorum Telemetry Handshake
```bash
curl -X GET http://localhost:3000/health
curl -X GET http://localhost:3000/api/v1/cluster/status
```

---

## 4. Verification Checkpoint Matrix

| Component | Technical Verification Check | Deterministic Acceptance Criteria |
|:---|:---|:---|
| **Consensus Safety** | Byzantine Fault Injection | Zero state forks committed when Byzantine nodes <= f_max |
| **Consensus Liveness** | Leader Heartbeat Drop | Automatic view change completed within 3,500 ms window |
| **State Immutability** | Cryptographic Ledger Audit | Root SHA-256 recalculates and matches across all honest nodes |
| **Runtime Security** | Container Privilege Check | Runs under UID 10001 (non-root) with read-only root filesystems |
