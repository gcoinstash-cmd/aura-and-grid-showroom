/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-238 GridSync Zero-Trust Ingress & Sanitization Middleware
 */

import { z } from 'zod';

export const SYNTHETIC_PIPELINE_CORRIDORS = [
  'PIPELINE-CORRIDOR-ALPHA (INTERLEAVED-1F1B-MICRO-BATCH · 4200-TFLOPS)',
  'PIPELINE-CORRIDOR-BRAVO (ACTIVATION-CHECKPOINTING-RECOMPUTATION)',
  'PIPELINE-CORRIDOR-GAMMA (VIRTUAL-STAGE-RING-BUFFER-COMMUNICATION)',
  'PIPELINE-CORRIDOR-DELTA (FALLBACK-STANDARD-GPIPE-PIPELINE)',
] as const;

export type SyntheticCorridor = (typeof SYNTHETIC_PIPELINE_CORRIDORS)[number];

const FORBIDDEN_PATTERNS: readonly string[] = [
  'DROP TABLE',
  'DELETE FROM',
  'INSERT INTO',
  'UPDATE ',
  'UNION SELECT',
  '<SCRIPT',
  '</SCRIPT',
  'JAVASCRIPT:',
  'ONERROR=',
  'ONLOAD=',
  '--;',
  ';--',
  '__PROTO__',
  'CONSTRUCTOR',
];

const FORBIDDEN_CURRENCY_CODE = 36;

export function scrubInputString(raw: string): string {
  if (typeof raw !== 'string') {
    throw new Error('GridSync Ingress Fault: Input payload must be a string.');
  }
  for (let i = 0; i < raw.length; i++) {
    if (raw.charCodeAt(i) === FORBIDDEN_CURRENCY_CODE) {
      throw new Error('GridSync Zero-Dollar Gate Fault: Prohibited currency glyph detected.');
    }
  }
  const upper = raw.toUpperCase();
  for (const token of FORBIDDEN_PATTERNS) {
    if (upper.includes(token)) {
      throw new Error('GridSync Security Gate Fault: Blocked malicious pattern ' + token);
    }
  }
  return raw.trim();
}

export const PipelineControlSchema = z
  .object({
    engineId: z.literal('GF-T3-238'),
    command: z.enum(['BURST', 'STALL', 'STEP', 'FLUSH', 'SELECT_STAGE', 'SWITCH_CORRIDOR', 'TOGGLE_1F1B', 'TOGGLE_PIPE']),
    stageId: z.number().int().min(0).max(7).optional(),
    corridor: z.enum(SYNTHETIC_PIPELINE_CORRIDORS).optional(),
  })
  .strict();

export type PipelineControlPayload = z.infer<typeof PipelineControlSchema>;

export const PipelineConfigSchema = z
  .object({
    numStages: z.number().int().min(1).max(64),
    numMicroBatches: z.number().int().min(1).max(512),
    virtualChunks: z.number().int().min(1).max(16),
    layersPerStage: z.number().int().min(1).max(128),
    hiddenDim: z.number().int().min(64).max(32768),
    seqLen: z.number().int().min(64).max(131072),
    interleaved1F1B: z.boolean(),
    checkpointingEnabled: z.boolean(),
  })
  .strict();

export type PipelineConfigPayload = z.infer<typeof PipelineConfigSchema>;

export function validateControlCommand(input: unknown): PipelineControlPayload {
  if (typeof input === 'object' && input !== null) {
    const record = input as Record<string, unknown>;
    if (typeof record.command === 'string') {
      scrubInputString(record.command);
    }
    if (typeof record.corridor === 'string') {
      scrubInputString(record.corridor);
    }
  }
  return PipelineControlSchema.parse(input);
}
