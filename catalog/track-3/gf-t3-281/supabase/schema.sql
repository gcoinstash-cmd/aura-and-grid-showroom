-- =============================================================================
-- GF-T3-281: DYNAMIC SPECULATIVE DRAFT-TARGET VERIFICATION & PARALLEL ACCEPTANCE
-- PRODUCTION POSTGRESQL / SUPABASE SCHEMA WITH PARTITIONING & STRICT RLS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SYNTHETIC ACCEPTANCE CORRIDORS TABLE
CREATE TABLE IF NOT EXISTS speculative_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_code TEXT NOT NULL UNIQUE,
    designation TEXT NOT NULL,
    peak_bandwidth_gbs NUMERIC(12, 2) NOT NULL CHECK (peak_bandwidth_gbs > 0),
    max_draft_depth INTEGER NOT NULL CHECK (max_draft_depth BETWEEN 1 AND 32),
    target_latency_us NUMERIC(8, 4) NOT NULL CHECK (target_latency_us >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_speculative_corridors_code ON speculative_corridors(corridor_code);

-- 2. STREAM VERIFICATION RINGS TABLE (X0..X7 HARDWARE ARENAS)
CREATE TABLE IF NOT EXISTS verification_streams (
    stream_id TEXT PRIMARY KEY,
    stream_index INTEGER NOT NULL UNIQUE CHECK (stream_index BETWEEN 0 AND 7),
    corridor_id TEXT NOT NULL REFERENCES speculative_corridors(corridor_id) ON DELETE RESTRICT,
    pointer_hex TEXT NOT NULL,
    processed_tokens BIGINT NOT NULL DEFAULT 0 CHECK (processed_tokens >= 0),
    acceptance_rate_pct NUMERIC(5, 2) NOT NULL CHECK (acceptance_rate_pct BETWEEN 0 AND 100),
    ring_sync_pct NUMERIC(5, 2) NOT NULL CHECK (ring_sync_pct BETWEEN 0 AND 100),
    latency_ms NUMERIC(8, 4) NOT NULL CHECK (latency_ms >= 0),
    verification_state TEXT NOT NULL CHECK (verification_state IN ('VERIFIED · LOCKED', 'DIVERGENCE · RE-EVAL', 'BURST · SATURATED', 'RESET · ARENA_ZERO')),
    tenant_org_id UUID NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_streams_corridor ON verification_streams(corridor_id);
CREATE INDEX IF NOT EXISTS idx_verification_streams_tenant ON verification_streams(tenant_org_id);

-- 3. PARTITIONED TELEMETRY AUDIT LOGS (RANGE PARTITIONED BY RECORDED_AT)
CREATE TABLE IF NOT EXISTS speculative_acceptance_telemetry (
    event_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    corridor_id TEXT NOT NULL REFERENCES speculative_corridors(corridor_id) ON DELETE CASCADE,
    stream_id TEXT NOT NULL,
    draft_candidates_k INTEGER NOT NULL CHECK (draft_candidates_k BETWEEN 1 AND 32),
    accepted_tokens_count NUMERIC(8, 4) NOT NULL CHECK (accepted_tokens_count >= 0),
    throughput_gbs NUMERIC(12, 2) NOT NULL CHECK (throughput_gbs >= 0),
    verification_latency_us NUMERIC(8, 4) NOT NULL CHECK (verification_latency_us >= 0),
    tree_divergence_kl NUMERIC(8, 5) NOT NULL DEFAULT 0.0,
    tenant_org_id UUID NOT NULL,
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS speculative_acceptance_telemetry_2026_q4
    PARTITION OF speculative_acceptance_telemetry
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS speculative_acceptance_telemetry_2027_q1
    PARTITION OF speculative_acceptance_telemetry
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

CREATE INDEX IF NOT EXISTS idx_telemetry_recorded_at ON speculative_acceptance_telemetry(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_tenant_stream ON speculative_acceptance_telemetry(tenant_org_id, stream_id);

-- 4. STRICT ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE speculative_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE speculative_acceptance_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY corridor_read_authenticated ON speculative_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY stream_tenant_isolation_select ON verification_streams
    FOR SELECT
    TO authenticated
    USING (tenant_org_id = (current_setting('request.jwt.claim.org_id', true))::UUID);

CREATE POLICY stream_tenant_isolation_modify ON verification_streams
    FOR ALL
    TO authenticated
    USING (tenant_org_id = (current_setting('request.jwt.claim.org_id', true))::UUID)
    WITH CHECK (tenant_org_id = (current_setting('request.jwt.claim.org_id', true))::UUID);

CREATE POLICY telemetry_tenant_isolation_select ON speculative_acceptance_telemetry
    FOR SELECT
    TO authenticated
    USING (tenant_org_id = (current_setting('request.jwt.claim.org_id', true))::UUID);

CREATE POLICY telemetry_tenant_isolation_insert ON speculative_acceptance_telemetry
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_org_id = (current_setting('request.jwt.claim.org_id', true))::UUID);

-- 5. SEED CLEAN-ROOM SYNTHETIC SPECULATIVE CORRIDORS
INSERT INTO speculative_corridors (corridor_id, corridor_code, designation, peak_bandwidth_gbs, max_draft_depth, target_latency_us)
VALUES
    ('CORRIDOR-ALPHA', 'ACCEL-CORRIDOR-ALPHA', 'ACCEL-CORRIDOR-ALPHA (DYNAMIC-SPECULATIVE-DRAFT-TARGET-VERIFICATION-FABRIC · 39200-GB/S)', 39200.00, 8, 0.0100),
    ('CORRIDOR-BRAVO', 'ACCEL-CORRIDOR-BRAVO', 'ACCEL-CORRIDOR-BRAVO (MULTI-TOKEN-PARALLEL-ACCEPTANCE-ENGINE)', 36400.00, 6, 0.0150),
    ('CORRIDOR-GAMMA', 'ACCEL-CORRIDOR-GAMMA', 'ACCEL-CORRIDOR-GAMMA (BATCHED-VERIFICATION-TREE-ROUTER)', 32800.00, 5, 0.0200),
    ('CORRIDOR-DELTA', 'ACCEL-CORRIDOR-DELTA', 'ACCEL-CORRIDOR-DELTA (FALLBACK-SINGLE-TOKEN-AUTOREGRESSIVE-PASS)', 14200.00, 1, 0.0450)
ON CONFLICT (corridor_id) DO NOTHING;
