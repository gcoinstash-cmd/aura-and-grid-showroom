import React, { useState, useEffect } from 'react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryMetricsStrip } from './components/TelemetryMetricsStrip';
import { V10AcousticsTab } from './components/V10AcousticsTab';
import { PostgresLedgerTab } from './components/PostgresLedgerTab';
import { OpenApiTab } from './components/OpenApiTab';
import { CloudRunHarnessTab } from './components/CloudRunHarnessTab';
import { ApaCovenantTab } from './components/ApaCovenantTab';
import { VerifyHashModal } from './components/VerifyHashModal';
import { triggerSpecDownload } from './utils/specExport';
import { v10Synth } from './utils/audioSynth';
import { Layers, Database, Terminal, Cloud, FileText, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [currentRpm, setCurrentRpm] = useState<number>(850);
  const [currentGear, setCurrentGear] = useState<string>('N');
  const [shiftDurationMs] = useState<number>(150);
  const [nonce, setNonce] = useState<number>(1042004);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isHashModalOpen, setIsHashModalOpen] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Background monotonic nonce and gentle idle variation when active
  useEffect(() => {
    const interval = setInterval(() => {
      setNonce((prev) => prev + 1);

      if (isSimulating) {
        // Natural idle/light surge throttle variation
        setCurrentRpm((prev) => {
          if (prev <= 950) {
            return Math.min(1050, Math.max(830, prev + Math.floor(Math.random() * 40 - 20)));
          }
          return prev;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const handleSimulateToggle = () => {
    if (!isSimulating) {
      setIsSimulating(true);
      setActiveTab(1);
      // Gentle rev bump to demonstrate action
      setCurrentRpm(3800);
      setCurrentGear('2');
      v10Synth.updateRPM(3800);
    } else {
      setIsSimulating(false);
      setCurrentRpm(850);
      setCurrentGear('N');
      v10Synth.stop();
    }
  };

  const handleExportSpec = () => {
    triggerSpecDownload();
    setExportNotice('GF_T3_198_SPEC.md generated & downloaded to local vault.');
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Notice if Spec Exported */}
      {exportNotice && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-base font-bold text-center flex items-center justify-center gap-2 shadow-lg animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Main Container - Standard relative/static document flow (zero sticky/fixed headers eating vertical space) */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* Bulletproof MonroneyBanner (Zero Wrapping, Zero Clipping, Zero Stacking Bugs) */}
        <MonroneyBanner
          onSimulateV10={handleSimulateToggle}
          onVerifyHash={() => setIsHashModalOpen(true)}
          isSimulating={isSimulating}
          onExportSpec={handleExportSpec}
        />

        {/* Live Telemetry Metrics Strip */}
        <TelemetryMetricsStrip
          currentRpm={currentRpm}
          currentGear={currentGear}
          shiftDurationMs={shiftDurationMs}
          nonce={nonce}
          isSimulating={isSimulating}
        />

        {/* Five Navigable Tabs with Full Technical Implementation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-lg overflow-x-auto">
          <nav className="flex items-center gap-1 min-w-[760px]">
            <button
              onClick={() => setActiveTab(1)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-base font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 1
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-5 h-5" />
              <span>1. 1LR-GUE V10 Acoustics & ASG Core</span>
            </button>

            <button
              onClick={() => setActiveTab(2)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-base font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 2
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-5 h-5" />
              <span>2. Postgres Dry-Sump Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab(3)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-base font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 3
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="w-5 h-5" />
              <span>3. OpenAPI 3.1 Telemetry Contract</span>
            </button>

            <button
              onClick={() => setActiveTab(4)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-base font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 4
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Cloud className="w-5 h-5" />
              <span>4. Turnkey Cloud Run Harness</span>
            </button>

            <button
              onClick={() => setActiveTab(5)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-base font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 5
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>5. Acquire.com APA Covenant</span>
            </button>
          </nav>
        </div>

        {/* Tab Content Stage */}
        <section className="pt-1">
          {activeTab === 1 && (
            <V10AcousticsTab
              currentRpm={currentRpm}
              setCurrentRpm={setCurrentRpm}
              currentGear={currentGear}
              setCurrentGear={setCurrentGear}
              shiftDurationMs={shiftDurationMs}
              isSimulating={isSimulating}
              setIsSimulating={setIsSimulating}
            />
          )}

          {activeTab === 2 && <PostgresLedgerTab />}

          {activeTab === 3 && <OpenApiTab />}

          {activeTab === 4 && <CloudRunHarnessTab />}

          {activeTab === 5 && <ApaCovenantTab />}
        </section>
      </main>

      {/* Cryptographic Hash Verification Modal */}
      <VerifyHashModal
        isOpen={isHashModalOpen}
        onClose={() => setIsHashModalOpen(false)}
        currentNonce={nonce}
      />

      {/* Institutional Document Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-4 text-center text-base text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-400 font-bold">GF-T3-198</span>
            <span>·</span>
            <span>Heavy Overland Dynamics Platform LFA Nürburgring Edition V10 Telematics Core</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-mono text-slate-400">
            <span>Delaware Micro-APA Asset</span>
            <span>·</span>
            <span>MIT Permissive License</span>
            <span>·</span>
            <span className="text-emerald-400 font-bold">Clean-Room Certified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
