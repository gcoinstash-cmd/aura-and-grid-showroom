-- =============================================================================
-- GF-T3-225 — Production PostgreSQL / Supabase Persistence Schema
-- Features: Range-Partitioned Telemetry Tables, Foreign Keys, Composite Indexes,
-- and Strict Row-Level Security (RLS) Policies.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Precision Corridor Registry Table
CREATE TABLE IF NOT EXISTS public.gf_t3_225_corridors (
    corridor_code TEXT PRIMARY KEY,
    weight_format TEXT NOT NULL CHECK (weight_format IN ('E4M3', 'E5M2')),
    activation_format TEXT NOT NULL CHECK (activation_format IN ('E4M3', 'E5M2')),
    accumulator_format TEXT NOT NULL DEFAULT 'FP32' CHECK (accumulator_format = 'FP32'),
    default_scaling_mode TEXT NOT NULL CHECK (default_scaling_mode IN ('DYNAMIC_BLOCK', 'STATIC_TENSOR')),
    max_representable_val NUMERIC(12, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.gf_t3_225_corridors (
    corridor_code, weight_format, activation_format, accumulator_format, default_scaling_mode, max_representable_val
) VALUES
    ('FP8-CORRIDOR-ALPHA (E4M3-WEIGHTS · E4M3-ACTIVATIONS · DYNAMIC-BLOCK)', 'E4M3', 'E4M3', 'FP32', 'DYNAMIC_BLOCK', 448.0000),
    ('FP8-CORRIDOR-BRAVO (E5M2-EXPONENT-WIDE · OUTLIER-DAMPENED)', 'E5M2', 'E5M2', 'FP32', 'DYNAMIC_BLOCK', 57344.0000),
    ('FP8-CORRIDOR-GAMMA (DUAL-FORMAT-HYBRID · FP32-ACCUMULATION)', 'E4M3', 'E5M2', 'FP32', 'DYNAMIC_BLOCK', 448.0000),
    ('FP8-CORRIDOR-DELTA (PER-TOKEN-MICRONORM-FALLBACK)', 'E4M3', 'E4M3', 'FP32', 'STATIC_TENSOR', 448.0000)
ON CONFLICT (corridor_code) DO NOTHING;

-- 2. Partitioned GEMM Execution Runs Table (Partitioned by executed_at)
CREATE TABLE IF NOT EXISTS public.gf_t3_225_gemm_runs (
    run_id UUID NOT NULL DEFAULT gen_random_uuid(),
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_id UUID NOT NULL,
    corridor_code TEXT NOT NULL REFERENCES public.gf_t3_225_corridors(corridor_code) ON DELETE RESTRICT,
    scaling_mode TEXT NOT NULL CHECK (scaling_mode IN ('DYNAMIC_BLOCK', 'STATIC_TENSOR')),
    format_a TEXT NOT NULL CHECK (format_a IN ('E4M3', 'E5M2')),
    format_b TEXT NOT NULL CHECK (format_b IN ('E4M3', 'E5M2')),
    matrix_dim_m INTEGER NOT NULL CHECK (matrix_dim_m > 0 AND matrix_dim_m <= 16384),
    matrix_dim_k INTEGER NOT NULL CHECK (matrix_dim_k > 0 AND matrix_dim_k <= 16384),
    matrix_dim_n INTEGER NOT NULL CHECK (matrix_dim_n > 0 AND matrix_dim_n <= 16384),
    compute_tflops NUMERIC(10, 2) NOT NULL,
    gemm_latency_ms NUMERIC(10, 4) NOT NULL,
    dequant_overhead_ms NUMERIC(10, 4) NOT NULL,
    snr_parity_pct NUMERIC(6, 3) NOT NULL CHECK (snr_parity_pct >= 0 AND snr_parity_pct <= 100),
    snr_db NUMERIC(8, 2) NOT NULL,
    memory_reduction_pct NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
    outlier_spike_active BOOLEAN NOT NULL DEFAULT FALSE,
    clipped_elements_count INTEGER NOT NULL DEFAULT 0,
    scales_a_json JSONB NOT NULL,
    scales_b_json JSONB NOT NULL,
    PRIMARY KEY (run_id, executed_at)
) PARTITION BY RANGE (executed_at);

-- Time-Range Partitions for High-Throughput Telemetry Ingestion
CREATE TABLE IF NOT EXISTS public.gf_t3_225_gemm_runs_2026_q4
    PARTITION OF public.gf_t3_225_gemm_runs
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS public.gf_t3_225_gemm_runs_2027_q1
    PARTITION OF public.gf_t3_225_gemm_runs
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

-- 3. Microscaling Tile Bit-Inspection Audit Table
CREATE TABLE IF NOT EXISTS public.gf_t3_225_tile_telemetry (
    tile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL,
    run_executed_at TIMESTAMPTZ NOT NULL,
    tenant_id UUID NOT NULL,
    operand_matrix TEXT NOT NULL CHECK (operand_matrix IN ('MATRIX_A', 'MATRIX_B')),
    row_idx INTEGER NOT NULL CHECK (row_idx >= 0),
    col_idx INTEGER NOT NULL CHECK (col_idx >= 0),
    sign_bit SMALLINT NOT NULL CHECK (sign_bit IN (0, 1)),
    exponent_bits VARCHAR(5) NOT NULL,
    mantissa_bits VARCHAR(3) NOT NULL,
    fp8_bitstring CHAR(8) NOT NULL,
    local_scale_factor NUMERIC(16, 6) NOT NULL,
    raw_fp32_val NUMERIC(16, 6) NOT NULL,
    quantized_fp8_val NUMERIC(16, 6) NOT NULL,
    post_accum_fp32_val NUMERIC(18, 6) NOT NULL,
    FOREIGN KEY (run_id, run_executed_at)
        REFERENCES public.gf_t3_225_gemm_runs (run_id, executed_at)
        ON DELETE CASCADE
);

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_gf_t3_225_runs_tenant_time
    ON public.gf_t3_225_gemm_runs (tenant_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_gf_t3_225_runs_corridor_snr
    ON public.gf_t3_225_gemm_runs (corridor_code, snr_parity_pct DESC);

CREATE INDEX IF NOT EXISTS idx_gf_t3_225_tiles_run_coord
    ON public.gf_t3_225_tile_telemetry (run_id, operand_matrix, row_idx, col_idx);

-- 5. Strict Row-Level Security (RLS) Policies
ALTER TABLE public.gf_t3_225_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_225_gemm_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_225_tile_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access to precision corridors"
    ON public.gf_t3_225_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Tenant isolation on GEMM execution runs SELECT"
    ON public.gf_t3_225_gemm_runs
    FOR SELECT
    TO authenticated
    USING (tenant_id = auth.uid());

CREATE POLICY "Tenant isolation on GEMM execution runs INSERT"
    ON public.gf_t3_225_gemm_runs
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Tenant isolation on tile bit-inspection SELECT"
    ON public.gf_t3_225_tile_telemetry
    FOR SELECT
    TO authenticated
    USING (tenant_id = auth.uid());

CREATE POLICY "Tenant isolation on tile bit-inspection INSERT"
    ON public.gf_t3_225_tile_telemetry
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_id = auth.uid());
