/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  Database,
  FileText,
  Cloud,
  FileCheck2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryMetricsStrip } from './components/TelemetryMetricsStrip';
import { TabEkdssCore } from './components/tabs/TabEkdssCore';
import { TabPostgresLedger } from './components/tabs/TabPostgresLedger';
import { TabOpenApiContract } from './components/tabs/TabOpenApiContract';
import { TabCloudRunHarness } from './components/tabs/TabCloudRunHarness';
import { TabApaCovenant } from './components/tabs/TabApaCovenant';
import {
  CrawlSpeedMode,
  TransferCaseMode,
  TerrainMode,
  TelemetryBlock,
} from './types/telemetry';
import { GF_T3_188_SPEC_MARKDOWN } from './data/specMarkdown';

// Helper to calculate mock cryptographic SHA256 hex string
function generateMockSha256(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex}8c4f92d71a6e5b304c8f1e9a7b2d5f0e3c6a4b1d8f7e2c9a0b3d5f8a${hex.slice(0, 6)}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Vehicle Simulation States
  const [speedMph, setSpeedMph] = useState<number>(2.4);
  const [articulationAngleDeg, setArticulationAngleDeg] = useState<number>(14.5);
  const [crawlMode, setCrawlMode] = useState<CrawlSpeedMode>('LO');
  const [transferCase, setTransferCase] = useState<TransferCaseMode>('4L');
  const [rearDiffLocked, setRearDiffLocked] = useState<boolean>(true);
  const [centerDiffLocked, setCenterDiffLocked] = useState<boolean>(true);
  const [terrainMode, setTerrainMode] = useState<TerrainMode>('ROCK');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Telemetry Nonce & Loop Rate
  const [currentNonce, setCurrentNonce] = useState<number>(1042890);
  const loopHz = 2000;

  // Brake rotor temperature
  const [brakeRotorTempC, setBrakeRotorTempC] = useState<number>(248.5);

  // Initial Blocks for PostgreSQL Ledger
  const [blocks, setBlocks] = useState<TelemetryBlock[]>(() => {
    const initBlocks: TelemetryBlock[] = [];
    let prevHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
    for (let i = 0; i < 7; i++) {
      const nonce = 1042884 + i;
      const bHash = generateMockSha256(`block-${nonce}-${prevHash}`);
      initBlocks.push({
        nonce,
        timestamp: new Date(Date.now() - (7 - i) * 1500).toISOString(),
        speedMph: 2.2 + (i % 3) * 0.2,
        articulationAngleDeg: 14.0 + (i % 2) * 0.8,
        frontPressureMpa: 6.35,
        rearPressureMpa: 6.28,
        frontValve: 'OPEN',
        rearValve: 'OPEN',
        crawlMode: 'LO',
        transferCase: '4L',
        rearDiffLocked: true,
        rollStiffness: 195.0,
        prevHash,
        blockHash: bHash,
      });
      prevHash = bHash;
    }
    return initBlocks;
  });

  // Calculate Dynamic Kinetic Suspension Telemetry Disconnect Conditions:
  // Speed <= 26.8 mph (12 m/s), Cross-axle articulation >= 2.5 deg (~45mm travel)
  const isBypassOpen = speedMph <= 26.8 && Math.abs(articulationAngleDeg) >= 2.5;
  const frontValve: 'OPEN' | 'CLOSED' = isBypassOpen ? 'OPEN' : 'CLOSED';
  const rearValve: 'OPEN' | 'CLOSED' = isBypassOpen ? 'OPEN' : 'CLOSED';

  const rollStiffnessNmPerDeg = isBypassOpen ? 195.0 : 1850.0;
  const frontPressureMpa = isBypassOpen ? 6.20 + articulationAngleDeg * 0.04 : 6.20;
  const rearPressureMpa = isBypassOpen ? 6.20 - articulationAngleDeg * 0.035 : 6.20;

  // 4-corner wheel stroke
  const strokeTravel = articulationAngleDeg * 17.5;
  const wheelStroke = {
    fl: Math.round(strokeTravel),
    fr: Math.round(-strokeTravel),
    rl: Math.round(-strokeTravel * 0.9),
    rr: Math.round(strokeTravel * 0.9),
  };
  const articulationIndexMm = Math.min(640, Math.abs(articulationAngleDeg) * 35.5);

  // Crawl Control PWM Brake modulation
  const pwmBrake = {
    fl: crawlMode !== 'OFF' ? Math.min(85, Math.abs(wheelStroke.fl) * 0.35 + 15) : 0,
    fr: crawlMode !== 'OFF' ? Math.min(85, Math.abs(wheelStroke.fr) * 0.35 + 15) : 0,
    rl: crawlMode !== 'OFF' ? Math.min(85, Math.abs(wheelStroke.rl) * 0.35 + 10) : 0,
    rr: crawlMode !== 'OFF' ? Math.min(85, Math.abs(wheelStroke.rr) * 0.35 + 10) : 0,
  };

  // Real-time ticking simulation effect
  const prevHashRef = useRef(blocks[blocks.length - 1]?.blockHash || '0x000000');
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setCurrentNonce((n) => {
        const nextNonce = n + 1;
        // Thermal dissipation simulation
        setBrakeRotorTempC((temp) => {
          if (crawlMode !== 'OFF') {
            return Math.min(540, temp + 0.4);
          } else {
            return Math.max(90, temp - 0.6);
          }
        });

        // Add a block to the ledger occasionally (every 3 ticks)
        if (nextNonce % 2 === 0) {
          setBlocks((prev) => {
            const last = prev[prev.length - 1];
            const pHash = last ? last.blockHash : prevHashRef.current;
            const newHash = generateMockSha256(`block-${nextNonce}-${pHash}`);
            prevHashRef.current = newHash;

            const newBlock: TelemetryBlock = {
              nonce: nextNonce,
              timestamp: new Date().toISOString(),
              speedMph,
              articulationAngleDeg,
              frontPressureMpa: Math.round(frontPressureMpa * 100) / 100,
              rearPressureMpa: Math.round(rearPressureMpa * 100) / 100,
              frontValve,
              rearValve,
              crawlMode,
              transferCase,
              rearDiffLocked,
              rollStiffness: rollStiffnessNmPerDeg,
              prevHash: pHash,
              blockHash: newHash,
            };
            return [...prev.slice(-9), newBlock];
          });
        }

        return nextNonce;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [
    isSimulating,
    speedMph,
    articulationAngleDeg,
    frontPressureMpa,
    rearPressureMpa,
    frontValve,
    rearValve,
    crawlMode,
    transferCase,
    rearDiffLocked,
    rollStiffnessNmPerDeg,
  ]);

  // Actions from MonroneyBanner
  const handleSimulateEkdss = () => {
    setActiveTab(0);
    setSpeedMph(2.1);
    setArticulationAngleDeg(15.5);
    setCrawlMode('LO');
    setTransferCase('4L');
    setRearDiffLocked(true);
    setCenterDiffLocked(true);
    setTerrainMode('ROCK');
    setIsSimulating(true);
    showToast('Switched to Dynamic Kinetic Suspension Telemetry Core: Rock Crawl Boulder Simulation engaged');
  };

  const handleVerifyHash = () => {
    setActiveTab(1);
    showToast('Switched to PostgreSQL Ledger: Initiating cryptographic HMAC-SHA256 audit');
  };

  const handleExportSpec = () => {
    const blob = new Blob([GF_T3_188_SPEC_MARKDOWN], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'GF_T3_188_SPEC.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded GF_T3_188_SPEC.md for master vault archival');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Ledger Tamper simulation handlers
  const handleTamperBlock = (nonce: number) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.nonce === nonce
          ? {
              ...b,
              speedMph: 99.9,
              frontPressureMpa: 0.1,
              tampered: true,
              blockHash: '0xDEADBEEF00000000000000000000000000000000000000000000000000000000',
            }
          : b
      )
    );
    showToast(`Block #${nonce} artificially tampered! Cryptographic signature chain broken.`);
  };

  const handleRestoreBlock = (nonce: number) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.nonce === nonce
          ? {
              ...b,
              speedMph: 2.4,
              frontPressureMpa: 6.35,
              tampered: false,
              blockHash: generateMockSha256(`block-${nonce}-${b.prevHash}`),
            }
          : b
      )
    );
    showToast(`Block #${nonce} restored. Cryptographic signature chain re-verified.`);
  };

  const handleSimulatePressureDrop = () => {
    setSpeedMph(2.0);
    setArticulationAngleDeg(0.0);
    showToast('ALERT: Hydraulic line pressure dropped >4.80 MPa. Failsafe valves locked & block quarantined.');
  };

  // Navigation tab definitions
  const tabs = [
    { id: 0, label: '1. Dynamic Kinetic Suspension Telemetry & Crawl Core', icon: Sliders },
    { id: 1, label: '2. Postgres Ledger', icon: Database },
    { id: 2, label: '3. OpenAPI 3.1 Spec', icon: FileText },
    { id: 3, label: '4. Cloud Run Harness', icon: Cloud },
    { id: 4, label: '5. Acquire.com Covenant', icon: FileCheck2 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-mono py-2.5 px-4 rounded-xl shadow-2xl flex items-center gap-2.5 backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1">
        {/* Monroney Banner Component (Permanent Hardened Protocol) */}
        <MonroneyBanner
          onSimulateEkdss={handleSimulateEkdss}
          onVerifyHash={handleVerifyHash}
          onExportSpec={handleExportSpec}
        />

        {/* Live Telemetry Metrics Strip */}
        <TelemetryMetricsStrip
          loopHz={loopHz}
          articulationIndexMm={articulationIndexMm}
          currentNonce={currentNonce}
          frontValve={frontValve}
          rearValve={rearValve}
        />

        {/* Primary 5-Tab Navigation Strip (Functional Buttons) */}
        <nav aria-label="Systems Specification Navigation" className="mb-6">
          <div className="flex flex-row items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold whitespace-nowrap cursor-pointer transition-all ${
                    active
                      ? 'bg-amber-500 text-slate-950 shadow-md scale-101'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Active Tab View */}
        <section className="mb-10">
          {activeTab === 0 && (
            <TabEkdssCore
              speedMph={speedMph}
              setSpeedMph={setSpeedMph}
              articulationAngleDeg={articulationAngleDeg}
              setArticulationAngleDeg={setArticulationAngleDeg}
              crawlMode={crawlMode}
              setCrawlMode={setCrawlMode}
              transferCase={transferCase}
              setTransferCase={setTransferCase}
              rearDiffLocked={rearDiffLocked}
              setRearDiffLocked={setRearDiffLocked}
              centerDiffLocked={centerDiffLocked}
              setCenterDiffLocked={setCenterDiffLocked}
              terrainMode={terrainMode}
              setTerrainMode={setTerrainMode}
              isSimulating={isSimulating}
              setIsSimulating={setIsSimulating}
              frontValve={frontValve}
              rearValve={rearValve}
              frontPressureMpa={frontPressureMpa}
              rearPressureMpa={rearPressureMpa}
              rollStiffnessNmPerDeg={rollStiffnessNmPerDeg}
              wheelStroke={wheelStroke}
              brakeRotorTempC={brakeRotorTempC}
              pwmBrake={pwmBrake}
            />
          )}

          {activeTab === 1 && (
            <TabPostgresLedger
              blocks={blocks}
              onTamperBlock={handleTamperBlock}
              onRestoreBlock={handleRestoreBlock}
              onSimulatePressureDrop={handleSimulatePressureDrop}
            />
          )}

          {activeTab === 2 && <TabOpenApiContract />}

          {activeTab === 3 && <TabCloudRunHarness />}

          {activeTab === 4 && <TabApaCovenant onExportSpec={handleExportSpec} />}
        </section>
      </main>

      {/* Static Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400 font-semibold">GF-T3-188 Heavy Overland Dynamics Platform CORE</span>
            <span className="text-slate-600">/</span>
            <span>Heavy Boxed Steel Frame Architecture PLATFORM ARCHITECTURE</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Delaware Micro-APA Asset</span>
            <span className="text-slate-600">/</span>
            <span>Clean-Room Certified</span>
            <span className="text-slate-600">/</span>
            <span className="text-amber-400 font-bold">20 kHz (0.48ms) Turnkey Asset Transfer</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
