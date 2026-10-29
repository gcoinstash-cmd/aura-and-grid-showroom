/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

type TabId = 'Mesh' | 'Kvc_k' | 'Ring' | 'Stats' | 'APA';

interface BlockData {
  id: string;
  index: number;
  title: string;
  hex: string;
  inspectorPtr: string;
  tokensK: number;
  ratio: string;
  bitWidth: 4 | 8 | 16;
  latencyMs: string;
  status: string;
  syncPct: number;
  outliersRetained: number;
  recycledCount: number;
}

const CORRIDORS: string[] = [
  'KVC-CORRIDOR-ALPHA (DYNAMIC-KV-CACHE-COMPRESSION-FABRIC · 54000-GB/S)',
  'KVC-CORRIDOR-BRAVO (QUANTIZATION-RING-ENGINE)',
  'KVC-CORRIDOR-GAMMA (NON-BLOCKING-CACHE-BLOCK-RECYCLER)',
  'KVC-CORRIDOR-DELTA (FALLBACK-UNCOMPRESSED-FP16-PASS)',
];

const INITIAL_BLOCKS: BlockData[] = [
  {
    id: 'K0',
    index: 0,
    title: 'Block 0 (K0)',
    hex: '0x25000',
    inspectorPtr: '0x25000',
    tokensK: 256,
    ratio: '4.0X',
    bitWidth: 4,
    latencyMs: '0.02ms',
    status: 'COMPRESSED · LOCKED',
    syncPct: 100,
    outliersRetained: 12,
    recycledCount: 14,
  },
  {
    id: 'K1',
    index: 1,
    title: 'Block 1 (K1)',
    hex: '0x25010',
    inspectorPtr: '0x25010',
    tokensK: 256,
    ratio: '4.0X',
    bitWidth: 4,
    latencyMs: '0.02ms',
    status: 'COMPRESSED · LOCKED',
    syncPct: 100,
    outliersRetained: 14,
    recycledCount: 16,
  },
  {
    id: 'K2',
    index: 2,
    title: 'Block 2 (K2)',
    hex: '0x25020',
    inspectorPtr: '0x25020',
    tokensK: 256,
    ratio: '4.0X',
    bitWidth: 4,
    latencyMs: '0.02ms',
    status: 'COMPRESSED · LOCKED',
    syncPct: 100,
    outliersRetained: 11,
    recycledCount: 18,
  },
  {
    id: 'K3',
    index: 3,
    title: 'Block 3 (K3)',
    hex: '0x25030',
    inspectorPtr: '0x25030',
    tokensK: 256,
    ratio: '4.0X',
    bitWidth: 4,
    latencyMs: '0.02ms',
    status: 'COMPRESSED · LOCKED',
    syncPct: 100,
    outliersRetained: 15,
    recycledCount: 20,
  },
  {
    id: 'K4',
    index: 4,
    title: 'Block 4 (K4)',
    hex: '0x25040',
    inspectorPtr: '0x25040',
    tokensK: 256,
    ratio: '4.0X',
    bitWidth: 4,
    latencyMs: '0.02ms',
    status: 'COMPRESSED · LOCKED',
    syncPct: 100,
    outliersRetained: 13,
    recycledCount: 22,
  },
  {
    id: 'K5',
    index: 5,
    title: 'Block 5 (K5)',
    hex: '0x25050',
    inspectorPtr: '0x25050',
    tokensK: 256,
    ratio: '4.0X',
    bitWidth: 4,
    latencyMs: '0.02ms',
    status: 'COMPRESSED · LOCKED',
    syncPct: 100,
    outliersRetained: 16,
    recycledCount: 24,
  },
  {
    id: 'K6',
    index: 6,
    title: 'Block 6 (K6)',
    hex: '0x25060',
    inspectorPtr: '0x25060',
    tokensK: 256,
    ratio: '4.0X',
    bitWidth: 4,
    latencyMs: '0.02ms',
    status: 'COMPRESSED · LOCKED',
    syncPct: 100,
    outliersRetained: 12,
    recycledCount: 26,
  },
  {
    id: 'K7',
    index: 7,
    title: 'Block 7 (K7)',
    hex: '0x25070',
    inspectorPtr: '0x25070',
    tokensK: 256,
    ratio: '4.0X',
    bitWidth: 4,
    latencyMs: '0.02ms',
    status: 'COMPRESSED · LOCKED',
    syncPct: 100,
    outliersRetained: 14,
    recycledCount: 28,
  },
];

