# APEX-202 High-Frequency Matching Engine
## Legal IP Audit & Clean-Room Provenance Certification
**Document ID:** LEGAL_IP_AUDIT.md  
**Classification:** Enterprise Reference Core · Clean-Room IP Assignment Audit  
**Target Transfer Standard:** Standard Commercial Asset Transfer Specification  
**Governing Standard:** NIST SP 800-218 Secure Software Development Framework (SSDF) v1.1  

---

## 1. Clean-Room Provenance Attestation

This document certifies that the **APEX-202 High-Frequency Limit Order Book & Liquidity Matching Engine** codebase has been independently authored from scratch under strict clean-room engineering protocols.

### 1.1 Clean-Room Execution Safeguards
- **Independent Authorship**: All matching logic, heap data structures, price-level queues, and fixed-point mathematical formulas were developed without referencing or copying any proprietary, decompiled, or confidential source code.
- **Zero Third-Party Codebases**: No code fragments, snippets, or design structures were copied from closed-source or non-permissive trading systems.
- **Permissive MIT Architecture**: All original code in this repository is released under the permissive MIT License with clean, unencumbered intellectual property title.
- **Sole Proprietor Ownership**: The sole proprietor developer holds 100% undivided legal ownership and copyright of the codebase, free of encumbrances, liens, or third-party claims.

---

## 2. Copyleft Firewall & License Verification

### 2.1 Copyleft Blacklist Guarantee
The repository strictly enforces a **Zero Copyleft Guarantee**. The following licenses are explicitly blacklisted and verified absent from both direct and transitive dependency trees:
- General Public License (GPL v1, GPL v2, GPL v3)
- Affero General Public License (AGPL v1, AGPL v3)
- Server Side Public License (SSPL)
- Lesser General Public License (LGPL)
- Common Development and Distribution License (CDDL)
- Creative Commons Non-Commercial (CC-BY-NC)

### 2.2 Permissive Dependency Software Bill of Materials (SBOM)

All runtime and test dependencies conform strictly to permissive Open Source Initiative (OSI) approved licenses (MIT, Apache 2.0, or 3-Clause BSD):

| Component / Package | Specified Version | Declared License | OSI Approved | Copyleft Status | Ingestion Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Python Standard Library** | $\ge$ 3.10 | PSF License | Yes | None / Permissive | Collections, heapq, hashlib, time, typing |
| **fastapi** | $\ge$ 0.115.0 | MIT | Yes | None / Permissive | Asynchronous OpenAPI 3.1 Gateway |
| **pydantic** | $\ge$ 2.8.0 | MIT | Yes | None / Permissive | Schema validation & serialization |
| **uvicorn[standard]** | $\ge$ 0.30.0 | BSD-3-Clause | Yes | None / Permissive | High-throughput ASGI server |
| **pytest** | $\ge$ 8.3.0 | MIT | Yes | None / Permissive | Test execution framework |
| **pytest-cov** | $\ge$ 5.0.0 | MIT | Yes | None / Permissive | Test coverage measurement |
| **httpx** | $\ge$ 0.27.0 | BSD-3-Clause | Yes | None / Permissive | Async integration test client |

---

## 3. NIST SP 800-218 SSDF v1.1 Attestation Checklist

The APEX-202 codebase has been verified against the National Institute of Standards and Technology (NIST) Special Publication 800-218 Secure Software Development Framework (SSDF) Version 1.1:

| SSDF Practice | SSDF Task ID | Implementation Summary | Audit Status |
| :--- | :--- | :--- | :--- |
| **Prepare the Organization (PO)** | PO.1.1, PO.1.2 | Security requirements, fixed-point boundaries, and input constraints formally documented in `ENGINE_SPEC.md`. | **VERIFIED** |
| **Protect the Software (PS)** | PS.1.1, PS.2.1 | SHA-256 cryptographic chaining protects execution log integrity; deterministic snapshot checksums prevent state tampering. | **VERIFIED** |
| **Protect the Software (PS)** | PS.3.1 | Zero non-permissive licenses; SBOM documented; unprivileged user execution configured in container build (`apexuser:10001`). | **VERIFIED** |
| **Produce Well-Secured Software (PW)** | PW.1.1, PW.1.2 | 64-bit integer microunit math prevents floating-point vulnerabilities; strict input bounds checking on prices and sizes. | **VERIFIED** |
| **Produce Well-Secured Software (PW)** | PW.4.1, PW.4.4 | Deterministic FIFO engine tested with comprehensive unit tests (`test_order_matching.py`) verifying edge cases and empty book behavior. | **VERIFIED** |
| **Respond to Vulnerabilities (RV)** | RV.1.1, RV.1.2 | Health monitoring endpoints (`/api/v1/health`) expose sequence counter state and internal heap metrics for continuous automated auditing. | **VERIFIED** |

---

## 4. IP Assignment Warranty

The transferring engineer warrants that:
1. **Title**: The seller is the absolute beneficial owner of all intellectual property rights in the repository with full authority to transfer.
2. **Non-Infringement**: To the best of the seller's knowledge, the repository does not infringe any third-party patent, copyright, trademark, or trade secret.
3. **Encumbrances**: The assets are transferred free of all liens, pledges, security interests, or restrictions.
4. **Clean Handoff**: The transfer conveys full rights to relicense, modify, commercialize, or incorporate the software into proprietary quantitative trading architectures.
