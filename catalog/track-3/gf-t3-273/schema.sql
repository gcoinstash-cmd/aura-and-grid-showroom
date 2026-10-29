-- ============================================================================
-- GF-T3-273 — SUPABASE / POSTGRESQL PRODUCTION PERSISTENCE SCHEMA
-- Ultra-Dense FP4 Quantization & Hardware-Accelerated Mixed-Precision Kernel
-- Clean-Room Permissive License: MIT
-- Includes Partitioned Tables, Foreign Keys, Indexes, and Strict RLS Policies
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic Quantization Corridors Registry
CREATE TABLE IF NOT EXISTS fp4_quantization_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_code VARCHAR(128) NOT NULL UNIQUE,
    peak_throughput_gbs INTEGER NOT NULL CHECK (peak_throughput_gbs > 0),
    nominal_scaling_latency_us NUMERIC(6, 3) NOT NULL DEFAULT 0.010,
    sub_byte_packing_bits SMALLINT NOT NULL DEFAULT 4 CHECK (sub_byte_packing_bits IN (4, 8, 16)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Hardware Block Scale Factors & Sub-Byte Matrix State
CREATE TABLE IF NOT EXISTS fp4_hardware_blocks (
    block_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id UUID NOT NULL REFERENCES fp4_quantization_corridors(corridor_id) ON DELETE CASCADE,
    owner_uid UUID NOT NULL,
    block_index SMALLINT NOT NULL CHECK (block_index BETWEEN 0 AND 7),
    block_label VARCHAR(16) NOT NULL,
    hex_pointer VARCHAR(16) NOT NULL,
    tokens_k INTEGER NOT NULL DEFAULT 256,
    precision_mode VARCHAR(32) NOT NULL CHECK (precision_mode IN ('FP4-BLOCK', 'FP4-MIXED', 'BF16-GUARD')),
    block_scale_factor NUMERIC(12, 6) NOT NULL CHECK (block_scale_factor > 0),
    scale_saturation_pct SMALLINT NOT NULL DEFAULT 100 CHECK (scale_saturation_pct BETWEEN 0 AND 100),
    latency_ms NUMERIC(8, 4) NOT NULL DEFAULT 0.0200,
    memory_reduction_pct NUMERIC(5, 2) NOT NULL DEFAULT 75.00,
    sqnr_db NUMERIC(8, 2) NOT NULL DEFAULT 32.40,
    packed_sub_bytes JSONB NOT NULL DEFAULT '[]'::JSONB,
    status_label VARCHAR(64) NOT NULL DEFAULT 'QUANTIZED · LOCKED',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (corridor_id, block_index)
);

-- 3. Partitioned Telemetry Audit Ledger (Range Partitioned by recorded_at)
CREATE TABLE IF NOT EXISTS fp4_telemetry_ledger (
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    owner_uid UUID NOT NULL,
    corridor_code VARCHAR(128) NOT NULL,
    block_index SMALLINT NOT NULL CHECK (block_index BETWEEN 0 AND 7),
    event_type VARCHAR(64) NOT NULL CHECK (
        event_type IN ('FP4_QUANT_BURST', 'OUTLIER_MAGNITUDE_SPIKE', 'MIXED_PRECISION_PASS', 'BUFFER_FLUSH_REZERO')
    ),
    throughput_gbs INTEGER NOT NULL,
    scaling_latency_us NUMERIC(6, 3) NOT NULL,
    processed_tokens_units BIGINT NOT NULL,
    scale_vector JSONB NOT NULL,
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS fp4_telemetry_ledger_2026_q4
    PARTITION OF fp4_telemetry_ledger
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS fp4_telemetry_ledger_2027_q1
    PARTITION OF fp4_telemetry_ledger
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

-- 4. High-Selectivity B-Tree & GIN Indexes
CREATE INDEX IF NOT EXISTS idx_fp4_blocks_corridor_idx ON fp4_hardware_blocks (corridor_id, block_index);
CREATE INDEX IF NOT EXISTS idx_fp4_blocks_owner_uid ON fp4_hardware_blocks (owner_uid);
CREATE INDEX IF NOT EXISTS idx_fp4_ledger_recorded_at ON fp4_telemetry_ledger (recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_fp4_ledger_owner_event ON fp4_telemetry_ledger (owner_uid, event_type);

-- 5. Strict Zero-Trust Row-Level Security (RLS) Policies
ALTER TABLE fp4_quantization_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp4_hardware_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp4_telemetry_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_corridors_read_authenticated
    ON fp4_quantization_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY policy_blocks_tenant_isolation_select
    ON fp4_hardware_blocks
    FOR SELECT
    TO authenticated
    USING (auth.uid() = owner_uid);

CREATE POLICY policy_blocks_tenant_isolation_insert
    ON fp4_hardware_blocks
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_uid);

CREATE POLICY policy_blocks_tenant_isolation_update
    ON fp4_hardware_blocks
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_uid)
    WITH CHECK (auth.uid() = owner_uid);

CREATE POLICY policy_ledger_tenant_isolation_select
    ON fp4_telemetry_ledger
    FOR SELECT
    TO authenticated
    USING (auth.uid() = owner_uid);

CREATE POLICY policy_ledger_tenant_isolation_insert
    ON fp4_telemetry_ledger
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_uid);

-- Seed Synthetic FP4 Corridors
INSERT INTO fp4_quantization_corridors (corridor_code, peak_throughput_gbs, nominal_scaling_latency_us, sub_byte_packing_bits)
VALUES
    ('FP4-CORRIDOR-ALPHA (ULTRA-DENSE-FP4-QUANTIZATION-FABRIC · 32800-GB/S)', 32800, 0.010, 4),
    ('FP4-CORRIDOR-BRAVO (HARDWARE-ACCELERATED-MIXED-PRECISION-ENGINE)', 34200, 0.010, 4),
    ('FP4-CORRIDOR-GAMMA (DYNAMIC-BLOCK-SCALING-FACTOR-ROUTER)', 31900, 0.010, 4),
    ('FP4-CORRIDOR-DELTA (FALLBACK-BF16-PRECISION-PASS)', 28400, 0.020, 16)
ON CONFLICT (corridor_code) DO NOTHING;
