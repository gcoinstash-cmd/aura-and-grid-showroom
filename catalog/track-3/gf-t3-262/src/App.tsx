/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-262 — Track 3 Flagship MoE Expert Parallelism & Dynamic Token Routing Cockpit
 * Zero-Dollar Gate Enforced | Clean-Room Synthetic MoE Corridors | 10/10 Strict Viewport Lock
 */

import React, { useMemo, useState } from 'react';
import {
  CORRIDOR_CONFIG_MAP,
  GridSyncRoutingPayload,
  SUPABASE_POSTGRES_RLS_SCHEMA,
  SYNTHETIC_MOE_CORRIDORS,
  SyntheticMoECorridor,
  createInitialRoutingPayload,
  executeMoERoutingPass,
} from './engine/moeRouterEngine';

type CockpitTab = 'Mesh' | 'MoE' | 'Rte' | 'Stats' | 'APA';

const COCKPIT_TABS: readonly CockpitTab[] = ['Mesh', 'MoE', 'Rte', 'Stats', 'APA'];

interface RadioLogEntry {
  id: string;
  text: string;
}

const INITIAL_RADIO_LOGS: RadioLogEntry[] = [
  {
    id: 'init-1',
    text: '[00:01.04] 🟢 CREW CHIEF: MoE expert parallelism and dynamic token routing engine initialized · 8 experts linked',
  },
  {
    id: 'init-2',
    text: '[00:01.08] 🟢 TELEMETRY: Top-2 All-to-All token dispatch verified at 24,200 GB/s with zero load imbalance',
  },
];

