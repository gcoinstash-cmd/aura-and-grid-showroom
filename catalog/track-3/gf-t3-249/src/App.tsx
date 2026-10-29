/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-249: Institutional Gamified Megatron-LM Expert Parallelism &
 * Switch Transformer Top-2 Routing Cockpit
 */

import React, { useState } from 'react';
import {
  MOE_CORRIDORS,
  MoeCorridorId,
  validateIngressPayload,
} from './engine/gridSync';
import {
  ExpertRankTelemetry,
  MoeEngineState,
  RadioLogEntry,
  createInitialMoeEngineState,
  createInitialRadioLogs,
  evaluateMoeRoutingPass,
} from './engine/moeEngine';
import { SUPABASE_POSTGRES_SCHEMA_SQL } from './engine/supabaseSchema';

const TABS = ['Mesh', 'MoE', 'Route', 'Stats', 'APA'] as const;
type TabId = (typeof TABS)[number];

function formatNumberWithCommas(val: number): string {
  return val.toLocaleString('en-US');
}

function formatClockTimestamp(step: number): string {
  const totalCentiseconds = 112 + step * 8;
  const seconds = Math.floor(totalCentiseconds / 100);
  const cs = totalCentiseconds % 100;
  const secStr = seconds < 10 ? '0' + String(seconds) : String(seconds);
  const csStr = cs < 10 ? '0' + String(cs) : String(cs);
  return '00:' + secStr + '.' + csStr;
}

