/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { HeaderBanner } from './components/HeaderBanner';
import { TelemetryCards } from './components/TelemetryCards';
import { DrsAcousticCoreTab } from './components/tabs/DrsAcousticCoreTab';
import { PostgresLedgerTab } from './components/tabs/PostgresLedgerTab';
import { OpenApiContractTab } from './components/tabs/OpenApiContractTab';
import { CloudRunHarnessTab } from './components/tabs/CloudRunHarnessTab';
import { ApaCovenantTab } from './components/tabs/ApaCovenantTab';
import { YawSimulationModal } from './components/modals/YawSimulationModal';
import { LedgerVerifyModal } from './components/modals/LedgerVerifyModal';
import { ApaContractModal } from './components/modals/ApaContractModal';
import { TelemetryState, LedgerBlock } from './types/telemetry';
import { INITIAL_TELEMETRY, INITIAL_LEDGER_BLOCKS, computeVehicleDynamics } from './data/mockTelemetry';
import { downloadMasterSpec } from './utils/exportSpec';
import { 
  Activity, 
  Database, 
  FileCode, 
  Cloud, 
  FileCheck2, 
  Download, 
  ShieldCheck, 
  Volume2, 
  Cpu 
} from 'lucide-react';

export default function App() {
  const [telemetry, setTelemetry] = useState<TelemetryState>(INITIAL_TELEMETRY);
  const [ledgerBlocks, setLedgerBlocks] = useState<LedgerBlock[]>(INITIAL_LEDGER_BLOCKS);
  const [activeTab, setActiveTab] = useState<'drs' | 'postgres' | 'openapi' | 'cloudrun' | 'apa'>('drs');

  // Modals state
  const [isYawSimOpen, setIsYawSimOpen] = useState(false);
  const [isLedgerVerifyOpen, setIsLedgerVerifyOpen] = useState(false);
  const [isApaModalOpen, setIsApaModalOpen] = useState(false);

  // Update telemetry helper with dynamic computation
  const updateTelemetry = useCallback((partial: Partial<TelemetryState>) => {
    setTelemetry((prev) => {
      const merged = { ...prev, ...partial };
      const dynamics = computeVehicleDynamics(
        merged.speedKph,
        merged.steeringWheelAngleDeg,
        merged.lateralG,
        merged.engineRpm,
        merged.engineLoadPct,
        merged.topStatus
      );
      return {
        ...merged,
        ...dynamics,
      };
    });
  }, []);

  // Quick preset triggers
  const triggerPreset = useCallback((presetKey: string) => {
    if (presetKey === 'transition') {
      updateTelemetry({
        speedKph: 80.0,
        steeringWheelAngleDeg: 45.0,
        lateralG: 0.35,
        engineRpm: 3400,
        engineLoadPct: 50,
      });
    } else if (presetKey === 'parking') {
      updateTelemetry({
        speedKph: 35.0,
        steeringWheelAngleDeg: 280.0,
        lateralG: 0.25,
        engineRpm: 2100,
        engineLoadPct: 35,
      });
    } else if (presetKey === 'autobahn') {
      updateTelemetry({
        speedKph: 160.0,
        steeringWheelAngleDeg: 32.0,
        lateralG: 0.45,
        engineRpm: 4600,
        engineLoadPct: 65,
      });
    } else if (presetKey === 'wot') {
      updateTelemetry({
        speedKph: 135.0,
        steeringWheelAngleDeg: 0.0,
        lateralG: 0.05,
        engineRpm: 7100,
        engineLoadPct: 100,
        topStatus: 'STOWED',
      });
    }
  }, [updateTelemetry]);

  // Record a new cryptographic block from current state
  const handleRecordBlock = useCallback(() => {
    setTelemetry((prev) => {
      const nextSeq = prev.monotonicSeq + 1;
      const lastBlock = ledgerBlocks[ledgerBlocks.length - 1];
      const nowIso = new Date().toISOString();
      
      // Pseudo-random deterministic hash simulation
      const randHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      const newBlock: LedgerBlock = {
        blockIndex: nextSeq,
        timestampUtc: nowIso,
        speedKph: prev.speedKph,
        rearSteerAngleDeg: prev.rearWheelAngleDeg,
        yawRateDegS: prev.yawRateDegS,
        lateralG: prev.lateralG,
        exhaustFlapDutyPct: prev.exhaustFlapDutyPct,
        prevHash: lastBlock ? lastBlock.blockHash : '0000000000000000000000000000000000000000000000000000000000000000',
        blockHash: randHex,
        verified: true,
      };

      setLedgerBlocks((blocks) => [...blocks, newBlock]);
      return { ...prev, monotonicSeq: nextSeq };
    });
  }, [ledgerBlocks]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* 
        CRITICAL: Header, Monroney banner, and telemetry cards MUST use standard relative/static positioning 
        so they scroll off the viewport naturally (zero sticky/fixed headers eating up vertical screen estate).
      */}
      <HeaderBanner
        onOpenYawSim={() => setIsYawSimOpen(true)}
        onOpenLedgerVerify={() => setIsLedgerVerifyOpen(true)}
        onExportSpec={downloadMasterSpec}
        onOpenApaModal={() => setIsApaModalOpen(true)}
      />

      {/* 4 Live Telemetry Metrics Cards */}
      <TelemetryCards
        telemetry={telemetry}
        onOpenLedgerVerify={() => setIsLedgerVerifyOpen(true)}
        onOpenApaModal={() => setIsApaModalOpen(true)}
      />

      {/* Five Navigable Tabs Bar */}
      <nav aria-label="Cockpit Tabs" className="relative w-full px-4 sm:px-6 lg:px-8 pt-2 pb-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('drs')}
            className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-lg text-base font-extrabold transition-all cursor-pointer ${
              activeTab === 'drs'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span>Tab 1: DRS & Acoustic Core Engine</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('postgres')}
            className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-lg text-base font-extrabold transition-all cursor-pointer ${
              activeTab === 'postgres'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Database className="w-5 h-5" />
            <span>Tab 2: Postgres Touring Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('openapi')}
            className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-lg text-base font-extrabold transition-all cursor-pointer ${
              activeTab === 'openapi'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <FileCode className="w-5 h-5" />
            <span>Tab 3: OpenAPI 3.1 Touring Contract</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloudrun')}
            className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-lg text-base font-extrabold transition-all cursor-pointer ${
              activeTab === 'cloudrun'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Cloud className="w-5 h-5" />
            <span>Tab 4: Turnkey Cloud Run Harness</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apa')}
            className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-lg text-base font-extrabold transition-all cursor-pointer ${
              activeTab === 'apa'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <FileCheck2 className="w-5 h-5" />
            <span>Tab 5: Acquire.com APA Covenant</span>
          </button>
        </div>
      </nav>

      {/* Main Tab View Content Area */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 pb-12">
        {activeTab === 'drs' && (
          <DrsAcousticCoreTab
            telemetry={telemetry}
            onUpdateTelemetry={updateTelemetry}
            onTriggerPreset={triggerPreset}
          />
        )}

        {activeTab === 'postgres' && (
          <PostgresLedgerTab
            ledgerBlocks={ledgerBlocks}
            telemetry={telemetry}
            onAddNewBlock={handleRecordBlock}
            onOpenLedgerModal={() => setIsLedgerVerifyOpen(true)}
          />
        )}

        {activeTab === 'openapi' && (
          <OpenApiContractTab telemetry={telemetry} />
        )}

        {activeTab === 'cloudrun' && (
          <CloudRunHarnessTab />
        )}

        {activeTab === 'apa' && (
          <ApaCovenantTab
            onOpenApaModal={() => setIsApaModalOpen(true)}
            onExportSpec={downloadMasterSpec}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-neutral-900 border-t border-neutral-800 px-4 sm:px-6 lg:px-8 py-6 text-neutral-400 text-base flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white font-mono">GF-T3-177</span>
          <span>•</span>
          <span>Ghost FactoryOS Chief Systems Architecture</span>
          <span>•</span>
          <span className="text-amber-400 font-medium">Lexus LC 500 Convertible Grand Touring</span>
        </div>
        <div className="flex items-center gap-4 text-base font-mono">
          <span className="text-emerald-400">100% Permissive MIT</span>
          <span>•</span>
          <span className="text-cyan-400">Clean-Room Certified</span>
          <span>•</span>
          <button
            type="button"
            onClick={downloadMasterSpec}
            className="text-amber-400 hover:underline cursor-pointer"
          >
            Export GF_T3_177_SPEC.md
          </button>
        </div>
      </footer>

      {/* Modal 1: Simulate DRS Dynamic Yaw */}
      <YawSimulationModal
        isOpen={isYawSimOpen}
        onClose={() => setIsYawSimOpen(false)}
        currentTelemetry={telemetry}
        onApplyTelemetry={updateTelemetry}
      />

      {/* Modal 2: Verify Touring Ledger Hash */}
      <LedgerVerifyModal
        isOpen={isLedgerVerifyOpen}
        onClose={() => setIsLedgerVerifyOpen(false)}
        ledgerBlocks={ledgerBlocks}
      />

      {/* Modal 3: Acquire.com APA Contract */}
      <ApaContractModal
        isOpen={isApaModalOpen}
        onClose={() => setIsApaModalOpen(false)}
        onExportSpec={downloadMasterSpec}
      />
    </div>
  );
}
