-- GF-T3-263 Production PostgreSQL / Supabase Persistence Schema
-- Partitioned Telemetry Tables, Foreign Keys, Indexes, and Strict Row-Level Security (RLS)
-- Zero-Dollar Character Invariant Enforced

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Continuous Batching Corridors Registry
CREATE TABLE IF NOT EXISTS batch_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_name TEXT NOT NULL UNIQUE,
    corridor_code VARCHAR(16) NOT NULL,
    peak_bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (peak_bandwidth_gbs > 0),
    base_latency_us NUMERIC(8, 4) NOT NULL CHECK (base_latency_us >= 0),
    execution_mode VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Execution Slot State Matrix (S0..S7)
CREATE TABLE IF NOT EXISTS batch_execution_slots (
    slot_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id UUID NOT NULL REFERENCES batch_corridors(corridor_id) ON DELETE CASCADE,
    slot_index SMALLINT NOT NULL CHECK (slot_index BETWEEN 0 AND 7),
    slot_label VARCHAR(8) NOT NULL,
    pointer_hex VARCHAR(16) NOT NULL,
    tokens_k INTEGER NOT NULL DEFAULT 128 CHECK (tokens_k >= 0),
    queue_state VARCHAR(24) NOT NULL DEFAULT 'IN-FLIGHT',
    latency_ms NUMERIC(6, 3) NOT NULL DEFAULT 0.020,
    utilization_pct NUMERIC(5, 2) NOT NULL DEFAULT 100.00 CHECK (utilization_pct BETWEEN 0 AND 100),
    status_label VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED · LOCKED',
    owner_tenant_id UUID NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (corridor_id, slot_index)
);

-- 3. Partitioned In-Flight Iteration Audit Log
CREATE TABLE IF NOT EXISTS batch_iteration_telemetry (
    telemetry_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    corridor_id UUID NOT NULL REFERENCES batch_corridors(corridor_id) ON DELETE CASCADE,
    iteration_step BIGINT NOT NULL CHECK (iteration_step >= 0),
    active_slots SMALLINT NOT NULL CHECK (active_slots BETWEEN 0 AND 8),
    evicted_completed SMALLINT NOT NULL DEFAULT 0,
    admitted_incoming SMALLINT NOT NULL DEFAULT 0,
    throughput_gbs NUMERIC(10, 2) NOT NULL,
    scheduler_latency_us NUMERIC(8, 4) NOT NULL,
    processed_tokens_total BIGINT NOT NULL,
    owner_tenant_id UUID NOT NULL,
    PRIMARY KEY (telemetry_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS batch_iteration_telemetry_2026_q4
    PARTITION OF batch_iteration_telemetry
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- High-Selectivity Indexes
CREATE INDEX IF NOT EXISTS idx_slots_corridor_index
    ON batch_execution_slots (corridor_id, slot_index);

CREATE INDEX IF NOT EXISTS idx_telemetry_tenant_recorded
    ON batch_iteration_telemetry (owner_tenant_id, recorded_at DESC);

-- Row-Level Security (RLS) Enforcement
ALTER TABLE batch_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_execution_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_iteration_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_corridors_read_authenticated
    ON batch_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY rls_slots_tenant_isolation
    ON batch_execution_slots
    FOR ALL
    TO authenticated
    USING (owner_tenant_id = auth.uid())
    WITH CHECK (owner_tenant_id = auth.uid());

CREATE POLICY rls_telemetry_tenant_isolation
    ON batch_iteration_telemetry
    FOR ALL
    TO authenticated
    USING (owner_tenant_id = auth.uid())
    WITH CHECK (owner_tenant_id = auth.uid());
