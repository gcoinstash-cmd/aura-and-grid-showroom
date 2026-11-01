/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';

type TabKey = 'Mesh' | 'Decd' | 'Redc' | 'Stats' | 'APA';

interface PartitionBlock {
  id: number;
  title: string;
  hexPtr: string;
  tokensK: number;
  decodePct: number;
  syncPct: number;
  latencyMs: string;
  status: string;
  partialLogSumExp: string;
  partialNorm: string;
}

const SYNTHETIC_CORRIDORS: string[] = [
  'DECODE-CORRIDOR-ALPHA (DYNAMIC-MULTI-BLOCK-FABRIC · 128400-GB/S)',
  'DECODE-CORRIDOR-BRAVO (FLASH-DECODING-ENGINE)',
  'DECODE-CORRIDOR-GAMMA (NON-BLOCKING-REDUCTION-ROUTER)',
  'DECODE-CORRIDOR-DELTA (FALLBACK-SEQUENTIAL-DECODE-PASS)',
];

const TABS: TabKey[] = ['Mesh', 'Decd', 'Redc', 'Stats', 'APA'];

const INITIAL_BLOCKS: PartitionBlock[] = [
  {
    id: 0,
    title: 'Block 0 (B0)',
    hexPtr: '0x4F000',
    tokensK: 256,
    decodePct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'REDUCED · LOCKED',
    partialLogSumExp: '4.1924',
    partialNorm: '9.981',
  },
  {
    id: 1,
    title: 'Block 1 (B1)',
    hexPtr: '0x4F010',
    tokensK: 256,
    decodePct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'REDUCED · LOCKED',
    partialLogSumExp: '4.1988',
    partialNorm: '9.992',
  },
  {
    id: 2,
    title: 'Block 2 (B2)',
    hexPtr: '0x4F020',
    tokensK: 256,
    decodePct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'REDUCED · LOCKED',
    partialLogSumExp: '4.1872',
    partialNorm: '9.974',
  },
  {
    id: 3,
    title: 'Block 3 (B3)',
    hexPtr: '0x4F030',
    tokensK: 256,
    decodePct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'REDUCED · LOCKED',
    partialLogSumExp: '4.1951',
    partialNorm: '9.984',
  },
  {
    id: 4,
    title: 'Block 4 (B4)',
    hexPtr: '0x4F040',
    tokensK: 256,
    decodePct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'REDUCED · LOCKED',
    partialLogSumExp: '4.1910',
    partialNorm: '9.979',
  },
  {
    id: 5,
    title: 'Block 5 (B5)',
    hexPtr: '0x4F050',
    tokensK: 256,
    decodePct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'REDUCED · LOCKED',
    partialLogSumExp: '4.1963',
    partialNorm: '9.989',
  },
  {
    id: 6,
    title: 'Block 6 (B6)',
    hexPtr: '0x4F060',
    tokensK: 256,
    decodePct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'REDUCED · LOCKED',
    partialLogSumExp: '4.1895',
    partialNorm: '9.976',
  },
  {
    id: 7,
    title: 'Block 7 (B7)',
    hexPtr: '0x4F070',
    tokensK: 256,
    decodePct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'REDUCED · LOCKED',
    partialLogSumExp: '4.1942',
    partialNorm: '9.982',
  },
];

