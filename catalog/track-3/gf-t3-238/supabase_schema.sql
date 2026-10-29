-- =============================================================================
-- GF-T3-238: Pipeline Parallelism 1F1B & Activation Checkpointing SQL Schema
-- Target Engine: PostgreSQL 16 / Supabase Production Cluster
-- Architecture: Range-Partitioned Telemetry Tables + Foreign Keys + Strict RLS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Master Pipeline Runs Table
CREATE TABLE IF NOT EXISTS pipeline_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engine_id VARCHAR(32) NOT NULL DEFAULT 'GF-T3-238' CHECK (engine_id = 'GF-T3-238'),
    tenant_org_id UUID NOT NULL,
    corridor_name VARCHAR(128) NOT NULL,
    num_stages INTEGER NOT NULL CHECK (num_stages BETWEEN 1 AND 64),
    num_micro_batches INTEGER NOT NULL CHECK (num_micro_batches BETWEEN 1 AND 512),
    virtual_chunks INTEGER NOT NULL CHECK (virtual_chunks BETWEEN 1 AND 16),
    interleaved_1f1b BOOLEAN NOT NULL DEFAULT TRUE,
    checkpointing_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    throughput_tflops NUMERIC(10, 2) NOT NULL,
    bubble_latency_us NUMERIC(10, 4) NOT NULL,
    processed_tokens BIGINT NOT NULL DEFAULT 1536000,
    parity_sha256_prefix VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_tenant_created
    ON pipeline_runs (tenant_org_id, created_at DESC);

-- 2. Stage Checkpoint Ledgers Table (Foreign Key to pipeline_runs)
CREATE TABLE IF NOT EXISTS stage_checkpoint_ledgers (
    ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES pipeline_runs(run_id) ON DELETE CASCADE,
    tenant_org_id UUID NOT NULL,
    stage_id INTEGER NOT NULL CHECK (stage_id BETWEEN 0 AND 63),
    stage_label VARCHAR(32) NOT NULL,
    active_micro_batch INTEGER NOT NULL,
    current_op VARCHAR(32) NOT NULL,
    checkpoint_ptr VARCHAR(16) NOT NULL,
    checkpoint_state VARCHAR(32) NOT NULL,
    activation_memory_mb NUMERIC(10, 2) NOT NULL,
    uncheckpointed_memory_mb NUMERIC(10, 2) NOT NULL,
    ring_buffer_queue_depth INTEGER NOT NULL CHECK (ring_buffer_queue_depth >= 0),
    recomputation_count INTEGER NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stage_checkpoint_run_stage
    ON stage_checkpoint_ledgers (run_id, stage_id);

-- 3. Partitioned Telemetry Events Table (Partitioned by Range on recorded_at)
CREATE TABLE IF NOT EXISTS pipeline_telemetry_events (
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES pipeline_runs(run_id) ON DELETE CASCADE,
    tenant_org_id UUID NOT NULL,
    stage_id INTEGER NOT NULL CHECK (stage_id BETWEEN 0 AND 63),
    micro_batch_code VARCHAR(16) NOT NULL,
    operation_phase VARCHAR(24) NOT NULL,
    checkpoint_ptr VARCHAR(16) NOT NULL,
    callsign VARCHAR(24) NOT NULL,
    log_message TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS pipeline_telemetry_events_2026_q4
    PARTITION OF pipeline_telemetry_events
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS pipeline_telemetry_events_default
    PARTITION OF pipeline_telemetry_events DEFAULT;

CREATE INDEX IF NOT EXISTS idx_pipeline_telemetry_events_brin
    ON pipeline_telemetry_events USING BRIN (recorded_at);

CREATE INDEX IF NOT EXISTS idx_pipeline_telemetry_events_tenant
    ON pipeline_telemetry_events (tenant_org_id, stage_id);

-- 4. Strict Row-Level Security (RLS) Policies
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_checkpoint_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_telemetry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_pipeline_runs_tenant_isolation
    ON pipeline_runs
    FOR ALL
    TO authenticated
    USING (tenant_org_id = ( current_setting('request.jwt.claim.org_id', true) )::UUID)
    WITH CHECK (tenant_org_id = ( current_setting('request.jwt.claim.org_id', true) )::UUID);

CREATE POLICY rls_stage_checkpoint_tenant_isolation
    ON stage_checkpoint_ledgers
    FOR ALL
    TO authenticated
    USING (tenant_org_id = ( current_setting('request.jwt.claim.org_id', true) )::UUID)
    WITH CHECK (tenant_org_id = ( current_setting('request.jwt.claim.org_id', true) )::UUID);

CREATE POLICY rls_pipeline_telemetry_tenant_isolation
    ON pipeline_telemetry_events
    FOR ALL
    TO authenticated
    USING (tenant_org_id = ( current_setting('request.jwt.claim.org_id', true) )::UUID)
    WITH CHECK (tenant_org_id = ( current_setting('request.jwt.claim.org_id', true) )::UUID);
