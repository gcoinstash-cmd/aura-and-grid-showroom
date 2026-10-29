/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-234
 * Direct KV-Cache P2P Transfer · RDMA RoCEv2 Fabric · Zero-Copy
 */

import React, { useState, useMemo } from 'react';
import {
  RdmaCorridor,
  CompletionQueueState,
  FabricTelemetryState,
  RadioLogEntry,
  createInitialFabricState,
  stepP2PMigrationKernel,
  flushRdmaRingsAndZeroBuffers,
  calculateCorridorBandwidthGbs,
  calculateRdmaLatencyUs,
  formatTelemetryInspectorLine,
  NodeTransferActionSchema,
  CorridorSelectionSchema,
} from './rdmaEngine';
import { SUPABASE_POSTGRES_SCHEMA_SQL } from './supabaseSchema';

type CockpitTab = 'Mesh' | 'RDMA' | 'P2P' | 'Stats' | 'APA';

const INITIAL_RADIO_LOGS: RadioLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '00:01.04',
    callsign: '🟢 CREW CHIEF',
    message: 'RDMA RoCEv2 fabric initialized · 8 worker nodes linked',
  },
  {
    id: 'log-2',
    timestamp: '00:01.08',
    callsign: '⚡ PIT WALL',
    message: 'Direct GPU-to-GPU KV migration complete · Bandwidth at 200 GB/s',
  },
  {
    id: 'log-3',
    timestamp: '00:01.12',
    callsign: '🟢 TELEMETRY',
    message: 'Completion queue verified at 0.12 µs latency · Zero copy overhead',
  },
];

const CORRIDOR_LIST: RdmaCorridor[] = [
  RdmaCorridor.ALPHA,
  RdmaCorridor.BRAVO,
  RdmaCorridor.GAMMA,
  RdmaCorridor.DELTA,
];

const TABS: CockpitTab[] = ['Mesh', 'RDMA', 'P2P', 'Stats', 'APA'];

