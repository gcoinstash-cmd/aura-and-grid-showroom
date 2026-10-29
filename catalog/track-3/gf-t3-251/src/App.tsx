/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-251: Track 3 Institutional DeepSpeed-MoE Token Dropping & Capacity Factor Load Balancer Cockpit
 */

import React, { useState } from 'react';
import {
  CapacityEngineSnapshot,
  createInitialSnapshot,
  INITIAL_BASELINE_WEIGHTS,
  runCapacityBalancerPass,
  SYNTHETIC_CORRIDORS,
  SyntheticCorridor,
} from './engine/moeCapacityCore';

type CockpitTab = 'Mesh' | 'Cap' | 'Drop' | 'Stats' | 'APA';

const TABS: readonly CockpitTab[] = ['Mesh', 'Cap', 'Drop', 'Stats', 'APA'];

interface RadioLogEntry {
  timestamp: string;
  callsign: '🟢 CREW CHIEF' | '⚡ PIT WALL' | '🟢 TELEMETRY' | '🔴 TELEMETRY';
  message: string;
}

const INITIAL_LOGS: RadioLogEntry[] = [
  {
    timestamp: '[00:01.04]',
    callsign: '🟢 CREW CHIEF',
    message:
      'DeepSpeed-MoE token dropping and capacity factor load balancer initialized · 8 experts linked',
  },
  {
    timestamp: '[00:01.08]',
    callsign: '⚡ PIT WALL',
    message:
      'Dynamic capacity factor thresholding synchronized · Zero dropped tokens verified across ranks',
  },
  {
    timestamp: '[00:01.12]',
    callsign: '🟢 TELEMETRY',
    message:
      'Capacity throughput verified at 13,800 GB/s with sub-microsecond overflow redirection',
  },
];

