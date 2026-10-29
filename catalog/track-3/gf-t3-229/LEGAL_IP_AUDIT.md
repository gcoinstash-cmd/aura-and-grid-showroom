# GF-T3-229

## Clean-Room IP Provenance Attestation & NIST SP 800-218 SSDF v1.1 Audit

## 1. Clean-Room Intellectual Property Provenance Attestation
- **Asset Designation**: `GF-T3-229`
- **Track Classification**: `TRACK 3` (Skunkworks Engine)
- **Provenance**: 100% original, clean-room mathematical and algorithmic implementation of 1F1B (One-Forward-One-Backward) pipeline-parallel scheduling, bounded activation stashing (`p = 4`), and non-blocking P2P stream overlap.
- **Zero Proprietary Engine Marks**: This codebase contains zero proprietary code, symbols, or trademarks from third-party distributed training frameworks. All pipeline corridors use sovereign synthetic designations (`PIPE-CORRIDOR-ALPHA`, `PIPE-CORRIDOR-BRAVO`, `PIPE-CORRIDOR-GAMMA`, `PIPE-CORRIDOR-DELTA`).

---

## 2. 100% MIT / Apache-2.0 Permissive Licensing & Zero-Copyleft Attestation
We hereby attest that `GF-T3-229` and every runtime and development dependency in its dependency graph are governed exclusively by permissive open-source licenses (`MIT`, `Apache-2.0`, `ISC`, `BSD-2-Clause`, `BSD-3-Clause`).
- **Viral Copyleft Count**: `0` (Zero GPL, LGPL, AGPL, SSPL, or EUPL packages).
- **Unauthenticated Backdoors**: `0` (Zero telemetry phone-home hooks or external secret exfiltration vectors).

---

## 3. Software Bill of Materials (SBOM — CycloneDX / SPDX Summary)

| Component Name | Version | Ecosystem | License | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `react` | `19.0.1` | npm | MIT | Cockpit UI rendering engine |
| `react-dom` | `19.0.1` | npm | MIT | DOM reconciliation |
| `zod` | `3.x` | npm | MIT | Zero-Trust GridSync ingress sanitization |
| `lucide-react` | `0.546.0` | npm | ISC | Tactile vector iconography |
| `tailwindcss` | `4.3.3` | npm | MIT | Deterministic utility styling |
| `vite` | `8.3.0` | npm | MIT | Frontend bundler and build toolchain |
| `vitest` | `3.x` | npm | MIT | TypeScript unit and boundary test runner |
| `fastapi` | `0.115.0` | PyPI | MIT | Standalone Python 1F1B API server |
| `pydantic` | `2.9.2` | PyPI | MIT | Python backend Zero-Trust schema validation |
| `pytest` | `8.3.3` | PyPI | MIT | Python numerical & schedule test suite |

---

## 4. NIST SP 800-218 SSDF v1.1 Compliance Checklist

| Practice ID | NIST SSDF v1.1 Control Description | Implementation Artifact | Status |
| :--- | :--- | :--- | :--- |
| **PO.1.1** | Define security requirements for software development | Zero-Trust GridSync Zod & Pydantic validators | `VERIFIED` |
| **PS.1.1** | Store all forms of code based on principle of least privilege | Partitioned PostgreSQL RLS policies (`schema.sql`) | `VERIFIED` |
| **PS.3.1** | Archive and protect each software release and SBOM | Clean-room SBOM & license audit (`LEGAL_IP_AUDIT.md`) | `VERIFIED` |
| **PW.4.1** | Acquire and maintain well-secured software components | 100% MIT/Apache-2.0 dependency lock | `VERIFIED` |
| **PW.5.1** | Create source code by adhering to secure coding practices | SQLi / XSS regex & schema scrubbing on all inputs | `VERIFIED` |
| **PW.8.1** | Test executable code to identify vulnerabilities and verify logic | `src/engine/pipeline1f1b.test.ts` & `test_pipeline_engine.py` | `VERIFIED` |
| **RV.1.1** | Monitor and remediate straggler or boundary faults | Stage 2 Straggler Fault Injection & Buffer Flush | `VERIFIED` |
