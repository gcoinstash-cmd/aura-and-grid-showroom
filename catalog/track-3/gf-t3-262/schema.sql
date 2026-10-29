-- =============================================================================
-- GF-T3-262: Production PostgreSQL / Supabase Schema
-- MoE Expert Parallelism & Dynamic Token Routing Persistence Layer
-- Zero-Dollar Gate Enforced | Partitioned Tables | Foreign Keys | RLS Policies
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Synthetic MoE Routing Corridors Registry
CREATE TABLE IF NOT EXISTS moe_routing_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_label TEXT NOT NULL UNIQUE,
    base_bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (base_bandwidth_gbs > 0),
    base_latency_us NUMERIC(8, 4) NOT NULL CHECK (base_latency_us > 0),
    default_top_k SMALLINT NOT NULL DEFAULT 2 CHECK (default_top_k BETWEEN 1 AND 8),
    capacity_factor NUMERIC(5, 3) NOT NULL DEFAULT 1.250 CHECK (capacity_factor >= 1.000),
    aux_loss_coeff NUMERIC(6, 4) NOT NULL DEFAULT 0.0100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Partitioned MoE Dispatch Passes Table (Partitioned by RANGE on executed_at)
CREATE TABLE IF NOT EXISTS moe_dispatch_passes (
    pass_id UUID NOT NULL DEFAULT gen_random_uuid(),
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    operator_id UUID NOT NULL,
    corridor_id TEXT NOT NULL REFERENCES moe_routing_corridors(corridor_id) ON DELETE RESTRICT,
    mesh_ptr TEXT NOT NULL DEFAULT '0xAF8DC0',
    routing_mode TEXT NOT NULL DEFAULT 'MOE_PARALLEL',
    top_k SMALLINT NOT NULL CHECK (top_k BETWEEN 1 AND 8),
    throughput_gbs NUMERIC(10, 2) NOT NULL,
    routing_latency_us NUMERIC(8, 4) NOT NULL,
    active_experts SMALLINT NOT NULL DEFAULT 8,
    processed_tokens_units BIGINT NOT NULL CHECK (processed_tokens_units >= 0),
    auxiliary_loss NUMERIC(10, 6) NOT NULL,
    z_loss NUMERIC(10, 6) NOT NULL,
    imbalance_spike_active BOOLEAN NOT NULL DEFAULT FALSE,
    moe_state TEXT NOT NULL,
    PRIMARY KEY (pass_id, executed_at)
) PARTITION BY RANGE (executed_at);

CREATE TABLE IF NOT EXISTS moe_dispatch_passes_2026_q4
    PARTITION OF moe_dispatch_passes
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS moe_dispatch_passes_2027_q1
    PARTITION OF moe_dispatch_passes
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

-- 3. Expert Node Telemetry Snapshots (E0..E7 per Dispatch Pass)
CREATE TABLE IF NOT EXISTS moe_expert_node_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_id UUID NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    operator_id UUID NOT NULL,
    expert_index SMALLINT NOT NULL CHECK (expert_index BETWEEN 0 AND 7),
    expert_code TEXT NOT NULL,
    hex_ptr TEXT NOT NULL,
    dispatched_tokens BIGINT NOT NULL CHECK (dispatched_tokens >= 0),
    gather_mode TEXT NOT NULL,
    gating_probability NUMERIC(8, 6) NOT NULL,
    capacity_utilization_pct NUMERIC(5, 2) NOT NULL,
    balance_pct NUMERIC(5, 2) NOT NULL,
    latency_ms NUMERIC(8, 4) NOT NULL,
    dispatch_status TEXT NOT NULL CHECK (dispatch_status IN ('OK', 'REROUTED', 'SATURATED')),
    locked BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (pass_id, executed_at) REFERENCES moe_dispatch_passes(pass_id, executed_at) ON DELETE CASCADE
);

-- 4. High-Selectivity B-Tree and BRIN Indexes
CREATE INDEX IF NOT EXISTS idx_moe_dispatch_passes_corridor_time
    ON moe_dispatch_passes (corridor_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_moe_dispatch_passes_operator
    ON moe_dispatch_passes (operator_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_moe_expert_snapshots_pass
    ON moe_expert_node_snapshots (pass_id, expert_index);

CREATE INDEX IF NOT EXISTS idx_moe_expert_snapshots_ptr
    ON moe_expert_node_snapshots (hex_ptr, dispatch_status);

-- 5. Strict Row-Level Security (RLS) Enforcement
ALTER TABLE moe_routing_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE moe_dispatch_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE moe_expert_node_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_corridors_read_authenticated
    ON moe_routing_corridors
    FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

CREATE POLICY policy_dispatch_passes_tenant_isolation
    ON moe_dispatch_passes
    FOR ALL
    TO authenticated
    USING (operator_id = auth.uid())
    WITH CHECK (operator_id = auth.uid());

CREATE POLICY policy_expert_snapshots_tenant_isolation
    ON moe_expert_node_snapshots
    FOR ALL
    TO authenticated
    USING (operator_id = auth.uid())
    WITH CHECK (operator_id = auth.uid());

-- Seed Initial Synthetic MoE Corridors
INSERT INTO moe_routing_corridors (corridor_id, corridor_label, base_bandwidth_gbs, base_latency_us, default_top_k, capacity_factor, aux_loss_coeff)
VALUES
    ('MOE-CORRIDOR-ALPHA', 'MOE-CORRIDOR-ALPHA (DYNAMIC-TOKEN-ROUTING-FABRIC · 24200-GB/S)', 24200.00, 0.0100, 2, 1.250, 0.0100),
    ('MOE-CORRIDOR-BRAVO', 'MOE-CORRIDOR-BRAVO (ALL-TO-ALL-DISPATCH-SCHEDULER)', 22800.00, 0.0200, 2, 1.150, 0.0150),
    ('MOE-CORRIDOR-GAMMA', 'MOE-CORRIDOR-GAMMA (EXPERT-CAPACITY-FACTOR-BALANCER)', 23600.00, 0.0100, 2, 1.050, 0.0250),
    ('MOE-CORRIDOR-DELTA', 'MOE-CORRIDOR-DELTA (FALLBACK-DENSE-FEEDFORWARD-PASS)', 19400.00, 0.0300, 1, 1.500, 0.0050)
ON CONFLICT (corridor_id) DO NOTHING;