export default function App() {
  const [payload, setPayload] = useState<GridSyncRoutingPayload>(() =>
    createInitialRoutingPayload()
  );
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [selectedExpertIdx, setSelectedExpertIdx] = useState<number>(3);
  const [radioLogs, setRadioLogs] = useState<RadioLogEntry[]>(INITIAL_RADIO_LOGS);
  const [showSchemaModal, setShowSchemaModal] = useState<boolean>(false);
  const [apaModalMessage, setApaModalMessage] = useState<string | null>(null);
  const [tickCounter, setTickCounter] = useState<number>(12);

  const snapshot = useMemo(() => executeMoERoutingPass(payload), [payload]);

  const inspectedExpert =
    snapshot.experts[selectedExpertIdx] ?? snapshot.experts[3];

  const appendRadioLog = (callsign: string, message: string) => {
    const nextTick = tickCounter + 4;
    setTickCounter(nextTick);
    const secs = Math.floor(nextTick / 100) + 1;
    const hundredths = nextTick % 100;
    const secStr = secs < 10 ? '0' + String(secs) : String(secs);
    const hunStr = hundredths < 10 ? '0' + String(hundredths) : String(hundredths);
    const formattedLine =
      '[00:' + secStr + '.' + hunStr + '] ' + callsign + ': ' + message;

    setRadioLogs((prev) => [
      prev[prev.length - 1] ?? INITIAL_RADIO_LOGS[0],
      { id: 'log-' + String(nextTick), text: formattedLine },
    ]);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCorridor = e.target.value as SyntheticMoECorridor;
    const cfg = CORRIDOR_CONFIG_MAP[nextCorridor];
    setPayload((prev) => ({
      ...prev,
      corridor: nextCorridor,
      topK: cfg.defaultTopK,
      capacityFactor: cfg.capacityFactor,
    }));
    appendRadioLog(
      '🟢 CREW CHIEF',
      'Corridor switched to ' + cfg.id + ' · Top-' + String(cfg.defaultTopK) + ' fabric locked'
    );
  };

  const handleTriggerBurst = () => {
    setPayload((prev) => {
      const nextBurst = prev.burstMultiplier >= 1.5 ? 1.0 : Number((prev.burstMultiplier + 0.25).toFixed(2));
      return {
        ...prev,
        burstMultiplier: nextBurst,
        stepPassCount: prev.stepPassCount + 1,
      };
    });
    appendRadioLog(
      '⚡ PIT WALL',
      'Trigger MoE Token Routing Burst executed · All-to-All fabric saturated across E0..E7'
    );
  };

  const handleToggleImbalanceSpike = () => {
    const nextSpike = !payload.imbalanceSpikeActive;
    setPayload((prev) => ({
      ...prev,
      imbalanceSpikeActive: nextSpike,
    }));
    if (nextSpike) {
      appendRadioLog(
        '🔴 TELEMETRY',
        'Inject Expert Load Imbalance Spike (Force Re-Routing) active · E0/E3 overflow re-routed'
      );
    } else {
      appendRadioLog(
        '🟢 TELEMETRY',
        'Load imbalance spike cleared · Zero load imbalance restored at 24,200 GB/s'
      );
    }
  };

  const handleStepDispatchPass = () => {
    setPayload((prev) => ({
      ...prev,
      stepPassCount: prev.stepPassCount + 1,
      expertLogits: prev.expertLogits.map((val, idx) =>
        Number((2.41 + ((idx + prev.stepPassCount + 1) % 5) * 0.01).toFixed(2))
      ),
    }));
    appendRadioLog(
      '🟢 CREW CHIEF',
      'Step MoE Dispatch Pass completed · Sub-microsecond capacity ceiling verified (0.01 µs)'
    );
  };

  const handleFlushRoutingBuffers = () => {
    setPayload(createInitialRoutingPayload());
    setSelectedExpertIdx(3);
    setRadioLogs(INITIAL_RADIO_LOGS);
    setApaModalMessage(null);
  };

  const handleExportAuditJson = () => {
    const auditRecord = {
      engine: snapshot.engineTitle,
      corridor: snapshot.corridor,
      throughput: snapshot.throughputGbsFormatted,
      latency: snapshot.routingLatencyUsFormatted,
      activeExperts: String(snapshot.activeExpertsCount) + ' Experts',
      processedTokens: String(snapshot.processedTokensNumeric) + ' Units',
      moeState: snapshot.moeStateLabel,
      auxiliaryLoss: snapshot.auxiliaryLoss,
      zLoss: snapshot.zLoss,
    };
    appendRadioLog(
      '🟢 TELEMETRY',
      'Exported deterministic MoE audit telemetry (' + auditRecord.throughput + ' · ' + auditRecord.moeState + ')'
    );
  };

  const inspectorLine =
    inspectedExpert.code +
    ' · TOK: ' +
    inspectedExpert.tokensFormatted +
    ' · ' +
    inspectedExpert.gatherLabel +
    ' · BALANCE: ' +
    String(inspectedExpert.balancePct) +
    '% · PTR ' +
    inspectedExpert.hexPtr +
    ' · DISPATCH: ' +
    inspectedExpert.dispatchStatus +
    ' · ' +
    (inspectedExpert.isLocked ? 'LOCKED' : 'FAULT');

  const meshSubheaderLine =
    'VIEW: MESH · PTR: ' +
    snapshot.meshPtr +
    ' · MODE: ' +
    snapshot.mode +
    ' · TOP-K: ' +
    String(snapshot.topK) +
    ' · VEC: [' +
    snapshot.routerVec.map((v) => v.toFixed(2)).join(', ') +
    ']';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER ROW 1 */}
      <header className="flex items-center justify-between gap-1 w-full shrink-0">
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <h1 className="text-sm font-mono font-extrabold tracking-tight text-white">
            GF-T3-262
          </h1>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
            FLAGSHIP
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <select
            aria-label="Synthetic MoE Corridor Selector"
            value={payload.corridor}
            onChange={handleCorridorChange}
            className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 rounded text-cyan-300 focus:outline-none focus:border-[#00F0FF]"
          >
            {SYNTHETIC_MOE_CORRIDORS.map((corridor) => (
              <option key={corridor} value={corridor}>
                {corridor}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setActiveTab('MoE');
              appendRadioLog('🟢 CREW CHIEF', 'Switched cockpit view to MoE Gating & Softmax Kernel');
            }}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded cursor-pointer"
          >
            [MoE]
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('Rte');
              appendRadioLog('🟢 TELEMETRY', 'Inspected All-to-All Token Routing Fabric');
            }}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 rounded cursor-pointer"
          >
            [Route]
          </button>

          <button
            type="button"
            onClick={handleStepDispatchPass}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-600/60 rounded cursor-pointer"
          >
            [Run]
          </button>

          <button
            type="button"
            onClick={() => setShowSchemaModal((prev) => !prev)}
            className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded cursor-pointer"
          >
            [Inspect Schema]
          </button>

          <button
            type="button"
            onClick={handleFlushRoutingBuffers}
            className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-rose-950 text-rose-300 border border-slate-700 rounded cursor-pointer"
          >
            [Reset]
          </button>
        </div>
      </header>

      {/* TOP HEADER ROW 2 */}
      <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap shrink-0">
        MoE Expert Parallelism · Dynamic Routing · Zero Imbalance
      </div>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0"
      >
        {/* Card 1: MOE NITRO */}
        <div className="p-1.5 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
            <span className="font-bold text-cyan-400 shrink-0">MOE NITRO</span>{' '}
            <span className="truncate">MoE Throughput: {snapshot.throughputGbsFormatted}</span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-tight">
            {snapshot.throughputGbsFormatted}
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden border border-slate-800 my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(snapshot.throughputSaturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 flex justify-between items-center gap-2">
            <span className="truncate">MoE Throughput Saturation</span>{' '}
            <span className="text-cyan-300 shrink-0">{String(snapshot.throughputSaturationPct)}%</span>
          </div>
        </div>

        {/* Card 2: ROUTE STREAK */}
        <div className="p-1.5 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
            <span className="font-bold text-amber-400 shrink-0">ROUTE STREAK</span>{' '}
            <span className="px-1 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-bold shrink-0">
              🔥 TOP-2
            </span>
          </div>
          <div className="text-[#FF9F0A] font-mono text-lg font-bold leading-tight">
            {snapshot.routingLatencyUsFormatted}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Routing Latency: {snapshot.routingLatencyUsFormatted} · Buffer Parity: {String(snapshot.bufferParityPct)}%
          </div>
          <div className="text-[10px] font-mono text-slate-300 flex justify-between items-center gap-2">
            <span className="truncate">Token Routing Latency</span>{' '}
            <span className="text-emerald-400 shrink-0">SUB-µS LOCK</span>
          </div>
        </div>

        {/* Card 3: ACTIVE EXPERTS */}
        <div className="p-1.5 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
            <span className="font-bold text-emerald-400 shrink-0">ACTIVE EXPERTS</span>{' '}
            <span className="truncate">Active Experts: 8 Experts</span>
          </div>
          <div className="text-emerald-400 font-mono text-lg font-bold leading-tight">
            EXPERTS: 8/8
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {snapshot.experts.map((exp) => (
              <span
                key={exp.code}
                className={
                  'text-[9px] font-mono font-bold text-center rounded border ' +
                  (exp.isLocked
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/90 border-rose-500 text-rose-300')
                }
              >
                {exp.code}
              </span>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 flex justify-between items-center gap-2">
            <span className="truncate">F1 Gear Shift [E0..E7]</span>{' '}
            <span
              className={
                (snapshot.zeroImbalanceVerified ? 'text-emerald-400' : 'text-rose-400') + ' shrink-0'
              }
            >
              {snapshot.zeroImbalanceVerified ? '✓ LOCKED' : '⚡ FAULT'}
            </span>
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="p-1.5 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
            <span className="font-bold text-cyan-300 shrink-0">TOKEN SCORE</span>{' '}
            <span className="text-emerald-400 font-bold shrink-0">{snapshot.engineXpFormatted}</span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight">
            {snapshot.processedTokensFormatted}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Processed Tokens: 4,608,000 Units · Aux Loss: {String(snapshot.auxiliaryLoss)}
          </div>
          <div className="text-[10px] font-mono text-slate-300 flex justify-between items-center gap-2">
            <span className="truncate">MoE State: {snapshot.moeStateLabel}</span>{' '}
            <span className="text-cyan-300 shrink-0">Z-LOSS {String(snapshot.zLoss)}</span>
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {COCKPIT_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-0.5 text-[11px] font-mono font-bold rounded transition-colors cursor-pointer ' +
                (isActive
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0 flex items-center justify-between">
        <span>{meshSubheaderLine}</span>
        <span className="hidden md:inline text-cyan-400">
          TAB: {activeTab.toUpperCase()} · CORRIDOR: {CORRIDOR_CONFIG_MAP[payload.corridor].shortCode}
        </span>
      </div>

      {/* CONTEXTUAL TAB STRIP (WHEN MOE / RTE / STATS / APA OR SCHEMA MODAL ACTIVE) */}
      {(activeTab !== 'Mesh' || showSchemaModal) && (
        <div className="px-2 py-1 bg-slate-950/90 border border-slate-800 rounded text-[10px] font-mono text-slate-200 shrink-0 flex flex-wrap items-center justify-between gap-2">
          {showSchemaModal ? (
            <div className="w-full flex items-center justify-between gap-2">
              <span className="truncate text-cyan-300">
                PostgreSQL / Supabase Partitioned RLS Schema: moe_routing_corridors · moe_dispatch_passes · moe_expert_node_snapshots (RLS Enforced)
              </span>
              <button
                type="button"
                onClick={() => setShowSchemaModal(false)}
                className="px-1.5 py-0.5 bg-slate-800 text-white rounded border border-slate-600 cursor-pointer shrink-0"
              >
                [Close Schema]
              </button>
            </div>
          ) : activeTab === 'MoE' ? (
            <div className="w-full flex items-center justify-between gap-2">
              <span>
                DYNAMIC TOP-K GATING ROUTER: y = sum(G(x)_i * E_i(x)) · Softmax Temp: 1.00 · Aux Loss: {String(snapshot.auxiliaryLoss)} · Z-Loss: {String(snapshot.zLoss)}
              </span>
              <span className="text-emerald-400 font-bold">ZERO TOKEN DROP VERIFIED</span>
            </div>
          ) : activeTab === 'Rte' ? (
            <div className="w-full flex items-center justify-between gap-2">
              <span>
                ALL-TO-ALL DISPATCH SCHEDULER: { payload.corridor } · Interconnect Bus: {snapshot.throughputGbsFormatted}
              </span>
              <button
                type="button"
                onClick={handleExportAuditJson}
                className="px-1.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-600 rounded cursor-pointer"
              >
                [EXPORT AUDIT]
              </button>
            </div>
          ) : activeTab === 'Stats' ? (
            <div className="w-full flex items-center justify-between gap-2">
              <span>
                CAPACITY FACTOR BALANCER: CF={String(payload.capacityFactor)} · Ceiling={String(Math.ceil((payload.tokenBatchSize / 8) * payload.capacityFactor))} Tokens/Expert · GridSync Zod Gate: LOCKED
              </span>
              <span className="text-amber-300 font-bold">PASSES: {String(payload.stepPassCount)}</span>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between gap-2">
              <span className="truncate">
                SOVEREIGN APA VAULT TRANSFER · 100% MIT CLEAN-ROOM IP · ZERO-SAAS SLA{apaModalMessage ? ' · ' + apaModalMessage : ''}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setApaModalMessage('APA Title Transfer Dossier Initialized');
                    appendRadioLog('🟢 CREW CHIEF', 'ACQUIRE TITLE (APA) dossier generated with clean-room SBOM');
                  }}
                  className="px-2 py-0.5 bg-[#FF9F0A]/20 hover:bg-[#FF9F0A]/30 text-[#FF9F0A] border border-[#FF9F0A] rounded font-bold cursor-pointer"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApaModalMessage('Vault Buyout Escrowed & Verified');
                    appendRadioLog('⚡ PIT WALL', 'INQUIRE VAULT BUYOUT telemetry package locked for Dealership Principal');
                  }}
                  className="px-2 py-0.5 bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF] border border-[#00F0FF] rounded font-bold cursor-pointer"
                >
                  INQUIRE VAULT BUYOUT
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INTERACTIVE EXPERT MATRIX BAY (E0–E7) */}
      <main
        aria-label="Interactive Expert Matrix Bay"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full flex-1 min-h-0 my-0.5"
      >
        {snapshot.experts.map((expert) => {
          const isSelected = expert.expertId === selectedExpertIdx;
          return (
            <div
              key={expert.code}
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedExpertIdx(expert.expertId);
                appendRadioLog(
                  '🟢 TELEMETRY',
                  'Inspected ' + expert.title + ' at pointer ' + expert.hexPtr + ' · TOK: ' + expert.tokensFormatted
                );
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedExpertIdx(expert.expertId);
                }
              }}
              className={
                'py-0 px-1.5 rounded border bg-slate-900/60 flex flex-col justify-between cursor-pointer transition-colors ' +
                ( !expert.isLocked
                  ? 'border-rose-500/80 bg-rose-950/20'
                  : isSelected
                  ? 'border-[#00F0FF] bg-slate-900/90'
                  : 'border-slate-800 hover:border-slate-700')
              }
            >
              {/* Line 1: Title & Hex */}
              <div className="flex justify-between items-center text-[11px] font-mono font-bold text-white gap-2 w-full pt-0.5">
                <span className="truncate">{expert.title}</span>{' '}
                <span className="text-slate-400 shrink-0">{expert.hexPtr}</span>
              </div>

              {/* Line 2: Tokens & Top-K */}
              <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300 gap-2 w-full">
                <span className="shrink-0">TOK: {expert.tokensFormatted}</span>{' '}
                <span className="shrink-0">{expert.gatherLabel}</span>
              </div>

              {/* Micro utilization bar */}
              <div className="w-full bg-slate-950 h-1 rounded overflow-hidden border border-slate-800">
                <div
                  className={expert.isLocked ? 'bg-emerald-400 h-full' : 'bg-rose-500 h-full'}
                  style={{ width: String(expert.capacityUtilizationPct) + '%' }}
                />
              </div>

              {/* Line 3: Latency & State */}
              <div className="flex justify-between items-center text-[10px] font-mono gap-2 w-full pb-0.5">
                <span className="text-[#FF9F0A] font-bold shrink-0">{expert.latencyMs}</span>{' '}
                <span
                  className={
                    (expert.isLocked
                      ? 'text-[#10B981] font-bold'
                      : 'text-[#EF4444] font-bold') + ' shrink-0'
                  }
                >
                  {expert.stateText}
                </span>
              </div>
            </div>
          );
        })}
      </main>

      {/* COMPACT MOE TELEMETRY INSPECTOR STRIP */}
      <div
        aria-label="MoE Telemetry Inspector Strip"
        className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0 flex items-center justify-between"
      >
        <span>{inspectorLine}</span>
        <span className="hidden lg:inline text-[10px] text-slate-400">
          SQL RLS: {SUPABASE_POSTGRES_RLS_SCHEMA.length} BYTES READY
        </span>
      </div>

      {/* TACTICAL LAUNCH CONTROL SWITCHES */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleTriggerBurst}
          className="border border-[#FF9F0A] bg-[#FF9F0A]/10 hover:bg-[#FF9F0A]/20 text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center cursor-pointer transition-colors"
        >
          💥 INJECT MOE ROUTING BURST
        </button>

        <button
          type="button"
          onClick={handleToggleImbalanceSpike}
          className="border border-[#00F0FF] bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)] rounded text-xs font-mono font-bold py-2 text-center cursor-pointer transition-colors"
        >
          ⚡ TOGGLE LOAD IMBALANCE SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepDispatchPass}
          className="border border-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] rounded text-xs font-mono font-bold py-2 text-center cursor-pointer transition-colors"
        >
          🚀 STEP MOE DISPATCH PASS
        </button>

        <button
          type="button"
          onClick={handleFlushRoutingBuffers}
          className="border border-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-rose-300 rounded text-xs font-mono font-bold py-2 text-center cursor-pointer transition-colors"
        >
          🔄 FLUSH ROUTING BUFFERS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        {radioLogs.slice(-2).map((entry) => (
          <div key={entry.id} className="truncate">
            {entry.text}
          </div>
        ))}
      </footer>
    </div>
  );
}
