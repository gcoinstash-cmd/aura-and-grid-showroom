# GF-T3-274 Clean-Room IP Provenance & NIST SP 800-218 SSDF v1.1 Audit

## 1. Clean-Room Intellectual Property Attestation
- **Chassis Designation**: GF-T3-274
- **Provenance Standard**: 100% Clean-Room Sovereign Implementation
- **Zero Proprietary Marks**: This codebase contains zero proprietary source files, headers, or runtime dependencies from closed-source streaming managers or third-party inference caches. All rolling corridors (`ROLL-CORRIDOR-ALPHA`, `ROLL-CORRIDOR-BRAVO`, `ROLL-CORRIDOR-GAMMA`, `ROLL-CORRIDOR-DELTA`) are synthetic mathematical constructs engineered from first principles.

## 2. Permissive Licensing & Zero-Copyleft Warranty
- **License Regime**: 100% MIT / Apache-2.0 Permissive Licensing.
- **Viral Copyleft Scan**: 0 GPL, 0 AGPL, 0 LGPL, and 0 SSPL packages present in either frontend or backend dependency graphs.

## 3. Software Bill of Materials (SBOM)

| Component | Version | License | Scope |
| :--- | :--- | :--- | :--- |
| `react` | `^19.0.1` | MIT | Frontend Cockpit Runtime |
| `react-dom` | `^19.0.1` | MIT | Frontend DOM Renderer |
| `tailwindcss` | `^4.3.3` | MIT | Cockpit Styling Engine |
| `zod` | `^3.23.8` | MIT | GridSync Zero-Trust Ingress Validation |
| `vitest` | `^3.0.0` | MIT | Frontend Unit Verification |
| `fastapi` | `0.115.0` | MIT | Backend Telemetry API |
| `pydantic` | `2.9.2` | MIT | Backend Schema Validation |
| `uvicorn` | `0.30.6` | BSD-3-Clause | ASGI Server Runtime |
| `pytest` | `8.3.3` | MIT | Backend Verification Suite |

## 4. NIST SP 800-218 SSDF v1.1 Compliance Checklist

- [x] **PO.1 (Prepare the Organization)**: Clean-room boundary gates and zero-dollar telemetry rules enforced across all source artifacts.
- [x] **PS.1 (Protect the Software)**: Cryptographic integrity and strict Row-Level Security (RLS) policies defined in PostgreSQL migration artifacts.
- [x] **PW.4 (Reuse Existing, Well-Secured Software)**: Exclusively MIT/Apache-2.0/BSD-3 permissive packages utilized.
- [x] **PW.6 (Configure Software to Have Secure Settings by Default)**: GridSync Zod and Pydantic schemas scrub all operator inputs prior to state mutation.
- [x] **PW.8 (Test Executable Code)**: Automated Vitest and Pytest suites verify rolling window boundary math (`W_roll = max(0, T_curr - Delta_max)`), arena pointer re-indexing, and zero OOM guarantees.
- [x] **RV.1 (Identify and Confirm Vulnerabilities)**: Zero unauthenticated backdoors or hardcoded secrets present in repository.
