import React from 'react';
import { Download, ShieldCheck, Cpu, Zap, Activity, BookOpen, Database, Code, FileText } from 'lucide-react';
import { exportMonopolyBundle } from '../utils/exporter';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  p99LatencyUs: number;
  currentThroughputEvSec: number;
  clockUs: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  p99LatencyUs,
  currentThroughputEvSec,
  clockUs,
}) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportMonopolyBundle();
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  const formattedThroughput = (currentThroughputEvSec / 1_000_000).toFixed(2);
  const clockFormatted = (clockUs / 1_000_000).toFixed(6);

  const tabs = [
    { id: 'hud', label: 'Vision Telemetry HUD', icon: Activity },
    { id: 'math', label: 'Mathematical Engine', icon: Zap },
    { id: 'alloydb', label: 'AlloyDB DDL Schema', icon: Database },
    { id: 'openapi', label: 'OpenAPI 3.1 Console', icon: Code },
    { id: 'legal', label: 'Legal & Diligence Architecture', icon: ShieldCheck },
    { id: 'spec', label: 'Engine Spec (70%)', icon: FileText },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 sticky top-0 z-50 backdrop-blur-md">
      {/* Top Banner with Asset Credentials */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-amber-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg glow-cyan">
              GF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-white font-mono">
                  GF-T3-146
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-base font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  TRACK 3 F1 SKUNKWORKS
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-base font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  $145,000 ASSET TRANSFER
                </span>
              </div>
              <h1 className="text-base font-medium text-slate-400">
                Hyperion-Flux: Neuromorphic Event-Vision & Microsecond Optical Flow Engine
              </h1>
            </div>
          </div>
        </div>

        {/* Live Status Indicators & Action Button */}
        <div className="flex items-center gap-4 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2">
            <div className="text-left">
              <span className="text-sm font-mono text-slate-400 block">CLOCK (µs)</span>
              <span className="text-xl font-bold font-mono text-cyan-400">
                {clockFormatted} s
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800 mx-1" />
            <div className="text-left">
              <span className="text-sm font-mono text-slate-400 block">P99 THRESHOLD</span>
              <span className={`text-xl font-bold font-mono ${p99LatencyUs < 750 ? 'text-emerald-400' : 'text-red-400'}`}>
                {p99LatencyUs.toFixed(1)} µs <span className="text-sm text-slate-400 font-normal">(&lt;750µs)</span>
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800 mx-1" />
            <div className="text-left">
              <span className="text-sm font-mono text-slate-400 block">THROUGHPUT</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {formattedThroughput} M ev/s
              </span>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] glow-amber cursor-pointer text-base"
          >
            <Download className="w-5 h-5" />
            {isExporting ? 'Packaging Archive...' : 'EXPORT 10/10 BUNDLE (.ZIP)'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex gap-2 overflow-x-auto border-t border-slate-800/80 pt-2 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-base font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
