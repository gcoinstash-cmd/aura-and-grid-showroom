-- ============================================================================
-- GF-T3-258 PRODUCTION POSTGRESQL / SUPABASE SCHEMA
-- Chunked Prefill & Iterative Scheduling Hybrid Pipeline Persistence Layer
-- Includes Partitioned Tables, Foreign Keys, Indexes, RBAC, and Strict RLS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Synthetic Chunked Corridors Reference Table
CREATE TABLE IF NOT EXISTS gf_t3_258_corridors (
    corridor_id VARCHAR(64) PRIMARY KEY,
    corridor_label VARCHAR(160) NOT NULL,
    bandwidth_gbs INTEGER NOT NULL CHECK (bandwidth_gbs > 0),
    slice_budget_ms INTEGER NOT NULL DEFAULT 16 CHECK (slice_budget_ms <= 16),
    schedule_latency_us NUMERIC(6, 3) NOT NULL DEFAULT 0.010,
    mode VARCHAR(48) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Partitioned Schedule Execution Runs Table (Partitioned by Range on executed_at)
CREATE TABLE IF NOT EXISTS gf_t3_258_schedule_runs (
    run_id UUID NOT NULL DEFAULT gen_random_uuid(),
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_org_id UUID NOT NULL,
    corridor_id VARCHAR(64) NOT NULL REFERENCES gf_t3_258_corridors(corridor_id) ON DELETE RESTRICT,
    chunked_throughput_gbs INTEGER NOT NULL,
    scheduling_latency_us NUMERIC(6, 3) NOT NULL,
    active_chunks SMALLINT NOT NULL CHECK (active_chunks BETWEEN 1 AND 8),
    processed_tokens BIGINT NOT NULL,
    pipeline_state VARCHAR(32) NOT NULL DEFAULT 'Hybrid Active',
    pointer_hex VARCHAR(16) NOT NULL DEFAULT '0x6F8DC0',
    audit_hash VARCHAR(64) NOT NULL,
    PRIMARY KEY (run_id, executed_at)
) PARTITION BY RANGE (executed_at);

CREATE TABLE IF NOT EXISTS gf_t3_258_schedule_runs_2026_q4
    PARTITION OF gf_t3_258_schedule_runs
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS gf_t3_258_schedule_runs_2027_q1
    PARTITION OF gf_t3_258_schedule_runs
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

-- 3. Chunk Matrix Slot Telemetry Table (C0-C7)
CREATE TABLE IF NOT EXISTS gf_t3_258_chunk_slots (
    slot_record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL,
    tenant_org_id UUID NOT NULL,
    chunk_id VARCHAR(8) NOT NULL CHECK (chunk_id IN ('C0','C1','C2','C3','C4','C5','C6','C7')),
    hex_ptr VARCHAR(16) NOT NULL,
    tokens INTEGER NOT NULL CHECK (tokens > 0),
    budget_ms SMALLINT NOT NULL DEFAULT 16 CHECK (budget_ms <= 16),
    slice_ms SMALLINT NOT NULL DEFAULT 16 CHECK (slice_ms <= 16),
    latency_ms NUMERIC(6, 3) NOT NULL,
    slot_state VARCHAR(32) NOT NULL,
    FOREIGN KEY (run_id, executed_at) REFERENCES gf_t3_258_schedule_runs(run_id, executed_at) ON DELETE CASCADE
);

-- 4. Sensitive Folder RBAC & Automated File Access Audit Log Table
CREATE TABLE IF NOT EXISTS gf_t3_258_file_access_audit (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_org_id UUID NOT NULL,
    actor_role VARCHAR(32) NOT NULL CHECK (actor_role IN ('PRINCIPAL_ARCHITECT', 'CREW_CHIEF', 'SECURITY_AUDITOR', 'EXTERNAL_OBSERVER')),
    target_folder VARCHAR(128) NOT NULL,
    operation VARCHAR(64) NOT NULL,
    access_decision VARCHAR(16) NOT NULL CHECK (access_decision IN ('GRANTED', 'DENIED')),
    encrypted_compliance_seal VARCHAR(128) NOT NULL,
    chain_sha256 VARCHAR(64) NOT NULL
);

-- 5. High-Selectivity Indexes
CREATE INDEX IF NOT EXISTS idx_gf_t3_258_runs_tenant_time
    ON gf_t3_258_schedule_runs (tenant_org_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_gf_t3_258_slots_run_chunk
    ON gf_t3_258_chunk_slots (run_id, chunk_id);

CREATE INDEX IF NOT EXISTS idx_gf_t3_258_audit_role_folder
    ON gf_t3_258_file_access_audit (tenant_org_id, actor_role, target_folder, logged_at DESC);

-- 6. Strict Row-Level Security (RLS) Policies
ALTER TABLE gf_t3_258_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_258_schedule_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_258_chunk_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_258_file_access_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_corridors_read_authenticated
    ON gf_t3_258_corridors
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY rls_schedule_runs_tenant_isolation
    ON gf_t3_258_schedule_runs
    FOR ALL
    TO authenticated
    USING (tenant_org_id = ( nullif(current_setting('request.jwt.claim.tenant_org_id', true), '')::uuid ))
    WITH CHECK (tenant_org_id = ( nullif(current_setting('request.jwt.claim.tenant_org_id', true), '')::uuid ));

CREATE POLICY rls_chunk_slots_tenant_isolation
    ON gf_t3_258_chunk_slots
    FOR ALL
    TO authenticated
    USING (tenant_org_id = ( nullif(current_setting('request.jwt.claim.tenant_org_id', true), '')::uuid ))
    WITH CHECK (tenant_org_id = ( nullif(current_setting('request.jwt.claim.tenant_org_id', true), '')::uuid ));

CREATE POLICY rls_file_audit_rbac_enforcement
    ON gf_t3_258_file_access_audit
    FOR SELECT
    TO authenticated
    USING (
        tenant_org_id = ( nullif(current_setting('request.jwt.claim.tenant_org_id', true), '')::uuid )
        AND current_setting('request.jwt.claim.rbac_role', true) IN ('PRINCIPAL_ARCHITECT', 'CREW_CHIEF', 'SECURITY_AUDITOR')
    );
