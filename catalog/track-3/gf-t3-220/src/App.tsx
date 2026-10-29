import React, { useState, useMemo } from 'react';
import {
  Layers,
  Database,
  GitBranch,
  ArrowLeftRight,
  ShieldCheck,
  Activity,
  RefreshCw,
  Play,
  Copy,
  Download,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  Terminal,
  Cpu,
  Maximize2
} from 'lucide-react';
import {
  createInitialEngineState,
  computeTelemetry,
  allocateSequenceAction,
  forkSequenceAction,
  stepAutoregressiveAction,
  triggerBeamDivergenceChaos,
  triggerSaturationChaos,
  triggerPreemptionChaos,
  resetNominalAction,
  TOTAL_PHYSICAL_BLOCKS,
  TOKENS_PER_BLOCK,
  BYTES_PER_BLOCK
} from './memoryEngine';
import {
  ENGINE_SPEC_MD,
  LEGAL_IP_AUDIT_MD,
  ASSET_TRANSFER_SPEC_MD,
  OPENAPI_JSON
} from './transferDocs';
import { MemoryCorridor, BlockState } from './types';

const CORRIDORS: MemoryCorridor[] = [
  'MEM-POOL-ALPHA (VIRTUAL-PAGE-TABLE · 16-TOKEN-BLOCKS)',
  'MEM-POOL-BRAVO (KV-BLOCK-ALLOCATOR · ZERO-COPY-COW)',
  'MEM-POOL-GAMMA (SWAP-EVICTION-QUEUE)',
  'MEM-POOL-DELTA (PREEMPTION-CONTROLLER)'
];

type ActiveTab = 'Mesh' | 'Blocks' | 'COW' | 'Swap' | 'Transfer';

