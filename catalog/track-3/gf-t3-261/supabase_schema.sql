-- GF-T3-261 Production PostgreSQL / Supabase Persistence Schema
-- Context Parallelism & Ring-Attention Distributed Sequence Ledger
-- Features: Partitioned Tables, Foreign Keys, Composite Indexes, Strict Row-Level Security (RLS)
-- SPDX-License-Identifier: MIT

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic Ring Corridors Reference Table
CREATE TABLE IF NOT EXISTS ring_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_code TEXT NOT NULL UNIQUE,
    base_bandwidth_gbps NUMERIC(10, 2) NOT NULL CHECK (base_bandwidth_gbps > 0),
    link_latency_us NUMERIC(8, 4) NOT NULL CHECK (link_latency_us > 0),
    overlap_efficiency_pct NUMERIC(5, 2) NOT NULL CHECK (overlap_efficiency_pct BETWEEN 0 AND 100),
    tenant_org_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Ring Execution Sessions (Parent Table for Partitioned Telemetry)
CREATE TABLE IF NOT EXISTS ring_execution_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engine_id TEXT NOT NULL DEFAULT 'GF-T3-261',
    corridor_id TEXT NOT NULL REFERENCES ring_corridors(corridor_id) ON DELETE RESTRICT,
    tenant_org_id UUID NOT NULL,
    active_nodes INTEGER NOT NULL DEFAULT 8 CHECK (active_nodes BETWEEN 2 AND 64),
    total_sequence_tokens BIGINT NOT NULL CHECK (total_sequence_tokens >= 1024),
    context_throughput_gbps NUMERIC(10, 2) NOT NULL,
    ring_latency_us NUMERIC(8, 4) NOT NULL,
    ring_state TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Partitioned Ring Hop Telemetry Table (Partitioned by Range on recorded_at)
CREATE TABLE IF NOT EXISTS ring_hop_telemetry (
    telemetry_id UUID NOT NULL DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ring_execution_sessions(session_id) ON DELETE CASCADE,
    tenant_org_id UUID NOT NULL,
    node_rank INTEGER NOT NULL CHECK (node_rank BETWEEN 0 AND 63),
    hop_index INTEGER NOT NULL CHECK (hop_index >= 0),
    hex_ptr TEXT NOT NULL,
    partition_tokens INTEGER NOT NULL CHECK (partition_tokens > 0),
    kv_source_rank INTEGER NOT NULL CHECK (kv_source_rank BETWEEN 0 AND 63),
    overlap_ratio_pct NUMERIC(5, 2) NOT NULL,
    step_latency_ms NUMERIC(8, 4) NOT NULL,
    softmax_running_max NUMERIC(10, 4) NOT NULL,
    state_label TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (telemetry_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS ring_hop_telemetry_2026_q4
    PARTITION OF ring_hop_telemetry
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS ring_hop_telemetry_2027_q1
    PARTITION OF ring_hop_telemetry
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

-- 4. High-Selectivity B-Tree & BRIN Indexes
CREATE INDEX IF NOT EXISTS idx_ring_sessions_tenant_corridor
    ON ring_execution_sessions (tenant_org_id, corridor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ring_telemetry_session_rank
    ON ring_hop_telemetry (session_id, node_rank, hop_index);

CREATE INDEX IF NOT EXISTS idx_ring_telemetry_recorded_brin
    ON ring_hop_telemetry USING BRIN (recorded_at);

-- 5. Strict Row-Level Security (RLS) Enforcement
ALTER TABLE ring_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ring_execution_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ring_hop_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_corridors_select ON ring_corridors
    FOR SELECT
    TO authenticated
    USING (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID);

CREATE POLICY tenant_isolation_sessions_all ON ring_execution_sessions
    FOR ALL
    TO authenticated
    USING (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID)
    WITH CHECK (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID);

CREATE POLICY tenant_isolation_telemetry_all ON ring_hop_telemetry
    FOR ALL
    TO authenticated
    USING (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID)
    WITH CHECK (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID);
