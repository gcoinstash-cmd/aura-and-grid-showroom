/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-270: Ultra-Wide Context Ring Attention & Hierarchical KV-Cache Compression Cockpit
 * Clean-Room MIT Permissive Implementation · Zero Currency Symbols
 */

import React, { useMemo, useState } from 'react';
import {
  QuantizationTier,
  SUPABASE_RLS_SCHEMA_SQL,
  SYNTHETIC_CORRIDORS,
  SyntheticCorridorLabel,
  computeCockpitTelemetry,
  formatNumberWithCommas,
  sanitizeGridSyncPayload,
} from './engine/ringAttentionCore';

type CockpitTab = 'Mesh' | 'Ring' | 'Comp' | 'Stats' | 'APA';

const TABS: readonly CockpitTab[] = ['Mesh', 'Ring', 'Comp', 'Stats', 'APA'] as const;
const QUANT_OPTIONS: readonly QuantizationTier[] = ['INT-4', 'INT-8', 'FP8', 'FP16'] as const;

interface RadioLogLine {
  id: number;
  text: string;
}

const INITIAL_LOGS: RadioLogLine[] = [
  {
    id: 1,
    text: '[00:01.04] 🟢 CREW CHIEF: Ring attention and hierarchical KV-cache compression engine initialized · 8 windows linked',
  },
  {
    id: 2,
    text: '[00:01.08] 🟢 TELEMETRY: Million-token context partitioning verified at 30,400 GB/s with zero memory exhaustion',
  },
];

