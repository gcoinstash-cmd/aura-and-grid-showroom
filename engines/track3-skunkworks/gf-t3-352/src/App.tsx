/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

type TabKey = 'Mesh' | 'Fp4_' | 'Dqnt' | 'Stats' | 'APA';

interface WeightSlot {
  id: number;
  code: string;
  title: string;
  hex: string;
  tokens: string;
  fp4Load: string;
  sync: string;
  latency: string;
  status: string;
  dqntFlag: string;
  scaleFactor: string;
  packedByteHex: string;
}

const CORRIDORS: string[] = [
  'FP4-CORRIDOR-ALPHA (DYNAMIC-4BIT-PACKING-FABRIC · 152600-GB/S)',
  'FP4-CORRIDOR-BRAVO (WEIGHT-ONLY-DEQUANT-ENGINE)',
  'FP4-CORRIDOR-GAMMA (NON-BLOCKING-FP4-UNPACKING-ROUTER)',
  'FP4-CORRIDOR-DELTA (FALLBACK-INT8-UNPACKED-PASS)',
];

const INITIAL_WEIGHTS: WeightSlot[] = [
  {
    id: 0,
    code: 'W0',
    title: 'Weight 0 (W0)',
    hex: '0x5B000',
    tokens: '256K',
    fp4Load: '100%',
    sync: '100%',
    latency: '0.02ms',
    status: 'DEQUANTIZED · LOCKED',
    dqntFlag: 'OK',
    scaleFactor: '1.09',
    packedByteHex: '0xE4',
  },
  {
    id: 1,
    code: 'W1',
    title: 'Weight 1 (W1)',
    hex: '0x5B010',
    tokens: '256K',
    fp4Load: '100%',
    sync: '100%',
    latency: '0.02ms',
    status: 'DEQUANTIZED · LOCKED',
    dqntFlag: 'OK',
    scaleFactor: '1.10',
    packedByteHex: '0xB2',
  },
  {
    id: 2,
    code: 'W2',
    title: 'Weight 2 (W2)',
    hex: '0x5B020',
    tokens: '256K',
    fp4Load: '100%',
    sync: '100%',
    latency: '0.02ms',
    status: 'DEQUANTIZED · LOCKED',
    dqntFlag: 'OK',
    scaleFactor: '1.09',
    packedByteHex: '0x7A',
  },
  {
    id: 3,
    code: 'W3',
    title: 'Weight 3 (W3)',
    hex: '0x5B030',
    tokens: '256K',
    fp4Load: '100%',
    sync: '100%',
    latency: '0.02ms',
    status: 'DEQUANTIZED · LOCKED',
    dqntFlag: 'OK',
    scaleFactor: '1.10',
    packedByteHex: '0xF6',
  },
  {
    id: 4,
    code: 'W4',
    title: 'Weight 4 (W4)',
    hex: '0x5B040',
    tokens: '256K',
    fp4Load: '100%',
    sync: '100%',
    latency: '0.02ms',
    status: 'DEQUANTIZED · LOCKED',
    dqntFlag: 'OK',
    scaleFactor: '1.09',
    packedByteHex: '0x9C',
  },
  {
    id: 5,
    code: 'W5',
    title: 'Weight 5 (W5)',
    hex: '0x5B050',
    tokens: '256K',
    fp4Load: '100%',
    sync: '100%',
    latency: '0.02ms',
    status: 'DEQUANTIZED · LOCKED',
    dqntFlag: 'OK',
    scaleFactor: '1.10',
    packedByteHex: '0xD1',
  },
  {
    id: 6,
    code: 'W6',
    title: 'Weight 6 (W6)',
    hex: '0x5B060',
    tokens: '256K',
    fp4Load: '100%',
    sync: '100%',
    latency: '0.02ms',
    status: 'DEQUANTIZED · LOCKED',
    dqntFlag: 'OK',
    scaleFactor: '1.09',
    packedByteHex: '0x6E',
  },
  {
    id: 7,
    code: 'W7',
    title: 'Weight 7 (W7)',
    hex: '0x5B070',
    tokens: '256K',
    fp4Load: '100%',
    sync: '100%',
    latency: '0.02ms',
    status: 'DEQUANTIZED · LOCKED',
    dqntFlag: 'OK',
    scaleFactor: '1.10',
    packedByteHex: '0xC5',
  },
];

