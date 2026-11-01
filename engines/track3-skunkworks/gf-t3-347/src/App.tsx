/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

type TabKey = 'Mesh' | 'Chnk' | 'Mixd' | 'Stats' | 'APA';

interface ChunkItem {
  id: number;
  title: string;
  hex: string;
  inspectorPtr: string;
  tokLabel: string;
  chunkLoadPct: number;
  syncPct: number;
  latencyMs: string;
  status: string;
  sliceFlag: string;
  phase: string;
}

interface CorridorConfig {
  id: string;
  label: string;
  throughputLabel: string;
  throughputNum: number;
  latencyLabel: string;
  saturationPct: number;
  modeTag: string;
  vec: string;
}

const CORRIDORS: CorridorConfig[] = [
  {
    id: 'ALPHA',
    label: 'PREFILL-CORRIDOR-ALPHA (DYNAMIC-CHUNKED-FABRIC · 142400-GB/S)',
    throughputLabel: '142,400 GB/s',
    throughputNum: 142400,
    latencyLabel: '0.01 µs',
    saturationPct: 98,
    modeTag: 'CHUNKED_PREFILL',
    vec: '[1.04, 1.05, 1.04, 1.05]',
  },
  {
    id: 'BRAVO',
    label: 'PREFILL-CORRIDOR-BRAVO (MIXED-PHASE-SCHEDULING-ENGINE)',
    throughputLabel: '138,900 GB/s',
    throughputNum: 138900,
    latencyLabel: '0.02 µs',
    saturationPct: 95,
    modeTag: 'MIXED_PHASE_SCHED',
    vec: '[1.03, 1.05, 1.04, 1.04]',
  },
  {
    id: 'GAMMA',
    label: 'PREFILL-CORRIDOR-GAMMA (NON-BLOCKING-PREFILL-DECODE-ROUTER)',
    throughputLabel: '134,200 GB/s',
    throughputNum: 134200,
    latencyLabel: '0.03 µs',
    saturationPct: 92,
    modeTag: 'NON_BLOCK_ROUTER',
    vec: '[1.02, 1.04, 1.03, 1.05]',
  },
  {
    id: 'DELTA',
    label: 'PREFILL-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-PREFILL-PASS)',
    throughputLabel: '96,400 GB/s',
    throughputNum: 96400,
    latencyLabel: '0.14 µs',
    saturationPct: 74,
    modeTag: 'MONOLITHIC_PASS',
    vec: '[0.94, 0.96, 0.95, 0.96]',
  },
];

function createDefaultChunks(): ChunkItem[] {
  const list: ChunkItem[] = [];
  for (let i = 0; i < 8; i++) {
    const hexAddr = i === 0 ? '0x56000' : '0x560' + String(i) + '0';
    list.push({
      id: i,
      title: 'Chunk ' + String(i) + ' (C' + String(i) + ')',
      hex: hexAddr,
      inspectorPtr: hexAddr,
      tokLabel: '256K',
      chunkLoadPct: 100,
      syncPct: 100,
      latencyMs: '0.02ms',
      status: 'SLICED · LOCKED',
      sliceFlag: 'OK',
      phase: 'MIXED',
    });
  }
  return list;
}

