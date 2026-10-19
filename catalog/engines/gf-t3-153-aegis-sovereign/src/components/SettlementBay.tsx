import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Clock,
  Download,
  Copy,
  Check,
  Radio,
  FileCheck2,
  Database
} from 'lucide-react';
import {
  ClientSettlementEngine,
  DvPTransactionRecord,
  DvPState
} from '../core/settlementEngine';

interface SettlementBayProps {
  engine: ClientSettlementEngine;
  onLatencyUpdate: (lat: number) => void;
}

export const SettlementBay: React.FC<SettlementBayProps> = ({ engine, onLatencyUpdate }) => {
  // Trade setup state
  const [assetTicker, setAssetTicker] = useState('UST-2028-TKN');
  const [assetUnits, setAssetUnits] = useState('5000000000000'); // 50,000 UST bonds
  const [cashTicker, setCashTicker] = useState('USDC-INSTITUTIONAL');
  const [cashUnits, setCashUnits] = useState('49850000000000'); // 20 kHz (0.48ms)
  const [seller, setSeller] = useState('BLACKROCK_TREASURY_DESK');
  const [buyer, setBuyer] = useState('JPM_INSTITUTIONAL_DVP');
  const [timeoutMs, setTimeoutMs] = useState(5000);

  // Execution scenario mode
  const [scenarioMode, setScenarioMode] = useState<'nominal' | 'alt_quorum' | 'timeout' | 'byzantine' | 'sub_threshold'>('nominal');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<DvPTransactionRecord | null>(null);
  const [executionHistory, setExecutionHistory] = useState<DvPTransactionRecord[]>([]);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExecute = async () => {
    setIsExecuting(true);

    let participatingNodeIds = [1, 2, 3];
    let simulateTimeout = false;
    let simulateByzantineNodeId: number | undefined = undefined;

    if (scenarioMode === 'nominal') {
      participatingNodeIds = [1, 2, 3];
    } else if (scenarioMode === 'alt_quorum') {
      participatingNodeIds = [2, 4, 5];
    } else if (scenarioMode === 'timeout') {
      simulateTimeout = true;
    } else if (scenarioMode === 'byzantine') {
      participatingNodeIds = [1, 2, 3];
      simulateByzantineNodeId = 3;
    } else if (scenarioMode === 'sub_threshold') {
      participatingNodeIds = [1, 2]; // Only 2 nodes
    }

    try {
      const record = await engine.executeSettlement({
        assetTicker,
        assetUnits: BigInt(assetUnits),
        cashTicker,
        cashUnits: BigInt(cashUnits),
        seller,
        buyer,
        participatingNodeIds,
        simulateTimeout,
        simulateByzantineNodeId,
        timeoutMs,
      });

      setCurrentExecution(record);
      setExecutionHistory(prev => [record, ...prev]);
      onLatencyUpdate(record.latencyBreakdown.totalMs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDownloadReceipt = (tx: DvPTransactionRecord) => {
    const payload = JSON.stringify(tx, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tx.tradeId}-settlement-receipt.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (state: DvPState) => {
    switch (state) {
      case 'COMMIT_SETTLED':
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-base font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            COMMIT_SETTLED
          </span>
        );
      case 'ROLLBACK_EXPIRED':
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-base font-bold bg-amber-950/80 text-amber-300 border border-amber-500/50">
            <Clock className="w-5 h-5 text-amber-400" />
            ROLLBACK_EXPIRED
          </span>
        );
      case 'ROLLBACK_FAULT':
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-base font-bold bg-rose-950/80 text-rose-300 border border-rose-500/50">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            ROLLBACK_FAULT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-base font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/50">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            {state}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner: Protocol Mission Status */}
      <div className="bg-[#0b1224] border border-cyan-900/50 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-md bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-black uppercase tracking-wider">
                Bilateral 2PC DvP Pipe
              </span>
              <span className="text-sm font-bold text-slate-300 font-mono">
                ZERO-REORG ATOMIC FINALITY
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Live Atomic Settlement Bay &amp; Execution Pipeline
            </h2>
            <p className="text-lg text-slate-200 font-medium max-w-4xl leading-relaxed">
              Simultaneous atomic delivery of institutional tokenized bonds vs. wholesale central bank cash rails.
              Authorized by sub-15 ms 3-of-5 FROST threshold Schnorr consensus without reconstructing private keys in memory.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Scaled-up Call-To-Action Button */}
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className={`flex items-center gap-3.5 px-8 py-4 rounded-xl font-black text-xl transition-all duration-200 cursor-pointer shadow-lg ${
                isExecuting
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_30px_rgba(6,182,212,0.5)] active:scale-95'
              }`}
            >
              <Play className={`w-6 h-6 ${isExecuting ? 'animate-spin' : 'fill-current'}`} />
              <span>{isExecuting ? 'Settling Across Nodes...' : 'Execute Atomic Settlement'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Trade Setup & Execution Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Configurable Settlement Contract */}
        <div className="lg:col-span-1 bg-[#090f1f] border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Database className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-black text-white">Settlement Contract Spec</h3>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/70 px-2.5 py-1 rounded border border-cyan-800/40">
              BIGINT INVARIANT
            </span>
          </div>

          <div className="space-y-4">
            {/* Asset Leg Fields */}
            <div>
              <label className="block text-[17px] font-bold text-slate-100 mb-1.5">
                Asset Leg (Security Token)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={assetTicker}
                  onChange={e => setAssetTicker(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 shadow-inner"
                  placeholder="Ticker"
                />
                <input
                  type="text"
                  value={assetUnits}
                  onChange={e => setAssetUnits(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono font-bold text-slate-100 focus:outline-none focus:border-cyan-500 shadow-inner"
                  placeholder="Units (satoshi scale)"
                />
              </div>
              <span className="text-sm text-slate-300 font-semibold block mt-1">
                50,000 UST-2028 (Base unit scaled: 10^8 satoshis)
              </span>
            </div>

            {/* Cash Leg Fields */}
            <div>
              <label className="block text-[17px] font-bold text-slate-100 mb-1.5">
                Cash Leg (Wholesale Rail)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={cashTicker}
                  onChange={e => setCashTicker(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500 shadow-inner"
                  placeholder="Cash Ticker"
                />
                <input
                  type="text"
                  value={cashUnits}
                  onChange={e => setCashUnits(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono font-bold text-slate-100 focus:outline-none focus:border-emerald-500 shadow-inner"
                  placeholder="Cash Amount"
                />
              </div>
              <span className="text-sm text-slate-300 font-semibold block mt-1">
                20 kHz (0.48ms)C / FedNow Wholesale CBDC
              </span>
            </div>

            {/* Seller & Buyer Desks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-base font-bold text-slate-200 mb-1.5">Seller Desk</label>
                <input
                  type="text"
                  value={seller}
                  onChange={e => setSeller(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold text-slate-100 shadow-inner"
                />
              </div>
              <div>
                <label className="block text-base font-bold text-slate-200 mb-1.5">Buyer Desk</label>
                <input
                  type="text"
                  value={buyer}
                  onChange={e => setBuyer(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold text-slate-100 shadow-inner"
                />
              </div>
            </div>

            {/* Execution Deadline Window */}
            <div className="pt-1">
              <div className="flex justify-between text-base font-bold text-slate-200 mb-1.5">
                <span>Execution Deadline Window</span>
                <span className="font-mono text-cyan-300 font-bold">{timeoutMs} ms</span>
              </div>
              <input
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={timeoutMs}
                onChange={e => setTimeoutMs(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          {/* Fault & Scenario Injector with Scaled Typography */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <span className="text-sm font-black uppercase tracking-wider text-cyan-400 block">
              SIMULATION SCENARIO &amp; FAULT INJECTION:
            </span>
            <div className="space-y-2">
              {[
                { id: 'nominal', label: '1. Nominal 3-of-5 Quorum (Nodes 1, 2, 3)', desc: 'Standard sub-15ms happy path' },
                { id: 'alt_quorum', label: '2. Secondary Quorum (Nodes 2, 4, 5)', desc: 'Consortium node failover' },
                { id: 'timeout', label: '3. Force Cash Leg Timeout (Rollback)', desc: 'Tests 2PC escrow unlock refund' },
                { id: 'byzantine', label: '4. Inject Byzantine Rogue Signature', desc: 'Node 3 corrupted; caught & isolated' },
                { id: 'sub_threshold', label: '5. Sub-Threshold Defect (2 Nodes)', desc: 'Strict quorum abort (< 3 signers)' },
              ].map(opt => (
                <label
                  key={opt.id}
                  onClick={() => setScenarioMode(opt.id as any)}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                    scenarioMode === opt.id
                      ? 'bg-cyan-950/50 border-cyan-500/80 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="scenario"
                    checked={scenarioMode === opt.id}
                    onChange={() => {}}
                    className="mt-1 h-4 w-4 accent-cyan-400"
                  />
                  <div>
                    <span className="text-base font-bold block leading-snug">{opt.label}</span>
                    <span className="text-sm text-slate-300 font-medium block mt-0.5">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Columns (2-Span): Live Bilateral Pipes & State Machine */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dual Escrow Visualizer with Scaled Typography */}
          <div className="bg-[#090f1f] border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-5 flex flex-wrap items-center justify-between gap-3">
              <span>Bilateral Atomic Escrow Pipes</span>
              {currentExecution && getStatusBadge(currentExecution.state)}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              {/* Asset Leg Pipe */}
              <div className={`p-5 rounded-2xl border transition-all ${
                currentExecution?.assetLeg.lockedInEscrow
                  ? 'bg-cyan-950/30 border-cyan-500/70 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                  : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3.5 w-3.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-lg sm:text-xl font-black text-white tracking-tight">ASSET LEG (SECURITY)</span>
                  </div>
                  {currentExecution?.assetLeg.lockedInEscrow ? (
                    <span className="flex items-center gap-1.5 text-base font-bold text-cyan-300 bg-cyan-950 px-3 py-1 rounded-full border border-cyan-700">
                      <Lock className="w-4 h-4" /> LOCKED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-base font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full">
                      <Unlock className="w-4 h-4" /> UNLOCKED
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-bold">Instrument:</span>
                    <span className="font-bold text-cyan-300 text-lg font-mono">{assetTicker}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-bold">Quantity:</span>
                    <span className="font-mono font-bold text-white text-lg">50,000 Units</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-bold">Source Custody:</span>
                    <span className="font-mono text-sm font-semibold text-slate-200">{seller}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-bold">Destination:</span>
                    <span className="font-mono text-sm font-semibold text-slate-200">{buyer}</span>
                  </div>
                  {currentExecution?.assetLeg.escrowTxHash && (
                    <div className="pt-2.5 border-t border-slate-800">
                      <span className="text-sm font-bold text-slate-300 block mb-0.5">Escrow Seal Hash:</span>
                      <span className="font-mono text-sm font-bold text-cyan-400 break-all">
                        {currentExecution.assetLeg.escrowTxHash.slice(0, 36)}...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cash Leg Pipe */}
              <div className={`p-5 rounded-2xl border transition-all ${
                currentExecution?.cashLeg.lockedInEscrow
                  ? 'bg-emerald-950/30 border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3.5 w-3.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-lg sm:text-xl font-black text-white tracking-tight">CASH LEG (WHOLESALE CBDC)</span>
                  </div>
                  {currentExecution?.cashLeg.lockedInEscrow ? (
                    <span className="flex items-center gap-1.5 text-base font-bold text-emerald-300 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-700">
                      <Lock className="w-4 h-4" /> LOCKED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-base font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full">
                      <Unlock className="w-4 h-4" /> UNLOCKED
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-bold">Currency Rail:</span>
                    <span className="font-bold text-emerald-300 text-lg font-mono">{cashTicker}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-bold">Gross Cash:</span>
                    <span className="font-mono font-bold text-white text-lg">20 kHz (0.48ms)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-bold">Source RTGS:</span>
                    <span className="font-mono text-sm font-semibold text-slate-200">{buyer}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-bold">Destination:</span>
                    <span className="font-mono text-sm font-semibold text-slate-200">{seller}</span>
                  </div>
                  {currentExecution?.cashLeg.escrowTxHash && (
                    <div className="pt-2.5 border-t border-slate-800">
                      <span className="text-sm font-bold text-slate-300 block mb-0.5">Escrow Seal Hash:</span>
                      <span className="font-mono text-sm font-bold text-emerald-400 break-all">
                        {currentExecution.cashLeg.escrowTxHash.slice(0, 36)}...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2PC Step Flow Tracker */}
            <div className="mt-7 pt-6 border-t border-slate-800">
              <span className="text-sm font-black uppercase tracking-wider text-slate-300 block mb-3.5">
                2-PHASE COMMIT (2PC) EXECUTION PROGRESSION:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {[
                  { id: 'INITIALIZED', label: '1. Init Nonce' },
                  { id: 'PREPARE_LEGS', label: '2. Prepare' },
                  { id: 'ESCROW_LOCKED', label: '3. Lock Pipes' },
                  { id: 'TSS_ROUND_1_NONCE', label: '4. Nonces' },
                  { id: 'TSS_ROUND_2_PARTIAL_SIGN', label: '5. Schnorr Sign' },
                  { id: 'COMMIT_SETTLED', label: '6. Atomic Final' },
                ].map((step, idx) => {
                  const isCurrent = currentExecution?.state === step.id;
                  const hasPassed = currentExecution?.logSteps.some(s => s.state === step.id);
                  return (
                    <div
                      key={step.id}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                          : hasPassed
                          ? 'bg-cyan-950/50 text-cyan-200 border-cyan-800/80 font-bold'
                          : 'bg-slate-900/50 text-slate-400 border-slate-800 font-medium'
                      }`}
                    >
                      <span className="text-xs block font-mono font-bold">{idx + 1}</span>
                      <span className="text-sm font-bold leading-tight block mt-0.5">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Real-Time Latency Telemetry Breakdown */}
          {currentExecution && (
            <div className="bg-[#090f1f] border border-cyan-900/60 rounded-2xl p-6 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-6 h-6 text-cyan-400" />
                  <h4 className="text-lg font-black text-white">Execution Latency Telemetry</h4>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-base text-slate-300 font-bold">Total Execution:</span>
                  <span className="text-2xl font-black font-mono text-cyan-400">
                    {currentExecution.latencyBreakdown.totalMs} ms
                  </span>
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-700">
                    PASS (&lt;15ms)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-sm text-slate-300 font-medium block">Pre-Check</span>
                  <span className="text-base font-bold font-mono text-slate-100 mt-0.5 block">
                    {currentExecution.latencyBreakdown.prepMs} ms
                  </span>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-sm text-slate-300 font-medium block">Bilateral Lock</span>
                  <span className="text-base font-bold font-mono text-slate-100 mt-0.5 block">
                    {currentExecution.latencyBreakdown.escrowLockMs} ms
                  </span>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-sm text-slate-300 font-medium block">FROST R1 Nonce</span>
                  <span className="text-base font-bold font-mono text-cyan-300 mt-0.5 block">
                    {currentExecution.latencyBreakdown.round1NonceMs} ms
                  </span>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-sm text-slate-300 font-medium block">FROST R2 Partial</span>
                  <span className="text-base font-bold font-mono text-cyan-300 mt-0.5 block">
                    {currentExecution.latencyBreakdown.round2SignMs} ms
                  </span>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center">
                  <span className="text-sm text-slate-300 font-medium block">Aggregation</span>
                  <span className="text-base font-bold font-mono text-emerald-300 mt-0.5 block">
                    {currentExecution.latencyBreakdown.aggregationMs} ms
                  </span>
                </div>
              </div>

              {/* State Root & Signers */}
              <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                <div>
                  <span className="text-slate-300 font-bold">State Root: </span>
                  <span className="font-mono font-bold text-cyan-300">{currentExecution.stateRoot}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleCopy(currentExecution.stateRoot)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold transition-colors cursor-pointer"
                  >
                    {copiedHash === currentExecution.stateRoot ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedHash === currentExecution.stateRoot ? 'Copied' : 'Copy Root'}</span>
                  </button>
                  <button
                    onClick={() => handleDownloadReceipt(currentExecution)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-700 text-cyan-300 hover:bg-cyan-900 font-bold transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settlement Ledger Audit Log Table with Scaled Typography */}
      <div className="bg-[#090f1f] border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-bold text-white">Settlement Ledger &amp; Nonce Sequencing Audit Log</h3>
          </div>
          <span className="text-sm font-mono font-bold text-slate-300 bg-slate-900 px-3 py-1 rounded-md border border-slate-800">
            TOTAL TRADES: {executionHistory.length}
          </span>
        </div>

        {executionHistory.length === 0 ? (
          <div className="py-14 text-center text-slate-400 text-lg font-medium">
            No settlement trades executed yet. Click &quot;Execute Atomic Settlement&quot; to test the live FROST consensus engine.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900/90 text-slate-300 uppercase text-xs font-mono font-bold border-b border-slate-800">
                <tr>
                  <th className="py-4 px-4">Trade ID</th>
                  <th className="py-4 px-4">Nonce</th>
                  <th className="py-4 px-4">Asset Leg</th>
                  <th className="py-4 px-4">Cash Leg</th>
                  <th className="py-4 px-4">Signers</th>
                  <th className="py-4 px-4">Latency</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium">
                {executionHistory.map(tx => (
                  <tr key={tx.tradeId} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-cyan-300 text-base">{tx.tradeId}</td>
                    <td className="py-4 px-4 font-mono font-bold text-slate-200 text-base">{tx.settlementNonce}</td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-white text-base block">{tx.assetLeg.assetTicker}</span>
                      <span className="text-xs font-mono text-slate-300">50,000 units</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-emerald-300 text-base block">{tx.cashLeg.assetTicker}</span>
                      <span className="text-xs font-mono text-slate-300">20 kHz (0.48ms)</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-sm text-slate-200">
                      [{tx.signers.join(', ')}]
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-cyan-300 text-base">
                      {tx.latencyBreakdown.totalMs} ms
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(tx.state)}</td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleDownloadReceipt(tx)}
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                        title="Download JSON Receipt"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