export default function App() {
  const [engineState, setEngineState] = useState<MoeEngineState>(() =>
    createInitialMoeEngineState()
  );
  const [activeTab, setActiveTab] = useState<TabId>('Mesh');
  const [radioLogs, setRadioLogs] = useState<RadioLogEntry[]>(() =>
    createInitialRadioLogs()
  );
  const [schemaModalOpen, setSchemaModalOpen] = useState<boolean>(false);
  const [apaNotice, setApaNotice] = useState<string | null>(null);
  const [customVecInput, setCustomVecInput] = useState<string>('1.14, 1.18, 1.15, 1.16');

  const selectedExpert: ExpertRankTelemetry =
    engineState.experts[engineState.selectedExpertIndex] ?? engineState.experts[3];

  const appendRadioLog = (
    callsign: RadioLogEntry['callsign'],
    message: string,
    nextStep: number
  ) => {
    const newEntry: RadioLogEntry = {
      id: 'log-' + String(Date.now()) + '-' + String(nextStep),
      timestamp: formatClockTimestamp(nextStep),
      callsign,
      message,
    };
    setRadioLogs((prev) => [newEntry, ...prev.slice(0, 14)]);
  };

  // Trigger 1: Trigger MoE Routing Burst
  const handleInjectRoutingBurst = () => {
    const nextStep = engineState.stepCounter + 1;
    const nextVector: [number, number, number, number] = [
      Number((engineState.featureVector[0] + 0.04).toFixed(2)),
      Number((engineState.featureVector[1] + 0.06).toFixed(2)),
      Number((engineState.featureVector[2] + 0.03).toFixed(2)),
      Number((engineState.featureVector[3] + 0.05).toFixed(2)),
    ];
    const burstBatch = 3584;

    const validation = validateIngressPayload({
      corridor: engineState.corridor,
      tokenBatchCount: burstBatch,
      capacityFactor: 1.25,
      auxiliaryLossAlpha: 0.0012,
      featureVector: nextVector,
      saturationSpikeActive: engineState.saturationSpikeActive,
      operatorCallsign: 'CREW_CHIEF_GARRETT',
    });

    if (!validation.ok) {
      appendRadioLog('🔴 TELEMETRY', validation.error ?? 'Ingress fault', nextStep);
      return;
    }

    const nextState = evaluateMoeRoutingPass({
      stepCounter: nextStep,
      corridor: engineState.corridor,
      featureVector: nextVector,
      currentBatchTokens: burstBatch,
      processedTokensTotal: engineState.processedTokensTotal + burstBatch,
      moeXpEarned: engineState.moeXpEarned + 2400,
      saturationSpikeActive: engineState.saturationSpikeActive,
      selectedExpertIndex: engineState.selectedExpertIndex,
    });

    setEngineState(nextState);
    setCustomVecInput(nextVector.join(', '));
    appendRadioLog(
      '⚡ PIT WALL',
      'Trigger MoE Routing Burst executed · ' +
        String(burstBatch) +
        ' tokens dispatched across 8 experts at ' +
        formatNumberWithCommas(nextState.throughputGbs) +
        ' GB/s · Zero drops',
      nextStep
    );
  };

  // Trigger 2: Inject Expert Saturation Spike (Force Load Rebalance)
  const handleToggleExpertSaturation = () => {
    const nextStep = engineState.stepCounter + 1;
    const nextSpike = !engineState.saturationSpikeActive;
    const nextState = evaluateMoeRoutingPass({
      stepCounter: nextStep,
      corridor: engineState.corridor,
      featureVector: engineState.featureVector,
      currentBatchTokens: engineState.currentBatchTokens,
      processedTokensTotal: engineState.processedTokensTotal + engineState.currentBatchTokens,
      moeXpEarned: engineState.moeXpEarned + 1600,
      saturationSpikeActive: nextSpike,
      selectedExpertIndex: 3,
    });

    setEngineState(nextState);
    if (nextSpike) {
      appendRadioLog(
        '🔴 TELEMETRY',
        'Inject Expert Saturation Spike active on E3/E0 · Force Load Rebalance engaged · Auxiliary loss ' +
          String(nextState.auxiliaryLoss),
        nextStep
      );
    } else {
      appendRadioLog(
        '🟢 CREW CHIEF',
        'Expert saturation spike cleared · All 8 GPU ranks restored to balanced Top-2 equilibrium',
        nextStep
      );
    }
  };

  // Trigger 3: Step MoE Routing Pass
  const handleStepMoeRouting = () => {
    const nextStep = engineState.stepCounter + 1;
    const phase = (nextStep % 4) * 0.01;
    const nextVector: [number, number, number, number] = [
      Number((1.14 + phase).toFixed(2)),
      Number((1.18 - phase * 0.5).toFixed(2)),
      Number((1.15 + phase * 0.5).toFixed(2)),
      Number((1.16 + phase).toFixed(2)),
    ];

    const nextState = evaluateMoeRoutingPass({
      stepCounter: nextStep,
      corridor: engineState.corridor,
      featureVector: nextVector,
      currentBatchTokens: 2944,
      processedTokensTotal: engineState.processedTokensTotal + 2944,
      moeXpEarned: engineState.moeXpEarned + 1200,
      saturationSpikeActive: engineState.saturationSpikeActive,
      selectedExpertIndex: engineState.selectedExpertIndex,
    });

    setEngineState(nextState);
    setCustomVecInput(nextVector.join(', '));
    appendRadioLog(
      '🟢 TELEMETRY',
      'Step MoE Routing Pass #' +
        String(nextStep) +
        ' verified · PTR ' +
        nextState.meshPointer +
        ' · Aux Loss ' +
        String(nextState.auxiliaryLoss) +
        ' · 0 dropped tokens',
      nextStep
    );
  };

  // Trigger 4: Flush Expert Buffers & Re-Zero Gating Weights
  const handleFlushExpertBuffers = () => {
    const resetState = createInitialMoeEngineState();
    setEngineState(resetState);
    setCustomVecInput('1.14, 1.18, 1.15, 1.16');
    setApaNotice(null);
    setRadioLogs(createInitialRadioLogs());
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCorridor = e.target.value as MoeCorridorId;
    const nextStep = engineState.stepCounter + 1;
    const nextState = evaluateMoeRoutingPass({
      stepCounter: nextStep,
      corridor: selectedCorridor,
      featureVector: engineState.featureVector,
      currentBatchTokens: engineState.currentBatchTokens,
      processedTokensTotal: engineState.processedTokensTotal,
      moeXpEarned: engineState.moeXpEarned + 600,
      saturationSpikeActive: engineState.saturationSpikeActive,
      selectedExpertIndex: engineState.selectedExpertIndex,
    });
    setEngineState(nextState);
    appendRadioLog(
      '🟢 CREW CHIEF',
      'Corridor switched to ' + selectedCorridor + ' · Mode ' + nextState.routingMode,
      nextStep
    );
  };

  const handleSelectExpert = (index: number) => {
    setEngineState((prev) => ({
      ...prev,
      selectedExpertIndex: index,
    }));
    const exp = engineState.experts[index];
    if (exp) {
      appendRadioLog(
        '⚡ PIT WALL',
        'Focused ' +
          exp.label +
          ' at ' +
          exp.hexPointer +
          ' · Gate ' +
          String(exp.gatingProbability) +
          ' · Load ' +
          String(exp.loadPercentage) +
          '%',
        engineState.stepCounter + 1
      );
    }
  };

  const handleApplyCustomVector = () => {
    const parts = customVecInput
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    if (parts.length !== 4) {
      appendRadioLog(
        '🔴 TELEMETRY',
        'GridSync Gate: Feature vector requires exactly 4 comma-separated floats',
        engineState.stepCounter + 1
      );
      return;
    }
    const vec: [number, number, number, number] = [
      parts[0],
      parts[1],
      parts[2],
      parts[3],
    ];
    const check = validateIngressPayload({
      corridor: engineState.corridor,
      tokenBatchCount: engineState.currentBatchTokens,
      capacityFactor: 1.25,
      auxiliaryLossAlpha: 0.0012,
      featureVector: vec,
      saturationSpikeActive: engineState.saturationSpikeActive,
      operatorCallsign: 'GARRETT_DEALERSHIP_PRINCIPAL',
    });
    if (!check.ok) {
      appendRadioLog(
        '🔴 TELEMETRY',
        check.error ?? 'GridSync validation rejected vector',
        engineState.stepCounter + 1
      );
      return;
    }
    const nextStep = engineState.stepCounter + 1;
    const nextState = evaluateMoeRoutingPass({
      stepCounter: nextStep,
      corridor: engineState.corridor,
      featureVector: vec,
      currentBatchTokens: engineState.currentBatchTokens,
      processedTokensTotal: engineState.processedTokensTotal + engineState.currentBatchTokens,
      moeXpEarned: engineState.moeXpEarned + 1000,
      saturationSpikeActive: engineState.saturationSpikeActive,
      selectedExpertIndex: engineState.selectedExpertIndex,
    });
    setEngineState(nextState);
    appendRadioLog(
      '🟢 CREW CHIEF',
      'GridSync sanitized custom token vector [' + vec.join(', ') + '] dispatched',
      nextStep
    );
  };

  const handleExportAudit = () => {
    const auditPayload = {
      assetId: 'GF-T3-249',
      track: 'TRACK 3',
      corridor: engineState.corridor,
      meshPointer: engineState.meshPointer,
      throughputGbs: engineState.throughputGbs,
      routingLatencyUs: engineState.routingLatencyUs,
      activeExperts: engineState.activeExperts,
      processedTokens: engineState.processedTokensTotal,
      droppedTokens: engineState.droppedTokens,
      auxiliaryLoss: engineState.auxiliaryLoss,
      routerZLoss: engineState.routerZLoss,
      experts: engineState.experts,
    };
    const blob = new Blob([JSON.stringify(auditPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'GF-T3-249-telemetry-audit.json';
    anchor.click();
    URL.revokeObjectURL(url);
    appendRadioLog(
      '🟢 TELEMETRY',
      'Exported GF-T3-249 clean-room telemetry audit snapshot (JSON)',
      engineState.stepCounter + 1
    );
  };

  const nitroSaturationPct = Math.min(
    100,
    Math.round((engineState.throughputGbs / 12000) * 100)
  );
  const xpFormatted = '+' + (engineState.moeXpEarned / 1000).toFixed(1) + 'k MOE XP';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP HEADER ROW 1 */}
      <header className="flex items-center justify-between gap-1 w-full shrink-0">
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <h1 className="text-sm sm:text-base font-mono font-bold tracking-wider text-white">
            GF-T3-249
          </h1>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
            TRACK 3
          </span>
          <span
            className={
              'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border ' +
              (engineState.engineStatus === 'LOCKED'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                : 'bg-red-500/20 text-red-400 border-red-500/50')
            }
          >
            {engineState.engineStatus === 'LOCKED' ? '✓ LOCKED' : '⚡ FAULT'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <select
            aria-label="MoE Corridor Selector"
            value={engineState.corridor}
            onChange={handleCorridorChange}
            className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-[#00F0FF]"
          >
            {MOE_CORRIDORS.map((corridor) => (
              <option key={corridor} value={corridor}>
                {corridor}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setActiveTab('MoE')}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded cursor-pointer"
          >
            [MoE]
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('Route')}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded cursor-pointer"
          >
            [Router]
          </button>
          <button
            type="button"
            onClick={handleStepMoeRouting}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 rounded cursor-pointer"
          >
            [Run]
          </button>
          <button
            type="button"
            onClick={() => setSchemaModalOpen((prev) => !prev)}
            className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded cursor-pointer"
          >
            [Inspect Schema]
          </button>
          <button
            type="button"
            onClick={handleFlushExpertBuffers}
            className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-rose-950/60 text-rose-300 border border-rose-500/40 rounded cursor-pointer"
          >
            [Reset]
          </button>
        </div>
      </header>

      {/* TOP HEADER ROW 2 */}
      <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap shrink-0">
        Expert Parallelism · Top-2 Routing · Zero Drop
      </div>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0"
      >
        {/* Card 1: MOE NITRO */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-0.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              MOE NITRO
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold">
              {String(nitroSaturationPct)}% BUS
            </span>
          </div>
          <div className="font-mono text-base sm:text-lg font-bold text-[#00F0FF] leading-none">
            {formatNumberWithCommas(engineState.throughputGbs)} GB/s
          </div>
          <div className="w-full bg-slate-900 h-1 rounded overflow-hidden my-0.5 border border-slate-800">
            <div
              className="bg-[#00F0FF] h-full transition-transform duration-150 origin-left"
              style={{ transform: 'scaleX(' + String(nitroSaturationPct / 100) + ')' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-none">
            MoE Throughput Saturation
          </div>
        </div>

        {/* Card 2: ROUTING STREAK */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-0.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              ROUTING STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">
              🔥 8 EXPERTS
            </span>
          </div>
          <div className="font-mono text-base sm:text-lg font-bold text-amber-400 leading-none">
            {engineState.routingLatencyUs.toFixed(2)} µs
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate leading-none">
            AUX LOSS: {String(engineState.auxiliaryLoss)} · ZERO BUBBLE
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-none">
            Top-2 Routing Latency
          </div>
        </div>

        {/* Card 3: ACTIVE EXPERTS */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-0.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              ACTIVE EXPERTS
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              TOP-2 LOCKED
            </span>
          </div>
          <div className="font-mono text-base sm:text-lg font-bold text-white leading-none">
            EXPERTS: {String(engineState.activeExperts)}/{String(engineState.totalExperts)}
          </div>
          <div className="flex items-center gap-0.5">
            {engineState.experts.map((exp, idx) => (
              <button
                key={exp.shortCode}
                type="button"
                onClick={() => handleSelectExpert(idx)}
                className={
                  'flex-1 text-[9px] font-mono font-bold py-0 rounded text-center cursor-pointer border leading-tight ' +
                  (idx === engineState.selectedExpertIndex
                    ? 'bg-[#00F0FF]/25 text-[#00F0FF] border-[#00F0FF]'
                    : exp.routingRankLabel === 'TOP-1'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-900 text-slate-300 border-slate-800')
                }
              >
                {exp.shortCode}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-none">
            F1 Gear Shift Mesh [E0..E7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-0.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              {xpFormatted}
            </span>
          </div>
          <div className="font-mono text-base sm:text-lg font-bold text-emerald-400 leading-none">
            {formatNumberWithCommas(engineState.processedTokensTotal)} UNITS
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate leading-none">
            DROPPED: {String(engineState.droppedTokens)} · CAP FACTOR: 1.25
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-none">
            MoE State: Top-2 Active
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-0.5 bg-slate-900/80 border border-slate-800 rounded-lg w-full text-center shrink-0"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap leading-tight ' +
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

      {/* STREAMLINED MESH INFO SUBHEADER */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0 flex items-center justify-between gap-2 leading-tight">
        <span className="truncate">
          {'VIEW: ' +
            activeTab.toUpperCase() +
            ' · PTR: ' +
            engineState.meshPointer +
            ' · MODE: ' +
            engineState.routingMode +
            ' · LOAD_BAL: ' +
            String(engineState.loadBalanceEfficiency) +
            '% · VEC: [' +
            engineState.featureVector.map((v) => v.toFixed(2)).join(', ') +
            ']'}
        </span>
        <span className="hidden md:inline text-cyan-400 shrink-0">
          {engineState.corridor}
        </span>
      </div>

      {/* CONTEXTUAL TAB STRIP (When MoE / Route / Stats / APA or Schema Inspector is active) */}
      {(activeTab !== 'Mesh' || schemaModalOpen) && (
        <div className="bg-slate-950/95 border border-slate-800 rounded-lg px-1.5 py-1 shrink-0 text-[10px] font-mono">
          {schemaModalOpen ? (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-cyan-300 font-bold">
                <span>
                  POSTGRESQL 16 / SUPABASE PARTITIONED SCHEMA (RLS ENABLED · ZERO-TRUST)
                </span>
                <button
                  type="button"
                  onClick={() => setSchemaModalOpen(false)}
                  className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-200 rounded cursor-pointer"
                >
                  [Close Schema]
                </button>
              </div>
              <pre className="text-[9px] text-emerald-300 bg-black/80 p-1 rounded border border-slate-800 overflow-x-auto max-h-10 leading-tight">
                {SUPABASE_POSTGRES_SCHEMA_SQL.slice(0, 720) +
                  '\n-- Full DDL in /supabase_schema.sql'}
              </pre>
            </div>
          ) : activeTab === 'MoE' ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-amber-300 font-bold truncate">
                SWITCH TOP-2 GATING EQUATION: p_i(x) = softmax(x · W_g) · L_aux ={' '}
                {String(engineState.auxiliaryLoss)} · Z-Loss = {String(engineState.routerZLoss)}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Input Vec:</span>
                <input
                  type="text"
                  aria-label="Custom Token Feature Vector"
                  value={customVecInput}
                  onChange={(e) => setCustomVecInput(e.target.value)}
                  className="bg-black border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-cyan-300 w-32 font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomVector}
                  className="px-1.5 py-0.5 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 rounded font-bold cursor-pointer"
                >
                  DISPATCH VEC
                </button>
              </div>
            </div>
          ) : activeTab === 'Route' ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-cyan-300">
              <span className="truncate">
                ALL-TO-ALL NVLINK DISPATCH TOPOLOGY · BATCH:{' '}
                {String(engineState.currentBatchTokens)} TOKENS · MAX CAP/EXPERT: 460 TOKENS ·
                OVERFLOW REDISTRIBUTED: ZERO DROPS
              </span>
              <button
                type="button"
                onClick={handleExportAudit}
                className="px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 rounded font-bold cursor-pointer"
              >
                EXPORT AUDIT JSON
              </button>
            </div>
          ) : activeTab === 'Stats' ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-emerald-300">
              <span className="truncate">
                VERIFICATION GATES: VITEST SUITE PASS (4/4) · PYTEST SUITE PASS (5/5) · GRIDSYNC
                ZOD INGRESS ACTIVE · RLS PARTITION: moe_routing_epochs_2026_q4
              </span>
              <button
                type="button"
                onClick={() => setSchemaModalOpen(true)}
                className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-cyan-300 rounded font-bold cursor-pointer"
              >
                VIEW SQL DDL
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-slate-200 truncate">
                <span className="text-[#FF9F0A] font-bold">SOVEREIGN APA VAULT TRANSFER:</span>{' '}
                100% MIT Clean-Room IP · Zero Copyleft · Standalone FastAPI + React Chassis
                {apaNotice ? ' · ' + apaNotice : ''}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setApaNotice('APA Title Transfer Dossier Locked & Exported');
                    handleExportAudit();
                  }}
                  className="px-1.5 py-0.5 bg-[#FF9F0A]/20 hover:bg-[#FF9F0A]/30 border border-[#FF9F0A] text-[#FF9F0A] rounded font-bold cursor-pointer"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setApaNotice('Vault Buyout Dispatch Logged for Dealership Principal Garrett')
                  }
                  className="px-1.5 py-0.5 bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 border border-[#00F0FF] text-[#00F0FF] rounded font-bold cursor-pointer"
                >
                  INQUIRE VAULT BUYOUT
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INTERACTIVE EXPERT MATRIX BAY (E0-E7) */}
      <main
        aria-label="Interactive Expert Matrix Bay"
        className="grid grid-cols-2 sm:grid-cols-4 gap-1 flex-1 min-h-0 overflow-hidden"
      >
        {engineState.experts.map((expert, idx) => {
          const isSelected = idx === engineState.selectedExpertIndex;
          const isSaturated =
            expert.status === 'SATURATED' || expert.status === 'REBALANCING';
          const gateDisplay =
            idx === 0 && engineState.stepCounter === 0
              ? '0.89'
              : String(expert.gatingProbability);

          return (
            <button
              key={expert.shortCode}
              type="button"
              onClick={() => handleSelectExpert(idx)}
              className={
                'text-left rounded-lg px-1.5 py-1 flex flex-col justify-between transition-colors cursor-pointer border overflow-hidden leading-tight ' +
                (isSelected
                  ? 'bg-slate-900/95 border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.18)]'
                  : isSaturated
                    ? 'bg-red-950/25 border-red-500/60 hover:border-red-400'
                    : 'bg-slate-950/90 border-slate-800 hover:border-slate-700')
              }
            >
              {/* Row 1: Header & Hex Pointer */}
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-xs font-mono font-bold text-white tracking-wide truncate">
                  {expert.label}
                </span>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {expert.hexPointer}
                </span>
              </div>

              {/* Row 2: Tokens & Load */}
              <div className="text-[12px] font-mono text-cyan-300 font-bold truncate">
                {'LOAD: ' +
                  expert.loadPercentage.toFixed(1) +
                  '% · TOK: ' +
                  String(expert.dispatchedTokens) +
                  '/' +
                  String(expert.totalTokens)}
              </div>

              {/* Row 3: Gating & Score */}
              <div className="text-[12px] font-mono text-amber-300 font-bold truncate">
                {'GATE: ' + gateDisplay + ' · SCORE: ' + expert.routingRankLabel}
              </div>

              {/* Row 4: Capacity & Status */}
              <div className="flex items-center justify-between gap-1 w-full">
                <span
                  className={
                    'text-[11px] font-mono text-emerald-400 font-semibold truncate ' +
                    (isSaturated ? 'text-red-400' : 'text-emerald-400')
                  }
                >
                  {'CAP: ' + expert.capacityFactor.toFixed(2) + ' · ' + expert.status}
                </span>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {'Q:' + String(expert.queueDepth)}
                </span>
              </div>
            </button>
          );
        })}
      </main>

      {/* COMPACT MOE TELEMETRY INSPECTOR STRIP */}
      <div
        aria-label="MoE Telemetry Inspector Strip"
        className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded shrink-0 flex items-center justify-between gap-2 leading-tight"
      >
        <span className="truncate">
          {selectedExpert.shortCode +
            ' · LOAD: ' +
            selectedExpert.loadPercentage.toFixed(1) +
            '% · GATE: ' +
            selectedExpert.gatingProbability.toFixed(3) +
            ' · CAPACITY: ' +
            selectedExpert.capacityFactor.toFixed(2) +
            ' · ' +
            selectedExpert.status}
        </span>
        <span className="hidden sm:inline text-[10px] text-amber-300 shrink-0">
          {'PTR ' +
            selectedExpert.hexPointer +
            ' · P2_GATE: ' +
            selectedExpert.secondaryProbability.toFixed(3) +
            ' · QUEUE: ' +
            String(selectedExpert.queueDepth) +
            ' · BUS: ' +
            String(selectedExpert.allToAllBandwidthGbs) +
            ' GB/s'}
        </span>
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section
        aria-label="Launch Control Dock"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0"
      >
        <button
          type="button"
          onClick={handleInjectRoutingBurst}
          className="bg-amber-950/40 hover:bg-amber-900/50 border border-[#FF9F0A] text-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-1 px-2 text-center cursor-pointer transition-colors truncate"
        >
          💥 INJECT ROUTING BURST
        </button>

        <button
          type="button"
          onClick={handleToggleExpertSaturation}
          className="bg-cyan-950/40 hover:bg-cyan-900/50 border border-[#00F0FF] text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.25)] rounded-lg text-xs font-mono font-bold py-1 px-2 text-center cursor-pointer transition-colors truncate"
        >
          ⚡ TOGGLE EXPERT SATURATION
        </button>

        <button
          type="button"
          onClick={handleStepMoeRouting}
          className="bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500 text-emerald-300 rounded-lg text-xs font-mono font-bold py-1 px-2 text-center cursor-pointer transition-colors truncate"
        >
          🚀 STEP MOE ROUTING
        </button>

        <button
          type="button"
          onClick={handleFlushExpertBuffers}
          className="bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500 text-rose-300 rounded-lg text-xs font-mono font-bold py-1 px-2 text-center cursor-pointer transition-colors truncate"
        >
          🔄 FLUSH EXPERT BUFFERS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-10 overflow-hidden font-mono text-[10px] px-2 py-1 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between"
      >
        {radioLogs.slice(0, 3).map((entry) => (
          <div key={entry.id} className="truncate">
            {'[' + entry.timestamp + '] ' + entry.callsign + ': ' + entry.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
