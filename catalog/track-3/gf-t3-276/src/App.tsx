/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-276 · Track 3 Flagship KV-Cache Direct Memory Access & PCIe Gen-6 Offloading Cockpit
 * F1 Pit-Wall & Cyberpunk Arcade Sim · 10/10 Strict Viewport Lock · Zero-Dollar Gate
 */

import React, { useState, useCallback } from 'react';
import {
  ChannelDescriptor,
  CockpitTab,
  CorridorId,
  EngineStateSnapshot,
  RadioLogEntry,
  SYNTHETIC_DMA_CORRIDORS,
  applyEngineCommand,
  createInitialEngineState,
} from './engine/dmaEngine';

const TABS: readonly CockpitTab[] = ['Mesh', 'DMA', 'OFLd', 'Stats', 'APA'];

const CORRIDOR_LIST: readonly CorridorId[] = [
  'DMA-CORRIDOR-ALPHA',
  'DMA-CORRIDOR-BRAVO',
  'DMA-CORRIDOR-GAMMA',
  'DMA-CORRIDOR-DELTA',
];

const INITIAL_ENGINE_STATE: EngineStateSnapshot = createInitialEngineState();

const FALLBACK_CHANNEL: ChannelDescriptor = {
  index: 3,
  tag: 'D3',
  title: 'Channel 3 (D3)',
  pointerHex: '0xA030',
  tokensK: 256,
  bandwidthGbs: 128,
  latencyMs: 0.02,
  syncPct: 100,
  stateLabel: 'STREAMING · LOCKED',
  dmaOk: true,
  hostArenaOffsetHex: '0x9F8D30',
  ringSlotDepth: 64,
};

function resolveProgressWidthClass(saturationPct: number): string {
  if (saturationPct >= 95) return 'w-full';
  if (saturationPct >= 85) return 'w-11/12';
  if (saturationPct >= 75) return 'w-4/5';
  if (saturationPct >= 65) return 'w-2/3';
  return 'w-1/2';
}

