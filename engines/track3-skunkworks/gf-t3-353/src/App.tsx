/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useState } from 'react';

type TabKey = 'Mesh' | 'Fp6_' | 'Comp' | 'Stats' | 'APA';

interface MatrixItem {
  id: number;
  title: string;
  shortCode: string;
  hexPtr: string;
  tokensK: number;
  fp6Pct: number;
  syncPct: number;
  latencyMs: string;
  status: string;
  scaleFactor: string;
  packedCodes: number[];
}

const CORRIDORS: string[] = [
  'FP6-CORRIDOR-ALPHA (DYNAMIC-6BIT-PACKING-FABRIC · 154800-GB/S)',
  'FP6-CORRIDOR-BRAVO (WEIGHT-COMPRESSION-ENGINE)',
  'FP6-CORRIDOR-GAMMA (NON-BLOCKING-FP6-UNPACKING-ROUTER)',
  'FP6-CORRIDOR-DELTA (FALLBACK-FP8-UNCOMPRESSED-PASS)',
];

const INITIAL_MATRICES: MatrixItem[] = [
  { id: 0, title: 'Matrix 0 (M0)', shortCode: 'M0', hexPtr: '0x5C000', tokensK: 256, fp6Pct: 100, syncPct: 100, latencyMs: '0.02ms', status: 'COMPRESSED · LOCKED', scaleFactor: '0.03125', packedCodes: [42, 19, 57, 63] },
  { id: 1, title: 'Matrix 1 (M1)', shortCode: 'M1', hexPtr: '0x5C010', tokensK: 256, fp6Pct: 100, syncPct: 100, latencyMs: '0.02ms', status: 'COMPRESSED · LOCKED', scaleFactor: '0.03125', packedCodes: [41, 22, 58, 61] },
  { id: 2, title: 'Matrix 2 (M2)', shortCode: 'M2', hexPtr: '0x5C020', tokensK: 256, fp6Pct: 100, syncPct: 100, latencyMs: '0.02ms', status: 'COMPRESSED · LOCKED', scaleFactor: '0.03125', packedCodes: [44, 18, 55, 62] },
  { id: 3, title: 'Matrix 3 (M3)', shortCode: 'M3', hexPtr: '0x5C030', tokensK: 256, fp6Pct: 100, syncPct: 100, latencyMs: '0.02ms', status: 'COMPRESSED · LOCKED', scaleFactor: '0.03125', packedCodes: [42, 19, 57, 63] },
  { id: 4, title: 'Matrix 4 (M4)', shortCode: 'M4', hexPtr: '0x5C040', tokensK: 256, fp6Pct: 100, syncPct: 100, latencyMs: '0.02ms', status: 'COMPRESSED · LOCKED', scaleFactor: '0.03125', packedCodes: [39, 24, 59, 60] },
  { id: 5, title: 'Matrix 5 (M5)', shortCode: 'M5', hexPtr: '0x5C050', tokensK: 256, fp6Pct: 100, syncPct: 100, latencyMs: '0.02ms', status: 'COMPRESSED · LOCKED', scaleFactor: '0.03125', packedCodes: [43, 21, 56, 62] },
  { id: 6, title: 'Matrix 6 (M6)', shortCode: 'M6', hexPtr: '0x5C060', tokensK: 256, fp6Pct: 100, syncPct: 100, latencyMs: '0.02ms', status: 'COMPRESSED · LOCKED', scaleFactor: '0.03125', packedCodes: [40, 20, 54, 63] },
  { id: 7, title: 'Matrix 7 (M7)', shortCode: 'M7', hexPtr: '0x5C070', tokensK: 256, fp6Pct: 100, syncPct: 100, latencyMs: '0.02ms', status: 'COMPRESSED · LOCKED', scaleFactor: '0.03125', packedCodes: [45, 17, 58, 61] },
];

const INITIAL_LOGS: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: Asynchronous FP6 quantization and 6-bit compression engine initialized · 8 matrices linked',
  '[00:01.08] 🟢 TELEMETRY: Blackwell 6-bit tensor core packing verified at 154,800 GB/s with 33% VRAM compression',
];

