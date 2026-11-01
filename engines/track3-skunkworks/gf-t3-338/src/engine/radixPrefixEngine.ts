/**
 * GF-T3-338: Deterministic Radix Tree KV Hash Indexing & Prefix Caching Engine
 * Clean-Room MIT Permissive Implementation (Zero Currency Symbols, Zero Proprietary Marks)
 */

export const SYNTHETIC_PREFIX_CORRIDORS: readonly string[] = [
  'PREFIX-CORRIDOR-ALPHA (DYNAMIC-RADIX-HASH-FABRIC · 124600-GB/S)',
  'PREFIX-CORRIDOR-BRAVO (PREFIX-CACHING-ENGINE)',
  'PREFIX-CORRIDOR-GAMMA (NON-BLOCKING-TREE-INDEX-ROUTER)',
  'PREFIX-CORRIDOR-DELTA (FALLBACK-COLD-START-PASS)',
];

export interface KVBlockTelemetry {
  index: number;
  shortId: string;
  title: string;
  hexPtr: string;
  tokensLabel: string;
  cachePct: number;
  syncPct: number;
  latencyMs: string;
  status: string;
  hashStatus: string;
  lockState: string;
  radixHash: string;
  refCount: number;
  radixEnergy: number;
}

export interface EngineTelemetryState {
  corridor: string;
  throughputGbS: number;
  throughputFormatted: string;
  saturationPct: number;
  prefixLatencyUs: string;
  activeBlocksCount: number;
  totalBlocksCount: number;
  processedTokens: number;
  processedTokensFormatted: string;
  engineXpFormatted: string;
  prefixState: string;
  meshPtr: string;
  modeLabel: string;
  vectorValues: [number, number, number, number];
  collisionSpikeActive: boolean;
  blocks: KVBlockTelemetry[];
  radioComms: [string, string];
}

/**
 * Deterministic Cryptographic Prefix Block Hash Solver:
 * R_radix = sum_{r=0}^{R-1} H(K_prefix, V_prefix, chi_hash_token)
 */
export function computeRadixBlockHash(
  kPrefix: readonly number[],
  vPrefix: readonly number[],
  chiHashToken: string,
  seedHex: string
): { digestHex: string; radixEnergy: number } {
  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;
  const combinedInput = seedHex + ':' + chiHashToken;

  for (let i = 0; i < combinedInput.length; i++) {
    const ch = combinedInput.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= ch * 31;
    h2 = Math.imul(h2, 0x01000193) >>> 0;
  }

  let energySum = 0;
  const count = Math.min(kPrefix.length, vPrefix.length);
  for (let r = 0; r < count; r++) {
    const kScaled = Math.round(kPrefix[r] * 1000000);
    const vScaled = Math.round(vPrefix[r] * 1000000);
    h1 ^= kScaled + r * 17;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= vScaled + r * 29;
    h2 = Math.imul(h2, 0x01000193) >>> 0;
    const stepNorm = ((h1 ^ h2) >>> 0) / 4294967295;
    energySum += stepNorm;
  }

  const hexPart1 = h1.toString(16).toUpperCase().padStart(8, '0').slice(0, 6);
  const hexPart2 = h2.toString(16).toUpperCase().padStart(8, '0').slice(0, 6);
  const digestHex = '0x' + hexPart1 + hexPart2;
  const radixEnergy = count > 0 ? Number((energySum / count).toFixed(4)) : 0.9912;

  return { digestHex, radixEnergy };
}

export function formatIntegerWithCommas(val: number): string {
  return Math.round(val).toLocaleString('en-US');
}

export function createInitialBlocks(
  vectorValues: [number, number, number, number]
): KVBlockTelemetry[] {
  const blocks: KVBlockTelemetry[] = [];
  const hexAddresses = [
    '0x4D000',
    '0x4D010',
    '0x4D020',
    '0x4D030',
    '0x4D040',
    '0x4D050',
    '0x4D060',
    '0x4D070',
  ];

  let parentSeed = '0x47F8DC0';
  for (let i = 0; i < 8; i++) {
    const kVec = [
      vectorValues[0] + i * 0.01,
      vectorValues[1],
      vectorValues[2],
      vectorValues[3],
    ];
    const vVec = [1.02 + i * 0.01, 1.04, 1.01, 1.03];
    const { digestHex, radixEnergy } = computeRadixBlockHash(
      kVec,
      vVec,
      'RADIX_BLOCK_B' + String(i),
      parentSeed
    );
    parentSeed = digestHex;

    blocks.push({
      index: i,
      shortId: 'B' + String(i),
      title: 'Block ' + String(i) + ' (B' + String(i) + ')',
      hexPtr: hexAddresses[i],
      tokensLabel: '256K',
      cachePct: 100,
      syncPct: 100,
      latencyMs: '0.02ms',
      status: 'HASHED · LOCKED',
      hashStatus: 'OK',
      lockState: 'LOCKED',
      radixHash: digestHex,
      refCount: 4 + (i % 3),
      radixEnergy,
    });
  }
  return blocks;
}

export function createInitialEngineState(): EngineTelemetryState {
  const initialVec: [number, number, number, number] = [9.91, 9.95, 9.92, 9.94];
  return {
    corridor: SYNTHETIC_PREFIX_CORRIDORS[0],
    throughputGbS: 124600,
    throughputFormatted: '124,600 GB/s',
    saturationPct: 98,
    prefixLatencyUs: '0.01 µs',
    activeBlocksCount: 8,
    totalBlocksCount: 8,
    processedTokens: 25400000,
    processedTokensFormatted: '25,400,000 UNITS',
    engineXpFormatted: '+75.0k ENGINE XP',
    prefixState: 'Active',
    meshPtr: '0x47F8DC0',
    modeLabel: 'PREFIX_CACHING',
    vectorValues: initialVec,
    collisionSpikeActive: false,
    blocks: createInitialBlocks(initialVec),
    radioComms: [
      '[00:01.04] 🟢 CREW CHIEF: Asynchronous prefix caching and radix tree hash engine initialized · 8 blocks linked',
      '[00:01.08] 🟢 TELEMETRY: Radix tree KV hash indexing verified at 124,600 GB/s with zero reload latency',
    ],
  };
}
