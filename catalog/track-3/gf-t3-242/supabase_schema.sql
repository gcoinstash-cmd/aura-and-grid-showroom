-- ============================================================================
-- GF-T3-242 PRODUCTION POSTGRESQL / SUPABASE SCHEMA
-- FP4 / INT4 Mixed-Precision Block Quantization & Outlier Calibration Vault
-- Features: Partitioned Tables, Foreign Keys, B-Tree/BRIN Indexes, Strict RLS
-- Zero-Dollar Gate: Enforced across all column names and constraints
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic Corridor Profiles Table
CREATE TABLE IF NOT EXISTS gf_t3_242_corridors (
    corridor_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL UNIQUE,
    bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (bandwidth_gbs > 0),
    base_latency_us NUMERIC(10, 4) NOT NULL CHECK (base_latency_us > 0),
    outlier_sigma_gate NUMERIC(5, 3) NOT NULL DEFAULT 2.500,
    default_format TEXT NOT NULL CHECK (default_format IN ('FP4_E2M1', 'INT4_SYM')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Quantization Calibration Sessions Table
CREATE TABLE IF NOT EXISTS gf_t3_242_calibration_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_uid UUID NOT NULL,
    corridor_id TEXT NOT NULL REFERENCES gf_t3_242_corridors(corridor_id) ON DELETE RESTRICT,
    active_blocks INTEGER NOT NULL DEFAULT 16 CHECK (active_blocks BETWEEN 1 AND 16),
    processed_tokens_units BIGINT NOT NULL DEFAULT 2048000 CHECK (processed_tokens_units >= 0),
    fp4_state TEXT NOT NULL DEFAULT 'INT4-FP4 Active',
    mean_sqnr_db NUMERIC(8, 3) NOT NULL DEFAULT 38.400,
    key_epoch_id TEXT NOT NULL DEFAULT 'EPOCH-2026-Q4-ROT-01',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_t3_242_sessions_operator
    ON gf_t3_242_calibration_sessions(operator_uid, created_at DESC);

-- 3. Partitioned Block Quantization Telemetry Table (Partitioned by Range on recorded_at)
CREATE TABLE IF NOT EXISTS gf_t3_242_block_telemetry (
    telemetry_id UUID NOT NULL DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES gf_t3_242_calibration_sessions(session_id) ON DELETE CASCADE,
    operator_uid UUID NOT NULL,
    block_index SMALLINT NOT NULL CHECK (block_index BETWEEN 0 AND 15),
    block_label TEXT NOT NULL,
    pointer_hex TEXT NOT NULL,
    quant_format TEXT NOT NULL CHECK (quant_format IN ('FP4_E2M1', 'INT4_SYM')),
    scale_factor NUMERIC(10, 6) NOT NULL CHECK (scale_factor > 0),
    outlier_channels SMALLINT NOT NULL CHECK (outlier_channels >= 0),
    relative_error_pct NUMERIC(6, 3) NOT NULL CHECK (relative_error_pct >= 0),
    sqnr_db NUMERIC(8, 3) NOT NULL,
    calibration_state TEXT NOT NULL DEFAULT 'CALIBRATED',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (telemetry_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS gf_t3_242_block_telemetry_2026_q4
    PARTITION OF gf_t3_242_block_telemetry
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS gf_t3_242_block_telemetry_default
    PARTITION OF gf_t3_242_block_telemetry DEFAULT;

CREATE INDEX IF NOT EXISTS idx_gf_t3_242_block_telemetry_session
    ON gf_t3_242_block_telemetry(session_id, block_index);

CREATE INDEX IF NOT EXISTS idx_gf_t3_242_block_telemetry_brin
    ON gf_t3_242_block_telemetry USING BRIN (recorded_at);

-- 4. Encrypted Pit-Wall Audit Logs Table
CREATE TABLE IF NOT EXISTS gf_t3_242_audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES gf_t3_242_calibration_sessions(session_id) ON DELETE SET NULL,
    operator_uid UUID NOT NULL,
    callsign TEXT NOT NULL CHECK (callsign IN ('CREW CHIEF', 'PIT WALL', 'TELEMETRY')),
    encrypted_payload_b64 TEXT NOT NULL,
    key_epoch_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STRICT ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE gf_t3_242_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_242_calibration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_242_block_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_242_audit_logs ENABLE ROW LEVEL SECURITY;

-- Corridors are readable by authenticated operators
CREATE POLICY gf_t3_242_corridors_read_policy
    ON gf_t3_242_corridors
    FOR SELECT
    TO authenticated
    USING (true);

-- Calibration sessions isolated strictly to owning operator_uid
CREATE POLICY gf_t3_242_sessions_owner_select
    ON gf_t3_242_calibration_sessions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = operator_uid);

CREATE POLICY gf_t3_242_sessions_owner_insert
    ON gf_t3_242_calibration_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = operator_uid);

-- Partitioned block telemetry isolated strictly to owning operator_uid
CREATE POLICY gf_t3_242_telemetry_owner_select
    ON gf_t3_242_block_telemetry
    FOR SELECT
    TO authenticated
    USING (auth.uid() = operator_uid);

CREATE POLICY gf_t3_242_telemetry_owner_insert
    ON gf_t3_242_block_telemetry
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = operator_uid);

-- Encrypted audit logs isolated strictly to owning operator_uid
CREATE POLICY gf_t3_242_audit_owner_select
    ON gf_t3_242_audit_logs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = operator_uid);

CREATE POLICY gf_t3_242_audit_owner_insert
    ON gf_t3_242_audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = operator_uid);

-- Seed Synthetic Clean-Room Corridors
INSERT INTO gf_t3_242_corridors (corridor_id, display_name, bandwidth_gbs, base_latency_us, outlier_sigma_gate, default_format)
VALUES
    ('ALPHA', 'FP4-CORRIDOR-ALPHA (MIXED-PRECISION-BLOCK-QUANT · 7200-GB/S)', 7200.00, 0.0200, 2.650, 'FP4_E2M1'),
    ('BRAVO', 'FP4-CORRIDOR-BRAVO (OUTLIER-AWARE-SCALE-CALIBRATION)', 6840.00, 0.0180, 2.350, 'FP4_E2M1'),
    ('GAMMA', 'FP4-CORRIDOR-GAMMA (INT4-FP4-HYBRID-WEIGHT-SHARDING)', 7420.00, 0.0210, 2.750, 'INT4_SYM'),
    ('DELTA', 'FP4-CORRIDOR-DELTA (FALLBACK-FP8-PRECISION-PASS)', 6400.00, 0.0250, 3.000, 'FP4_E2M1')
ON CONFLICT (corridor_id) DO NOTHING;
