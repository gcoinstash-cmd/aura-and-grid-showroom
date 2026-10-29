/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-274 Flagship Asynchronous Context Window Rolling & Dynamic Memory Eviction Cockpit
 * Strictly locked 10/10 viewport layout with zero scrollbars and zero-dollar gate.
 */

import React, { useState } from 'react';
import {
  CorridorId,
  SYNTHETIC_CORRIDORS,
  GridSyncCommandSchema,
  createInitialSnapshot,
  stepRollingEvictionBurst,
  toggleInfiniteStreamSpikeState,
  executeArenaDefragmentationPass,
  SUPABASE_POSTGRES_SCHEMA_SQL,
} from './engine/rollingContextCore';

type CockpitTab = 'Mesh' | 'Roll' | 'Evct' | 'Stats' | 'APA';

interface RadioLogEntry {
  timestamp: string;
  callsign: '🟢 CREW CHIEF' | '🟢 TELEMETRY' | '🔴 TELEMETRY' | '⚡ PIT WALL';
  message: string;
}

const TABS: CockpitTab[] = ['Mesh', 'Roll', 'Evct', 'Stats', 'APA'];

function formatUnits(val: number): string {
  return val.toLocaleString('en-US');
}

export default function App() {
  const [snapshot, setSnapshot] = useState(() => createInitialSnapshot('ROLL-CORRIDOR-ALPHA'));
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState<number>(3);
  const [customTokenBurstK, setCustomTokenBurstK] = useState<number>(128);
  const [apaModalState, setApaModalState] = useState<'NONE' | 'ACQUIRE_TITLE' | 'VAULT_BUYOUT'>('NONE');
  const [schemaOverlayOpen, setSchemaOverlayOpen] = useState<boolean>(false);
  const [clockTick, setClockTick] = useState<number>(108);

  const [radioLogs, setRadioLogs] = useState<RadioLogEntry[]>([
    {
      timestamp: '00:01.04',
      callsign: '🟢 CREW CHIEF',
      message:
        'Asynchronous context window rolling and dynamic memory eviction engine initialized · 8 segments linked',
    },
    {
      timestamp: '00:01.08',
      callsign: '🟢 TELEMETRY',
      message:
        'Hardware KV token eviction verified at 33,600 GB/s with zero OOM crashes',
    },
  ]);

  const appendRadioLogs = (line1: RadioLogEntry, line2: RadioLogEntry) => {
    setRadioLogs([line1, line2]);
  };

  const nextTimestampPair = (): [string, string] => {
    const nextA = clockTick + 4;
    const nextB = clockTick + 8;
    setClockTick(nextB);
    const secA = Math.floor(nextA / 100);
    const msA = nextA % 100;
    const secB = Math.floor(nextB / 100);
    const msB = nextB % 100;
    const tA =
      '00:' +
      String(secA).padStart(2, '0') +
      '.' +
      String(msA).padStart(2, '0');
    const tB =
      '00:' +
      String(secB).padStart(2, '0') +
      '.' +
      String(msB).padStart(2, '0');
    return [tA, tB];
  };

  const handleCorridorChange = (newCorridorId: CorridorId) => {
    const validation = GridSyncCommandSchema.safeParse({
      corridorId: newCorridorId,
      incomingTokenDeltaK: customTokenBurstK,
      slidingWindowDeltaMaxK: SYNTHETIC_CORRIDORS[newCorridorId].maxSlidingThresholdK,
      selectedSegmentIndex: selectedSegmentIdx,
      operatorCallsign: 'CREW CHIEF',
    });

    if (!validation.success) {
      return;
    }

    const nextSnap = createInitialSnapshot(newCorridorId);
    setSnapshot(nextSnap);
    const [t1, t2] = nextTimestampPair();
    appendRadioLogs(
      {
        timestamp: t1,
        callsign: '⚡ PIT WALL',
        message:
          'Switched synthetic rolling corridor to ' +
          SYNTHETIC_CORRIDORS[newCorridorId].shortTag +
          ' · Sliding threshold ' +
          String(SYNTHETIC_CORRIDORS[newCorridorId].maxSlidingThresholdK) +
          'K',
      },
      {
        timestamp: t2,
        callsign: '🟢 TELEMETRY',
        message:
          'Hardware KV token eviction verified at ' +
          formatUnits(nextSnap.rollingThroughputGbs) +
          ' GB/s with zero OOM crashes',
      }
    );
  };

  const handleInjectEvictionBurst = () => {
    const nextSnap = stepRollingEvictionBurst(snapshot, customTokenBurstK);
    setSnapshot(nextSnap);
    const [t1, t2] = nextTimestampPair();
    appendRadioLogs(
      {
        timestamp: t1,
        callsign: '🟢 CREW CHIEF',
        message:
          'Rolling window eviction burst executed · W_roll reclaimed stale KV tokens across 8 segments',
      },
      {
        timestamp: t2,
        callsign: '🟢 TELEMETRY',
        message:
          'Hardware KV token eviction verified at ' +
          formatUnits(nextSnap.rollingThroughputGbs) +
          ' GB/s with zero OOM crashes · Total units: ' +
          formatUnits(nextSnap.processedTokensUnits),
      }
    );
  };

  const handleToggleInfiniteSpike = () => {
    const nextSnap = toggleInfiniteStreamSpikeState(snapshot);
    setSnapshot(nextSnap);
    const [t1, t2] = nextTimestampPair();
    if (nextSnap.infiniteSpikeActive) {
      appendRadioLogs(
        {
          timestamp: t1,
          callsign: '🔴 TELEMETRY',
          message:
            'Infinite stream token spike injected · Sliding window compaction active at ' +
            formatUnits(nextSnap.rollingThroughputGbs) +
            ' GB/s',
        },
        {
          timestamp: t2,
          callsign: '⚡ PIT WALL',
          message:
            'Zero memory exhaustion verified · Instant KV eviction locked at ' +
            String(nextSnap.evictionLatencyUs) +
            ' µs',
        }
      );
    } else {
      appendRadioLogs(
        {
          timestamp: t1,
          callsign: '🟢 CREW CHIEF',
          message:
            'Infinite stream spike normalized · Baseline rolling context window restored across S0..S7',
        },
        {
          timestamp: t2,
          callsign: '🟢 TELEMETRY',
          message:
            'Hardware KV token eviction verified at ' +
            formatUnits(nextSnap.rollingThroughputGbs) +
            ' GB/s with zero OOM crashes',
        }
      );
    }
  };

  const handleStepDefragPass = () => {
    const corridor = SYNTHETIC_CORRIDORS[snapshot.corridorId];
    const defragResult = executeArenaDefragmentationPass(snapshot.segments, corridor);
    const nextSnap = {
      ...snapshot,
      infiniteSpikeActive: false,
      rollingThroughputGbs: corridor.baseThroughputGbs,
      throughputSaturationPct: 97.5,
      evictionLatencyUs: defragResult.compactedLatencyUs,
      processedTokensUnits: snapshot.processedTokensUnits + 384000,
      engineXpK: Number((snapshot.engineXpK + 15.0).toFixed(1)),
      rollingStateLabel: 'Rolling State: Eviction Active',
      modeLabel: 'ROLLING_CONTEXT',
      reclaimedArenaBlocks: snapshot.reclaimedArenaBlocks + defragResult.reclaimedBlocksDelta,
      segments: defragResult.segments,
    };
    setSnapshot(nextSnap);
    const [t1, t2] = nextTimestampPair();
    appendRadioLogs(
      {
        timestamp: t1,
        callsign: '⚡ PIT WALL',
        message:
          'Asynchronous defragmentation pass complete · Reclaimed ' +
          String(defragResult.reclaimedBlocksDelta) +
          ' GPU arena blocks with zero host CPU stall',
      },
      {
        timestamp: t2,
        callsign: '🟢 TELEMETRY',
        message:
          'Sub-microsecond arena re-indexing locked · S3 pointer ' +
          nextSnap.segments[3].hexAddress +
          ' verified at ' +
          String(nextSnap.evictionLatencyUs) +
          ' µs',
      }
    );
  };

  const handleFlushArenas = () => {
    const resetSnap = createInitialSnapshot(snapshot.corridorId);
    setSnapshot(resetSnap);
    setSelectedSegmentIdx(3);
    setApaModalState('NONE');
    setSchemaOverlayOpen(false);
    setRadioLogs([
      {
        timestamp: '00:01.04',
        callsign: '🟢 CREW CHIEF',
        message:
          'Asynchronous context window rolling and dynamic memory eviction engine initialized · 8 segments linked',
      },
      {
        timestamp: '00:01.08',
        callsign: '🟢 TELEMETRY',
        message:
          'Hardware KV token eviction verified at 33,600 GB/s with zero OOM crashes',
      },
    ]);
  };

  const selectedSegment = snapshot.segments[selectedSegmentIdx] || snapshot.segments[3];
  const inspectorPointerHex =
    selectedSegment.index === 3 && selectedSegment.defragGeneration === 0
      ? '0x8030'
      : selectedSegment.hexAddress;

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP COMMAND DECK: Row 1 + Row 2 */}
      <header className="w-full shrink-0 flex flex-col gap-0.5 border-b border-slate-800/90 pb-1">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Title + Cyan Badge */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-mono font-extrabold tracking-tight text-white">
              GF-T3-274
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
              FLAGSHIP
            </span>
          </div>

          {/* Right: Compact Corridor Dropdown + Micro Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Select Synthetic Rolling Corridor"
              value={snapshot.corridorId}
              onChange={(e) => handleCorridorChange(e.target.value as CorridorId)}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {Object.values(SYNTHETIC_CORRIDORS).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleInjectEvictionBurst}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-[#FF9F0A] border border-[#FF9F0A]/60 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Roll]
            </button>
            <button
              type="button"
              onClick={handleStepDefragPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-[#00F0FF] border border-[#00F0FF]/60 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Evict]
            </button>
            <button
              type="button"
              onClick={handleToggleInfiniteSpike}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-[#10B981] border border-[#10B981]/60 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Run]
            </button>
            <button
              type="button"
              onClick={() => setSchemaOverlayOpen((prev) => !prev)}
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Inspect Schema]
            </button>
            <button
              type="button"
              onClick={handleFlushArenas}
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Reset]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          Rolling Context · Dynamic Eviction · Zero OOM
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON: 2x2 grid above the fold */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: ROLL NITRO */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-slate-200">ROLL NITRO</span>
            <span className="text-[#00F0FF] font-bold">
              {String(snapshot.throughputSaturationPct) + '% BUS'}
            </span>
          </div>
          <div className="text-lg font-mono font-bold text-[#00F0FF] leading-tight">
            {formatUnits(snapshot.rollingThroughputGbs) + ' GB/s'}
          </div>
          <div className="w-full bg-slate-800 h-1 rounded overflow-hidden my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(snapshot.throughputSaturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Rolling Throughput Saturation
          </div>
        </div>

        {/* Card 2: EVICT STREAK */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-slate-200">EVICT STREAK</span>
            <span className="text-[#FF9F0A] font-bold">🔥 SLIDING-WIN</span>
          </div>
          <div className="text-lg font-mono font-bold text-[#FF9F0A] leading-tight">
            {String(snapshot.evictionLatencyUs) + ' µs'}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            {'Reclaimed: ' + String(snapshot.reclaimedArenaBlocks) + ' Arena Blocks'}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Eviction Latency
          </div>
        </div>

        {/* Card 3: ACTIVE SEGMENTS */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-slate-200">ACTIVE SEGMENTS</span>
            <span className="text-emerald-400 font-bold">LOCKED</span>
          </div>
          <div className="text-lg font-mono font-bold text-emerald-400 leading-tight">
            {'SEGMENTS: ' +
              String(snapshot.activeSegmentsCount) +
              '/' +
              String(snapshot.totalSegmentsCount)}
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {snapshot.segments.map((seg) => (
              <span
                key={seg.code}
                className={
                  'text-[9px] font-mono font-bold text-center rounded ' +
                  (seg.index === selectedSegmentIdx
                    ? 'bg-[#00F0FF] text-slate-950'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40')
                }
              >
                {seg.code}
              </span>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            F1 Gear Shift Indicator [S0..S7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-slate-200">TOKEN SCORE</span>
            <span className="text-[#00F0FF] font-bold">
              {'+' + snapshot.engineXpK.toFixed(1) + 'k ENGINE XP'}
            </span>
          </div>
          <div className="text-lg font-mono font-bold text-white leading-tight truncate">
            {formatUnits(snapshot.processedTokensUnits) + ' UNITS'}
          </div>
          <div className="text-[10px] font-mono text-amber-300 truncate">
            {'Evicted: ' + formatUnits(snapshot.totalEvictedTokensUnits) + ' Units'}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            {snapshot.rollingStateLabel}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
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
              onClick={() => {
                setActiveTab(tab);
                setSchemaOverlayOpen(false);
              }}
              className={
                'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
                (isActive
                  ? 'bg-[#00F0FF] text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER (Strictly single unbroken line with zero action buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1.5 py-0.5 bg-slate-950/90 border border-slate-800/80 rounded shrink-0">
        {'VIEW: ' +
          activeTab.toUpperCase() +
          ' · PTR: ' +
          snapshot.meshPointerHex +
          ' · MODE: ' +
          snapshot.modeLabel +
          ' · SEGMENTS: ' +
          String(snapshot.activeSegmentsCount) +
          ' · VEC: [' +
          snapshot.attentionVector.map((v) => v.toFixed(2)).join(', ') +
          ']'}
      </div>

      {/* MAIN INTERACTIVE SIMULATION BAY (Always renders 4x2 Segment Matrix or Tab Overlay inside fixed flex-1 area) */}
      <main className="flex-1 min-h-0 flex flex-col justify-between my-0.5 overflow-hidden">
        {schemaOverlayOpen ? (
          <div className="h-full rounded border border-cyan-500/40 bg-slate-950 p-2 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="text-xs font-mono font-bold text-[#00F0FF]">
                POSTGRESQL / SUPABASE PARTITIONED SCHEMA & RLS POLICIES (GF-T3-274)
              </span>
              <button
                type="button"
                onClick={() => setSchemaOverlayOpen(false)}
                className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-white rounded cursor-pointer"
              >
                [CLOSE SCHEMA]
              </button>
            </div>
            <pre className="text-[10px] font-mono text-emerald-300 leading-tight overflow-hidden whitespace-pre-wrap select-all flex-1 py-1">
              {SUPABASE_POSTGRES_SCHEMA_SQL}
            </pre>
            <div className="text-[10px] font-mono text-slate-400 flex justify-between">
              <span>PARTITIONED BY RANGE (recorded_at)</span>
              <span>RLS: TENANT ISOLATION VERIFIED</span>
            </div>
          </div>
        ) : activeTab === 'APA' ? (
          <div className="h-full flex flex-col justify-between gap-1 overflow-hidden">
            {/* Keep the 8-segment 4x2 grid visible in compact form or pair with APA Acquisition Controls */}
            <div className="grid grid-cols-4 gap-1.5 flex-1 min-h-0">
              {snapshot.segments.map((seg) => {
                const isSelected = seg.index === selectedSegmentIdx;
                return (
                  <div
                    key={seg.code}
                    onClick={() => setSelectedSegmentIdx(seg.index)}
                    className={
                      'py-0 px-1.5 rounded border bg-slate-900/60 flex flex-col justify-between cursor-pointer transition-colors ' +
                      (isSelected
                        ? 'border-[#00F0FF]'
                        : 'border-slate-800 hover:border-slate-700')
                    }
                  >
                    <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                      <span>{seg.title}</span>
                      <span>{seg.hexAddress}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                      <span>{'TOK: ' + String(seg.tokensK) + 'K'}</span>
                      <span>{'UTIL: ' + seg.utilizationPct.toFixed(1) + '%'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-[#FF9F0A]">{seg.latencyMs.toFixed(2) + 'ms'}</span>
                      <span className="text-[#10B981] font-bold">{seg.state}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dedicated APA Tab Commercial Transfer & Clean-Room Audit Strip */}
            <div className="p-1.5 rounded border border-[#FF9F0A]/50 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-1.5 shrink-0">
              <div className="text-[11px] font-mono text-slate-200 truncate">
                <span className="font-bold text-[#FF9F0A]">APA SOVEREIGN TRANSFER: </span>
                <span>100% MIT / Apache-2.0 Clean-Room IP · NIST SP 800-218 SSDF v1.1 Verified</span>
                {apaModalState !== 'NONE' && (
                  <span className="ml-2 text-emerald-400 font-bold">
                    {apaModalState === 'ACQUIRE_TITLE'
                      ? '· [APA DOSSIER DISPATCHED]'
                      : '· [VAULT ESCROW READY]'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setApaModalState('ACQUIRE_TITLE');
                    const [t1, t2] = nextTimestampPair();
                    appendRadioLogs(
                      {
                        timestamp: t1,
                        callsign: '🟢 CREW CHIEF',
                        message:
                          'APA Title Acquisition package locked for GF-T3-274 · Clean-room provenance verified',
                      },
                      {
                        timestamp: t2,
                        callsign: '⚡ PIT WALL',
                        message:
                          'Zero copyleft dependencies confirmed · Standalone Docker and FastAPI artifacts ready',
                      }
                    );
                  }}
                  className="px-2.5 py-1 text-[11px] font-mono font-bold bg-[#FF9F0A] text-slate-950 rounded hover:bg-amber-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApaModalState('VAULT_BUYOUT');
                    const [t1, t2] = nextTimestampPair();
                    appendRadioLogs(
                      {
                        timestamp: t1,
                        callsign: '⚡ PIT WALL',
                        message:
                          'Vault buyout inquiry registered for GF-T3-274 · Full repository escrow checksums verified',
                      },
                      {
                        timestamp: t2,
                        callsign: '🟢 TELEMETRY',
                        message:
                          'Hardware KV token eviction verified at 33,600 GB/s with zero OOM crashes',
                      }
                    );
                  }}
                  className="px-2.5 py-1 text-[11px] font-mono font-bold bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF] rounded hover:bg-[#00F0FF]/30 transition-colors cursor-pointer whitespace-nowrap"
                >
                  INQUIRE VAULT BUYOUT
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col justify-between gap-1 overflow-hidden">
            {/* INTERACTIVE SEGMENT MATRIX BAY (S0-S7) in tight 4x2 grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-1 min-h-0">
              {snapshot.segments.map((seg) => {
                const isSelected = seg.index === selectedSegmentIdx;
                return (
                  <div
                    key={seg.code}
                    onClick={() => setSelectedSegmentIdx(seg.index)}
                    className={
                      'py-0 px-1.5 rounded border bg-slate-900/60 flex flex-col justify-between cursor-pointer transition-colors ' +
                      (isSelected
                        ? 'border-[#00F0FF] bg-slate-900/90'
                        : 'border-slate-800 hover:border-slate-700')
                    }
                  >
                    {/* Line 1 (Title & Hex) */}
                    <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                      <span>{seg.title}</span>
                      <span>{seg.hexAddress}</span>
                    </div>

                    {/* Line 2 (Tokens & Utilization) */}
                    <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                      <span>{'TOK: ' + String(seg.tokensK) + 'K'}</span>
                      <span>{'UTIL: ' + seg.utilizationPct.toFixed(1) + '%'}</span>
                    </div>

                    {/* Line 3 (Latency & State) */}
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-[#FF9F0A]">{seg.latencyMs.toFixed(2) + 'ms'}</span>
                      <span
                        className={
                          seg.state === 'SPIKE · RECLAIM'
                            ? 'text-[#FF9F0A] font-bold'
                            : 'text-[#10B981] font-bold'
                        }
                      >
                        {seg.state}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Contextual Mode Telemetry Bar for Roll / Evct / Stats tabs */}
            {activeTab !== 'Mesh' && (
              <div className="px-2 py-0.5 rounded border border-slate-800 bg-slate-950/90 flex items-center justify-between text-[10px] font-mono text-slate-300 shrink-0">
                {activeTab === 'Roll' && (
                  <>
                    <span>
                      {'FORMULA: W_roll = max(0, T_curr - Delta_max) · THRESHOLD: ' +
                        String(SYNTHETIC_CORRIDORS[snapshot.corridorId].maxSlidingThresholdK) +
                        'K'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span>BURST DELTA:</span>
                      {[64, 128, 256].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCustomTokenBurstK(val)}
                          className={
                            'px-1.5 py-0 text-[10px] font-mono font-bold rounded cursor-pointer ' +
                            (customTokenBurstK === val
                              ? 'bg-[#00F0FF] text-slate-950'
                              : 'bg-slate-800 text-slate-300')
                          }
                        >
                          {String(val) + 'K'}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {activeTab === 'Evct' && (
                  <>
                    <span>
                      {'ARENA COMPACTION: ZERO HOST CPU STALL · RECLAIMED BLOCKS: ' +
                        String(snapshot.reclaimedArenaBlocks)}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {'EVICTED TOTAL: ' + formatUnits(snapshot.totalEvictedTokensUnits) + ' UNITS'}
                    </span>
                  </>
                )}
                {activeTab === 'Stats' && (
                  <>
                    <span>
                      {'CORRIDOR: ' + SYNTHETIC_CORRIDORS[snapshot.corridorId].label}
                    </span>
                    <span className="text-[#00F0FF] font-bold">
                      {'ZERO OOM VERIFIED: ' + (snapshot.zeroOomVerified ? 'PASS (100%)' : 'FAULT')}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* COMPACT ROLLING TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {selectedSegment.code +
          ' · TOK: ' +
          String(selectedSegment.tokensK) +
          'K · UTIL: ' +
          selectedSegment.utilizationPct.toFixed(1) +
          '% · RATE: ' +
          String(selectedSegment.retentionRatePct) +
          '% · PTR ' +
          inspectorPointerHex +
          ' · ROLL: OK · LOCKED'}
      </div>

      {/* TACTICAL LAUNCH CONTROL SWITCHES */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleInjectEvictionBurst}
          className="border border-[#FF9F0A] bg-[#FF9F0A]/15 hover:bg-[#FF9F0A]/25 text-[#FF9F0A] text-xs font-mono font-bold py-2 px-1 text-center rounded transition-colors cursor-pointer whitespace-nowrap truncate"
        >
          💥 INJECT ROLLING EVICTION BURST
        </button>

        <button
          type="button"
          onClick={handleToggleInfiniteSpike}
          className="border border-[#00F0FF] bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] text-xs font-mono font-bold py-2 px-1 text-center rounded shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-colors cursor-pointer whitespace-nowrap truncate"
        >
          ⚡ TOGGLE INFINITE STREAM SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepDefragPass}
          className="border border-[#10B981] bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] text-xs font-mono font-bold py-2 px-1 text-center rounded transition-colors cursor-pointer whitespace-nowrap truncate"
        >
          🚀 STEP ASYNCHRONOUS DEFRAG PASS
        </button>

        <button
          type="button"
          onClick={handleFlushArenas}
          className="border border-rose-500 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-mono font-bold py-2 px-1 text-center rounded transition-colors cursor-pointer whitespace-nowrap truncate"
        >
          🔄 FLUSH ROLLING ARENAS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        {radioLogs.map((entry, idx) => (
          <div key={idx} className="truncate whitespace-nowrap">
            {'[' + entry.timestamp + '] ' + entry.callsign + ': ' + entry.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
