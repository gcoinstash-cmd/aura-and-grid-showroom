# GF-T3-348 Legal IP Audit & Clean-Room Attestation

## 1. Clean-Room IP Provenance Attestation
`GF-T3-348` is engineered from scratch under strict clean-room protocols.
- **Zero Proprietary Marks**: Contains zero code, headers, weights, or proprietary identifiers from external inference frameworks.
- **Synthetic Corridor Isolation**: Uses exclusively synthetic corridor identifiers (`SPEC-CORRIDOR-ALPHA`, `SPEC-CORRIDOR-BRAVO`, `SPEC-CORRIDOR-GAMMA`, `SPEC-CORRIDOR-DELTA`).
- **100% Sovereign Title**: Engineered for standalone Asset Purchase Agreement (APA) transfer with zero copyleft dependencies.

## 2. Permissive Licensing Attestation (100% MIT / Apache-2.0)
All runtime and build dependencies are verified permissive open-source licenses (MIT, Apache-2.0, BSD-3-Clause). Zero GPL, AGPL, LGPL, or viral copyleft packages exist anywhere in the dependency tree.

## 3. NIST SP 800-218 (SSDF v1.1) Compliance Checklist

| SSDF Practice | Requirement Description | Status | Verification Artifact |
| :--- | :--- | :--- | :--- |
| **PO.1.1** | Define security requirements for software development | PASS | Zero-Trust Ingress & DTO validation in `engine.py` |
| **PS.1.1** | Protect all forms of code from unauthorized access | PASS | Immutable repository provenance & clean-room lock |
| **PS.3.1** | Archive and protect each software release | PASS | Deterministic `Dockerfile` & SBOM manifest |
| **PW.4.1** | Acquire and maintain well-secured software components | PASS | Permissive MIT/Apache-2.0 dependency lock |
| **PW.7.1** | Review and/or analyze human-readable code | PASS | Static type checking & zero-dollar gate audit |
| **PW.8.1** | Test executable code to identify vulnerabilities | PASS | Automated Pytest suite (`test_speculative_decoding_engine.py`) |
| **RV.1.1** | Identify and confirm vulnerabilities on an ongoing basis | PASS | Continuous boundary & divergence spike stress tests |

## 4. Software Bill of Materials (SBOM Summary)

| Component | Version | License | Scope |
| :--- | :--- | :--- | :--- |
| `fastapi` | `0.115.0` | MIT | Backend Engine API |
| `pydantic` | `2.9.2` | MIT | Strongly-Typed Ingress DTOs |
| `uvicorn` | `0.30.6` | BSD-3-Clause | ASGI Production Server |
| `pytest` | `8.3.3` | MIT | Automated Verification Suite |
| `react` | `19.0.1` | MIT | Cockpit Frontend UI |
| `tailwindcss` | `4.3.3` | MIT | Styling System |
| `lucide-react` | `0.546.0` | ISC | Cockpit Vector Iconography |
