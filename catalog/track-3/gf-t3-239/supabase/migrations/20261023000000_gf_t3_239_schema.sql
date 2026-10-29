-- SPDX-License-Identifier: MIT
-- GF-T3-239 Production PostgreSQL / Supabase Schema
-- Partitioned Tensor Parallelism Telemetry, Rank Shards, and Ring All-Reduce Audit Ledger
-- Zero Dollar-Quote Syntax Used (Strict Clean-Room SQL Standard)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tensor Parallel Corridors Registry
CREATE TABLE IF NOT EXISTS tp_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_code TEXT NOT NULL UNIQUE,
    world_size INTEGER NOT NULL CHECK (world_size IN (1, 2, 4, 8)),
    bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (bandwidth_gbs > 0),
    base_latency_us NUMERIC(10, 4) NOT NULL CHECK (base_latency_us > 0),
    overlap_target_pct NUMERIC(5, 2) NOT NULL CHECK (overlap_target_pct >= 0 AND overlap_target_pct <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Distributed GPU Rank Shards Table (Foreign Key to tp_corridors)
CREATE TABLE IF NOT EXISTS tp_rank_shards (
    shard_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id TEXT NOT NULL REFERENCES tp_corridors(corridor_id) ON DELETE CASCADE,
    rank_index INTEGER NOT NULL CHECK (rank_index >= 0 AND rank_index < 8),
    rank_label TEXT NOT NULL,
    shard_mode TEXT NOT NULL CHECK (shard_mode IN ('COL', 'ROW', 'COL_ROW')),
    shard_ratio TEXT NOT NULL,
    device_ptr_hex TEXT NOT NULL,
    ring_state TEXT NOT NULL CHECK (ring_state IN ('RING_SYNC', 'ALL_REDUCE_RING', 'DESYNC_FAULT', 'RESYNC_LOCKED')),
    local_weight_rows INTEGER NOT NULL CHECK (local_weight_rows > 0),
    local_weight_cols INTEGER NOT NULL CHECK (local_weight_cols > 0),
    peer_target_rank INTEGER NOT NULL CHECK (peer_target_rank >= 0 AND peer_target_rank < 8),
    comm_queue_depth INTEGER NOT NULL DEFAULT 0 CHECK (comm_queue_depth >= 0),
    shard_size_mb NUMERIC(8, 2) NOT NULL DEFAULT 32.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (corridor_id, rank_index)
);

-- 3. Partitioned Ring All-Reduce Execution Telemetry Ledger (Partitioned by RANGE on recorded_at)
CREATE TABLE IF NOT EXISTS tp_ring_telemetry_events (
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    corridor_id TEXT NOT NULL REFERENCES tp_corridors(corridor_id) ON DELETE RESTRICT,
    operator_uid UUID NOT NULL,
    active_ranks INTEGER NOT NULL CHECK (active_ranks BETWEEN 1 AND 8),
    ring_bandwidth_gbs NUMERIC(10, 2) NOT NULL,
    all_reduce_latency_us NUMERIC(10, 4) NOT NULL,
    processed_tokens BIGINT NOT NULL CHECK (processed_tokens >= 0),
    max_numerical_diff DOUBLE PRECISION NOT NULL CHECK (max_numerical_diff >= 0),
    overlap_efficiency_pct NUMERIC(5, 2) NOT NULL,
    callsign TEXT NOT NULL CHECK (callsign IN ('CREW CHIEF', 'PIT WALL', 'TELEMETRY')),
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS tp_ring_telemetry_events_2026_q4
    PARTITION OF tp_ring_telemetry_events
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS tp_ring_telemetry_events_default
    PARTITION OF tp_ring_telemetry_events DEFAULT;

-- 4. High-Selectivity B-Tree and BRIN Indexes
CREATE INDEX IF NOT EXISTS idx_tp_rank_shards_corridor_rank
    ON tp_rank_shards (corridor_id, rank_index);

CREATE INDEX IF NOT EXISTS idx_tp_ring_telemetry_corridor_time
    ON tp_ring_telemetry_events (corridor_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_tp_ring_telemetry_operator
    ON tp_ring_telemetry_events (operator_uid, recorded_at DESC);

-- 5. Strict Row-Level Security (RLS) Policies
ALTER TABLE tp_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tp_rank_shards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tp_ring_telemetry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY tp_corridors_read_authenticated
    ON tp_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY tp_rank_shards_read_authenticated
    ON tp_rank_shards
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY tp_rank_shards_Modify_authenticated
    ON tp_rank_shards
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (comm_queue_depth >= 0 AND rank_index BETWEEN 0 AND 7);

CREATE POLICY tp_ring_telemetry_insert_own
    ON tp_ring_telemetry_events
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = operator_uid);

CREATE POLICY tp_ring_telemetry_select_own
    ON tp_ring_telemetry_events
    FOR SELECT
    TO authenticated
    USING (auth.uid() = operator_uid);
