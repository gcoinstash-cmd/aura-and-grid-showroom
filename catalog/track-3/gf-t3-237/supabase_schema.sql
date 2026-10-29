-- ============================================================================
-- GF-T3-237: Track 3 FP8 Quantization Scale & Dynamic Block Calibration Schema
-- Database Engine: PostgreSQL 16 / Supabase
-- Architecture: Range-Partitioned Telemetry Tables + Foreign Keys + Strict RLS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic FP8 Corridors Registry Table
CREATE TABLE IF NOT EXISTS public.fp8_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_code TEXT NOT NULL UNIQUE CHECK (
        corridor_code IN (
            'FP8-CORRIDOR-ALPHA (DYNAMIC-BLOCK-E4M3-SCALE · 3400-GB/S)',
            'FP8-CORRIDOR-BRAVO (OUTLIER-CHANNEL-ISOLATION-PASS)',
            'FP8-CORRIDOR-GAMMA (E5M2-DYNAMIC-RANGE-CALIBRATION)',
            'FP8-CORRIDOR-DELTA (FALLBACK-FP16-PRECISION-PASS)'
        )
    ),
    default_format TEXT NOT NULL CHECK (default_format IN ('E4M3', 'E5M2')),
    target_bandwidth_gbs NUMERIC(10, 2) NOT NULL DEFAULT 3400.00,
    max_latency_us NUMERIC(10, 4) NOT NULL DEFAULT 0.0700,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Calibration Sessions Table (Tenant / Operator Scoped)
CREATE TABLE IF NOT EXISTS public.fp8_calibration_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_uid UUID NOT NULL,
    corridor_id UUID NOT NULL REFERENCES public.fp8_corridors(corridor_id) ON DELETE RESTRICT,
    active_blocks INTEGER NOT NULL DEFAULT 16 CHECK (active_blocks BETWEEN 1 AND 16),
    processed_tokens_units BIGINT NOT NULL DEFAULT 1408000 CHECK (processed_tokens_units >= 0),
    fp8_state TEXT NOT NULL DEFAULT 'E4M3 Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fp8_sessions_operator
    ON public.fp8_calibration_sessions (operator_uid, created_at DESC);

-- 3. Range-Partitioned Block Calibration Telemetry Table
CREATE TABLE IF NOT EXISTS public.fp8_block_telemetry (
    telemetry_id UUID NOT NULL DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.fp8_calibration_sessions(session_id) ON DELETE CASCADE,
    operator_uid UUID NOT NULL,
    block_index INTEGER NOT NULL CHECK (block_index BETWEEN 0 AND 15),
    format_mode TEXT NOT NULL CHECK (format_mode IN ('E4M3', 'E5M2')),
    memory_pointer TEXT NOT NULL,
    scaling_factor NUMERIC(14, 6) NOT NULL CHECK (scaling_factor > 0),
    quant_error_margin NUMERIC(14, 6) NOT NULL CHECK (quant_error_margin >= 0),
    clip_error_ratio NUMERIC(10, 6) NOT NULL CHECK (clip_error_ratio BETWEEN 0 AND 1),
    outlier_count INTEGER NOT NULL DEFAULT 0 CHECK (outlier_count >= 0),
    sqnr_db NUMERIC(10, 2) NOT NULL,
    scale_vector JSONB NOT NULL DEFAULT '[]'::jsonb,
    calibration_state TEXT NOT NULL CHECK (calibration_state IN ('CALIBRATED', 'ISOLATED', 'RESYNC_REQUIRED')),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (telemetry_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Monthly / Annual Range Partitions for High-Throughput Telemetry Ingestion
CREATE TABLE IF NOT EXISTS public.fp8_block_telemetry_y2026m10
    PARTITION OF public.fp8_block_telemetry
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS public.fp8_block_telemetry_y2026m11
    PARTITION OF public.fp8_block_telemetry
    FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS public.fp8_block_telemetry_default
    PARTITION OF public.fp8_block_telemetry DEFAULT;

CREATE INDEX IF NOT EXISTS idx_fp8_block_telemetry_session_block
    ON public.fp8_block_telemetry (session_id, block_index, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_fp8_block_telemetry_operator
    ON public.fp8_block_telemetry (operator_uid, recorded_at DESC);

-- 4. Strict Row-Level Security (RLS) Policies
ALTER TABLE public.fp8_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fp8_calibration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fp8_block_telemetry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Corridors readable by authenticated operators" ON public.fp8_corridors;
CREATE POLICY "Corridors readable by authenticated operators"
    ON public.fp8_corridors
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Operators manage own calibration sessions" ON public.fp8_calibration_sessions;
CREATE POLICY "Operators manage own calibration sessions"
    ON public.fp8_calibration_sessions
    FOR ALL
    TO authenticated
    USING (auth.uid() = operator_uid)
    WITH CHECK (auth.uid() = operator_uid);

DROP POLICY IF EXISTS "Operators access own partitioned block telemetry" ON public.fp8_block_telemetry;
CREATE POLICY "Operators access own partitioned block telemetry"
    ON public.fp8_block_telemetry
    FOR ALL
    TO authenticated
    USING (auth.uid() = operator_uid)
    WITH CHECK (auth.uid() = operator_uid);
