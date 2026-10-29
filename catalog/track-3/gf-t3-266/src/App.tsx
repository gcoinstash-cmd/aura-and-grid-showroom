/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-266 · Mamba-2 State-Space Model & Hybrid Attention-SSM Concurrency Cockpit
 * Ghost Factory Gamified ADHD Sim Cockpit Spec (10/10 Strict Viewport Lock)
 */

import React, { useState } from 'react';
import {
  SYNTHETIC_CORRIDORS,
  SUPABASE_SQL_SCHEMA_EXPORT,
  SyntheticCorridor,
  TabKey,
  GridSyncCommandPayloadSchema,
  compactHiddenStateVector,
  createInitialEngineState,
  executeAssociativeParallelScan,
  executeSequentialSelectiveScan,
} from './engine/mambaCore';

interface RadioLogEntry {
  timestamp: string;
  badge: string;
  callsign: 'CREW CHIEF' | 'TELEMETRY' | 'PIT WALL';
  message: string;
}

const INITIAL_RADIO_LOGS: RadioLogEntry[] = [
  {
    timestamp: '00:01.04',
    badge: '🟢',
    callsign: 'CREW CHIEF',
    message:
      'Mamba-2 state-space model and hybrid attention-SSM engine initialized · 8 layers linked',
  },
  {
    timestamp: '00:01.08',
    badge: '🟢',
    callsign: 'TELEMETRY',
    message:
      'Linear-time selective scan verified at 27,200 GB/s with zero memory bottlenecks',
  },
];

const TABS: TabKey[] = ['Mesh', 'SSM', 'Scan', 'Stats', 'APA'];

