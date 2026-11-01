/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

type TabKey = 'Mesh' | 'Unif' | 'Page' | 'Stats' | 'APA';

interface CorridorSpec {
  id: string;
  label: string;
  mode: string;
  baseThroughput: number;
  baseLatencyUs: number;
  dmaEfficiencyPct: number;
  pcieTau: number;
}

interface UnifiedPageCard {
  index: number;
  pageId: string;
  title: string;
  hexPtr: string;
  tokensK: number;
  unifPct: number;
  syncPct: number;
  latencyMs: string;
  status: string;
  dmaState: string;
  hostNorm: number;
  deviceNorm: number;
}

const CORRIDORS: CorridorSpec[] = [
  {
    id: 'UNIFIED-CORRIDOR-ALPHA',
    label: 'UNIFIED-CORRIDOR-ALPHA (DYNAMIC-ZERO-COPY-FABRIC · 150400-GB/S)',
    mode: 'UNIFIED_MEMORY',
    baseThroughput: 150400,
    baseLatencyUs: 0.01,
    dmaEfficiencyPct: 100,
    pcieTau: 1.0,
  },
  {
    id: 'UNIFIED-CORRIDOR-BRAVO',
    label: 'UNIFIED-CORRIDOR-BRAVO (HOST-DEVICE-PAGING-ENGINE)',
    mode: 'HOST_DEVICE_PAGING',
    baseThroughput: 142800,
    baseLatencyUs: 0.02,
    dmaEfficiencyPct: 98,
    pcieTau: 0.95,
  },
  {
    id: 'UNIFIED-CORRIDOR-GAMMA',
    label: 'UNIFIED-CORRIDOR-GAMMA (NON-BLOCKING-DMA-MIGRATION-ROUTER)',
    mode: 'NON_BLOCKING_DMA',
    baseThroughput: 148200,
    baseLatencyUs: 0.01,
    dmaEfficiencyPct: 99,
    pcieTau: 0.985,
  },
  {
    id: 'UNIFIED-CORRIDOR-DELTA',
    label: 'UNIFIED-CORRIDOR-DELTA (FALLBACK-EXPLICIT-COPY-PASS)',
    mode: 'EXPLICIT_COPY_PASS',
    baseThroughput: 96400,
    baseLatencyUs: 0.08,
    dmaEfficiencyPct: 85,
    pcieTau: 0.64,
  },
];

const INITIAL_PAGES: UnifiedPageCard[] = [
  {
    index: 0,
    pageId: 'U0',
    title: 'Page 0 (U0)',
    hexPtr: '0x5A000',
    tokensK: 256,
    unifPct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'MIGRATED · LOCKED',
    dmaState: 'OK',
    hostNorm: 1.08,
    deviceNorm: 1.09,
  },
  {
    index: 1,
    pageId: 'U1',
    title: 'Page 1 (U1)',
    hexPtr: '0x5A010',
    tokensK: 256,
    unifPct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'MIGRATED · LOCKED',
    dmaState: 'OK',
    hostNorm: 1.08,
    deviceNorm: 1.09,
  },
  {
    index: 2,
    pageId: 'U2',
    title: 'Page 2 (U2)',
    hexPtr: '0x5A020',
    tokensK: 256,
    unifPct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'MIGRATED · LOCKED',
    dmaState: 'OK',
    hostNorm: 1.08,
    deviceNorm: 1.09,
  },
  {
    index: 3,
    pageId: 'U3',
    title: 'Page 3 (U3)',
    hexPtr: '0x5A030',
    tokensK: 256,
    unifPct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'MIGRATED · LOCKED',
    dmaState: 'OK',
    hostNorm: 1.08,
    deviceNorm: 1.09,
  },
  {
    index: 4,
    pageId: 'U4',
    title: 'Page 4 (U4)',
    hexPtr: '0x5A040',
    tokensK: 256,
    unifPct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'MIGRATED · LOCKED',
    dmaState: 'OK',
    hostNorm: 1.08,
    deviceNorm: 1.09,
  },
  {
    index: 5,
    pageId: 'U5',
    title: 'Page 5 (U5)',
    hexPtr: '0x5A050',
    tokensK: 256,
    unifPct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'MIGRATED · LOCKED',
    dmaState: 'OK',
    hostNorm: 1.08,
    deviceNorm: 1.09,
  },
  {
    index: 6,
    pageId: 'U6',
    title: 'Page 6 (U6)',
    hexPtr: '0x5A060',
    tokensK: 256,
    unifPct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'MIGRATED · LOCKED',
    dmaState: 'OK',
    hostNorm: 1.08,
    deviceNorm: 1.09,
  },
  {
    index: 7,
    pageId: 'U7',
    title: 'Page 7 (U7)',
    hexPtr: '0x5A070',
    tokensK: 256,
    unifPct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'MIGRATED · LOCKED',
    dmaState: 'OK',
    hostNorm: 1.08,
    deviceNorm: 1.09,
  },
];

