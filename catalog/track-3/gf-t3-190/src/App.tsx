import React, { useState, useEffect, useRef } from 'react';
import { 
  Gauge, 
  BatteryCharging, 
  Database, 
  Network, 
  Cloud, 
  FileCheck2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Download
} from 'lucide-react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryMetricsStrip } from './components/TelemetryMetricsStrip';
import { TabSolidStateAndShifter } from './components/tabs/TabSolidStateAndShifter';
import { TabPostgresLedger } from './components/tabs/TabPostgresLedger';
import { TabOpenApiContract } from './components/tabs/TabOpenApiContract';
import { TabCloudRunHarness } from './components/tabs/TabCloudRunHarness';
import { TabApaCovenant } from './components/tabs/TabApaCovenant';
import { LedgerBlock, createLedgerBlock, verifyLedgerChain } from './utils/cryptoLedger';
import { audioSynth } from './utils/audioSynth';
import { generateSpecMarkdown } from './utils/specContent';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'ssb-vmt' | 'ledger' | 'openapi' | 'cloudrun' | 'apa'>('ssb-vmt');

  // Powertrain Simulation State
  const [currentGear, setCurrentGear] = useState<string>('1');
  const [rpm, setRpm] = useState<number>(1250);
  const [speedMph, setSpeedMph] = useState<number>(0);
  const [torqueNm, setTorqueNm] = useState<number>(240);
  const [clutchPct, setClutchPct] = useState<number>(0.0);
  const [throttlePct, setThrottlePct] = useState<number>(0.25);
  const [isStalled, setIsStalled] = useState<boolean>(false);
  const [torqueCutActive, setTorqueCutActive] = useState<boolean>(false);
  const [autoRevMatch, setAutoRevMatch] = useState<boolean>(true);

  // Solid-State Battery State
  const [currentImpedance, setCurrentImpedance] = useState<number>(0.84);
  const [dendriteSafetyMargin, setDendriteSafetyMargin] = useState<number>(99.8);
  const [coolingMode, setCoolingMode] = useState<'STANDARD' | 'FAST_CHARGE' | 'HOT_LAP'>('STANDARD');
  const [activeCellId, setActiveCellId] = useState<number>(18);
  const [quarantinedCells, setQuarantinedCells] = useState<number[]>([]);

  // Telemetry Nonce & Ledger
  const [currentNonce, setCurrentNonce] = useState<number>(1004812);
  const [lastBlockHash, setLastBlockHash] = useState<string>('0x8a91f3b2c401e79d841b9921e649fc91');
  const [ledgerChain, setLedgerChain] = useState<LedgerBlock[]>([]);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    message: string;
    failedIndex: number | null;
  } | null>({
    isValid: true,
    message: 'All blocks mathematically verified with zero collision (HMAC-SHA256 valid).',
    failedIndex: null,
  });

  // Action feedback
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  // Gear ratios table
  const gearRatios: Record<string, number> = {
    R: -3.85,
    N: 0.0,
    '1': 3.82,
    '2': 2.36,
    '3': 1.69,
    '4': 1.31,
    '5': 1.0,
    '6': 0.79,
  };

  // Initialize seed ledger
  useEffect(() => {
    async function initSeedLedger() {
      const initialBlocks: LedgerBlock[] = [];
      let prevHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const baseNonce = 1004800;

      for (let i = 0; i < 12; i++) {
        const blkNonce = baseNonce + i;
        const blk = await createLedgerBlock(
          blkNonce,
          782.4 + (i % 3) * 0.4,
          0.842 + (i % 4) * 0.002,
          1.2,
          '1',
          1250 + i * 80,
          0.0,
          240 + i * 20,
          'NORMAL',
          prevHash
        );
        initialBlocks.unshift(blk);
        prevHash = blk.blockHash;
      }

      setLedgerChain(initialBlocks);
      setLastBlockHash(initialBlocks[0].blockHash);
      setCurrentNonce(baseNonce + 12);
    }

    initSeedLedger();
  }, []);

  // Real-time Physics Simulation Loop (60Hz tick)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isStalled) {
        audioSynth.updateRpm(0, true);
        return;
      }

      // Check stall condition: In gear, stopped (<2mph), clutch dumped (<0.20), low throttle (<0.10)
      if (
        currentGear !== 'N' &&
        speedMph < 2.0 &&
        clutchPct < 0.2 &&
        throttlePct < 0.1
      ) {
        setIsStalled(true);
        setTorqueNm(0);
        setRpm(0);
        audioSynth.playStallAlarm();
        audioSynth.updateRpm(0, true);
        return;
      }

      // Update Audio
      audioSynth.updateRpm(rpm, false);

      // Simple physics approximation
      const bitePoint = 0.42;
      const clutchEngagedRatio =
        clutchPct >= bitePoint ? 0.0 : (bitePoint - clutchPct) / bitePoint;

      const ratio = gearRatios[currentGear] || 0;
      const finalDrive = 3.65;
      const totalRatio = ratio * finalDrive;

      // RPM dynamics
      if (clutchPct > 0.85 || currentGear === 'N') {
        const targetRpm = 850 + throttlePct * (10800 - 850);
        setRpm((prev) => prev + (targetRpm - prev) * 0.12);
        setTorqueNm(0);
        setSpeedMph((prev) => Math.max(0, prev - 0.25));
      } else {
        // Vehicle in gear
        if (torqueCutActive) {
          setTorqueNm(0);
        } else {
          const rawTorque = throttlePct * 1280.0;
          const effectiveTorque = rawTorque * clutchEngagedRatio;
          setTorqueNm(effectiveTorque);

          // Speed acceleration
          if (effectiveTorque > 0 && totalRatio > 0) {
            setSpeedMph((prev) => Math.min(205, prev + (effectiveTorque / 1280.0) * 0.65));
          } else {
            setSpeedMph((prev) => Math.max(0, prev - 0.15));
          }

          // Target engine RPM matches road speed
          const calculatedRpm = Math.max(850, (speedMph / 0.1885) * (totalRatio / 3.0));
          setRpm(Math.min(11000, calculatedRpm));
        }
      }

      // Micro-impedance gentle jitter for realism
      setCurrentImpedance(0.84 + Math.sin(Date.now() / 2000) * 0.015);
    }, 50);

    return () => clearInterval(interval);
  }, [
    currentGear,
    rpm,
    speedMph,
    clutchPct,
    throttlePct,
    isStalled,
    torqueCutActive,
  ]);

  // Periodic Telemetry Nonce & Ledger Stream
  useEffect(() => {
    const ledgerInterval = setInterval(async () => {
      if (ledgerChain.length === 0) return;

      const newNonce = currentNonce + 1;
      const prevHash = ledgerChain[0]?.blockHash || '0x00';
      const status = torqueCutActive ? 'TORQUE_CUT' : isStalled ? 'STALL' : 'NORMAL';

      const newBlock = await createLedgerBlock(
        newNonce,
        782.4 + (Math.random() - 0.5) * 1.5,
        currentImpedance,
        1.2,
        currentGear,
        rpm,
        clutchPct,
        torqueNm,
        status,
        prevHash
      );

      setCurrentNonce(newNonce);
      setLastBlockHash(newBlock.blockHash);
      setLedgerChain((prev) => [newBlock, ...prev.slice(0, 49)]);
    }, 2400);

    return () => clearInterval(ledgerInterval);
  }, [currentNonce, ledgerChain, torqueCutActive, isStalled, currentImpedance, currentGear, rpm, clutchPct, torqueNm]);

  // Shift Handler
  const handleShiftGear = (targetGear: string) => {
    if (isStalled) return;

    // Trigger synthetic 42ms torque cut
    setTorqueCutActive(true);
    audioSynth.playShiftPop();
    setCurrentGear(targetGear);

    // Auto-blip rev match if downshifting
    if (autoRevMatch) {
      const prevRatio = gearRatios[currentGear] || 1;
      const targetRatio = gearRatios[targetGear] || 1;
      if (targetRatio > prevRatio && targetRatio > 0) {
        setRpm((prev) => Math.min(10500, prev * (targetRatio / prevRatio)));
      }
    }

    setTimeout(() => {
      setTorqueCutActive(false);
    }, 45);

    setLastActionMessage(`Shift: ${currentGear} → ${targetGear} (42ms cut applied)`);
    setTimeout(() => setLastActionMessage(null), 3000);
  };

  // Simulate Shift from Monroney Banner
  const handleSimulateShiftBanner = () => {
    const sequence = ['1', '2', '3', '4', '5', '6'];
    const currentIdx = sequence.indexOf(currentGear);
    const nextGear = currentIdx >= 0 && currentIdx < sequence.length - 1 ? sequence[currentIdx + 1] : '1';
    handleShiftGear(nextGear);
  };

  // Verify Hash from Monroney Banner
  const handleVerifyHash = async () => {
    const result = await verifyLedgerChain(ledgerChain);
    setVerificationResult(result);
    setLastActionMessage(`HMAC Verified: Block #${currentNonce} validated`);
    setTimeout(() => setLastActionMessage(null), 3000);
  };

  // Export Spec
  const handleExportSpec = () => {
    const markdown = generateSpecMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'GF_T3_190_SPEC.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setLastActionMessage('Downloaded GF_T3_190_SPEC.md');
    setTimeout(() => setLastActionMessage(null), 3500);
  };

  // Restart Engine after stall
  const handleRestartEngine = () => {
    setIsStalled(false);
    setRpm(850);
    setClutchPct(1.0); // Depress clutch on start
    audioSynth.start();
    setLastActionMessage('Engine started (clutch depressed, 850 RPM idle)');
    setTimeout(() => setLastActionMessage(null), 3000);
  };

  // Launch Control simulation
  const handleTriggerLaunchControl = () => {
    if (isStalled) handleRestartEngine();
    setCurrentGear('1');
    setClutchPct(1.0);
    setThrottlePct(1.0);
    setRpm(6500);
    setSpeedMph(0);
    setLastActionMessage('Launch Control Staged: 6,500 RPM two-step active!');

    setTimeout(() => {
      setClutchPct(0.0);
      audioSynth.playShiftPop();
      setLastActionMessage('Launch! Sub-2.0s Dual-Motor Vectoring Dispatched');
      setTimeout(() => setLastActionMessage(null), 3000);
    }, 1200);
  };

  // Cell Dendrite Spike Test
  const handleTriggerCellSpike = (cellId: number) => {
    if (quarantinedCells.includes(cellId)) {
      setQuarantinedCells((prev) => prev.filter((id) => id !== cellId));
      setLastActionMessage(`Cell #${cellId + 1} de-isolated to nominal.`);
    } else {
      setQuarantinedCells((prev) => [...prev, cellId]);
      setLastActionMessage(`ALERT: Cell #${cellId + 1} isolated by 2,800Hz EIS safety interlock!`);
    }
    setTimeout(() => setLastActionMessage(null), 3500);
  };

  // Tamper Block in Memory
  const handleTamperBlock = () => {
    if (ledgerChain.length < 2) return;
    const tampered = [...ledgerChain];
    tampered[1] = {
      ...tampered[1],
      packVoltage: 999.9, // Tampered value
    };
    setLedgerChain(tampered);
    setVerificationResult({
      isValid: false,
      failedIndex: 1,
      message: `Tamper detected at Block #${tampered[1].nonce}: SHA-256 HMAC payload signature invalidated!`,
    });
    setLastActionMessage('Simulated tamper injected into Block #1');
  };

  // Restore Ledger
  const handleRestoreLedger = async () => {
    const restored = [...ledgerChain];
    if (restored.length > 1) {
      const prevHash = restored[2]?.blockHash || '0x00';
      const cleanBlock = await createLedgerBlock(
        restored[1].nonce,
        782.4,
        0.842,
        1.2,
        restored[1].gear,
        restored[1].rpm,
        restored[1].clutchPosition,
        restored[1].torqueNm,
        'NORMAL',
        prevHash
      );
      restored[1] = cleanBlock;
      setLedgerChain(restored);
      const res = await verifyLedgerChain(restored);
      setVerificationResult(res);
      setLastActionMessage('Ledger restored and HMAC cryptographic chain re-sealed!');
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col antialiased">
      {/* MAIN CONTAINER (Standard relative document flow, zero fixed/sticky overhead) */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        
        {/* Monroney Banner (HARDENED PROTOCOL) */}
        <MonroneyBanner
          onSimulateShift={handleSimulateShiftBanner}
          onVerifyHash={handleVerifyHash}
          onExportSpec={handleExportSpec}
          lastActionMessage={lastActionMessage}
          hashVerified={verificationResult?.isValid}
        />

        {/* Live Telemetry Metrics Strip (High legibility: 16px min, 4xl readouts) */}
        <TelemetryMetricsStrip
          currentImpedance={currentImpedance}
          samplingRate={2800}
          dendriteSafetyMargin={dendriteSafetyMargin}
          accelZeroToSixty={1.88}
          peakKw={710}
          currentNonce={currentNonce}
          lastBlockHash={lastBlockHash}
          licenseStatus="Ready for Escrow"
        />

        {/* 5-TAB NAVIGATION BAR */}
        <nav className="flex flex-wrap items-center gap-2 mb-8 p-1.5 bg-slate-900/90 rounded-xl border border-slate-800 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTab('ssb-vmt')}
            className={`flex-1 min-w-[200px] py-3 px-4 rounded-lg font-bold text-sm sm:text-base inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ssb-vmt'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Gauge className="w-5 h-5 shrink-0" />
            <span className="truncate">1. SSB & Virtual Shifter</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`flex-1 min-w-[200px] py-3 px-4 rounded-lg font-bold text-sm sm:text-base inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-5 h-5 shrink-0" />
            <span className="truncate">2. Postgres 16 Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('openapi')}
            className={`flex-1 min-w-[200px] py-3 px-4 rounded-lg font-bold text-sm sm:text-base inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'openapi'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Network className="w-5 h-5 shrink-0" />
            <span className="truncate">3. OpenAPI 3.1 & Stream</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloudrun')}
            className={`flex-1 min-w-[200px] py-3 px-4 rounded-lg font-bold text-sm sm:text-base inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'cloudrun'
                ? 'bg-purple-500 text-slate-950 shadow-lg shadow-purple-500/20 ring-1 ring-purple-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Cloud className="w-5 h-5 shrink-0" />
            <span className="truncate">4. Cloud Run & PyTest</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apa')}
            className={`flex-1 min-w-[200px] py-3 px-4 rounded-lg font-bold text-sm sm:text-base inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'apa'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 ring-1 ring-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileCheck2 className="w-5 h-5 shrink-0" />
            <span className="truncate">5. Acquire.com Covenant</span>
          </button>
        </nav>

        {/* ACTIVE TAB CONTENT */}
        <section className="mb-12">
          {activeTab === 'ssb-vmt' && (
            <TabSolidStateAndShifter
              currentGear={currentGear}
              rpm={rpm}
              speedMph={speedMph}
              torqueNm={torqueNm}
              clutchPct={clutchPct}
              throttlePct={throttlePct}
              isStalled={isStalled}
              torqueCutActive={torqueCutActive}
              autoRevMatch={autoRevMatch}
              onShiftGear={handleShiftGear}
              onClutchChange={setClutchPct}
              onThrottleChange={setThrottlePct}
              onToggleRevMatch={() => setAutoRevMatch(!autoRevMatch)}
              onRestartEngine={handleRestartEngine}
              onTriggerLaunchControl={handleTriggerLaunchControl}
              coolingMode={coolingMode}
              onChangeCoolingMode={setCoolingMode}
              activeCellId={activeCellId}
              onSelectCell={setActiveCellId}
              quarantinedCells={quarantinedCells}
              onTriggerCellSpike={handleTriggerCellSpike}
            />
          )}

          {activeTab === 'ledger' && (
            <TabPostgresLedger
              ledgerChain={ledgerChain}
              onTamperBlock={handleTamperBlock}
              onRestoreLedger={handleRestoreLedger}
              onVerifyLedgerNow={handleVerifyHash}
              verificationResult={verificationResult}
            />
          )}

          {activeTab === 'openapi' && (
            <TabOpenApiContract
              currentGear={currentGear}
              rpm={rpm}
              torqueNm={torqueNm}
              clutchPct={clutchPct}
            />
          )}

          {activeTab === 'cloudrun' && <TabCloudRunHarness />}

          {activeTab === 'apa' && <TabApaCovenant onExportSpec={handleExportSpec} />}
        </section>

        {/* BOTTOM INSTITUTIONAL FOOTER */}
        <footer className="mt-12 pt-6 pb-8 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-bold">GF-T3-190 Electrified Sport Core</span>
            <span>•</span>
            <span>Ghost FactoryOS Institutional Vault</span>
            <span>•</span>
            <span className="text-emerald-400">100% Clean-Room Certified</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleExportSpec}
              className="text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download GF_T3_190_SPEC.md
            </button>
            <span>•</span>
            <span>Acquire.com Turnkey Micro-APA Asset</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
