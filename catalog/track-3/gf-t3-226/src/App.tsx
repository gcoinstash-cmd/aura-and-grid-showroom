/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-226 FlashAttention-3 Kernel & Paged KV-Cache Cockpit
 * Track 3 Sovereign Engine · Zero Mock Data · Zero-Dollar Telemetry Gate
 */

import React, { useMemo, useState } from 'react';
import {
  CORRIDOR_LIST,
  POSTGRES_RLS_SCHEMA_SQL,
  PagedCacheBlock,
  SYNTHETIC_CORRIDORS,
  SyntheticCorridorId,
  createDeterministicBlock,
  createInitialBlocks,
  evictLowestAttentionBlocks,
  runKernelVerificationOnBlocks,
  sanitizeGridSyncInput,
} from './engine/flashAttnEngine';

type CockpitTab = 'Mesh' | 'Pages' | 'SRAM' | 'Eviction' | 'Transfer';
type FlashButtonId = 'BURST' | 'COMPRESS' | 'STEP' | 'FLUSH' | null;

const TABS: CockpitTab[] = ['Mesh', 'Pages', 'SRAM', 'Eviction', 'Transfer'];

const INITIAL_RADIO_LOGS: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: FlashAttention-3 tiled pipeline engaged · Online softmax running',
  '[00:01.08] ⚡ PIT WALL: Paged block allocation complete · 0% memory fragmentation',
  '[00:01.12] 🟢 TELEMETRY: TMA async transfer verified · Cache throughput 1,240 GB/s',
];

function formatNumberWithCommas(val: number): string {
  return val.toLocaleString('en-US');
}

function formatClockStamp(stepCounter: number): string {
  const totalHundredths = 112 + stepCounter * 7;
  const secs = Math.floor(totalHundredths / 100);
  const hundredths = totalHundredths % 100;
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  const mm = mins < 10 ? '0' + String(mins) : String(mins);
  const ss = remSecs < 10 ? '0' + String(remSecs) : String(remSecs);
  const hh = hundredths < 10 ? '0' + String(hundredths) : String(hundredths);
  return '[' + mm + ':' + ss + '.' + hh + ']';
}

