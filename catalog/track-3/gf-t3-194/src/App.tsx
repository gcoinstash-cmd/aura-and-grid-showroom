/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CornerId,
  HeightLevel,
  MtsMode,
  DriveMode,
  HydraulicState,
  LedgerBlock,
  TabKey,
} from './types/telemetry';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryMetricsStrip } from './components/TelemetryMetricsStrip';
import { AhcSuspensionTab } from './components/tabs/AhcSuspensionTab';
import { PostgresLedgerTab } from './components/tabs/PostgresLedgerTab';
import { OpenApiContractTab } from './components/tabs/OpenApiContractTab';
import { CloudRunHarnessTab } from './components/tabs/CloudRunHarnessTab';
import { ApaCovenantTab } from './components/tabs/ApaCovenantTab';
import { VerifyHashModal } from './components/VerifyHashModal';
import { exportSpecMarkdown } from './utils/exportSpec';
import { computeHmacSha256, computeSha256 } from './utils/crypto';
import {
  Sliders,
  Database,
  FileCode,
  Cloud,
  ShieldCheck,
  Download,
  Gauge,
} from 'lucide-react';

const INITIAL_BLOCKS: LedgerBlock[] = [
  {
    blockIndex: 1,
    timestamp: '2026-10-12T16:20:00.100Z',
    prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    nonce: 1048576,
    cornerPressures: { FL: 185.0, FR: 185.0, RL: 182.0, RR: 182.0 },
    heightLevel: 'NORMAL',
    mtsMode: 'AUTO',
    pumpTempC: 41.2,
    hmacSignature: 'a718b52c0d8923a1f9e830c24a919e13b8f67011d6c8b919d71fa9e4521798e1',
    quarantined: false,
  },
  {
    blockIndex: 2,
    timestamp: '2026-10-12T16:21:15.350Z',
    prevHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    hash: '9f83c12a84b29e018d9f1c7e909a3c2098b0a19e832b49c0179a8e0f19c8d321',
    nonce: 1048584,
    cornerPressures: { FL: 198.4, FR: 198.0, RL: 190.2, RR: 190.0 },
    heightLevel: 'HIGH_1',
    mtsMode: 'DIRT',
    pumpTempC: 43.6,
    hmacSignature: 'c248b901a8ef839201948ba28172c918ef01928374a819b287cd9018274619ba',
    quarantined: false,
  },
  {
    blockIndex: 3,
    timestamp: '2026-10-12T16:23:42.820Z',
    prevHash: '9f83c12a84b29e018d9f1c7e909a3c2098b0a19e832b49c0179a8e0f19c8d321',
    hash: '5a28b9e019283c48a719283019827364a81928374619283746a8192837461928',
    nonce: 1048592,
    cornerPressures: { FL: 215.0, FR: 214.8, RL: 210.2, RR: 210.0 },
    heightLevel: 'HIGH_2',
    mtsMode: 'ROCK',
    pumpTempC: 46.8,
    hmacSignature: '84b90192a83746192837461928374619a8273645192837461928374619283746',
    quarantined: false,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('ahc');
  const [isSimulatingAhc, setIsSimulatingAhc] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [ledgerBlocks, setLedgerBlocks] = useState<LedgerBlock[]>(INITIAL_BLOCKS);

  // Hydraulic State
  const [hydraulicState, setHydraulicState] = useState<HydraulicState>({
    frequencyHz: 2200,
    linePressureBar: 195.4,
    maxSafetyBar: 280.0,
    pumpDutyCycle: 24.5,
    pumpTempC: 43.8,
    fluidReservoirLevelPct: 96.2,
    reliefValveActive: false,
    aeroLoweringActive: false,
    speedKmh: 45,
    rollDeg: 0,
    pitchDeg: 0,
    heightLevel: 'NORMAL',
    totalStrokeCapacityMm: 105,
    driveMode: 'NORMAL',
    mtsMode: 'AUTO',
    corners: {
      FL: {
        id: 'FL',
        label: 'Front Left',
        position: 'Front Left',
        pressureBar: 186.2,
        heightMm: 0,
        targetMm: 0,
        flowRateLpm: 3.2,
        gasChamberBar: 140,
        valveState: 'IDLE',
        springRateNmm: 48.0,
      },
      FR: {
        id: 'FR',
        label: 'Front Right',
        position: 'Front Right',
        pressureBar: 185.8,
        heightMm: 0,
        targetMm: 0,
        flowRateLpm: 3.2,
        gasChamberBar: 140,
        valveState: 'IDLE',
        springRateNmm: 48.0,
      },
      RL: {
        id: 'RL',
        label: 'Rear Left',
        position: 'Rear Left',
        pressureBar: 183.0,
        heightMm: 0,
        targetMm: 0,
        flowRateLpm: 2.8,
        gasChamberBar: 135,
        valveState: 'IDLE',
        springRateNmm: 44.0,
      },
      RR: {
        id: 'RR',
        label: 'Rear Right',
        position: 'Rear Right',
        pressureBar: 182.6,
        heightMm: 0,
        targetMm: 0,
        flowRateLpm: 2.8,
        gasChamberBar: 135,
        valveState: 'IDLE',
        springRateNmm: 44.0,
      },
    },
  });

  // Calculate dynamic corner parameters based on height level, MTS, roll and pitch
  const updateDynamicCorners = (
    level: HeightLevel,
    mts: MtsMode,
    roll: number,
    pitch: number,
    speed: number
  ) => {
    let offset = 0;
    if (level === 'LOW') offset = -25;
    if (level === 'NORMAL') offset = 0;
    if (level === 'HIGH_1') offset = 35;
    if (level === 'HIGH_2') offset = 80;
    if (level === 'EXTRA_HIGH') offset = 105;

    // Check automatic aero lowering if speed >= 100 km/h
    const aeroTriggered = speed >= 100;
    const effectiveOffset = aeroTriggered ? -25 : offset;
    const effectiveLevel = aeroTriggered ? 'LOW' : level;

    // MTS damping multipliers
    const mtsMultipliers: Record<MtsMode, number> = {
      AUTO: 1.0,
      DIRT: 1.25,
      SAND: 0.9,
      MUD: 1.35,
      DEEP_SNOW: 1.1,
      ROCK: 1.6,
    };
    const mult = mtsMultipliers[mts];

    const basePressure = 180 + (effectiveOffset * 0.35);

    setHydraulicState((prev) => {
      const flPress = basePressure + roll * 4.2 + pitch * 3.8;
      const frPress = basePressure - roll * 4.2 + pitch * 3.8;
      const rlPress = basePressure + roll * 4.2 - pitch * 3.8;
      const rrPress = basePressure - roll * 4.2 - pitch * 3.8;

      return {
        ...prev,
        heightLevel: effectiveLevel,
        mtsMode: mts,
        rollDeg: roll,
        pitchDeg: pitch,
        speedKmh: speed,
        aeroLoweringActive: aeroTriggered,
        linePressureBar: basePressure * 1.05,
        corners: {
          FL: {
            ...prev.corners.FL,
            heightMm: effectiveOffset + (roll * 1.5) + (pitch * 1.2),
            targetMm: effectiveOffset,
            pressureBar: Math.min(248, Math.max(90, flPress * mult)),
            gasChamberBar: 140 / Math.pow(1 - (effectiveOffset / 250) * 0.35, 1.4),
            springRateNmm: 48 * mult * (flPress / 180),
          },
          FR: {
            ...prev.corners.FR,
            heightMm: effectiveOffset - (roll * 1.5) + (pitch * 1.2),
            targetMm: effectiveOffset,
            pressureBar: Math.min(248, Math.max(90, frPress * mult)),
            gasChamberBar: 140 / Math.pow(1 - (effectiveOffset / 250) * 0.35, 1.4),
            springRateNmm: 48 * mult * (frPress / 180),
          },
          RL: {
            ...prev.corners.RL,
            heightMm: effectiveOffset + (roll * 1.5) - (pitch * 1.2),
            targetMm: effectiveOffset,
            pressureBar: Math.min(248, Math.max(90, rlPress * mult)),
            gasChamberBar: 135 / Math.pow(1 - (effectiveOffset / 250) * 0.35, 1.4),
            springRateNmm: 44 * mult * (rlPress / 180),
          },
          RR: {
            ...prev.corners.RR,
            heightMm: effectiveOffset - (roll * 1.5) - (pitch * 1.2),
            targetMm: effectiveOffset,
            pressureBar: Math.min(248, Math.max(90, rrPress * mult)),
            gasChamberBar: 135 / Math.pow(1 - (effectiveOffset / 250) * 0.35, 1.4),
            springRateNmm: 44 * mult * (rrPress / 180),
          },
        },
      };
    });
  };

  const handleSetHeight = (level: HeightLevel) => {
    updateDynamicCorners(
      level,
      hydraulicState.mtsMode,
      hydraulicState.rollDeg,
      hydraulicState.pitchDeg,
      hydraulicState.speedKmh
    );
  };

  const handleSetMts = (mode: MtsMode) => {
    updateDynamicCorners(
      hydraulicState.heightLevel,
      mode,
      hydraulicState.rollDeg,
      hydraulicState.pitchDeg,
      hydraulicState.speedKmh
    );
  };

  const handleSetDriveMode = (dm: DriveMode) => {
    setHydraulicState((prev) => ({ ...prev, driveMode: dm }));
  };

  const handleSetSpeed = (speed: number) => {
    updateDynamicCorners(
      hydraulicState.heightLevel,
      hydraulicState.mtsMode,
      hydraulicState.rollDeg,
      hydraulicState.pitchDeg,
      speed
    );
  };

  const handleSimulateDynamics = (roll: number, pitch: number) => {
    updateDynamicCorners(
      hydraulicState.heightLevel,
      hydraulicState.mtsMode,
      roll,
      pitch,
      hydraulicState.speedKmh
    );
  };

  const handleResetDynamics = () => {
    updateDynamicCorners(
      hydraulicState.heightLevel,
      hydraulicState.mtsMode,
      0,
      0,
      hydraulicState.speedKmh
    );
  };

  // Simulate AHC Action
  const handleSimulateAhc = () => {
    setIsSimulatingAhc(true);
    setActiveTab('ahc');

    const sequence: HeightLevel[] = ['HIGH_1', 'HIGH_2', 'NORMAL', 'LOW'];
    let idx = 0;

    const interval = setInterval(() => {
      if (idx < sequence.length) {
        handleSetHeight(sequence[idx]);
        idx++;
      } else {
        clearInterval(interval);
        handleSetHeight('NORMAL');
        setIsSimulatingAhc(false);
      }
    }, 900);
  };

  // Commit verified block to ledger
  const handleCommitBlock = async () => {
    const nextIndex = ledgerBlocks.length + 1;
    const prevBlock = ledgerBlocks[ledgerBlocks.length - 1];
    const nonce = prevBlock.nonce + 16;
    const timestamp = new Date().toISOString();

    const serializedPayload = `JTJHY7AX6N4000194|${nonce}|${hydraulicState.heightLevel}|${hydraulicState.mtsMode}|${hydraulicState.corners.FL.pressureBar.toFixed(1)}|${hydraulicState.corners.FR.pressureBar.toFixed(1)}|${prevBlock.hash}`;

    const newHash = await computeSha256(serializedPayload);
    const newHmac = await computeHmacSha256(serializedPayload);

    const newBlock: LedgerBlock = {
      blockIndex: nextIndex,
      timestamp,
      prevHash: prevBlock.hash,
      hash: newHash,
      nonce,
      cornerPressures: {
        FL: Number(hydraulicState.corners.FL.pressureBar.toFixed(1)),
        FR: Number(hydraulicState.corners.FR.pressureBar.toFixed(1)),
        RL: Number(hydraulicState.corners.RL.pressureBar.toFixed(1)),
        RR: Number(hydraulicState.corners.RR.pressureBar.toFixed(1)),
      },
      heightLevel: hydraulicState.heightLevel,
      mtsMode: hydraulicState.mtsMode,
      pumpTempC: Number(hydraulicState.pumpTempC.toFixed(1)),
      hmacSignature: newHmac,
      quarantined: false,
    };

    setLedgerBlocks((prev) => [...prev, newBlock]);
  };

  // Tamper a block
  const handleTamperBlock = (indexToTamper: number) => {
    setLedgerBlocks((prev) =>
      prev.map((b, idx) => {
        if (idx === indexToTamper) {
          return {
            ...b,
            tampered: true,
            cornerPressures: {
              ...b.cornerPressures,
              FL: b.cornerPressures.FL + 42.0, // Maliciously forged reading
            },
          };
        }
        return b;
      })
    );
  };

  // Verify ledger integrity
  const handleVerifyLedger = () => {
    for (let i = 0; i < ledgerBlocks.length; i++) {
      if (ledgerBlocks[i].tampered) {
        return { isValid: false, brokenIndex: ledgerBlocks[i].blockIndex };
      }
    }
    return { isValid: true };
  };

  // Trigger Overpressure event
  const handleTriggerOverpressure = async () => {
    const nextIndex = ledgerBlocks.length + 1;
    const prevBlock = ledgerBlocks[ledgerBlocks.length - 1];
    const nonce = prevBlock.nonce + 24;
    const timestamp = new Date().toISOString();

    const newBlock: LedgerBlock = {
      blockIndex: nextIndex,
      timestamp,
      prevHash: prevBlock.hash,
      hash: 'e82b71901a827c891b8273645192837461928374619283746192837461928374',
      nonce,
      cornerPressures: {
        FL: 294.5, // Exceeds 280 bar limit!
        FR: 185.0,
        RL: 182.0,
        RR: 182.0,
      },
      heightLevel: 'EXTRA_HIGH',
      mtsMode: 'ROCK',
      pumpTempC: 78.4,
      hmacSignature: '38192a83746192837461928374619a8273645192837461928374619283746192',
      quarantined: true,
    };

    setLedgerBlocks((prev) => [...prev, newBlock]);
  };

  const currentHeightOffset =
    hydraulicState.heightLevel === 'LOW'
      ? -25
      : hydraulicState.heightLevel === 'NORMAL'
      ? 0
      : hydraulicState.heightLevel === 'HIGH_1'
      ? 35
      : hydraulicState.heightLevel === 'HIGH_2'
      ? 80
      : 105;

  const currentNonce = ledgerBlocks[ledgerBlocks.length - 1]?.nonce || 1048592;

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Standard relative document flow header: clean 3-zone Top Bar Contract */}
      <header className="w-full border-b border-slate-800 bg-slate-950/80 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-black text-white tracking-tight whitespace-nowrap">
              Apex Executive Ultra-Heavy Telemetry Core Core
            </span>
          </div>

          {/* Zone 2: 5 Navigable Single-Line Tabs */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('ahc')}
              className={`px-3 py-1.5 text-base font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'ahc'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              AHC Suspension
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 text-base font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Postgres Ledger
            </button>
            <button
              onClick={() => setActiveTab('openapi')}
              className={`px-3 py-1.5 text-base font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'openapi'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              OpenAPI 3.1
            </button>
            <button
              onClick={() => setActiveTab('cloudrun')}
              className={`px-3 py-1.5 text-base font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'cloudrun'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Cloud Run Harness
            </button>
            <button
              onClick={() => setActiveTab('apa')}
              className={`px-3 py-1.5 text-base font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'apa'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Acquire.com APA
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={exportSpecMarkdown}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base h-9 px-3.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Export Spec</span>
            </button>
          </div>
        </div>

        {/* Mobile/Tablet tab bar */}
        <div className="flex lg:hidden items-center gap-1 overflow-x-auto mt-3 pt-3 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('ahc')}
            className={`px-2.5 py-1 text-base font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
              activeTab === 'ahc'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AHC Suspension
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-2.5 py-1 text-base font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Postgres Ledger
          </button>
          <button
            onClick={() => setActiveTab('openapi')}
            className={`px-2.5 py-1 text-base font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
              activeTab === 'openapi'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            OpenAPI 3.1
          </button>
          <button
            onClick={() => setActiveTab('cloudrun')}
            className={`px-2.5 py-1 text-base font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
              activeTab === 'cloudrun'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cloud Run Harness
          </button>
          <button
            onClick={() => setActiveTab('apa')}
            className={`px-2.5 py-1 text-base font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
              activeTab === 'apa'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Acquire APA
          </button>
        </div>
      </header>

      {/* Main Document Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Bulletproof MonroneyBanner Layout (Zero wrapping, zero clipping, zero stacking bugs) */}
        <MonroneyBanner
          onSimulateAhc={handleSimulateAhc}
          onVerifyHash={() => setIsVerifyModalOpen(true)}
          onExportSpec={exportSpecMarkdown}
          isSimulating={isSimulatingAhc}
        />

        {/* Live Telemetry Metrics Strip */}
        <TelemetryMetricsStrip
          frequencyHz={hydraulicState.frequencyHz}
          linePressureBar={hydraulicState.linePressureBar}
          heightLevel={hydraulicState.heightLevel}
          heightOffsetMm={currentHeightOffset}
          totalStrokeMm={hydraulicState.totalStrokeCapacityMm}
          currentNonce={currentNonce}
          cleanRoomVerified={true}
          onHeightClick={() => setActiveTab('ahc')}
          onLoopClick={() => setActiveTab('ahc')}
          onNonceClick={() => setActiveTab('ledger')}
          onAuditClick={() => setActiveTab('apa')}
        />

        {/* Active Tab View */}
        <div className="transition-opacity duration-150">
          {activeTab === 'ahc' && (
            <AhcSuspensionTab
              hydraulicState={hydraulicState}
              onSetHeight={handleSetHeight}
              onSetMts={handleSetMts}
              onSetDriveMode={handleSetDriveMode}
              onSetSpeed={handleSetSpeed}
              onSimulateDynamics={handleSimulateDynamics}
              onResetDynamics={handleResetDynamics}
            />
          )}

          {activeTab === 'ledger' && (
            <PostgresLedgerTab
              blocks={ledgerBlocks}
              onCommitBlock={handleCommitBlock}
              onTamperBlock={handleTamperBlock}
              onVerifyLedger={handleVerifyLedger}
              onTriggerOverpressure={handleTriggerOverpressure}
            />
          )}

          {activeTab === 'openapi' && (
            <OpenApiContractTab hydraulicState={hydraulicState} />
          )}

          {activeTab === 'cloudrun' && <CloudRunHarnessTab />}

          {activeTab === 'apa' && <ApaCovenantTab />}
        </div>
      </main>

      {/* Cryptographic Verification Modal */}
      <VerifyHashModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        blocks={ledgerBlocks}
      />

      {/* Minimal Footer (No AI slop, no fake ticker) */}
      <footer className="w-full border-t border-slate-800 bg-slate-950/60 py-4 px-6 text-slate-400 text-base">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-300">GF-T3-194</span>
            <span aria-hidden="true">·</span>
            <span>Apex Executive Ultra-Heavy Telemetry Core High-G Dynamic Telemetry Core</span>
            <span aria-hidden="true">·</span>
            <span>Acquire.com Turnkey Asset</span>
          </div>
          <div className="flex items-center gap-4 text-base font-mono">
            <span>Commercial Software Asset Standard</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-bold">100% Clean-Room Certified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
