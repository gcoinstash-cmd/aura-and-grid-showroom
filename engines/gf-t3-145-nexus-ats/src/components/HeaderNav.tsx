/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ghost FactoryOS GF-T3-145 (Nexus-ATS)
 * Institutional Header & Navigation Bar
 */

import React from 'react';
import { 
  Download, 
  Cpu, 
  ShieldCheck, 
  FileText, 
  Database, 
  Code2, 
  FileCode, 
  Activity, 
  Play, 
  Pause, 
  Flame,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { exportMasterBundleZip } from '../utils/exportBundle';

export type ActiveTabType = 'FLOOR_HUD' | 'TOXICITY' | 'LATENCY' | 'TOPOLOGY' | 'ALLOYDB_SQL' | 'OPENAPI_JSON' | 'LEGAL_IP' | 'DELAWARE_APA' | 'ENGINE_SPEC';

interface HeaderNavProps {
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
  simTps: number;
  setSimTps: (tps: number) => void;
  onManualTick: () => void;
  p99LatencyUs: number;
  isToxicAlert: boolean;
  spoofingAlert: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  isSimulating,
  setIsSimulating,
  simTps,
  setSimTps,
  onManualTick,
  p99LatencyUs,
  isToxicAlert,
  spoofingAlert
}) => {
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportedSuccess, setExportedSuccess] = React.useState(false);

  const handleExportZip = async () => {
    try {
      setIsExporting(true);
      await exportMasterBundleZip();
      setExportedSuccess(true);
      setTimeout(() => setExportedSuccess(false), 4000);
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const navItems: Array<{ id: ActiveTabType; label: string; icon: React.ReactNode }> = [
    { id: 'FLOOR_HUD', label: 'Trading Floor HUD', icon: <Activity className="w-5 h-5 text-emerald-400" /> },
    { id: 'LATENCY', label: 'P99 Latency Engine', icon: <Zap className="w-5 h-5 text-cyan-400" /> },
    { id: 'TOXICITY', label: 'VPIN & Hawkes Filter', icon: <Flame className="w-5 h-5 text-amber-400" /> },
    { id: 'TOPOLOGY', label: 'LMAX Topology', icon: <Cpu className="w-5 h-5 text-indigo-400" /> },
    { id: 'ALLOYDB_SQL', label: 'AlloyDB DDL', icon: <Database className="w-5 h-5 text-blue-400" /> },
    { id: 'OPENAPI_JSON', label: 'OpenAPI 3.1 Spec', icon: <Code2 className="w-5 h-5 text-purple-400" /> },
    { id: 'LEGAL_IP', label: 'Clean-Room IP', icon: <ShieldCheck className="w-5 h-5 text-teal-400" /> },
    { id: 'DELAWARE_APA', label: '$150K Delaware APA', icon: <FileText className="w-5 h-5 text-emerald-400" /> },
    { id: 'ENGINE_SPEC', label: 'ENGINE_SPEC.md', icon: <FileCode className="w-5 h-5 text-rose-400" /> }
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 sticky top-0 z-50 backdrop-blur-md shadow-2xl">
      {/* Top Telemetry & Brand Bar */}
      <div className="max-w-[1920px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-emerald-950/70 border border-emerald-500/50 shadow-lg shadow-emerald-950">
            <Cpu className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs tracking-widest font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                Fleet Track 3 • F1 Skunkworks
              </span>
              <span className="text-xs tracking-widest font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Asset GF-T3-145
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2 mt-0.5">
              NEXUS-ATS <span className="text-slate-400 text-base font-normal">| Hybrid CLOB & Sub-Millisecond Dark Pool</span>
            </h1>
          </div>
        </div>

        {/* Center: Live Latency & Safety Alarms */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2">
          {/* Engine Status Radar */}
          <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <span className="text-base font-bold text-slate-200">Matching Core:</span>
            <span className="text-base font-bold text-emerald-400">ACTIVE</span>
          </div>

          <div className="h-6 w-px bg-slate-800"></div>

          {/* P99 Telemetry */}
          <div className="flex items-center gap-1.5">
            <span className="text-base text-slate-400 font-medium">P99 Latency:</span>
            <span className={`text-lg font-bold font-mono-numbers ${p99LatencyUs < 850 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {p99LatencyUs} µs
            </span>
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              SLA &lt;850µs
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800"></div>

          {/* Toxicity & Spoofing Alarms */}
          <div className="flex items-center gap-2">
            {isToxicAlert ? (
              <span className="text-xs font-extrabold px-2 py-1 rounded bg-rose-950 text-rose-300 border border-rose-600 animate-pulse flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> VPIN TOXIC
              </span>
            ) : (
              <span className="text-xs font-bold px-2 py-1 rounded bg-slate-950 text-emerald-400 border border-emerald-900/50 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> VPIN NOMINAL
              </span>
            )}

            {spoofingAlert ? (
              <span className="text-xs font-extrabold px-2 py-1 rounded bg-amber-950 text-amber-300 border border-amber-600 animate-pulse">
                HAWKES SPOOF ALERT
              </span>
            ) : null}
          </div>
        </div>

        {/* Right: Simulation Controls & [EXPORT 10/10 BUNDLE] */}
        <div className="flex items-center gap-3">
          {/* Simulation Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-base font-semibold transition-all ${
                isSimulating 
                  ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-950' 
                  : 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-950'
              }`}
            >
              {isSimulating ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              {isSimulating ? 'Pause Flow' : 'Simulate Flow'}
            </button>

            {isSimulating && (
              <div className="flex items-center gap-1 ml-2 pr-2">
                <span className="text-xs font-semibold text-slate-400">TPS:</span>
                {[10, 50, 100].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setSimTps(speed)}
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      simTps === speed 
                        ? 'bg-emerald-500 text-black font-extrabold' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {speed}
                  </button>
                ))}
              </div>
            )}

            {!isSimulating && (
              <button
                onClick={onManualTick}
                className="ml-2 px-2.5 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-all"
              >
                + Inject 1 Tick
              </button>
            )}
          </div>

          {/* Master 10/10 Bundle Download Button */}
          <button
            onClick={handleExportZip}
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-base font-extrabold tracking-wide uppercase shadow-xl transition-all ${
              exportedSuccess
                ? 'bg-emerald-500 text-black shadow-emerald-500/40 scale-105'
                : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 shadow-emerald-900/50 hover:scale-102 cursor-pointer'
            }`}
          >
            {exportedSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-black" />
                <span>BUNDLE DOWNLOADED!</span>
              </>
            ) : (
              <>
                <Download className={`w-5 h-5 ${isExporting ? 'animate-bounce' : ''}`} />
                <span>{isExporting ? 'PACKAGING...' : 'EXPORT 10/10 BUNDLE (.ZIP)'}</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Navigation Sub-Menu */}
      <div className="max-w-[1920px] mx-auto px-4 flex items-center overflow-x-auto border-t border-slate-800/80 scrollbar-none">
        <div className="flex gap-1 py-1.5">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-base font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 shadow-md shadow-emerald-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