const INITIAL_LOGS: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: Asynchronous KV cache compression and quantization ring engine initialized · 8 blocks linked',
  '[00:01.08] 🟢 TELEMETRY: 4-bit KV quantization verified at 54,000 GB/s with 4.0x VRAM capacity multiplication',
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('Mesh');
  const [selectedCorridor, setSelectedCorridor] = useState<string>(CORRIDORS[0]);
  const [blocks, setBlocks] = useState<BlockData[]>(INITIAL_BLOCKS);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number>(3);
  const [throughputGbps, setThroughputGbps] = useState<number>(54000);
  const [saturationPct, setSaturationPct] = useState<number>(96);
  const [cacheLatencyUs, setCacheLatencyUs] = useState<string>('0.01 µs');
  const [precisionBadge, setPrecisionBadge] = useState<string>('🔥 4-BIT-KV');
  const [processedTokens, setProcessedTokens] = useState<number>(9472000);
  const [engineXpK, setEngineXpK] = useState<number>(75.0);
  const [kvStateLabel, setKvStateLabel] = useState<string>('KV State: Compression Active');
  const [meshVec, setMeshVec] = useState<string>('[5.91, 5.95, 5.92, 5.94]');
  const [meshMode, setMeshMode] = useState<string>('KV_COMPRESSION');
  const [outlierSpike, setOutlierSpike] = useState<boolean>(false);
  const [stepCount, setStepCount] = useState<number>(2);
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_LOGS);
  const [apaNotice, setApaNotice] = useState<string>(
    'Escrow Gate POF-ESCROW-CLUSTER-006-298 Armed · 100% Clean-Room MIT Sovereign Title Ready'
  );

  const formatTimestamp = (nextStep: number): string => {
    const sec = 1 + Math.floor(nextStep / 15);
    const centi = (nextStep * 4) % 100;
    const secStr = sec < 10 ? '0' + String(sec) : String(sec);
    const centiStr = centi < 10 ? '0' + String(centi) : String(centi);
    return '[00:' + secStr + '.' + centiStr + ']';
  };

  const pushLog = (line1: string, line2?: string) => {
    setStepCount((prev) => {
      const next = prev + 1;
      const ts1 = formatTimestamp(next);
      const ts2 = formatTimestamp(next + 1);
      if (line2) {
        setRadioLogs([ts1 + ' ' + line1, ts2 + ' ' + line2]);
      } else {
        setRadioLogs((old) => [old[old.length - 1], ts1 + ' ' + line1]);
      }
      return next + 1;
    });
  };

  const handleCorridorChange = (corridor: string) => {
    setSelectedCorridor(corridor);
    if (corridor.indexOf('DELTA') !== -1) {
      setThroughputGbps(28400);
      setSaturationPct(52);
      setCacheLatencyUs('0.04 µs');
      setPrecisionBadge('🔥 FP16-PASS');
      setKvStateLabel('KV State: Fallback Uncompressed');
      setMeshMode('FP16_FALLBACK');
      setBlocks((prev) =>
        prev.map((b) => ({
          ...b,
          ratio: '1.0X',
          bitWidth: 16,
          latencyMs: '0.04ms',
          status: 'FP16 · UNCOMPRESSED',
        }))
      );
      pushLog(
        '🟡 CREW CHIEF: Switched fabric to ' + corridor,
        '🟡 TELEMETRY: Uncompressed FP16 fallback pass active at 28,400 GB/s · 1.0x capacity'
      );
    } else if (corridor.indexOf('BRAVO') !== -1) {
      setThroughputGbps(56200);
      setSaturationPct(98);
      setCacheLatencyUs('0.01 µs');
      setPrecisionBadge('🔥 4-BIT-KV');
      setKvStateLabel('KV State: Compression Active');
      setMeshMode('QUANT_RING_LOCK');
      setBlocks((prev) =>
        prev.map((b) => ({
          ...b,
          ratio: '4.0X',
          bitWidth: 4,
          latencyMs: '0.01ms',
          status: 'COMPRESSED · LOCKED',
        }))
      );
      pushLog(
        '🟢 CREW CHIEF: Switched fabric to ' + corridor,
        '🟢 TELEMETRY: Quantization ring synchronized at 56,200 GB/s · 0.01 µs barrier latency'
      );
    } else if (corridor.indexOf('GAMMA') !== -1) {
      setThroughputGbps(54800);
      setSaturationPct(97);
      setCacheLatencyUs('0.01 µs');
      setPrecisionBadge('🔥 4-BIT-KV');
      setKvStateLabel('KV State: Compression Active');
      setMeshMode('BLOCK_RECYCLER');
      setBlocks((prev) =>
        prev.map((b) => ({
          ...b,
          ratio: '4.0X',
          bitWidth: 4,
          recycledCount: b.recycledCount + 8,
          status: 'COMPRESSED · LOCKED',
        }))
      );
      pushLog(
        '🟢 CREW CHIEF: Switched fabric to ' + corridor,
        '🟢 TELEMETRY: Non-blocking cache block recycler reclaimed evicted arenas with 0.0 µs host stall'
      );
    } else {
      setThroughputGbps(54000);
      setSaturationPct(96);
      setCacheLatencyUs('0.01 µs');
      setPrecisionBadge('🔥 4-BIT-KV');
      setKvStateLabel('KV State: Compression Active');
      setMeshMode('KV_COMPRESSION');
      setBlocks(INITIAL_BLOCKS);
      pushLog(
        '🟢 CREW CHIEF: Asynchronous KV cache compression and quantization ring engine initialized · 8 blocks linked',
        '🟢 TELEMETRY: 4-bit KV quantization verified at 54,000 GB/s with 4.0x VRAM capacity multiplication'
      );
    }
  };

  const handleTriggerBurst = () => {
    setThroughputGbps(58400);
    setSaturationPct(99);
    setCacheLatencyUs('0.01 µs');
    setPrecisionBadge('🔥 4-BIT-KV');
    setProcessedTokens((prev) => prev + 1048576);
    setEngineXpK((prev) => Number((prev + 12.5).toFixed(1)));
    setKvStateLabel('KV State: Compression Active');
    setMeshVec('[6.14, 6.19, 6.17, 6.21]');
    setBlocks((prev) =>
      prev.map((b) => ({
        ...b,
        tokensK: Math.min(512, b.tokensK + 64),
        ratio: '4.0X',
        bitWidth: 4,
        latencyMs: '0.01ms',
        status: 'COMPRESSED · LOCKED',
      }))
    );
    pushLog(
      '💥 CREW CHIEF: Triggered KV Compression Burst across K0-K7 tensor arenas',
      '🟢 TELEMETRY: Compression Throughput: 58,400 GB/s · Cache Latency: 0.01 µs · +1,048,576 Units'
    );
  };

  const handleToggleOutlierSpike = () => {
    const nextSpike = !outlierSpike;
    setOutlierSpike(nextSpike);
    if (nextSpike) {
      setThroughputGbps(49600);
      setSaturationPct(89);
      setCacheLatencyUs('0.02 µs');
      setPrecisionBadge('🔥 8-BIT-RING');
      setKvStateLabel('KV State: Outlier Guard Active');
      setMeshMode('OUTLIER_REQUANT');
      setMeshVec('[7.42, 5.95, 7.38, 5.94]');
      setBlocks((prev) =>
        prev.map((b, idx) =>
          idx % 2 === 1
            ? {
                ...b,
                ratio: '2.0X',
                bitWidth: 8,
                latencyMs: '0.03ms',
                outliersRetained: 42,
                status: '8-BIT · OUTLIER GUARD',
              }
            : {
                ...b,
                ratio: '4.0X',
                bitWidth: 4,
                latencyMs: '0.02ms',
                outliersRetained: 18,
                status: 'COMPRESSED · LOCKED',
              }
        )
      );
      pushLog(
        '⚡ CREW CHIEF: Outlier pruning spike injected · dynamic ring re-quantization engaged',
        '🟢 TELEMETRY: Odd blocks K1/K3/K5/K7 switched to 8-bit + FP16 sparse outlier retention · zero perplexity loss'
      );
    } else {
      setThroughputGbps(54000);
      setSaturationPct(96);
      setCacheLatencyUs('0.01 µs');
      setPrecisionBadge('🔥 4-BIT-KV');
      setKvStateLabel('KV State: Compression Active');
      setMeshMode('KV_COMPRESSION');
      setMeshVec('[5.91, 5.95, 5.92, 5.94]');
      setBlocks(INITIAL_BLOCKS);
      pushLog(
        '🟢 CREW CHIEF: Outlier spike cleared · restored uniform 4-bit KV ring compression',
        '🟢 TELEMETRY: 4-bit KV quantization verified at 54,000 GB/s with 4.0x VRAM capacity multiplication'
      );
    }
  };

  const handleStepCompressionPass = () => {
    setProcessedTokens((prev) => prev + 524288);
    setEngineXpK((prev) => Number((prev + 6.4).toFixed(1)));
    setThroughputGbps((prev) => Math.min(60000, prev + 400));
    setSaturationPct((prev) => Math.min(100, prev + 1));
    setBlocks((prev) =>
      prev.map((b) => ({
        ...b,
        recycledCount: b.recycledCount + 4,
        syncPct: 100,
        status: 'COMPRESSED · LOCKED',
      }))
    );
    pushLog(
      '🚀 CREW CHIEF: Stepped asynchronous KV compression pass · sub-microsecond barrier synced',
      '🟢 TELEMETRY: Non-blocking cache block recycler reclaimed 4 arenas · +524,288 Units processed'
    );
  };

  const handleFlushArenas = () => {
    setSelectedCorridor(CORRIDORS[0]);
    setBlocks(INITIAL_BLOCKS);
    setSelectedBlockIndex(3);
    setThroughputGbps(54000);
    setSaturationPct(96);
    setCacheLatencyUs('0.01 µs');
    setPrecisionBadge('🔥 4-BIT-KV');
    setProcessedTokens(9472000);
    setEngineXpK(75.0);
    setKvStateLabel('KV State: Compression Active');
    setMeshVec('[5.91, 5.95, 5.92, 5.94]');
    setMeshMode('KV_COMPRESSION');
    setOutlierSpike(false);
    setRadioLogs(INITIAL_LOGS);
  };

  const activeBlock = blocks[selectedBlockIndex] || INITIAL_BLOCKS[3];
  const tabs: TabId[] = ['Mesh', 'Kvc_k', 'Ring', 'Stats', 'APA'];

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Stack */}
      <header className="w-full shrink-0 flex flex-col gap-0.5">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm font-mono font-bold tracking-wider text-white">
              GF-T3-298
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 rounded">
              FLAGSHIP
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 overflow-hidden">
            <select
              aria-label="KV Compression Corridor"
              value={selectedCorridor}
              onChange={(e) => handleCorridorChange(e.target.value)}
              className="max-w-[120px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded shrink-0 focus:outline-none focus:border-[#00F0FF]"
            >
              {CORRIDORS.map((corridor) => (
                <option key={corridor} value={corridor}>
                  {corridor}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setActiveTab('Kvc_k');
                handleStepCompressionPass();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-cyan-950 text-[#00F0FF] border border-cyan-500/40 rounded transition-colors cursor-pointer"
            >
              [KVC]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Ring');
                handleToggleOutlierSpike();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-amber-950 text-[#FF9F0A] border border-amber-500/40 rounded transition-colors cursor-pointer"
            >
              [Ring]
            </button>
            <button
              type="button"
              onClick={handleTriggerBurst}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <p className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          KV Compression · Quantization Ring · Quadrupled Capacity
        </p>
      </header>

      {/* 4-Card Arcade HUD Ribbon (2x2 Grid) */}
      <section
        aria-label="Arcade HUD Telemetry Ribbon"
        className="grid grid-cols-2 gap-1 w-full shrink-0"
      >
        {/* Card 1: KVC NITRO */}
        <div className="bg-slate-950/90 border border-slate-800 rounded px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-300">
              KVC NITRO
            </span>
            <span className="font-mono text-lg font-bold text-[#00F0FF] leading-none">
              {throughputGbps.toLocaleString() + ' GB/s'}
            </span>
          </div>
          <div className="w-full bg-slate-900 h-1 rounded overflow-hidden my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-all duration-150"
              style={{ width: String(saturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Compression Throughput Saturation
          </div>
        </div>

        {/* Card 2: RING STREAK */}
        <div className="bg-slate-950/90 border border-slate-800 rounded px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-300">
              RING STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A] bg-amber-950/60 border border-amber-500/40 px-1 rounded">
              {precisionBadge}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-1">
            <span className="font-mono text-lg font-bold text-white leading-none">
              {cacheLatencyUs}
            </span>
            <span className="text-[10px] font-mono text-slate-300 truncate">
              Cache Latency
            </span>
          </div>
        </div>

        {/* Card 3: ACTIVE BLOCKS */}
        <div className="bg-slate-950/90 border border-slate-800 rounded px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-300">
              ACTIVE BLOCKS
            </span>
            <span className="font-mono text-sm font-bold text-white leading-none">
              BLOCKS: 8/8
            </span>
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {blocks.map((b, idx) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBlockIndex(idx)}
                className={
                  'text-[9px] font-mono font-bold rounded text-center border cursor-pointer leading-tight ' +
                  (selectedBlockIndex === idx
                    ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-white'
                    : b.bitWidth === 8
                    ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                    : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300')
                }
              >
                {b.id}
              </button>
            ))}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-950/90 border border-slate-800 rounded px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-300">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">
              {'+' + engineXpK.toFixed(1) + 'k ENGINE XP'}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-1">
            <span className="font-mono text-sm font-bold text-cyan-300 leading-none">
              {processedTokens.toLocaleString() + ' UNITS'}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 truncate">
              {kvStateLabel}
            </span>
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Workspace Views"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-0.5 px-1.5 text-[11px] font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
                (isActive
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Streamlined Mesh Info Subheader */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 shrink-0">
        {'VIEW: MESH · PTR: 0x1EF8DC0 · MODE: ' +
          meshMode +
          ' · BLOCKS: 8 · VEC: ' +
          meshVec}
      </div>

      {/* Interactive Block Matrix Bay (K0–K7) in strict 2-row x 4-column grid */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/70 border border-slate-800/90 rounded-lg shrink-0">
        {blocks.map((block, idx) => {
          const isSelected = selectedBlockIndex === idx;
          return (
            <div
              key={block.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedBlockIndex(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedBlockIndex(idx);
                }
              }}
              className={
                'py-1 px-1.5 rounded border transition-colors cursor-pointer flex flex-col justify-between leading-tight ' +
                (isSelected
                  ? 'bg-slate-900/95 border-[#00F0FF]'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700')
              }
            >
              {/* Line 1: Title & Hex */}
              <div className="text-[10px] font-mono font-bold text-white flex justify-between items-center">
                <span className="truncate">{block.title}</span>
                <span className="text-slate-300">{block.hex}</span>
              </div>

              {/* Line 2: Tokens & Compression Ratio */}
              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-cyan-300">
                <span>{'TOK: ' + String(block.tokensK) + 'K'}</span>
                <span>{'RATIO: ' + block.ratio}</span>
              </div>

              {/* Line 3: Latency & State */}
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-[#FF9F0A]">{block.latencyMs}</span>
                <span className="text-emerald-400 truncate">{block.status}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Optional APA / Diagnostic Context Strip when non-Mesh tab is selected */}
      {activeTab === 'APA' && (
        <div className="grid grid-cols-2 gap-1.5 px-2 py-1 bg-slate-950/95 border border-[#00F0FF]/50 rounded shrink-0 items-center">
          <div className="font-mono text-[10px] flex flex-col">
            <span className="text-white font-bold truncate">
              GF-T3-298 · CLUSTER-006 · Retail Price: 75,000 - 150,000+ Units
            </span>
            <span className="text-amber-300 truncate">{apaNotice}</span>
          </div>
          <div className="flex flex-col gap-1 w-full">
            <button
              type="button"
              onClick={() => {
                setApaNotice('APA Title Packet Dispatched · SHA-256 Verified');
                pushLog(
                  '🟢 CREW CHIEF: Sovereign APA Title Transfer packet staged for GF-T3-298',
                  '🟢 TELEMETRY: Ed25519 signature verified · 100% MIT clean-room repository ready'
                );
              }}
              className="w-full py-0.5 px-2 text-[10px] font-mono font-bold bg-[#00F0FF] text-slate-950 rounded cursor-pointer text-center"
            >
              ACQUIRE TITLE (APA)
            </button>
            <button
              type="button"
              onClick={() => {
                setApaNotice('CLUSTER-006 Vault Buyout Dossier Opened');
                pushLog(
                  '🟢 CREW CHIEF: CLUSTER-006 Vault Buyout inquiry logged',
                  '🟢 TELEMETRY: Zero-licensing sovereign IP dossier unlocked'
                );
              }}
              className="w-full py-0.5 px-2 text-[10px] font-mono font-bold bg-slate-900 text-[#FF9F0A] border border-[#FF9F0A]/60 rounded cursor-pointer text-center"
            >
              INQUIRE VAULT BUYOUT
            </button>
          </div>
        </div>
      )}

      {/* Compact KV Telemetry Inspector Strip */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {activeBlock.id +
          ' · TOK: ' +
          String(activeBlock.tokensK) +
          'K · RATIO: ' +
          activeBlock.ratio +
          ' · SYNC: ' +
          String(activeBlock.syncPct) +
          '% · PTR ' +
          activeBlock.inspectorPtr +
          ' · KVC: OK · LOCKED'}
      </div>

      {/* Tactical Launch Control Switches */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleTriggerBurst}
          className="border border-[#FF9F0A] bg-amber-950/40 hover:bg-amber-900/50 text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          💥 INJECT KV COMPRESSION BURST
        </button>

        <button
          type="button"
          onClick={handleToggleOutlierSpike}
          className="border border-[#00F0FF] bg-cyan-950/40 hover:bg-cyan-900/50 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.25)] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          ⚡ TOGGLE OUTLIER PRUNING SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepCompressionPass}
          className="border border-emerald-500 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          🚀 STEP ASYNCHRONOUS COMPRESSION PASS
        </button>

        <button
          type="button"
          onClick={handleFlushArenas}
          className="border border-rose-500 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          🔄 FLUSH CACHE BLOCK ARENAS
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
