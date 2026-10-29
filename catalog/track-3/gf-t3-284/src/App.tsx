/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface KVBlock {
  id: number;
  code: string;
  title: string;
  hex: string;
  inspectorHex: string;
  tok: string;
  ratio: string;
  latency: string;
  status: string;
  sync: string;
  svdError: string;
}

interface CorridorSpec {
  id: string;
  label: string;
  shortCode: string;
  throughput: string;
  latency: string;
  ratio: string;
  mode: string;
}

const CORRIDORS: CorridorSpec[] = [
  {
    id: 'COMP-CORRIDOR-ALPHA',
    label: 'COMP-CORRIDOR-ALPHA (DYNAMIC-KV-CACHE-COMPRESSION-FABRIC · 41600-GB/S)',
    shortCode: 'COMP-CORRIDOR-ALPHA',
    throughput: '41,600 GB/s',
    latency: '0.01 µs',
    ratio: '4.0X',
    mode: 'KV_COMPRESSION',
  },
  {
    id: 'COMP-CORRIDOR-BRAVO',
    label: 'COMP-CORRIDOR-BRAVO (QUANTIZED-BLOCK-MERGING-ENGINE)',
    shortCode: 'COMP-CORRIDOR-BRAVO',
    throughput: '39,800 GB/s',
    latency: '0.01 µs',
    ratio: '4.5X',
    mode: 'BLOCK_MERGING',
  },
  {
    id: 'COMP-CORRIDOR-GAMMA',
    label: 'COMP-CORRIDOR-GAMMA (ASYNC-TENSOR-CORE-COMPACTOR)',
    shortCode: 'COMP-CORRIDOR-GAMMA',
    throughput: '38,400 GB/s',
    latency: '0.02 µs',
    ratio: '3.8X',
    mode: 'ASYNC_COMPACT',
  },
  {
    id: 'COMP-CORRIDOR-DELTA',
    label: 'COMP-CORRIDOR-DELTA (FALLBACK-UNCOMPRESSED-KV-PASS)',
    shortCode: 'COMP-CORRIDOR-DELTA',
    throughput: '16,200 GB/s',
    latency: '0.05 µs',
    ratio: '1.0X',
    mode: 'RAW_KV_PASS',
  },
];

const INITIAL_BLOCKS: KVBlock[] = [
  { id: 0, code: 'C0', title: 'Block 0 (C0)', hex: '0x12000', inspectorHex: '0x12000', tok: '256K', ratio: '4.0X', latency: '0.02ms', status: 'COMPRESSED · LOCKED', sync: '100%', svdError: '0.0009' },
  { id: 1, code: 'C1', title: 'Block 1 (C1)', hex: '0x12010', inspectorHex: '0x12010', tok: '256K', ratio: '4.0X', latency: '0.02ms', status: 'COMPRESSED · LOCKED', sync: '100%', svdError: '0.0008' },
  { id: 2, code: 'C2', title: 'Block 2 (C2)', hex: '0x12020', inspectorHex: '0x12020', tok: '256K', ratio: '4.0X', latency: '0.02ms', status: 'COMPRESSED · LOCKED', sync: '100%', svdError: '0.0009' },
  { id: 3, code: 'C3', title: 'Block 3 (C3)', hex: '0x12030', inspectorHex: '0x12030', tok: '256K', ratio: '4.0X', latency: '0.02ms', status: 'COMPRESSED · LOCKED', sync: '100%', svdError: '0.0007' },
  { id: 4, code: 'C4', title: 'Block 4 (C4)', hex: '0x12040', inspectorHex: '0x12040', tok: '256K', ratio: '4.0X', latency: '0.02ms', status: 'COMPRESSED · LOCKED', sync: '100%', svdError: '0.0009' },
  { id: 5, code: 'C5', title: 'Block 5 (C5)', hex: '0x12050', inspectorHex: '0x12050', tok: '256K', ratio: '4.0X', latency: '0.02ms', status: 'COMPRESSED · LOCKED', sync: '100%', svdError: '0.0008' },
  { id: 6, code: 'C6', title: 'Block 6 (C6)', hex: '0x12060', inspectorHex: '0x12060', tok: '256K', ratio: '4.0X', latency: '0.02ms', status: 'COMPRESSED · LOCKED', sync: '100%', svdError: '0.0009' },
  { id: 7, code: 'C7', title: 'Block 7 (C7)', hex: '0x12070', inspectorHex: '0x12070', tok: '256K', ratio: '4.0X', latency: '0.02ms', status: 'COMPRESSED · LOCKED', sync: '100%', svdError: '0.0008' },
];