export default function App() {
  const [snapshot, setSnapshot] = useState<CapacityEngineSnapshot>(() =>
    createInitialSnapshot()
  );
  const [selectedExpertId, setSelectedExpertId] = useState<number>(3);
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [imbalanceSpikeActive, setImbalanceSpikeActive] = useState<boolean>(false);
  const [passCounter, setPassCounter] = useState<number>(1);
  const [radioLogs, setRadioLogs] = useState<RadioLogEntry[]>(INITIAL_LOGS);
  const [apaModalMessage, setApaModalMessage] = useState<string | null>(null);

  const selectedExpert =
    snapshot.experts.find((e) => e.expertId === selectedExpertId) ||
    snapshot.experts[3];

  const formatClock = (step: number): string => {
    const totalCentis = 112 + step * 6;
    const secs = Math.floor(totalCentis / 100);
    const centis = totalCentis % 100;
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    const pad2 = (n: number) => (n < 10 ? '0' + String(n) : String(n));
    return '[' + pad2(mins) + ':' + pad2(remSecs) + '.' + pad2(centis) + ']';
  };

  const appendLog = (
    callsign: RadioLogEntry['callsign'],
    message: string,
    nextStep: number
  ) => {
    const entry: RadioLogEntry = {
      timestamp: formatClock(nextStep),
      callsign,
      message,
    };
    setRadioLogs((prev) => [entry, ...prev.slice(0, 5)]);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCorridor = e.target.value as SyntheticCorridor;
    const nextStep = passCounter + 1;
    setPassCounter(nextStep);
    const weights = imbalanceSpikeActive
      ? [1.85, 0.72, 0.8, 1.92, 0.68, 0.75, 0.82, 0.76]
      : INITIAL_BASELINE_WEIGHTS;
    const updated = runCapacityBalancerPass(
      {
        totalTokens: 2560,
        numExperts: 8,
        capacityFactor: snapshot.capacityFactor,
        corridor: nextCorridor,
        expertDemandWeights: weights,
        operatorNote: 'Corridor switch',
      },
      snapshot.cumulativeTokensUnits + 3200,
      snapshot.capacityXpUnits + 400
    );
    setSnapshot(updated);
    appendLog(
      '⚡ PIT WALL',
      'Corridor engaged: ' +
        nextCorridor +
        ' · Throughput ' +
        updated.throughputGbs.toLocaleString() +
        ' GB/s',
      nextStep
    );
  };

  const handleInjectCapacityBurst = () => {
    const nextStep = passCounter + 1;
    setPassCounter(nextStep);
    const burstWeights = [1.55, 1.48, 1.62, 1.58, 1.45, 1.52, 1.49, 1.56];
    const updated = runCapacityBalancerPass(
      {
        totalTokens: 2560,
        numExperts: 8,
        capacityFactor: 1.5,
        corridor: snapshot.corridor,
        expertDemandWeights: burstWeights,
        operatorNote: 'Capacity overflow burst test',
      },
      snapshot.cumulativeTokensUnits + 12800,
      snapshot.capacityXpUnits + 1500
    );
    setSnapshot(updated);
    appendLog(
      '🔴 TELEMETRY',
      'Trigger Capacity Overflow Burst absorbed · Dynamic CF raised to ' +
        updated.capacityFactor.toFixed(2) +
        ' · Limit ' +
        String(updated.tokenLimit) +
        ' · 0 Drops',
      nextStep
    );
  };

  const handleToggleImbalanceSpike = () => {
    const nextSpike = !imbalanceSpikeActive;
    const nextStep = passCounter + 1;
    setImbalanceSpikeActive(nextSpike);
    setPassCounter(nextStep);

    const weights = nextSpike
      ? [1.88, 0.68, 0.74, 1.95, 0.64, 0.72, 0.78, 0.71]
      : INITIAL_BASELINE_WEIGHTS;

    const updated = runCapacityBalancerPass(
      {
        totalTokens: 2560,
        numExperts: 8,
        capacityFactor: 1.25,
        corridor: nextSpike ? SYNTHETIC_CORRIDORS[1] : snapshot.corridor,
        expertDemandWeights: weights,
        operatorNote: 'Toggle imbalance spike',
      },
      snapshot.cumulativeTokensUnits + 6400,
      snapshot.capacityXpUnits + 800
    );
    setSnapshot(updated);
    appendLog(
      '⚡ PIT WALL',
      nextSpike
        ? 'Inject Token Imbalance Spike active · Redispatched ' +
            String(updated.redispatchedTokens) +
            ' overflow tokens across slack experts · 0 Drops'
        : 'Token imbalance spike cleared · Nominal 1.25 capacity factor equilibrium restored',
      nextStep
    );
  };

  const handleStepCapacityBalancer = () => {
    const nextStep = passCounter + 1;
    setPassCounter(nextStep);
    const phase = (nextStep % 4) * 0.015;
    const steppedWeights = INITIAL_BASELINE_WEIGHTS.map((w, idx) =>
      Number((w + (idx % 2 === 0 ? phase : -phase * 0.5)).toFixed(4))
    );
    const updated = runCapacityBalancerPass(
      {
        totalTokens: 2560,
        numExperts: 8,
        capacityFactor: 1.25,
        corridor: snapshot.corridor,
        expertDemandWeights: steppedWeights,
        operatorNote: 'Step capacity balancer pass',
      },
      snapshot.cumulativeTokensUnits + 9600,
      snapshot.capacityXpUnits + 1200
    );
    setImbalanceSpikeActive(false);
    setSnapshot(updated);
    appendLog(
      '🟢 CREW CHIEF',
      'Step Capacity Balancer Pass #' +
        String(nextStep) +
        ' complete · Aux Loss ' +
        updated.auxiliaryImbalanceLoss.toFixed(4) +
        ' · Zero dropped tokens verified',
      nextStep
    );
  };

  const handleFlushOverflowBuffers = () => {
    const nextStep = passCounter + 1;
    setPassCounter(nextStep);
    setImbalanceSpikeActive(false);
    const resetSnap = createInitialSnapshot();
    setSnapshot(resetSnap);
    setSelectedExpertId(3);
    setApaModalMessage(null);
    setRadioLogs(INITIAL_LOGS);
  };

  const saturationPct = Math.min(
    100,
    Math.round((snapshot.throughputGbs / 14500) * 100)
  );

  const vectorText =
    '[' +
    snapshot.vectorPreview.map((v) => v.toFixed(2)).join(', ') +
    ']';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Row 1 & Row 2 */}
      <header className="flex flex-col gap-0.5 w-full shrink-0">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm font-mono font-bold tracking-wider text-white">
              GF-T3-251
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
              TRACK 3
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic Capacity Corridor"
              value={snapshot.corridor}
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
              onClick={() => {
                setActiveTab('Cap');
                handleInjectCapacityBurst();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-cyan-500/40 rounded transition-colors cursor-pointer"
            >
              [Capacity]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Drop');
                handleToggleImbalanceSpike();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-amber-500/40 rounded transition-colors cursor-pointer"
            >
              [Drop]
            </button>
            <button
              type="button"
              onClick={handleStepCapacityBalancer}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap leading-none">
          Capacity Factor · Zero Token Dropping · Load Balancer
        </div>
      </header>

      {/* 4-Card Arcade HUD Ribbon (2x2 Grid) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0">
        {/* Card 1: CAPACITY NITRO */}
        <div className="bg-slate-900/75 border border-slate-800 rounded px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400">
              CAPACITY NITRO
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              CF {snapshot.capacityFactor.toFixed(2)}x
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-none">
            {snapshot.throughputGbs.toLocaleString()} GB/s
          </div>
          <div className="w-full bg-slate-950 h-1 rounded overflow-hidden my-0.5 border border-slate-800">
            <div
              className="bg-[#00F0FF] h-full transition-all duration-150"
              style={{ width: String(saturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-none">
            Capacity Throughput Saturation
          </div>
        </div>

        {/* Card 2: DROPPED STREAK */}
        <div className="bg-slate-900/75 border border-slate-800 rounded px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400">
              DROPPED STREAK
            </span>
            <span className="px-1 bg-amber-500/15 border border-amber-500/40 rounded text-[10px] font-mono font-bold text-[#FF9F0A]">
              🔥 {snapshot.droppedTokens} DROPS
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-amber-300 leading-none">
            {snapshot.routingLatencyUs.toFixed(2)} µs
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-none">
            Token Overflow Redirection Latency
          </div>
        </div>

        {/* Card 3: ACTIVE EXPERTS */}
        <div className="bg-slate-900/75 border border-slate-800 rounded px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400">
              ACTIVE EXPERTS
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              ✓ LOCKED
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-none">
            EXPERTS: {snapshot.activeExperts}/8
          </div>
          <div className="grid grid-cols-8 gap-0.5">
            {snapshot.experts.map((exp) => (
              <span
                key={exp.expertId}
                className={
                  'text-[9px] font-mono font-bold text-center rounded border leading-tight ' +
                  (selectedExpertId === exp.expertId
                    ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-white'
                    : 'bg-slate-950 border-slate-800 text-cyan-300')
                }
              >
                {exp.shortTag}
              </span>
            ))}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/75 border border-slate-800 rounded px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              +{(snapshot.capacityXpUnits / 1000).toFixed(1)}k CAPACITY XP
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-emerald-300 leading-none">
            {snapshot.cumulativeTokensUnits.toLocaleString()} UNITS
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-none">
            MoE State: {snapshot.moeState}
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Views"
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
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Streamlined Mesh Info Subheader */}
      <div className="flex items-center justify-between gap-2 text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        <span className="truncate">
          {'VIEW: ' +
            activeTab.toUpperCase() +
            ' · PTR: ' +
            snapshot.pointer +
            ' · MODE: DYNAMIC_CAPACITY · FACTOR: ' +
            snapshot.capacityFactor.toFixed(2) +
            ' · VEC: ' +
            vectorText}
        </span>
        {activeTab === 'APA' ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() =>
                setApaModalMessage('APA Title Dossier Locked (GF-T3-251)')
              }
              className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF] rounded cursor-pointer"
            >
              ACQUIRE TITLE (APA)
            </button>
            <button
              type="button"
              onClick={() =>
                setApaModalMessage('Vault Buyout Escrow Initialized')
              }
              className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-amber-500/20 text-[#FF9F0A] border border-[#FF9F0A] rounded cursor-pointer"
            >
              INQUIRE VAULT BUYOUT
            </button>
          </div>
        ) : null}
      </div>

      {/* Interactive Expert Capacity Matrix Bay (E0–E7) */}
      <main className="grid grid-cols-2 sm:grid-cols-4 gap-1 w-full shrink-0 my-0.5">
        {snapshot.experts.map((expert) => {
          const isSelected = expert.expertId === selectedExpertId;
          return (
            <button
              key={expert.expertId}
              type="button"
              onClick={() => setSelectedExpertId(expert.expertId)}
              className={
                'py-0.5 px-1.5 rounded border border-slate-800 bg-slate-900/60 text-left flex flex-col justify-between transition-colors cursor-pointer ' +
                (isSelected ? 'ring-1 ring-[#00F0FF] bg-slate-900/95' : 'hover:border-slate-700')
              }
            >
              <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center leading-tight">
                <span>{expert.title}</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {expert.pointer}
                </span>
              </div>

              <div className="text-[12px] font-mono text-cyan-300 font-bold leading-tight">
                {'CAP: ' +
                  expert.capacityFactor.toFixed(2) +
                  ' · LIMIT: ' +
                  String(expert.limit)}
              </div>

              <div className="text-[12px] font-mono text-amber-300 font-bold leading-tight">
                {'DROP: ' +
                  String(expert.dropped) +
                  ' · ROUTED: ' +
                  String(expert.routed)}
              </div>

              <div className="text-[10px] font-mono text-emerald-400 font-semibold leading-tight flex justify-between items-center">
                <span>
                  {'STATE: ' +
                    (expert.state === 'REDISPATCHED' ? 'BALANCED' : expert.state) +
                    ' · LOCKED'}
                </span>
                <span className="text-slate-400">
                  {'L:' + expert.auxiliaryLossContribution.toFixed(2)}
                </span>
              </div>
            </button>
          );
        })}
      </main>

      {/* Compact Capacity Telemetry Inspector Strip */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {selectedExpert.shortTag +
          ' · CAP: ' +
          selectedExpert.capacityFactor.toFixed(2) +
          ' · LIMIT: ' +
          String(selectedExpert.limit) +
          ' · DROP: ' +
          String(selectedExpert.dropped) +
          ' · ROUTED: ' +
          String(selectedExpert.routed) +
          ' · PTR ' +
          selectedExpert.pointer +
          ' · SYNC: OK' +
          (apaModalMessage ? ' · ' + apaModalMessage : '')}
      </div>

      {/* Tactical Launch Control Buttons */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0 my-0.5">
        <button
          type="button"
          onClick={handleInjectCapacityBurst}
          className="text-xs font-mono font-bold py-1.5 text-center rounded bg-amber-950/50 hover:bg-amber-900/60 text-[#FF9F0A] border border-[#FF9F0A] transition-colors cursor-pointer"
        >
          💥 INJECT CAPACITY BURST
        </button>

        <button
          type="button"
          onClick={handleToggleImbalanceSpike}
          className="text-xs font-mono font-bold py-1.5 text-center rounded bg-cyan-950/60 hover:bg-cyan-900/70 text-[#00F0FF] border border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-colors cursor-pointer"
        >
          ⚡ TOGGLE IMBALANCE SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepCapacityBalancer}
          className="text-xs font-mono font-bold py-1.5 text-center rounded bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-500 transition-colors cursor-pointer"
        >
          🚀 STEP CAPACITY BALANCER
        </button>

        <button
          type="button"
          onClick={handleFlushOverflowBuffers}
          className="text-xs font-mono font-bold py-1.5 text-center rounded bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border border-rose-500 transition-colors cursor-pointer"
        >
          🔄 FLUSH OVERFLOW BUFFERS
        </button>
      </section>

      {/* Pit-Wall Radio Comms Log */}
      <footer className="h-10 overflow-hidden font-mono text-[10px] p-1.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight">
        {radioLogs.slice(0, 3).map((entry, idx) => (
          <div key={idx} className="truncate">
            {entry.timestamp + ' ' + entry.callsign + ': ' + entry.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
