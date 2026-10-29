/**
 * APEX-212 Multi-Agent BFT Consensus & Cryptographic State Machine
 * Main Application Cockpit
 * Track 3: Enterprise Reference Core
 * License: MIT
 */

import React, { useState } from 'react';
import { useConsensusCluster } from './hooks/useConsensusCluster';
import { HeaderHUD } from './components/HeaderHUD';
import { NodeMeshTab } from './components/NodeMeshTab';
import { ThreePhasePipelineTab } from './components/ThreePhasePipelineTab';
import { StateTrieTab } from './components/StateTrieTab';
import { ChaosMatrixTab } from './components/ChaosMatrixTab';
import { TransferSpecTab } from './components/TransferSpecTab';
import { Network, Cpu, Database, Flame, FileCode2 } from 'lucide-react';
import { playMicroClick } from './utils/audio';

type TabType = 'MESH' | 'PIPELINE' | 'STATE_TRIE' | 'CHAOS' | 'TRANSFER';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('MESH');

  const {
    nodes,
    currentView,
    sequenceHeight,
    consensusMode,
    phase,
    roundLatencyMs,
    stateKVs,
    canonicalStateRoot,
    ledger,
    messages,
    chaosLogs,
    isAutoProposing,
    tamperedBlockIndex,
    totalNodes,
    byzantineToleranceF,
    requiredQuorum,
    honestOnlineNodes,
    activeLeader,
    executeConsensusRound,
    stepPhaseConsensus,
    triggerViewChange,
    toggleConsensusMode,
    toggleByzantineNode,
    togglePartitionNode,
    injectThirdPartition,
    resynchronizeAll,
    updateStateKV,
    simulateTamper,
    toggleAutoPropose
  } = useConsensusCluster();

  const tabs = [
    { id: 'MESH', label: 'Node Mesh', icon: Network },
    { id: 'PIPELINE', label: 'Pipeline', icon: Cpu },
    { id: 'STATE_TRIE', label: 'State Trie', icon: Database },
    { id: 'CHAOS', label: 'Chaos', icon: Flame },
    { id: 'TRANSFER', label: 'Transfer', icon: FileCode2 }
  ];

  const handleTabChange = (tabId: TabType) => {
    playMicroClick(880);
    setActiveTab(tabId);
  };

  const nextPhaseLabel =
    phase === 'IDLE'
      ? 'Pre-Prepare'
      : phase === 'PRE_PREPARE'
      ? 'Prepare'
      : phase === 'PREPARE'
      ? 'Commit'
      : 'Finalize';

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 2-Row Command Header & 4-Card HUD Ribbon */}
      <HeaderHUD
        currentView={currentView}
        sequenceHeight={sequenceHeight}
        consensusMode={consensusMode}
        phase={phase}
        roundLatencyMs={roundLatencyMs}
        totalNodes={totalNodes}
        byzantineToleranceF={byzantineToleranceF}
        requiredQuorum={requiredQuorum}
        honestOnlineCount={honestOnlineNodes.length}
        activeLeaderId={activeLeader.id}
        isAutoProposing={isAutoProposing}
        onProposeBlock={() => executeConsensusRound()}
        onTriggerViewChange={triggerViewChange}
        onToggleMode={toggleConsensusMode}
        onToggleAutoPropose={toggleAutoPropose}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-3">
        {/* Interactive 3-Phase Step Debugger Control */}
        <div className="flex items-center justify-between gap-2 p-2 bg-slate-900/80 border border-slate-800 rounded-xl my-2 text-xs overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink min-w-0 truncate text-slate-400 font-mono text-[11px]">
            <span className="font-semibold text-slate-300 shrink-0 font-sans">Step Debugger:</span>
            <span className={['px-1.5 py-0.5 rounded font-bold shrink-0', phase === 'IDLE' ? 'bg-slate-800 text-white' : 'text-slate-500'].join(' ')}>IDLE</span>
            <span className="text-slate-600 shrink-0">&rarr;</span>
            <span className={['px-1.5 py-0.5 rounded font-bold shrink-0', phase === 'PRE_PREPARE' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-500'].join(' ')}>PRE-PREPARE</span>
            <span className="text-slate-600 shrink-0">&rarr;</span>
            <span className={['px-1.5 py-0.5 rounded font-bold shrink-0', phase === 'PREPARE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-500'].join(' ')}>PREPARE</span>
            <span className="text-slate-600 shrink-0">&rarr;</span>
            <span className={['px-1.5 py-0.5 rounded font-bold shrink-0', phase === 'COMMIT' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-500'].join(' ')}>COMMIT</span>
          </div>

          <button
            type="button"
            onClick={() => {
              playMicroClick(920);
              stepPhaseConsensus();
            }}
            className="shrink-0 px-2.5 py-1 text-[11px] whitespace-nowrap rounded-lg font-bold bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 transition-all flex items-center gap-1 active:scale-[0.98]"
          >
            <span>[Step Phase: {nextPhaseLabel}]</span>
          </button>
        </div>
        {/* TAB STRIP: Mounted Directly Underneath the 4-Card HUD Ribbon */}
        <div className="w-full overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex items-center justify-between gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl my-2 text-xs font-medium w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id as TabType)}
                  className={[
                    'px-2 py-1 text-[11px] whitespace-nowrap shrink-0 rounded-lg transition-colors flex items-center gap-1 font-semibold',
                    isActive
                      ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  ].join(' ')}
                >
                  <Icon className={[
                    'w-3.5 h-3.5',
                    isActive ? 'text-cyan-400' : 'text-slate-500'
                  ].join(' ')} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'MESH' && (
          <NodeMeshTab
            nodes={nodes}
            currentView={currentView}
            sequenceHeight={sequenceHeight}
            totalNodes={totalNodes}
            requiredQuorum={requiredQuorum}
            byzantineToleranceF={byzantineToleranceF}
            onToggleByzantine={toggleByzantineNode}
            onTogglePartition={togglePartitionNode}
          />
        )}

        {activeTab === 'PIPELINE' && (
          <ThreePhasePipelineTab
            phase={phase}
            currentView={currentView}
            sequenceHeight={sequenceHeight}
            messages={messages}
            nodes={nodes}
            requiredQuorum={requiredQuorum}
            totalNodes={totalNodes}
            roundLatencyMs={roundLatencyMs}
            onExecuteRound={executeConsensusRound}
            onTriggerViewChange={triggerViewChange}
          />
        )}

        {activeTab === 'STATE_TRIE' && (
          <StateTrieTab
            stateKVs={stateKVs}
            canonicalStateRoot={canonicalStateRoot}
            ledger={ledger}
            sequenceHeight={sequenceHeight}
            tamperedBlockIndex={tamperedBlockIndex}
            onUpdateStateKV={updateStateKV}
            onSimulateTamper={simulateTamper}
            onRestoreIntegrity={resynchronizeAll}
          />
        )}

        {activeTab === 'CHAOS' && (
          <ChaosMatrixTab
            nodes={nodes}
            chaosLogs={chaosLogs}
            currentView={currentView}
            sequenceHeight={sequenceHeight}
            requiredQuorum={requiredQuorum}
            totalNodes={totalNodes}
            onInjectEquivocation={() => toggleByzantineNode('VALIDATOR-NODE-CHARLIE')}
            onInjectPartition={injectThirdPartition}
            onDropLeaderHeartbeat={triggerViewChange}
            onResynchronizeAll={resynchronizeAll}
          />
        )}

        {activeTab === 'TRANSFER' && (
          <TransferSpecTab />
        )}
      </main>

      {/* Institutional Mission Control Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B0F19] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-300 font-semibold">APEX-212 / GF-T3-212</span>
            <span>&middot;</span>
            <span>Enterprise Reference Core Specification</span>
          </div>

          <div className="flex items-center gap-4 text-sm font-mono">
            <span>FIPS 180-4 SHA-256</span>
            <span>&middot;</span>
            <span>NIST SP 800-218 SSDF v1.1</span>
            <span>&middot;</span>
            <span className="text-emerald-400 font-semibold">Zero-Copyleft Permissive</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
