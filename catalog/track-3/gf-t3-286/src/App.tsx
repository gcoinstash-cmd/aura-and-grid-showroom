/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useState } from 'react';

interface CorridorSpec {
  id: string;
  label: string;
  throughputGbs: number;
  latencyUs: number;
  sinkCount: number;
  mode: string;
}

interface RingBufferCard {
  id: number;
  tag: string;
  title: string;
  hexPtr: string;
  tokensLabel: string;
  sinkLabel: string;
  latencyLabel: string;
  stateLabel: string;
  syncPct: number;
  sinkVector: number[];
  rollingVector: number[];
}

const CORRIDORS: CorridorSpec[] = [
  {
    id: 'SINK-CORRIDOR-ALPHA',
    label: 'SINK-CORRIDOR-ALPHA (ASYNC-ATTENTION-SINK-RING-BUFFER-FABRIC · 43200-GB/S)',
    throughputGbs: 43200,
    latencyUs: 0.01,
    sinkCount: 4,
    mode: 'ATTENTION_SINK',
  },
  {
    id: 'SINK-CORRIDOR-BRAVO',
    label: 'SINK-CORRIDOR-BRAVO (INFINITE-CONTEXT-RETENTION-ENGINE)',
    throughputGbs: 41800,
    latencyUs: 0.01,
    sinkCount: 4,
    mode: 'INFINITE_RETENTION',
  },
  {
    id: 'SINK-CORRIDOR-GAMMA',
    label: 'SINK-CORRIDOR-GAMMA (NON-BLOCKING-HISTORICAL-TOKEN-PRESERVER)',
    throughputGbs: 39600,
    latencyUs: 0.02,
    sinkCount: 8,
    mode: 'HISTORICAL_PRESERVER',
  },
  {
    id: 'SINK-CORRIDOR-DELTA',
    label: 'SINK-CORRIDOR-DELTA (FALLBACK-TRUNCATED-WINDOW-PASS)',
    throughputGbs: 32400,
    latencyUs: 0.04,
    sinkCount: 4,
    mode: 'TRUNCATED_FALLBACK',
  },
];

const INITIAL_BUFFERS: RingBufferCard[] = [
  {
    id: 0,
    tag: 'R0',
    title: 'Buffer 0 (R0)',
    hexPtr: '0x14000',
    tokensLabel: '256K',
    sinkLabel: '4-TOK',
    latencyLabel: '0.02ms',
    stateLabel: 'CYCLING · LOCKED',
    syncPct: 100,
    sinkVector: [4.81, 4.85, 4.82, 4.84],
    rollingVector: [1.12, 1.18, 1.24, 1.29],
  },
  {
    id: 1,
    tag: 'R1',
    title: 'Buffer 1 (R1)',
    hexPtr: '0x14010',
    tokensLabel: '256K',
    sinkLabel: '4-TOK',
    latencyLabel: '0.02ms',
    stateLabel: 'CYCLING · LOCKED',
    syncPct: 100,
    sinkVector: [4.81, 4.85, 4.82, 4.84],
    rollingVector: [1.15, 1.21, 1.27, 1.32],
  },
  {
    id: 2,
    tag: 'R2',
    title: 'Buffer 2 (R2)',
    hexPtr: '0x14020',
    tokensLabel: '256K',
    sinkLabel: '4-TOK',
    latencyLabel: '0.02ms',
    stateLabel: 'CYCLING · LOCKED',
    syncPct: 100,
    sinkVector: [4.81, 4.85, 4.82, 4.84],
    rollingVector: [1.18, 1.24, 1.30, 1.35],
  },
  {
    id: 3,
    tag: 'R3',
    title: 'Buffer 3 (R3)',
    hexPtr: '0x14030',
    tokensLabel: '256K',
    sinkLabel: '4-TOK',
    latencyLabel: '0.02ms',
    stateLabel: 'CYCLING · LOCKED',
    syncPct: 100,
    sinkVector: [4.81, 4.85, 4.82, 4.84],
    rollingVector: [1.21, 1.27, 1.33, 1.38],
  },
  {
    id: 4,
    tag: 'R4',
    title: 'Buffer 4 (R4)',
    hexPtr: '0x14040',
    tokensLabel: '256K',
    sinkLabel: '4-TOK',
    latencyLabel: '0.02ms',
    stateLabel: 'CYCLING · LOCKED',
    syncPct: 100,
    sinkVector: [4.81, 4.85, 4.82, 4.84],
    rollingVector: [1.24, 1.30, 1.36, 1.41],
  },
  {
    id: 5,
    tag: 'R5',
    title: 'Buffer 5 (R5)',
    hexPtr: '0x14050',
    tokensLabel: '256K',
    sinkLabel: '4-TOK',
    latencyLabel: '0.02ms',
    stateLabel: 'CYCLING · LOCKED',
    syncPct: 100,
    sinkVector: [4.81, 4.85, 4.82, 4.84],
    rollingVector: [1.27, 1.33, 1.39, 1.44],
  },
  {
    id: 6,
    tag: 'R6',
    title: 'Buffer 6 (R6)',
    hexPtr: '0x14060',
    tokensLabel: '256K',
    sinkLabel: '4-TOK',
    latencyLabel: '0.02ms',
    stateLabel: 'CYCLING · LOCKED',
    syncPct: 100,
    sinkVector: [4.81, 4.85, 4.82, 4.84],
    rollingVector: [1.30, 1.36, 1.42, 1.47],
  },
  {
    id: 7,
    tag: 'R7',
    title: 'Buffer 7 (R7)',
    hexPtr: '0x14070',
    tokensLabel: '256K',
    sinkLabel: '4-TOK',
    latencyLabel: '0.02ms',
    stateLabel: 'CYCLING · LOCKED',
    syncPct: 100,
    sinkVector: [4.81, 4.85, 4.82, 4.84],
    rollingVector: [1.33, 1.39, 1.45, 1.50],
  },
];

