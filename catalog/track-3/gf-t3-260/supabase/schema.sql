-- =============================================================================
-- GF-T3-260: Non-Uniform 1F1B Pipeline Parallelism Persistence Schema
-- PostgreSQL 16 / Supabase Production Schema with Partitioning & Strict RLS
-- Zero-Tolerance Integrity Standard · SPDX-License-Identifier: MIT
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Pipeline Corridors Catalog Table
CREATE TABLE IF NOT EXISTS public.gf_t3_260_corridors (
    corridor_id TEXT PRIMARY KEY,
    mode_tag TEXT NOT NULL CHECK (char_length(mode_tag) BETWEEN 3 AND 64),
    base_throughput_gbs NUMERIC(10, 2) NOT NULL CHECK (base_throughput_gbs > 0),
    interconnect_bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (interconnect_bandwidth_gbs > 0),
    interleaving_degree INTEGER NOT NULL CHECK (interleaving_degree BETWEEN 1 AND 16),
    base_transfer_ms NUMERIC(6, 4) NOT NULL CHECK (base_transfer_ms > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Pipeline Execution Runs Table (Parent for Stage & Telemetry Partitions)
CREATE TABLE IF NOT EXISTS public.gf_t3_260_pipeline_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_uid UUID NOT NULL,
    corridor_id TEXT NOT NULL REFERENCES public.gf_t3_260_corridors(corridor_id) ON DELETE RESTRICT,
    mesh_ptr TEXT NOT NULL DEFAULT '0x8F8DC0',
    throughput_gbs NUMERIC(10, 2) NOT NULL CHECK (throughput_gbs >= 0),
    bubble_latency_us NUMERIC(8, 4) NOT NULL CHECK (bubble_latency_us >= 0),
    bubble_pct NUMERIC(5, 2) NOT NULL CHECK (bubble_pct BETWEEN 0 AND 100),
    active_stages INTEGER NOT NULL DEFAULT 8 CHECK (active_stages BETWEEN 1 AND 64),
    processed_tokens BIGINT NOT NULL DEFAULT 4352000 CHECK (processed_tokens >= 0),
    pipeline_state TEXT NOT NULL DEFAULT '1F1B Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Range-Partitioned Stage Telemetry Snapshots Table (P0..P7)
CREATE TABLE IF NOT EXISTS public.gf_t3_260_stage_telemetry (
    snapshot_id UUID NOT NULL DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.gf_t3_260_pipeline_runs(run_id) ON DELETE CASCADE,
    operator_uid UUID NOT NULL,
    stage_id INTEGER NOT NULL CHECK (stage_id BETWEEN 0 AND 7),
    stage_label TEXT NOT NULL,
    hex_ptr TEXT NOT NULL,
    batch_mode TEXT NOT NULL,
    bubble_pct NUMERIC(5, 2) NOT NULL CHECK (bubble_pct BETWEEN 0 AND 100),
    transfer_ms NUMERIC(6, 4) NOT NULL CHECK (transfer_ms >= 0),
    state_label TEXT NOT NULL,
    inflight_microbatches INTEGER NOT NULL CHECK (inflight_microbatches >= 1),
    activation_memory_mb NUMERIC(10, 2) NOT NULL CHECK (activation_memory_mb > 0),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (snapshot_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS public.gf_t3_260_stage_telemetry_2026_h2
    PARTITION OF public.gf_t3_260_stage_telemetry
    FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS public.gf_t3_260_stage_telemetry_default
    PARTITION OF public.gf_t3_260_stage_telemetry DEFAULT;

-- 4. High-Selectivity B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_gf_t3_260_runs_operator_created
    ON public.gf_t3_260_pipeline_runs (operator_uid, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gf_t3_260_runs_corridor
    ON public.gf_t3_260_pipeline_runs (corridor_id);

CREATE INDEX IF NOT EXISTS idx_gf_t3_260_stage_run_stage
    ON public.gf_t3_260_stage_telemetry (run_id, stage_id, recorded_at DESC);

-- 5. Strict Row-Level Security (RLS) Enforcement
ALTER TABLE public.gf_t3_260_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_260_pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_260_stage_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access to synthetic corridors"
    ON public.gf_t3_260_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Operators view only own pipeline runs"
    ON public.gf_t3_260_pipeline_runs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = operator_uid);

CREATE POLICY "Operators insert only own pipeline runs"
    ON public.gf_t3_260_pipeline_runs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = operator_uid);

CREATE POLICY "Operators view only own stage telemetry"
    ON public.gf_t3_260_stage_telemetry
    FOR SELECT
    TO authenticated
    USING (auth.uid() = operator_uid);

CREATE POLICY "Operators insert only own stage telemetry"
    ON public.gf_t3_260_stage_telemetry
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = operator_uid);

-- 6. Seed Default Synthetic Pipeline Corridors
INSERT INTO public.gf_t3_260_corridors (
    corridor_id,
    mode_tag,
    base_throughput_gbs,
    interconnect_bandwidth_gbs,
    interleaving_degree,
    base_transfer_ms
) VALUES
    ('PIPE-CORRIDOR-ALPHA (1F1B-MICRO-BATCH-SCHEDULING-FABRIC · 22600-GB/S)', 'PIPELINE_PARALLEL', 22600.00, 900.00, 2, 0.0200),
    ('PIPE-CORRIDOR-BRAVO (INTERLEAVED-STAGE-MEMORY-BALANCER)', 'INTERLEAVED_1F1B', 24100.00, 960.00, 4, 0.0150),
    ('PIPE-CORRIDOR-GAMMA (NVLINK-P2P-TENSOR-TRANSFER-ENGINE)', 'P2P_DIRECT_FABRIC', 25400.00, 1120.00, 2, 0.0100),
    ('PIPE-CORRIDOR-DELTA (FALLBACK-SYNCHRONOUS-PASS)', 'SYNC_1F1B_GUARD', 16800.00, 640.00, 1, 0.0500)
ON CONFLICT (corridor_id) DO NOTHING;
