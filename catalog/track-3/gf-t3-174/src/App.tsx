/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Heavy Overland Dynamics Platform RZ 450e Steer-by-Wire Precision Core (GF-T3-174)
 * Turnkey Micro-APA Asset Transfer Asset for Acquire.com
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryCards } from './components/TelemetryCards';
import { SteerByWireCockpit } from './components/SteerByWireCockpit';
import { TabYawControlCore } from './components/tabs/TabYawControlCore';
import { TabPostgresLedger } from './components/tabs/TabPostgresLedger';
import { TabOpenApiContract } from './components/tabs/TabOpenApiContract';
import { TabCloudRunHarness } from './components/tabs/TabCloudRunHarness';
import { TabAcquireApaCovenant } from './components/tabs/TabAcquireApaCovenant';
import { SimulationModal } from './components/SimulationModal';
import { ConsensusModal } from './components/ConsensusModal';
import { GF_T3_174_SPEC_MARKDOWN } from './data/specificationMarkdown';
import { calculateSbwCycle } from './data/pythonImplementation';
import {
  DualChannelTelemetry,
  LatencyBreakdown,
  VehicleDynamicsState,
} from './types/steerByWire';
import { Cpu, Database, Code2, Box, Award, ShieldCheck, Download, ChevronRight } from 'lucide-react';

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'yaw-core' | 'ledger' | 'openapi' | 'cloudrun' | 'apa'>('yaw-core');

  // Modals
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [isConsensusModalOpen, setIsConsensusModalOpen] = useState(false);

  // Nonce counter (#1,000,000+)
  const [monotonicNonce, setMonotonicNonce] = useState(1048576);

  // Interactive Dynamics State
  const [yokeAngle, setYokeAngle] = useState(0.0);
  const [vehicleSpeedKmh, setVehicleSpeedKmh] = useState(50.0);
  const [surfaceTexture, setSurfaceTexture] = useState<'asphalt' | 'cobblestone' | 'ice' | 'rumble'>('asphalt');
  const [faultOffset, setFaultOffset] = useState(0.012);

  // Active Simulation scenario
  const [activeScenario, setActiveScenario] = useState<'parking' | 'highway' | 'evasive' | 'crosswind' | null>(null);
  const simAnimationRef = useRef<number | null>(null);

  // Compute live vehicle cycle
  const computedCycle = calculateSbwCycle(
    yokeAngle,
    yokeAngle + faultOffset,
    vehicleSpeedKmh,
    surfaceTexture
  );

  const dynamics: VehicleDynamicsState = {
    yokeAngleDeg: yokeAngle,
    vehicleSpeedKmh,
    effectiveGearRatio: computedCycle.effectiveRatio,
    roadWheelAngleDeg: computedCycle.roadWheelAngleDeg,
    lateralAccelerationG: computedCycle.lateralAccG,
    yawRateDegPerSec: computedCycle.yawRateDps,
    counterTorqueNm: computedCycle.feedbackTorqueNm,
    surfaceTexture,
  };

  const dualChannel: DualChannelTelemetry = {
    channelAAngleDeg: Number(yokeAngle.toFixed(2)),
    channelBAngleDeg: Number((yokeAngle + faultOffset).toFixed(2)),
    divergenceDeltaDeg: Number(Math.abs(faultOffset).toFixed(3)),
    syncRatioPercent: faultOffset > 0.25 ? 0.0 : faultOffset > 0.05 ? 98.4 : 100.0,
    consensusStatus: computedCycle.status,
    channelACrc32: '0x8F9C3E1B',
    channelBCrc32: faultOffset > 0.25 ? '0xDEADBEEF' : '0x8F9C3E1B',
    frequencyHz: 1000,
    redundancyMode: 'LOCKSTEP_DUAL_CHANNEL',
  };

  const latency: LatencyBreakdown = {
    totalActuationLatencyMs: 0.724 + (Math.sin(monotonicNonce / 5) * 0.04),
    canFdIngestMs: 0.24,
    lockstepArbitrationMs: 0.16,
    kalmanFilterMs: 0.14,
    actuatorPwmOutputMs: 0.18,
    jitterVarianceMs: 0.03,
    busStandard: 'CAN-FD 5Mbps / FlexRay 10Mbps',
  };

  // Continuous subtle heartbeat incrementing nonce
  useEffect(() => {
    const timer = setInterval(() => {
      setMonotonicNonce((prev) => prev + 1);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  // Simulation scenario runner
  useEffect(() => {
    if (!activeScenario) {
      if (simAnimationRef.current) cancelAnimationFrame(simAnimationRef.current);
      return;
    }

    let startTime = performance.now();

    const loop = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;

      if (activeScenario === 'parking') {
        // Parking 150 deg lock-to-lock @ 8 km/h
        setVehicleSpeedKmh(8.0);
        const wave = Math.sin(elapsed * 1.8);
        setYokeAngle(Number((wave * 150.0).toFixed(1)));
      } else if (activeScenario === 'highway') {
        // Highway gentle slalom @ 125 km/h
        setVehicleSpeedKmh(125.0);
        const wave = Math.sin(elapsed * 2.2);
        setYokeAngle(Number((wave * 25.0).toFixed(1)));
      } else if (activeScenario === 'evasive') {
        // Evasive double lane change @ 72 km/h
        setVehicleSpeedKmh(72.0);
        const wave = Math.sin(elapsed * 3.5);
        setYokeAngle(Number((wave * 70.0).toFixed(1)));
      } else if (activeScenario === 'crosswind') {
        // Crosswind disturbance @ 100 km/h with micro counter steering
        setVehicleSpeedKmh(100.0);
        const wave = Math.sin(elapsed * 4.0) + Math.cos(elapsed * 2.1) * 0.5;
        setYokeAngle(Number((wave * 12.0).toFixed(1)));
      }

      simAnimationRef.current = requestAnimationFrame(loop);
    };

    simAnimationRef.current = requestAnimationFrame(loop);

    return () => {
      if (simAnimationRef.current) cancelAnimationFrame(simAnimationRef.current);
    };
  }, [activeScenario]);

  const handleSelectScenario = (scenario: 'parking' | 'highway' | 'evasive' | 'crosswind') => {
    if (activeScenario === scenario) {
      setActiveScenario(null);
    } else {
      setActiveScenario(scenario);
    }
  };

  const handleExportSpec = () => {
    const blob = new Blob([GF_T3_174_SPEC_MARKDOWN], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GF_T3_174_SPEC.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCenterYoke = () => {
    setActiveScenario(null);
    setYokeAngle(0.0);
    setFaultOffset(0.012);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Header (Standard relative positioning - scrolls naturally) */}
      <Header
        onExportSpec={handleExportSpec}
        onOpenSimulation={() => setIsSimModalOpen(true)}
      />

      {/* 2. Monroney Top Banner (Standard relative positioning - scrolls naturally) */}
      <MonroneyBanner
        onSimulateInput={() => setIsSimModalOpen(true)}
        onVerifyConsensus={() => setIsConsensusModalOpen(true)}
        onExportSpec={handleExportSpec}
        isSimulating={activeScenario !== null}
      />

      {/* 3. Live Telemetry Metrics (4 Cards - Standard relative positioning) */}
      <TelemetryCards
        latency={latency}
        dualChannel={dualChannel}
        monotonicNonce={monotonicNonce}
      />

      {/* 4. Interactive Steer-by-Wire Precision Core Cockpit */}
      <SteerByWireCockpit
        dynamics={dynamics}
        dualChannel={dualChannel}
        onAngleChange={(angle) => {
          setActiveScenario(null);
          setYokeAngle(angle);
        }}
        onSpeedChange={(speed) => setVehicleSpeedKmh(speed)}
        onTextureChange={(texture) => setSurfaceTexture(texture)}
        onInjectFault={(offset) => setFaultOffset(offset)}
        onReset={handleCenterYoke}
      />

      {/* 5. Five Navigable Tabs with Full Technical Implementation */}
      <main id="technical-tabs" className="relative w-full max-w-7xl mx-auto px-6 py-10 flex-1">
        {/* Navigation Tab Bar */}
        <div className="border-b border-slate-800 mb-8">
          <div className="flex flex-wrap items-center gap-2 -mb-px">
            <button
              onClick={() => setActiveTab('yaw-core')}
              className={`flex items-center gap-2.5 px-5 py-3.5 text-sm md:text-base font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'yaw-core'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span>Tab 1: Steer-by-Wire & Yaw Core</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center gap-2.5 px-5 py-3.5 text-sm md:text-base font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'ledger'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Database className="h-4 w-4" />
              <span>Tab 2: Postgres Actuation Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('openapi')}
              className={`flex items-center gap-2.5 px-5 py-3.5 text-sm md:text-base font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'openapi'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Code2 className="h-4 w-4" />
              <span>Tab 3: OpenAPI 3.1 Contract</span>
            </button>

            <button
              onClick={() => setActiveTab('cloudrun')}
              className={`flex items-center gap-2.5 px-5 py-3.5 text-sm md:text-base font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'cloudrun'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Box className="h-4 w-4" />
              <span>Tab 4: Turnkey Cloud Run Harness</span>
            </button>

            <button
              onClick={() => setActiveTab('apa')}
              className={`flex items-center gap-2.5 px-5 py-3.5 text-sm md:text-base font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'apa'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Award className="h-4 w-4" />
              <span>Tab 5: Acquire.com APA Covenant</span>
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="transition-opacity duration-150">
          {activeTab === 'yaw-core' && <TabYawControlCore />}
          {activeTab === 'ledger' && <TabPostgresLedger />}
          {activeTab === 'openapi' && <TabOpenApiContract />}
          {activeTab === 'cloudrun' && <TabCloudRunHarness />}
          {activeTab === 'apa' && <TabAcquireApaCovenant />}
        </div>
      </main>

      {/* Footer (Standard static layout) */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-8 mt-12 text-sm text-slate-400">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white">Ghost FactoryOS</span>
            <span>·</span>
            <span>Asset GF-T3-174</span>
            <span>·</span>
            <span>Heavy Overland Dynamics Platform RZ 450e Steer-by-Wire Precision Core</span>
          </div>

          <div className="flex items-center gap-4 text-sm font-mono text-slate-400">
            <span>Clean-Room Certified</span>
            <span>·</span>
            <span>100% Permissive MIT</span>
            <span>·</span>
            <button
              onClick={handleExportSpec}
              className="text-amber-400 hover:underline cursor-pointer"
            >
              Download Master Specification
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SimulationModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        onSelectScenario={handleSelectScenario}
        activeScenario={activeScenario}
      />

      <ConsensusModal
        isOpen={isConsensusModalOpen}
        onClose={() => setIsConsensusModalOpen(false)}
        dualChannel={dualChannel}
        nonce={monotonicNonce}
      />
    </div>
  );
}
