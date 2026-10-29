# GF-T3-227: Asset Purchase Agreement (APA) & Vault Buyout Specification

## 1. Executive Transfer Summary
This specification governs the outright institutional transfer of **GF-T3-227** under a direct Asset Purchase Agreement (APA). This documentation ensures a clear, verifiable transfer of all project intellectual property rights. This facilitates a seamless transition of ownership to the new project maintainer. This ensures long-term viability and operational autonomy for all downstream stakeholders. and provides complete legal indemnification.

---

## 2. Clean Title Warranty & IP Assignment
1. **Unencumbered Sovereign Ownership**: Aura & Grid warrants that **GF-T3-227** (including the TypeScript Radix KV Engine, FastAPI Python Engine, 2D Tree Attention Mask Constructor, Dynamic LRU Eviction Scheduler, and PostgreSQL Partitioned Schema) is original, clean-room intellectual property free of any liens, royalties, or third-party encumbrances.
2. **Full Assignment of Rights**: Upon execution of the APA transfer, 100% of copyright, trade secret, patentable algorithmic claims, and source code title transfer irrevocably to the acquiring entity.
3. **Permissive Dependency Guarantee**: All external libraries are strictly governed by MIT, BSD-3-Clause, ISC, or Apache-2.0 licenses, enabling closed-source commercial deployment without source disclosure obligations.

---

## 3. Deliverable Inventory Included in Vault Transfer
- **`/src/engine/radixEngine.ts`**: Self-contained TypeScript Prefix-Tree Radix KV-Cache, LCP matcher, edge splitter, 2D causal tree attention mask generator, numerical parity verifier, and Zod zero-trust ingress sanitizer.
- **`/src/engine/radixEngine.test.ts`**: Automated Vitest test suite verifying LCP edge splitting, tree attention mask parity, LRU leaf pruning, and input sanitization.
- **`/engine.py`**: Production FastAPI backend engine ready for containerized deployment.
- **`/test_tree_attn_engine.py`**: Automated Pytest suite verifying core radix and attention invariants.
- **`/supabase_schema.sql`**: Production PostgreSQL / Supabase persistence layer with partitioned telemetry tables, foreign keys, B-Tree/GIN indexes, and Row-Level Security (RLS) policies.
- **`/Dockerfile`**: 1-click Google Cloud Run container specification.

---

## 4. Zero-SaaS SLA & Sovereign Autonomy Disclaimer
- **No Recurring Metering or Call-Home Telemetry**: GF-T3-227 operates 100% air-gapped within the acquirer's VPC or on-premise cluster. There are zero external license servers, usage meters, or subscription gates.
- **As-Is Sovereign Handover**: Post-closing, the acquiring institution assumes full operational control of the codebase with zero recurring vendor lock-in or mandatory managed-service dependencies.
