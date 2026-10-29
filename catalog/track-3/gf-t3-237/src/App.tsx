/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-237: Institutional Gamified FP8 Quantization Scale & Dynamic Block Calibration Cockpit
 * Zero-Dollar Gate Enforced · 100% Clean-Room Synthetic FP8 Corridors
 */

import React, { useMemo, useState } from 'react';
import {
  FP8Format,
  QuantizedBlockTelemetry,
  SYNTHETIC_FP8_CORRIDORS,
  SyntheticCorridor,
  computeMatrixBayState,
} from './engine/fp8QuantEngine';

type CockpitTab = 'Mesh' | 'FP8' | 'Scale' | 'Stats' | 'APA';

const TABS: readonly CockpitTab[] = ['Mesh', 'FP8', 'Scale', 'Stats', 'APA'];

const INITIAL_RADIO_LOGS: readonly string[] = [
  '[00:01.04] 🟢 CREW CHIEF: FP8 E4M3/E5M2 quantization engine initialized · 16 blocks calibrated',
  '[00:01.08] ⚡ PIT WALL: Dynamic block-wise scaling factor computed · Outlier channels isolated',
  '[00:01.12] 🟢 TELEMETRY: Quantization bandwidth verified at 3,400 GB/s throughput saturation',
];

export default function App() {
  const [corridor, setCorridor] = useState<SyntheticCorridor>(SYNTHETIC_FP8_CORRIDORS[0]);
  const [primaryFormat, setPrimaryFormat] = useState<FP8Format>('E4M3');
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [selectedBlockId, setSelectedBlockId] = useState<number>(3);
  const [stepPass, setStepPass] = useState<number>(0);
  const [outlierSpikeActive, setOutlierSpikeActive] = useState<boolean>(false);
  const [burstMode, setBurstMode] = useState<boolean>(false);
  const [processedTokens, setProcessedTokens] = useState<number>(1408000);
  const [xpGain, setXpGain] = useState<number>(24.8);
  const [apaModalState, setApaModalState] = useState<'NONE' | 'APA_LOCKED' | 'VAULT_INQUIRY'>('NONE');
  const [radioLogs, setRadioLogs] = useState<string[]>([...INITIAL_RADIO_LOGS]);

  const matrixBlocks: QuantizedBlockTelemetry[] = useMemo(() => {
    return computeMatrixBayState({
      corridor,
      primaryFormat,
      stepPass,
      outlierSpikeActive,
      burstMode,
    });
  }, [corridor, primaryFormat, stepPass, outlierSpikeActive, burstMode]);

  const selectedBlock: QuantizedBlockTelemetry =
    matrixBlocks.find((b) => b.blockId === selectedBlockId) || matrixBlocks[3];

  const appendRadioLog = (callsign: '🟢 CREW CHIEF' | '⚡ PIT WALL' | '🟢 TELEMETRY' | '🔴 TELEMETRY', msg: string) => {
    const totalSec = 1.16 + (stepPass + 1) * 0.04;
    const secStr = totalSec.toFixed(2).padStart(5, '0');
    const line = '[00:' + secStr + '] ' + callsign + ': ' + msg;
    setRadioLogs((prev) => [line, prev[0], prev[1]]);
  };

  // Top Header Micro Actions
  const handleToggleFp8Mode = () => {
    const nextFmt: FP8Format = primaryFormat === 'E4M3' ? 'E5M2' : 'E4M3';
    setPrimaryFormat(nextFmt);
    setStepPass((p) => p + 1);
    appendRadioLog(
      '🟢 CREW CHIEF',
      'Primary tensor grid toggled to ' + nextFmt + ' · Dynamic mantissa projection updated'
    );
  };

  const handleRecalibrateScales = () => {
    setStepPass((p) => p + 1);
    setProcessedTokens((t) => t + 32000);
    setXpGain((x) => Number((x + 1.2).toFixed(1)));
    appendRadioLog(
      '⚡ PIT WALL',
      'Shared-memory scale resync completed across 16 blocks · 0.07 µs latency lock'
    );
  };

  const handleRunEnginePass = () => {
    setStepPass((p) => p + 1);
    setProcessedTokens((t) => t + 64000);
    setXpGain((x) => Number((x + 2.4).toFixed(1)));
    appendRadioLog(
      '🟢 TELEMETRY',
      'Forward inference pass executed on ' + corridor.split(' ')[0] + ' · 3,400 GB/s verified'
    );
  };

  // 4 Tactical Launch Control Handlers
  const handleInjectFp8Burst = () => {
    const nextBurst = !burstMode;
    setBurstMode(nextBurst);
    setStepPass((p) => p + 1);
    setProcessedTokens((t) => t + 128000);
    setXpGain((x) => Number((x + 4.5).toFixed(1)));
    appendRadioLog(
      '⚡ PIT WALL',
      nextBurst
        ? 'Trigger FP8 Quantization Burst engaged · High-throughput tensor stream active'
        : 'FP8 Quantization Burst normalized · Nominal block scale restored'
    );
  };

  const handleToggleOutlierSpike = () => {
    const nextSpike = !outlierSpikeActive;
    setOutlierSpikeActive(nextSpike);
    setStepPass((p) => p + 1);
    appendRadioLog(
      nextSpike ? '🔴 TELEMETRY' : '🟢 CREW CHIEF',
      nextSpike
        ? 'Inject Outlier Saturation Spike (Force Scale Resync) · High-sigma channels detected'
        : 'Outlier Channel Isolation Pass locked · Sparse bypass registers active'
    );
  };

  const handleStepCalibrationPass = () => {
    setStepPass((p) => p + 1);
    setProcessedTokens((t) => t + 48000);
    setXpGain((x) => Number((x + 1.8).toFixed(1)));
    appendRadioLog(
      '🟢 CREW CHIEF',
      'Step Calibration Kernel Pass #' + String(stepPass + 1) + ' converged · SQNR ' + String(selectedBlock.sqnrDb) + ' dB'
    );
  };

  const handleFlushQuantBuffers = () => {
    setStepPass(0);
    setOutlierSpikeActive(false);
    setBurstMode(false);
    setPrimaryFormat('E4M3');
    setCorridor(SYNTHETIC_FP8_CORRIDORS[0]);
    setSelectedBlockId(3);
    setProcessedTokens(1408000);
    setXpGain(24.8);
    setApaModalState('NONE');
    setRadioLogs([...INITIAL_RADIO_LOGS]);
  };

  const formattedBandwidth =
    stepPass === 0 && !outlierSpikeActive && !burstMode
      ? '3,400 GB/s'
      : selectedBlock.bandwidthGbs.toLocaleString('en-US') + ' GB/s';

  const formattedLatency =
    stepPass === 0 && !outlierSpikeActive && !burstMode
      ? '0.07 µs'
      : String(selectedBlock.latencyUs) + ' µs';

  const inspectorLine =
    'BLOCK: ' +
    selectedBlock.blockLabel +
    ' · FORMAT: ' +
    selectedBlock.format +
    ' · SCALE: ' +
    selectedBlock.scalingFactor.toFixed(4) +
    ' · ERROR: ' +
    selectedBlock.quantErrorMargin.toFixed(4) +
    ' · STATE: ' +
    selectedBlock.state;

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER ZONE */}
      <header className="flex flex-col gap-0.5 w-full shrink-0 border-b border-slate-800/90 pb-1">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Strictly GF-T3-237 + cyan badge TRACK 3 */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm font-mono font-extrabold tracking-tight text-slate-100">
              GF-T3-237
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
              TRACK 3
            </span>
          </div>

          {/* Right: Compact corridor dropdown + micro action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic FP8 Corridor"
              value={corridor}
              onChange={(e) => {
                const nextCorridor = e.target.value as SyntheticCorridor;
                setCorridor(nextCorridor);
                setStepPass((p) => p + 1);
                appendRadioLog('⚡ PIT WALL', 'Switched corridor to ' + nextCorridor);
              }}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {SYNTHETIC_FP8_CORRIDORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleToggleFp8Mode}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/40 rounded transition-colors cursor-pointer"
            >
              [FP8]
            </button>
            <button
              type="button"
              onClick={handleRecalibrateScales}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded transition-colors cursor-pointer"
            >
              [Scale]
            </button>
            <button
              type="button"
              onClick={handleRunEnginePass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900/80 text-[#10B981] border border-[#10B981]/50 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap truncate">
          FP8 E4M3/E5M2 Quantization · Dynamic Block Calibration · Zero Stall
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 Grid above the fold) */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: FP8 NITRO */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>FP8 NITRO</span>
            <span className="text-[#00F0FF] font-bold">Quant Bandwidth: 3,400 GB/s</span>
          </div>
          <div className="flex items-baseline justify-between my-0.5">
            <span className="text-[#00F0FF] font-mono text-lg font-bold leading-none">
              {formattedBandwidth}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">99.4% SAT</span>
          </div>
          <div className="w-full bg-slate-900 h-1 rounded overflow-hidden my-0.5">
            <div className="bg-[#00F0FF] h-full w-11/12" />
          </div>
          <span className="text-[10px] font-mono text-slate-400 truncate">
            Quantization Bandwidth Saturation
          </span>
        </div>

        {/* Card 2: CALIBRATION STREAK */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>CALIBRATION STREAK</span>
            <span className="text-[#FF9F0A] font-bold">🔥 16 BLOCKS</span>
          </div>
          <div className="flex items-baseline justify-between my-0.5">
            <span className="text-[#FF9F0A] font-mono text-lg font-bold leading-none">
              {formattedLatency}
            </span>
            <span className="text-[10px] font-mono text-slate-300">
              Calibration Latency: 0.07 µs
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 truncate">
            Dynamic Scale Latency
          </span>
        </div>

        {/* Card 3: ACTIVE BLOCKS */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>ACTIVE BLOCKS</span>
            <span className="text-emerald-400 font-bold">Active Blocks: 16 Blocks</span>
          </div>
          <div className="flex items-baseline justify-between my-0.5">
            <span className="text-emerald-400 font-mono text-lg font-bold leading-none">
              BLOCKS: 16/16
            </span>
            <span className="text-[10px] font-mono text-cyan-300 font-bold">
              [B0..B15] {primaryFormat}
            </span>
          </div>
          <div className="grid grid-cols-16 gap-0.5 my-0.5">
            {Array.from({ length: 16 }, (_, idx) => (
              <div
                key={idx}
                className={
                  'h-1.5 rounded-xs ' +
                  (outlierSpikeActive && idx % 5 === 0
                    ? 'bg-rose-500'
                    : idx === selectedBlockId
                      ? 'bg-[#00F0FF]'
                      : 'bg-emerald-500/80')
                }
              />
            ))}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>TOKEN SCORE</span>
            <span className="text-emerald-400 font-bold">+{xpGain.toFixed(1)}k FP8 XP</span>
          </div>
          <div className="flex items-baseline justify-between my-0.5">
            <span className="text-slate-100 font-mono text-lg font-bold leading-none">
              {processedTokens.toLocaleString('en-US')} UNITS
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-300 truncate">
            FP8 State: {primaryFormat} Active · Processed Tokens: 1,408,000 Units
          </span>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Subsystem Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
                (isActive
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* INTERACTIVE FP8 QUANTIZATION MATRIX BAY (8 QUANT BLOCKS + CONTEXTUAL TELEMETRY BAY) */}
      <main className="flex-1 min-h-0 flex flex-col justify-between gap-0.5 bg-slate-950/80 border border-slate-800 rounded-lg p-1 overflow-hidden">
        {/* Matrix Bay Header + Corridor Status */}
        <div className="flex items-center justify-between gap-2 text-[10px] font-mono shrink-0 border-b border-slate-800/80 pb-0.5">
          <div className="flex items-center gap-2 truncate">
            <span className="text-[#00F0FF] font-bold">FP8 QUANTIZATION MATRIX BAY</span>
            <span className="text-slate-400 truncate">{corridor}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={
                'px-1.5 py-0.5 rounded font-bold ' +
                (outlierSpikeActive
                  ? 'bg-rose-950/90 text-rose-400 border border-rose-500/50'
                  : 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/50')
              }
            >
              {outlierSpikeActive ? '⚡ FAULT: SCALE RESYNC' : '✓ LOCKED: ZERO STALL'}
            </span>
          </div>
        </div>

        {/* 8 Quant Blocks Grid (Block 0 to Block 7) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1 w-full flex-1 min-h-0 items-stretch">
          {matrixBlocks.map((blk) => {
            const isSelected = blk.blockId === selectedBlock.blockId;
            const isFault = blk.state === 'RESYNC_REQUIRED';
            return (
              <button
                key={blk.blockId}
                type="button"
                onClick={() => {
                  setSelectedBlockId(blk.blockId);
                  appendRadioLog(
                    '🟢 TELEMETRY',
                    'Inspected Block ' +
                      blk.blockLabel +
                      ' (' +
                      blk.memoryPointer +
                      ') · Scale ' +
                      blk.scalingFactor.toFixed(4) +
                      ' · SQNR ' +
                      String(blk.sqnrDb) +
                      ' dB'
                  );
                }}
                className={
                  'flex flex-col justify-between px-1.5 py-0.5 rounded border text-left font-mono transition-all cursor-pointer overflow-hidden ' +
                  (isSelected
                    ? 'bg-cyan-950/40 border-[#00F0FF] ring-1 ring-[#00F0FF]/50'
                    : isFault
                      ? 'bg-rose-950/25 border-rose-500/60 hover:border-rose-400'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-600')
                }
              >
                <div className="text-xs font-mono font-bold text-white leading-tight truncate">
                  Block {blk.blockId} ({blk.blockLabel})
                </div>

                <div className="text-[11px] font-mono text-cyan-300 font-semibold leading-tight truncate">
                  {blk.format} · SCALE: {blk.scalingFactor.toFixed(4)}
                </div>

                <div className="text-[11px] font-mono text-amber-300 font-bold border-t border-slate-800/80 pt-0.5 w-full leading-tight truncate">
                  OUTLIERS: {blk.outlierCount} ch · CLIP: {(blk.clipErrorRatio * 100).toFixed(2)}%
                </div>
              </button>
            );
          })}
        </div>

        {/* Sub-Deck: Contextual Tab Readout + Selected Block Memory Pointer, Error Margin & Scale Vector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1 pt-0.5 border-t border-slate-800/80 text-[10px] font-mono shrink-0">
          <div className="bg-slate-900/90 border border-slate-800 rounded px-1.5 py-0.5 flex items-center justify-between">
            <span className="text-slate-400">TENSOR PTR / ERR MARGIN:</span>
            <span className="text-slate-100 font-bold">
              {selectedBlock.memoryPointer} · ERR {selectedBlock.quantErrorMargin.toFixed(4)} · SQNR{' '}
              {selectedBlock.sqnrDb} dB
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded px-1.5 py-0.5 flex items-center justify-between">
            <span className="text-slate-400">SCALE VECTOR [Q0..Q3]:</span>
            <span className="text-[#00F0FF] font-bold">
              [{selectedBlock.scaleVector.map((v) => v.toFixed(4)).join(', ')}]
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded px-1.5 py-0.5 flex items-center justify-between gap-1">
            {activeTab === 'APA' ? (
              <div className="flex items-center justify-between w-full gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setApaModalState('APA_LOCKED');
                    appendRadioLog(
                      '🟢 CREW CHIEF',
                      'APA Title Acquisition package verified · Clean-room MIT/Apache-2.0 SBOM ready'
                    );
                  }}
                  className="px-2 py-0.5 bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF] border border-[#00F0FF]/60 rounded font-bold text-[10px] cursor-pointer"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApaModalState('VAULT_INQUIRY');
                    appendRadioLog(
                      '⚡ PIT WALL',
                      'Institutional Vault Buyout dossier generated · Zero-SaaS transfer terms locked'
                    );
                  }}
                  className="px-2 py-0.5 bg-[#FF9F0A]/20 hover:bg-[#FF9F0A]/30 text-[#FF9F0A] border border-[#FF9F0A]/60 rounded font-bold text-[10px] cursor-pointer"
                >
                  INQUIRE VAULT BUYOUT
                </button>
              </div>
            ) : activeTab === 'Scale' ? (
              <span className="text-amber-300 truncate">
                INV SCALE: {selectedBlock.inverseScale.toFixed(2)}x · AMAX:{' '}
                {selectedBlock.amaxFiltered.toFixed(2)} / {selectedBlock.amaxRaw.toFixed(2)}
              </span>
            ) : activeTab === 'Stats' ? (
              <span className="text-emerald-300 truncate">
                RLS SCHEMA: PARTITIONED · PYTEST + VITEST: &gt;80% PASS · ZERO COPILOT/GPL
              </span>
            ) : (
              <div className="flex items-center justify-between w-full gap-1">
                <span className="text-slate-300 truncate">
                  TAB [{activeTab.toUpperCase()}] · ISOLATED CH: {selectedBlock.outlierCount}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('APA')}
                  className="px-1.5 py-0.2 bg-slate-800 hover:bg-slate-700 text-[#00F0FF] border border-slate-700 rounded text-[9px] font-bold shrink-0 cursor-pointer"
                >
                  ACQUIRE TITLE (APA)
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* COMPACT FP8 TELEMETRY INSPECTOR STRIP */}
      <div
        aria-label="FP8 Telemetry Inspector Strip"
        className="w-full bg-slate-950 border border-cyan-500/40 rounded px-2 py-0.5 flex items-center justify-between shrink-0"
      >
        <span className="text-xs font-mono font-bold text-cyan-300 truncate">
          {inspectorLine}
        </span>
        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline shrink-0">
          {apaModalState === 'APA_LOCKED'
            ? 'APA TITLE CERTIFICATE READY'
            : apaModalState === 'VAULT_INQUIRY'
              ? 'VAULT ESCROW READY'
              : 'PTR ' + selectedBlock.memoryPointer + ' · 100% MIT CLEAN-ROOM'}
        </span>
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section
        aria-label="Tactical Launch Controls"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleInjectFp8Burst}
          className="bg-amber-950/40 hover:bg-amber-900/50 border border-[#FF9F0A] text-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          💥 INJECT FP8 BURST
        </button>

        <button
          type="button"
          onClick={handleToggleOutlierSpike}
          className="bg-cyan-950/40 hover:bg-cyan-900/50 border border-[#00F0FF] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.25)] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          ⚡ TOGGLE OUTLIER SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepCalibrationPass}
          className="bg-emerald-950/40 hover:bg-emerald-900/50 border border-[#10B981] text-[#10B981] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          🚀 STEP CALIBRATION PASS
        </button>

        <button
          type="button"
          onClick={handleFlushQuantBuffers}
          className="bg-rose-950/40 hover:bg-rose-900/50 border border-[#EF4444] text-[#EF4444] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          🔄 FLUSH QUANT BUFFERS
        </button>
      </section>

      {/* PIT-WALL RADIO LOG */}
      <footer
        aria-label="Pit-Wall Radio Log"
        className="h-14 overflow-hidden font-mono text-[10px] p-2 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between mb-0.5"
      >
        {radioLogs.slice(0, 3).map((line, index) => (
          <div key={index} className="truncate">
            {line}
          </div>
        ))}
      </footer>
    </div>
  );
}
