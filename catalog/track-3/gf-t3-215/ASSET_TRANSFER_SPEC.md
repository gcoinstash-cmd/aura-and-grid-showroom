# ASSET_TRANSFER_SPEC.md: GF-T3-215 Standalone Asset Transfer Specification

## 1. Scope of Asset Purchase & Repositories

This technical transfer specification governs the complete, clean-room handoff of the **APEX-215 Vector Embedding Quantization & HNSW Graph Index Engine** (Catalog Track 3: Enterprise Reference Core) from sole proprietor developer to acquiring entity under a standard commercial Asset Purchase Agreement (APA).

### 1.1 In-Scope Deliverables
1. **Full Source Code Tree**:
   - `engine.py`: Standalone FastAPI vector index service, HNSW multi-layer graph engine, Product Quantizer codebooks, and Asymmetric Distance Computation (ADC) matrix.
   - `test_vector_engine.py`: Automated Pytest verification suite covering recall, compression, O(log N) complexity, and determinism.
   - `Dockerfile`: Multi-stage, unprivileged non-root container profile designed for container engines and cloud orchestration.
   - Institutional Vector Index Terminal: High-density React/TypeScript cockpit for graph inspection, ADC table exploration, and recall benchmarking.
2. **Technical & Legal Specifications**:
   - `ENGINE_SPEC.md`: Architectural topology, mathematical derivations, PostgreSQL/AlloyDB DDL schema, OpenAPI 3.1 contracts.
   - `LEGAL_IP_AUDIT.md`: Clean-room attestation, MIT permissive license verification, NIST SP 800-218 SSDF v1.1 checklist.
   - `ASSET_TRANSFER_SPEC.md`: Complete title handoff protocol.

---

## 2. Direct Repository Transfer Protocol

The transfer is structured strictly as an outright intellectual property asset assignment:
- **Zero-SaaS Disclaimer**: The asset is delivered as standalone, unencumbered source code. It includes zero software-as-a-service (SaaS) obligations, zero monthly recurring fees, zero per-seat licensing, zero per-node taxes, and zero uptime SLA commitments.
- **Repository Handoff**: Clean Git repository transfer containing complete commit history, verified clean-room provenance, and zero external vendor registry ties.
- **Clean Title Warranty**: The developer warrants full sole ownership, free and clear of all liens, encumbrances, security interests, or third-party claims.

---

## 3. Turnkey Container Deployment Checklist

1. Clone or extract the repository into the deployment environment:
   ```bash
   git clone <transferred_repository_uri>
   cd apex-215-vector-engine
   ```

2. Build and verify the container:
   ```bash
   docker build -t apex-215-vector-engine:latest .
   ```

3. Execute verification suite inside container:
   ```bash
   docker run --rm apex-215-vector-engine:latest pytest -v test_vector_engine.py
   ```

4. Launch production service on specified port:
   ```bash
   docker run -d -p 8080:8080 --name apex215 apex-215-vector-engine:latest
   ```

5. Confirm nominal health probe:
   ```bash
   curl -s http://localhost:8080/api/v1/health
   ```
