-- ============================================================================
-- GF-T3-253 Production PostgreSQL / Supabase Persistence Schema
-- Continuous In-Flight Batching & PagedAttention Dynamic Memory Fabric
-- Includes Partitioned Telemetry Tables, Foreign Keys, Indexes, and Strict RLS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic Corridor Registry Table
CREATE TABLE IF NOT EXISTS gf_t3_253_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_label TEXT NOT NULL UNIQUE,
    base_throughput_gbs NUMERIC(10, 2) NOT NULL CHECK (base_throughput_gbs > 0),
    cache_latency_us NUMERIC(8, 4) NOT NULL CHECK (cache_latency_us >= 0),
    block_capacity_tokens INTEGER NOT NULL DEFAULT 16 CHECK (block_capacity_tokens > 0),
    paged_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Physical KV Block Allocation Table (B0 - B7)
CREATE TABLE IF NOT EXISTS gf_t3_253_kv_blocks (
    block_id TEXT PRIMARY KEY,
    block_index INTEGER NOT NULL UNIQUE CHECK (block_index >= 0 AND block_index < 64),
    corridor_id TEXT NOT NULL REFERENCES gf_t3_253_corridors(corridor_id) ON DELETE CASCADE,
    hex_ptr TEXT NOT NULL,
    allocated_tokens INTEGER NOT NULL DEFAULT 16 CHECK (allocated_tokens >= 0 AND allocated_tokens <= 16),
    capacity_tokens INTEGER NOT NULL DEFAULT 16 CHECK (capacity_tokens = 16),
    ref_count INTEGER NOT NULL DEFAULT 4 CHECK (ref_count >= 0),
    fragmentation_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (fragmentation_pct >= 0 AND fragmentation_pct <= 100),
    latency_ms NUMERIC(6, 3) NOT NULL DEFAULT 0.080,
    block_state TEXT NOT NULL DEFAULT 'ALLOCATED' CHECK (block_state IN ('ALLOCATED', 'FREE', 'FRAGMENTED')),
    is_locked BOOLEAN NOT NULL DEFAULT TRUE,
    tenant_uid UUID NOT NULL DEFAULT auth.uid(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_t3_253_kv_blocks_corridor ON gf_t3_253_kv_blocks(corridor_id);
CREATE INDEX IF NOT EXISTS idx_gf_t3_253_kv_blocks_tenant ON gf_t3_253_kv_blocks(tenant_uid);

-- 3. Continuous In-Flight Sequence & Virtual-to-Physical Block Table
CREATE TABLE IF NOT EXISTS gf_t3_253_inflight_sequences (
    sequence_id TEXT PRIMARY KEY,
    corridor_id TEXT NOT NULL REFERENCES gf_t3_253_corridors(corridor_id) ON DELETE CASCADE,
    prompt_tokens INTEGER NOT NULL CHECK (prompt_tokens > 0),
    generated_tokens INTEGER NOT NULL DEFAULT 0 CHECK (generated_tokens >= 0),
    max_tokens INTEGER NOT NULL CHECK (max_tokens >= prompt_tokens),
    virtual_block_ids INTEGER[] NOT NULL,
    physical_block_table INTEGER[] NOT NULL,
    sequence_status TEXT NOT NULL DEFAULT 'IN_FLIGHT' CHECK (sequence_status IN ('IN_FLIGHT', 'RETIRED', 'QUEUED')),
    tenant_uid UUID NOT NULL DEFAULT auth.uid(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_t3_253_sequences_status ON gf_t3_253_inflight_sequences(sequence_status);
CREATE INDEX IF NOT EXISTS idx_gf_t3_253_sequences_tenant ON gf_t3_253_inflight_sequences(tenant_uid);

-- 4. Partitioned Telemetry Audit Log Table (Partitioned by Range on recorded_at)
CREATE TABLE IF NOT EXISTS gf_t3_253_telemetry_audit (
    audit_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    corridor_id TEXT NOT NULL REFERENCES gf_t3_253_corridors(corridor_id),
    batch_throughput_gbs NUMERIC(10, 2) NOT NULL,
    cache_latency_us NUMERIC(8, 4) NOT NULL,
    fragmentation_pct NUMERIC(5, 2) NOT NULL,
    active_blocks INTEGER NOT NULL,
    processed_tokens BIGINT NOT NULL,
    batch_state TEXT NOT NULL,
    callsign TEXT NOT NULL,
    radio_message TEXT NOT NULL,
    tenant_uid UUID NOT NULL DEFAULT auth.uid(),
    PRIMARY KEY (audit_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS gf_t3_253_telemetry_audit_2026_q4
    PARTITION OF gf_t3_253_telemetry_audit
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE INDEX IF NOT EXISTS idx_gf_t3_253_audit_recorded_at ON gf_t3_253_telemetry_audit(recorded_at DESC);

-- 5. Strict Row-Level Security (RLS) Policies
ALTER TABLE gf_t3_253_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_253_kv_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_253_inflight_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_253_telemetry_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY gf_t3_253_corridors_read_policy
    ON gf_t3_253_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY gf_t3_253_kv_blocks_tenant_isolation
    ON gf_t3_253_kv_blocks
    FOR ALL
    TO authenticated
    USING (tenant_uid = auth.uid())
    WITH CHECK (tenant_uid = auth.uid());

CREATE POLICY gf_t3_253_sequences_tenant_isolation
    ON gf_t3_253_inflight_sequences
    FOR ALL
    TO authenticated
    USING (tenant_uid = auth.uid())
    WITH CHECK (tenant_uid = auth.uid());

CREATE POLICY gf_t3_253_audit_tenant_isolation
    ON gf_t3_253_telemetry_audit
    FOR ALL
    TO authenticated
    USING (tenant_uid = auth.uid())
    WITH CHECK (tenant_uid = auth.uid());
