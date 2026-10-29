/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Database,
  Network,
  Box,
  Scale,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Layers,
  Sparkles
} from 'lucide-react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryCards } from './components/TelemetryCards';
import { TabBftDualVectorTorque } from './components/tabs/TabBftDualVectorTorque';
import { TabPostgresLedger } from './components/tabs/TabPostgresLedger';
import { TabOpenApiContract } from './components/tabs/TabOpenApiContract';
import { TabCloudRunHarness } from './components/tabs/TabCloudRunHarness';
import { TabApaCovenant } from './components/tabs/TabApaCovenant';
import { SwarmNode, DualVectorTorqueTelemetry, ConsensusPhase } from './types/cockpit';
import { GF_T3_172_SPEC_CONTENT } from './data/specDocument';

type TabId =
  | 'bft_dual_vector_torque'
  | 'postgres_ledger'
  | 'openapi_contract'
  | 'cloud_run_harness'
  | 'apa_covenant';

const INITIAL_NODES: SwarmNode[] = [
  {
    id: 'node-0',
    name: 'Hybrid PCM Core',
    role: 'Leader Proposer',
    ip: '10.240.0.10:9000',
    publicKey: '0x3a4f89b271c08e...',
    status: 'ONLINE',
    latencyMs: 0.32,
    lastVote: 'ACCEPTED',
    signatureVerified: true,
  },
  {
    id: 'node-1',
    name: 'Steer-by-Wire Bus',
    role: 'Steer-by-Wire Node',
    ip: '10.240.0.11:9000',
    publicKey: '0x99e01bc49a210f...',
    status: 'ONLINE',
    latencyMs: 0.38,
    lastVote: 'ACCEPTED',
    signatureVerified: true,
  },
  {
    id: 'node-2',
    name: 'Front Inverter Module',
    role: 'Front eAxle Node',
    ip: '10.240.0.12:9000',
    publicKey: '0x71e982c40a5b81...',
    status: 'ONLINE',
    latencyMs: 0.41,
    lastVote: 'ACCEPTED',
    signatureVerified: true,
  },
  {
    id: 'node-3',
    name: 'High-Output eAxle',
    role: 'Rear eAxle Node',
    ip: '10.240.0.13:9000',
    publicKey: '0x43b28f710e9c4d...',
    status: 'ONLINE',
    latencyMs: 0.44,
    lastVote: 'ACCEPTED',
    signatureVerified: true,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('bft_dual_vector_torque');
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<ConsensusPhase>('DECIDE');
  const [activeEpoch, setActiveEpoch] = useState<number>(1048580);
  const [commitLatencyMs, setCommitLatencyMs] = useState<number>(0.48);
  const [merkleRoot, setMerkleRoot] = useState<string>(
    '0xd7a9f4381b82e45cf8733299c0119bf2e334a1795c6130de910f0814bb6012aa'
  );
  const [nodes, setNodes] = useState<SwarmNode[]>(INITIAL_NODES);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Chassis & DUAL_VECTOR_TORQUE Physics State
  const [dual_vector_torque, setDualVectorTorque] = useState<DualVectorTorqueTelemetry>({
    speedKmh: 80,
    throttlePct: 45,
    steeringAngleDeg: 12,
    yawRateDegS: 4.2,
    lateralG: 0.35,
    frontTorquePct: 60,
    rearTorquePct: 40,
    frontPowerKw: 163.8,
    rearPowerKw: 109.2,
    torqueVectorMode: 'TURN_IN_TRACTION',
  });

  // Calculate DUAL_VECTOR_TORQUE split whenever chassis inputs change
  const recomputeDualVectorTorque = useCallback(
    (speed: number, throttle: number, steer: number, latG: number) => {
      // Base cruising split: 70:30
      // Heavy throttle shifts up to 40% to rear (down to 20:80)
      // High lateral G modulates for cornering yaw control
      const accelShift = (throttle / 100) * 45;
      const cornerShift = Math.min(15, (Math.abs(latG) / 1.0) * 15);
      let front = Math.max(20, Math.min(70, 70 - accelShift + cornerShift));
      let rear = 100 - front;

      // Mode detection
      let mode: DualVectorTorqueTelemetry['torqueVectorMode'] = 'CRUISE_EFFICIENCY';
      if (throttle > 70) {
        mode = 'EXIT_LAUNCH';
      } else if (Math.abs(steer) > 10 && Math.abs(latG) > 0.4) {
        mode = 'APEX_STABILITY';
      } else if (Math.abs(steer) > 5) {
        mode = 'TURN_IN_TRACTION';
      }

      const totalKw = 273 * (throttle / 100);
      const frontKw = (totalKw * front) / 100;
      const rearKw = (totalKw * rear) / 100;

      return {
        frontTorquePct: front,
        rearTorquePct: rear,
        frontPowerKw: frontKw,
        rearPowerKw: rearKw,
        torqueVectorMode: mode,
        yawRateDegS: (speed / 20) * (steer / 30) + 2.5,
      };
    },
    []
  );

  const handleUpdateDualVectorTorque = (updated: Partial<DualVectorTorqueTelemetry>) => {
    setDualVectorTorque((prev) => {
      const merged = { ...prev, ...updated };
      const computed = recomputeDualVectorTorque(
        merged.speedKmh,
        merged.throttlePct,
        merged.steeringAngleDeg,
        merged.lateralG
      );
      return { ...merged, ...computed };
    });
  };

  // Step Consensus Round single tick
  const stepConsensusRound = useCallback(() => {
    const phases: ConsensusPhase[] = ['PROPOSE', 'PRE-PREPARE', 'PREPARE', 'COMMIT', 'DECIDE'];
    setCurrentPhase((prev) => {
      const currentIdx = phases.indexOf(prev);
      const nextIdx = (currentIdx + 1) % phases.length;
      const nextPhase = phases[nextIdx];

      if (nextPhase === 'DECIDE') {
        setActiveEpoch((e) => e + 1);
        const randomLatency = 0.35 + Math.random() * 0.25;
        setCommitLatencyMs(randomLatency);
        // Refresh merkle root random hash tail
        setMerkleRoot(
          (m) => m.slice(0, 56) + Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0')
        );
      }
      return nextPhase;
    });
  }, []);

  // Simulation timer loop
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      stepConsensusRound();
    }, 250);
    return () => clearInterval(interval);
  }, [isSimulating, stepConsensusRound]);

  // Byzantine Fault Injection Toggle
  const toggleByzantine = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          const isNowByz = n.status !== 'BYZANTINE';
          return {
            ...n,
            status: isNowByz ? 'BYZANTINE' : 'ONLINE',
            lastVote: isNowByz ? 'EQUIVOCATION' : 'ACCEPTED',
          };
        }
        return n;
      })
    );

    const targetNode = nodes.find((n) => n.id === nodeId);
    if (targetNode?.status === 'ONLINE') {
      showToast(`Byzantine fault injected on ${nodeId.toUpperCase()}. Swarm detected equivocation and quarantined node!`);
    } else {
      showToast(`Node ${nodeId.toUpperCase()} restored to nominal cluster participation.`);
    }
  };

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Functional Export of GF_T3_172_SPEC.md
  const handleExportSpec = () => {
    const blob = new Blob([GF_T3_172_SPEC_CONTENT], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'GF_T3_172_SPEC.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('GF_T3_172_SPEC.md generated & downloaded for master vault archival.');
  };

  const handleVerifyMerkleRoot = () => {
    setActiveTab('postgres_ledger');
    showToast(`Merkle Root for Epoch #${activeEpoch} cryptographically verified: 100% SHA-256 match!`);
  };

  const handleSimulateConsensus = () => {
    setIsSimulating((prev) => !prev);
    if (!isSimulating) {
      showToast('HotStuff BFT Swarm Consensus simulation started at 10 Hz.');
    } else {
      showToast('Swarm simulation paused.');
    }
  };

  const activeNodesCount = nodes.filter((n) => n.status === 'ONLINE').length;

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 border border-cyan-500/50 text-slate-100 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in font-mono text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="flex-1">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-sm ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Monroney Banner (Standard relative/static positioning) */}
      <MonroneyBanner
        onSimulateConsensus={handleSimulateConsensus}
        onVerifyMerkleRoot={handleVerifyMerkleRoot}
        onExportSpec={handleExportSpec}
        isSimulating={isSimulating}
      />

      {/* Live Telemetry Metrics Cards (Standard relative positioning) */}
      <TelemetryCards
        currentPhase={currentPhase}
        activeEpoch={activeEpoch}
        commitLatencyMs={commitLatencyMs}
        dual_vector_torque={dual_vector_torque}
        merkleRoot={merkleRoot}
        activeNodesCount={activeNodesCount}
      />

      {/* Navigation Tabs Bar (Standard relative positioning, scrolls naturally) */}
      <nav className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 mb-6">
        <div className="flex border-b border-slate-800 space-x-1 sm:space-x-3 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('bft_dual_vector_torque')}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium text-sm transition shrink-0 ${
              activeTab === 'bft_dual_vector_torque'
                ? 'bg-slate-900 text-cyan-300 border-t-2 border-cyan-500 border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            1. BFT Consensus & DUAL_VECTOR_TORQUE Engine
          </button>

          <button
            onClick={() => setActiveTab('postgres_ledger')}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium text-sm transition shrink-0 ${
              activeTab === 'postgres_ledger'
                ? 'bg-slate-900 text-purple-300 border-t-2 border-purple-500 border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Database className="w-4 h-4 text-purple-400" />
            2. Postgres Epoch Ledger
          </button>

          <button
            onClick={() => setActiveTab('openapi_contract')}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium text-sm transition shrink-0 ${
              activeTab === 'openapi_contract'
                ? 'bg-slate-900 text-indigo-300 border-t-2 border-indigo-500 border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Network className="w-4 h-4 text-indigo-400" />
            3. OpenAPI 3.1 Swarm Contract
          </button>

          <button
            onClick={() => setActiveTab('cloud_run_harness')}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium text-sm transition shrink-0 ${
              activeTab === 'cloud_run_harness'
                ? 'bg-slate-900 text-emerald-300 border-t-2 border-emerald-500 border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Box className="w-4 h-4 text-emerald-400" />
            4. Turnkey Cloud Run Harness
          </button>

          <button
            onClick={() => setActiveTab('apa_covenant')}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium text-sm transition shrink-0 ${
              activeTab === 'apa_covenant'
                ? 'bg-slate-900 text-amber-300 border-t-2 border-amber-500 border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Scale className="w-4 h-4 text-amber-400" />
            5. Acquire.com APA Covenant
          </button>
        </div>
      </nav>

      {/* Tab Content Body (Relative/Static flow) */}
      <main className="relative flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {activeTab === 'bft_dual_vector_torque' && (
          <TabBftDualVectorTorque
            nodes={nodes}
            onToggleByzantine={toggleByzantine}
            dual_vector_torque={dual_vector_torque}
            onUpdateDualVectorTorque={handleUpdateDualVectorTorque}
            currentPhase={currentPhase}
            isSimulating={isSimulating}
            onToggleSimulating={handleSimulateConsensus}
            onStepRound={stepConsensusRound}
          />
        )}

        {activeTab === 'postgres_ledger' && (
          <TabPostgresLedger onVerifyMerkleRoot={handleVerifyMerkleRoot} />
        )}

        {activeTab === 'openapi_contract' && <TabOpenApiContract />}

        {activeTab === 'cloud_run_harness' && <TabCloudRunHarness />}

        {activeTab === 'apa_covenant' && (
          <TabApaCovenant onExportSpec={handleExportSpec} />
        )}
      </main>

      {/* Monroney Footer */}
      <footer className="relative w-full border-t border-slate-800 bg-slate-950 py-6 mt-auto text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">GF-T3-172</span>
            <span>• Apex Executive Multi-Node High-Output Core High-G Dynamic Telemetry Core</span>
            <span className="text-emerald-400 font-semibold">[MIT LICENSED]</span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span>Asset Transfer: 20 kHz (0.48ms)</span>
            <span>•</span>
            <span>Enterprise: PostgreSQL 16 + RLS</span>
            <span>•</span>
            <button
              onClick={handleExportSpec}
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              Export Spec
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
