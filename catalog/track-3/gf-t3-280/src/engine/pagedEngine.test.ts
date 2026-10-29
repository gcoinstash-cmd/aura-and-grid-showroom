/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  PagedCorridor,
  SYNTHETIC_CORRIDORS,
  computeVirtualPageTranslation,
  sanitizeAndTranslateBlock,
  calculateArenaFragmentationPct,
  recycleCompletedSequenceBlocks,
  createInitialEngineState,
  executePagedBurst,
  toggleFragmentationSpike,
  stepBlockAllocationPass,
  flushPageArenas,
} from './pagedEngine';
import { SUPABASE_POSTGRES_SCHEMA_SQL } from './schema';

describe('GF-T3-280 Continuous Paged Attention & Block Allocation Verification Suite', () => {
  it('verifies virtual-to-physical block table translation formula V_page = BlockTable[LogicalBlock] + PageOffset', () => {
    const blockTable = [0xE000, 0xE010, 0xE020, 0xE030, 0xE040, 0xE050, 0xE060, 0xE070];
    const result = computeVirtualPageTranslation(blockTable, 3, 7, 16);

    expect(result.physicalBaseAddress).toBe(0xE030);
    expect(result.physicalBaseHex).toBe('0xE030');
    expect(result.virtualPageAddress).toBe(0xE037);
    expect(result.virtualPageHex).toBe('0xE037');
    expect(result.internalFragmentationPct).toBe(0.0);
    expect(result.formulaExpression).toBe('V_page = BlockTable[LogicalBlock] + PageOffset');
  });

  it('enforces strict boundary checks on logical block and page offset ranges', () => {
    const blockTable = [0xE000, 0xE010, 0xE020, 0xE030, 0xE040, 0xE050, 0xE060, 0xE070];
    expect(() => computeVirtualPageTranslation(blockTable, -1, 0, 16)).toThrow();
    expect(() => computeVirtualPageTranslation(blockTable, 8, 0, 16)).toThrow();
    expect(() => computeVirtualPageTranslation(blockTable, 0, 16, 16)).toThrow();
    expect(() => computeVirtualPageTranslation(blockTable, 0, -2, 16)).toThrow();
  });

  it('enforces GridSync Zero-Trust Zod sanitization against SQL injection and XSS payloads', () => {
    const blockTable = [0xE000, 0xE010, 0xE020, 0xE030, 0xE040, 0xE050, 0xE060, 0xE070];

    const valid = sanitizeAndTranslateBlock(
      {
        corridor: PagedCorridor.ALPHA,
        logicalBlock: 4,
        pageOffset: 2,
        blockSizeTokens: 16,
        sequenceTokens: 256000,
      },
      blockTable
    );
    expect(valid.virtualPageHex).toBe('0xE042');

    expect(() =>
      sanitizeAndTranslateBlock(
        {
          corridor: 'PAGE-CORRIDOR-ALPHA; DROP TABLE gf_t3_280_page_table--',
          logicalBlock: 0,
          pageOffset: 0,
        },
        blockTable
      )
    ).toThrow();

    expect(() =>
      sanitizeAndTranslateBlock(
        {
          corridor: '<script>evil()</script>',
          logicalBlock: 0,
          pageOffset: 0,
        },
        blockTable
      )
    ).toThrow();
  });

  it('verifies asynchronous block recycling efficiency with zero CPU intervention and zero memory waste', () => {
    const initial = createInitialEngineState();
    const spiked = toggleFragmentationSpike(initial);
    expect(spiked.activePagesCount).toBe(6);
    expect(calculateArenaFragmentationPct(spiked.pages)).toBeGreaterThan(0);

    const recycled = recycleCompletedSequenceBlocks(spiked.pages, [2, 5]);
    expect(recycled.recycledCount).toBe(2);
    expect(recycled.cpuInterventionMs).toBe(0.0);
    expect(recycled.memoryWasteBytes).toBe(0);
    expect(calculateArenaFragmentationPct(recycled.updatedPages)).toBe(0.0);
  });

  it('verifies paged attention burst, allocation pass stepping, and arena flush state transitions', () => {
    const state0 = createInitialEngineState();
    expect(state0.pageThroughputGbs).toBe(38400);
    expect(state0.allocationLatencyUs).toBe(0.01);
    expect(state0.processedTokensUnits).toBe(7296000);
    expect(state0.activePagesCount).toBe(8);

    const state1 = executePagedBurst(state0);
    expect(state1.processedTokensUnits).toBe(7808000);
    expect(state1.pageThroughputGbs).toBe(38400);
    expect(state1.activePagesCount).toBe(8);

    const state2 = stepBlockAllocationPass(state1);
    expect(state2.processedTokensUnits).toBe(7883000);
    expect(state2.pages[0].physicalHex).toBe('0xE020');

    const flushed = flushPageArenas(PagedCorridor.BRAVO);
    expect(flushed.corridor).toBe(PagedCorridor.BRAVO);
    expect(flushed.processedTokensUnits).toBe(7296000);
    expect(flushed.pages[0].physicalHex).toBe('0xE000');
  });

  it('enforces the Absolute Zero-Dollar Gate across synthetic corridors and SQL schema', () => {
    for (const corridor of SYNTHETIC_CORRIDORS) {
      expect(corridor.includes('\x24')).toBe(false);
    }
    expect(SUPABASE_POSTGRES_SCHEMA_SQL.includes('\x24')).toBe(false);
  });
});
