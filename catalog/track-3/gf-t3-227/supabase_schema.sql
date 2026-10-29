-- =============================================================================
-- GF-T3-227: Production PostgreSQL / Supabase Persistence Schema
-- Architecture: Partitioned Prefix-Tree Radix KV-Cache & Tree Attention Audit
-- Security: Strict Row-Level Security (RLS) Policies & Zero-Trust Constraints
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Synthetic Corridor Profiles Table
CREATE TABLE IF NOT EXISTS radix_corridors (
    corridor_id TEXT PRIMARY KEY,
    max_cached_tokens INTEGER NOT NULL CHECK (max_cached_tokens BETWEEN 64 AND 65536),
    eviction_ratio NUMERIC(5, 4) NOT NULL CHECK (eviction_ratio BETWEEN 0.0500 AND 0.9000),
    bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (bandwidth_gbs > 0),
    verify_threshold NUMERIC(5, 4) NOT NULL CHECK (verify_threshold BETWEEN 0.0000 AND 1.0000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Radix Trie KV-Cache Nodes Table
CREATE TABLE IF NOT EXISTS radix_kv_nodes (
    node_id TEXT PRIMARY KEY,
    corridor_id TEXT NOT NULL REFERENCES radix_corridors(corridor_id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES radix_kv_nodes(node_id) ON DELETE CASCADE,
    tenant_org_id UUID NOT NULL,
    node_label TEXT NOT NULL CHECK (char_length(node_label) <= 120),
    node_tier TEXT NOT NULL CHECK (node_tier IN ('ROOT', 'BRANCH', 'LEAF')),
    token_sequence INTEGER[] NOT NULL,
    token_length INTEGER NOT NULL CHECK (token_length >= 1),
    kv_page_pointer TEXT NOT NULL,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    access_count INTEGER NOT NULL DEFAULT 1 CHECK (access_count >= 1),
    last_access_tick BIGINT NOT NULL DEFAULT 1,
    verified_state TEXT NOT NULL CHECK (verified_state IN ('VERIFIED', 'SPECULATIVE', 'EVICTED')),
    eviction_priority NUMERIC(14, 4) NOT NULL DEFAULT 10.0000,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radix_kv_nodes_corridor_tier
    ON radix_kv_nodes (corridor_id, node_tier, verified_state);

CREATE INDEX IF NOT EXISTS idx_radix_kv_nodes_parent
    ON radix_kv_nodes (parent_id);

CREATE INDEX IF NOT EXISTS idx_radix_kv_nodes_lru_priority
    ON radix_kv_nodes (pinned, verified_state, access_count ASC, last_access_tick ASC);

CREATE INDEX IF NOT EXISTS idx_radix_kv_nodes_tokens_gin
    ON radix_kv_nodes USING GIN (token_sequence);

-- 3. Partitioned Speculative Tree Verification Telemetry Table
CREATE TABLE IF NOT EXISTS radix_verification_telemetry (
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_org_id UUID NOT NULL,
    corridor_id TEXT NOT NULL REFERENCES radix_corridors(corridor_id) ON DELETE RESTRICT,
    terminal_node_id TEXT NOT NULL,
    prompt_token_count INTEGER NOT NULL CHECK (prompt_token_count > 0),
    lcp_reused_tokens INTEGER NOT NULL CHECK (lcp_reused_tokens >= 0),
    prefix_hit_rate_pct NUMERIC(6, 2) NOT NULL CHECK (prefix_hit_rate_pct BETWEEN 0.00 AND 100.00),
    traversal_latency_ms NUMERIC(10, 4) NOT NULL CHECK (traversal_latency_ms >= 0.0000),
    active_branch_forks INTEGER NOT NULL CHECK (active_branch_forks >= 1),
    mask_parity_delta NUMERIC(18, 15) NOT NULL DEFAULT 0.000000000000000,
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS radix_verification_telemetry_2026_q4
    PARTITION OF radix_verification_telemetry
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS radix_verification_telemetry_2027_q1
    PARTITION OF radix_verification_telemetry
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

CREATE INDEX IF NOT EXISTS idx_radix_telemetry_tenant_recorded
    ON radix_verification_telemetry (tenant_org_id, recorded_at DESC);

-- 4. Row-Level Security (RLS) Enforcement
ALTER TABLE radix_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE radix_kv_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE radix_verification_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY radix_corridors_read_policy
    ON radix_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY radix_kv_nodes_tenant_isolation_policy
    ON radix_kv_nodes
    FOR ALL
    TO authenticated
    USING (tenant_org_id = ( nullif(current_setting('request.jwt.claim.org_id', true), '')::uuid ))
    WITH CHECK (tenant_org_id = ( nullif(current_setting('request.jwt.claim.org_id', true), '')::uuid ));

CREATE POLICY radix_telemetry_tenant_isolation_policy
    ON radix_verification_telemetry
    FOR ALL
    TO authenticated
    USING (tenant_org_id = ( nullif(current_setting('request.jwt.claim.org_id', true), '')::uuid ))
    WITH CHECK (tenant_org_id = ( nullif(current_setting('request.jwt.claim.org_id', true), '')::uuid ));

-- 5. Seed Synthetic Corridor Profiles
INSERT INTO radix_corridors (corridor_id, max_cached_tokens, eviction_ratio, bandwidth_gbs, verify_threshold)
VALUES
    ('TREE-CORRIDOR-ALPHA (RADIX-TREE-LCP · DYNAMIC-PRUNING)', 512, 0.2500, 1480.00, 0.7200),
    ('TREE-CORRIDOR-BRAVO (TREE-MASK-VERIFY · MULTI-BRANCH)', 768, 0.2000, 1620.00, 0.6800),
    ('TREE-CORRIDOR-GAMMA (SPECULATIVE-DRAFT-TRIE · RESAMPLE)', 640, 0.3000, 1540.00, 0.7500),
    ('TREE-CORRIDOR-DELTA (LEAF-EVICTION-FALLBACK)', 384, 0.4000, 1390.00, 0.8000)
ON CONFLICT (corridor_id) DO NOTHING;