const TABS: string[] = ['Mesh', 'Comp', 'Mrge', 'Stats', 'APA'];

export default function App() {
  const [selectedCorridor, setSelectedCorridor] = useState<string>(CORRIDORS[0].id);
  const [activeTab, setActiveTab] = useState<string>('Mesh');
  const [blocks, setBlocks] = useState<KVBlock[]>(INITIAL_BLOCKS);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number>(3);
  const [throughput, setThroughput] = useState<string>('41,600 GB/s');
  const [compactionLatency, setCompactionLatency] = useState<string>('0.01 µs');
  const [tokenScore, setTokenScore] = useState<number>(7808000);
  const [engineXp, setEngineXp] = useState<number>(75.0);
  const [overloadActive, setOverloadActive] = useState<boolean>(false);
  const [saturationPct, setSaturationPct] = useState<number>(96);
  const [singularVectors, setSingularVectors] = useState<string>('[4.61, 4.65, 4.62, 4.64]');
  const [radioLogs, setRadioLogs] = useState<string[]>([
    '[00:01.04] 🟢 CREW CHIEF: Dynamic speculative KV-cache compression and quantized block merging engine initialized · 8 blocks linked',
    '[00:01.08] 🟢 TELEMETRY: Quantized block merging verified at 41,600 GB/s with zero compression stalls',
  ]);

  const activeCorridorObj = CORRIDORS.find((c) => c.id === selectedCorridor) || CORRIDORS[0];
  const inspectedBlock = blocks[selectedBlockIndex] || blocks[3];

  const appendRadioLog = (line1: string, line2: string) => {
    setRadioLogs([line1, line2]);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedCorridor(newId);
    const spec = CORRIDORS.find((c) => c.id === newId) || CORRIDORS[0];
    setThroughput(spec.throughput);
    setCompactionLatency(spec.latency);
    setBlocks((prev) =>
      prev.map((b) => ({
        ...b,
        ratio: spec.ratio,
        status: 'COMPRESSED · LOCKED',
      }))
    );
    appendRadioLog(
      '[00:02.12] 🟢 CREW CHIEF: Switched compression corridor to ' + spec.shortCode + ' · 8 blocks linked',
      '[00:02.16] 🟢 TELEMETRY: Quantized block merging verified at ' + spec.throughput + ' with zero compression stalls'
    );
  };

  const handleTriggerBurst = () => {
    setTokenScore((prev) => prev + 512000);
    setEngineXp((prev) => Number((prev + 4.5).toFixed(1)));
    setSaturationPct(99);
    setSingularVectors('[4.68, 4.71, 4.66, 4.69]');
    setBlocks((prev) =>
      prev.map((b) => ({
        ...b,
        tok: '320K',
        ratio: '5.0X',
        latency: '0.01ms',
        status: 'COMPRESSED · LOCKED',
      }))
    );
    appendRadioLog(
      '[00:03.02] 🟢 CREW CHIEF: Trigger KV Compression Burst executed across C0–C7 · SVD rank reduction locked',
      '[00:03.05] 🟢 TELEMETRY: Quantized block merging verified at 41,600 GB/s with zero compression stalls'
    );
  };

  const handleToggleOverloadSpike = () => {
    const nextState = !overloadActive;
    setOverloadActive(nextState);
    if (nextState) {
      setCompactionLatency('0.01 µs');
      setTokenScore((prev) => prev + 256000);
      setBlocks((prev) =>
        prev.map((b, idx) => ({
          ...b,
          tok: idx % 2 === 0 ? '384K' : '256K',
          ratio: idx % 2 === 0 ? '6.0X' : '4.0X',
          latency: '0.02ms',
          status: 'COMPRESSED · LOCKED',
        }))
      );
      appendRadioLog(
        '[00:04.11] 🟢 CREW CHIEF: Context Overload Spike injected · Asynchronous SM arena compaction engaged',
        '[00:04.15] 🟢 TELEMETRY: Sub-microsecond ring sync reclaimed 75.0% fragmented arena buffers with 0 host stalls'
      );
    } else {
      setBlocks(INITIAL_BLOCKS);
      appendRadioLog(
        '[00:04.40] 🟢 CREW CHIEF: Context Overload Spike cleared · Baseline 4.0X SVD block ratio restored',
        '[00:04.44] 🟢 TELEMETRY: Quantized block merging verified at 41,600 GB/s with zero compression stalls'
      );
    }
  };

  const handleStepMergingPass = () => {
    setTokenScore((prev) => prev + 256000);
    setEngineXp((prev) => Number((prev + 2.5).toFixed(1)));
    const nextIdx = (selectedBlockIndex + 1) % 8;
    setSelectedBlockIndex(nextIdx);
    setSingularVectors('[4.63, 4.67, 4.64, 4.66]');
    appendRadioLog(
      '[00:05.19] 🟢 CREW CHIEF: Step Quantized Merging Pass completed on Block ' + String(nextIdx) + ' (C' + String(nextIdx) + ') · Error bound 0.0008',
      '[00:05.22] 🟢 TELEMETRY: Quantized block merging verified at 41,600 GB/s with zero compression stalls'
    );
  };

  const handleFlushArenas = () => {
    setSelectedCorridor(CORRIDORS[0].id);
    setThroughput('41,600 GB/s');
    setCompactionLatency('0.01 µs');
    setTokenScore(7808000);
    setEngineXp(75.0);
    setOverloadActive(false);
    setSaturationPct(96);
    setSelectedBlockIndex(3);
    setSingularVectors('[4.61, 4.65, 4.62, 4.64]');
    setBlocks(INITIAL_BLOCKS);
    appendRadioLog(
      '[00:01.04] 🟢 CREW CHIEF: Dynamic speculative KV-cache compression and quantized block merging engine initialized · 8 blocks linked',
      '[00:01.08] 🟢 TELEMETRY: Quantized block merging verified at 41,600 GB/s with zero compression stalls'
    );
  };

  const formattedTokenScore = tokenScore.toLocaleString('en-US') + ' UNITS';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Row 1 */}
      <header className="flex flex-col gap-0.5 shrink-0">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm md:text-base font-mono font-bold tracking-tight text-white">
              GF-T3-284
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/15 text-[#00F0FF] border border-cyan-400/40 rounded">
              FLAGSHIP
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Compression Corridor Selector"
              value={selectedCorridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded focus:outline-none focus:border-cyan-400"
            >
              {CORRIDORS.map((corridor) => (
                <option key={corridor.id} value={corridor.id}>
                  {corridor.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleTriggerBurst}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded transition-colors cursor-pointer"
            >
              [Comp]
            </button>
            <button
              type="button"
              onClick={handleStepMergingPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-amber-950 text-[#FF9F0A] border border-amber-500/40 rounded transition-colors cursor-pointer"
            >
              [Merge]
            </button>
            <button
              type="button"
              onClick={handleFlushArenas}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          KV-Cache Compression · Quantized Merging · Zero Loss
        </div>
      </header>

      {/* 4-Card Arcade HUD Ribbon */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5">
        {/* Card 1: COMP NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">COMP NITRO</span>
            <span className="text-[10px] font-mono text-[#00F0FF]">{String(saturationPct) + '% SAT'}</span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-tight">
            {throughput}
          </div>
          <div className="w-full bg-slate-800 h-1 rounded overflow-hidden my-0.5">
            <div className="bg-[#00F0FF] h-full w-11/12" />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Compression Throughput Saturation
          </div>
        </div>

        {/* Card 2: COMPACT STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">COMPACT STREAK</span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A] bg-amber-500/10 border border-amber-500/30 px-1 rounded">
              🔥 SVD-KV
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight">
            {compactionLatency}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            Ring Sync: 0.0009 Max Spectral Bound
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Compaction Latency
          </div>
        </div>

        {/* Card 3: ACTIVE BLOCKS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">ACTIVE BLOCKS</span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">RING LOCKED</span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight">
            BLOCKS: 8/8
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {blocks.map((blk, i) => (
              <button
                key={blk.code}
                type="button"
                onClick={() => setSelectedBlockIndex(i)}
                className={
                  'text-[9px] font-mono font-bold rounded py-0.2 text-center cursor-pointer ' +
                  (selectedBlockIndex === i
                    ? 'bg-[#00F0FF] text-black'
                    : 'bg-slate-800 text-cyan-300 hover:bg-slate-700')
                }
              >
                {blk.code}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Active Blocks: 8 Blocks [C0..C7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">TOKEN SCORE</span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">
              {'+' + engineXp.toFixed(1) + 'k ENGINE XP'}
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight truncate">
            {formattedTokenScore}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            Processed Tokens: 7,808,000 Units
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Compression State: Active Active
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Views"
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
                'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
                (isCurrent
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Streamlined Mesh Info Subheader */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0 flex items-center justify-between">
        <span>
          {'VIEW: ' +
            activeTab.toUpperCase() +
            ' · PTR: 0x11F8DC0 · MODE: ' +
            activeCorridorObj.mode +
            ' · BLOCKS: 8 · VEC: ' +
            singularVectors}
        </span>
        <span className="hidden sm:inline text-cyan-300">
          {activeCorridorObj.label}
        </span>
      </div>

      {/* Interactive Block Matrix Bay (C0–C7) */}
      <main className="flex-1 flex flex-col justify-center overflow-hidden my-0.5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1 bg-slate-950/80 border border-slate-800/90 rounded-lg">
          {blocks.map((block, index) => {
            const isSelected = selectedBlockIndex === index;
            return (
              <div
                key={block.code}
                onClick={() => setSelectedBlockIndex(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedBlockIndex(index);
                  }
                }}
                className={
                  'p-1.5 rounded border transition-colors cursor-pointer flex flex-col justify-between gap-1 ' +
                  (isSelected
                    ? 'bg-slate-900 border-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-600')
                }
              >
                {/* Line 1 (Title & Hex) */}
                <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                  <span>{block.title}</span>
                  <span className="text-slate-400">{block.hex}</span>
                </div>

                {/* Line 2 (Tokens & Compression Ratio) */}
                <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                  <span>{'TOK: ' + block.tok}</span>
                  <span>{'RATIO: ' + block.ratio}</span>
                </div>

                {/* Line 3 (Latency & State) */}
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-[#FF9F0A]">{block.latency}</span>
                  <span className="text-emerald-400 font-bold">{block.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Compact Compression Telemetry Inspector Strip */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0 flex items-center justify-between">
        <span>
          {inspectedBlock.code +
            ' · TOK: ' +
            inspectedBlock.tok +
            ' · RATIO: ' +
            inspectedBlock.ratio +
            ' · SYNC: ' +
            inspectedBlock.sync +
            ' · PTR ' +
            inspectedBlock.inspectorHex +
            ' · COMP: OK · LOCKED'}
        </span>
        <span className="hidden md:inline text-[10px] text-amber-300">
          {'CLUSTER-006 · SVD ERR BOUND: ' + inspectedBlock.svdError + ' · APA TITLE READY'}
        </span>
      </div>

      {/* Tactical Launch Control Switches */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleTriggerBurst}
          className="bg-amber-950/40 hover:bg-amber-900/60 border border-[#FF9F0A] text-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          💥 INJECT KV COMPRESSION BURST
        </button>

        <button
          type="button"
          onClick={handleToggleOverloadSpike}
          className="bg-cyan-950/40 hover:bg-cyan-900/60 border border-[#00F0FF] text-[#00F0FF] rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          ⚡ TOGGLE CONTEXT OVERLOAD SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepMergingPass}
          className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-400 text-emerald-300 rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          🚀 STEP QUANTIZED MERGING PASS
        </button>

        <button
          type="button"
          onClick={handleFlushArenas}
          className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500 text-rose-300 rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          🔄 FLUSH COMPRESSION ARENAS
        </button>
      </section>

      {/* Pit-Wall Radio Comms Log */}
      <footer className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center">
        <div className="truncate">{radioLogs[0]}</div>
        <div className="truncate">{radioLogs[1]}</div>
      </footer>
    </div>
  );
}