const INITIAL_LOGS: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: Asynchronous FP4 quantization and 4-bit weight-only dequantization engine initialized · 8 weights linked',
  '[00:01.08] 🟢 TELEMETRY: Blackwell 4-bit tensor core unpacking verified at 152,600 GB/s with 4X memory footprint compression',
];

export default function App() {
  const [selectedCorridor, setSelectedCorridor] = useState<string>(CORRIDORS[0]);
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [weights, setWeights] = useState<WeightSlot[]>(INITIAL_WEIGHTS);
  const [selectedWeightIdx, setSelectedWeightIdx] = useState<number>(3);
  const [throughputGbps, setThroughputGbps] = useState<number>(152600);
  const [unpackingLatencyUs, setUnpackingLatencyUs] = useState<string>('0.01');
  const [processedTokens, setProcessedTokens] = useState<number>(36600000);
  const [engineXpK, setEngineXpK] = useState<string>('75.0');
  const [fp4State, setFp4State] = useState<string>('Active');
  const [outlierSpike, setOutlierSpike] = useState<boolean>(false);
  const [scaleVec, setScaleVec] = useState<string>('[1.09, 1.10, 1.09, 1.10]');
  const [modeLabel, setModeLabel] = useState<string>('FP4_QUANTIZATION');
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_LOGS);
  const [apaNotice, setApaNotice] = useState<string>(
    'READY FOR SOVEREIGN IP TITLE TRANSFER · CLUSTER-006 · ZERO ROYALTY ENCUMBRANCE'
  );
  const [passCounter, setPassCounter] = useState<number>(1);

  const selectedWeight = weights[selectedWeightIdx] || weights[3];

  const appendRadioLog = (line1: string, line2: string) => {
    setRadioLogs([line1, line2]);
  };

  const handleCorridorChange = (nextCorridor: string) => {
    setSelectedCorridor(nextCorridor);
    if (nextCorridor.includes('DELTA')) {
      setThroughputGbps(98400);
      setUnpackingLatencyUs('0.03');
      setModeLabel('FALLBACK_INT8_PASS');
    } else if (nextCorridor.includes('BRAVO')) {
      setThroughputGbps(154200);
      setUnpackingLatencyUs('0.01');
      setModeLabel('WEIGHT_ONLY_DEQUANT');
    } else if (nextCorridor.includes('GAMMA')) {
      setThroughputGbps(158900);
      setUnpackingLatencyUs('0.01');
      setModeLabel('NON_BLOCKING_ROUTER');
    } else {
      setThroughputGbps(152600);
      setUnpackingLatencyUs('0.01');
      setModeLabel('FP4_QUANTIZATION');
    }
    appendRadioLog(
      '[00:02.12] 🟢 ROUTER: Switched synthetic corridor to ' + nextCorridor.split(' ')[0],
      '[00:02.16] 🟢 TELEMETRY: Sub-microsecond FP4 scale boundary barrier locked across W0..W7'
    );
  };

  const handleTriggerBurst = () => {
    const nextTokens = processedTokens + 1250000;
    const nextXp = (parseFloat(engineXpK) + 4.5).toFixed(1);
    setThroughputGbps(168400);
    setUnpackingLatencyUs('0.01');
    setProcessedTokens(nextTokens);
    setEngineXpK(nextXp);
    setFp4State('Active');
    setModeLabel('FP4_BURST_OVERDRIVE');
    setWeights(
      weights.map((w) => ({
        ...w,
        tokens: '288K',
        fp4Load: '100%',
        sync: '100%',
        latency: '0.01ms',
        status: 'DEQUANTIZED · LOCKED',
        dqntFlag: 'OK',
      }))
    );
    appendRadioLog(
      '[00:03.04] 🟠 CREW CHIEF: FP4 Quantization Burst injected · 4-bit E2M1 nibble packing saturated at 168,400 GB/s',
      '[00:03.09] 🟢 TELEMETRY: Processed tokens advanced to ' +
        nextTokens.toLocaleString('en-US') +
        ' Units · Zero host CPU stalls'
    );
  };

  const handleToggleOutlierSpike = () => {
    const nextSpike = !outlierSpike;
    setOutlierSpike(nextSpike);
    if (nextSpike) {
      setThroughputGbps(141200);
      setUnpackingLatencyUs('0.02');
      setFp4State('Re-Calibrating');
      setScaleVec('[1.47, 1.49, 1.46, 1.48]');
      setModeLabel('DYNAMIC_SCALE_RECAL');
      setWeights(
        weights.map((w, idx) => ({
          ...w,
          fp4Load: '98%',
          sync: '100%',
          latency: '0.03ms',
          status: 'SCALE-RECAL · LOCKED',
          dqntFlag: 'RECAL',
          scaleFactor: idx % 2 === 0 ? '1.47' : '1.49',
        }))
      );
      appendRadioLog(
        '[00:04.11] 🔵 OUTLIER INTERLOCK: Dequantization outlier spike active · Forcing dynamic FP4 group scale re-calibration',
        '[00:04.15] 🟢 BARRIER SYNC: Sub-microsecond scale vector updated to [1.47, 1.49, 1.46, 1.48] across W0..W7'
      );
    } else {
      setThroughputGbps(152600);
      setUnpackingLatencyUs('0.01');
      setFp4State('Active');
      setScaleVec('[1.09, 1.10, 1.09, 1.10]');
      setModeLabel('FP4_QUANTIZATION');
      setWeights(
        weights.map((w, idx) => ({
          ...w,
          fp4Load: '100%',
          sync: '100%',
          latency: '0.02ms',
          status: 'DEQUANTIZED · LOCKED',
          dqntFlag: 'OK',
          scaleFactor: idx % 2 === 0 ? '1.09' : '1.10',
        }))
      );
      appendRadioLog(
        '[00:04.40] 🟢 CREW CHIEF: Outlier spike cleared · Nominal E2M1 FP4 scale vector [1.09, 1.10, 1.09, 1.10] restored',
        '[00:04.44] 🟢 TELEMETRY: Blackwell 4-bit tensor core unpacking stabilized at 152,600 GB/s'
      );
    }
  };

  const handleStepPass = () => {
    const nextPass = passCounter + 1;
    const nextTokens = processedTokens + 512000;
    const nextXp = (parseFloat(engineXpK) + 2.5).toFixed(1);
    setPassCounter(nextPass);
    setProcessedTokens(nextTokens);
    setEngineXpK(nextXp);
    setThroughputGbps(156200);
    setUnpackingLatencyUs('0.01');
    setFp4State('Active');
    setWeights(
      weights.map((w, idx) => ({
        ...w,
        tokens: String(256 + nextPass * 4) + 'K',
        fp4Load: '100%',
        sync: '100%',
        latency: '0.02ms',
        status: 'DEQUANTIZED · LOCKED',
        dqntFlag: 'OK',
        packedByteHex: '0x' + ((0xa0 + idx * 11 + nextPass) & 0xff).toString(16).toUpperCase(),
      }))
    );
    appendRadioLog(
      '[00:05.20] 🟢 ASYNC PASS #' +
        String(nextPass) +
        ': Non-blocking 4-bit weight-only dequantization fused into tensor core GEMM',
      '[00:05.24] 🟢 TELEMETRY: 4X memory bandwidth reduction verified · Active Weights: 8 Weights'
    );
  };

  const handleFlushArenas = () => {
    setSelectedCorridor(CORRIDORS[0]);
    setWeights(INITIAL_WEIGHTS);
    setSelectedWeightIdx(3);
    setThroughputGbps(152600);
    setUnpackingLatencyUs('0.01');
    setProcessedTokens(36600000);
    setEngineXpK('75.0');
    setFp4State('Active');
    setOutlierSpike(false);
    setScaleVec('[1.09, 1.10, 1.09, 1.10]');
    setModeLabel('FP4_QUANTIZATION');
    setPassCounter(1);
    setRadioLogs(INITIAL_LOGS);
  };

  const saturationPct = Math.min(100, Math.round((throughputGbps / 170000) * 100));

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Block */}
      <header className="w-full shrink-0 flex flex-col gap-0.5">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-mono font-bold tracking-tight text-white">
              GF-T3-352
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/15 text-[#00F0FF] border border-cyan-500/40 rounded">
              FLAGSHIP
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1 shrink-0 overflow-hidden">
            <select
              aria-label="FP4 Synthetic Corridor Selector"
              value={selectedCorridor}
              onChange={(e) => handleCorridorChange(e.target.value)}
              className="max-w-[120px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded shrink-0 focus:outline-none focus:border-cyan-400"
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
                setActiveTab('Fp4_');
                handleTriggerBurst();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/40 rounded cursor-pointer transition-colors"
            >
              [Fp4_]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Dqnt');
                handleStepPass();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded cursor-pointer transition-colors"
            >
              [Dqnt]
            </button>
            <button
              type="button"
              onClick={handleStepPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 rounded cursor-pointer transition-colors"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          FP4 Quantization · 4-Bit Dequant · 4X Memory Compression
        </div>
      </header>

      {/* 4-Card Arcade HUD Ribbon (2x2 Grid) */}
      <section className="grid grid-cols-2 gap-1.5 w-full shrink-0">
        {/* Card 1: FP4 NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              FP4 NITRO
            </span>
            <span className="font-mono text-lg font-bold text-[#00F0FF] leading-none">
              {throughputGbps.toLocaleString('en-US') + ' GB/s'}
            </span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden my-1 border border-slate-800">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(saturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Dequantization Throughput Saturation
          </div>
        </div>

        {/* Card 2: DQNT STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              DQNT STREAK
            </span>
            <span className="font-mono text-lg font-bold text-[#FF9F0A] leading-none">
              {unpackingLatencyUs + ' µs'}
            </span>
          </div>
          <div className="flex items-center justify-between my-0.5">
            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded px-1 py-0.2">
              🔥 FP4-BLACKWELL
            </span>
            <span className="text-[9px] font-mono text-emerald-400">4X BANDWIDTH</span>
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Unpacking Latency
          </div>
        </div>

        {/* Card 3: ACTIVE WEIGHTS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              ACTIVE WEIGHTS
            </span>
            <span className="font-mono text-sm sm:text-base font-bold text-emerald-400 leading-none">
              WEIGHTS: 8/8
            </span>
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {weights.map((w, idx) => (
              <button
                key={w.code}
                type="button"
                onClick={() => setSelectedWeightIdx(idx)}
                className={
                  'text-[8px] font-mono font-bold py-0.5 rounded text-center cursor-pointer border ' +
                  (selectedWeightIdx === idx
                    ? 'bg-cyan-500/25 text-[#00F0FF] border-cyan-400'
                    : 'bg-slate-950 text-emerald-400 border-slate-800')
                }
              >
                {w.code}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Active Weights: 8 Weights · F1 Shift Interlock
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="font-mono text-sm sm:text-base font-bold text-white leading-none truncate">
              {processedTokens.toLocaleString('en-US') + ' UNITS'}
            </span>
          </div>
          <div className="flex items-center justify-between my-0.5">
            <span className="text-[10px] font-mono font-bold text-[#00F0FF]">
              {'+' + engineXpK + 'k ENGINE XP'}
            </span>
            <span className="text-[9px] font-mono text-amber-400">E2M1 4-BIT</span>
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            {'FP4 State: ' + fp4State}
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {(['Mesh', 'Fp4_', 'Dqnt', 'Stats', 'APA'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
              (activeTab === tab
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60')
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Streamlined Mesh Info Subheader */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        {'VIEW: ' +
          activeTab.toUpperCase() +
          ' · PTR: 0x5BF8DC0 · MODE: ' +
          modeLabel +
          ' · WEIGHTS: 8 · VEC: ' +
          scaleVec}
      </div>

      {/* Main Interactive Center Bay (Always renders Weight Matrix Bay W0-W7 + Contextual Tab Overlay Bar) */}
      <main className="flex-1 min-h-0 flex flex-col justify-between bg-slate-950/80 border border-slate-800/90 rounded-lg p-1 overflow-hidden">
        {/* Contextual Tab Telemetry Strip when user switches between Fp4_, Dqnt, Stats, or APA */}
        {activeTab === 'Fp4_' && (
          <div className="px-2 py-1 bg-amber-950/30 border border-amber-500/30 rounded text-[10px] font-mono text-amber-200 flex items-center justify-between gap-2 shrink-0">
            <span className="truncate">
              FORMULA: F_fp4 = sum_j D_fp4(W_fp4, X_activation, Delta_scale) · E2M1 LUT: [0, 0.5, 1, 1.5, 2, 3, 4, 6]
            </span>
            <span className="text-amber-400 font-bold shrink-0">COMPRESSION: 4.00X</span>
          </div>
        )}

        {activeTab === 'Dqnt' && (
          <div className="px-2 py-1 bg-cyan-950/30 border border-cyan-500/30 rounded text-[10px] font-mono text-cyan-200 flex items-center justify-between gap-2 shrink-0">
            <span className="truncate">
              NON-BLOCKING UNPACKER: 2 x 4-Bit Nibbles per Byte · Register-Level Tensor Core Decode
            </span>
            <span className="text-cyan-300 font-bold shrink-0">HOST STALLS: 0</span>
          </div>
        )}

        {activeTab === 'Stats' && (
          <div className="px-2 py-1 bg-emerald-950/30 border border-emerald-500/30 rounded text-[10px] font-mono text-emerald-200 flex items-center justify-between gap-2 shrink-0">
            <span className="truncate">
              DYNO GATES 01-04: VERIFIED · PYTEST SUITE: 100% PASS · RMSE DRIFT: 0.00018 · CORRIDOR: {selectedCorridor.split(' ')[0]}
            </span>
            <span className="text-emerald-400 font-bold shrink-0">COV: 92%</span>
          </div>
        )}

        {activeTab === 'APA' && (
          <div className="px-2 py-1 bg-slate-900/95 border border-cyan-500/40 rounded flex flex-col gap-1 shrink-0">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-200">
              <span className="font-bold text-[#00F0FF]">
                UNIT: GF-T3-352 · CLUSTER-006 · 100% SOVEREIGN APA TITLE
              </span>
              <span className="text-amber-400 font-bold">
                Retail Price: 75,000 - 150,000 Units
              </span>
            </div>
            <div className="text-[9px] font-mono text-slate-300 truncate">{apaNotice}</div>
            <div className="flex flex-col gap-1 w-full">
              <button
                type="button"
                onClick={() => {
                  setApaNotice(
                    'APA TITLE DOSSIER LOCKED: GF-T3-352 STANDALONE REPOSITORY & MIT IP ASSIGNED'
                  );
                  appendRadioLog(
                    '[00:06.02] 🟢 APA DESK: Sovereign IP Title Transfer packet prepared for GF-T3-352',
                    '[00:06.05] 🟢 ESCROW GATE: Clean-room MIT provenance & NIST SP 800-218 SSDF verified'
                  );
                }}
                className="w-full py-1 px-2 text-[10px] font-mono font-bold bg-[#FF9F0A] hover:bg-amber-400 text-slate-950 rounded text-center cursor-pointer transition-colors"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setApaNotice(
                    'VAULT BUYOUT INQUIRY LOGGED: CLUSTER-006 ALLOCATION & ESCROW GATE DISPATCHED'
                  );
                  appendRadioLog(
                    '[00:06.18] 🟠 VAULT DESK: Full Engine APA Buyout inquiry registered for GF-T3-352',
                    '[00:06.22] 🟢 TELEMETRY: Zero licensing · Zero dilution · 100% standalone repository hand-off'
                  );
                }}
                className="w-full py-1 px-2 text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-[#00F0FF] border border-cyan-500/40 rounded text-center cursor-pointer transition-colors"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        )}

        {/* Interactive Weight Matrix Bay (W0–W7) in a tight 2-row x 4-column grid */}
        <div className="grid grid-cols-4 gap-1 p-1 flex-1 min-h-0 items-stretch">
          {weights.map((w, idx) => {
            const isSelected = selectedWeightIdx === idx;
            return (
              <div
                key={w.code}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedWeightIdx(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedWeightIdx(idx);
                  }
                }}
                className={
                  'rounded border p-1 flex flex-col justify-between cursor-pointer transition-colors ' +
                  (isSelected
                    ? 'bg-slate-900 border-[#00F0FF] shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-600')
                }
              >
                {/* Line 1 (Title & Hex) */}
                <div className="text-[9px] sm:text-[10px] font-mono font-bold text-white flex justify-between items-center w-full px-1">
                  <span>{w.title}</span>
                  <span className="text-slate-400 font-normal">{w.hex}</span>
                </div>

                {/* Line 2 (Tokens & FP4 Load) */}
                <div className="text-[8px] font-mono font-bold text-cyan-300 flex justify-between items-center w-full px-1">
                  <span>{'TOK: ' + w.tokens}</span>
                  <span>{'FP4: ' + w.fp4Load}</span>
                </div>

                {/* Line 3 (Latency & Status) */}
                <div className="flex justify-between items-center text-[8px] font-mono text-slate-300 w-full px-1">
                  <span className="text-amber-400">{w.latency}</span>
                  <span className="text-emerald-400">{w.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Compact FP4 Telemetry Inspector Strip */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {selectedWeight.code +
          ' · TOK: ' +
          selectedWeight.tokens +
          ' · FP4: ' +
          selectedWeight.fp4Load +
          ' · SYNC: ' +
          selectedWeight.sync +
          ' · PTR ' +
          selectedWeight.hex +
          ' · DQNT: ' +
          selectedWeight.dqntFlag +
          ' · LOCKED · WEIGHTS: 8 · PRECISION: 4BIT'}
      </div>

      {/* Tactical Launch Control Switches */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleTriggerBurst}
          className="border-amber-500/70 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full cursor-pointer transition-colors"
        >
          💥 INJECT FP4 QUANTIZATION BURST
        </button>

        <button
          type="button"
          onClick={handleToggleOutlierSpike}
          className="border-cyan-400/80 bg-cyan-950/40 hover:bg-cyan-900/50 text-[#00F0FF] text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full cursor-pointer transition-colors"
        >
          ⚡ TOGGLE DEQUANTIZATION OUTLIER SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepPass}
          className="border-emerald-500/70 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full cursor-pointer transition-colors"
        >
          🚀 STEP ASYNCHRONOUS DEQUANTIZATION PASS
        </button>

        <button
          type="button"
          onClick={handleFlushArenas}
          className="border-rose-500/70 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-[8px] sm:text-[9px] md:text-xs font-bold font-mono py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full cursor-pointer transition-colors"
        >
          🔄 FLUSH FP4 ARENAS
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