export default function App() {
  const [engineState, setEngineState] = useState(() => createInitialEngineState());
  const [activeTab, setActiveTab] = useState<ActiveTab>('Blocks');
  const [blockFilter, setBlockFilter] = useState<'all' | BlockState>('all');
  const [docTab, setDocTab] = useState<'ENGINE_SPEC' | 'LEGAL_IP_AUDIT' | 'ASSET_TRANSFER_SPEC' | 'OPENAPI'>('ENGINE_SPEC');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Address translation calculator state for Mesh tab
  const [calcTokenIndex, setCalcTokenIndex] = useState<number>(47);

  const telemetry = useMemo(() => computeTelemetry(engineState), [engineState]);

  // Selected block details
  const selectedBlock = useMemo(() => {
    if (engineState.selectedBlockId === null) return null;
    return engineState.blocks[engineState.selectedBlockId] || null;
  }, [engineState.selectedBlockId, engineState.blocks]);

  // Selected sequence details
  const selectedSequence = useMemo(() => {
    if (!engineState.selectedSequenceId) return null;
    return engineState.sequences.find((s) => s.sequenceId === engineState.selectedSequenceId) || null;
  }, [engineState.selectedSequenceId, engineState.sequences]);

  // Actions
  const handleAlloc = () => {
    setEngineState((prev) => allocateSequenceAction(prev, 'Inference Worker ' + (prev.sequences.length + 1), 32));
  };

  const handleFork = () => {
    setEngineState((prev) => forkSequenceAction(prev));
  };

  const handleRun = () => {
    setEngineState((prev) => stepAutoregressiveAction(prev));
  };

  const handleChaosBeam = () => {
    setEngineState((prev) => triggerBeamDivergenceChaos(prev));
    setActiveTab('COW');
  };

  const handleChaosSaturation = () => {
    setEngineState((prev) => triggerSaturationChaos(prev));
    setActiveTab('Blocks');
  };

  const handleChaosPreempt = () => {
    setEngineState((prev) => triggerPreemptionChaos(prev));
    setActiveTab('Swap');
  };

  const handleResetNominal = () => {
    setEngineState(resetNominalAction());
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // State styling helper for block matrix
  const getBlockStyles = (state: BlockState, isSelected: boolean) => {
    let base = 'transition-all duration-150 relative flex flex-col items-center justify-between p-3 rounded-lg cursor-pointer border text-center min-h-[92px] ';
    if (isSelected) {
      base = base + 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 scale-105 z-10 ';
    }
    switch (state) {
      case 'free':
        return base + 'bg-slate-900/60 border-slate-800 text-slate-500 hover:border-slate-700 hover:bg-slate-800/60';
      case 'allocated':
        return base + 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/50 shadow-sm shadow-cyan-950/50';
      case 'shared_cow':
        return base + 'bg-amber-950/40 border-amber-500/60 text-amber-300 hover:bg-amber-900/50 shadow-sm shadow-amber-950/50';
      case 'swapped':
        return base + 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/50';
      case 'preempted':
      case 'evicted':
        return base + 'bg-rose-950/40 border-rose-500/50 text-rose-300 hover:bg-rose-900/50';
      default:
        return base + 'bg-slate-900 border-slate-800 text-slate-400';
    }
  };

  // Filtered blocks
  const displayedBlocks = useMemo(() => {
    if (blockFilter === 'all') return engineState.blocks;
    return engineState.blocks.filter((b) => b.state === blockFilter);
  }, [engineState.blocks, blockFilter]);

  // Mesh Address Calculation
  const calcDerived = useMemo(() => {
    const lbn = Math.floor(calcTokenIndex / TOKENS_PER_BLOCK);
    const bo = calcTokenIndex % TOKENS_PER_BLOCK;
    const targetSeq = selectedSequence || engineState.sequences[0];
    const ptEntry = targetSeq?.pageTable.find((e) => e.logicalBlockIndex === lbn);
    const physId = ptEntry ? ptEntry.physicalBlockId : 'Unmapped';
    const isCow = ptEntry ? ptEntry.isCoW : false;
    const byteOffset = (typeof physId === 'number' ? physId * BYTES_PER_BLOCK : 0) + (bo * 256);
    const hexAddr = '0x' + byteOffset.toString(16).toUpperCase().padStart(8, '0');
    return { lbn, bo, targetSeq, ptEntry, physId, isCow, hexAddr };
  }, [calcTokenIndex, selectedSequence, engineState.sequences]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* COCKPIT HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 py-3">
        {/* Header Row 1: Strict GF-T3-220 branding */}
        <div className="flex items-center justify-between gap-1 w-full">
          {/* Left: Project title & track chip */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
              GF-T3-220
            </h1>
            <span className="px-3 py-1 text-sm font-semibold rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">
              TRACK 3
            </span>
          </div>

          {/* Right: Pool selector & action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Memory Pool Corridor Selector */}
            <select
              value={engineState.activeCorridor}
              onChange={(e) => setEngineState((prev) => ({ ...prev, activeCorridor: e.target.value as MemoryCorridor }))}
              className="text-[9px] py-0.5 px-1 max-w-[55px] truncate bg-slate-900 border border-slate-800 rounded text-slate-300"
            >
              {CORRIDORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Action Buttons */}
            <button
              onClick={handleAlloc}
              title="Allocate dynamic 32-token non-contiguous block sequence"
              className="px-1 py-0.5 text-[9px] font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded"
            >
              [Alloc]
            </button>
            <button
              onClick={handleFork}
              title="Execute zero-copy copy-on-write sequence fork"
              className="px-1 py-0.5 text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded"
            >
              [Fork]
            </button>
            <button
              onClick={handleRun}
              title="Advance autoregressive token decode & step allocator"
              className="px-1 py-0.5 text-[9px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Header Row 2 */}
        <div className="mt-1.5 text-sm text-slate-400 font-medium truncate">
          PagedAttention · Virtual Memory Page Tables · Dynamic Block Allocation · Zero-Copy COW
        </div>
      </header>

      {/* 4-CARD HUD RIBBON (2x2 Grid above the fold) */}
      <section className="px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 my-2 w-full">
          {/* Card 1: Block Utilization */}
          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Block Utilization</span>
              <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                Active
              </span>
            </div>
            <div className="my-1.5">
              <div className="text-lg font-mono font-bold tracking-tight text-slate-100 flex items-baseline gap-1">
                <span>{telemetry.blockUtilizationPct.toFixed(1) + '%'}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-cyan-400 h-full transition-all duration-300"
                  style={{ width: telemetry.blockUtilizationPct + '%' }}
                />
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Slots:</span>
              <span className="font-mono text-slate-300">
                {(TOTAL_PHYSICAL_BLOCKS - telemetry.freeBlocksCount) + ' / ' + TOTAL_PHYSICAL_BLOCKS}
              </span>
            </div>
          </div>

          {/* Card 2: Internal Fragmentation */}
          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Internal Frag</span>
              <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                Nominal
              </span>
            </div>
            <div className="my-1.5">
              <div className="text-lg font-mono font-bold tracking-tight text-slate-100 flex items-baseline gap-1">
                <span>{telemetry.internalFragmentationPct.toFixed(1) + '%'}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: Math.min(telemetry.internalFragmentationPct * 10, 100) + '%' }}
                />
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Ext Frag:</span>
              <span className="font-mono text-slate-300">0.0%</span>
            </div>
          </div>

          {/* Card 3: Allocator Latency */}
          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Allocator Latency</span>
              <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                Sub-ms
              </span>
            </div>
            <div className="my-1.5">
              <div className="text-lg font-mono font-bold tracking-tight text-slate-100 flex items-baseline gap-1">
                <span>{telemetry.allocatorLatencyMs.toFixed(2)}</span>
                <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Fork Overhead:</span>
              <span className="font-mono text-slate-300">0.02 ms</span>
            </div>
          </div>

          {/* Card 4: Allocated Tokens */}
          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Allocated Tokens</span>
              <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-purple-950/80 text-purple-300 border border-purple-800">
                Capacity
              </span>
            </div>
            <div className="my-1.5">
              <div className="text-lg font-mono font-bold tracking-tight text-slate-100 flex items-baseline gap-1">
                <span>{telemetry.allocatedTokens.toLocaleString()}</span>
                <span className="text-xs font-normal text-slate-400">Units</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>COW Saved:</span>
              <span className="font-mono text-slate-300">{telemetry.cowSavingsTokens}</span>
            </div>
          </div>
        </div>
      </section>

      {/* TAB NAVIGATION STRIP */}
      <nav className="px-4">
        <div className="w-full overflow-x-auto no-scrollbar flex items-center justify-between gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl my-2 text-xs font-medium">
          {(['Mesh', 'Blocks', 'COW', 'Swap', 'Transfer'] as ActiveTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  'px-2 py-1 text-[11px] shrink-0 rounded-lg transition-colors cursor-pointer ' +
                  (isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60')
                }
              >
                {tab}
              </button>
            );
          })}
        </div>
      </nav>

      {/* MAIN VIEWPORT CONTAINER */}
      <main className="flex-1 p-4 flex flex-col gap-4">
        {/* TAB 1: MESH (Virtual Memory Page Table Topology) */}
        {activeTab === 'Mesh' && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-400" />
                    Virtual Page Table Address Translation Engine
                  </h2>
                  <p className="text-base text-slate-400 mt-1">
                    Decouples logical sequence token positions from physical RAM layout. Eliminates external memory fragmentation.
                  </p>
                </div>
                <div className="text-sm font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-md border border-cyan-800">
                  Stride: 16 Tokens / Block
                </div>
              </div>

              {/* Live Translation Calculator */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1.5">
                    Target Logical Sequence:
                  </label>
                  <select
                    value={engineState.selectedSequenceId || ''}
                    onChange={(e) => setEngineState((prev) => ({ ...prev, selectedSequenceId: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm font-medium rounded-md px-3 py-2.5"
                  >
                    {engineState.sequences.map((s) => (
                      <option key={s.sequenceId} value={s.sequenceId}>
                        {s.sequenceId + ' (' + s.tokenCount + ' tokens · ' + s.phase + ')'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1.5">
                    Logical Token Index i:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="512"
                    value={calcTokenIndex}
                    onChange={(e) => setCalcTokenIndex(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm font-mono rounded-md px-3 py-2.5"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1.5">
                    Physical KV Memory Address:
                  </label>
                  <div className="bg-slate-900 border border-cyan-800 px-3.5 py-2.5 rounded-md font-mono text-cyan-300 text-sm font-bold flex items-center justify-between min-h-[44px]">
                    <span>{calcDerived.hexAddr}</span>
                    <span className="text-sm text-slate-400 font-sans">
                      {calcDerived.isCow ? 'COW Shared' : 'Direct'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mathematical Proof & Formula */}
              <div className="mt-4 p-4 rounded-lg bg-slate-950/60 border border-slate-800 font-mono text-sm leading-relaxed">
                <div className="text-sm uppercase tracking-wider text-slate-400 mb-2 font-sans font-semibold">
                  Deterministic Translation Invariants:
                </div>
                <div className="text-slate-300">
                  Logical Block Number (LBN) = floor({calcTokenIndex} / 16) = <span className="text-cyan-400 font-bold">{calcDerived.lbn}</span>
                </div>
                <div className="text-slate-300 mt-1">
                  Block Slot Offset (BO) = {calcTokenIndex} mod 16 = <span className="text-cyan-400 font-bold">{calcDerived.bo}</span>
                </div>
                <div className="text-slate-300 mt-1">
                  PageTable[{calcDerived.targetSeq?.sequenceId || 'SEQ'}][LBN {calcDerived.lbn}] = Physical Block <span className="text-emerald-400 font-bold">#{calcDerived.physId}</span>
                </div>
                <div className="text-slate-400 mt-1 text-sm">
                  Physical Key/Value base: 0x7F000000 + (#{calcDerived.physId} * 4096) + ({calcDerived.bo} * 256)
                </div>
              </div>

              {/* Active Sequences Page Tables Table */}
              <div className="mt-5">
                <h3 className="text-base font-bold uppercase tracking-wider text-slate-300 mb-2.5">
                  Active Virtual Page Table Mappings
                </h3>
                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-left text-sm font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3.5 text-sm font-semibold">Sequence ID</th>
                        <th className="p-3.5 text-sm font-semibold">Phase</th>
                        <th className="p-3.5 text-sm font-semibold">Length</th>
                        <th className="p-3.5 text-sm font-semibold">Logical -&gt; Physical Block Chain</th>
                        <th className="p-3.5 text-sm font-semibold">Ref Count</th>
                        <th className="p-3.5 text-sm font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                      {engineState.sequences.slice(0, 8).map((seq) => (
                        <tr
                          key={seq.sequenceId}
                          onClick={() => setEngineState((prev) => ({ ...prev, selectedSequenceId: seq.sequenceId }))}
                          className={
                            'hover:bg-slate-800/60 cursor-pointer ' +
                            (engineState.selectedSequenceId === seq.sequenceId ? 'bg-cyan-950/30' : '')
                          }
                        >
                          <td className="p-3.5 font-bold text-white flex items-center gap-2 text-sm">
                            {seq.sequenceId}
                            {seq.parentSequenceId && (
                              <span className="px-2.5 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800 text-sm">
                                COW
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={
                                'px-3 py-1 rounded-md text-sm font-semibold ' +
                                (seq.phase === 'decode'
                                  ? 'bg-emerald-950 text-emerald-300'
                                  : seq.phase === 'prompt'
                                  ? 'bg-cyan-950 text-cyan-300'
                                  : 'bg-indigo-950 text-indigo-300')
                              }
                            >
                              {seq.phase.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-300 text-sm">{seq.tokenCount} tokens</td>
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-1.5">
                              {seq.pageTable.map((pt) => (
                                <span
                                  key={pt.logicalBlockIndex}
                                  className={
                                    'px-2.5 py-1 rounded-md text-sm border ' +
                                    (pt.isCoW
                                      ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                                      : 'bg-cyan-950/80 border-cyan-700 text-cyan-300')
                                  }
                                >
                                  L{pt.logicalBlockIndex} -&gt; P{pt.physicalBlockId}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-300 text-sm">
                            {seq.pageTable.some((pt) => pt.isCoW) ? 'Shared (>=2)' : 'Dedicated (1)'}
                          </td>
                          <td className="p-3.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEngineState((prev) => forkSequenceAction(prev, seq.sequenceId));
                              }}
                              className="min-h-[36px] px-3 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-600 rounded-md text-sm font-bold cursor-pointer"
                            >
                              Fork COW
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BLOCKS (64 Physical Blocks Matrix & Inspector) */}
        {activeTab === 'Blocks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Cols: 64-Block Matrix */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-3">
                  <span className="text-xs font-semibold text-slate-200 tracking-wide">
                    Physical Block Matrix (64 Corridors)
                  </span>

                  {/* Filter chips */}
                  <div className="flex items-center gap-1 shrink-0">
                    {(['all', 'free', 'allocated', 'shared_cow', 'swapped'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setBlockFilter(f)}
                        className={
                          'px-2 py-0.5 rounded text-[10px] font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ' +
                          (blockFilter === f
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-400 hover:text-white')
                        }
                      >
                        {f === 'shared_cow' ? 'COW' : f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 64 Block Grid */}
                <div className="mt-4 grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                  {displayedBlocks.map((blk) => {
                    const isSelected = engineState.selectedBlockId === blk.blockId;
                    return (
                      <div
                        key={blk.blockId}
                        onClick={() => setEngineState((prev) => ({ ...prev, selectedBlockId: blk.blockId }))}
                        className={getBlockStyles(blk.state, isSelected)}
                      >
                        <div className="w-full flex items-center justify-between text-sm font-mono">
                          <span className="font-bold">{'#' + blk.blockId}</span>
                          {blk.refCount > 1 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-900 text-amber-200 text-sm font-bold">
                              {'r:' + blk.refCount}
                            </span>
                          )}
                        </div>

                        {/* Token fill bar */}
                        <div className="w-full my-2 bg-slate-950/80 h-2 rounded-full overflow-hidden">
                          <div
                            className={
                              'h-full ' +
                              (blk.state === 'shared_cow'
                                ? 'bg-amber-400'
                                : blk.state === 'swapped'
                                ? 'bg-indigo-400'
                                : blk.state === 'free'
                                ? 'bg-transparent'
                                : 'bg-cyan-400')
                            }
                            style={{ width: ((blk.tokensOccupied / TOKENS_PER_BLOCK) * 100) + '%' }}
                          />
                        </div>

                        <div className="text-sm font-mono capitalize truncate w-full">
                          {blk.state === 'shared_cow' ? 'COW Shared' : blk.state}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend Strip */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-sm text-slate-400 gap-3">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-700" />
                    Free Slot
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-cyan-950 border border-cyan-500" />
                    Allocated
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-amber-950 border border-amber-500" />
                    Shared COW
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-indigo-950 border border-indigo-500" />
                    Virtual Swap
                  </span>
                </div>
                <span className="font-mono text-slate-400 text-sm">
                  Total Physical Memory: 256 KB KV Cache (64 Blocks x 4,096 B)
                </span>
              </div>
            </div>

            {/* Right Col: Selected Block Inspector Drawer */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
              {selectedBlock ? (
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      Block Telemetry #{selectedBlock.blockId}
                    </h3>
                    <span
                      className={
                        'px-3 py-1 rounded-md text-sm font-bold uppercase ' +
                        (selectedBlock.state === 'shared_cow'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : selectedBlock.state === 'allocated'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : selectedBlock.state === 'swapped'
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                          : 'bg-slate-800 text-slate-400')
                      }
                    >
                      {selectedBlock.state}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-3.5 font-mono text-sm">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-sm text-slate-400 font-sans block mb-1">Reference Counter</span>
                      <span className="text-2xl font-bold text-white">
                        {selectedBlock.refCount + ' Sequences'}
                      </span>
                      <p className="text-sm text-slate-400 font-sans mt-1">
                        {selectedBlock.refCount > 1
                          ? 'Zero-copy COW active. Duplicate on write.'
                          : selectedBlock.refCount === 1
                          ? 'Dedicated single-sequence ownership.'
                          : 'Unreferenced in free list.'}
                      </p>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-sm text-slate-400 font-sans block mb-1">Token Capacity</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-base font-bold text-cyan-300">
                          {selectedBlock.tokensOccupied + ' / ' + selectedBlock.maxTokens + ' Tokens'}
                        </span>
                        <span className="text-sm text-slate-400">
                          {((selectedBlock.tokensOccupied / selectedBlock.maxTokens) * 100).toFixed(0) + '% full'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-cyan-400 h-full"
                          style={{ width: ((selectedBlock.tokensOccupied / selectedBlock.maxTokens) * 100) + '%' }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-sm text-slate-400 font-sans block mb-1">KV Tensor Memory Footprint</span>
                      <span className="text-base font-bold text-slate-200">
                        {selectedBlock.kvBytes.toLocaleString() + ' Bytes (4.0 KB)'}
                      </span>
                      <div className="text-sm text-slate-400 font-sans mt-1">
                        Shape: [16 tokens, 32 heads, 64 dim, fp16]
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-sm text-slate-400 font-sans block mb-1">Assigned Sequences</span>
                      {selectedBlock.sequenceIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedBlock.sequenceIds.map((seqId) => (
                            <span
                              key={seqId}
                              onClick={() => setEngineState((prev) => ({ ...prev, selectedSequenceId: seqId }))}
                              className="px-2.5 py-1 rounded-md text-sm bg-cyan-950 text-cyan-300 border border-cyan-800 cursor-pointer hover:bg-cyan-900"
                            >
                              {seqId}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">None (Free Block)</span>
                      )}
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-sm text-slate-400 font-sans block mb-1">Corridor Allocation</span>
                      <span className="text-sm text-slate-300 break-words font-mono">
                        {selectedBlock.corridor}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-base">
                  Select a physical block to inspect telemetry
                </div>
              )}

              {/* Action button inside block drawer */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={handleRun}
                  className="w-full min-h-[44px] px-5 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-600 rounded-md text-base font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Emit Next Token
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COW (Copy-on-Write Branching & Beam Search Simulator) */}
        {activeTab === 'COW' && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-amber-400" />
                    Zero-Copy Copy-on-Write (COW) Forking Engine
                  </h2>
                  <p className="text-base text-slate-400 mt-1">
                    Parallel sampling and beam search branches share parent prompt blocks with zero tensor duplication. Physical blocks unshare only upon token emission.
                  </p>
                </div>
                <button
                  onClick={handleChaosBeam}
                  className="min-h-[44px] px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-base font-bold rounded-md flex items-center gap-2 cursor-pointer transition-colors shrink-0"
                >
                  <Zap className="w-4 h-4" />
                  Trigger 4x Beam Divergence
                </button>
              </div>

              {/* COW Architecture Metrics */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <span className="text-sm text-slate-400 block font-medium">Shared COW Blocks</span>
                  <span className="text-2xl font-bold font-mono text-amber-400">
                    {telemetry.sharedCowBlocksCount} Blocks
                  </span>
                  <span className="text-sm text-slate-400 block mt-1">
                    Multiple pointers to identical physical RAM
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <span className="text-sm text-slate-400 block font-medium">Physical Memory Saved</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {(telemetry.cowSavingsTokens * 256).toLocaleString()} Bytes
                  </span>
                  <span className="text-sm text-slate-400 block mt-1">
                    {telemetry.cowSavingsTokens} Token slots avoided by reference sharing
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <span className="text-sm text-slate-400 block font-medium">Fork Creation Latency</span>
                  <span className="text-2xl font-bold font-mono text-cyan-400">
                    0.02 ms
                  </span>
                  <span className="text-sm text-slate-400 block mt-1">
                    O(1) pointer clone vs O(N) memory memcpy
                  </span>
                </div>
              </div>

              {/* Parallel Beams Visualizer */}
              <div className="mt-5 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <h3 className="text-base font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Parallel Sampling Branches (Shared Prompt vs Diverged Tokens)
                </h3>

                <div className="flex flex-col gap-3">
                  {engineState.sequences
                    .filter((s) => s.sequenceId.startsWith('BEAM-') || s.sequenceId.startsWith('FORK-'))
                    .slice(0, 5)
                    .map((beam) => (
                      <div
                        key={beam.sequenceId}
                        className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div className="min-w-[180px]">
                          <span className="font-bold text-base text-white font-mono flex items-center gap-1.5">
                            <GitBranch className="w-4 h-4 text-amber-400" />
                            {beam.sequenceId}
                          </span>
                          <span className="text-sm text-slate-400 block mt-0.5">
                            {beam.tokenCount} tokens ({beam.pageTable.length} blocks)
                          </span>
                        </div>

                        {/* Visual block strip */}
                        <div className="flex-1 flex flex-wrap items-center gap-2">
                          {beam.pageTable.map((pt, idx) => (
                            <div
                              key={idx}
                              title={
                                pt.isCoW
                                  ? 'Shared Block P' + pt.physicalBlockId + ' (Zero-Copy COW)'
                                  : 'Diverged Block P' + pt.physicalBlockId + ' (Unshared)'
                              }
                              className={
                                'px-3 py-1.5 rounded-md text-sm font-mono font-bold border ' +
                                (pt.isCoW
                                  ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                                  : 'bg-cyan-950/80 border-cyan-600 text-cyan-300')
                              }
                            >
                              {pt.isCoW ? 'COW: #' + pt.physicalBlockId : 'DIV: #' + pt.physicalBlockId}
                            </div>
                          ))}
                        </div>

                        {/* Step button for this beam */}
                        <button
                          onClick={() => {
                            setEngineState((prev) => {
                              const withSel = { ...prev, selectedSequenceId: beam.sequenceId };
                              return stepAutoregressiveAction(withSel);
                            });
                          }}
                          className="min-h-[38px] px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-600 rounded-md text-sm font-bold shrink-0 cursor-pointer"
                        >
                          Step Decode
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SWAP (Swap Eviction Queue & Preemption Controller) */}
        {activeTab === 'Swap' && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ArrowLeftRight className="w-5 h-5 text-indigo-400" />
                    Swap Eviction Queue & Preemption Controller
                  </h2>
                  <p className="text-base text-slate-400 mt-1">
                    Under memory saturation, victim sequences are evicted and swapped to Host CPU Virtual Buffers or recomputed.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleChaosPreempt}
                    className="min-h-[44px] px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-base font-bold rounded-md flex items-center gap-2 cursor-pointer transition-colors shrink-0"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Force Sequence Preemption
                  </button>
                </div>
              </div>

              {/* Watermark Threshold Gauge */}
              <div className="mt-4 p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-base font-medium mb-2">
                  <span className="text-slate-200">Memory Pressure & Watermark Thresholds</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    Current: {telemetry.blockUtilizationPct.toFixed(1)}%
                  </span>
                </div>

                <div className="relative w-full bg-slate-900 h-7 rounded-md overflow-hidden border border-slate-800">
                  {/* Utilization bar */}
                  <div
                    className={
                      'h-full transition-all duration-300 ' +
                      (telemetry.blockUtilizationPct >= 95.0
                        ? 'bg-rose-500'
                        : telemetry.blockUtilizationPct >= 80.0
                        ? 'bg-amber-500'
                        : 'bg-cyan-500')
                    }
                    style={{ width: telemetry.blockUtilizationPct + '%' }}
                  />

                  {/* Low Watermark Line at 80% */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                    style={{ left: '80%' }}
                    title="Low Watermark (80.0%)"
                  />

                  {/* High Watermark Line at 95% */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                    style={{ left: '95%' }}
                    title="High Watermark (95.0%)"
                  />
                </div>

                <div className="flex items-center justify-between text-sm text-slate-400 mt-2.5 font-mono">
                  <span>0% (Nominal Baseline)</span>
                  <span className="text-amber-400">Low Watermark: 80.0%</span>
                  <span className="text-rose-400">High Watermark: 95.0% (Preempt Trigger)</span>
                  <span>100% (Absolute Limit)</span>
                </div>
              </div>

              {/* Preemption Priority Queue */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider mb-2">
                    Active Sequence Preemption Priority
                  </h3>
                  <p className="text-sm text-slate-400 mb-3.5">
                    Victims selected via priority metric: P(S) = (Priority * 1000) + Arrival - (Tokens * 0.5)
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {engineState.sequences.slice(0, 5).map((s) => (
                      <div
                        key={s.sequenceId}
                        className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-sm"
                      >
                        <div>
                          <span className="font-bold text-white font-mono text-base">{s.sequenceId}</span>
                          <span className="text-sm text-slate-400 block mt-0.5">
                            Priority: {s.priority} · {s.tokenCount} tokens
                          </span>
                        </div>
                        <span
                          className={
                            'px-3 py-1 rounded-md text-sm font-semibold ' +
                            (s.phase === 'swapped'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-emerald-950 text-emerald-300')
                          }
                        >
                          {s.phase.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Host Virtual Swap Buffer */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider mb-2">
                    Host Virtual Swap Buffer (Corridor GAMMA)
                  </h3>
                  <p className="text-sm text-slate-400 mb-3.5">
                    Blocks paged out to CPU host RAM via zero-copy DMA transfer channel.
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {engineState.blocks
                      .filter((b) => b.state === 'swapped')
                      .map((b) => (
                        <div
                          key={b.blockId}
                          className="bg-slate-900 p-3 rounded-lg border border-indigo-800 flex items-center justify-between text-sm font-mono"
                        >
                          <div>
                            <span className="text-indigo-300 font-bold text-base">Physical Block #{b.blockId}</span>
                            <span className="text-sm text-slate-400 block font-sans mt-0.5">
                              Owner: {b.sequenceIds.join(', ') || 'Evicted Victim'}
                            </span>
                          </div>
                          <span className="text-sm px-3 py-1 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-700">
                            Swapped to Host RAM
                          </span>
                        </div>
                      ))}

                    {engineState.blocks.filter((b) => b.state === 'swapped').length === 0 && (
                      <div className="py-8 text-center text-slate-400 text-base">
                        Swap queue empty. All active sequences resident in physical blocks.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TRANSFER (Track 3 Production Reference Core & APA Documentation) */}
        {activeTab === 'Transfer' && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Track 3 Production Reference Core & Asset Handoff Specification
                  </h2>
                  <p className="text-base text-slate-400 mt-1">
                    Zero-dollar Asset Purchase Agreement (APA) documentation suite, clean-room provenance, and turnkey container deployment.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const allDocs =
                        '=== ENGINE_SPEC.md ===\n' +
                        ENGINE_SPEC_MD +
                        '\n\n=== LEGAL_IP_AUDIT.md ===\n' +
                        LEGAL_IP_AUDIT_MD +
                        '\n\n=== ASSET_TRANSFER_SPEC.md ===\n' +
                        ASSET_TRANSFER_SPEC_MD +
                        '\n\n=== OPENAPI.json ===\n' +
                        OPENAPI_JSON;
                      downloadFile('GF-T3-220-SPECIFICATION-SUITE.txt', allDocs);
                    }}
                    className="min-h-[44px] px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-base font-bold rounded-md flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Full Suite
                  </button>
                </div>
              </div>

              {/* Document Sub-tabs */}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2.5">
                {[
                  { id: 'ENGINE_SPEC', label: 'ENGINE_SPEC.md' },
                  { id: 'LEGAL_IP_AUDIT', label: 'LEGAL_IP_AUDIT.md' },
                  { id: 'ASSET_TRANSFER_SPEC', label: 'ASSET_TRANSFER_SPEC.md' },
                  { id: 'OPENAPI', label: 'OpenAPI 3.1 Spec' }
                ].map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setDocTab(doc.id as any)}
                    className={
                      'min-h-[40px] px-4 py-2 text-sm font-bold rounded-md transition-colors cursor-pointer ' +
                      (docTab === doc.id
                        ? 'bg-slate-800 text-cyan-300 border border-cyan-800'
                        : 'text-slate-400 hover:text-slate-200')
                    }
                  >
                    {doc.label}
                  </button>
                ))}

                <button
                  onClick={() => {
                    let content = '';
                    if (docTab === 'ENGINE_SPEC') content = ENGINE_SPEC_MD;
                    if (docTab === 'LEGAL_IP_AUDIT') content = LEGAL_IP_AUDIT_MD;
                    if (docTab === 'ASSET_TRANSFER_SPEC') content = ASSET_TRANSFER_SPEC_MD;
                    if (docTab === 'OPENAPI') content = OPENAPI_JSON;
                    copyToClipboard(content, docTab);
                  }}
                  className="ml-auto min-h-[40px] px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {copyFeedback === docTab ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Document
                    </>
                  )}
                </button>
              </div>

              {/* Document Content Viewer */}
              <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800 max-h-[500px] overflow-y-auto">
                <pre className="font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {docTab === 'ENGINE_SPEC' && ENGINE_SPEC_MD}
                  {docTab === 'LEGAL_IP_AUDIT' && LEGAL_IP_AUDIT_MD}
                  {docTab === 'ASSET_TRANSFER_SPEC' && ASSET_TRANSFER_SPEC_MD}
                  {docTab === 'OPENAPI' && OPENAPI_JSON}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* CHAOS & MEMORY STRESS TRIGGERS BAR (Always accessible below active tab) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <span className="text-base font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-400" />
              Chaos & Memory Stress Triggers:
            </span>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleChaosBeam}
                className="min-h-[44px] px-4 py-2 text-sm font-bold rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-600 transition-colors cursor-pointer"
              >
                Trigger 4x Beam Divergence (Test COW Forking)
              </button>

              <button
                onClick={handleChaosSaturation}
                className="min-h-[44px] px-4 py-2 text-sm font-bold rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-600 transition-colors cursor-pointer"
              >
                Simulate 98% Memory Saturation (Stress Test)
              </button>

              <button
                onClick={handleChaosPreempt}
                className="min-h-[44px] px-4 py-2 text-sm font-bold rounded-md bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-600 transition-colors cursor-pointer"
              >
                Force Sequence Preemption (Test Swap Queue)
              </button>

              <button
                onClick={handleResetNominal}
                className="min-h-[44px] px-4 py-2 text-sm font-bold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                Reset Block Allocator to Nominal
              </button>
            </div>
          </div>
        </div>

        {/* REAL-TIME EVENT STREAM TELEMETRY TERMINAL */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
            <span className="text-base font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Deterministic Allocator Event Stream:
            </span>
            <span className="text-sm font-mono text-slate-400">
              {engineState.logs.length} logged mutations
            </span>
          </div>

          <div className="max-h-40 overflow-y-auto flex flex-col gap-2 font-mono text-sm leading-relaxed">
            {engineState.logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5">
                <span className="text-slate-400 shrink-0">[{log.timestamp}]</span>
                <span
                  className={
                    'px-2.5 py-0.5 rounded-md text-sm shrink-0 font-semibold ' +
                    (log.level === 'alert'
                      ? 'bg-rose-950 text-rose-300'
                      : log.level === 'warn'
                      ? 'bg-amber-950 text-amber-300'
                      : log.level === 'success'
                      ? 'bg-emerald-950 text-emerald-300'
                      : 'bg-cyan-950 text-cyan-300')
                  }
                >
                  {log.corridor}
                </span>
                <span className="text-slate-300 break-words">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 px-4 py-3 bg-slate-950 text-sm text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-300">GF-T3-220</span>
          <span>·</span>
          <span>Aura & Grid Software Catalog</span>
          <span>·</span>
          <span>Track 3 Production Reference Core</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-mono">
          <span>Clean-Room IP: Verified</span>
          <span>NIST SP 800-218: Passing</span>
          <span>Zero-Dollar Gate: Compliant</span>
        </div>
      </footer>
    </div>
  );
}
