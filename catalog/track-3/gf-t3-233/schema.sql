-- ============================================================================
-- GF-T3-233 · ASYNCHRONOUS KERNEL STREAM CONCURRENCY & PRIORITY SCHEDULER
-- Production PostgreSQL 16 / Supabase Persistence Schema
-- Clean-Room Permissive Architecture (MIT / Apache-2.0) · Zero-Trust RLS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Synthetic Stream Corridors Registry
CREATE TABLE IF NOT EXISTS gf_t3_233_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    corridor_code VARCHAR(128) NOT NULL UNIQUE,
    priority_class VARCHAR(16) NOT NULL CHECK (priority_class IN ('HIGH', 'NORMAL', 'LOW')),
    max_concurrent_streams SMALLINT NOT NULL DEFAULT 16 CHECK (max_concurrent_streams BETWEEN 1 AND 64),
    preemption_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_t3_233_corridors_tenant
    ON gf_t3_233_corridors (tenant_id, priority_class);

-- 2. Execution Stream Lanes (S0..S15)
CREATE TABLE IF NOT EXISTS gf_t3_233_stream_lanes (
    lane_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    corridor_id UUID NOT NULL REFERENCES gf_t3_233_corridors(corridor_id) ON DELETE CASCADE,
    stream_index SMALLINT NOT NULL CHECK (stream_index BETWEEN 0 AND 15),
    priority_level VARCHAR(16) NOT NULL CHECK (priority_level IN ('HIGH', 'NORMAL', 'LOW')),
    priority_weight SMALLINT NOT NULL CHECK (priority_weight BETWEEN 1 AND 100),
    active_kernel VARCHAR(64) NOT NULL,
    event_sync_flag VARCHAR(16) NOT NULL,
    dependency_pointer VARCHAR(16) NOT NULL,
    barrier_state VARCHAR(24) NOT NULL CHECK (barrier_state IN ('LOCKED', 'FAULT', 'ACTIVE_CONCURRENT', 'SYNC_WAIT')),
    kv_cache_region INTEGER NOT NULL CHECK (kv_cache_region >= 0),
    dispatch_latency_us NUMERIC(6, 3) NOT NULL DEFAULT 0.180,
    processed_token_units BIGINT NOT NULL DEFAULT 56000,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (corridor_id, stream_index)
);

CREATE INDEX IF NOT EXISTS idx_gf_t3_233_lanes_corridor_prio
    ON gf_t3_233_stream_lanes (corridor_id, priority_weight DESC, stream_index ASC);

-- 3. Partitioned Kernel Telemetry & Preemption Audit Ledger
CREATE TABLE IF NOT EXISTS gf_t3_233_dispatch_events (
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    lane_id UUID NOT NULL REFERENCES gf_t3_233_stream_lanes(lane_id) ON DELETE CASCADE,
    cycle_number BIGINT NOT NULL CHECK (cycle_number >= 1),
    kernel_identifier VARCHAR(64) NOT NULL,
    event_flag_hex VARCHAR(16) NOT NULL,
    barrier_status VARCHAR(24) NOT NULL,
    token_units INTEGER NOT NULL CHECK (token_units >= 64),
    dispatch_latency_us NUMERIC(6, 3) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS gf_t3_233_dispatch_events_2026_q4
    PARTITION OF gf_t3_233_dispatch_events
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS gf_t3_233_dispatch_events_default
    PARTITION OF gf_t3_233_dispatch_events DEFAULT;

CREATE INDEX IF NOT EXISTS idx_gf_t3_233_events_tenant_cycle
    ON gf_t3_233_dispatch_events (tenant_id, cycle_number DESC, recorded_at DESC);

-- 4. Row-Level Security (RLS) Enforcement
ALTER TABLE gf_t3_233_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_233_stream_lanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_233_dispatch_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_gf_t3_233_corridors_tenant_isolation
    ON gf_t3_233_corridors
    FOR ALL
    TO authenticated
    USING (tenant_id = auth.uid())
    WITH CHECK (tenant_id = auth.uid());

CREATE POLICY policy_gf_t3_233_lanes_tenant_isolation
    ON gf_t3_233_stream_lanes
    FOR ALL
    TO authenticated
    USING (tenant_id = auth.uid())
    WITH CHECK (tenant_id = auth.uid());

CREATE POLICY policy_gf_t3_233_events_tenant_isolation
    ON gf_t3_233_dispatch_events
    FOR ALL
    TO authenticated
    USING (tenant_id = auth.uid())
    WITH CHECK (tenant_id = auth.uid());
