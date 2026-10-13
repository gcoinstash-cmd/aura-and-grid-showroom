/**
 * GF-T3-195 Lexus LC 500 Inspiration Series Carbon Aero Core Cockpit
 * Turnkey micro-APA buyout asset for Acquire.com
 * Hardened Non-Breaking Header Protocol & High-Legibility Typography
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryMetricsStrip } from './components/TelemetryMetricsStrip';
import { AeroCockpitSimulator } from './components/AeroCockpitSimulator';
import { TabAeroCore } from './components/TabAeroCore';
import { TabPostgresLedger } from './components/TabPostgresLedger';
import { TabOpenApiContract } from './components/TabOpenApiContract';
import { TabCloudRunHarness } from './components/TabCloudRunHarness';
import { TabApaCovenant } from './components/TabApaCovenant';
import { VerifyHashModal } from './components/VerifyHashModal';
import {
  AeroParameters,
  AeroTelemetryFrame,
  calculateAeroState,
  computeHmacSha256,
} from './utils/aeroPhysics';
import { GF_T3_195_MASTER_SPEC } from './data/specDocument';
import {
  Cpu,
  Database,
  FileText,
  Server,
  Award,
  Download,
  Check,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'AERO' | 'POSTGRES' | 'OPENAPI' | 'CLOUD_RUN' | 'APA'>('AERO');

  // Simulation controls state
  const [params, setParams] = useState<AeroParameters>({
    speedKmh: 240,
    wingAoaDeg: 11.0,
    yawSlipDeg: 0.0,
    groundClearanceMm: 125,
    turbulenceIntensity: 0.15,
  });

  const [nonce, setNonce] = useState(1000195);
  const [isSimulating, setIsSimulating] = useState(true);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);

  // Current calculated telemetry frame
  const [currentFrame, setCurrentFrame] = useState<AeroTelemetryFrame>({
    timestamp: Date.now(),
    nonce: 1000195,
    speedKmh: 240,
    speedMs: 66.7,
    downforceKg: 185.4,
    downforceFrontKg: 89.0,
    downforceRearKg: 96.4,
    balanceRearPercent: 52.0,
    dragKg: 98.2,
    liftToDragRatio: 1.89,
    dynamicPressurePa: 2723,
    venturiDeltaPPa: 2480,
    vortexDampingNm: 184.2,
    strouhalFrequencyHz: 63.6,
    wingStrainMicrostrain: 573,
    boundaryLayerStatus: 'TURBULENT_STABLE',
    hmacSignature: 'a4e9b812f83d09a1ec094892cfa71239e09d134b988f01a88b44910287417f90',
  });

  // Telemetry computation trigger
  const updateTelemetry = useCallback(
    async (nextNonce: number, dynamicPerturbation = false) => {
      let activeParams = { ...params };
      if (dynamicPerturbation) {
        // Subtle realistic wind flutter / pitot sensor oscillation
        const speedJitter = (Math.random() - 0.5) * 1.6;
        const yawJitter = (Math.random() - 0.5) * 0.4;
        activeParams = {
          ...params,
          speedKmh: Math.max(60, Math.min(320, params.speedKmh + speedJitter)),
          yawSlipDeg: Math.max(-15, Math.min(15, params.yawSlipDeg + yawJitter)),
        };
      }

      const raw = calculateAeroState(activeParams, nextNonce);
      const signaturePayload = `${raw.nonce}:${raw.timestamp}:${raw.speedKmh}:${raw.downforceKg}:${raw.balanceRearPercent}:${raw.boundaryLayerStatus}`;
      const sig = await computeHmacSha256(signaturePayload);

      setCurrentFrame({
        ...raw,
        hmacSignature: sig,
      });
    },
    [params]
  );

  // Telemetry real-time loop (runs when isSimulating is true)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setNonce((prev) => {
        const next = prev + 1;
        updateTelemetry(next, true);
        return next;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [isSimulating, updateTelemetry]);

  // Recalculate immediately when manual sliders change
  useEffect(() => {
    updateTelemetry(nonce, false);
  }, [params, updateTelemetry, nonce]);

  // Handlers for MonroneyBanner actions
  const handleToggleSimulation = () => {
    setIsSimulating((prev) => !prev);
  };

  const handleOpenVerifyHash = () => {
    setShowVerifyModal(true);
  };

  const handleExportSpec = () => {
    const blob = new Blob([GF_T3_195_MASTER_SPEC], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GF_T3_195_SPEC.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccessToast(true);
    setTimeout(() => setDownloadSuccessToast(false), 4500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
      {/* Download toast notification */}
      {downloadSuccessToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900/95 border border-emerald-500/80 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top-4 duration-200">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-[16px] font-bold">GF_T3_195_SPEC.md Downloaded</div>
            <div className="text-[14px] text-emerald-200">
              Master technical and legal vault artifact exported successfully.
            </div>
          </div>
        </div>
      )}

      {/* Main Container - Standard relative/static document flow throughout (zero sticky/fixed headers eating up vertical screen estate) */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Monroney Banner strictly adhering to layout specification */}
        <section aria-label="Monroney Specification Header">
          <MonroneyBanner
            onSimulateAero={handleToggleSimulation}
            onVerifyHash={handleOpenVerifyHash}
            onExportSpec={handleExportSpec}
            isSimulating={isSimulating}
          />
        </section>

        {/* Live Telemetry Metrics Strip (Strict 16px label floor, text-4xl numerical readouts) */}
        <section aria-label="Live Telemetry Readouts">
          <TelemetryMetricsStrip frame={currentFrame} />
        </section>

        {/* Dynamic Interactive Aero Simulator & Telemetry Visualizer */}
        <section aria-label="Aero Cockpit Simulation and HUD">
          <AeroCockpitSimulator
            params={params}
            setParams={setParams}
            frame={currentFrame}
            isSimulating={isSimulating}
            onToggleSim={handleToggleSimulation}
          />
        </section>

        {/* Five Navigable Tabs with Full Technical Implementation */}
        <section aria-label="Turnkey micro-APA Technical Architecture Tabs" className="space-y-4">
          {/* Tab Navigation Segmented Control */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-2 shadow-lg overflow-x-auto">
            <div className="flex flex-row items-center gap-1.5 min-w-max">
              <button
                type="button"
                onClick={() => setActiveTab('AERO')}
                className={`text-[16px] font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'AERO'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>1. Python Aero Core</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('POSTGRES')}
                className={`text-[16px] font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'POSTGRES'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>2. Postgres Ledger & Triggers</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('OPENAPI')}
                className={`text-[16px] font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'OPENAPI'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>3. OpenAPI & WebSockets</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CLOUD_RUN')}
                className={`text-[16px] font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'CLOUD_RUN'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Server className="w-4 h-4" />
                <span>4. Cloud Run & PyTest Bench</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('APA')}
                className={`text-[16px] font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'APA'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>5. Acquire.com Micro-APA</span>
              </button>
            </div>
          </div>

          {/* Active Tab Content Area */}
          <div>
            {activeTab === 'AERO' && <TabAeroCore />}
            {activeTab === 'POSTGRES' && <TabPostgresLedger />}
            {activeTab === 'OPENAPI' && <TabOpenApiContract />}
            {activeTab === 'CLOUD_RUN' && <TabCloudRunHarness />}
            {activeTab === 'APA' && <TabApaCovenant />}
          </div>
        </section>

        {/* Master Archival Export Footer */}
        <footer className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-slate-400 text-[16px] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold font-mono">
              GF
            </div>
            <div>
              <div className="font-bold text-white">Ghost FactoryOS Architecture Core</div>
              <div className="text-[14px]">Asset GF-T3-195 • Lexus LC 500 Inspiration Series Carbon Aero Core</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportSpec}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[16px] py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download GF_T3_195_SPEC.md</span>
            </button>
            <button
              type="button"
              onClick={handleOpenVerifyHash}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 font-bold text-[16px] py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Cryptographic Audit</span>
            </button>
          </div>
        </footer>
      </main>

      {/* Verify Hash Modal */}
      <VerifyHashModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        currentFrame={currentFrame}
      />
    </div>
  );
}
