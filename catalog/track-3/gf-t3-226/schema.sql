-- ============================================================================
-- GF-T3-226 SOVEREIGN POSTGRESQL / SUPABASE DATABASE SCHEMA
-- Partitioned Paged KV-Cache Block Table, Tiled Softmax Runs, & Strict RLS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic KV Corridor Registry
CREATE TABLE IF NOT EXISTS kv_corridors (
    corridor_id TEXT PRIMARY KEY,
    display_label TEXT NOT NULL,
    page_block_tokens INTEGER NOT NULL DEFAULT 16 CHECK (page_block_tokens = 16),
    max_physical_blocks INTEGER NOT NULL DEFAULT 16 CHECK (max_physical_blocks > 0),
    base_bandwidth_gbs NUMERIC(10, 2) NOT NULL,
    base_latency_ms NUMERIC(10, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Partitioned Paged Virtual Memory Table (Partitioned by corridor_id)
CREATE TABLE IF NOT EXISTS kv_paged_blocks (
    block_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    corridor_id TEXT NOT NULL REFERENCES kv_corridors(corridor_id) ON DELETE CASCADE,
    tenant_org_id UUID NOT NULL,
    physical_block_id INTEGER NOT NULL CHECK (physical_block_id >= 0 AND physical_block_id < 16),
    logical_page_id INTEGER,
    sequence_id TEXT,
    allocated_tokens INTEGER NOT NULL DEFAULT 0 CHECK (allocated_tokens >= 0 AND allocated_tokens <= 16),
    capacity_tokens INTEGER NOT NULL DEFAULT 16 CHECK (capacity_tokens = 16),
    running_max_m NUMERIC(12, 6) NOT NULL DEFAULT 0.0,
    normalizer_l NUMERIC(12, 6) NOT NULL DEFAULT 0.0,
    correction_factor NUMERIC(12, 6) NOT NULL DEFAULT 1.0,
    cumulative_attention_score NUMERIC(10, 6) NOT NULL DEFAULT 0.0,
    sparsity_score NUMERIC(10, 6) NOT NULL DEFAULT 0.0,
    sram_transfer_state TEXT NOT NULL DEFAULT 'IDLE',
    status_code TEXT NOT NULL DEFAULT 'FREE' CHECK (status_code IN ('FREE', 'LOCKED', 'FAULT', 'EVICTED')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (corridor_id, physical_block_id, tenant_org_id)
) PARTITION BY LIST (corridor_id);

CREATE TABLE IF NOT EXISTS kv_paged_blocks_alpha PARTITION OF kv_paged_blocks
    FOR VALUES IN ('KV-CORRIDOR-ALPHA (PAGED-CHUNK-16B · DYNAMIC-ACCUMULATOR)');

CREATE TABLE IF NOT EXISTS kv_paged_blocks_bravo PARTITION OF kv_paged_blocks
    FOR VALUES IN ('KV-CORRIDOR-BRAVO (ASYNC-TMA-LOAD · WARP-SPECIALIZED)');

CREATE TABLE IF NOT EXISTS kv_paged_blocks_gamma PARTITION OF kv_paged_blocks
    FOR VALUES IN ('KV-CORRIDOR-GAMMA (SPARSE-HEAD-EVICTION · RECURRENT-SLOT)');

CREATE TABLE IF NOT EXISTS kv_paged_blocks_delta PARTITION OF kv_paged_blocks
    FOR VALUES IN ('KV-CORRIDOR-DELTA (ZERO-COPY-VIRTUAL-TABLE-FALLBACK)');

-- 3. Tiled Online Softmax Execution Audit Ledger
CREATE TABLE IF NOT EXISTS tiled_softmax_audit_log (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_org_id UUID NOT NULL,
    corridor_id TEXT NOT NULL REFERENCES kv_corridors(corridor_id) ON DELETE RESTRICT,
    step_index INTEGER NOT NULL,
    running_max_m NUMERIC(12, 6) NOT NULL,
    rescaling_factor NUMERIC(12, 6) NOT NULL,
    partition_sum_l NUMERIC(12, 6) NOT NULL,
    max_numerical_drift NUMERIC(16, 12) NOT NULL DEFAULT 0.0,
    sram_bandwidth_gbs NUMERIC(10, 2) NOT NULL,
    kernel_latency_ms NUMERIC(10, 4) NOT NULL,
    compression_ratio_pct NUMERIC(6, 2) NOT NULL,
    external_fragmentation_pct NUMERIC(6, 2) NOT NULL DEFAULT 0.00 CHECK (external_fragmentation_pct = 0.00),
    mfa_verified BOOLEAN NOT NULL DEFAULT TRUE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_kv_paged_blocks_tenant_status
    ON kv_paged_blocks (tenant_org_id, status_code, cumulative_attention_score);

CREATE INDEX IF NOT EXISTS idx_tiled_softmax_audit_tenant_time
    ON tiled_softmax_audit_log (tenant_org_id, recorded_at DESC);

-- 5. Strict Row-Level Security (RLS) Policies
ALTER TABLE kv_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE kv_paged_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiled_softmax_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY kv_corridors_read_policy ON kv_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY kv_paged_blocks_tenant_isolation ON kv_paged_blocks
    FOR ALL
    TO authenticated
    USING (tenant_org_id = ( current_setting('request.jwt.claim.org_id', true) )::uuid)
    WITH CHECK (tenant_org_id = ( current_setting('request.jwt.claim.org_id', true) )::uuid);

CREATE POLICY tiled_softmax_audit_tenant_isolation ON tiled_softmax_audit_log
    FOR ALL
    TO authenticated
    USING (
        tenant_org_id = ( current_setting('request.jwt.claim.org_id', true) )::uuid
        AND mfa_verified = true
    )
    WITH CHECK (
        tenant_org_id = ( current_setting('request.jwt.claim.org_id', true) )::uuid
        AND mfa_verified = true
    );
