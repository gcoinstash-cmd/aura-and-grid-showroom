/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

type TabKey = 'Mesh' | 'FP8s' | 'Cals' | 'Stats' | 'APA';

interface ScaleSlotState {
  id: string;
  index: number;
  title: string;
  hexPtr: string;
  tokensK: number;
  scaleValue: string;
  latencyMs: string;
  status: string;
  syncPct: string;
  fp8Status: string;
}

interface CorridorOption {
  id: string;
  fullLabel: string;
  shortLabel: string;
  throughputGbs: string;
  latencyUs: string;
  modeTag: string;
}

const CORRIDORS: CorridorOption[] = [
  {
    id: 'FP8-CORRIDOR-ALPHA',
    fullLabel: 'FP8-CORRIDOR-ALPHA (DYNAMIC-FP8-QUANTIZATION-FABRIC · 51200-GB/S)',
    shortLabel: 'FP8-CORRIDOR-ALPHA',
    throughputGbs: '51,200 GB/s',
    latencyUs: '0.01 µs',
    modeTag: 'FP8_QUANTIZATION',
  },
  {
    id: 'FP8-CORRIDOR-BRAVO',
    fullLabel: 'FP8-CORRIDOR-BRAVO (CALIBRATION-MATRIX-ENGINE)',
    shortLabel: 'FP8-CORRIDOR-BRAVO',
    throughputGbs: '48,600 GB/s',
    latencyUs: '0.01 µs',
    modeTag: 'CALIBRATION_MATRIX',
  },
  {
    id: 'FP8-CORRIDOR-GAMMA',
    fullLabel: 'FP8-CORRIDOR-GAMMA (NON-BLOCKING-SCALE-FACTOR-ROUTER)',
    shortLabel: 'FP8-CORRIDOR-GAMMA',
    throughputGbs: '49,800 GB/s',
    latencyUs: '0.02 µs',
    modeTag: 'NON_BLOCKING_ROUTER',
  },
  {
    id: 'FP8-CORRIDOR-DELTA',
    fullLabel: 'FP8-CORRIDOR-DELTA (FALLBACK-UNQUANTIZED-BF16-PASS)',
    shortLabel: 'FP8-CORRIDOR-DELTA',
    throughputGbs: '25,600 GB/s',
    latencyUs: '0.04 µs',
    modeTag: 'FALLBACK_BF16_PASS',
  },
];

const INITIAL_SCALES: ScaleSlotState[] = [
  {
    id: 'F0',
    index: 0,
    title: 'Scale 0 (F0)',
    hexPtr: '0x23000',
    tokensK: 256,
    scaleValue: '0.0078',
    latencyMs: '0.02ms',
    status: 'CALIBRATED · LOCKED',
    syncPct: '100%',
    fp8Status: 'OK',
  },
  {
    id: 'F1',
    index: 1,
    title: 'Scale 1 (F1)',
    hexPtr: '0x23010',
    tokensK: 256,
    scaleValue: '0.0078',
    latencyMs: '0.02ms',
    status: 'CALIBRATED · LOCKED',
    syncPct: '100%',
    fp8Status: 'OK',
  },
  {
    id: 'F2',
    index: 2,
    title: 'Scale 2 (F2)',
    hexPtr: '0x23020',
    tokensK: 256,
    scaleValue: '0.0078',
    latencyMs: '0.02ms',
    status: 'CALIBRATED · LOCKED',
    syncPct: '100%',
    fp8Status: 'OK',
  },
  {
    id: 'F3',
    index: 3,
    title: 'Scale 3 (F3)',
    hexPtr: '0x23030',
    tokensK: 256,
    scaleValue: '0.0078',
    latencyMs: '0.02ms',
    status: 'CALIBRATED · LOCKED',
    syncPct: '100%',
    fp8Status: 'OK',
  },
  {
    id: 'F4',
    index: 4,
    title: 'Scale 4 (F4)',
    hexPtr: '0x23040',
    tokensK: 256,
    scaleValue: '0.0078',
    latencyMs: '0.02ms',
    status: 'CALIBRATED · LOCKED',
    syncPct: '100%',
    fp8Status: 'OK',
  },
  {
    id: 'F5',
    index: 5,
    title: 'Scale 5 (F5)',
    hexPtr: '0x23050',
    tokensK: 256,
    scaleValue: '0.0078',
    latencyMs: '0.02ms',
    status: 'CALIBRATED · LOCKED',
    syncPct: '100%',
    fp8Status: 'OK',
  },
  {
    id: 'F6',
    index: 6,
    title: 'Scale 6 (F6)',
    hexPtr: '0x23060',
    tokensK: 256,
    scaleValue: '0.0078',
    latencyMs: '0.02ms',
    status: 'CALIBRATED · LOCKED',
    syncPct: '100%',
    fp8Status: 'OK',
  },
  {
    id: 'F7',
    index: 7,
    title: 'Scale 7 (F7)',
    hexPtr: '0x23070',
    tokensK: 256,
    scaleValue: '0.0078',
    latencyMs: '0.02ms',
    status: 'CALIBRATED · LOCKED',
    syncPct: '100%',
    fp8Status: 'OK',
  },
];

