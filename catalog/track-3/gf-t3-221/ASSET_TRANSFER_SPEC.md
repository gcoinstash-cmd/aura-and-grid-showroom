# ASSET TRANSFER SPECIFICATION
## Track 3 Production Reference Core
### Asset Identifier: GF-T3-221
### Standard Commercial Asset Transfer Specification

---

### 1. ASSET CLASSIFICATION & SCOPE OF TRANSFER

This Technical Handoff Specification governs the complete, irrevocable title transfer of the software assets comprising **GF-T3-221** from the Sole Proprietor (Transferor) to the Acquirer (Transferee) pursuant to an executed Asset Purchase Agreement (APA).

#### Included Intellectual Property & Deliverables:
1. **Core Scheduling Engine**: Standalone, production-ready continuous batching engine (`engine.py`) with 32-slot iteration forward pass execution.
2. **Verification Test Suite**: Deterministic Pytest suite (`test_continuous_batch_engine.py`) covering zero-delay injection, dynamic slot retirement, and starvation-free preemption.
3. **Turnkey Deployment Artifacts**: Multi-stage container specification (`Dockerfile`) optimized for Google Cloud Run and containerized compute grids.
4. **Institutional Cockpit Application**: Full-featured React/TypeScript cockpit (`src/App.tsx`) with real-time slot telemetry, corridor selection, and GPU bubble analysis.
5. **Architectural & Legal Documentation**: Complete mathematical proofs, PostgreSQL schema migration DDL (`ENGINE_SPEC.md`), clean-room provenance audit (`LEGAL_IP_AUDIT.md`), and this Transfer Specification.

---

### 2. REPOSITORY HANDOFF & REPLICATION PROTOCOL

Transfer is executed via direct Git repository transfer:

1. **Origin Verification**: Transferor pushes all branches, tags, and commit trees to the Transferee's designated private repository mirror.
2. **Hash Integrity Attestation**: SHA-256 tree hashes of the master branch commit are verified against Transferor's clean-room release signature.
3. **Turnkey Scaffolding Verification**:
   - Environment initialization: `pip install -r requirements.txt` (or container build).
   - Test suite execution: `pytest test_continuous_batch_engine.py` (100% pass requirement).
   - Cockpit verification: `npm install && npm run build` (zero compilation warnings).

---

### 3. CLEAN TITLE WARRANTY & NON-ENCUMBRANCE

The Transferor represents and warrants:
- **Sole Authorship**: All original source code was authored without third-party collaborators, subcontractors, or university/institutional affiliations.
- **Unencumbered Title**: The software asset is free and clear of all liens, mortgages, pledges, security interests, licenses, claims, or restrictions of any kind.
- **Absence of Infringement**: To the knowledge of the Transferor, the asset does not infringe any third-party patent, copyright, trademark, trade secret, or intellectual property right.

---

### 4. ZERO-SAAS & PERPETUAL OWNERSHIP MODEL

- **Direct Asset Ownership**: Upon closing of the Asset Purchase Agreement, the Transferee acquires full, perpetual, unconditional ownership of all copyright, patent rights, trade secrets, and source code.
- **No SaaS SLA or Subscription Ties**: The software operates entirely on-premise or within the Transferee's private cloud infrastructure. No recurring subscription, per-seat fee, per-token charge, or centralized licensing server is required or embedded in the software.
- **No Vendor Lock-in**: All code is 100% self-contained and operates in hermetic environments without external API calls or outbound telemetry phones.
