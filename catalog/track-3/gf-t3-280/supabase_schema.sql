-- GF-T3-280: Production PostgreSQL / Supabase Persistence Schema
-- Continuous Paged Attention & Hardware-Accelerated Block Allocation Engine
-- SPDX-License-Identifier: MIT

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Paged Corridors Registry Table
CREATE TABLE IF NOT EXISTS gf_t3_280_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_code TEXT NOT NULL UNIQUE,
    max_bandwidth_gbs INTEGER NOT NULL CHECK (max_bandwidth_gbs > 0),
    block_size_tokens INTEGER NOT NULL DEFAULT 16 CHECK (block_size_tokens IN (16, 32, 64, 128, 256)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Virtual-to-Physical Page Table Registry
CREATE TABLE IF NOT EXISTS gf_t3_280_page_table (
    page_slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id TEXT NOT NULL REFERENCES gf_t3_280_corridors(corridor_id) ON DELETE CASCADE,
    gear_tag TEXT NOT NULL CHECK (gear_tag IN ('G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7')),
    logical_block_index INTEGER NOT NULL CHECK (logical_block_index BETWEEN 0 AND 7),
    physical_frame_hex TEXT NOT NULL,
    tokens_allocated INTEGER NOT NULL DEFAULT 256000 CHECK (tokens_allocated >= 0),
    block_size_tokens INTEGER NOT NULL DEFAULT 16,
    latency_ms NUMERIC(6, 3) NOT NULL DEFAULT 0.020,
    sync_parity_pct NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    fragmentation_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    page_state TEXT NOT NULL DEFAULT 'PAGED · LOCKED',
    owner_uid UUID NOT NULL DEFAULT auth.uid(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (corridor_id, logical_block_index)
);

-- 3. Partitioned Telemetry Audit Log (Partitioned by RANGE on recorded_at)
CREATE TABLE IF NOT EXISTS gf_t3_280_telemetry_events (
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    corridor_id TEXT NOT NULL REFERENCES gf_t3_280_corridors(corridor_id) ON DELETE RESTRICT,
    action_trigger TEXT NOT NULL,
    page_throughput_gbs INTEGER NOT NULL,
    allocation_latency_us NUMERIC(6, 3) NOT NULL,
    active_pages_count INTEGER NOT NULL CHECK (active_pages_count BETWEEN 0 AND 8),
    processed_tokens_units BIGINT NOT NULL,
    internal_fragmentation_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    virtual_ptr_hex TEXT NOT NULL,
    owner_uid UUID NOT NULL DEFAULT auth.uid(),
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS gf_t3_280_telemetry_events_2026_q4
    PARTITION OF gf_t3_280_telemetry_events
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS gf_t3_280_telemetry_events_2027_q1
    PARTITION OF gf_t3_280_telemetry_events
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

-- 4. High-Selectivity Indexes
CREATE INDEX IF NOT EXISTS idx_gf_t3_280_page_table_corridor_gear
    ON gf_t3_280_page_table (corridor_id, gear_tag);

CREATE INDEX IF NOT EXISTS idx_gf_t3_280_telemetry_recorded_at
    ON gf_t3_280_telemetry_events (recorded_at DESC, corridor_id);

-- 5. Strict Row-Level Security (RLS) Enforcement
ALTER TABLE gf_t3_280_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_280_page_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_280_telemetry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_corridors_read_authenticated
    ON gf_t3_280_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY policy_page_table_tenant_isolation
    ON gf_t3_280_page_table
    FOR ALL
    TO authenticated
    USING (owner_uid = auth.uid())
    WITH CHECK (owner_uid = auth.uid());

CREATE POLICY policy_telemetry_events_tenant_insert
    ON gf_t3_280_telemetry_events
    FOR INSERT
    TO authenticated
    WITH CHECK (owner_uid = auth.uid());

CREATE POLICY policy_telemetry_events_tenant_select
    ON gf_t3_280_telemetry_events
    FOR SELECT
    TO authenticated
    USING (owner_uid = auth.uid());
