/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  SyntheticCorridor,
  CockpitEngineState,
  createInitialCockpitState,
  createInitialRanks,
  formatNumberWithCommas,
  calculateRingAllReduceLatencyUs,
} from './engine/tensorRingEngine';

type CockpitTab = 'Mesh' | 'Tens' | 'Ring' | 'Stats' | 'APA';

const TABS: CockpitTab[] = ['Mesh', 'Tens', 'Ring', 'Stats', 'APA'];

const CORRIDOR_OPTIONS: SyntheticCorridor[] = [
  SyntheticCorridor.ALPHA,
  SyntheticCorridor.BRAVO,
  SyntheticCorridor.GAMMA,
  SyntheticCorridor.DELTA,
];

export default function App() {
  const [state, setState] = useState<CockpitEngineState>(() =>
    createInitialCockpitState()
  );
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');

  const selectedRank =
    state.ranks[state.selectedRankIndex] || state.ranks[3];

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosen = e.target.value as SyntheticCorridor;
    let nextThroughput = 45600;
    let nextLatency = '0.01 µs';
    let nextMode = 'TENSOR_PARALLEL';
    if (chosen === SyntheticCorridor.BRAVO) {
      nextThroughput = 48200;
      nextLatency = '0.01 µs';
      nextMode = 'RING_ALLREDUCE';
    } else if (chosen === SyntheticCorridor.GAMMA) {
      nextThroughput = 42800;
      nextLatency = '0.02 µs';
      nextMode = 'P2P_NONBLOCKING';
    } else if (chosen === SyntheticCorridor.DELTA) {
      nextThroughput = 31200;
      nextLatency = '0.05 µs';
      nextMode = 'MONOLITHIC_FALLBACK';
    }

    setState((prev) => ({
      ...prev,
      corridor: chosen,
      throughputGbps: nextThroughput,
      throughputFormatted: formatNumberWithCommas(nextThroughput) + ' GB/s',
      ringLatencyUs: nextLatency,
      modeLabel: nextMode,
      radioComms: [
        prev.radioComms[1],
        '[00:02.04] 🟢 CORRIDOR: Switched active fabric to ' + chosen,
      ],
    }));
  };

  const handleTriggerTensorBurst = () => {
    setState((prev) => {
      const nextStep = prev.ringPassStep + 1;
      const nextThroughput = 52400;
      const nextTokens = prev.processedTokens + 1024000;
      return {
        ...prev,
        throughputGbps: nextThroughput,
        throughputFormatted: formatNumberWithCommas(nextThroughput) + ' GB/s',
        saturationPct: 100,
        ringLatencyUs: '0.01 µs',
        processedTokens: nextTokens,
        processedTokensFormatted: formatNumberWithCommas(nextTokens) + ' UNITS',
        engineXpFormatted: '+88.5k ENGINE XP',
        tensorState: 'Parallel Active',
        ringPassStep: nextStep,
        collectiveVec: [5.18, 5.21, 5.19, 5.22],
        ranks: createInitialRanks(320, 120, '0.01ms', 'REDUCED · LOCKED', nextStep),
        radioComms: [
          prev.radioComms[1],
          '[00:02.41] 💥 BURST: Trigger Tensor Parallelism Burst engaged · 52,400 GB/s across 8 ranks',
        ],
      };
    });
  };

  const handleToggleCongestionSpike = () => {
    setState((prev) => {
      const nextSpike = !prev.congestionSpikeActive;
      const nextStep = prev.ringPassStep + 1;
      if (nextSpike) {
        return {
          ...prev,
          congestionSpikeActive: true,
          corridor: SyntheticCorridor.GAMMA,
          throughputGbps: 38400,
          throughputFormatted: '38,400 GB/s',
          saturationPct: 84,
          ringLatencyUs: '0.04 µs',
          tensorState: 'Parallel Active',
          ringPassStep: nextStep,
          collectiveVec: [5.08, 5.12, 5.09, 5.11],
          ranks: createInitialRanks(240, 88, '0.04ms', 'REROUTED · LOCKED', nextStep),
          radioComms: [
            prev.radioComms[1],
            '[00:03.12] ⚡ SPIKE: Inject Ring Congestion Spike (Force All-Reduce Re-Routing) active on P2P ring',
          ],
        };
      }
      return {
        ...prev,
        congestionSpikeActive: false,
        corridor: SyntheticCorridor.ALPHA,
        throughputGbps: 45600,
        throughputFormatted: '45,600 GB/s',
        saturationPct: 96,
        ringLatencyUs: '0.01 µs',
        tensorState: 'Parallel Active',
        ringPassStep: nextStep,
        collectiveVec: [5.11, 5.15, 5.12, 5.14],
        ranks: createInitialRanks(256, 100, '0.02ms', 'REDUCED · LOCKED', nextStep),
        radioComms: [
          prev.radioComms[1],
          '[00:03.55] 🟢 TELEMETRY: Ring All-Reduce tensor slicing verified at 45,600 GB/s with zero communication stalls',
        ],
      };
    });
  };

  const handleStepRingReducePass = () => {
    setState((prev) => {
      const nextStep = prev.ringPassStep + 1;
      const nextTokens = prev.processedTokens + 512000;
      const computedUs = calculateRingAllReduceLatencyUs(
        prev.activeRanks,
        65536,
        prev.throughputGbps,
        0.01
      );
      return {
        ...prev,
        ringPassStep: nextStep,
        processedTokens: nextTokens,
        processedTokensFormatted: formatNumberWithCommas(nextTokens) + ' UNITS',
        ringLatencyUs: String(computedUs) + ' µs',
        collectiveVec: [
          Number((5.11 + (nextStep % 5) * 0.01).toFixed(2)),
          Number((5.15 + (nextStep % 4) * 0.01).toFixed(2)),
          Number((5.12 + (nextStep % 6) * 0.01).toFixed(2)),
          Number((5.14 + (nextStep % 3) * 0.01).toFixed(2)),
        ],
        ranks: createInitialRanks(
          256 + (nextStep % 4) * 16,
          100,
          '0.02ms',
          'REDUCED · LOCKED',
          nextStep
        ),
        radioComms: [
          prev.radioComms[1],
          '[00:04.18] 🚀 PASS: Step Asynchronous Ring-Reduce Pass #' +
            String(nextStep) +
            ' synchronized across 8 Ranks',
        ],
      };
    });
  };

  const handleFlushRankArenas = () => {
    setState(createInitialCockpitState());
  };

  const handleSelectRank = (idx: number) => {
    setState((prev) => {
      const target = prev.ranks[idx] || prev.ranks[3];
      return {
        ...prev,
        selectedRankIndex: idx,
        radioComms: [
          prev.radioComms[1],
          '[00:04.52] 🟢 INSPECTOR: Locked telemetry focus on ' +
            target.title +
            ' at ' +
            target.hexPtr,
        ],
      };
    });
  };

  const handleAcquireTitleApa = () => {
    setState((prev) => ({
      ...prev,
      apaOrderStatus:
        'APA TITLE TRANSFER PACKET LOCKED · 100% SOVEREIGN IP ASSIGNED (ZERO COPYLEFT)',
      radioComms: [
        prev.radioComms[1],
        '[00:05.19] 🟢 CREW CHIEF: ACQUIRE TITLE (APA) dossier initialized for GF-T3-290 in CLUSTER-006',
      ],
    }));
  };

  const handleInquireVaultBuyout = () => {
    setState((prev) => ({
      ...prev,
      apaOrderStatus:
        'VAULT BUYOUT ESCROW GATE OPENED · STANDALONE REPOSITORY HAND-OFF READY',
      radioComms: [
        prev.radioComms[1],
        '[00:05.44] 🟢 TELEMETRY: INQUIRE VAULT BUYOUT dispatch logged · Clean-room MIT title verified',
      ],
    }));
  };

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Stack */}
      <header className="w-full shrink-0 flex flex-col gap-0.5">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm md:text-base font-mono font-bold tracking-tight text-white">
              GF-T3-290
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/15 text-[#00F0FF] border border-cyan-500/40 rounded">
              FLAGSHIP
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic Tensor Parallelism Corridor"
              value={state.corridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-cyan-400"
            >
              {CORRIDOR_OPTIONS.map((corridor) => (
                <option key={corridor} value={corridor}>
                  {corridor}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setActiveTab('Tens');
                handleTriggerTensorBurst();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded cursor-pointer whitespace-nowrap shrink-0"
            >
              [Tensor]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Ring');
                handleStepRingReducePass();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded cursor-pointer whitespace-nowrap shrink-0"
            >
              [Ring]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Mesh');
                handleStepRingReducePass();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 rounded cursor-pointer whitespace-nowrap shrink-0"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <p className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          Tensor Parallelism · Ring All-Reduce · Zero Latency
        </p>
      </header>

      {/* 4-Card Arcade HUD Ribbon (2x2 Grid) */}
      <section
        aria-label="Arcade Telemetry HUD Ribbon"
        className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: TENSOR NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-mono font-bold text-slate-300 tracking-wider">
              TENSOR NITRO
            </span>
            <span className="font-mono text-lg font-bold text-[#00F0FF] leading-none">
              {state.throughputFormatted}
            </span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden my-1 border border-slate-800">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(state.saturationPct) + '%' }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Tensor Throughput Saturation</span>
            <span>Tensor Throughput: {state.throughputFormatted}</span>
          </div>
        </div>

        {/* Card 2: RING STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-mono font-bold text-slate-300 tracking-wider">
              RING STREAK
            </span>
            <span className="font-mono text-lg font-bold text-[#FF9F0A] leading-none">
              {state.ringLatencyUs}
            </span>
          </div>
          <div className="flex items-center justify-between my-0.5">
            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded">
              🔥 NVLINK-RING
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              BARRIER LOCKED
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Ring Latency</span>
            <span>Ring Latency: {state.ringLatencyUs}</span>
          </div>
        </div>

        {/* Card 3: ACTIVE RANKS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-mono font-bold text-slate-300 tracking-wider">
              ACTIVE RANKS
            </span>
            <span className="font-mono text-sm md:text-base font-bold text-emerald-400 leading-none">
              RANKS: 8/8
            </span>
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {state.ranks.map((rk) => (
              <button
                key={rk.code}
                type="button"
                onClick={() => handleSelectRank(rk.rankIndex)}
                className={
                  'text-[9px] font-mono font-bold py-0.5 rounded border cursor-pointer ' +
                  (state.selectedRankIndex === rk.rankIndex
                    ? 'bg-cyan-500/25 border-cyan-400 text-white'
                    : 'bg-slate-950 border-slate-800 text-cyan-300')
                }
              >
                {rk.code}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Active Ranks: 8 Ranks</span>
            <span>[K0..K7] GEAR LOCK</span>
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-mono font-bold text-slate-300 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="font-mono text-sm md:text-base font-bold text-cyan-300 leading-none">
              {state.processedTokensFormatted}
            </span>
          </div>
          <div className="flex items-center justify-between my-0.5">
            <span className="text-[10px] font-mono font-bold text-emerald-300">
              {state.engineXpFormatted}
            </span>
            <span className="text-[10px] font-mono text-slate-300">
              Processed Tokens: 8,448,000 Units
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Tensor State: {state.tensorState}</span>
            <span>PASS #{state.ringPassStep}</span>
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
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
                'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
                (isActive
                  ? 'bg-[#00F0FF] text-slate-950'
                  : 'text-slate-200 hover:bg-slate-800')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Streamlined Mesh Info Subheader (strictly clean of action buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        VIEW: MESH · PTR: 0x16F8DC0 · MODE: TENSOR_PARALLEL · RANKS: 8 · VEC: [
        {state.collectiveVec.join(', ')}]
      </div>

      {/* Main Interactive Bay (Always renders the 8 Rank Cards K0-K7 plus contextual tab strip or APA vault view) */}
      <main className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden bg-slate-950/70 border border-slate-800/90 rounded-lg p-1 my-0.5">
        {activeTab === 'APA' ? (
          <div className="flex flex-col justify-between h-full p-2 bg-slate-900/70 rounded border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <div>
                <h2 className="text-sm font-mono font-bold text-white">
                  GF-T3-290 · SOVEREIGN APA TITLE TRANSFER
                </h2>
                <p className="text-[11px] font-mono text-slate-300">
                  CLUSTER-006 · 100% Pure Asset Purchase Agreement · Zero Licensing · Zero Copyleft
                </p>
              </div>
              <div className="text-right font-mono">
                <div className="text-[10px] text-amber-300 font-bold">
                  Retail Price
                </div>
                <div className="text-xs font-bold text-cyan-300">
                  75,000 - 150,000+ Allocation Units
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5 my-1 text-[10px] font-mono">
              <div className="p-1.5 bg-black/60 border border-slate-800 rounded">
                <div className="text-cyan-300 font-bold">GATE 01 · MATH</div>
                <div className="text-slate-300">Ring All-Reduce Verified</div>
              </div>
              <div className="p-1.5 bg-black/60 border border-slate-800 rounded">
                <div className="text-cyan-300 font-bold">GATE 02 · ARENA</div>
                <div className="text-slate-300">0x17000..0x17070 Isolated</div>
              </div>
              <div className="p-1.5 bg-black/60 border border-slate-800 rounded">
                <div className="text-cyan-300 font-bold">GATE 03 · INGRESS</div>
                <div className="text-slate-300">Zero-Trust DTO Locked</div>
              </div>
              <div className="p-1.5 bg-black/60 border border-slate-800 rounded">
                <div className="text-cyan-300 font-bold">GATE 04 · PYTEST</div>
                <div className="text-slate-300">&gt;85% Coverage Passed</div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-emerald-300 bg-black/50 px-2 py-1 rounded border border-slate-800 truncate">
              {state.apaOrderStatus}
            </div>

            {/* Anti-Clutter Vertical Flex Action CTAs exclusively in APA tab */}
            <div className="flex flex-col gap-2 w-full mt-1">
              <button
                type="button"
                onClick={handleAcquireTitleApa}
                className="w-full py-1.5 text-xs font-mono font-bold bg-[#FF9F0A] hover:bg-amber-400 text-slate-950 rounded cursor-pointer text-center"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={handleInquireVaultBuyout}
                className="w-full py-1.5 text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-cyan-500/50 rounded cursor-pointer text-center"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Interactive Rank Matrix Bay (K0-K7) in a tight 4x2 grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1 flex-1 items-stretch">
              {state.ranks.map((rank) => {
                const isSelected = state.selectedRankIndex === rank.rankIndex;
                return (
                  <div
                    key={rank.code}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectRank(rank.rankIndex)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleSelectRank(rank.rankIndex);
                      }
                    }}
                    className={
                      'rounded px-2 py-1.5 flex flex-col justify-between border cursor-pointer transition-colors ' +
                      (isSelected
                        ? 'bg-slate-900 border-[#00F0FF]'
                        : 'bg-slate-900/75 border-slate-800 hover:border-slate-700')
                    }
                  >
                    {/* Line 1: Title & Hex */}
                    <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                      <span>{rank.title}</span>
                      <span className="text-slate-300">{rank.hexPtr}</span>
                    </div>

                    {/* Line 2: Tokens & Ring State */}
                    <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                      <span>TOK: {rank.tokensK}K</span>
                      <span>RING: {rank.ringGbps}G</span>
                    </div>

                    {/* Line 3: Latency & State */}
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-[#FF9F0A] font-bold">
                        {rank.latencyMs}
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {rank.statusText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Contextual Telemetry Sub-Bar for Tens / Ring / Stats modes */}
            <div className="flex items-center justify-between px-2 py-0.5 text-[10px] font-mono text-slate-300 bg-slate-900/90 border-t border-slate-800 shrink-0">
              <span>
                CORRIDOR: {state.corridor}
              </span>
              <span>
                {activeTab === 'Tens'
                  ? 'COLUMN/ROW ATTENTION SLICER: COL=' +
                    String(selectedRank.columnSliceWeight) +
                    ' · ROW=' +
                    String(selectedRank.rowSliceWeight)
                  : activeTab === 'Ring'
                  ? 'ALL-REDUCE FORMULA: 2*(N-1)/N*(M/BW)+ALPHA · STEP #' +
                    String(state.ringPassStep)
                  : activeTab === 'Stats'
                  ? 'SCALING EFFICIENCY: 87.5% · NVLINK SATURATION: ' +
                    String(state.saturationPct) +
                    '%'
                  : 'NON-BLOCKING NVLINK RING · SUB-MICROSECOND BARRIER SYNC'}
              </span>
            </div>
          </>
        )}
      </main>

      {/* Compact Tensor Telemetry Inspector Strip */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {selectedRank.code} · TOK: {selectedRank.tokensK}K · RING:{' '}
        {selectedRank.ringGbps}G · SYNC: {selectedRank.syncPct}% · PTR{' '}
        {selectedRank.hexPtr} · TENSOR: {selectedRank.tensorHealth} · LOCKED
      </div>

      {/* Tactical Launch Control Switches */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          title="Trigger Tensor Parallelism Burst"
          onClick={handleTriggerTensorBurst}
          className="bg-amber-950/50 hover:bg-amber-900/60 border border-[#FF9F0A] text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 px-2 text-center cursor-pointer truncate"
        >
          💥 INJECT TENSOR PARALLELISM BURST
        </button>

        <button
          type="button"
          title="Inject Ring Congestion Spike (Force All-Reduce Re-Routing)"
          onClick={handleToggleCongestionSpike}
          className="bg-cyan-950/50 hover:bg-cyan-900/60 border border-[#00F0FF] text-[#00F0FF] rounded text-xs font-mono font-bold py-2 px-2 text-center cursor-pointer truncate"
        >
          ⚡ TOGGLE RING CONGESTION SPIKE
        </button>

        <button
          type="button"
          title="Step Asynchronous Ring-Reduce Pass"
          onClick={handleStepRingReducePass}
          className="bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-400 text-emerald-300 rounded text-xs font-mono font-bold py-2 px-2 text-center cursor-pointer truncate"
        >
          🚀 STEP ASYNCHRONOUS RING-REDUCE PASS
        </button>

        <button
          type="button"
          title="Flush Rank Buffers & Re-Zero Tensor Arenas"
          onClick={handleFlushRankArenas}
          className="bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500 text-rose-300 rounded text-xs font-mono font-bold py-2 px-2 text-center cursor-pointer truncate"
        >
          🔄 FLUSH RANK ARENAS
        </button>
      </section>

      {/* Pit-Wall Radio Comms Log */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        <div className="truncate">{state.radioComms[0]}</div>
        <div className="truncate">{state.radioComms[1]}</div>
      </footer>
    </div>
  );
}
