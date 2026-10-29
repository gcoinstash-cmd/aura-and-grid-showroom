-- =============================================================================
-- GF-T3-276 · SUPABASE MIGRATION MIRROR (KV-CACHE DMA & PCIE GEN-6 OFFLOAD)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

CREATE TABLE IF NOT EXISTS dma_telemetry_events_default
    PARTITION OF dma_telemetry_events DEFAULT;

ALTER TABLE pcie_corridor_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kv_cache_arena_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dma_telemetry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY pcie_corridor_read_policy
    ON pcie_corridor_configs FOR SELECT TO authenticated USING (true);

CREATE POLICY kv_arena_tenant_isolation_policy
    ON kv_cache_arena_blocks FOR ALL TO authenticated
    USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

CREATE POLICY dma_telemetry_tenant_isolation_policy
    ON dma_telemetry_events FOR ALL TO authenticated
    USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
