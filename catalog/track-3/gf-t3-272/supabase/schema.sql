-- =============================================================================
-- GF-T3-272: Speculative Decoding & Multi-Candidate Verification Engine Schema
-- Target: PostgreSQL 16+ / Supabase
-- Features: Range Partitioned Tables, Foreign Keys, Indexes, Strict RLS Policies
-- Zero-Dollar Gate Compliant: Standard SQL functions without dollar-quoting
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Synthetic Speculative Corridors Reference Table
CREATE TABLE IF NOT EXISTS speculative_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_code TEXT NOT NULL UNIQUE,
    bandwidth_cap_gbs NUMERIC(10, 2) NOT NULL CHECK (bandwidth_cap_gbs > 0),
    target_latency_us NUMERIC(8, 4) NOT NULL CHECK (target_latency_us > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO speculative_corridors (corridor_id, corridor_code, bandwidth_cap_gbs, target_latency_us)
VALUES
    ('SPEC-CORRIDOR-ALPHA (SPECULATIVE-DECODING-VERIFICATION-FABRIC · 32000-GB/S)', 'ALPHA', 32000.00, 0.0100),
    ('SPEC-CORRIDOR-BRAVO (MULTI-CANDIDATE-TREE-VERIFICATION-ENGINE)', 'BRAVO', 31520.00, 0.0102),
    ('SPEC-CORRIDOR-GAMMA (PARALLEL-DRAFT-TOKEN-SCORER)', 'GAMMA', 30880.00, 0.0104),
    ('SPEC-CORRIDOR-DELTA (FALLBACK-AUTOREGRESSIVE-DECODE-PASS)', 'DELTA', 24960.00, 0.0128)
ON CONFLICT (corridor_id) DO NOTHING;

-- 2. Speculative Verification Passes (Parent Table for Candidate Trajectories)
CREATE TABLE IF NOT EXISTS speculative_verification_passes (
    pass_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_org_id UUID NOT NULL,
    engine_id TEXT NOT NULL DEFAULT 'GF-T3-272' CHECK (engine_id = 'GF-T3-272'),
    corridor_id TEXT NOT NULL REFERENCES speculative_corridors(corridor_id) ON DELETE RESTRICT,
    ring_pointer_hex TEXT NOT NULL DEFAULT '0x5F8DC0',
    verification_throughput_gbs NUMERIC(10, 2) NOT NULL CHECK (verification_throughput_gbs >= 0),
    draft_latency_us NUMERIC(8, 4) NOT NULL CHECK (draft_latency_us >= 0),
    active_candidates SMALLINT NOT NULL CHECK (active_candidates BETWEEN 0 AND 8),
    processed_tokens_units BIGINT NOT NULL CHECK (processed_tokens_units >= 0),
    speedup_multiplier NUMERIC(6, 3) NOT NULL CHECK (speedup_multiplier >= 1.0),
    speculative_state TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Partitioned Candidate Verification Telemetry Table (Partitioned by Range on recorded_at)
CREATE TABLE IF NOT EXISTS candidate_verification_telemetry (
    telemetry_id UUID NOT NULL DEFAULT gen_random_uuid(),
    pass_id UUID NOT NULL REFERENCES speculative_verification_passes(pass_id) ON DELETE CASCADE,
    tenant_org_id UUID NOT NULL,
    candidate_index SMALLINT NOT NULL CHECK (candidate_index BETWEEN 0 AND 7),
    pointer_hex TEXT NOT NULL,
    tokens_emitted_k INTEGER NOT NULL CHECK (tokens_emitted_k > 0),
    acceptance_rate_pct NUMERIC(5, 2) NOT NULL CHECK (acceptance_rate_pct BETWEEN 0 AND 100),
    kl_divergence_nats NUMERIC(8, 5) NOT NULL CHECK (kl_divergence_nats >= 0),
    latency_ms NUMERIC(6, 3) NOT NULL CHECK (latency_ms >= 0),
    verified_locked BOOLEAN NOT NULL DEFAULT TRUE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (telemetry_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS candidate_verification_telemetry_2026_q4
    PARTITION OF candidate_verification_telemetry
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS candidate_verification_telemetry_2027_q1
    PARTITION OF candidate_verification_telemetry
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

-- 4. High-Selectivity B-Tree and BRIN Indexes
CREATE INDEX IF NOT EXISTS idx_spec_passes_tenant_recorded
    ON speculative_verification_passes (tenant_org_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_spec_passes_corridor
    ON speculative_verification_passes (corridor_id);

CREATE INDEX IF NOT EXISTS idx_cand_telemetry_pass_candidate
    ON candidate_verification_telemetry (pass_id, candidate_index);

CREATE INDEX IF NOT EXISTS idx_cand_telemetry_recorded_brin
    ON candidate_verification_telemetry USING BRIN (recorded_at);

-- 5. Strict Row-Level Security (RLS) Policies
ALTER TABLE speculative_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE speculative_verification_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_verification_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_corridors_read_authenticated
    ON speculative_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY rls_passes_tenant_isolation_select
    ON speculative_verification_passes
    FOR SELECT
    TO authenticated
    USING (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::uuid);

CREATE POLICY rls_passes_tenant_isolation_insert
    ON speculative_verification_passes
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::uuid);

CREATE POLICY rls_telemetry_tenant_isolation_select
    ON candidate_verification_telemetry
    FOR SELECT
    TO authenticated
    USING (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::uuid);

CREATE POLICY rls_telemetry_tenant_isolation_insert
    ON candidate_verification_telemetry
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_org_id = (current_setting('request.jwt.claim.tenant_org_id', true))::uuid);
