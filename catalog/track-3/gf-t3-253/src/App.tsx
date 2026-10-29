/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  SYNTHETIC_CORRIDORS,
  SyntheticCorridorId,
  createInitialEngineState,
  switchEngineCorridor,
  triggerPagedBatchBurst,
  toggleFragmentationSpike,
  stepPagedAttentionPass,
  flushKvCacheBuffers,
  formatNumberWithCommas,
  formatEngineXp,
  KVPhysicalBlock,
} from './engine/pagedAttentionCore';

type CockpitTab = 'Mesh' | 'Paged' | 'Batch' | 'Stats' | 'APA';

const COCKPIT_TABS: readonly CockpitTab[] = ['Mesh', 'Paged', 'Batch', 'Stats', 'APA'];

export default function App() {
  const [engine, setEngine] = useState(() => createInitialEngineState());
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');

  const selectedBlock: KVPhysicalBlock =
    engine.blocks[engine.selectedBlockIndex] || engine.blocks[3];

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCorridor = e.target.value as SyntheticCorridorId;
    setEngine((prev) => switchEngineCorridor(prev, nextCorridor));
  };

  const handleSelectBlock = (index: number) => {
    setEngine((prev) => {
      const blk = prev.blocks[index] || prev.blocks[0];
      return {
        ...prev,
        selectedBlockIndex: index,
        radioLogs: [
          prev.radioLogs[1] || prev.radioLogs[0],
          {
            timestamp: '00:0' + String((prev.stepCount % 8) + 1) + '.12',
            callsign: '🟢 TELEMETRY',
            message:
              'Inspected Physical KV ' +
              blk.label +
              ' at ' +
              blk.hexPtr +
              ' · Mapped to ' +
              blk.mappedSequenceId +
              ' (' +
              blk.virtualPages.join(', ') +
              ')',
          },
        ],
      };
    });
  };

  const handleBatchBurst = () => {
    setEngine((prev) => triggerPagedBatchBurst(prev, 4));
  };

  const handleToggleSpike = () => {
    setEngine((prev) => toggleFragmentationSpike(prev));
  };

  const handleStepPass = () => {
    setEngine((prev) => stepPagedAttentionPass(prev));
  };

  const handleFlushCache = () => {
    setEngine(flushKvCacheBuffers());
  };

  const handleAcquireTitle = (actionLabel: string) => {
    setEngine((prev) => ({
      ...prev,
      radioLogs: [
        prev.radioLogs[1] || prev.radioLogs[0],
        {
          timestamp: '00:09.88',
          callsign: '🟢 CREW CHIEF',
          message:
            actionLabel +
            ' initiated for GF-T3-253 · 100% MIT clean-room repository ready for transfer',
        },
      ],
    }));
  };

  const saturationPct = Math.min(100, Math.round((engine.throughputGbs / 15640) * 100));
  const vecString =
    '[' + engine.attentionVec.map((v) => v.toFixed(2)).join(', ') + ']';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Row 1 */}
      <div className="flex items-center justify-between gap-1 w-full shrink-0">
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <h1 className="text-sm font-mono font-bold tracking-tight text-white">
            GF-T3-253
          </h1>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
            FLAGSHIP
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <select
            aria-label="Synthetic PagedAttention Corridor"
            value={engine.corridor}
            onChange={handleCorridorChange}
            className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded focus:outline-none focus:border-[#00F0FF]"
          >
            {SYNTHETIC_CORRIDORS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setActiveTab('Paged');
              handleStepPass();
            }}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/40 rounded cursor-pointer"
          >
            [Paged]
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('Batch');
              handleBatchBurst();
            }}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded cursor-pointer"
          >
            [Batch]
          </button>

          <button
            type="button"
            onClick={handleStepPass}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900/80 text-[#10B981] border border-[#10B981]/50 rounded cursor-pointer"
          >
            [Run]
          </button>
        </div>
      </div>

      {/* Top Header Row 2 */}
      <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap shrink-0">
        Continuous Batching · PagedAttention · Zero Memory Waste
      </div>

      {/* 4-Card Arcade HUD Ribbon (2x2 grid) */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0"
      >
        {/* Card 1: PAGED NITRO */}
        <div className="py-1 px-2 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span className="font-bold">PAGED NITRO</span>
            <span className="text-[#00F0FF]">
              Batch Throughput: {formatNumberWithCommas(engine.throughputGbs)} GB/s
            </span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-none my-0.5">
            {formatNumberWithCommas(engine.throughputGbs)} GB/s
          </div>
          <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
            <div
              className="bg-[#00F0FF] h-full"
              style={{ width: String(saturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            PagedAttention Throughput Saturation
          </div>
        </div>

        {/* Card 2: FRAG STREAK */}
        <div className="py-1 px-2 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span className="font-bold">FRAG STREAK</span>
            <span
              className={
                engine.totalFragPct === 0
                  ? 'text-[#10B981] font-bold'
                  : 'text-[#EF4444] font-bold'
              }
            >
              🔥 {engine.totalFragPct.toFixed(1)}% FRAG
            </span>
          </div>
          <div className="text-[#FF9F0A] font-mono text-lg font-bold leading-none my-0.5">
            {engine.latencyUs.toFixed(2)} µs
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            KV Cache Allocation Latency
          </div>
        </div>

        {/* Card 3: ACTIVE BLOCKS */}
        <div className="py-1 px-2 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span className="font-bold">ACTIVE BLOCKS</span>
            <span className="text-[#10B981] font-bold">Paged</span>
          </div>
          <div className="text-emerald-400 font-mono text-lg font-bold leading-none my-0.5">
            BLOCKS: {String(engine.activeBlocksCount)}/{String(engine.totalBlocksCount)}
          </div>
          <div className="grid grid-cols-8 gap-0.5">
            {engine.blocks.map((b) => (
              <span
                key={b.blockId}
                className={
                  'text-[9px] font-mono text-center rounded ' +
                  (b.locked
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300')
                }
              >
                {b.blockId}
              </span>
            ))}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="py-1 px-2 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span className="font-bold">TOKEN SCORE</span>
            <span className="text-[#00F0FF] font-bold">
              {formatEngineXp(engine.engineXp)}
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-none my-0.5">
            {formatNumberWithCommas(engine.processedTokens)} UNITS
          </div>
          <div className="text-[10px] font-mono text-emerald-400 font-semibold truncate">
            Batch State: {engine.batchState}
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Workspace Modes"
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
                'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
                (isActive
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60'
                  : 'text-slate-400 hover:text-slate-200')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Streamlined Mesh Info Subheader */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300">
          VIEW: {activeTab.toUpperCase()} · PTR: {engine.meshPtr} · MODE: {engine.modeLabel} · FRAG:{' '}
          {engine.totalFragPct.toFixed(1)}% · VEC: {vecString}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => handleAcquireTitle('ACQUIRE TITLE (APA)')}
            className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded cursor-pointer"
          >
            ACQUIRE TITLE (APA)
          </button>
          <button
            type="button"
            onClick={() => handleAcquireTitle('INQUIRE VAULT BUYOUT')}
            className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/50 rounded cursor-pointer"
          >
            INQUIRE VAULT BUYOUT
          </button>
        </div>
      </div>

      {/* Interactive Paged Block Matrix Bay (B0–B7) in a tight 4x2 grid */}
      <main
        aria-label="Interactive Paged Block Matrix Bay"
        className="grid grid-cols-4 gap-1 w-full shrink-0"
      >
        {engine.blocks.map((block) => {
          const isSelected = block.blockIndex === engine.selectedBlockIndex;
          return (
            <div
              key={block.blockId}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectBlock(block.blockIndex)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSelectBlock(block.blockIndex);
                }
              }}
              className={
                'py-0.5 px-1.5 rounded border border-slate-800 bg-slate-900/60 cursor-pointer ' +
                (isSelected ? 'ring-1 ring-[#00F0FF]' : '')
              }
            >
              {/* Card Title & Hex */}
              <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                <span>{block.label}</span>
                <span>{block.hexPtr}</span>
              </div>

              {/* Tokens & ref */}
              <div className="text-[12px] font-mono text-cyan-300 font-bold">
                TOK: {String(block.tokens)} · REF: {String(block.refCount)}
              </div>

              {/* Frag & latency */}
              <div className="text-[12px] font-mono text-amber-300 font-bold">
                FRAG: {block.fragPct.toFixed(1)}% · LAT: {block.latencyMs.toFixed(2)}ms
              </div>

              {/* Status & lock */}
              <div
                className={
                  block.locked
                    ? 'text-[10px] font-mono text-emerald-400 font-semibold'
                    : 'text-[10px] font-mono text-rose-400 font-semibold'
                }
              >
                {block.locked
                  ? 'STATE: ALLOCATED · LOCKED'
                  : 'STATE: FRAGMENTED · UNLOCKED'}
              </div>
            </div>
          );
        })}
      </main>

      {/* Compact Paged Telemetry Inspector Strip */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5">
        {selectedBlock.blockId} · TOK: {String(selectedBlock.tokens)} · REF:{' '}
        {String(selectedBlock.refCount)} · FRAG: {selectedBlock.fragPct.toFixed(1)}% · PTR{' '}
        {selectedBlock.hexPtr} · BATCH: {selectedBlock.batchStatus} · MAPPED
      </div>

      {/* Tactical Launch Control Buttons */}
      <section
        aria-label="Launch Control Dock"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleBatchBurst}
          className="border border-[#FF9F0A] bg-[#FF9F0A]/10 hover:bg-[#FF9F0A]/20 text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          💥 INJECT PAGED BATCH BURST
        </button>

        <button
          type="button"
          onClick={handleToggleSpike}
          className="border border-[#00F0FF] bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.25)] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          ⚡ TOGGLE FRAGMENTATION SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepPass}
          className="border border-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          🚀 STEP PAGEDATTENTION PASS
        </button>

        <button
          type="button"
          onClick={handleFlushCache}
          className="border border-rose-500 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          🔄 FLUSH KV CACHE BUFFERS
        </button>
      </section>

      {/* Pit-Wall Radio Comms Log */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        {engine.radioLogs.slice(-2).map((entry, idx) => (
          <div key={String(idx) + '-' + entry.timestamp} className="truncate">
            [{entry.timestamp}] {entry.callsign}: {entry.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