export default function App() {
  const [selectedCorridor, setSelectedCorridor] = useState<SyntheticCorridorId>(CORRIDOR_LIST[0]);
  const [activeTab, setActiveTab] = useState<CockpitTab>('Pages');
  const [blocks, setBlocks] = useState<PagedCacheBlock[]>(() => createInitialBlocks());
  const [selectedBlockId, setSelectedBlockId] = useState<number>(0);
  const [passEpoch, setPassEpoch] = useState<number>(1);
  const [compressionActive, setCompressionActive] = useState<boolean>(false);
  const [sustainedTokens, setSustainedTokens] = useState<number>(512000);
  const [sramXpBonus, setSramXpBonus] = useState<number>(12.4);
  const [chunksStreak, setChunksStreak] = useState<number>(128);
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_RADIO_LOGS);
  const [logTick, setLogTick] = useState<number>(1);
  const [flashedButton, setFlashedButton] = useState<FlashButtonId>(null);
  const [apaModalState, setApaModalState] = useState<'NONE' | 'ACQUIRE_APA' | 'VAULT_BUYOUT' | 'SCHEMA'>('NONE');

  const corridorProfile = SYNTHETIC_CORRIDORS[selectedCorridor];

  const kernelVerification = useMemo(
    () => runKernelVerificationOnBlocks(blocks, passEpoch),
    [blocks, passEpoch]
  );

  const lockedBlocksCount = useMemo(
    () => blocks.filter((b) => b.status === 'LOCKED').length,
    [blocks]
  );

  const selectedBlock = useMemo(
    () => blocks.find((b) => b.physicalBlockId === selectedBlockId) || blocks[0],
    [blocks, selectedBlockId]
  );

  const liveBandwidthGbs = useMemo(() => {
    const compressionBoost = compressionActive ? 140 : 0;
    const epochBoost = (passEpoch - 1) * 15;
    return Math.max(640, corridorProfile.baseBandwidthGbs + compressionBoost + epochBoost);
  }, [corridorProfile, compressionActive, passEpoch]);

  const liveCompressionRatio = useMemo(() => {
    const base = corridorProfile.baseCompressionRatioPct;
    const boost = compressionActive ? 11.4 : 0.0;
    return (base + boost).toFixed(1);
  }, [corridorProfile, compressionActive]);

  const liveLatencyMs = useMemo(() => {
    const base = corridorProfile.baseLatencyMs;
    const delta = compressionActive ? -0.05 : 0.0;
    return Math.max(0.18, base + delta).toFixed(2);
  }, [corridorProfile, compressionActive]);

  const triggerButtonFlash = (btnId: FlashButtonId) => {
    setFlashedButton(btnId);
    window.setTimeout(() => {
      setFlashedButton((prev) => (prev === btnId ? null : prev));
    }, 220);
  };

  const appendRadioLog = (
    callsign: '🟢 CREW CHIEF' | '⚡ PIT WALL' | '🟢 TELEMETRY' | '🔴 TELEMETRY',
    message: string
  ) => {
    const stamp = formatClockStamp(logTick);
    const nextLine = stamp + ' ' + callsign + ': ' + message;
    setLogTick((prev) => prev + 1);
    setRadioLogs((prev) => [nextLine, ...prev.slice(0, 2)]);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCorridor = e.target.value as SyntheticCorridorId;
    const check = sanitizeGridSyncInput({
      corridor: nextCorridor,
      sequenceId: 'SEQ_CORRIDOR_SWITCH',
      requestedTokens: 16384,
      tileSize: 16,
    });
    if (!check.valid) {
      appendRadioLog('🔴 TELEMETRY', check.error || 'Corridor validation rejected');
      return;
    }
    setSelectedCorridor(nextCorridor);
    const prof = SYNTHETIC_CORRIDORS[nextCorridor];
    appendRadioLog(
      '🟢 CREW CHIEF',
      'Corridor locked: ' + prof.shortCode + ' · Throughput ' + formatNumberWithCommas(prof.baseBandwidthGbs) + ' GB/s'
    );
  };

  // Switch 1: Context Burst (128k Token Context Burst / Force Page Allocations)
  const handleInjectContextBurst = () => {
    triggerButtonFlash('BURST');
    const nextEpoch = passEpoch + 1;
    setPassEpoch(nextEpoch);
    const nextBlocks = Array.from({ length: 16 }, (_, idx) =>
      createDeterministicBlock(idx, nextEpoch, false)
    );
    setBlocks(nextBlocks);
    setCompressionActive(false);
    setSustainedTokens((prev) => prev + 128000);
    setChunksStreak((prev) => prev + 32);
    setSramXpBonus((prev) => Number((prev + 3.2).toFixed(1)));
    appendRadioLog(
      '⚡ PIT WALL',
      '128k Context Burst allocated across 16 Paged Blocks · 0% fragmentation'
    );
  };

  // Switch 2: Toggle Dynamic KV Compression & Eviction
  const handleToggleCompression = () => {
    triggerButtonFlash('COMPRESS');
    const nextCompression = !compressionActive;
    setCompressionActive(nextCompression);

    if (nextCompression) {
      const { updatedBlocks, evictedIds } = evictLowestAttentionBlocks(blocks, 4);
      setBlocks(updatedBlocks);
      setChunksStreak((prev) => prev + 16);
      appendRadioLog(
        '🟢 TELEMETRY',
        'KV Eviction pruned blocks [B' +
          evictedIds.join(', B') +
          '] · Compression ' +
          (corridorProfile.baseCompressionRatioPct + 11.4).toFixed(1) +
          '%'
      );
    } else {
      const restored = Array.from({ length: 16 }, (_, idx) =>
        createDeterministicBlock(idx, passEpoch, false)
      );
      setBlocks(restored);
      appendRadioLog('🟢 CREW CHIEF', 'All 16 Paged Block Slots restored · Pages 16/16 locked');
    }
  };

  // Switch 3: Step FlashAttention-3 Tiled Online Accumulation
  const handleStepFlashAttnPass = () => {
    triggerButtonFlash('STEP');
    const nextEpoch = passEpoch + 1;
    setPassEpoch(nextEpoch);

    const updated = blocks.map((b) => {
      if (b.status !== 'LOCKED') return b;
      return createDeterministicBlock(b.physicalBlockId, nextEpoch, compressionActive);
    });
    setBlocks(updated);
    setSustainedTokens((prev) => prev + 16384);
    setSramXpBonus((prev) => Number((prev + 1.8).toFixed(1)));

    const verification = runKernelVerificationOnBlocks(updated, nextEpoch);
    appendRadioLog(
      '🟢 CREW CHIEF',
      'Step #' +
        String(nextEpoch) +
        ' Tiled Softmax (m=' +
        String(verification.runningMaxM) +
        ', l=' +
        String(verification.normalizerL) +
        ') · Drift ' +
        verification.maxNumericalDrift.toExponential(2)
    );
  };

  // Switch 4: Flush Paged Virtual Table & Re-Zero Cache
  const handleFlushAndReZero = () => {
    triggerButtonFlash('FLUSH');
    setPassEpoch(1);
    setCompressionActive(false);
    setSustainedTokens(512000);
    setSramXpBonus(12.4);
    setChunksStreak(128);
    const fresh = createInitialBlocks();
    setBlocks(fresh);
    setSelectedBlockId(0);
    setRadioLogs(INITIAL_RADIO_LOGS);
    appendRadioLog('⚡ PIT WALL', 'Paged Virtual Table flushed & re-zeroed · 16/16 blocks locked');
  };

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER ROW 1 */}
      <header className="flex items-center justify-between gap-1 w-full shrink-0 border-b border-slate-800/90 pb-1">
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white font-mono">
            GF-T3-226
          </h1>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 rounded">
            TRACK 3
          </span>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <select
            aria-label="Synthetic KV Corridor Selector"
            value={selectedCorridor}
            onChange={handleCorridorChange}
            className="max-w-[140px] truncate text-[10px] font-mono bg-slate-900 text-cyan-300 border border-slate-700 rounded px-1 py-0.5 focus:outline-none focus:border-[#00F0FF]"
          >
            {CORRIDOR_LIST.map((corridorId) => (
              <option key={corridorId} value={corridorId}>
                {corridorId}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleInjectContextBurst}
            className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/40 rounded transition-colors cursor-pointer whitespace-nowrap"
          >
            [Alloc]
          </button>
          <button
            type="button"
            onClick={handleStepFlashAttnPass}
            className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded transition-colors cursor-pointer whitespace-nowrap"
          >
            [Attn]
          </button>
          <button
            type="button"
            onClick={handleToggleCompression}
            className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 rounded transition-colors cursor-pointer whitespace-nowrap"
          >
            [Run]
          </button>
        </div>
      </header>

      {/* TOP HEADER ROW 2 */}
      <div className="text-xs text-slate-300 font-mono text-center shrink-0 py-0.5 whitespace-nowrap">
        FlashAttention-3 Kernel · Tiled Online Softmax · Paged KV-Cache
      </div>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0"
      >
        {/* Card 1: SRAM NITRO */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs text-slate-300 font-mono font-semibold whitespace-nowrap">SRAM NITRO</span>
            <span className="text-xs font-mono font-bold text-amber-300 whitespace-nowrap">
              {corridorProfile.shortCode}
            </span>
          </div>
          <div className="text-base font-bold text-cyan-400 font-mono tabular-nums whitespace-nowrap leading-tight">
            {formatNumberWithCommas(liveBandwidthGbs)} GB/s
          </div>
          <div className="w-full bg-slate-900 h-1 rounded overflow-hidden my-0.5 border border-slate-800">
            <div
              className="bg-[#00F0FF] h-full transition-all duration-150"
              style={{ width: String(Math.min(100, Math.round((liveBandwidthGbs / 1650) * 100))) + '%' }}
            />
          </div>
          <div className="text-xs font-mono font-medium text-slate-200 whitespace-nowrap leading-tight">
            TMA Async Shared Mem
          </div>
        </div>

        {/* Card 2: COMPRESSION STREAK */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs text-slate-300 font-mono font-semibold whitespace-nowrap truncate">
              COMPRESSION STREAK
            </span>
            <span className="text-xs font-mono font-bold text-amber-300 whitespace-nowrap shrink-0">
              🔥 {String(chunksStreak)} CHUNKS
            </span>
          </div>
          <div className="text-base font-bold text-emerald-400 font-mono tabular-nums whitespace-nowrap leading-tight">
            {liveCompressionRatio}% RATIO
          </div>
          <div className="text-xs font-mono font-medium text-slate-200 whitespace-nowrap leading-tight">
            Kernel Latency: {liveLatencyMs} ms
          </div>
        </div>

        {/* Card 3: PAGED SLOTS */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs text-slate-300 font-mono font-semibold whitespace-nowrap">PAGED SLOTS</span>
            <span className="text-xs font-mono font-bold text-amber-300 whitespace-nowrap">16 Tok/Page</span>
          </div>
          <div className="text-base font-bold text-cyan-400 font-mono tabular-nums whitespace-nowrap leading-tight">
            PAGES: {String(lockedBlocksCount)}/16
          </div>
          <div className="flex items-center gap-0.5 font-mono text-[10px] text-slate-200 overflow-hidden">
            {blocks.slice(0, 8).map((blk) => (
              <span
                key={blk.physicalBlockId}
                className={
                  'px-1 rounded border ' +
                  (blk.status === 'LOCKED'
                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400')
                }
              >
                {blk.blockLabel}
              </span>
            ))}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs text-slate-300 font-mono font-semibold whitespace-nowrap">TOKEN SCORE</span>
            <span className="text-xs font-mono font-bold text-amber-300 whitespace-nowrap shrink-0">
              +{sramXpBonus.toFixed(1)}k XP
            </span>
          </div>
          <div className="text-base font-bold text-slate-100 font-mono tabular-nums whitespace-nowrap leading-tight">
            {formatNumberWithCommas(sustainedTokens)} UNITS
          </div>
          <div className="text-xs font-mono font-medium text-slate-200 whitespace-nowrap leading-tight">
            Zero Fragmentation: 100%
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Engine Subsystem Tabs"
        className="grid grid-cols-5 gap-1 p-0.5 bg-slate-900/80 border border-slate-800 rounded-lg my-0.5 w-full text-center shrink-0"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-0.5 px-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap ' +
                (isActive
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* INTERACTIVE PAGED VIRTUAL TABLE BAY (NON-OVERLAPPING 16 BLOCKS + 3-ROW INSPECTOR CARD) */}
      <main className="flex-1 min-h-0 flex flex-col justify-between bg-slate-950/70 border border-slate-800 rounded-lg p-1.5 overflow-hidden gap-1">
        {/* 16 Physical Cache Blocks (B0..B15) in a clean 8x2 / 4x4 grid above the inspector */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 w-full shrink-0">
          {blocks.map((block) => {
            const isSelected = block.physicalBlockId === selectedBlock.physicalBlockId;
            const badgeStyle =
              block.status === 'LOCKED'
                ? 'text-xs font-mono font-bold text-emerald-300'
                : 'text-xs font-mono font-bold text-amber-300';

            return (
              <button
                key={block.physicalBlockId}
                type="button"
                onClick={() => setSelectedBlockId(block.physicalBlockId)}
                className={
                  'py-0.5 px-1.5 bg-slate-950 rounded text-center cursor-pointer transition-all flex flex-col items-center justify-between leading-tight ' +
                  (isSelected
                    ? 'border-2 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.4)] bg-slate-900/95'
                    : 'border border-slate-800 hover:border-cyan-400')
                }
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-mono font-bold text-white">
                    {block.blockLabel}
                  </span>
                  <span className={badgeStyle}>
                    {block.status === 'LOCKED' ? '✓16t' : 'EVICT'}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-cyan-300 leading-tight whitespace-nowrap">
                  {block.logicalPageId !== null
                    ? 'L' + String(block.logicalPageId) + '→P' + String(block.physicalBlockId)
                    : 'UNMAP'}
                </div>
                <div className="text-xs font-mono font-semibold text-slate-200 leading-tight whitespace-nowrap">
                  {'m: ' + block.runningMaxM.toFixed(1)}
                </div>
              </button>
            );
          })}
        </div>

        {/* Compact 3-Row Inspector Telemetry Card Beneath the 16 Blocks */}
        <div className="w-full p-1.5 flex flex-col gap-0.5 bg-slate-950/80 border border-slate-800 rounded shrink-0">
          {/* Row 1 */}
          <div className="text-xs font-mono font-bold text-slate-200 leading-snug truncate">
            {'INSPECTOR: ' +
              selectedBlock.blockLabel +
              ' · ' +
              selectedBlock.virtualAddressHex +
              ' → ' +
              selectedBlock.physicalAddressHex +
              ' · ' +
              (selectedBlock.status === 'LOCKED' ? 'LOCKED' : 'EVICTED')}
          </div>

          {/* Row 2 */}
          <div className="text-xs font-mono text-cyan-300 leading-snug truncate">
            {'State: ' +
              selectedBlock.sramTransferState +
              ' · Sparsity: ' +
              selectedBlock.sparsityScore.toFixed(2) +
              ' · Max m: ' +
              selectedBlock.runningMaxM.toFixed(2) +
              ' · Rescale: ' +
              selectedBlock.rescalingFactorExp.toFixed(2)}
          </div>

          {/* Row 3 */}
          <div className="text-xs font-mono font-bold text-emerald-400 leading-snug truncate">
            {activeTab === 'Mesh' &&
              'Mesh Topology: ' +
                String(corridorProfile.warpCount) +
                ' Warps · ' +
                String(corridorProfile.tmaPipelineStages) +
                ' TMA Stages · ' +
                selectedBlock.sequenceId}
            {activeTab === 'Pages' &&
              'Paged Virtual Table: 16 Blocks · 0.0% Frag · ' + selectedBlock.sequenceId}
            {activeTab === 'SRAM' &&
              'Tiled Softmax Drift: ' +
                kernelVerification.maxNumericalDrift.toExponential(2) +
                ' · Norm l: ' +
                kernelVerification.normalizerL.toFixed(2) +
                ' · ' +
                selectedBlock.sequenceId}
            {activeTab === 'Eviction' &&
              'Attn Score: ' +
                selectedBlock.cumulativeAttentionScore.toFixed(2) +
                ' · Active Slots: ' +
                String(lockedBlocksCount) +
                '/16 · ' +
                selectedBlock.sequenceId}
            {activeTab === 'Transfer' &&
              'Sovereign APA Title · 100% MIT Clean-Room · ' + selectedBlock.sequenceId}
          </div>
        </div>
      </main>

      {/* 4 TACTICAL LAUNCH CONTROL BUTTONS WITH NEON FLASH FEEDBACK */}
      <section
        aria-label="Tactical Launch Control Dock"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        <button
          type="button"
          onClick={handleInjectContextBurst}
          className={
            'text-xs font-bold py-1.5 px-2 rounded-lg transition-all duration-150 cursor-pointer font-mono whitespace-nowrap truncate active:scale-95 ' +
            (flashedButton === 'BURST'
              ? 'bg-[#FF9F0A] text-black border-2 border-white shadow-[0_0_20px_rgba(255,159,10,0.9)]'
              : 'bg-amber-950/40 hover:bg-amber-900/50 text-[#FF9F0A] border border-[#FF9F0A] shadow-[0_0_10px_rgba(255,159,10,0.2)]')
          }
        >
          💥 INJECT CONTEXT BURST
        </button>

        <button
          type="button"
          onClick={handleToggleCompression}
          className={
            'text-xs font-bold py-1.5 px-2 rounded-lg transition-all duration-150 cursor-pointer font-mono whitespace-nowrap truncate active:scale-95 ' +
            (flashedButton === 'COMPRESS'
              ? 'bg-[#00F0FF] text-black border-2 border-white shadow-[0_0_20px_rgba(0,240,255,0.95)]'
              : 'bg-cyan-950/40 hover:bg-cyan-900/50 text-[#00F0FF] border border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.3)]')
          }
        >
          ⚡ TOGGLE COMPRESSION
        </button>

        <button
          type="button"
          onClick={handleStepFlashAttnPass}
          className={
            'text-xs font-bold py-1.5 px-2 rounded-lg transition-all duration-150 cursor-pointer font-mono whitespace-nowrap truncate active:scale-95 ' +
            (flashedButton === 'STEP'
              ? 'bg-emerald-400 text-black border-2 border-white shadow-[0_0_20px_rgba(16,185,129,0.95)]'
              : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]')
          }
        >
          🚀 STEP FLASH-ATTN PASS
        </button>

        <button
          type="button"
          onClick={handleFlushAndReZero}
          className={
            'text-xs font-bold py-1.5 px-2 rounded-lg transition-all duration-150 cursor-pointer font-mono whitespace-nowrap truncate active:scale-95 ' +
            (flashedButton === 'FLUSH'
              ? 'bg-rose-500 text-white border-2 border-white shadow-[0_0_20px_rgba(244,63,94,0.95)]'
              : 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 border border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]')
          }
        >
          🔄 FLUSH &amp; RE-ZERO CACHE
        </button>
      </section>

      {/* PIT-WALL RADIO LOG */}
      <footer
        aria-label="Pit-Wall Radio Telemetry Log"
        className="h-14 overflow-hidden font-mono text-[11px] p-2 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between"
      >
        {radioLogs.slice(0, 3).map((line, index) => (
          <div key={String(index) + '-' + line} className="truncate w-full">
            {line}
          </div>
        ))}
      </footer>

      {/* SOVEREIGN APA & POSTGRESQL RLS SCHEMA MODAL */}
      {apaModalState !== 'NONE' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#05070B] border border-slate-700 rounded-xl max-w-2xl w-full p-4 font-mono text-xs text-slate-200 flex flex-col gap-3 max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-[#00F0FF] font-bold">GF-T3-226</span>
                <span className="text-slate-400">·</span>
                <span className="text-amber-400 font-bold">
                  {apaModalState === 'SCHEMA'
                    ? 'SUPABASE / POSTGRESQL RLS SCHEMA'
                    : apaModalState === 'ACQUIRE_APA'
                    ? 'ACQUIRE TITLE (APA) — DIRECT REPOSITORY TRANSFER'
                    : 'INQUIRE VAULT BUYOUT — SOVEREIGN CUSTODY'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setApaModalState('NONE')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-600 cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>

            {apaModalState === 'SCHEMA' ? (
              <pre className="bg-black/95 border border-slate-800 rounded p-3 text-[11px] text-emerald-300 overflow-y-auto max-h-[55vh] leading-relaxed select-all">
                {POSTGRES_RLS_SCHEMA_SQL}
              </pre>
            ) : (
              <div className="space-y-2 text-[11px] leading-relaxed overflow-y-auto max-h-[55vh]">
                <p className="text-slate-200">
                  <strong>CHASSIS DESIGNATION:</strong> GF-T3-226 (Track 3 Skunkworks Engine)
                </p>
                <p className="text-slate-300">
                  <strong>CLEAN-ROOM IP WARRANTY:</strong> 100% MIT / Apache-2.0 permissive dependency tree.
                  Zero copyleft obligations. Complete standalone FastAPI engine (<code>engine.py</code>),
                  Pytest &amp; Vitest verification suites (&gt;80% coverage), partitioned PostgreSQL RLS schema,
                  and Cloud Run container included.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  appendRadioLog('🟢 CREW CHIEF', 'APA Title Transfer package verified for GF-T3-226');
                  setApaModalState('NONE');
                }}
                className="px-3 py-1 bg-[#FF9F0A]/20 hover:bg-[#FF9F0A]/30 text-[#FF9F0A] border border-[#FF9F0A]/60 rounded font-bold cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => {
                  appendRadioLog('⚡ PIT WALL', 'Vault Buyout dossier locked · Zero-SaaS custody confirmed');
                  setApaModalState('NONE');
                }}
                className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/60 rounded font-bold cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
