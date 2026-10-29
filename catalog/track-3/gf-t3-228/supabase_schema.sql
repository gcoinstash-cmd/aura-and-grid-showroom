-- ============================================================================
-- GF-T3-228: DYNAMIC SPECULATIVE TREE DECODING & MULTI-CANDIDATE VERIFICATION
-- SUPABASE / POSTGRESQL PRODUCTION SCHEMA WITH PARTITIONING & STRICT RLS
-- SPDX-License-Identifier: MIT
-- ZERO-DOLLAR GATE COMPLIANT (ZERO DOLLAR CHARACTERS)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. SPECULATIVE CORRIDOR REGISTRY TABLE
CREATE TABLE IF NOT EXISTS public.spec_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_code TEXT NOT NULL UNIQUE,
    max_branch_slots INTEGER NOT NULL DEFAULT 8 CHECK (max_branch_slots BETWEEN 1 AND 32),
    default_pruning_threshold NUMERIC(5, 4) NOT NULL DEFAULT 0.7200 CHECK (default_pruning_threshold BETWEEN 0.0500 AND 0.9900),
    tree_mask_depth INTEGER NOT NULL DEFAULT 2 CHECK (tree_mask_depth BETWEEN 1 AND 8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PARTITIONED SPECULATIVE VERIFICATION RUNS TABLE (RANGE PARTITIONED BY CREATED_AT)
CREATE TABLE IF NOT EXISTS public.spec_verification_runs (
    run_id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    engine_id TEXT NOT NULL DEFAULT 'GF-T3-228',
    corridor_id TEXT NOT NULL REFERENCES public.spec_corridors(corridor_id) ON DELETE RESTRICT,
    root_token TEXT NOT NULL,
    accepted_branches INTEGER NOT NULL CHECK (accepted_branches >= 0),
    total_branches INTEGER NOT NULL CHECK (total_branches > 0),
    acceptance_rate_pct NUMERIC(5, 2) NOT NULL,
    speculative_speedup NUMERIC(5, 2) NOT NULL,
    verification_overhead_ms NUMERIC(6, 3) NOT NULL,
    verified_tokens_units BIGINT NOT NULL DEFAULT 384000,
    tree_mask_binary TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (run_id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS public.spec_verification_runs_2026_q4
    PARTITION OF public.spec_verification_runs
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS public.spec_verification_runs_default
    PARTITION OF public.spec_verification_runs DEFAULT;

-- 3. CANDIDATE DRAFT TREE NODES TABLE
CREATE TABLE IF NOT EXISTS public.spec_tree_nodes (
    node_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL,
    run_created_at TIMESTAMPTZ NOT NULL,
    tenant_id UUID NOT NULL,
    node_id TEXT NOT NULL,
    parent_node_id TEXT,
    tree_depth INTEGER NOT NULL CHECK (tree_depth BETWEEN 0 AND 8),
    slot_index INTEGER NOT NULL CHECK (slot_index BETWEEN 0 AND 32),
    token_id INTEGER NOT NULL,
    token_text TEXT NOT NULL,
    draft_confidence NUMERIC(5, 4) NOT NULL,
    target_probability NUMERIC(5, 4) NOT NULL,
    tree_mask_bits TEXT NOT NULL,
    verification_status TEXT NOT NULL CHECK (verification_status IN ('ACTIVE_DRAFT', 'VERIFIED_ACCEPTED', 'PRUNED_REJECTED')),
    FOREIGN KEY (run_id, run_created_at) REFERENCES public.spec_verification_runs(run_id, created_at) ON DELETE CASCADE
);

-- 4. HIGH-SELECTIVITY TELEMETRY INDEXES
CREATE INDEX IF NOT EXISTS idx_spec_runs_tenant_created
    ON public.spec_verification_runs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_spec_runs_corridor
    ON public.spec_verification_runs (corridor_id, speculative_speedup DESC);

CREATE INDEX IF NOT EXISTS idx_spec_nodes_run_status
    ON public.spec_tree_nodes (run_id, verification_status, tree_depth);

-- 5. ROW-LEVEL SECURITY (RLS) ENFORCEMENT
ALTER TABLE public.spec_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spec_verification_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spec_tree_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY spec_corridors_read_authenticated
    ON public.spec_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY spec_runs_tenant_isolation_select
    ON public.spec_verification_runs
    FOR SELECT
    TO authenticated
    USING (tenant_id = auth.uid());

CREATE POLICY spec_runs_tenant_isolation_insert
    ON public.spec_verification_runs
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_id = auth.uid());

CREATE POLICY spec_nodes_tenant_isolation_select
    ON public.spec_tree_nodes
    FOR SELECT
    TO authenticated
    USING (tenant_id = auth.uid());

CREATE POLICY spec_nodes_tenant_isolation_insert
    ON public.spec_tree_nodes
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_id = auth.uid());

-- 6. SEED SYNTHETIC SPECULATIVE CORRIDORS
INSERT INTO public.spec_corridors (corridor_id, corridor_code, max_branch_slots, default_pruning_threshold, tree_mask_depth)
VALUES
    ('SPEC-CORRIDOR-ALPHA (DYNAMIC-TREE-DRAFT · PARALLEL-VERIFY)', 'ALPHA', 8, 0.7200, 2),
    ('SPEC-CORRIDOR-BRAVO (CONFIDENCE-WEIGHTED-BRANCH-PRUNING)', 'BRAVO', 8, 0.7800, 2),
    ('SPEC-CORRIDOR-GAMMA (NON-AUTOREGRESSIVE-TRIE-EXPANSION)', 'GAMMA', 8, 0.6800, 2),
    ('SPEC-CORRIDOR-DELTA (GREEDY-FALLBACK-SINGLE-PATH)', 'DELTA', 1, 0.9000, 2)
ON CONFLICT (corridor_id) DO NOTHING;
