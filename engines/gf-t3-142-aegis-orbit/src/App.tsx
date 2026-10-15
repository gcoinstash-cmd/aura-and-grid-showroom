/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Ghost FactoryOS Fleet Track 3 - Asset GF-T3-142 (Aegis-Orbit)
 * Autonomous Low-Earth Orbit Satellite Constellation Stationkeeping & Collision Avoidance Engine
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ConstellationLiveBoard } from './components/ConstellationLiveBoard';
import { OrbitVisualizerCanvas } from './components/OrbitVisualizerCanvas';
import { CaraRiskAnalysisTable } from './components/CaraRiskAnalysisTable';
import { ManeuverImpulseSimulator } from './components/ManeuverImpulseSimulator';
import { EkfTelemetryFusion } from './components/EkfTelemetryFusion';
import { P99ComputeBudgetTracker } from './components/P99ComputeBudgetTracker';
import { VaultArtifactsViewer } from './components/VaultArtifactsViewer';
import { ExportBundleModal } from './components/ExportBundleModal';

import { SatelliteNode, ConjunctionEvent, ManeuverPlan } from './types/orbital';
import { INITIAL_SATELLITES, INITIAL_CONJUNCTIONS, INITIAL_MANEUVERS } from './data/mockConstellation';
import { propagateStepRk4, cartesianToKeplerian } from './engine/physics/sgp4';
import { ShieldAlert, Activity, Zap, FileText, Radio, Orbit } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'mission-control' | 'cara-risk' | 'maneuvers' | 'ekf-telemetry' | 'vault-docs'
  >('mission-control');

  const [satellites, setSatellites] = useState<SatelliteNode[]>(INITIAL_SATELLITES);
  const [selectedSatId, setSelectedSatId] = useState<string>(INITIAL_SATELLITES[0].id);
  const [conjunctions, setConjunctions] = useState<ConjunctionEvent[]>(INITIAL_CONJUNCTIONS);
  const [maneuvers, setManeuvers] = useState<ManeuverPlan[]>(INITIAL_MANEUVERS);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [p99Latency, setP99Latency] = useState<number>(4.12);

  const selectedSatellite = satellites.find((s) => s.id === selectedSatId) || satellites[0];
  const activeAlertsCount = conjunctions.filter((c) => c.collisionStatus === 'ACTION_REQUIRED').length;

  // Real-time orbital propagation loop for constellation
  useEffect(() => {
    const interval = setInterval(() => {
      const dt = 1.0; // 1 second step
      setSatellites((prev) =>
        prev.map((sat) => {
          const nextState = propagateStepRk4(sat.state, dt, sat.dryMassKg, 1.8);
          const nextElements = cartesianToKeplerian(nextState, sat.elements.bStar);
          return {
            ...sat,
            state: nextState,
            elements: nextElements
          };
        })
      );

      // Decrement TCA countdowns
      setConjunctions((prev) =>
        prev.map((conj) => ({
          ...conj,
          timeToTcaSeconds: Math.max(0, conj.timeToTcaSeconds - 1)
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle triggering maneuver from CARA table
  const handleTriggerManeuverFromCara = (conj: ConjunctionEvent) => {
    setSelectedSatId(
      satellites.find((s) => s.noradId === conj.primaryNoradId)?.id || satellites[0].id
    );
    setActiveTab('maneuvers');
  };

  // Handle committing maneuver
  const handleCommitManeuver = (plan: ManeuverPlan) => {
    setManeuvers((prev) => [plan, ...prev]);

    // Update satellite status and remaining fuel
    setSatellites((prev) =>
      prev.map((sat) => {
        if (sat.id === plan.satelliteId) {
          return {
            ...sat,
            status: 'CRITICAL_MANEUVER',
            propellantRemainingKg: Math.max(0, sat.propellantRemainingKg - plan.propellantConsumptionKg)
          };
        }
        return sat;
      })
    );

    // Update conjunction status to scheduled
    if (plan.targetConjunctionId) {
      setConjunctions((prev) =>
        prev.map((conj) => {
          if (conj.conjunctionId === plan.targetConjunctionId) {
            return {
              ...conj,
              collisionStatus: 'MANEUVER_SCHEDULED',
              probabilityOfCollision: plan.postManeuverPc || 1e-6,
              missDistanceTotalMeters: plan.postManeuverMissDistanceMeters || 1420.0
            };
          }
          return conj;
        })
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Mission Control Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        p99Latency={p99Latency}
        activeAlertsCount={activeAlertsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Tab 1: Flight Ops Mission Control HUD */}
        {activeTab === 'mission-control' && (
          <div className="space-y-6">
            {/* Top Grid: Canvas Visualizer + P99 Compute Monitor */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <OrbitVisualizerCanvas
                  satellites={satellites}
                  selectedSatellite={selectedSatellite}
                  activeConjunctions={conjunctions}
                  onSelectSatellite={(sat) => setSelectedSatId(sat.id)}
                  showManeuverTrajectory={selectedSatellite.status === 'CRITICAL_MANEUVER'}
                />
              </div>

              <div className="flex flex-col justify-between space-y-4">
                <P99ComputeBudgetTracker />

                  {/* Quick Action Card */}
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono font-bold text-slate-300 uppercase tracking-wider">
                      Selected Bird Focus
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-md border border-cyan-800">
                      {selectedSatellite.planeId}
                    </span>
                  </div>

                  <div className="text-base sm:text-lg font-bold text-white font-mono flex items-center justify-between">
                    <span>{selectedSatellite.name}</span>
                    <span className="text-sm text-slate-400 font-normal">NORAD #{selectedSatellite.noradId}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-400 text-xs font-semibold block">POSITION (ECI)</span>
                      <span className="text-white font-bold text-sm">
                        {selectedSatellite.state.r[0].toFixed(0)}, {selectedSatellite.state.r[1].toFixed(0)}, {selectedSatellite.state.r[2].toFixed(0)} km
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs font-semibold block">VELOCITY (ECI)</span>
                      <span className="text-cyan-300 font-extrabold text-base">
                        {Math.sqrt(
                          selectedSatellite.state.v[0] ** 2 +
                          selectedSatellite.state.v[1] ** 2 +
                          selectedSatellite.state.v[2] ** 2
                        ).toFixed(2)} km/s
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      onClick={() => setActiveTab('cara-risk')}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-mono font-bold transition-colors cursor-pointer text-center"
                    >
                      View CARA Risks
                    </button>
                    <button
                      onClick={() => setActiveTab('maneuvers')}
                      className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-hud font-extrabold transition-colors cursor-pointer text-center shadow-md shadow-cyan-950"
                    >
                      Plan Maneuver
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Constellation Live Tracking Board */}
            <ConstellationLiveBoard
              satellites={satellites}
              selectedSatellite={selectedSatellite}
              onSelectSatellite={(sat) => setSelectedSatId(sat.id)}
            />
          </div>
        )}

        {/* Tab 2: CARA Risk Table */}
        {activeTab === 'cara-risk' && (
          <div className="space-y-6">
            <CaraRiskAnalysisTable
              conjunctions={conjunctions}
              onTriggerManeuver={handleTriggerManeuverFromCara}
            />
          </div>
        )}

        {/* Tab 3: Impulse Maneuvers */}
        {activeTab === 'maneuvers' && (
          <div className="space-y-6">
            <ManeuverImpulseSimulator
              satellites={satellites}
              selectedSatellite={selectedSatellite}
              conjunctions={conjunctions}
              activeManeuvers={maneuvers}
              onCommitManeuver={handleCommitManeuver}
            />
          </div>
        )}

        {/* Tab 4: EKF Sensor Fusion Telemetry */}
        {activeTab === 'ekf-telemetry' && (
          <div className="space-y-6">
            <EkfTelemetryFusion selectedSatellite={selectedSatellite} />
          </div>
        )}

        {/* Tab 5: Institutional Monopoly Vault Deliverables */}
        {activeTab === 'vault-docs' && (
          <div className="space-y-6">
            <VaultArtifactsViewer />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 px-5 py-5 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-sm font-mono text-slate-400 gap-2.5">
          <div className="font-semibold text-slate-300">
            GF-T3-142 // AEGIS-ORBIT &bull; Ghost FactoryOS Skunkworks Fleet Track 3
          </div>
          <div className="flex items-center space-x-4">
            <span>Delaware Court of Chancery Jurisdiction</span>
            <span>&bull;</span>
            <span className="text-emerald-400 font-extrabold">100% Clean-Room Permissive</span>
          </div>
        </div>
      </footer>

      {/* Master Export 10/10 Bundle Modal */}
      <ExportBundleModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
