# ASSET_TRANSFER_SPEC.md: STANDALONE REPOSITORY HANDOFF SPECIFICATION
## Enterprise Reference Core · Catalog Item GF-T3-219
Document Reference: APA-TRANSFER-GF-T3-219  
Governing Standard: Standard Commercial Asset Transfer Specification  
Classification: Turnkey Clean-Room Software Transfer  

---

### 1. SCOPE OF TRANSFERRED ASSETS

Under the executed Asset Purchase Agreement (APA), the Seller conveys, transfers, and assigns to the Acquirer 100% of the worldwide rights, title, interest, and intellectual property in and to the software repository designated as APEX-219 (GF-T3-219), comprising:

1. Core Engine Subsystem: Complete Python/FastAPI backend (`engine.py`) implementing parallel draft generation, single-pass target verification, rejection sampling distribution preservation, and KV-cache rollback state machines.
2. Verification and Invariant Test Suite: Automated test specifications (`test_speculative_engine.py`) validating mathematical distribution preservation, zero pointer memory leaks, and performance speedup invariants.
3. Institutional Cockpit & Operator HUD: Interactive React/TypeScript cockpit (`src/App.tsx`) providing multi-corridor telemetry, tree branching visualization, real-time KV-cache slot inspectability, and chaos injection triggers.
4. Deployment Infrastructure: Turnkey containerization files (`Dockerfile`), build scripts, and static asset pipeline configurations.
5. Technical and Compliance Documentation: Complete architectural blueprints (`ENGINE_SPEC.md`), clean-room intellectual property audit (`LEGAL_IP_AUDIT.md`), and this Transfer Specification.

---

### 2. TITLE WARRANTY & CLEAN-ROOM ASSIGNMENT

The Seller warrants and represents that:
1. Sole Ownership: The Seller is the exclusive author and sole proprietor of the software, with full legal capacity to convey good, marketable, and unencumbered title.
2. Zero Encumbrance: The assets are transferred free and clear of all liens, mortgages, pledges, security interests, or third-party claim reservations.
3. Non-Infringement: To the best of the Seller's knowledge, neither the software nor its architectural design infringes any patent, copyright, trade secret, or other proprietary rights of any third party.
4. Independent Origin: All modules were created under clean-room engineering protocols without reliance on unauthorized or restricted proprietary code.

---

### 3. REPOSITORY HANDOFF & ARTIFACT CHECKSUM VERIFICATION

The repository handoff is executed as an immutable, self-contained Git bundle:
- Target Archive: `apex-219-core-v3.bundle`
- Primary Git Commit Hash: `9f2b801a6d4e12c5b73e89a4219c001f7823e410`
- SHA-256 Checksum Signature: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- Zero External Private Submodules: All dependencies are resolvable via public, verified package indexes.

Turnkey Deployment Command:
```bash
docker build -t apex219-engine:latest .
docker run -p 8080:8080 apex219-engine:latest
```

---

### 4. ZERO-SAAS SLA DISCLAIMER & ASSET INDEPENDENCE

1. Standalone Asset Conveyance: This transaction constitutes an outright conveyance of software code assets. The Seller does NOT provide SaaS subscriptions, per-seat licensing, hosting services, managed uptime, or recurring compute capacity.
2. Zero Ongoing SLA Obligations: Following completion of the formal repository handoff and checksum verification, the Acquirer assumes full operational control, maintenance, execution, and integration responsibility.
3. No Vendor Lock-In: The software contains zero proprietary phone-home routines, license validation servers, telemetry beacons, or vendor-locked authentication hooks. It runs fully isolated in offline, air-gapped, or cloud VPC environments.

---

### 5. TRANSACTION FRAMEWORK

This transfer is consummated pursuant to the Standard Commercial Asset Transfer Specification executed by the authorized principals of the respective parties. All technical verifications and zero-dollar compliance criteria have been certified as of the closing date.

Certified By: Lead Systems Architect  
Entity: Sole Proprietor · Aura and Grid Software Catalog  
Transfer Identifier: APA-2026-GF-T3-219-CORE
