-- GF-T3-246 · Track 3 Custom C++ Plugin & In-Flight Batching Scheduler Schema
-- SPDX-License-Identifier: MIT
-- PostgreSQL 16 / Supabase Production Persistence Layer with Partitioning & Strict RLS

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic Plugin Corridors Registry
CREATE TABLE IF NOT EXISTS public.gf_t3_246_plugin_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_label TEXT NOT NULL UNIQUE,
    peak_bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (peak_bandwidth_gbs > 0),
    base_kernel_latency_us NUMERIC(8, 4) NOT NULL CHECK (base_kernel_latency_us > 0),
    fused_exec_latency_us NUMERIC(8, 4) NOT NULL CHECK (fused_exec_latency_us > 0),
    max_slots INTEGER NOT NULL DEFAULT 32 CHECK (max_slots BETWEEN 1 AND 128),
    kernel_mode TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Shared GPU Memory Sequence Slots State Table
CREATE TABLE IF NOT EXISTS public.gf_t3_246_scheduler_slots (
    slot_index INTEGER PRIMARY KEY CHECK (slot_index BETWEEN 0 AND 31),
    corridor_id TEXT NOT NULL REFERENCES public.gf_t3_246_plugin_corridors(corridor_id) ON DELETE CASCADE,
    slot_code TEXT NOT NULL UNIQUE,
    hex_pointer TEXT NOT NULL,
    sequence_id INTEGER NOT NULL CHECK (sequence_id >= 0),
    current_tokens INTEGER NOT NULL CHECK (current_tokens >= 0),
    max_tokens INTEGER NOT NULL DEFAULT 2048 CHECK (max_tokens > 0),
    kernel_type TEXT NOT NULL DEFAULT 'FUSED',
    slot_state TEXT NOT NULL CHECK (slot_state IN ('ACTIVE', 'REINDEX', 'REINDEXED', 'IDLE')),
    efficiency_pct NUMERIC(5, 2) NOT NULL CHECK (efficiency_pct BETWEEN 0 AND 100),
    lock_status TEXT NOT NULL CHECK (lock_status IN ('LOCKED', 'FAULT')),
    batch_group TEXT NOT NULL,
    execution_time_us NUMERIC(8, 4) NOT NULL,
    register_allocation TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Range-Partitioned In-Flight Batching Telemetry Ledger
CREATE TABLE IF NOT EXISTS public.gf_t3_246_telemetry_events (
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    corridor_id TEXT NOT NULL REFERENCES public.gf_t3_246_plugin_corridors(corridor_id),
    operator_uid UUID NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('INIT', 'INFLIGHT_BURST', 'SATURATION_SPIKE', 'STEP_EXEC', 'QUEUE_FLUSH', 'CORRIDOR_SWITCH')),
    scheduler_throughput_gbs NUMERIC(10, 2) NOT NULL,
    kernel_launch_latency_us NUMERIC(8, 4) NOT NULL,
    active_slots INTEGER NOT NULL,
    processed_tokens_units BIGINT NOT NULL,
    queue_depth INTEGER NOT NULL DEFAULT 0,
    payload_hash TEXT NOT NULL,
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS public.gf_t3_246_telemetry_events_2026_q4
    PARTITION OF public.gf_t3_246_telemetry_events
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS public.gf_t3_246_telemetry_events_default
    PARTITION OF public.gf_t3_246_telemetry_events DEFAULT;

-- 4. High-Selectivity B-Tree and BRIN Indexes
CREATE INDEX IF NOT EXISTS idx_gf_t3_246_slots_corridor
    ON public.gf_t3_246_scheduler_slots (corridor_id, slot_state);

CREATE INDEX IF NOT EXISTS idx_gf_t3_246_telemetry_recorded_brin
    ON public.gf_t3_246_telemetry_events USING BRIN (recorded_at);

CREATE INDEX IF NOT EXISTS idx_gf_t3_246_telemetry_operator_btree
    ON public.gf_t3_246_telemetry_events (operator_uid, action_type, recorded_at DESC);

-- 5. Strict Row-Level Security (RLS) Enforcement
ALTER TABLE public.gf_t3_246_plugin_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_246_scheduler_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_246_telemetry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "corridors_authenticated_read"
    ON public.gf_t3_246_plugin_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "slots_authenticated_read"
    ON public.gf_t3_246_scheduler_slots
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "slots_service_role_mutate"
    ON public.gf_t3_246_scheduler_slots
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "telemetry_operator_isolation_select"
    ON public.gf_t3_246_telemetry_events
    FOR SELECT
    TO authenticated
    USING (auth.uid() = operator_uid);

CREATE POLICY "telemetry_operator_isolation_insert"
    ON public.gf_t3_246_telemetry_events
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = operator_uid);