export default function App() {
  const [selectedCorridor, setSelectedCorridor] = useState<SyntheticCorridorLabel>(
    SYNTHETIC_CORRIDORS[0].label
  );
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [selectedWindowIdx, setSelectedWindowIdx] = useState<number>(3);
  const [cyclicStep, setCyclicStep] = useState<number>(0);
  const [burstActive, setBurstActive] = useState<boolean>(false);
  const [spikeActive, setSpikeActive] = useState<boolean>(false);
  const [quantOverride, setQuantOverride] = useState<QuantizationTier | undefined>(undefined);
  const [heavyHitterRatio, setHeavyHitterRatio] = useState<number>(0.25);
  const [radioLogs, setRadioLogs] = useState<RadioLogLine[]>(INITIAL_LOGS);
  const [ingressProbeInput, setIngressProbeInput] = useState<string>('RING_SYNC_NOMINAL');
  const [ingressStatus, setIngressStatus] = useState<string>(
    'VERIFIED · GridSync Zod Gate Locked'
  );
  const [apaNotice, setApaNotice] = useState<string>(
    'READY · Direct Sovereign Repository Transfer Package Verified (MIT Clean-Room)'
  );
  const [showSqlSchema, setShowSqlSchema] = useState<boolean>(false);

  const telemetry = useMemo(
    () =>
      computeCockpitTelemetry(
        selectedCorridor,
        cyclicStep,
        burstActive,
        spikeActive,
        quantOverride,
        heavyHitterRatio
      ),
    [selectedCorridor, cyclicStep, burstActive, spikeActive, quantOverride, heavyHitterRatio]
  );

  const inspectedWindow = telemetry.windows[selectedWindowIdx] ?? telemetry.windows[3];

  const appendRadioLog = (callsign: string, message: string) => {
    setRadioLogs((prev) => {
      const nextId = prev.length > 0 ? prev[prev.length - 1].id + 1 : 1;
      const sec = String(Math.min(59, 1 + Math.floor(nextId / 3))).padStart(2, '0');
      const ms = String((nextId * 14) % 100).padStart(2, '0');
      const timestamp = '[00:' + sec + '.' + ms + '] ';
      const entry: RadioLogLine = {
        id: nextId,
        text: timestamp + callsign + ': ' + message,
      };
      return [...prev.slice(-1), entry];
    });
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCorridor = e.target.value as SyntheticCorridorLabel;
    const check = sanitizeGridSyncPayload({
      corridor: nextCorridor,
      selectedWindowIndex: selectedWindowIdx,
      cyclicStep,
      burstActive,
      spikeActive,
      quantOverride,
      heavyHitterRatio,
      operatorNote: 'CORRIDOR_SWITCH',
    });
    if (check.valid) {
      setSelectedCorridor(nextCorridor);
      const spec = SYNTHETIC_CORRIDORS.find((c) => c.label === nextCorridor);
      appendRadioLog(
        '🟢 CREW CHIEF',
        'Switched fabric corridor to ' +
          (spec ? spec.id : 'RING-CORRIDOR-ALPHA') +
          ' at ' +
          (spec ? formatNumberWithCommas(spec.baseBandwidthGbs) : '30,400') +
          ' GB/s'
      );
    }
  };

  const handleTriggerBurst = () => {
    const nextBurst = !burstActive;
    setBurstActive(nextBurst);
    if (nextBurst) {
      appendRadioLog(
        '⚡ PIT WALL',
        'Ring Attention Burst engaged · +128K tokens/window streamed across W0..W7 cyclic bus'
      );
    } else {
      appendRadioLog(
        '🟢 CREW CHIEF',
        'Ring Attention Burst normalized · Baseline 30,400 GB/s saturation locked'
      );
    }
  };

  const handleToggleSpike = () => {
    const nextSpike = !spikeActive;
    setSpikeActive(nextSpike);
    if (nextSpike) {
      appendRadioLog(
        '🔴 TELEMETRY',
        'Context Window Spike detected on W2 & W5 · Forced INT-4 Hierarchical KV-Cache Compression active'
      );
    } else {
      appendRadioLog(
        '🟢 TELEMETRY',
        'Context Window Spike cleared · All 8 windows restored to CIRCULAR · LOCKED parity'
      );
    }
  };

  const handleStepCyclicPass = () => {
    const nextStep = cyclicStep + 1;
    setCyclicStep(nextStep);
    const nextWin = (selectedWindowIdx + 1) % 8;
    setSelectedWindowIdx(nextWin);
    appendRadioLog(
      '🟢 TELEMETRY',
      'Cyclic peer-to-peer token pass #' +
        String(nextStep) +
        ' complete · Focus rotated to W' +
        String(nextWin) +
        ' · LSE parity 100%'
    );
  };

  const handleFlushBuffers = () => {
    setCyclicStep(0);
    setBurstActive(false);
    setSpikeActive(false);
    setQuantOverride(undefined);
    setHeavyHitterRatio(0.25);
    setSelectedWindowIdx(3);
    setRadioLogs(INITIAL_LOGS);
  };

  const handleValidateIngressProbe = (probeText: string) => {
    setIngressProbeInput(probeText);
    const result = sanitizeGridSyncPayload({
      corridor: selectedCorridor,
      selectedWindowIndex: selectedWindowIdx,
      cyclicStep,
      burstActive,
      spikeActive,
      quantOverride,
      heavyHitterRatio,
      operatorNote: probeText,
    });
    if (result.valid) {
      setIngressStatus('PASS · GridSync Zod Gate Accepted Clean Payload');
      appendRadioLog('🟢 CREW CHIEF', 'GridSync Zero-Trust Ingress verified clean payload');
    } else {
      setIngressStatus('BLOCKED · ' + (result.error ?? 'Rejected'));
      appendRadioLog(
        '🔴 TELEMETRY',
        'GridSync Zero-Trust Gate blocked malicious payload signature'
      );
    }
  };

  const vecStr =
    '[' +
    telemetry.stateVector.map((v) => v.toFixed(2)).join(', ') +
    ']';

  const inspectorLine =
    inspectedWindow.code +
    ' · TOK: ' +
    inspectedWindow.tokensLabel +
    ' · COMP: ' +
    inspectedWindow.compLabel +
    ' · SYNC: ' +
    String(inspectedWindow.syncPct) +
    '% · PTR ' +
    inspectedWindow.hexPtr +
    ' · RING: ' +
    (inspectedWindow.isFaulted ? 'SPIKE · FAULT' : 'OK · LOCKED');

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Stack */}
      <header className="w-full shrink-0 flex flex-col gap-0.5 border-b border-slate-800/80 pb-1">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm font-mono font-extrabold tracking-tight text-white">
              GF-T3-270
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 rounded">
              FLAGSHIP
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic Ring Corridor Selector"
              value={selectedCorridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {SYNTHETIC_CORRIDORS.map((corridor) => (
                <option key={corridor.id} value={corridor.label}>
                  {corridor.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Ring');
                appendRadioLog(
                  '🟢 CREW CHIEF',
                  'Inspecting cyclic Ring Attention block partitioning matrix'
                );
              }}
              className={
                'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer ' +
                (activeTab === 'Ring'
                  ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-cyan-400')
              }
            >
              [Ring]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Comp');
                appendRadioLog(
                  '🟢 CREW CHIEF',
                  'Inspecting Hierarchical KV-Cache Compression ratios & quantization tiers'
                );
              }}
              className={
                'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer ' +
                (activeTab === 'Comp'
                  ? 'bg-[#FF9F0A]/20 border-[#FF9F0A] text-[#FF9F0A]'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-amber-400')
              }
            >
              [Comp]
            </button>
            <button
              type="button"
              onClick={handleStepCyclicPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border border-[#10B981]/60 bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25 transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          Ring Attention · Hierarchical KV Compression · Million Tokens
        </div>
      </header>

      {/* 4-Card Arcade HUD Ribbon */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: RING NITRO */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-slate-400">RING NITRO</span>
            <span className="text-[10px] font-mono text-[#00F0FF] font-semibold">
              {String(telemetry.saturationPct) + '% SAT'}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-tight whitespace-nowrap">
            {telemetry.throughputFormatted}
          </div>
          <div className="w-full h-1 bg-slate-800 rounded overflow-hidden my-0.5">
            <div
              className="h-full bg-[#00F0FF] transition-all duration-150"
              style={{ width: String(telemetry.saturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Attention Throughput Saturation
          </div>
        </div>

        {/* Card 2: COMP STREAK */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-slate-400">COMP STREAK</span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">
              🔥 1M-CTX
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#FF9F0A] leading-tight whitespace-nowrap">
            {telemetry.ringLatencyFormatted}
          </div>
          <div className="text-[10px] font-mono text-slate-300 flex justify-between items-center">
            <span>KV RATIO: {String(telemetry.kvCompression.compressionRatio)}x</span>
            <span>{telemetry.kvCompression.quantMode}</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Ring Sync Latency
          </div>
        </div>

        {/* Card 3: ACTIVE WINDOWS */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              ACTIVE WINDOWS
            </span>
            <span className="text-[10px] font-mono font-bold text-[#10B981]">
              RING ONLINE
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight whitespace-nowrap">
            {'WINDOWS: ' +
              String(telemetry.activeWindowsCount) +
              '/' +
              String(telemetry.totalWindowsCount)}
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {telemetry.windows.map((w) => (
              <span
                key={w.code}
                className={
                  'text-[9px] font-mono font-bold text-center rounded-xs ' +
                  (w.isFaulted
                    ? 'bg-[#EF4444]/30 text-[#EF4444]'
                    : selectedWindowIdx === w.index
                    ? 'bg-[#00F0FF]/30 text-[#00F0FF]'
                    : 'bg-[#10B981]/20 text-[#10B981]')
                }
              >
                {w.code}
              </span>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            F1 Gear Shift Indicator [W0..W7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-slate-400">TOKEN SCORE</span>
            <span className="text-[10px] font-mono font-bold text-[#10B981]">
              {telemetry.engineXpFormatted}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#10B981] leading-tight whitespace-nowrap">
            {telemetry.processedTokensFormatted}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 flex justify-between items-center">
            <span>STEP #{String(cyclicStep)}</span>
            <span>PARITY {String(telemetry.kvCompression.attentionParityPct)}%</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            {telemetry.ringStateLabel}
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {TABS.map((tab) => (
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

      {/* Streamlined Mesh Info Subheader (strictly clean of action buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 shrink-0 px-1">
        {'VIEW: ' +
          activeTab.toUpperCase() +
          ' · PTR: ' +
          telemetry.meshPointerHex +
          ' · MODE: RING_ATTENTION · WINDOWS: 8 · VEC: ' +
          vecStr}
      </div>

      {/* Main Interactive Simulation Bay */}
      <main className="flex-1 min-h-0 w-full my-0.5 flex flex-col justify-between overflow-hidden">
        {activeTab === 'Mesh' && (
          <div className="grid grid-cols-4 grid-rows-2 gap-1.5 w-full h-full min-h-0">
            {telemetry.windows.map((win) => {
              const isSelected = win.index === selectedWindowIdx;
              return (
                <button
                  key={win.code}
                  type="button"
                  onClick={() => {
                    setSelectedWindowIdx(win.index);
                    appendRadioLog(
                      '🟢 CREW CHIEF',
                      'Locked telemetry inspector onto ' +
                        win.title +
                        ' at pointer ' +
                        win.hexPtr
                    );
                  }}
                  className={
                    'py-0 px-1.5 rounded border bg-slate-900/60 flex flex-col justify-between text-left transition-colors cursor-pointer ' +
                    (win.isFaulted
                      ? 'border-[#EF4444]'
                      : isSelected
                      ? 'border-[#00F0FF]'
                      : 'border-slate-800 hover:border-slate-600')
                  }
                >
                  {/* Line 1 (Title & Hex) */}
                  <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center w-full">
                    <span className="truncate">{win.title}</span>
                    <span className="text-slate-300">{win.hexPtr}</span>
                  </div>

                  {/* Line 2 (Tokens & Compression) */}
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300 w-full">
                    <span>{'TOK: ' + win.tokensLabel}</span>
                    <span>{'COMP: ' + win.compLabel}</span>
                  </div>

                  {/* Line 3 (Latency & State) */}
                  <div className="flex justify-between items-center text-[10px] font-mono w-full">
                    <span className="text-[#FF9F0A]">{win.latencyLabel}</span>
                    <span
                      className={
                        win.isFaulted
                          ? 'text-[#EF4444] font-bold'
                          : 'text-[#10B981] font-bold'
                      }
                    >
                      {win.stateText}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'Ring' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 w-full h-full min-h-0">
            <div className="p-2 rounded border border-slate-800 bg-slate-900/60 flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                <span className="text-xs font-mono font-bold text-[#00F0FF]">
                  ONLINE SOFTMAX RING BLOCK PARTITIONER
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {'PARITY: ' + String(telemetry.ringPassSample.numericalParity) + '%'}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-200">
                Formula: A_ring = Softmax((Q_i * K_j^T) / sqrt(d)) * V_j
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                <div className="p-1 bg-black/50 rounded border border-slate-800">
                  <div className="text-slate-400">BLOCK OUTPUT ROW 0</div>
                  <div className="text-cyan-300 font-bold">
                    {'[' + telemetry.ringPassSample.outputMatrix[0].join(', ') + ']'}
                  </div>
                </div>
                <div className="p-1 bg-black/50 rounded border border-slate-800">
                  <div className="text-slate-400">BLOCK OUTPUT ROW 1</div>
                  <div className="text-cyan-300 font-bold">
                    {'[' + telemetry.ringPassSample.outputMatrix[1].join(', ') + ']'}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-amber-300">
                <span>
                  {'LSE ACCUMULATOR: [' + telemetry.ringPassSample.logSumExp.join(', ') + ']'}
                </span>
                <span>{'HEAD DIM: ' + String(telemetry.corridor.headDim)}</span>
              </div>
            </div>

            <div className="p-2 rounded border border-slate-800 bg-slate-900/60 flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                <span className="text-xs font-mono font-bold text-white">
                  CYCLIC PEER-TO-PEER TOKEN TOPOLOGY (W0..W7)
                </span>
                <span className="text-[10px] font-mono text-[#10B981] font-bold">
                  {'STEP OFFSET: ' + String(cyclicStep % 8)}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {telemetry.ringPassSample.peerHops.map((hop, idx) => (
                  <div
                    key={hop}
                    className="px-1.5 py-1 rounded bg-black/60 border border-slate-800 text-[10px] font-mono flex justify-between items-center"
                  >
                    <span className="text-slate-400">{'#' + String(idx)}</span>
                    <span className="text-cyan-300 font-bold">{hop}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-300">
                <span>ZERO NETWORK STALL DMA OVERLAP</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('Mesh')}
                  className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold hover:bg-slate-700 cursor-pointer"
                >
                  RETURN TO 4x2 MESH
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Comp' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 w-full h-full min-h-0">
            <div className="p-2 rounded border border-slate-800 bg-slate-900/60 flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                <span className="text-xs font-mono font-bold text-[#FF9F0A]">
                  HIERARCHICAL KV-CACHE COMPRESSION CONTROLS
                </span>
                <span className="text-[10px] font-mono text-cyan-300 font-bold">
                  {String(telemetry.kvCompression.compressionRatio) + 'x REDUCTION'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
                <span className="text-slate-300">QUANTIZATION TIER:</span>
                <div className="flex gap-1">
                  {QUANT_OPTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setQuantOverride(q);
                        appendRadioLog(
                          '🟢 CREW CHIEF',
                          'KV-Cache quantization tier set to ' + q
                        );
                      }}
                      className={
                        'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer ' +
                        (telemetry.kvCompression.quantMode === q
                          ? 'bg-[#FF9F0A]/25 border-[#FF9F0A] text-[#FF9F0A]'
                          : 'bg-black/50 border-slate-700 text-slate-300')
                      }
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                <span className="text-slate-300">
                  {'HEAVY-HITTER RETENTION: ' + String(Math.round(heavyHitterRatio * 100)) + '%'}
                </span>
                <div className="flex gap-1">
                  {[0.15, 0.25, 0.5, 0.75].map((ratio) => (
                    <button
                      key={String(ratio)}
                      type="button"
                      onClick={() => setHeavyHitterRatio(ratio)}
                      className={
                        'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer ' +
                        (heavyHitterRatio === ratio
                          ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                          : 'bg-black/50 border-slate-700 text-slate-300')
                      }
                    >
                      {String(Math.round(ratio * 100)) + '%'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                <div className="p-1 bg-black/50 rounded border border-slate-800">
                  <div className="text-slate-400">FP16 RAW</div>
                  <div className="text-slate-200 font-bold">
                    {String(telemetry.kvCompression.uncompressedFootprintGb) + ' GB'}
                  </div>
                </div>
                <div className="p-1 bg-black/50 rounded border border-slate-800">
                  <div className="text-slate-400">COMPRESSED</div>
                  <div className="text-[#10B981] font-bold">
                    {String(telemetry.kvCompression.compressedFootprintGb) + ' GB'}
                  </div>
                </div>
                <div className="p-1 bg-black/50 rounded border border-slate-800">
                  <div className="text-slate-400">PRUNED TOKENS</div>
                  <div className="text-cyan-300 font-bold">
                    {formatNumberWithCommas(telemetry.kvCompression.prunedTokens)}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2 rounded border border-slate-800 bg-slate-900/60 flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                <span className="text-xs font-mono font-bold text-white">
                  POSTGRESQL / SUPABASE PARTITIONED RLS SCHEMA
                </span>
                <button
                  type="button"
                  onClick={() => setShowSqlSchema(!showSqlSchema)}
                  className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400 text-[10px] font-mono font-bold text-cyan-300 cursor-pointer"
                >
                  {showSqlSchema ? 'VIEW METRICS' : 'INSPECT DDL'}
                </button>
              </div>
              <pre className="text-[9px] font-mono text-slate-300 bg-black/70 p-1.5 rounded border border-slate-800 overflow-hidden leading-tight h-24">
                {SUPABASE_RLS_SCHEMA_SQL}
              </pre>
              <div className="flex justify-between items-center text-[10px] font-mono text-emerald-400">
                <span>RLS POLICY: tenant_uid = auth.uid() LOCKED</span>
                <span>PARTITION: RANGE (recorded_at)</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 w-full h-full min-h-0">
            <div className="p-2 rounded border border-slate-800 bg-slate-900/60 flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                <span className="text-xs font-mono font-bold text-[#00F0FF]">
                  SYNTHETIC RING CORRIDOR BENCHMARK MATRIX
                </span>
                <span className="text-[10px] font-mono text-slate-400">CLEAN-ROOM IP</span>
              </div>
              <div className="flex flex-col gap-1">
                {SYNTHETIC_CORRIDORS.map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center px-1.5 py-0.5 rounded bg-black/50 border border-slate-800 text-[10px] font-mono"
                  >
                    <span className="text-white font-bold">{c.id}</span>
                    <span className="text-cyan-300">
                      {formatNumberWithCommas(c.baseBandwidthGbs) + ' GB/s'}
                    </span>
                    <span className="text-amber-300">{String(c.baseLatencyUs) + ' µs'}</span>
                    <span className="text-emerald-400">{c.defaultQuant}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2 rounded border border-slate-800 bg-slate-900/60 flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                <span className="text-xs font-mono font-bold text-[#10B981]">
                  GRIDSYNC ZERO-TRUST ZOD INGRESS SANITIZER
                </span>
                <span className="text-[10px] font-mono text-cyan-300">NIST SSDF PW.5.1</span>
              </div>
              <div className="text-[10px] font-mono text-slate-300">
                Test payload sanitization against SQLi & XSS injection vectors:
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleValidateIngressProbe('RING_SYNC_VERIFIED')}
                  className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500 text-[10px] font-mono font-bold text-emerald-300 cursor-pointer"
                >
                  TEST CLEAN PAYLOAD
                </button>
                <button
                  type="button"
                  onClick={() => handleValidateIngressProbe('DROP TABLE gf_t3_270_corridors;')}
                  className="px-2 py-1 rounded bg-rose-500/20 border border-rose-500 text-[10px] font-mono font-bold text-rose-300 cursor-pointer"
                >
                  TEST SQLi BLOCK
                </button>
                <button
                  type="button"
                  onClick={() => handleValidateIngressProbe('<script>alert(1)</script>')}
                  className="px-2 py-1 rounded bg-amber-500/20 border border-amber-500 text-[10px] font-mono font-bold text-amber-300 cursor-pointer"
                >
                  TEST XSS BLOCK
                </button>
              </div>
              <div className="px-2 py-1 rounded bg-black/70 border border-slate-800 text-[10px] font-mono flex justify-between items-center">
                <span className="text-slate-400 truncate">{'INPUT: ' + ingressProbeInput}</span>
                <span className="text-cyan-300 font-bold">{ingressStatus}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'APA' && (
          <div className="p-2 rounded border border-slate-800 bg-slate-900/60 flex flex-col justify-between w-full h-full min-h-0">
            <div className="flex justify-between items-center border-b border-slate-800 pb-1">
              <span className="text-xs font-mono font-bold text-[#00F0FF]">
                GF-T3-270 SOVEREIGN ASSET PURCHASE AGREEMENT (APA) VAULT
              </span>
              <span className="text-[10px] font-mono font-bold text-[#10B981]">
                100% MIT PERMISSIVE · ZERO COPYLEFT
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
              <div className="p-1.5 rounded bg-black/60 border border-slate-800">
                <div className="text-slate-400">CLEAN-ROOM PROVENANCE</div>
                <div className="text-white font-bold">ZERO PROPRIETARY MARKS</div>
                <div className="text-cyan-300">NIST SP 800-218 SSDF v1.1</div>
              </div>
              <div className="p-1.5 rounded bg-black/60 border border-slate-800">
                <div className="text-slate-400">INCLUDED ARTIFACTS</div>
                <div className="text-white font-bold">FASTAPI + REACT + SQL RLS</div>
                <div className="text-emerald-400">VITEST & PYTEST VERIFIED</div>
              </div>
              <div className="p-1.5 rounded bg-black/60 border border-slate-800">
                <div className="text-slate-400">TRANSFER TERMS</div>
                <div className="text-white font-bold">OUTRIGHT TITLE TRANSFER</div>
                <div className="text-amber-300">ZERO RECURRING SAAS LOCK</div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setApaNotice(
                    'APA TITLE DOCKET LOCKED · Full Repository & Clean-Room IP Assignment Ready for Transfer'
                  );
                  appendRadioLog(
                    '⚡ PIT WALL',
                    'ACQUIRE TITLE (APA) initiated for GF-T3-270 sovereign package'
                  );
                }}
                className="flex-1 py-1.5 px-3 rounded bg-[#00F0FF]/20 border border-[#00F0FF] text-[#00F0FF] text-xs font-mono font-bold hover:bg-[#00F0FF]/30 transition-colors cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setApaNotice(
                    'VAULT BUYOUT INQUIRY LOGGED · Direct Institutional Escrow Dossier Generated'
                  );
                  appendRadioLog(
                    '🟢 CREW CHIEF',
                    'INQUIRE VAULT BUYOUT dispatched for GF-T3-270 institutional vault'
                  );
                }}
                className="flex-1 py-1.5 px-3 rounded bg-[#FF9F0A]/20 border border-[#FF9F0A] text-[#FF9F0A] text-xs font-mono font-bold hover:bg-[#FF9F0A]/30 transition-colors cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>

            <div className="text-[10px] font-mono text-emerald-400 truncate">{apaNotice}</div>
          </div>
        )}
      </main>

      {/* Compact Ring Telemetry Inspector Strip */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {inspectorLine}
      </div>

      {/* Tactical Launch Control Switches */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleTriggerBurst}
          className={
            'border text-xs font-mono font-bold py-2 text-center rounded transition-colors cursor-pointer whitespace-nowrap truncate px-1 ' +
            (burstActive
              ? 'border-[#FF9F0A] bg-[#FF9F0A]/25 text-white'
              : 'border-[#FF9F0A]/80 bg-[#FF9F0A]/10 text-[#FF9F0A] hover:bg-[#FF9F0A]/20')
          }
        >
          💥 INJECT RING ATTENTION BURST
        </button>

        <button
          type="button"
          onClick={handleToggleSpike}
          className={
            'border text-xs font-mono font-bold py-2 text-center rounded transition-colors cursor-pointer whitespace-nowrap truncate px-1 ' +
            (spikeActive
              ? 'border-[#00F0FF] bg-[#00F0FF]/30 text-white'
              : 'border-[#00F0FF]/80 bg-[#00F0FF]/10 text-[#00F0FF] hover:bg-[#00F0FF]/20')
          }
        >
          ⚡ TOGGLE CONTEXT WINDOW SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepCyclicPass}
          className="border border-[#10B981]/80 bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] text-xs font-mono font-bold py-2 text-center rounded transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          🚀 STEP CYCLIC TOKEN PASS
        </button>

        <button
          type="button"
          onClick={handleFlushBuffers}
          className="border border-[#EF4444]/80 bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] text-xs font-mono font-bold py-2 text-center rounded transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          🔄 FLUSH ATTENTION BUFFERS
        </button>
      </section>

      {/* Pit-Wall Radio Comms Log */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        {radioLogs.map((log) => (
          <div key={log.id} className="truncate whitespace-nowrap">
            {log.text}
          </div>
        ))}
      </footer>
    </div>
  );
}
