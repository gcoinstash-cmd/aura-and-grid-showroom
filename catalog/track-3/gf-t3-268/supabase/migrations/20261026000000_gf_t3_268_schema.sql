-- ============================================================================
-- GF-T3-268 · MULTI-NODE TENSOR-PARALLEL PIPELINE INTERCONNECT & RING-REDUCE
-- PRODUCTION POSTGRESQL / SUPABASE SCHEMA WITH PARTITIONING & STRICT RLS
-- LICENSE: MIT (CLEAN-ROOM ZERO-COPYLEFT PROVENANCE)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. SYNTHETIC INTERCONNECT CORRIDORS REGISTRY
CREATE TABLE IF NOT EXISTS fabric_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_code VARCHAR(64) NOT NULL UNIQUE CHECK (corridor_code ~ '^[A-Z0-9_-]+'),
    corridor_label VARCHAR(160) NOT NULL,
    peak_bandwidth_gbps NUMERIC(12, 2) NOT NULL CHECK (peak_bandwidth_gbps > 0),
    base_ring_latency_us NUMERIC(10, 4) NOT NULL CHECK (base_ring_latency_us >= 0),
    overlap_efficiency_ratio NUMERIC(5, 4) NOT NULL DEFAULT 0.9920 CHECK (overlap_efficiency_ratio BETWEEN 0.0000 AND 1.0000),
    active_ranks INTEGER NOT NULL DEFAULT 8 CHECK (active_ranks BETWEEN 1 AND 1024),
    tenant_org_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fabric_corridors_tenant ON fabric_corridors(tenant_org_id);
CREATE INDEX IF NOT EXISTS idx_fabric_corridors_code ON fabric_corridors(corridor_code);

-- 2. TENSOR-PARALLEL RANK NODES (R0 .. R7)
CREATE TABLE IF NOT EXISTS fabric_rank_nodes (
    rank_node_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id UUID NOT NULL REFERENCES fabric_corridors(corridor_id) ON DELETE CASCADE,
    rank_index INTEGER NOT NULL CHECK (rank_index >= 0 AND rank_index < 1024),
    memory_ptr_hex VARCHAR(16) NOT NULL CHECK (memory_ptr_hex ~ '^0x[0-9A-F]+'),
    processed_tokens BIGINT NOT NULL DEFAULT 256000 CHECK (processed_tokens >= 0),
    ring_hop_target VARCHAR(32) NOT NULL DEFAULT 'RANK-8',
    hop_latency_ms NUMERIC(8, 4) NOT NULL DEFAULT 0.0200 CHECK (hop_latency_ms >= 0),
    sync_parity_pct NUMERIC(5, 2) NOT NULL DEFAULT 100.00 CHECK (sync_parity_pct BETWEEN 0.00 AND 100.00),
    rank_state VARCHAR(32) NOT NULL DEFAULT 'SYNCED · LOCKED' CHECK (rank_state IN ('SYNCED · LOCKED', 'CONGESTED · REROUTE', 'BURST · OVERLAPPED', 'FAULT · ISOLATED')),
    vector_shard NUMERIC(10, 4)[] NOT NULL DEFAULT ARRAY[3.01, 3.05, 3.02, 3.04],
    tenant_org_id UUID NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (corridor_id, rank_index)
);

CREATE INDEX IF NOT EXISTS idx_fabric_rank_nodes_corridor ON fabric_rank_nodes(corridor_id, rank_index);
CREATE INDEX IF NOT EXISTS idx_fabric_rank_nodes_tenant ON fabric_rank_nodes(tenant_org_id);

-- 3. PARTITIONED RING-REDUCE SYNCHRONIZATION TELEMETRY LOGS
CREATE TABLE IF NOT EXISTS fabric_ring_reduce_telemetry (
    telemetry_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    corridor_id UUID NOT NULL REFERENCES fabric_corridors(corridor_id) ON DELETE CASCADE,
    step_sequence BIGINT NOT NULL CHECK (step_sequence >= 0),
    reduce_scatter_sum NUMERIC(18, 6) NOT NULL,
    all_gather_parity NUMERIC(18, 6) NOT NULL,
    effective_bandwidth_gbps NUMERIC(12, 2) NOT NULL,
    ring_latency_us NUMERIC(10, 4) NOT NULL,
    async_overlap_ratio NUMERIC(6, 4) NOT NULL,
    congestion_active BOOLEAN NOT NULL DEFAULT FALSE,
    callsign VARCHAR(32) NOT NULL DEFAULT 'TELEMETRY',
    log_message TEXT NOT NULL,
    tenant_org_id UUID NOT NULL,
    PRIMARY KEY (telemetry_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS fabric_ring_reduce_telemetry_y2026m10
    PARTITION OF fabric_ring_reduce_telemetry
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS fabric_ring_reduce_telemetry_y2026m11
    PARTITION OF fabric_ring_reduce_telemetry
    FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS fabric_ring_reduce_telemetry_default
    PARTITION OF fabric_ring_reduce_telemetry DEFAULT;

CREATE INDEX IF NOT EXISTS idx_ring_telemetry_corridor_time
    ON fabric_ring_reduce_telemetry (corridor_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_ring_telemetry_tenant
    ON fabric_ring_reduce_telemetry (tenant_org_id, recorded_at DESC);

-- 4. ROW-LEVEL SECURITY (RLS) ZERO-TRUST ISOLATION POLICIES
ALTER TABLE fabric_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric_rank_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric_ring_reduce_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_fabric_corridors ON fabric_corridors
    FOR ALL
    TO authenticated
    USING (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID)
    WITH CHECK (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID);

CREATE POLICY tenant_isolation_fabric_rank_nodes ON fabric_rank_nodes
    FOR ALL
    TO authenticated
    USING (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID)
    WITH CHECK (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID);

CREATE POLICY tenant_isolation_fabric_telemetry ON fabric_ring_reduce_telemetry
    FOR ALL
    TO authenticated
    USING (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID)
    WITH CHECK (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID);