export default function App() {
  const [corridor, setCorridor] = useState<string>(CORRIDORS[0]);
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [selectedMatrixId, setSelectedMatrixId] = useState<number>(3);
  const [throughputGbs, setThroughputGbs] = useState<number>(154800);
  const [packingLatencyUs, setPackingLatencyUs] = useState<string>('0.01');
  const [tokenScoreUnits, setTokenScoreUnits] = useState<number>(37400000);
  const [engineXpK, setEngineXpK] = useState<string>('75.0');
  const [fp6State, setFp6State] = useState<string>('Active');
  const [outlierActive, setOutlierActive] = useState<boolean>(false);
  const [vecValues, setVecValues] = useState<string>('1.10, 1.11, 1.10, 1.11');
  const [matrices, setMatrices] = useState<MatrixItem[]>(INITIAL_MATRICES);
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_LOGS);
  const [apaNotice, setApaNotice] = useState<string>('READY FOR 100% SOVEREIGN IP TITLE TRANSFER (PURE APA)');

  const selectedMatrix = matrices[selectedMatrixId] || matrices[3];

  const pushLog = (line1: string, line2: string) => {
    setRadioLogs([line1, line2]);
  };

  const handleInjectBurst = () => {
    const nextThroughput = 168400;
    const nextTokens = tokenScoreUnits + 1250000;
    const nextXp = (parseFloat(engineXpK) + 2.5).toFixed(1);
    setThroughputGbs(nextThroughput);
    setPackingLatencyUs('0.01');
    setTokenScoreUnits(nextTokens);
    setEngineXpK(nextXp);
    setFp6State('Active');
    setMatrices((prev) =>
      prev.map((m) => ({
        ...m,
        tokensK: m.tokensK + 32,
        fp6Pct: 100,
        latencyMs: '0.01ms',
        status: 'COMPRESSED · LOCKED',
      }))
    );
    pushLog(
      '[00:02.14] 🟠 CREW CHIEF: Triggered FP6 Quantization Burst across M0..M7 · 6-bit register saturation locked',
      '[00:02.19] 🟢 TELEMETRY: Compression Throughput surged to 168,400 GB/s · Packing Latency held at 0.01 µs'
    );
  };

  const handleToggleOutlierSpike = () => {
    const nextOutlier = !outlierActive;
    setOutlierActive(nextOutlier);
    if (nextOutlier) {
      setThroughputGbs(141200);
      setPackingLatencyUs('0.03');
      setVecValues('1.92, 1.11, 1.88, 1.11');
      setMatrices((prev) =>
        prev.map((m, idx) => ({
          ...m,
          fp6Pct: idx % 2 === 0 ? 96 : 100,
          latencyMs: '0.03ms',
          scaleFactor: '0.05468',
          status: 'SCALE RE-CAL · LOCKED',
        }))
      );
      pushLog(
        '[00:03.05] ⚡ CREW CHIEF: Injected Compression Outlier Spike · Force Dynamic FP6 Scale Re-Calibration active',
        '[00:03.09] cyan TELEMETRY: Sub-microsecond barrier sync adjusted Delta_scale to 0.05468 with zero perplexity drift'
      );
    } else {
      setThroughputGbs(154800);
      setPackingLatencyUs('0.01');
      setVecValues('1.10, 1.11, 1.10, 1.11');
      setMatrices((prev) =>
        prev.map((m) => ({
          ...m,
          fp6Pct: 100,
          latencyMs: '0.02ms',
          scaleFactor: '0.03125',
          status: 'COMPRESSED · LOCKED',
        }))
      );
      pushLog(
        '[00:03.42] 🟢 CREW CHIEF: Outlier spike cleared · Nominal 6-bit quantization scale restored across 8 matrices',
        '[00:03.45] 🟢 TELEMETRY: Compression Throughput stabilized at 154,800 GB/s · Packing Latency: 0.01 µs'
      );
    }
  };

  const handleStepDequantization = () => {
    const nextTokens = tokenScoreUnits + 450000;
    const nextXp = (parseFloat(engineXpK) + 1.2).toFixed(1);
    setTokenScoreUnits(nextTokens);
    setEngineXpK(nextXp);
    setVecValues('1.12, 1.13, 1.12, 1.13');
    setMatrices((prev) =>
      prev.map((m) => ({
        ...m,
        tokensK: m.tokensK + 16,
        syncPct: 100,
        status: 'COMPRESSED · LOCKED',
        packedCodes: m.packedCodes.map((c) => ((c + 3) % 62) + 1),
      }))
    );
    pushLog(
      '[00:04.12] 🚀 CREW CHIEF: Stepped Asynchronous Dequantization Pass · Non-blocking on-the-fly 6-bit unpacking verified',
      '[00:04.16] 🟢 TELEMETRY: Processed Tokens: ' + nextTokens.toLocaleString() + ' Units · Zero host CPU synchronization stalls'
    );
  };

  const handleFlushArenas = () => {
    setCorridor(CORRIDORS[0]);
    setThroughputGbs(154800);
    setPackingLatencyUs('0.01');
    setTokenScoreUnits(37400000);
    setEngineXpK('75.0');
    setFp6State('Active');
    setOutlierActive(false);
    setVecValues('1.10, 1.11, 1.10, 1.11');
    setSelectedMatrixId(3);
    setMatrices(INITIAL_MATRICES);
    setRadioLogs(INITIAL_LOGS);
  };

  const saturationPct = Math.min(100, Math.round((throughputGbs / 170000) * 100));

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header Section */}
      <header className="w-full shrink-0 flex flex-col gap-0.5">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-mono font-extrabold tracking-tight text-white">
              GF-T3-353
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-[#00F0FF] border border-cyan-400/50 rounded">
              FLAGSHIP
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 overflow-hidden">
            <select
              aria-label="Synthetic FP6 Corridor Selector"
              value={corridor}
              onChange={(e) => {
                const nextCorridor = e.target.value;
                setCorridor(nextCorridor);
                pushLog(
                  '[00:05.01] 🟢 CREW CHIEF: Switched active fabric to ' + nextCorridor,
                  '[00:05.04] 🟢 TELEMETRY: 6-bit barrier synchronization locked at 0.01 µs across 8 Matrices'
                );
              }}
              className="max-w-[120px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 rounded text-cyan-300 shrink-0 focus:outline-none focus:border-cyan-400"
            >
              {CORRIDORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setActiveTab('Fp6_')}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded cursor-pointer"
            >
              [Fp6_]
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('Comp')}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-amber-950 text-[#FF9F0A] border border-amber-500/40 rounded cursor-pointer"
            >
              [Comp]
            </button>
            <button
              type="button"
              onClick={handleStepDequantization}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 rounded cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap truncate">
          FP6 Quantization · 6-Bit Compression · 33% Less VRAM than FP8
        </div>
      </header>

      {/* 4-Card Arcade HUD Ribbon (2x2 Grid) */}
      <section className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5">
        {/* Card 1: FP6 NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              FP6 NITRO
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              {saturationPct}% SAT
            </span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-tight tabular-nums">
            {throughputGbs.toLocaleString()} GB/s
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden border border-slate-800 my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(saturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Compression Throughput Saturation
          </div>
        </div>

        {/* Card 2: COMP STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              COMP STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A] bg-amber-500/10 border border-amber-500/30 px-1 rounded">
              🔥 FP6-BLACKWELL
            </span>
          </div>
          <div className="text-[#FF9F0A] font-mono text-lg font-bold leading-tight tabular-nums">
            {packingLatencyUs} µs
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            Zero Host CPU Stalls · Sub-µs Barrier
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Packing Latency
          </div>
        </div>

        {/* Card 3: ACTIVE MATRICES */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              ACTIVE MATRICES
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              Active Matrices: 8 Matrices
            </span>
          </div>
          <div className="text-white font-mono text-base sm:text-lg font-bold leading-tight">
            MATRICES: 8/8
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {matrices.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMatrixId(m.id)}
                className={
                  'text-[9px] font-mono font-bold py-0.5 rounded text-center cursor-pointer border ' +
                  (selectedMatrixId === m.id
                    ? 'bg-cyan-500/30 text-[#00F0FF] border-cyan-400'
                    : 'bg-slate-950 text-emerald-400 border-slate-800')
                }
              >
                {m.shortCode}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            F1 Gear Shift Interlock [M0..M7] · Focus: {selectedMatrix.shortCode}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1 rounded">
              +{engineXpK}k ENGINE XP
            </span>
          </div>
          <div className="text-white font-mono text-base sm:text-lg font-bold leading-tight tabular-nums">
            {tokenScoreUnits.toLocaleString()} UNITS
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            Processed Tokens: {tokenScoreUnits.toLocaleString()} Units
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            FP6 State: {fp6State}
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {(['Mesh', 'Fp6_', 'Comp', 'Stats', 'APA'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
              (activeTab === tab
                ? 'bg-[#00F0FF] text-slate-950'
                : 'text-slate-300 hover:bg-slate-800')
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Streamlined Mesh Info Subheader */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        VIEW: MESH · PTR: 0x5CF8DC0 · MODE: FP6_QUANTIZATION · MATRICES: 8 · VEC: [{vecValues}]
      </div>

      {/* Main Center Bay: Interactive Matrix Bay (M0-M7) + Tab Overlay Details */}
      <main className="w-full shrink-0 my-0.5">
        {activeTab === 'Mesh' && (
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/90 border border-slate-800 rounded-lg">
            {matrices.map((m) => {
              const isSelected = m.id === selectedMatrixId;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMatrixId(m.id)}
                  className={
                    'p-1.5 rounded border cursor-pointer transition-colors flex flex-col justify-between gap-1 ' +
                    (isSelected
                      ? 'bg-slate-900 border-[#00F0FF]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700')
                  }
                >
                  {/* Line 1: Title & Hex */}
                  <div className="text-[9px] sm:text-[10px] font-mono font-bold text-white flex justify-between items-center w-full px-1">
                    <span>{m.title}</span>
                    <span className="text-slate-400 font-normal">{m.hexPtr}</span>
                  </div>
                  {/* Line 2: Tokens & FP6 Load */}
                  <div className="text-[8px] font-mono font-bold text-cyan-300 flex justify-between items-center w-full px-1">
                    <span>TOK: {m.tokensK}K</span>
                    <span>FP6: {m.fp6Pct}%</span>
                  </div>
                  {/* Line 3: Latency & Status */}
                  <div className="flex justify-between items-center text-[8px] font-mono text-slate-300 w-full px-1">
                    <span className="text-amber-400">{m.latencyMs}</span>
                    <span className="text-emerald-400">{m.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'Fp6_' && (
          <div className="p-2 bg-slate-950/90 border border-slate-800 rounded-lg font-mono text-xs flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-cyan-300 font-bold">
              <span>ASYNCHRONOUS FP6 QUANTIZATION &amp; 6-BIT INTERLOCK</span>
              <span className="text-amber-400">SCALE Δ: {selectedMatrix.scaleFactor}</span>
            </div>
            <div className="text-[11px] text-slate-300 truncate">
              Formula: F_fp6 = Sum(k=0..K-1) C_fp6(W_fp6, X_activation, Delta_scale) · 33% VRAM Reduction over FP8
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-[10px]">
              {selectedMatrix.packedCodes.map((code, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 p-1.5 rounded flex justify-between">
                  <span className="text-slate-400">WORD[{idx}]</span>
                  <span className="text-emerald-400 font-bold">6B:{code} (0b{code.toString(2).padStart(6, '0')})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Comp' && (
          <div className="p-2 bg-slate-950/90 border border-slate-800 rounded-lg font-mono text-xs flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[#FF9F0A] font-bold">
              <span>NON-BLOCKING ON-THE-FLY 6-BIT UNPACKING ROUTER</span>
              <span className="text-emerald-400">VRAM SAVED: 33% OVER FP8</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <div className="bg-slate-900 border border-slate-800 p-1.5 rounded">
                <div className="text-slate-400">FP8 BASELINE ARENA</div>
                <div className="text-white font-bold">8-Bit · 100% Footprint</div>
              </div>
              <div className="bg-slate-900 border border-cyan-500/40 p-1.5 rounded">
                <div className="text-cyan-300">FP6 PACKED ARENA</div>
                <div className="text-emerald-400 font-bold">6-Bit · 67% Footprint (-33%)</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-1.5 rounded">
                <div className="text-slate-400">SM UNPACK LATENCY</div>
                <div className="text-[#FF9F0A] font-bold">{packingLatencyUs} µs · Lock-Free</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Stats' && (
          <div className="p-2 bg-slate-950/90 border border-slate-800 rounded-lg font-mono text-xs grid grid-cols-4 gap-1.5">
            <div className="bg-slate-900 border border-slate-800 p-1.5 rounded">
              <div className="text-[10px] text-slate-400">Compression Throughput</div>
              <div className="text-cyan-300 font-bold">{throughputGbs.toLocaleString()} GB/s</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-1.5 rounded">
              <div className="text-[10px] text-slate-400">Packing Latency</div>
              <div className="text-amber-400 font-bold">{packingLatencyUs} µs</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-1.5 rounded">
              <div className="text-[10px] text-slate-400">Active Matrices</div>
              <div className="text-emerald-400 font-bold">8 Matrices</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-1.5 rounded">
              <div className="text-[10px] text-slate-400">Processed Tokens</div>
              <div className="text-white font-bold">{tokenScoreUnits.toLocaleString()} Units</div>
            </div>
          </div>
        )}

        {activeTab === 'APA' && (
          <div className="p-2 bg-slate-950/90 border border-slate-800 rounded-lg font-mono flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-cyan-300 font-bold">CHASSIS: GF-T3-353 · CLUSTER-006 · PURE APA TITLE TRANSFER</span>
              <span className="text-amber-400 font-bold">{apaNotice}</span>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setApaNotice('APA TITLE TRANSFER DOSSIER LOCKED · 100% SOVEREIGN IP');
                  pushLog(
                    '[00:06.10] 🟢 CREW CHIEF: ACQUIRE TITLE (APA) initiated for GF-T3-353 · 100% MIT clean-room transfer',
                    '[00:06.14] 🟢 TELEMETRY: Zero copyleft verified · Standalone FastAPI + Pytest + Dockerfile bundle ready'
                  );
                }}
                className="w-full py-1.5 px-3 bg-[#00F0FF] hover:bg-cyan-300 text-slate-950 font-mono font-extrabold text-xs rounded text-center cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setApaNotice('VAULT BUYOUT ESCROW CHANNEL OPENED · CLUSTER-006');
                  pushLog(
                    '[00:06.42] 🟠 CREW CHIEF: INQUIRE VAULT BUYOUT logged for GF-T3-353 · Direct repository hand-off queued',
                    '[00:06.48] 🟢 TELEMETRY: All 4 Dyno Verification Gates passed · Antigravity IDE ready'
                  );
                }}
                className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-[#FF9F0A] font-mono font-extrabold text-xs rounded text-center cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Compact FP6 Telemetry Inspector Strip */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {selectedMatrix.shortCode} · TOK: {selectedMatrix.tokensK}K · FP6: {selectedMatrix.fp6Pct}% · SYNC: {selectedMatrix.syncPct}% · PTR {selectedMatrix.hexPtr} · COMP: OK · LOCKED · MATRICES: 8 · PRECISION: 6BIT
      </div>

      {/* Tactical Launch Control Switches */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleInjectBurst}
          className="border-amber-500/80 bg-amber-950/40 hover:bg-amber-900/60 text-[#FF9F0A] text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full cursor-pointer"
        >
          💥 INJECT FP6 QUANTIZATION BURST
        </button>

        <button
          type="button"
          onClick={handleToggleOutlierSpike}
          className="border-[#00F0FF] bg-cyan-950/40 hover:bg-cyan-900/60 text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.25)] text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full cursor-pointer"
        >
          ⚡ TOGGLE COMPRESSION OUTLIER SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepDequantization}
          className="border-emerald-500/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full cursor-pointer"
        >
          🚀 STEP ASYNCHRONOUS DEQUANTIZATION PASS
        </button>

        <button
          type="button"
          onClick={handleFlushArenas}
          className="border-rose-500/80 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full cursor-pointer"
        >
          🔄 FLUSH FP6 ARENAS
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
