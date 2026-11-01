# GF-T3-352 Clean-Room IP Provenance & NIST SP 800-218 SSDF v1.1 Audit

## 1. Clean-Room Provenance Attestation
- **Unit Identifier**: GF-T3-352
- **License Standard**: 100% Permissive MIT License
- **Zero Copyleft Verification**: Zero GPL, zero AGPL, zero LGPL, and zero viral dependencies.
- **Proprietary Mark Scrubbing**: All third-party proprietary quantization marks have been excluded in favor of synthetic clean-room corridors (`FP4-CORRIDOR-ALPHA`, `FP4-CORRIDOR-BRAVO`, `FP4-CORRIDOR-GAMMA`, `FP4-CORRIDOR-DELTA`).

## 2. NIST SP 800-218 Secure Software Development Framework (SSDF v1.1) Checklist
| Practice ID | Control Objective | Implementation Status |
| :--- | :--- | :--- |
| **PO.1.1** | Define security requirements for software development | PASS · Zero-trust Pydantic DTO validation & strict bounds checking |
| **PS.1.1** | Protect all forms of code from unauthorized access | PASS · Immutable container build with deterministic dependencies |
| **PW.4.1** | Acquire and maintain well-secured software components | PASS · Clean-room MIT/Apache-2.0 SBOM verified |
| **PW.7.1** | Review and analyze human-readable code | PASS · Static type checking and zero-dollar gate verified |
| **PW.8.1** | Test executable code to identify vulnerabilities | PASS · Automated pytest suite (>85% coverage) executed in build pipeline |
| **RV.1.1** | Identify and confirm vulnerabilities on an ongoing basis | PASS · Zero external runtime network calls in quantization core |

## 3. Software Bill of Materials (SBOM)
| Component | Version | License | Purpose |
| :--- | :--- | :--- | :--- |
| `python` | 3.11 | PSF-2.0 | Backend execution runtime |
| `fastapi` | 0.115.0 | MIT | REST API transport layer |
| `pydantic` | 2.9.2 | MIT | Zero-trust ingress schema validation |
| `uvicorn` | 0.30.6 | BSD-3-Clause | ASGI server |
| `pytest` | 8.3.3 | MIT | Automated verification test runner |
| `react` | 19.0.1 | MIT | Frontend cockpit renderer |
| `tailwindcss` | 4.3.3 | MIT | Styling engine |
| `lucide-react` | 0.546.0 | ISC | Cockpit iconography |
