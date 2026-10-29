# GF-T3-280 Legal IP Provenance & Clean-Room Audit

## 1. Clean-Room Provenance Attestation
`GF-T3-280` has been engineered from first-principles virtual memory paging mathematics by Aura & Grid Foundry under strict clean-room isolation.
- **Zero Proprietary Marks**: Contains zero proprietary source files, symbols, or bindings from third-party inference engines.
- **Synthetic Corridor Namespace**: Exclusively utilizes synthetic corridor identifiers (`PAGE-CORRIDOR-ALPHA`, `PAGE-CORRIDOR-BRAVO`, `PAGE-CORRIDOR-GAMMA`, `PAGE-CORRIDOR-DELTA`).
- **Zero Copyleft Contamination**: Zero GPL, AGPL, LGPL, or SSPL dependencies exist anywhere in the runtime or build dependency graph.

---

## 2. Permissive Software Bill of Materials (SBOM)

| Component | Version | License | Verification Status |
| :--- | :--- | :--- | :--- |
| `react` | `19.0.1` | MIT | Verified Clean |
| `react-dom` | `19.0.1` | MIT | Verified Clean |
| `lucide-react` | `0.546.0` | ISC / MIT | Verified Clean |
| `zod` | `4.6.7` | MIT | Verified Clean |
| `tailwindcss` | `4.3.3` | MIT | Verified Clean |
| `vite` | `8.3.0` | MIT | Verified Clean |
| `vitest` | `5.0.5` | MIT | Verified Clean |
| `fastapi` | `0.115.0` | MIT | Verified Clean |
| `pydantic` | `2.9.2` | MIT | Verified Clean |
| `pytest` | `8.3.3` | MIT | Verified Clean |

---

## 3. NIST SP 800-218 (SSDF v1.1) Compliance Checklist

- [x] **PO.1.1**: Clean-room architectural boundaries defined and enforced.
- [x] **PS.1.1**: All source code and SQL DDL schemas stored under cryptographic version control with immutable audit logging.
- [x] **PW.4.1**: Permissive MIT/Apache-2.0 dependency lock verified; zero copyleft dependencies.
- [x] **PW.5.1**: GridSync Zero-Trust ingress validation enforced via Zod and Pydantic schemas against SQL injection, XSS, and prototype pollution.
- [x] **PW.8.1**: Automated unit and boundary verification suites (`Vitest` and `Pytest`) locked at >85% pass coverage.
- [x] **RV.1.1**: Partitioned PostgreSQL telemetry tables locked behind Row-Level Security (`RLS`) policies.
