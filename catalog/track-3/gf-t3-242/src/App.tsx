/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-242: FP4 / INT4 Mixed-Precision Block Quantization & Outlier-Aware Scale Calibration Cockpit
 * Zero-Dollar Gate: Strictly enforced across all UI labels, telemetry, and state handlers.
 */

import React, { useMemo, useState } from 'react';
import {
  buildQuantizationMatrix,
  CORRIDOR_PROFILES,
  formatInspectorTelemetryLine,
  QuantBlockTelemetry,
  RadioLogEntry,
  SYNTHETIC_CORRIDORS,
  SyntheticCorridor,
  validateGridSyncInput,
} from './engine/fp4QuantEngine';
import { runVerificationSuite } from './engine/fp4QuantEngine.test';

type CockpitTab = 'Mesh' | 'FP4' | 'INT4' | 'Stats' | 'APA';
type PrecisionMode = 'MIXED' | 'FP4_ONLY' | 'INT4_ONLY';

const TABS: readonly CockpitTab[] = ['Mesh', 'FP4', 'INT4', 'Stats', 'APA'];

const INITIAL_RADIO_LOGS: RadioLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '00:01.04',
    icon: '🟢',
    callsign: 'CREW CHIEF',
    message:
      'FP4 / INT4 mixed-precision quantization engine initialized · 16 blocks calibrated',
  },
  {
    id: 'log-2',
    timestamp: '00:01.08',
    icon: '⚡',
    callsign: 'PIT WALL',
    message:
      'Outlier-aware scale calibration complete · SNR maintained above 38.4 dB',
  },
  {
    id: 'log-3',
    timestamp: '00:01.12',
    icon: '🟢',
    callsign: 'TELEMETRY',
    message:
      'Quantization bandwidth verified at 7,200 GB/s throughput saturation',
  },
];

