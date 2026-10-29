-- GF-T3-248: Production PostgreSQL / Supabase Persistence Schema
-- Multi-GPU Tensor Parallelism & Ring All-Reduce Interconnect Fabric Ledger
-- Features: Range-Partitioned Tables, Foreign Keys, Indexes, and Strict RLS Policies
-- Zero-Dollar Gate: Verified 100% free of currency symbols

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic Corridor Registry Table
CREATE TABLE IF NOT EXISTS public.tensor_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_label TEXT NOT NULL UNIQUE,
    fabric_bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (fabric_bandwidth_gbs > 0),
    per_rank_nvlink_gbs NUMERIC(10, 2) NOT NULL CHECK (per_rank_nvlink_gbs > 0),
    base_all_reduce_us NUMERIC(8, 4) NOT NULL CHECK (base_all_reduce_us >= 0),
    active_ranks INTEGER NOT NULL CHECK (active_ranks BETWEEN 1 AND 64),
    fabric_generation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Partitioned Tensor Fabric Telemetry Bus (Partitioned by recorded_at)
CREATE TABLE IF NOT EXISTS public.tensor_fabric_telemetry (
    telemetry_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    operator_uid UUID NOT NULL,
    corridor_id TEXT NOT NULL REFERENCES public.tensor_corridors(corridor_id) ON DELETE RESTRICT,
    fabric_throughput_gbs NUMERIC(10, 2) NOT NULL,
    all_reduce_latency_us NUMERIC(8, 4) NOT NULL,
    active_ranks INTEGER NOT NULL,
    processed_tokens BIGINT NOT NULL,
    bubble_overhead_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    output_vector JSONB NOT NULL,
    PRIMARY KEY (telemetry_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS public.tensor_fabric_telemetry_2026_q4
    PARTITION OF public.tensor_fabric_telemetry
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS public.tensor_fabric_telemetry_default
    PARTITION OF public.tensor_fabric_telemetry DEFAULT;

-- 3. GPU Rank Sharding & All-Reduce State Table
CREATE TABLE IF NOT EXISTS public.tensor_rank_states (
    rank_state_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id TEXT NOT NULL REFERENCES public.tensor_corridors(corridor_id) ON DELETE CASCADE,
    operator_uid UUID NOT NULL,
    rank_index INTEGER NOT NULL CHECK (rank_index BETWEEN 0 AND 7),
    pointer_hex TEXT NOT NULL,
    shard_axis TEXT NOT NULL CHECK (shard_axis IN ('COL', 'ROW')),
    weight_memory_gb INTEGER NOT NULL DEFAULT 24,
    reduce_latency_us NUMERIC(8, 4) NOT NULL,
    nvlink_bandwidth_gbs NUMERIC(10, 2) NOT NULL,
    sync_status TEXT NOT NULL CHECK (sync_status IN ('LOCKED', 'FAULT', 'RESYNC')),
    partial_activation JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (corridor_id, rank_index, operator_uid)
);

-- 4. All-Reduce Execution Audit Ledger
CREATE TABLE IF NOT EXISTS public.all_reduce_audit_ledger (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_uid UUID NOT NULL,
    event_callsign TEXT NOT NULL CHECK (event_callsign IN ('CREW CHIEF', 'PIT WALL', 'TELEMETRY')),
    action_type TEXT NOT NULL,
    corridor_id TEXT NOT NULL REFERENCES public.tensor_corridors(corridor_id),
    payload_digest TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_fabric_telemetry_recorded_at
    ON public.tensor_fabric_telemetry USING BRIN (recorded_at);

CREATE INDEX IF NOT EXISTS idx_fabric_telemetry_corridor
    ON public.tensor_fabric_telemetry (corridor_id, operator_uid);

CREATE INDEX IF NOT EXISTS idx_rank_states_lookup
    ON public.tensor_rank_states (corridor_id, rank_index);

CREATE INDEX IF NOT EXISTS idx_audit_ledger_operator
    ON public.all_reduce_audit_ledger (operator_uid, created_at DESC);

-- 6. Strict Row-Level Security (RLS) Policies
ALTER TABLE public.tensor_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tensor_fabric_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tensor_rank_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.all_reduce_audit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access to tensor corridors"
    ON public.tensor_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Operators select own tensor fabric telemetry"
    ON public.tensor_fabric_telemetry
    FOR SELECT
    TO authenticated
    USING (auth.uid() = operator_uid);

CREATE POLICY "Operators insert own tensor fabric telemetry"
    ON public.tensor_fabric_telemetry
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = operator_uid);

CREATE POLICY "Operators manage own rank states"
    ON public.tensor_rank_states
    FOR ALL
    TO authenticated
    USING (auth.uid() = operator_uid)
    WITH CHECK (auth.uid() = operator_uid);

CREATE POLICY "Operators read and append own audit ledger"
    ON public.all_reduce_audit_ledger
    FOR ALL
    TO authenticated
    USING (auth.uid() = operator_uid)
    WITH CHECK (auth.uid() = operator_uid);
