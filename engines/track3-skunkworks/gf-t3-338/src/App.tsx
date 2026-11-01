/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  SYNTHETIC_PREFIX_CORRIDORS,
  EngineTelemetryState,
  computeRadixBlockHash,
  createInitialBlocks,
  createInitialEngineState,
  formatIntegerWithCommas,
} from './engine/radixPrefixEngine';

type CockpitTab = 'Mesh' | 'Pref' | 'Hash' | 'Stats' | 'APA';

const TABS: readonly CockpitTab[] = ['Mesh', 'Pref', 'Hash', 'Stats', 'APA'];

export default function App() {
  const [engine, setEngine] = useState<EngineTelemetryState>(() =>
    createInitialEngineState()
  );
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number>(3); // Default B3 per Inspector spec
  const [apaTransferState, setApaTransferState] = useState<string>(
    'READY · CLUSTER-006 ESCROW VERIFIED'
  );
  const [clockTick, setClockTick] = useState<number>(112);

  const nextTimestamp = (): string => {
    const next = clockTick + 4;
    setClockTick(next);
    const secs = Math.floor(next / 100);
    const hundredths = next % 100;
    const secStr = String(secs).padStart(2, '0');
    const hunStr = String(hundredths).padStart(2, '0');
    return '[00:' + secStr + '.' + hunStr + ']';
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosen = e.target.value;
    let tp = 124600;
    let lat = '0.01 µs';
    let sat = 98;

    if (chosen === SYNTHETIC_PREFIX_CORRIDORS[1]) {
      tp = 118400;
      lat = '0.02 µs';
      sat = 94;
    } else if (chosen === SYNTHETIC_PREFIX_CORRIDORS[2]) {
      tp = 112900;
      lat = '0.03 µs';
      sat = 91;
    } else if (chosen === SYNTHETIC_PREFIX_CORRIDORS[3]) {
      tp = 64200;
      lat = '0.14 µs';
      sat = 68;
    }

    const ts = nextTimestamp();
    setEngine((prev) => ({
      ...prev,
      corridor: chosen,
      throughputGbS: tp,
      throughputFormatted: formatIntegerWithCommas(tp) + ' GB/s',
      saturationPct: sat,
      prefixLatencyUs: lat,
      radioComms: [
        prev.radioComms[1],
        ts +
          ' 🟢 CORRIDOR: Switched active fabric to ' +
          chosen.split(' ')[0] +
          ' at ' +
          formatIntegerWithCommas(tp) +
          ' GB/s',
      ],
    }));
  };

  const handleQuickHeaderAction = (actionType: 'Pref' | 'Hash' | 'Run') => {
    if (actionType === 'Pref') {
      setActiveTab('Pref');
      handlePrefixCachingBurst();
    } else if (actionType === 'Hash') {
      setActiveTab('Hash');
      handleStepPrefixPass();
    } else {
      setActiveTab('Mesh');
      handleStepPrefixPass();
    }
  };

  // Switch 1: Trigger Prefix Caching Burst
  const handlePrefixCachingBurst = () => {
    const ts = nextTimestamp();
    setEngine((prev) => {
      const nextTokens = prev.processedTokens + 1280000;
      const newVec: [number, number, number, number] = [9.96, 9.98, 9.95, 9.99];
      const updatedBlocks = prev.blocks.map((blk, idx) => {
        const { digestHex, radixEnergy } = computeRadixBlockHash(
          newVec,
          [1.08, 1.09, 1.07, 1.11],
          'BURST_PASS_' + String(idx) + '_' + String(nextTokens),
          blk.radixHash
        );
        return {
          ...blk,
          tokensLabel: '256K',
          cachePct: 100,
          syncPct: 100,
          latencyMs: '0.01ms',
          status: 'HASHED · LOCKED',
          hashStatus: 'OK',
          lockState: 'LOCKED',
          radixHash: digestHex,
          refCount: blk.refCount + 2,
          radixEnergy,
        };
      });

      return {
        ...prev,
        throughputGbS: 124600,
        throughputFormatted: '124,600 GB/s',
        saturationPct: 100,
        prefixLatencyUs: '0.01 µs',
        processedTokens: nextTokens,
        processedTokensFormatted: formatIntegerWithCommas(nextTokens) + ' UNITS',
        engineXpFormatted: '+79.5k ENGINE XP',
        prefixState: 'Active',
        vectorValues: newVec,
        collisionSpikeActive: false,
        blocks: updatedBlocks,
        radioComms: [
          prev.radioComms[1],
          ts +
            ' 🟢 CREW CHIEF: Prefix caching burst saturated 8/8 KV blocks · 124,600 GB/s locked',
        ],
      };
    });
  };

  // Switch 2: Inject Hash Collision Spike (Force Dynamic Radix Tree Re-Indexing)
  const handleToggleHashCollisionSpike = () => {
    const ts = nextTimestamp();
    setEngine((prev) => {
      const spikeNext = !prev.collisionSpikeActive;
      if (spikeNext) {
        const spikeVec: [number, number, number, number] = [9.84, 9.89, 9.86, 9.9];
        const spikeBlocks = prev.blocks.map((blk, idx) => {
          if (idx === 2 || idx === 5) {
            return {
              ...blk,
              cachePct: 94,
              syncPct: 96,
              latencyMs: '0.04ms',
              status: 'REHASH · SYNC',
              hashStatus: 'REINDEX',
              lockState: 'SYNCING',
            };
          }
          return blk;
        });

        return {
          ...prev,
          throughputGbS: 117124,
          throughputFormatted: '117,124 GB/s',
          saturationPct: 94,
          prefixLatencyUs: '0.03 µs',
          prefixState: 'Re-Indexing',
          modeLabel: 'RADIX_REINDEX',
          vectorValues: spikeVec,
          collisionSpikeActive: true,
          blocks: spikeBlocks,
          radioComms: [
            prev.radioComms[1],
            ts +
              ' 🟠 TELEMETRY: Hash collision spike injected on B2 & B5 · Dynamic radix tree re-indexing active',
          ],
        };
      } else {
        const cleanVec: [number, number, number, number] = [9.91, 9.95, 9.92, 9.94];
        const recoveredBlocks = prev.blocks.map((blk) => ({
          ...blk,
          cachePct: 100,
          syncPct: 100,
          latencyMs: '0.02ms',
          status: 'HASHED · LOCKED',
          hashStatus: 'OK',
          lockState: 'LOCKED',
        }));

        return {
          ...prev,
          throughputGbS: 124600,
          throughputFormatted: '124,600 GB/s',
          saturationPct: 98,
          prefixLatencyUs: '0.01 µs',
          prefixState: 'Active',
          modeLabel: 'PREFIX_CACHING',
          vectorValues: cleanVec,
          collisionSpikeActive: false,
          blocks: recoveredBlocks,
          radioComms: [
            prev.radioComms[1],
            ts +
              ' 🟢 TELEMETRY: Radix hash collision resolved · All 8 KV blocks restored to HASHED · LOCKED',
          ],
        };
      }
    });
  };

  // Switch 3: Step Asynchronous Prefix Pass
  const handleStepPrefixPass = () => {
    const ts = nextTimestamp();
    setEngine((prev) => {
      const nextTokens = prev.processedTokens + 640000;
      const steppedBlocks = prev.blocks.map((blk, idx) => {
        const { digestHex, radixEnergy } = computeRadixBlockHash(
          prev.vectorValues,
          [1.04, 1.06, 1.05, 1.07],
          'ASYNC_STEP_' + String(idx) + '_' + String(nextTokens),
          blk.radixHash
        );
        return {
          ...blk,
          cachePct: 100,
          syncPct: 100,
          latencyMs: '0.02ms',
          status: 'HASHED · LOCKED',
          hashStatus: 'OK',
          lockState: 'LOCKED',
          radixHash: digestHex,
          refCount: blk.refCount + 1,
          radixEnergy,
        };
      });

      return {
        ...prev,
        processedTokens: nextTokens,
        processedTokensFormatted: formatIntegerWithCommas(nextTokens) + ' UNITS',
        prefixLatencyUs: '0.01 µs',
        prefixState: 'Active',
        modeLabel: 'PREFIX_CACHING',
        collisionSpikeActive: false,
        blocks: steppedBlocks,
        radioComms: [
          prev.radioComms[1],
          ts +
            ' 🟢 CREW CHIEF: Step asynchronous prefix pass completed · Zero TTFT reload verified',
        ],
      };
    });
  };

  // Switch 4: Flush Prefix Arenas & Re-Zero Hash Tables
  const handleFlushPrefixArenas = () => {
    const ts = nextTimestamp();
    const resetVec: [number, number, number, number] = [9.91, 9.95, 9.92, 9.94];
    setSelectedBlockIdx(3);
    setEngine({
      corridor: SYNTHETIC_PREFIX_CORRIDORS[0],
      throughputGbS: 124600,
      throughputFormatted: '124,600 GB/s',
      saturationPct: 98,
      prefixLatencyUs: '0.01 µs',
      activeBlocksCount: 8,
      totalBlocksCount: 8,
      processedTokens: 25400000,
      processedTokensFormatted: '25,400,000 UNITS',
      engineXpFormatted: '+75.0k ENGINE XP',
      prefixState: 'Active',
      meshPtr: '0x47F8DC0',
      modeLabel: 'PREFIX_CACHING',
      vectorValues: resetVec,
      collisionSpikeActive: false,
      blocks: createInitialBlocks(resetVec),
      radioComms: [
        '[00:01.04] 🟢 CREW CHIEF: Asynchronous prefix caching and radix tree hash engine initialized · 8 blocks linked',
        ts +
          ' 🟢 TELEMETRY: Prefix arenas flushed & hash tables re-zeroed to baseline 124,600 GB/s',
      ],
    });
  };

  const selectedBlock = engine.blocks[selectedBlockIdx] || engine.blocks[3];
  const vecFormatted =
    '[' +
    engine.vectorValues.map((v) => v.toFixed(2)).join(', ') +
    ']';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP HEADER ROW 1 */}
      <header className="flex items-center justify-between gap-1 w-full shrink-0">
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <h1 className="text-base font-mono font-bold tracking-tight text-white">
            GF-T3-338
          </h1>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 rounded">
            FLAGSHIP
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 overflow-hidden">
          <select
            aria-label="Synthetic Prefix Corridor"
            value={engine.corridor}
            onChange={handleCorridorChange}
            className="max-w-[120px] text-[10px] font-mono truncate py-0.5 px-1 shrink-0 bg-slate-900 text-cyan-300 border border-slate-700 rounded focus:outline-none focus:border-cyan-400"
          >
            {SYNTHETIC_PREFIX_CORRIDORS.map((corridor) => (
              <option key={corridor} value={corridor}>
                {corridor}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => handleQuickHeaderAction('Pref')}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded transition-colors cursor-pointer"
          >
            [Pref]
          </button>
          <button
            type="button"
            onClick={() => handleQuickHeaderAction('Hash')}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 rounded transition-colors cursor-pointer"
          >
            [Hash]
          </button>
          <button
            type="button"
            onClick={() => handleQuickHeaderAction('Run')}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 rounded transition-colors cursor-pointer"
          >
            [Run]
          </button>
        </div>
      </header>

      {/* TOP HEADER ROW 2 */}
      <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap shrink-0">
        Prefix Caching · Radix Tree Indexing · Zero Reload Latency
      </div>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 GRID) */}
      <section className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5">
        {/* Card 1: PREFIX NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              PREFIX NITRO
            </span>
            <span className="font-mono text-lg font-bold text-[#00F0FF] leading-none">
              {engine.throughputFormatted}
            </span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden my-1 border border-slate-800">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(engine.saturationPct) + '%' }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Cache Throughput Saturation</span>
            <span className="text-cyan-300 font-bold">
              {String(engine.saturationPct) + '%'}
            </span>
          </div>
        </div>

        {/* Card 2: HASH STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              HASH STREAK
            </span>
            <span className="font-mono text-lg font-bold text-[#FF9F0A] leading-none">
              {engine.prefixLatencyUs}
            </span>
          </div>
          <div className="flex items-center justify-between my-0.5">
            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-700/50 rounded px-1.5 py-0.5">
              🔥 RADIX-TREE
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              TTFT: ZERO
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Prefix Latency</span>
            <span className="text-slate-400">BARRIER: 0.01µs</span>
          </div>
        </div>

        {/* Card 3: ACTIVE BLOCKS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              ACTIVE BLOCKS
            </span>
            <span className="font-mono text-lg font-bold text-emerald-400 leading-none">
              {'BLOCKS: ' +
                String(engine.activeBlocksCount) +
                '/' +
                String(engine.totalBlocksCount)}
            </span>
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {engine.blocks.map((blk) => (
              <button
                key={blk.shortId}
                type="button"
                onClick={() => setSelectedBlockIdx(blk.index)}
                className={
                  'text-[9px] font-mono font-bold rounded py-0.5 text-center border cursor-pointer ' +
                  (selectedBlockIdx === blk.index
                    ? 'bg-cyan-500/30 border-cyan-400 text-white'
                    : blk.status === 'HASHED · LOCKED'
                    ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                    : 'bg-amber-950/80 border-amber-600 text-amber-300')
                }
              >
                {blk.shortId}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>F1 Gear Shift KV Array [B0..B7]</span>
            <span className="text-emerald-400 font-bold">LOCKED</span>
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="font-mono text-lg font-bold text-white leading-none">
              {engine.processedTokensFormatted}
            </span>
          </div>
          <div className="flex items-center justify-between my-0.5">
            <span className="text-[10px] font-mono font-bold text-[#00F0FF]">
              {engine.engineXpFormatted}
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-bold">
              REF-COUNT: SHARED
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>{'Prefix State: ' + engine.prefixState}</span>
            <span className="text-cyan-300">UNIT #338</span>
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Views"
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
                'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
                (isActive
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER (STRICTLY CLEAN OF ACTION BUTTONS) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        {'VIEW: ' +
          activeTab.toUpperCase() +
          ' · PTR: ' +
          engine.meshPtr +
          ' · MODE: ' +
          engine.modeLabel +
          ' · BLOCKS: ' +
          String(engine.activeBlocksCount) +
          ' · VEC: ' +
          vecFormatted}
      </div>

      {/* CONTEXTUAL TAB STRIP + INTERACTIVE BLOCK MATRIX BAY (B0-B7) */}
      <main className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden my-0.5">
        {activeTab !== 'Mesh' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded px-2 py-1 mb-1 shrink-0">
            {activeTab === 'Pref' && (
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-200">
                <span>
                  PREFIX TREE CACHE: Multi-turn KV reuse active · Hit Ratio: 100.0% · Zero Host CPU Stalls
                </span>
                <span className="text-cyan-300 font-bold">
                  CORRIDOR: {engine.corridor.split(' ')[0]}
                </span>
              </div>
            )}

            {activeTab === 'Hash' && (
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-200">
                <span>
                  FORMULA: R_radix = sum H(K_prefix, V_prefix, chi_hash_token) · Digest: {selectedBlock.radixHash}
                </span>
                <span className="text-amber-400 font-bold">
                  ENERGY: {String(selectedBlock.radixEnergy)}
                </span>
              </div>
            )}

            {activeTab === 'Stats' && (
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-200">
                <span>
                  4-GATE DYNO: Gate 01 Math PASS · Gate 02 PG16 RLS PASS · Gate 03 Zero-Trust PASS · Gate 04 Pytest PASS
                </span>
                <span className="text-emerald-400 font-bold">
                  CLUSTER-006 · TRACK 3
                </span>
              </div>
            )}

            {activeTab === 'APA' && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-200">
                  <span>
                    GF-T3-338 · Retail Price: 75,000 to 150,000+ USD Units · Full Engine APA Buyout: 35,000 to 65,000 USD Units
                  </span>
                  <span className="text-cyan-300 font-bold">{apaTransferState}</span>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <button
                    type="button"
                    onClick={() =>
                      setApaTransferState(
                        'APA TITLE LOCKED · 100% SOVEREIGN IP TRANSFER PACKAGE READY'
                      )
                    }
                    className="w-full py-1 px-2 text-[10px] font-mono font-bold bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF] border border-[#00F0FF]/60 rounded text-center cursor-pointer"
                  >
                    ACQUIRE TITLE (APA)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setApaTransferState(
                        'VAULT BUYOUT INQUIRY LOGGED · CLUSTER-006 ESCROW DISPATCHED'
                      )
                    }
                    className="w-full py-1 px-2 text-[10px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/60 rounded text-center cursor-pointer"
                  >
                    INQUIRE VAULT BUYOUT
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* INTERACTIVE BLOCK MATRIX BAY (B0-B7) */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/90 border border-slate-800/90 rounded-lg flex-1 min-h-0 items-stretch">
          {engine.blocks.map((block) => {
            const isSelected = selectedBlockIdx === block.index;
            return (
              <div
                key={block.shortId}
                onClick={() => setSelectedBlockIdx(block.index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedBlockIdx(block.index);
                  }
                }}
                className={
                  'flex flex-col justify-between p-1.5 rounded border transition-colors cursor-pointer ' +
                  (isSelected
                    ? 'bg-slate-900 border-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700')
                }
              >
                {/* Line 1 (Title & Hex) */}
                <div className="text-[10px] font-mono font-bold text-white flex justify-between items-center w-full">
                  <span>{block.title}</span>
                  <span className="text-slate-400 font-normal">{block.hexPtr}</span>
                </div>

                {/* Line 2 (Tokens & Cache Load) */}
                <div className="text-[8px] font-mono font-bold text-cyan-300 flex justify-between items-center w-full px-1">
                  <span>{'TOK: ' + block.tokensLabel}</span>
                  <span>{'CACHE: ' + String(block.cachePct) + '%'}</span>
                </div>

                {/* Line 3 (Latency & Status) */}
                <div className="flex justify-between items-center text-[8px] font-mono text-slate-300 w-full px-1">
                  <span className="text-amber-400">{block.latencyMs}</span>
                  <span className="text-emerald-400">{block.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* COMPACT PREFIX TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {selectedBlock.shortId +
          ' · TOK: ' +
          selectedBlock.tokensLabel +
          ' · CACHE: ' +
          String(selectedBlock.cachePct) +
          '% · SYNC: ' +
          String(selectedBlock.syncPct) +
          '% · PTR ' +
          selectedBlock.hexPtr +
          ' · HASH: ' +
          selectedBlock.hashStatus +
          ' · ' +
          selectedBlock.lockState +
          ' · BLOCKS: ' +
          String(engine.activeBlocksCount) +
          ' · RADIX: ACTIVE'}
      </div>

      {/* TACTICAL LAUNCH CONTROL SWITCHES */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handlePrefixCachingBurst}
          className="text-[8px] sm:text-[9px] md:text-xs py-1.5 px-0.5 whitespace-nowrap text-center font-mono font-bold border rounded w-full bg-amber-950/50 hover:bg-amber-900/60 border-[#FF9F0A] text-[#FF9F0A] transition-colors cursor-pointer"
        >
          💥 INJECT PREFIX CACHING BURST
        </button>

        <button
          type="button"
          onClick={handleToggleHashCollisionSpike}
          className="text-[8px] sm:text-[9px] md:text-xs py-1.5 px-0.5 whitespace-nowrap text-center font-mono font-bold border rounded w-full bg-cyan-950/50 hover:bg-cyan-900/60 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.25)] transition-colors cursor-pointer"
        >
          ⚡ TOGGLE HASH COLLISION SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepPrefixPass}
          className="text-[8px] sm:text-[9px] md:text-xs py-1.5 px-0.5 whitespace-nowrap text-center font-mono font-bold border rounded w-full bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-400 text-emerald-300 transition-colors cursor-pointer"
        >
          🚀 STEP ASYNCHRONOUS PREFIX PASS
        </button>

        <button
          type="button"
          onClick={handleFlushPrefixArenas}
          className="text-[8px] sm:text-[9px] md:text-xs py-1.5 px-0.5 whitespace-nowrap text-center font-mono font-bold border rounded w-full bg-rose-950/50 hover:bg-rose-900/60 border-rose-500 text-rose-300 transition-colors cursor-pointer"
        >
          🔄 FLUSH PREFIX ARENAS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center">
        <div className="truncate">{engine.radioComms[0]}</div>
        <div className="truncate">{engine.radioComms[1]}</div>
      </footer>
    </div>
  );
}