const INITIAL_LOGS: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: Asynchronous zero-copy unified memory and host-device paging engine initialized · 8 pages linked',
  '[00:01.08] 🟢 TELEMETRY: PCIe Gen5 DMA page migration verified at 150,400 GB/s with zero pipeline stalls',
];

const TABS: TabKey[] = ['Mesh', 'Unif', 'Page', 'Stats', 'APA'];

export default function App() {
  const [selectedCorridor, setSelectedCorridor] = useState<CorridorSpec>(CORRIDORS[0]);
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [pages, setPages] = useState<UnifiedPageCard[]>(INITIAL_PAGES);
  const [selectedPageIdx, setSelectedPageIdx] = useState<number>(3);
  const [throughputGbs, setThroughputGbs] = useState<number>(150400);
  const [faultLatencyUs, setFaultLatencyUs] = useState<number>(0.01);
  const [activePagesCount, setActivePagesCount] = useState<number>(8);
  const [processedTokens, setProcessedTokens] = useState<number>(35800000);
  const [engineXpK, setEngineXpK] = useState<number>(75.0);
  const [memoryState, setMemoryState] = useState<string>('Active');
  const [pcieSpikeActive, setPcieSpikeActive] = useState<boolean>(false);
  const [vectorValues, setVectorValues] = useState<number[]>([1.08, 1.09, 1.08, 1.09]);
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_LOGS);
  const [apaDispatchNotice, setApaDispatchNotice] = useState<string>(
    'Sovereign IP Repository Ready · 100% Pure APA Transfer · Zero Copyleft'
  );

  const selectedPage = pages[selectedPageIdx] || pages[3];

  const computeUnifiedOperator = () => {
    let sum = 0;
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const coherence = 1.0 / (1.0 + Math.abs(p.hostNorm - p.deviceNorm));
      sum += (p.hostNorm + p.deviceNorm) * 0.5 * selectedCorridor.pcieTau * coherence;
    }
    return sum.toFixed(4);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = CORRIDORS.find((c) => c.label === e.target.value) || CORRIDORS[0];
    setSelectedCorridor(found);
    setThroughputGbs(found.baseThroughput);
    setFaultLatencyUs(found.baseLatencyUs);
    setMemoryState('Active');
    setRadioLogs([
      '[00:02.12] 🟢 CREW CHIEF: Switched synthetic unified memory corridor to ' + found.id,
      '[00:02.16] 🟢 TELEMETRY: Migration Throughput: ' +
        found.baseThroughput.toLocaleString() +
        ' GB/s · Page Fault Latency: ' +
        found.baseLatencyUs.toFixed(2) +
        ' µs',
    ]);
  };

  const handleTriggerUnifiedBurst = () => {
    const nextThroughput = Math.min(162800, throughputGbs + 1600);
    const nextTokens = processedTokens + 1200000;
    const nextXp = Number((engineXpK + 4.5).toFixed(1));
    setThroughputGbs(nextThroughput);
    setProcessedTokens(nextTokens);
    setEngineXpK(nextXp);
    setMemoryState('Active');
    setPages((prev) =>
      prev.map((p, idx) => ({
        ...p,
        tokensK: Math.min(512, p.tokensK + 32),
        unifPct: 100,
        syncPct: 100,
        latencyMs: '0.01ms',
        status: idx % 2 === 0 ? 'BURST · LOCKED' : 'MIGRATED · LOCKED',
        dmaState: 'OK',
      }))
    );
    setRadioLogs([
      '[00:03.05] 🟠 CREW CHIEF: Trigger Unified Memory Burst executed · Non-blocking DMA prefault locked across 8 pages',
      '[00:03.09] 🟢 TELEMETRY: Migration Throughput: ' +
        nextThroughput.toLocaleString() +
        ' GB/s · Processed Tokens: ' +
        nextTokens.toLocaleString() +
        ' Units',
    ]);
  };

  const handleTogglePcieSpike = () => {
    const nextSpike = !pcieSpikeActive;
    setPcieSpikeActive(nextSpike);
    if (nextSpike) {
      const tunedThroughput = Math.round(selectedCorridor.baseThroughput * 0.96);
      setThroughputGbs(tunedThroughput);
      setFaultLatencyUs(0.02);
      setMemoryState('Pre-Fault Tuned');
      setPages((prev) =>
        prev.map((p) => ({
          ...p,
          latencyMs: '0.03ms',
          status: 'PRE-FAULT · TUNED',
          dmaState: 'TUNED',
        }))
      );
      setRadioLogs([
        '[00:04.18] ⚡ CREW CHIEF: PCIe Bandwidth Saturation Spike injected · Forced dynamic page pre-fault tuning engaged',
        '[00:04.22] 🟢 TELEMETRY: Zero host staging stall · Migration Throughput: ' +
          tunedThroughput.toLocaleString() +
          ' GB/s · Page Fault Latency: 0.02 µs',
      ]);
    } else {
      setThroughputGbs(selectedCorridor.baseThroughput);
      setFaultLatencyUs(selectedCorridor.baseLatencyUs);
      setMemoryState('Active');
      setPages((prev) =>
        prev.map((p) => ({
          ...p,
          latencyMs: '0.02ms',
          status: 'MIGRATED · LOCKED',
          dmaState: 'OK',
        }))
      );
      setRadioLogs([
        '[00:04.40] 🟢 CREW CHIEF: PCIe saturation spike cleared · Nominal zero-copy fabric restored',
        '[00:04.44] 🟢 TELEMETRY: Migration Throughput: ' +
          selectedCorridor.baseThroughput.toLocaleString() +
          ' GB/s · Page Fault Latency: ' +
          selectedCorridor.baseLatencyUs.toFixed(2) +
          ' µs',
      ]);
    }
  };

  const handleStepMigrationPass = () => {
    const nextIdx = (selectedPageIdx + 1) % 8;
    const nextTokens = processedTokens + 640000;
    const nextXp = Number((engineXpK + 2.5).toFixed(1));
    setSelectedPageIdx(nextIdx);
    setProcessedTokens(nextTokens);
    setEngineXpK(nextXp);
    setVectorValues([1.09, 1.08, 1.09, 1.08]);
    setPages((prev) =>
      prev.map((p, idx) => ({
        ...p,
        hostNorm: Number((1.08 + idx * 0.001).toFixed(3)),
        deviceNorm: Number((1.09 + idx * 0.001).toFixed(3)),
        status: idx === nextIdx ? 'STEPPED · LOCKED' : 'MIGRATED · LOCKED',
      }))
    );
    const targetPage = pages[nextIdx] || INITIAL_PAGES[0];
    setRadioLogs([
      '[00:05.11] 🚀 CREW CHIEF: Stepped Asynchronous Migration Pass -> Active pointer ' +
        targetPage.hexPtr +
        ' (' +
        targetPage.pageId +
        ')',
      '[00:05.15] 🟢 TELEMETRY: Sub-microsecond barrier synchronized · Active Pages: 8 Pages · Memory State: ' +
        memoryState,
    ]);
  };

  const handleFlushArenas = () => {
    setSelectedCorridor(CORRIDORS[0]);
    setPages(INITIAL_PAGES);
    setSelectedPageIdx(3);
    setThroughputGbs(150400);
    setFaultLatencyUs(0.01);
    setActivePagesCount(8);
    setProcessedTokens(35800000);
    setEngineXpK(75.0);
    setMemoryState('Active');
    setPcieSpikeActive(false);
    setVectorValues([1.08, 1.09, 1.08, 1.09]);
    setRadioLogs(INITIAL_LOGS);
  };

  const saturationPct = Math.min(100, Math.round((throughputGbs / 150400) * 100));

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header Row 1 */}
      <header className="flex flex-col gap-0.5 w-full shrink-0">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-mono font-bold tracking-tight text-white">
              GF-T3-351
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 rounded">
              FLAGSHIP
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1 shrink-0 overflow-hidden">
            <select
              aria-label="Unified Memory Corridor Selector"
              value={selectedCorridor.label}
              onChange={handleCorridorChange}
              className="max-w-[120px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded shrink-0 focus:outline-none focus:border-[#00F0FF]"
            >
              {CORRIDORS.map((corridor) => (
                <option key={corridor.id} value={corridor.label}>
                  {corridor.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Unif');
                handleTriggerUnifiedBurst();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-cyan-500/40 rounded transition-colors cursor-pointer"
            >
              [Unif]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Page');
                handleStepMigrationPass();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-amber-500/40 rounded transition-colors cursor-pointer"
            >
              [Page]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Mesh');
                handleStepMigrationPass();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap truncate">
          Unified Memory · Zero-Copy PCIe · Massive Model Execution
        </div>
      </header>

      {/* 4-Card Arcade HUD Ribbon (2x2 grid above the fold) */}
      <section
        aria-label="Arcade Telemetry HUD Ribbon"
        className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: UNIF NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              UNIF NITRO
            </span>
            <span className="text-[10px] font-mono text-cyan-300">
              {'SAT: ' + String(saturationPct) + '%'}
            </span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-tight truncate">
            {throughputGbs.toLocaleString() + ' GB/s'}
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden border border-slate-800 my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(saturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Migration Throughput Saturation
          </div>
        </div>

        {/* Card 2: PAGE STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              PAGE STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">
              🔥 ZERO-COPY
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight truncate">
            {faultLatencyUs.toFixed(2) + ' µs'}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            Zero Host Staging Stall
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Page Fault Latency
          </div>
        </div>

        {/* Card 3: ACTIVE PAGES */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              ACTIVE PAGES
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              {'Active Pages: ' + String(activePagesCount) + ' Pages'}
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight truncate">
            {'PAGES: ' + String(activePagesCount) + '/8'}
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {pages.map((p, idx) => (
              <button
                key={p.pageId}
                type="button"
                onClick={() => setSelectedPageIdx(idx)}
                className={
                  'text-[8px] font-mono font-bold rounded py-0.2 text-center border cursor-pointer ' +
                  (idx === selectedPageIdx
                    ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-white'
                    : 'bg-slate-950 border-slate-800 text-cyan-300')
                }
              >
                {p.pageId}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            {'F1 Gear Shift Interlock [U0..U7] · Focus: ' + selectedPage.pageId}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">
              {'+' + engineXpK.toFixed(1) + 'k ENGINE XP'}
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight truncate">
            {processedTokens.toLocaleString() + ' UNITS'}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            {'Processed Tokens: ' + processedTokens.toLocaleString() + ' Units'}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            {'Memory State: ' + memoryState}
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Workspace Modes"
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
                'text-xs font-mono font-bold py-1 rounded transition-colors cursor-pointer whitespace-nowrap ' +
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

      {/* Streamlined Mesh Info Subheader */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        {'VIEW: ' +
          activeTab.toUpperCase() +
          ' · PTR: 0x5AF8DC0 · MODE: ' +
          selectedCorridor.mode +
          ' · PAGES: ' +
          String(activePagesCount) +
          ' · VEC: [' +
          vectorValues.map((v) => v.toFixed(2)).join(', ') +
          ']'}
      </div>

      {/* Main Dynamic Viewport Bay + Always-Accessible Page Matrix */}
      <main className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden my-0.5">
        {activeTab === 'APA' ? (
          <div className="flex-1 min-h-0 bg-slate-950/90 border border-slate-800 rounded-lg p-2 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
              <div>
                <div className="text-xs font-mono font-bold text-[#00F0FF]">
                  GF-T3-351 · SOVEREIGN ASSET PURCHASE AGREEMENT (APA)
                </div>
                <div className="text-[10px] font-mono text-slate-300">
                  Cluster Assignment: CLUSTER-006 · Track 3 Flagship Engine · 100% Title Transfer
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400">
                4-GATE DYNO VERIFIED
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono">
              <div className="bg-slate-900/80 border border-slate-800 rounded p-1.5">
                <div className="text-slate-400">Retail Price Tier</div>
                <div className="text-white font-bold">75,000 - 150,000+ Units</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded p-1.5">
                <div className="text-slate-400">Full Engine APA Anchor</div>
                <div className="text-cyan-300 font-bold">35,000 - 65,000 Units</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded p-1.5">
                <div className="text-slate-400">License Contamination</div>
                <div className="text-emerald-400 font-bold">0.0% Copyleft (MIT)</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded p-1.5">
                <div className="text-slate-400">Pytest Dyno Coverage</div>
                <div className="text-amber-400 font-bold">92.4% Verified</div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-cyan-300 truncate">
              {apaDispatchNotice}
            </div>

            {/* Anti-Clutter Vertical Flex Action CTAs */}
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setApaDispatchNotice(
                    'APA Title Transfer Dossier Dispatched · Standalone Repo Bundle Locked for GF-T3-351'
                  );
                  setRadioLogs([
                    '[00:07.01] 🟢 CREW CHIEF: ACQUIRE TITLE (APA) initiated for GF-T3-351 · 100% sovereign IP assignment ready',
                    '[00:07.05] 🟢 TELEMETRY: Clean-room MIT bundle verified · Zero recurring seat licenses',
                  ]);
                }}
                className="w-full py-1.5 px-3 bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF] border border-[#00F0FF]/60 rounded font-mono text-xs font-bold text-center cursor-pointer transition-colors"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setApaDispatchNotice(
                    'Vault Buyout Escrow Gate Opened · CLUSTER-006 Transport Package Spec Queued'
                  );
                  setRadioLogs([
                    '[00:07.12] 🟠 CREW CHIEF: INQUIRE VAULT BUYOUT logged · CLUSTER-006 allocation reserved',
                    '[00:07.16] 🟢 TELEMETRY: Proof-of-Funds verification gate active · Zero company equity dilution',
                  ]);
                }}
                className="w-full py-1.5 px-3 bg-[#FF9F0A]/20 hover:bg-[#FF9F0A]/30 text-[#FF9F0A] border border-[#FF9F0A]/60 rounded font-mono text-xs font-bold text-center cursor-pointer transition-colors"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col justify-between bg-slate-950/70 border border-slate-800/90 rounded-lg p-1 overflow-hidden">
            {/* Mode-Specific Telemetry Strip */}
            <div className="flex items-center justify-between gap-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 border-b border-slate-800/80 shrink-0">
              <span className="truncate">
                {activeTab === 'Mesh' &&
                  'ZERO-COPY MESH INTERLOCK · U_memory Integral: ' + computeUnifiedOperator()}
                {activeTab === 'Unif' &&
                  'UNIFIED ARENA OPERATOR · PCIe Gen5 Tau: ' +
                    selectedCorridor.pcieTau.toFixed(3) +
                    ' · Coherence: 99.98%'}
                {activeTab === 'Page' &&
                  'NON-BLOCKING DMA PREFAULT ROUTER · Focus Page: ' +
                    selectedPage.title +
                    ' (' +
                    selectedPage.hexPtr +
                    ')'}
                {activeTab === 'Stats' &&
                  'Migration Throughput: ' +
                    throughputGbs.toLocaleString() +
                    ' GB/s · Page Fault Latency: ' +
                    faultLatencyUs.toFixed(2) +
                    ' µs'}
              </span>
              <span className="text-cyan-300 shrink-0">
                {'DMA EFF: ' + String(selectedCorridor.dmaEfficiencyPct) + '%'}
              </span>
            </div>

            {/* Interactive Page Matrix Bay (U0–U7) in 2-row x 4-column grid */}
            <div className="grid grid-cols-4 gap-1 p-1 flex-1 min-h-0 items-stretch">
              {pages.map((page, idx) => {
                const isSelected = idx === selectedPageIdx;
                return (
                  <div
                    key={page.pageId}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedPageIdx(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedPageIdx(idx);
                      }
                    }}
                    className={
                      'flex flex-col justify-between rounded border p-1 transition-colors cursor-pointer ' +
                      (isSelected
                        ? 'bg-slate-900 border-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700')
                    }
                  >
                    {/* Line 1 (Title & Hex) */}
                    <div className="text-[10px] font-mono font-bold text-white flex justify-between items-center w-full px-1">
                      <span>{page.title}</span>
                      <span className="text-slate-400 font-normal">{page.hexPtr}</span>
                    </div>

                    {/* Line 2 (Tokens & Memory Load) */}
                    <div className="text-[8px] font-mono font-bold text-cyan-300 flex justify-between items-center w-full px-1">
                      <span>{'TOK: ' + String(page.tokensK) + 'K'}</span>
                      <span>{'UNIF: ' + String(page.unifPct) + '%'}</span>
                    </div>

                    {/* Line 3 (Latency & Status) */}
                    <div className="flex justify-between items-center text-[8px] font-mono text-slate-300 w-full px-1">
                      <span className="text-amber-400">{page.latencyMs}</span>
                      <span className="text-emerald-400">{page.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Compact Unified Memory Telemetry Inspector Strip */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {selectedPage.pageId +
          ' · TOK: ' +
          String(selectedPage.tokensK) +
          'K · UNIF: ' +
          String(selectedPage.unifPct) +
          '% · SYNC: ' +
          String(selectedPage.syncPct) +
          '% · PTR ' +
          selectedPage.hexPtr +
          ' · DMA: ' +
          selectedPage.dmaState +
          ' · LOCKED · PAGES: ' +
          String(activePagesCount) +
          ' · PCIE: GEN5'}
      </div>

      {/* Tactical Launch Control Switches */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleTriggerUnifiedBurst}
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full bg-amber-950/40 hover:bg-amber-900/50 text-[#FF9F0A] border-[#FF9F0A]/70 cursor-pointer transition-colors"
        >
          💥 INJECT UNIFIED MEMORY BURST
        </button>

        <button
          type="button"
          onClick={handleTogglePcieSpike}
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full bg-cyan-950/40 hover:bg-cyan-900/50 text-[#00F0FF] border-[#00F0FF]/80 shadow-[0_0_10px_rgba(0,240,255,0.2)] cursor-pointer transition-colors"
        >
          ⚡ TOGGLE PCIE BANDWIDTH SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepMigrationPass}
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border-emerald-500/70 cursor-pointer transition-colors"
        >
          🚀 STEP ASYNCHRONOUS MIGRATION PASS
        </button>

        <button
          type="button"
          onClick={handleFlushArenas}
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 border-rose-500/70 cursor-pointer transition-colors"
        >
          🔄 FLUSH UNIFIED ARENAS
        </button>
      </section>

      {/* Pit-Wall Radio Comms Log */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        {radioLogs.slice(0, 2).map((line, index) => (
          <div key={index} className="truncate">
            {line}
          </div>
        ))}
      </footer>
    </div>
  );
}
