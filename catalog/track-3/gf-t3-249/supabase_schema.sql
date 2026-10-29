-- GF-T3-249: Expert Parallelism & Top-2 Routing Persistence Schema
-- Clean-Room MIT Licensed PostgreSQL 16 / Supabase DDL

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic MoE Corridor Registry
CREATE TABLE IF NOT EXISTS public.moe_corridor_registry (
    corridor_id TEXT PRIMARY KEY,
    routing_topology TEXT NOT NULL CHECK (routing_topology IN ('TOP2_ROUTER', 'EXPERT_LOAD_BAL', 'AUX_LOSS_GUARD', 'DENSE_FALLBACK')),
    nominal_bandwidth_gbs INTEGER NOT NULL CHECK (nominal_bandwidth_gbs > 0),
    capacity_factor NUMERIC(4, 2) NOT NULL DEFAULT 1.25 CHECK (capacity_factor >= 1.00 AND capacity_factor <= 2.50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Partitioned MoE Routing Epochs Table (Range Partitioned by recorded_at)
CREATE TABLE IF NOT EXISTS public.moe_routing_epochs (
    epoch_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_org_id UUID NOT NULL,
    corridor_id TEXT NOT NULL REFERENCES public.moe_corridor_registry(corridor_id) ON DELETE RESTRICT,
    mesh_pointer TEXT NOT NULL,
    throughput_gbs INTEGER NOT NULL CHECK (throughput_gbs >= 0),
    routing_latency_us NUMERIC(6, 3) NOT NULL CHECK (routing_latency_us >= 0),
    active_experts SMALLINT NOT NULL DEFAULT 8 CHECK (active_experts BETWEEN 1 AND 64),
    batch_tokens INTEGER NOT NULL CHECK (batch_tokens > 0),
    dropped_tokens INTEGER NOT NULL DEFAULT 0 CHECK (dropped_tokens = 0),
    load_balance_pct NUMERIC(5, 2) NOT NULL CHECK (load_balance_pct BETWEEN 0 AND 100),
    auxiliary_loss NUMERIC(8, 6) NOT NULL,
    router_z_loss NUMERIC(8, 6) NOT NULL,
    feature_vector NUMERIC(6, 3)[] NOT NULL,
    PRIMARY KEY (epoch_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS public.moe_routing_epochs_2026_q4
    PARTITION OF public.moe_routing_epochs
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- 3. Expert Rank Telemetry Table
CREATE TABLE IF NOT EXISTS public.expert_rank_telemetry (
    telemetry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    epoch_id UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_org_id UUID NOT NULL,
    expert_rank SMALLINT NOT NULL CHECK (expert_rank BETWEEN 0 AND 7),
    hex_pointer TEXT NOT NULL,
    load_percentage NUMERIC(5, 2) NOT NULL,
    dispatched_tokens INTEGER NOT NULL CHECK (dispatched_tokens >= 0),
    gating_probability NUMERIC(6, 4) NOT NULL CHECK (gating_probability BETWEEN 0 AND 1),
    routing_rank_label TEXT NOT NULL CHECK (routing_rank_label IN ('TOP-1', 'TOP-2')),
    capacity_factor NUMERIC(4, 2) NOT NULL DEFAULT 1.25,
    status_code TEXT NOT NULL CHECK (status_code IN ('BALANCED', 'ROUTED', 'SATURATED', 'REBALANCING')),
    FOREIGN KEY (epoch_id, recorded_at) REFERENCES public.moe_routing_epochs(epoch_id, recorded_at) ON DELETE CASCADE
);

-- 4. High-Velocity Indexes (BRIN + B-Tree)
CREATE INDEX IF NOT EXISTS idx_moe_epochs_recorded_brin
    ON public.moe_routing_epochs USING BRIN (recorded_at);

CREATE INDEX IF NOT EXISTS idx_moe_epochs_tenant_corridor
    ON public.moe_routing_epochs USING BTREE (tenant_org_id, corridor_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_expert_telemetry_epoch_rank
    ON public.expert_rank_telemetry USING BTREE (epoch_id, expert_rank);

-- 5. Strict Row-Level Security (RLS) Enforcement
ALTER TABLE public.moe_corridor_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moe_routing_epochs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_rank_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read of corridor registry"
    ON public.moe_corridor_registry
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enforce tenant isolation on moe_routing_epochs"
    ON public.moe_routing_epochs
    FOR ALL
    TO authenticated
    USING (tenant_org_id = (auth.jwt() ->> 'org_id')::UUID)
    WITH CHECK (tenant_org_id = (auth.jwt() ->> 'org_id')::UUID);

CREATE POLICY "Enforce tenant isolation on expert_rank_telemetry"
    ON public.expert_rank_telemetry
    FOR ALL
    TO authenticated
    USING (tenant_org_id = (auth.jwt() ->> 'org_id')::UUID)
    WITH CHECK (tenant_org_id = (auth.jwt() ->> 'org_id')::UUID);
