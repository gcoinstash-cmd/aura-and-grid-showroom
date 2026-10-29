-- ============================================================================
-- GF-T3-296: Production PostgreSQL 16 Persistence Schema
-- Description: FP8 Quantization and Calibration Matrix Cockpit
-- Security Architecture: Zero-Trust Row-Level Security (RLS) & Partitioned Telemetry
-- Clean-Room License: MIT / Apache-2.0 Permissive
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Synthetic Corridors Reference Registry
CREATE TABLE IF NOT EXISTS public.gf_t3_296_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_code VARCHAR(64) NOT NULL UNIQUE,
    corridor_label VARCHAR(255) NOT NULL UNIQUE,
    bandwidth_gbs NUMERIC(10,2) NOT NULL CHECK (bandwidth_gbs > 0),
    base_latency_us NUMERIC(8,4) NOT NULL CHECK (base_latency_us > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Synthetic Corridors
INSERT INTO public.gf_t3_296_corridors (corridor_code, corridor_label, bandwidth_gbs, base_latency_us)
VALUES ('ALPHA', 'PRIMARY-EXECUTION-FABRIC', 28000, 0.01)
ON CONFLICT (corridor_code) DO NOTHING;
INSERT INTO public.gf_t3_296_corridors (corridor_code, corridor_label, bandwidth_gbs, base_latency_us)
VALUES ('BRAVO', 'DYNAMIC-BURST-ACCELERATOR', 26000, 0.01)
ON CONFLICT (corridor_code) DO NOTHING;
INSERT INTO public.gf_t3_296_corridors (corridor_code, corridor_label, bandwidth_gbs, base_latency_us)
VALUES ('GAMMA', 'ASYNCHRONOUS-STREAM-ROUTER', 24000, 0.02)
ON CONFLICT (corridor_code) DO NOTHING;
INSERT INTO public.gf_t3_296_corridors (corridor_code, corridor_label, bandwidth_gbs, base_latency_us)
VALUES ('DELTA', 'DENSE-FALLBACK-LANE', 18000, 0.03)
ON CONFLICT (corridor_code) DO NOTHING;

-- 2. Hardware Stream Execution Slots (C0..C7)
CREATE TABLE IF NOT EXISTS public.gf_t3_296_stream_slots (
    slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    corridor_id UUID NOT NULL REFERENCES public.gf_t3_296_corridors(corridor_id) ON DELETE CASCADE,
    slot_index SMALLINT NOT NULL CHECK (slot_index BETWEEN 0 AND 7),
    slot_name VARCHAR(16) NOT NULL,
    token_capacity INTEGER NOT NULL CHECK (token_capacity > 0),
    throughput_gbps NUMERIC(10,2) NOT NULL,
    slot_state VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (corridor_id, slot_index)
);

-- 3. Partitioned High-Frequency Telemetry Frames
CREATE TABLE IF NOT EXISTS public.gf_t3_296_telemetry_frames (
    frame_id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    slot_id UUID NOT NULL REFERENCES public.gf_t3_296_stream_slots(slot_id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    batch_tokens BIGINT NOT NULL CHECK (batch_tokens >= 0),
    compute_latency_us NUMERIC(10,4) NOT NULL,
    memory_footprint_mb NUMERIC(8,2) NOT NULL,
    integrity_signature VARCHAR(64) NOT NULL,
    CONSTRAINT pk_gf_t3_296_frames PRIMARY KEY (frame_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Initial Monthly Partition
CREATE TABLE IF NOT EXISTS public.gf_t3_296_telemetry_2026_q4
    PARTITION OF public.gf_t3_296_telemetry_frames
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- 4. Audit & Performance Indexes
CREATE INDEX IF NOT EXISTS idx_gf_t3_296_slots_tenant ON public.gf_t3_296_stream_slots (tenant_id);
CREATE INDEX IF NOT EXISTS idx_gf_t3_296_frames_tenant_time ON public.gf_t3_296_telemetry_frames (tenant_id, recorded_at DESC);

-- 5. Strict Row-Level Security (RLS) Enforcement
ALTER TABLE public.gf_t3_296_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_296_stream_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_296_telemetry_frames ENABLE ROW LEVEL SECURITY;

-- Corridor Public Read Policy
DROP POLICY IF EXISTS p_gf_t3_296_corridors_read ON public.gf_t3_296_corridors;
CREATE POLICY p_gf_t3_296_corridors_read ON public.gf_t3_296_corridors
    FOR SELECT USING (is_active = TRUE);

-- Stream Slots Tenant Isolation Policy
DROP POLICY IF EXISTS p_gf_t3_296_slots_tenant_all ON public.gf_t3_296_stream_slots;
CREATE POLICY p_gf_t3_296_slots_tenant_all ON public.gf_t3_296_stream_slots
    FOR ALL USING (tenant_id = auth.uid());

-- Telemetry Frames Tenant Isolation Policy
DROP POLICY IF EXISTS p_gf_t3_296_frames_tenant_all ON public.gf_t3_296_telemetry_frames;
CREATE POLICY p_gf_t3_296_frames_tenant_all ON public.gf_t3_296_telemetry_frames
    FOR ALL USING (tenant_id = auth.uid());
