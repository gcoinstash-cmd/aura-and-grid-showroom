import React, { useState, useEffect, useRef } from 'react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryStrip } from './components/TelemetryStrip';
import { HashVerifyModal } from './components/HashVerifyModal';
import { TabAcousticTorsen } from './components/tabs/TabAcousticTorsen';
import { TabPostgresLedger } from './components/tabs/TabPostgresLedger';
import { TabOpenApiContract } from './components/tabs/TabOpenApiContract';
import { TabCloudRunHarness } from './components/tabs/TabCloudRunHarness';
import { TabApaCovenant } from './components/tabs/TabApaCovenant';
import { TelemetryBlock, computeHmacSha256, formatBlockHashPayload } from './utils/cryptoLedger';
import { v8Synth } from './utils/audioSynth';
import { Activity, Database, Network, Cloud, Scale } from 'lucide-react';

export default function App() {
  // Live Engine State
  const [rpm, setRpm] = useState(2400);
  const [throttlePct, setThrottlePct] = useState(45);
  const [nonce, setNonce] = useState(1084291);
  const [diffOilTemp, setDiffOilTemp] = useState(94.2);
  const [isSimulatingThrottle, setIsSimulatingThrottle] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'acoustic' | 'ledger' | 'openapi' | 'cloudrun' | 'apa'>('acoustic');

  // Initial Seeded Ledger Blocks
  const [blocks, setBlocks] = useState<TelemetryBlock[]>([]);
  const [isTampered, setIsTampered] = useState(false);
  const simulationIntervalRef = useRef<number | null>(null);

  // Determine acoustic state
  const acousticValveState = rpm >= 3600 ? 'STAGE_2_OPEN' : 'STAGE_1_CLOSED';
  const tbrRatio = 2.80;

  // Initialize seeded ledger blocks with real cryptographic HMACs on mount
  useEffect(() => {
    async function initBlocks() {
      const initialBlocks: TelemetryBlock[] = [];
      let prevHash = "a4c28f93e1b072dae83915f013bd42718e24c5710bc8d94e1329cbf07198a2de";
      const baseNonce = 1084285;

      for (let i = 1; i <= 6; i++) {
        const height = 10420 + i;
        const n = baseNonce + i;
        const blockRpm = 1800 + i * 400;
        const blockTemp = 91.0 + i * 0.8;
        const time = new Date(Date.now() - (7 - i) * 1000).toISOString();

        const draft: Omit<TelemetryBlock, 'hmacSignature'> = {
          blockHeight: height,
          nonce: n,
          timestamp: time,
          rpm: blockRpm,
          throttlePct: 40 + i * 5,
          manifoldPressureKpa: 96.5,
          acousticValveState: blockRpm >= 3600 ? 'STAGE_2_OPEN' : 'STAGE_1_CLOSED',
          diffOilTempC: blockTemp,
          tbrRatio: 2.80,
          leftWheelRpm: 340.0 + i * 10,
          rightWheelRpm: 360.0 + i * 10,
          yawMomentNm: 180.0 + i * 20,
          prevHash: prevHash,
          status: 'COMMITTED',
        };

        const signature = await computeHmacSha256(formatBlockHashPayload(draft));
        const fullBlock: TelemetryBlock = {
          ...draft,
          hmacSignature: signature,
        };

        initialBlocks.unshift(fullBlock);
        prevHash = signature;
      }

      setBlocks(initialBlocks);
    }

    initBlocks();
  }, []);

  // Continuous subtle monotonic nonce incrementing & ledger updates
  useEffect(() => {
    const timer = setInterval(async () => {
      setNonce((prev) => prev + 1);

      // Random gentle variation in diff temp (within safe 90-100 range)
      setDiffOilTemp((prev) => {
        const delta = (Math.random() - 0.5) * 0.2;
        return Number(Math.max(88, Math.min(105, prev + delta)).toFixed(1));
      });
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  // Throttle sweep simulation handler
  const handleSimulateThrottle = () => {
    if (isSimulatingThrottle) return;
    setIsSimulatingThrottle(true);

    let sweepStep = 0;
    const sweepSteps = [
      { r: 1200, t: 20 },
      { r: 2400, t: 40 },
      { r: 3550, t: 65 },
      { r: 3800, t: 85 }, // Flap crossover!
      { r: 5200, t: 95 },
      { r: 6800, t: 100 },
      { r: 7100, t: 100 }, // Peak HP!
      { r: 7300, t: 100 }, // Fuel cut rev bounce
      { r: 7200, t: 90 },
      { r: 5400, t: 50 },
      { r: 3200, t: 25 },
      { r: 1200, t: 15 },
    ];

    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }

    simulationIntervalRef.current = window.setInterval(() => {
      if (sweepStep < sweepSteps.length) {
        const step = sweepSteps[sweepStep];
        setRpm(step.r);
        setThrottlePct(step.t);
        v8Synth.setRpm(step.r);
        sweepStep++;
      } else {
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current);
          simulationIntervalRef.current = null;
        }
        setIsSimulatingThrottle(false);
      }
    }, 280);
  };

  const handleTamperBlock = (index: number) => {
    setBlocks((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = {
          ...copy[index],
          rpm: 9999, // Unsigned illegal RPM tamper
          status: 'CORRUPTED',
        };
      }
      return copy;
    });
    setIsTampered(true);
  };

  const handleResetLedger = async () => {
    setIsTampered(false);
    // Recompute signatures for all blocks
    const restored = await Promise.all(
      blocks.map(async (b, idx) => {
        const uncorrupted: TelemetryBlock = {
          ...b,
          rpm: 3200 + idx * 200,
          status: 'COMMITTED',
        };
        const sig = await computeHmacSha256(formatBlockHashPayload(uncorrupted));
        return {
          ...uncorrupted,
          hmacSignature: sig,
        };
      })
    );
    setBlocks(restored);
  };

  const activeBlock: TelemetryBlock = blocks[0] || {
    blockHeight: 10426,
    nonce: nonce,
    timestamp: new Date().toISOString(),
    rpm: rpm,
    throttlePct: throttlePct,
    manifoldPressureKpa: 98.4,
    acousticValveState: acousticValveState,
    diffOilTempC: diffOilTemp,
    tbrRatio: tbrRatio,
    leftWheelRpm: 450,
    rightWheelRpm: 450,
    yawMomentNm: 0,
    prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
    hmacSignature: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    status: 'COMMITTED',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header - Strict 3-zone contract, Relative document flow, No sticky/fixed header */}
      <header className="w-full border-b border-slate-800 bg-slate-950 px-4 sm:px-8 py-4 flex items-center justify-between gap-8 relative">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-mono font-black text-amber-400 text-sm">
            GF
          </div>
          <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
            Ghost FactoryOS
          </span>
        </div>

        {/* Zone 2: Clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('acoustic')}
            className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'acoustic' ? 'text-white font-semibold' : ''
            }`}
          >
            2UR-GSE Acoustic
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'ledger' ? 'text-white font-semibold' : ''
            }`}
          >
            PostgreSQL Ledger
          </button>
          <button
            onClick={() => setActiveTab('openapi')}
            className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'openapi' ? 'text-white font-semibold' : ''
            }`}
          >
            OpenAPI Contract
          </button>
          <button
            onClick={() => setActiveTab('cloudrun')}
            className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'cloudrun' ? 'text-white font-semibold' : ''
            }`}
          >
            Cloud Run Test Bench
          </button>
          <button
            onClick={() => setActiveTab('apa')}
            className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'apa' ? 'text-white font-semibold' : ''
            }`}
          >
            Acquire.com APA
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsVerifyModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            Verify Escrow Hash
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {/* MonroneyBanner - Compact non-breaking layout */}
        <MonroneyBanner
          onSimulateThrottle={handleSimulateThrottle}
          onVerifyHash={() => setIsVerifyModalOpen(true)}
          isSimulating={isSimulatingThrottle}
        />

        {/* Live Telemetry Metrics Strip */}
        <TelemetryStrip
          rpm={rpm}
          acousticValveState={acousticValveState}
          tbrRatio={tbrRatio}
          nonce={nonce}
          diffOilTemp={diffOilTemp}
        />

        {/* Interactive Five-Tab Navigation Segmented Control */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-xl mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('acoustic')}
            className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-all inline-flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'acoustic'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>1. 2UR-GSE Acoustic & Torsen</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-all inline-flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'ledger'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>2. Postgres Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('openapi')}
            className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-all inline-flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'openapi'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>3. OpenAPI 3.1 Contract</span>
          </button>

          <button
            onClick={() => setActiveTab('cloudrun')}
            className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-all inline-flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'cloudrun'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>4. Cloud Run Harness</span>
          </button>

          <button
            onClick={() => setActiveTab('apa')}
            className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-all inline-flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'apa'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>5. Acquire.com APA Covenant</span>
          </button>
        </div>

        {/* Tab Content Panes */}
        {activeTab === 'acoustic' && (
          <TabAcousticTorsen
            rpm={rpm}
            setRpm={setRpm}
            acousticValveState={acousticValveState}
            tbrRatio={tbrRatio}
            throttlePct={throttlePct}
            setThrottlePct={setThrottlePct}
          />
        )}

        {activeTab === 'ledger' && (
          <TabPostgresLedger
            blocks={blocks}
            onAddBlock={(newB) => setBlocks((prev) => [newB, ...prev])}
            onTamperBlock={handleTamperBlock}
            onResetLedger={handleResetLedger}
            isTampered={isTampered}
          />
        )}

        {activeTab === 'openapi' && (
          <TabOpenApiContract currentRpm={rpm} />
        )}

        {activeTab === 'cloudrun' && (
          <TabCloudRunHarness />
        )}

        {activeTab === 'apa' && (
          <TabApaCovenant />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 px-4 sm:px-8 py-6 mt-12 text-center text-sm text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-400">GF-T3-193</span>
            <span aria-hidden="true">·</span>
            <span>Lexus IS 500 F SPORT Performance Core</span>
            <span aria-hidden="true">·</span>
            <span>Turnkey Micro-APA Deliverable</span>
          </div>
          <div>
            <span>Target Escrow: Delaware, USA</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>100% Clean-Room Certified</span>
          </div>
        </div>
      </footer>

      {/* Cryptographic Hash Verification Modal */}
      <HashVerifyModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        activeBlock={activeBlock}
      />
    </div>
  );
}
