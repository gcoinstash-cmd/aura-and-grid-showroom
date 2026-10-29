-- =============================================================================
-- GF-T3-276 · KV-CACHE DIRECT MEMORY ACCESS & PCIE GEN-6 OFFLOADING SCHEMA
-- Clean-Room Sovereign PostgreSQL / Supabase Persistence Layer
-- Zero-Trust Row-Level Security (RLS) · Partitioned Telemetry · MIT License
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic DMA Offload Corridor Registry
CREATE TABLE IF NOT EXISTS pcie_corridor_configs (
    corridor_id TEXT PRIMARY KEY,
    corridor_label TEXT NOT NULL UNIQUE,
    architecture_mode TEXT NOT NULL CHECK (architecture_mode IN (
        'KV_CACHE_DIRECT_MEMORY_ACCESS_FABRIC',
        'PCIE_GEN6_HOST_OFFLOADING_ENGINE',
        'ASYNC_BUFFER_RING_SCHEDULER',
        'FALLBACK_GPU_VRAM_MONOLITHIC_PASS'
    )),
    base_pcie_bw_gbs NUMERIC(12, 2) NOT NULL CHECK (base_pcie_bw_gbs > 0),
    target_throughput_gbs NUMERIC(12, 2) NOT NULL CHECK (target_throughput_gbs > 0),
    nominal_latency_us NUMERIC(8, 4) NOT NULL CHECK (nominal_latency_us >= 0.001),
    channel_count INTEGER NOT NULL DEFAULT 8 CHECK (channel_count BETWEEN 1 AND 64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pcie_corridor_mode
    ON pcie_corridor_configs (architecture_mode);

-- 2. DMA Channel Ring Descriptors (D0..D7)
CREATE TABLE IF NOT EXISTS kv_cache_arena_blocks (
    block_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id TEXT NOT NULL REFERENCES pcie_corridor_configs(corridor_id) ON DELETE CASCADE,
    channel_index INTEGER NOT NULL CHECK (channel_index BETWEEN 0 AND 7),
    channel_tag TEXT NOT NULL CHECK (channel_tag IN ('D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7')),
    pointer_hex TEXT NOT NULL,
    allocated_tokens INTEGER NOT NULL CHECK (allocated_tokens >= 0),
    block_size_gb NUMERIC(10, 4) NOT NULL CHECK (block_size_gb > 0),
    transfer_tau_ms NUMERIC(10, 4) NOT NULL CHECK (transfer_tau_ms > 0),
    channel_bw_gbs NUMERIC(12, 2) NOT NULL CHECK (channel_bw_gbs >= 0),
    sync_parity_pct NUMERIC(5, 2) NOT NULL CHECK (sync_parity_pct BETWEEN 0 AND 100),
    dma_state TEXT NOT NULL CHECK (dma_state IN ('STREAMING · LOCKED', 'SWAP_REROUTE · FAULT', 'PREFETCH · LOCKED', 'RING_SYNC · LOCKED')),
    tenant_id UUID NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (corridor_id, channel_index, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_kv_arena_corridor_channel
    ON kv_cache_arena_blocks (corridor_id, channel_index);

CREATE INDEX IF NOT EXISTS idx_kv_arena_tenant
    ON kv_cache_arena_blocks (tenant_id);

-- 3. Partitioned High-Frequency DMA Telemetry Stream
CREATE TABLE IF NOT EXISTS dma_telemetry_events (
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    corridor_id TEXT NOT NULL REFERENCES pcie_corridor_configs(corridor_id) ON DELETE RESTRICT,
    channel_tag TEXT NOT NULL,
    pointer_hex TEXT NOT NULL,
    aggregate_throughput_gbs NUMERIC(12, 2) NOT NULL,
    offload_latency_us NUMERIC(8, 4) NOT NULL,
    processed_tokens BIGINT NOT NULL,
    ring_buffer_parity_pct NUMERIC(5, 2) NOT NULL,
    event_trigger TEXT NOT NULL,
    callsign TEXT NOT NULL CHECK (callsign IN ('CREW CHIEF', 'TELEMETRY', 'PIT WALL')),
    tenant_id UUID NOT NULL,
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS dma_telemetry_events_y2026m10
    PARTITION OF dma_telemetry_events
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS dma_telemetry_events_y2026m11
    PARTITION OF dma_telemetry_events
    FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS dma_telemetry_events_default
    PARTITION OF dma_telemetry_events DEFAULT;

CREATE INDEX IF NOT EXISTS idx_dma_telemetry_recorded_brin
    ON dma_telemetry_events USING BRIN (recorded_at);

CREATE INDEX IF NOT EXISTS idx_dma_telemetry_tenant_corridor
    ON dma_telemetry_events (tenant_id, corridor_id, recorded_at DESC);

-- 4. APA Acquisition & Cryptographic Audit Ledger
CREATE TABLE IF NOT EXISTS apa_audit_ledger (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chassis_code TEXT NOT NULL DEFAULT 'GF-T3-276',
    action_type TEXT NOT NULL CHECK (action_type IN ('ACQUIRE TITLE (APA)', 'INQUIRE VAULT BUYOUT', 'EXPORT AUDIT')),
    corridor_id TEXT NOT NULL REFERENCES pcie_corridor_configs(corridor_id),
    verified_throughput_gbs NUMERIC(12, 2) NOT NULL,
    verified_latency_us NUMERIC(8, 4) NOT NULL,
    manifest_sha256 TEXT NOT NULL,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apa_ledger_tenant
    ON apa_audit_ledger (tenant_id, created_at DESC);

-- 5. Strict Zero-Trust Row-Level Security (RLS)
ALTER TABLE pcie_corridor_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kv_cache_arena_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dma_telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE apa_audit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY pcie_corridor_read_policy
    ON pcie_corridor_configs
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY kv_arena_tenant_isolation_policy
    ON kv_cache_arena_blocks
    FOR ALL
    TO authenticated
    USING (tenant_id = auth.uid())
    WITH CHECK (tenant_id = auth.uid());

CREATE POLICY dma_telemetry_tenant_isolation_policy
    ON dma_telemetry_events
    FOR ALL
    TO authenticated
    USING (tenant_id = auth.uid())
    WITH CHECK (tenant_id = auth.uid());

CREATE POLICY apa_ledger_tenant_isolation_policy
    ON apa_audit_ledger
    FOR ALL
    TO authenticated
    USING (tenant_id = auth.uid())
    WITH CHECK (tenant_id = auth.uid());

-- 6. Seed Default Clean-Room DMA Corridors
INSERT INTO pcie_corridor_configs (
    corridor_id,
    corridor_label,
    architecture_mode,
    base_pcie_bw_gbs,
    target_throughput_gbs,
    nominal_latency_us,
    channel_count
) VALUES
    (
        'DMA-CORRIDOR-ALPHA',
        'DMA-CORRIDOR-ALPHA (KV-CACHE-DIRECT-MEMORY-ACCESS-FABRIC · 35200-GB/S)',
        'KV_CACHE_DIRECT_MEMORY_ACCESS_FABRIC',
        24960.00,
        35200.00,
        0.0100,
        8
    ),
    (
        'DMA-CORRIDOR-BRAVO',
        'DMA-CORRIDOR-BRAVO (PCIE-GEN6-HOST-OFFLOADING-ENGINE)',
        'PCIE_GEN6_HOST_OFFLOADING_ENGINE',
        21640.00,
        31880.00,
        0.0140,
        8
    ),
    (
        'DMA-CORRIDOR-GAMMA',
        'DMA-CORRIDOR-GAMMA (ASYNC-BUFFER-RING-SCHEDULER)',
        'ASYNC_BUFFER_RING_SCHEDULER',
        23120.00,
        33360.00,
        0.0120,
        8
    ),
    (
        'DMA-CORRIDOR-DELTA',
        'DMA-CORRIDOR-DELTA (FALLBACK-GPU-VRAM-MONOLITHIC-PASS)',
        'FALLBACK_GPU_VRAM_MONOLITHIC_PASS',
        14200.00,
        24440.00,
        0.0280,
        8
    )
ON CONFLICT (corridor_id) DO NOTHING;
