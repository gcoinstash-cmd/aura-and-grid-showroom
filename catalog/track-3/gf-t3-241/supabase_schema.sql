-- ============================================================================
-- GF-T3-241: PRODUCTION POSTGRESQL / SUPABASE PERSISTENCE SCHEMA
-- Subsystem: Speculative Decoding · Target-Draft Verification · Tree Attention
-- Zero-Dollar Gate Enforced | Partitioned Telemetry | Strict RLS Policies
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Speculative Corridors Registry Table
CREATE TABLE IF NOT EXISTS spec_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_code VARCHAR(128) NOT NULL UNIQUE,
    target_speed_tokens_per_s INTEGER NOT NULL CHECK (target_speed_tokens_per_s > 0),
    max_tree_branches INTEGER NOT NULL DEFAULT 8 CHECK (max_tree_branches BETWEEN 1 AND 64),
    kv_slot_stride_bytes INTEGER NOT NULL DEFAULT 256 CHECK (kv_slot_stride_bytes >= 64),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Partitioned Speculative Verification Passes Table (Range Partitioned by recorded_at)
CREATE TABLE IF NOT EXISTS spec_verification_passes (
    pass_id UUID NOT NULL DEFAULT gen_random_uuid(),
    corridor_id UUID NOT NULL REFERENCES spec_corridors(corridor_id) ON DELETE RESTRICT,
    operator_uid UUID NOT NULL,
    step_sequence BIGINT NOT NULL CHECK (step_sequence >= 0),
    verification_speed_tokens_per_s INTEGER NOT NULL CHECK (verification_speed_tokens_per_s >= 0),
    acceptance_latency_us NUMERIC(8, 4) NOT NULL CHECK (acceptance_latency_us >= 0),
    active_branches SMALLINT NOT NULL CHECK (active_branches BETWEEN 1 AND 8),
    processed_tokens_total BIGINT NOT NULL CHECK (processed_tokens_total >= 0),
    mean_acceptance_alpha NUMERIC(6, 4) NOT NULL CHECK (mean_acceptance_alpha BETWEEN 0.0 AND 1.0),
    spec_state VARCHAR(32) NOT NULL DEFAULT 'TREE_ACTIVE',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (pass_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS spec_verification_passes_2026_q4
    PARTITION OF spec_verification_passes
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS spec_verification_passes_default
    PARTITION OF spec_verification_passes DEFAULT;

-- 3. Speculative Draft Branch Nodes & KV Rollback Ledger
CREATE TABLE IF NOT EXISTS spec_branch_nodes (
    node_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_id UUID NOT NULL,
    pass_recorded_at TIMESTAMPTZ NOT NULL,
    operator_uid UUID NOT NULL,
    branch_index SMALLINT NOT NULL CHECK (branch_index BETWEEN 0 AND 7),
    branch_code VARCHAR(8) NOT NULL,
    draft_token_count SMALLINT NOT NULL CHECK (draft_token_count BETWEEN 1 AND 16),
    accepted_token_count SMALLINT NOT NULL CHECK (accepted_token_count BETWEEN 0 AND 16),
    token_path_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    draft_logprob NUMERIC(10, 4) NOT NULL,
    target_logprob NUMERIC(10, 4) NOT NULL,
    alpha_ratio NUMERIC(6, 4) NOT NULL CHECK (alpha_ratio BETWEEN 0.0 AND 1.0),
    kv_pointer_hex VARCHAR(16) NOT NULL,
    branch_state VARCHAR(16) NOT NULL CHECK (branch_state IN ('ACCEPTED', 'PRUNED', 'ROLLBACK')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_spec_pass
        FOREIGN KEY (pass_id, pass_recorded_at)
        REFERENCES spec_verification_passes (pass_id, recorded_at)
        ON DELETE CASCADE
);

-- 4. High-Selectivity Composite Indexes
CREATE INDEX IF NOT EXISTS idx_spec_passes_corridor_recorded
    ON spec_verification_passes (corridor_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_spec_passes_operator_step
    ON spec_verification_passes (operator_uid, step_sequence DESC);

CREATE INDEX IF NOT EXISTS idx_spec_branch_nodes_pass_branch
    ON spec_branch_nodes (pass_id, branch_index);

CREATE INDEX IF NOT EXISTS idx_spec_branch_nodes_state_alpha
    ON spec_branch_nodes (branch_state, alpha_ratio DESC);

-- 5. Strict Row-Level Security (RLS) Enforcement
ALTER TABLE spec_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE spec_verification_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE spec_branch_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_corridors_read_authenticated
    ON spec_corridors
    FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

CREATE POLICY policy_passes_tenant_isolation_select
    ON spec_verification_passes
    FOR SELECT
    TO authenticated
    USING (operator_uid = auth.uid());

CREATE POLICY policy_passes_tenant_isolation_insert
    ON spec_verification_passes
    FOR INSERT
    TO authenticated
    WITH CHECK (operator_uid = auth.uid());

CREATE POLICY policy_branch_nodes_tenant_isolation_select
    ON spec_branch_nodes
    FOR SELECT
    TO authenticated
    USING (operator_uid = auth.uid());

CREATE POLICY policy_branch_nodes_tenant_isolation_insert
    ON spec_branch_nodes
    FOR INSERT
    TO authenticated
    WITH CHECK (operator_uid = auth.uid());
