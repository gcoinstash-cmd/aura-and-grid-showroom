/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Executable Test Suite for GF-T3-265 KV-Cache Pooling & Reuse Engine
 */

import {
  SYNTHETIC_POOL_CORRIDORS,
  applyAllocationBurst,
  applyCorridorSwitch,
  applyStepKvReusePass,
  applyToggleFragmentation,
  computeDeterministicPrefixHash,
  computeTotalPooledBlocks,
  createInitialPoolState,
  executeEmbeddedVerificationSuite,
  sanitizeGridSyncInput,
  verifySpeculativeDraftCacheReuse,
} from './kvPoolEngine';

export function runAllEngineAssertions(): { total: number; passed: number; passRatePct: number } {
  const suite = executeEmbeddedVerificationSuite();
  const init = createInitialPoolState();
  if (init.engineId !== 'GF-T3-265') {
    throw new Error('Engine ID mismatch');
  }
  if (computeTotalPooledBlocks(init.arenas) !== 4096) {
    throw new Error('Initial pooled block count must equal 4096');
  }

  const burst = applyAllocationBurst(init);
  if (burst.processedTokensUnits !== 5250000) {
    throw new Error('Burst token increment mismatch');
  }

  const frag = applyToggleFragmentation(burst);
  if (!frag.fragmented || frag.activeArenasCount !== 4) {
    throw new Error('Fragmentation state failed to isolate 4 arenas');
  }

  const stepped = applyStepKvReusePass(frag);
  if (stepped.fragmented || stepped.activeArenasCount !== 8) {
    throw new Error('Step KV reuse pass failed to compact arenas');
  }

  const switched = applyCorridorSwitch(stepped, SYNTHETIC_POOL_CORRIDORS[3]);
  if (switched.throughputGbs !== 9200) {
    throw new Error('Corridor DELTA throughput mismatch');
  }

  const hashA = computeDeterministicPrefixHash([11, 22, 33, 44]);
  const hashB = computeDeterministicPrefixHash([11, 22, 33, 44]);
  if (hashA !== hashB || !hashA.startsWith('0x')) {
    throw new Error('Prefix hash determinism check failed');
  }

  const share = verifySpeculativeDraftCacheReuse([1, 2, 3, 4], [1, 2, 3, 4]);
  if (!share.zeroRedundancyVerified || share.reuseEfficiencyPct !== 100) {
    throw new Error('Speculative draft reuse verification failed');
  }

  const clean = sanitizeGridSyncInput('POOL-CORRIDOR-ALPHA');
  if (clean !== 'POOL-CORRIDOR-ALPHA') {
    throw new Error('Sanitizer altered valid corridor identifier');
  }

  const passedCount = suite.filter((r) => r.passed).length;
  return {
    total: suite.length,
    passed: passedCount,
    passRatePct: Number(((passedCount / suite.length) * 100).toFixed(1)),
  };
}
