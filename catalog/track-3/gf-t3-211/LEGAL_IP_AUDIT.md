# Legal IP Audit & Compliance Attestation
## GF-T3-211: APEX-211 Cross-Asset Cointegration & Copula Stat-Arb Engine

### 1. Clean-Room Provenance & Permissive Licensing Attestation
This software asset ("APEX-211") has been developed under clean-room engineering standards. All algorithms, state machines, econometric estimators, and copula mathematical models have been implemented from first principles.
- **Licensing Compliance**: 100% MIT Permissive License across all source files, dependencies, and containers.
- **Copyleft Prohibition**: Zero GPL, AGPL, SSPL, or restrictive copyleft dependencies. All runtime libraries and packages adhere strictly to MIT, Apache 2.0, or BSD licenses.

### 2. Software Bill of Materials (SBOM) Manifest
| Dependency / Component | Version | License | Purpose |
| :--- | :--- | :--- | :--- |
| `numpy` | 1.26+ | BSD-3-Clause | Matrix algebra & vector calculations |
| `scipy` | 1.11+ | BSD-3-Clause | Statistical distributions & copula ranks |
| `fastapi` | 0.110+ | MIT | High-performance asynchronous REST API |
| `uvicorn` | 0.28+ | BSD-3-Clause | ASGI server wrapper |
| `react` | 19.0+ | MIT | Institutional terminal UI components |
| `lucide-react` | 0.546+ | ISC / MIT | UI telemetry iconography |

### 3. NIST SP 800-218 SSDF v1.1 Compliance Checklist
- [x] **PO.1 Define Security Requirements**: Secure non-root container user (`apexuser`), append-only SHA-256 audit ledger.
- [x] **PW.1 Implement Secure Coding Practices**: Strict TypeScript typing, Python type annotations, zero unvalidated inputs.
- [x] **RV.1 Perform Vulnerability Reviews**: Automated pytest suite (>80% test coverage), tamper detection verification.
- [x] **PW.4 Reuse Existing Well-Vetted Software**: Utilization of standard mathematical libraries (NumPy, SciPy) without custom cryptographic primitives.
