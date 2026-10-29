-- =============================================================================
-- GF-T3-277 PRODUCTION POSTGRESQL / SUPABASE SCHEMA
-- Ultra-Wide Multi-GPU Pipeline Partitioning & Layer-Wise Tensor Sharding Ledger
-- Includes Partitioned Tables, Foreign Keys, Indexes, and Row-Level Security
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic Pipeline Corridors Registry
CREATE TABLE IF NOT EXISTS pipeline_corridors (
    corridor_id VARCHAR(64) PRIMARY KEY,
    corridor_label VARCHAR(160) NOT NULL UNIQUE,
    nvlink_bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (nvlink_bandwidth_gbs > 0),
    base_staging_latency_us NUMERIC(8, 4) NOT NULL CHECK (base_staging_latency_us >= 0),
    active_stages SMALLINT NOT NULL DEFAULT 8 CHECK (active_stages BETWEEN 1 AND 16),
    execution_mode VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Partitioned Pipeline Execution Runs Table (Partitioned by Range on recorded_at)
CREATE TABLE IF NOT EXISTS pipeline_partition_runs (
    run_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_id UUID NOT NULL,
    corridor_id VARCHAR(64) NOT NULL REFERENCES pipeline_corridors(corridor_id) ON DELETE RESTRICT,
    partition_throughput_gbs INTEGER NOT NULL CHECK (partition_throughput_gbs >= 0),
    staging_latency_us NUMERIC(8, 4) NOT NULL,
    active_stages SMALLINT NOT NULL CHECK (active_stages BETWEEN 1 AND 16),
    processed_tokens_units BIGINT NOT NULL CHECK (processed_tokens_units >= 0),
    bubble_fraction NUMERIC(8, 6) NOT NULL,
    balance_parity_pct NUMERIC(5, 2) NOT NULL,
    pipeline_state VARCHAR(64) NOT NULL,
    PRIMARY KEY (run_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS pipeline_partition_runs_2026_q4
    PARTITION OF pipeline_partition_runs
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS pipeline_partition_runs_default
    PARTITION OF pipeline_partition_runs DEFAULT;

-- 3. Stage Sharding Telemetry Nodes (P0..P7)
CREATE TABLE IF NOT EXISTS pipeline_stage_shards (
    shard_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    tenant_id UUID NOT NULL,
    stage_index SMALLINT NOT NULL CHECK (stage_index BETWEEN 0 AND 15),
    stage_code VARCHAR(8) NOT NULL,
    hex_ptr VARCHAR(16) NOT NULL,
    layer_range VARCHAR(24) NOT NULL,
    tokens_processed_k INTEGER NOT NULL CHECK (tokens_processed_k >= 0),
    stage_partition_load NUMERIC(12, 4) NOT NULL,
    latency_ms NUMERIC(8, 3) NOT NULL,
    sync_efficiency_pct NUMERIC(5, 2) NOT NULL,
    status_label VARCHAR(32) NOT NULL,
    FOREIGN KEY (run_id, recorded_at) REFERENCES pipeline_partition_runs(run_id, recorded_at) ON DELETE CASCADE
);

-- 4. High-Selectivity B-Tree and BRIN Indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_tenant_recorded
    ON pipeline_partition_runs (tenant_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_corridor
    ON pipeline_partition_runs (corridor_id);

CREATE INDEX IF NOT EXISTS idx_stage_shards_run_stage
    ON pipeline_stage_shards (run_id, stage_index);

-- 5. Strict Row-Level Security (RLS) Policies
ALTER TABLE pipeline_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_partition_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stage_shards ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_corridors_read_authenticated
    ON pipeline_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY policy_runs_tenant_isolation_select
    ON pipeline_partition_runs
    FOR SELECT
    TO authenticated
    USING (tenant_id = auth.uid());

CREATE POLICY policy_runs_tenant_isolation_insert
    ON pipeline_partition_runs
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_id = auth.uid());

CREATE POLICY policy_shards_tenant_isolation_select
    ON pipeline_stage_shards
    FOR SELECT
    TO authenticated
    USING (tenant_id = auth.uid());

CREATE POLICY policy_shards_tenant_isolation_insert
    ON pipeline_stage_shards
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_id = auth.uid());

-- 6. Seed Default Synthetic Pipeline Corridors
INSERT INTO pipeline_corridors (corridor_id, corridor_label, nvlink_bandwidth_gbs, base_staging_latency_us, active_stages, execution_mode)
VALUES
    ('PIPE-CORRIDOR-ALPHA', 'PIPE-CORRIDOR-ALPHA (MULTI-GPU-PIPELINE-PARTITIONING-FABRIC · 36000-GB/S)', 36000.00, 0.0100, 8, 'PIPELINE_SHARD'),
    ('PIPE-CORRIDOR-BRAVO', 'PIPE-CORRIDOR-BRAVO (LAYER-WISE-TENSOR-SHARDING-ENGINE)', 32400.00, 0.0200, 8, 'TENSOR_SHARD'),
    ('PIPE-CORRIDOR-GAMMA', 'PIPE-CORRIDOR-GAMMA (NON-BLOCKING-PEER-TO-PEER-TENSOR-FORWARDER)', 34800.00, 0.0100, 8, 'P2P_FORWARD'),
    ('PIPE-CORRIDOR-DELTA', 'PIPE-CORRIDOR-DELTA (FALLBACK-SINGLE-GPU-MONOLITHIC-PASS)', 9600.00, 0.0800, 8, 'MONOLITHIC_FALLBACK')
ON CONFLICT (corridor_id) DO NOTHING;
