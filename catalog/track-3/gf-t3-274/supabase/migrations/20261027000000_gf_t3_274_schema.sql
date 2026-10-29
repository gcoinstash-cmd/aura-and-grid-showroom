-- GF-T3-274 Production PostgreSQL / Supabase Persistence Schema
-- Clean-Room MIT / Apache-2.0 Sovereign Database Layer

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Rolling Context Corridors Registry
CREATE TABLE IF NOT EXISTS public.gf_t3_274_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_label TEXT NOT NULL,
    base_throughput_gbs INTEGER NOT NULL CHECK (base_throughput_gbs > 0),
    base_eviction_latency_us NUMERIC(6, 3) NOT NULL CHECK (base_eviction_latency_us > 0),
    max_sliding_threshold_k INTEGER NOT NULL CHECK (max_sliding_threshold_k >= 64),
    segment_capacity_k INTEGER NOT NULL CHECK (segment_capacity_k >= 64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Partitioned Rolling Arena Segments Telemetry Table
CREATE TABLE IF NOT EXISTS public.gf_t3_274_segment_events (
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    corridor_id TEXT NOT NULL REFERENCES public.gf_t3_274_corridors(corridor_id) ON DELETE CASCADE,
    segment_index SMALLINT NOT NULL CHECK (segment_index BETWEEN 0 AND 7),
    hex_pointer TEXT NOT NULL,
    current_tokens_k INTEGER NOT NULL CHECK (current_tokens_k >= 0),
    evicted_tokens_k INTEGER NOT NULL CHECK (evicted_tokens_k >= 0),
    utilization_pct NUMERIC(5, 2) NOT NULL CHECK (utilization_pct BETWEEN 0 AND 100),
    latency_ms NUMERIC(6, 3) NOT NULL CHECK (latency_ms >= 0),
    zero_oom_verified BOOLEAN NOT NULL DEFAULT TRUE,
    operator_uid UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS public.gf_t3_274_segment_events_2026_q4
    PARTITION OF public.gf_t3_274_segment_events
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE INDEX IF NOT EXISTS idx_gf_t3_274_events_corridor_time
    ON public.gf_t3_274_segment_events (corridor_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_gf_t3_274_events_segment_ptr
    ON public.gf_t3_274_segment_events (segment_index, hex_pointer);

-- 3. Strict Row-Level Security (RLS) Policies
ALTER TABLE public.gf_t3_274_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_274_segment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access on corridors"
    ON public.gf_t3_274_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enforce tenant isolation on rolling segment telemetry"
    ON public.gf_t3_274_segment_events
    FOR ALL
    TO authenticated
    USING (auth.uid() = operator_uid)
    WITH CHECK (auth.uid() = operator_uid);
