-- SPDX-License-Identifier: MIT
-- GF-T3-231: Production PostgreSQL / Supabase Persistence Schema
-- Partitioned FP8 Telemetry Tables, Foreign Keys, Indexes, and Strict Row-Level Security (RLS)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Synthetic FP8 Corridors Registry Table
CREATE TABLE IF NOT EXISTS fp8_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_code VARCHAR(96) NOT NULL UNIQUE,
    default_format VARCHAR(8) NOT NULL CHECK (default_format IN ('E4M3', 'E5M2')),
    exponent_bias SMALLINT NOT NULL CHECK (exponent_bias IN (7, 15)),
    max_normal_bound NUMERIC(12, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Partitioned Quantization Block Telemetry Table (Partitioned by Range on recorded_at)
CREATE TABLE IF NOT EXISTS fp8_quant_blocks (
    record_id UUID NOT NULL DEFAULT gen_random_uuid(),
    chassis_code VARCHAR(32) NOT NULL DEFAULT 'GF-T3-231',
    corridor_id UUID NOT NULL REFERENCES fp8_corridors(corridor_id) ON DELETE RESTRICT,
    block_index VARCHAR(8) NOT NULL CHECK (block_index IN ('B0','B1','B2','B3','B4','B5','B6','B7')),
    fp8_format VARCHAR(8) NOT NULL CHECK (fp8_format IN ('E4M3', 'E5M2')),
    amax_value NUMERIC(14, 6) NOT NULL CHECK (amax_value >= 0),
    staged_scale NUMERIC(14, 8) NOT NULL CHECK (staged_scale > 0),
    clipping_ratio NUMERIC(6, 4) NOT NULL CHECK (clipping_ratio >= 0 AND clipping_ratio <= 1),
    snr_db NUMERIC(6, 2) NOT NULL,
    tensor_pointer VARCHAR(32) NOT NULL,
    kernel_state VARCHAR(32) NOT NULL CHECK (kernel_state IN ('QUANT_OPTIMIZED', 'FALLBACK_FP16', 'OUTLIER_SPIKE')),
    operator_uid UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (record_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS fp8_quant_blocks_2026_q4 PARTITION OF fp8_quant_blocks
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS fp8_quant_blocks_default PARTITION OF fp8_quant_blocks DEFAULT;

-- 3. APA Encrypted Handoff & Cryptographic Signature Ledger
CREATE TABLE IF NOT EXISTS apa_transfer_ledger (
    escrow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chassis_code VARCHAR(32) NOT NULL DEFAULT 'GF-T3-231',
    cipher_suite VARCHAR(64) NOT NULL DEFAULT 'AES-256-GCM + ED25519-SHA256',
    principal_signature VARCHAR(64) NOT NULL,
    acquirer_signature VARCHAR(64) NOT NULL,
    merkle_escrow_root VARCHAR(64) NOT NULL UNIQUE,
    operator_uid UUID NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. High-Selectivity Composite Indexes
CREATE INDEX IF NOT EXISTS idx_fp8_blocks_corridor_time ON fp8_quant_blocks (corridor_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_fp8_blocks_index_state ON fp8_quant_blocks (block_index, kernel_state);
CREATE INDEX IF NOT EXISTS idx_apa_ledger_merkle ON apa_transfer_ledger (merkle_escrow_root);

-- 5. Strict Row-Level Security (RLS) Policies
ALTER TABLE fp8_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp8_quant_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE apa_transfer_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_fp8_corridors_read_authenticated
    ON fp8_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY rls_fp8_quant_blocks_tenant_isolation
    ON fp8_quant_blocks
    FOR ALL
    TO authenticated
    USING (operator_uid = auth.uid())
    WITH CHECK (operator_uid = auth.uid());

CREATE POLICY rls_apa_transfer_ledger_stakeholder_isolation
    ON apa_transfer_ledger
    FOR ALL
    TO authenticated
    USING (operator_uid = auth.uid())
    WITH CHECK (operator_uid = auth.uid());
