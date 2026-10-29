# GF-T3-228 Changelog

## [3.2.8] - 2026-10-21
### Added
- Non-autoregressive draft tree expansion kernel (Root + 3 Level-1 Draft Nodes + 8 Level-2 Candidate Leaves).
- Unified 12x12 causal tree-attention mask builder and single-pass parallel verification kernel.
- Dynamic confidence branch pruning across 4 synthetic speculative corridors (`ALPHA`, `BRAVO`, `GAMMA`, `DELTA`).
- GridSync Zero-Trust Zod & Pydantic payload sanitization gates.
- Partitioned PostgreSQL / Supabase persistence schema (`supabase_schema.sql`) with Row-Level Security (RLS).
- F1 Pit Wall 10/10 viewport-locked cockpit UI (`GF-T3-228`).
