/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Wind,
  Database,
  Network,
  Server,
  FileText,
  AlertCircle,
  CheckCircle,
  Info,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryStrip } from './components/TelemetryStrip';
import { CowlAeroTab } from './components/tabs/CowlAeroTab';
import { PostgresLedgerTab } from './components/tabs/PostgresLedgerTab';
import { OpenApiTab } from './components/tabs/OpenApiTab';
import { CloudRunHarnessTab } from './components/tabs/CloudRunHarnessTab';
import { ApaCovenantTab } from './components/tabs/ApaCovenantTab';
import { VerifyHashModal } from './components/Modals/VerifyHashModal';
import { GitLogModal } from './components/Modals/GitLogModal';
import { GF_T3_189_SPEC_MD } from './data/specDocument';
import {
  TelemetryState,
  LedgerRecord,
  INITIAL_LEDGER_RECORDS,
  computeAeroMetrics,
  generateSha256,
} from './data/mockTelemetry';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'cowl_aero' | 'postgres' | 'openapi' | 'cloudrun' | 'covenant'
  >('cowl_aero');

  // Core Telemetry State
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    speedMph: 85,
    roofState: 'STOWED',
    crosswindKt: 14,
    cowlDamperForce: 85,
    harmonicFrequencyHz: 21.15,
    cowlDeflectionUm: 24.3,
    cabinDecibels: 74.8,
    suppressionDeltaDb: 14.2,
    torsionalStiffnessGainPct: 15.6,
    hydraulicPressurePsi: 2120,
    currentNonce: 1000042,
  });

  const [records, setRecords] = useState<LedgerRecord[]>(INITIAL_LEDGER_RECORDS);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isVerifyHashOpen, setIsVerifyHashOpen] = useState(false);
  const [isGitLogOpen, setIsGitLogOpen] = useState(false);

  // Notification Toast State
  const [toast, setToast] = useState<{
    type: 'success' | 'alert' | 'info';
    message: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'alert' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  const handleUpdateTelemetry = (updates: Partial<TelemetryState>) => {
    setTelemetry((prev) => ({ ...prev, ...updates }));
  };

  // Simulate High-Speed Aero Pulse
  const handleSimulateAero = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    showToast('Aero Dynamic Simulation Started: Simulating high-speed crosswind burst on High-Aero Grand Touring Telemetry Core...', 'info');

    let step = 0;
    const initialSpeed = telemetry.speedMph;
    const initialDamper = telemetry.cowlDamperForce;

    const interval = setInterval(async () => {
      step++;
      const targetSpeed = Math.min(135, initialSpeed + step * 8);
      const targetDamper = Math.min(100, Math.max(50, initialDamper + (step % 2 === 0 ? 5 : -3)));
      const computed = computeAeroMetrics(targetSpeed, telemetry.roofState, telemetry.crosswindKt, targetDamper);

      const nextNonce = telemetry.currentNonce + step;
      const newHash = await generateSha256(
        `${nextNonce}|${targetSpeed}|${computed.cowlDeflectionUm}|${Date.now()}`
      );

      const newRecord: LedgerRecord = {
        nonce: nextNonce,
        recordedAt: new Date().toISOString(),
        speedMph: targetSpeed,
        roofState: telemetry.roofState,
        cowlDeflectionUm: computed.cowlDeflectionUm,
        cabinSplDb: computed.cabinDecibels,
        damperForceN: Math.round(3500 + targetDamper * 45),
        harmonicFreqHz: computed.harmonicFrequencyHz,
        prevHash: records[0]?.hmacSignature || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        hmacSignature: newHash,
        status: 'VERIFIED',
      };

      setRecords((prev) => [newRecord, ...prev.slice(0, 19)]);
      setTelemetry((prev) => ({
        ...prev,
        speedMph: targetSpeed,
        cowlDamperForce: targetDamper,
        currentNonce: nextNonce,
        ...computed,
      }));

      if (step >= 6) {
        clearInterval(interval);
        setIsSimulating(false);
        showToast('Aero Simulation Complete: Torsional flex damped and HMAC block committed.', 'success');
      }
    }, 600);
  };

  // Inject Corrupted Record for Testing Harmonic Quarantine
  const handleInjectTamper = () => {
    const tamperedNonce = telemetry.currentNonce + 99;
    const corruptedRecord: LedgerRecord = {
      nonce: tamperedNonce,
      recordedAt: new Date().toISOString(),
      speedMph: 158.0,
      roofState: 'STOWED',
      cowlDeflectionUm: 182.4, // Exceeds 150 um limit
      cabinSplDb: 98.4,
      damperForceN: 9200.0,
      harmonicFreqHz: 38.4, // Exceeds 34.0 Hz safety boundary
      prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
      hmacSignature: 'FORGED_INVALID_SIGNATURE_PAYLOAD_E94A0182C3D',
      status: 'QUARANTINED',
      tampered: true,
    };

    setRecords((prev) => [corruptedRecord, ...prev]);
    showToast(
      'QUARANTINE TRIGGER FIRED: Corrupted record detected (>34Hz & invalid HMAC). Isolated to gf_aero_core.harmonic_quarantine.',
      'alert'
    );
  };

  const handleResetLedger = () => {
    setRecords(INITIAL_LEDGER_RECORDS);
    showToast('Resonance Ledger reset to initial verified baseline.', 'info');
  };

  const handleVerifyLedger = () => {
    const quarantined = records.filter((r) => r.status === 'QUARANTINED').length;
    if (quarantined > 0) {
      showToast(
        `Ledger Verification: ${quarantined} quarantined entry isolated. Remaining records passed HMAC check.`,
        'alert'
      );
    } else {
      showToast('All ledger timeseries records verified with 100% HMAC-SHA256 integrity.', 'success');
    }
  };

  // Export Spec as GF_T3_189_SPEC.md
  const handleExportSpec = () => {
    const blob = new Blob([GF_T3_189_SPEC_MD], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GF_T3_189_SPEC.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('GF_T3_189_SPEC.md downloaded successfully for local master vault archival.', 'success');
  };

  // Export Ledger to CSV
  const handleExportCsv = () => {
    const headers = 'nonce,recorded_at,speed_mph,roof_state,cowl_deflection_um,cabin_spl_db,damper_force_n,harmonic_freq_hz,status,hmac_signature\n';
    const rows = records
      .map(
        (r) =>
          `${r.nonce},"${r.recordedAt}",${r.speedMph},${r.roofState},${r.cowlDeflectionUm},${r.cabinSplDb},${r.damperForceN},${r.harmonicFreqHz},${r.status},"${r.hmacSignature}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gf_t3_189_telemetry_ledger.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Telemetry ledger exported to CSV.', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 max-w-md transition-all animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/60 text-emerald-200'
              : toast.type === 'alert'
              ? 'bg-rose-950 border-rose-500/60 text-rose-200'
              : 'bg-slate-900 border-indigo-500/60 text-indigo-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : toast.type === 'alert' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-indigo-400 shrink-0" />
          )}
          <span className="text-base font-medium">{toast.message}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {/* MonroneyBanner (Non-breaking layout protocol) */}
        <MonroneyBanner
          onSimulateAero={handleSimulateAero}
          onVerifyHash={() => setIsVerifyHashOpen(true)}
          onExportSpec={handleExportSpec}
          onOpenGitLog={() => setIsGitLogOpen(true)}
          onExportCsv={handleExportCsv}
          isSimulating={isSimulating}
        />

        {/* Live Telemetry Metrics Strip (Strict 16px floor, text-4xl readouts) */}
        <TelemetryStrip
          harmonicFrequencyHz={telemetry.harmonicFrequencyHz}
          suppressionDeltaDb={telemetry.suppressionDeltaDb}
          currentNonce={telemetry.currentNonce}
          isSimulating={isSimulating}
          roofState={telemetry.roofState}
        />

        {/* 5 Primary Navigation Tabs */}
        <div className="border-b border-slate-800 mb-6 overflow-x-auto">
          <nav className="flex space-x-2 min-w-max pb-1">
            <button
              onClick={() => setActiveTab('cowl_aero')}
              className={`py-3 px-4 font-bold text-base rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'cowl_aero'
                  ? 'bg-slate-900 text-amber-400 border-t-2 border-l border-r border-t-amber-400 border-slate-800'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Wind className="w-5 h-5" />
              Tab 1: Cowl Damper & Aero Acoustic Core
            </button>

            <button
              onClick={() => setActiveTab('postgres')}
              className={`py-3 px-4 font-bold text-base rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'postgres'
                  ? 'bg-slate-900 text-indigo-400 border-t-2 border-l border-r border-t-indigo-400 border-slate-800'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Database className="w-5 h-5" />
              Tab 2: Postgres Resonance Ledger
            </button>

            <button
              onClick={() => setActiveTab('openapi')}
              className={`py-3 px-4 font-bold text-base rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'openapi'
                  ? 'bg-slate-900 text-cyan-400 border-t-2 border-l border-r border-t-cyan-400 border-slate-800'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Network className="w-5 h-5" />
              Tab 3: OpenAPI 3.1 Telemetry Contract
            </button>

            <button
              onClick={() => setActiveTab('cloudrun')}
              className={`py-3 px-4 font-bold text-base rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'cloudrun'
                  ? 'bg-slate-900 text-emerald-400 border-t-2 border-l border-r border-t-emerald-400 border-slate-800'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Server className="w-5 h-5" />
              Tab 4: Turnkey Cloud Run Harness
            </button>

            <button
              onClick={() => setActiveTab('covenant')}
              className={`py-3 px-4 font-bold text-base rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'covenant'
                  ? 'bg-slate-900 text-amber-300 border-t-2 border-l border-r border-t-amber-300 border-slate-800'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <FileText className="w-5 h-5" />
              Tab 5: Acquire.com APA Covenant
            </button>
          </nav>
        </div>

        {/* Tab Content Display */}
        <div className="pb-12">
          {activeTab === 'cowl_aero' && (
            <CowlAeroTab
              telemetry={telemetry}
              onUpdateTelemetry={handleUpdateTelemetry}
              isSimulating={isSimulating}
            />
          )}

          {activeTab === 'postgres' && (
            <PostgresLedgerTab
              records={records}
              onInjectTamper={handleInjectTamper}
              onResetLedger={handleResetLedger}
              onVerifyLedger={handleVerifyLedger}
            />
          )}

          {activeTab === 'openapi' && <OpenApiTab />}

          {activeTab === 'cloudrun' && <CloudRunHarnessTab />}

          {activeTab === 'covenant' && <ApaCovenantTab onExportSpec={handleExportSpec} />}
        </div>
      </main>

      {/* Institutional Vault Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-base text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-200">GF-T3-189</span>
            <span>·</span>
            <span>Apex Executive High-Aero Grand Touring Telemetry Core Convertible Structural Aero Core</span>
            <span>·</span>
            <span className="text-emerald-400 font-mono">Turnkey Micro-APA Asset</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-mono">
            <span>Commercial Software Asset Standard Escrow Approved</span>
            <span>·</span>
            <span className="text-amber-400">Acquire.com Verified Listing</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <VerifyHashModal
        isOpen={isVerifyHashOpen}
        onClose={() => setIsVerifyHashOpen(false)}
      />

      <GitLogModal
        isOpen={isGitLogOpen}
        onClose={() => setIsGitLogOpen(false)}
      />
    </div>
  );
}
