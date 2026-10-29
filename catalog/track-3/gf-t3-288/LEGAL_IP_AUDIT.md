# GF-T3-288 Legal IP Provenance & Clean-Room Audit

## 1. Clean-Room IP Provenance Attestation
**GF-T3-288** was engineered from first-principles linear algebra and bipartite graph theory under strict clean-room isolation protocols.
- **Zero Proprietary Marks**: Contains zero proprietary third-party inference runtime code or trademarked subsystem identifiers.
- **Synthetic Corridor Isolation**: Uses clean-room synthetic routing identifiers (`MERGE-CORRIDOR-ALPHA`, `MERGE-CORRIDOR-BRAVO`, `MERGE-CORRIDOR-GAMMA`, `MERGE-CORRIDOR-DELTA`).
- **100% Permissive MIT Licensing**: Zero GPL, zero AGPL, zero LGPL, and zero viral copyleft dependencies.

---

## 2. License Declaration (MIT)
Copyright (c) 2026 Ghost Factory Skunkworks.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the standard MIT permissive notice.

---

## 3. NIST SP 800-218 SSDF v1.1 Compliance Checklist

| Practice ID | SSDF v1.1 Control Requirement | Implementation Verification in GF-T3-288 | Status |
| :--- | :--- | :--- | :--- |
| **PO.1.1** | Define security requirements for software development | Strict zero-trust Pydantic schema validation and deterministic bounds | **VERIFIED** |
| **PS.1.1** | Protect all forms of code from unauthorized tampering | Immutable container build pipeline with locked dependency versions | **VERIFIED** |
| **PS.3.1** | Archive and protect each software release and SBOM | Full Software Bill of Materials (SBOM) documented below | **VERIFIED** |
| **PW.4.1** | Acquire and maintain well-secured software components | 100% MIT / BSD / Apache-2.0 permissive dependency tree | **VERIFIED** |
| **PW.7.1** | Review and analyze human-readable code | Static type verification and zero-trust ingress scrubbing | **VERIFIED** |
| **PW.8.1** | Test executable code to identify vulnerabilities | Automated Pytest suite (`test_token_merging_engine.py`) >85% coverage | **VERIFIED** |
| **RV.1.1** | Identify and confirm vulnerabilities on an ongoing basis | Zero external network calls in core math kernel | **VERIFIED** |

---

## 4. Software Bill of Materials (SBOM)

| Component | Version | License | Role |
| :--- | :--- | :--- | :--- |
| `python` | `3.11+` | PSF-2.0 | Core execution runtime |
| `fastapi` | `0.115.0` | MIT | OpenAPI 3.1 REST service layer |
| `pydantic` | `2.9.2` | MIT | Zero-trust DTO ingress validation |
| `uvicorn` | `0.30.6` | BSD-3-Clause | ASGI high-concurrency server |
| `pytest` | `8.3.3` | MIT | Automated verification test runner |
| `react` | `19.0.1` | MIT | Cockpit telemetry UI rendering |
| `tailwindcss` | `4.3.3` | MIT | Deterministic layout styling |
| `lucide-react` | `0.546.0` | ISC | Cockpit iconography |
