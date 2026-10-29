/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SUPABASE_POSTGRESQL_SCHEMA_SQL = `-- ============================================================================
-- GF-T3-259 · PRODUCTION POSTGRESQL / SUPABASE PERSISTENCE SCHEMA
-- Block-Scaled FP4 Quantization & Dynamic Outlier Retention Telemetry Ledger
-- Clean-Room MIT / Apache-2.0 Permissive Architecture · Zero-Trust RLS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CORRIDOR REGISTRY TABLE
CREATE TABLE IF NOT EXISTS fp4_corridor_registry (
    corridor_id TEXT PRIMARY KEY,
    corridor_designation TEXT NOT NULL,
    target_bandwidth_gbps INTEGER NOT NULL CHECK (target_bandwidth_gbps > 0),
    block_size_elements INTEGER NOT NULL DEFAULT 16 CHECK (block_size_elements = 16),
    compression_ratio_label TEXT NOT NULL DEFAULT '8:1',
    tenant_org_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fp4_corridor_tenant
    ON fp4_corridor_registry (tenant_org_id, created_at DESC);

-- 2. PARTITIONED QUANTIZATION PASS TELEMETRY TABLE
CREATE TABLE IF NOT EXISTS fp4_quantization_passes (
    pass_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    corridor_id TEXT NOT NULL REFERENCES fp4_corridor_registry(corridor_id) ON DELETE RESTRICT,
    tenant_org_id UUID NOT NULL,
    operator_callsign TEXT NOT NULL,
    throughput_gbps NUMERIC(10, 2) NOT NULL CHECK (throughput_gbps >= 0),
    quantization_latency_us NUMERIC(8, 4) NOT NULL CHECK (quantization_latency_us > 0),
    active_blocks_count SMALLINT NOT NULL DEFAULT 8 CHECK (active_blocks_count BETWEEN 1 AND 8),
    processed_tokens BIGINT NOT NULL CHECK (processed_tokens >= 0),
    outlier_saturation_active BOOLEAN NOT NULL DEFAULT FALSE,
    perplexity_delta NUMERIC(8, 6) NOT NULL DEFAULT 0.000000,
    PRIMARY KEY (pass_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS fp4_quantization_passes_y2026m10
    PARTITION OF fp4_quantization_passes
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS fp4_quantization_passes_default
    PARTITION OF fp4_quantization_passes DEFAULT;

CREATE INDEX IF NOT EXISTS idx_fp4_passes_corridor_time
    ON fp4_quantization_passes (corridor_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_fp4_passes_tenant_time
    ON fp4_quantization_passes (tenant_org_id, recorded_at DESC);

-- 3. BLOCK MATRIX SNAPSHOT TABLE (F0..F7)
CREATE TABLE IF NOT EXISTS fp4_block_matrix_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_id UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_org_id UUID NOT NULL,
    block_index SMALLINT NOT NULL CHECK (block_index BETWEEN 0 AND 7),
    block_id TEXT NOT NULL,
    hex_pointer TEXT NOT NULL,
    bits_mode TEXT NOT NULL CHECK (bits_mode IN ('FP4', 'FP8')),
    scale_factor NUMERIC(12, 6) NOT NULL CHECK (scale_factor > 0),
    outlier_ratio_pct NUMERIC(6, 3) NOT NULL CHECK (outlier_ratio_pct BETWEEN 0 AND 100),
    accuracy_pct NUMERIC(6, 2) NOT NULL CHECK (accuracy_pct BETWEEN 0 AND 100),
    mean_squared_error NUMERIC(12, 6) NOT NULL DEFAULT 0.000000,
    block_state TEXT NOT NULL,
    FOREIGN KEY (pass_id, recorded_at)
        REFERENCES fp4_quantization_passes (pass_id, recorded_at)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fp4_block_snapshots_pass
    ON fp4_block_matrix_snapshots (pass_id, block_index);

-- 4. ROW-LEVEL SECURITY (RLS) ENFORCEMENT
ALTER TABLE fp4_corridor_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp4_quantization_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp4_block_matrix_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_fp4_corridor_tenant_isolation
    ON fp4_corridor_registry
    FOR ALL
    TO authenticated
    USING (tenant_org_id = ( current_setting('request.jwt.claim.tenant_org_id', true) )::UUID)
    WITH CHECK (tenant_org_id = ( current_setting('request.jwt.claim.tenant_org_id', true) )::UUID);

CREATE POLICY rls_fp4_passes_tenant_isolation
    ON fp4_quantization_passes
    FOR ALL
    TO authenticated
    USING (tenant_org_id = ( current_setting('request.jwt.claim.tenant_org_id', true) )::UUID)
    WITH CHECK (tenant_org_id = ( current_setting('request.jwt.claim.tenant_org_id', true) )::UUID);

CREATE POLICY rls_fp4_blocks_tenant_isolation
    ON fp4_block_matrix_snapshots
    FOR ALL
    TO authenticated
    USING (tenant_org_id = ( current_setting('request.jwt.claim.tenant_org_id', true) )::UUID)
    WITH CHECK (tenant_org_id = ( current_setting('request.jwt.claim.tenant_org_id', true) )::UUID);
`;
