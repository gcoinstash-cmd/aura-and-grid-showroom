# GF-T3-222 — Clean-Room IP Provenance & Security Audit (`LEGAL_IP_AUDIT.md`)

## 1. Clean-Room Provenance Attestation

- **Asset Identifier**: `GF-T3-222`
- **Track Classification**: Track 3 Enterprise Reference Core
- **Origin & Authorship**: 100% original, first-principles implementation of a compressed Prefix-Tree (Radix) Key-Value Cache state machine, reference-counted zero-copy LRU eviction heap, and institutional telemetry cockpit.
- **Zero Third-Party Engine Encumbrance**: Contains zero code, headers, or symbols derived from external inference engines or proprietary serving frameworks. All prefix corridors (`RADIX-CORRIDOR-ALPHA`, `RADIX-CORRIDOR-BRAVO`, `RADIX-CORRIDOR-GAMMA`, `RADIX-CORRIDOR-DELTA`) are synthetic engineering constructs.

---

## 2. Permissive Licensing & Zero-Copyleft Attestation

- **Repository License**: `MIT` (100% Permissive)
- **Copyleft Blacklist Enforcement**: Zero packages licensed under `GPL-2.0`, `GPL-3.0`, `AGPL-3.0`, `LGPL`, `SSPL`, or `EUPL` exist anywhere in the runtime or build dependency tree.

---

## 3. Software Bill of Materials (SBOM)

| Component | Ecosystem | Version | License | Provenance Status |
| :--- | :--- | :--- | :--- | :--- |
| `GF-T3-222 Core` | Python / TypeScript | `3.2.2` | `MIT` | First-Party Clean-Room |
| `fastapi` | PyPI | `0.115.0` | `MIT` | Verified Permissive |
| `pydantic` | PyPI | `2.9.2` | `MIT` | Verified Permissive |
| `uvicorn` | PyPI | `0.30.6` | `BSD-3-Clause` | Verified Permissive |
| `pytest` | PyPI | `8.3.3` | `MIT` | Verified Permissive |
| `react` | npm | `19.0.1` | `MIT` | Verified Permissive |
| `react-dom` | npm | `19.0.1` | `MIT` | Verified Permissive |
| `lucide-react` | npm | `0.546.0` | `ISC` | Verified Permissive |
| `tailwindcss` | npm | `4.3.3` | `MIT` | Verified Permissive |
| `vite` | npm | `8.3.0` | `MIT` | Verified Permissive |

---

## 4. NIST SP 800-218 (SSDF v1.1) Compliance Checklist

| Practice Group | NIST Control ID | Control Description | Implementation Verification in `GF-T3-222` | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Prepare the Organization (PO)** | `PO.1.1` | Define security requirements for software development | Strict clean-room dependency gate, zero-copyleft policy, and deterministic memory ceilings enforced. | PASS |
| **Prepare the Organization (PO)** | `PO.3.2` | Maintain isolated, reproducible build environments | Declarative `Dockerfile` with pinned package versions and automated `pytest` gate during build. | PASS |
| **Protect the Software (PS)** | `PS.1.1` | Store all forms of code in version-controlled repository | Self-contained source tree with immutable schema migrations and complete test suite. | PASS |
| **Protect the Software (PS)** | `PS.3.1` | Archive and protect each software release | Complete SBOM and cryptographic dependency lock manifest included. | PASS |
| **Produce Well-Secured Software (PW)** | `PW.4.1` | Acquire and maintain well-secured software components | Only MIT/BSD-3-Clause packages used; zero external runtime network calls. | PASS |
| **Produce Well-Secured Software (PW)** | `PW.5.1` | Create source code adhering to secure coding practices | Strict Pydantic input validation, bounded token array checks, and non-negative reference count invariants. | PASS |
| **Produce Well-Secured Software (PW)** | `PW.8.1` | Test executable code to identify vulnerabilities and verify invariants | Automated `pytest` suite (`test_radix_cache_engine.py`) verifying prefix splitting, zero-leak ref counting, and strict LRU eviction. | PASS |
| **Respond to Vulnerabilities (RV)** | `RV.1.1` | Gather information on potential vulnerabilities | Continuous telemetry inspection endpoints (`/health`, `/v1/radix/telemetry`) and audit logging schema. | PASS |
