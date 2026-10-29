# ASSET_TRANSFER_SPEC.md
## Standard Commercial Asset Transfer Specification
### Technical Repository Handoff & IP Assignment Protocol
### Asset ID: GF-T3-218 (Enterprise Reference Core: APEX-218 Real-Time Semantic Cache)

---

## 1. Asset Purchase Agreement (APA) Technical Delivery Protocol

This technical document defines the physical delivery and clean-room handoff protocol for asset **GF-T3-218**. Delivery is conducted exclusively as a direct, standalone codebase transfer for permanent title assignment.

### 1.1 Handoff Bundle Inventory
The buyer receives complete ownership and unencumbered control of the following repository assets:
1. **Core Service Engine (`engine.py`)**: Standalone FastAPI service executing vector cosine similarity calculations, random hyperplane LSH indexing, and speculative dual-score decay eviction queues.
2. **Deterministic Test Suite (`test_cache_engine.py`)**: Automated verification suite testing semantic hit fidelity (similarity >= 0.94), zero-stale post-eviction consistency, eviction priority ranking, and sub-2ms lookup SLAs.
3. **Container Delivery Artifacts (`Dockerfile`)**: Turnkey OCI-compliant container configured for 1-click execution on Google Cloud Run, Google Kubernetes Engine, or bare-metal Linux.
4. **Interactive Telemetry Cockpit (`src/App.tsx`)**: High-fidelity institutional cockpit providing real-time vector mesh scatter plotting, corridor segmentation, dual-score decay visualizers, and chaos test suites.
5. **Technical Specifications & Audits (`ENGINE_SPEC.md`, `LEGAL_IP_AUDIT.md`)**: Full mathematical derivations, schema definitions, and NIST SP 800-218 SSDF v1.1 certification.

---

## 2. Title Warranty & Non-Encumbrance Guarantee

1. **Clean Title Warranty**: The author warrants that the asset is transferred free and clear of all liens, encumbrances, security interests, or third-party claims.
2. **Exclusion of SaaS SLAs & Subscription Models**:
   - The transaction is strictly a direct asset sale of intellectual property and executable source code.
   - This asset does NOT include ongoing SaaS uptime guarantees, hosted API seat subscriptions, per-node licensing fees, or multi-tenant hosting tiers.
   - The acquiring entity assumes complete operational sovereignty upon repository transfer.
3. **Turnkey Sovereign Operation**: The software functions hermetically inside the acquiring entity's private cloud VPC with zero external vendor call-homes or runtime license checks.

---

## 3. Cryptographic Handoff Verification

To establish cryptographic chain-of-custody upon repository handoff:
1. **Repository Tarball Compilation**:
   ```bash
   tar --exclude='.git' --exclude='node_modules' --exclude='__pycache__' -czvf apex-218-transfer-core.tar.gz .
   ```
2. **SHA-256 Checksum Generation**:
   ```bash
   sha256sum apex-218-transfer-core.tar.gz > CHECKSUM.sha256
   ```
3. **Target Ingestion & Validation**:
   The acquiring team's verification engineer matches the SHA-256 hash against the transfer receipt, builds the Docker container, and runs the test suite:
   ```bash
   docker build -t apex-218-reference-core .
   docker run --rm apex-218-reference-core pytest -v test_cache_engine.py
   ```

---

## 4. Transfer Jurisdiction Framework

This asset transfer is executed under the **Standard Commercial Asset Transfer Specification** framework, governing direct proprietary code and asset buyouts between commercial software entities.
