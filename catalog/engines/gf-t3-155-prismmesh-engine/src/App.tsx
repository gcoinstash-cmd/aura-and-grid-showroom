/**
 * PrismMesh Engine // GF-T3-155
 * PBS MEV Auction & Deterministic Bundle Sequencing Core
 * Main Cockpit Application
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  GitBranch,
  BookOpen,
  ShieldCheck,
  Code2,
  Terminal,
  Activity,
  Zap,
} from 'lucide-react';
import { Header } from './components/Header';
import { AuctionPipelineTab } from './components/AuctionPipelineTab';
import { DagRadarTab } from './components/DagRadarTab';
import { EngineSpecTab } from './components/EngineSpecTab';
import { MonopolyVaultTab } from './components/MonopolyVaultTab';
import { CodeViewerTab } from './components/CodeViewerTab';
import {
  Bundle,
  AuctionResult,
  createInitialBundles,
  PrismMeshEngineTs,
  GAS_TARGET_BLOCK_MAX,
} from './core/mevEngineTs';
import {
  ENGINE_SPEC_MD,
  ENTERPRISE_APA_MD,
  LEGAL_IP_AUDIT_MD,
  PYTHON_CORE_CODE,
  PYTEST_CODE,
  DOCKERFILE_CODE,
} from './assets/vaultDocs';

export default function App() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'dag' | 'spec' | 'vault' | 'code'>('pipeline');
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [auctionResult, setAuctionResult] = useState<AuctionResult | null>(null);
  const [filterToxicMev, setFilterToxicMev] = useState(true);

  // Initialize engine & solve on mount
  useEffect(() => {
    const initial = createInitialBundles();
    setBundles(initial);
    const engine = new PrismMeshEngineTs(GAS_TARGET_BLOCK_MAX);
    const res = engine.solveAuction(initial, true);
    setAuctionResult(res);
  }, []);

  const handleRunAuction = (filterToxic: boolean) => {
    const engine = new PrismMeshEngineTs(GAS_TARGET_BLOCK_MAX);
    // Clone bundles to re-evaluate clean state
    const cleanCandidates: Bundle[] = bundles.map(b => ({
      ...b,
      status: 'PENDING',
      dagPriorityRank: undefined,
      statusMessage: undefined,
    }));
    const res = engine.solveAuction(cleanCandidates, filterToxic);
    setBundles(cleanCandidates);
    setAuctionResult(res);
  };

  const currentLatency = auctionResult?.executionLatencyUs ?? 10.4;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-medium">
      {/* Top Console Header with the 4 Required Telemetry Badges */}
      <Header currentLatencyUs={currentLatency} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Tabs (Single-Line Clean Buttons / Segmented Controls) */}
        <div className="p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-1 overflow-x-auto shadow-lg">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm tracking-tight flex items-center gap-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tab 1: Block Auction & Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab('dag')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm tracking-tight flex items-center gap-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeTab === 'dag'
                ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Tab 2: DAG Graph & MEV Radar</span>
          </button>

          <button
            onClick={() => setActiveTab('spec')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm tracking-tight flex items-center gap-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeTab === 'spec'
                ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Tab 3: ENGINE_SPEC.md</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm tracking-tight flex items-center gap-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Tab 4: Monopoly Vault & APA (20 kHz (0.48ms))</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm tracking-tight flex items-center gap-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Tab 5: Python Core & Dockerfile</span>
          </button>
        </div>

        {/* Tab Viewports */}
        {activeTab === 'pipeline' && (
          <AuctionPipelineTab
            bundles={bundles}
            setBundles={setBundles}
            auctionResult={auctionResult}
            setAuctionResult={setAuctionResult}
            onRunAuction={handleRunAuction}
            filterToxicMev={filterToxicMev}
            setFilterToxicMev={setFilterToxicMev}
          />
        )}

        {activeTab === 'dag' && (
          <DagRadarTab
            bundles={bundles}
            auctionResult={auctionResult}
          />
        )}

        {activeTab === 'spec' && (
          <EngineSpecTab
            specContent={ENGINE_SPEC_MD}
          />
        )}

        {activeTab === 'vault' && (
          <MonopolyVaultTab
            apaContent={ENTERPRISE_APA_MD}
            auditContent={LEGAL_IP_AUDIT_MD}
          />
        )}

        {activeTab === 'code' && (
          <CodeViewerTab
            pythonCode={PYTHON_CORE_CODE}
            testCode={PYTEST_CODE}
            dockerfileCode={DOCKERFILE_CODE}
          />
        )}
      </main>

      {/* Institutional Console Footer */}
      <footer className="border-t border-slate-900 bg-[#070a12] py-4 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">PRISMMESH ENGINE</span>
            <span>·</span>
            <span>GF-T3-155</span>
            <span>·</span>
            <span className="text-emerald-400 font-bold">100% CLEAN-ROOM PERMISSIVE</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Commercial Software Asset Standard</span>
            <span>·</span>
            <span>Sub-12µs Knapsack Allocator</span>
            <span>·</span>
            <span className="text-fuchsia-400 font-bold">20 kHz (0.48ms) Standalone APA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
