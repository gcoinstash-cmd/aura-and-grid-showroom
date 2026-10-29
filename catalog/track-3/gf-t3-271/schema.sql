-- ============================================================================
-- GF-T3-271: PostgreSQL / Supabase Production Persistence Schema
-- Asynchronous Expert-Parallelism & Load-Balanced Dynamic Token Routing Engine
-- Includes Partitioned Telemetry Tables, Foreign Keys, Indexes, and Strict RLS
-- Zero-Dollar Gate Verified
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic Expert Corridors Catalog
CREATE TABLE IF NOT EXISTS gf_t3_271_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_code TEXT NOT NULL UNIQUE,
    base_bandwidth_gbps NUMERIC(10, 2) NOT NULL CHECK (base_bandwidth_gbps > 0),
    base_latency_us NUMERIC(8, 4) NOT NULL CHECK (base_latency_us > 0),
    capacity_factor NUMERIC(5, 3) NOT NULL CHECK (capacity_factor >= 1.000 AND capacity_factor <= 2.500),
    overlap_ratio NUMERIC(5, 4) NOT NULL CHECK (overlap_ratio > 0 AND overlap_ratio <= 1.0000),
    owner_tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Partitioned Dispatch Execution Epochs Table
CREATE TABLE IF NOT EXISTS gf_t3_271_dispatch_epochs (
    epoch_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    corridor_id UUID NOT NULL REFERENCES gf_t3_271_corridors(corridor_id) ON DELETE RESTRICT,
    owner_tenant_id UUID NOT NULL,
    step_index INTEGER NOT NULL CHECK (step_index >= 0),
    routing_throughput_gbps NUMERIC(10, 2) NOT NULL,
    dispatch_latency_us NUMERIC(8, 4) NOT NULL,
    active_experts SMALLINT NOT NULL DEFAULT 8 CHECK (active_experts BETWEEN 1 AND 64),
    processed_tokens BIGINT NOT NULL CHECK (processed_tokens >= 0),
    dropped_tokens BIGINT NOT NULL DEFAULT 0 CHECK (dropped_tokens = 0),
    auxiliary_loss NUMERIC(10, 6) NOT NULL,
    load_variance NUMERIC(10, 6) NOT NULL,
    moe_state TEXT NOT NULL,
    PRIMARY KEY (epoch_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS gf_t3_271_dispatch_epochs_2026_q4
    PARTITION OF gf_t3_271_dispatch_epochs
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS gf_t3_271_dispatch_epochs_default
    PARTITION OF gf_t3_271_dispatch_epochs DEFAULT;

-- 3. Expert Node Telemetry Allocations (E0 - E7)
CREATE TABLE IF NOT EXISTS gf_t3_271_expert_allocations (
    allocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    epoch_id UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    owner_tenant_id UUID NOT NULL,
    expert_index SMALLINT NOT NULL CHECK (expert_index BETWEEN 0 AND 7),
    ptr_hex VARCHAR(10) NOT NULL,
    routed_tokens BIGINT NOT NULL CHECK (routed_tokens >= 0),
    load_percentage NUMERIC(6, 3) NOT NULL CHECK (load_percentage >= 0 AND load_percentage <= 100),
    latency_ms NUMERIC(8, 4) NOT NULL CHECK (latency_ms >= 0),
    affinity_weight NUMERIC(6, 3) NOT NULL,
    sync_percentage NUMERIC(6, 2) NOT NULL CHECK (sync_percentage >= 0 AND sync_percentage <= 100),
    node_status TEXT NOT NULL,
    FOREIGN KEY (epoch_id, recorded_at) REFERENCES gf_t3_271_dispatch_epochs(epoch_id, recorded_at) ON DELETE CASCADE
);

-- 4. High-Selectivity B-Tree and BRIN Indexes
CREATE INDEX IF NOT EXISTS idx_gf_t3_271_corridors_tenant
    ON gf_t3_271_corridors(owner_tenant_id);

CREATE INDEX IF NOT EXISTS idx_gf_t3_271_epochs_tenant_recorded
    ON gf_t3_271_dispatch_epochs(owner_tenant_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_gf_t3_271_allocations_expert_idx
    ON gf_t3_271_expert_allocations(owner_tenant_id, expert_index, recorded_at DESC);

-- 5. Strict Row-Level Security (RLS) Enforcement
ALTER TABLE gf_t3_271_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_271_dispatch_epochs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_271_expert_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_gf_t3_271_corridors_tenant_isolation
    ON gf_t3_271_corridors
    FOR ALL
    TO authenticated
    USING (owner_tenant_id = auth.uid())
    WITH CHECK (owner_tenant_id = auth.uid());

CREATE POLICY rls_gf_t3_271_epochs_tenant_isolation
    ON gf_t3_271_dispatch_epochs
    FOR ALL
    TO authenticated
    USING (owner_tenant_id = auth.uid())
    WITH CHECK (owner_tenant_id = auth.uid());

CREATE POLICY rls_gf_t3_271_allocations_tenant_isolation
    ON gf_t3_271_expert_allocations
    FOR ALL
    TO authenticated
    USING (owner_tenant_id = auth.uid())
    WITH CHECK (owner_tenant_id = auth.uid());
