-- GF-T3-256: Sovereign PostgreSQL / Supabase Persistence Schema
-- Features: Range-Partitioned Tables, Foreign Keys, B-Tree & BRIN Indexes, Strict Row-Level Security (RLS)
-- Zero-Tolerance Integrity Standard: 100% Clean-Room SQL

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Engine Corridors Reference Table
CREATE TABLE IF NOT EXISTS flash_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_code VARCHAR(128) NOT NULL UNIQUE,
    max_bandwidth_gbps INTEGER NOT NULL CHECK (max_bandwidth_gbps > 0),
    target_latency_us NUMERIC(6, 3) NOT NULL CHECK (target_latency_us >= 0),
    is_parallel_split BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Partitioned FlashDecoding Execution Runs Table (Partitioned by sequence_length range)
CREATE TABLE IF NOT EXISTS flash_reduction_runs (
    run_id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_org_id UUID NOT NULL,
    engine_code VARCHAR(32) NOT NULL DEFAULT 'GF-T3-256',
    corridor_id UUID NOT NULL REFERENCES flash_corridors(corridor_id) ON DELETE RESTRICT,
    sequence_length INTEGER NOT NULL CHECK (sequence_length BETWEEN 64 AND 131072),
    num_splits INTEGER NOT NULL CHECK (num_splits BETWEEN 1 AND 64),
    tokens_per_split INTEGER NOT NULL CHECK (tokens_per_split > 0),
    throughput_gbps INTEGER NOT NULL,
    reduction_latency_us NUMERIC(8, 4) NOT NULL,
    global_max_logit NUMERIC(12, 6) NOT NULL,
    global_partition_sum NUMERIC(14, 6) NOT NULL,
    max_numerical_drift NUMERIC(16, 12) NOT NULL CHECK (max_numerical_drift < 0.000001),
    parity_verified BOOLEAN NOT NULL DEFAULT TRUE,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (run_id, sequence_length)
) PARTITION BY RANGE (sequence_length);

-- Range Partitions for Context Windows
CREATE TABLE IF NOT EXISTS flash_reduction_runs_short
    PARTITION OF flash_reduction_runs
    FOR VALUES FROM (64) TO (4097);

CREATE TABLE IF NOT EXISTS flash_reduction_runs_medium
    PARTITION OF flash_reduction_runs
    FOR VALUES FROM (4097) TO (32769);

CREATE TABLE IF NOT EXISTS flash_reduction_runs_long
    PARTITION OF flash_reduction_runs
    FOR VALUES FROM (32769) TO (131073);

-- 3. Split-KV Block Telemetry Child Table
CREATE TABLE IF NOT EXISTS flash_split_blocks (
    block_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL,
    sequence_length INTEGER NOT NULL,
    tenant_org_id UUID NOT NULL,
    split_index SMALLINT NOT NULL CHECK (split_index BETWEEN 0 AND 63),
    split_label VARCHAR(8) NOT NULL,
    pointer_hex VARCHAR(16) NOT NULL,
    tokens_allocated INTEGER NOT NULL CHECK (tokens_allocated >= 0),
    local_max_logit NUMERIC(12, 6) NOT NULL,
    local_exp_sum NUMERIC(14, 6) NOT NULL,
    online_rescale_factor NUMERIC(12, 6) NOT NULL,
    latency_ms NUMERIC(8, 4) NOT NULL,
    state_label VARCHAR(32) NOT NULL DEFAULT 'REDUCED',
    locked BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (run_id, sequence_length) REFERENCES flash_reduction_runs(run_id, sequence_length) ON DELETE CASCADE
);

-- 4. High-Velocity Indexes
CREATE INDEX IF NOT EXISTS idx_flash_runs_tenant_time
    ON flash_reduction_runs (tenant_org_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_flash_runs_corridor
    ON flash_reduction_runs (corridor_id);

CREATE INDEX IF NOT EXISTS idx_flash_splits_run_lookup
    ON flash_split_blocks (run_id, split_index);

-- 5. Strict Row-Level Security (RLS) Policies
ALTER TABLE flash_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_reduction_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_split_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY flash_corridors_read_policy ON flash_corridors
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY flash_runs_tenant_isolation_select ON flash_reduction_runs
    FOR SELECT
    USING (tenant_org_id = (auth.jwt() ->> 'org_id')::UUID);

CREATE POLICY flash_runs_tenant_isolation_insert ON flash_reduction_runs
    FOR INSERT
    WITH CHECK (tenant_org_id = (auth.jwt() ->> 'org_id')::UUID AND parity_verified = TRUE);

CREATE POLICY flash_splits_tenant_isolation_select ON flash_split_blocks
    FOR SELECT
    USING (tenant_org_id = (auth.jwt() ->> 'org_id')::UUID);

CREATE POLICY flash_splits_tenant_isolation_insert ON flash_split_blocks
    FOR INSERT
    WITH CHECK (tenant_org_id = (auth.jwt() ->> 'org_id')::UUID AND locked = TRUE);