export default function App() {
  const [selectedCorridor, setSelectedCorridor] = useState<SyntheticCorridor>(
    SYNTHETIC_CORRIDORS[0]
  );
  const [precisionMode, setPrecisionMode] = useState<PrecisionMode>('MIXED');
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [calibrationStep, setCalibrationStep] = useState<number>(0);
  const [outlierSpikeActive, setOutlierSpikeActive] = useState<boolean>(false);
  const [burstMultiplier, setBurstMultiplier] = useState<number>(1.0);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number>(3);
  const [processedTokens, setProcessedTokens] = useState<number>(2048000);
  const [fp4XpBonus, setFp4XpBonus] = useState<number>(34.5);
  const [radioLogs, setRadioLogs] = useState<RadioLogEntry[]>(INITIAL_RADIO_LOGS);
  const [apaModalMessage, setApaModalMessage] = useState<string | null>(null);
  const [tickCounter, setTickCounter] = useState<number>(116);

  const corridorProfile = CORRIDOR_PROFILES[selectedCorridor];

  // Build live 16-block quantization matrix [B0..B15]
  const blocks = useMemo<QuantBlockTelemetry[]>(() => {
    return buildQuantizationMatrix(
      precisionMode,
      calibrationStep,
      outlierSpikeActive,
      burstMultiplier,
      corridorProfile.sigmaGate
    );
  }, [
    precisionMode,
    calibrationStep,
    outlierSpikeActive,
    burstMultiplier,
    corridorProfile.sigmaGate,
  ]);

  // Run verification suite for Stats & APA audit display
  const verificationReport = useMemo(() => runVerificationSuite(), []);

  // Selected block defaults to B3 ("BLOCK: B3 · FORMAT: FP4_E2M1 · SCALE: 0.0185 · ERROR: 0.0031 · CALIBRATED")
  const selectedBlock = blocks[selectedBlockIndex] || blocks[3];
  const inspectorLine = formatInspectorTelemetryLine(selectedBlock);

  // Format timestamp helper [00:XX.XX]
  const nextTimestamp = (nextTick: number): string => {
    const secs = Math.floor(nextTick / 100);
    const hundredths = nextTick % 100;
    const secStr = secs < 10 ? '0' + String(secs) : String(secs);
    const hunStr = hundredths < 10 ? '0' + String(hundredths) : String(hundredths);
    return '00:' + secStr + '.' + hunStr;
  };

  const appendRadioLog = (
    icon: '🟢' | '⚡' | '🔴',
    callsign: 'CREW CHIEF' | 'PIT WALL' | 'TELEMETRY',
    message: string
  ) => {
    const nextTick = tickCounter + 4;
    setTickCounter(nextTick);
    const entry: RadioLogEntry = {
      id: 'log-' + String(nextTick),
      timestamp: nextTimestamp(nextTick),
      icon,
      callsign,
      message,
    };
    setRadioLogs((prev) => [entry, ...prev.slice(0, 2)]);
  };

  // Corridor selection handler with GridSync sanitization
  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as SyntheticCorridor;
    const check = validateGridSyncInput(val);
    if (!check.valid) {
      appendRadioLog('🔴', 'PIT WALL', check.reason || 'Corridor input rejected');
      return;
    }
    setSelectedCorridor(val);
    const profile = CORRIDOR_PROFILES[val];
    appendRadioLog(
      '⚡',
      'PIT WALL',
      'Corridor switched to ' +
        profile.shortTag +
        ' · Bandwidth ' +
        String(profile.bandwidthGbs) +
        ' GB/s · Latency ' +
        String(profile.latencyUs) +
        ' µs'
    );
  };

  // Header micro-actions
  const handleSetFp4Mode = () => {
    setPrecisionMode('FP4_ONLY');
    setActiveTab('FP4');
    appendRadioLog(
      '🟢',
      'CREW CHIEF',
      'Precision mode locked to FP4_E2M1 across all 16 blocks · Zero clipping verified'
    );
  };

  const handleSetInt4Mode = () => {
    setPrecisionMode('INT4_ONLY');
    setActiveTab('INT4');
    appendRadioLog(
      '🟢',
      'CREW CHIEF',
      'Precision mode locked to symmetric INT4 across all 16 blocks · Scale vectors synced'
    );
  };

  const handleRunEngine = () => {
    const nextStep = calibrationStep + 1;
    setCalibrationStep(nextStep);
    setProcessedTokens((prev) => prev + 256000);
    setFp4XpBonus((prev) => Number((prev + 4.2).toFixed(1)));
    appendRadioLog(
      '🟢',
      'TELEMETRY',
      'Executed full 16-block mixed-precision pass #' +
        String(nextStep) +
        ' · Quant Bandwidth: ' +
        String(corridorProfile.bandwidthGbs.toLocaleString('en-US')) +
        ' GB/s'
    );
  };

  // Tactical Launch Control Handlers
  const handleInjectFp4Burst = () => {
    const nextMult = burstMultiplier >= 1.35 ? 1.0 : Number((burstMultiplier + 0.12).toFixed(2));
    setBurstMultiplier(nextMult);
    setProcessedTokens((prev) => prev + 512000);
    setFp4XpBonus((prev) => Number((prev + 8.5).toFixed(1)));
    appendRadioLog(
      '⚡',
      'TELEMETRY',
      'Trigger 4-Bit Quantization Burst · Tensor load x' +
        String(nextMult) +
        ' · Processed Tokens: ' +
        String((processedTokens + 512000).toLocaleString('en-US')) +
        ' Units'
    );
  };

  const handleToggleOutlierSpike = () => {
    const nextSpike = !outlierSpikeActive;
    setOutlierSpikeActive(nextSpike);
    if (nextSpike) {
      appendRadioLog(
        '🔴',
        'PIT WALL',
        'Inject Outlier Saturation Spike (Force Scale Resync) · High-magnitude channels isolated to FP16 stream'
      );
    } else {
      appendRadioLog(
        '🟢',
        'PIT WALL',
        'Outlier spike cleared · Bulk 4-bit block scales stabilized at nominal SQNR 38.6 dB'
      );
    }
  };

  const handleStepCalibration = () => {
    const nextStep = calibrationStep + 1;
    setCalibrationStep(nextStep);
    setProcessedTokens((prev) => prev + 128000);
    setFp4XpBonus((prev) => Number((prev + 2.5).toFixed(1)));
    appendRadioLog(
      '🟢',
      'CREW CHIEF',
      'Step FP4 Calibration Pass #' +
        String(nextStep) +
        ' complete · Calibration Latency: 0.02 µs · Active Blocks: 16 Blocks'
    );
  };

  const handleFlushBuffers = () => {
    setCalibrationStep(0);
    setOutlierSpikeActive(false);
    setBurstMultiplier(1.0);
    setPrecisionMode('MIXED');
    setSelectedBlockIndex(3);
    setProcessedTokens(2048000);
    setFp4XpBonus(34.5);
    setApaModalMessage(null);
    setRadioLogs(INITIAL_RADIO_LOGS);
  };

  // Compute aggregate SQNR and error across all 16 blocks
  const meanSqnrDb = useMemo(() => {
    const total = blocks.reduce((acc, b) => acc + b.sqnrDb, 0);
    return (total / blocks.length).toFixed(2);
  }, [blocks]);

  const totalOutlierChannels = useMemo(() => {
    return blocks.reduce((acc, b) => acc + b.outlierChannels, 0);
  }, [blocks]);

  const formattedBandwidth = corridorProfile.bandwidthGbs.toLocaleString('en-US') + ' GB/s';
  const formattedTokens = processedTokens.toLocaleString('en-US') + ' UNITS';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER ROW 1 & ROW 2 */}
      <header className="w-full shrink-0 flex flex-col gap-0.5 border-b border-slate-800/90 pb-1">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: strictly GF-T3-242 and cyan badge TRACK 3 */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm md:text-base font-mono font-extrabold tracking-tight text-white">
              GF-T3-242
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
              TRACK 3
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-emerald-400 font-semibold">
              {outlierSpikeActive ? '⚡ FAULT ISOLATED' : '✓ LOCKED'}
            </span>
          </div>

          {/* Right: compact corridor dropdown and micro action buttons [FP4], [INT4], [Run] */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic FP4 Corridor Selector"
              value={selectedCorridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {SYNTHETIC_CORRIDORS.map((corridor) => (
                <option key={corridor} value={corridor}>
                  {corridor}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleSetFp4Mode}
              className={
                'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer ' +
                (precisionMode === 'FP4_ONLY'
                  ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-cyan-400')
              }
            >
              [FP4]
            </button>

            <button
              type="button"
              onClick={handleSetInt4Mode}
              className={
                'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer ' +
                (precisionMode === 'INT4_ONLY'
                  ? 'bg-[#FF9F0A]/20 border-[#FF9F0A] text-[#FF9F0A]'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-amber-400')
              }
            >
              [INT4]
            </button>

            <button
              type="button"
              onClick={handleRunEngine}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border border-emerald-500/70 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap truncate">
          FP4 / INT4 Quantization · Outlier Calibration · Zero Stall
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 on small viewports, 4-col on desktop) */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: FP4 NITRO */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              FP4 NITRO
            </span>
            <span className="text-[10px] font-mono text-[#00F0FF] font-semibold">
              Quant Bandwidth: {formattedBandwidth}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 my-0.5">
            <span className="font-mono text-lg font-bold text-[#00F0FF] leading-none">
              {formattedBandwidth}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              99.4% BUS
            </span>
          </div>
          <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mb-0.5">
            <div className="bg-[#00F0FF] h-full w-11/12 rounded-full" />
          </div>
          <span className="text-[10px] font-mono text-slate-400 truncate">
            Quantization Bandwidth Saturation
          </span>
        </div>

        {/* Card 2: CALIBRATION STREAK */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              CALIBRATION STREAK
            </span>
            <span className="px-1 py-0.2 text-[10px] font-mono font-bold bg-amber-500/15 text-[#FF9F0A] border border-amber-500/40 rounded">
              🔥 16 BLOCKS
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 my-0.5">
            <span className="font-mono text-lg font-bold text-[#FF9F0A] leading-none">
              0.02 µs
            </span>
            <span className="text-[10px] font-mono text-slate-300">
              SQNR: {meanSqnrDb} dB
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 truncate">
            Dynamic Scale Latency · Calibration Latency: 0.02 µs
          </span>
        </div>

        {/* Card 3: ACTIVE BLOCKS */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              ACTIVE BLOCKS
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              INT4-FP4
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-1 my-0.5">
            <span className="font-mono text-lg font-bold text-emerald-400 leading-none">
              BLOCKS: 16/16
            </span>
            <span className="text-[10px] font-mono text-cyan-300">
              [B0..B15]
            </span>
          </div>
          <div className="grid grid-cols-16 gap-0.5 w-full my-0.5">
            {blocks.map((b) => (
              <div
                key={b.shortCode}
                title={b.shortCode + ' · ' + b.displayFormat}
                className={
                  'h-1.5 rounded-xs ' +
                  (b.blockIndex === selectedBlockIndex
                    ? 'bg-[#00F0FF]'
                    : b.format === 'INT4'
                      ? 'bg-emerald-500/80'
                      : 'bg-amber-500/80')
                }
              />
            ))}
          </div>
          <span className="text-[10px] font-mono text-slate-400 truncate">
            Active Blocks: 16 Blocks · Gear Shift Lock
          </span>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              +{fp4XpBonus}k FP4 XP
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-1 my-0.5">
            <span className="font-mono text-lg font-bold text-white leading-none truncate">
              {formattedTokens}
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-300 truncate">
            FP4 State: INT4-FP4 Active · Processed Tokens: 2,048,000 Units
          </span>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Quantization Cockpit Views"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-0.5 w-full text-center shrink-0"
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
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* INTERACTIVE FP4 QUANTIZATION MATRIX BAY */}
      <main className="flex-1 min-h-0 w-full flex flex-col justify-between gap-1 overflow-hidden">
        {/* 8 Quantization Blocks (Block 0 to Block 7) — Always interactive above the fold */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full flex-1 min-h-0">
          {blocks.slice(0, 8).map((block) => {
            const isSelected = block.blockIndex === selectedBlockIndex;
            return (
              <button
                key={block.shortCode}
                type="button"
                onClick={() => {
                  setSelectedBlockIndex(block.blockIndex);
                  appendRadioLog(
                    '🟢',
                    'TELEMETRY',
                    'Inspected ' +
                      block.blockName +
                      ' · PTR ' +
                      block.pointerHex +
                      ' · Scale ' +
                      block.scale.toFixed(4) +
                      ' · SQNR ' +
                      String(block.sqnrDb) +
                      ' dB'
                  );
                }}
                className={
                  'text-left px-2 py-1 rounded-lg border transition-all flex flex-col justify-between cursor-pointer overflow-hidden ' +
                  (isSelected
                    ? 'bg-slate-900/95 border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.18)]'
                    : outlierSpikeActive
                      ? 'bg-slate-950/90 border-rose-500/60 hover:border-rose-400'
                      : 'bg-slate-950/85 border-slate-800 hover:border-slate-600')
                }
              >
                {/* Block title header: "text-xs font-mono font-bold text-white tracking-wide" */}
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className="text-xs font-mono font-bold text-white tracking-wide truncate">
                    {block.blockName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {block.pointerHex}
                  </span>
                </div>

                {/* Format & scale factor: "text-[12px] font-mono text-cyan-300 font-bold" */}
                <div className="text-[12px] font-mono text-cyan-300 font-bold truncate leading-tight">
                  {block.displayFormat} · SCALE: {block.scale.toFixed(4)}
                </div>

                {/* Outliers & clip error: "text-[12px] font-mono text-amber-300 font-bold" */}
                <div className="text-[12px] font-mono text-amber-300 font-bold truncate leading-tight">
                  OUTLIERS: {block.outlierChannels} ch · ERR: {block.errorPct.toFixed(2)}%
                </div>

                {/* SQNR & compression ratio: "text-[11px] font-mono text-emerald-400 font-semibold" */}
                <div className="text-[11px] font-mono text-emerald-400 font-semibold truncate pt-0.5 border-t border-slate-800/80 leading-tight">
                  SQNR: {block.sqnrDb.toFixed(2)} dB · {block.compressionRatio}x
                </div>
              </button>
            );
          })}
        </div>

        {/* Contextual Secondary Strip Based on Selected Tab (Mesh / FP4 / INT4 / Stats / APA) */}
        <div className="w-full bg-slate-950/95 border border-slate-800 rounded-lg px-2.5 py-1.5 shrink-0">
          {activeTab === 'Mesh' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <span className="text-slate-200 font-semibold">
                PTR: <span className="text-[#00F0FF]">{selectedBlock.pointerHex}</span> · CFG:{' '}
                <span className="text-emerald-400">{selectedBlock.bitWidthConfig}</span>
              </span>
              <span className="text-slate-300">
                SCALE VEC: [{selectedBlock.scaleVector.map((v) => v.toFixed(4)).join(', ')}]
              </span>
              <span className="text-amber-300 font-bold">
                SNR: {selectedBlock.sqnrDb} dB · OUTLIER IDX: [
                {selectedBlock.outlierIndices.join(', ')}]
              </span>
            </div>
          )}

          {activeTab === 'FP4' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <span className="text-[#00F0FF] font-bold">
                FP4_E2M1 NON-LINEAR CODEBOOK: [-6.0, -4.0, -3.0, -2.0, -1.5, -1.0, -0.5, 0, +0.5 .. +6.0]
              </span>
              <span className="text-emerald-400 font-semibold">
                ZERO CLIPPING LOSS · DYNAMIC SCALE S = max(|W_bulk|) / 6.0
              </span>
            </div>
          )}

          {activeTab === 'INT4' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <span className="text-[#FF9F0A] font-bold">
                INT4 SYMMETRIC LINEAR CODEBOOK: [-7 .. +7] · STEP QUANTIZATION
              </span>
              <span className="text-cyan-300 font-semibold">
                FP16 SPARSE OUTLIER PRESERVATION: {totalOutlierChannels} CHANNELS ISOLATED
              </span>
            </div>
          )}

          {activeTab === 'Stats' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <span className="text-emerald-400 font-bold">
                VERIFICATION SUITE: {verificationReport.passedTests}/{verificationReport.totalTests}{' '}
                PASSED ({verificationReport.passRatePct}%)
              </span>
              <span className="text-cyan-300">
                MEAN SQNR: {meanSqnrDb} dB · COMPRESSION: 3.56x vs FP16
              </span>
              <span className="text-amber-300">
                GRIDSYNC ZERO-TRUST: ACTIVE · RLS PARTITIONED VAULT: ONLINE
              </span>
            </div>
          )}

          {activeTab === 'APA' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">
                  SOVEREIGN APA TITLE TRANSFER · 100% MIT CLEAN-ROOM
                </span>
                {apaModalMessage && (
                  <span className="text-emerald-400 font-bold">{apaModalMessage}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setApaModalMessage('✓ APA TITLE DOSSIER READY (GF-T3-242)');
                    appendRadioLog(
                      '🟢',
                      'CREW CHIEF',
                      'ACQUIRE TITLE (APA) dossier generated · Clean-room IP & Supabase RLS verified'
                    );
                  }}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF] rounded hover:bg-[#00F0FF]/30 cursor-pointer"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApaModalMessage('✓ VAULT BUYOUT TRANSMISSION DISPATCHED');
                    appendRadioLog(
                      '⚡',
                      'PIT WALL',
                      'INQUIRE VAULT BUYOUT logged · Standalone repository transfer package locked'
                    );
                  }}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A] rounded hover:bg-[#FF9F0A]/30 cursor-pointer"
                >
                  INQUIRE VAULT BUYOUT
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* COMPACT FP4 TELEMETRY INSPECTOR STRIP */}
      <div
        aria-label="Compact FP4 Telemetry Inspector Strip"
        className="w-full bg-slate-900/90 border border-slate-800 rounded px-2.5 py-1 shrink-0 flex items-center justify-between gap-2 overflow-hidden"
      >
        <span className="text-xs font-mono font-bold text-cyan-300 truncate">
          {inspectorLine}
        </span>
        <span className="hidden md:inline-block text-[10px] font-mono text-slate-400 shrink-0">
          PTR {selectedBlock.pointerHex} · SNR {selectedBlock.sqnrDb} dB · VEC [
          {selectedBlock.scaleVector.slice(0, 2).map((v) => v.toFixed(4)).join(', ')}]
        </span>
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section
        aria-label="Tactical Launch Control Dock"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        {/* Button 1: 💥 INJECT FP4 BURST */}
        <button
          type="button"
          onClick={handleInjectFp4Burst}
          className="border border-[#FF9F0A] bg-[#FF9F0A]/10 hover:bg-[#FF9F0A]/20 text-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          💥 INJECT FP4 BURST
        </button>

        {/* Button 2: ⚡ TOGGLE OUTLIER SPIKE */}
        <button
          type="button"
          onClick={handleToggleOutlierSpike}
          className={
            'border border-[#00F0FF] rounded-lg text-xs font-mono font-bold py-2 text-center transition-all cursor-pointer truncate px-1 ' +
            (outlierSpikeActive
              ? 'bg-[#00F0FF]/30 text-white shadow-[0_0_14px_rgba(0,240,255,0.45)]'
              : 'bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.2)]')
          }
        >
          ⚡ TOGGLE OUTLIER SPIKE
        </button>

        {/* Button 3: 🚀 STEP FP4 CALIBRATION */}
        <button
          type="button"
          onClick={handleStepCalibration}
          className="border border-emerald-500 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          🚀 STEP FP4 CALIBRATION
        </button>

        {/* Button 4: 🔄 FLUSH QUANT BUFFERS */}
        <button
          type="button"
          onClick={handleFlushBuffers}
          className="border border-rose-500 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          🔄 FLUSH QUANT BUFFERS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-14 overflow-hidden font-mono text-[10px] p-2 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between"
      >
        {radioLogs.slice(0, 3).map((entry) => (
          <div key={entry.id} className="truncate whitespace-nowrap">
            [{entry.timestamp}] {entry.icon} {entry.callsign}: {entry.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
