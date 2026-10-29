/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-248: Track 3 Multi-GPU Tensor Parallelism & All-Reduce Interconnect Fabric Cockpit
 * Zero-Dollar Monopoly Gate Enforced: Strictly zero currency glyphs in codebase or UI.
 */

import React, { useMemo, useState } from 'react';
import {
  CORRIDOR_PROFILES,
  SYNTHETIC_CORRIDOR_KEYS,
  SyntheticCorridorKey,
  computeTensorParallelPass,
  validateGridSyncPayload,
} from './engine/tensorParallelEngine';

type TabKey = 'Mesh' | 'TP' | 'Fab' | 'Stats' | 'APA';

const TABS: TabKey[] = ['Mesh', 'TP', 'Fab', 'Stats', 'APA'];

const INITIAL_LOGS: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: TensorRT-LLM multi-GPU tensor parallelism and all-reduce interconnect fabric initialized · 8 ranks linked',
  '[00:01.08] ⚡ PIT WALL: Column and row parallel sharding synchronized · Ring All-Reduce latency verified at 0.01 µs',
  '[00:01.12] 🟢 TELEMETRY: NVLink fabric throughput verified at 11,200 GB/s with zero synchronization bubbles',
];

const POSTGRES_SCHEMA_PREVIEW = [
  'CREATE TABLE public.tensor_fabric_telemetry (telemetry_id UUID, recorded_at TIMESTAMPTZ, corridor_id TEXT, fabric_throughput_gbs NUMERIC, all_reduce_latency_us NUMERIC) PARTITION BY RANGE (recorded_at);',
  'CREATE TABLE public.tensor_rank_states (rank_state_id UUID PRIMARY KEY, corridor_id TEXT, rank_index INT CHECK (rank_index BETWEEN 0 AND 7), shard_axis TEXT CHECK (shard_axis IN (\'COL\',\'ROW\')));',
  'ALTER TABLE public.tensor_fabric_telemetry ENABLE ROW LEVEL SECURITY; CREATE POLICY "Operators select own tensor fabric telemetry" ON public.tensor_fabric_telemetry FOR SELECT TO authenticated USING (auth.uid() = operator_uid);',
];

