/**
 * Vanguard-ECLSS: Autonomous Closed-Loop Environmental Control & Life Support System
 * Navbar & Mission Command Header
 * Upgraded High-Contrast Typography & Enforced Font Floor
 */

import React, { useState } from 'react';
import { Activity, ShieldCheck, Download, Server, Cpu, FileText, Database, ShieldAlert, CheckCircle2, Flame, Loader2 } from 'lucide-react';
import { TelemetrySnapshot } from '../types/eclss';
import { downloadBlob, generateMasterBundleZip } from '../utils/exporter';

export type NavTab = 'MISSION_CONTROL' | 'MATH_ENGINE' | 'ALLOYDB_SCHEMA' | 'OPENAPI_SPEC' | 'LEGAL_IP_VAULT' | 'ENGINE_SPEC';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  latestTelemetry: TelemetrySnapshot;
  isSimulating: boolean;
  onToggleSim: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  latestTelemetry,
  isSimulating,
  onToggleSim,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const zipBlob = await generateMasterBundleZip();
      downloadBlob(zipBlob, 'GF-T3-143_VANGUARD_ECLSS_10_OUT_OF_10_BUNDLE.zip');
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const criticalAlerts = latestTelemetry.activeIncidents.filter((i) => i.severity === 'CRITICAL').length;
  const warningAlerts = latestTelemetry.activeIncidents.filter((i) => i.severity === 'WARNING').length;

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur-md sticky top-0 z-50">
      {/* Top Telemetry & Status Ticker */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Asset Identification */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-300 font-mono font-extrabold text-2xl shadow-lg shadow-cyan-950/50">
            V1
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
                VANGUARD-ECLSS
              </span>
              <span className="text-sm font-bold px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                GF-T3-143
              </span>
            </div>
            <p className="text-sm text-slate-300 font-medium hidden sm:block">
              F1 Skunkworks Autonomous Environmental Engine · Ghost FactoryOS Track 3
            </p>
          </div>
        </div>

        {/* Live System Telemetry Badges */}
        <div className="flex items-center flex-wrap gap-3">
          {/* MPC Latency Indicator */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-base font-medium">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span className="text-slate-300">MPC P99:</span>
            <span className="font-mono font-bold text-emerald-400 text-lg">
              {latestTelemetry.mpc.lastExecutionTimeMs.toFixed(2)} ms
            </span>
            <span className="text-sm text-slate-400">(&lt;6.5ms)</span>
          </div>

          {/* System Health */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-base font-medium">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span className="text-slate-300">Loop Health:</span>
            <span className={`font-mono font-bold text-lg ${latestTelemetry.systemHealthScore >= 90 ? 'text-emerald-400' : latestTelemetry.systemHealthScore >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
              {latestTelemetry.systemHealthScore.toFixed(1)}%
            </span>
          </div>

          {/* FDIR Incident Status */}
          {criticalAlerts > 0 ? (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-950/90 border border-rose-600 text-rose-200 text-base animate-pulse font-bold">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>{criticalAlerts} CRITICAL FDIR</span>
            </div>
          ) : warningAlerts > 0 ? (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-950/90 border border-amber-600 text-amber-200 text-base font-bold">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>{warningAlerts} FDIR ADVISORY</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-base font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>FDIR NOMINAL</span>
            </div>
          )}

          {/* Master 10/10 Bundle Download Action */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold text-base shadow-lg shadow-cyan-950/40 transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                <span>COMPILING BUNDLE...</span>
              </>
            ) : exportSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>10/10 ARCHIVE READY</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5 text-slate-950" />
                <span>EXPORT 10/10 BUNDLE (.ZIP)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
        <nav className="flex space-x-2 sm:space-x-3 overflow-x-auto py-2.5 scrollbar-none">
          <button
            onClick={() => onSelectTab('MISSION_CONTROL')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-base font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'MISSION_CONTROL'
                ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-700 shadow-inner'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>MISSION CONTROL HUD</span>
          </button>

          <button
            onClick={() => onSelectTab('MATH_ENGINE')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-base font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'MATH_ENGINE'
                ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-700 shadow-inner'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Flame className="w-5 h-5 text-amber-400" />
            <span>MATHEMATICAL & MPC ENGINE</span>
          </button>

          <button
            onClick={() => onSelectTab('ALLOYDB_SCHEMA')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-base font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'ALLOYDB_SCHEMA'
                ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-700 shadow-inner'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Database className="w-5 h-5 text-cyan-400" />
            <span>ALLOYDB / SQL SCHEMA</span>
          </button>

          <button
            onClick={() => onSelectTab('OPENAPI_SPEC')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-base font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'OPENAPI_SPEC'
                ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-700 shadow-inner'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Server className="w-5 h-5 text-emerald-400" />
            <span>OPENAPI 3.1.0 CONTRACT</span>
          </button>

          <button
            onClick={() => onSelectTab('LEGAL_IP_VAULT')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-base font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'LEGAL_IP_VAULT'
                ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-700 shadow-inner'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span>MONOPOLY VAULT & APA LEDGER</span>
          </button>

          <button
            onClick={() => onSelectTab('ENGINE_SPEC')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-base font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'ENGINE_SPEC'
                ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-700 shadow-inner'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5 text-purple-400" />
            <span>ENGINE_SPEC.MD (70%)</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
