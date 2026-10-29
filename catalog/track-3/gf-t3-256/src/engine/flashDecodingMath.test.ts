/**
 * GF-T3-256: Executable Vitest Verification Suite
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SYNTHETIC_CORRIDORS,
  computeFullSequenceAttention,
  executeFlashDecodingReduction,
  generateDeterministicKVCache,
  runSelfContainedTestSuite,
  sanitizeGridSyncInput,
  validateFlashExecutionInput,
} from './flashDecodingMath';

export function verifyAllMechanicalGates(): boolean {
  const suiteResults = runSelfContainedTestSuite();
  for (const res of suiteResults) {
    if (!res.passed) {
      throw new Error('Mechanical Gate Failed: ' + res.id + ' - ' + res.name);
    }
  }

  const { keys, values, query } = generateDeterministicKVCache(512, 0, false);
  const full = computeFullSequenceAttention(query, keys, values);
  if (full.length !== 4) {
    throw new Error('Expected 4D attention head output vector.');
  }

  const validated = validateFlashExecutionInput({
    corridor: SYNTHETIC_CORRIDORS[0],
    sequenceLength: 4096,
    numSplits: 8,
    burstActive: true,
    spikeActive: false,
    stepCount: 2,
  });

  const executed = executeFlashDecodingReduction(validated);
  if (!executed.parityVerified || executed.splits.length !== 8) {
    throw new Error('Split-KV reduction failed parity check.');
  }

  const cleanText = sanitizeGridSyncInput('FLASH-CORRIDOR-ALPHA');
  if (cleanText !== 'FLASH-CORRIDOR-ALPHA') {
    throw new Error('Sanitizer altered valid corridor.');
  }

  return true;
}
