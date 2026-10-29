/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-238 PostgreSQL / Supabase Partitioned Schema & Audit Bundle Exporter
 */

import { PipelineEngineState } from './pipelineEngine';

export const SUPABASE_POSTGRES_SCHEMA_SQL = `-- GF-T3-238: Pipeline Parallelism 1F1B & Activation Checkpointing SQL Schema
-- Target: PostgreSQL 16 / Supabase Cluster (Partitioned + Foreign Keys + Strict RLS)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS pipeline_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engine_id VARCHAR(32) NOT NULL DEFAULT 'GF-T3-238' CHECK (engine_id = 'GF-T3-238'),
    tenant_org_id UUID NOT NULL,
    corridor_name VARCHAR(128) NOT NULL,
    num_stages INTEGER NOT NULL CHECK (num_stages BETWEEN 1 AND 64),
    num_micro_batches INTEGER NOT NULL CHECK (num_micro_batches BETWEEN 1 AND 512),
    virtual_chunks INTEGER NOT NULL CHECK (virtual_chunks BETWEEN 1 AND 16),
    interleaved_1f1b BOOLEAN NOT NULL DEFAULT TRUE,
    checkpointing_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    throughput_tflops NUMERIC(10, 2) NOT NULL,
    bubble_latency_us NUMERIC(10, 4) NOT NULL,
    processed_tokens BIGINT NOT NULL DEFAULT 1536000,
    parity_sha256_prefix VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stage_checkpoint_ledgers (
    ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES pipeline_runs(run_id) ON DELETE CASCADE,
    tenant_org_id UUID NOT NULL,
    stage_id INTEGER NOT NULL CHECK (stage_id BETWEEN 0 AND 63),
    stage_label VARCHAR(32) NOT NULL,
    active_micro_batch INTEGER NOT NULL,
    current_op VARCHAR(32) NOT NULL,
    checkpoint_ptr VARCHAR(16) NOT NULL,
    checkpoint_state VARCHAR(32) NOT NULL,
    activation_memory_mb NUMERIC(10, 2) NOT NULL,
    ring_buffer_queue_depth INTEGER NOT NULL CHECK (ring_buffer_queue_depth >= 0),
    recomputation_count INTEGER NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_telemetry_events (
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES pipeline_runs(run_id) ON DELETE CASCADE,
    tenant_org_id UUID NOT NULL,
    stage_id INTEGER NOT NULL CHECK (stage_id BETWEEN 0 AND 63),
    micro_batch_code VARCHAR(16) NOT NULL,
    operation_phase VARCHAR(24) NOT NULL,
    checkpoint_ptr VARCHAR(16) NOT NULL,
    callsign VARCHAR(24) NOT NULL,
    log_message TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_checkpoint_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_telemetry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_pipeline_runs_tenant_isolation ON pipeline_runs
    FOR ALL TO authenticated
    USING (tenant_org_id = (current_setting('request.jwt.claim.org_id', true))::UUID)
    WITH CHECK (tenant_org_id = (current_setting('request.jwt.claim.org_id', true))::UUID);`;

export function generateAuditBundleJson(state: PipelineEngineState): string {
  const payload = {
    engineId: state.engineTitle,
    trackClassification: 'TRACK 3',
    acquisitionTerms: 'ASSET PURCHASE AGREEMENT (APA) - CLEAN ROOM MIT',
    corridor: state.corridor,
    telemetry: {
      throughputTflops: state.bubbleMetrics.throughputTflops,
      bubbleLatencyUs: state.bubbleMetrics.bubbleLatencyUs,
      interleavedBubblePct: state.bubbleMetrics.interleavedBubblePct,
      standardBubblePct: state.bubbleMetrics.standardBubblePct,
      bubbleReductionPct: state.bubbleMetrics.bubbleReductionPct,
      activeStagesCount: state.numStages,
      processedTokensUnits: state.processedTokens,
      pipeXpK: state.pipeXpK,
    },
    checkpointMemory: state.memoryMetrics,
    gradientParityVerification: state.parityReport,
    stagesSnapshot: state.stages.map((s) => ({
      stageId: s.stageId,
      label: s.headerLabel,
      microBatchStatus: s.microBatchStatusText,
      checkpointPtr: s.checkpointPtr,
      operationMode: s.operationMode,
      activationMemoryMb: s.activationMemoryMb,
      ringBufferQueueDepth: s.ringBufferQueueDepth,
    })),
  };
  return JSON.stringify(payload, null, 2);
}
