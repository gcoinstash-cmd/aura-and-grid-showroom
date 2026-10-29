/**
 * @license
 * SPDX-License-Identifier: MIT
 * GF-T3-215: APEX-215 Vector Embedding Quantization & HNSW Graph Index Engine
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  VectorIndexEngine,
  PartitionId,
  SearchResult,
  HNSWNode,
} from './engine/vectorEngine';
import { Header } from './components/Header';
import { HudRibbon } from './components/HudRibbon';
import { ChaosBar } from './components/ChaosBar';
import { HnswMeshTab } from './components/HnswMeshTab';
import { ProductQuantizationTab } from './components/ProductQuantizationTab';
import { VectorSearchTab } from './components/VectorSearchTab';
import { CentroidDriftTab } from './components/CentroidDriftTab';
import { TransferSpecTab } from './components/TransferSpecTab';
import { Network, Layers, Search, Compass, ShieldCheck } from 'lucide-react';

export type TabKey =
  | 'hnsw_mesh'
  | 'product_quantization'
  | 'vector_search'
  | 'centroid_drift'
  | 'transfer_spec';

export default function App() {
  const [activePartition, setActivePartition] = useState<PartitionId>('CORPUS-PARTITION-ALPHA');
  const [activeTab, setActiveTab] = useState<TabKey>('hnsw_mesh');
  const [versionNonce, setVersionNonce] = useState<number>(0);
  const [selectedNode, setSelectedNode] = useState<HNSWNode | null>(null);

  // Core Vector Engine instance
  const engine = useMemo(() => {
    return new VectorIndexEngine(activePartition);
  }, [activePartition, versionNonce]);

  // Active query vector
  const [activeQuery, setActiveQuery] = useState<Float32Array>(() => {
    return engine.generateVector(999);
  });

  // Active Search result
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  // Execute Search routine
  const handleExecuteSearch = useCallback(
    (k: number = 10, ef: number = 64) => {
      const result = engine.searchANN(activeQuery, k, ef);
      setSearchResult(result);
    },
    [engine, activeQuery]
  );

  // Initial search on mount or partition change
  useEffect(() => {
    const freshQuery = engine.generateVector(Math.floor(Math.random() * 500) + 500);
    setActiveQuery(freshQuery);
    const initialResult = engine.searchANN(freshQuery, 10, 64);
    setSearchResult(initialResult);
    setSelectedNode(null);
  }, [engine]);

  // Partition switcher
  const handleSelectPartition = (partition: PartitionId) => {
    setActivePartition(partition);
    setVersionNonce((v) => v + 1);
  };

  // Re-initialize engine
  const handleResetEngine = () => {
    setVersionNonce((v) => v + 1);
  };

  // Chaos Actions
  const handleHeavyIngestion = () => {
    engine.triggerHeavyIngestion(24);
    setVersionNonce((v) => v + 1);
    handleExecuteSearch(10, 64);
  };

  const handleSimulateDrift = () => {
    engine.triggerCentroidDrift(0.08);
    setVersionNonce((v) => v + 1);
    handleExecuteSearch(10, 64);
  };

  const handleRecalibrate = () => {
    engine.recalibrateCodebooks();
    setVersionNonce((v) => v + 1);
    handleExecuteSearch(10, 64);
  };

  const handlePruneLinks = () => {
    engine.pruneStaleLinks();
    setVersionNonce((v) => v + 1);
    handleExecuteSearch(10, 64);
  };

  const handleRandomizeQuery = () => {
    const q = engine.generateVector(Math.floor(Math.random() * 1000) + 100);
    setActiveQuery(q);
    const res = engine.searchANN(q, 10, 64);
    setSearchResult(res);
  };

  const totalIndexed = engine.nodes.size;
  const isDrifting = Math.abs(engine.driftOffset) > 0.001;

  const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
    { key: 'hnsw_mesh', label: 'Mesh', icon: <Network className="h-3.5 w-3.5" /> },
    { key: 'product_quantization', label: 'Quant', icon: <Layers className="h-3.5 w-3.5" /> },
    { key: 'vector_search', label: 'Search', icon: <Search className="h-3.5 w-3.5" /> },
    { key: 'centroid_drift', label: 'Drift', icon: <Compass className="h-3.5 w-3.5" /> },
    { key: 'transfer_spec', label: 'Transfer', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col font-sans">
      {/* 2-Row Docked Command Header */}
      <Header
        activePartition={activePartition}
        onSelectPartition={handleSelectPartition}
        onResetEngine={handleResetEngine}
      />

      {/* 4-Card Balanced HUD Grid */}
      <HudRibbon
        partition={engine.partition}
        searchLatencyMs={searchResult?.searchLatencyMs ?? 1.42}
        recallAt10={searchResult?.recallAtK ?? 98.4}
        totalIndexedVectors={totalIndexed}
      />

      {/* Tab Navigation Strip Mounted Directly Underneath HUD Ribbon */}
      <div className="px-4 bg-[#070A11]">
        <div className="w-full overflow-x-auto no-scrollbar scroll-smooth">
          <nav
            aria-label="Terminal Navigation Tabs"
            className="flex items-center justify-between gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl my-2 text-xs font-medium w-full"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={
                    'px-2 py-1 text-[11px] whitespace-nowrap shrink-0 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ' +
                    (isActive
                      ? 'bg-cyan-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60')
                  }
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tightened Chaos & Index Mutation Row */}
      <ChaosBar
        onRunQuery={() => handleExecuteSearch(10, 64)}
        onHeavyIngestion={handleHeavyIngestion}
        onSimulateDrift={handleSimulateDrift}
        onPruneLinks={handlePruneLinks}
        onRecalibrate={handleRecalibrate}
        isDrifting={isDrifting}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 bg-[#070A11]">
        {activeTab === 'hnsw_mesh' && (
          <HnswMeshTab
            engine={engine}
            searchResult={searchResult}
            onSelectNode={setSelectedNode}
            selectedNode={selectedNode}
          />
        )}

        {activeTab === 'product_quantization' && (
          <ProductQuantizationTab
            engine={engine}
            activeQuery={activeQuery}
          />
        )}

        {activeTab === 'vector_search' && (
          <VectorSearchTab
            engine={engine}
            searchResult={searchResult}
            onExecuteSearch={handleExecuteSearch}
            onRandomizeQuery={handleRandomizeQuery}
          />
        )}

        {activeTab === 'centroid_drift' && (
          <CentroidDriftTab
            engine={engine}
            onSimulateDrift={handleSimulateDrift}
            onRecalibrate={handleRecalibrate}
          />
        )}

        {activeTab === 'transfer_spec' && <TransferSpecTab />}
      </main>

      {/* Clean Quiet Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070A11] px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-1.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">GF-T3-215 APEX-215 Reference Core</span>
          <span aria-hidden="true">·</span>
          <span>Clean Title Warranty</span>
          <span aria-hidden="true">·</span>
          <span>Zero-SaaS Asset Transfer Spec</span>
        </div>
        <div className="font-mono text-slate-400">
          Deterministic Vector Indexing · Apache-2.0 / MIT
        </div>
      </footer>
    </div>
  );
}
