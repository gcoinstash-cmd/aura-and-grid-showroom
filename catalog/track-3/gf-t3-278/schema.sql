-- GF-T3-278 Production PostgreSQL / Supabase Persistence Schema
-- Partitioned Telemetry Tables, Foreign Keys, Indexes, and Row-Level Security (RLS)
-- Zero-Dollar Gate Verified

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Core Adapter Registry Table
CREATE TABLE IF NOT EXISTS public.gf_t3_278_adapters (
    adapter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_org_id UUID NOT NULL,
    slot_code VARCHAR(8) NOT NULL UNIQUE CHECK (slot_code IN ('K0', 'K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7')),
    active_ptr VARCHAR(16) NOT NULL,
    standby_ptr VARCHAR(16) NOT NULL,
    active_bank VARCHAR(8) NOT NULL CHECK (active_bank IN ('BANK_A', 'BANK_B')),
    lora_rank INTEGER NOT NULL CHECK (lora_rank BETWEEN 4 AND 128),
    lora_alpha NUMERIC(8, 2) NOT NULL CHECK (lora_alpha > 0),
    tokens_processed_k BIGINT NOT NULL DEFAULT 256,
    staging_latency_ms NUMERIC(6, 3) NOT NULL DEFAULT 0.020,
    sync_parity_pct NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    w_warm_diag NUMERIC(10, 4)[] NOT NULL DEFAULT ARRAY[4.0100, 4.0500, 4.0200, 4.0400],
    swap_state VARCHAR(32) NOT NULL DEFAULT 'WARM · LOCKED',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Range-Partitioned Warm-Swap Telemetry Audit Ledger
CREATE TABLE IF NOT EXISTS public.gf_t3_278_swap_events (
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_org_id UUID NOT NULL,
    adapter_id UUID NOT NULL REFERENCES public.gf_t3_278_adapters(adapter_id) ON DELETE CASCADE,
    slot_code VARCHAR(8) NOT NULL,
    corridor_name VARCHAR(128) NOT NULL,
    previous_ptr VARCHAR(16) NOT NULL,
    next_ptr VARCHAR(16) NOT NULL,
    swap_throughput_gbps NUMERIC(10, 2) NOT NULL,
    staging_latency_us NUMERIC(8, 4) NOT NULL,
    processed_tokens BIGINT NOT NULL,
    payload_sha256 VARCHAR(64) NOT NULL,
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS public.gf_t3_278_swap_events_2026_q4
    PARTITION OF public.gf_t3_278_swap_events
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS public.gf_t3_278_swap_events_default
    PARTITION OF public.gf_t3_278_swap_events DEFAULT;

-- 3. High-Selectivity Indexes
CREATE INDEX IF NOT EXISTS idx_gf_t3_278_adapters_tenant
    ON public.gf_t3_278_adapters (tenant_org_id, slot_code);

CREATE INDEX IF NOT EXISTS idx_gf_t3_278_swap_events_recorded_at
    ON public.gf_t3_278_swap_events (recorded_at DESC, slot_code);

CREATE INDEX IF NOT EXISTS idx_gf_t3_278_swap_events_tenant
    ON public.gf_t3_278_swap_events (tenant_org_id, adapter_id);

-- 4. Strict Row-Level Security (RLS) Policies
ALTER TABLE public.gf_t3_278_adapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_278_swap_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY gf_t3_278_adapters_tenant_isolation_select
    ON public.gf_t3_278_adapters
    FOR SELECT
    TO authenticated
    USING (tenant_org_id = (auth.jwt() ->> 'tenant_org_id')::UUID);

CREATE POLICY gf_t3_278_adapters_tenant_isolation_modify
    ON public.gf_t3_278_adapters
    FOR ALL
    TO authenticated
    USING (tenant_org_id = (auth.jwt() ->> 'tenant_org_id')::UUID)
    WITH CHECK (tenant_org_id = (auth.jwt() ->> 'tenant_org_id')::UUID);

CREATE POLICY gf_t3_278_swap_events_tenant_isolation_select
    ON public.gf_t3_278_swap_events
    FOR SELECT
    TO authenticated
    USING (tenant_org_id = (auth.jwt() ->> 'tenant_org_id')::UUID);

CREATE POLICY gf_t3_278_swap_events_tenant_isolation_insert
    ON public.gf_t3_278_swap_events
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_org_id = (auth.jwt() ->> 'tenant_org_id')::UUID);
