/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Database,
  FileText,
  Cloud,
  Briefcase,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryMetricsStrip } from './components/TelemetryMetricsStrip';
import { DrsKinematicsTab } from './components/tabs/DrsKinematicsTab';
import { PostgresLedgerTab } from './components/tabs/PostgresLedgerTab';
import { OpenApiContractTab } from './components/tabs/OpenApiContractTab';
import { CloudRunHarnessTab } from './components/tabs/CloudRunHarnessTab';
import { ApaCovenantTab } from './components/tabs/ApaCovenantTab';
import { SimulateModal } from './components/SimulateModal';
import { VerifyHashModal } from './components/VerifyHashModal';
import { KinematicsState, LedgerEntry } from './types/telemetry';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'KINEMATICS' | 'LEDGER' | 'OPENAPI' | 'HARNESS' | 'APA_COVENANT'
  >('KINEMATICS');

  const [simulateModalOpen, setSimulateModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  // Raw interactive Kinematics parameters
  const [rawParams, setRawParams] = useState({
    vehicleSpeedMph: 32,
    steeringWheelAngleDeg: 180,
    lateralG: 0.45,
    frictionCoeff: 0.95,
    drivingMode: 'NORMAL' as 'NORMAL' | 'SPORT_PLUS' | 'CUSTOM_TRACK',
  });

  // Calculate full physical bicycle kinematics with rear degree of freedom
  const kinematicsState = useMemo<KinematicsState>(() => {
    const { vehicleSpeedMph, steeringWheelAngleDeg, lateralG, frictionCoeff, drivingMode } = rawParams;
    const steeringRatio = 14.8;
    const deltaFrontDeg = Number((steeringWheelAngleDeg / steeringRatio).toFixed(2));

    let rawRearDeg = 0;
    let phase: 'COUNTER_PHASE' | 'NEUTRAL' | 'IN_PHASE' = 'NEUTRAL';

    if (vehicleSpeedMph === 0 || deltaFrontDeg === 0) {
      phase = 'NEUTRAL';
      rawRearDeg = 0;
    } else if (vehicleSpeedMph < 50.0) {
      // Counter-phase (opposite to front) below 50 mph
      const speedRatio = Math.max(0, 1.0 - vehicleSpeedMph / 50.0);
      rawRearDeg = -(deltaFrontDeg * 0.22) * (0.4 + 0.6 * speedRatio);
      phase = 'COUNTER_PHASE';
    } else {
      // In-phase (parallel with front) above 50 mph
      const highSpeedRatio = Math.min(1.0, (vehicleSpeedMph - 50.0) / 40.0);
      rawRearDeg = +(deltaFrontDeg * 0.14) * (0.5 + 0.5 * highSpeedRatio);
      phase = 'IN_PHASE';
    }

    // Hardware mechanical stop clamp at ±4.00°
    const maxDrs = 4.0;
    const clampedRearDeg = Number(
      Math.max(-maxDrs, Math.min(maxDrs, rawRearDeg)).toFixed(2)
    );

    // Turning radius math
    const wheelbaseM = 2.95;
    const radFront = Math.abs(deltaFrontDeg) * (Math.PI / 180);
    const standardRadius = radFront > 0.005 ? wheelbaseM / Math.sin(radFront) : 35.0;

    let turningRadiusM = standardRadius;
    let reductionPct = 0;

    if (phase === 'COUNTER_PHASE' && Math.abs(clampedRearDeg) > 0.05) {
      const effectiveAngle = radFront + Math.abs(clampedRearDeg) * (Math.PI / 180);
      turningRadiusM = wheelbaseM / Math.sin(Math.max(0.01, effectiveAngle));
      reductionPct = Number(
        Math.max(0, ((standardRadius - turningRadiusM) / standardRadius) * 100).toFixed(1)
      );
    }

    // DIRECT4 dynamic torque split
    let frontPct = 50;
    let rearPct = 50;
    if (vehicleSpeedMph < 25) {
      frontPct = 75;
      rearPct = 25;
    } else if (vehicleSpeedMph < 60) {
      frontPct = 50;
      rearPct = 50;
    } else {
      frontPct = 20;
      rearPct = 80;
    }

    // Yaw and slip angle beta
    const yawRate = Number((Math.abs(deltaFrontDeg) * (vehicleSpeedMph / 100) * 12.5).toFixed(1));
    const sideSlipBeta = phase === 'IN_PHASE' ? 0.08 : Number((lateralG * 1.8).toFixed(2));

    return {
      vehicleSpeedMph,
      steeringWheelAngleDeg,
      lateralG,
      frictionCoeff,
      drivingMode,
      calculatedFrontSteerDeg: deltaFrontDeg,
      calculatedRearSteerDeg: clampedRearDeg,
      rearSteerPhase: phase,
      turningRadiusMeters: Number(turningRadiusM.toFixed(1)),
      turningRadiusReductionPct: reductionPct,
      direct4FrontPct: frontPct,
      direct4RearPct: rearPct,
      yawRateDegPerSec: yawRate,
      sideSlipAngleBetaDeg: sideSlipBeta,
    };
  }, [rawParams]);

  // Initial ledger entries
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([
    {
      id: 'block-001',
      nonce: 1048590,
      timestamp: '2026-10-12 20:31:04.112 UTC',
      speedMph: 28,
      frontSteerDeg: 12.4,
      rearSteerDeg: -2.85,
      torqueSplit: '50:50',
      payloadHash: '4a8b72c91823ef0014aef7881cba90812349182093847a987162bca981023812',
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      hmacSignature: 'a89c2014bdf89012351239ab8124890123849120934812348901284901234891',
      quarantined: false,
      status: 'VALIDATED',
    },
    {
      id: 'block-002',
      nonce: 1048591,
      timestamp: '2026-10-12 20:31:04.512 UTC',
      speedMph: 45,
      frontSteerDeg: 8.2,
      rearSteerDeg: -1.20,
      torqueSplit: '50:50',
      payloadHash: 'c72b891230491823091823091823901823091823091823091823091823091823',
      previousHash: '4a8b72c91823ef0014aef7881cba90812349182093847a987162bca981023812',
      hmacSignature: '3819203918239018239018239018239018239018239018239018239018239018',
      quarantined: false,
      status: 'VALIDATED',
    },
    {
      id: 'block-003',
      nonce: 1048592,
      timestamp: '2026-10-12 20:31:04.912 UTC',
      speedMph: 72,
      frontSteerDeg: 4.8,
      rearSteerDeg: 1.95,
      torqueSplit: '20:80',
      payloadHash: '9182309182309182309182309182309182309182309182309182309182309182',
      previousHash: 'c72b891230491823091823091823901823091823091823091823091823091823',
      hmacSignature: '7712398129038129038129038129038129038129038129038129038129038129',
      quarantined: false,
      status: 'VALIDATED',
    },
  ]);

  const handleInjectFault = () => {
    const attackEntry: LedgerEntry = {
      id: `fault-${Date.now()}`,
      nonce: ledgerEntries[0].nonce + 1,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 23) + ' UTC',
      speedMph: 85,
      frontSteerDeg: 6.5,
      rearSteerDeg: 5.40, // EXCEEDS 4.05° HARD STOP!
      torqueSplit: '20:80',
      payloadHash: 'e999999999999999999999999999999999999999999999999999999999999999',
      previousHash: ledgerEntries[0].payloadHash,
      hmacSignature: '0000000000000000000000000000000000000000000000000000000000000000',
      quarantined: true,
      status: 'QUARANTINED',
      divergenceReason: 'CRITICAL: ACTUATOR_OVERTRAVEL_EXCEEDED_PHYSICAL_STOP_4.05_DEG',
    };
    setLedgerEntries((prev) => [attackEntry, ...prev]);
  };

  const handleResetLedger = () => {
    setLedgerEntries((prev) => prev.filter((e) => !e.quarantined));
  };

  const handleQuickSimulate = (speed: number, steer: number) => {
    setRawParams((prev) => ({
      ...prev,
      vehicleSpeedMph: speed,
      steeringWheelAngleDeg: steer,
    }));
    setActiveTab('KINEMATICS');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Banner & Header (Permanent Turn-1 Bulletproof Monroney Layout) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <MonroneyBanner
          onSimulateDRS={() => setSimulateModalOpen(true)}
          onVerifyHash={() => setVerifyModalOpen(true)}
        />

        {/* Live Telemetry Metrics Strip */}
        <TelemetryMetricsStrip
          rearAngle={kinematicsState.calculatedRearSteerDeg}
          phase={kinematicsState.rearSteerPhase}
          speedMph={kinematicsState.vehicleSpeedMph}
          nonceCounter={ledgerEntries[0]?.nonce}
        />

        {/* 5-Tab Navigation Bar */}
        <nav
          aria-label="Engine Technical Specification Sections"
          className="flex flex-row items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl mb-8 overflow-x-auto shadow-xl"
        >
          <button
            type="button"
            onClick={() => setActiveTab('KINEMATICS')}
            className={`px-4 py-3 rounded-xl text-base font-bold flex items-center gap-2.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'KINEMATICS'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-5 h-5 shrink-0" />
            <span>1. DRS &amp; DIRECT4 Core</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LEDGER')}
            className={`px-4 py-3 rounded-xl text-base font-bold flex items-center gap-2.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'LEDGER'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-5 h-5 shrink-0" />
            <span>2. Postgres HMAC Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('OPENAPI')}
            className={`px-4 py-3 rounded-xl text-base font-bold flex items-center gap-2.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'OPENAPI'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-5 h-5 shrink-0" />
            <span>3. OpenAPI 3.1 Telemetry</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HARNESS')}
            className={`px-4 py-3 rounded-xl text-base font-bold flex items-center gap-2.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'HARNESS'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Cloud className="w-5 h-5 shrink-0" />
            <span>4. Cloud Run &amp; PyTest</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('APA_COVENANT')}
            className={`px-4 py-3 rounded-xl text-base font-bold flex items-center gap-2.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'APA_COVENANT'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Briefcase className="w-5 h-5 shrink-0" />
            <span>5. Acquire.com APA Buyout</span>
          </button>
        </nav>

        {/* Tab Content Display */}
        <section className="transition-all duration-150">
          {activeTab === 'KINEMATICS' && (
            <DrsKinematicsTab
              state={kinematicsState}
              onChange={(updates) => setRawParams((prev) => ({ ...prev, ...updates }))}
            />
          )}

          {activeTab === 'LEDGER' && (
            <PostgresLedgerTab
              entries={ledgerEntries}
              onInjectFault={handleInjectFault}
              onResetLedger={handleResetLedger}
            />
          )}

          {activeTab === 'OPENAPI' && <OpenApiContractTab />}

          {activeTab === 'HARNESS' && <CloudRunHarnessTab />}

          {activeTab === 'APA_COVENANT' && <ApaCovenantTab />}
        </section>
      </main>

      {/* Footer Strip */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950/90 py-6 text-base text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-white">GF-T3-197</span>
            <span className="text-slate-600">|</span>
            <span>Lexus TX 500h DRS &amp; DIRECT4 Performance Core</span>
          </div>

          <div className="flex items-center gap-4 text-base font-medium">
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Acquire.com Turnkey Escrow Verified
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono">MIT Permissive License</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SimulateModal
        isOpen={simulateModalOpen}
        onClose={() => setSimulateModalOpen(false)}
        onApplyAndNavigate={handleQuickSimulate}
      />

      <VerifyHashModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        onNavigateToLedger={() => setActiveTab('LEDGER')}
      />
    </div>
  );
}
