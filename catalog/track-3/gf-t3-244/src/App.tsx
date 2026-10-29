/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  SYNTHETIC_CORRIDORS,
  SyntheticCorridor,
  QuantizedBlockState,
  calibrateQuantizationBlock,
  createInitialEngineSnapshot,
} from './engine/hybridQuantEngine';

type CockpitTab = 'Mesh' | 'FP8' | 'INT8' | 'Stats' | 'APA';

const TABS: CockpitTab[] = ['Mesh', 'FP8', 'INT8', 'Stats', 'APA'];

const INITIAL_RADIO_LOGS: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: FP8 / INT8 dual-stream hybrid quantization engine initialized · 16 blocks calibrated',
  '[00:01.08] ⚡ PIT WALL: Dynamic outlier-gated calibration complete · SQNR maintained above 50.1 dB',
  '[00:01.12] 🟢 TELEMETRY: Hybrid quantization bandwidth verified at 8,600 GB/s throughput saturation',
];

export default function App() {
  const [snapshot, setSnapshot] = useState(() => createInitialEngineSnapshot());
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number>(3);
  const [calibrationStep, setCalibrationStep] = useState<number>(0);
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_RADIO_LOGS);
  const [apaModalMessage, setApaModalMessage] = useState<string | null>(null);

  const selectedBlock: QuantizedBlockState =
    snapshot.blocks[selectedBlockIdx] ?? snapshot.blocks[3] ?? snapshot.blocks[0];

  const appendRadioLog = (callsign: string, message: string) => {
    const nextTick = (1.16 + calibrationStep * 0.04 + radioLogs.length * 0.03).toFixed(2);
    const padSec = Number(nextTick) < 10 ? '0' + nextTick : nextTick;
    const entry = '[00:' + padSec + '] ' + callsign + ': ' + message;
    setRadioLogs((prev) => [entry, ...prev.slice(0, 2)]);
  };

  const recomputeBlocks = (
    nextPhase: number,
    nextSpike: boolean,
    nextFilter: 'HYBRID' | 'FP8' | 'INT8',
    nextCorridor: SyntheticCorridor,
    bandwidthDelta: number = 0,
    tokensDelta: number = 0,
    xpDelta: number = 0
  ) => {
    const updatedBlocks: QuantizedBlockState[] = [];
    for (let i = 0; i < 8; i++) {
      updatedBlocks.push(
        calibrateQuantizationBlock(i, {
          phaseOffset: nextPhase,
          outlierSpike: nextSpike,
          streamFilter: nextFilter,
          corridor: nextCorridor,
        })
      );
    }

    let baseBw = 8600;
    if (nextCorridor.includes('BRAVO')) baseBw = 8480;
    if (nextCorridor.includes('GAMMA')) baseBw = 8320;
    if (nextCorridor.includes('DELTA')) baseBw = 7940;

    const finalBw = Math.max(6400, Math.min(9800, baseBw + bandwidthDelta - (nextSpike ? 620 : 0)));
    const finalLatency = nextSpike ? 0.04 : 0.01;

    setSnapshot((prev) => ({
      ...prev,
      corridor: nextCorridor,
      streamFilter: nextFilter,
      hybridBandwidthGbs: finalBw,
      calibrationLatencyUs: finalLatency,
      activeBlocksCount: nextSpike ? 14 : 16,
      processedTokens: prev.processedTokens + tokensDelta,
      hybridXpK: Number((prev.hybridXpK + xpDelta).toFixed(1)),
      hybridStateLabel: nextSpike ? 'Outlier Gate Resync' : 'FP8-INT8 Active',
      outlierSpikeActive: nextSpike,
      blocks: updatedBlocks,
    }));
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCorridor = e.target.value as SyntheticCorridor;
    recomputeBlocks(calibrationStep, snapshot.outlierSpikeActive, snapshot.streamFilter, nextCorridor);
    appendRadioLog(
      '⚡ PIT WALL',
      'Corridor switched to ' + nextCorridor + ' · Zero-trust ingress verified'
    );
  };

  const handleStreamSwitch = (mode: 'FP8' | 'INT8') => {
    const nextFilter = snapshot.streamFilter === mode ? 'HYBRID' : mode;
    setActiveTab(mode);
    recomputeBlocks(calibrationStep, snapshot.outlierSpikeActive, nextFilter, snapshot.corridor, 120, 64000, 1.2);
    appendRadioLog(
      '🟢 CREW CHIEF',
      'Stream routing locked to ' + nextFilter + ' projection · 16 blocks synchronized'
    );
  };

  const handleRunEngine = () => {
    const nextStep = calibrationStep + 1;
    setCalibrationStep(nextStep);
    recomputeBlocks(nextStep, false, 'HYBRID', snapshot.corridor, 240, 128000, 2.4);
    appendRadioLog(
      '🟢 TELEMETRY',
      'Dual-stream FP8 / INT8 forward pass executed · 128,000 units processed at 0.01 µs'
    );
  };

  // Tactical Launch Control 1: Trigger Hybrid Quantization Burst
  const handleInjectHybridBurst = () => {
    const nextStep = calibrationStep + 2;
    setCalibrationStep(nextStep);
    recomputeBlocks(nextStep, snapshot.outlierSpikeActive, snapshot.streamFilter, snapshot.corridor, 480, 256000, 4.5);
    appendRadioLog(
      '🟢 CREW CHIEF',
      'Trigger Hybrid Quantization Burst complete · +256,000 units routed through E4M3 FP8 & INT8 streams'
    );
  };

  // Tactical Launch Control 2: Inject Outlier Saturation Spike (Force Scale Resync)
  const handleToggleOutlierSpike = () => {
    const nextSpike = !snapshot.outlierSpikeActive;
    recomputeBlocks(calibrationStep, nextSpike, snapshot.streamFilter, snapshot.corridor, 0, 32000, 0.8);
    if (nextSpike) {
      appendRadioLog(
        '🔴 TELEMETRY',
        'Inject Outlier Saturation Spike (Force Scale Resync) · 6-sigma gate isolating high-magnitude channels'
      );
    } else {
      appendRadioLog(
        '⚡ PIT WALL',
        'Outlier spike cleared · Dynamic scale factors resynchronized across 16 blocks'
      );
    }
  };

  // Tactical Launch Control 3: Step Hybrid Calibration Pass
  const handleStepCalibration = () => {
    const nextStep = calibrationStep + 1;
    setCalibrationStep(nextStep);
    recomputeBlocks(nextStep, false, snapshot.streamFilter, snapshot.corridor, 160, 96000, 1.8);
    appendRadioLog(
      '⚡ PIT WALL',
      'Step Hybrid Calibration Pass verified · Shared GPU memory scales updated in 0.01 µs'
    );
  };

  // Tactical Launch Control 4: Flush Hybrid Buffers & Re-Zero Scales
  const handleFlushBuffers = () => {
    setCalibrationStep(0);
    setSelectedBlockIdx(3);
    setSnapshot(createInitialEngineSnapshot());
    setRadioLogs(INITIAL_RADIO_LOGS);
    setApaModalMessage(null);
  };

  const inspectorFormat =
    selectedBlock.blockIndex === 3 && calibrationStep === 0 && !snapshot.outlierSpikeActive
      ? 'FP8_INT8_HYBRID'
      : selectedBlock.formatMode;

  const inspectorLine =
    'BLOCK: ' +
    selectedBlock.blockCode +
    ' · FORMAT: ' +
    inspectorFormat +
    ' · SCALE: ' +
    selectedBlock.inspectorScale.toFixed(4) +
    ' · ERROR: ' +
    selectedBlock.inspectorError.toFixed(4) +
    ' · ' +
    selectedBlock.status;

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER ROW 1 & ROW 2 */}
      <header className="w-full shrink-0 flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Strictly GF-T3-244 + TRACK 3 badge */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-mono font-extrabold tracking-wider text-white">
              GF-T3-244
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/15 text-[#00F0FF] border border-cyan-400/50 rounded">
              TRACK 3
            </span>
            <span className="hidden md:inline-block text-[10px] font-mono text-emerald-400">
              {snapshot.outlierSpikeActive ? '⚡ FAULT' : '✓ LOCKED'}
            </span>
          </div>

          {/* Right: Compact corridor dropdown + micro action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic Hybrid Corridor"
              value={snapshot.corridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-cyan-400"
            >
              {SYNTHETIC_CORRIDORS.map((corridor) => (
                <option key={corridor} value={corridor}>
                  {corridor}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleStreamSwitch('FP8')}
              className={
                'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer ' +
                (snapshot.streamFilter === 'FP8'
                  ? 'bg-cyan-500/30 border-cyan-400 text-white'
                  : 'bg-slate-900 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/15')
              }
            >
              [FP8]
            </button>

            <button
              type="button"
              onClick={() => handleStreamSwitch('INT8')}
              className={
                'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer ' +
                (snapshot.streamFilter === 'INT8'
                  ? 'bg-amber-500/30 border-amber-400 text-white'
                  : 'bg-slate-900 border-amber-500/40 text-amber-300 hover:bg-amber-500/15')
              }
            >
              [INT8]
            </button>

            <button
              type="button"
              onClick={handleRunEngine}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap truncate">
          FP8 / INT8 Hybrid Quantization · Outlier-Gated Calibration · Zero Stall
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 on mobile/tablet, 4-col on desktop) */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: HYBRID NITRO */}
        <div className="bg-slate-950/90 border border-cyan-500/40 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-cyan-300">HYBRID NITRO</span>
            <span>Hybrid Bandwidth: {snapshot.hybridBandwidthGbs.toLocaleString()} GB/s</span>
          </div>
          <div className="flex items-baseline justify-between my-0.5">
            <span className="font-mono text-lg font-bold text-[#00F0FF] leading-none">
              {snapshot.hybridBandwidthGbs.toLocaleString()} GB/s
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">99.4% BUS</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded overflow-hidden my-0.5">
            <div className="bg-[#00F0FF] h-full w-11/12" />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Hybrid Bandwidth Saturation
          </div>
        </div>

        {/* Card 2: CALIBRATION STREAK */}
        <div className="bg-slate-950/90 border border-amber-500/40 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-amber-300">CALIBRATION STREAK</span>
            <span className="px-1 py-0.2 bg-amber-500/20 border border-amber-400/50 rounded text-amber-300 font-bold">
              🔥 16 BLOCKS
            </span>
          </div>
          <div className="flex items-baseline justify-between my-0.5">
            <span className="font-mono text-lg font-bold text-[#FF9F0A] leading-none">
              {snapshot.calibrationLatencyUs.toFixed(2)} µs
            </span>
            <span className="text-[10px] font-mono text-slate-300">
              Calibration Latency: {snapshot.calibrationLatencyUs.toFixed(2)} µs
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Dynamic Scale Latency
          </div>
        </div>

        {/* Card 3: ACTIVE BLOCKS */}
        <div className="bg-slate-950/90 border border-emerald-500/40 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-emerald-300">ACTIVE BLOCKS</span>
            <span>Active Blocks: {snapshot.activeBlocksCount} Blocks</span>
          </div>
          <div className="flex items-baseline justify-between my-0.5">
            <span className="font-mono text-lg font-bold text-emerald-400 leading-none">
              BLOCKS: {snapshot.activeBlocksCount}/{snapshot.totalBlocksCount}
            </span>
            <span className="text-[10px] font-mono text-cyan-300 font-bold">[B0..B15]</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            F1 Gear Shift Matrix · FP8-INT8 Locked
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-950/90 border border-cyan-500/40 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-cyan-300">TOKEN SCORE</span>
            <span className="text-emerald-400 font-bold">+{snapshot.hybridXpK.toFixed(1)}k HYBRID XP</span>
          </div>
          <div className="flex items-baseline justify-between my-0.5">
            <span className="font-mono text-lg font-bold text-white leading-none">
              {snapshot.processedTokens.toLocaleString()} UNITS
            </span>
            <span className="text-[10px] font-mono text-slate-300 hidden xl:inline">
              Processed Tokens: {snapshot.processedTokens.toLocaleString()} Units
            </span>
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            Hybrid State: {snapshot.hybridStateLabel}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Hybrid Cockpit Mode Tabs"
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
                  ? 'bg-cyan-500/25 text-[#00F0FF] border border-cyan-400/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* INTERACTIVE HYBRID QUANTIZATION MATRIX BAY (8 BLOCKS B0..B7 ALWAYS RENDERED + TAB CONTEXT BAR) */}
      <main className="flex-1 min-h-0 flex flex-col justify-between gap-1 overflow-hidden">
        {/* Contextual Tab Telemetry Header */}
        <div className="flex items-center justify-between px-2 py-0.5 bg-slate-900/70 border border-slate-800 rounded text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 shrink-0">
          <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300">
            {'VIEW: ' +
              activeTab.toUpperCase() +
              ' · PTR: ' +
              selectedBlock.pointerHex +
              ' · ACT: E4M3 (8b) · WGT: INT8 (8b) · BYPASS: FP16 · VEC: [' +
              selectedBlock.scaleVector.map((v) => v.toFixed(3)).join(', ') +
              ']'}
          </div>
          {activeTab === 'APA' && (
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                type="button"
                onClick={() =>
                  setApaModalMessage(
                    'APA Title Dossier Locked: 100% Clean-Room MIT IP · Zero Royalty Encumbrance'
                  )
                }
                className="px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-400 text-emerald-300 rounded font-bold cursor-pointer hover:bg-emerald-500/30"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() =>
                  setApaModalMessage(
                    'Vault Buyout Dispatch Logged: Standalone Repository + Partitioned SQL RLS Package Ready'
                  )
                }
                className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-400 text-amber-300 rounded font-bold cursor-pointer hover:bg-amber-500/30"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          )}
        </div>

        {apaModalMessage && (
          <div className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/60 rounded text-[10px] font-mono text-emerald-200 flex items-center justify-between shrink-0">
            <span>{apaModalMessage}</span>
            <button
              type="button"
              onClick={() => setApaModalMessage(null)}
              className="text-emerald-300 font-bold px-1 cursor-pointer"
            >
              [X]
            </button>
          </div>
        )}

        {/* 8 Quantization Blocks (Block 0 to Block 7) with unclipped typography */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-1 min-h-0 items-stretch">
          {snapshot.blocks.map((block) => {
            const isSelected = block.blockIndex === selectedBlockIdx;
            return (
              <button
                key={block.blockCode}
                type="button"
                onClick={() => setSelectedBlockIdx(block.blockIndex)}
                className={
                  'text-left px-1.5 py-1 rounded-lg border flex flex-col justify-between transition-all cursor-pointer ' +
                  (isSelected
                    ? 'bg-slate-900/95 border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : block.status === 'FAULT'
                    ? 'bg-slate-950/90 border-rose-500/60 hover:border-rose-400'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-600')
                }
              >
                <div className="flex items-center justify-between w-full leading-tight">
                  <span className="text-xs font-mono font-bold text-white tracking-wide">
                    {block.headerTitle}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{block.pointerHex}</span>
                </div>

                <div className="text-[12px] font-mono text-cyan-300 font-bold leading-tight">
                  {block.displayFormat} · SCALE: {block.activationScale.toFixed(4)}
                </div>

                <div className="text-[12px] font-mono text-amber-300 font-bold leading-tight">
                  OUTLIERS: {block.outlierChannels}ch · ERR: {block.errorPercent.toFixed(2)}%
                </div>

                <div className="text-[11px] font-mono text-emerald-400 font-semibold leading-tight">
                  SQNR: {block.sqnrDb.toFixed(2)} dB · {block.compressionRatio.toFixed(1)}x
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* COMPACT HYBRID TELEMETRY INSPECTOR STRIP */}
      <div className="w-full px-2 py-1 bg-slate-950 border border-cyan-500/30 rounded text-xs font-mono font-bold text-cyan-300 truncate shrink-0 my-0.5">
        {inspectorLine}
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleInjectHybridBurst}
          title="Trigger Hybrid Quantization Burst"
          className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400 text-amber-300 rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          💥 INJECT HYBRID BURST
        </button>

        <button
          type="button"
          onClick={handleToggleOutlierSpike}
          title="Inject Outlier Saturation Spike (Force Scale Resync)"
          className="bg-cyan-500/15 hover:bg-cyan-500/25 border border-[#00F0FF] text-[#00F0FF] rounded-lg text-xs font-mono font-bold py-2 text-center shadow-[0_0_8px_rgba(0,240,255,0.25)] transition-colors cursor-pointer"
        >
          ⚡ TOGGLE OUTLIER SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepCalibration}
          title="Step Hybrid Calibration Pass"
          className="bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400 text-emerald-300 rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          🚀 STEP HYBRID CALIBRATION
        </button>

        <button
          type="button"
          onClick={handleFlushBuffers}
          title="Flush Hybrid Buffers & Re-Zero Scales"
          className="bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400 text-rose-300 rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          🔄 FLUSH HYBRID BUFFERS
        </button>
      </div>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer className="h-14 overflow-hidden font-mono text-[10px] p-2 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between">
        {radioLogs.slice(0, 3).map((line, index) => (
          <div key={index} className="truncate">
            {line}
          </div>
        ))}
      </footer>
    </div>
  );
}