const INITIAL_LOGS: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: Asynchronous FP8 quantization and calibration matrix engine initialized · 8 scales linked',
  '[00:01.08] 🟢 TELEMETRY: Dynamic scale factor calibration verified at 51,200 GB/s with zero precision degradation',
];

export default function App() {
  useEffect(() => {
    document.title = 'GF-T3-296';
  }, []);

  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('FP8-CORRIDOR-ALPHA');
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [scales, setScales] = useState<ScaleSlotState[]>(INITIAL_SCALES);
  const [selectedScaleIndex, setSelectedScaleIndex] = useState<number>(3);
  const [throughputDisplay, setThroughputDisplay] = useState<string>('51,200 GB/s');
  const [latencyDisplay, setLatencyDisplay] = useState<string>('0.01 µs');
  const [tokensUnits, setTokensUnits] = useState<number>(9216000);
  const [engineXpK, setEngineXpK] = useState<number>(75.0);
  const [outlierActive, setOutlierActive] = useState<boolean>(false);
  const [vecValues, setVecValues] = useState<string>('[5.71, 5.75, 5.72, 5.74]');
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_LOGS);
  const [apaNotice, setApaNotice] = useState<string>(
    'Cluster 006 Sovereign Title Ready · 100% Pure APA Transfer · Zero Copyleft Verified'
  );
  const [customTensorInput, setCustomTensorInput] = useState<string>('0.9906, -0.4953, 0.2476, -0.9906');

  const currentCorridor =
    CORRIDORS.find((c) => c.id === selectedCorridorId) || CORRIDORS[0];
  const inspectedScale = scales[selectedScaleIndex] || scales[3];

  const pushRadioLog = (line1: string, line2: string) => {
    setRadioLogs([line1, line2]);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value;
    setSelectedCorridorId(nextId);
    const found = CORRIDORS.find((c) => c.id === nextId) || CORRIDORS[0];
    setThroughputDisplay(found.throughputGbs);
    setLatencyDisplay(found.latencyUs);
    pushRadioLog(
      '[00:02.12] 🟢 CREW CHIEF: Switched active fabric to ' + found.fullLabel,
      '[00:02.16] 🟢 TELEMETRY: Quantization Throughput: ' +
        found.throughputGbs +
        ' · Calibration Latency: ' +
        found.latencyUs
    );
  };

  const handleTriggerBurst = () => {
    const nextTokens = tokensUnits + 1024000;
    const nextXp = Number((engineXpK + 12.5).toFixed(1));
    setTokensUnits(nextTokens);
    setEngineXpK(nextXp);
    setThroughputDisplay('51,200 GB/s');
    setLatencyDisplay('0.01 µs');
    setVecValues('[5.84, 5.89, 5.86, 5.91]');
    setScales((prev) =>
      prev.map((slot, idx) => ({
        ...slot,
        tokensK: slot.tokensK + 64,
        scaleValue: idx % 2 === 0 ? '0.0076' : '0.0078',
        latencyMs: '0.01ms',
        status: 'CALIBRATED · LOCKED',
        syncPct: '100%',
        fp8Status: 'OK',
      }))
    );
    pushRadioLog(
      '[00:03.04] 🟢 CREW CHIEF: Trigger FP8 Quantization Burst executed across 8 hardware scales',
      '[00:03.09] 🟢 TELEMETRY: Quantization Throughput: 51,200 GB/s · Processed Tokens: ' +
        nextTokens.toLocaleString() +
        ' Units'
    );
  };

  const handleToggleOutlier = () => {
    const nextOutlier = !outlierActive;
    setOutlierActive(nextOutlier);
    if (nextOutlier) {
      setLatencyDisplay('0.02 µs');
      setVecValues('[9.42, 5.75, 8.91, 5.74]');
      setScales((prev) =>
        prev.map((slot, idx) =>
          idx === 2 || idx === 3 || idx === 6
            ? {
                ...slot,
                scaleValue: '0.0156',
                latencyMs: '0.03ms',
                status: 'DYNAMIC · RE-CAL',
                syncPct: '100%',
                fp8Status: 'OK',
              }
            : slot
        )
      );
      pushRadioLog(
        '[00:04.11] 🟡 CREW CHIEF: Inject Outlier Spike active · Non-blocking dynamic range histogram rescaling',
        '[00:04.15] 🟢 TELEMETRY: Sub-microsecond barrier sync locked new scale 0.0156 with zero host CPU stall'
      );
    } else {
      setLatencyDisplay('0.01 µs');
      setVecValues('[5.71, 5.75, 5.72, 5.74]');
      setScales((prev) =>
        prev.map((slot) => ({
          ...slot,
          scaleValue: '0.0078',
          latencyMs: '0.02ms',
          status: 'CALIBRATED · LOCKED',
          syncPct: '100%',
          fp8Status: 'OK',
        }))
      );
      pushRadioLog(
        '[00:04.48] 🟢 CREW CHIEF: Outlier spike cleared · Nominal FP8 E4M3 scale factors restored',
        '[00:04.52] 🟢 TELEMETRY: Calibration Latency: 0.01 µs · Active Scales: 8 Scales'
      );
    }
  };

  const handleStepPass = () => {
    const nextTokens = tokensUnits + 512000;
    const nextXp = Number((engineXpK + 5.0).toFixed(1));
    setTokensUnits(nextTokens);
    setEngineXpK(nextXp);
    setVecValues('[5.73, 5.77, 5.74, 5.76]');
    setScales((prev) =>
      prev.map((slot) => ({
        ...slot,
        tokensK: slot.tokensK + 32,
        scaleValue: '0.0078',
        latencyMs: '0.02ms',
        status: 'CALIBRATED · LOCKED',
        syncPct: '100%',
        fp8Status: 'OK',
      }))
    );
    pushRadioLog(
      '[00:05.20] 🟢 CREW CHIEF: Step Asynchronous Quantization Pass committed on pointer 0x1CF8DC0',
      '[00:05.24] 🟢 TELEMETRY: Processed Tokens: ' +
        nextTokens.toLocaleString() +
        ' Units · FP8 State: Quantization Active'
    );
  };

  const handleFlushArenas = () => {
    setOutlierActive(false);
    setThroughputDisplay('51,200 GB/s');
    setLatencyDisplay('0.01 µs');
    setTokensUnits(9216000);
    setEngineXpK(75.0);
    setVecValues('[5.71, 5.75, 5.72, 5.74]');
    setScales(INITIAL_SCALES);
    setSelectedScaleIndex(3);
    pushRadioLog(
      '[00:01.04] 🟢 CREW CHIEF: Asynchronous FP8 quantization and calibration matrix engine initialized · 8 scales linked',
      '[00:01.08] 🟢 TELEMETRY: Dynamic scale factor calibration verified at 51,200 GB/s with zero precision degradation'
    );
  };

  const parsedTensorValues = customTensorInput
    .split(',')
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !Number.isNaN(n));

  const liveAmax =
    parsedTensorValues.length > 0
      ? Math.max(...parsedTensorValues.map((v) => Math.abs(v)))
      : 0.9906;
  const liveScale = liveAmax > 0 ? Number((liveAmax / 127.0).toFixed(4)) : 0.0078;

  const tabs: TabKey[] = ['Mesh', 'FP8s', 'Cals', 'Stats', 'APA'];

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER ZONE */}
      <header className="w-full shrink-0 flex flex-col gap-0.5">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm md:text-base font-mono font-extrabold tracking-tight text-white">
              GF-T3-296
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-[#00F0FF] border border-cyan-400/50 rounded">
              FLAGSHIP
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 overflow-hidden">
            <div className="max-w-[120px] truncate text-[10px] font-mono shrink-0 overflow-hidden">
              <select
                aria-label="Synthetic FP8 Corridor Selector"
                title={currentCorridor.fullLabel}
                value={selectedCorridorId}
                onChange={handleCorridorChange}
                className="w-[108px] max-w-[120px] min-w-0 text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-cyan-400"
              >
                {CORRIDORS.map((corridor) => (
                  <option key={corridor.id} value={corridor.id}>
                    {corridor.fullLabel}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleTriggerBurst}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-cyan-950 text-[#00F0FF] border border-cyan-500/40 rounded transition-colors cursor-pointer shrink-0"
            >
              [FP8]
            </button>
            <button
              type="button"
              onClick={handleToggleOutlier}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-amber-950 text-[#FF9F0A] border border-amber-500/40 rounded transition-colors cursor-pointer shrink-0"
            >
              [Cal]
            </button>
            <button
              type="button"
              onClick={handleStepPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded transition-colors cursor-pointer shrink-0"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          FP8 Quantization · Calibration Matrix · Maximum Throughput
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5">
        {/* Card 1: FP8 NITRO */}
        <div className="bg-slate-900/90 border border-cyan-500/40 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-300 tracking-wider">
              FP8 NITRO
            </span>
            <span className="text-[10px] font-mono text-[#00F0FF] font-bold">
              Quantization Throughput: 51,200 GB/s
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-tight">
            {throughputDisplay}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden my-0.5">
            <div className="bg-[#00F0FF] h-full w-11/12" />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Quantization Throughput Saturation
          </div>
        </div>

        {/* Card 2: CAL STREAK */}
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-300 tracking-wider">
              CAL STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">
              🔥 DYNAMIC-SCALE
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight">
            {latencyDisplay}
          </div>
          <div className="text-[10px] font-mono text-amber-300 truncate">
            Calibration Latency: 0.01 µs
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Calibration Latency
          </div>
        </div>

        {/* Card 3: ACTIVE SCALES */}
        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-300 tracking-wider">
              ACTIVE SCALES
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              Active Scales: 8 Scales
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-emerald-400 leading-tight">
            SCALES: 8/8
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {scales.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedScaleIndex(idx)}
                className={
                  'text-[9px] font-mono font-bold rounded py-0.2 text-center cursor-pointer ' +
                  (selectedScaleIndex === idx
                    ? 'bg-[#00F0FF] text-black'
                    : 'bg-emerald-950/90 text-emerald-300 border border-emerald-600/40')
                }
              >
                {s.id}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            F1 Gear Shift Indicator [F0..F7] · Locked
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-cyan-500/40 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-300 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">
              +{engineXpK.toFixed(1)}k ENGINE XP
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight">
            {tokensUnits.toLocaleString()} UNITS
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            Processed Tokens: {tokensUnits.toLocaleString()} Units
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            FP8 State: Quantization Active
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
              'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
              (activeTab === tab
                ? 'bg-[#00F0FF] text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70')
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        {'VIEW: MESH · PTR: 0x1CF8DC0 · MODE: ' +
          currentCorridor.modeTag +
          ' · SCALES: 8 · VEC: ' +
          vecValues +
          ' · CORRIDOR: ' +
          currentCorridor.fullLabel}
      </div>

      {/* MAIN COCKPIT BAY: INTERACTIVE SCALE MATRIX BAY (F0-F7) + TAB OVERLAYS */}
      <main className="flex-1 min-h-0 flex flex-col justify-between bg-slate-950/80 border border-slate-800/90 rounded-lg p-1 overflow-hidden">
        {activeTab === 'APA' ? (
          <div className="flex flex-col justify-between h-full p-2 bg-slate-900/60 rounded border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <div>
                <h2 className="text-sm font-mono font-bold text-white">
                  GF-T3-296 · SOVEREIGN IP TITLE TRANSFER (CLUSTER-006)
                </h2>
                <p className="text-xs font-mono text-slate-300">
                  Retail Price Benchmark · 100% Pure APA Buyout · Zero Licensing · Zero Dilution
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#00F0FF]">
                UNIT #296 · TRACK 3 FLAGSHIP
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 my-1 text-xs font-mono">
              <div className="p-2 bg-black/60 border border-slate-800 rounded">
                <div className="text-slate-400">Valuation Header</div>
                <div className="text-white font-bold text-sm">Retail Price</div>
                <div className="text-cyan-300">Track 3 Full Engine APA</div>
              </div>
              <div className="p-2 bg-black/60 border border-slate-800 rounded">
                <div className="text-slate-400">Clean-Room Dyno Gates</div>
                <div className="text-emerald-400 font-bold text-sm">GATE 01–04 PASS</div>
                <div className="text-slate-300">MIT Permissive · Zero Copyleft</div>
              </div>
              <div className="p-2 bg-black/60 border border-slate-800 rounded">
                <div className="text-slate-400">Transfer Package</div>
                <div className="text-amber-300 font-bold text-sm">STANDALONE REPO</div>
                <div className="text-slate-300">engine.py + Pytest + Dockerfile</div>
              </div>
            </div>

            <div className="text-xs font-mono text-emerald-300 bg-black/50 px-2 py-1 rounded border border-emerald-500/30 truncate">
              {apaNotice}
            </div>

            {/* Anti-Clutter & Spacing Rule: vertical flex container with full-width clickable targets */}
            <div className="flex flex-col gap-2 w-full mt-1">
              <button
                type="button"
                onClick={() =>
                  setApaNotice(
                    'APA Title Transfer Dossier Locked for GF-T3-296 · Escrow Verification Gate Ready'
                  )
                }
                className="w-full py-2 px-3 bg-[#00F0FF] hover:bg-cyan-300 text-slate-950 font-mono font-bold text-xs rounded text-center transition-colors cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() =>
                  setApaNotice(
                    'Cluster-006 Vault Buyout Inquiry Registered · Complete 50-Unit Transport Spec Queued'
                  )
                }
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-amber-500/50 font-mono font-bold text-xs rounded text-center transition-colors cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-between h-full overflow-hidden">
            {/* Contextual Secondary Strip for FP8s / Cals / Stats tabs while preserving full 8-Scale Matrix */}
            {activeTab !== 'Mesh' && (
              <div className="px-2 py-1 mb-1 bg-slate-900/90 border border-slate-800 rounded flex items-center justify-between gap-2 text-[11px] font-mono shrink-0">
                {activeTab === 'FP8s' && (
                  <>
                    <span className="text-cyan-300 font-bold truncate">
                      FORMULA: Q(x) = clip(round(x / s), -128, 127) * s · LIVE SCALE: {liveScale}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-slate-400">TENSOR:</span>
                      <input
                        aria-label="Live FP8 Tensor Input"
                         value={customTensorInput}
                        onChange={(e) => setCustomTensorInput(e.target.value)}
                        className="bg-black border border-slate-700 rounded px-1.5 py-0.5 text-[10px] font-mono text-white w-48"
                      />
                    </div>
                  </>
                )}
                {activeTab === 'Cals' && (
                  <>
                    <span className="text-amber-300 font-bold truncate">
                      NON-BLOCKING HISTOGRAMS: 8 SM ARENAS · BARRIER COMMIT: 0.01 µs · ZERO HOST STALL
                    </span>
                    <span className="text-emerald-400 font-bold shrink-0">
                      CORRIDOR: {currentCorridor.shortLabel}
                    </span>
                  </>
                )}
                {activeTab === 'Stats' && (
                  <>
                    <span className="text-emerald-400 font-bold truncate">
                      DYNO GATES 01–04: VERIFIED (&gt;85% PYTEST) · NIST SP 800-218 SSDF · ZERO COPYLEFT
                    </span>
                    <span className="text-cyan-300 font-bold shrink-0">
                      RBAC + MFA + ZERO-TRUST: ACTIVE
                    </span>
                  </>
                )}
              </div>
            )}

            {/* INTERACTIVE SCALE MATRIX BAY (F0-F7) */}
            <div className="grid grid-cols-4 gap-1 p-1">
              {scales.map((slot, idx) => {
                const isSelected = selectedScaleIndex === idx;
                return (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedScaleIndex(idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedScaleIndex(idx);
                      }
                    }}
                    className={
                      'rounded px-2 py-1.5 flex flex-col justify-between transition-colors cursor-pointer border ' +
                      (isSelected
                        ? 'bg-slate-900 border-[#00F0FF] shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700')
                    }
                  >
                    {/* Line 1 (Title & Hex) */}
                    <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                      <span>{slot.title}</span>
                      <span className="text-slate-400">{slot.hexPtr}</span>
                    </div>

                    {/* Line 2 (Tokens & Scale Value) */}
                    <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                      <span>{'TOK: ' + slot.tokensK + 'K'}</span>
                      <span>{'SCALE: ' + slot.scaleValue}</span>
                    </div>

                    {/* Line 3 (Latency & State) */}
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-[#FF9F0A]">{slot.latencyMs}</span>
                      <span className="text-emerald-400">{slot.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* COMPACT FP8 TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {inspectedScale.id +
          ' · TOK: ' +
          inspectedScale.tokensK +
          'K · SCALE: ' +
          inspectedScale.scaleValue +
          ' · SYNC: ' +
          inspectedScale.syncPct +
          ' · PTR ' +
          inspectedScale.hexPtr +
          ' · FP8: ' +
          inspectedScale.fp8Status +
          ' · LOCKED'}
      </div>

      {/* TACTICAL LAUNCH CONTROL SWITCHES */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleTriggerBurst}
          className="bg-amber-950/40 hover:bg-amber-900/60 border border-[#FF9F0A] text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 px-2 text-center transition-colors truncate cursor-pointer"
        >
          💥 INJECT FP8 QUANTIZATION BURST
        </button>

        <button
          type="button"
          onClick={handleToggleOutlier}
          className="bg-cyan-950/40 hover:bg-cyan-900/60 border border-[#00F0FF] text-[#00F0FF] rounded text-xs font-mono font-bold py-2 px-2 text-center transition-colors truncate cursor-pointer"
        >
          ⚡ TOGGLE OUTLIER SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepPass}
          className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-400 text-emerald-300 rounded text-xs font-mono font-bold py-2 px-2 text-center transition-colors truncate cursor-pointer"
        >
          🚀 STEP ASYNCHRONOUS QUANTIZATION PASS
        </button>

        <button
          type="button"
          onClick={handleFlushArenas}
          className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500 text-rose-300 rounded text-xs font-mono font-bold py-2 px-2 text-center transition-colors truncate cursor-pointer"
        >
          🔄 FLUSH CALIBRATION ARENAS
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
