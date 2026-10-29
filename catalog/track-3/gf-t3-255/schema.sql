-- GF-T3-255: Grouped-Query Attention & KV Cache Compression Tensor Fabric
-- Production PostgreSQL / Supabase Schema with Range Partitioning & Row-Level Security (RLS)
-- Zero-Dollar Gate Verified: Zero currency symbols or dollar-quoted blocks

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic GQA Corridors Registry
CREATE TABLE IF NOT EXISTS gqa_corridors (
    corridor_code VARCHAR(16) PRIMARY KEY,
    corridor_label VARCHAR(128) NOT NULL UNIQUE,
    mode_name VARCHAR(64) NOT NULL,
    base_throughput_gbs NUMERIC(10, 2) NOT NULL CHECK (base_throughput_gbs > 0),
    target_compaction_ratio NUMERIC(6, 2) NOT NULL CHECK (target_compaction_ratio >= 1.0),
    query_to_kv_ratio INTEGER NOT NULL CHECK (query_to_kv_ratio >= 1),
    eviction_threshold_pct NUMERIC(6, 4) NOT NULL CHECK (eviction_threshold_pct >= 0.0),
    tenant_org_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gqa_corridors_tenant ON gqa_corridors (tenant_org_id);

-- 2. Partitioned KV Cache Compression Telemetry Runs
CREATE TABLE IF NOT EXISTS gqa_telemetry_epochs (
    epoch_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    corridor_code VARCHAR(16) NOT NULL REFERENCES gqa_corridors (corridor_code) ON DELETE RESTRICT,
    tenant_org_id UUID NOT NULL,
    pointer_hex VARCHAR(16) NOT NULL,
    compression_throughput_gbs NUMERIC(10, 2) NOT NULL,
    attention_latency_us NUMERIC(8, 4) NOT NULL,
    compaction_ratio NUMERIC(6, 2) NOT NULL,
    active_heads INTEGER NOT NULL CHECK (active_heads BETWEEN 0 AND 8),
    processed_tokens BIGINT NOT NULL CHECK (processed_tokens >= 0),
    engine_xp BIGINT NOT NULL CHECK (engine_xp >= 0),
    eviction_spike_active BOOLEAN NOT NULL DEFAULT FALSE,
    kv_memory_saved_pct NUMERIC(6, 3) NOT NULL,
    PRIMARY KEY (epoch_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS gqa_telemetry_epochs_2026_q4
    PARTITION OF gqa_telemetry_epochs
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS gqa_telemetry_epochs_default
    PARTITION OF gqa_telemetry_epochs DEFAULT;

CREATE INDEX IF NOT EXISTS idx_gqa_telemetry_epochs_corridor
    ON gqa_telemetry_epochs (corridor_code, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_gqa_telemetry_epochs_tenant
    ON gqa_telemetry_epochs (tenant_org_id, recorded_at DESC);

-- 3. Grouped-Query Attention Head State Allocations (H0..H7)
CREATE TABLE IF NOT EXISTS gqa_head_allocations (
    allocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    epoch_id UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    tenant_org_id UUID NOT NULL,
    head_index SMALLINT NOT NULL CHECK (head_index BETWEEN 0 AND 7),
    hex_pointer VARCHAR(16) NOT NULL,
    compaction_ratio NUMERIC(6, 2) NOT NULL,
    gqa_sharing_ratio VARCHAR(16) NOT NULL,
    eviction_rate_pct NUMERIC(6, 4) NOT NULL,
    latency_ms NUMERIC(8, 4) NOT NULL,
    accuracy_pct NUMERIC(6, 3) NOT NULL,
    retained_tokens INTEGER NOT NULL,
    evicted_tokens INTEGER NOT NULL,
    attention_entropy NUMERIC(8, 4) NOT NULL,
    locked BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (epoch_id, recorded_at) REFERENCES gqa_telemetry_epochs (epoch_id, recorded_at) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gqa_head_alloc_epoch ON gqa_head_allocations (epoch_id, head_index);

-- 4. Strict Row-Level Security (RLS) Enforcement
ALTER TABLE gqa_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gqa_telemetry_epochs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gqa_head_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_gqa_corridors_tenant_isolation ON gqa_corridors
    FOR ALL
    USING (tenant_org_id = current_setting('app.current_tenant_id', true)::UUID)
    WITH CHECK (tenant_org_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY rls_gqa_telemetry_tenant_isolation ON gqa_telemetry_epochs
    FOR ALL
    USING (tenant_org_id = current_setting('app.current_tenant_id', true)::UUID)
    WITH CHECK (tenant_org_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY rls_gqa_heads_tenant_isolation ON gqa_head_allocations
    FOR ALL
    USING (tenant_org_id = current_setting('app.current_tenant_id', true)::UUID)
    WITH CHECK (tenant_org_id = current_setting('app.current_tenant_id', true)::UUID);
