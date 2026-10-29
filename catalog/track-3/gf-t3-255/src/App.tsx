/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-255: Grouped-Query Attention (GQA) & KV Cache Compression Tensor Fabric Cockpit
 * Strict Zero-Dollar Gate & 100% Above-The-Fold Viewport Lock
 */

import React, { useMemo, useState } from 'react';
import {
  CorridorKey,
  SYNTHETIC_GQA_CORRIDORS,
  evaluateTemporalEvictionPool,
  formatIntegerWithCommas,
  generateEngineSnapshot,
  sanitizeGridSyncPayload,
} from './engine/gqaEngine';

type CockpitTab = 'Mesh' | 'GQA' | 'Comp' | 'Stats' | 'APA';

interface RadioLogEntry {
  timestamp: string;
  callsign: string;
  message: string;
}

const INITIAL_LOGS: RadioLogEntry[] = [
  {
    timestamp: '00:01.04',
    callsign: '🟢 CREW CHIEF',
    message: 'Grouped-query attention and KV cache compression engine initialized · 8 heads linked',
  },
  {
    timestamp: '00:01.08',
    callsign: '🟢 TELEMETRY',
    message: '4:1 KV cache compaction verified at 17,400 GB/s with zero attention perplexity loss',
  },
];

export default function App() {
  const [corridorKey, setCorridorKey] = useState<CorridorKey>('ALPHA');
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [selectedHeadIdx, setSelectedHeadIdx] = useState<number>(3);
  const [stepCount, setStepCount] = useState<number>(0);
  const [evictionSpikeActive, setEvictionSpikeActive] = useState<boolean>(false);
  const [burstActive, setBurstActive] = useState<boolean>(false);
  const [processedTokens, setProcessedTokens] = useState<number>(3712000);
  const [engineXp, setEngineXp] = useState<number>(75000);
  const [radioLogs, setRadioLogs] = useState<RadioLogEntry[]>(INITIAL_LOGS);

  const snapshot = useMemo(
    () =>
      generateEngineSnapshot(
        corridorKey,
        stepCount,
        evictionSpikeActive,
        burstActive,
        processedTokens,
        engineXp
      ),
    [corridorKey, stepCount, evictionSpikeActive, burstActive, processedTokens, engineXp]
  );

  const temporalPoolStats = useMemo(() => {
    const importances = [0.97, 0.14, 0.91, 0.12, 0.95, 0.08, 0.89, 0.11];
    const ages = [1, 42, 3, 51, 2, 64, 4, 58];
    const keepRatio = evictionSpikeActive ? 0.25 : 0.5;
    return evaluateTemporalEvictionPool(importances, ages, 0.045, keepRatio);
  }, [evictionSpikeActive]);

  const selectedHead = snapshot.heads[selectedHeadIdx] || snapshot.heads[3];

  const appendRadioLog = (callsign: string, message: string, nextStep: number) => {
    const secs = (1 + nextStep * 0.12).toFixed(2).padStart(5, '0');
    const newEntry: RadioLogEntry = {
      timestamp: '00:' + secs,
      callsign,
      message,
    };
    setRadioLogs((prev) => [prev[prev.length - 1] || INITIAL_LOGS[0], newEntry]);
  };

  const handleCorridorChange = (nextKey: CorridorKey) => {
    const corridor = SYNTHETIC_GQA_CORRIDORS[nextKey];
    const validated = sanitizeGridSyncPayload({
      corridorKey: nextKey,
      queryHeads: corridor.queryHeads,
      kvHeads: corridor.kvHeads,
      sequenceLength: 32768,
      headDim: 128,
      operatorCallsign: 'GARRETT_PIT_WALL',
    });
    const nextStep = stepCount + 1;
    setCorridorKey(validated.corridorKey);
    setStepCount(nextStep);
    appendRadioLog(
      '⚡ PIT WALL',
      'Corridor switched to ' + corridor.id + ' · Mode ' + corridor.mode,
      nextStep
    );
  };

  const handleInjectCompressionBurst = () => {
    const nextStep = stepCount + 1;
    const nextTokens = processedTokens + 128000;
    const nextXp = engineXp + 2500;
    setStepCount(nextStep);
    setBurstActive(true);
    setProcessedTokens(nextTokens);
    setEngineXp(nextXp);
    appendRadioLog(
      '🟢 TELEMETRY',
      'Trigger GQA Compression Burst · H0-H7 shared KV bandwidth boosted to ' +
        formatIntegerWithCommas(
          Math.round(SYNTHETIC_GQA_CORRIDORS[corridorKey].baseThroughputGbs * 1.12)
        ) +
        ' GB/s',
      nextStep
    );
  };

  const handleToggleEvictionSpike = () => {
    const nextSpike = !evictionSpikeActive;
    const nextStep = stepCount + 1;
    const nextTokens = processedTokens + 64000;
    setEvictionSpikeActive(nextSpike);
    setStepCount(nextStep);
    setProcessedTokens(nextTokens);
    if (nextSpike) {
      appendRadioLog(
        '🔴 TELEMETRY',
        'Inject Cache Saturation Spike (Force Temporal Eviction) · H2 and H5 pruning low-salience slots',
        nextStep
      );
    } else {
      appendRadioLog(
        '🟢 CREW CHIEF',
        'Temporal eviction spike stabilized · All 8 grouped-query heads locked in zero-loss parity',
        nextStep
      );
    }
  };

  const handleStepPipelinePass = () => {
    const nextStep = stepCount + 1;
    const nextTokens = processedTokens + 96000;
    const nextXp = engineXp + 1500;
    setStepCount(nextStep);
    setBurstActive(false);
    setProcessedTokens(nextTokens);
    setEngineXp(nextXp);
    appendRadioLog(
      '⚡ PIT WALL',
      'Step GQA Pipeline Pass #' +
        String(nextStep) +
        ' · Scaled dot-product attention resolved in 0.01 µs across 8 KV heads',
      nextStep
    );
  };

  const handleFlushBuffers = () => {
    setCorridorKey('ALPHA');
    setStepCount(0);
    setBurstActive(false);
    setEvictionSpikeActive(false);
    setProcessedTokens(3712000);
    setEngineXp(75000);
    setSelectedHeadIdx(3);
    setRadioLogs(INITIAL_LOGS);
  };

  const inspectorLine =
    selectedHead.shortCode +
    ' · RATIO: ' +
    selectedHead.ratioDisplay +
    ' · GQA: ' +
    selectedHead.gqaRatioDisplay +
    ' · EVICT: ' +
    selectedHead.evictDisplay +
    ' · PTR ' +
    selectedHead.hexPointer +
    ' · ACCURACY: ' +
    selectedHead.accuracyDisplay +
    ' · ' +
    (selectedHead.locked ? 'LOCKED' : 'FAULT');

  const vecStr = '[' + snapshot.featureVector.map((v) => v.toFixed(2)).join(', ') + ']';

  const subheaderLine = useMemo(() => {
    const baseLine =
      'VIEW: ' +
      activeTab.toUpperCase() +
      ' · PTR: ' +
      snapshot.pointerHex +
      ' · MODE: ' +
      snapshot.mode +
      ' · RATIO: ' +
      snapshot.compactionRatio.toFixed(1) +
      'x · VEC: ' +
      vecStr;

    if (activeTab === 'GQA') {
      return (
        baseLine +
        ' · FORMULA: h_kv = h_q / 8 · GROUP: [Q' +
        String(selectedHead.queryGroupIndices[0]) +
        '..Q' +
        String(selectedHead.queryGroupIndices[selectedHead.queryGroupIndices.length - 1]) +
        ']'
      );
    }
    if (activeTab === 'Comp') {
      return (
        baseLine +
        ' · POOL RETAINED: ' +
        String(temporalPoolStats.retainedCount) +
        '/8 · SAVED: ' +
        String(snapshot.kvFootprint.savedPct) +
        '%'
      );
    }
    if (activeTab === 'Stats') {
      return baseLine + ' · POSTGRESQL RLS: ENABLED · PARTITION: gqa_telemetry_epochs_2026_q4';
    }
    if (activeTab === 'APA') {
      return baseLine + ' · APA VAULT: 100% MIT CLEAN-ROOM · ACQUIRE TITLE (APA) READY';
    }
    return baseLine;
  }, [activeTab, snapshot, vecStr, selectedHead, temporalPoolStats]);

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER ROW 1 & ROW 2 */}
      <header className="w-full shrink-0 flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm font-mono font-bold tracking-tight text-white">GF-T3-255</h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 rounded">
              FLAGSHIP
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <label htmlFor="corridor-select" className="sr-only">
              Synthetic GQA Corridor
            </label>
            <select
              id="corridor-select"
              aria-label="Synthetic GQA Corridor"
              value={corridorKey}
              onChange={(e) => handleCorridorChange(e.target.value as CorridorKey)}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              <option value="ALPHA">
                GQA-CORRIDOR-ALPHA (KV-CACHE-COMPRESSION-FABRIC · 17400-GB/S)
              </option>
              <option value="BRAVO">
                GQA-CORRIDOR-BRAVO (GROUPED-QUERY-ATTENTION-HEAD-SHARING)
              </option>
              <option value="GAMMA">
                GQA-CORRIDOR-GAMMA (TEMPORAL-EVICTION-POOLING-ENGINE)
              </option>
              <option value="DELTA">
                GQA-CORRIDOR-DELTA (FALLBACK-FULL-ATTENTION-MATRIX)
              </option>
            </select>

            <button
              type="button"
              onClick={() => {
                setActiveTab('GQA');
                handleStepPipelinePass();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [GQA]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Comp');
                handleInjectCompressionBurst();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Comp]
            </button>
            <button
              type="button"
              onClick={handleStepPipelinePass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Run]
            </button>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap leading-tight">
          GQA Attention · KV Cache Compression · Zero Loss
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 Grid Above The Fold) */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 gap-1 w-full shrink-0"
      >
        {/* Card 1: GQA NITRO */}
        <div className="py-1 px-2 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between leading-tight">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-cyan-400">GQA NITRO</span>
            <span className="text-[#00F0FF] font-mono text-lg font-bold tracking-tight">
              {snapshot.throughputFormatted}
            </span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded overflow-hidden my-0.5">
            <div
              className="h-full bg-[#00F0FF] transition-transform duration-150 origin-left"
              style={{
                transform: 'scaleX(' + String(snapshot.throughputSaturationPct / 100) + ')',
              }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Compression Throughput Saturation
          </div>
        </div>

        {/* Card 2: RATIO STREAK */}
        <div className="py-1 px-2 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between leading-tight">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-amber-400">RATIO STREAK</span>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-mono text-lg font-bold">
                {snapshot.attentionLatencyFormatted}
              </span>
              <span className="px-1 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-[#FF9F0A] font-mono text-[11px] font-bold">
                {'🔥 ' + snapshot.compactionRatioFormatted}
              </span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            KV Cache Compaction Latency
          </div>
        </div>

        {/* Card 3: ACTIVE HEADS */}
        <div className="py-1 px-2 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between leading-tight">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-emerald-400">ACTIVE HEADS</span>
            <span className="text-emerald-400 font-mono text-lg font-bold">
              {'HEADS: ' +
                String(snapshot.activeHeadsCount) +
                '/' +
                String(snapshot.totalHeadsCount)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono text-slate-400 truncate">
              Active Heads: {String(snapshot.activeHeadsCount)} Heads
            </span>
            <div className="flex items-center gap-0.5 font-mono text-[9px]">
              {snapshot.heads.map((h) => (
                <span
                  key={h.shortCode}
                  className={
                    'px-0.5 rounded border ' +
                    (h.locked
                      ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/90 border-rose-500/60 text-rose-300')
                  }
                >
                  {h.shortCode}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="py-1 px-2 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between leading-tight">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-cyan-300">TOKEN SCORE</span>
            <div className="flex items-center gap-1">
              <span className="text-white font-mono text-lg font-bold">
                {snapshot.processedTokensFormatted + ' UNITS'}
              </span>
              <span className="px-1 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-[9px] font-bold">
                {snapshot.engineXpFormatted}
              </span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            {'GQA State: ' + snapshot.gqaStateLabel}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {(['Mesh', 'GQA', 'Comp', 'Stats', 'APA'] as CockpitTab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'APA') {
                  appendRadioLog(
                    '🟢 CREW CHIEF',
                    'ACQUIRE TITLE (APA) & INQUIRE VAULT BUYOUT telemetry staged for transfer',
                    stepCount + 1
                  );
                }
              }}
              className={
                'py-0.5 px-1.5 rounded text-[11px] font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ' +
                (isActive
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 shrink-0 leading-tight">
        {subheaderLine}
      </div>

      {/* INTERACTIVE GQA HEAD MATRIX BAY (H0-H7) IN TIGHT 4x2 GRID */}
      <main
        role="region"
        aria-label="Interactive GQA Head Matrix Bay"
        className="grid grid-cols-4 gap-1 w-full shrink-0"
      >
        {snapshot.heads.map((head) => {
          const isSelected = head.headIndex === selectedHeadIdx;
          return (
            <div
              key={head.shortCode}
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedHeadIdx(head.headIndex);
                appendRadioLog(
                  '🟢 TELEMETRY',
                  'Inspected ' +
                    head.headTitle +
                    ' at ' +
                    head.hexPointer +
                    ' · Shared Query Heads [Q' +
                    String(head.queryGroupIndices[0]) +
                    '..Q' +
                    String(head.queryGroupIndices[head.queryGroupIndices.length - 1]) +
                    ']',
                  stepCount + 1
                );
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedHeadIdx(head.headIndex);
                }
              }}
              className={
                'py-0.5 px-1.5 rounded border border-slate-800 bg-slate-900/60 cursor-pointer transition-colors leading-tight ' +
                (isSelected ? 'ring-1 ring-[#00F0FF]' : 'hover:border-slate-700')
              }
            >
              {/* Card Title & Hex */}
              <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                <span className="truncate">{head.headTitle}</span>
                <span className="text-slate-300 shrink-0 ml-1">{head.hexPointer}</span>
              </div>

              {/* Ratio & heads */}
              <div className="text-[12px] font-mono text-cyan-300 font-bold truncate">
                {'RATIO: ' + head.ratioDisplay + ' · GQA: ' + head.gqaRatioDisplay}
              </div>

              {/* Eviction & latency */}
              <div className="text-[12px] font-mono text-amber-300 font-bold truncate">
                {'EVICT: ' + head.evictDisplay + ' · LAT: ' + head.latencyDisplay}
              </div>

              {/* Status & lock */}
              <div className="text-[10px] font-mono text-emerald-400 font-semibold truncate">
                {'STATE: ' + head.stateDisplay}
              </div>
            </div>
          );
        })}
      </main>

      {/* COMPACT GQA TELEMETRY INSPECTOR STRIP */}
      <div
        aria-label="GQA Telemetry Inspector Strip"
        className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0"
      >
        {inspectorLine}
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section
        aria-label="Tactical Launch Control Dock"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleInjectCompressionBurst}
          className="border border-[#FF9F0A] bg-[#FF9F0A]/10 hover:bg-[#FF9F0A]/20 text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate"
        >
          💥 INJECT GQA COMPRESSION BURST
        </button>

        <button
          type="button"
          onClick={handleToggleEvictionSpike}
          className="border border-[#00F0FF] bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate"
        >
          ⚡ TOGGLE EVICTION SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepPipelinePass}
          className="border border-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate"
        >
          🚀 STEP GQA COMPRESSION PASS
        </button>

        <button
          type="button"
          onClick={handleFlushBuffers}
          className="border border-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate"
        >
          🔄 FLUSH COMPRESSION BUFFERS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        {radioLogs.slice(-2).map((entry, idx) => (
          <div key={String(idx) + '-' + entry.timestamp} className="truncate whitespace-nowrap">
            {'[' + entry.timestamp + '] ' + entry.callsign + ': ' + entry.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
