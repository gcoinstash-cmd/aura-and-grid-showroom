# GF-T3-223 — Clean-Room IP Provenance & NIST SSDF v1.1 Audit

**Asset Identifier:** `GF-T3-223`  
**Track Classification:** `TRACK 3 — ENTERPRISE REFERENCE CORE`  
**License Regime:** 100% Permissive (MIT / BSD-3-Clause / Apache-2.0) — Zero Copyleft  

---

## 1. Clean-Room Intellectual Property Attestation

1. **Zero Proprietary Marks or Third-Party Engine Dependencies:**  
   `GF-T3-223` is implemented from first-principles probability theory (lossless rejection sampling over discrete categorical distributions and dynamic horizon control). It contains zero source code, weights, headers, or trademark references from external inference frameworks.
2. **Synthetic Speculative Corridors:**  
   All runtime topology profiles (`SPEC-CORRIDOR-ALPHA`, `SPEC-CORRIDOR-BRAVO`, `SPEC-CORRIDOR-GAMMA`, `SPEC-CORRIDOR-DELTA`) are original clean-room engineering constructs designed for deterministic benchmarking and institutional verification.
3. **Zero Copyleft Contamination:**  
   No GPL, AGPL, LGPL, SSPL, or Commons Clause code is linked, bundled, or referenced anywhere in the repository.

---

## 2. Software Bill of Materials (SBOM) & License Manifest

| Component | Version | SPDX License | Clean-Room Status |
| :--- | :--- | :--- | :--- |
| `engine.py` | `3.2.0` | MIT | First-Party Clean-Room Core |
| `test_speculative_engine.py` | `3.2.0` | MIT | First-Party Verification Suite |
| `src/App.tsx` | `3.2.0` | Apache-2.0 / MIT | First-Party Verification Cockpit |
| `fastapi` | `0.115.0` | MIT | Whitelisted Permissive |
| `pydantic` | `2.9.2` | MIT | Whitelisted Permissive |
| `uvicorn` | `0.30.6` | BSD-3-Clause | Whitelisted Permissive |
| `pytest` | `8.3.3` | MIT | Whitelisted Permissive |
| `react` / `react-dom` | `19.0.1` | MIT | Whitelisted Permissive |
| `lucide-react` | `0.546.0` | ISC | Whitelisted Permissive |

---

## 3. NIST SP 800-218 SSDF v1.1 Compliance Checklist

| Practice ID | NIST SSDF v1.1 Control Objective | Implementation Evidence in `GF-T3-223` | Status |
| :--- | :--- | :--- | :--- |
| **PO.1.1** | Define security requirements for software development | Enforced deterministic bounds on `k_window in [2, 8]` and normalized distribution simplex checks | VERIFIED |
| **PS.1.1** | Protect all forms of code from unauthorized access and tampering | Self-contained immutable Docker build with pinned package versions | VERIFIED |
| **PS.3.2** | Maintain software provenance and SBOM records | Complete SPDX dependency whitelist documented in `ENGINE_SPEC.md` and `LEGAL_IP_AUDIT.md` | VERIFIED |
| **PW.4.1** | Acquire and maintain well-secured software components | 100% MIT/BSD/Apache-2.0 dependency tree; zero copyleft or unmaintained transitive dependencies | VERIFIED |
| **PW.7.2** | Perform automated code review and static analysis | Strict TypeScript compiler checks (`tsc --noEmit`) and Python type annotations | VERIFIED |
| **PW.8.1** | Test executable code to identify vulnerabilities and verify invariants | Automated `pytest` suite (`test_speculative_engine.py`) executed during container build | VERIFIED |
| **RV.1.1** | Monitor and resolve residual distribution anomalies | Positive residual clamp `max(0, P_target - P_draft)` prevents negative probability underflow | VERIFIED |
