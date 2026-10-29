/**
 * GF-T3-227: Executable Vitest Verification Suite
 * Tests LCP prefix matching, 2D causal tree attention mask parity,
 * dynamic LRU leaf pruning, and GridSync Zero-Trust Zod sanitization.
 */

import { describe, expect, it } from 'vitest';
import {
  SYNTHETIC_CORRIDORS,
  buildCausalTreeAttentionMask,
  calculateEvictionPriority,
  computeLcpLength,
  createInitialRadixTree,
  evaluateRadixLcpMatch,
  pruneColdLeafNodes,
  sanitizePromptIngress,
  verifyTreeAttentionNumericalParity,
} from './radixEngine';

describe('GF-T3-227 Prefix-Tree Radix KV-Cache & Tree Attention Engine', () => {
  it('computes exact Longest Common Prefix (LCP) length and matches hierarchical radix paths', () => {
    expect(computeLcpLength([101, 2054, 2003, 999], [101, 2054, 2003, 1996])).toBe(3);
    expect(computeLcpLength([1, 2, 3], [4, 5, 6])).toBe(0);

    const tree = createInitialRadixTree();
    // Construct a sequence matching RT-ROOT-00 (8 tokens) + RT-BRN-01 (6 tokens) + RT-LEF-01 (3 tokens)
    const fullPathTokens = [
      101, 2054, 2003, 1996, 3928, 4007, 1024, 2048,
      4102, 4109, 4188, 4201, 4290, 4311,
      7011, 7012, 7015,
    ];
    const result = evaluateRadixLcpMatch(tree, fullPathTokens);
    expect(result.matchedNodeIds).toEqual(['RT-ROOT-00', 'RT-BRN-01', 'RT-LEF-01']);
    expect(result.matchedTokenCount).toBe(17);
    expect(result.hitRatePct).toBe(100.0);
    expect(result.terminalNodeId).toBe('RT-LEF-01');
  });

  it('verifies 2D causal tree attention mask numerical parity with linear sequential attention', () => {
    const tree = createInitialRadixTree().slice(0, 6); // Root + 3 Branches + 2 Leaves
    const { nodeIds, matrix } = buildCausalTreeAttentionMask(tree);

    expect(nodeIds[0]).toBe('RT-ROOT-00');
    // Root only attends to itself
    expect(matrix[0][0]).toBe(1);
    expect(matrix[0].slice(1).every((b) => b === 0)).toBe(true);

    // Leaf RT-LEF-01 (index 4) attends to RT-ROOT-00 (0), RT-BRN-01 (1), and RT-LEF-01 (4),
    // and never to sibling branches RT-BRN-02 (2), RT-BRN-03 (3), or sibling leaf RT-LEF-02 (5)
    expect(matrix[4]).toEqual([1, 1, 0, 0, 1, 0]);

    const qMatrix = [
      [0.2, 0.5, -0.3, 0.4],
      [-0.1, 0.8, 0.2, -0.5],
      [0.7, -0.4, 0.6, 0.1],
      [-0.6, 0.3, -0.2, 0.9],
      [0.5, -0.2, 0.9, 0.3],
      [-0.8, 0.1, -0.7, 0.2],
    ];
    const kMatrix = [
      [0.4, 0.3, 0.1, -0.2],
      [0.6, -0.5, 0.4, 0.3],
      [-0.3, 0.9, -0.1, 0.7],
      [0.2, 0.4, -0.8, 0.5],
      [-0.4, 0.7, 0.5, 0.2],
      [0.9, -0.6, 0.3, -0.4],
    ];
    const vMatrix = [
      [1.1, -0.4, 0.8, 0.2],
      [0.5, 0.9, -0.3, 0.7],
      [-2.5, 3.1, 1.4, -1.9],
      [4.2, -1.8, 0.6, 2.3],
      [0.3, -0.7, 1.2, 0.4],
      [-3.3, 2.8, -1.5, 5.0],
    ];

    const parity = verifyTreeAttentionNumericalParity(
      qMatrix,
      kMatrix,
      vMatrix,
      matrix,
      [0, 1, 4]
    );
    expect(parity.maxAbsDiff).toBeLessThan(1e-12);
    expect(parity.treeLeafOutput.length).toBe(4);
  });

  it('evicts lowest-priority cold leaf nodes under LRU pruning while preserving pinned root', () => {
    const tree = createInitialRadixTree();
    const rootPriority = calculateEvictionPriority(true, 128, 12, 15);
    expect(rootPriority).toBe(9999.0);

    const { updatedNodes, prunedNodeIds } = pruneColdLeafNodes(tree, 2, 15);
    // RT-LEF-08 and RT-LEF-06 have the lowest access counts and oldest access ticks
    expect(prunedNodeIds).toEqual(['RT-LEF-08', 'RT-LEF-06']);

    const rootNode = updatedNodes.find((n) => n.id === 'RT-ROOT-00');
    expect(rootNode?.verificationState).toBe('VERIFIED');
  });

  it('enforces GridSync Zero-Trust Zod ingress sanitization against SQLi and script payloads', () => {
    const cleanPayload = sanitizePromptIngress({
      corridor: 'TREE-CORRIDOR-ALPHA (RADIX-TREE-LCP · DYNAMIC-PRUNING)',
      label: 'Multi-Turn Speculative Fork',
      tokens: [101, 2054, 2003, 4102],
    });
    expect(cleanPayload.tokens.length).toBe(4);
    expect(SYNTHETIC_CORRIDORS[cleanPayload.corridor].bandwidthGbs).toBe(1480);

    expect(() =>
      sanitizePromptIngress({
        corridor: 'TREE-CORRIDOR-ALPHA (RADIX-TREE-LCP · DYNAMIC-PRUNING)',
        label: 'DROP TABLE radix_kv_nodes; --',
        tokens: [101, 200],
      })
    ).toThrow();
  });
});
