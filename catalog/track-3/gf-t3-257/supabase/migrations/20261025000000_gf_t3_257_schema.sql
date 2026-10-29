-- GF-T3-257: Production PostgreSQL / Supabase Schema
-- Track 3 Speculative Decoding & Draft Model Verification Ledger
-- Clean-Room MIT Licensed · Partitioned Tables · Foreign Keys · Indexes · Strict RLS

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Synthetic Speculative Corridors Reference Table
CREATE TABLE IF NOT EXISTS speculative_corridors (
    corridor_code TEXT PRIMARY KEY,
    corridor_label TEXT NOT NULL,
    peak_bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (peak_bandwidth_gbs > 0),
    target_speedup_ratio NUMERIC(5, 2) NOT NULL CHECK (target_speedup_ratio >= 1.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO speculative_corridors (corridor_code, corridor_label, peak_bandwidth_gbs, target_speedup_ratio)
VALUES
    ('SPEC-CORRIDOR-ALPHA', 'SPEC-CORRIDOR-ALPHA (TARGET-DRAFT-TOKEN-VERIFICATION · 19500-GB/S)', 19500.00, 2.50),
    ('SPEC-CORRIDOR-BRAVO', 'SPEC-CORRIDOR-BRAVO (REJECTION-SAMPLING-ACCELERATION-FABRIC)', 18900.00, 2.42),
    ('SPEC-CORRIDOR-GAMMA', 'SPEC-CORRIDOR-GAMMA (MULTI-TOKEN-ACCEPTANCE-ENGINE)', 19200.00, 2.48),
    ('SPEC-CORRIDOR-DELTA', 'SPEC-CORRIDOR-DELTA (FALLBACK-TARGET-AUTOREGRESSIVE-PASS)', 9800.00, 1.00)
ON CONFLICT (corridor_code) DO NOTHING;

-- 2. Draft Model Verification Channels (D0..D7)
CREATE TABLE IF NOT EXISTS draft_verification_channels (
    channel_id TEXT PRIMARY KEY CHECK (channel_id IN ('D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7')),
    corridor_code TEXT NOT NULL REFERENCES speculative_corridors(corridor_code) ON DELETE RESTRICT,
    pointer_hex TEXT NOT NULL,
    draft_tokens_k INTEGER NOT NULL DEFAULT 4 CHECK (draft_tokens_k BETWEEN 1 AND 16),
    accepted_tokens INTEGER NOT NULL DEFAULT 4 CHECK (accepted_tokens BETWEEN 0 AND 16),
    acceptance_rate_pct INTEGER NOT NULL DEFAULT 88 CHECK (acceptance_rate_pct BETWEEN 0 AND 100),
    speedup_ratio NUMERIC(5, 2) NOT NULL DEFAULT 2.50,
    latency_ms NUMERIC(6, 4) NOT NULL DEFAULT 0.0200,
    verification_state TEXT NOT NULL DEFAULT 'VERIFIED' CHECK (verification_state IN ('VERIFIED', 'REJECT_FALLBACK', 'FLUSHED')),
    is_locked BOOLEAN NOT NULL DEFAULT TRUE,
    tenant_id UUID NOT NULL DEFAULT auth.uid(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Partitioned Speculative Verification Telemetry Ledger
CREATE TABLE IF NOT EXISTS speculative_verification_events (
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_id UUID NOT NULL DEFAULT auth.uid(),
    channel_id TEXT NOT NULL REFERENCES draft_verification_channels(channel_id) ON DELETE CASCADE,
    corridor_code TEXT NOT NULL REFERENCES speculative_corridors(corridor_code) ON DELETE RESTRICT,
    draft_tokens_k INTEGER NOT NULL CHECK (draft_tokens_k BETWEEN 1 AND 16),
    accepted_tokens INTEGER NOT NULL CHECK (accepted_tokens BETWEEN 0 AND 16),
    mean_acceptance_alpha NUMERIC(6, 4) NOT NULL CHECK (mean_acceptance_alpha BETWEEN 0.0 AND 1.0),
    speedup_multiplier NUMERIC(5, 2) NOT NULL CHECK (speedup_multiplier >= 0.50),
    throughput_gbs NUMERIC(10, 2) NOT NULL CHECK (throughput_gbs >= 0.0),
    verification_latency_us NUMERIC(8, 4) NOT NULL CHECK (verification_latency_us >= 0.0),
    discrepancy_injected BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS speculative_verification_events_2026_q4
    PARTITION OF speculative_verification_events
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- 4. High-Selectivity B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_draft_channels_tenant
    ON draft_verification_channels (tenant_id, verification_state);

CREATE INDEX IF NOT EXISTS idx_spec_events_tenant_recorded
    ON speculative_verification_events (tenant_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_spec_events_channel_corridor
    ON speculative_verification_events (channel_id, corridor_code);

-- 5. Strict Row-Level Security (RLS) Policies
ALTER TABLE speculative_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_verification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE speculative_verification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY speculative_corridors_read_policy
    ON speculative_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY draft_channels_tenant_isolation_select
    ON draft_verification_channels
    FOR SELECT
    TO authenticated
    USING (tenant_id = auth.uid());

CREATE POLICY draft_channels_tenant_isolation_modify
    ON draft_verification_channels
    FOR ALL
    TO authenticated
    USING (tenant_id = auth.uid())
    WITH CHECK (tenant_id = auth.uid());

CREATE POLICY spec_events_tenant_isolation_select
    ON speculative_verification_events
    FOR SELECT
    TO authenticated
    USING (tenant_id = auth.uid());

CREATE POLICY spec_events_tenant_isolation_insert
    ON speculative_verification_events
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_id = auth.uid());
