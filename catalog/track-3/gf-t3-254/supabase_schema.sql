-- ============================================================================
-- GF-T3-254: SUPABASE / POSTGRESQL PRODUCTION SCHEMA
-- FP8 Quantization & Dynamic Scaling Factor Calibration Ledger
-- Features: Partitioned Tables, Foreign Keys, B-Tree/BRIN Indexes, Strict RLS
-- Zero-Dollar Gate Verified
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic FP8 Corridors Reference Table
CREATE TABLE IF NOT EXISTS fp8_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_label TEXT NOT NULL,
    precision_format TEXT NOT NULL CHECK (precision_format IN ('FP8', 'BF16')),
    target_throughput_gbps NUMERIC(10, 2) NOT NULL CHECK (target_throughput_gbps > 0),
    calibration_latency_us NUMERIC(8, 4) NOT NULL DEFAULT 0.0100,
    outlier_z_threshold NUMERIC(6, 3) NOT NULL DEFAULT 3.000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Scale Matrix Channel State Table (S0..S7)
CREATE TABLE IF NOT EXISTS fp8_scale_channels (
    scale_id TEXT PRIMARY KEY CHECK (scale_id IN ('S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7')),
    corridor_id TEXT NOT NULL REFERENCES fp8_corridors(corridor_id) ON DELETE RESTRICT,
    pointer_hex TEXT NOT NULL UNIQUE,
    scale_factor NUMERIC(10, 4) NOT NULL DEFAULT 1.0000,
    bits_format TEXT NOT NULL DEFAULT 'FP8',
    outlier_ratio_pct NUMERIC(6, 3) NOT NULL DEFAULT 0.020,
    latency_ms NUMERIC(8, 4) NOT NULL DEFAULT 0.0500,
    accuracy_pct NUMERIC(5, 2) NOT NULL DEFAULT 99.90,
    clipping_threshold NUMERIC(12, 4) NOT NULL DEFAULT 448.0000,
    state_status TEXT NOT NULL CHECK (state_status IN ('QUANTIZED', 'FAULT', 'RECALIBRATING')),
    is_locked BOOLEAN NOT NULL DEFAULT TRUE,
    owner_uid UUID NOT NULL DEFAULT auth.uid(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Partitioned Telemetry Calibration Passes Table (Range Partitioned by recorded_at)
CREATE TABLE IF NOT EXISTS fp8_calibration_telemetry (
    telemetry_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scale_id TEXT NOT NULL REFERENCES fp8_scale_channels(scale_id) ON DELETE CASCADE,
    corridor_id TEXT NOT NULL REFERENCES fp8_corridors(corridor_id) ON DELETE RESTRICT,
    computed_scale NUMERIC(10, 4) NOT NULL,
    amax_raw NUMERIC(12, 4) NOT NULL,
    amax_clipped NUMERIC(12, 4) NOT NULL,
    outlier_pct NUMERIC(6, 3) NOT NULL,
    throughput_gbps NUMERIC(10, 2) NOT NULL,
    processed_tokens BIGINT NOT NULL DEFAULT 3584000,
    operator_uid UUID NOT NULL DEFAULT auth.uid(),
    PRIMARY KEY (telemetry_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS fp8_calibration_telemetry_2026_q4
    PARTITION OF fp8_calibration_telemetry
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS fp8_calibration_telemetry_default
    PARTITION OF fp8_calibration_telemetry DEFAULT;

-- 4. High-Speed Indexes
CREATE INDEX IF NOT EXISTS idx_fp8_scale_channels_corridor ON fp8_scale_channels(corridor_id);
CREATE INDEX IF NOT EXISTS idx_fp8_scale_channels_state ON fp8_scale_channels(state_status, is_locked);
CREATE INDEX IF NOT EXISTS idx_fp8_telemetry_recorded_brin ON fp8_calibration_telemetry USING BRIN (recorded_at);
CREATE INDEX IF NOT EXISTS idx_fp8_telemetry_scale_id ON fp8_calibration_telemetry(scale_id, recorded_at DESC);

-- 5. Strict Row-Level Security (RLS) Policies
ALTER TABLE fp8_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp8_scale_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp8_calibration_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY fp8_corridors_read_authenticated
    ON fp8_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY fp8_scale_channels_owner_select
    ON fp8_scale_channels
    FOR SELECT
    TO authenticated
    USING (auth.uid() = owner_uid);

CREATE POLICY fp8_scale_channels_owner_modify
    ON fp8_scale_channels
    FOR ALL
    TO authenticated
    USING (auth.uid() = owner_uid)
    WITH CHECK (auth.uid() = owner_uid);

CREATE POLICY fp8_telemetry_operator_select
    ON fp8_calibration_telemetry
    FOR SELECT
    TO authenticated
    USING (auth.uid() = operator_uid);

CREATE POLICY fp8_telemetry_operator_insert
    ON fp8_calibration_telemetry
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = operator_uid);

-- 6. Seed Clean-Room Synthetic FP8 Corridors
INSERT INTO fp8_corridors (corridor_id, corridor_label, precision_format, target_throughput_gbps, calibration_latency_us, outlier_z_threshold)
VALUES
    ('FP8-CORRIDOR-ALPHA', 'FP8-CORRIDOR-ALPHA (DYNAMIC-SCALING-FACTOR-CALIBRATION · 16500-GB/S)', 'FP8', 16500.00, 0.0100, 3.000),
    ('FP8-CORRIDOR-BRAVO', 'FP8-CORRIDOR-BRAVO (OUTLIER-AWARE-PER-TOKEN-QUANTIZATION)', 'FP8', 15840.00, 0.0100, 2.500),
    ('FP8-CORRIDOR-GAMMA', 'FP8-CORRIDOR-GAMMA (HARDWARE-TENSOR-CORE-ACCELERATION)', 'FP8', 18200.00, 0.0100, 3.200),
    ('FP8-CORRIDOR-DELTA', 'FP8-CORRIDOR-DELTA (FALLBACK-BF16-PRECISION-WEIGHTS)', 'BF16', 9400.00, 0.0300, 4.000)
ON CONFLICT (corridor_id) DO NOTHING;
