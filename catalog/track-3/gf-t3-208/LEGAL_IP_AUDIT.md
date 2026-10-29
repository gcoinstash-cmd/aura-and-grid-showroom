# LEGAL & INTELLECTUAL PROPERTY AUDIT
## APEX-208 Options Surface & Volatility Calibration Engine (GF-T3-208)

---

### 1. Clean-Room Provenance & Independent Authorship Certification

This document certifies that the APEX-208 Real-Time Options Surface & Implied Volatility Calibration Engine ("The Software Asset") was conceived, mathematically derived, and coded entirely via clean-room engineering methodologies by an independent software developer and sole proprietor.

1. **Independent Development**: No proprietary third-party trade secrets, confidential bank source code, or proprietary financial library code was referenced, decompiled, or ingested during development.
2. **Mathematical Public Domain Alignment**:
   - SABR analytical formulations are directly implemented from the foundational peer-reviewed academic literature published by Hagan, Kumar, Lesniewski, and Woodward (2002) in Wilmott Magazine ("Managing Smile Risk").
   - Implied volatility seed approximations are implemented from Brenner and Subrahmanyam (1988) in Financial Analysts Journal.
   - Arbitrage boundaries are implemented from Breeden and Litzenberger (1978) in Journal of Business.
3. **No Unlicensed Intellectual Property**: The code contains zero copyrighted mathematical algorithms subject to active commercial patents.

---

### 2. Dependency Whitelist & Copyleft Quarantine Attestation

Every third-party software component included directly or indirectly in the software repository has been audited for compliance with permissive open-source licensing.

#### 2.1 Software Bill of Materials (SBOM)

| Package Identifier | Declared Version | Verified License | Copyleft Risk | Ingestion Scope |
| :--- | :--- | :--- | :--- | :--- |
| **fastapi** | 0.110.0 | MIT License | NONE | Production REST API Gateway |
| **uvicorn** | 0.28.0 | BSD-3-Clause | NONE | Production ASGI Server Worker |
| **pydantic** | 2.6.4 | MIT License | NONE | Input Contract Type Enforcer |
| **three** | 0.170.0 | MIT License | NONE | Client-Side 3D Mesh Rendering |
| **react** | 19.0.1 | MIT License | NONE | Web Interface Component Lifecycle |
| **lucide-react** | 0.546.0 | ISC License (MIT-equiv) | NONE | Vector Indicator Glyphs |
| **tailwindcss** | 4.3.3 | MIT License | NONE | Deterministic Viewport Layout |
| **typescript** | 7.0.2 | Apache 2.0 | NONE | Static Type Safety Compiler |

#### 2.2 Viral License Quarantine & Exclusion Guarantee

The software repository explicitly excludes:
- GNU General Public License (GPL v1, v2, v3)
- GNU Affero General Public License (AGPL v3)
- Server Side Public License (SSPL)
- GNU Lesser General Public License (LGPL v2.1, v3)
- Commons Clause or restrictive non-commercial riders

No viral copyleft obligations adhere to the repository. The asset is 100% clean for unencumbered proprietary enterprise integration and irrevocable copyright assignment.

---

### 3. NIST SP 800-218 Secure Software Development Framework (SSDF v1.1)

The codebase satisfies the core requirements of NIST SP 800-218 Revision 1.1:

| NIST SSDF Practice | Implementation Control in APEX-208 | Verification Artifact |
| :--- | :--- | :--- |
| **PO.1.1 (Security Requirements)** | Numerical bounds checking on all optimization parameters (alpha > 0, nu > 0, -1 < rho < 1). | test_vol_surface.py::test_sabr_parameter_bounds |
| **PO.3.1 (Toolchain Integrity)** | Containerized multi-stage non-root runtime environment (UID 10001) with unprivileged execution. | Dockerfile |
| **PS.1.1 (Software Architecture)** | Strict separation between numerical computation, state ledger, and user presentation. | engine.py & ENGINE_SPEC.md |
| **PW.1.2 (Static Code Quality)** | Strict typing without any/eval; zero unhandled floating point NaN/Inf scenarios. | tsconfig.json & engine.py |
| **PW.4.1 (Vulnerability Remediation)** | Zero high/critical CVEs in runtime dependencies via minimal base Alpine/Debian slim layers. | SBOM Manifest |
| **PW.7.1 (Cryptographic Protection)** | Append-only SHA-256 cryptographic state ledger recording every calibration iteration. | CryptographicLedger in engine.py |
| **RV.1.1 (Verification & Testing)** | Automated mathematical regression and arbitrage verification test suite. | test_vol_surface.py (100% pass) |

---

### 4. Direct Asset Purchase Agreement (APA) Clean Title Warranty

1. **Title and Authority**: The sole proprietor developer is the sole and exclusive owner of all right, title, and interest in and to the software codebase, including all intellectual property rights, patentable subject matter, and copyright registrations.
2. **Absence of Encumbrances**: The software asset is transferred free and clear of all liens, claims, encumbrances, security interests, and covenants not to compete.
3. **No Ongoing Third-Party Obligations**: No royalties, license fees, milestone payments, or revenue shares are owed to any third party.
4. **Standard Commercial Asset Transfer Specification**: All disputes, transfers, and closing actions adhere strictly to standard commercial asset transfer protocols.
