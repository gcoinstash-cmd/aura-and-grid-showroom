# ASSET_TRANSFER_SPEC.md: Technical Handoff & IP Assignment Specification
**Asset Identifier:** GF-T3-217: APEX-217 Multi-Model Semantic Router & Fallback Gateway  
**Classification:** Enterprise Reference Core · Track 3 Repository Handoff  
**Governing Standard:** Standard Commercial Asset Transfer Specification  
**Transaction Structure:** Standalone Repository Assignment via Direct Asset Purchase Agreement (APA)  
**SaaS / Support Disclaimer:** Standalone codebase transfer; zero ongoing SaaS support SLAs, seat-based subscriptions, or hosted infrastructure obligations  

---

## 1. Repository Scope & Transfer Manifest

The transferee receives complete, unrestricted ownership and intellectual property assignment for all digital artifacts comprising the APEX-217 codebase:

1. **Backend Routing Engine:** `engine.py` (FastAPI production routing microservice with UCB1 balancer and circuit breakers).
2. **Deterministic Verification Suite:** `test_router_engine.py` (Automated pytest test suite with full cascade coverage).
3. **Container Deployment Asset:** `Dockerfile` (Hardened, non-root Cloud Run deployment container).
4. **Engineering Specification Suite:** `ENGINE_SPEC.md` (OpenAPI 3.1 definitions, DDL schemas, and mathematical derivations).
5. **Clean-Room Compliance Certification:** `LEGAL_IP_AUDIT.md` (Clean-room provenance and NIST SSDF v1.1 audit).
6. **Cockpit Telemetry Terminal:** `src/App.tsx` and accompanying React 19 / Vite build system.

---

## 2. Turnkey Deployment & Ingestion Procedures

### 2.1 Local Standalone Container Execution
To spin up the turnkey routing microservice locally or on private sovereign infrastructure:

```bash
# Build container image
docker build -t apex-217-router:latest .

# Run container on internal service mesh port 8080
docker run -d --name apex-router-gateway -p 8080:8080 apex-217-router:latest

# Verify health check endpoint
curl -X GET http://localhost:8080/health
```

### 2.2 Google Cloud Run Production Deployment
Execute deterministic deployment using Google Cloud SDK:

```bash
gcloud run deploy apex-217-router \
    --source . \
    --region us-central1 \
    --allow-unauthenticated \
    --min-instances 1 \
    --max-instances 50 \
    --cpu 2 \
    --memory 2Gi \
    --timeout 60s
```

### 2.3 Database Migration Execution
Apply the zero-downtime DDL migrations defined in `ENGINE_SPEC.md` against target PostgreSQL 16 or AlloyDB clusters using standard idempotent migration runners:

```bash
psql "postgresql://router_admin:router_pass@db-cluster.internal:5432/apex_gateway" \
    -f migrations/001_create_apex_router_core.sql
```

---

## 3. Clean Title Warranty & Commercial IP Assignment Terms

1. **Full Ownership Conveyance:** Upon execution of the definitive Asset Purchase Agreement and delivery of the repository archive, 100% of the worldwide rights, titles, and interests in the copyright, trade dress, algorithmic logic, and source code transfer irrevocably to the acquiring entity.
2. **Clean Title Warranty:** The sole proprietor warrants that the codebase was independently developed, contains no third-party proprietary trade secrets, and is not subject to any pre-existing licenses, liens, or third-party claims.
3. **Absence of Ongoing Obligations:** This transaction is structured exclusively as an outright sale of digital intellectual property assets. The transferor provides no continuing SaaS hosting, software maintenance, technical support SLAs, or per-node subscriptions. All post-transfer operational responsibilities reside solely with the acquiring entity.
4. **Governing Protocol:** Standard Commercial Asset Transfer Specification.

---

## 4. Verification Checkpoint on Ingestion

Upon delivery of the git bundle, the acquiring technical diligence team should verify the cryptographic manifest:

```bash
# Verify integrity of all committed files
git status --porcelain

# Run full automated test suite
python -m pytest test_router_engine.py -v --tb=short

# Verify zero compiler diagnostics in frontend cockpit
npm run build
```
