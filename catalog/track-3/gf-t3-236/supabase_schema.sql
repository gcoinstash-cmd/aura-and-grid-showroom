-- GF-T3-236: FlashAttention Ring-Block Scale & Causal Mask Persistence Schema
-- Dialect: PostgreSQL 16 / Supabase
-- Features: Range-Partitioned Telemetry Tables, Foreign Keys, Composite Indexes, Strict RLS Policies

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Synthetic Corridor Registry Table
CREATE TABLE IF NOT EXISTS flash_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_code VARCHAR(128) NOT NULL UNIQUE,
    algorithm_mode VARCHAR(64) NOT NULL,
    target_bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (target_bandwidth_gbs > 0),
    causal_mask_default BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    owner_uid UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_flash_corridors_code ON flash_corridors (corridor_code);
CREATE INDEX IF NOT EXISTS idx_flash_corridors_owner ON flash_corridors (owner_uid);

-- 2. Partitioned Kernel Execution Runs Table
CREATE TABLE IF NOT EXISTS flash_kernel_runs (
    run_id UUID NOT NULL DEFAULT gen_random_uuid(),
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    corridor_id UUID NOT NULL REFERENCES flash_corridors(corridor_id) ON DELETE RESTRICT,
    seq_len INTEGER NOT NULL CHECK (seq_len BETWEEN 4 AND 131072),
    head_dim INTEGER NOT NULL CHECK (head_dim BETWEEN 4 AND 512),
    block_size INTEGER NOT NULL CHECK (block_size BETWEEN 2 AND 256),
    causal_mask_active BOOLEAN NOT NULL DEFAULT TRUE,
    attention_bandwidth_gbs NUMERIC(10, 2) NOT NULL,
    kernel_latency_us NUMERIC(10, 4) NOT NULL,
    active_blocks INTEGER NOT NULL CHECK (active_blocks BETWEEN 0 AND 64),
    processed_tokens BIGINT NOT NULL CHECK (processed_tokens >= 0),
    max_numerical_drift DOUBLE PRECISION NOT NULL,
    operator_uid UUID NOT NULL,
    PRIMARY KEY (run_id, executed_at)
) PARTITION BY RANGE (executed_at);

CREATE TABLE IF NOT EXISTS flash_kernel_runs_2026_q4
    PARTITION OF flash_kernel_runs
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS flash_kernel_runs_default
    PARTITION OF flash_kernel_runs DEFAULT;

CREATE INDEX IF NOT EXISTS idx_flash_runs_corridor_time
    ON flash_kernel_runs (corridor_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_flash_runs_operator
    ON flash_kernel_runs (operator_uid, executed_at DESC);

-- 3. Ring-Block Tile Telemetry Snapshots
CREATE TABLE IF NOT EXISTS flash_block_tiles (
    tile_snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL,
    block_label VARCHAR(8) NOT NULL,
    block_index INTEGER NOT NULL CHECK (block_index BETWEEN 0 AND 63),
    tile_coord_q INTEGER NOT NULL,
    tile_coord_k INTEGER NOT NULL,
    causal_range VARCHAR(32) NOT NULL,
    running_max DOUBLE PRECISION NOT NULL,
    running_denom DOUBLE PRECISION NOT NULL,
    scale_factor DOUBLE PRECISION NOT NULL,
    sram_pointer VARCHAR(16) NOT NULL,
    kv_cache_index INTEGER NOT NULL,
    reduction_state VARCHAR(32) NOT NULL,
    operator_uid UUID NOT NULL,
    FOREIGN KEY (run_id, executed_at) REFERENCES flash_kernel_runs (run_id, executed_at) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_flash_block_tiles_run
    ON flash_block_tiles (run_id, block_index);

-- 4. Strict Row-Level Security (RLS) Enforcement
ALTER TABLE flash_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_kernel_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_block_tiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY flash_corridors_select_policy ON flash_corridors
    FOR SELECT
    TO authenticated
    USING (owner_uid = auth.uid());

CREATE POLICY flash_corridors_insert_policy ON flash_corridors
    FOR INSERT
    TO authenticated
    WITH CHECK (owner_uid = auth.uid());

CREATE POLICY flash_kernel_runs_select_policy ON flash_kernel_runs
    FOR SELECT
    TO authenticated
    USING (operator_uid = auth.uid());

CREATE POLICY flash_kernel_runs_insert_policy ON flash_kernel_runs
    FOR INSERT
    TO authenticated
    WITH CHECK (operator_uid = auth.uid());

CREATE POLICY flash_block_tiles_select_policy ON flash_block_tiles
    FOR SELECT
    TO authenticated
    USING (operator_uid = auth.uid());

CREATE POLICY flash_block_tiles_insert_policy ON flash_block_tiles
    FOR INSERT
    TO authenticated
    WITH CHECK (operator_uid = auth.uid());
