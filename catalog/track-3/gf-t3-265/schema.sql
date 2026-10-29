-- ============================================================================
-- GF-T3-265 Production PostgreSQL / Supabase Persistence Schema
-- Speculative Draft-Verification KV-Cache Pooling & Zero-Copy Arena Fabric
-- Features: Partitioned Tables, Foreign Keys, B-Tree/BRIN Indexes, Strict RLS
-- Zero-Dollar Gate Enforced: Zero forbidden currency symbols in schema.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic KV Pool Corridors Reference Table
CREATE TABLE IF NOT EXISTS kv_pool_corridors (
    corridor_code TEXT PRIMARY KEY,
    corridor_label TEXT NOT NULL UNIQUE,
    base_throughput_gbs NUMERIC(10, 2) NOT NULL CHECK (base_throughput_gbs > 0),
    base_latency_us NUMERIC(8, 4) NOT NULL CHECK (base_latency_us > 0),
    arena_count INTEGER NOT NULL DEFAULT 8 CHECK (arena_count BETWEEN 1 AND 64),
    zero_copy_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. KV Cache Arena Registry Table (Foreign Key to kv_pool_corridors)
CREATE TABLE IF NOT EXISTS kv_cache_arenas (
    arena_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engine_id TEXT NOT NULL DEFAULT 'GF-T3-265',
    corridor_code TEXT NOT NULL REFERENCES kv_pool_corridors(corridor_code) ON DELETE RESTRICT,
    arena_index INTEGER NOT NULL CHECK (arena_index BETWEEN 0 AND 63),
    arena_id TEXT NOT NULL,
    hex_ptr TEXT NOT NULL,
    allocated_blocks INTEGER NOT NULL CHECK (allocated_blocks >= 0),
    max_blocks INTEGER NOT NULL DEFAULT 512 CHECK (max_blocks > 0),
    ref_count INTEGER NOT NULL DEFAULT 2 CHECK (ref_count >= 1),
    ref_label TEXT NOT NULL DEFAULT 'SHARED-2',
    latency_ms NUMERIC(8, 4) NOT NULL DEFAULT 0.0200,
    hit_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    status_label TEXT NOT NULL DEFAULT 'POOLED · LOCKED',
    prefix_signature TEXT NOT NULL,
    owner_tenant_id UUID NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (engine_id, corridor_code, arena_index)
);

-- 3. Partitioned Telemetry & Audit Ledger (Partitioned by Range on recorded_at)
CREATE TABLE IF NOT EXISTS kv_pool_telemetry_events (
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    engine_id TEXT NOT NULL DEFAULT 'GF-T3-265',
    corridor_code TEXT NOT NULL REFERENCES kv_pool_corridors(corridor_code),
    action_type TEXT NOT NULL,
    pool_throughput_gbs NUMERIC(10, 2) NOT NULL,
    arena_latency_us NUMERIC(8, 4) NOT NULL,
    active_arenas INTEGER NOT NULL,
    processed_tokens_units BIGINT NOT NULL,
    vector_clock JSONB NOT NULL DEFAULT '[2.71, 2.75, 2.72, 2.74]'::jsonb,
    operator_callsign TEXT NOT NULL DEFAULT 'CREW CHIEF',
    owner_tenant_id UUID NOT NULL,
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS kv_pool_telemetry_events_2026_q4
    PARTITION OF kv_pool_telemetry_events
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS kv_pool_telemetry_events_2027_q1
    PARTITION OF kv_pool_telemetry_events
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

-- 4. High-Selectivity Indexes
CREATE INDEX IF NOT EXISTS idx_kv_cache_arenas_corridor
    ON kv_cache_arenas (corridor_code, arena_index);

CREATE INDEX IF NOT EXISTS idx_kv_cache_arenas_tenant
    ON kv_cache_arenas (owner_tenant_id);

CREATE INDEX IF NOT EXISTS idx_kv_telemetry_recorded_brin
    ON kv_pool_telemetry_events USING BRIN (recorded_at);

CREATE INDEX IF NOT EXISTS idx_kv_telemetry_tenant_btree
    ON kv_pool_telemetry_events (owner_tenant_id, recorded_at DESC);

-- 5. Strict Row-Level Security (RLS) Policies
ALTER TABLE kv_pool_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE kv_cache_arenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE kv_pool_telemetry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY kv_pool_corridors_read_all
    ON kv_pool_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY kv_cache_arenas_tenant_isolation_select
    ON kv_cache_arenas
    FOR SELECT
    TO authenticated
    USING (owner_tenant_id = auth.uid());

CREATE POLICY kv_cache_arenas_tenant_isolation_modify
    ON kv_cache_arenas
    FOR ALL
    TO authenticated
    USING (owner_tenant_id = auth.uid())
    WITH CHECK (owner_tenant_id = auth.uid());

CREATE POLICY kv_pool_telemetry_tenant_select
    ON kv_pool_telemetry_events
    FOR SELECT
    TO authenticated
    USING (owner_tenant_id = auth.uid());

CREATE POLICY kv_pool_telemetry_tenant_insert
    ON kv_pool_telemetry_events
    FOR INSERT
    TO authenticated
    WITH CHECK (owner_tenant_id = auth.uid());

-- 6. Seed Default Synthetic Pool Corridors
INSERT INTO kv_pool_corridors (corridor_code, corridor_label, base_throughput_gbs, base_latency_us, arena_count, zero_copy_enabled)
VALUES
    ('ALPHA', 'POOL-CORRIDOR-ALPHA (KV-CACHE-POOLING-AND-REUSE-FABRIC · 26400-GB/S)', 26400.00, 0.0100, 8, TRUE),
    ('BRAVO', 'POOL-CORRIDOR-BRAVO (ZERO-COPY-ARENA-ALLOCATOR-ENGINE)', 24800.00, 0.0200, 8, TRUE),
    ('GAMMA', 'POOL-CORRIDOR-GAMMA (SPECULATIVE-VERIFICATION-CACHE-SHARER)', 25600.00, 0.0100, 8, TRUE),
    ('DELTA', 'POOL-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-CACHE-PASS)', 9200.00, 0.4500, 8, FALSE)
ON CONFLICT (corridor_code) DO NOTHING;