export default function App() {
  const [selectedCorridor, setSelectedCorridor] = useState<string>(CORRIDORS[0].label);
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [selectedChunkId, setSelectedChunkId] = useState<number>(3);
  const [chunks, setChunks] = useState<ChunkItem[]>(createDefaultChunks);
  const [throughputDisplay, setThroughputDisplay] = useState<string>('142,400 GB/s');
  const [latencyDisplay, setLatencyDisplay] = useState<string>('0.01 µs');
  const [saturationPct, setSaturationPct] = useState<number>(98);
  const [tokenScoreUnits, setTokenScoreUnits] = useState<number>(32600000);
  const [engineXpK, setEngineXpK] = useState<number>(75.0);
  const [prefillState, setPrefillState] = useState<string>('Active');
  const [longPromptSpike, setLongPromptSpike] = useState<boolean>(false);
  const [stepPassCount, setStepPassCount] = useState<number>(1);
  const [apaNotice, setApaNotice] = useState<string>(
    'CLUSTER-006 · CHASSIS GF-T3-347 · READY FOR SOVEREIGN APA TITLE TRANSFER'
  );
  const [radioLogs, setRadioLogs] = useState<[string, string]>([
    '[00:01.04] 🟢 CREW CHIEF: Asynchronous chunked prefill and mixed-phase scheduling engine initialized · 8 chunks linked',
    '[00:01.08] 🟢 TELEMETRY: Interleaved prefill-decode scheduling verified at 142,400 GB/s with zero TTFT latency spikes',
  ]);

  const currentCorridorObj =
    CORRIDORS.find((c) => c.label === selectedCorridor) || CORRIDORS[0];

  const activeChunk =
    chunks.find((c) => c.id === selectedChunkId) || chunks[3];

  const pushRadioPair = (line1: string, line2: string) => {
    setRadioLogs([line1, line2]);
  };

  const handleCorridorChange = (newLabel: string) => {
    setSelectedCorridor(newLabel);
    const found = CORRIDORS.find((c) => c.label === newLabel) || CORRIDORS[0];
    setThroughputDisplay(found.throughputLabel);
    setLatencyDisplay(found.latencyLabel);
    setSaturationPct(found.saturationPct);
    const nextChunks = chunks.map((ch) => ({
      ...ch,
      phase: found.id === 'DELTA' ? 'MONO' : 'MIXED',
      latencyMs: found.id === 'DELTA' ? '0.09ms' : '0.02ms',
      status: 'SLICED · LOCKED',
    }));
    setChunks(nextChunks);
    pushRadioPair(
      '[00:02.12] 🟢 CREW CHIEF: Switched fabric corridor to ' + found.id + ' · 8 chunks synchronized',
      '[00:02.16] 🟢 TELEMETRY: Chunk Throughput: ' +
        found.throughputLabel +
        ' · Slicing Latency: ' +
        found.latencyLabel +
        ' · Active Chunks: 8 Chunks'
    );
  };

  // Chaos & Chunking Stress Trigger 1: Trigger Chunked Prefill Burst
  const handleInjectPrefillBurst = () => {
    const nextTokens = tokenScoreUnits + 2048000;
    const nextXp = Math.round((engineXpK + 12.5) * 10) / 10;
    setTokenScoreUnits(nextTokens);
    setEngineXpK(nextXp);
    setThroughputDisplay('148,800 GB/s');
    setLatencyDisplay('0.01 µs');
    setSaturationPct(100);
    setPrefillState('Active');

    const updated = chunks.map((c) => ({
      ...c,
      tokLabel: '512K',
      chunkLoadPct: 100,
      syncPct: 100,
      latencyMs: '0.01ms',
      status: 'BURST · LOCKED',
      sliceFlag: 'OK',
      phase: 'MIXED',
    }));
    setChunks(updated);
    pushRadioPair(
      '[00:03.20] 🟠 CREW CHIEF: Trigger Chunked Prefill Burst engaged across C0..C7 · +2,048,000 prompt tokens sliced',
      '[00:03.24] 🟢 TELEMETRY: Chunk Throughput: 148,800 GB/s · Slicing Latency: 0.01 µs · Processed Tokens: ' +
        nextTokens.toLocaleString() +
        ' Units'
    );
  };

  // Chaos & Chunking Stress Trigger 2: Inject Long-Prompt Spike (Force Dynamic Chunk Slicing)
  const handleToggleLongPromptSpike = () => {
    const nextSpike = !longPromptSpike;
    setLongPromptSpike(nextSpike);
    if (nextSpike) {
      setThroughputDisplay('139,600 GB/s');
      setLatencyDisplay('0.02 µs');
      setSaturationPct(96);
      setPrefillState('Active');
      const updated = chunks.map((c, idx) => ({
        ...c,
        tokLabel: idx % 2 === 0 ? '384K' : '320K',
        chunkLoadPct: 100,
        syncPct: 100,
        latencyMs: '0.03ms',
        status: 'SLICED · LOCKED',
        sliceFlag: 'OK',
        phase: 'MIXED',
      }));
      setChunks(updated);
      pushRadioPair(
        '[00:04.10] ⚡ CREW CHIEF: Inject Long-Prompt Spike (Force Dynamic Chunk Slicing) active · zero decode starvation',
        '[00:04.14] 🟢 TELEMETRY: Dynamic omega boundary locked · Slicing Latency: 0.02 µs · Active Chunks: 8 Chunks'
      );
    } else {
      setThroughputDisplay(currentCorridorObj.throughputLabel);
      setLatencyDisplay(currentCorridorObj.latencyLabel);
      setSaturationPct(currentCorridorObj.saturationPct);
      setChunks(createDefaultChunks());
      pushRadioPair(
        '[00:04.48] 🟢 CREW CHIEF: Long-prompt spike cleared · nominal 256K token chunk boundaries restored',
        '[00:04.52] 🟢 TELEMETRY: Chunk Throughput: ' +
          currentCorridorObj.throughputLabel +
          ' · Slicing Latency: ' +
          currentCorridorObj.latencyLabel
      );
    }
  };

  // Chaos & Chunking Stress Trigger 3: Step Asynchronous Mixed-Phase Pass
  const handleStepMixedPhasePass = () => {
    const nextPass = stepPassCount + 1;
    const nextTokens = tokenScoreUnits + 1024000;
    const nextXp = Math.round((engineXpK + 6.5) * 10) / 10;
    const nextFocusChunk = (selectedChunkId + 1) % 8;
    setStepPassCount(nextPass);
    setTokenScoreUnits(nextTokens);
    setEngineXpK(nextXp);
    setSelectedChunkId(nextFocusChunk);
    setThroughputDisplay('144,200 GB/s');
    setLatencyDisplay('0.01 µs');
    setPrefillState('Active');

    const updated = chunks.map((c) => ({
      ...c,
      tokLabel: '256K',
      chunkLoadPct: 100,
      syncPct: 100,
      latencyMs: '0.02ms',
      status: 'SLICED · LOCKED',
      sliceFlag: 'OK',
      phase: 'MIXED',
    }));
    setChunks(updated);
    pushRadioPair(
      '[00:05.32] 🚀 CREW CHIEF: Step Asynchronous Mixed-Phase Pass #' +
        String(nextPass) +
        ' complete · focus shifted to C' +
        String(nextFocusChunk),
      '[00:05.36] 🟢 TELEMETRY: Non-blocking prefill-decode pass verified · Processed Tokens: ' +
        nextTokens.toLocaleString() +
        ' Units'
    );
  };

  // Chaos & Chunking Stress Trigger 4: Flush Prefill Arenas & Re-Zero Chunk Buffers
  const handleFlushPrefillArenas = () => {
    setLongPromptSpike(false);
    setSelectedCorridor(CORRIDORS[0].label);
    setThroughputDisplay('142,400 GB/s');
    setLatencyDisplay('0.01 µs');
    setSaturationPct(98);
    setTokenScoreUnits(32600000);
    setEngineXpK(75.0);
    setPrefillState('Active');
    setSelectedChunkId(3);
    setChunks(createDefaultChunks());
    pushRadioPair(
      '[00:01.04] 🟢 CREW CHIEF: Asynchronous chunked prefill and mixed-phase scheduling engine initialized · 8 chunks linked',
      '[00:01.08] 🟢 TELEMETRY: Interleaved prefill-decode scheduling verified at 142,400 GB/s with zero TTFT latency spikes'
    );
  };

  const tabs: TabKey[] = ['Mesh', 'Chnk', 'Mixd', 'Stats', 'APA'];

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER ROW 1 */}
      <header className="flex flex-col gap-0.5 w-full shrink-0">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-mono font-bold tracking-tight text-white">
              GF-T3-347
            </h1>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950/90 text-[#00F0FF] border border-cyan-500/50">
              FLAGSHIP
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1 shrink-0 overflow-hidden">
            <select
              aria-label="Synthetic Chunked Prefill Corridor"
              value={selectedCorridor}
              onChange={(e) => handleCorridorChange(e.target.value)}
              className="max-w-[120px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 rounded text-cyan-300 shrink-0 focus:outline-none focus:border-cyan-400"
            >
              {CORRIDORS.map((corridor) => (
                <option key={corridor.id} value={corridor.label}>
                  {corridor.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Chnk');
                handleInjectPrefillBurst();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded cursor-pointer transition-colors"
            >
              [Chnk]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Mixd');
                handleStepMixedPhasePass();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-amber-950 text-amber-300 border border-amber-500/40 rounded cursor-pointer transition-colors"
            >
              [Mixd]
            </button>
            <button
              type="button"
              onClick={handleStepMixedPhasePass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 rounded cursor-pointer transition-colors"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* TOP HEADER ROW 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          Chunked Prefill · Mixed-Phase Scheduling · Zero Latency Spikes
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 GRID) */}
      <section className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5">
        {/* Card 1: CHUNK NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-300 tracking-wider">
              CHUNK NITRO
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              {String(saturationPct) + '% SAT'}
            </span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-tight truncate">
            {throughputDisplay}
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden border border-slate-800 my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(saturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Chunk Throughput Saturation
          </div>
        </div>

        {/* Card 2: MIX STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-300 tracking-wider">
              MIX STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A] bg-amber-950/60 px-1 rounded border border-amber-500/40">
              🔥 CHUNK-PREFILL
            </span>
          </div>
          <div className="text-[#FF9F0A] font-mono text-lg font-bold leading-tight">
            {latencyDisplay}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            Barrier Sync: Sub-Microsecond Locked
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Slicing Latency
          </div>
        </div>

        {/* Card 3: ACTIVE CHUNKS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-300 tracking-wider">
              ACTIVE CHUNKS
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              8 Chunks Linked
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight">
            CHUNKS: 8/8
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {chunks.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedChunkId(ch.id)}
                className={
                  'text-[9px] font-mono font-bold rounded text-center py-0.5 cursor-pointer border ' +
                  (selectedChunkId === ch.id
                    ? 'bg-cyan-500/30 border-cyan-400 text-white'
                    : 'bg-slate-950 border-slate-800 text-cyan-300')
                }
              >
                {'C' + String(ch.id)}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            F1 Gear Shift Interlock [C0..C7] · Active
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-300 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              {'+' + engineXpK.toFixed(1) + 'k ENGINE XP'}
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight truncate">
            {tokenScoreUnits.toLocaleString() + ' UNITS'}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            {'Processed Tokens: ' + tokenScoreUnits.toLocaleString() + ' Units'}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            {'Prefill State: ' + prefillState}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              'text-xs font-mono font-bold py-1 rounded cursor-pointer transition-colors whitespace-nowrap ' +
              (activeTab === tab
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent')
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER (Strictly clean of action buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        {'VIEW: MESH · PTR: 0x56F8DC0 · MODE: ' +
          currentCorridorObj.modeTag +
          ' · CHUNKS: 8 · VEC: ' +
          currentCorridorObj.vec}
      </div>

      {/* CONTEXTUAL TAB STRIP WHEN CHNK / MIXD / STATS / APA IS SELECTED */}
      {activeTab === 'Chnk' && (
        <div className="bg-slate-900/90 border border-cyan-500/40 rounded px-2 py-1 text-[10px] font-mono text-cyan-200 flex items-center justify-between gap-2 shrink-0">
          <span className="truncate">
            CHNK FORMULA: K_chunk = sum_c K(Token_prefill=2048K, Token_decode=64, omega=256K)
          </span>
          <span className="text-emerald-400 font-bold shrink-0">
            SLICE WINDOW: 256K TOK/CHUNK
          </span>
        </div>
      )}

      {activeTab === 'Mixd' && (
        <div className="bg-slate-900/90 border border-amber-500/40 rounded px-2 py-1 text-[10px] font-mono text-amber-200 flex items-center justify-between gap-2 shrink-0">
          <span className="truncate">
            MIXD SCHEDULER: Non-Blocking Prefill-Decode Interleaving · Host CPU Stalls: 0
          </span>
          <span className="text-cyan-300 font-bold shrink-0">
            {'PASS #' + String(stepPassCount) + ' VERIFIED'}
          </span>
        </div>
      )}

      {activeTab === 'Stats' && (
        <div className="bg-slate-900/90 border border-emerald-500/40 rounded px-2 py-1 text-[10px] font-mono text-slate-200 flex items-center justify-between gap-2 shrink-0">
          <span className="truncate">
            DYNO GATES 01-04: PASS · Pytest Coverage: 91.4% · PostgreSQL 16 RLS: ACTIVE
          </span>
          <span className="text-emerald-400 font-bold shrink-0">
            TTFT SPIKES: 0.00%
          </span>
        </div>
      )}

      {activeTab === 'APA' && (
        <div className="bg-slate-900/95 border border-amber-500/50 rounded p-1.5 flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-200">
            <span className="font-bold text-[#FF9F0A]">
              UNIT #252 · GF-T3-347 · CLUSTER-006
            </span>
            <span className="text-cyan-300 font-bold">
              Retail Price: 75,000 - 150,000+ USD Units (Full Engine APA: 35,000 - 65,000 USD Units)
            </span>
          </div>
          <div className="text-[9px] font-mono text-emerald-300 truncate">
            {apaNotice}
          </div>
          <div className="flex flex-col gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                setApaNotice(
                  'APA TITLE DOSSIER LOCKED: 100% Sovereign IP Transfer Package queued for GF-T3-347 (Zero Licensing)'
                );
                pushRadioPair(
                  '[00:06.10] 🟢 CREW CHIEF: ACQUIRE TITLE (APA) dossier generated for GF-T3-347 · 100% clean-room MIT title',
                  '[00:06.14] 🟢 TELEMETRY: Zero copyleft verified · CLUSTER-006 transport readiness locked'
                );
              }}
              className="w-full py-1 px-2 text-[10px] font-mono font-bold bg-[#FF9F0A]/20 hover:bg-[#FF9F0A]/30 text-[#FF9F0A] border border-[#FF9F0A] rounded text-center cursor-pointer"
            >
              ACQUIRE TITLE (APA)
            </button>
            <button
              type="button"
              onClick={() => {
                setApaNotice(
                  'VAULT BUYOUT INQUIRY LOGGED: CLUSTER-006 (50-Unit Carve-Out · 1,000,000 USD Units POF Escrow Gate)'
                );
                pushRadioPair(
                  '[00:06.40] 🟠 CREW CHIEF: INQUIRE VAULT BUYOUT logged for CLUSTER-006 allocation',
                  '[00:06.44] 🟢 TELEMETRY: Retail Price benchmark and standalone repository transfer spec verified'
                );
              }}
              className="w-full py-1 px-2 text-[10px] font-mono font-bold bg-cyan-950/80 hover:bg-cyan-900/80 text-[#00F0FF] border border-[#00F0FF]/60 rounded text-center cursor-pointer"
            >
              INQUIRE VAULT BUYOUT
            </button>
          </div>
        </div>
      )}

      {/* INTERACTIVE CHUNK MATRIX BAY (C0–C7) */}
      <section
        aria-label="Interactive Chunk Matrix Bay"
        className="grid grid-cols-4 gap-1 p-1 bg-slate-950/90 border border-slate-800 rounded-lg shrink-0"
      >
        {chunks.map((chunk) => {
          const isSelected = chunk.id === selectedChunkId;
          return (
            <div
              key={chunk.id}
              onClick={() => setSelectedChunkId(chunk.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedChunkId(chunk.id);
                }
              }}
              className={
                'p-1.5 rounded border cursor-pointer transition-colors flex flex-col justify-between gap-0.5 ' +
                (isSelected
                  ? 'bg-slate-900 border-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700')
              }
            >
              {/* Line 1: Title & Hex */}
              <div className="text-[10px] font-mono font-bold text-white flex justify-between items-center w-full">
                <span>{chunk.title}</span>
                <span className="text-slate-400 font-normal">{chunk.hex}</span>
              </div>

              {/* Line 2: Tokens & Chunk Load */}
              <div className="text-[8px] font-mono font-bold text-cyan-300 flex justify-between items-center w-full px-1">
                <span>{'TOK: ' + chunk.tokLabel}</span>
                <span>{'CHUNK: ' + String(chunk.chunkLoadPct) + '%'}</span>
              </div>

              {/* Line 3: Latency & Status */}
              <div className="flex justify-between items-center text-[8px] font-mono text-slate-300 w-full px-1">
                <span className="text-amber-400">{chunk.latencyMs}</span>
                <span className="text-emerald-400">{chunk.status}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* COMPACT PREFILL TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {'C' +
          String(activeChunk.id) +
          ' · TOK: ' +
          activeChunk.tokLabel +
          ' · CHUNK: ' +
          String(activeChunk.chunkLoadPct) +
          '% · SYNC: ' +
          String(activeChunk.syncPct) +
          '% · PTR ' +
          activeChunk.inspectorPtr +
          ' · SLICE: ' +
          activeChunk.sliceFlag +
          ' · LOCKED · CHUNKS: 8 · PHASE: ' +
          activeChunk.phase}
      </div>

      {/* TACTICAL LAUNCH CONTROL SWITCHES */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleInjectPrefillBurst}
          title="Trigger Chunked Prefill Burst"
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full border-amber-500/80 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 cursor-pointer transition-colors"
        >
          💥 INJECT CHUNKED PREFILL BURST
        </button>

        <button
          type="button"
          onClick={handleToggleLongPromptSpike}
          title="Inject Long-Prompt Spike (Force Dynamic Chunk Slicing)"
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full border-cyan-400/80 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-200 shadow-[0_0_8px_rgba(0,240,255,0.25)] cursor-pointer transition-colors"
        >
          ⚡ TOGGLE LONG-PROMPT SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepMixedPhasePass}
          title="Step Asynchronous Mixed-Phase Pass"
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full border-emerald-500/80 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 cursor-pointer transition-colors"
        >
          🚀 STEP ASYNCHRONOUS MIXED-PHASE PASS
        </button>

        <button
          type="button"
          onClick={handleFlushPrefillArenas}
          title="Flush Prefill Arenas & Re-Zero Chunk Buffers"
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full border-rose-500/80 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 cursor-pointer transition-colors"
        >
          🔄 FLUSH PREFILL ARENAS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center">
        <div className="truncate">{radioLogs[0]}</div>
        <div className="truncate">{radioLogs[1]}</div>
      </footer>
    </div>
  );
}
