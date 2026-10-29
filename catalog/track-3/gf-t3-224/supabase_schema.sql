-- GF-T3-224 Production PostgreSQL / Supabase Persistence Schema
-- Partitioned Telemetry Tables, Foreign Keys, Indexes, and Row-Level Security (RLS)
-- SPDX-License-Identifier: MIT

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Synthetic Tensor-Parallel Corridors Registry
CREATE TABLE IF NOT EXISTS tp_corridors (
    corridor_id TEXT PRIMARY KEY CHECK (char_length(corridor_id) <= 64),
    corridor_label TEXT NOT NULL,
    world_size INTEGER NOT NULL CHECK (world_size BETWEEN 2 AND 64),
    peak_bandwidth_gbps NUMERIC(10, 2) NOT NULL CHECK (peak_bandwidth_gbps > 0),
    base_latency_ms NUMERIC(8, 4) NOT NULL CHECK (base_latency_ms >= 0),
    overlap_efficiency_target NUMERIC(5, 2) NOT NULL CHECK (overlap_efficiency_target BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Partitioned Ring All-Reduce Execution Ledger (Partitioned by Range on recorded_at)
CREATE TABLE IF NOT EXISTS ring_all_reduce_runs (
    run_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    owner_uid UUID NOT NULL,
    corridor_id TEXT NOT NULL REFERENCES tp_corridors(corridor_id) ON DELETE RESTRICT,
    world_size INTEGER NOT NULL CHECK (world_size >= 2),
    phase_state TEXT NOT NULL CHECK (phase_state IN ('IDLE', 'SCATTER-REDUCE', 'ALL-GATHER', 'LOCKED', 'FAULT')),
    step_index INTEGER NOT NULL CHECK (step_index >= 0),
    effective_bandwidth_gbps NUMERIC(10, 2) NOT NULL,
    all_reduce_overhead_ms NUMERIC(8, 3) NOT NULL,
    ring_efficiency_pct NUMERIC(5, 2) NOT NULL,
    synchronized_units INTEGER NOT NULL CHECK (synchronized_units >= 0),
    global_parity_checksum TEXT NOT NULL,
    PRIMARY KEY (run_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS ring_all_reduce_runs_y2026
    PARTITION OF ring_all_reduce_runs
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS ring_all_reduce_runs_default
    PARTITION OF ring_all_reduce_runs DEFAULT;

-- 3. Per-Rank Sharded Tensor Partition State Table
CREATE TABLE IF NOT EXISTS rank_shard_partitions (
    shard_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    owner_uid UUID NOT NULL,
    rank_id INTEGER NOT NULL CHECK (rank_id >= 0 AND rank_id < 64),
    memory_address TEXT NOT NULL,
    reduced_chunk_index INTEGER NOT NULL,
    accumulated_passes INTEGER NOT NULL DEFAULT 0,
    chunk_payload JSONB NOT NULL,
    parity_hash TEXT NOT NULL,
    packet_drop_fault BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (run_id, recorded_at) REFERENCES ring_all_reduce_runs(run_id, recorded_at) ON DELETE CASCADE
);

-- 4. Indexes for High-Throughput Telemetry Queries
CREATE INDEX IF NOT EXISTS idx_ring_runs_corridor_recorded
    ON ring_all_reduce_runs (corridor_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_ring_runs_owner_uid
    ON ring_all_reduce_runs (owner_uid, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_rank_shards_run_rank
    ON rank_shard_partitions (run_id, rank_id);

-- 5. Strict Zero-Trust Row-Level Security (RLS) Policies
ALTER TABLE tp_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ring_all_reduce_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_shard_partitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tp_corridors_read_authenticated
    ON tp_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY ring_runs_select_own
    ON ring_all_reduce_runs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = owner_uid);

CREATE POLICY ring_runs_insert_own
    ON ring_all_reduce_runs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_uid);

CREATE POLICY rank_shards_select_own
    ON rank_shard_partitions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = owner_uid);

CREATE POLICY rank_shards_insert_own
    ON rank_shard_partitions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_uid);

-- 6. Seed Default Synthetic Distributed Corridors
INSERT INTO tp_corridors (corridor_id, corridor_label, world_size, peak_bandwidth_gbps, base_latency_ms, overlap_efficiency_target)
VALUES
    ('TP-CORRIDOR-ALPHA', 'TP-CORRIDOR-ALPHA (4-GPU · NVLINK-RING-FABRIC)', 4, 840.00, 0.0800, 96.20),
    ('TP-CORRIDOR-BRAVO', 'TP-CORRIDOR-BRAVO (8-GPU · HYBRID-TORUS-MESH)', 8, 1120.00, 0.1400, 94.80),
    ('TP-CORRIDOR-GAMMA', 'TP-CORRIDOR-GAMMA (COMM-COMP-STREAM-OVERLAP)', 4, 960.00, 0.0600, 98.10),
    ('TP-CORRIDOR-DELTA', 'TP-CORRIDOR-DELTA (BUCKETED-ALL-REDUCE-FALLBACK)', 4, 620.00, 0.1900, 89.40)
ON CONFLICT (corridor_id) DO NOTHING;
