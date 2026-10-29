-- =============================================================================
-- GF-T3-267: DYNAMIC LORA SWAPPING & ZERO-COPY ADAPTER WEIGHT FUSION
-- PostgreSQL 16 / Supabase Production Schema (Partitioned + RLS Enforced)
-- Clean-Room IP License: MIT / Apache-2.0
-- Zero-Currency / Dimensionless Telemetry Standard
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. SYNTHETIC LORA FUSION CORRIDORS REGISTRY
CREATE TABLE IF NOT EXISTS lora_fusion_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_designation TEXT NOT NULL UNIQUE,
    peak_bandwidth_gbs NUMERIC(12, 2) NOT NULL CHECK (peak_bandwidth_gbs > 0),
    arena_base_ptr TEXT NOT NULL,
    zero_copy_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    max_concurrent_adapters INTEGER NOT NULL DEFAULT 8 CHECK (max_concurrent_adapters BETWEEN 1 AND 64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MULTI-TENANT ADAPTER ARENA SLOTS (K0..K7)
CREATE TABLE IF NOT EXISTS lora_adapter_arenas (
    adapter_slot_id TEXT PRIMARY KEY,
    corridor_id TEXT NOT NULL REFERENCES lora_fusion_corridors(corridor_id) ON DELETE CASCADE,
    tenant_org_id UUID NOT NULL,
    slot_index INTEGER NOT NULL CHECK (slot_index BETWEEN 0 AND 7),
    arena_hex_ptr TEXT NOT NULL,
    rank_r INTEGER NOT NULL CHECK (rank_r IN (4, 8, 16, 32, 64, 128)),
    scaling_alpha NUMERIC(8, 4) NOT NULL CHECK (scaling_alpha > 0),
    active_tokens BIGINT NOT NULL DEFAULT 256000 CHECK (active_tokens >= 0),
    swap_latency_ms NUMERIC(8, 4) NOT NULL DEFAULT 0.0200 CHECK (swap_latency_ms >= 0),
    cache_hit_ratio_pct NUMERIC(5, 2) NOT NULL DEFAULT 100.00 CHECK (cache_hit_ratio_pct BETWEEN 0 AND 100),
    fusion_state TEXT NOT NULL DEFAULT 'FUSED · LOCKED' CHECK (
        fusion_state IN ('FUSED · LOCKED', 'SWAP · STREAM', 'SPIKE · R-64', 'FAULT · ISOLATED')
    ),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (corridor_id, slot_index)
);

CREATE INDEX IF NOT EXISTS idx_lora_adapter_arenas_tenant
    ON lora_adapter_arenas (tenant_org_id, corridor_id);

CREATE INDEX IF NOT EXISTS idx_lora_adapter_arenas_state
    ON lora_adapter_arenas (fusion_state);

-- 3. PARTITIONED TELEMETRY & WEIGHT FUSION LEDGER (RANGE PARTITIONED BY RECORDED_AT)
CREATE TABLE IF NOT EXISTS lora_fusion_telemetry_ledger (
    event_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    corridor_id TEXT NOT NULL REFERENCES lora_fusion_corridors(corridor_id) ON DELETE RESTRICT,
    adapter_slot_id TEXT NOT NULL,
    tenant_org_id UUID NOT NULL,
    rank_r INTEGER NOT NULL,
    alpha_over_r NUMERIC(10, 6) NOT NULL,
    throughput_gbs NUMERIC(12, 2) NOT NULL,
    swap_latency_us NUMERIC(10, 4) NOT NULL,
    processed_tokens BIGINT NOT NULL,
    output_vector_norm NUMERIC(10, 4) NOT NULL,
    fragmentation_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (fragmentation_pct = 0.00),
    payload_sha256 TEXT NOT NULL,
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS lora_fusion_telemetry_ledger_2026_q4
    PARTITION OF lora_fusion_telemetry_ledger
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS lora_fusion_telemetry_ledger_2027_q1
    PARTITION OF lora_fusion_telemetry_ledger
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

CREATE INDEX IF NOT EXISTS idx_telemetry_ledger_corridor_time
    ON lora_fusion_telemetry_ledger (corridor_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_ledger_tenant_time
    ON lora_fusion_telemetry_ledger (tenant_org_id, recorded_at DESC);

-- 4. STRICT ROW-LEVEL SECURITY (RLS) ENFORCEMENT
ALTER TABLE lora_fusion_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE lora_adapter_arenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lora_fusion_telemetry_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_corridors_read_authenticated
    ON lora_fusion_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY rls_adapter_arenas_tenant_isolation
    ON lora_adapter_arenas
    FOR ALL
    TO authenticated
    USING (tenant_org_id::TEXT = COALESCE(current_setting('request.jwt.claim.tenant_org_id', true), ''))
    WITH CHECK (tenant_org_id::TEXT = COALESCE(current_setting('request.jwt.claim.tenant_org_id', true), ''));

CREATE POLICY rls_telemetry_ledger_tenant_isolation
    ON lora_fusion_telemetry_ledger
    FOR SELECT
    TO authenticated
    USING (tenant_org_id::TEXT = COALESCE(current_setting('request.jwt.claim.tenant_org_id', true), ''));

CREATE POLICY rls_telemetry_ledger_insert_isolation
    ON lora_fusion_telemetry_ledger
    FOR INSERT
    TO authenticated
    WITH CHECK (
        tenant_org_id::TEXT = COALESCE(current_setting('request.jwt.claim.tenant_org_id', true), '')
        AND fragmentation_pct = 0.00
    );

-- 5. SEED CANONICAL SYNTHETIC CORRIDORS
INSERT INTO lora_fusion_corridors (corridor_id, corridor_designation, peak_bandwidth_gbs, arena_base_ptr, zero_copy_enabled, max_concurrent_adapters)
VALUES
    ('LORA-CORRIDOR-ALPHA', 'LORA-CORRIDOR-ALPHA (DYNAMIC-ADAPTER-WEIGHT-FUSION-FABRIC · 28000-GB/S)', 28000.00, '0xFF8DC0', TRUE, 8),
    ('LORA-CORRIDOR-BRAVO', 'LORA-CORRIDOR-BRAVO (ZERO-COPY-WORKSPACE-ARENA-ALLOCATOR)', 26400.00, '0xFF8EC0', TRUE, 8),
    ('LORA-CORRIDOR-GAMMA', 'LORA-CORRIDOR-GAMMA (SUB-MICROSECOND-ADAPTER-SWAP-ROUTER)', 27200.00, '0xFF8FC0', TRUE, 8),
    ('LORA-CORRIDOR-DELTA', 'LORA-CORRIDOR-DELTA (FALLBACK-STATIC-BASE-WEIGHT-PASS)', 19800.00, '0xFF90C0', FALSE, 8)
ON CONFLICT (corridor_id) DO NOTHING;
