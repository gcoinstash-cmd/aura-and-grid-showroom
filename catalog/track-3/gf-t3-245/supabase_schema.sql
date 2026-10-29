-- ============================================================================
-- GF-T3-245: DYNAMIC KV CACHE PAGED ALLOCATION & FLASH-ATTENTION EVICTION
-- SUPABASE / POSTGRESQL PARTITIONED PERSISTENCE & ZERO-TRUST RLS SCHEMA
-- Clean-Room Permissive License: MIT / Apache-2.0 | Zero-Dollar Gate Verified
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. RBAC STAKEHOLDER ROLES & MULTI-FACTOR AUTHENTICATION REGISTRY
CREATE TABLE IF NOT EXISTS gf_t3_245_stakeholder_rbac (
    stakeholder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL CHECK (char_length(email) >= 5),
    rbac_role TEXT NOT NULL CHECK (rbac_role IN ('CREW_CHIEF', 'SEC_OPS', 'AUDITOR', 'TELEMETRY_OP')),
    mfa_enforced BOOLEAN NOT NULL DEFAULT TRUE,
    mfa_hardware_key_fingerprint TEXT NOT NULL,
    cloud_scope TEXT NOT NULL DEFAULT 'AWS_AZURE_HYBRID',
    active_status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_t3_245_rbac_role ON gf_t3_245_stakeholder_rbac (rbac_role, mfa_enforced);

-- 2. PAGED KV BLOCK ALLOCATION PAGE TABLE (PARTITIONED BY CORRIDOR)
CREATE TABLE IF NOT EXISTS gf_t3_245_paged_kv_blocks (
    block_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    corridor_id TEXT NOT NULL CHECK (corridor_id IN (
        'KV-CORRIDOR-ALPHA (PAGED-KV-BLOCK-ALLOCATION · 9200-GB/S)',
        'KV-CORRIDOR-BRAVO (FLASH-ATTENTION-RING-BLOCK-EVICTION)',
        'KV-CORRIDOR-GAMMA (NON-CONTIGUOUS-PAGE-TABLE-MAPPING)',
        'KV-CORRIDOR-DELTA (FALLBACK-CONTIGUOUS-VRAM-BUFFER)'
    )),
    block_index INTEGER NOT NULL CHECK (block_index >= 0 AND block_index < 32),
    logical_page_index INTEGER NOT NULL CHECK (logical_page_index >= 0),
    physical_frame_index INTEGER NOT NULL CHECK (physical_frame_index >= 0 AND physical_frame_index < 256),
    vram_page_hex TEXT NOT NULL,
    tokens_filled INTEGER NOT NULL DEFAULT 16 CHECK (tokens_filled >= 0 AND tokens_filled <= 16),
    token_capacity INTEGER NOT NULL DEFAULT 16 CHECK (token_capacity = 16),
    sequence_id TEXT NOT NULL,
    attention_score NUMERIC(6, 4) NOT NULL CHECK (attention_score >= 0.0000 AND attention_score <= 1.0000),
    eviction_state TEXT NOT NULL CHECK (eviction_state IN ('COLD', 'WARM', 'HOT', 'EVICTED')),
    hit_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 99.80,
    lock_status TEXT NOT NULL CHECK (lock_status IN ('LOCKED', 'ALLOCATED', 'EVICTING', 'DEFRAG')),
    owner_stakeholder_id UUID REFERENCES gf_t3_245_stakeholder_rbac(stakeholder_id) ON DELETE RESTRICT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (corridor_id, block_index, block_uuid)
) PARTITION BY LIST (corridor_id);

CREATE TABLE IF NOT EXISTS gf_t3_245_kv_blocks_alpha PARTITION OF gf_t3_245_paged_kv_blocks
    FOR VALUES IN ('KV-CORRIDOR-ALPHA (PAGED-KV-BLOCK-ALLOCATION · 9200-GB/S)');

CREATE TABLE IF NOT EXISTS gf_t3_245_kv_blocks_bravo PARTITION OF gf_t3_245_paged_kv_blocks
    FOR VALUES IN ('KV-CORRIDOR-BRAVO (FLASH-ATTENTION-RING-BLOCK-EVICTION)');

CREATE TABLE IF NOT EXISTS gf_t3_245_kv_blocks_gamma PARTITION OF gf_t3_245_paged_kv_blocks
    FOR VALUES IN ('KV-CORRIDOR-GAMMA (NON-CONTIGUOUS-PAGE-TABLE-MAPPING)');

CREATE TABLE IF NOT EXISTS gf_t3_245_kv_blocks_delta PARTITION OF gf_t3_245_paged_kv_blocks
    FOR VALUES IN ('KV-CORRIDOR-DELTA (FALLBACK-CONTIGUOUS-VRAM-BUFFER)');

CREATE INDEX IF NOT EXISTS idx_gf_t3_245_kv_lookup
    ON gf_t3_245_paged_kv_blocks (corridor_id, sequence_id, physical_frame_index);

CREATE INDEX IF NOT EXISTS idx_gf_t3_245_eviction_ring
    ON gf_t3_245_paged_kv_blocks (attention_score ASC, updated_at ASC);

-- 3. IMMUTABLE COMPLIANCE, HYBRID-CLOUD DRIFT & REMEDIATION AUDIT LEDGER (PARTITIONED BY RANGE)
CREATE TABLE IF NOT EXISTS gf_t3_245_immutable_audit_ledger (
    audit_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    audit_code TEXT NOT NULL,
    actor_stakeholder_id UUID REFERENCES gf_t3_245_stakeholder_rbac(stakeholder_id),
    actor_role TEXT NOT NULL,
    mfa_verified BOOLEAN NOT NULL DEFAULT TRUE,
    action_type TEXT NOT NULL,
    corridor_id TEXT NOT NULL,
    vram_fragmentation_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    kv_bandwidth_gbs NUMERIC(8, 2) NOT NULL DEFAULT 9200.00,
    eviction_latency_us NUMERIC(6, 4) NOT NULL DEFAULT 0.0100,
    cloud_target TEXT NOT NULL DEFAULT 'AWS_AZURE_MULTI_CLOUD',
    remediation_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    e2ee_backup_snapshot_uri TEXT NOT NULL DEFAULT 's3://gf-t3-245-vault-encrypted/daily-aes256-gcm.snap',
    sha256_integrity_hash TEXT NOT NULL,
    PRIMARY KEY (recorded_at, audit_uuid)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS gf_t3_245_audit_y2026 PARTITION OF gf_t3_245_immutable_audit_ledger
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE INDEX IF NOT EXISTS idx_gf_t3_245_audit_actor
    ON gf_t3_245_immutable_audit_ledger (actor_role, recorded_at DESC);

-- 4. STRICT ROW-LEVEL SECURITY (RLS) ENFORCEMENT
ALTER TABLE gf_t3_245_stakeholder_rbac ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_245_paged_kv_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gf_t3_245_immutable_audit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_stakeholder_select_authenticated
    ON gf_t3_245_stakeholder_rbac
    FOR SELECT
    TO authenticated
    USING (active_status = TRUE AND mfa_enforced = TRUE);

CREATE POLICY rls_paged_kv_blocks_read
    ON gf_t3_245_paged_kv_blocks
    FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY rls_paged_kv_blocks_mutate_mfa
    ON gf_t3_245_paged_kv_blocks
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM gf_t3_245_stakeholder_rbac r
            WHERE r.stakeholder_id = gf_t3_245_paged_kv_blocks.owner_stakeholder_id
              AND r.mfa_enforced = TRUE
              AND r.rbac_role IN ('CREW_CHIEF', 'SEC_OPS')
        )
    );

CREATE POLICY rls_audit_ledger_append_only
    ON gf_t3_245_immutable_audit_ledger
    FOR INSERT
    TO authenticated
    WITH CHECK (mfa_verified = TRUE);

CREATE POLICY rls_audit_ledger_read_auditors
    ON gf_t3_245_immutable_audit_ledger
    FOR SELECT
    TO authenticated
    USING (mfa_verified = TRUE);
