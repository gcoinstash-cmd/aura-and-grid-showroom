# GF-T3-228 System Architecture & Monolithic Modularity

## 1. Architectural Philosophy
`GF-T3-228` is engineered around monolithic modularity for seamless institutional auditability and rapid on-premise or air-gapped deployment scalability. Every subsystem—draft tree expansion, causal tree-attention mask synthesis, parallel verification, and telemetry persistence—operates deterministically with zero external network dependencies.

## 2. Distributed System & Data Flow Diagram
```text
+-------------------------------------------------------------------------+
|                        GF-T3-228 COMMAND COCKPIT                        |
|  [Header Deck] -> [4-Card HUD] -> [5-Tab Bay] -> [Launch Control Dock]  |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                GRIDSYNC ZERO-TRUST INGRESS SANITIZATION                 |
|        Zod / Pydantic Schema Gate · SQL/XSS Control Scrubbing           |
+------------------------------------+------------------------------------+
                                     |
          +--------------------------+--------------------------+
          |                                                     |
          v                                                     v
+-----------------------------------+ +-----------------------------------+
|  NON-AUTOREGRESSIVE DRAFT KERNEL  | |  UNIFIED TREE-ATTENTION VERIFIER  |
|  - Root Token (Depth 0)           | |  - 12x12 Causal Ancestor Mask     |
|  - 3 Level-1 Draft Nodes          | |  - Single-Pass Parallel Logits    |
|  - 8 Level-2 Candidate Leaves     | |  - Confidence Pruning Gate        |
+-----------------+-----------------+ +-----------------+-----------------+
                  |                                     |
                  +------------------+------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|             SUPABASE / POSTGRESQL PARTITIONED PERSISTENCE               |
|   spec_corridors · spec_verification_runs (Range Partitioned) · RLS     |
+-------------------------------------------------------------------------+
```

## 3. Container Orchestration Strategy
- Stateless compute containers built from `/Dockerfile` run behind an internal L7 load balancer or Google Cloud Run ingress.
- Each container verifies its mathematical invariants via `pytest test_spec_tree_engine.py` during image build before exposing port `8080`.
