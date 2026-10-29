-- GF-T3-270: Ultra-Wide Context Ring Attention & Hierarchical KV-Cache Compression Engine
-- Production PostgreSQL / Supabase Persistence Schema with Partitioned Tables & Row-Level Security (RLS)
-- Clean-Room MIT Permissive License · Zero Currency Symbols

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Ring Corridors Registry Table
CREATE TABLE IF NOT EXISTS public.gf_t3_270_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_label TEXT NOT NULL UNIQUE,
    bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (bandwidth_gbs > 0),
    base_latency_us NUMERIC(8, 4) NOT NULL CHECK (base_latency_us > 0),
    default_quant_mode TEXT NOT NULL CHECK (default_quant_mode IN ('INT-4', 'INT-8', 'FP8', 'FP16')),
    window_count INTEGER NOT NULL DEFAULT 8 CHECK (window_count BETWEEN 1 AND 64),
    tenant_uid UUID NOT NULL DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Window Arena States Table (Foreign Key to Corridors)
CREATE TABLE IF NOT EXISTS public.gf_t3_270_window_arenas (
    arena_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id TEXT NOT NULL REFERENCES public.gf_t3_270_corridors(corridor_id) ON DELETE CASCADE,
    window_index INTEGER NOT NULL CHECK (window_index BETWEEN 0 AND 7),
    window_code TEXT NOT NULL,
    hex_pointer TEXT NOT NULL,
    allocated_tokens BIGINT NOT NULL CHECK (allocated_tokens >= 0),
    compression_tier TEXT NOT NULL CHECK (compression_tier IN ('INT-4', 'INT-8', 'FP8', 'FP16')),
    sync_latency_ms NUMERIC(8, 4) NOT NULL CHECK (sync_latency_ms >= 0),
    ring_lock_state TEXT NOT NULL CHECK (ring_lock_state IN ('CIRCULAR · LOCKED', 'FAULT · KV-SPIKE', 'STANDBY · IDLE')),
    lse_accumulator NUMERIC(12, 6) NOT NULL DEFAULT 3.210000,
    tenant_uid UUID NOT NULL DEFAULT auth.uid(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (corridor_id, window_index)
);

-- 3. Range-Partitioned Ring Attention Telemetry Audit Ledger
CREATE TABLE IF NOT EXISTS public.gf_t3_270_telemetry_events (
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    corridor_id TEXT NOT NULL REFERENCES public.gf_t3_270_corridors(corridor_id) ON DELETE RESTRICT,
    cyclic_step BIGINT NOT NULL CHECK (cyclic_step >= 0),
    attention_throughput_gbs NUMERIC(10, 2) NOT NULL,
    ring_sync_latency_us NUMERIC(8, 4) NOT NULL,
    processed_tokens_units BIGINT NOT NULL,
    kv_compression_ratio NUMERIC(8, 2) NOT NULL,
    callsign TEXT NOT NULL CHECK (callsign IN ('CREW CHIEF', 'TELEMETRY', 'PIT WALL')),
    log_payload TEXT NOT NULL,
    tenant_uid UUID NOT NULL DEFAULT auth.uid(),
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS public.gf_t3_270_telemetry_events_2026_q4
    PARTITION OF public.gf_t3_270_telemetry_events
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS public.gf_t3_270_telemetry_events_default
    PARTITION OF public.gf_t3_270_telemetry_events DEFAULT;

-- 4. High-Selectivity B-Tree & BRIN Indexes
CREATE INDEX IF NOT EXISTS idx_gf_t3_270_arenas_corridor
    ON public.gf_t3_270_window_arenas (corridor_id, window_index);

CREATE INDEX IF NOT EXISTS idx_gf_t3_270_telemetry_recorded_brin
    ON public.gf_t3_270_telemetry_events USING BRIN (recorded_at);

CREATE INDEX IF NOT EXISTS idx_gf_t3_270_telemetry_tenant
    ON public.gf_t3_270_telemetry_events (tenant_uid, corridor_id);

-- 5. Strict Row-Level Security (RLS) Enforcement
ALTER TABLE public.gf_t3_270_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_270_window_arenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_270_telemetry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY gf_t3_270_corridors_tenant_isolation
    ON public.gf_t3_270_corridors
    FOR ALL
    TO authenticated
    USING (tenant_uid = auth.uid())
    WITH CHECK (tenant_uid = auth.uid());

CREATE POLICY gf_t3_270_arenas_tenant_isolation
    ON public.gf_t3_270_window_arenas
    FOR ALL
    TO authenticated
    USING (tenant_uid = auth.uid())
    WITH CHECK (tenant_uid = auth.uid());

CREATE POLICY gf_t3_270_telemetry_tenant_isolation
    ON public.gf_t3_270_telemetry_events
    FOR ALL
    TO authenticated
    USING (tenant_uid = auth.uid())
    WITH CHECK (tenant_uid = auth.uid());
