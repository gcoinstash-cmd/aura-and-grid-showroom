-- GF-T3-244 Production PostgreSQL / Supabase Persistence Schema
-- FP8 / INT8 Dual-Stream Hybrid Quantization & Dynamic Outlier-Gated Calibration
-- Zero-Trust Row-Level Security (RLS) & Partitioned Telemetry Storage

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic Hybrid Corridors Registry
CREATE TABLE IF NOT EXISTS hybrid_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_code TEXT NOT NULL UNIQUE CHECK (char_length(corridor_code) <= 120),
    stream_mode TEXT NOT NULL CHECK (stream_mode IN ('FP8_INT8_HYBRID', 'FP8_E4M3', 'INT8_DENSE', 'FP16_BYPASS')),
    nominal_bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (nominal_bandwidth_gbs > 0),
    sigma_gate_threshold NUMERIC(5, 2) NOT NULL DEFAULT 6.00,
    tenant_org_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Partitioned Quantization Block Calibration Ledger
CREATE TABLE IF NOT EXISTS quantization_block_runs (
    run_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_org_id UUID NOT NULL,
    corridor_id UUID NOT NULL REFERENCES hybrid_corridors(corridor_id) ON DELETE CASCADE,
    block_index SMALLINT NOT NULL CHECK (block_index >= 0 AND block_index <= 15),
    block_label TEXT NOT NULL,
    pointer_hex TEXT NOT NULL,
    format_tag TEXT NOT NULL,
    activation_scale NUMERIC(12, 6) NOT NULL,
    weight_scale NUMERIC(12, 6) NOT NULL,
    outlier_channels INTEGER NOT NULL CHECK (outlier_channels >= 0),
    relative_error_pct NUMERIC(8, 4) NOT NULL CHECK (relative_error_pct >= 0),
    sqnr_db NUMERIC(8, 2) NOT NULL,
    compression_ratio NUMERIC(6, 2) NOT NULL,
    calibration_latency_us NUMERIC(8, 4) NOT NULL,
    status TEXT NOT NULL DEFAULT 'CALIBRATED',
    PRIMARY KEY (run_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS quantization_block_runs_2026_q4
    PARTITION OF quantization_block_runs
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS quantization_block_runs_default
    PARTITION OF quantization_block_runs DEFAULT;

-- 3. Outlier Gating Isolation Events
CREATE TABLE IF NOT EXISTS outlier_isolation_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_org_id UUID NOT NULL,
    block_index SMALLINT NOT NULL CHECK (block_index >= 0 AND block_index <= 15),
    channel_index INTEGER NOT NULL CHECK (channel_index >= 0),
    raw_activation_magnitude NUMERIC(14, 6) NOT NULL,
    sigma_multiple NUMERIC(8, 3) NOT NULL,
    bypass_format TEXT NOT NULL DEFAULT 'FP16_HIGH_PRECISION',
    FOREIGN KEY (run_id, recorded_at) REFERENCES quantization_block_runs(run_id, recorded_at) ON DELETE CASCADE
);

-- 4. High-Selectivity Indexes
CREATE INDEX IF NOT EXISTS idx_hybrid_corridors_tenant
    ON hybrid_corridors(tenant_org_id, corridor_code);

CREATE INDEX IF NOT EXISTS idx_quant_runs_tenant_block_time
    ON quantization_block_runs(tenant_org_id, block_index, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_outlier_events_tenant_block
    ON outlier_isolation_events(tenant_org_id, block_index, recorded_at DESC);

-- 5. Strict Row-Level Security (RLS) Policies
ALTER TABLE hybrid_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE quantization_block_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlier_isolation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY hybrid_corridors_tenant_isolation ON hybrid_corridors
    FOR ALL
    USING (tenant_org_id = COALESCE(NULLIF(current_setting('request.jwt.claim.org_id', true), '')::UUID, tenant_org_id))
    WITH CHECK (tenant_org_id = COALESCE(NULLIF(current_setting('request.jwt.claim.org_id', true), '')::UUID, tenant_org_id));

CREATE POLICY quantization_runs_tenant_isolation ON quantization_block_runs
    FOR ALL
    USING (tenant_org_id = COALESCE(NULLIF(current_setting('request.jwt.claim.org_id', true), '')::UUID, tenant_org_id))
    WITH CHECK (tenant_org_id = COALESCE(NULLIF(current_setting('request.jwt.claim.org_id', true), '')::UUID, tenant_org_id));

CREATE POLICY outlier_events_tenant_isolation ON outlier_isolation_events
    FOR ALL
    USING (tenant_org_id = COALESCE(NULLIF(current_setting('request.jwt.claim.org_id', true), '')::UUID, tenant_org_id))
    WITH CHECK (tenant_org_id = COALESCE(NULLIF(current_setting('request.jwt.claim.org_id', true), '')::UUID, tenant_org_id));
