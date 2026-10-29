/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Cpu } from 'lucide-react';

function App() {
  const [telemetry, setTelemetry] = useState({
    sequenceCursor: 1058000,
    latencyNs: 420,
    throughput: 14800000,
    utilization: 12.5,
  });
  const [corridor, setCorridor] = useState("CORRIDOR-ALPHA (HIGH-VELOCITY)");
  const [activeTab, setActiveTab] = useState("Mesh");
  const [autoSpin, setAutoSpin] = useState(false);

  const handleBurst = () => {
    setTelemetry(prev => ({
      ...prev,
      sequenceCursor: (prev.sequenceCursor || 1058000) + 10000,
      throughput: 15200000,
      utilization: Math.min(100, prev.utilization + 2.1),
    }));
  };

  const handleReset = () => {
    setTelemetry({
      sequenceCursor: 0,
      latencyNs: 420,
      throughput: 14800000,
      utilization: 0,
    });
  };

  const handleStep = () => {
    setTelemetry(prev => ({
      ...prev,
      sequenceCursor: (prev.sequenceCursor || 1058000) + 64,
    }));
  };

  useEffect(() => {
    if (!autoSpin) return;
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        sequenceCursor: (prev.sequenceCursor || 1058000) + 64,
        latencyNs: 400 + Math.floor(Math.random() * 50),
      }));
    }, 100);
    return () => clearInterval(interval);
  }, [autoSpin]);

  const sequence = telemetry.sequenceCursor || 1058000;
  const currentSlot = sequence & 65535;
  const hexOffset = "0x" + currentSlot.toString(16).toUpperCase().padStart(4, "0");

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Barriers':
        return (
          <div className="p-4 text-sm font-mono text-emerald-400">
            STAGE 1 (PUB) &gt; STAGE 2 (JRNL) &gt; STAGE 3 (REP) &gt; STAGE 4 (LOGIC)
          </div>
        );
      case 'Padding':
        return (
          <div className="p-4 text-sm font-mono text-neutral-300">
            P1 P2 P3 P4 [SEQ-CURSOR: 64-BYTE CACHE LINE PADDED] P5 P6 P7
          </div>
        );
      case 'Contention':
        return (
          <div className="p-4 text-sm font-mono text-cyan-400">
            CAS RETRY MATRIX: [CORE-0: 0 RETRIES] [CORE-1: 1 RETRY] [CORE-2: 0 RETRIES]
          </div>
        );
      case 'Transfer':
        return (
          <div className="p-4 text-sm text-neutral-300 font-mono">
            NIST SP 800-218 SSDF v1.1 CLEAN-ROOM APA BUYOUT TERMS · ZERO ROYALTIES
          </div>
        );
      default:
        return (
          <div className="p-4 text-sm font-mono text-cyan-400">
            RING-BUFFER TOPOLOGY: POWER-OF-TWO 65,536 SLOTS · BITWISE INDEX MASK 0xFFFF
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 font-sans">
      <header className="flex items-center justify-between gap-1.5 w-full mb-6">
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <Cpu className="w-5 h-5 text-cyan-500" />
          <h1 className="text-lg font-bold tracking-tight">GF-T3-216</h1>
          <span className="px-2 py-0.5 text-sm font-semibold rounded bg-cyan-900 text-cyan-100 shrink-0">TRACK 3</span>
        </div>
        <div className="flex items-center gap-1 shrink truncate max-w-[130px]">
          <select 
            className="w-full text-[10px] py-0.5 truncate bg-neutral-900 border border-neutral-800 rounded px-1.5 text-neutral-300"
            value={corridor}
            onChange={(e) => setCorridor(e.target.value)}
          >
            <option>CORRIDOR-ALPHA (HIGH-VELOCITY)</option>
            <option>CORRIDOR-BRAVO (ORDER-SEQUENCER)</option>
            <option>CORRIDOR-GAMMA (REPLICATION-BUS)</option>
          </select>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 my-3 w-full">
        {[
          { label: 'Sequence Cursor (#)', value: sequence.toLocaleString() },
          { label: 'Transit Latency (ns)', value: telemetry.latencyNs.toString() },
          { label: 'Peak Throughput (events/sec)', value: (telemetry.throughput / 1000000).toFixed(1) + "M" },
          { label: 'Buffer Utilization (%)', value: telemetry.utilization.toFixed(2) },
        ].map((card, i) => (
          <div key={i} className="bg-neutral-900 p-3 rounded-lg border border-neutral-800">
            <div className="text-sm text-neutral-400 font-medium truncate">{card.label}</div>
            <div className="text-lg lg:text-xl font-mono font-bold tracking-tight text-neutral-100 truncate">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="w-full overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center justify-between gap-1 p-1 bg-neutral-900/90 border border-neutral-800 rounded-xl my-2 text-sm font-medium w-full">
          {['Mesh', 'Barriers', 'Padding', 'Contention', 'Transfer'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={"px-3 py-1.5 text-sm whitespace-nowrap shrink-0 rounded-lg transition-colors flex items-center gap-1 " + (activeTab === tab ? "bg-neutral-800 text-white" : "text-neutral-300 hover:text-white hover:bg-neutral-800")}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      <div className="min-h-[70px] border border-neutral-800 rounded-xl bg-neutral-900/50 mb-4 flex items-center">
        {renderTabContent()}
      </div>

      <div className="bg-neutral-900 p-8 rounded-lg border border-neutral-800 flex flex-col items-center gap-4">
        <svg viewBox="0 0 300 300" className="w-64 h-64">
          <circle cx="150" cy="150" r="110" fill="none" stroke="#333" strokeWidth="10" />
          <circle cx="150" cy="150" r="110" fill="none" stroke="#06b6d4" strokeWidth="10" strokeDasharray="50 10" />
          {[0, 90, 180, 270].map(deg => (
            <line key={deg} x1="150" y1="30" x2="150" y2="50" stroke="#555" strokeWidth="2" transform={"rotate(" + deg + " 150 150)"} />
          ))}
          <circle cx="260" cy="150" r="8" fill="#06b6d4" transform={"rotate(" + (((sequence & 65535) / 65536) * 360) + " 150 150)"} />
          <text x="150" y="135" textAnchor="middle" fill="#00F0FF" fontSize="18" fontFamily="monospace" fontWeight="bold">SLOT #{((sequence || 0) & 65535)}</text>
          <text x="150" y="155" textAnchor="middle" fill="#10B981" fontSize="11" fontFamily="monospace">0x{(((sequence || 0) & 65535)).toString(16).toUpperCase().padStart(4, "0")} · COMMITTED</text>
          <text x="150" y="172" textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="monospace">i = seq &amp; 65535</text>
        </svg>

        <div className="flex items-center justify-between p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl mt-3 w-full">
          <div className="text-sm font-mono text-neutral-300">
            {"Memory Offset: " + currentSlot + " (" + hexOffset + ") · Cache Line " + Math.floor(currentSlot / 8)}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBurst}
              className="px-2.5 py-1 text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded transition-colors"
            >
              [Burst 10k]
            </button>
            <button
              onClick={handleStep}
              className="px-2.5 py-1 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 rounded transition-colors"
            >
              [Step +64]
            </button>
            <button
              onClick={() => setAutoSpin(!autoSpin)}
              className="px-2.5 py-1 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-neutral-700 rounded transition-colors"
            >
              {autoSpin ? '[Auto Spin ON]' : '[Auto Spin OFF]'}
            </button>
            <button
              onClick={handleReset}
              className="px-2 py-1 text-xs bg-neutral-800 text-neutral-300 rounded hover:bg-neutral-700 transition-colors"
            >
              [Reset]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
