# Asset Transfer Specification & Clean Title Warranty
## Catalog Track 3: Enterprise Reference Core
## Asset Code: GF-T3-214: APEX-214 zk-SNARK Groth16 Verifier & Arithmetic Circuit State Engine
## Handoff Model: Complete Standalone Repository Assignment via Asset Purchase Agreement (APA)

---

## 1. Scope of Transferred Assets

Under the terms of a definitive Asset Purchase Agreement (APA), the acquiring entity receives 100% full legal title and perpetual unencumbered ownership of the following technical deliverables:

1. **Standalone Engine Core**:
   - `engine.py`: Standalone FastAPI backend with Groth16 bilinear pairing verification kernel, R1CS matrix solver, and witness synthesis routines.
   - Zero external SaaS runtime requirements; operates air-gapped on bare metal, self-hosted Kubernetes, or Google Cloud Run.

2. **Automated Cryptographic Verification Suite**:
   - `test_zk_engine.py`: Comprehensive test harness verifying mathematical completeness, computational soundness, zero-knowledge leakage resistance, and O(1) latency invariance.

3. **Turnkey Deployment Container**:
   - `Dockerfile`: Multi-stage, non-root Linux container specification with dynamic unprivileged port binding.

4. **Institutional Verification Mission-Control Terminal**:
   - React 19 + TypeScript frontend mission-control terminal with real-time pairing equations, R1CS constraint matrix visualizer, interactive witness solver, and live soundness attack matrix simulator.

5. **Formal Documentation Suite**:
   - `ENGINE_SPEC.md`: Full mathematical reduction, OpenAPI 3.1 schema contracts, and benchmarking records.
   - `LEGAL_IP_AUDIT.md`: Clean-room provenance certification, software bill of materials (SBOM), and NIST SP 800-218 SSDF v1.1 compliance checklist.

---

## 2. Clean Title & Non-Infringement Warranty

1. **Sole Author Provenance**:
   - The developer warrants that they are the sole author, developer, and legal owner of all proprietary code contained in this repository.
   - No portion of the source code was created using employer equipment, university funding, or proprietary trade secrets.

2. **Absence of Liens and Encumbrances**:
   - The repository and its intellectual property are transferred free and clear of all liens, mortgages, security interests, pledges, charges, or encumbrances of any nature.

3. **Non-Copyleft Warranty**:
   - The developer warrants that no software subject to the GNU General Public License (GPL), Affero GPL (AGPL), Server Side Public License (SSPL), or any other copyleft license has been incorporated or linked in a manner that requires disclosure or licensing of the proprietary core.

---

## 3. Disclaimers & Post-Transfer Operating Model

1. **Zero-SaaS Operating Guarantee**:
   - This asset is delivered as a turnkey, self-contained software repository.
   - Transfer is strictly execution-complete and self-hosted. There are no ongoing cloud telemetry dependencies, remote license server heartbeats, or external API requirements.

2. **No SaaS Support SLA**:
   - The transfer is structured as an outright asset sale. Following repository handoff and verification key transfer, the seller provides no ongoing operational maintenance, technical support, or managed service-level agreements (SLAs).
   - The acquiring entity assumes full operational custody, deployment authority, and cryptographic key management.

3. **Commercial Asset Transfer Specification Alignment**:
   - All legal provisions, representations, and warranties shall be governed under standard commercial asset transfer principles as formalized in the definitive Asset Purchase Agreement executed by the authorized principals.
