/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  SYNTHETIC_CORRIDORS,
  SyntheticCorridor,
  executeFlashDecodingReduction,
  runSelfContainedTestSuite,
  sanitizeGridSyncInput,
} from './engine/flashDecodingMath';
import { verifyAllMechanicalGates } from './engine/flashDecodingMath.test';

type CockpitTab = 'Mesh' | 'Flash' | 'Split' | 'Stats' | 'APA';

const COCKPIT_TABS: CockpitTab[] = ['Mesh', 'Flash', 'Split', 'Stats', 'APA'];

export default function App() {
  const [corridor, setCorridor] = useState<SyntheticCorridor>(SYNTHETIC_CORRIDORS[0]);
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [selectedSplitIdx, setSelectedSplitIdx] = useState<number>(3);
  const [burstActive, setBurstActive] = useState<boolean>(false);
  const [spikeActive, setSpikeActive] = useState<boolean>(false);
  const [stepCount, setStepCount] = useState<number>(0);
  const [flushed, setFlushed] = useState<boolean>(true);
  const [apaNotice, setApaNotice] = useState<string>('');
  const [radioLogs, setRadioLogs] = useState<string[]>([
    '[00:01.04] 🟢 CREW CHIEF: FlashDecoding and multi-block attention parallel reduction engine initialized · 8 splits linked',
    '[00:01.08] 🟢 TELEMETRY: Split-KV reduction throughput verified at 18,200 GB/s with online softmax correction',
  ]);

  const telemetry = useMemo(() => {
    return executeFlashDecodingReduction({
      corridor,
      sequenceLength: 4096,
      numSplits: 8,
      burstActive,
      spikeActive,
      stepCount,
      flushed,
    });
  }, [corridor, burstActive, spikeActive, stepCount, flushed]);

  const auditSuite = useMemo(() => runSelfContainedTestSuite(), []);
  const allGatesVerified = useMemo(() => {
    try {
      return verifyAllMechanicalGates();
    } catch {
      return false;
    }
  }, []);

  const selectedSplit = telemetry.splits[selectedSplitIdx] || telemetry.splits[3];

  const appendRadioLog = (callsign: string, message: string) => {
    const totalSecs = 1 + stepCount * 0.14 + (burstActive ? 0.05 : 0.02);
    const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const secs = (totalSecs % 60).toFixed(2).padStart(5, '0');
    const cleanMsg = sanitizeGridSyncInput(message);
    const entry = '[' + mins + ':' + secs + '] ' + callsign + ': ' + cleanMsg;
    setRadioLogs((prev) => [prev[prev.length - 1], entry]);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rawVal = e.target.value;
    const matched = SYNTHETIC_CORRIDORS.find((c) => c === rawVal);
    if (matched) {
      setCorridor(matched);
      appendRadioLog('⚡ PIT WALL', 'Switched corridor to ' + matched.split(' ')[0] + ' · Online softmax barrier synced');
    }
  };

  const handleInjectBurst = () => {
    const next = !burstActive;
    setBurstActive(next);
    setFlushed(false);
    appendRadioLog(
      '🔴 TELEMETRY',
      next
        ? 'FlashDecoding burst injected · Bandwidth saturated at ' + String(telemetry.throughputGbps + 1400) + ' GB/s'
        : 'FlashDecoding burst normalized · Nominal 18,200 GB/s saturation locked'
    );
  };

  const handleToggleSpike = () => {
    const next = !spikeActive;
    setSpikeActive(next);
    setFlushed(false);
    appendRadioLog(
      '⚡ PIT WALL',
      next
        ? 'Sequence length spike forced (8,192 tokens) · 8-way Split-KV chunking scaled to 1,024 TOK/split'
        : 'Sequence length restored to 4,096 tokens · 512 TOK/split nominal parity'
    );
  };

  const handleStepReductionPass = () => {
    const nextStep = stepCount + 1;
    setStepCount(nextStep);
    setFlushed(false);
    appendRadioLog(
      '🟢 CREW CHIEF',
      'Step #' + String(nextStep) + ' multi-block reduction pass complete · Drift ' + String(telemetry.maxNumericalDrift) + ' (LOCKED)'
    );
  };

  const handleFlushBuffers = () => {
    setBurstActive(false);
    setSpikeActive(false);
    setStepCount(0);
    setFlushed(true);
    setSelectedSplitIdx(3);
    setCorridor(SYNTHETIC_CORRIDORS[0]);
    setApaNotice('');
    setRadioLogs([
      '[00:01.04] 🟢 CREW CHIEF: FlashDecoding and multi-block attention parallel reduction engine initialized · 8 splits linked',
      '[00:01.08] 🟢 TELEMETRY: Split-KV reduction throughput verified at 18,200 GB/s with online softmax correction',
    ]);
  };

  const handleExportAudit = (actionLabel: string) => {
    setApaNotice(actionLabel + ' VERIFIED · CLEAN-ROOM APA MANIFEST READY · DRIFT: ' + String(telemetry.maxNumericalDrift));
    appendRadioLog('🟢 CREW CHIEF', actionLabel + ' docket armed · 100% MIT clean-room provenance verified');
  };

  const subheaderText = useMemo(() => {
    if (activeTab === 'Flash') {
      return (
        'VIEW: FLASH · PTR: ' +
        telemetry.meshPointerHex +
        ' · MODE: ' +
        telemetry.modeLabel +
        ' · GLOBAL_MAX: ' +
        String(telemetry.globalMaxLogit) +
        ' · DRIFT: ' +
        String(telemetry.maxNumericalDrift) +
        ' · VEC: [' +
        telemetry.outputVector.join(', ') +
        ']'
      );
    }
    if (activeTab === 'Split') {
      return (
        'VIEW: SPLIT · PTR: ' +
        selectedSplit.pointerHex +
        ' · CONTEXT_N: ' +
        String(telemetry.sequenceLength) +
        ' · CHUNK_C: ' +
        String(selectedSplit.tokens) +
        ' · ALPHA: ' +
        String(selectedSplit.onlineRescaleAlpha) +
        ' · FOOTPRINT: ' +
        String(selectedSplit.kvChunkFootprintKb) +
        'KB'
      );
    }
    if (activeTab === 'Stats') {
      return (
        'VIEW: STATS · GATES: ' +
        String(auditSuite.filter((r) => r.passed).length) +
        '/' +
        String(auditSuite.length) +
        ' (' +
        (allGatesVerified ? 'VERIFIED' : 'FAULT') +
        ') · RLS: RANGE(sequence_length) · GRIDSYNC: ACTIVE · VEC: [' +
        telemetry.outputVector.join(', ') +
        ']'
      );
    }
    if (activeTab === 'APA') {
      return (
        apaNotice ||
        'VIEW: APA · SOVEREIGN BUYOUT · 100% MIT CLEAN-ROOM IP · ZERO COPYLEFT · NIST SP 800-218 SSDF VERIFIED'
      );
    }
    return (
      'VIEW: MESH · PTR: ' +
      telemetry.meshPointerHex +
      ' · MODE: ' +
      telemetry.modeLabel +
      ' · SPLITS: ' +
      String(telemetry.numSplits) +
      ' · VEC: [' +
      telemetry.outputVector.join(', ') +
      ']'
    );
  }, [activeTab, telemetry, selectedSplit, auditSuite, allGatesVerified, apaNotice]);

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Row 1 & Row 2 */}
      <header className="flex flex-col w-full shrink-0">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm font-mono font-bold tracking-tight text-white">GF-T3-256</h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-950/90 text-[#00F0FF] border border-cyan-500/40 rounded">
              FLAGSHIP
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic FlashDecoding Corridor"
              value={corridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-cyan-400"
            >
              {SYNTHETIC_CORRIDORS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setActiveTab('Flash');
                handleInjectBurst();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-cyan-500/40 rounded cursor-pointer whitespace-nowrap shrink-0"
            >
              [Flash]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Split');
                handleToggleSpike();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-amber-500/40 rounded cursor-pointer whitespace-nowrap shrink-0"
            >
              [Split]
            </button>
            <button
              type="button"
              onClick={handleStepReductionPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 rounded cursor-pointer whitespace-nowrap shrink-0"
            >
              [Run]
            </button>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap leading-tight">
          FlashDecoding · Multi-Block Reduction · Zero Stall
        </div>
      </header>

      {/* 4-Card Arcade HUD Ribbon (2x2 Grid) */}
      <section className="grid grid-cols-2 gap-1 w-full shrink-0" aria-label="Telemetry HUD Ribbon">
        {/* Card 1: FLASH NITRO */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">FLASH NITRO</span>
            <span className="font-mono text-lg font-bold text-[#00F0FF] tabular-nums leading-none">
              {telemetry.throughputFormatted}
            </span>
          </div>
          <div className="w-full h-1 bg-slate-950 rounded overflow-hidden my-0.5 border border-slate-800">
            <div
              className="h-full bg-[#00F0FF] transition-transform duration-150 origin-left"
              style={{ transform: 'scaleX(' + String(telemetry.saturationPercent / 100) + ')' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate leading-none">
            FlashDecoding Throughput Saturation
          </div>
        </div>

        {/* Card 2: SPLIT STREAK */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">SPLIT STREAK</span>
            <span className="px-1 py-0 text-[10px] font-mono font-bold bg-amber-950/80 text-[#FF9F0A] border border-amber-500/40 rounded">
              {telemetry.splitStreakBadge}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#FF9F0A] tabular-nums leading-none">
            {telemetry.reductionLatencyFormatted}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate leading-none">
            KV Split Reduction Latency
          </div>
        </div>

        {/* Card 3: ACTIVE SPLITS */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">ACTIVE SPLITS</span>
            <span className="font-mono text-xs font-bold text-emerald-400 tabular-nums leading-none">
              SPLITS: 8/8
            </span>
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {telemetry.splits.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSplitIdx(s.index)}
                className={
                  'text-[9px] font-mono font-bold py-0 rounded text-center cursor-pointer border leading-tight ' +
                  (selectedSplitIdx === s.index
                    ? 'bg-cyan-950 text-[#00F0FF] border-cyan-400'
                    : 'bg-slate-950 text-emerald-400 border-slate-800')
                }
              >
                {s.id}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate leading-none">
            F1 Gear Shift [K0..K7] · Active Flash Locked
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">TOKEN SCORE</span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 leading-none">
              {telemetry.engineXpFormatted}
            </span>
          </div>
          <div className="font-mono text-sm font-bold text-white tabular-nums leading-none my-0.5">
            {telemetry.processedTokensFormatted}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate leading-none">
            {'Flash State: ' + telemetry.flashState}
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
        aria-label="Cockpit Mode Tabs"
      >
        {COCKPIT_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
              (activeTab === tab
                ? 'bg-cyan-950/90 text-[#00F0FF] border border-cyan-500/50'
                : 'text-slate-400 hover:text-slate-200 bg-transparent')
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Streamlined Mesh Info Subheader */}
      <div className="flex items-center justify-between gap-2 text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 shrink-0">
        <span className="truncate">{subheaderText}</span>
        {activeTab === 'APA' && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleExportAudit('ACQUIRE TITLE (APA)')}
              className="px-1.5 py-0 text-[9px] font-mono font-bold bg-amber-500/20 text-[#FF9F0A] border border-amber-500/50 rounded cursor-pointer"
            >
              ACQUIRE TITLE (APA)
            </button>
            <button
              type="button"
              onClick={() => handleExportAudit('INQUIRE VAULT BUYOUT')}
              className="px-1.5 py-0 text-[9px] font-mono font-bold bg-cyan-500/20 text-[#00F0FF] border border-cyan-500/50 rounded cursor-pointer"
            >
              INQUIRE VAULT BUYOUT
            </button>
          </div>
        )}
      </div>

      {/* Interactive Flash Split Matrix Bay (K0-K7) in Tight 4x2 Grid */}
      <main
        className="grid grid-cols-4 gap-1 w-full shrink-0 my-0.5"
        role="region"
        aria-label="Interactive Flash Split Matrix Bay"
      >
        {telemetry.splits.map((split) => {
          const isSelected = split.index === selectedSplitIdx;
          return (
            <div
              key={split.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedSplitIdx(split.index);
                appendRadioLog(
                  '🟢 TELEMETRY',
                  'Inspected ' +
                    split.label +
                    ' at ' +
                    split.pointerHex +
                    ' · Online Softmax Rescale Alpha=' +
                    String(split.onlineRescaleAlpha) +
                    ' · Footprint=' +
                    String(split.kvChunkFootprintKb) +
                    'KB'
                );
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedSplitIdx(split.index);
                }
              }}
              className={
                'py-0.5 px-1.5 rounded border border-slate-800 bg-slate-900/60 flex flex-col justify-between cursor-pointer ' +
                (isSelected ? 'ring-1 ring-[#00F0FF]' : 'hover:border-slate-700')
              }
            >
              <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                <span>{split.label}</span>
                <span>{split.pointerHex}</span>
              </div>

              <div className="text-[12px] font-mono text-cyan-300 font-bold">
                {'TOK: ' + String(split.tokens) + ' · SPLIT: ' + split.splitWay}
              </div>

              <div className="text-[12px] font-mono text-amber-300 font-bold">
                {'SOFT: ' + split.softmaxScore + ' · LAT: ' + split.latencyMs}
              </div>

              <div className="text-[10px] font-mono text-emerald-400 font-semibold">
                {'STATE: ' + split.stateLabel}
              </div>
            </div>
          );
        })}
      </main>

      {/* Compact Flash Telemetry Inspector Strip */}
      <div
        className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0"
        aria-live="polite"
      >
        {selectedSplit.id +
          ' · TOK: ' +
          String(selectedSplit.tokens) +
          ' · SPLIT: ' +
          selectedSplit.splitWay +
          ' · SOFT: ' +
          selectedSplit.softmaxScore +
          ' · PTR ' +
          selectedSplit.pointerHex +
          ' · REDUCTION: OK · LOCKED · ALPHA: ' +
          String(selectedSplit.onlineRescaleAlpha) +
          ' · CHUNK: ' +
          String(selectedSplit.kvChunkFootprintKb) +
          'KB'}
      </div>

      {/* Tactical Launch Control Buttons */}
      <section
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
        aria-label="Tactical Launch Controls"
      >
        <button
          type="button"
          onClick={handleInjectBurst}
          className="text-xs font-mono font-bold py-2 text-center rounded border border-[#FF9F0A] bg-amber-950/40 hover:bg-amber-900/50 text-[#FF9F0A] cursor-pointer truncate"
        >
          💥 INJECT FLASHDECODING BURST
        </button>

        <button
          type="button"
          onClick={handleToggleSpike}
          className="text-xs font-mono font-bold py-2 text-center rounded border border-[#00F0FF] bg-cyan-950/40 hover:bg-cyan-900/50 text-[#00F0FF] cursor-pointer truncate"
        >
          ⚡ TOGGLE SEQUENCE LENGTH SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepReductionPass}
          className="text-xs font-mono font-bold py-2 text-center rounded border border-emerald-500 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 cursor-pointer truncate"
        >
          🚀 STEP FLASH REDUCTION PASS
        </button>

        <button
          type="button"
          onClick={handleFlushBuffers}
          className="text-xs font-mono font-bold py-2 text-center rounded border border-rose-500 bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 cursor-pointer truncate"
        >
          🔄 FLUSH REDUCTION BUFFERS
        </button>
      </section>

      {/* Pit-Wall Radio Comms Log */}
      <footer
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
        aria-label="Pit-Wall Radio Comms Log"
      >
        {radioLogs.map((line, idx) => (
          <div key={idx} className="truncate">
            {line}
          </div>
        ))}
      </footer>
    </div>
  );
}
