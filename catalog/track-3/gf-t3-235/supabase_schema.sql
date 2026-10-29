-- GF-T3-235: Production PostgreSQL / Supabase Persistence Layer
-- Includes Partitioned Telemetry Tables, Foreign Keys, Indexes, RBAC, and Strict RLS Policies
-- Zero-Dollar Gate Compliant

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Synthetic MMA Corridors Reference Table
CREATE TABLE IF NOT EXISTS gf_t3_235_corridors (
    corridor_id TEXT PRIMARY KEY,
    corridor_label TEXT NOT NULL UNIQUE,
    swizzle_mask INTEGER NOT NULL CHECK (swizzle_mask >= 0 AND swizzle_mask <= 15),
    interleaved_stages INTEGER NOT NULL CHECK (interleaved_stages BETWEEN 1 AND 16),
    nominal_tflops NUMERIC(10, 2) NOT NULL CHECK (nominal_tflops > 0),
    nominal_latency_us NUMERIC(10, 4) NOT NULL CHECK (nominal_latency_us > 0),
    active_warps INTEGER NOT NULL CHECK (active_warps BETWEEN 1 AND 64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enterprise RBAC Operators Table
CREATE TABLE IF NOT EXISTS gf_t3_235_operators (
    operator_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_org_id UUID NOT NULL,
    role_code TEXT NOT NULL CHECK (role_code IN ('CREW_CHIEF_ADMIN', 'TELEMETRY_OPERATOR', 'COMPLIANCE_AUDITOR')),
    mfa_verified BOOLEAN NOT NULL DEFAULT FALSE,
    encryption_key_fingerprint TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Partitioned Warp Telemetry Runs Table (Partitioned by Range on recorded_at)
CREATE TABLE IF NOT EXISTS gf_t3_235_telemetry_runs (
    run_id UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_org_id UUID NOT NULL,
    operator_id UUID NOT NULL REFERENCES gf_t3_235_operators(operator_id) ON DELETE RESTRICT,
    corridor_id TEXT NOT NULL REFERENCES gf_t3_235_corridors(corridor_id) ON DELETE RESTRICT,
    pass_index INTEGER NOT NULL CHECK (pass_index >= 0),
    throughput_tflops NUMERIC(10, 2) NOT NULL,
    mma_latency_us NUMERIC(10, 4) NOT NULL,
    active_warps INTEGER NOT NULL CHECK (active_warps BETWEEN 0 AND 32),
    bank_conflicts INTEGER NOT NULL CHECK (bank_conflicts >= 0),
    processed_tokens_units BIGINT NOT NULL CHECK (processed_tokens_units >= 0),
    pipeline_state TEXT NOT NULL,
    accumulator_sha256 TEXT NOT NULL,
    PRIMARY KEY (run_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS gf_t3_235_telemetry_runs_2026_q4
    PARTITION OF gf_t3_235_telemetry_runs
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE INDEX IF NOT EXISTS idx_gf_t3_235_runs_tenant_time
    ON gf_t3_235_telemetry_runs (tenant_org_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_gf_t3_235_runs_corridor
    ON gf_t3_235_telemetry_runs (corridor_id, pass_index);

-- 4. Warp Tile Fragment State Snapshots Table
CREATE TABLE IF NOT EXISTS gf_t3_235_warp_tiles (
    tile_snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    tenant_org_id UUID NOT NULL,
    tile_id TEXT NOT NULL CHECK (tile_id IN ('T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7')),
    fragment_dims INTEGER[] NOT NULL DEFAULT ARRAY[16, 16, 16],
    swizzle_hex TEXT NOT NULL,
    bank_conflicts INTEGER NOT NULL CHECK (bank_conflicts >= 0),
    tile_state TEXT NOT NULL,
    shared_mem_ptr TEXT NOT NULL,
    warp_group TEXT NOT NULL,
    pipeline_stage TEXT NOT NULL,
    accumulator_norm NUMERIC(12, 4) NOT NULL,
    FOREIGN KEY (run_id, recorded_at) REFERENCES gf_t3_235_telemetry_runs(run_id, recorded_at) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gf_t3_235_warp_tiles_lookup
    ON gf_t3_235_warp_tiles (tenant_org_id, tile_id);

-- 5. Immutable Compliance & Security Audit Log Table (GDPR / CCPA / HIPAA)
CREATE TABLE IF NOT EXISTS gf_t3_235_immutable_audit_log (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_org_id UUID NOT NULL,
    operator_id UUID NOT NULL REFERENCES gf_t3_235_operators(operator_id) ON DELETE RESTRICT,
    callsign TEXT NOT NULL CHECK (callsign IN ('CREW CHIEF', 'PIT WALL', 'TELEMETRY')),
    action_type TEXT NOT NULL,
    compliance_frameworks TEXT[] NOT NULL DEFAULT ARRAY['NIST-SSDF-1.1', 'GDPR', 'CCPA', 'HIPAA'],
    payload_sha256 TEXT NOT NULL,
    summary_message TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gf_t3_235_audit_tenant_logged
    ON gf_t3_235_immutable_audit_log (tenant_org_id, logged_at DESC);

-- 6. Strict Row-Level Security (RLS) Policies
ALTER TABLE gf_t3_235_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_235_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_235_telemetry_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_235_warp_tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_235_immutable_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_corridors_read_authenticated
    ON gf_t3_235_corridors
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY rls_operators_tenant_isolation
    ON gf_t3_235_operators
    FOR ALL
    USING (tenant_org_id = (auth.jwt() ->> 'tenant_org_id')::UUID);

CREATE POLICY rls_telemetry_runs_tenant_select
    ON gf_t3_235_telemetry_runs
    FOR SELECT
    USING (tenant_org_id = (auth.jwt() ->> 'tenant_org_id')::UUID);

CREATE POLICY rls_telemetry_runs_mfa_insert
    ON gf_t3_235_telemetry_runs
    FOR INSERT
    WITH CHECK (
        tenant_org_id = (auth.jwt() ->> 'tenant_org_id')::UUID
        AND (auth.jwt() ->> 'mfa_verified')::BOOLEAN = TRUE
    );

CREATE POLICY rls_warp_tiles_tenant_isolation
    ON gf_t3_235_warp_tiles
    FOR ALL
    USING (tenant_org_id = (auth.jwt() ->> 'tenant_org_id')::UUID);

CREATE POLICY rls_immutable_audit_select
    ON gf_t3_235_immutable_audit_log
    FOR SELECT
    USING (tenant_org_id = (auth.jwt() ->> 'tenant_org_id')::UUID);

CREATE POLICY rls_immutable_audit_append_only
    ON gf_t3_235_immutable_audit_log
    FOR INSERT
    WITH CHECK (tenant_org_id = (auth.jwt() ->> 'tenant_org_id')::UUID);
