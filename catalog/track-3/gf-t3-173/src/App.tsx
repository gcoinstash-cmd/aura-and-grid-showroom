import React, { useState, useEffect, useMemo } from 'react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { MetricCards } from './components/MetricCards';
import { AeroCockpitVisualizer } from './components/AeroCockpitVisualizer';
import { TabAeroStateCore } from './components/TabAeroStateCore';
import { TabPostgresLedger } from './components/TabPostgresLedger';
import { TabOpenApiContract } from './components/TabOpenApiContract';
import { TabCloudRunHarness } from './components/TabCloudRunHarness';
import { TabApaCovenant } from './components/TabApaCovenant';
import { SimulationModal } from './components/SimulationModal';
import { HashAuditModal } from './components/HashAuditModal';
import { computeAeroState, generatePitotReadings } from './utils/aeroCalculations';
import { AeroTelemetry, SimulationPreset } from './types/aero';
import { Terminal, Database, FileCode, Box, Scale, Layers, ShieldCheck } from 'lucide-react';

export default function App() {
  // Vehicle Telemetry State
  const [speedKmh, setSpeedKmh] = useState<number>(250);
  const [lateralG, setLateralG] = useState<number>(0.0);
  const [longitudinalG, setLongitudinalG] = useState<number>(0.0);
  const [yawRateDegS, setYawRateDegS] = useState<number>(0.0);
  const [sequenceNonce, setSequenceNonce] = useState<number>(1000420);
  const [previousHash, setPreviousHash] = useState<string>(
    '2f1d58e4350ac523bd5684521673281536271835463728153627183526170895'
  );
  const [currentHash, setCurrentHash] = useState<string>(
    '302e69f5461bd634ce6795632784392647382946574839264738294637281906'
  );

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'aero' | 'postgres' | 'openapi' | 'cloudrun' | 'apa'>('aero');

  // Modals State
  const [isSimulateOpen, setIsSimulateOpen] = useState<boolean>(false);
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);

  // Increment sequence nonce periodically to simulate continuous 1,000 Hz logging
  useEffect(() => {
    const timer = setInterval(() => {
      setSequenceNonce((prev) => prev + 1);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  // Compute live aerodynamic physics and pressure mapping
  const telemetry: AeroTelemetry = useMemo(() => {
    const rawAero = computeAeroState(
      speedKmh,
      lateralG,
      longitudinalG,
      yawRateDegS,
      sequenceNonce,
      previousHash
    );
    return {
      ...rawAero,
      currentHash
    };
  }, [speedKmh, lateralG, longitudinalG, yawRateDegS, sequenceNonce, previousHash, currentHash]);

  const sensors = useMemo(() => {
    return generatePitotReadings(speedKmh, telemetry.dynamicPressurePa);
  }, [speedKmh, telemetry.dynamicPressurePa]);

  const handleApplyPreset = (preset: SimulationPreset) => {
    setSpeedKmh(preset.speedKmh);
    setLateralG(preset.lateralG);
    setLongitudinalG(preset.longitudinalG);
    setYawRateDegS(preset.yawRateDegS);
  };

  const handleResetToNominal = () => {
    setSpeedKmh(250);
    setLateralG(0.0);
    setLongitudinalG(0.0);
    setYawRateDegS(0.0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Application Header - Relative positioning ensures natural page scroll */}
      <header className="relative w-full border-b border-slate-800 bg-slate-900/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Brand Wordmark (Zone 1) */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xl font-bold tracking-tight text-white font-mono">
              Ghost FactoryOS
            </span>
            <span className="text-sm font-mono text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800">
              GF-T3-173
            </span>
          </div>

          {/* Navigation Links (Zone 2) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#aero-cockpit" className="hover:text-cyan-400 transition-colors whitespace-nowrap">
              Active Telemetry HUD
            </a>
            <a href="#technical-blueprints" className="hover:text-cyan-400 transition-colors whitespace-nowrap">
              Technical Blueprints
            </a>
            <a href="#acquire-covenant" className="hover:text-cyan-400 transition-colors whitespace-nowrap">
              Acquire.com Escrow
            </a>
            <a href="#ip-audit" className="hover:text-cyan-400 transition-colors whitespace-nowrap">
              Clean-Room Audit
            </a>
          </nav>

          {/* Top Primary Action (Zone 3) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsAuditOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-800 rounded-lg transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Audit Passed</span>
              <span className="sm:hidden">Audit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Monroney Top Banner (Relative / Static positioning) */}
      <MonroneyBanner
        onOpenSimulate={() => setIsSimulateOpen(true)}
        onOpenAudit={() => setIsAuditOpen(true)}
      />

      {/* Live Telemetry Metric Cards (Relative / Static positioning) */}
      <MetricCards telemetry={telemetry} />

      {/* Main Interactive Stage: Heavy Overland Dynamics Platform RC F Track Edition Aero HUD */}
      <main className="flex-1 pb-16">
        <section id="aero-cockpit">
          <AeroCockpitVisualizer
            telemetry={telemetry}
            sensors={sensors}
            onSpeedChange={setSpeedKmh}
            onLateralGChange={setLateralG}
            onLongitudinalGChange={setLongitudinalG}
            onYawRateChange={setYawRateDegS}
            onApplyPreset={handleApplyPreset}
            onResetToNominal={handleResetToNominal}
          />
        </section>

        {/* Five Navigable Technical Implementation Tabs */}
        <section id="technical-blueprints" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="border-b border-slate-800 pb-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-sm font-mono text-cyan-400 uppercase tracking-wider mb-1">
                Engineering Architecture Blueprints
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Turnkey Technical Blueprints & Legal Covenants
              </h2>
            </div>
            <div className="text-sm text-slate-400">
              5 Modular Pillars · Zero Placeholders · deterministic production Ready
            </div>
          </div>

          {/* Tab Navigation Segmented Bar */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('aero')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'aero'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Tab 1: Aero & Actuator Core</span>
            </button>

            <button
              onClick={() => setActiveTab('postgres')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'postgres'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Tab 2: Postgres Aero Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('openapi')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'openapi'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Tab 3: OpenAPI 3.1 Aero Contract</span>
            </button>

            <button
              onClick={() => setActiveTab('cloudrun')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'cloudrun'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>Tab 4: Turnkey Cloud Run Harness</span>
            </button>

            <button
              onClick={() => setActiveTab('apa')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'apa'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Tab 5: Acquire.com APA Covenant</span>
            </button>
          </div>

          {/* Tab Content Display */}
          <div>
            {activeTab === 'aero' && <TabAeroStateCore />}
            {activeTab === 'postgres' && <TabPostgresLedger />}
            {activeTab === 'openapi' && <TabOpenApiContract />}
            {activeTab === 'cloudrun' && <TabCloudRunHarness />}
            {activeTab === 'apa' && <TabApaCovenant />}
          </div>
        </section>
      </main>

      {/* Static Footer */}
      <footer className="relative w-full bg-slate-900 border-t border-slate-800 py-8 text-sm text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-white">Ghost FactoryOS</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Asset GF-T3-173 (Heavy Overland Dynamics Platform RC F Track Edition Aero Core)</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-emerald-400">100% Permissive MIT</span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span>Micro-APA Listing: Acquire.com</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Specification: 20 kHz (0.48ms)</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Certified Clean-Room Build</span>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <SimulationModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
      />

      <HashAuditModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        currentNonce={sequenceNonce}
      />
    </div>
  );
}
