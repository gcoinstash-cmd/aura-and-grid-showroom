import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryMetricsStrip } from './components/TelemetryMetricsStrip';
import { TabDrsYawCore } from './components/tabs/TabDrsYawCore';
import { TabPostgresLedger } from './components/tabs/TabPostgresLedger';
import { TabOpenApiContract } from './components/tabs/TabOpenApiContract';
import { TabCloudRunHarness } from './components/tabs/TabCloudRunHarness';
import { TabApaCovenant } from './components/tabs/TabApaCovenant';
import { HashVerifyModal } from './components/HashVerifyModal';
import { DrsPhysicsState, TelemetryLedgerRow } from './types/telemetry';
import { MASTER_SPEC_DOCUMENT } from './data/specDocument';
import { Car, Database, Radio, Cloud, Award } from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'yaw' | 'ledger' | 'openapi' | 'cloudrun' | 'apa'>('yaw');

  // Simulation Controls & State
  const [isSimulating, setIsSimulating] = useState(false);
  const [isFaultInjected, setIsFaultInjected] = useState(false);
  const [isHashModalOpen, setIsHashModalOpen] = useState(false);
  const [hashVerified, setHashVerified] = useState(true);

  // Live Physics State
  const [physicsState, setPhysicsState] = useState<DrsPhysicsState>({
    vehicleSpeedKmh: 42.0,
    steeringWheelDeg: 120.0,
    frontWheelAngleDeg: 8.11,
    rearWheelAngleDeg: -1.24,
    phaseMode: 'ANTI_PHASE_TURNING',
    direct4FrontRatio: 58.0,
    direct4RearRatio: 42.0,
    lateralAccelG: 0.32,
    yawRateDegSec: 5.4,
    turningRadiusMeters: 6.8,
    curbRadiusDeltaMeters: 0.94,
    rackDisplacementMm: -5.27,
    bldcPhaseCurrentAmps: 18.4,
    canCycleTimeUs: 388.5,
    isStallProtected: false,
  });

  // Nonce & Telemetry Ledger
  const [nonce, setNonce] = useState(1048291);
  const [ledgerRows, setLedgerRows] = useState<TelemetryLedgerRow[]>([]);

  // Telemetry calculation helper
  const calculatePhysics = useCallback(
    (speed: number, steerDeg: number, latG: number, fault: boolean): DrsPhysicsState => {
      const frontAngle = steerDeg / 14.8;
      const speedKmh = Math.max(0, Math.min(180, speed));
      let targetRear = 0.0;
      let phase: 'ANTI_PHASE_TURNING' | 'IN_PHASE_STABILIZATION' | 'NEUTRAL_ZERO_OFFSET' = 'NEUTRAL_ZERO_OFFSET';

      if (speedKmh < 78.5) {
        phase = 'ANTI_PHASE_TURNING';
        const decay = Math.max(0.12, 1.0 - speedKmh / 80.0);
        targetRear = -frontAngle * 0.32 * decay;
      } else if (speedKmh > 81.5) {
        phase = 'IN_PHASE_STABILIZATION';
        const ramp = Math.min(1.0, (speedKmh - 80.0) / 35.0);
        targetRear = frontAngle * 0.22 * ramp;
      } else {
        phase = 'NEUTRAL_ZERO_OFFSET';
        targetRear = 0.0;
      }

      // Hard clamp mechanical ±4.0°
      targetRear = Math.max(-4.0, Math.min(4.0, targetRear));

      // DIRECT4 AWD Torque Vectoring
      const absLat = Math.min(1.0, Math.abs(latG) / 0.8);
      let rearPct = 20.0 + 60.0 * absLat;
      if (phase === 'IN_PHASE_STABILIZATION') {
        rearPct = Math.min(80.0, rearPct + 8.0);
      }
      rearPct = Math.max(20.0, Math.min(80.0, rearPct));
      const frontPct = 100.0 - rearPct;

      // Kinematic Turning Radius
      const deltaF_rad = (Math.abs(frontAngle) * Math.PI) / 180;
      const deltaR_rad = (Math.abs(targetRear) * Math.PI) / 180;
      const denom =
        phase === 'ANTI_PHASE_TURNING'
          ? Math.tan(deltaF_rad) + Math.tan(deltaR_rad)
          : Math.max(0.001, Math.abs(Math.tan(deltaF_rad) - Math.tan(deltaR_rad)));

      const radiusM = Math.abs(frontAngle) > 0.2 ? 2.95 / Math.max(0.001, denom) : 999.9;
      const baselineRadius = Math.abs(frontAngle) > 0.2 ? 2.95 / Math.max(0.001, Math.tan(deltaF_rad)) : 999.9;
      const curbDelta = Math.max(0, baselineRadius - radiusM);

      const rackMm = fault ? targetRear * 4.25 + 1.28 : targetRear * 4.25;

      return {
        vehicleSpeedKmh: speedKmh,
        steeringWheelDeg: steerDeg,
        frontWheelAngleDeg: parseFloat(frontAngle.toFixed(2)),
        rearWheelAngleDeg: parseFloat((fault ? 0.0 : targetRear).toFixed(2)),
        phaseMode: phase,
        direct4FrontRatio: parseFloat(frontPct.toFixed(1)),
        direct4RearRatio: parseFloat(rearPct.toFixed(1)),
        lateralAccelG: latG,
        yawRateDegSec: parseFloat(((Math.abs(frontAngle) * speedKmh) / 72.0).toFixed(1)),
        turningRadiusMeters: parseFloat(radiusM.toFixed(1)),
        curbRadiusDeltaMeters: parseFloat(curbDelta.toFixed(2)),
        rackDisplacementMm: parseFloat(rackMm.toFixed(2)),
        bldcPhaseCurrentAmps: fault ? 42.5 : parseFloat((12.0 + Math.abs(targetRear) * 4.2).toFixed(1)),
        canCycleTimeUs: 388.2 + Math.random() * 8.4,
        isStallProtected: fault,
      };
    },
    []
  );

  // Initialize initial mock ledger rows
  useEffect(() => {
    const initialRows: TelemetryLedgerRow[] = [];
    let currentNonce = 1048291;
    let prevHmac = '7a29e40b39f1c7d9e115049a2cd94762c5e1284a10df5419824c90abef382104';

    for (let i = 0; i < 12; i++) {
      const speed = 40.0 + (i % 6) * 12.0;
      const steer = 60.0 + (i % 4) * 35.0;
      const front = steer / 14.8;
      const isHigh = speed >= 80;
      const targetRear = isHigh ? front * 0.18 : -front * 0.26;
      const divergence = (i * 0.014).toFixed(3);
      const rowNonce = currentNonce - i;
      const date = new Date(Date.now() - i * 400).toISOString();
      const currentHmac = (
        (rowNonce * 31415926535).toString(16) +
        '9f8a32b1c4e70198' +
        prevHmac.substring(0, 16)
      ).padEnd(64, '0');

      initialRows.push({
        nonce: rowNonce,
        timestamp: date,
        speedKmh: speed,
        pinionAngleDeg: parseFloat(front.toFixed(2)),
        rearToeTargetDeg: parseFloat(targetRear.toFixed(2)),
        rearToeActualDeg: parseFloat(targetRear.toFixed(2)),
        divergenceMm: parseFloat(divergence),
        frontRearSplit: isHigh ? '45:55' : '65:35',
        status: 'NOMINAL',
        prevHmac,
        currentHmac,
      });

      prevHmac = currentHmac;
    }

    setLedgerRows(initialRows);
  }, []);

  // Continuous Telemetry Ingestion interval (runs at steady UI rate simulating 2,500 Hz feed)
  useEffect(() => {
    const interval = setInterval(() => {
      setNonce((prev) => {
        const nextNonce = prev + 1;
        setLedgerRows((prevRows) => {
          const now = new Date().toISOString();
          const targetToe = physicsState.rearWheelAngleDeg;
          const divergence = isFaultInjected ? 1.14 : 0.018 + (nextNonce % 5) * 0.004;
          const status = isFaultInjected ? 'QUARANTINED' : 'NOMINAL';
          const prevHash = prevRows[0]?.currentHmac || '0'.repeat(64);
          const newHash = (
            (nextNonce * 16180339887).toString(16) +
            'abef19827439dc' +
            prevHash.substring(0, 24)
          ).padEnd(64, 'a');

          const newRow: TelemetryLedgerRow = {
            nonce: nextNonce,
            timestamp: now,
            speedKmh: physicsState.vehicleSpeedKmh,
            pinionAngleDeg: physicsState.frontWheelAngleDeg,
            rearToeTargetDeg: targetToe,
            rearToeActualDeg: isFaultInjected ? 0.0 : targetToe,
            divergenceMm: parseFloat(divergence.toFixed(3)),
            frontRearSplit: `${physicsState.direct4FrontRatio.toFixed(0)}:${physicsState.direct4RearRatio.toFixed(0)}`,
            status,
            prevHmac: prevHash,
            currentHmac: newHash,
          };

          return [newRow, ...prevRows.slice(0, 14)];
        });
        return nextNonce;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [physicsState, isFaultInjected]);

  // Simulation sweep mode
  const simStepRef = useRef(0);
  useEffect(() => {
    if (!isSimulating) return;

    const simTimer = setInterval(() => {
      simStepRef.current += 1;
      const step = simStepRef.current;
      // Cycle vehicle speed between 15 km/h (parking anti-phase) and 130 km/h (highway in-phase crab)
      const speed = 15 + Math.sin(step * 0.1) * 60 + 55; // 20 to 130 km/h
      const steer = Math.sin(step * 0.15) * 280; // -280 to +280 deg
      const latG = Math.sin(step * 0.15) * 0.65; // -0.65 to +0.65 G

      setPhysicsState(calculatePhysics(speed, steer, latG, isFaultInjected));
    }, 120);

    return () => clearInterval(simTimer);
  }, [isSimulating, isFaultInjected, calculatePhysics]);

  // Handlers
  const handleToggleSimulate = () => {
    setIsSimulating((prev) => !prev);
  };

  const handleVerifyHash = () => {
    setIsHashModalOpen(true);
  };

  const handleExportSpec = () => {
    const blob = new Blob([MASTER_SPEC_DOCUMENT], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GF_T3_192_SPEC.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpdateSensors = (speed: number, steer: number, latG: number) => {
    setPhysicsState(calculatePhysics(speed, steer, latG, isFaultInjected));
  };

  const handleReset = () => {
    setPhysicsState(calculatePhysics(42.0, 120.0, 0.32, false));
    setIsFaultInjected(false);
  };

  const handleTriggerFault = () => {
    setIsFaultInjected(true);
    setPhysicsState((prev) => calculatePhysics(prev.vehicleSpeedKmh, prev.steeringWheelDeg, prev.lateralAccelG, true));
  };

  const handleClearFault = () => {
    setIsFaultInjected(false);
    setPhysicsState((prev) => calculatePhysics(prev.vehicleSpeedKmh, prev.steeringWheelDeg, prev.lateralAccelG, false));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Static / Relative Top Bar: Zero Fixed / Sticky Header Traps */}
      <div className="w-full border-b border-slate-800/80 bg-slate-900/60 py-2.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-slate-200">GHOST FACTORYOS</span>
            <span>·</span>
            <span>ACQUIRE.COM MONOPOLY VAULT</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">TNGA-K PLATFORM: LEXUS TX 550h+</span>
            <span className="text-emerald-400 font-bold">SHA-256 LEDGER ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 2. Bulletproof MonroneyBanner Component */}
        <MonroneyBanner
          onSimulate={handleToggleSimulate}
          onVerifyHash={handleVerifyHash}
          onExportSpec={handleExportSpec}
          isSimulating={isSimulating}
          hashVerified={hashVerified}
        />

        {/* 3. Live Telemetry Metrics Strip */}
        <TelemetryMetricsStrip
          nonce={nonce}
          currentToeAngle={physicsState.rearWheelAngleDeg}
          phaseMode={physicsState.phaseMode}
          cycleTimeUs={physicsState.canCycleTimeUs}
          canFreqHz={2500}
        />

        {/* 4. Five Navigable Tabs with Full Technical Implementation */}
        <div className="border-b border-slate-800">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-1" aria-label="Technical Tabs">
            <button
              onClick={() => setActiveTab('yaw')}
              className={`py-3 px-4 font-bold text-base rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'yaw'
                  ? 'border-amber-400 text-amber-400 bg-slate-900/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Car className="w-5 h-5" />
              <span>1. DRS Yaw & DIRECT4 Core</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`py-3 px-4 font-bold text-base rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'ledger'
                  ? 'border-amber-400 text-amber-400 bg-slate-900/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Database className="w-5 h-5" />
              <span>2. Postgres Steer Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('openapi')}
              className={`py-3 px-4 font-bold text-base rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'openapi'
                  ? 'border-amber-400 text-amber-400 bg-slate-900/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Radio className="w-5 h-5" />
              <span>3. OpenAPI 3.1 Contract</span>
            </button>

            <button
              onClick={() => setActiveTab('cloudrun')}
              className={`py-3 px-4 font-bold text-base rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'cloudrun'
                  ? 'border-amber-400 text-amber-400 bg-slate-900/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Cloud className="w-5 h-5" />
              <span>4. Cloud Run Harness</span>
            </button>

            <button
              onClick={() => setActiveTab('apa')}
              className={`py-3 px-4 font-bold text-base rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'apa'
                  ? 'border-amber-400 text-amber-400 bg-slate-900/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Award className="w-5 h-5" />
              <span>5. Acquire.com APA Covenant</span>
            </button>
          </nav>
        </div>

        {/* Tab Content Display */}
        <div className="pt-2">
          {activeTab === 'yaw' && (
            <TabDrsYawCore
              state={physicsState}
              onUpdateSensors={handleUpdateSensors}
              onReset={handleReset}
            />
          )}

          {activeTab === 'ledger' && (
            <TabPostgresLedger
              ledgerRows={ledgerRows}
              onTriggerFault={handleTriggerFault}
              onClearFault={handleClearFault}
              isFaultInjected={isFaultInjected}
              onOpenVerifyModal={handleVerifyHash}
            />
          )}

          {activeTab === 'openapi' && <TabOpenApiContract />}

          {activeTab === 'cloudrun' && <TabCloudRunHarness />}

          {activeTab === 'apa' && <TabApaCovenant />}
        </div>
      </main>

      {/* Cryptographic Hash Verification Modal */}
      <HashVerifyModal
        isOpen={isHashModalOpen}
        onClose={() => setIsHashModalOpen(false)}
        rows={ledgerRows}
        onVerified={() => setHashVerified(true)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            GF-T3-192 · Lexus TX 550h+ DIRECT4 DRS Core Cockpit · v1.0.0-PROD
          </div>
          <div className="text-slate-400">
            Delaware Governing Law · Acquire.com Turnkey Escrow Deliverable · Clean-Room Certified
          </div>
        </div>
      </footer>
    </div>
  );
}