const TABS = ['Mesh', 'Sink', 'Ring', 'Stats', 'APA'] as const;
type TabType = (typeof TABS)[number];

export default function App() {
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('SINK-CORRIDOR-ALPHA');
  const [activeTab, setActiveTab] = useState<TabType>('Mesh');
  const [buffers, setBuffers] = useState<RingBufferCard[]>(INITIAL_BUFFERS);
  const [selectedBufferId, setSelectedBufferId] = useState<number>(3);
  const [throughputGbs, setThroughputGbs] = useState<number>(43200);
  const [sinkLatencyUs, setSinkLatencyUs] = useState<number>(0.01);
  const [processedUnits, setProcessedUnits] = useState<number>(8064000);
  const [engineXpK, setEngineXpK] = useState<number>(75.0);
  const [sinkStateText, setSinkStateText] = useState<string>('Retention Active');
  const [globalPtrHex, setGlobalPtrHex] = useState<string>('0x13F8DC0');
  const [rotationStep, setRotationStep] = useState<number>(0);
  const [infiniteFloodActive, setInfiniteFloodActive] = useState<boolean>(false);
  const [apaStatusNotice, setApaStatusNotice] = useState<string>('Sovereign Title Ready · Cluster-006 · Zero Copyleft');
  const [radioLogs, setRadioLogs] = useState<string[]>([
    '[00:01.04] 🟢 CREW CHIEF: Asynchronous attention sink ring-buffer and infinite context retention engine initialized · 8 buffers linked',
    '[00:01.08] 🟢 TELEMETRY: Attention sink token preservation verified at 43,200 GB/s with zero context overflow',
  ]);

  const currentCorridor =
    CORRIDORS.find((item) => item.id === selectedCorridorId) || CORRIDORS[0];

  const appendRadioLog = (line1: string, line2: string) => {
    setRadioLogs([line1, line2]);
  };

  const handleCorridorChange = (newId: string) => {
    setSelectedCorridorId(newId);
    const found = CORRIDORS.find((item) => item.id === newId) || CORRIDORS[0];
    setThroughputGbs(found.throughputGbs);
    setSinkLatencyUs(found.latencyUs);
    const sinkTag = String(found.sinkCount) + '-TOK';
    setBuffers((prev) =>
      prev.map((buf) => ({
        ...buf,
        sinkLabel: sinkTag,
      }))
    );
    appendRadioLog(
      '[00:02.12] 🟢 CREW CHIEF: Switched synthetic attention sink corridor to ' + found.id,
      '[00:02.16] 🟢 TELEMETRY: RingThroughput: ' +
        found.throughputGbs.toLocaleString() +
        ' GB/s · Sink Latency: ' +
        found.latencyUs.toFixed(2) +
        ' µs'
    );
  };

  // Trigger Attention Sink Buffer Burst
  const handleInjectSinkBurst = () => {
    const nextStep = rotationStep + 1;
    setRotationStep(nextStep);
    const nextThroughput = Math.min(46800, currentCorridor.throughputGbs + 1600);
    setThroughputGbs(nextThroughput);
    setSinkLatencyUs(0.01);
    setProcessedUnits((prev) => prev + 256000);
    setEngineXpK((prev) => Number((prev + 2.5).toFixed(1)));
    setSinkStateText('Burst Retention Active');
    setGlobalPtrHex('0x' + (0x13f8dc0 + nextStep * 0x10).toString(16).toUpperCase());

    setBuffers((prev) =>
      prev.map((buf, idx) => {
        const rotatedOffset = ((idx + nextStep) % 8) * 0x10;
        return {
          ...buf,
          hexPtr: '0x' + (0x14000 + rotatedOffset).toString(16),
          tokensLabel: '320K',
          latencyLabel: '0.01ms',
          stateLabel: 'CYCLING · LOCKED',
          rollingVector: buf.rollingVector.map((v) => Number((v + 0.04).toFixed(2))),
        };
      })
    );

    appendRadioLog(
      '[00:03.40] 🟠 CREW CHIEF: Trigger Attention Sink Buffer Burst absorbed across R0-R7 with zero context overflow',
      '[00:03.44] 🟢 TELEMETRY: Ring Throughput: ' +
        nextThroughput.toLocaleString() +
        ' GB/s · Sink Latency: 0.01 µs · Active Buffers: 8 Buffers'
    );
  };

  // Inject Infinite Token Flood (Force Ring Pointer Rotation)
  const handleToggleInfiniteFlood = () => {
    const nextFlood = !infiniteFloodActive;
    setInfiniteFloodActive(nextFlood);
    const nextStep = rotationStep + 2;
    setRotationStep(nextStep);

    if (nextFlood) {
      setThroughputGbs(44800);
      setSinkLatencyUs(0.01);
      setProcessedUnits((prev) => prev + 512000);
      setEngineXpK((prev) => Number((prev + 5.0).toFixed(1)));
      setSinkStateText('Infinite Flood Locked');
      setGlobalPtrHex('0x' + (0x13f8dc0 + nextStep * 0x10).toString(16).toUpperCase());
      setBuffers((prev) =>
        prev.map((buf, idx) => {
          const rotatedOffset = ((idx + nextStep) % 8) * 0x10;
          return {
            ...buf,
            hexPtr: '0x' + (0x14000 + rotatedOffset).toString(16),
            tokensLabel: '512K',
            latencyLabel: '0.01ms',
            stateLabel: 'CYCLING · LOCKED',
            rollingVector: buf.rollingVector.map((v) => Number((v + 0.09).toFixed(2))),
          };
        })
      );
      appendRadioLog(
        '[00:04.18] 🔵 CREW CHIEF: Inject Infinite Token Flood active · Non-blocking ring pointer rotation engaged',
        '[00:04.22] 🟢 TELEMETRY: S_sink = Concat(K_[0:4], K_rolling(t)) verified · Processed Tokens: ' +
          (processedUnits + 512000).toLocaleString() +
          ' Units'
      );
    } else {
      setThroughputGbs(currentCorridor.throughputGbs);
      setSinkLatencyUs(currentCorridor.latencyUs);
      setSinkStateText('Retention Active');
      setBuffers((prev) =>
        prev.map((buf) => ({
          ...buf,
          tokensLabel: '256K',
          latencyLabel: '0.02ms',
          stateLabel: 'CYCLING · LOCKED',
        }))
      );
      appendRadioLog(
        '[00:04.50] 🟢 CREW CHIEF: Infinite token flood disengaged · Nominal ring cadence restored across 8 buffers',
        '[00:04.55] 🟢 TELEMETRY: Ring Throughput: ' +
          currentCorridor.throughputGbs.toLocaleString() +
          ' GB/s · Sink State: Retention Active'
      );
    }
  };

  // Step Asynchronous Retention Pass
  const handleStepRetentionPass = () => {
    const nextStep = rotationStep + 1;
    setRotationStep(nextStep);
    setProcessedUnits((prev) => prev + 64000);
    setEngineXpK((prev) => Number((prev + 1.2).toFixed(1)));
    setSinkStateText('Retention Active');
    setGlobalPtrHex('0x' + (0x13f8dc0 + nextStep * 0x10).toString(16).toUpperCase());

    setBuffers((prev) =>
      prev.map((buf, idx) => {
        const rotatedOffset = ((idx + nextStep) % 8) * 0x10;
        return {
          ...buf,
          hexPtr: '0x' + (0x14000 + rotatedOffset).toString(16),
          rollingVector: buf.rollingVector.map((v) => Number((v + 0.02).toFixed(2))),
        };
      })
    );

    appendRadioLog(
      '[00:05.10] 🟢 CREW CHIEF: Step Asynchronous Retention Pass complete · Sub-microsecond barrier sync locked',
      '[00:05.14] 🟢 TELEMETRY: Processed Tokens: ' +
        (processedUnits + 64000).toLocaleString() +
        ' Units · Sink Latency: ' +
        sinkLatencyUs.toFixed(2) +
        ' µs'
    );
  };

  // Flush Ring Buffers & Re-Zero Attention Arenas
  const handleFlushRingBuffers = () => {
    setRotationStep(0);
    setInfiniteFloodActive(false);
    setSelectedCorridorId('SINK-CORRIDOR-ALPHA');
    setThroughputGbs(43200);
    setSinkLatencyUs(0.01);
    setProcessedUnits(8064000);
    setEngineXpK(75.0);
    setSinkStateText('Retention Active');
    setGlobalPtrHex('0x13F8DC0');
    setSelectedBufferId(3);
    setBuffers(INITIAL_BUFFERS);

    appendRadioLog(
      '[00:01.04] 🟢 CREW CHIEF: Asynchronous attention sink ring-buffer and infinite context retention engine initialized · 8 buffers linked',
      '[00:01.08] 🟢 TELEMETRY: Attention sink token preservation verified at 43,200 GB/s with zero context overflow'
    );
  };

  const activeBuffer =
    buffers.find((item) => item.id === selectedBufferId) || buffers[3];

  const saturationPct = Math.min(100, Math.round((throughputGbs / 48000) * 100));

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP HEADER ROW 1 */}
      <header className="flex flex-col gap-0.5 w-full shrink-0">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Title & Flagship tag */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-base md:text-lg font-mono font-bold tracking-tight text-white">
              GF-T3-286
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 rounded">
              FLAGSHIP
            </span>
          </div>

          {/* Right: Corridor dropdown and micro action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <label htmlFor="corridor-select" className="sr-only">
              Synthetic Attention Sink Corridor
            </label>
            <select
              id="corridor-select"
              value={selectedCorridorId}
              onChange={(e) => handleCorridorChange(e.target.value)}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-[#00F0FF]"
              title={currentCorridor.label}
            >
              {CORRIDORS.map((corridor) => (
                <option key={corridor.id} value={corridor.id}>
                  {corridor.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setActiveTab('Sink');
                handleInjectSinkBurst();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-slate-700 rounded transition-colors cursor-pointer"
            >
              [Sink]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Ring');
                handleToggleInfiniteFlood();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-slate-700 rounded transition-colors cursor-pointer"
            >
              [Ring]
            </button>
            <button
              type="button"
              onClick={handleStepRetentionPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* TOP HEADER ROW 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          Attention Sink · Ring Buffer · Infinite Context
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 Grid) */}
      <section
        aria-label="Arcade HUD Telemetry Ribbon"
        className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: SINK NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              SINK NITRO
            </span>
            <span className="font-mono text-lg font-bold text-[#00F0FF] leading-none">
              {throughputGbs.toLocaleString()} GB/s
            </span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden my-1 border border-slate-800">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(saturationPct) + '%' }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Ring Throughput Saturation</span>
            <span className="text-[#00F0FF] font-bold">{saturationPct}%</span>
          </div>
        </div>

        {/* Card 2: RING STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              RING STREAK
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded">
              🔥 SINK-RING
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#FF9F0A] leading-tight">
            {sinkLatencyUs.toFixed(2)} µs
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Sink Latency</span>
            <span className="text-emerald-400 font-bold">ZERO-STALL</span>
          </div>
        </div>

        {/* Card 3: ACTIVE BUFFERS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              ACTIVE BUFFERS
            </span>
            <span className="font-mono text-sm md:text-base font-bold text-white leading-none">
              BUFFERS: 8/8
            </span>
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-1">
            {buffers.map((buf) => {
              const isSelected = buf.id === selectedBufferId;
              return (
                <button
                  key={buf.tag}
                  type="button"
                  onClick={() => setSelectedBufferId(buf.id)}
                  className={
                    'text-[9px] font-mono font-bold py-0.5 rounded text-center transition-colors cursor-pointer ' +
                    (isSelected
                      ? 'bg-[#00F0FF] text-slate-950'
                      : 'bg-slate-950 text-cyan-300 border border-slate-800 hover:border-cyan-500')
                  }
                >
                  {buf.tag}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Active Buffers: 8 Buffers</span>
            <span className="text-emerald-400 font-bold">SYNC LOCKED</span>
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              +{engineXpK.toFixed(1)}k ENGINE XP
            </span>
          </div>
          <div className="font-mono text-base md:text-lg font-bold text-white leading-tight truncate">
            {processedUnits.toLocaleString()} UNITS
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Sink State: {sinkStateText}</span>
            <span className="text-cyan-300 font-bold">100%</span>
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {TABS.map((tab) => {
          const isCurrent = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
                (isCurrent
                  ? 'bg-[#00F0FF] text-slate-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER (Strictly clean of action buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        {'VIEW: ' +
          activeTab.toUpperCase() +
          ' · PTR: ' +
          globalPtrHex +
          ' · MODE: ' +
          currentCorridor.mode +
          ' · BUFFERS: 8 · VEC: [4.81, 4.85, 4.82, 4.84]'}
      </div>

      {/* CENTER WORKSPACE: INTERACTIVE BUFFER MATRIX BAY (R0-R7) + CONTEXTUAL TAB OVERLAY */}
      <main className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden my-0.5">
        {/* Always render the 8 Buffer Cards (R0-R7) in the required 4x2 grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1 bg-slate-950/70 border border-slate-800/90 rounded-lg">
          {buffers.map((buf) => {
            const isSelected = buf.id === selectedBufferId;
            return (
              <div
                key={buf.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedBufferId(buf.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedBufferId(buf.id);
                  }
                }}
                className={
                  'p-1.5 rounded border transition-colors cursor-pointer flex flex-col justify-between ' +
                  (isSelected
                    ? 'bg-slate-900 border-[#00F0FF] shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700')
                }
              >
                {/* Line 1 (Title & Hex) */}
                <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                  <span>{buf.title}</span>
                  <span className="text-slate-300">{buf.hexPtr}</span>
                </div>

                {/* Line 2 (Tokens & Retention) */}
                <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300 my-0.5">
                  <span>TOK: {buf.tokensLabel}</span>
                  <span>SINK: {buf.sinkLabel}</span>
                </div>

                {/* Line 3 (Latency & State) */}
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-[#FF9F0A] font-bold">{buf.latencyLabel}</span>
                  <span className="text-emerald-400 font-bold">{buf.stateLabel}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tab-Specific Telemetry Strip / APA Sovereign Buyout Drawer (Strictly inside APA tab for buyout CTAs) */}
        {activeTab === 'APA' ? (
          <div className="bg-slate-900/90 border border-[#FF9F0A]/50 rounded-lg p-1.5 flex flex-col md:flex-row items-center justify-between gap-2 shrink-0">
            <div className="text-[11px] font-mono text-slate-200 flex flex-col gap-0.5">
              <span className="font-bold text-[#FF9F0A]">
                CHASSIS: GF-T3-286 · CLUSTER-006 · TRACK 3 FLAGSHIP ENGINE
              </span>
              <span className="text-[10px] text-slate-300">
                {apaStatusNotice} · Retail Price Benchmark Tier · 100% Pure APA Title Transfer
              </span>
            </div>
            <div className="flex flex-col gap-1 w-full md:w-64 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setApaStatusNotice('APA Title Acquisition Dossier Dispatched · Escrow Gate Ready')
                }
                className="w-full py-1 px-2 text-[10px] font-mono font-bold bg-[#00F0FF] text-slate-950 rounded hover:opacity-90 transition-opacity cursor-pointer text-center"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() =>
                  setApaStatusNotice('Cluster-006 Vault Buyout Telemetry Package Queued')
                }
                className="w-full py-1 px-2 text-[10px] font-mono font-bold bg-slate-950 text-[#FF9F0A] border border-[#FF9F0A]/60 rounded hover:bg-slate-800 transition-colors cursor-pointer text-center"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/70 border border-slate-800 rounded px-2 py-1 flex items-center justify-between text-[10px] font-mono text-slate-300 shrink-0">
            <span className="truncate">
              {activeTab === 'Mesh' &&
                'CORRIDOR: ' + currentCorridor.label + ' · S_sink = Concat(K_[0:4], K_rolling(t))'}
              {activeTab === 'Sink' &&
                'PINNED SINK ANCHORS K_[0:4]: [' +
                  activeBuffer.sinkVector.join(', ') +
                  '] · SOFTMAX MASS STABLE: 99.94%'}
              {activeTab === 'Ring' &&
                'ROLLING KV WINDOW (' +
                  activeBuffer.tag +
                  '): [' +
                  activeBuffer.rollingVector.join(', ') +
                  '] · ROTATION STEP: ' +
                  String(rotationStep)}
              {activeTab === 'Stats' &&
                'RING THROUGHPUT: ' +
                  throughputGbs.toLocaleString() +
                  ' GB/s · SINK LATENCY: ' +
                  sinkLatencyUs.toFixed(2) +
                  ' µs · PROCESSED TOKENS: ' +
                  processedUnits.toLocaleString() +
                  ' UNITS'}
            </span>
            <span className="text-emerald-400 font-bold shrink-0 ml-2">
              GATE 01-04 PASS
            </span>
          </div>
        )}
      </main>

      {/* COMPACT SINK TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {activeBuffer.tag +
          ' · TOK: ' +
          activeBuffer.tokensLabel +
          ' · SINK: ' +
          activeBuffer.sinkLabel +
          ' · SYNC: ' +
          String(activeBuffer.syncPct) +
          '% · PTR ' +
          activeBuffer.hexPtr +
          ' · SINK: OK · LOCKED'}
      </div>

      {/* TACTICAL LAUNCH CONTROL SWITCHES */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleInjectSinkBurst}
          className="border border-[#FF9F0A] bg-[#FF9F0A]/10 hover:bg-[#FF9F0A]/20 text-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
          title="Trigger Attention Sink Buffer Burst"
        >
          💥 INJECT ATTENTION SINK BURST
        </button>

        <button
          type="button"
          onClick={handleToggleInfiniteFlood}
          className="border border-[#00F0FF] bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.25)] rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
          title="Inject Infinite Token Flood (Force Ring Pointer Rotation)"
        >
          ⚡ TOGGLE INFINITE TOKEN FLOOD
        </button>

        <button
          type="button"
          onClick={handleStepRetentionPass}
          className="border border-emerald-500 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
          title="Step Asynchronous Retention Pass"
        >
          🚀 STEP ASYNCHRONOUS RETENTION PASS
        </button>

        <button
          type="button"
          onClick={handleFlushRingBuffers}
          className="border border-rose-500 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
          title="Flush Ring Buffers & Re-Zero Attention Arenas"
        >
          🔄 FLUSH RING BUFFERS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        <div className="truncate">{radioLogs[0]}</div>
        <div className="truncate text-cyan-300">{radioLogs[1]}</div>
      </footer>
    </div>
  );
}
