-- ============================================================================
-- GF-T3-279: Production PostgreSQL / Supabase Persistence Schema
-- Ultra-Wide Dynamic Speculative Draft Tree Sharding & Parallel Candidate Scoring
-- Features: Partitioned Telemetry Tables, Foreign Keys, B-Tree/GIN Indexes, Strict RLS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic Tree Corridors Registry Table
CREATE TABLE IF NOT EXISTS public.gf_t3_279_corridors (
    corridor_code TEXT PRIMARY KEY CHECK (char_length(corridor_code) BETWEEN 3 AND 128),
    corridor_label TEXT NOT NULL,
    base_throughput_gbs NUMERIC(10, 2) NOT NULL CHECK (base_throughput_gbs > 0),
    verification_latency_us NUMERIC(8, 4) NOT NULL CHECK (verification_latency_us > 0),
    max_branches SMALLINT NOT NULL DEFAULT 8 CHECK (max_branches BETWEEN 1 AND 32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Speculative Tree Execution Runs (Parent Table for Shards)
CREATE TABLE IF NOT EXISTS public.gf_t3_279_tree_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_uid UUID NOT NULL,
    corridor_code TEXT NOT NULL REFERENCES public.gf_t3_279_corridors(corridor_code) ON DELETE RESTRICT,
    root_ptr_hex TEXT NOT NULL DEFAULT '0xCF8DC0',
    v_tree_max_score NUMERIC(12, 6) NOT NULL,
    winning_branch_index SMALLINT NOT NULL CHECK (winning_branch_index BETWEEN 0 AND 31),
    throughput_gbs NUMERIC(10, 2) NOT NULL,
    verification_latency_us NUMERIC(8, 4) NOT NULL,
    active_branches SMALLINT NOT NULL CHECK (active_branches BETWEEN 0 AND 32),
    processed_tokens_units BIGINT NOT NULL CHECK (processed_tokens_units >= 0),
    tree_state TEXT NOT NULL DEFAULT 'Verification Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Partitioned Draft Branch Shard Telemetry Table (Partitioned by HASH on branch_index)
CREATE TABLE IF NOT EXISTS public.gf_t3_279_branch_shards (
    shard_event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.gf_t3_279_tree_runs(run_id) ON DELETE CASCADE,
    operator_uid UUID NOT NULL,
    branch_index SMALLINT NOT NULL CHECK (branch_index BETWEEN 0 AND 7),
    branch_id TEXT NOT NULL,
    hex_ptr TEXT NOT NULL,
    tokens_k INTEGER NOT NULL CHECK (tokens_k >= 0),
    depth SMALLINT NOT NULL CHECK (depth BETWEEN 1 AND 64),
    latency_ms NUMERIC(8, 4) NOT NULL CHECK (latency_ms >= 0),
    cumulative_score NUMERIC(12, 6) NOT NULL,
    sync_pct NUMERIC(5, 2) NOT NULL CHECK (sync_pct BETWEEN 0 AND 100),
    status_label TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT TRUE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (shard_event_id, branch_index)
) PARTITION BY HASH (branch_index);

CREATE TABLE IF NOT EXISTS public.gf_t3_279_branch_shards_p0
    PARTITION OF public.gf_t3_279_branch_shards FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE IF NOT EXISTS public.gf_t3_279_branch_shards_p1
    PARTITION OF public.gf_t3_279_branch_shards FOR VALUES WITH (MODULUS 4, REMAINDER 1);

CREATE TABLE IF NOT EXISTS public.gf_t3_279_branch_shards_p2
    PARTITION OF public.gf_t3_279_branch_shards FOR VALUES WITH (MODULUS 4, REMAINDER 2);

CREATE TABLE IF NOT EXISTS public.gf_t3_279_branch_shards_p3
    PARTITION OF public.gf_t3_279_branch_shards FOR VALUES WITH (MODULUS 4, REMAINDER 3);

-- 4. High-Selectivity Indexes
CREATE INDEX IF NOT EXISTS idx_gf_t3_279_runs_operator_created
    ON public.gf_t3_279_tree_runs (operator_uid, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gf_t3_279_shards_run_branch
    ON public.gf_t3_279_branch_shards (run_id, branch_index);

-- 5. Strict Row-Level Security (RLS) Policies
ALTER TABLE public.gf_t3_279_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_279_tree_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_279_branch_shards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access to synthetic corridors"
    ON public.gf_t3_279_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Operators can view own speculative tree runs"
    ON public.gf_t3_279_tree_runs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = operator_uid);

CREATE POLICY "Operators can insert own speculative tree runs"
    ON public.gf_t3_279_tree_runs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = operator_uid);

CREATE POLICY "Operators can view own branch shard partitions"
    ON public.gf_t3_279_branch_shards
    FOR SELECT
    TO authenticated
    USING (auth.uid() = operator_uid);

CREATE POLICY "Operators can insert own branch shard partitions"
    ON public.gf_t3_279_branch_shards
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = operator_uid);
