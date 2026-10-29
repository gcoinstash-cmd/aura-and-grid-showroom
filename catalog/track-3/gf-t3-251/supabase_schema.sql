-- =============================================================================
-- GF-T3-251: Production PostgreSQL / Supabase Persistence Schema
-- Subsystem: Capacity Factor & Zero-Token-Dropping Load Balancer Telemetry
-- SPDX-License-Identifier: MIT
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic Capacity Corridor Registry Table
CREATE TABLE IF NOT EXISTS moe_capacity_corridors (
    corridor_code TEXT PRIMARY KEY,
    corridor_label TEXT NOT NULL,
    baseline_capacity_factor NUMERIC(5, 2) NOT NULL CHECK (baseline_capacity_factor >= 1.00 AND baseline_capacity_factor <= 4.00),
    nominal_bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (nominal_bandwidth_gbs > 0),
    zero_drop_enforced BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Partitioned Capacity Balancer Dispatch Passes Table
CREATE TABLE IF NOT EXISTS moe_capacity_dispatch_passes (
    pass_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    engine_id TEXT NOT NULL DEFAULT 'GF-T3-251',
    corridor_code TEXT NOT NULL REFERENCES moe_capacity_corridors(corridor_code) ON DELETE RESTRICT,
    tenant_org_id UUID NOT NULL,
    capacity_factor NUMERIC(5, 2) NOT NULL CHECK (capacity_factor >= 1.00),
    token_limit_per_expert INTEGER NOT NULL CHECK (token_limit_per_expert > 0),
    total_tokens_routed INTEGER NOT NULL CHECK (total_tokens_routed >= 0),
    total_tokens_redispatched INTEGER NOT NULL CHECK (total_tokens_redispatched >= 0),
    total_tokens_dropped INTEGER NOT NULL CHECK (total_tokens_dropped = 0),
    auxiliary_imbalance_loss NUMERIC(10, 6) NOT NULL CHECK (auxiliary_imbalance_loss >= 0),
    throughput_gbs NUMERIC(10, 2) NOT NULL,
    routing_latency_us NUMERIC(8, 4) NOT NULL,
    PRIMARY KEY (pass_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS moe_capacity_dispatch_passes_2026_q4
    PARTITION OF moe_capacity_dispatch_passes
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- 3. Expert Rank Allocation Telemetry Table (E0..E7)
CREATE TABLE IF NOT EXISTS moe_expert_rank_allocations (
    allocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_id UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_org_id UUID NOT NULL,
    expert_rank SMALLINT NOT NULL CHECK (expert_rank >= 0 AND expert_rank <= 7),
    memory_pointer TEXT NOT NULL,
    capacity_factor NUMERIC(5, 2) NOT NULL,
    token_limit INTEGER NOT NULL,
    incoming_demand INTEGER NOT NULL,
    routed_tokens INTEGER NOT NULL,
    redispatched_tokens INTEGER NOT NULL,
    dropped_tokens INTEGER NOT NULL CHECK (dropped_tokens = 0),
    auxiliary_loss_contribution NUMERIC(8, 5) NOT NULL,
    rank_state TEXT NOT NULL CHECK (rank_state IN ('BALANCED', 'REDISPATCHED', 'SATURATED')),
    FOREIGN KEY (pass_id, recorded_at) REFERENCES moe_capacity_dispatch_passes(pass_id, recorded_at) ON DELETE CASCADE
);

-- 4. High-Selectivity B-Tree & BRIN Indexes
CREATE INDEX IF NOT EXISTS idx_dispatch_passes_corridor_time
    ON moe_capacity_dispatch_passes (corridor_code, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_dispatch_passes_tenant
    ON moe_capacity_dispatch_passes (tenant_org_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_expert_allocations_rank
    ON moe_expert_rank_allocations (expert_rank, rank_state);

-- 5. Strict Row-Level Security (RLS) Policies
ALTER TABLE moe_capacity_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE moe_capacity_dispatch_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE moe_expert_rank_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY corridors_read_authenticated
    ON moe_capacity_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY dispatch_passes_tenant_isolation_select
    ON moe_capacity_dispatch_passes
    FOR SELECT
    TO authenticated
    USING (tenant_org_id = (auth.jwt() ->> 'org_id')::UUID);

CREATE POLICY dispatch_passes_tenant_isolation_insert
    ON moe_capacity_dispatch_passes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        tenant_org_id = (auth.jwt() ->> 'org_id')::UUID
        AND total_tokens_dropped = 0
    );

CREATE POLICY expert_allocations_tenant_isolation_select
    ON moe_expert_rank_allocations
    FOR SELECT
    TO authenticated
    USING (tenant_org_id = (auth.jwt() ->> 'org_id')::UUID);

CREATE POLICY expert_allocations_tenant_isolation_insert
    ON moe_expert_rank_allocations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        tenant_org_id = (auth.jwt() ->> 'org_id')::UUID
        AND dropped_tokens = 0
    );
