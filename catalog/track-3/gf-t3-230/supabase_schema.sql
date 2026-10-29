-- GF-T3-230: Production PostgreSQL / Supabase Persistence Schema
-- Partitioned Ring-AllReduce Telemetry, Zero-Copy DMA Registry, RBAC & Audit Logs
-- Strictly Zero Dollar Characters Used Anywhere
-- SPDX-License-Identifier: MIT

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic Ring Corridors Catalog
CREATE TABLE IF NOT EXISTS gf_t3_230_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_code VARCHAR(120) NOT NULL UNIQUE,
    peak_bandwidth_gbps NUMERIC(8, 2) NOT NULL DEFAULT 900.00,
    nominal_bandwidth_gbps NUMERIC(8, 2) NOT NULL DEFAULT 880.00,
    base_latency_ms NUMERIC(8, 4) NOT NULL DEFAULT 0.1400,
    zero_copy_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Partitioned Ring-AllReduce Execution Telemetry Table (Partitioned by Range on executed_at)
CREATE TABLE IF NOT EXISTS gf_t3_230_ring_telemetry (
    telemetry_id UUID NOT NULL DEFAULT gen_random_uuid(),
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_org_id UUID NOT NULL,
    operator_role VARCHAR(40) NOT NULL CHECK (operator_role IN ('CREW_CHIEF_ADMIN', 'TELEMETRY_OPERATOR', 'COMPLIANCE_AUDITOR')),
    corridor_id UUID NOT NULL REFERENCES gf_t3_230_corridors(corridor_id) ON DELETE RESTRICT,
    active_gpus SMALLINT NOT NULL DEFAULT 8 CHECK (active_gpus BETWEEN 2 AND 64),
    scatter_reduce_steps SMALLINT NOT NULL DEFAULT 7,
    all_gather_steps SMALLINT NOT NULL DEFAULT 7,
    achieved_bandwidth_gbps NUMERIC(8, 2) NOT NULL,
    allreduce_latency_ms NUMERIC(8, 4) NOT NULL,
    processed_tokens BIGINT NOT NULL,
    packet_loss_spike BOOLEAN NOT NULL DEFAULT FALSE,
    parity_sha256 CHAR(64) NOT NULL,
    PRIMARY KEY (telemetry_id, executed_at)
) PARTITION BY RANGE (executed_at);

CREATE TABLE IF NOT EXISTS gf_t3_230_ring_telemetry_2026_q4
    PARTITION OF gf_t3_230_ring_telemetry
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS gf_t3_230_ring_telemetry_2027_q1
    PARTITION OF gf_t3_230_ring_telemetry
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

-- 3. Zero-Copy Pinned GPU DMA Buffer Allocation Table
CREATE TABLE IF NOT EXISTS gf_t3_230_dma_buffers (
    buffer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_org_id UUID NOT NULL,
    gpu_node_code VARCHAR(8) NOT NULL CHECK (gpu_node_code IN ('G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7')),
    base_address_hex VARCHAR(16) NOT NULL,
    chunk_dims VARCHAR(32) NOT NULL DEFAULT '[4096, 4096]',
    peer_route VARCHAR(32) NOT NULL,
    ring_phase VARCHAR(32) NOT NULL CHECK (ring_phase IN ('SCATTER_REDUCE', 'ALL_GATHER', 'CONVERGED', 'IDLE')),
    ref_count INTEGER NOT NULL DEFAULT 1 CHECK (ref_count >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Immutable Security & Compliance Audit Trail
CREATE TABLE IF NOT EXISTS gf_t3_230_security_audit_log (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_org_id UUID NOT NULL,
    actor_id UUID NOT NULL,
    actor_role VARCHAR(40) NOT NULL,
    mfa_verified BOOLEAN NOT NULL DEFAULT TRUE,
    action_type VARCHAR(64) NOT NULL,
    anomaly_score NUMERIC(5, 4) NOT NULL DEFAULT 0.0120,
    signature_sha256 CHAR(64) NOT NULL,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- High-Selectivity B-Tree Indexes for Concurrent High-Volume Reads/Writes
CREATE INDEX IF NOT EXISTS idx_gf_t3_230_telemetry_tenant_time
    ON gf_t3_230_ring_telemetry (tenant_org_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_gf_t3_230_dma_tenant_gpu
    ON gf_t3_230_dma_buffers (tenant_org_id, gpu_node_code);

CREATE INDEX IF NOT EXISTS idx_gf_t3_230_audit_tenant_logged
    ON gf_t3_230_security_audit_log (tenant_org_id, logged_at DESC);

-- Strict Row-Level Security (RLS) Enforcement
ALTER TABLE gf_t3_230_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_230_ring_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_230_dma_buffers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_230_security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_corridors_read_all
    ON gf_t3_230_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY rls_telemetry_tenant_isolation
    ON gf_t3_230_ring_telemetry
    FOR ALL
    TO authenticated
    USING (tenant_org_id = CAST(current_setting('request.jwt.claim.tenant_org_id', true) AS UUID))
    WITH CHECK (tenant_org_id = CAST(current_setting('request.jwt.claim.tenant_org_id', true) AS UUID));

CREATE POLICY rls_dma_buffers_tenant_isolation
    ON gf_t3_230_dma_buffers
    FOR ALL
    TO authenticated
    USING (tenant_org_id = CAST(current_setting('request.jwt.claim.tenant_org_id', true) AS UUID))
    WITH CHECK (tenant_org_id = CAST(current_setting('request.jwt.claim.tenant_org_id', true) AS UUID));

CREATE POLICY rls_audit_log_rbac_enforcement
    ON gf_t3_230_security_audit_log
    FOR SELECT
    TO authenticated
    USING (
        tenant_org_id = CAST(current_setting('request.jwt.claim.tenant_org_id', true) AS UUID)
        AND current_setting('request.jwt.claim.role', true) IN ('CREW_CHIEF_ADMIN', 'COMPLIANCE_AUDITOR')
    );
