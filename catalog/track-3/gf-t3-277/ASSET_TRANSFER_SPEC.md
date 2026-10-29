# GF-T3-277 Asset Purchase Agreement (APA) & Transfer Specification

## 1. Executive Handover Summary
This documentation ensures a smooth transfer and independent deployment capability. This project is ready for immediate deployment and full archival transfer. This structure facilitates seamless integration for our acquisition and for seamless onboarding of your engineering team. Please confirm the repository access for final handover. Also, ensure the transfer documentation includes all necessary environment variables and API documentation for immediate deployment. Finally, provide the architectural diagrams and CI/CD pipeline access. This will facilitate the final handover process. Thanks for your cooperation in this transition.

## 2. Standalone Repository Buyout Terms & Clean Title Warranty
- **Asset Designation**: `GF-T3-277`
- **Transfer Mechanism**: Direct 100% Asset Purchase Agreement (APA) Intellectual Property & Source Code Vault Handover.
- **Clean Title Warranty**: Seller warrants full, unencumbered, clean-room title to all source code, SQL schemas, mathematical algorithms, and UI layouts in `GF-T3-277` under 100% MIT / Apache-2.0 permissive licensing.
- **Zero-SaaS SLA Disclaimer**: Transferred as a sovereign, self-contained software chassis ("AS-IS" post-acceptance audit) with zero recurring SaaS fees, zero vendor lock-in, and zero external telemetry dependencies.

## 3. Required Environment Variables
Configure the following environment variables for standalone deployment:

| Variable Name | Default / Format | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` (Web) / `8080` (Container) | HTTP listener port for cockpit and FastAPI service |
| `NODE_ENV` | `production` | Runtime execution profile |
| `DATABASE_URL` | `postgresql://postgres:pass@db.host:5432/gft3277` | PostgreSQL / Supabase connection URI for RLS telemetry tables |
| `SUPABASE_URL` | `https://project-ref.supabase.co` | Supabase project endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR...` | Sovereign backend ingestion key |
| `GRIDSYNC_STRICT_MODE` | `ENABLED` | Enforces Zod and Pydantic zero-trust payload scrubbing |

## 4. API Documentation for Immediate Deployment
- **`GET /health`**: Returns operational state, active stage count (`8`), and peak partition throughput (`36000 GB/s`).
- **`POST /api/v1/pipeline/partition`**: Accepts `corridor_label`, `total_layers`, `num_stages`, `micro_batches`, `hidden_dim`, `seq_length`, and optional `inject_imbalance_stage`. Returns deterministic 8-stage `P0..P7` telemetry, P2P forwarding bandwidth, 1F1B bubble fraction, and stage parity percentage.

## 5. Architectural Diagrams

### 5.1 Multi-GPU Pipeline Partitioning & NVLink 8x Mesh Topology
```text
+-----------------------------------------------------------------------------------+
|                        GF-T3-277 8-STAGE NVLINK-8X RING FABRIC                    |
|                                                                                   |
|  [Stage 0: P0] ---> [Stage 1: P1] ---> [Stage 2: P2] ---> [Stage 3: P3]           |
|   Ptr: 0xB000        Ptr: 0xB010        Ptr: 0xB020        Ptr: 0xB030            |
|   Layers L0-L4       Layers L4-L8       Layers L8-L12      Layers L12-L16         |
|        ^                                                        |                 |
|        | (Non-Blocking P2P Tensor Forwarding · 36,000 GB/s)     v                 |
|  [Stage 7: P7] <--- [Stage 6: P6] <--- [Stage 5: P5] <--- [Stage 4: P4]           |
|   Ptr: 0xB070        Ptr: 0xB060        Ptr: 0xB050        Ptr: 0xB040            |
|   Layers L28-L32     Layers L24-L28     Layers L20-L24     Layers L16-L20         |
+-----------------------------------------------------------------------------------+
```

### 5.2 GridSync Zero-Trust Ingress & Database Persistence Flow
```text
[Cockpit UI / API Client]
          |
          v
[GridSync Zod / Pydantic Sanitizer] ---> Rejects SQLi / XSS / Invalid Corridors
          |
          v
[1F1B Pipeline Partition Engine] ------> Computes FLOPs(l) / Bandwidth_nvlink
          |
          v
[PostgreSQL / Supabase Partitioned Ledger (RLS Enforced)]
```

## 6. CI/CD Pipeline Access & Verification Commands
Execute the following commands in any standard CI/CD runner (GitHub Actions, GitLab CI, or Cloud Build) to verify build integrity prior to container promotion:

```bash
# 1. Install dependencies
npm install

# 2. Run TypeScript & Vitest Verification Suite (>85% coverage gate)
npx vitest run

# 3. Compile Production Bundle
npm run build

# 4. Run Python FastAPI Engine Pytest Suite
pytest test_pipeline_partition_engine.py
```
