# GF-T3-228 Security Policy & Threat Modeling Protocols

## 1. Secure Boot Signature & Container Integrity
- All OCI container images built from `/Dockerfile` must be signed using Cosign / Sigstore prior to admission into production Kubernetes or Cloud Run clusters.
- The container build pipeline executes `pytest test_spec_tree_engine.py` at build time; any numerical drift in tree-attention verification aborts image creation.

## 2. GridSync Zero-Trust Ingress & Threat Modeling
| Threat Vector | Mitigation Mechanism | Verification Gate |
| :--- | :--- | :--- |
| **SQL Injection / Command Injection** | Strict Zod & Pydantic field validators blocking `;`, `--`, `/*`, `DROP`, `SELECT`, `INSERT`, `DELETE` | Tested in `test_spec_tree_engine.py` & `specTreeEngine.test.ts` |
| **Cross-Site Scripting (XSS)** | Rejects `<script` and HTML control sequences at ingress | GridSync Sanitizer Gate |
| **Cross-Branch Attention Leakage** | Strictly lower-triangular ancestor mask (`M[i, j] = 0` for non-ancestors) | Verified by causal ancestry invariant test |
| **Multi-Tenant Data Exposure** | PostgreSQL Row-Level Security (`tenant_id = auth.uid()`) | Enforced in `supabase_schema.sql` |

## 3. Encryption & Audit Logging Configurations
- **In-Transit Encryption**: TLS 1.3 strict enforcement on all API and database connections.
- **At-Rest Encryption**: AES-256 volume encryption on PostgreSQL partitioned storage.
- **Audit Logging**: Every verification run records immutable timestamps, corridor identifier, accepted path count, and binary tree mask in `public.spec_verification_runs`.
