/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { LiveTelemetryCards } from './components/LiveTelemetryCards';
import { ChassisVisualizer } from './components/ChassisVisualizer';
import { SensorFusionTab } from './components/tabs/SensorFusionTab';
import { TimescaleLedgerTab } from './components/tabs/TimescaleLedgerTab';
import { OpenApiContractTab } from './components/tabs/OpenApiContractTab';
import { CloudRunHarnessTab } from './components/tabs/CloudRunHarnessTab';
import { AcquireApaTab } from './components/tabs/AcquireApaTab';
import { EKFState, SensorInput, LedgerBlock } from './types/telemetry';
import { GF_T3_168_SPEC_MARKDOWN } from './data/specDocument';
import { Cpu, Database, Network, Server, ShieldCheck, Download } from 'lucide-react';

export default function App() {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'fusion' | 'timescale' | 'openapi' | 'cloudrun' | 'apa'>('fusion');

  // Streaming & Simulation State
  const [isStreaming, setIsStreaming] = useState(true);
  const [fusionHz, setFusionHz] = useState(1000);
  const [jitterMs, setJitterMs] = useState(0.024);
  const [blockHeight, setBlockHeight] = useState(1042918);
  const [verifiedChain, setVerifiedChain] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tamperDetected, setTamperDetected] = useState(false);
  const [tamperedIndex, setTamperedIndex] = useState<number | null>(null);

  // Dynamic simulation parameters
  const simParamsRef = useRef({
    speedKmh: 85,
    yawRateDeg: 4.2,
    gpsNoiseM: 0.014,
    accelBiasDrift: 0.005,
  });

  // EKF State Vector
  const [ekfState, setEkfState] = useState<EKFState>({
    timeMs: Date.now(),
    px: 124.52,
    py: 45.18,
    pz: -0.42,
    vx: 23.61, // ~85 km/h
    vy: 0.12,
    vz: 0.01,
    roll: 0.012,
    pitch: 0.008,
    yaw: 0.345,
    b_ax: 0.0042,
    b_ay: -0.0018,
    b_az: 0.0011,
    b_gx: 0.00012,
    b_gy: -0.00008,
    b_gz: 0.00015,
    traceP: 0.00284,
    conditionNumber: 1.082,
    innovationNorm: 0.0031,
  });

  // Sensor Readings
  const [sensorInput, setSensorInput] = useState<SensorInput>({
    ax: 0.15,
    ay: 1.25,
    az: -9.806,
    gx: 0.2,
    gy: -0.1,
    gz: 4.2,
    mx: 24.5,
    my: -12.1,
    mz: 41.8,
    lat: 34.052234,
    lon: -118.243685,
    alt: 84.5,
    gpsFix: 'RTK_FIXED',
    gpsAccuracy: 0.014,
    wheelSpeedFL: 85.2,
    wheelSpeedFR: 85.8,
    wheelSpeedRL: 84.9,
    wheelSpeedRR: 85.5,
    rearSteerAngleDeg: 1.8,
    frontTorquePct: 45,
    rearTorquePct: 55,
  });

  // Initial Simulated Ledger Blocks
  const [ledgerBlocks, setLedgerBlocks] = useState<LedgerBlock[]>([
    {
      height: 1042918,
      timestamp: '2026-10-10 23:09:45.120 UTC',
      sensorPayload: {
        imu_tick: 1042918,
        gps_time_utc: '2026-10-10T23:09:45.120Z',
        ekf_state_hash: '9f86d081884c7d65',
        wheel_speeds_rpm: [85, 86, 85, 86],
        torque_distribution_nm: [450, 550],
      },
      prevHash: '7b8b6f4e1d2c3a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
      hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      hmacSignature: 'a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7',
      merkleRoot: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
    },
    {
      height: 1042917,
      timestamp: '2026-10-10 23:09:44.120 UTC',
      sensorPayload: {
        imu_tick: 1042917,
        gps_time_utc: '2026-10-10T23:09:44.120Z',
        ekf_state_hash: '3f78a19d084c7d65',
        wheel_speeds_rpm: [84, 85, 84, 85],
        torque_distribution_nm: [420, 580],
      },
      prevHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      hash: '7b8b6f4e1d2c3a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
      hmacSignature: 'f1e2d3c4b5a697887766554433221100ffeeddccbbaa99887766554433221100',
      merkleRoot: 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9',
    },
    {
      height: 1042916,
      timestamp: '2026-10-10 23:09:43.120 UTC',
      sensorPayload: {
        imu_tick: 1042916,
        gps_time_utc: '2026-10-10T23:09:43.120Z',
        ekf_state_hash: '1a2b3c4d5e6f7a8b',
        wheel_speeds_rpm: [83, 84, 83, 84],
        torque_distribution_nm: [400, 600],
      },
      prevHash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      hmacSignature: 'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2',
      merkleRoot: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    },
    {
      height: 1042915,
      timestamp: '2026-10-10 23:09:42.120 UTC',
      sensorPayload: {
        imu_tick: 1042915,
        gps_time_utc: '2026-10-10T23:09:42.120Z',
        ekf_state_hash: '8f7e6d5c4b3a2109',
        wheel_speeds_rpm: [82, 83, 82, 83],
        torque_distribution_nm: [500, 500],
      },
      prevHash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
      hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      hmacSignature: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      merkleRoot: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    },
  ]);

  // Real-time deterministic EKF mechanization simulation loop
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const p = simParamsRef.current;
      const targetSpeedMps = (p.speedKmh / 3.6);
      const targetYawRad = (p.yawRateDeg * Math.PI) / 180;

      // Small jitter for 1,000 Hz cycle simulation
      const currentJitter = 0.015 + (Math.random() - 0.5) * 0.02;
      setJitterMs(Math.abs(currentJitter));

      setEkfState((prev) => {
        // Integrate position along trajectory
        const dt = 0.1;
        const newYaw = prev.yaw + targetYawRad * dt;
        const vx = targetSpeedMps * Math.cos(newYaw);
        const vy = targetSpeedMps * Math.sin(newYaw);
        const px = prev.px + vx * dt;
        const py = prev.py + vy * dt;

        // Covariance trace contraction (P < 0.004 m^2)
        const trace = Math.max(0.0022, 0.00284 + Math.sin(now / 2000) * 0.0004);
        const innoNorm = 0.002 + Math.abs(Math.sin(now / 1500)) * 0.002;

        return {
          ...prev,
          timeMs: now,
          px,
          py,
          vx,
          vy,
          yaw: newYaw,
          traceP: trace,
          innovationNorm: innoNorm,
          b_ax: p.accelBiasDrift + (Math.random() - 0.5) * 0.0005,
          b_ay: -0.0018 + (Math.random() - 0.5) * 0.0003,
        };
      });

      setSensorInput((prev) => {
        const speed = p.speedKmh + (Math.random() - 0.5) * 0.8;
        // DIRECT4 torque split: shifts rearward during cornering
        const cornerFactor = Math.min(Math.abs(p.yawRateDeg) / 25, 1);
        const rearRatio = Math.round(50 + cornerFactor * 25);
        const frontRatio = 100 - rearRatio;

        // Dynamic rear steering angle (up to 4 degrees)
        const drs = Number(((p.yawRateDeg / 25) * 3.8).toFixed(1));

        return {
          ...prev,
          ax: (Math.random() - 0.5) * 0.2,
          ay: targetSpeedMps * targetYawRad,
          gz: p.yawRateDeg,
          wheelSpeedFL: speed,
          wheelSpeedFR: speed + (p.yawRateDeg * 0.1),
          wheelSpeedRL: speed,
          wheelSpeedRR: speed + (p.yawRateDeg * 0.1),
          rearSteerAngleDeg: drs,
          frontTorquePct: frontRatio,
          rearTorquePct: rearRatio,
        };
      });

      // Increment block height steadily
      setBlockHeight((h) => h + 1);
    }, 150);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Parameter update from Sensor Fusion tab
  const handleUpdateParameters = (params: {
    speedKmh: number;
    yawRateDeg: number;
    gpsNoiseM: number;
    accelBiasDrift: number;
  }) => {
    simParamsRef.current = params;
  };

  const handleResetFilter = () => {
    setEkfState((prev) => ({
      ...prev,
      traceP: 0.0095,
      b_ax: 0.0,
      b_ay: 0.0,
      b_az: 0.0,
      b_gx: 0.0,
      b_gy: 0.0,
      b_gz: 0.0,
    }));
  };

  // Cryptographic chain verification
  const handleVerifyChain = async () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      if (tamperDetected) {
        setVerifiedChain(false);
      } else {
        setVerifiedChain(true);
      }
    }, 450);
  };

  // Tamper injection test
  const handleInjectTamper = (index: number) => {
    setTamperDetected(true);
    setTamperedIndex(index);
    setVerifiedChain(false);
    setLedgerBlocks((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          isTampered: true,
          hash: '0000000000000000TAMPERED_BYTE_PAYLOAD_MISMATCH',
        };
      }
      return updated;
    });
  };

  const handleRepairChain = () => {
    setTamperDetected(false);
    setTamperedIndex(null);
    setVerifiedChain(true);
    setLedgerBlocks((prev) =>
      prev.map((b) => ({
        ...b,
        isTampered: false,
        hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      }))
    );
  };

  const handleExportSpec = () => {
    const blob = new Blob([GF_T3_168_SPEC_MARKDOWN], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'GF_T3_168_SPEC.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 
        TOP BAR CONTRACT:
        Zone 1: Brand title, single line wordmark
        Zone 2: Clean 5 nav links
        Zone 3: Primary CTA action
        Standard relative positioning (scrolls naturally with document).
      */}
      <header className="relative w-full border-b border-slate-800 bg-slate-950/95 px-6 py-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
              GHOST FACTORYOS
            </span>
            <span className="text-sm uppercase font-mono text-cyan-400 font-bold px-2.5 py-1 bg-cyan-950/60 border border-cyan-800/60 rounded">
              GF-T3-168
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-base font-medium text-slate-300">
            <button
              onClick={() => setActiveTab('fusion')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'fusion' ? 'text-cyan-400 font-bold' : ''
              }`}
            >
              Sensor Fusion
            </button>
            <button
              onClick={() => setActiveTab('timescale')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'timescale' ? 'text-cyan-400 font-bold' : ''
              }`}
            >
              Timescale Ledger
            </button>
            <button
              onClick={() => setActiveTab('openapi')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'openapi' ? 'text-cyan-400 font-bold' : ''
              }`}
            >
              OpenAPI Contract
            </button>
            <button
              onClick={() => setActiveTab('cloudrun')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'cloudrun' ? 'text-cyan-400 font-bold' : ''
              }`}
            >
              Cloud Run Harness
            </button>
            <button
              onClick={() => setActiveTab('apa')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'apa' ? 'text-cyan-400 font-bold' : ''
              }`}
            >
              Acquire.com APA
            </button>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleExportSpec}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Master SPEC</span>
            </button>
          </div>
        </div>
      </header>

      {/* 
        MONRONEY BANNER:
        Standard relative positioning (scrolls naturally out of the viewport when scrolling down).
      */}
      <MonroneyBanner
        isStreaming={isStreaming}
        onToggleStreaming={() => setIsStreaming(!isStreaming)}
        onVerifyChain={handleVerifyChain}
        isVerifying={isVerifying}
        verificationStatus={{
          verified: verifiedChain,
          blockCount: ledgerBlocks.length,
          lastVerifiedAt: new Date().toLocaleTimeString(),
        }}
      />

      {/* 
        LIVE TELEMETRY CARDS (4 Cards):
        Standard relative positioning (scrolls naturally with document).
      */}
      <LiveTelemetryCards
        fusionHz={fusionHz}
        jitterMs={jitterMs}
        traceP={ekfState.traceP}
        blockHeight={blockHeight}
        verifiedChain={verifiedChain}
        tamperDetected={tamperDetected}
      />

      {/* MAIN COCKPIT WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 sm:px-8 space-y-8">
        {/* Interactive Lexus RX 500h F SPORT DIRECT4 Chassis HUD */}
        <ChassisVisualizer
          ekfState={ekfState}
          sensorInput={sensorInput}
          isStreaming={isStreaming}
        />

        {/* Five Navigable Tabs Bar */}
        <section className="space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-2.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('fusion')}
              className={`inline-flex items-center gap-2 px-4.5 py-3 rounded-lg text-base font-bold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'fusion'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Cpu className="w-5 h-5" />
              <span>Tab 1: Sensor Fusion Core</span>
            </button>

            <button
              onClick={() => setActiveTab('timescale')}
              className={`inline-flex items-center gap-2 px-4.5 py-3 rounded-lg text-base font-bold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'timescale'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Database className="w-5 h-5" />
              <span>Tab 2: Timescale SQL Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('openapi')}
              className={`inline-flex items-center gap-2 px-4.5 py-3 rounded-lg text-base font-bold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'openapi'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Network className="w-5 h-5" />
              <span>Tab 3: OpenAPI 3.1 Contract</span>
            </button>

            <button
              onClick={() => setActiveTab('cloudrun')}
              className={`inline-flex items-center gap-2 px-4.5 py-3 rounded-lg text-base font-bold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'cloudrun'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Server className="w-5 h-5" />
              <span>Tab 4: Turnkey Cloud Run Harness</span>
            </button>

            <button
              onClick={() => setActiveTab('apa')}
              className={`inline-flex items-center gap-2 px-4.5 py-3 rounded-lg text-base font-bold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'apa'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Tab 5: Acquire.com APA Covenant</span>
            </button>
          </div>

          {/* Active Tab Viewport */}
          <div className="pt-2">
            {activeTab === 'fusion' && (
              <SensorFusionTab
                ekfState={ekfState}
                sensorInput={sensorInput}
                onUpdateParameters={handleUpdateParameters}
                onResetFilter={handleResetFilter}
              />
            )}

            {activeTab === 'timescale' && (
              <TimescaleLedgerTab
                ledgerBlocks={ledgerBlocks}
                onVerifyChain={handleVerifyChain}
                onInjectTamper={handleInjectTamper}
                onRepairChain={handleRepairChain}
                isVerifying={isVerifying}
                tamperDetected={tamperDetected}
                tamperedIndex={tamperedIndex}
              />
            )}

            {activeTab === 'openapi' && (
              <OpenApiContractTab
                ekfState={ekfState}
                sensorInput={sensorInput}
              />
            )}

            {activeTab === 'cloudrun' && <CloudRunHarnessTab />}

            {activeTab === 'apa' && <AcquireApaTab />}
          </div>
        </section>
      </main>

      {/* QUIET FOOTER */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950 px-6 py-8 sm:px-8 mt-12 text-sm text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white">Asset GF-T3-168</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>Ghost FactoryOS Track 3 F1 Skunkworks Engine</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="text-emerald-400 font-semibold">Clean-Room Certified MIT</span>
          </div>
          <div>
            Acquire.com Turnkey Micro-APA Deposit & Escrow Vault Ready ($45,000 USD)
          </div>
        </div>
      </footer>
    </div>
  );
}
