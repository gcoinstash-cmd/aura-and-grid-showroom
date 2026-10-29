/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  buildInitialEngineSnapshot,
  CORRIDOR_PROFILES,
  CorridorId,
  EngineTelemetrySnapshot,
  stepEngineQuantizationPass,
  toggleOutlierMagnitudeSpike,
} from './lib/fp8Engine';
import { SUPABASE_SQL_SCHEMA } from './lib/supabaseSchema';

type CockpitTab = 'Mesh' | 'FP8' | 'Clib' | 'Stats' | 'APA';

interface RadioLogEntry {
  timestamp: string;
  icon: string;
  callsign: string;
  message: string;
}

const INITIAL_LOGS: RadioLogEntry[] = [
  {
    timestamp: '00:01.04',
    icon: '🟢',
    callsign: 'CREW CHIEF',
    message:
      'Dynamic quantization calibration and FP8 weight-activation engine initialized · 8 matrices linked',
  },
  {
    timestamp: '00:01.08',
    icon: '🟢',
    callsign: 'TELEMETRY',
    message:
      'FP8 tensor core acceleration verified at 40,000 GB/s with zero accuracy degradation',
  },
];

export default function App() {
  const [snapshot, setSnapshot] = useState<EngineTelemetrySnapshot>(() =>
    buildInitialEngineSnapshot(CorridorId.ALPHA)
  );
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [radioLogs, setRadioLogs] = useState<RadioLogEntry[]>(INITIAL_LOGS);
  const [tickCounter, setTickCounter] = useState<number>(12);
  const [schemaModalOpen, setSchemaModalOpen] = useState<boolean>(false);
  const [apaNotice, setApaNotice] = useState<string | null>(null);

  const appendRadioLog = (icon: string, callsign: string, message: string) => {
    setTickCounter((prev) => {
      const next = prev + 4;
      const secs = Math.floor(next / 100) + 1;
      const hundredths = next % 100;
      const minStr = '00';
      const secStr = secs < 10 ? '0' + String(secs) : String(secs);
      const hunStr = hundredths < 10 ? '0' + String(hundredths) : String(hundredths);
      const ts = minStr + ':' + secStr + '.' + hunStr;

      setRadioLogs((oldLogs) => [
        oldLogs[oldLogs.length - 1],
        { timestamp: ts, icon, callsign, message },
      ]);
      return next;
    });
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCorridor = e.target.value as CorridorId;
    const nextSnap = buildInitialEngineSnapshot(nextCorridor);
    setSnapshot(nextSnap);
    appendRadioLog(
      '⚡',
      'PIT WALL',
      'Corridor switched to ' +
        CORRIDOR_PROFILES[nextCorridor].fullLabel +
        ' · Scale factors synchronized'
    );
  };

  const handleInjectBurst = () => {
    setSnapshot((prev) => {
      const next = stepEngineQuantizationPass(prev, 'BURST');
      return next;
    });
    appendRadioLog(
      '🟢',
      'TELEMETRY',
      'FP8 Quantization Burst executed · +512,000 Tokens processed across 8 streaming multiprocessor arenas'
    );
  };

  const handleToggleSpike = () => {
    setSnapshot((prev) => {
      const next = toggleOutlierMagnitudeSpike(prev);
      if (next.outlierSpikeActive) {
        appendRadioLog(
          '🔴',
          'TELEMETRY',
          'Outlier magnitude spike injected on M2 & M5 (AMAX 79.38) · Scale factor re-calibration required'
        );
      } else {
        appendRadioLog(
          '🟢',
          'CREW CHIEF',
          'Outlier spike cleared · Per-tensor and per-token scale factors restored to 100% lock'
        );
      }
      return next;
    });
  };

  const handleStepPass = () => {
    setSnapshot((prev) => stepEngineQuantizationPass(prev, 'STEP'));
    appendRadioLog(
      '⚡',
      'PIT WALL',
      'Stepped FP8 weight-activation pass · Sub-microsecond scale buffer rotation verified at 0.01 µs'
    );
  };

  const handleCalibratePass = () => {
    setSnapshot((prev) => stepEngineQuantizationPass(prev, 'CALIBRATE'));
    appendRadioLog(
      '🟢',
      'CREW CHIEF',
      'Dynamic calibration pass complete · All 8 matrices locked to ' +
        snapshot.corridor.precisionFormat +
        ' zero-loss grid'
    );
  };

  const handleFlushArenas = () => {
    const fresh = buildInitialEngineSnapshot(snapshot.corridor.id);
    setSnapshot(fresh);
    setRadioLogs(INITIAL_LOGS);
    setApaNotice(null);
    appendRadioLog(
      '🟢',
      'CREW CHIEF',
      'Quantization arenas flushed and scale buffers re-zeroed to baseline pointers 0x10000..0x10070'
    );
  };

  const handleExportAudit = () => {
    const auditPayload = {
      engine: 'GF-T3-282',
      corridor: snapshot.corridor.fullLabel,
      quantThroughput: String(snapshot.quantThroughputGbs.toLocaleString()) + ' GB/s',
      calibrationLatency: String(snapshot.calibrationLatencyUs) + ' µs',
      activeMatrices: String(snapshot.activeMatricesCount) + ' Matrices',
      processedTokens: String(snapshot.processedTokensUnits.toLocaleString()) + ' Units',
      fp8State: snapshot.fp8StateLabel,
      matrices: snapshot.matrices,
    };
    const blob = new Blob([JSON.stringify(auditPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GF-T3-282-FP8-AUDIT.json';
    a.click();
    URL.revokeObjectURL(url);
    appendRadioLog(
      '⚡',
      'PIT WALL',
      'Cryptographic FP8 telemetry & scale calibration audit manifest exported (GF-T3-282-FP8-AUDIT.json)'
    );
  };

  const inspectedMatrix =
    snapshot.matrices[snapshot.selectedMatrixIndex] || snapshot.matrices[3];

  const vStr =
    '[' +
    snapshot.meshVector.map((v) => v.toFixed(2)).join(', ') +
    ']';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER ROW 1 */}
      <header className="flex items-center justify-between gap-1 w-full shrink-0 border-b border-slate-800/90 pb-1">
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <h1 className="text-sm md:text-base font-mono font-extrabold tracking-tight text-white">
            GF-T3-282
          </h1>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/15 text-[#00F0FF] border border-cyan-400/50 rounded">
            FLAGSHIP
          </span>
          <span className="hidden sm:inline text-[10px] font-mono text-slate-400">
            TRACK 3 SKUNKWORKS
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <select
            aria-label="Select Synthetic FP8 Quantization Corridor"
            value={snapshot.corridor.id}
            onChange={handleCorridorChange}
            className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded focus:outline-none focus:border-cyan-400"
          >
            {Object.values(CORRIDOR_PROFILES).map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullLabel}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setActiveTab('FP8');
              handleStepPass();
            }}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-[#00F0FF] border border-cyan-500/50 rounded transition-colors cursor-pointer"
          >
            [FP8]
          </button>
          <button
            type="button"
            onClick={handleCalibratePass}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-[#FF9F0A] border border-amber-500/50 rounded transition-colors cursor-pointer"
          >
            [Calib]
          </button>
          <button
            type="button"
            onClick={handleInjectBurst}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-[#10B981] border border-emerald-500/50 rounded transition-colors cursor-pointer"
          >
            [Run]
          </button>
          <button
            type="button"
            onClick={() => setSchemaModalOpen((v) => !v)}
            className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer"
          >
            [Inspect Schema]
          </button>
          <button
            type="button"
            onClick={handleFlushArenas}
            className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded transition-colors cursor-pointer"
          >
            [Reset]
          </button>
        </div>
      </header>

      {/* TOP HEADER ROW 2: SUBTITLE */}
      <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap shrink-0 py-0.5">
        FP8 Quantization · Dynamic Calibration · Zero Loss
      </div>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0">
        {/* Card 1: FP8 NITRO */}
        <div className="bg-slate-900/90 border border-cyan-500/40 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              FP8 NITRO
            </span>
            <span className="text-[10px] font-mono font-bold text-[#00F0FF]">
              {snapshot.throughputSaturationPct}% BUS
            </span>
          </div>
          <div className="text-lg font-mono font-bold text-[#00F0FF] leading-tight">
            {snapshot.quantThroughputGbs.toLocaleString()} GB/s
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-all duration-150"
              style={{ width: String(snapshot.throughputSaturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Quant Throughput Saturation
          </div>
        </div>

        {/* Card 2: CALIB STREAK */}
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              CALIB STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A] bg-amber-500/10 px-1 rounded border border-amber-500/30">
              🔥 {snapshot.corridor.precisionFormat}
            </span>
          </div>
          <div className="text-lg font-mono font-bold text-[#FF9F0A] leading-tight">
            {snapshot.calibrationLatencyUs.toFixed(2)} µs
          </div>
          <div className="text-[10px] font-mono text-emerald-400">
            Zero-Stall SM Sync · Rot #{snapshot.rotationCount}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Calibration Latency
          </div>
        </div>

        {/* Card 3: ACTIVE MATRICES */}
        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              ACTIVE MATRICES
            </span>
            <span className="text-[10px] font-mono font-bold text-[#10B981]">
              {snapshot.activeMatricesCount} Matrices
            </span>
          </div>
          <div className="text-lg font-mono font-bold text-white leading-tight">
            MATRICES: {snapshot.activeMatricesCount}/{snapshot.totalMatricesCount}
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {snapshot.matrices.map((m) => (
              <button
                key={m.index}
                type="button"
                onClick={() =>
                  setSnapshot((prev) => ({ ...prev, selectedMatrixIndex: m.index }))
                }
                className={
                  'text-[9px] font-mono font-bold rounded text-center py-0.2 cursor-pointer border ' +
                  (m.isFault
                    ? 'bg-red-500/30 border-red-500 text-red-200'
                    : snapshot.selectedMatrixIndex === m.index
                    ? 'bg-cyan-500/30 border-cyan-400 text-white'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300')
                }
              >
                M{m.index}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            F1 Gear Shift Indicator [M0..M7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-[#10B981]">
              +{snapshot.engineXpK.toFixed(1)}k ENGINE XP
            </span>
          </div>
          <div className="text-lg font-mono font-bold text-white leading-tight">
            {snapshot.processedTokensUnits.toLocaleString()} UNITS
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            Processed Tokens: {snapshot.processedTokensUnits.toLocaleString()} Units
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            {snapshot.fp8StateLabel}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {(['Mesh', 'FP8', 'Clib', 'Stats', 'APA'] as CockpitTab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
                (isActive
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER (STRICTLY CLEAN OF ACTION BUTTONS) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 bg-slate-950/90 border border-slate-800/80 rounded px-2 py-0.5 shrink-0">
        VIEW: MESH · PTR: {snapshot.meshPtrHex} · MODE: {snapshot.meshMode} · MATRICES:{' '}
        {snapshot.totalMatricesCount} · VEC: {vStr} · CORRIDOR: {snapshot.corridor.id}
      </div>

      {/* MAIN INTERACTIVE SIMULATION BAY (4x2 MATRIX BAY + TAB OVERLAYS) */}
      <main className="flex-1 min-h-0 flex flex-col justify-center overflow-hidden my-0.5">
        {schemaModalOpen ? (
          <div className="h-full bg-slate-950 border border-cyan-500/50 rounded-lg p-2 flex flex-col justify-between overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-800 pb-1">
              <span className="text-xs font-mono font-bold text-[#00F0FF]">
                POSTGRESQL / SUPABASE PARTITIONED SCHEMA & ZERO-TRUST RLS
              </span>
              <button
                type="button"
                onClick={() => setSchemaModalOpen(false)}
                className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-white rounded border border-slate-600 cursor-pointer"
              >
                [CLOSE SCHEMA]
              </button>
            </div>
            <pre className="text-[10px] font-mono text-slate-300 overflow-y-auto flex-1 my-1 leading-tight select-all">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        ) : activeTab === 'Mesh' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1 h-full items-stretch">
            {snapshot.matrices.map((m) => {
              const isSelected = snapshot.selectedMatrixIndex === m.index;
              return (
                <div
                  key={m.index}
                  onClick={() =>
                    setSnapshot((prev) => ({
                      ...prev,
                      selectedMatrixIndex: m.index,
                      meshVector: m.vectorSample,
                    }))
                  }
                  className={
                    'py-0 px-1.5 rounded border flex flex-col justify-evenly cursor-pointer transition-colors ' +
                    (m.isFault
                      ? 'bg-red-950/40 border-[#EF4444]'
                      : isSelected
                      ? 'bg-slate-900 border-[#00F0FF]'
                      : 'bg-slate-900/75 border-slate-800 hover:border-slate-600')
                  }
                >
                  {/* Line 1: Title & Hex */}
                  <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                    <span>{m.idLabel}</span>
                    <span className="text-slate-400">{m.ptrHex}</span>
                  </div>

                  {/* Line 2: Tokens & Precision */}
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                    <span>TOK: {m.tokensK}K</span>
                    <span>PREC: {m.precision}</span>
                  </div>

                  {/* Line 3: Latency & State */}
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-[#FF9F0A] font-bold">
                      {m.latencyMs.toFixed(2)}ms
                    </span>
                    <span
                      className={
                        m.isFault
                          ? 'text-[#EF4444] font-bold'
                          : 'text-[#10B981] font-bold'
                      }
                    >
                      {m.stateLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : activeTab === 'FP8' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 p-1 h-full items-stretch">
            <div className="bg-slate-900/90 border border-slate-800 rounded p-2 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-[#00F0FF]">
                  DYNAMIC FP8 WEIGHT-ACTIVATION EQUATION
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  CLIP BOUND: [-{snapshot.corridor.clipMax}, {snapshot.corridor.clipMax}]
                </span>
              </div>
              <div className="bg-black/80 border border-slate-800 rounded px-2 py-1.5 font-mono text-xs text-amber-300 font-bold text-center">
                W_fp8 = Clip(round(W · s^-1), -{snapshot.corridor.clipMax},{' '}
                {snapshot.corridor.clipMax}) · s
              </div>
              <div className="grid grid-cols-3 gap-1 text-[11px] font-mono">
                <div className="bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">AMAX:</span>
                  <span className="text-white font-bold">{inspectedMatrix.amax}</span>
                </div>
                <div className="bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">SCALE s:</span>
                  <span className="text-cyan-300 font-bold">
                    {inspectedMatrix.scaleFactor.toFixed(5)}
                  </span>
                </div>
                <div className="bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">INV s^-1:</span>
                  <span className="text-emerald-400 font-bold">
                    {inspectedMatrix.inverseScale.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>Granularity: {snapshot.corridor.granularity}</span>
                <span>SQNR: {inspectedMatrix.sqnrDb} dB</span>
                <span>MSE: {inspectedMatrix.mse.toExponential(2)}</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded p-2 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-white">
                  SYNTHETIC CORRIDOR ROUTER
                </span>
                <span className="text-[10px] font-mono text-cyan-300">
                  ZERO PROPRIETARY MARKS
                </span>
              </div>
              <div className="space-y-1">
                {Object.values(CORRIDOR_PROFILES).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSnapshot(buildInitialEngineSnapshot(c.id))}
                    className={
                      'w-full text-left px-2 py-1 rounded text-[10px] font-mono flex justify-between items-center border cursor-pointer ' +
                      (snapshot.corridor.id === c.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200')
                    }
                  >
                    <span className="truncate pr-2">{c.fullLabel}</span>
                    <span className="shrink-0 text-cyan-300">
                      {c.nominalBandwidthGbs} GB/s
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'Clib' ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded p-2 h-full flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-[#FF9F0A]">
                HARDWARE-ACCELERATED SCALE FACTOR SYNCHRONIZATION & ARENA ROTATION
              </span>
              <button
                type="button"
                onClick={() => setSchemaModalOpen(true)}
                className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-[#00F0FF] border border-cyan-500/40 rounded cursor-pointer"
              >
                VIEW POSTGRESQL RLS SCHEMA
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
              {snapshot.matrices.map((m) => (
                <div
                  key={m.index}
                  className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center font-bold text-white">
                    <span>M{m.index}</span>
                    <span className="text-cyan-300">{m.ptrHex}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>s^-1: {m.inverseScale.toFixed(1)}</span>
                    <span>SQNR: {m.sqnrDb}dB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-400">ROT #{m.bufferRotationGeneration}</span>
                    <span className={m.isFault ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {m.scalePercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'Stats' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 p-1 h-full items-stretch font-mono">
            <div className="bg-slate-900/90 border border-slate-800 rounded p-2 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold">
                BANDWIDTH MULTIPLIER
              </span>
              <span className="text-xl font-bold text-[#00F0FF]">2.00x FP16</span>
              <span className="text-[10px] text-emerald-400">
                8-Bit Weight + 8-Bit Activation
              </span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded p-2 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold">
                MEAN SQUARED ERROR
              </span>
              <span className="text-xl font-bold text-white">
                {inspectedMatrix.mse.toExponential(3)}
              </span>
              <span className="text-[10px] text-cyan-300">
                SQNR Fidelity: {inspectedMatrix.sqnrDb} dB
              </span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded p-2 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold">
                BUFFER ROTATION CADENCE
              </span>
              <span className="text-xl font-bold text-[#FF9F0A]">0.01 µs</span>
              <span className="text-[10px] text-slate-300">
                Pass #{snapshot.rotationCount} · Zero CPU Sync
              </span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded p-2 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold">
                SECURITY & LICENSING
              </span>
              <span className="text-xl font-bold text-[#10B981]">100% MIT</span>
              <span className="text-[10px] text-slate-300">
                Zod GridSync + Supabase RLS
              </span>
            </div>
          </div>
        ) : (
          /* APA TAB: EXCLUSIVE HOME FOR COMMERCIAL BUYOUT ACTIONS */
          <div className="bg-slate-900/95 border border-cyan-500/50 rounded-lg p-2 h-full flex flex-col justify-between font-mono">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-white">
                  GF-T3-282 · SOVEREIGN ASSET PURCHASE AGREEMENT (APA) TRANSFER VAULT
                </div>
                <div className="text-[10px] text-slate-300">
                  100% Clean-Room MIT/Apache-2.0 IP · Standalone FastAPI + React + PostgreSQL RLS + Pytest/Vitest Suite
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-[#10B981] border border-emerald-500/40 rounded">
                APA TITLE VERIFIED
              </span>
            </div>

            {apaNotice && (
              <div className="text-[11px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 rounded px-2 py-1">
                {apaNotice}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setApaNotice(
                      'APA Title Acquisition Dossier generated · Full standalone repository package locked for transfer.'
                    );
                    handleExportAudit();
                  }}
                  className="px-3 py-1.5 text-xs font-mono font-bold bg-[#00F0FF] text-slate-950 rounded hover:bg-cyan-300 transition-colors cursor-pointer"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApaNotice(
                      'Vault Buyout Inquiry dispatched to Dealership Principal Garrett · Clean-Room IP attestation attached.'
                    );
                    appendRadioLog(
                      '🟢',
                      'CREW CHIEF',
                      'APA Vault Buyout inquiry logged · Clean-room provenance and NIST SP 800-218 SSDF manifest ready'
                    );
                  }}
                  className="px-3 py-1.5 text-xs font-mono font-bold bg-amber-500/20 text-[#FF9F0A] border border-amber-500/60 rounded hover:bg-amber-500/30 transition-colors cursor-pointer"
                >
                  INQUIRE VAULT BUYOUT
                </button>
              </div>

              <button
                type="button"
                onClick={handleExportAudit}
                className="px-2.5 py-1 text-[11px] font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700 rounded hover:bg-slate-700 cursor-pointer"
              >
                EXPORT AUDIT MANIFEST
              </button>
            </div>
          </div>
        )}
      </main>

      {/* COMPACT FP8 TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0 flex justify-between items-center">
        <span>
          M{inspectedMatrix.index} · TOK: {inspectedMatrix.tokensK}K · PREC:{' '}
          {inspectedMatrix.precision} · SCALE: {inspectedMatrix.scalePercent}% · PTR{' '}
          {inspectedMatrix.ptrHex} · QUANT:{' '}
          {inspectedMatrix.isFault ? 'FAULT · SPIKE' : 'OK · LOCKED'}
        </span>
        <span className="hidden md:inline text-[10px] text-slate-400">
          SQNR: {inspectedMatrix.sqnrDb} dB · AMAX: {inspectedMatrix.amax}
        </span>
      </div>

      {/* TACTICAL LAUNCH CONTROL SWITCHES */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleInjectBurst}
          className="bg-amber-500/15 hover:bg-amber-500/25 border border-[#FF9F0A] text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          💥 INJECT FP8 QUANTIZATION BURST
        </button>

        <button
          type="button"
          onClick={handleToggleSpike}
          className="bg-cyan-500/15 hover:bg-cyan-500/25 border border-[#00F0FF] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          ⚡ TOGGLE OUTLIER MAGNITUDE SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepPass}
          className="bg-emerald-500/15 hover:bg-emerald-500/25 border border-[#10B981] text-[#10B981] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          🚀 STEP FP8 ACTIVATION PASS
        </button>

        <button
          type="button"
          onClick={handleFlushArenas}
          className="bg-rose-500/15 hover:bg-rose-500/25 border border-[#EF4444] text-rose-300 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          🔄 FLUSH QUANTIZATION ARENAS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center">
        {radioLogs.slice(-2).map((entry, idx) => (
          <div key={idx} className="truncate">
            [{entry.timestamp}] {entry.icon} {entry.callsign}: {entry.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