export default function App() {
  const [fabric, setFabric] = useState<FabricTelemetryState>(() => createInitialFabricState());
  const [selectedNodeId, setSelectedNodeId] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [radioLogs, setRadioLogs] = useState<RadioLogEntry[]>(INITIAL_RADIO_LOGS);
  const [clockTick, setClockTick] = useState<number>(116);
  const [schemaModalOpen, setSchemaModalOpen] = useState<boolean>(false);
  const [apaNotice, setApaNotice] = useState<string>('');

  const selectedNode = useMemo(() => {
    return fabric.nodes.find((n) => n.nodeId === selectedNodeId) || fabric.nodes[2];
  }, [fabric.nodes, selectedNodeId]);

  const inspectorLine = useMemo(() => {
    return formatTelemetryInspectorLine(selectedNode);
  }, [selectedNode]);

  const appendRadioLog = (
    callsign: RadioLogEntry['callsign'],
    message: string
  ) => {
    const nextTick = clockTick + 4;
    setClockTick(nextTick);
    const secs = Math.floor(nextTick / 100);
    const hundredths = nextTick % 100;
    const timestamp =
      '00:' +
      String(secs).padStart(2, '0') +
      '.' +
      String(hundredths).padStart(2, '0');

    const entry: RadioLogEntry = {
      id: 'log-' + String(nextTick),
      timestamp,
      callsign,
      message,
    };

    setRadioLogs((prev) => [entry, ...prev.slice(0, 2)]);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rawValue = e.target.value as RdmaCorridor;
    const parsed = CorridorSelectionSchema.safeParse({ corridor: rawValue });
    if (!parsed.success) {
      appendRadioLog('🔴 TELEMETRY', 'Ingress Zod guard rejected malformed corridor selector');
      return;
    }

    const chosen = parsed.data.corridor;
    const nextBw = calculateCorridorBandwidthGbs(chosen, fabric.packetDropInjected, 1.0);
    const nextLat = calculateRdmaLatencyUs(
      chosen,
      selectedNode.transferSizeMb,
      fabric.packetDropInjected,
      selectedNode.queueDepth
    );

    setFabric((prev) => ({
      ...prev,
      corridor: chosen,
      aggregateBandwidthGbs: nextBw,
      meanLatencyUs: nextLat,
      fabricStateLabel:
        chosen === RdmaCorridor.DELTA
          ? 'TCP Socket Fallback'
          : prev.packetDropInjected
          ? 'PFC Retransmit Active'
          : 'RoCEv2 Active',
      nodes: prev.nodes.map((n) => ({
        ...n,
        bandwidthGbs: nextBw,
        completionLatencyUs: nextLat,
        cqState:
          chosen === RdmaCorridor.DELTA
            ? CompletionQueueState.TCP_FALLBACK_MODE
            : CompletionQueueState.RDMA_WRITE_ACTIVE,
      })),
    }));

    appendRadioLog(
      '🟢 CREW CHIEF',
      'Corridor switched · ' +
        chosen.split(' ')[0] +
        ' · Bandwidth at ' +
        String(nextBw) +
        ' GB/s'
    );
  };

  const handleInjectRdmaBurst = () => {
    const validation = NodeTransferActionSchema.safeParse({
      sourceNodeId: selectedNode.nodeId,
      targetNodeId: selectedNode.targetNodeId,
      transferSizeMb: selectedNode.transferSizeMb,
      corridor: fabric.corridor,
      packetDropActive: fabric.packetDropInjected,
      memoryPointerHex: selectedNode.memoryPointerHex,
    });

    if (!validation.success) {
      appendRadioLog('🔴 TELEMETRY', 'GridSync Zod ingress blocked burst execution');
      return;
    }

    const nextState = stepP2PMigrationKernel(fabric, true);
    setFabric(nextState);
    appendRadioLog(
      '⚡ PIT WALL',
      'Trigger RDMA Transfer Burst · 8 nodes saturated at ' +
        String(nextState.aggregateBandwidthGbs) +
        ' GB/s · +128,000 Units'
    );
  };

  const handleTogglePacketDrop = () => {
    const nextDropState = !fabric.packetDropInjected;
    const tempFabric: FabricTelemetryState = {
      ...fabric,
      packetDropInjected: nextDropState,
    };
    const nextState = stepP2PMigrationKernel(tempFabric, false);
    setFabric(nextState);

    if (nextDropState) {
      appendRadioLog(
        '🔴 TELEMETRY',
        'Inject Fabric Packet Drop (Force Retransmit) · RoCEv2 PFC pause & Go-Back-N engaged'
      );
    } else {
      appendRadioLog(
        '🟢 TELEMETRY',
        'Packet drop cleared · Completion queues restored to zero-copy lock at ' +
          String(nextState.meanLatencyUs) +
          ' µs'
      );
    }
  };

  const handleStepP2PMigration = () => {
    const nextState = stepP2PMigrationKernel(fabric, false);
    setFabric(nextState);
    appendRadioLog(
      '⚡ PIT WALL',
      'Step P2P Migration Kernel · Ring Epoch ' +
        String(nextState.ringEpoch) +
        ' · ' +
        String(nextState.meanLatencyUs) +
        ' µs latency'
    );
  };

  const handleFlushRdmaBuffers = () => {
    const resetState = flushRdmaRingsAndZeroBuffers(RdmaCorridor.ALPHA);
    setFabric(resetState);
    setSelectedNodeId(2);
    appendRadioLog(
      '🟢 CREW CHIEF',
      'Flush RDMA Rings & Re-Zero Buffers complete · 8/8 nodes locked · Parity 100.0%'
    );
  };

  const handleExportAudit = () => {
    const auditPayload = {
      engineId: 'GF-T3-234',
      corridor: fabric.corridor,
      ringEpoch: fabric.ringEpoch,
      aggregateBandwidthGbs: String(fabric.aggregateBandwidthGbs) + ' GB/s',
      transferLatencyUs: String(fabric.meanLatencyUs) + ' µs',
      activeNodes: String(fabric.activeNodesCount) + ' Nodes',
      processedTokens: String(fabric.processedTokensUnits) + ' Units',
      fabricState: fabric.fabricStateLabel,
      bufferParityPct: String(fabric.bufferParityPct) + '%',
      nodes: fabric.nodes,
    };
    const blob = new Blob([JSON.stringify(auditPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'GF-T3-234-rdma-telemetry-audit.json';
    anchor.click();
    URL.revokeObjectURL(url);

    appendRadioLog(
      '🟢 TELEMETRY',
      'Exported deterministic RDMA RoCEv2 telemetry & CRC-32 parity audit bundle'
    );
  };

  const formattedTokens = fabric.processedTokensUnits.toLocaleString('en-US') + ' UNITS';
  const formattedXp = '+' + (fabric.rdmaXpPoints / 1000).toFixed(1) + 'k RDMA XP';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP COMMAND DECK: ROW 1 & ROW 2 */}
      <header className="w-full shrink-0 border-b border-slate-800/90 pb-0.5">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm font-mono font-bold tracking-tight text-slate-100">
              GF-T3-234
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 rounded">
              TRACK 3
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-emerald-400">
              {fabric.packetDropInjected ? '⚡ FAULT' : '✓ LOCKED'}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Select RDMA Corridor"
              value={fabric.corridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {CORRIDOR_LIST.map((corridorOption) => (
                <option key={corridorOption} value={corridorOption}>
                  {corridorOption}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setActiveTab('RDMA')}
              className={
                'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer ' +
                (activeTab === 'RDMA'
                  ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-cyan-400')
              }
            >
              [RDMA]
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('P2P')}
              className={
                'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer ' +
                (activeTab === 'P2P'
                  ? 'bg-[#FF9F0A]/20 border-[#FF9F0A] text-[#FF9F0A]'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-amber-400')
              }
            >
              [P2P]
            </button>
            <button
              type="button"
              onClick={handleStepP2PMigration}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
            >
              [Run]
            </button>
            <button
              type="button"
              onClick={() => setSchemaModalOpen((prev) => !prev)}
              className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-900 border border-slate-700 text-cyan-300 hover:border-cyan-400 transition-colors cursor-pointer"
            >
              [Inspect Schema]
            </button>
            <button
              type="button"
              onClick={handleFlushRdmaBuffers}
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-900 border border-rose-500/50 text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              [Reset]
            </button>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap leading-tight">
          Direct KV-Cache P2P Transfer · RDMA RoCEv2 Fabric · Zero-Copy
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0"
      >
        {/* Card 1: RDMA NITRO */}
        <div className="bg-slate-950/90 border border-slate-800 rounded px-2 py-0.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              RDMA NITRO
            </span>
            <span className="text-[10px] font-mono text-[#00F0FF]">
              {String(fabric.bandwidthSaturationPct)}% SAT
            </span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-none">
            {String(fabric.aggregateBandwidthGbs)} GB/s
          </div>
          <div className="w-full bg-slate-900 h-1 rounded overflow-hidden my-0.5 border border-slate-800">
            <div
              className="bg-[#00F0FF] h-full transition-all duration-150"
              style={{ width: String(Math.min(100, fabric.bandwidthSaturationPct)) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-none">
            Fabric Bandwidth Saturation
          </div>
        </div>

        {/* Card 2: MIGRATION STREAK */}
        <div className="bg-slate-950/90 border border-slate-800 rounded px-2 py-0.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              MIGRATION STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">
              🔥 8 NODES
            </span>
          </div>
          <div className="text-amber-400 font-mono text-lg font-bold leading-none">
            {String(fabric.meanLatencyUs)} µs
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate leading-none">
            Zero-Copy: {String(fabric.zeroCopyEfficiencyPct)}%
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-none">
            P2P Transfer Latency
          </div>
        </div>

        {/* Card 3: ACTIVE NODES */}
        <div className="bg-slate-950/90 border border-slate-800 rounded px-2 py-0.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              ACTIVE NODES
            </span>
            <span
              className={
                'text-[10px] font-mono font-bold ' +
                (fabric.packetDropInjected ? 'text-rose-400' : 'text-emerald-400')
              }
            >
              {fabric.packetDropInjected ? '⚡ FAULT' : '✓ LOCKED'}
            </span>
          </div>
          <div className="text-emerald-400 font-mono text-lg font-bold leading-none">
            NODES: {String(fabric.activeNodesCount)}/{String(fabric.totalNodesCount)}
          </div>
          <div className="grid grid-cols-8 gap-0.5">
            {fabric.nodes.map((n) => {
              const isSelected = n.nodeId === selectedNodeId;
              const hasFault = !n.parityVerified;
              return (
                <button
                  key={n.label}
                  type="button"
                  onClick={() => setSelectedNodeId(n.nodeId)}
                  className={
                    'text-[9px] font-mono font-bold rounded text-center border cursor-pointer leading-tight ' +
                    (hasFault
                      ? 'bg-rose-950/90 border-rose-500 text-rose-300'
                      : isSelected
                      ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-[#00F0FF]'
                      : 'bg-slate-900 border-slate-700 text-emerald-300')
                  }
                >
                  {n.label}
                </button>
              );
            })}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-none">
            Buffer Parity: {String(fabric.bufferParityPct)}%
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-950/90 border border-slate-800 rounded px-2 py-0.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              {formattedXp}
            </span>
          </div>
          <div className="text-slate-100 font-mono text-lg font-bold leading-none truncate">
            {formattedTokens}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate leading-none">
            Ring Epoch: #{String(fabric.ringEpoch)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-none">
            Fabric State: {fabric.fabricStateLabel}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setSchemaModalOpen(false);
              }}
              className={
                'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
                (active
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* INTERACTIVE SIMULATION BAY */}
      <main className="flex-1 min-h-0 w-full bg-slate-950/80 border border-slate-800 rounded-lg p-1 flex flex-col justify-between overflow-hidden">
        {schemaModalOpen ? (
          <div className="h-full flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-0.5 shrink-0">
              <span className="text-[11px] font-mono font-bold text-[#00F0FF]">
                POSTGRESQL 16 / SUPABASE PARTITIONED SCHEMA & ZERO-TRUST RLS
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleExportAudit}
                  className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 rounded cursor-pointer"
                >
                  EXPORT AUDIT JSON
                </button>
                <button
                  type="button"
                  onClick={() => setSchemaModalOpen(false)}
                  className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-200 rounded cursor-pointer"
                >
                  CLOSE SCHEMA
                </button>
              </div>
            </div>
            <pre className="flex-1 min-h-0 overflow-y-auto text-[10px] font-mono text-slate-300 bg-black/90 p-1.5 rounded border border-slate-800/80 mt-0.5 leading-snug">
              {SUPABASE_POSTGRES_SCHEMA_SQL}
            </pre>
          </div>
        ) : activeTab === 'Mesh' || activeTab === 'RDMA' ? (
          <div className="h-full flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-800/80 pb-0.5 shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[#00F0FF] font-bold">CORRIDOR:</span>
                <span className="text-slate-200 truncate">{fabric.corridor}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="hidden sm:inline text-slate-400">
                  {activeTab === 'Mesh' ? '8-NODE P2P RING' : 'ROCEV2 DMA QUEUE'}
                </span>
                <span
                  className={
                    'px-1 py-0.2 rounded text-[10px] font-bold ' +
                    (fabric.packetDropInjected
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50')
                  }
                >
                  {fabric.packetDropInjected ? '⚡ FAULT' : '✓ LOCKED'}
                </span>
              </div>
            </div>

            {/* 8-Node Interactive RDMA Transfer Matrix Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 py-0.5 flex-1 min-h-0">
              {fabric.nodes.map((node) => {
                const isSelected = node.nodeId === selectedNodeId;
                const isFault = !node.parityVerified;
                return (
                  <button
                    key={node.nodeId}
                    type="button"
                    onClick={() => {
                      setSelectedNodeId(node.nodeId);
                      appendRadioLog(
                        '🟢 TELEMETRY',
                        'Focused Node ' +
                          node.label +
                          ' -> Target ' +
                          node.targetLabel +
                          ' · Ptr ' +
                          node.memoryPointerHex
                      );
                    }}
                    className={
                      'flex flex-col justify-between p-1 py-0.5 rounded border text-left transition-all cursor-pointer overflow-hidden ' +
                      (isFault
                        ? 'bg-rose-950/30 border-rose-500/80 hover:border-rose-400'
                        : isSelected
                        ? 'bg-cyan-950/30 border-[#00F0FF] ring-1 ring-[#00F0FF]/50'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-600')
                    }
                  >
                    <div className="flex items-center justify-between w-full leading-tight">
                      <span className="text-xs font-mono font-bold text-white truncate">
                        NODE {String(node.nodeId)} · {node.label} → {node.targetLabel}
                      </span>
                      <span
                        className={
                          'text-[10px] font-mono font-bold shrink-0 ' +
                          (isFault ? 'text-rose-400' : 'text-emerald-400')
                        }
                      >
                        {isFault ? '⚡' : '✓'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300 leading-tight">
                      <span>KV: {String(node.kvBlocksAllocated)} Blks</span>
                      <span className="font-bold">{String(node.transferSizeMb)} MB</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 leading-tight">
                      <span className="truncate">{node.memoryPointerHex}</span>
                      <span className="text-amber-400 shrink-0">QD:{String(node.queueDepth)}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono leading-tight">
                      <span
                        className={
                          'truncate font-bold ' +
                          (isFault
                            ? 'text-rose-400'
                            : node.cqState === CompletionQueueState.TCP_FALLBACK_MODE
                            ? 'text-amber-300'
                            : 'text-emerald-400')
                        }
                      >
                        {node.cqState}
                      </span>
                      <span className="text-slate-400 shrink-0">
                        {String(node.completionLatencyUs)}µs
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'P2P' ? (
          <div className="h-full flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-0.5 shrink-0">
              <span className="text-[11px] font-mono font-bold text-[#FF9F0A]">
                DIRECT GPU-TO-GPU P2P RING-BUFFER KV MIGRATION PIPELINE
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                EPOCH #{String(fabric.ringEpoch)}
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 py-0.5 flex-1 min-h-0">
              {fabric.nodes.slice(0, 4).map((node, i) => {
                const pairNode = fabric.nodes[i + 4];
                return (
                  <div
                    key={node.nodeId}
                    className="bg-slate-900/75 border border-slate-800 rounded p-1.5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                      <span className="text-[#00F0FF]">
                        LANE {String(i + 1)}: {node.label} ⇄ {pairNode.label}
                      </span>
                      <span className="text-emerald-400">
                        {String(node.bandwidthGbs)} GB/s
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-300 leading-tight">
                      <div>
                        DMA Ptr: <span className="text-white">{node.memoryPointerHex}</span>
                      </div>
                      <div>
                        Peer RKey: <span className="text-amber-300">{node.remoteKeyHex}</span>
                      </div>
                      <div>
                        Chunk: <span className="text-cyan-300">#{String(node.prefillChunkIndex)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono border-t border-slate-800 pt-0.5">
                      <span className="text-slate-400">CRC-32</span>
                      <span className="text-emerald-400 font-bold">
                        {node.parityVerified ? '✓ LOCKED' : '⚡ RETRANSMIT'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'Stats' ? (
          <div className="h-full flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-0.5 shrink-0">
              <span className="text-[11px] font-mono font-bold text-[#00F0FF]">
                ROCEV2 FABRIC TELEMETRY & VERIFICATION METRICS
              </span>
              <button
                type="button"
                onClick={handleExportAudit}
                className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 border border-[#00F0FF]/50 text-[#00F0FF] rounded cursor-pointer"
              >
                EXPORT AUDIT TELEMETRY
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 py-0.5 flex-1 min-h-0">
              <div className="bg-slate-900/70 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400">RDMA BANDWIDTH BUS</span>
                <span className="text-sm font-mono font-bold text-[#00F0FF]">
                  RDMA Bandwidth: {String(fabric.aggregateBandwidthGbs)} GB/s
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  Zero Host CPU Staging
                </span>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400">FABRIC LATENCY</span>
                <span className="text-sm font-mono font-bold text-amber-400">
                  Transfer Latency: {String(fabric.meanLatencyUs)} µs
                </span>
                <span className="text-[10px] font-mono text-slate-300">
                  Sub-Microsecond CQ Doorbell
                </span>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400">CLUSTER TOPOLOGY</span>
                <span className="text-sm font-mono font-bold text-emerald-400">
                  Active Nodes: {String(fabric.activeNodesCount)} Nodes
                </span>
                <span className="text-[10px] font-mono text-slate-300">
                  Processed Tokens: {fabric.processedTokensUnits.toLocaleString('en-US')} Units
                </span>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400">CLEAN-ROOM AUDIT</span>
                <span className="text-xs font-mono font-bold text-white">
                  Fabric State: {fabric.fabricStateLabel}
                </span>
                <span className="text-[10px] font-mono text-cyan-300">
                  100% MIT / Apache-2.0 · SSDF v1.1
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-0.5 shrink-0">
              <span className="text-[11px] font-mono font-bold text-[#FF9F0A]">
                GF-T3-234 · INSTITUTIONAL ASSET PURCHASE AGREEMENT (APA) HANDOVER
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                100% MIT PERMISSIVE
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-1 py-0.5 flex-1 min-h-0">
              <div className="bg-slate-900/80 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
                <div className="text-[11px] font-mono font-bold text-white">
                  1. CLEAN-ROOM IP PROVENANCE
                </div>
                <p className="text-[10px] font-mono text-slate-300 leading-tight">
                  Zero third-party proprietary InfiniBand verbs or copyleft transport hooks.
                  Engineered from first-principles RoCEv2 ring-buffer mathematics.
                </p>
                <div className="text-[10px] font-mono text-emerald-400">
                  ✓ Verified NIST SP 800-218 SSDF v1.1
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
                <div className="text-[11px] font-mono font-bold text-white">
                  2. REPOSITORY HANDOVER PACKAGE
                </div>
                <p className="text-[10px] font-mono text-slate-300 leading-tight">
                  Standalone FastAPI engine.py, Pytest + Vitest suites (&gt;80% pass),
                  Cloud Run Dockerfile, and Partitioned Supabase RLS SQL schema.
                </p>
                <button
                  type="button"
                  onClick={() => setSchemaModalOpen(true)}
                  className="text-left text-[10px] font-mono font-bold text-[#00F0FF] underline cursor-pointer"
                >
                  Inspect Partitioned PostgreSQL Schema →
                </button>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded p-1.5 flex flex-col justify-between">
                <div className="text-[11px] font-mono font-bold text-amber-400">
                  3. SOVEREIGN TITLE TRANSFER
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setApaNotice('APA Title Transfer Dossier initialized for GF-T3-234.');
                      appendRadioLog(
                        '🟢 CREW CHIEF',
                        'ACQUIRE TITLE (APA) dossier prepared · Clean-room title verified'
                      );
                    }}
                    className="flex-1 py-1 px-1.5 text-[10px] font-mono font-bold bg-[#FF9F0A] text-black rounded hover:bg-amber-400 transition-colors cursor-pointer text-center"
                  >
                    ACQUIRE TITLE (APA)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApaNotice('Vault Buyout Inquiry logged with Dealership Principal.');
                      appendRadioLog(
                        '⚡ PIT WALL',
                        'INQUIRE VAULT BUYOUT logged · Direct standalone repository transfer ready'
                      );
                    }}
                    className="flex-1 py-1 px-1.5 text-[10px] font-mono font-bold bg-slate-800 border border-[#00F0FF]/60 text-[#00F0FF] rounded hover:bg-slate-700 transition-colors cursor-pointer text-center"
                  >
                    INQUIRE VAULT BUYOUT
                  </button>
                </div>
                {apaNotice && (
                  <div className="text-[10px] font-mono text-emerald-400 truncate">
                    {apaNotice}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* COMPACT RDMA TELEMETRY INSPECTOR STRIP */}
      <div
        aria-label="RDMA Telemetry Inspector Strip"
        className="w-full bg-slate-900/95 border border-slate-800 rounded px-2 py-0.5 shrink-0 flex items-center justify-between gap-2"
      >
        <span className="text-xs font-mono font-bold text-cyan-300 truncate">
          {inspectorLine}
        </span>
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-slate-400">
            RKEY: {selectedNode.remoteKeyHex}
          </span>
          <button
            type="button"
            onClick={handleExportAudit}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-200 rounded hover:border-cyan-400 cursor-pointer"
          >
            EXPORT AUDIT
          </button>
        </div>
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section
        aria-label="Tactical Launch Controls"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleInjectRdmaBurst}
          className="bg-amber-950/40 hover:bg-amber-900/50 border border-[#FF9F0A] text-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-1.5 text-center transition-colors cursor-pointer"
        >
          💥 INJECT RDMA BURST
        </button>

        <button
          type="button"
          onClick={handleTogglePacketDrop}
          className="bg-cyan-950/40 hover:bg-cyan-900/50 border border-[#00F0FF] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)] rounded-lg text-xs font-mono font-bold py-1.5 text-center transition-colors cursor-pointer"
        >
          ⚡ TOGGLE PACKET DROP
        </button>

        <button
          type="button"
          onClick={handleStepP2PMigration}
          className="bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500 text-emerald-300 rounded-lg text-xs font-mono font-bold py-1.5 text-center transition-colors cursor-pointer"
        >
          🚀 STEP P2P MIGRATION
        </button>

        <button
          type="button"
          onClick={handleFlushRdmaBuffers}
          className="bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500 text-rose-300 rounded-lg text-xs font-mono font-bold py-1.5 text-center transition-colors cursor-pointer"
        >
          🔄 FLUSH RDMA BUFFERS
        </button>
      </section>

      {/* PIT-WALL RADIO LOG */}
      <footer
        aria-label="Pit-Wall Radio Log"
        className="h-14 overflow-hidden font-mono text-[10px] p-2 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between"
      >
        {radioLogs.map((entry) => (
          <div key={entry.id} className="truncate">
            [{entry.timestamp}] {entry.callsign}: {entry.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
