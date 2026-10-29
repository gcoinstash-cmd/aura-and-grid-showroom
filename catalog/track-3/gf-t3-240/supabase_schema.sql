-- ============================================================================
-- GF-T3-240: Zero-Copy NCCL P2P Ring Stream & GPUDirect P2P Persistence Layer
-- PostgreSQL 16 / Supabase Production Schema with Partitioning & Strict RLS
-- SPDX-License-Identifier: MIT
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic NCCL Corridors Reference Table
CREATE TABLE IF NOT EXISTS nccl_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_code TEXT NOT NULL UNIQUE,
    peak_bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (peak_bandwidth_gbs > 0),
    base_latency_us NUMERIC(8, 4) NOT NULL CHECK (base_latency_us > 0),
    zero_copy_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Pre-Allocated GPU Ring Stream State Table
CREATE TABLE IF NOT EXISTS p2p_ring_streams (
    stream_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_org_id UUID NOT NULL,
    corridor_id UUID NOT NULL REFERENCES nccl_corridors(corridor_id) ON DELETE RESTRICT,
    stream_index SMALLINT NOT NULL CHECK (stream_index BETWEEN 0 AND 7),
    stream_code TEXT NOT NULL,
    source_gpu TEXT NOT NULL,
    peer_gpu TEXT NOT NULL,
    buffer_size_mb INTEGER NOT NULL DEFAULT 64 CHECK (buffer_size_mb BETWEEN 16 AND 512),
    ring_pointer_hex TEXT NOT NULL,
    event_marker TEXT NOT NULL,
    sync_status TEXT NOT NULL CHECK (sync_status IN ('✓ LOCKED', '⚡ FAULT')),
    transfer_rate_gbs NUMERIC(10, 2) NOT NULL DEFAULT 700.00,
    event_latency_us NUMERIC(8, 4) NOT NULL DEFAULT 0.0300,
    completed_passes BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_org_id, stream_index)
);

-- 3. Partitioned Telemetry Audit Ledger (Partitioned by Range on recorded_at)
CREATE TABLE IF NOT EXISTS nccl_telemetry_events (
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_org_id UUID NOT NULL,
    stream_uuid UUID NOT NULL REFERENCES p2p_ring_streams(stream_uuid) ON DELETE CASCADE,
    corridor_code TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('INIT', 'BURST', 'TOGGLE_STALL', 'STEP', 'FLUSH', 'SELECT_STREAM')),
    aggregate_bandwidth_gbs NUMERIC(10, 2) NOT NULL,
    stream_latency_us NUMERIC(8, 4) NOT NULL,
    active_streams SMALLINT NOT NULL CHECK (active_streams BETWEEN 0 AND 8),
    processed_tokens BIGINT NOT NULL,
    ring_pointer_hex TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS nccl_telemetry_events_2026_q4
    PARTITION OF nccl_telemetry_events
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS nccl_telemetry_events_2027_q1
    PARTITION OF nccl_telemetry_events
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

-- 4. High-Selectivity Indexes for Sub-Millisecond Lookups
CREATE INDEX IF NOT EXISTS idx_p2p_ring_streams_tenant_idx
    ON p2p_ring_streams (tenant_org_id, stream_index);

CREATE INDEX IF NOT EXISTS idx_nccl_telemetry_tenant_recorded
    ON nccl_telemetry_events (tenant_org_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_nccl_telemetry_corridor
    ON nccl_telemetry_events (corridor_code, action_type);

-- 5. Strict Row-Level Security (RLS) Enforcement
ALTER TABLE nccl_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_ring_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE nccl_telemetry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY nccl_corridors_read_authenticated
    ON nccl_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY p2p_ring_streams_tenant_isolation
    ON p2p_ring_streams
    FOR ALL
    TO authenticated
    USING (tenant_org_id = ( current_setting('request.jwt.claims', true)::jsonb ->> 'org_id' )::uuid)
    WITH CHECK (tenant_org_id = ( current_setting('request.jwt.claims', true)::jsonb ->> 'org_id' )::uuid);

CREATE POLICY nccl_telemetry_events_tenant_isolation
    ON nccl_telemetry_events
    FOR ALL
    TO authenticated
    USING (tenant_org_id = ( current_setting('request.jwt.claims', true)::jsonb ->> 'org_id' )::uuid)
    WITH CHECK (tenant_org_id = ( current_setting('request.jwt.claims', true)::jsonb ->> 'org_id' )::uuid);
