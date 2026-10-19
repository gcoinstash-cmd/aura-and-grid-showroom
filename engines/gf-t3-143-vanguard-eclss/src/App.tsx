/**
 * Vanguard-ECLSS: Autonomous Closed-Loop Environmental Control & Life Support System
 * Asset Code: GF-T3-143 (Ghost FactoryOS Fleet Track 3 - F1 Skunkworks Engine)
 * 
 * Lead Systems Architect Master Application Entry Point
 * Enforced Typography Floor & Luxury Mission-Control Layout
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AtmosphericHUD } from './components/hud/AtmosphericHUD';
import { ComputeTracker } from './components/hud/ComputeTracker';
import { FDIRTriagePanel } from './components/hud/FDIRTriagePanel';
import { MassBalanceSimulator } from './components/hud/MassBalanceSimulator';
import { ReactorSchematic } from './components/hud/ReactorSchematic';
import { Navbar, NavTab } from './components/Navbar';
import { DatabaseSchemaView } from './components/views/DatabaseSchemaView';
import { EngineSpecView } from './components/views/EngineSpecView';
import { LegalVaultView } from './components/views/LegalVaultView';
import { MathEngineView } from './components/views/MathEngineView';
import { OpenApiView } from './components/views/OpenApiView';
import { ECLSSSimulationEngine } from './engine/simulation';
import { CrewMetabolicProfile, TelemetrySnapshot } from './types/eclss';

export default function App() {
  const engine = useMemo(() => new ECLSSSimulationEngine(), []);
  const [telemetry, setTelemetry] = useState<TelemetrySnapshot>(() => engine.getLatestSnapshot());
  const [history, setHistory] = useState<TelemetrySnapshot[]>(() => engine.getHistory());
  const [currentTab, setCurrentTab] = useState<NavTab>('MISSION_CONTROL');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Real-time deterministic simulation tick loop (1000ms sample rate)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const nextSnap = engine.stepTick(1.0);
      setTelemetry({ ...nextSnap });
      setHistory([...engine.getHistory()]);
    }, 1000);

    return () => clearInterval(interval);
  }, [engine, isSimulating]);

  const handleUpdateCrew = (partial: Partial<CrewMetabolicProfile>) => {
    engine.setCrew(partial);
    const updated = engine.stepTick(0.1);
    setTelemetry({ ...updated });
  };

  const handleTriggerAnomaly = (type: 'DECOMPRESSION' | 'SABATIER_QUENCH' | 'ELECTROLYZER_DEGRADE' | 'VOC_SPIKE') => {
    engine.triggerAnomaly(type);
    const updated = engine.stepTick(0.1);
    setTelemetry({ ...updated });
  };

  const handleResolveIncident = (id: string) => {
    engine.resolveIncident(id);
    const updated = engine.stepTick(0.1);
    setTelemetry({ ...updated });
  };

  const handleResolveAll = () => {
    engine.resolveAllIncidents();
    const updated = engine.stepTick(0.1);
    setTelemetry({ ...updated });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 text-base">
      {/* Top Mission Command Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        latestTelemetry={telemetry}
        isSimulating={isSimulating}
        onToggleSim={() => setIsSimulating((prev) => !prev)}
      />

      {/* Main Body View Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {currentTab === 'MISSION_CONTROL' && (
          <div className="space-y-10">
            {/* Atmospheric HUD & Partial Pressure Gauges */}
            <AtmosphericHUD atmosphere={telemetry.atmospheric} hydrologic={telemetry.hydrologic} />

            {/* Mass Balance Simulator */}
            <MassBalanceSimulator
              crew={telemetry.crew}
              reserves={telemetry.reserves}
              onUpdateCrew={handleUpdateCrew}
            />

            {/* Closed-Loop Chemical Reactor & Electrolysis Schematic */}
            <ReactorSchematic
              atmosphere={telemetry.atmospheric}
              reactor={telemetry.reactor}
              hydrologic={telemetry.hydrologic}
            />

            {/* FDIR Incident Table & Automated Containment Triage */}
            <FDIRTriagePanel
              incidents={telemetry.activeIncidents}
              onTriggerAnomaly={handleTriggerAnomaly}
              onResolveIncident={handleResolveIncident}
              onResolveAll={handleResolveAll}
            />

            {/* Compute & P99 Latency Tracker */}
            <ComputeTracker mpc={telemetry.mpc} history={history} />
          </div>
        )}

        {currentTab === 'MATH_ENGINE' && <MathEngineView />}

        {currentTab === 'ALLOYDB_SCHEMA' && <DatabaseSchemaView />}

        {currentTab === 'OPENAPI_SPEC' && <OpenApiView />}

        {currentTab === 'LEGAL_IP_VAULT' && <LegalVaultView />}

        {currentTab === 'ENGINE_SPEC' && <EngineSpecView />}
      </main>

      {/* Persistent Mission-Control Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-sm font-mono text-slate-400 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold text-slate-300">GHOST FACTORYOS · FLEET TRACK 3 (F1 SKUNKWORKS)</span>
          <span className="text-cyan-300 font-bold">ASSET GF-T3-143 (VANGUARD-ECLSS) · MONOPOLY ASSET TRANSFER $140,000 USD</span>
          <span className="text-slate-400">DELAWARE CHANCERY FORUM · ZERO-RPO COMPLIANCE</span>
        </div>
      </footer>
    </div>
  );
}
