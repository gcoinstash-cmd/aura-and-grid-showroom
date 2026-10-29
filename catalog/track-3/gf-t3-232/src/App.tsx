/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  CudaGraphTelemetryState,
  SYNTHETIC_CORRIDORS,
  applyCaptureBurst,
  applyFlushCapturedNodes,
  applyStepGraphReplay,
  applyToggleStallConflict,
  createInitialEngineState,
  executeCapturedGraphReplayPass,
  executeEagerStreamPass,
} from './engine/cudaGraphEngine';
import { GraphCorridorType, KernelTypeValue } from './engine/gridSyncSchema';

type CockpitTab = 'Mesh' | 'Graph' | 'Replay' | 'Stats' | 'APA';

const COCKPIT_TABS: readonly CockpitTab[] = ['Mesh', 'Graph', 'Replay', 'Stats', 'APA'];

const SHORT_KERNEL_LABELS: Record<KernelTypeValue, string> = {
  ELEMENTWISE_NORM: 'NORM',
  QKV_PROJECTION: 'QKV',
  ROTARY_EMBED: 'ROPE',
  GEMM_FP16: 'GEMM',
  SOFTMAX_REDUCE: 'SMAX',
  ATTENTION_FUSED: 'ATTN',
  MLP_SWIGLU: 'SWIG',
  ALLREDUCE_RING: 'RING',
};

