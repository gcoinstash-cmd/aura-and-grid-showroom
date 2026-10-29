-- ============================================================================
-- GF-T3-250 PostgreSQL / Supabase Persistence Schema
-- Partitioned Telemetry Tables, Foreign Keys, Indexes & Strict RLS Policies
-- Clean-Room Sovereign Database Architecture
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic Prefill Corridors Reference Table
CREATE TABLE IF NOT EXISTS prefill_corridors (
    corridor_code TEXT PRIMARY KEY,
    corridor_label TEXT NOT NULL UNIQUE,
    max_bandwidth_gbs INTEGER NOT NULL CHECK (max_bandwidth_gbs > 0),
    target_overlap_pct NUMERIC(5,2) NOT NULL CHECK (target_overlap_pct BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO prefill_corridors (corridor_code, corridor_label, max_bandwidth_gbs, target_overlap_pct)
VALUES
    ('ALPHA', 'PREFILL-CORRIDOR-ALPHA (CHUNKED-PREFILL-DECODE-SPLIT · 13000-GB/S)', 13000, 99.80),
    ('BRAVO', 'PREFILL-CORRIDOR-BRAVO (ASYNCHRONOUS-GENERATION-OVERLAP-PIPELINE)', 13000, 99.85),
    ('GAMMA', 'PREFILL-CORRIDOR-GAMMA (INTERFERENCE-MITIGATION-SCHEDULER)', 13000, 99.90),
    ('DELTA', 'PREFILL-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-PREFILL)', 7400, 68.50)
ON CONFLICT (corridor_code) DO NOTHING;

-- 2. Prefill Execution Sessions Table
CREATE TABLE IF NOT EXISTS prefill_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    engine_id TEXT NOT NULL DEFAULT 'GF-T3-250' CHECK (engine_id = 'GF-T3-250'),
    corridor_code TEXT NOT NULL REFERENCES prefill_corridors(corridor_code) ON DELETE RESTRICT,
    prompt_tokens INTEGER NOT NULL CHECK (prompt_tokens BETWEEN 64 AND 131072),
    chunk_bound_tokens INTEGER NOT NULL CHECK (chunk_bound_tokens BETWEEN 64 AND 4096),
    prefill_throughput_gbs INTEGER NOT NULL,
    overlap_latency_us NUMERIC(8,3) NOT NULL,
    processed_tokens BIGINT NOT NULL DEFAULT 3072000,
    prefill_state TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prefill_sessions_tenant_created
    ON prefill_sessions (tenant_id, created_at DESC);

-- 3. Partitioned Chunk Telemetry Allocations Table (Partitioned by Range on recorded_at)
CREATE TABLE IF NOT EXISTS prefill_chunk_telemetry (
    telemetry_id UUID NOT NULL DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES prefill_sessions(session_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    chunk_index SMALLINT NOT NULL CHECK (chunk_index BETWEEN 0 AND 7),
    hex_ptr TEXT NOT NULL,
    token_count INTEGER NOT NULL CHECK (token_count > 0),
    size_mb NUMERIC(8,2) NOT NULL,
    overlap_pct NUMERIC(5,2) NOT NULL CHECK (overlap_pct BETWEEN 0 AND 100),
    latency_ms NUMERIC(8,3) NOT NULL,
    compute_quanta_share NUMERIC(5,3) NOT NULL,
    decode_interference_us NUMERIC(8,3) NOT NULL,
    state_label TEXT NOT NULL,
    decode_sync TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (telemetry_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS prefill_chunk_telemetry_2026_q4
    PARTITION OF prefill_chunk_telemetry
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS prefill_chunk_telemetry_default
    PARTITION OF prefill_chunk_telemetry DEFAULT;

CREATE INDEX IF NOT EXISTS idx_chunk_telemetry_session_chunk
    ON prefill_chunk_telemetry (session_id, chunk_index);

CREATE INDEX IF NOT EXISTS idx_chunk_telemetry_tenant_recorded
    ON prefill_chunk_telemetry (tenant_id, recorded_at DESC);

-- 4. Strict Row-Level Security (RLS) Policies
ALTER TABLE prefill_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE prefill_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prefill_chunk_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_prefill_corridors_read_all
    ON prefill_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY rls_prefill_sessions_tenant_isolation
    ON prefill_sessions
    FOR ALL
    TO authenticated
    USING (tenant_id = auth.uid())
    WITH CHECK (tenant_id = auth.uid());

CREATE POLICY rls_prefill_chunk_telemetry_tenant_isolation
    ON prefill_chunk_telemetry
    FOR ALL
    TO authenticated
    USING (tenant_id = auth.uid())
    WITH CHECK (tenant_id = auth.uid());
