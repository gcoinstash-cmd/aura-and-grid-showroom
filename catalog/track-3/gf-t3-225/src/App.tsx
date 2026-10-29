/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-225 — Institutional Gamified FP8 Mixed-Precision GEMM & Microscaling Cockpit
 * Zero-Dollar Gate Enforced · 100% Clean-Room Synthetic FP8 Corridors
 */

import React, { useMemo, useState } from 'react';
import {
  CorridorId,
  E4M3_MAX_VAL,
  E5M2_MAX_VAL,
  MatrixTileTelemetry,
  PrecisionFormat,
  SYNTHETIC_CORRIDORS,
  ScalingMode,
  executeFp8GemmPass,
  sanitizeAndValidateGemmInput,
} from './lib/fp8Engine';
import { APA_TRANSFER_HIGHLIGHTS, SUPABASE_POSTGRES_SCHEMA_SQL } from './lib/schemaAndSpecs';

type CockpitTab = 'Mesh' | 'Matrix' | 'Scales' | 'Outliers' | 'Transfer';

interface SelectedTileCoord {
  operand: 'A' | 'B';
  row: number;
  col: number;
}

export default function App() {
  const [corridor, setCorridor] = useState<CorridorId>(SYNTHETIC_CORRIDORS[0]);
  const [formatA, setFormatA] = useState<PrecisionFormat>(PrecisionFormat.E4M3);
  const [formatB, setFormatB] = useState<PrecisionFormat>(PrecisionFormat.E4M3);
  const [activeShiftFormat, setActiveShiftFormat] = useState<PrecisionFormat>(PrecisionFormat.E4M3);
  const [scalingMode, setScalingMode] = useState<ScalingMode>(ScalingMode.DYNAMIC_BLOCK);
  const [outlierSpikeActive, setOutlierSpikeActive] = useState<boolean>(false);
  const [outlierClipThreshold, setOutlierClipThreshold] = useState<number | null>(45.0);
  const [stepIndex, setStepIndex] = useState<number>(1);
  const [passesStreak, setPassesStreak] = useState<number>(64);
  const [activeTab, setActiveTab] = useState<CockpitTab>('Matrix');
  const [selectedTile, setSelectedTile] = useState<SelectedTileCoord>({
    operand: 'A',
    row: 0,
    col: 2,
  });
  const [showSchemaModal, setShowSchemaModal] = useState<boolean>(false);
  const [apaModalState, setApaModalState] = useState<null | 'ACQUIRE' | 'VAULT'>(null);
  const [securityInputTest, setSecurityInputTest] = useState<string>(
    'VERIFY_FP8_TENSOR_BLOCK_PARITY'
  );
  const [securityGateStatus, setSecurityGateStatus] = useState<{
    valid: boolean;
    message: string;
  }>({
    valid: true,
    message: '✓ LOCKED · GridSync Zero-Trust Ingress Verified',
  });

  const [radioLogs, setRadioLogs] = useState<string[]>([
    '[00:01.04] 🟢 CREW CHIEF: FP8 GEMM pipeline engaged · E4M3 dynamic scales locked',
    '[00:01.08] ⚡ PIT WALL: Matrix multiply complete · FP32 accumulation verified',
    '[00:01.12] 🟢 TELEMETRY: Dequantization epilogue clean · Zero underflow detected',
  ]);

  const appendRadioLog = (callsign: string, msg: string) => {
    const totalSec = 1.12 + stepIndex * 0.04 + passesStreak * 0.01;
    const mins = Math.floor(totalSec / 60);
    const secs = (totalSec % 60).toFixed(2);
    const minStr = mins < 10 ? '0' + String(mins) : String(mins);
    const secStr = Number(secs) < 10 ? '0' + String(secs) : String(secs);
    const line = '[' + minStr + ':' + secStr + '] ' + callsign + ': ' + msg;
    setRadioLogs((prev) => [line, prev[0], prev[1]].slice(0, 3));
  };

  const gemmResult = useMemo(() => {
    return executeFp8GemmPass({
      corridor,
      formatA,
      formatB,
      scalingMode,
      outlierClipThreshold,
      outlierSpikeActive,
      stepIndex,
    });
  }, [corridor, formatA, formatB, scalingMode, outlierClipThreshold, outlierSpikeActive, stepIndex]);

  const inspectedTile: MatrixTileTelemetry = useMemo(() => {
    const grid = selectedTile.operand === 'A' ? gemmResult.tilesA : gemmResult.tilesB;
    return grid[selectedTile.row]?.[selectedTile.col] ?? gemmResult.tilesA[0][0];
  }, [gemmResult, selectedTile]);

  const handleCorridorChange = (nextCorridor: CorridorId) => {
    setCorridor(nextCorridor);
    if (nextCorridor === SYNTHETIC_CORRIDORS[0]) {
      setFormatA(PrecisionFormat.E4M3);
      setFormatB(PrecisionFormat.E4M3);
      setActiveShiftFormat(PrecisionFormat.E4M3);
      setScalingMode(ScalingMode.DYNAMIC_BLOCK);
    } else if (nextCorridor === SYNTHETIC_CORRIDORS[1]) {
      setFormatA(PrecisionFormat.E5M2);
      setFormatB(PrecisionFormat.E5M2);
      setActiveShiftFormat(PrecisionFormat.E5M2);
      setScalingMode(ScalingMode.DYNAMIC_BLOCK);
    } else if (nextCorridor === SYNTHETIC_CORRIDORS[2]) {
      setFormatA(PrecisionFormat.E4M3);
      setFormatB(PrecisionFormat.E5M2);
      setActiveShiftFormat(PrecisionFormat.E4M3);
      setScalingMode(ScalingMode.DYNAMIC_BLOCK);
    } else {
      setFormatA(PrecisionFormat.E4M3);
      setFormatB(PrecisionFormat.E4M3);
      setActiveShiftFormat(PrecisionFormat.E4M3);
      setScalingMode(ScalingMode.STATIC_TENSOR);
    }
    appendRadioLog('🟢 CREW CHIEF', 'Corridor switched -> ' + nextCorridor.split(' ')[0]);
  };

  const handleFormatShift = (fmt: PrecisionFormat) => {
    setActiveShiftFormat(fmt);
    if (fmt === PrecisionFormat.E4M3 || fmt === PrecisionFormat.E5M2) {
      setFormatA(fmt);
      setFormatB(fmt);
      appendRadioLog(
        '⚡ PIT WALL',
        'Precision gearbox shifted to ' + fmt + ' · FP32 accumulator locked'
      );
    } else {
      appendRadioLog(
        '🟢 TELEMETRY',
        'Reference ' + fmt + ' comparison baseline engaged · W8A8 core active'
      );
    }
  };

  // Launch Control Button 1: Inject Outlier Spike
  const handleInjectOutlierSpike = () => {
    const nextSpike = !outlierSpikeActive;
    setOutlierSpikeActive(nextSpike);
    setSelectedTile({ operand: 'A', row: 0, col: 2 });
    if (nextSpike) {
      appendRadioLog(
        '🔴 TELEMETRY',
        'Outlier activation spike injected (10x Max Range = 184.8) at Tile A[0,2]'
      );
    } else {
      appendRadioLog(
        '🟢 CREW CHIEF',
        'Outlier activation spike cleared · Nominal harmonic distribution restored'
      );
    }
  };

  // Launch Control Button 2: Toggle Block Scaling
  const handleToggleBlockScaling = () => {
    const nextMode =
      scalingMode === ScalingMode.DYNAMIC_BLOCK
        ? ScalingMode.STATIC_TENSOR
        : ScalingMode.DYNAMIC_BLOCK;
    setScalingMode(nextMode);
    appendRadioLog(
      '⚡ PIT WALL',
      'Scaling mode switched to ' +
        nextMode +
        ' · Microscaling factors recalculated'
    );
  };

  // Launch Control Button 3: Step FP8 GEMM Pass
  const handleStepGemmPass = () => {
    setStepIndex((prev) => prev + 1);
    setPassesStreak((prev) => prev + 1);
    appendRadioLog(
      '⚡ PIT WALL',
      'Stepped 4096x4096 FP8 GEMM pass #' +
        String(passesStreak + 1) +
        ' · SNR Parity ' +
        String(gemmResult.telemetry.snrParityPct) +
        '% verified'
    );
  };

  // Launch Control Button 4: Reset Scales & Buffers
  const handleResetScalesAndBuffers = () => {
    setCorridor(SYNTHETIC_CORRIDORS[0]);
    setFormatA(PrecisionFormat.E4M3);
    setFormatB(PrecisionFormat.E4M3);
    setActiveShiftFormat(PrecisionFormat.E4M3);
    setScalingMode(ScalingMode.DYNAMIC_BLOCK);
    setOutlierSpikeActive(false);
    setOutlierClipThreshold(45.0);
    setStepIndex(1);
    setPassesStreak(64);
    setSelectedTile({ operand: 'A', row: 0, col: 2 });
    setRadioLogs([
      '[00:01.04] 🟢 CREW CHIEF: FP8 GEMM pipeline engaged · E4M3 dynamic scales locked',
      '[00:01.08] ⚡ PIT WALL: Matrix multiply complete · FP32 accumulation verified',
      '[00:01.12] 🟢 TELEMETRY: Dequantization epilogue clean · Zero underflow detected',
    ]);
  };

  // Export Audit JSON Handler (Strictly invoked from Transfer tab or APA modal)
  const handleExportAuditJson = () => {
    const payload = {
      engine: 'GF-T3-225',
      corridor: gemmResult.corridor,
      scalingMode: gemmResult.scalingMode,
      formatA: gemmResult.formatA,
      formatB: gemmResult.formatB,
      telemetry: {
        tensorCoreCompute: String(gemmResult.telemetry.computeTflops) + ' TFLOPS',
        gemmLatency: String(gemmResult.telemetry.gemmLatencyMs) + ' ms',
        snrParity: String(gemmResult.telemetry.snrParityPct) + '%',
        dequantOverhead: String(gemmResult.telemetry.dequantOverheadMs) + ' ms',
        processedElements: String(gemmResult.telemetry.processedUnits) + ' Units',
        memoryReductionVsBf16: String(gemmResult.telemetry.memoryReductionPct) + '%',
      },
      scalesA: gemmResult.scalesA,
      scalesB: gemmResult.scalesB,
      dequantizedOutputMatrix: gemmResult.dequantizedOutputMatrix,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GF-T3-225-AUDIT-TELEMETRY.json';
    a.click();
    URL.revokeObjectURL(url);
    appendRadioLog('🟢 TELEMETRY', 'Exported clean-room APA audit telemetry package');
  };

  const handleValidateSecurityNote = (noteValue: string) => {
    setSecurityInputTest(noteValue);
    try {
      sanitizeAndValidateGemmInput({
        corridor,
        formatA,
        formatB,
        scalingMode,
        outlierClipThreshold,
        matrixA: [
          [1, 2],
          [3, 4],
        ],
        matrixB: [
          [1, 2],
          [3, 4],
        ],
        operatorNote: noteValue,
      });
      setSecurityGateStatus({
        valid: true,
        message: '✓ LOCKED · Payload Scrubbed & Validated by GridSync Zod Gate',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '⚡ FAULT · Invalid payload blocked';
      setSecurityGateStatus({
        valid: false,
        message: '⚡ FAULT · ' + msg,
      });
      appendRadioLog('🔴 TELEMETRY', 'Zero-Trust Ingress blocked hostile payload token');
    }
  };

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP COMMAND DECK — ROW 1 & ROW 2 */}
      <header className="w-full shrink-0 border-b border-slate-800/90 pb-0.5">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Strictly GF-T3-225 + Cyan Track Badge */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <span
              className={
                'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider border ' +
                (outlierSpikeActive && scalingMode === ScalingMode.STATIC_TENSOR
                  ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/50'
                  : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40')
              }
            >
              {outlierSpikeActive && scalingMode === ScalingMode.STATIC_TENSOR
                ? '⚡ FAULT'
                : '✓ LOCKED'}
            </span>
            <h1 className="text-base font-extrabold tracking-tight text-white font-mono">
              GF-T3-225
            </h1>
            <span className="px-1.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 rounded">
              TRACK 3
            </span>
          </div>

          {/* Right: Compact corridor dropdown + micro action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic FP8 Corridor Selector"
              value={corridor}
              onChange={(e) => handleCorridorChange(e.target.value as CorridorId)}
              className="max-w-[140px] truncate text-[10px] font-mono bg-slate-900 text-[#00F0FF] border border-slate-700 rounded px-1.5 py-0.5 focus:outline-none focus:border-[#00F0FF]"
            >
              {SYNTHETIC_CORRIDORS.map((c) => (
                <option key={c} value={c} className="bg-[#05070B] text-slate-100">
                  {c}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setActiveTab('Scales');
                appendRadioLog(
                  '🟢 CREW CHIEF',
                  'Quantization epilogue inspected · E4M3 bias=7 max=448.0'
                );
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-slate-700 rounded transition-colors cursor-pointer"
            >
              [Quant]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Matrix');
                handleStepGemmPass();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-[#10B981] border border-slate-700 rounded transition-colors cursor-pointer"
            >
              [GEMM]
            </button>
            <button
              type="button"
              onClick={handleStepGemmPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/40 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
            <button
              type="button"
              onClick={() => setShowSchemaModal(true)}
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-slate-700 rounded transition-colors cursor-pointer"
            >
              [Inspect Schema]
            </button>
            <button
              type="button"
              onClick={handleResetScalesAndBuffers}
              className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-700 rounded transition-colors cursor-pointer"
            >
              [Reset]
            </button>
          </div>
        </div>

        {/* Top Header Row 2: Condensed Subtitle (No right truncation) */}
        <p className="text-xs font-semibold text-slate-200 text-center font-mono mt-0.5">
          FP8 Mixed-Precision GEMM · Dynamic Microscaling · E4M3/E5M2 Core
        </p>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: TENSOR NITRO */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider">
              TENSOR NITRO
            </span>
            <span className="text-xs font-mono font-semibold text-slate-200">
              Latency: {gemmResult.telemetry.gemmLatencyMs.toFixed(2)} ms
            </span>
          </div>
          <div className="text-lg font-extrabold font-mono text-[#00F0FF] tracking-tight leading-tight">
            {gemmResult.telemetry.computeTflops.toLocaleString()} TFLOPS
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-all duration-150"
              style={{
                width:
                  String(
                    Math.min(100, Math.round((gemmResult.telemetry.computeTflops / 2000) * 100))
                  ) + '%',
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-200">
            <span>FP8 W8A8 Tensor Cores</span>
            <span className="text-emerald-400">Footprint -50%</span>
          </div>
        </div>

        {/* Card 2: FIDELITY STREAK */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider">
              FIDELITY STREAK
            </span>
            <span className="px-1.5 py-0.2 bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/50 rounded text-xs font-mono font-semibold">
              🔥 {passesStreak} PASSES
            </span>
          </div>
          <div className="text-lg font-extrabold font-mono text-emerald-400 tracking-tight leading-tight">
            {gemmResult.telemetry.snrParityPct.toFixed(1)}% SNR PARITY
          </div>
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-200">
            <span>BF16 Ground Truth Delta</span>
            <span>{gemmResult.telemetry.snrDb} dB</span>
          </div>
        </div>

        {/* Card 3: ACTIVE FORMAT (F1 Shift Indicator) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider">
              ACTIVE FORMAT
            </span>
            <span className="text-xs font-mono font-semibold text-slate-200">
              {scalingMode === ScalingMode.DYNAMIC_BLOCK ? 'DYNAMIC-BLOCK' : 'STATIC-TENSOR'}
            </span>
          </div>
          <div className="text-lg font-extrabold font-mono text-white tracking-tight leading-tight">
            FORMAT: {activeShiftFormat}
          </div>
          <div className="grid grid-cols-4 gap-0.5 bg-black/80 p-0.5 rounded border border-slate-800 font-mono text-xs">
            {(
              [
                PrecisionFormat.E4M3,
                PrecisionFormat.E5M2,
                PrecisionFormat.FP16,
                PrecisionFormat.FP32,
              ] as PrecisionFormat[]
            ).map((fmt) => {
              const isSelected = activeShiftFormat === fmt;
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => handleFormatShift(fmt)}
                  className={
                    'py-0.2 rounded text-center font-bold transition-colors cursor-pointer ' +
                    (isSelected
                      ? 'bg-[#00F0FF] text-black'
                      : 'text-slate-200 hover:text-white')
                  }
                >
                  {fmt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 4: MATRIX SCORE */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider">
              MATRIX SCORE
            </span>
            <span className="px-1.5 py-0.2 bg-[#10B981]/20 text-emerald-400 border border-emerald-400/50 rounded text-xs font-mono font-semibold">
              +{gemmResult.telemetry.flopXpDelta}k FLOP XP
            </span>
          </div>
          <div className="text-lg font-extrabold font-mono text-white tracking-tight leading-tight">
            {gemmResult.telemetry.processedUnits.toLocaleString()} UNITS
          </div>
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-200">
            <span>
              Epilogue: {gemmResult.telemetry.dequantOverheadMs.toFixed(2)} ms
            </span>
            <span className="text-cyan-300">FP32 ACC</span>
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Subsystem Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-0.5 w-full text-center shrink-0"
      >
        {(['Mesh', 'Matrix', 'Scales', 'Outliers', 'Transfer'] as CockpitTab[]).map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'text-xs font-mono font-bold py-1.5 px-3 rounded transition-all cursor-pointer whitespace-nowrap truncate ' +
                (active
                  ? 'bg-cyan-950/70 border border-cyan-400 text-cyan-300 font-bold'
                  : 'text-slate-200 hover:text-white border border-transparent')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* INTERACTIVE SIMULATION BAY (FLEX-1 OVERFLOW-HIDDEN) */}
      <main className="flex-1 min-h-0 w-full grid grid-cols-1 lg:grid-cols-12 gap-1.5 overflow-hidden">
        {/* LEFT / CENTER 8 COLUMNS: Interactive 4x4 Matrix A & Matrix B Tile Visualizer + Tab-Contextual Controls */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-slate-900/50 border border-slate-800 rounded-lg p-2 overflow-hidden min-h-0">
          {/* Top Bar inside Bay */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1 shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                [{activeTab.toUpperCase()} BAY]
              </span>
              <span className="text-xs font-mono font-semibold text-slate-200 truncate">
                4x4 Interactive Tensor Core Block Visualizer
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-200 shrink-0">
              <span>
                FP8 {gemmResult.telemetry.fp8FootprintBytes}B vs BF16{' '}
                {gemmResult.telemetry.bf16FootprintBytes}B
              </span>
              <span className="text-emerald-400 font-bold">
                (-{gemmResult.telemetry.memoryReductionPct}% RAM)
              </span>
            </div>
          </div>

          {/* Dual 4x4 Interactive Matrix Grids (Clean, readable tile blocks: text-xs font-mono font-bold px-2 py-1) */}
          <div className="grid grid-cols-2 gap-2 my-auto py-1 min-h-0 overflow-hidden">
            {/* Matrix A: Activations */}
            <div className="flex flex-col justify-between bg-[#05070B]/90 border border-slate-800 rounded p-1.5">
              <div className="flex items-center justify-between mb-1 px-0.5">
                <span className="text-xs font-mono font-bold text-cyan-300">
                  MATRIX A · ACTIVATIONS ({gemmResult.formatA})
                </span>
                <span className="text-xs font-mono font-semibold text-slate-300">
                  Row Scales S_A
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {gemmResult.tilesA.map((rowTiles, rIdx) =>
                  rowTiles.map((tile, cIdx) => {
                    const isSel =
                      selectedTile.operand === 'A' &&
                      selectedTile.row === rIdx &&
                      selectedTile.col === cIdx;
                    const isSpike = Math.abs(tile.rawFp32) > 40;
                    return (
                      <button
                        key={'A-' + String(rIdx) + '-' + String(cIdx)}
                        type="button"
                        onClick={() =>
                          setSelectedTile({ operand: 'A', row: rIdx, col: cIdx })
                        }
                        className={
                          'text-xs font-mono font-bold px-2 py-1 rounded border text-left transition-all cursor-pointer flex flex-col justify-between ' +
                          (isSel
                            ? 'bg-cyan-950/85 border-cyan-400 text-white shadow-sm'
                            : isSpike
                            ? 'bg-[#FF9F0A]/20 border-[#FF9F0A] text-[#FF9F0A]'
                            : 'bg-slate-900/95 border-slate-700/80 text-slate-100 hover:border-cyan-400/60')
                        }
                      >
                        <span className="text-xs font-mono font-bold text-cyan-300 truncate leading-tight">
                          {tile.clippedFp32.toFixed(2)}
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan-300 truncate leading-tight">
                          Q:{Math.round(tile.quantizedFp8)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Matrix B: Weights */}
            <div className="flex flex-col justify-between bg-[#05070B]/90 border border-slate-800 rounded p-1.5">
              <div className="flex items-center justify-between mb-1 px-0.5">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  MATRIX B · WEIGHTS ({gemmResult.formatB})
                </span>
                <span className="text-xs font-mono font-semibold text-slate-300">
                  Col Scales S_B
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {gemmResult.tilesB.map((rowTiles, rIdx) =>
                  rowTiles.map((tile, cIdx) => {
                    const isSel =
                      selectedTile.operand === 'B' &&
                      selectedTile.row === rIdx &&
                      selectedTile.col === cIdx;
                    return (
                      <button
                        key={'B-' + String(rIdx) + '-' + String(cIdx)}
                        type="button"
                        onClick={() =>
                          setSelectedTile({ operand: 'B', row: rIdx, col: cIdx })
                        }
                        className={
                          'text-xs font-mono font-bold px-2 py-1 rounded border text-left transition-all cursor-pointer flex flex-col justify-between ' +
                          (isSel
                            ? 'bg-emerald-950/85 border-emerald-400 text-white shadow-sm'
                            : 'bg-slate-900/95 border-slate-700/80 text-slate-100 hover:border-emerald-400/60')
                        }
                      >
                        <span className="text-xs font-mono font-bold text-cyan-300 truncate leading-tight">
                          {tile.clippedFp32.toFixed(2)}
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan-300 truncate leading-tight">
                          Q:{Math.round(tile.quantizedFp8)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Contextual Sub-Strip Driven by the 5 Tabs (Mesh | Matrix | Scales | Outliers | Transfer) */}
          <div className="bg-[#05070B] border border-slate-800 rounded px-2.5 py-1 shrink-0">
            {activeTab === 'Mesh' && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-semibold text-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-300 font-bold">SYSTOLIC MESH:</span>
                  <span>
                    W8A8 Core -&gt; FP32 Accumulator -&gt; BF16/FP32 Dequant
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    aria-label="GridSync Zero-Trust Payload Test"
                    value={securityInputTest}
                    onChange={(e) => handleValidateSecurityNote(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-100 w-44 focus:outline-none focus:border-cyan-400"
                  />
                  <span
                    className={
                      securityGateStatus.valid ? 'text-emerald-400' : 'text-[#EF4444]'
                    }
                  >
                    {securityGateStatus.message}
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'Matrix' && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-semibold text-slate-200">
                <span>
                  <strong className="text-cyan-300">
                    FP32 OUT R{selectedTile.row}:
                  </strong>{' '}
                  [
                  {gemmResult.dequantizedOutputMatrix[selectedTile.row]
                    .map((v) => v.toFixed(2))
                    .join(', ')}
                  ]
                </span>
                <span className="text-emerald-400 font-bold">
                  L2 Error vs FP32: {gemmResult.telemetry.relativeL2Error}
                </span>
              </div>
            )}

            {activeTab === 'Scales' && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-semibold text-slate-200">
                <div>
                  <span className="text-cyan-300 font-bold">S_A: </span>
                  {gemmResult.scalesA
                    .map((s, i) => 'R' + String(i) + ':' + s.toFixed(1))
                    .join(' · ')}
                </div>
                <div>
                  <span className="text-emerald-400 font-bold">S_B: </span>
                  {gemmResult.scalesB
                    .map((s, i) => 'C' + String(i) + ':' + s.toFixed(1))
                    .join(' · ')}
                </div>
              </div>
            )}

            {activeTab === 'Outliers' && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-semibold text-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-[#FF9F0A] font-bold">OUTLIER CLIP:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setOutlierClipThreshold((prev) => (prev === null ? 45.0 : null))
                    }
                    className="px-2 py-0.5 rounded bg-slate-900 border border-[#FF9F0A]/60 text-[#FF9F0A] hover:bg-[#FF9F0A]/20 cursor-pointer font-bold"
                  >
                    {outlierClipThreshold !== null
                      ? 'Active (+-' + String(outlierClipThreshold) + ')'
                      : 'Disabled (Unbounded)'}
                  </button>
                  <span>
                    Clipped: {gemmResult.telemetry.clippedElementsCount} Units
                  </span>
                </div>
                <span>
                  Max: E4M3={E4M3_MAX_VAL} · E5M2={E5M2_MAX_VAL}
                </span>
              </div>
            )}

            {activeTab === 'Transfer' && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-semibold text-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">
                    STANDALONE APA TRANSFER:
                  </span>
                  <span className="hidden xl:inline">
                    100% MIT Clean-Room · SSDF v1.1
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setApaModalState('ACQUIRE')}
                    className="px-2 py-0.5 rounded bg-[#10B981] text-black font-bold hover:bg-[#10B981]/90 cursor-pointer"
                  >
                    ACQUIRE TITLE (APA)
                  </button>
                  <button
                    type="button"
                    onClick={() => setApaModalState('VAULT')}
                    className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-cyan-400/50 font-bold hover:bg-slate-700 cursor-pointer"
                  >
                    INQUIRE VAULT BUYOUT
                  </button>
                  <button
                    type="button"
                    onClick={handleExportAuditJson}
                    className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-700 font-bold hover:bg-slate-800 cursor-pointer"
                  >
                    EXPORT AUDIT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 4 COLUMNS: FP8 BIT & EPILOGUE INSPECTOR */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 overflow-hidden min-h-0 font-mono">
          {/* Inspector Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 shrink-0">
            <span className="text-xs font-mono font-bold text-slate-200">
              FP8 BIT & EPILOGUE INSPECTOR
            </span>
            <span className="text-xs font-mono font-bold text-cyan-300 px-2 py-0.5 bg-slate-800 rounded">
              TILE {selectedTile.operand}[{selectedTile.row},{selectedTile.col}] ({inspectedTile.format})
            </span>
          </div>

          {/* 8-Bit Decomposition Display (SIGN 1b, EXPONENT 4b, MANTISSA 3b) */}
          <div className="grid grid-cols-3 gap-1.5 my-1 text-center shrink-0">
            <div className="bg-[#05070B] border border-slate-800 rounded p-1.5">
              <div className="text-xs font-mono text-slate-300 font-semibold">
                SIGN 1b
              </div>
              <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                {inspectedTile.signBit} ({inspectedTile.signBit === 1 ? '-' : '+'})
              </div>
            </div>
            <div className="bg-[#05070B] border border-slate-800 rounded p-1.5">
              <div className="text-xs font-mono text-slate-300 font-semibold">
                EXPONENT {inspectedTile.exponentBits.length}b
              </div>
              <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                {inspectedTile.exponentBits}
              </div>
            </div>
            <div className="bg-[#05070B] border border-slate-800 rounded p-1.5">
              <div className="text-xs font-mono text-slate-300 font-semibold">
                MANTISSA {inspectedTile.mantissaBits.length}b
              </div>
              <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                {inspectedTile.mantissaBits}
              </div>
            </div>
          </div>

          {/* Telemetry Key-Value Breakdown with unsliced bottom register row */}
          <div className="flex-1 flex flex-col justify-between space-y-1 py-0.5 min-h-0">
            <div className="flex items-center justify-between bg-[#05070B]/80 px-2.5 py-1 rounded border border-slate-800/70">
              <span className="text-xs font-mono font-bold text-slate-200">
                Raw Input:
              </span>
              <span className="text-sm font-mono font-bold text-cyan-300">
                {inspectedTile.clippedFp32.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center justify-between bg-[#05070B]/80 px-2.5 py-1 rounded border border-slate-800/70">
              <span className="text-xs font-mono font-bold text-slate-200">
                Scale Factor:
              </span>
              <span className="text-sm font-mono font-bold text-cyan-300">
                {inspectedTile.localScaleFactor.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center justify-between bg-[#05070B]/80 px-2.5 py-1 rounded border border-slate-800/70">
              <span className="text-xs font-mono font-bold text-slate-200">
                Post-Accum FP32:
              </span>
              <span className="text-sm font-mono font-bold text-cyan-300">
                {inspectedTile.postAccumFp32Value.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center justify-between bg-[#05070B]/95 px-2.5 rounded border border-emerald-500/40 text-xs font-mono font-bold text-emerald-400 py-1">
              <span>Quantized FP8 Register:</span>
              <span>
                {inspectedTile.quantizedFp8.toFixed(3)} (0b{inspectedTile.bitString})
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleInjectOutlierSpike}
          className="amber alert border border-[#FF9F0A] bg-[#FF9F0A]/20 hover:bg-[#FF9F0A]/30 text-amber-300 rounded-lg text-xs font-bold py-2 px-2 transition-all cursor-pointer truncate font-mono"
        >
          💥 INJECT OUTLIER SPIKE
        </button>

        <button
          type="button"
          onClick={handleToggleBlockScaling}
          className="bright cyan electric glow border border-[#00F0FF] bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-cyan-200 rounded-lg text-xs font-bold py-2 px-2 transition-all cursor-pointer truncate font-mono"
        >
          ⚡ TOGGLE BLOCK SCALING
        </button>

        <button
          type="button"
          onClick={handleStepGemmPass}
          className="emerald launch switch border border-[#10B981] bg-[#10B981]/20 hover:bg-[#10B981]/30 text-emerald-300 rounded-lg text-xs font-bold py-2 px-2 transition-all cursor-pointer truncate font-mono"
        >
          🚀 STEP FP8 GEMM PASS
        </button>

        <button
          type="button"
          onClick={handleResetScalesAndBuffers}
          className="rose reset switch border border-[#EF4444] bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-rose-300 rounded-lg text-xs font-bold py-2 px-2 transition-all cursor-pointer truncate font-mono"
        >
          🔄 RESET SCALES & BUFFERS
        </button>
      </section>

      {/* PIT-WALL COMMS TERMINAL LOG */}
      <footer
        aria-label="Pit-Wall Radio Telemetry Log"
        className="h-16 overflow-hidden bg-black/95 border border-slate-800 rounded-lg shrink-0 text-[11px] font-mono leading-relaxed p-2 text-slate-200 flex flex-col justify-between"
      >
        {radioLogs.map((line, idx) => (
          <div key={idx} className="truncate">
            {line}
          </div>
        ))}
      </footer>

      {/* POSTGRESQL / SUPABASE RLS SCHEMA MODAL */}
      {showSchemaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#05070B] border border-[#00F0FF]/50 rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="font-mono font-bold text-sm text-[#00F0FF]">
                GF-T3-225 · SUPABASE / POSTGRESQL PARTITIONED RLS SCHEMA
              </span>
              <button
                type="button"
                onClick={() => setShowSchemaModal(false)}
                className="px-2 py-0.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>
            <pre className="flex-1 overflow-auto bg-black/90 border border-slate-800 rounded p-3 text-xs font-mono text-slate-200">
              {SUPABASE_POSTGRES_SCHEMA_SQL}
            </pre>
          </div>
        </div>
      )}

      {/* SOVEREIGN APA TITLE TRANSFER MODAL */}
      {apaModalState !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#05070B] border border-[#10B981]/60 rounded-lg max-w-2xl w-full p-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-sm font-bold text-[#10B981]">
                {apaModalState === 'ACQUIRE'
                  ? 'ACQUIRE TITLE (APA) — GF-T3-225 ESCROW DISPATCH'
                  : 'INQUIRE VAULT BUYOUT — GF-T3-225 DUE DILIGENCE'}
              </span>
              <button
                type="button"
                onClick={() => setApaModalState(null)}
                className="px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-200 mb-4">
              {APA_TRANSFER_HIGHLIGHTS.map((item) => (
                <div
                  key={item.code}
                  className="bg-slate-900/90 border border-slate-800 rounded p-2.5"
                >
                  <div className="flex items-center justify-between font-bold text-white mb-1">
                    <span>
                      {item.code} · {item.title}
                    </span>
                    <span className="text-[#10B981] text-xs">{item.status}</span>
                  </div>
                  <p className="text-xs text-slate-300">{item.detail}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  handleExportAuditJson();
                  setApaModalState(null);
                }}
                className="px-3 py-1.5 rounded bg-[#10B981] text-black font-bold text-xs cursor-pointer"
              >
                DOWNLOAD APA TELEMETRY & CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
