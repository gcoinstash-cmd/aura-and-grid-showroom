/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { HeaderHUD } from './components/HeaderHUD';
import { SpatialSimulatorTab } from './components/SpatialSimulatorTab';
import { OpenApiSandboxTab } from './components/OpenApiSandboxTab';
import { SpecViewerTab } from './components/SpecViewerTab';
import { TopologyTab } from './components/TopologyTab';
import { AlloydbSchemaTab } from './components/AlloydbSchemaTab';
import { MonopolyVaultTab } from './components/MonopolyVaultTab';
import { TrackedObject, LogEntry, ThreatLevel } from './types/perception';

const initialTrackedObjects: TrackedObject[] = [
  {
    id: '1',
    trackId: 'TRK-9821',
    classification: 'PEDESTRIAN',
    confidence: 0.984,
    position: { x: 12.4, y: 2.1, z: -0.4 },
    velocity: { vx: -1.45, vy: -0.22, vz: 0.0 },
    acceleration: { ax: -0.05, ay: 0.0 },
    dimensions: { length: 0.65, width: 0.60, height: 1.78 },
    yaw: 3.12,
    yawRate: -0.01,
    ttcSeconds: 1.14,
    threatLevel: 'CRITICAL_COLLISION_IMMINENT',
    distance: 12.57,
    history: [
      { x: 15.2, y: 2.8, z: -0.4 },
      { x: 14.3, y: 2.5, z: -0.4 },
      { x: 13.4, y: 2.3, z: -0.4 },
      { x: 12.4, y: 2.1, z: -0.4 }
    ],
    covarianceDiagonal: [0.012, 0.015, 0.008, 0.042, 0.038, 0.019]
  },
  {
    id: '2',
    trackId: 'TRK-9815',
    classification: 'VEHICLE',
    confidence: 0.996,
    position: { x: -4.2, y: 28.5, z: 0.2 },
    velocity: { vx: 0.12, vy: 14.2, vz: 0.0 },
    acceleration: { ax: 0.0, ay: 0.4 },
    dimensions: { length: 4.82, width: 1.95, height: 1.48 },
    yaw: 0.02,
    yawRate: 0.0,
    ttcSeconds: 4.82,
    threatLevel: 'NOMINAL',
    distance: 28.8,
    history: [
      { x: -4.3, y: 22.1, z: 0.2 },
      { x: -4.3, y: 24.3, z: 0.2 },
      { x: -4.2, y: 26.4, z: 0.2 },
      { x: -4.2, y: 28.5, z: 0.2 }
    ],
    covarianceDiagonal: [0.008, 0.009, 0.004, 0.021, 0.018, 0.009]
  },
  {
    id: '3',
    trackId: 'TRK-9819',
    classification: 'CYCLIST',
    confidence: 0.971,
    position: { x: 8.6, y: 14.2, z: -0.1 },
    velocity: { vx: -0.42, vy: 5.6, vz: 0.0 },
    acceleration: { ax: -0.1, ay: 0.2 },
    dimensions: { length: 1.75, width: 0.55, height: 1.45 },
    yaw: 0.15,
    yawRate: 0.02,
    ttcSeconds: 2.84,
    threatLevel: 'CAUTION',
    distance: 16.6,
    history: [
      { x: 9.8, y: 9.4, z: -0.1 },
      { x: 9.4, y: 11.0, z: -0.1 },
      { x: 9.0, y: 12.6, z: -0.1 },
      { x: 8.6, y: 14.2, z: -0.1 }
    ],
    covarianceDiagonal: [0.024, 0.028, 0.012, 0.065, 0.058, 0.028]
  },
  {
    id: '4',
    trackId: 'TRK-9804',
    classification: 'EMERGENCY_VEHICLE',
    confidence: 0.988,
    position: { x: -16.4, y: 42.0, z: 0.4 },
    velocity: { vx: 0.85, vy: -18.4, vz: 0.0 },
    acceleration: { ax: 0.2, ay: -0.5 },
    dimensions: { length: 5.80, width: 2.10, height: 2.20 },
    yaw: 3.10,
    yawRate: -0.01,
    ttcSeconds: 3.90,
    threatLevel: 'CAUTION',
    distance: 45.1,
    history: [
      { x: -17.8, y: 52.0, z: 0.4 },
      { x: -17.2, y: 48.2, z: 0.4 },
      { x: -16.8, y: 45.1, z: 0.4 },
      { x: -16.4, y: 42.0, z: 0.4 }
    ],
    covarianceDiagonal: [0.011, 0.014, 0.007, 0.034, 0.031, 0.015]
  },
  {
    id: '5',
    trackId: 'TRK-9829',
    classification: 'ROAD_OBSTACLE',
    confidence: 0.952,
    position: { x: 18.2, y: 8.4, z: -0.6 },
    velocity: { vx: 0.0, vy: 0.0, vz: 0.0 },
    acceleration: { ax: 0.0, ay: 0.0 },
    dimensions: { length: 0.90, width: 0.85, height: 0.35 },
    yaw: 0.85,
    yawRate: 0.0,
    ttcSeconds: null,
    threatLevel: 'NOMINAL',
    distance: 20.0,
    history: [
      { x: 18.2, y: 8.4, z: -0.6 },
      { x: 18.2, y: 8.4, z: -0.6 }
    ],
    covarianceDiagonal: [0.005, 0.005, 0.002, 0.001, 0.001, 0.001]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('simulator');
  const [frameSeq, setFrameSeq] = useState<number>(1048576);
  const [loopLatencyMs, setLoopLatencyMs] = useState<number>(7.38);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [scenario, setScenario] = useState<string>('pedestrian_crossing');
  const [trackedObjects, setTrackedObjects] = useState<TrackedObject[]>(initialTrackedObjects);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>('TRK-9821');
  const [logEntries, setLogEntries] = useState<LogEntry[]>([
    {
      id: 'log-1',
      timestamp: '16:47:45.124',
      frameSeq: 1048576,
      trackId: 'TRK-9821',
      classification: 'PEDESTRIAN',
      coordinates: 'X: 12.40 | Y: 2.10 | Z: -0.40',
      velocity: 'Vx: -1.45 | Vy: -0.22',
      ttc: '1.14s (CRITICAL)',
      status: 'CRITICAL_THREAT'
    },
    {
      id: 'log-2',
      timestamp: '16:47:45.116',
      frameSeq: 1048575,
      trackId: 'TRK-9815',
      classification: 'VEHICLE',
      coordinates: 'X: -4.20 | Y: 28.50 | Z: 0.20',
      velocity: 'Vx: 0.12 | Vy: 14.20',
      ttc: '4.82s (NOMINAL)',
      status: 'TRACKED_OK'
    },
    {
      id: 'log-3',
      timestamp: '16:47:45.108',
      frameSeq: 1048574,
      trackId: 'TRK-9819',
      classification: 'CYCLIST',
      coordinates: 'X: 8.60 | Y: 14.20 | Z: -0.10',
      velocity: 'Vx: -0.42 | Vy: 5.60',
      ttc: '2.84s (CAUTION)',
      status: 'ASSOCIATED'
    },
    {
      id: 'log-4',
      timestamp: '16:47:45.100',
      frameSeq: 1048573,
      trackId: 'TRK-9804',
      classification: 'EMERGENCY_VEHICLE',
      coordinates: 'X: -16.40 | Y: 42.00 | Z: 0.40',
      velocity: 'Vx: 0.85 | Vy: -18.40',
      ttc: '3.90s (CAUTION)',
      status: 'TRACKED_OK'
    },
    {
      id: 'log-5',
      timestamp: '16:47:45.092',
      frameSeq: 1048572,
      trackId: 'TRK-9829',
      classification: 'ROAD_OBSTACLE',
      coordinates: 'X: 18.20 | Y: 8.40 | Z: -0.60',
      velocity: 'Vx: 0.00 | Vy: 0.00',
      ttc: '∞ (NOMINAL)',
      status: 'OCTREE_INSERT'
    }
  ]);

  // Simulation tick loop
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameSeq((prev) => prev + 1);

      // Jitter simulation around 7.34ms - 7.44ms target
      const jitter = (Math.sin(Date.now() * 0.005) * 0.08) + (Math.random() * 0.04 - 0.02);
      setLoopLatencyMs(parseFloat((7.38 + jitter).toFixed(2)));

      if (isSimulating) {
        setTrackedObjects((prevTracks) => {
          return prevTracks.map((trk) => {
            if (trk.trackId === 'TRK-9821') {
              // Pedestrian moving towards ego path
              let newX = trk.position.x + trk.velocity.vx * 0.05;
              let newY = trk.position.y + trk.velocity.vy * 0.05;
              if (newX < -10) newX = 14.0; // loop back
              const dist = Math.sqrt(newX * newX + newY * newY);
              const ttc = newX > 0 ? parseFloat((newX / Math.abs(trk.velocity.vx)).toFixed(2)) : 0.85;
              const isCrit = ttc <= 1.20;

              return {
                ...trk,
                position: { x: newX, y: newY, z: trk.position.z },
                distance: parseFloat(dist.toFixed(1)),
                ttcSeconds: ttc,
                threatLevel: isCrit ? 'CRITICAL_COLLISION_IMMINENT' : 'CAUTION',
                history: [...trk.history.slice(-5), { x: newX, y: newY, z: trk.position.z }]
              };
            }

            if (trk.trackId === 'TRK-9815') {
              // Vehicle moving along lane
              let newY = trk.position.y + (Math.sin(Date.now() * 0.001) * 0.1);
              return {
                ...trk,
                position: { ...trk.position, y: newY },
                distance: parseFloat(Math.sqrt(trk.position.x * trk.position.x + newY * newY).toFixed(1))
              };
            }

            if (trk.trackId === 'TRK-9819') {
              // Cyclist moving forward
              let newX = trk.position.x + (Math.sin(Date.now() * 0.002) * 0.03);
              return {
                ...trk,
                position: { ...trk.position, x: newX }
              };
            }

            return trk;
          });
        });

        // Add periodic stream log entry
        if (Math.random() > 0.4) {
          const now = new Date();
          const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
          const ped = trackedObjects.find(t => t.trackId === 'TRK-9821');
          
          if (ped) {
            const newLog: LogEntry = {
              id: 'log-' + Date.now() + Math.random(),
              timestamp: timeStr,
              frameSeq: frameSeq + 1,
              trackId: ped.trackId,
              classification: ped.classification,
              coordinates: `X: ${ped.position.x.toFixed(2)} | Y: ${ped.position.y.toFixed(2)} | Z: ${ped.position.z.toFixed(2)}`,
              velocity: `Vx: ${ped.velocity.vx.toFixed(2)} | Vy: ${ped.velocity.vy.toFixed(2)}`,
              ttc: `${ped.ttcSeconds !== null ? ped.ttcSeconds.toFixed(2) + 's' : '∞'} (${ped.threatLevel === 'CRITICAL_COLLISION_IMMINENT' ? 'CRITICAL' : 'NOMINAL'})`,
              status: ped.threatLevel === 'CRITICAL_COLLISION_IMMINENT' ? 'CRITICAL_THREAT' : 'TRACKED_OK'
            };

            setLogEntries((prev) => [newLog, ...prev.slice(0, 15)]);
          }
        }
      }
    }, 120);

    return () => clearInterval(interval);
  }, [isSimulating, frameSeq, trackedObjects]);

  const handleToggleSimulation = () => {
    setIsSimulating(!isSimulating);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 cyber-grid">
      {/* HUD Header with live sequence counter & latency gauge */}
      <HeaderHUD
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        frameSeq={frameSeq}
        loopLatencyMs={loopLatencyMs}
        isSimulating={isSimulating}
        onQuickRunTest={handleToggleSimulation}
      />

      {/* Main Workstation Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'simulator' && (
          <SpatialSimulatorTab
            frameSeq={frameSeq}
            loopLatencyMs={loopLatencyMs}
            isSimulating={isSimulating}
            onToggleSimulation={handleToggleSimulation}
            trackedObjects={trackedObjects}
            logEntries={logEntries}
            scenario={scenario}
            setScenario={setScenario}
            selectedTrackId={selectedTrackId}
            setSelectedTrackId={setSelectedTrackId}
          />
        )}

        {activeTab === 'openapi' && (
          <OpenApiSandboxTab
            trackedObjects={trackedObjects}
            frameSeq={frameSeq}
            loopLatencyMs={loopLatencyMs}
          />
        )}

        {activeTab === 'spec' && (
          <SpecViewerTab />
        )}

        {activeTab === 'topology' && (
          <TopologyTab />
        )}

        {activeTab === 'alloydb' && (
          <AlloydbSchemaTab />
        )}

        {activeTab === 'vault' && (
          <MonopolyVaultTab />
        )}
      </main>

      {/* Engineering Footer */}
      <footer className="border-t border-zinc-900 bg-slate-950/90 py-4 px-6 text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>GHOST FACTORYOS SKUNKWORKS ENGINE GF-T3-140</span>
            <span className="text-zinc-700">|</span>
            <span>VOXELTRACK-EDGE 3D SPATIAL FUSION</span>
          </div>
          <div className="flex items-center gap-4">
            <span>DELAWARE COURT OF CHANCERY JURISDICTION</span>
            <span className="text-zinc-700">|</span>
            <span className="text-emerald-400 font-bold">10/10 SPECIFICATION VERIFIED</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
