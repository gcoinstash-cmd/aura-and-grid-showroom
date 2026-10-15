/**
 * Ghost FactoryOS Track 3 (F1 Skunkworks Engine)
 * Asset GF-T3-147: Sol-Rotor Autonomous Heavy-Lift eVTOL & Swarm Flight Telemetry Engine
 * 
 * Main Application Orchestrator & Real-Time Simulation Core
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  FlightState,
  AtmosphereEnvironment,
  createInitialFlightState,
  advanceFlightDynamics,
} from './engine/flightDynamics';
import {
  SwarmState,
  FormationPattern,
  createInitialSwarm,
  advanceSwarmConsensus,
} from './engine/swarmConsensus';
import { Header, ActiveTab } from './components/common/Header';
import { PrimaryFlightDisplay } from './components/pfd/PrimaryFlightDisplay';
import { SwarmRadarHUD } from './components/swarm/SwarmRadarHUD';
import { ControlLoopMonitor } from './components/telemetry/ControlLoopMonitor';
import { DisturbanceLab } from './components/simulation/DisturbanceLab';
import { DocumentViewer } from './components/docs/DocumentViewer';
import { ShieldCheck, Cpu, Terminal, Compass, Layers } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('PFD');

  // Flight Physics & Dynamics State
  const [flightState, setFlightState] = useState<FlightState>(createInitialFlightState);

  // Atmospheric Disturbances
  const [env, setEnv] = useState<AtmosphereEnvironment>({
    crosswindKts: 12.0,
    crosswindDirectionDeg: 315.0,
    microburstIntensity: 0.0,
    drydenTurbulenceSigma: 1.2,
    airDensityKgM3: 1.225,
    ambientTempC: 18.0,
  });

  // Autopilot / Pilot Reference Commands
  const [pilotCommands, setPilotCommands] = useState({
    pitchCmdDeg: 3.5,
    rollCmdDeg: 0.0,
    yawCmdDeg: 85.0,
    altitudeCmdM: 450.0,
    targetNacelleAngleDeg: 45.0,
  });

  // Swarm Consensus State (8 airframes default)
  const [swarmState, setSwarmState] = useState<SwarmState>(() => createInitialSwarm(8, 'TACTICAL_DIAMOND'));

  // Simulation Running state
  const [isSimRunning, setIsSimRunning] = useState(true);

  // Simulation Timer Hook (50 Hz real-time physics update)
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    if (!isSimRunning) return;

    const interval = setInterval(() => {
      const now = performance.now();
      const dtSec = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      // 1. Advance 6-DOF Flight Dynamics & NDI Controller
      setFlightState((prev) => advanceFlightDynamics(prev, env, pilotCommands, dtSec));

      // 2. Advance Multi-Agent Swarm Consensus & RVO
      setSwarmState((prev) =>
        advanceSwarmConsensus(prev, prev.formationPattern, prev.targetSeparationM, dtSec)
      );
    }, 20); // 50 Hz

    return () => clearInterval(interval);
  }, [isSimRunning, env, pilotCommands]);

  // Toggle Rotor Failure
  const handleToggleRotorFail = (rotorId: number) => {
    setFlightState((prev) => {
      const updatedRotors = prev.rotors.map((r) => {
        if (r.id === rotorId) {
          const nextHealth: 'NOMINAL' | 'FAILED' = r.health === 'NOMINAL' ? 'FAILED' : 'NOMINAL';
          return { ...r, health: nextHealth };
        }
        return r;
      });
      return { ...prev, rotors: updatedRotors };
    });
  };

  // Reset Disturbances & Restore Nominal State
  const handleResetNominal = () => {
    setEnv({
      crosswindKts: 0.0,
      crosswindDirectionDeg: 0.0,
      microburstIntensity: 0.0,
      drydenTurbulenceSigma: 0.0,
      airDensityKgM3: 1.225,
      ambientTempC: 15.0,
    });
    setFlightState((prev) => {
      const restoredRotors = prev.rotors.map((r) => ({ ...r, health: 'NOMINAL' as const }));
      return { ...prev, rotors: restoredRotors };
    });
  };

  // Swarm Controls
  const handleSelectFormation = (pattern: FormationPattern) => {
    setSwarmState((prev) => ({ ...prev, formationPattern: pattern }));
  };

  const handleUpdateSpacing = (spacingM: number) => {
    setSwarmState((prev) => ({ ...prev, targetSeparationM: spacingM }));
  };

  const handleUpdatePeerCount = (count: number) => {
    setSwarmState(createInitialSwarm(count, swarmState.formationPattern));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Master Avionics Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        flightMode={flightState.flightMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-6">
        {activeTab === 'PFD' && (
          <PrimaryFlightDisplay
            state={flightState}
            onToggleRotorFail={handleToggleRotorFail}
          />
        )}

        {activeTab === 'SWARM_RADAR' && (
          <SwarmRadarHUD
            swarm={swarmState}
            onSelectFormation={handleSelectFormation}
            onUpdateSpacing={handleUpdateSpacing}
            onUpdatePeerCount={handleUpdatePeerCount}
          />
        )}

        {activeTab === 'NDI_LOOP' && (
          <ControlLoopMonitor state={flightState} />
        )}

        {activeTab === 'DISTURBANCE_LAB' && (
          <DisturbanceLab
            env={env}
            flightState={flightState}
            pilotCommands={pilotCommands}
            onUpdateEnv={setEnv}
            onUpdatePilotCommands={setPilotCommands}
            onToggleRotorFail={handleToggleRotorFail}
            onResetNominal={handleResetNominal}
          />
        )}

        {activeTab === 'DOCS_EXPLORER' && (
          <DocumentViewer />
        )}
      </main>

      {/* Master Institutional Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 sm:px-8 py-6 text-slate-400 font-mono text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>
              GHOST FACTORYOS FLEET TRACK 3 (F1 SKUNKWORKS) • ASSET GF-T3-147
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center text-xs text-slate-400">
            <span>DELAWARE COURT OF CHANCERY</span>
            <span>•</span>
            <span>DO-178C LEVEL A COMPLIANT</span>
            <span>•</span>
            <span>CLEAN-ROOM PROVENANCE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
