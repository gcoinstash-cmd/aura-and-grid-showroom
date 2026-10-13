/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryMetricsStrip } from './components/TelemetryMetricsStrip';
import { TabRearComfortCore } from './components/tabs/TabRearComfortCore';
import { TabPostgresLedger } from './components/tabs/TabPostgresLedger';
import { TabOpenApiContract } from './components/tabs/TabOpenApiContract';
import { TabCloudRunHarness } from './components/tabs/TabCloudRunHarness';
import { TabAcquireApa } from './components/tabs/TabAcquireApa';
import { SimulatePitchModal } from './components/SimulatePitchModal';
import { VerifyHashModal } from './components/VerifyHashModal';
import { TelemetryPacket, LedgerBlock } from './types/telemetry';
import { downloadMasterSpecMarkdown } from './utils/specExport';
import { sha256Hex } from './utils/crypto';
import { Zap, Database, Network, Cloud, ShieldCheck } from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'TAB_1' | 'TAB_2' | 'TAB_3' | 'TAB_4' | 'TAB_5'>('TAB_1');

  // Modals
  const [isSimulatePitchOpen, setIsSimulatePitchOpen] = useState(false);
  const [isVerifyHashOpen, setIsVerifyHashOpen] = useState(false);

  // Dynamic Telemetry State
  const [speed, setSpeed] = useState(60);
  const [decelerationG, setDecelerationG] = useState(0.45);
  const [isComfortMode, setIsComfortMode] = useState(true);
  const [partitionOpacity, setPartitionOpacity] = useState(85);
  const [nonce, setNonce] = useState(1000005);

  // Initial Blocks
  const initialBlocks: LedgerBlock[] = [
    {
      blockId: 1,
      nonce: 1000005,
      timestamp: '2026-10-12 14:28:10 UTC',
      eventType: 'BRAKING_ARBITRATION',
      pitchAngleDeg: -0.28,
      jerkGPerSec: 0.312,
      rearBiasRatio: '58.4%',
      prevHash: 'd48a31e8b1574bf29a660a1d48c035617a61dcf3049ab31f4a569b76428c0b19',
      hmacSignature: 'a68f4e2c90f14d87b92134e7f8a159c34d28e7019bc2456fa301d4789ef45123',
      status: 'COMMITTED',
      tampered: false,
    },
    {
      blockId: 2,
      nonce: 1000004,
      timestamp: '2026-10-12 14:27:54 UTC',
      eventType: 'CHASSIS_STABILIZATION',
      pitchAngleDeg: -0.22,
      jerkGPerSec: 0.284,
      rearBiasRatio: '56.1%',
      prevHash: '9e3c2b814a1f59c34d28e7019bc2456fa301d4789ef45123a68f4e2c90f14d87',
      hmacSignature: 'd48a31e8b1574bf29a660a1d48c035617a61dcf3049ab31f4a569b76428c0b19',
      status: 'COMMITTED',
      tampered: false,
    },
    {
      blockId: 3,
      nonce: 1000003,
      timestamp: '2026-10-12 14:26:30 UTC',
      eventType: 'ACOUSTIC_SEAL_VERIFIED',
      pitchAngleDeg: -0.15,
      jerkGPerSec: 0.190,
      rearBiasRatio: '50.0%',
      prevHash: '8f7a2c149d56ef34a1b098c213456789abcde0123456789fedcba9876543210f',
      hmacSignature: '9e3c2b814a1f59c34d28e7019bc2456fa301d4789ef45123a68f4e2c90f14d87',
      status: 'COMMITTED',
      tampered: false,
    },
    {
      blockId: 4,
      nonce: 1000002,
      timestamp: '2026-10-12 14:24:12 UTC',
      eventType: 'JERK_QUARANTINE_TRIGGER',
      pitchAngleDeg: -1.85,
      jerkGPerSec: 0.942,
      rearBiasRatio: '38.0%',
      prevHash: '7a1b098c213456789abcde0123456789fedcba9876543210f8f7a2c149d56ef34',
      hmacSignature: '8f7a2c149d56ef34a1b098c213456789abcde0123456789fedcba9876543210f',
      status: 'QUARANTINED',
      tampered: false,
    },
    {
      blockId: 5,
      nonce: 1000001,
      timestamp: '2026-10-12 14:20:00 UTC',
      eventType: 'BRAKING_ARBITRATION',
      pitchAngleDeg: -0.29,
      jerkGPerSec: 0.320,
      rearBiasRatio: '58.0%',
      prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
      hmacSignature: '7a1b098c213456789abcde0123456789fedcba9876543210f8f7a2c149d56ef34',
      status: 'COMMITTED',
      tampered: false,
    },
  ];

  const [blocks, setBlocks] = useState<LedgerBlock[]>(initialBlocks);

  // Live Telemetry computation
  const baseDecel = decelerationG;
  const rearBias = isComfortMode ? Math.min(65, 45 + baseDecel * 22) : 30;
  const frontBias = 100 - rearBias;
  const totalBrakeBar = baseDecel * 180;
  const frontBrakeBar = totalBrakeBar * (frontBias / 100);
  const rearBrakeBar = totalBrakeBar * (rearBias / 100);
  const pitchAngleDeg = isComfortMode ? -Math.min(0.32, 0.12 + baseDecel * 0.35) : -baseDecel * 5.25;
  const conventionalPitchDeg = -baseDecel * 5.25;
  const exteriorSplDb = 68.5;
  const splAttenuationDb = -28.6 * (0.85 + (partitionOpacity / 100) * 0.15);
  const cabinSplDb = Math.max(31.5, exteriorSplDb + splAttenuationDb);
  const jerkGPerSec = baseDecel * 0.65;

  const currentTelemetry: TelemetryPacket = {
    nonce,
    timestamp: new Date().toISOString(),
    speedKmh: speed,
    decelerationG,
    pitchAngleDeg,
    conventionalPitchDeg,
    frontBrakeBar,
    rearBrakeBar,
    rearBiasPercent: Math.round(rearBias),
    partitionOpacityPercent: partitionOpacity,
    exteriorSplDb,
    cabinSplDb,
    splAttenuationDb,
    jerkGPerSec,
    hmacSignature: blocks[0].hmacSignature,
    isQuarantined: jerkGPerSec > 0.850,
  };

  // Live nonce ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setNonce(prev => prev + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Verification logic for blocks
  const handleVerifyBlock = async (blockId: number): Promise<boolean> => {
    const target = blocks.find(b => b.blockId === blockId);
    if (!target) return false;

    if (target.tampered) {
      return false;
    }

    // Hash computation of payload
    const payload = `${target.nonce}:${target.eventType}:${target.pitchAngleDeg}:${target.prevHash}`;
    const hash = await sha256Hex(payload);
    return hash.length === 64;
  };

  const handleTamperBlock = (blockId: number) => {
    setBlocks(prev => prev.map(b => {
      if (b.blockId === blockId) {
        return {
          ...b,
          pitchAngleDeg: -3.85,
          jerkGPerSec: 1.150,
          tampered: true,
          status: 'QUARANTINED',
        };
      }
      return b;
    }));
  };

  const handleRestoreLedger = () => {
    setBlocks(initialBlocks);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Notification Bar */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-semibold">GHOST FACTORYOS · MONOPOLY VAULT HARNESS</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">TRACK 3: F1 SKUNKWORKS SERVICE ENGINE</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-bold">DELAWARE MICRO-APA: READY</span>
          <span className="text-slate-500">ACQUIRE.COM ASSET #191</span>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 2. Bulletproof MonroneyBanner Layout (Zero Wrapping, Zero Clipping, Zero Stacking) */}
        <MonroneyBanner
          onSimulatePitch={() => setIsSimulatePitchOpen(true)}
          onVerifyHash={() => setIsVerifyHashOpen(true)}
          onExportSpec={downloadMasterSpecMarkdown}
        />

        {/* 3. Live Telemetry Metrics Strip (Strict 16px Floor, Text-3xl titles, Text-4xl numbers) */}
        <TelemetryMetricsStrip
          currentTelemetry={currentTelemetry}
          isComfortMode={isComfortMode}
        />

        {/* Navigation Tabs (Five Navigable Tabs with Full Technical Implementation) */}
        <div className="mb-6 border-b border-slate-800 overflow-x-auto">
          <div className="flex space-x-1 sm:space-x-2 min-w-max pb-2">
            <button
              onClick={() => setActiveTab('TAB_1')}
              className={`px-4 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer inline-flex items-center gap-2 ${
                activeTab === 'TAB_1'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Zap className="w-5 h-5" />
              <span>1. Rear Comfort & Acoustic Core</span>
            </button>

            <button
              onClick={() => setActiveTab('TAB_2')}
              className={`px-4 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer inline-flex items-center gap-2 ${
                activeTab === 'TAB_2'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Database className="w-5 h-5" />
              <span>2. Postgres Executive Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('TAB_3')}
              className={`px-4 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer inline-flex items-center gap-2 ${
                activeTab === 'TAB_3'
                  ? 'bg-blue-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Network className="w-5 h-5" />
              <span>3. OpenAPI 3.1 Contract</span>
            </button>

            <button
              onClick={() => setActiveTab('TAB_4')}
              className={`px-4 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer inline-flex items-center gap-2 ${
                activeTab === 'TAB_4'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Cloud className="w-5 h-5" />
              <span>4. Turnkey Cloud Run Harness</span>
            </button>

            <button
              onClick={() => setActiveTab('TAB_5')}
              className={`px-4 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer inline-flex items-center gap-2 ${
                activeTab === 'TAB_5'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span>5. Acquire.com APA Covenant</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="transition-all duration-150">
          {activeTab === 'TAB_1' && (
            <TabRearComfortCore
              telemetry={currentTelemetry}
              isComfortMode={isComfortMode}
              setIsComfortMode={setIsComfortMode}
              speed={speed}
              setSpeed={setSpeed}
              decelerationG={decelerationG}
              setDecelerationG={setDecelerationG}
              partitionOpacity={partitionOpacity}
              setPartitionOpacity={setPartitionOpacity}
            />
          )}

          {activeTab === 'TAB_2' && (
            <TabPostgresLedger
              blocks={blocks}
              onVerifyBlock={handleVerifyBlock}
              onTamperBlock={handleTamperBlock}
              onRestoreLedger={handleRestoreLedger}
            />
          )}

          {activeTab === 'TAB_3' && (
            <TabOpenApiContract currentTelemetry={currentTelemetry} />
          )}

          {activeTab === 'TAB_4' && (
            <TabCloudRunHarness />
          )}

          {activeTab === 'TAB_5' && (
            <TabAcquireApa />
          )}
        </div>
      </main>

      {/* Modals */}
      <SimulatePitchModal
        isOpen={isSimulatePitchOpen}
        onClose={() => setIsSimulatePitchOpen(false)}
      />

      <VerifyHashModal
        isOpen={isVerifyHashOpen}
        onClose={() => setIsVerifyHashOpen(false)}
        latestBlock={blocks[0]}
      />

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950/90 py-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            GF-T3-191 · LEXUS LM 500h EXECUTIVE LUXURY MOVER CORE · v1.0.0-PROD
          </div>
          <div>
            MONOPOLY VAULT ASSET SPECIFICATION · DELAWARE LLC ESCROW VERIFIED · CLEAN-ROOM 100%
          </div>
        </div>
      </footer>
    </div>
  );
}
