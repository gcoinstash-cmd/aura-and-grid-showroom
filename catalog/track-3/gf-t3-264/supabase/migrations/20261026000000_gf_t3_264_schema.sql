-- GF-T3-264 PostgreSQL / Supabase Production Schema
-- Dual-Stream Async Disaggregated Prefill & Decode Persistence Layer
-- SPDX-License-Identifier: MIT

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Synthetic Corridor Registry Table
CREATE TABLE IF NOT EXISTS gf_t3_264_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_label TEXT NOT NULL,
    max_bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (max_bandwidth_gbs > 0),
    target_sync_latency_us NUMERIC(8, 4) NOT NULL CHECK (target_sync_latency_us >= 0),
    efficiency_factor NUMERIC(5, 4) NOT NULL CHECK (efficiency_factor BETWEEN 0.1000 AND 1.5000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO gf_t3_264_corridors (corridor_id, corridor_label, max_bandwidth_gbs, target_sync_latency_us, efficiency_factor)
VALUES
    ('ALPHA', 'STREAM-CORRIDOR-ALPHA (DUAL-STREAM-ASYNC-DISAGGREGATION-FABRIC · 25600-GB/S)', 25600.00, 0.0100, 1.0000),
    ('BRAVO', 'STREAM-CORRIDOR-BRAVO (NON-BLOCKING-EVENT-SYNCHRONIZER)', 24576.00, 0.0100, 0.9600),
    ('GAMMA', 'STREAM-CORRIDOR-GAMMA (REMOTE-KV-CACHE-MIGRATION-ENGINE)', 24064.00, 0.0100, 0.9400),
    ('DELTA', 'STREAM-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-STREAM-PASS)', 15872.00, 0.1400, 0.6200)
ON CONFLICT (corridor_id) DO NOTHING;

-- 2. Partitioned Stream Execution Telemetry Table (Partitioned by Range on recorded_at)
CREATE TABLE IF NOT EXISTS gf_t3_264_stream_telemetry (
    telemetry_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_org_id UUID NOT NULL,
    corridor_id TEXT NOT NULL REFERENCES gf_t3_264_corridors(corridor_id) ON DELETE RESTRICT,
    stream_index SMALLINT NOT NULL CHECK (stream_index BETWEEN 0 AND 7),
    stream_code TEXT NOT NULL,
    hex_ptr TEXT NOT NULL,
    execution_mode TEXT NOT NULL CHECK (execution_mode IN ('PREFILL', 'DECODE', 'DUAL-ASYNC', 'MONOLITHIC')),
    tokens_processed_k INTEGER NOT NULL CHECK (tokens_processed_k >= 0),
    prefill_bw_gbs NUMERIC(10, 2) NOT NULL,
    decode_bw_gbs NUMERIC(10, 2) NOT NULL,
    sync_latency_ms NUMERIC(8, 4) NOT NULL,
    kv_migration_us NUMERIC(8, 4) NOT NULL,
    buffer_parity_pct NUMERIC(5, 2) NOT NULL CHECK (buffer_parity_pct BETWEEN 0.00 AND 100.00),
    stream_state TEXT NOT NULL,
    PRIMARY KEY (telemetry_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS gf_t3_264_stream_telemetry_2026_q4
    PARTITION OF gf_t3_264_stream_telemetry
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS gf_t3_264_stream_telemetry_2027_q1
    PARTITION OF gf_t3_264_stream_telemetry
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

-- 3. Non-Blocking Hardware Event Audit Log
CREATE TABLE IF NOT EXISTS gf_t3_264_event_sync_audit (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_org_id UUID NOT NULL,
    corridor_id TEXT NOT NULL REFERENCES gf_t3_264_corridors(corridor_id) ON DELETE CASCADE,
    trigger_directive TEXT NOT NULL,
    aggregate_throughput_gbs NUMERIC(10, 2) NOT NULL,
    event_sync_us NUMERIC(8, 4) NOT NULL,
    active_streams SMALLINT NOT NULL CHECK (active_streams BETWEEN 0 AND 8),
    vector_signature JSONB NOT NULL DEFAULT '[2.61, 2.65, 2.62, 2.64]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. High-Selectivity B-Tree & BRIN Indexes
CREATE INDEX IF NOT EXISTS idx_gf_t3_264_telemetry_tenant_stream
    ON gf_t3_264_stream_telemetry (tenant_org_id, stream_index, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_gf_t3_264_telemetry_corridor
    ON gf_t3_264_stream_telemetry (corridor_id, execution_mode);

CREATE INDEX IF NOT EXISTS idx_gf_t3_264_audit_tenant_created
    ON gf_t3_264_event_sync_audit (tenant_org_id, created_at DESC);

-- 5. Strict Row-Level Security (RLS) Enforcement
ALTER TABLE gf_t3_264_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_264_stream_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_264_event_sync_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_corridors_read_authenticated
    ON gf_t3_264_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY policy_stream_telemetry_tenant_isolation
    ON gf_t3_264_stream_telemetry
    FOR ALL
    TO authenticated
    USING (tenant_org_id = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::UUID)
    WITH CHECK (tenant_org_id = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::UUID);

CREATE POLICY policy_event_sync_audit_tenant_isolation
    ON gf_t3_264_event_sync_audit
    FOR ALL
    TO authenticated
    USING (tenant_org_id = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::UUID)
    WITH CHECK (tenant_org_id = NULLIF(current_setting('request.jwt.claim.org_id', true), '')::UUID);
