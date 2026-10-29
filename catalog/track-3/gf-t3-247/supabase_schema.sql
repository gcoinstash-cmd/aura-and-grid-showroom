-- GF-T3-247 Distributed Sequence Parallelism Telemetry & Audit Schema
-- Target: PostgreSQL 16 / Supabase with Partitioned Tables and Row-Level Security (RLS)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Ulysses Corridor Configuration Table
CREATE TABLE IF NOT EXISTS ulysses_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_code TEXT NOT NULL UNIQUE,
    execution_mode TEXT NOT NULL CHECK (execution_mode IN ('ULYSSES_ALL_TO_ALL', 'RING_KV_OVERLAP', 'NON_CONTIGUOUS_SHUFFLE', 'SINGLE_GPU_FALLBACK')),
    world_size INTEGER NOT NULL CHECK (world_size BETWEEN 1 AND 64),
    nominal_bandwidth_gbps NUMERIC(10, 2) NOT NULL CHECK (nominal_bandwidth_gbps > 0),
    nominal_latency_us NUMERIC(8, 4) NOT NULL CHECK (nominal_latency_us > 0),
    tenant_org_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Partitioned Sequence Parallelism Pass Telemetry Table
CREATE TABLE IF NOT EXISTS ulysses_sequence_passes (
    pass_id UUID NOT NULL DEFAULT gen_random_uuid(),
    corridor_id UUID NOT NULL REFERENCES ulysses_corridors(corridor_id) ON DELETE CASCADE,
    tenant_org_id UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sequence_length INTEGER NOT NULL CHECK (sequence_length >= 1024),
    active_ranks INTEGER NOT NULL CHECK (active_ranks BETWEEN 1 AND 64),
    throughput_gbps NUMERIC(10, 2) NOT NULL,
    ring_latency_us NUMERIC(8, 4) NOT NULL,
    overlap_efficiency_pct NUMERIC(5, 2) NOT NULL CHECK (overlap_efficiency_pct BETWEEN 0 AND 100),
    processed_tokens BIGINT NOT NULL CHECK (processed_tokens >= 0),
    interconnect_stalled BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (pass_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS ulysses_sequence_passes_2026_q4
    PARTITION OF ulysses_sequence_passes
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- 3. Per-Rank All-To-All & Ring Snapshot Table
CREATE TABLE IF NOT EXISTS ulysses_rank_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_id UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    tenant_org_id UUID NOT NULL,
    rank_index INTEGER NOT NULL CHECK (rank_index BETWEEN 0 AND 63),
    peer_rank_index INTEGER NOT NULL CHECK (peer_rank_index BETWEEN 0 AND 63),
    hex_pointer TEXT NOT NULL,
    chunk_tokens INTEGER NOT NULL,
    processed_tokens INTEGER NOT NULL,
    ring_state TEXT NOT NULL CHECK (ring_state IN ('ASYNC_TRANSFER', 'RING_RESYNC', 'LOCKED_COMPUTE')),
    comm_latency_ms NUMERIC(8, 4) NOT NULL,
    rank_status TEXT NOT NULL CHECK (rank_status IN ('LOCKED', 'FAULT')),
    FOREIGN KEY (pass_id, recorded_at) REFERENCES ulysses_sequence_passes(pass_id, recorded_at) ON DELETE CASCADE
);

-- Indexes for High-Throughput Telemetry Queries
CREATE INDEX IF NOT EXISTS idx_corridors_tenant ON ulysses_corridors(tenant_org_id);
CREATE INDEX IF NOT EXISTS idx_passes_tenant_time ON ulysses_sequence_passes(tenant_org_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_rank_snapshots_pass ON ulysses_rank_snapshots(pass_id, rank_index);

-- Row-Level Security (RLS) Enforcement
ALTER TABLE ulysses_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ulysses_sequence_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ulysses_rank_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_corridors ON ulysses_corridors
    FOR ALL
    USING (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID)
    WITH CHECK (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID);

CREATE POLICY tenant_isolation_passes ON ulysses_sequence_passes
    FOR ALL
    USING (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID)
    WITH CHECK (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID);

CREATE POLICY tenant_isolation_rank_snapshots ON ulysses_rank_snapshots
    FOR ALL
    USING (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID)
    WITH CHECK (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID);