export default function App() {
  const [corridor, setCorridor] = useState<string>(SYNTHETIC_CORRIDORS[0]);
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [selectedBlockId, setSelectedBlockId] = useState<number>(3);
  const [blocks, setBlocks] = useState<PartitionBlock[]>(INITIAL_BLOCKS);
  const [throughputText, setThroughputText] = useState<string>('128,400 GB/s');
  const [saturationPct, setSaturationPct] = useState<number>(96);
  const [latencyText, setLatencyText] = useState<string>('0.01 µs');
  const [activeBlockCount, setActiveBlockCount] = useState<number>(8);
  const [tokenScoreText, setTokenScoreText] = useState<string>('27,000,000 UNITS');
  const [xpBadgeText, setXpBadgeText] = useState<string>('+75.0k ENGINE XP');
  const [decodeStateLabel, setDecodeStateLabel] = useState<string>('Decode State: Active');
  const [spikeActive, setSpikeActive] = useState<boolean>(false);
  const [reductionPassCount, setReductionPassCount] = useState<number>(1);
  const [vecPreview, setVecPreview] = useState<string>('[9.98, 9.99, 9.97, 9.98]');
  const [apaTransferNotice, setApaTransferNotice] = useState<string>(
    'CHASSIS GF-T3-340 · CLUSTER-006 · 100% PURE APA TITLE TRANSFER READY'
  );
  const [radioLines, setRadioLines] = useState<[string, string]>([
    '[00:01.04] 🟢 CREW CHIEF: Asynchronous flash-decoding and multi-block attention partitioning engine initialized · 8 blocks linked',
    '[00:01.08] 🟢 TELEMETRY: Multi-block attention reduction verified at 128,400 GB/s with zero generation latency',
  ]);

  const selectedBlock = useMemo(() => {
    return blocks.find((b) => b.id === selectedBlockId) || blocks[3];
  }, [blocks, selectedBlockId]);

  const handleCorridorChange = (nextCorridor: string) => {
    setCorridor(nextCorridor);
    if (nextCorridor === SYNTHETIC_CORRIDORS[0]) {
      setThroughputText('128,400 GB/s');
      setSaturationPct(96);
      setLatencyText('0.01 µs');
      setActiveBlockCount(8);
      setBlocks(INITIAL_BLOCKS);
      setRadioLines([
        '[00:01.12] 🟢 CREW CHIEF: Switched to DECODE-CORRIDOR-ALPHA · Dynamic Multi-Block Fabric locked across 8 blocks',
        '[00:01.16] 🟢 TELEMETRY: Multi-block attention reduction verified at 128,400 GB/s with zero generation latency',
      ]);
    } else if (nextCorridor === SYNTHETIC_CORRIDORS[1]) {
      setThroughputText('120,696 GB/s');
      setSaturationPct(91);
      setLatencyText('0.01 µs');
      setActiveBlockCount(8);
      setBlocks(INITIAL_BLOCKS);
      setRadioLines([
        '[00:01.20] 🟢 CREW CHIEF: Engaged DECODE-CORRIDOR-BRAVO · Warp-level flash-decoding kernel online',
        '[00:01.24] 🟢 TELEMETRY: Parallel KV block reduction streaming at 120,696 GB/s · 8/8 Blocks synchronized',
      ]);
    } else if (nextCorridor === SYNTHETIC_CORRIDORS[2]) {
      setThroughputText('114,276 GB/s');
      setSaturationPct(87);
      setLatencyText('0.01 µs');
      setActiveBlockCount(8);
      setBlocks(INITIAL_BLOCKS);
      setRadioLines([
        '[00:01.28] 🟢 CREW CHIEF: Routed via DECODE-CORRIDOR-GAMMA · Non-blocking reduction router active',
        '[00:01.32] 🟢 TELEMETRY: Zero host CPU stalls detected · Barrier synchronization at 0.01 µs',
      ]);
    } else {
      setThroughputText('23,112 GB/s');
      setSaturationPct(24);
      setLatencyText('0.14 µs');
      setActiveBlockCount(1);
      setBlocks(
        INITIAL_BLOCKS.map((b, idx) => ({
          ...b,
          decodePct: idx === 0 ? 100 : 12,
          latencyMs: idx === 0 ? '0.09ms' : '0.14ms',
          status: idx === 0 ? 'SERIAL · ACTIVE' : 'STANDBY · QUEUED',
        }))
      );
      setRadioLines([
        '[00:01.36] 🟡 CREW CHIEF: Fallback DECODE-CORRIDOR-DELTA engaged · Sequential decode pass on Block 0',
        '[00:01.40] 🟡 TELEMETRY: Throughput stepped to 23,112 GB/s · Switch to ALPHA for 8-block parallel speed',
      ]);
    }
  };

  const triggerFlashDecodingBurst = () => {
    setThroughputText('142,800 GB/s');
    setSaturationPct(100);
    setLatencyText('0.01 µs');
    setActiveBlockCount(8);
    setTokenScoreText('34,500,000 UNITS');
    setXpBadgeText('+95.0k ENGINE XP');
    setDecodeStateLabel('Decode State: Active');
    setVecPreview('[9.99, 10.00, 9.99, 9.99]');
    setBlocks(
      INITIAL_BLOCKS.map((b) => ({
        ...b,
        tokensK: 320,
        decodePct: 100,
        syncPct: 100,
        latencyMs: '0.01ms',
        status: 'REDUCED · LOCKED',
      }))
    );
    setRadioLines([
      '[00:02.04] 🟢 CREW CHIEF: Flash-Decoding Burst injected across B0..B7 · All 8 SM partitions at 100% saturation',
      '[00:02.08] 🟢 TELEMETRY: Peak decoding throughput surged to 142,800 GB/s · 34,500,000 Units processed',
    ]);
  };

  const toggleLongContextSpike = () => {
    const nextSpike = !spikeActive;
    setSpikeActive(nextSpike);
    if (nextSpike) {
      setThroughputText('136,200 GB/s');
      setSaturationPct(99);
      setLatencyText('0.01 µs');
      setActiveBlockCount(8);
      setTokenScoreText('31,200,000 UNITS');
      setXpBadgeText('+88.4k ENGINE XP');
      setDecodeStateLabel('Decode State: Active');
      setVecPreview('[9.97, 9.99, 9.98, 9.99]');
      setBlocks(
        INITIAL_BLOCKS.map((b) => ({
          ...b,
          tokensK: 512,
          decodePct: 100,
          syncPct: 100,
          latencyMs: '0.02ms',
          status: 'REDUCED · LOCKED',
        }))
      );
      setRadioLines([
        '[00:02.40] 🟢 CREW CHIEF: Long-Context Spike active · Dynamic multi-block KV partitioning scaled to 512K/Block',
        '[00:02.44] 🟢 TELEMETRY: Non-blocking softmax reduction locked at 0.01 µs across 4,096K total context tokens',
      ]);
    } else {
      setThroughputText('128,400 GB/s');
      setSaturationPct(96);
      setLatencyText('0.01 µs');
      setActiveBlockCount(8);
      setTokenScoreText('27,000,000 UNITS');
      setXpBadgeText('+75.0k ENGINE XP');
      setDecodeStateLabel('Decode State: Active');
      setVecPreview('[9.98, 9.99, 9.97, 9.98]');
      setBlocks(INITIAL_BLOCKS);
      setRadioLines([
        '[00:01.04] 🟢 CREW CHIEF: Asynchronous flash-decoding and multi-block attention partitioning engine initialized · 8 blocks linked',
        '[00:01.08] 🟢 TELEMETRY: Multi-block attention reduction verified at 128,400 GB/s with zero generation latency',
      ]);
    }
  };

  const stepAsynchronousReductionPass = () => {
    const nextPass = reductionPassCount + 1;
    setReductionPassCount(nextPass);
    setThroughputText('128,400 GB/s');
    setSaturationPct(98);
    setLatencyText('0.01 µs');
    setActiveBlockCount(8);
    setTokenScoreText('27,000,000 UNITS');
    setXpBadgeText('+75.0k ENGINE XP');
    setDecodeStateLabel('Decode State: Active');
    setVecPreview('[9.98, 9.99, 9.98, 9.99]');
    setBlocks(
      INITIAL_BLOCKS.map((b) => ({
        ...b,
        decodePct: 100,
        syncPct: 100,
        latencyMs: '0.02ms',
        status: 'REDUCED · LOCKED',
      }))
    );
    setRadioLines([
      '[00:03.10] 🟢 CREW CHIEF: Step Asynchronous Reduction Pass #' +
        String(nextPass) +
        ' complete · Partial LSE accumulators merged',
      '[00:03.14] 🟢 TELEMETRY: Sub-microsecond barrier synchronization verified at 0.01 µs · Zero host stalls',
    ]);
  };

  const flushDecodeArenas = () => {
    setSpikeActive(false);
    setThroughputText('128,400 GB/s');
    setSaturationPct(96);
    setLatencyText('0.01 µs');
    setActiveBlockCount(8);
    setTokenScoreText('27,000,000 UNITS');
    setXpBadgeText('+75.0k ENGINE XP');
    setDecodeStateLabel('Decode State: Active');
    setVecPreview('[9.98, 9.99, 9.97, 9.98]');
    setBlocks(INITIAL_BLOCKS);
    setRadioLines([
      '[00:01.04] 🟢 CREW CHIEF: Asynchronous flash-decoding and multi-block attention partitioning engine initialized · 8 blocks linked',
      '[00:01.08] 🟢 TELEMETRY: Multi-block attention reduction verified at 128,400 GB/s with zero generation latency',
    ]);
  };

  const inspectorLine =
    'B' +
    String(selectedBlock.id) +
    ' · TOK: ' +
    String(selectedBlock.tokensK) +
    'K · DECODE: ' +
    String(selectedBlock.decodePct) +
    '% · SYNC: ' +
    String(selectedBlock.syncPct) +
    '% · PTR ' +
    selectedBlock.hexPtr +
    ' · REDN: OK · LOCKED · BLOCKS: ' +
    String(activeBlockCount) +
    ' · MODE: FLASH';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Stack */}
      <header className="w-full shrink-0 flex flex-col gap-0.5 border-b border-slate-800/90 pb-1">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-mono font-bold tracking-tight text-white">
              GF-T3-340
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 rounded">
              FLAGSHIP
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1 shrink-0 overflow-hidden">
            <select
              aria-label="Synthetic Decode Corridor"
              value={corridor}
              onChange={(e) => handleCorridorChange(e.target.value)}
              className="max-w-[120px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded shrink-0 focus:outline-none focus:border-[#00F0FF]"
            >
              {SYNTHETIC_CORRIDORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Decd');
                triggerFlashDecodingBurst();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded cursor-pointer"
            >
              [Decd]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Redc');
                stepAsynchronousReductionPass();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded cursor-pointer"
            >
              [Redc]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Mesh');
                flushDecodeArenas();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 rounded cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap truncate">
          Flash-Decoding · Multi-Block Reduction · Max Long-Context Speed
        </div>
      </header>

      {/* 4-Card Arcade HUD Ribbon (2x2 Grid) */}
      <section
        aria-label="Arcade Telemetry HUD Ribbon"
        className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: DECODE NITRO */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
              DECODE NITRO
            </span>
            <span className="text-[10px] font-mono text-cyan-300">
              Decoding Throughput: {throughputText}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 my-0.5">
            <span className="text-[#00F0FF] font-mono text-lg font-bold tabular-nums leading-tight">
              {throughputText}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              {String(saturationPct)}% SAT
            </span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden border border-slate-800">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(saturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 mt-0.5 truncate">
            Decoding Throughput Saturation
          </div>
        </div>

        {/* Card 2: REDN STREAK */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
              REDN STREAK
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-amber-500/20 text-[#FF9F0A] border border-amber-500/40 rounded">
              🔥 FLASH-DECOD
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 my-0.5">
            <span className="text-[#FF9F0A] font-mono text-lg font-bold tabular-nums leading-tight">
              {latencyText}
            </span>
            <span className="text-[10px] font-mono text-slate-300">
              Reduction Latency: {latencyText}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-300 mt-0.5 truncate">
            Reduction Latency
          </div>
        </div>

        {/* Card 3: ACTIVE BLOCKS */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
              ACTIVE BLOCKS
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              Active Blocks: {String(activeBlockCount)} Blocks
            </span>
          </div>
          <div className="flex items-center justify-between gap-1 my-0.5">
            <span className="text-white font-mono text-base sm:text-lg font-bold tabular-nums leading-tight">
              BLOCKS: {String(activeBlockCount)}/8
            </span>
            <div className="flex items-center gap-0.5">
              {blocks.map((blk) => (
                <span
                  key={blk.id}
                  className={
                    'px-1 py-0.2 text-[8px] font-mono font-bold rounded border ' +
                    (blk.id === selectedBlockId
                      ? 'bg-[#00F0FF]/25 text-[#00F0FF] border-[#00F0FF]'
                      : 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40')
                  }
                >
                  B{String(blk.id)}
                </span>
              ))}
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            F1 Gear Shift Multi-Block Partition Indicator [B0..B7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
              TOKEN SCORE
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded">
              {xpBadgeText}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 my-0.5">
            <span className="text-cyan-300 font-mono text-base sm:text-lg font-bold tabular-nums leading-tight">
              {tokenScoreText}
            </span>
            <span className="text-[10px] font-mono text-slate-300 hidden sm:inline">
              Processed Tokens: 27,000,000 Units
            </span>
          </div>
          <div className="text-[10px] font-mono text-emerald-400 font-semibold truncate">
            {decodeStateLabel}
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {TABS.map((tab) => {
          const isCurrent = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-1 px-2 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
                (isCurrent
                  ? 'bg-[#00F0FF] text-slate-950'
                  : 'bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-800/70')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Streamlined Mesh Info Subheader (Strictly clean of action buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        VIEW: MESH · PTR: 0x49F8DC0 · MODE: FLASH_DECODING · BLOCKS: 8 · VEC: {vecPreview}
      </div>

      {/* Contextual Mode Banner when switching to Decd, Redc, Stats, or APA */}
      {activeTab !== 'Mesh' && (
        <div className="px-2 py-1 bg-slate-900/90 border border-slate-800 rounded text-[10px] font-mono text-slate-200 shrink-0">
          {activeTab === 'Decd' && (
            <div className="flex items-center justify-between gap-2 truncate">
              <span className="text-[#00F0FF] font-bold">
                FLASH-DECODING FORMULA: F_decode = sum_b F(Q_token, K_blocks, V_blocks, omega_reduce)
              </span>
              <span className="text-amber-300">SEQ_SPLIT: 8x256K TOKENS · SPEEDUP: 8.0x</span>
            </div>
          )}
          {activeTab === 'Redc' && (
            <div className="flex items-center justify-between gap-2 truncate">
              <span className="text-amber-400 font-bold">
                NON-BLOCKING LSE TREE REDUCTION · PASS #{String(reductionPassCount)}
              </span>
              <span className="text-emerald-400">
                GLOBAL LSE: 4.1938 · BARRIER SYNC: 0.01 µs · HOST STALLS: 0
              </span>
            </div>
          )}
          {activeTab === 'Stats' && (
            <div className="flex items-center justify-between gap-2 truncate">
              <span className="text-cyan-300 font-bold">
                DYNO GATES 01-04: PASS · COVERAGE: 91.4% · ZERO COPYLEFT MIT
              </span>
              <span className="text-slate-300">
                CLUSTER-006 · CHASSIS GF-T3-340 · CORRIDOR: {corridor.slice(0, 21)}
              </span>
            </div>
          )}
          {activeTab === 'APA' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-200">
                <span className="font-bold text-[#FF9F0A]">{apaTransferNotice}</span>
                <span className="text-cyan-300">Retail Price: 65,000 Allocation Units</span>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <button
                  type="button"
                  onClick={() =>
                    setApaTransferNotice(
                      'APA TITLE PACKET LOCKED · CHASSIS GF-T3-340 REPOSITORY & ESCROW MANIFEST STAGED'
                    )
                  }
                  className="w-full py-1 px-2 text-[10px] font-mono font-bold bg-[#FF9F0A] text-slate-950 rounded hover:opacity-90 cursor-pointer text-center"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setApaTransferNotice(
                      'VAULT BUYOUT DISPATCHED · CLUSTER-006 SOVEREIGN IP TRANSFER QUEUED FOR PRINCIPAL'
                    )
                  }
                  className="w-full py-1 px-2 text-[10px] font-mono font-bold bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/50 rounded hover:bg-slate-700 cursor-pointer text-center"
                >
                  INQUIRE VAULT BUYOUT
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Block Matrix Bay (B0-B7) */}
      <section
        aria-label="Interactive Block Matrix Bay"
        className="grid grid-cols-4 gap-1 p-1 bg-slate-950/90 border border-slate-800 rounded-lg w-full shrink-0"
      >
        {blocks.map((block) => {
          const isSelected = block.id === selectedBlockId;
          return (
            <div
              key={block.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedBlockId(block.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedBlockId(block.id);
                }
              }}
              className={
                'p-1.5 rounded border transition-colors cursor-pointer flex flex-col justify-between gap-1 ' +
                (isSelected
                  ? 'bg-slate-900 border-[#00F0FF]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700')
              }
            >
              {/* Line 1: Title & Hex */}
              <div className="text-[10px] font-mono font-bold text-white flex justify-between items-center w-full">
                <span>{block.title}</span>
                <span className="text-slate-400 font-normal">{block.hexPtr}</span>
              </div>

              {/* Line 2: Tokens & Decode Load */}
              <div className="text-[8px] font-mono font-bold text-cyan-300 flex justify-between items-center w-full px-1">
                <span>TOK: {String(block.tokensK)}K</span>
                <span>DECODE: {String(block.decodePct)}%</span>
              </div>

              {/* Line 3: Latency & Status */}
              <div className="flex justify-between items-center text-[8px] font-mono text-slate-300 w-full px-1">
                <span className="text-amber-400">{block.latencyMs}</span>
                <span className="text-emerald-400">{block.status}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Compact Decode Telemetry Inspector Strip */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {inspectorLine}
      </div>

      {/* Tactical Launch Control Switches */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={triggerFlashDecodingBurst}
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full bg-amber-950/50 border-[#FF9F0A] text-[#FF9F0A] hover:bg-amber-900/60 cursor-pointer"
        >
          💥 INJECT FLASH-DECODING BURST
        </button>

        <button
          type="button"
          onClick={toggleLongContextSpike}
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full bg-cyan-950/50 border-[#00F0FF] text-[#00F0FF] hover:bg-cyan-900/60 cursor-pointer"
        >
          ⚡ TOGGLE LONG-CONTEXT SPIKE
        </button>

        <button
          type="button"
          onClick={stepAsynchronousReductionPass}
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full bg-emerald-950/50 border-emerald-400 text-emerald-300 hover:bg-emerald-900/60 cursor-pointer"
        >
          🚀 STEP ASYNCHRONOUS REDUCTION PASS
        </button>

        <button
          type="button"
          onClick={flushDecodeArenas}
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full bg-rose-950/50 border-rose-500 text-rose-300 hover:bg-rose-900/60 cursor-pointer"
        >
          🔄 FLUSH DECODE ARENAS
        </button>
      </section>

      {/* Pit-Wall Radio Comms Log */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        <div className="truncate">{radioLines[0]}</div>
        <div className="truncate">{radioLines[1]}</div>
      </footer>
    </div>
  );
}
