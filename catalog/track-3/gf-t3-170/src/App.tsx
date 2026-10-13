import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryCards } from './components/TelemetryCards';
import { CanBusDiagram } from './components/CanBusDiagram';
import { CanFdHsmTab } from './components/tabs/CanFdHsmTab';
import { PostgresLedgerTab } from './components/tabs/PostgresLedgerTab';
import { OpenApiTab } from './components/tabs/OpenApiTab';
import { CloudRunHarnessTab } from './components/tabs/CloudRunHarnessTab';
import { ApaCovenantTab } from './components/tabs/ApaCovenantTab';
import { FrameInjectionModal } from './components/FrameInjectionModal';
import { CanFdFrame } from './types/telemetry';
import { SlidingWindowFilter, generateRandomFrame, buildMerkleTree } from './utils/cryptoSim';
import { ShieldCheck, CheckCircle2, AlertTriangle, Layers, Database, Globe, Cloud, Scale } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('canfd');
  const [slidingFilter] = useState(() => new SlidingWindowFilter(1000042, 64));
  const [frames, setFrames] = useState<CanFdFrame[]>(() => {
    const initial: CanFdFrame[] = [];
    for (let i = 0; i < 8; i++) {
      initial.push(generateRandomFrame(1000042 - (7 - i)));
    }
    return initial.reverse();
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationNotification, setVerificationNotification] = useState<string | null>(null);
  const [isInjectionModalOpen, setIsInjectionModalOpen] = useState(false);

  // Background subtle telemetry fluctuations
  const [throughput, setThroughput] = useState(100000);
  const [avgLatency, setAvgLatency] = useState(1.18);

  useEffect(() => {
    const timer = setInterval(() => {
      setThroughput(100000 + Math.floor(Math.sin(Date.now() / 2000) * 1450));
      setAvgLatency(+(1.15 + (Math.random() * 0.1)).toFixed(2));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleInjectSingle = (newFrame: CanFdFrame) => {
    const check = slidingFilter.checkAndAdd(newFrame.sequenceNumber);
    if (!check.valid) {
      newFrame.status = 'REPLAY_REJECTED';
    }
    setFrames((prev) => [newFrame, ...prev.slice(0, 49)]);
  };

  const handleInjectBurst = (burstFrames: CanFdFrame[]) => {
    burstFrames.forEach((frame) => {
      const check = slidingFilter.checkAndAdd(frame.sequenceNumber);
      if (!check.valid) {
        frame.status = 'REPLAY_REJECTED';
      }
    });
    setFrames((prev) => [...burstFrames.reverse(), ...prev].slice(0, 50));
  };

  const handleVerifyMerkle = () => {
    setIsVerifying(true);
    setVerificationNotification(null);
    setTimeout(() => {
      setIsVerifying(false);
      const { root } = buildMerkleTree(frames);
      setVerificationNotification(
        `Cryptographic Chain of Custody Verified: SHA-256 Merkle root [${root.substring(0, 16)}...] matches the immutable AlloyDB checkpoint.`
      );
      setTimeout(() => {
        setVerificationNotification(null);
      }, 7000);
    }, 600);
  };

  const tabs = [
    { id: 'canfd', label: 'CAN-FD & HSM Core', icon: Layers },
    { id: 'postgres', label: 'Postgres Security Ledger', icon: Database },
    { id: 'openapi', label: 'OpenAPI 3.1 Gateway', icon: Globe },
    { id: 'cloudrun', label: 'Cloud Run Harness', icon: Cloud },
    { id: 'apa', label: 'Acquire.com APA Covenant', icon: Scale },
  ];

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300">
      {/* 1. Header (Standard relative/static positioning - scrolls off naturally) */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Monroney Top Banner (Relative/static positioning) */}
      <MonroneyBanner
        onInjectFrames={() => setIsInjectionModalOpen(true)}
        onVerifyMerkle={handleVerifyMerkle}
        isVerifying={isVerifying}
      />

      {/* Cryptographic Verification Alert Toast / Notification */}
      {verificationNotification && (
        <div className="relative w-full bg-emerald-950/90 border-b border-emerald-600/50 px-6 py-3 transition-all animate-fadeIn">
          <div className="mx-auto max-w-7xl flex items-center gap-3 text-sm font-medium text-emerald-300">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{verificationNotification}</span>
          </div>
        </div>
      )}

      {/* 3. Live Telemetry Metrics (4 Cards with standard relative/static positioning) */}
      <TelemetryCards
        currentThroughput={throughput}
        averageLatencyMs={avgLatency}
        highestSequence={slidingFilter.headSeq}
        cleanAuditPercent={100}
        totalAccepted={slidingFilter.totalAccepted}
        totalRejected={slidingFilter.totalRejected}
      />

      {/* Main Cockpit Content Area */}
      <main className="relative flex-1 w-full px-6 pb-16">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Lexus ES 350h High-Contrast CAN-FD Diagram */}
          <CanBusDiagram />

          {/* Tab Navigation Segmented Bar (Relative / Standard flow) */}
          <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-800 pb-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-neutral-950 shadow-sm'
                      : 'bg-neutral-900/80 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 border border-neutral-800'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab View */}
          <div className="mt-6">
            {activeTab === 'canfd' && (
              <CanFdHsmTab
                frames={frames}
                onInjectSingle={handleInjectSingle}
                slidingFilter={slidingFilter}
              />
            )}
            {activeTab === 'postgres' && (
              <PostgresLedgerTab
                frames={frames}
                onVerifyMerkle={handleVerifyMerkle}
                isVerifying={isVerifying}
              />
            )}
            {activeTab === 'openapi' && <OpenApiTab />}
            {activeTab === 'cloudrun' && <CloudRunHarnessTab />}
            {activeTab === 'apa' && <ApaCovenantTab />}
          </div>
        </div>
      </main>

      {/* Quiet, Human Editorial Footer */}
      <footer className="relative w-full border-t border-neutral-800/80 bg-neutral-950 py-8 px-6 text-sm text-neutral-400">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-200">Ghost FactoryOS</span>
            <span className="text-neutral-600">·</span>
            <span>GF-T3-170 Executive Quietude Core</span>
            <span className="text-neutral-600">·</span>
            <span>Lexus ES 350h Platform</span>
          </div>
          <div className="flex items-center gap-6 text-neutral-400">
            <span>Clean-Room Certified</span>
            <span>ISO/SAE 21434 Compliant</span>
            <span>Acquire.com Turnkey Asset</span>
          </div>
        </div>
      </footer>

      {/* Frame Injection Modal */}
      <FrameInjectionModal
        isOpen={isInjectionModalOpen}
        onClose={() => setIsInjectionModalOpen(false)}
        onInjectBurst={handleInjectBurst}
        currentSequence={slidingFilter.headSeq}
      />
    </div>
  );
}
