-- GF-T3-252: Production PostgreSQL / Supabase Schema with Partitioning & Row-Level Security (RLS)
-- SPDX-License-Identifier: MIT
-- Zero-Dollar Constraint Enforced: No currency glyphs or dollar-quoted strings used.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Synthetic Speculative Corridors Registry
CREATE TABLE IF NOT EXISTS speculative_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_label TEXT NOT NULL UNIQUE,
    bandwidth_gbps NUMERIC(10, 2) NOT NULL CHECK (bandwidth_gbps > 0),
    base_latency_us NUMERIC(10, 4) NOT NULL CHECK (base_latency_us > 0),
    default_depth_k INTEGER NOT NULL CHECK (default_depth_k BETWEEN 1 AND 16),
    cost_ratio_c NUMERIC(8, 5) NOT NULL CHECK (cost_ratio_c > 0 AND cost_ratio_c < 1),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Draft Lane Matrix State Table (D0..D7)
CREATE TABLE IF NOT EXISTS draft_lanes (
    lane_id TEXT PRIMARY KEY CHECK (lane_id IN ('D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7')),
    corridor_id TEXT NOT NULL REFERENCES speculative_corridors(corridor_id) ON DELETE RESTRICT,
    hex_pointer TEXT NOT NULL,
    token_count INTEGER NOT NULL CHECK (token_count >= 0),
    depth_k INTEGER NOT NULL CHECK (depth_k BETWEEN 1 AND 16),
    acceptance_pct NUMERIC(5, 2) NOT NULL CHECK (acceptance_pct BETWEEN 0 AND 100),
    target_prob NUMERIC(6, 4) NOT NULL CHECK (target_prob BETWEEN 0 AND 1),
    lane_state TEXT NOT NULL CHECK (lane_state IN ('ACCEPTED', 'RESAMPLED', 'BURST', 'FLUSHED')),
    lock_status TEXT NOT NULL CHECK (lock_status IN ('LOCKED', 'FAULT', 'SYNCING')),
    owner_uid UUID NOT NULL DEFAULT auth.uid(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Partitioned Speculative Verification Telemetry Passes
CREATE TABLE IF NOT EXISTS speculative_verification_passes (
    pass_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lane_id TEXT NOT NULL REFERENCES draft_lanes(lane_id) ON DELETE CASCADE,
    corridor_id TEXT NOT NULL REFERENCES speculative_corridors(corridor_id) ON DELETE RESTRICT,
    depth_k INTEGER NOT NULL CHECK (depth_k BETWEEN 1 AND 16),
    accepted_tokens INTEGER NOT NULL CHECK (accepted_tokens >= 0),
    emitted_tokens INTEGER NOT NULL CHECK (emitted_tokens >= 1),
    acceptance_rate NUMERIC(6, 4) NOT NULL CHECK (acceptance_rate BETWEEN 0 AND 1),
    speedup_multiplier NUMERIC(6, 3) NOT NULL CHECK (speedup_multiplier > 0),
    verification_latency_us NUMERIC(10, 4) NOT NULL CHECK (verification_latency_us >= 0),
    throughput_gbps NUMERIC(10, 2) NOT NULL CHECK (throughput_gbps >= 0),
    residual_resampled BOOLEAN NOT NULL DEFAULT FALSE,
    operator_uid UUID NOT NULL DEFAULT auth.uid(),
    PRIMARY KEY (pass_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS speculative_verification_passes_2026_q4
    PARTITION OF speculative_verification_passes
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS speculative_verification_passes_2027_q1
    PARTITION OF speculative_verification_passes
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

-- 4. High-Selectivity Indexes
CREATE INDEX IF NOT EXISTS idx_draft_lanes_corridor ON draft_lanes(corridor_id);
CREATE INDEX IF NOT EXISTS idx_passes_lane_recorded ON speculative_verification_passes(lane_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_passes_corridor_recorded ON speculative_verification_passes(corridor_id, recorded_at DESC);

-- 5. Strict Row-Level Security (RLS) Policies
ALTER TABLE speculative_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_lanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE speculative_verification_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY corridors_read_authenticated
    ON speculative_corridors
    FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

CREATE POLICY draft_lanes_select_own
    ON draft_lanes
    FOR SELECT
    TO authenticated
    USING (owner_uid = auth.uid());

CREATE POLICY draft_lanes_modify_own
    ON draft_lanes
    FOR ALL
    TO authenticated
    USING (owner_uid = auth.uid())
    WITH CHECK (owner_uid = auth.uid());

CREATE POLICY verification_passes_select_own
    ON speculative_verification_passes
    FOR SELECT
    TO authenticated
    USING (operator_uid = auth.uid());

CREATE POLICY verification_passes_insert_own
    ON speculative_verification_passes
    FOR INSERT
    TO authenticated
    WITH CHECK (operator_uid = auth.uid());

-- 6. Seed Default Synthetic Speculative Corridors
INSERT INTO speculative_corridors (corridor_id, corridor_label, bandwidth_gbps, base_latency_us, default_depth_k, cost_ratio_c)
VALUES
    ('SPECULATIVE-CORRIDOR-ALPHA', 'SPECULATIVE-CORRIDOR-ALPHA (DRAFT-TARGET-VERIFICATION-PIPELINE · 14400-GB/S)', 14400.00, 0.0100, 5, 0.04200),
    ('SPECULATIVE-CORRIDOR-BRAVO', 'SPECULATIVE-CORRIDOR-BRAVO (DYNAMIC-SPECULATION-WINDOW-SCALING)', 13850.00, 0.0120, 6, 0.03800),
    ('SPECULATIVE-CORRIDOR-GAMMA', 'SPECULATIVE-CORRIDOR-GAMMA (RESIDUAL-REJECTION-SAMPLING-ENGINE)', 14120.00, 0.0110, 5, 0.04000),
    ('SPECULATIVE-CORRIDOR-DELTA', 'SPECULATIVE-CORRIDOR-DELTA (FALLBACK-AUTOREGRESSIVE-TARGET)', 9600.00, 0.0250, 1, 0.05000)
ON CONFLICT (corridor_id) DO NOTHING;
