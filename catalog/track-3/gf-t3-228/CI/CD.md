# GF-T3-228 Air-Gapped CI/CD Pipeline Specification

## 1. Hermetic Build & Verification Pipeline
The `GF-T3-228` continuous integration pipeline runs inside an isolated, network-restricted runner to guarantee deterministic builds and zero external supply-chain leakage.

### Pipeline Stages
1. **Static Type & Lint Gate**:
   - Executes `npm run lint` (`tsc --noEmit`) to verify strict TypeScript type safety.
2. **Zero-Dollar & Clean-Room IP Gate**:
   - Scans source files to ensure zero proprietary engine marks and zero forbidden currency symbols exist in telemetry strings.
3. **Vitest Frontend & Mathematical Kernel Gate**:
   - Executes `npx vitest run` to verify causal tree mask construction, parallel vs. serial numerical equivalence, dynamic confidence pruning, and GridSync Zod sanitization.
4. **Pytest Backend Verification Gate**:
   - Executes `pytest test_spec_tree_engine.py` to validate the FastAPI speculative tree engine (`engine.py`).
5. **OCI Container Build Gate**:
   - Builds `/Dockerfile` and seals the immutable container digest.