export default function App() {
  const [engineState, setEngineState] = useState<CudaGraphTelemetryState>(() =>
    createInitialEngineState()
  );
  const [activeTab, setActiveTab] = useState<CockpitTab>('Graph');
  const [apaStatusBanner, setApaStatusBanner] = useState<string | null>(null);

  const selectedNode = useMemo(() => {
    return (
      engineState.nodes.find((n) => n.nodeId === engineState.selectedNodeId) ??
      engineState.nodes[3]
    );
  }, [engineState.nodes, engineState.selectedNodeId]);

  const equivalenceCheck = useMemo(() => {
    const vec = [1.0, 2.0, 3.0, 4.0];
    const eagerOut = executeEagerStreamPass(engineState.nodes, vec);
    if (engineState.stallConflictActive) {
      return { verified: false, maxErr: 999.0 };
    }
    const replayOut = executeCapturedGraphReplayPass(engineState.nodes, vec, false);
    const maxErr = Math.max(...eagerOut.map((v, idx) => Math.abs(v - replayOut[idx])));
    return { verified: maxErr < 1e-7, maxErr };
  }, [engineState.nodes, engineState.stallConflictActive]);

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosen = e.target.value as GraphCorridorType;
    setEngineState((prev) =>
      applyCaptureBurst(prev, {
        corridor: chosen,
        subGraphClusters: 16,
        tokensPerPass: 32000,
        operatorCallsign: 'CORRIDOR_SWITCH',
      })
    );
  };

  const handleInjectGraphBurst = () => {
    setEngineState((prev) =>
      applyCaptureBurst(prev, {
        corridor: prev.corridor,
        subGraphClusters: 16,
        tokensPerPass: 64000,
        operatorCallsign: 'CREW_CHIEF',
      })
    );
  };

  const handleToggleStallConflict = () => {
    setEngineState((prev) => applyToggleStallConflict(prev));
  };

  const handleStepGraphReplay = () => {
    setEngineState((prev) => applyStepGraphReplay(prev));
  };

  const handleFlushCapturedNodes = () => {
    setEngineState(applyFlushCapturedNodes());
    setApaStatusBanner(null);
  };

  const handleSelectNode = (nodeId: number) => {
    setEngineState((prev) => ({
      ...prev,
      selectedNodeId: nodeId,
    }));
  };

  const handleExportAuditJson = () => {
    const payload = JSON.stringify(
      {
        projectId: 'GF-T3-232',
        corridor: engineState.corridor,
        streamState: engineState.streamState,
        dispatchLatencyUs: engineState.dispatchLatencyUs,
        graphSpeedupX: engineState.graphSpeedupX,
        capturedNodesCount: engineState.capturedNodesCount,
        processedTokensUnits: engineState.processedTokensUnits,
        nodes: engineState.nodes,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'GF-T3-232-telemetry-audit.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const formattedTokens = engineState.processedTokensUnits.toLocaleString('en-US');

  const parentListText =
    selectedNode.parentIds.length > 0
      ? selectedNode.parentIds.map((pid) => 'N' + String(pid)).join(', ')
      : 'ROOT';

  const childListText =
    selectedNode.childIds.length > 0
      ? selectedNode.childIds.map((cid) => 'N' + String(cid)).join(', ')
      : 'SINK';

  const inspectorStripText =
    selectedNode.label +
    ' · ' +
    selectedNode.kernelType +
    ' · ' +
    selectedNode.executionTimeUs.toFixed(2) +
    ' µs · ALIAS ' +
    selectedNode.memoryAliasPtr +
    ' · ' +
    selectedNode.dispatchState;

  const nitroProgressPct = Math.min(
    100,
    Math.max(12, Math.round((engineState.graphSpeedupX / 5.5) * 100))
  );

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP HEADER ROW 1 & ROW 2 */}
      <header className="w-full shrink-0 border-b border-slate-800/90 pb-1">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-xs sm:text-sm font-mono font-bold tracking-wider text-slate-100">
              GF-T3-232
            </h1>
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 rounded">
              TRACK 3
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Select Synthetic Graph Corridor"
              value={engineState.corridor}
              onChange={handleCorridorChange}
              className="max-w-[70px] text-[9px] py-0.5 px-1 font-mono truncate bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-[#00F0FF]"
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
                setActiveTab('Graph');
                handleInjectGraphBurst();
              }}
              className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/40 rounded transition-colors cursor-pointer shrink-0"
            >
              [Graph]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Replay');
                handleStepGraphReplay();
              }}
              className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#10B981] border border-[#10B981]/40 rounded transition-colors cursor-pointer shrink-0"
            >
              [Replay]
            </button>
            <button
              type="button"
              onClick={handleInjectGraphBurst}
              className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#FF9F0A]/15 hover:bg-[#FF9F0A]/25 text-[#FF9F0A] border border-[#FF9F0A]/50 rounded transition-colors cursor-pointer shrink-0"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-[11px] font-mono text-slate-300 text-center whitespace-nowrap truncate mt-0.5">
          CUDA Graph Capture · CPU Launch Acceleration · Zero Overhead
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: GRAPH NITRO */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>GRAPH NITRO</span>
            <span className="text-[#10B981] font-bold">
              {engineState.stallConflictActive ? '⚡ FAULT' : '✓ LOCKED'}
            </span>
          </div>
          <div className="text-base font-bold font-mono text-cyan-300 leading-tight">
            {engineState.graphSpeedupX.toFixed(2)}x GAIN
          </div>
          <div className="w-full bg-slate-900 h-1 rounded overflow-hidden border border-slate-800 my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-transform duration-150 origin-left"
              style={{
                transform: 'scaleX(' + String(nitroProgressPct / 100) + ')',
              }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Dispatch: {engineState.bandwidthGbps.toFixed(1)} GB/s
          </div>
        </div>

        {/* Card 2: LATENCY STREAK */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>LATENCY STREAK</span>
            <span className="px-1 bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded font-bold text-[9px]">
              🔥 {engineState.capturedNodesCount} NODES
            </span>
          </div>
          <div className="text-base font-bold font-mono text-emerald-400 leading-tight my-0.5">
            {engineState.dispatchLatencyUs.toFixed(2)} µs
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Replay Overhead: {engineState.dispatchLatencyUs.toFixed(2)} µs
          </div>
        </div>

        {/* Card 3: ACTIVE STREAMS */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>ACTIVE STREAMS</span>
            <span className="text-cyan-300 font-bold">
              STREAMS: {engineState.activeStreams}/{engineState.totalStreams}
            </span>
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5 font-mono text-[9px] font-bold text-center">
            {engineState.streams.map((slot) => (
              <div
                key={slot.streamId}
                className={
                  'py-0.5 rounded border ' +
                  (slot.active
                    ? 'bg-[#10B981]/20 border-[#10B981]/60 text-[#10B981]'
                    : 'bg-[#EF4444]/20 border-[#EF4444]/60 text-[#EF4444]')
                }
              >
                {slot.streamId}
              </div>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Stream State: {engineState.stallConflictActive ? 'Stalled' : 'Captured'}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>TOKEN SCORE</span>
            <span className="text-[#10B981] font-bold text-[9px]">
              +{engineState.graphXpDeltaK.toFixed(1)}k XP
            </span>
          </div>
          <div className="text-base font-bold font-mono text-amber-300 leading-tight my-0.5">
            {formattedTokens} UNITS
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Graph: Immutable Active
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Workspace Modes"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-0.5 w-full text-center shrink-0"
      >
        {COCKPIT_TABS.map((tab) => {
          const isCurrent = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-0.5 text-[11px] font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
                (isCurrent
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* INTERACTIVE 8-NODE CUDA GRAPH MATRIX BAY & 2x2 COMPACT INSPECTOR */}
      <main className="flex-1 min-h-0 flex flex-col justify-between bg-slate-950/90 border border-slate-800 rounded-lg p-1.5 overflow-hidden my-0.5">
        {/* Matrix Bay Header + Mode Readout */}
        <div className="flex items-center justify-between gap-1 text-[10px] font-mono border-b border-slate-800/80 pb-1 shrink-0">
          <span className="text-cyan-300 font-bold truncate">
            {activeTab === 'Mesh' && 'DAG MESH TOPOLOGY · N0→N1/N2→N3→N4/N5→N6→N7'}
            {activeTab === 'Graph' && '8-NODE CAPTURED CUDA GRAPH MATRIX (128 NODES)'}
            {activeTab === 'Replay' &&
              'ZERO-OVERHEAD REPLAY EQUIVALENCE: ' +
                (equivalenceCheck.verified ? '✓ BIT-EXACT PARITY' : '⚡ STALL FAULT')}
            {activeTab === 'Stats' &&
              'SUPABASE RLS PARTITIONED LEDGER · PYTEST & VITEST VERIFIED'}
            {activeTab === 'APA' &&
              (apaStatusBanner ?? 'INSTITUTIONAL APA VAULT · 100% MIT CLEAN-ROOM')}
          </span>

          {activeTab === 'APA' ? (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setApaStatusBanner('✓ APA TITLE EXPORTED');
                  handleExportAuditJson();
                }}
                className="px-1.5 py-0.5 bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/50 rounded text-[9px] font-bold cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => setApaStatusBanner('⚡ VAULT BUYOUT LOGGED')}
                className="px-1.5 py-0.5 bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50 rounded text-[9px] font-bold cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          ) : (
            <span className="text-slate-400 shrink-0">
              Parity: {engineState.bufferParityPct.toFixed(2)}%
            </span>
          )}
        </div>

        {/* 8 Captured Graph Nodes (N0 to N7) in a crisp 2x4 / 8-column grid */}
        <div
          aria-label="Captured Graph Nodes N0 to N7"
          className="grid grid-cols-4 lg:grid-cols-8 gap-1 w-full my-auto shrink-0"
        >
          {engineState.nodes.map((node) => {
            const isSelected = node.nodeId === selectedNode.nodeId;
            const isFault = node.dispatchState === 'STALL_FAULT';
            const shortKernel = SHORT_KERNEL_LABELS[node.kernelType];

            return (
              <button
                key={node.nodeId}
                type="button"
                onClick={() => handleSelectNode(node.nodeId)}
                className={
                  'rounded-sm p-1 text-center border transition-colors cursor-pointer flex flex-col items-center justify-center ' +
                  (isFault
                    ? 'bg-[#EF4444]/20 border-[#EF4444]'
                    : isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                      : 'bg-slate-900/90 border-cyan-500/50 hover:border-cyan-400')
                }
              >
                <div className="text-[10px] font-mono font-bold text-white whitespace-nowrap leading-tight">
                  {node.label} · {shortKernel}
                </div>
                <div className="flex items-center justify-center gap-0.5 leading-tight mt-0.5 whitespace-nowrap">
                  <span className="text-[9px] text-cyan-300 font-mono">
                    {node.executionTimeUs.toFixed(2)} µs
                  </span>
                  <span className="text-[9px] text-slate-500">·</span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {node.registerFootprintKb} KB
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 2x2 Compact Node Inspector Grid Below Nodes */}
        <div
          aria-label="Node Inspector 2x2 Telemetry Grid"
          className="grid grid-cols-2 gap-1 text-[10px] font-mono shrink-0 pt-1 border-t border-slate-800/80"
        >
          <div className="bg-slate-900/90 border border-slate-800 rounded-sm px-2 py-0.5 text-slate-200 truncate">
            [PARENT: <span className="text-cyan-300 font-bold">{parentListText}</span>]
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-sm px-2 py-0.5 text-slate-200 truncate">
            [CHILD: <span className="text-emerald-400 font-bold">{childListText}</span>]
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-sm px-2 py-0.5 text-slate-200 truncate">
            [ALIAS:{' '}
            <span className="text-amber-300 font-bold">
              {selectedNode.memoryAliasPtr}
            </span>
            ]
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-sm px-2 py-0.5 text-slate-200 truncate">
            [REPLAY:{' '}
            <span className="text-cyan-300 font-bold">
              {selectedNode.replayOverheadUs.toFixed(2)} µs
            </span>
            ]
          </div>
        </div>
      </main>

      {/* COMPACT GRAPH TELEMETRY INSPECTOR STRIP */}
      <div
        aria-label="Compact Graph Telemetry Inspector Strip"
        className="w-full px-2 py-1 bg-slate-900/95 border border-slate-800 rounded text-[11px] font-mono font-bold text-cyan-300 truncate shrink-0"
      >
        {inspectorStripText}
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section
        aria-label="Tactical Launch Control Buttons"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        <button
          type="button"
          title="Trigger Graph Capture Burst"
          onClick={handleInjectGraphBurst}
          className="bg-[#FF9F0A]/15 hover:bg-[#FF9F0A]/25 text-[#FF9F0A] border border-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-1.5 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-2"
        >
          💥 INJECT GRAPH BURST
        </button>

        <button
          type="button"
          title="Inject Stream Stalling Conflict (Force Replay Invalidation)"
          onClick={handleToggleStallConflict}
          className="bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.25)] rounded-lg text-xs font-mono font-bold py-1.5 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-2"
        >
          ⚡ TOGGLE STALL CONFLICT
        </button>

        <button
          type="button"
          title="Step Graph Replay Kernel Pass"
          onClick={handleStepGraphReplay}
          className="bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981] rounded-lg text-xs font-mono font-bold py-1.5 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-2"
        >
          🚀 STEP GRAPH REPLAY
        </button>

        <button
          type="button"
          title="Flush Captured Nodes & Re-Zero Streams"
          onClick={handleFlushCapturedNodes}
          className="bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] border border-[#EF4444] rounded-lg text-xs font-mono font-bold py-1.5 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-2"
        >
          🔄 FLUSH CAPTURED NODES
        </button>
      </section>

      {/* PIT-WALL RADIO LOG */}
      <footer
        aria-label="Pit-Wall Radio Log"
        className="h-14 overflow-hidden font-mono text-[9px] p-1.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between"
      >
        {engineState.radioLogs.slice(-3).map((entry) => (
          <div key={entry.id} className="text-[9px] font-mono leading-tight truncate">
            [{entry.timestamp}] {entry.icon} {entry.callsign}: {entry.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