export default function App() {
  const [engineState, setEngineState] = useState(createInitialEngineState);
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [radioLogs, setRadioLogs] = useState<RadioLogEntry[]>(INITIAL_RADIO_LOGS);
  const [apaTransferState, setApaTransferState] = useState<
    'IDLE' | 'TITLE_LOCKED' | 'VAULT_INQUIRY_LOGGED'
  >('IDLE');
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);

  const appendRadioLog = (
    badge: string,
    callsign: 'CREW CHIEF' | 'TELEMETRY' | 'PIT WALL',
    message: string,
    stepNum: number
  ) => {
    const sec = String(Math.min(59, Math.floor(stepNum / 10) + 1)).padStart(2, '0');
    const ms = String((stepNum * 12) % 100).padStart(2, '0');
    const nextEntry: RadioLogEntry = {
      timestamp: '00:' + sec + '.' + ms,
      badge,
      callsign,
      message,
    };
    setRadioLogs((prev) => [ prev[prev.length - 1] || INITIAL_RADIO_LOGS[0], nextEntry ]);
  };

  const handleCorridorChange = (nextCorridor: SyntheticCorridor) => {
    const corridorThroughputMap: Record<SyntheticCorridor, number> = {
      'SSM-CORRIDOR-ALPHA (STATE-SPACE-MODEL-CONCURRENCY-FABRIC · 27200-GB/S)': 27200,
      'SSM-CORRIDOR-BRAVO (SELECTIVE-SCAN-PARALLELIZATION-ENGINE)': 26400,
      'SSM-CORRIDOR-GAMMA (HYBRID-ATTENTION-SSM-ROUTER)': 26900,
      'SSM-CORRIDOR-DELTA (FALLBACK-DENSE-TRANSFORMER-PASS)': 19800,
    };

    const nextStep = engineState.stepCounter + 1;
    const nextBw = corridorThroughputMap[nextCorridor];
    setEngineState((prev) => ({
      ...prev,
      corridor: nextCorridor,
      throughputGbs: nextBw,
      stepCounter: nextStep,
    }));
    appendRadioLog(
      '⚡',
      'PIT WALL',
      'Corridor switched to ' +
        nextCorridor.slice(0, 18) +
        ' · Bus locked at ' +
        nextBw.toLocaleString() +
        ' GB/s',
      nextStep
    );
  };

  // Trigger 1: Trigger SSM Selective Scan Burst
  const handleInjectSelectiveScanBurst = () => {
    const nextStep = engineState.stepCounter + 1;
    const scanRes = executeAssociativeParallelScan({
      corridor: engineState.corridor,
      sequenceInputs: engineState.stateVector,
      deltaStep: 0.04,
      stateDecayA: -0.95,
      inputProjectionB: 1.4,
      outputProjectionC: 1.05,
      initialHiddenState: 2.6,
    });

    const updatedVector: [number, number, number, number] = [
      Number((2.81 + (scanRes.outputs[0] % 0.14)).toFixed(2)),
      Number((2.85 + (scanRes.outputs[1] % 0.14)).toFixed(2)),
      Number((2.82 + (scanRes.outputs[2] % 0.14)).toFixed(2)),
      Number((2.84 + (scanRes.outputs[3] % 0.14)).toFixed(2)),
    ];

    setEngineState((prev) => ({
      ...prev,
      burstActive: true,
      throughputGbs: 29400,
      scanLatencyUs: 0.01,
      processedTokensUnits: prev.processedTokensUnits + 640000,
      engineXpK: Number((prev.engineXpK + 12.5).toFixed(1)),
      ssmStateLabel: 'Selective Burst Active',
      stepCounter: nextStep,
      stateVector: updatedVector,
      layers: prev.layers.map((layer) => ({
        ...layer,
        tokensK: layer.tokensK + 80,
        latencyMs: 0.01,
        statusText: 'HYBRID · LOCKED',
        isLocked: true,
        ratePct: 100,
        hiddenVector: updatedVector,
      })),
    }));

    appendRadioLog(
      '🟢',
      'TELEMETRY',
      'Selective scan burst verified across L0..L7 · Parallel associative prefix at 29,400 GB/s',
      nextStep
    );
  };

  // Trigger 2: Inject State Dimensionality Spike (Force Scan Recalibration)
  const handleToggleDimensionSpike = () => {
    const nextStep = engineState.stepCounter + 1;
    const nextSpike = !engineState.dimensionSpikeActive;

    setEngineState((prev) => ({
      ...prev,
      dimensionSpikeActive: nextSpike,
      throughputGbs: nextSpike ? 24100 : 27200,
      scanLatencyUs: nextSpike ? 0.03 : 0.01,
      ssmStateLabel: nextSpike ? 'Recalibrating State Dim' : 'Hybrid Active',
      stepCounter: nextStep,
      layers: prev.layers.map((layer, idx) => {
        const spikedLayer = nextSpike && (idx === 2 || idx === 5);
        return {
          ...layer,
          stateDimension: nextSpike ? 256 : 128,
          latencyMs: spikedLayer ? 0.04 : 0.02,
          ratePct: spikedLayer ? 96 : 100,
          statusText: spikedLayer ? '⚡ FAULT · RECAL' : 'HYBRID · LOCKED',
          isLocked: !spikedLayer,
        };
      }),
    }));

    if (nextSpike) {
      appendRadioLog(
        '🔴',
        'PIT WALL',
        'State dimensionality spike D=256 injected on L2/L5 · Forcing ZOH selective scan recalibration',
        nextStep
      );
    } else {
      appendRadioLog(
        '🟢',
        'CREW CHIEF',
        'State dimensionality normalized to D=128 · All 8 hybrid SSM layers locked at 0.01 µs',
        nextStep
      );
    }
  };

  // Trigger 3: Step Hybrid Concurrency Pass
  const handleStepHybridPass = () => {
    const nextStep = engineState.stepCounter + 1;
    const cmdValidation = GridSyncCommandPayloadSchema.safeParse({
      operatorCallsign: 'CREW_CHIEF',
      targetLayerIndex: engineState.selectedLayerIndex,
      deltaOverride: 0.05,
    });

    if (!cmdValidation.success) {
      return;
    }

    const seqScan = executeSequentialSelectiveScan({
      corridor: engineState.corridor,
      sequenceInputs: engineState.stateVector,
      deltaStep: 0.05,
      stateDecayA: -1.0,
      inputProjectionB: 1.25,
      outputProjectionC: 1.0,
      initialHiddenState: 2.75,
    });

    const compacted = compactHiddenStateVector(engineState.stateVector, 0.001);
    const nextSelectedLayer = (engineState.selectedLayerIndex + 1) % 8;

    setEngineState((prev) => ({
      ...prev,
      throughputGbs: 27200,
      scanLatencyUs: 0.01,
      processedTokensUnits: prev.processedTokensUnits + 512000,
      engineXpK: Number((prev.engineXpK + 8.5).toFixed(1)),
      dimensionSpikeActive: false,
      burstActive: false,
      ssmStateLabel: 'Hybrid Active',
      selectedLayerIndex: nextSelectedLayer,
      stepCounter: nextStep,
      stateVector: compacted.compactedVector,
      layers: prev.layers.map((layer, idx) => ({
        ...layer,
        tokensK: layer.tokensK + 64,
        scanMode: idx === 3 || idx === 7 ? 'SSM-2' : 'SSM-2',
        latencyMs: 0.02,
        statusText: 'HYBRID · LOCKED',
        isLocked: true,
        ratePct: 100,
        stateDimension: 128,
        hiddenVector: compacted.compactedVector,
      })),
    }));

    appendRadioLog(
      '🟢',
      'CREW CHIEF',
      'Hybrid concurrency pass #' +
        String(nextStep) +
        ' complete · h_t=' +
        String(seqScan.finalHiddenState.toFixed(2)) +
        ' · L' +
        String(nextSelectedLayer) +
        ' verified',
      nextStep
    );
  };

  // Trigger 4: Flush SSM Buffers & Re-Zero Hidden States
  const handleFlushSsmStates = () => {
    const fresh = createInitialEngineState();
    setEngineState({
      ...fresh,
      corridor: engineState.corridor,
      stepCounter: engineState.stepCounter + 1,
    });
    setApaTransferState('IDLE');
    setRadioLogs([
      {
        timestamp: '00:01.04',
        badge: '🟢',
        callsign: 'CREW CHIEF',
        message:
          'Mamba-2 state-space model and hybrid attention-SSM engine initialized · 8 layers linked',
      },
      {
        timestamp: '00:01.08',
        badge: '🟢',
        callsign: 'TELEMETRY',
        message:
          'Sub-microsecond hidden state compaction complete · Buffers re-zeroed at 27,200 GB/s',
      },
    ]);
  };

  const selectedLayer =
    engineState.layers[engineState.selectedLayerIndex] || engineState.layers[3];

  const saturationPct = Math.min(
    100,
    Math.round((engineState.throughputGbs / 30000) * 100)
  );

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP COMMAND DECK: Row 1 & Row 2 */}
      <header className="w-full shrink-0 border-b border-slate-800/90 pb-1">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Strictly GF-T3-266 + Cyan FLAGSHIP badge */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm md:text-base font-mono font-bold tracking-tight text-white">
              GF-T3-266
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 rounded">
              FLAGSHIP
            </span>
          </div>

          {/* Right: Compact corridor dropdown + micro action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <label htmlFor="corridor-select" className="sr-only">
              SSM Corridor Selector
            </label>
            <select
              id="corridor-select"
              value={engineState.corridor}
              onChange={(e) =>
                handleCorridorChange(e.target.value as SyntheticCorridor)
              }
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-[#00F0FF] rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {SYNTHETIC_CORRIDORS.map((corridorOption) => (
                <option key={corridorOption} value={corridorOption}>
                  {corridorOption}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setActiveTab('SSM');
                handleStepHybridPass();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-slate-700 rounded transition-colors cursor-pointer"
            >
              [SSM]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Scan');
                handleInjectSelectiveScanBurst();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-slate-700 rounded transition-colors cursor-pointer"
            >
              [Scan]
            </button>
            <button
              type="button"
              onClick={handleStepHybridPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] border border-[#10B981]/50 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
            <button
              type="button"
              onClick={() => setSchemaModalOpen((prev) => !prev)}
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded transition-colors cursor-pointer"
            >
              [Inspect Schema]
            </button>
            <button
              type="button"
              onClick={handleFlushSsmStates}
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-700 rounded transition-colors cursor-pointer"
            >
              [Reset]
            </button>
          </div>
        </div>

        {/* Top Header Row 2: Subtitle */}
        <p className="text-xs font-mono text-slate-300 text-center whitespace-nowrap mt-0.5">
          Mamba-2 SSM · Hybrid Attention · Linear Time
        </p>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 on small screens, 4 cols on lg) */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: SSM NITRO */}
        <div className="p-1.5 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>SSM NITRO</span>
            <span className="text-[#00F0FF] font-bold">{saturationPct}% BUS</span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-tight">
            {engineState.throughputGbs.toLocaleString()} GB/s
          </div>
          <div className="w-full bg-slate-950 h-1 rounded overflow-hidden my-0.5 border border-slate-800">
            <div
              className="bg-[#00F0FF] h-full transition-transform duration-150 origin-left"
              style={{ transform: 'scaleX(' + String(saturationPct / 100) + ')' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            SSM Throughput Saturation
          </div>
        </div>

        {/* Card 2: SCAN STREAK */}
        <div className="p-1.5 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>SCAN STREAK</span>
            <span className="text-[#FF9F0A] font-bold">🔥 LINEAR-O(N)</span>
          </div>
          <div className="font-mono text-lg font-bold text-[#FF9F0A] leading-tight">
            {engineState.scanLatencyUs.toFixed(2)} µs
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            Zero Quadratic Attention Overhead
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Selective Scan Latency
          </div>
        </div>

        {/* Card 3: ACTIVE LAYERS */}
        <div className="p-1.5 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>ACTIVE LAYERS</span>
            <span className="text-[#10B981] font-bold">✓ LOCKED</span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight">
            LAYERS: {engineState.activeLayersCount}/8
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {engineState.layers.map((l) => (
              <span
                key={l.shortId}
                className={
                  'text-[9px] font-mono text-center rounded border ' +
                  (l.isLocked
                    ? 'bg-[#10B981]/20 border-[#10B981]/50 text-[#10B981]'
                    : 'bg-[#EF4444]/20 border-[#EF4444]/60 text-[#EF4444]')
                }
              >
                {l.shortId}
              </span>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Active Layers: 8 Layers · [L0..L7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="p-1.5 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>TOKEN SCORE</span>
            <span className="text-[#10B981] font-bold">
              +{engineState.engineXpK.toFixed(1)}k ENGINE XP
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight">
            {engineState.processedTokensUnits.toLocaleString()} UNITS
          </div>
          <div className="text-[10px] font-mono text-[#00F0FF] truncate">
            Processed Tokens: {engineState.processedTokensUnits.toLocaleString()} Units
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            SSM State: {engineState.ssmStateLabel}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {TABS.map((tab) => {
          const isCurrent = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
                (isCurrent
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER (Strictly clean of action buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1.5 py-0.5 bg-slate-950/90 border border-slate-800/80 rounded shrink-0">
        VIEW: {activeTab.toUpperCase()} · PTR: 0xEF8DC0 · MODE: MAMBA_HYBRID · LAYERS: 8 · VEC: [
        {engineState.stateVector.map((v) => v.toFixed(2)).join(', ')}]
      </div>

      {/* INTERACTIVE SIMULATION BAY: 8 LAYER MATRIX (L0-L7) + CONTEXTUAL OVERLAY */}
      <main className="flex-1 min-h-0 flex flex-col justify-between my-1 overflow-hidden">
        {/* Contextual Tab Header Strip when in SSM / Scan / Stats / APA */}
        {activeTab === 'APA' && (
          <div className="mb-1 p-1.5 rounded border border-[#00F0FF]/40 bg-slate-900/95 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="text-[10px] font-mono text-slate-200">
              <span className="text-[#00F0FF] font-bold">SOVEREIGN APA VAULT: </span>
              Clean-Room MIT/Apache-2.0 Title · PostgreSQL RLS Schema · Vitest & Pytest Verified
              {apaTransferState === 'TITLE_LOCKED' && (
                <span className="ml-2 text-[#10B981] font-bold">
                  ✓ APA TITLE TRANSFER INITIALIZED
                </span>
              )}
              {apaTransferState === 'VAULT_INQUIRY_LOGGED' && (
                <span className="ml-2 text-[#FF9F0A] font-bold">
                  ✓ VAULT BUYOUT DOSSIER DISPATCHED
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setApaTransferState('TITLE_LOCKED');
                  appendRadioLog(
                    '🟢',
                    'CREW CHIEF',
                    'APA Title Acquisition package locked for GF-T3-266 · Clean-room SBOM verified',
                    engineState.stepCounter + 1
                  );
                }}
                className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] border border-[#10B981]/60 rounded cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setApaTransferState('VAULT_INQUIRY_LOGGED');
                  appendRadioLog(
                    '⚡',
                    'PIT WALL',
                    'Vault Buyout dossier generated · Zero-SaaS outright repository transfer ready',
                    engineState.stepCounter + 1
                  );
                }}
                className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#FF9F0A]/20 hover:bg-[#FF9F0A]/30 text-[#FF9F0A] border border-[#FF9F0A]/60 rounded cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        )}

        {(activeTab === 'SSM' || activeTab === 'Scan' || activeTab === 'Stats') && (
          <div className="mb-1 px-2 py-1 rounded border border-slate-800 bg-slate-950/90 flex items-center justify-between text-[10px] font-mono text-slate-300 shrink-0">
            {activeTab === 'SSM' && (
              <span>
                SSM RECURRENCE: h_t = A_bar * h_(t-1) + B_bar * x_t · ZOH Discretization Delta=0.05 · Dim D=
                {selectedLayer.stateDimension}
              </span>
            )}
            {activeTab === 'Scan' && (
              <span>
                BLELLOCH ASSOCIATIVE SCAN: Parallel Prefix Verified · Complexity: LINEAR-O(N) · Throughput: 27,200 GB/s
              </span>
            )}
            {activeTab === 'Stats' && (
              <span>
                COMPACTION PARITY: 100.0% · Zero Host CPU Sync · Partitioned Supabase RLS Active · Corridor: {engineState.corridor.slice(0, 18)}
              </span>
            )}
            <span className="text-[#10B981] font-bold">✓ LOCKED</span>
          </div>
        )}

        {schemaModalOpen && (
          <div className="mb-1 p-1.5 rounded border border-cyan-500/40 bg-black/95 font-mono text-[9px] text-cyan-300 overflow-hidden shrink-0">
            <div className="flex justify-between items-center mb-0.5 text-white font-bold">
              <span>POSTGRESQL / SUPABASE PARTITIONED RLS SCHEMA (GF-T3-266)</span>
              <button
                type="button"
                onClick={() => setSchemaModalOpen(false)}
                className="text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>
            <pre className="whitespace-pre-wrap leading-tight text-[9px] text-slate-300">
              {SUPABASE_SQL_SCHEMA_EXPORT}
            </pre>
          </div>
        )}

        {/* Interactive Layer Matrix Bay (L0–L7) in a tight 4x2 grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-1 min-h-0">
          {engineState.layers.map((layer) => {
            const isSelected = layer.index === engineState.selectedLayerIndex;
            return (
              <div
                key={layer.shortId}
                onClick={() =>
                  setEngineState((prev) => ({
                    ...prev,
                    selectedLayerIndex: layer.index,
                  }))
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setEngineState((prev) => ({
                      ...prev,
                      selectedLayerIndex: layer.index,
                    }));
                  }
                }}
                className={
                  'py-0 px-1.5 rounded border bg-slate-900/60 flex flex-col justify-between cursor-pointer transition-colors ' +
                  (isSelected
                    ? 'border-[#00F0FF] bg-slate-900/90'
                    : layer.isLocked
                      ? 'border-slate-800 hover:border-slate-700'
                      : 'border-[#EF4444]')
                }
              >
                {/* Line 1: Title & Hex */}
                <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                  <span>{layer.label}</span>
                  <span className="text-slate-400">{layer.hexPtr}</span>
                </div>

                {/* Line 2: Tokens & Mode */}
                <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                  <span>TOK: {layer.tokensK}K</span>
                  <span>SCAN: {layer.scanMode}</span>
                </div>

                {/* Line 3: Latency & State */}
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-[#FF9F0A]">
                    {layer.latencyMs.toFixed(2)}ms
                  </span>
                  <span
                    className={
                      layer.isLocked
                        ? 'text-[#10B981] font-bold'
                        : 'text-[#EF4444] font-bold'
                    }
                  >
                    {layer.statusText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* COMPACT SSM TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {selectedLayer.shortId} · TOK: {selectedLayer.tokensK}K · SCAN:{' '}
        {selectedLayer.scanMode} · RATE: {selectedLayer.ratePct}% · PTR{' '}
        {selectedLayer.hexPtr} · SSM: OK · LOCKED
      </div>

      {/* TACTICAL LAUNCH CONTROL SWITCHES */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleInjectSelectiveScanBurst}
          className="border border-[#FF9F0A] bg-[#FF9F0A]/10 hover:bg-[#FF9F0A]/20 text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          💥 INJECT SSM SELECTIVE SCAN BURST
        </button>

        <button
          type="button"
          onClick={handleToggleDimensionSpike}
          className="border border-[#00F0FF] bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          ⚡ TOGGLE STATE DIMENSION SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepHybridPass}
          className="border border-[#10B981] bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          🚀 STEP HYBRID CONCURRENCY PASS
        </button>

        <button
          type="button"
          onClick={handleFlushSsmStates}
          className="border border-rose-500 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          🔄 FLUSH SSM HIDDEN STATES
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        {radioLogs.slice(-2).map((entry, idx) => (
          <div key={entry.timestamp + '-' + String(idx)} className="truncate">
            [{entry.timestamp}] {entry.badge} {entry.callsign}: {entry.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
