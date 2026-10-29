-- GF-T3-275 Production PostgreSQL / Supabase Persistence Schema
-- Partitioned Continuous Batch Telemetry, In-Flight Request Slots, Foreign Keys, Indexes & Strict RLS

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Sovereign Continuous Batch Corridors Registry
CREATE TABLE IF NOT EXISTS continuous_batch_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_label TEXT NOT NULL UNIQUE,
    execution_mode TEXT NOT NULL,
    peak_bandwidth_gbps NUMERIC(10, 2) NOT NULL CHECK (peak_bandwidth_gbps > 0),
    base_scheduling_latency_us NUMERIC(8, 4) NOT NULL CHECK (base_scheduling_latency_us > 0),
    tensor_efficiency_ratio NUMERIC(5, 4) NOT NULL CHECK (tensor_efficiency_ratio > 0 AND tensor_efficiency_ratio <= 1.0),
    non_blocking_join BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Partitioned Continuous Batch Telemetry Ledger (Partitioned by Range on recorded_at)
CREATE TABLE IF NOT EXISTS continuous_batch_telemetry (
    telemetry_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_org_id UUID NOT NULL,
    project_code TEXT NOT NULL DEFAULT 'GF-T3-275',
    corridor_id TEXT NOT NULL REFERENCES continuous_batch_corridors(corridor_id) ON DELETE RESTRICT,
    mesh_ptr TEXT NOT NULL DEFAULT '0x8F8DC0',
    active_batches_count SMALLINT NOT NULL CHECK (active_batches_count BETWEEN 0 AND 8),
    batch_throughput_gbps NUMERIC(10, 2) NOT NULL CHECK (batch_throughput_gbps >= 0),
    scheduling_latency_us NUMERIC(8, 4) NOT NULL CHECK (scheduling_latency_us > 0),
    processed_tokens_units BIGINT NOT NULL CHECK (processed_tokens_units >= 0),
    concurrency_spike_active BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (telemetry_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS continuous_batch_telemetry_2026_q4
    PARTITION OF continuous_batch_telemetry
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS continuous_batch_telemetry_2027_q1
    PARTITION OF continuous_batch_telemetry
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

-- 3. Hardware Batch Slot Units (H0-H7)
CREATE TABLE IF NOT EXISTS inflight_request_slots (
    slot_id TEXT PRIMARY KEY CHECK (slot_id IN ('H0', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7')),
    slot_index SMALLINT NOT NULL UNIQUE CHECK (slot_index BETWEEN 0 AND 7),
    tenant_org_id UUID NOT NULL,
    corridor_id TEXT NOT NULL REFERENCES continuous_batch_corridors(corridor_id) ON DELETE RESTRICT,
    hex_ptr TEXT NOT NULL UNIQUE,
    active_tokens_k INTEGER NOT NULL CHECK (active_tokens_k >= 0 AND active_tokens_k <= 512),
    pending_queue_req INTEGER NOT NULL CHECK (pending_queue_req >= 0 AND pending_queue_req <= 256),
    latency_ms NUMERIC(6, 3) NOT NULL CHECK (latency_ms > 0),
    tensor_rate_pct SMALLINT NOT NULL CHECK (tensor_rate_pct BETWEEN 0 AND 100),
    status_label TEXT NOT NULL DEFAULT 'SCHEDULED · LOCKED',
    locked BOOLEAN NOT NULL DEFAULT TRUE,
    iteration_step BIGINT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Immutable Audit & APA Transition Log
CREATE TABLE IF NOT EXISTS scheduler_audit_ledger (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_org_id UUID NOT NULL,
    slot_id TEXT REFERENCES inflight_request_slots(slot_id) ON DELETE SET NULL,
    callsign TEXT NOT NULL CHECK (callsign IN ('CREW CHIEF', 'TELEMETRY', 'PIT WALL')),
    event_code TEXT NOT NULL,
    event_message TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- High-Selectivity Indexes
CREATE INDEX IF NOT EXISTS idx_batch_telemetry_tenant_time
    ON continuous_batch_telemetry (tenant_org_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_batch_telemetry_corridor
    ON continuous_batch_telemetry (corridor_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_inflight_slots_tenant_locked
    ON inflight_request_slots (tenant_org_id, locked, slot_index);

CREATE INDEX IF NOT EXISTS idx_scheduler_audit_tenant_time
    ON scheduler_audit_ledger (tenant_org_id, recorded_at DESC);

-- Strict Row-Level Security (RLS) Enforcement
ALTER TABLE continuous_batch_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE continuous_batch_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE inflight_request_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduler_audit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_corridors_authenticated_read
    ON continuous_batch_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY rls_telemetry_tenant_isolation
    ON continuous_batch_telemetry
    FOR ALL
    TO authenticated
    USING (tenant_org_id = ( current_setting('request.jwt.claim.tenant_org_id', true) )::uuid)
    WITH CHECK (tenant_org_id = ( current_setting('request.jwt.claim.tenant_org_id', true) )::uuid);

CREATE POLICY rls_slots_tenant_isolation
    ON inflight_request_slots
    FOR ALL
    TO authenticated
    USING (tenant_org_id = ( current_setting('request.jwt.claim.tenant_org_id', true) )::uuid)
    WITH CHECK (tenant_org_id = ( current_setting('request.jwt.claim.tenant_org_id', true) )::uuid);

CREATE POLICY rls_audit_tenant_isolation
    ON scheduler_audit_ledger
    FOR ALL
    TO authenticated
    USING (tenant_org_id = ( current_setting('request.jwt.claim.tenant_org_id', true) )::uuid)
    WITH CHECK (tenant_org_id = ( current_setting('request.jwt.claim.tenant_org_id', true) )::uuid);
