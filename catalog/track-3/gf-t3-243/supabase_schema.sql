-- ============================================================================
-- GF-T3-243 PRODUCTION POSTGRESQL / SUPABASE SCHEMA
-- FP6 / E3M2 TERNARY QUANTIZATION & OUTLIER-AWARE VECTOR CALIBRATION
-- SPDX-License-Identifier: MIT
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic Corridor Registry Table
CREATE TABLE IF NOT EXISTS public.gf_t3_243_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_code TEXT NOT NULL UNIQUE,
    format_family TEXT NOT NULL CHECK (format_family IN ('FP6_E3M2', 'FP6_TERNARY', 'E3M2_OUTLIER', 'FP8_FALLBACK')),
    target_bandwidth_gbps INTEGER NOT NULL DEFAULT 8000 CHECK (target_bandwidth_gbps > 0),
    calibration_sla_us NUMERIC(8, 4) NOT NULL DEFAULT 0.0100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Partitioned Quantization Block Calibration Ledger (Partitioned by Range on calibrated_at)
CREATE TABLE IF NOT EXISTS public.gf_t3_243_block_calibrations (
    calibration_id UUID NOT NULL DEFAULT gen_random_uuid(),
    corridor_id UUID NOT NULL REFERENCES public.gf_t3_243_corridors(corridor_id) ON DELETE RESTRICT,
    operator_uid UUID NOT NULL,
    block_index SMALLINT NOT NULL CHECK (block_index BETWEEN 0 AND 15),
    block_code TEXT NOT NULL,
    pointer_hex TEXT NOT NULL,
    format_tag TEXT NOT NULL,
    gamma_scale NUMERIC(10, 6) NOT NULL CHECK (gamma_scale > 0),
    outlier_channels_count SMALLINT NOT NULL CHECK (outlier_channels_count >= 0),
    relative_error_pct NUMERIC(8, 4) NOT NULL CHECK (relative_error_pct >= 0),
    sqnr_db NUMERIC(8, 2) NOT NULL,
    compression_ratio NUMERIC(6, 2) NOT NULL CHECK (compression_ratio >= 1.0),
    calibrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (calibration_id, calibrated_at)
) PARTITION BY RANGE (calibrated_at);

CREATE TABLE IF NOT EXISTS public.gf_t3_243_block_calibrations_2026_q4
    PARTITION OF public.gf_t3_243_block_calibrations
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS public.gf_t3_243_block_calibrations_2027_q1
    PARTITION OF public.gf_t3_243_block_calibrations
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

-- 3. SIEM & APA Transaction Audit Log Table (SOC2 & GDPR Compliant)
CREATE TABLE IF NOT EXISTS public.gf_t3_243_siem_audit_logs (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_uid UUID NOT NULL,
    event_category TEXT NOT NULL CHECK (event_category IN ('CALIBRATION_PASS', 'OUTLIER_SPIKE', 'BUFFER_FLUSH', 'APA_ARCHIVE_EXPORT', 'TRANSFER_ERROR_ALERT')),
    corridor_code TEXT NOT NULL,
    sha256_manifest_digest TEXT NOT NULL,
    pgp_signature_verified BOOLEAN NOT NULL DEFAULT TRUE,
    sftp_transfer_status TEXT NOT NULL DEFAULT 'VERIFIED',
    active_blocks SMALLINT NOT NULL DEFAULT 16,
    processed_tokens BIGINT NOT NULL DEFAULT 2176000,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. High-Selectivity Indexes
CREATE INDEX IF NOT EXISTS idx_gf_t3_243_calibrations_corridor_block
    ON public.gf_t3_243_block_calibrations (corridor_id, block_index, calibrated_at DESC);

CREATE INDEX IF NOT EXISTS idx_gf_t3_243_calibrations_operator
    ON public.gf_t3_243_block_calibrations (operator_uid, calibrated_at DESC);

CREATE INDEX IF NOT EXISTS idx_gf_t3_243_siem_recorded_at
    ON public.gf_t3_243_siem_audit_logs (recorded_at DESC, event_category);

-- 5. Strict Row-Level Security (RLS) Policies
ALTER TABLE public.gf_t3_243_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_243_block_calibrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_243_siem_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Corridors readable by authenticated operators"
    ON public.gf_t3_243_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Operators view own calibration partitions"
    ON public.gf_t3_243_block_calibrations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = operator_uid);

CREATE POLICY "Operators insert own calibration partitions"
    ON public.gf_t3_243_block_calibrations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = operator_uid);

CREATE POLICY "Operators view own SIEM audit records"
    ON public.gf_t3_243_siem_audit_logs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = operator_uid);

CREATE POLICY "Operators append own SIEM audit records"
    ON public.gf_t3_243_siem_audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = operator_uid);