export default function App() {
  const [engine, setEngine] = useState<EngineStateSnapshot>(INITIAL_ENGINE_STATE);
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [schemaModalOpen, setSchemaModalOpen] = useState<boolean>(false);

  const dispatchCommand = useCallback(
    (payload: {
      action:
        | 'BURST'
        | 'SPIKE'
        | 'STEP'
        | 'FLUSH'
        | 'CORRIDOR'
        | 'SELECT_CHANNEL'
        | 'EXPORT_AUDIT'
        | 'ACQUIRE_APA'
        | 'INQUIRE_VAULT';
      corridorId?: CorridorId;
      channelIndex?: number;
    }) => {
      setEngine((prev) => {
        const safeBase = prev ?? INITIAL_ENGINE_STATE;
        return applyEngineCommand(safeBase, payload);
      });
      fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        /* Local deterministic engine remains authoritative */
      });
    },
    []
  );

  const safeChannels: ChannelDescriptor[] =
    Array.isArray(engine?.channels) && engine.channels.length === 8
      ? engine.channels
      : INITIAL_ENGINE_STATE.channels;

  const selectedIdx =
    typeof engine?.selectedChannelIndex === 'number' &&
    engine.selectedChannelIndex >= 0 &&
    engine.selectedChannelIndex < safeChannels.length
      ? engine.selectedChannelIndex
      : 3;

  const inspectedChannel: ChannelDescriptor =
    safeChannels[selectedIdx] ?? FALLBACK_CHANNEL;

  const safeLogs: RadioLogEntry[] =
    Array.isArray(engine?.radioLogs) && engine.radioLogs.length > 0
      ? engine.radioLogs.slice(-2)
      : INITIAL_ENGINE_STATE.radioLogs.slice(-2);

  const safeVector: [number, number, number, number] =
    Array.isArray(engine?.vectorSignature) && engine.vectorSignature.length === 4
      ? engine.vectorSignature
      : INITIAL_ENGINE_STATE.vectorSignature;

  const progressWidthClass = resolveProgressWidthClass(
    engine?.dmaSaturationPct ?? 88
  );

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER ROW 1 */}
      <header className="flex items-center justify-between gap-1 w-full shrink-0">
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <h1 className="text-sm font-mono font-extrabold tracking-tight text-white">
            GF-T3-276
          </h1>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
            FLAGSHIP
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono text-emerald-400">
            ✓ LOCKED
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <select
            aria-label="Select Synthetic DMA Offload Corridor"
            value={engine?.corridorId ?? 'DMA-CORRIDOR-ALPHA'}
            onChange={(e) =>
              dispatchCommand({
                action: 'CORRIDOR',
                corridorId: e.target.value as CorridorId,
              })
            }
            className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-[#00F0FF]"
          >
            {CORRIDOR_LIST.map((cid) => (
              <option key={'corridor-opt-' + cid} value={cid}>
                {SYNTHETIC_DMA_CORRIDORS[cid].label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setActiveTab('DMA');
              dispatchCommand({ action: 'STEP' });
            }}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/40 rounded transition-colors cursor-pointer"
          >
            [DMA]
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('OFLd');
              dispatchCommand({ action: 'BURST' });
            }}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded transition-colors cursor-pointer"
          >
            [Offload]
          </button>

          <button
            type="button"
            onClick={() => dispatchCommand({ action: 'STEP' })}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 rounded transition-colors cursor-pointer"
          >
            [Run]
          </button>

          <button
            type="button"
            onClick={() => setSchemaModalOpen((prev) => !prev)}
            className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer"
          >
            [Inspect Schema]
          </button>

          <button
            type="button"
            onClick={() => dispatchCommand({ action: 'FLUSH' })}
            className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded transition-colors cursor-pointer"
          >
            [Reset]
          </button>
        </div>
      </header>

      {/* TOP HEADER ROW 2 */}
      <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap shrink-0">
        KV-Cache DMA · PCIe Gen-6 Offload · Zero Bottleneck
      </div>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0"
      >
        {/* Card 1: DMA NITRO */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              DMA NITRO
            </span>
            <span className="text-[10px] font-mono font-bold text-[#00F0FF]">
              {String(engine.dmaSaturationPct) + '% BUS'}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-tight">
            {engine.dmaThroughputGbs.toLocaleString('en-US') + ' GB/s'}
          </div>
          <div className="w-full bg-slate-950 h-1 rounded overflow-hidden my-0.5 border border-slate-800">
            <div
              className={'bg-[#00F0FF] h-full transition-opacity duration-150 ' + progressWidthClass}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-300">
            <span>DMA Throughput Saturation</span>
            <span>
              {'DMA Throughput: ' +
                engine.dmaThroughputGbs.toLocaleString('en-US') +
                ' GB/s'}
            </span>
          </div>
        </div>

        {/* Card 2: OFFLOAD STREAK */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              OFFLOAD STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">
              🔥 PCIE-GEN6
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#FF9F0A] leading-tight">
            {String(engine.offloadLatencyUs) + ' µs'}
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-300">
            <span>Offload Latency</span>
            <span>{'Offload Latency: ' + String(engine.offloadLatencyUs) + ' µs'}</span>
          </div>
        </div>

        {/* Card 3: ACTIVE CHANNELS */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              ACTIVE CHANNELS
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              {'Active Channels: ' + String(engine.activeChannels) + ' Channels'}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-emerald-400 leading-tight">
            {'CHANNELS: ' +
              String(engine.activeChannels) +
              '/' +
              String(engine.totalChannels)}
          </div>
          <div className="flex justify-between items-center gap-0.5 text-[9px] font-mono">
            {safeChannels.map((ch) => (
              <span
                key={'gear-badge-' + ch.tag + '-' + String(ch.index)}
                className={
                  ch.dmaOk
                    ? 'px-1 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'px-1 rounded bg-rose-950/90 text-rose-300 border border-rose-500/50 font-bold'
                }
              >
                {ch.tag}
              </span>
            ))}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              {'+' + engine.engineXpK.toFixed(1) + 'k ENGINE XP'}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight">
            {engine.processedTokens.toLocaleString('en-US') + ' UNITS'}
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-300">
            <span>{'DMA State: ' + engine.dmaState}</span>
            <span>
              {'Processed Tokens: ' +
                engine.processedTokens.toLocaleString('en-US') +
                ' Units'}
            </span>
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Workspace Views"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={'nav-tab-' + tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                isActive
                  ? 'py-0.5 text-xs font-mono font-bold rounded bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50 cursor-pointer'
                  : 'py-0.5 text-xs font-mono font-semibold rounded text-slate-300 hover:text-white hover:bg-slate-800/60 cursor-pointer'
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER (STRICTLY CLEAN OF ACTION BUTTONS) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 shrink-0 px-1">
        {'VIEW: ' +
          activeTab.toUpperCase() +
          ' · PTR: ' +
          engine.meshPtrHex +
          ' · MODE: PCIE_DMA_OFFLOAD · CHANNELS: ' +
          String(engine.activeChannels) +
          ' · VEC: [' +
          safeVector.map((v) => v.toFixed(2)).join(', ') +
          ']'}
      </div>

      {/* APA TAB EXCLUSIVE COMMERCIAL CALL TO ACTION BAR */}
      {activeTab === 'APA' && (
        <div className="flex items-center justify-between gap-2 px-2 py-0.5 bg-slate-900/95 border border-[#00F0FF]/50 rounded shrink-0">
          <div className="text-[10px] font-mono text-slate-200 truncate">
            {'APA SOVEREIGN VAULT · GF-T3-276 · ' +
              engine.apaStatus +
              ' · PARITY: ' +
              String(engine.bufferParityPct) +
              '%'}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => dispatchCommand({ action: 'ACQUIRE_APA' })}
              className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF] text-slate-950 rounded hover:opacity-90 cursor-pointer"
            >
              ACQUIRE TITLE (APA)
            </button>
            <button
              type="button"
              onClick={() => dispatchCommand({ action: 'INQUIRE_VAULT' })}
              className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#FF9F0A] text-slate-950 rounded hover:opacity-90 cursor-pointer"
            >
              INQUIRE VAULT BUYOUT
            </button>
            <button
              type="button"
              onClick={() => dispatchCommand({ action: 'EXPORT_AUDIT' })}
              className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500 text-slate-950 rounded hover:opacity-90 cursor-pointer"
            >
              EXPORT AUDIT
            </button>
          </div>
        </div>
      )}

      {/* INTERACTIVE CHANNEL MATRIX BAY (D0-D7 IN 4x2 GRID) */}
      <main
        aria-label="Interactive Channel Matrix Bay"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full flex-1 min-h-0 my-0.5"
      >
        {safeChannels.map((ch) => {
          const isSelected = ch.index === selectedIdx;
          return (
            <div
              key={'channel-card-' + ch.tag + '-' + String(ch.index)}
              role="button"
              tabIndex={0}
              onClick={() =>
                dispatchCommand({
                  action: 'SELECT_CHANNEL',
                  channelIndex: ch.index,
                })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  dispatchCommand({
                    action: 'SELECT_CHANNEL',
                    channelIndex: ch.index,
                  });
                }
              }}
              className={
                'py-0 px-1.5 rounded border border-slate-800 bg-slate-900/60 flex flex-col justify-between cursor-pointer ' +
                (!ch.dmaOk
                  ? 'ring-1 ring-[#EF4444]'
                  : isSelected
                  ? 'ring-1 ring-[#00F0FF]'
                  : 'hover:border-slate-700')
              }
            >
              {/* Line 1: Title & Hex */}
              <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                <span>{ch.title}</span>
                <span>{ch.pointerHex}</span>
              </div>

              {/* Line 2: Tokens & Bandwidth */}
              <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                <span>{'TOK: ' + String(ch.tokensK) + 'K'}</span>
                <span>{'BW: ' + String(ch.bandwidthGbs) + ' GB/s'}</span>
              </div>

              {/* Line 3: Latency & State */}
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-[#FF9F0A] font-bold">
                  {ch.latencyMs.toFixed(2) + 'ms'}
                </span>
                <span
                  className={
                    ch.dmaOk
                      ? 'text-[#10B981] font-bold'
                      : 'text-[#EF4444] font-bold'
                  }
                >
                  {ch.dmaOk ? 'STREAMING · LOCKED' : '⚡ FAULT'}
                </span>
              </div>
            </div>
          );
        })}
      </main>

      {/* COMPACT DMA TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {inspectedChannel.tag +
          ' · TOK: ' +
          String(inspectedChannel.tokensK) +
          'K · BW: ' +
          String(inspectedChannel.bandwidthGbs) +
          ' GB/s · SYNC: ' +
          String(inspectedChannel.syncPct) +
          '% · PTR ' +
          inspectedChannel.pointerHex +
          ' · DMA: ' +
          (inspectedChannel.dmaOk ? 'OK · LOCKED' : 'FAULT · REROUTED')}
      </div>

      {/* TACTICAL LAUNCH CONTROL SWITCHES */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={() => dispatchCommand({ action: 'BURST' })}
          className="border border-[#FF9F0A] bg-[#FF9F0A]/15 hover:bg-[#FF9F0A]/25 text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          💥 INJECT PCIE DMA OFFLOAD BURST
        </button>

        <button
          type="button"
          onClick={() => dispatchCommand({ action: 'SPIKE' })}
          className="border border-[#00F0FF] bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          ⚡ TOGGLE BUS SATURATION SPIKE
        </button>

        <button
          type="button"
          onClick={() => dispatchCommand({ action: 'STEP' })}
          className="border border-[#10B981] bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          🚀 STEP ASYNCHRONOUS TRANSFER PASS
        </button>

        <button
          type="button"
          onClick={() => dispatchCommand({ action: 'FLUSH' })}
          className="border border-[#EF4444] bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          🔄 FLUSH DMA BUFFERS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        {safeLogs.map((entry, idx) => (
          <div
            key={'radio-log-' + entry.id + '-' + String(idx)}
            className="truncate whitespace-nowrap"
          >
            {entry.timestamp +
              ' ' +
              entry.icon +
              ' ' +
              entry.callsign +
              ': ' +
              entry.message}
          </div>
        ))}
      </footer>

      {/* SCHEMA OVERLAY MODAL */}
      {schemaModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#05070B] border border-[#00F0FF] rounded-lg max-w-3xl w-full p-3 flex flex-col gap-2 max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
              <span className="text-xs font-mono font-bold text-[#00F0FF]">
                GF-T3-276 · POSTGRESQL / SUPABASE PARTITIONED RLS SCHEMA
              </span>
              <button
                type="button"
                onClick={() => setSchemaModalOpen(false)}
                className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/40 rounded cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>
            <pre className="text-[10px] font-mono text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 overflow-y-auto flex-1">
              {`CREATE TABLE pcie_corridor_configs (
  corridor_id TEXT PRIMARY KEY,
  corridor_label TEXT NOT NULL UNIQUE,
  architecture_mode TEXT NOT NULL,
  base_pcie_bw_gbs NUMERIC(12, 2) NOT NULL,
  target_throughput_gbs NUMERIC(12, 2) NOT NULL
);

CREATE TABLE kv_cache_arena_blocks (
  block_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id TEXT NOT NULL REFERENCES pcie_corridor_configs(corridor_id),
  channel_index INTEGER NOT NULL CHECK (channel_index BETWEEN 0 AND 7),
  channel_tag TEXT NOT NULL,
  pointer_hex TEXT NOT NULL,
  allocated_tokens INTEGER NOT NULL,
  channel_bw_gbs NUMERIC(12, 2) NOT NULL,
  sync_parity_pct NUMERIC(5, 2) NOT NULL,
  dma_state TEXT NOT NULL,
  tenant_id UUID NOT NULL
);

CREATE TABLE dma_telemetry_events (
  event_id UUID NOT NULL DEFAULT gen_random_uuid(),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  corridor_id TEXT NOT NULL REFERENCES pcie_corridor_configs(corridor_id),
  aggregate_throughput_gbs NUMERIC(12, 2) NOT NULL,
  offload_latency_us NUMERIC(8, 4) NOT NULL,
  processed_tokens BIGINT NOT NULL,
  tenant_id UUID NOT NULL,
  PRIMARY KEY (event_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

ALTER TABLE kv_cache_arena_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dma_telemetry_events ENABLE ROW LEVEL SECURITY;`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