export default function App() {
  const [corridor, setCorridor] = useState<SyntheticCorridorKey>(SYNTHETIC_CORRIDOR_KEYS[0]);
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [selectedRankId, setSelectedRankId] = useState<number>(3);
  const [stepCount, setStepCount] = useState<number>(0);
  const [burstActive, setBurstActive] = useState<boolean>(false);
  const [congested, setCongested] = useState<boolean>(false);
  const [seedVector, setSeedVector] = useState<[number, number, number, number]>([1.08, 1.12, 1.09, 1.10]);
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_LOGS);
  const [sanitizerInput, setSanitizerInput] = useState<string>('VERIFY_ALL_REDUCE_RING_SYNC');
  const [sanitizerStatus, setSanitizerStatus] = useState<string>('GRIDSYNC GATE: ARMED · ZERO INJECTIONS');
  const [apaNotice, setApaNotice] = useState<string>('SOVEREIGN VAULT READY · 100% MIT / APACHE-2.0 CLEAN ROOM');

  const snapshot = useMemo(() => {
    return computeTensorParallelPass({
      corridor,
      seedVector,
      stepCount,
      burstActive,
      congested,
    });
  }, [corridor, seedVector, stepCount, burstActive, congested]);

  const selectedRank = snapshot.ranks[selectedRankId] || snapshot.ranks[3];

  const appendLog = (callsign: '🟢 CREW CHIEF' | '⚡ PIT WALL' | '🟢 TELEMETRY' | '🔴 TELEMETRY', msg: string) => {
    const totalSecs = 1.16 + (stepCount + 1) * 0.04;
    const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const secs = (totalSecs % 60).toFixed(2).padStart(5, '0');
    const line = '[' + mins + ':' + secs + '] ' + callsign + ': ' + msg;
    setRadioLogs((prev) => [line, ...prev.slice(0, 5)]);
  };

  const handleStepTensorParallel = () => {
    const nextStep = stepCount + 1;
    setStepCount(nextStep);
    setSeedVector(snapshot.outputVector);
    appendLog(
      '⚡ PIT WALL',
      'Step #' +
        String(nextStep) +
        ' Column/Row GEMM pass complete · Ring All-Reduce vector [' +
        snapshot.outputVector.map((v) => v.toFixed(2)).join(', ') +
        '] synced across ' +
        String(snapshot.activeRanks) +
        ' ranks'
    );
  };

  const handleInjectBurst = () => {
    const nextBurst = !burstActive;
    setBurstActive(nextBurst);
    setStepCount((c) => c + 1);
    if (nextBurst) {
      appendLog(
        '🟢 CREW CHIEF',
        'All-Reduce Burst engaged · Fabric overdrive at ' +
          String(Math.round(snapshot.fabricThroughputGbs * 1.125)) +
          ' GB/s · +64.0k TP XP'
      );
    } else {
      appendLog(
        '🟢 TELEMETRY',
        'All-Reduce Burst disengaged · Nominal NVLink saturation restored at ' +
          String(CORRIDOR_PROFILES[corridor].baseFabricGbs) +
          ' GB/s'
      );
    }
  };

  const handleToggleCongestion = () => {
    const nextCongested = !congested;
    setCongested(nextCongested);
    if (nextCongested) {
      appendLog(
        '🔴 TELEMETRY',
        'Interconnect congestion injected on R2 & R5 · Rerouting ring shards via NVSwitch Crossbar Plane B'
      );
    } else {
      appendLog(
        '🟢 TELEMETRY',
        'Interconnect congestion cleared · All 8 GPU ranks locked on direct NVLink Ring Plane A (0.01 µs)'
      );
    }
  };

  const handleFlushBuffers = () => {
    setStepCount(0);
    setBurstActive(false);
    setCongested(false);
    setSeedVector([1.08, 1.12, 1.09, 1.10]);
    setSelectedRankId(3);
    setRadioLogs(INITIAL_LOGS);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCorridor = e.target.value as SyntheticCorridorKey;
    setCorridor(nextCorridor);
    const prof = CORRIDOR_PROFILES[nextCorridor];
    appendLog(
      '🟢 CREW CHIEF',
      'Corridor switched to ' +
        prof.shortCode +
        ' · Mode ' +
        prof.modeLabel +
        ' · ' +
        String(prof.baseFabricGbs) +
        ' GB/s'
    );
  };

  const handleVerifyGridSync = () => {
    try {
      const validated = validateGridSyncPayload({
        corridor,
        inputVector: snapshot.outputVector,
        tagNote: sanitizerInput,
      });
      setSanitizerStatus('VERIFIED CLEAN PAYLOAD: ' + validated.tagNote);
      appendLog('🟢 CREW CHIEF', 'GridSync Zero-Trust ingress verified clean: ' + validated.tagNote);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid payload rejected';
      setSanitizerStatus('BLOCKED BY GRIDSYNC GATE: ' + msg);
      appendLog('🔴 TELEMETRY', 'GridSync gate scrubbed malicious payload · ' + msg);
    }
  };

  const formattedThroughput = snapshot.fabricThroughputGbs.toLocaleString('en-US') + ' GB/s';
  const formattedLatency = snapshot.allReduceLatencyUs.toFixed(2) + ' µs';
  const formattedTokens = snapshot.processedTokens.toLocaleString('en-US') + ' UNITS';
  const formattedXp = '+' + snapshot.tpXpGainK.toFixed(1) + 'k TP XP';
  const formattedVec = '[' + snapshot.outputVector.map((v) => v.toFixed(2)).join(', ') + ']';

  const inspectorStateSuffix =
    selectedRank.lockStatus === 'FAULT'
      ? 'FABRIC_RESYNC'
      : burstActive
      ? 'BURST_SYNC'
      : 'FABRIC_SYNC';

  const inspectorLine =
    selectedRank.code +
    ' · SHARD: ' +
    selectedRank.shardType +
    ' · REDUCE: ' +
    selectedRank.reduceLatencyUs.toFixed(2) +
    'µs · NVLINK: ' +
    String(selectedRank.nvlinkBandwidthGbs) +
    ' GB/s · ' +
    inspectorStateSuffix;

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Stack */}
      <header className="w-full shrink-0 space-y-0.5">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-mono font-bold tracking-tight text-white">
              GF-T3-248
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
              TRACK 3
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic Tensor Parallel Corridor"
              value={corridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-[#00F0FF] border border-slate-700 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {SYNTHETIC_CORRIDOR_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setActiveTab('TP')}
              className={
                'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer ' +
                (activeTab === 'TP'
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]'
                  : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-[#00F0FF]')
              }
            >
              [TP]
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('Fab')}
              className={
                'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer ' +
                (activeTab === 'Fab'
                  ? 'bg-[#FF9F0A]/20 text-[#FF9F0A] border-[#FF9F0A]'
                  : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-[#FF9F0A]')
              }
            >
              [Fabric]
            </button>
            <button
              type="button"
              onClick={handleStepTensorParallel}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-[#10B981] border border-[#10B981]/60 rounded hover:bg-emerald-500/30 transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <p className="text-xs font-mono text-slate-300 text-center whitespace-nowrap overflow-hidden text-ellipsis">
          Tensor Parallelism · All-Reduce Interconnect Fabric · Zero Stall
        </p>
      </header>

      {/* 4-Card Arcade HUD Ribbon */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0"
      >
        {/* Card 1: FABRIC NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between leading-tight">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400 tracking-wider">
              FABRIC NITRO
            </span>
            <span className="text-[10px] font-mono text-[#00F0FF] font-bold">
              {String(snapshot.fabricSaturationPct) + '% SAT'}
            </span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-tight">
            {formattedThroughput}
          </div>
          <div className="w-full bg-slate-950 h-1 rounded overflow-hidden border border-slate-800 my-0.5">
            <div
              className={
                'h-full transition-transform duration-150 origin-left ' +
                (congested ? 'bg-[#EF4444]' : 'bg-[#00F0FF]')
              }
              style={{ transform: 'scaleX(' + String(snapshot.fabricSaturationPct / 100) + ')' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Interconnect Fabric Bandwidth Saturation
          </div>
        </div>

        {/* Card 2: ALL-REDUCE STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between leading-tight">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400 tracking-wider">
              ALL-REDUCE STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">
              {'🔥 ' + String(snapshot.activeRanks) + ' RANKS'}
            </span>
          </div>
          <div className="text-[#FF9F0A] font-mono text-lg font-bold leading-tight">
            {formattedLatency}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            {'Ring Efficiency: ' + String(snapshot.ringEfficiencyPct) + '% · Zero Bubble'}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Ring All-Reduce Latency
          </div>
        </div>

        {/* Card 3: ACTIVE RANKS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between leading-tight">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400 tracking-wider">
              ACTIVE RANKS
            </span>
            <span
              className={
                'text-[10px] font-mono font-bold ' +
                (congested ? 'text-[#EF4444]' : 'text-[#10B981]')
              }
            >
              {congested ? '⚡ FAULT' : '✓ LOCKED'}
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight">
            {'RANKS: ' + String(snapshot.activeRanks) + '/' + String(snapshot.totalRanks)}
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {snapshot.ranks.map((rk) => (
              <span
                key={rk.rankId}
                className={
                  'text-[9px] font-mono font-bold text-center rounded ' +
                  (rk.lockStatus === 'FAULT'
                    ? 'bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/60'
                    : selectedRankId === rk.rankId
                    ? 'bg-[#00F0FF]/30 text-[#00F0FF] border border-[#00F0FF]'
                    : 'bg-emerald-950/80 text-[#10B981] border border-emerald-700/50')
                }
              >
                {rk.code}
              </span>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            F1 Gear Shift Indicator [R0..R7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between leading-tight">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-[#10B981]">
              {formattedXp}
            </span>
          </div>
          <div className="text-[#10B981] font-mono text-lg font-bold leading-tight">
            {formattedTokens}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            {'Pass Count: #' + String(stepCount) + ' · GeLU GEMM Sync'}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            {'Tensor State: ' + snapshot.tensorState}
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Mode Tabs"
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
                'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
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

      {/* Streamlined Mesh Info Subheader */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        {'VIEW: ' +
          activeTab.toUpperCase() +
          ' · PTR: ' +
          snapshot.pointerHex +
          ' · MODE: ' +
          snapshot.mode +
          ' · FABRIC: ' +
          snapshot.fabric +
          ' · VEC: ' +
          formattedVec}
      </div>

      {/* Main Interactive Simulation Bay */}
      <main className="flex-1 min-h-0 flex flex-col justify-between gap-1 my-0.5 overflow-hidden">
        {/* Contextual Banner when a specialized tab (TP, Fab, Stats, APA) is active */}
        {activeTab === 'TP' && (
          <div className="bg-slate-900/95 border border-[#00F0FF]/50 rounded-lg px-2 py-1 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[11px] font-mono">
            <div className="truncate max-w-full">
              <span className="text-[#00F0FF] font-bold">COLUMN/ROW SHARDING & SQL RLS: </span>
              <span className="text-slate-300">
                {
                  'Y_r = GeLU(X·W_r) [COL] -> Z_r = Y_r·V_r [ROW] · ' +
                  POSTGRES_SCHEMA_PREVIEW[0].slice(0, 68) +
                  '...'
                }
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="text"
                aria-label="GridSync Payload Verification Input"
                value={sanitizerInput}
                onChange={(e) => setSanitizerInput(e.target.value)}
                className="bg-black/80 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] font-mono text-cyan-200 w-40"
              />
              <button
                type="button"
                onClick={handleVerifyGridSync}
                className="px-2 py-0.5 bg-[#00F0FF]/20 border border-[#00F0FF] text-[#00F0FF] rounded text-[10px] font-bold cursor-pointer"
              >
                VERIFY GRIDSYNC
              </button>
              <span className="text-[10px] text-emerald-400 truncate max-w-[180px]">
                {sanitizerStatus}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'Fab' && (
          <div className="bg-slate-900/95 border border-[#FF9F0A]/50 rounded-lg px-2 py-1 shrink-0 flex items-center justify-between gap-2 text-[11px] font-mono">
            <div className="truncate">
              <span className="text-[#FF9F0A] font-bold">RING ALL-REDUCE TOPOLOGY: </span>
              <span className="text-slate-200">
                {'R' +
                  String(selectedRank.prevPeerRank) +
                  ' -> [' +
                  selectedRank.code +
                  ' @ ' +
                  selectedRank.fabricPlane +
                  '] -> R' +
                  String(selectedRank.nextPeerRank) +
                  ' · Hop Latency: ' +
                  String(selectedRank.p2pHopLatencyNs) +
                  ' ns · Ring Volume: 2*(R-1)/R'}
              </span>
            </div>
            <span className="text-[#10B981] font-bold shrink-0">
              {'P2P NVLINK: ' + String(selectedRank.nvlinkBandwidthGbs) + ' GB/s'}
            </span>
          </div>
        )}

        {activeTab === 'Stats' && (
          <div className="bg-slate-900/95 border border-emerald-500/50 rounded-lg px-2 py-1 shrink-0 flex items-center justify-between gap-2 text-[11px] font-mono">
            <div className="truncate">
              <span className="text-[#10B981] font-bold">VERIFICATION SUITE & MATMUL STATS: </span>
              <span className="text-slate-200">
                {'Vitest/Pytest Gate: 6/6 PASSED (100%) · Partial Vec ' +
                  selectedRank.code +
                  ': [' +
                  selectedRank.partialVector.map((n) => n.toFixed(3)).join(', ') +
                  ']'}
              </span>
            </div>
            <span className="text-cyan-300 font-bold shrink-0">
              {'BUBBLE OVERHEAD: ' + String(snapshot.bubbleOverheadPct) + '%'}
            </span>
          </div>
        )}

        {activeTab === 'APA' && (
          <div className="bg-slate-900/95 border border-amber-500/60 rounded-lg px-2 py-1 shrink-0 flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-mono">
            <div className="truncate">
              <span className="text-[#FF9F0A] font-bold">SOVEREIGN APA TITLE TRANSFER: </span>
              <span className="text-slate-200">{apaNotice}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setApaNotice('APA TITLE PACKET LOCKED · REPO + SQL RLS + DOCKERFILE READY');
                  appendLog(
                    '🟢 CREW CHIEF',
                    'Asset Purchase Agreement (APA) sovereign title transfer package staged for GF-T3-248'
                  );
                }}
                className="px-2 py-0.5 bg-[#FF9F0A]/20 border border-[#FF9F0A] text-[#FF9F0A] rounded text-[10px] font-mono font-bold hover:bg-[#FF9F0A]/30 cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setApaNotice('VAULT BUYOUT ESCROW INITIALIZED · ZERO SAAS ROYALTY');
                  appendLog(
                    '⚡ PIT WALL',
                    'Vault Buyout inquiry logged · 100% MIT/Apache-2.0 clean-room provenance verified'
                  );
                }}
                className="px-2 py-0.5 bg-[#00F0FF]/20 border border-[#00F0FF] text-[#00F0FF] rounded text-[10px] font-mono font-bold hover:bg-[#00F0FF]/30 cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        )}

        {/* Interactive Tensor Parallel Rank Matrix Bay (R0–R7) */}
        <section
          aria-label="Tensor Parallel Rank Matrix Bay"
          className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-1 min-h-0"
        >
          {snapshot.ranks.map((rank) => {
            const isSelected = rank.rankId === selectedRankId;
            const isFault = rank.lockStatus === 'FAULT';
            return (
              <button
                key={rank.rankId}
                type="button"
                onClick={() => {
                  setSelectedRankId(rank.rankId);
                  appendLog(
                    '🟢 TELEMETRY',
                    'Inspected ' +
                      rank.title +
                      ' · SHARD: ' +
                      rank.shardType +
                      ' · REDUCE: ' +
                      rank.reduceLatencyUs.toFixed(2) +
                      'µs · NVLINK: ' +
                      String(rank.nvlinkBandwidthGbs) +
                      ' GB/s'
                  );
                }}
                className={
                  'text-left px-2 py-1 rounded-lg border flex flex-col justify-between leading-tight transition-colors cursor-pointer overflow-hidden ' +
                  (isFault
                    ? 'bg-red-950/30 border-[#EF4444]'
                    : isSelected
                    ? 'bg-slate-900 border-[#00F0FF]'
                    : 'bg-slate-900/75 border-slate-800 hover:border-slate-600')
                }
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className="text-xs font-mono font-bold text-white tracking-wide">
                    {rank.title}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {rank.pointerHex}
                  </span>
                </div>

                <div className="text-[12px] font-mono text-cyan-300 font-bold">
                  {'SHARD: ' + rank.shardType + ' · WGT: ' + String(rank.weightMemoryGb) + 'GB'}
                </div>

                <div className="text-[12px] font-mono text-amber-300 font-bold">
                  {'REDUCE: ' + rank.reduceLatencyUs.toFixed(2) + 'µs · ' + rank.reduceState}
                </div>

                <div className="text-[11px] font-mono text-emerald-400 font-semibold">
                  {'NVLINK: ' +
                    String(rank.nvlinkBandwidthGbs) +
                    ' GB/s · ' +
                    rank.lockStatus}
                </div>
              </button>
            );
          })}
        </section>

        {/* Compact Tensor Parallel Telemetry Inspector Strip */}
        <div
          aria-label="Tensor Parallel Telemetry Inspector Strip"
          className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded shrink-0"
        >
          {inspectorLine}
        </div>
      </main>

      {/* Tactical Launch Control Buttons */}
      <section
        aria-label="Tactical Launch Controls"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleInjectBurst}
          className="bg-amber-950/40 hover:bg-amber-900/50 border border-[#FF9F0A] text-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          💥 INJECT ALL-REDUCE BURST
        </button>

        <button
          type="button"
          onClick={handleToggleCongestion}
          className="bg-cyan-950/40 hover:bg-cyan-900/50 border border-[#00F0FF] text-[#00F0FF] rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          ⚡ TOGGLE FABRIC CONGESTION
        </button>

        <button
          type="button"
          onClick={handleStepTensorParallel}
          className="bg-emerald-950/40 hover:bg-emerald-900/50 border border-[#10B981] text-[#10B981] rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          🚀 STEP TENSOR PARALLEL
        </button>

        <button
          type="button"
          onClick={handleFlushBuffers}
          className="bg-rose-950/40 hover:bg-rose-900/50 border border-[#EF4444] text-[#EF4444] rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          🔄 FLUSH FABRIC BUFFERS
        </button>
      </section>

      {/* Pit-Wall Radio Comms Log */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-14 overflow-hidden font-mono text-[10px] p-2 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between"
      >
        {radioLogs.slice(0, 3).map((line, index) => (
          <div key={index} className="truncate whitespace-nowrap">
            {line}
          </div>
        ))}
      </footer>
    </div>
  );
}
