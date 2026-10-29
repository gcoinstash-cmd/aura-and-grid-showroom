-- GF-T3-232: Production PostgreSQL / Supabase Schema
-- Partitioned Telemetry Tables, Foreign Keys, Indexes, and Row-Level Security (RLS)
-- SPDX-License-Identifier: MIT

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Graph Capture Sessions (Parent Entity)
CREATE TABLE IF NOT EXISTS gf_t3_232_graph_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_org_id UUID NOT NULL,
    project_code VARCHAR(32) NOT NULL DEFAULT 'GF-T3-232' CHECK (project_code = 'GF-T3-232'),
    corridor_name VARCHAR(128) NOT NULL,
    stream_state VARCHAR(32) NOT NULL CHECK (stream_state IN ('UNINITIALIZED', 'CAPTURING', 'CAPTURED', 'REPLAYING', 'STALL_CONFLICT', 'FLUSHED')),
    captured_nodes_count INTEGER NOT NULL CHECK (captured_nodes_count >= 0 AND captured_nodes_count <= 4096),
    active_streams INTEGER NOT NULL CHECK (active_streams >= 0 AND active_streams <= 8),
    dispatch_latency_us NUMERIC(8, 4) NOT NULL CHECK (dispatch_latency_us > 0),
    graph_speedup_x NUMERIC(8, 4) NOT NULL CHECK (graph_speedup_x >= 1.0),
    processed_tokens_units BIGINT NOT NULL DEFAULT 768000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_t3_232_sessions_tenant
    ON gf_t3_232_graph_sessions (tenant_org_id, created_at DESC);

-- 2. Captured DAG Node Registry (Foreign Key to Graph Sessions)
CREATE TABLE IF NOT EXISTS gf_t3_232_graph_nodes (
    node_record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES gf_t3_232_graph_sessions(session_id) ON DELETE CASCADE,
    tenant_org_id UUID NOT NULL,
    node_index SMALLINT NOT NULL CHECK (node_index >= 0 AND node_index <= 127),
    node_label VARCHAR(16) NOT NULL,
    kernel_type VARCHAR(64) NOT NULL,
    parent_indices SMALLINT[] NOT NULL DEFAULT '{}',
    child_indices SMALLINT[] NOT NULL DEFAULT '{}',
    execution_time_us NUMERIC(8, 4) NOT NULL CHECK (execution_time_us > 0),
    memory_alias_ptr VARCHAR(32) NOT NULL,
    register_footprint_kb INTEGER NOT NULL CHECK (register_footprint_kb > 0),
    dispatch_state VARCHAR(32) NOT NULL DEFAULT 'CAPTURED',
    UNIQUE (session_id, node_index)
);

CREATE INDEX IF NOT EXISTS idx_gf_t3_232_nodes_session
    ON gf_t3_232_graph_nodes (session_id, node_index);

-- 3. Range-Partitioned Kernel Replay Telemetry Ledger
CREATE TABLE IF NOT EXISTS gf_t3_232_replay_telemetry (
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_id UUID NOT NULL REFERENCES gf_t3_232_graph_sessions(session_id) ON DELETE CASCADE,
    tenant_org_id UUID NOT NULL,
    action_trigger VARCHAR(64) NOT NULL,
    dispatch_latency_us NUMERIC(8, 4) NOT NULL,
    graph_speedup_x NUMERIC(8, 4) NOT NULL,
    buffer_parity_pct NUMERIC(6, 2) NOT NULL,
    radio_callsign VARCHAR(32) NOT NULL,
    radio_message TEXT NOT NULL,
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS gf_t3_232_replay_telemetry_y2026
    PARTITION OF gf_t3_232_replay_telemetry
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS gf_t3_232_replay_telemetry_default
    PARTITION OF gf_t3_232_replay_telemetry DEFAULT;

CREATE INDEX IF NOT EXISTS idx_gf_t3_232_telemetry_tenant_time
    ON gf_t3_232_replay_telemetry (tenant_org_id, recorded_at DESC);

-- 4. Strict Row-Level Security (RLS) Enforcement
ALTER TABLE gf_t3_232_graph_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_232_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_232_replay_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_sessions_select ON gf_t3_232_graph_sessions
    FOR SELECT
    USING (tenant_org_id = NULLIF(current_setting('request.jwt.claim.tenant_org_id', true), '')::UUID);

CREATE POLICY tenant_isolation_sessions_insert ON gf_t3_232_graph_sessions
    FOR INSERT
    WITH CHECK (tenant_org_id = NULLIF(current_setting('request.jwt.claim.tenant_org_id', true), '')::UUID);

CREATE POLICY tenant_isolation_nodes_select ON gf_t3_232_graph_nodes
    FOR SELECT
    USING (tenant_org_id = NULLIF(current_setting('request.jwt.claim.tenant_org_id', true), '')::UUID);

CREATE POLICY tenant_isolation_nodes_insert ON gf_t3_232_graph_nodes
    FOR INSERT
    WITH CHECK (tenant_org_id = NULLIF(current_setting('request.jwt.claim.tenant_org_id', true), '')::UUID);

CREATE POLICY tenant_isolation_telemetry_select ON gf_t3_232_replay_telemetry
    FOR SELECT
    USING (tenant_org_id = NULLIF(current_setting('request.jwt.claim.tenant_org_id', true), '')::UUID);

CREATE POLICY tenant_isolation_telemetry_insert ON gf_t3_232_replay_telemetry
    FOR INSERT
    WITH CHECK (tenant_org_id = NULLIF(current_setting('request.jwt.claim.tenant_org_id', true), '')::UUID);
