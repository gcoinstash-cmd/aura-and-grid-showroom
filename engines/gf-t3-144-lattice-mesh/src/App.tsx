import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TelemetryCockpit } from './components/TelemetryCockpit';
import { LatticeMathPlayground } from './components/LatticeMathPlayground';
import { HybridRatchetViewer } from './components/HybridRatchetViewer';
import { AlloyDbSchemaViewer } from './components/AlloyDbSchemaViewer';
import { OpenApiExplorer } from './components/OpenApiExplorer';
import { LegalVaultViewer } from './components/LegalVaultViewer';
import { EngineSpecViewer } from './components/EngineSpecViewer';
import { createInitialNodes, generateMeshLinks, MeshNode, MeshLink } from './lib/mesh/mesh_network_simulator';
import { generateMasterMonopolyZip } from './lib/export_bundle';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('cockpit');
  const [nodeCount, setNodeCount] = useState<number>(24);
  const [nodes, setNodes] = useState<MeshNode[]>(() => createInitialNodes(24));
  const [links, setLinks] = useState<MeshLink[]>(() => generateMeshLinks(createInitialNodes(24)));
  const [selectedNode, setSelectedNode] = useState<MeshNode | null>(() => nodes[0] || null);
  
  // Real-time Epoch & Telemetry State
  const [epochCounter, setEpochCounter] = useState<number>(142);
  const [timeRemaining, setTimeRemaining] = useState<number>(118);
  const [noiseLevel, setNoiseLevel] = useState<number>(2);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isRekeying, setIsRekeying] = useState<boolean>(false);
  const [lastRekeyStats, setLastRekeyStats] = useState<{
    epoch: number;
    durationMs: number;
    nodesUpdated: number;
    successRate: number;
  } | null>(null);

  // Re-generate nodes when count changes
  useEffect(() => {
    const newNodes = createInitialNodes(nodeCount);
    const newLinks = generateMeshLinks(newNodes);
    setNodes(newNodes);
    setLinks(newLinks);
    setSelectedNode(newNodes[0] || null);
  }, [nodeCount]);

  // Live 120-Second Epoch Countdown & Telemetry Simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Trigger epoch rollover
          setEpochCounter((ep) => ep + 1);
          return 120;
        }
        return prev - 1;
      });

      // Subtle live jitter update on nodes
      setNodes((currentNodes) =>
        currentNodes.map((n) => ({
          ...n,
          rttMs: Math.max(1.2, +(n.rttMs + (Math.random() * 0.08 - 0.04)).toFixed(2))
        }))
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle Manual Rekeying
  const handleManualRekey = () => {
    setIsRekeying(true);
    const start = performance.now();
    setTimeout(() => {
      const nextEpoch = epochCounter + 1;
      setEpochCounter(nextEpoch);
      setTimeRemaining(120);

      // Re-generate random PSKs on all nodes
      setNodes((currentNodes) =>
        currentNodes.map((n) => ({
          ...n,
          currentPsk: n.standbyPsk,
          standbyPsk: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          lastHandshakeEpoch: nextEpoch,
          status: 'ONLINE_ACTIVE'
        }))
      );

      const elapsed = performance.now() - start;
      setLastRekeyStats({
        epoch: nextEpoch,
        durationMs: +elapsed.toFixed(2),
        nodesUpdated: nodes.length,
        successRate: 100.0
      });
      setIsRekeying(false);
    }, 400);
  };

  // Handle Master Bundle Export
  const handleExportBundle = async () => {
    setIsExporting(true);
    try {
      const zipBlob = await generateMasterMonopolyZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GF-T3-144-LATTICE-MESH-10-10-VAULT-BUNDLE.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Compute P99 latency
  const sortedRtts = [...nodes.map((n) => n.rttMs)].sort((a, b) => a - b);
  const p99Index = Math.floor(sortedRtts.length * 0.99);
  const p99Latency = sortedRtts[p99Index] || 2.85;
  const avgHandshake = +(sortedRtts.reduce((acc, v) => acc + v, 0) / (sortedRtts.length || 1)).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* 3-Zone Top Navigation Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        epochCounter={epochCounter}
        timeRemaining={timeRemaining}
        onExportBundle={handleExportBundle}
        isExporting={isExporting}
        onManualRekey={handleManualRekey}
        isRekeying={isRekeying}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 py-8">
        
        {activeTab === 'cockpit' && (
          <TelemetryCockpit
            nodes={nodes}
            links={links}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            p99Latency={p99Latency}
            averageHandshakeTime={avgHandshake}
            noiseLevel={noiseLevel}
            setNoiseLevel={setNoiseLevel}
            onInjectNoise={handleManualRekey}
            nodeCount={nodeCount}
            setNodeCount={setNodeCount}
            lastRekeyStats={lastRekeyStats}
          />
        )}

        {activeTab === 'math' && <LatticeMathPlayground />}

        {activeTab === 'ratchet' && (
          <HybridRatchetViewer
            currentEpoch={epochCounter}
            timeRemaining={timeRemaining}
            onAdvanceEpoch={() => {
              setEpochCounter((c) => c + 1);
              setTimeRemaining(120);
            }}
          />
        )}

        {activeTab === 'schema' && <AlloyDbSchemaViewer />}

        {activeTab === 'openapi' && <OpenApiExplorer />}

        {activeTab === 'legal' && <LegalVaultViewer />}

        {activeTab === 'spec' && <EngineSpecViewer />}

      </main>

      {/* Clean Institutional Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 px-8 text-center">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-base text-slate-300 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">GF-T3-144 Lattice-Mesh</span>
            <span>·</span>
            <span>Ghost FactoryOS Fleet Track 3</span>
          </div>
          <div className="text-slate-300">
            NIST FIPS 203 ML-KEM-1024 · Delaware Court of Chancery
          </div>
        </div>
      </footer>

    </div>
  );
}
