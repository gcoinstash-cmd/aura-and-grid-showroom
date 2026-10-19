/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryMetricsStrip } from './components/TelemetryMetricsStrip';
import { TachometerCluster } from './components/TachometerCluster';
import { TabV10Acoustics } from './components/tabs/TabV10Acoustics';
import { TabPostgresLedger } from './components/tabs/TabPostgresLedger';
import { TabOpenAPISpec } from './components/tabs/TabOpenAPISpec';
import { TabCloudRunHarness } from './components/tabs/TabCloudRunHarness';
import { TabAPACovenant } from './components/tabs/TabAPACovenant';
import { VerificationModal } from './components/VerificationModal';
import { TelemetryState } from './types/telemetry';
import { lfaSound } from './utils/audioSynth';
import { Cpu, Database, Network, Server, FileText } from 'lucide-react';

export default function App() {
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    rpm: 950.0,
    targetRpm: 950.0,
    gear: 1,
    throttlePct: 0.0,
    intakeHarmonicHz: 950.0 / 12.0,
    titaniumValveHz: (950.0 / 60.0) * 20.0,
    surgeTankDecibels: 92.4,
    scavengePressureBar: 5.4,
    oilTempC: 98,
    coolantTempC: 92,
    asgShiftDurationMs: 150.0,
    asgHydraulicPressurePsi: 720,
    isShifting: false,
    shiftForkPositionMm: 0.0,
    telemetryNonce: 1004821,
    hmacSignature: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    isRedlining: false,
    isRevving: false,
  });

  const [activeTab, setActiveTab] = useState<'acoustics' | 'postgres' | 'openapi' | 'cloudrun' | 'covenant'>('acoustics');
  const [isMuted, setIsMuted] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  const revIntervalRef = useRef<number | null>(null);

  // Background ticker for subtle live engine variance and HMAC updates
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTelemetry((prev) => {
        if (prev.isRevving) return prev;

        // Subtle idle vibration (+- 15 RPM)
        const jitter = (Math.random() - 0.5) * 16;
        const currentRpm = Math.max(920, Math.min(980, prev.rpm + jitter));
        const f0 = currentRpm / 12.0;
        const valveHz = (currentRpm / 60.0) * 20.0;
        const nextNonce = prev.telemetryNonce + 1;

        // Dynamic HMAC simulation signature
        const hexChars = '0123456789abcdef';
        let signature = prev.hmacSignature;
        if (nextNonce % 5 === 0) {
          signature = Array.from({ length: 64 }, () => hexChars[Math.floor(Math.random() * 16)]).join('');
        }

        return {
          ...prev,
          rpm: currentRpm,
          intakeHarmonicHz: f0,
          titaniumValveHz: valveHz,
          telemetryNonce: nextNonce,
          hmacSignature: signature,
        };
      });
    }, 400);

    return () => clearInterval(timer);
  }, []);

  // Update audio synth when RPM changes
  useEffect(() => {
    lfaSound.updateRpm(telemetry.rpm);
  }, [telemetry.rpm]);

  // Handle manual throttle change
  const handleThrottleChange = (pct: number) => {
    if (telemetry.isRevving) return;

    if (!isMuted && !lfaSound.isRunning()) {
      lfaSound.start();
    }

    const calculatedRpm = 950 + (pct / 100) * (9000 - 950);
    const f0 = calculatedRpm / 12.0;
    const valveHz = (calculatedRpm / 60.0) * 20.0;
    const db = 92.0 + 36.0 * Math.pow(calculatedRpm / 9000, 1.3) * (0.4 + 0.6 * (pct / 100));
    const oilBar = 3.4 + 2.8 * (calculatedRpm / 9000);

    setTelemetry((prev) => ({
      ...prev,
      rpm: calculatedRpm,
      throttlePct: pct,
      intakeHarmonicHz: f0,
      titaniumValveHz: valveHz,
      surgeTankDecibels: db,
      scavengePressureBar: oilBar,
      isRedlining: calculatedRpm >= 8900,
    }));
  };

  // Sound toggle
  const handleToggleMute = () => {
    const muted = lfaSound.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      lfaSound.start();
      lfaSound.updateRpm(telemetry.rpm);
    }
  };

  // Paddle shifts (ASG 150ms simulation)
  const handleShiftUp = () => {
    if (telemetry.gear >= 6 || telemetry.isShifting) return;
    setTelemetry((prev) => ({
      ...prev,
      isShifting: true,
      asgShiftDurationMs: 0,
      shiftForkPositionMm: 14.2,
    }));

    // 150 ms shift cycle
    setTimeout(() => {
      setTelemetry((prev) => ({
        ...prev,
        gear: prev.gear + 1,
        isShifting: false,
        asgShiftDurationMs: 150.0,
        shiftForkPositionMm: 0.0,
        rpm: Math.max(950, prev.rpm * 0.78),
      }));
    }, 150);
  };

  const handleShiftDown = () => {
    if (telemetry.gear <= 1 || telemetry.isShifting) return;
    setTelemetry((prev) => ({
      ...prev,
      isShifting: true,
      asgShiftDurationMs: 0,
      shiftForkPositionMm: 12.8,
    }));

    // 150 ms shift cycle with rev blip
    setTimeout(() => {
      setTelemetry((prev) => ({
        ...prev,
        gear: prev.gear - 1,
        isShifting: false,
        asgShiftDurationMs: 150.0,
        shiftForkPositionMm: 0.0,
        rpm: Math.min(9000, prev.rpm * 1.25),
      }));
    }, 150);
  };

  // Simulate V10 Rev (0.60s idle to 9,000 RPM sweep!)
  const handleSimulateRev = () => {
    if (telemetry.isRevving) return;

    if (!isMuted) {
      lfaSound.start();
    }

    setTelemetry((prev) => ({
      ...prev,
      isRevving: true,
      throttlePct: 100,
    }));

    const startTime = performance.now();
    const startRpm = telemetry.rpm;
    const targetRpm = 9000.0;
    const sweepDuration = 600.0; // 0.60 seconds!

    const step = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed < sweepDuration) {
        const progress = elapsed / sweepDuration;
        // Exponential rev ramp
        const currentRpm = startRpm + (targetRpm - startRpm) * Math.pow(progress, 1.15);
        const f0 = currentRpm / 12.0;
        const valveHz = (currentRpm / 60.0) * 20.0;
        const db = 92.0 + 36.0 * Math.pow(currentRpm / 9000, 1.3);
        const oilBar = 3.4 + 2.8 * (currentRpm / 9000);

        setTelemetry((prev) => ({
          ...prev,
          rpm: currentRpm,
          intakeHarmonicHz: f0,
          titaniumValveHz: valveHz,
          surgeTankDecibels: db,
          scavengePressureBar: oilBar,
          isRedlining: currentRpm >= 8900,
          telemetryNonce: prev.telemetryNonce + 1,
        }));

        requestAnimationFrame(step);
      } else {
        // Redline peak reached: hold for 300ms, then initiate 150ms ASG shift drop and settle back
        setTelemetry((prev) => ({
          ...prev,
          rpm: 9000.0,
          intakeHarmonicHz: 750.0,
          titaniumValveHz: 3000.0,
          surgeTankDecibels: 128.0,
          scavengePressureBar: 6.2,
          isRedlining: true,
        }));

        setTimeout(() => {
          // Snap ASG 150ms shift to next gear if possible
          setTelemetry((prev) => ({
            ...prev,
            isShifting: true,
            asgShiftDurationMs: 150.0,
            shiftForkPositionMm: 16.5,
          }));

          setTimeout(() => {
            // Drop RPM back to idle
            const returnStartTime = performance.now();
            const returnDuration = 800;
            const stepDown = (downNow: number) => {
              const downElapsed = downNow - returnStartTime;
              if (downElapsed < returnDuration) {
                const p = downElapsed / returnDuration;
                const downRpm = 9000.0 - (9000.0 - 950.0) * p;
                setTelemetry((prev) => ({
                  ...prev,
                  rpm: downRpm,
                  intakeHarmonicHz: downRpm / 12.0,
                  titaniumValveHz: (downRpm / 60.0) * 20.0,
                  throttlePct: Math.max(0, 100 * (1 - p)),
                  surgeTankDecibels: 92.0 + 36.0 * (downRpm / 9000),
                  isRedlining: downRpm >= 8900,
                  isShifting: false,
                  shiftForkPositionMm: 0.0,
                }));
                requestAnimationFrame(stepDown);
              } else {
                setTelemetry((prev) => ({
                  ...prev,
                  rpm: 950.0,
                  throttlePct: 0.0,
                  intakeHarmonicHz: 950.0 / 12.0,
                  titaniumValveHz: (950.0 / 60.0) * 20.0,
                  surgeTankDecibels: 92.4,
                  scavengePressureBar: 5.4,
                  isRedlining: false,
                  isRevving: false,
                  isShifting: false,
                  shiftForkPositionMm: 0.0,
                  gear: prev.gear < 6 ? prev.gear + 1 : 1,
                }));
              }
            };
            requestAnimationFrame(stepDown);
          }, 150);
        }, 350);
      }
    };

    requestAnimationFrame(step);
  };

  // Verify Hash action
  const handleVerifyHash = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerificationModalOpen(true);
    }, 600);
  };

  const tabs = [
    { id: 'acoustics', label: '1. 1LR-GUE V10 & ASG Shifter', icon: Cpu },
    { id: 'postgres', label: '2. Postgres Apex Ledger', icon: Database },
    { id: 'openapi', label: '3. OpenAPI 3.1 Contract', icon: Network },
    { id: 'cloudrun', label: '4. Turnkey Cloud Run', icon: Server },
    { id: 'covenant', label: '5. Acquire.com Covenant', icon: FileText },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Requirement 1: Hardened Non-Breaking MonroneyBanner */}
        <MonroneyBanner
          onSimulateRev={handleSimulateRev}
          onVerifyHash={handleVerifyHash}
          isRevving={telemetry.isRevving}
          isVerifying={isVerifying}
        />

        {/* Requirement 2: Live Telemetry Metrics Strip */}
        <TelemetryMetricsStrip telemetry={telemetry} />

        {/* Central LFA Optical Tachometer & Acoustic Cluster */}
        <TachometerCluster
          telemetry={telemetry}
          onThrottleChange={handleThrottleChange}
          onShiftUp={handleShiftUp}
          onShiftDown={handleShiftDown}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onSimulateRev={handleSimulateRev}
        />

        {/* 5 Technical Tabs Navigation Strip */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 shadow-xl">
          <div className="flex flex-row items-center gap-1.5 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`cursor-pointer px-4 py-2.5 rounded-lg text-base font-mono font-bold flex items-center gap-2.5 whitespace-nowrap transition-all active:scale-95 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Tab View */}
        <div className="transition-all duration-200">
          {activeTab === 'acoustics' && (
            <TabV10Acoustics
              telemetry={telemetry}
              onSimulateRev={handleSimulateRev}
              isRevving={telemetry.isRevving}
            />
          )}

          {activeTab === 'postgres' && <TabPostgresLedger />}

          {activeTab === 'openapi' && <TabOpenAPISpec telemetry={telemetry} />}

          {activeTab === 'cloudrun' && <TabCloudRunHarness />}

          {activeTab === 'covenant' && <TabAPACovenant />}
        </div>
      </main>

      {/* Verification Proof Modal */}
      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        telemetry={telemetry}
      />

      {/* Cockpit Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 py-4 px-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            GF-T3-184 // Heavy Overland Dynamics Platform LFA NÜRBURGRING EDITION V10 APEX CORE // 1LR-GUE YAMAHA ACOUSTICS
          </span>
          <span className="text-slate-400">
            Delaware Micro-APA Asset Transfer Asset | Acquire.com Turnkey Architecture | MIT Permissive
          </span>
        </div>
      </footer>
    </div>
  );
}
