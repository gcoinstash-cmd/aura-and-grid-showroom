-- =============================================================================
-- GF-T3-282 · TRACK 3 SKUNKWORKS ENGINE
-- ULTRA-WIDE DYNAMIC QUANTIZATION CALIBRATION & FP8 WEIGHT-ACTIVATION SCHEMA
-- Clean-Room MIT License · Zero-Trust RLS · Range Partitioned Telemetry
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. QUANTIZATION CORRIDORS REGISTRY
CREATE TABLE IF NOT EXISTS fp8_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_code TEXT NOT NULL UNIQUE,
    display_label TEXT NOT NULL,
    target_format TEXT NOT NULL CHECK (target_format IN ('FP8-E4M3', 'FP8-E5M2', 'BF16-FALLBACK')),
    peak_bandwidth_gbs NUMERIC(12, 2) NOT NULL CHECK (peak_bandwidth_gbs > 0),
    clip_bound NUMERIC(12, 4) NOT NULL,
    scaling_granularity TEXT NOT NULL CHECK (scaling_granularity IN ('PER_TENSOR', 'PER_TOKEN', 'HYBRID_SM_SYNC')),
    tenant_org_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fp8_corridors_tenant ON fp8_corridors (tenant_org_id, corridor_code);

-- 2. STREAMING MULTIPROCESSOR MATRIX ARENAS (M0..M7)
CREATE TABLE IF NOT EXISTS fp8_matrix_arenas (
    matrix_id TEXT PRIMARY KEY,
    corridor_id TEXT NOT NULL REFERENCES fp8_corridors(corridor_id) ON DELETE CASCADE,
    matrix_index SMALLINT NOT NULL CHECK (matrix_index BETWEEN 0 AND 7),
    base_ptr_hex TEXT NOT NULL,
    active_tokens INTEGER NOT NULL CHECK (active_tokens >= 0),
    precision_mode TEXT NOT NULL CHECK (precision_mode IN ('FP8-E4M3', 'FP8-E5M2', 'BF16-PASS')),
    scale_factor NUMERIC(18, 10) NOT NULL CHECK (scale_factor > 0),
    scale_saturation_pct NUMERIC(6, 2) NOT NULL CHECK (scale_saturation_pct BETWEEN 0 AND 100),
    calibration_latency_ms NUMERIC(8, 4) NOT NULL CHECK (calibration_latency_ms >= 0),
    sqnr_db NUMERIC(8, 3) NOT NULL,
    outlier_spike_active BOOLEAN NOT NULL DEFAULT FALSE,
    arena_state TEXT NOT NULL CHECK (arena_state IN ('QUANTIZED · LOCKED', 'CALIBRATING · SYNC', 'FAULT ·SPIKE')),
    tenant_org_id UUID NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (corridor_id, matrix_index)
);

CREATE INDEX IF NOT EXISTS idx_fp8_matrix_arenas_corridor ON fp8_matrix_arenas (corridor_id, matrix_index);
CREATE INDEX IF NOT EXISTS idx_fp8_matrix_arenas_tenant ON fp8_matrix_arenas (tenant_org_id);

-- 3. PARTITIONED CALIBRATION TELEMETRY LEDGER (RANGE PARTITIONED BY RECORDED_AT)
CREATE TABLE IF NOT EXISTS fp8_calibration_ledger (
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    corridor_id TEXT NOT NULL REFERENCES fp8_corridors(corridor_id) ON DELETE RESTRICT,
    matrix_id TEXT NOT NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('QUANT_BURST', 'OUTLIER_SPIKE', 'ACTIVATION_PASS', 'BUFFER_FLUSH', 'SCALE_ROTATION')),
    input_amax NUMERIC(16, 6) NOT NULL,
    computed_scale_inv NUMERIC(18, 8) NOT NULL,
    clipped_elements_count INTEGER NOT NULL CHECK (clipped_elements_count >= 0),
    throughput_gbs NUMERIC(12, 2) NOT NULL,
    latency_us NUMERIC(8, 4) NOT NULL,
    mean_squared_error NUMERIC(18, 12) NOT NULL,
    vector_sample NUMERIC(10, 4)[] NOT NULL,
    tenant_org_id UUID NOT NULL,
    actor_uid UUID NOT NULL,
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS fp8_calibration_ledger_2026_q4
    PARTITION OF fp8_calibration_ledger
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS fp8_calibration_ledger_2027_q1
    PARTITION OF fp8_calibration_ledger
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

CREATE INDEX IF NOT EXISTS idx_fp8_ledger_recorded_corridor
    ON fp8_calibration_ledger (recorded_at DESC, corridor_id);
CREATE INDEX IF NOT EXISTS idx_fp8_ledger_tenant_actor
    ON fp8_calibration_ledger (tenant_org_id, actor_uid);

-- 4. ZERO-TRUST ROW-LEVEL SECURITY (RLS) ENFORCEMENT
ALTER TABLE fp8_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp8_matrix_arenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp8_calibration_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_fp8_corridors_tenant_isolation ON fp8_corridors
    FOR ALL
    TO authenticated
    USING (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID)
    WITH CHECK (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID);

CREATE POLICY rls_fp8_matrix_arenas_tenant_isolation ON fp8_matrix_arenas
    FOR ALL
    TO authenticated
    USING (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID)
    WITH CHECK (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID);

CREATE POLICY rls_fp8_ledger_select_tenant ON fp8_calibration_ledger
    FOR SELECT
    TO authenticated
    USING (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID);

CREATE POLICY rls_fp8_ledger_insert_verified_actor ON fp8_calibration_ledger
    FOR INSERT
    TO authenticated
    WITH CHECK (
        tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::UUID
        AND actor_uid = auth.uid()
    );
