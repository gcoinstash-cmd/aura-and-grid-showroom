-- ============================================================================
-- GF-T3-229: PIPELINE-PARALLEL 1F1B ENGINE · POSTGRESQL / SUPABASE SCHEMA
-- Track 3 Skunkworks Engine · Zero-Trust RLS & Partitioned Telemetry Ledger
-- License: Apache-2.0
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PIPELINE CORRIDOR CONFIGURATIONS TABLE
CREATE TABLE IF NOT EXISTS public.gf_t3_229_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_code TEXT NOT NULL UNIQUE CHECK (char_length(corridor_code) <= 120),
    stage_count INTEGER NOT NULL DEFAULT 4 CHECK (stage_count BETWEEN 2 AND 16),
    micro_batch_slots INTEGER NOT NULL DEFAULT 16 CHECK (micro_batch_slots BETWEEN 4 AND 128),
    activation_stash_cap INTEGER NOT NULL DEFAULT 4 CHECK (activation_stash_cap BETWEEN 2 AND 16),
    target_bubble_ratio_pct NUMERIC(5,2) NOT NULL DEFAULT 8.40 CHECK (target_bubble_ratio_pct >= 0.00 AND target_bubble_ratio_pct <= 100.00),
    baseline_p2p_latency_ms NUMERIC(6,3) NOT NULL DEFAULT 0.220 CHECK (baseline_p2p_latency_ms > 0.000),
    owner_tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gf_t3_229_corridors_tenant
    ON public.gf_t3_229_corridors (owner_tenant_id, corridor_code);

-- 2. PARTITIONED 1F1B MICRO-BATCH SCHEDULE EXECUTION LEDGER
CREATE TABLE IF NOT EXISTS public.gf_t3_229_schedule_runs (
    run_id UUID NOT NULL DEFAULT gen_random_uuid(),
    corridor_id UUID NOT NULL REFERENCES public.gf_t3_229_corridors(corridor_id) ON DELETE CASCADE,
    owner_tenant_id UUID NOT NULL,
    stage_rank INTEGER NOT NULL CHECK (stage_rank BETWEEN 0 AND 15),
    micro_batch_index INTEGER NOT NULL CHECK (micro_batch_index BETWEEN 0 AND 127),
    pass_direction TEXT NOT NULL CHECK (pass_direction IN ('ACTIVE_FORWARD', 'STEADY_FORWARD', 'STEADY_BACKWARD', 'COOLDOWN_BACKWARD', 'BUBBLE_IDLE')),
    tensor_shape_batch INTEGER NOT NULL DEFAULT 16,
    tensor_shape_hidden INTEGER NOT NULL DEFAULT 4096,
    stash_pointer_hex TEXT NOT NULL CHECK (char_length(stash_pointer_hex) <= 16),
    peer_stage_label TEXT NOT NULL CHECK (char_length(peer_stage_label) <= 8),
    p2p_latency_ms NUMERIC(6,3) NOT NULL DEFAULT 0.220,
    aggregate_tflops INTEGER NOT NULL DEFAULT 1420,
    bubble_ratio_pct NUMERIC(5,2) NOT NULL DEFAULT 8.40,
    sustained_tokens INTEGER NOT NULL DEFAULT 448000,
    straggler_injected BOOLEAN NOT NULL DEFAULT FALSE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (run_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE IF NOT EXISTS public.gf_t3_229_schedule_runs_y2026m10
    PARTITION OF public.gf_t3_229_schedule_runs
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS public.gf_t3_229_schedule_runs_default
    PARTITION OF public.gf_t3_229_schedule_runs DEFAULT;

CREATE INDEX IF NOT EXISTS idx_gf_t3_229_runs_corridor_stage
    ON public.gf_t3_229_schedule_runs (corridor_id, stage_rank, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_gf_t3_229_runs_tenant
    ON public.gf_t3_229_schedule_runs (owner_tenant_id, recorded_at DESC);

-- 3. ACTIVATION STASH MEMORY AUDIT LOG
CREATE TABLE IF NOT EXISTS public.gf_t3_229_activation_stash_audit (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id UUID NOT NULL REFERENCES public.gf_t3_229_corridors(corridor_id) ON DELETE CASCADE,
    owner_tenant_id UUID NOT NULL,
    stage_rank INTEGER NOT NULL CHECK (stage_rank BETWEEN 0 AND 15),
    active_stash_slots INTEGER NOT NULL CHECK (active_stash_slots >= 0),
    memory_cap_slots INTEGER NOT NULL DEFAULT 4 CHECK (memory_cap_slots = 4),
    stash_base_address TEXT NOT NULL,
    parity_verified BOOLEAN NOT NULL DEFAULT TRUE,
    audited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_stash_bound CHECK (active_stash_slots <= memory_cap_slots)
);

-- 4. STRICT ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.gf_t3_229_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_229_schedule_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_229_activation_stash_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY gf_t3_229_corridors_tenant_isolation
    ON public.gf_t3_229_corridors
    FOR ALL
    TO authenticated
    USING (owner_tenant_id = auth.uid())
    WITH CHECK (owner_tenant_id = auth.uid());

CREATE POLICY gf_t3_229_runs_tenant_isolation
    ON public.gf_t3_229_schedule_runs
    FOR ALL
    TO authenticated
    USING (owner_tenant_id = auth.uid())
    WITH CHECK (owner_tenant_id = auth.uid());

CREATE POLICY gf_t3_229_stash_audit_tenant_isolation
    ON public.gf_t3_229_activation_stash_audit
    FOR ALL
    TO authenticated
    USING (owner_tenant_id = auth.uid())
    WITH CHECK (owner_tenant_id = auth.uid());
