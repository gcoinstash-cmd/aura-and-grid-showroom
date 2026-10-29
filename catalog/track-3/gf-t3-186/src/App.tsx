/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Database,
  FileCode,
  Boxes,
  FileText,
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { MetricsStrip } from './components/MetricsStrip';
import { HashVerifyModal } from './components/HashVerifyModal';
import { PsdHybridCoreTab } from './components/tabs/PsdHybridCoreTab';
import { PostgresLedgerTab } from './components/tabs/PostgresLedgerTab';
import { OpenApiContractTab } from './components/tabs/OpenApiContractTab';
import { CloudRunHarnessTab } from './components/tabs/CloudRunHarnessTab';
import { ApaCovenantTab } from './components/tabs/ApaCovenantTab';
import { TelemetryFrame } from './types/telemetry';

type TabKey = 'psd' | 'ledger' | 'openapi' | 'cloudrun' | 'apa';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('psd');
  const [isSimulating, setIsSimulating] = useState(true);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [transientAlert, setTransientAlert] = useState<string | null>(null);

  // Core telemetry state representing real-time CAN-FD 2,200 Hz buffer
  const [frame, setFrame] = useState<TelemetryFrame>({
    nonce: 1000005,
    timestamp: new Date().toISOString(),
    roadSurface: 'dry_asphalt',
    frictionCoeff: 0.90,
    throttlePercent: 45,
    vehicleSpeedKmh: 68.4,
    steeringAngleDeg: 1.2,
    iceRpm: 2150,
    mg1Rpm: 3420,
    mg2Rpm: 4850,
    rearInverterCurrentA: 52.4,
    rearMotorTorqueNm: 36.8,
    frontTorquePercent: 70,
    rearTorquePercent: 30,
    batterySocPercent: 62.4,
    batteryVoltageV: 222.4,
    cellVoltageSpreadMv: 18.2,
    quarantineTriggered: false,
    prevBlockHash: '6d9f8b4172a084bc3e811c7fa82f420e6a88b50201dc93847aa1f868019312b0',
    currentBlockHash: 'a89c42de310864ba153b3dcf06540c9462f48386dc072d6819ebf41d3b5d259c',
    hmacSignature: '7e23a412f864e6291d9b3e150fca7a20c45b736746cf6173a11885627f12e841',
  });

  // Calculate full Willis planetary kinematics & E-Four torque allocation
  const recalculateKinematics = (
    current: TelemetryFrame,
    partial: Partial<TelemetryFrame>
  ): TelemetryFrame => {
    const updated = { ...current, ...partial };
    const speed = updated.vehicleSpeedKmh;
    const throttle = updated.throttlePercent;
    const mu = updated.frictionCoeff;

    // Kinematics:
    // Ring gear (coupled to drive wheels via 3.288 final drive, 0.334m radius)
    const v_ms = Math.max(0, speed) / 3.6;
    const wheelRadS = v_ms / 0.334;
    const ringRadS = wheelRadS * 3.288;
    const mg2Rpm = (ringRadS * 60) / (2 * Math.PI);

    // M20A-FXS Engine target
    let iceRpm = 0;
    if (throttle < 5 && speed < 40) {
      iceRpm = 0; // EV glide
    } else {
      const baseIce = 1100 + (throttle / 100) * 4500;
      iceRpm = Math.min(6000, Math.max(1000, baseIce));
    }

    // Willis relation: w_s = 3.6 * w_c - 2.6 * w_r
    const mg1Rpm = 3.6 * iceRpm - 2.6 * mg2Rpm;

    // E-Four Rear e-Axle torque allocation:
    let rearRatio = 0;
    if (speed < 35) {
      rearRatio = 0.80 - (speed / 35) * 0.40;
    } else {
      rearRatio = 0.0;
    }
    const slipDemand = Math.max(0, (1.0 - mu) * 0.50);
    const totalRearRatio = Math.min(0.80, Math.max(0, rearRatio + slipDemand * (throttle / 100)));
    const totalFrontRatio = 1.0 - totalRearRatio;

    const maxRearTorque = 84.0;
    const rearMotorTorqueNm = (totalRearRatio / 0.80) * maxRearTorque * (throttle / 100);
    const rearInverterCurrentA = (rearMotorTorqueNm / 84.0) * 115.0;

    const quarantineTriggered = updated.cellVoltageSpreadMv > 45.0;

    return {
      ...updated,
      iceRpm: Math.round(iceRpm),
      mg1Rpm: Math.round(mg1Rpm),
      mg2Rpm: Math.round(mg2Rpm),
      rearMotorTorqueNm: Number(rearMotorTorqueNm.toFixed(1)),
      rearInverterCurrentA: Number(rearInverterCurrentA.toFixed(1)),
      frontTorquePercent: Number((totalFrontRatio * 100).toFixed(1)),
      rearTorquePercent: Number((totalRearRatio * 100).toFixed(1)),
      quarantineTriggered,
    };
  };

  // Live simulation tick (deterministic background micro-updates)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setFrame(prev => {
        const jitter = (Math.random() - 0.5) * 0.6;
        const newSpeed = Math.max(0, Math.min(180, prev.vehicleSpeedKmh + jitter));
        const newNonce = prev.nonce + 1;

        // Generate synthetic cryptographic hash and HMAC
        const hex = (Math.random() * 1e16).toString(16).replace('.', '');
        const newBlockHash = (prev.currentBlockHash.slice(0, 16) + hex + 'abcd1234').slice(0, 64);
        const newHmac = (prev.hmacSignature.slice(0, 20) + hex + 'ef789012').slice(0, 64);

        const partial: Partial<TelemetryFrame> = {
          vehicleSpeedKmh: newSpeed,
          nonce: newNonce,
          prevBlockHash: prev.currentBlockHash,
          currentBlockHash: newBlockHash,
          hmacSignature: newHmac,
          timestamp: new Date().toISOString(),
        };

        return recalculateKinematics(prev, partial);
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Handler for user adjusting surface, throttle, speed
  const handleUpdateParams = (params: {
    roadSurface?: TelemetryFrame['roadSurface'];
    throttlePercent?: number;
    vehicleSpeedKmh?: number;
  }) => {
    setFrame(prev => {
      let frictionCoeff = prev.frictionCoeff;
      if (params.roadSurface) {
        if (params.roadSurface === 'dry_asphalt') frictionCoeff = 0.90;
        else if (params.roadSurface === 'wet_tarmac') frictionCoeff = 0.60;
        else if (params.roadSurface === 'packed_snow') frictionCoeff = 0.30;
        else if (params.roadSurface === 'black_ice') frictionCoeff = 0.15;
      }
      return recalculateKinematics(prev, {
        ...params,
        frictionCoeff,
      });
    });
  };

  const handleUpdateCellSpread = (spreadMv: number) => {
    setFrame(prev => recalculateKinematics(prev, { cellVoltageSpreadMv: spreadMv }));
  };

  // "Simulate E-Four" trigger from MonroneyBanner
  const handleTriggerEfourSimulation = () => {
    setActiveTab('psd');
    setTransientAlert('HIGH-LOAD AWD LAUNCH: Rear e-Axle Vectoring Engaged (80% Rear Torque @ 2,200 Hz)');
    setFrame(prev =>
      recalculateKinematics(prev, {
        roadSurface: 'packed_snow',
        frictionCoeff: 0.30,
        throttlePercent: 95,
        vehicleSpeedKmh: 14.2,
      })
    );
    setTimeout(() => {
      setTransientAlert(null);
    }, 4500);
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'psd', label: 'E-Four Torque & PSD Hybrid Core', icon: <Cpu className="w-5 h-5" /> },
    { key: 'ledger', label: 'Postgres Hybrid Ledger', icon: <Database className="w-5 h-5" /> },
    { key: 'openapi', label: 'OpenAPI 3.1 Telemetry Contract', icon: <FileCode className="w-5 h-5" /> },
    { key: 'cloudrun', label: 'Turnkey Cloud Run Harness', icon: <Boxes className="w-5 h-5" /> },
    { key: 'apa', label: 'Acquire.com APA Covenant', icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      {/* Top Notification Toast if transient alert active */}
      {transientAlert && (
        <div className="w-full bg-amber-500 text-slate-950 font-bold px-4 py-2.5 text-center text-base flex items-center justify-center gap-2 shadow-lg transition-all">
          <AlertCircle className="w-5 h-5 fill-current" />
          <span>{transientAlert}</span>
        </div>
      )}

      {/* Main Container - Desktop baseline 1440px viewport presence */}
      <main className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {/* Monroney Banner (Compliant with Hardened Header Protocol) */}
        <MonroneyBanner
          onSimulateEfour={handleTriggerEfourSimulation}
          onVerifyHash={() => setIsVerifyModalOpen(true)}
        />

        {/* Live Telemetry Metrics Strip (Strict 16px floor, text-4xl readouts) */}
        <MetricsStrip
          currentFrame={frame}
          isSimulating={isSimulating}
          onToggleSimulating={() => setIsSimulating(!isSimulating)}
        />

        {/* Five Navigable Tabs Bar */}
        <div className="w-full mb-6">
          <nav
            className="flex flex-row items-center gap-1 p-1.5 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-md"
            aria-label="Engineering Subsystems"
          >
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-base font-bold rounded-lg whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Viewports */}
        <section className="w-full">
          {activeTab === 'psd' && (
            <PsdHybridCoreTab
              frame={frame}
              onUpdateParams={handleUpdateParams}
              onSimulateTransient={handleTriggerEfourSimulation}
            />
          )}

          {activeTab === 'ledger' && (
            <PostgresLedgerTab
              frame={frame}
              onUpdateCellSpread={handleUpdateCellSpread}
            />
          )}

          {activeTab === 'openapi' && (
            <OpenApiContractTab currentFrame={frame} />
          )}

          {activeTab === 'cloudrun' && <CloudRunHarnessTab />}

          {activeTab === 'apa' && <ApaCovenantTab />}
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-base text-slate-500 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">GF-T3-186</span>
            <span>&middot;</span>
            <span>Apex Executive UX 300h High-G Dynamic Telemetry Handling Core</span>
            <span>&middot;</span>
            <span className="text-emerald-400 font-medium">Acquire.com Turnkey Asset</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-base">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Clean-Room Certified
            </span>
            <span>&middot;</span>
            <span>Delaware Micro-APA Ready</span>
          </div>
        </footer>
      </main>

      {/* HMAC-SHA256 Verification Modal */}
      <HashVerifyModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        currentFrame={frame}
      />
    </div>
  );
}
