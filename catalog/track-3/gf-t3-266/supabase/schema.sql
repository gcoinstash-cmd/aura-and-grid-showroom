-- ============================================================================
-- GF-T3-266 · Production PostgreSQL / Supabase Persistence Schema
-- Mamba-2 State-Space Model & Hybrid Attention-SSM Concurrency Engine
-- Zero-Dollar Gate Verified · Partitioned Tables · Foreign Keys · Strict RLS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic SSM Corridors Registry
CREATE TABLE IF NOT EXISTS ssm_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_code TEXT NOT NULL UNIQUE,
    corridor_label TEXT NOT NULL,
    max_bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (max_bandwidth_gbs > 0),
    routing_topology TEXT NOT NULL CHECK (routing_topology IN ('CONCURRENCY_FABRIC', 'PARALLEL_SCAN', 'HYBRID_ROUTER', 'DENSE_FALLBACK')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Hybrid Layer Matrix State Table (L0..L7)
CREATE TABLE IF NOT EXISTS ssm_layer_states (
    layer_id INT PRIMARY KEY CHECK (layer_id BETWEEN 0 AND 7),
    corridor_id UUID NOT NULL REFERENCES ssm_corridors(corridor_id) ON DELETE RESTRICT,
    hex_pointer TEXT NOT NULL UNIQUE,
    processed_tokens_k INT NOT NULL DEFAULT 512 CHECK (processed_tokens_k >= 0),
    scan_mode TEXT NOT NULL CHECK (scan_mode IN ('SSM-2', 'HYBRID-2', 'DENSE-FALLBACK')),
    scan_latency_ms NUMERIC(8, 4) NOT NULL CHECK (scan_latency_ms >= 0),
    state_dimension INT NOT NULL DEFAULT 128 CHECK (state_dimension BETWEEN 16 AND 2048),
    parity_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 100.00 CHECK (parity_rate_pct BETWEEN 0 AND 100),
    state_vector NUMERIC(10, 4)[] NOT NULL DEFAULT ARRAY[2.8100, 2.8500, 2.8200, 2.8400],
    lock_status TEXT NOT NULL DEFAULT 'HYBRID · LOCKED',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Partitioned Selective Scan Telemetry Log (Partitioned by Range on recorded_at)
CREATE TABLE IF NOT EXISTS ssm_scan_telemetry_logs (
    log_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    corridor_id UUID NOT NULL REFERENCES ssm_corridors(corridor_id) ON DELETE CASCADE,
    layer_id INT NOT NULL REFERENCES ssm_layer_states(layer_id) ON DELETE CASCADE,
    callsign TEXT NOT NULL CHECK (callsign IN ('CREW CHIEF', 'TELEMETRY', 'PIT WALL')),
    throughput_gbs NUMERIC(10, 2) NOT NULL,
    scan_latency_us NUMERIC(8, 4) NOT NULL,
    compaction_ratio_pct NUMERIC(5, 2) NOT NULL,
    log_message TEXT NOT NULL,
    PRIMARY KEY (log_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS ssm_scan_telemetry_logs_2026_q4
    PARTITION OF ssm_scan_telemetry_logs
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS ssm_scan_telemetry_logs_default
    PARTITION OF ssm_scan_telemetry_logs DEFAULT;

-- 4. High-Selectivity Indexes
CREATE INDEX IF NOT EXISTS idx_ssm_layer_states_corridor
    ON ssm_layer_states(corridor_id, scan_mode);

CREATE INDEX IF NOT EXISTS idx_ssm_telemetry_recorded_layer
    ON ssm_scan_telemetry_logs(recorded_at DESC, layer_id);

-- 5. Strict Row-Level Security (RLS) Policies
ALTER TABLE ssm_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ssm_layer_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE ssm_scan_telemetry_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY ssm_corridors_select_authenticated
    ON ssm_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY ssm_layer_states_select_authenticated
    ON ssm_layer_states
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY ssm_layer_states_update_operator
    ON ssm_layer_states
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (parity_rate_pct >= 0.0 AND state_dimension BETWEEN 16 AND 2048);

CREATE POLICY ssm_telemetry_insert_operator
    ON ssm_scan_telemetry_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL AND throughput_gbs >= 0);
