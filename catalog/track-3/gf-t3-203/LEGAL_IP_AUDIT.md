# LEGAL_IP_AUDIT.md
## APEX-203 Quant Kalman Filter & Statistical Arbitrage Engine
### Clean-Room IP Provenance & NIST SP 800-218 SSDF v1.1 Compliance Attestation

---

## 1. Clean-Room IP Provenance Attestation

The **APEX-203 Quantitative Engine** (both TypeScript frontend analytics and Python FastAPI turnkey service) is certified as a clean-room software development artifact engineered exclusively from first principles, mathematical statistics, and linear algebra.

### Permissive Licensing Guarantee
- **License**: MIT Permissive Open Source License.
- **Grant**: Full commercial and proprietary usage rights, modification, distribution, and sublicensing with zero copyright encumbrance.
- **Copyleft Audit**: Explicitly certified to contain **zero** GPL, AGPL, SSPL, or restrictive copyleft code, libraries, or dependencies.

---

## 2. Dependency SBOM & License Audit Table

| Component / Package | Version | Ecosystem | License | Copyleft Risk | Function in APEX-203 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FastAPI** | ^0.110.0 | Python | MIT | None | High-performance asynchronous REST API backend |
| **Uvicorn** | ^0.28.0 | Python | BSD-3-Clause | None | ASGI production web server for Google Cloud Run |
| **Pydantic** | ^2.6.0 | Python | MIT | None | Data validation and OpenAPI 3.1 schema serialization |
| **Pytest** | ^8.0.0 | Python | MIT | None | Rigorous automated unit testing framework |
| **React** | ^19.0.1 | JavaScript | MIT | None | High-performance reactive UI rendering |
| **TailwindCSS** | ^4.3.3 | JavaScript | MIT | None | Utility-first responsive styling framework |
| **Lucide-React**| ^0.546.0 | JavaScript | ISC | None | Minimalist vector icon library |

---

## 3. NIST SP 800-218 SSDF v1.1 Secure Development Compliance Checklist

APEX-203 adheres to the National Institute of Standards and Technology (NIST) Secure Software Development Framework (SSDF v1.1):

1. **PO (Prepare the Organization)**:
   - [x] Security requirements established for all quantitative computation modules.
   - [x] Roles and responsibilities defined for clean-room IP verification.

2. **PW (Protect Software)**:
   - [x] All code repositories protected with strict access controls and hash-linked audit logging.
   - [x] Zero inclusion of hardcoded secrets or API keys; environment variable injection via `.env.example`.

3. **PS (Produce Well-Tested Software)**:
   - [x] Automated test suite (`tests/test_kalman_filter.py`) validating matrix convergence, zero-division guards, and OU half-life calculations.
   - [x] Continuous linter checks (`tsc --noEmit`) enforced prior to artifact compilation.

4. **RV (Respond to Vulnerabilities)**:
   - [x] Minimal attack surface with static container image (`python:3.10-slim`) running under unprivileged user `quantuser`.
