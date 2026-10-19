/**
 * CHRONOSRISK ENGINE // GF-T3-152
 * Cockpit Header & High-Frequency Telemetry Bar
 */

import React from 'react';
import { Shield, Zap, Activity, Lock, Unlock, FileText, Server, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  latencyMicros: number;
  cornishFisherActive: boolean;
  isBiometricAuthenticated: boolean;
  setIsBiometricAuthenticated: (val: boolean) => void;
  onOpenAuditLog: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  latencyMicros,
  cornishFisherActive,
  isBiometricAuthenticated,
  setIsBiometricAuthenticated,
  onOpenAuditLog,
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#090e17]/95 backdrop-blur-md sticky top-0 z-50">
      {/* Top Telemetry Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-400 font-semibold tracking-wider">CORE ACTIVE</span>
            <span className="text-slate-600">·</span>
            <span>NODE: us-east1-c</span>
            <span className="text-slate-600">·</span>
            <span>GKE DISTROLEST OK</span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2.5 py-0.5 rounded text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>LATENCY: {latencyMicros.toFixed(1)} µs</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-0.5 rounded text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% CLEAN-ROOM IP</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/80 border border-slate-700 px-2.5 py-0.5 rounded text-xs font-semibold">
            <span className="text-amber-400 font-bold">20 kHz (0.48ms)</span>
            <span className="text-slate-400">APA ASSET TRANSFER</span>
          </div>

          <button
            onClick={() => setIsBiometricAuthenticated(!isBiometricAuthenticated)}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
              isBiometricAuthenticated
                ? 'bg-emerald-600/30 border border-emerald-500/60 text-emerald-300 hover:bg-emerald-600/40'
                : 'bg-rose-950/40 border border-rose-800/60 text-rose-300 hover:bg-rose-900/50'
            }`}
            title="Toggle Chief Risk Officer Biometric Authorization"
          >
            {isBiometricAuthenticated ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-rose-400" />}
            <span>{isBiometricAuthenticated ? 'OFFICER MFA: VERIFIED' : 'AUTH RESTRICTED'}</span>
          </button>
        </div>
      </div>

      {/* Main Cockpit Brand & Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/40">
            <Activity className="w-7 h-7 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
                CHRONOS<span className="text-amber-400">RISK</span>
              </h1>
              <span className="text-xs font-mono font-bold tracking-widest text-slate-400 border border-slate-700 bg-slate-800/60 px-2 py-0.5 rounded">
                GF-T3-152
              </span>
            </div>
            <p className="text-sm sm:text-base text-slate-400 font-medium">
              Real-Time Portfolio VaR, Expected Shortfall & Historical Shock Simulation Core
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto">
          {[
            { id: 'radar', label: 'Live Risk Radar' },
            { id: 'covariance', label: 'Covariance & Matrix' },
            { id: 'engine_spec', label: 'ENGINE_SPEC.md' },
            { id: 'monopoly_vault', label: 'Monopoly Vault & APA' },
            { id: 'code_core', label: 'Python Core & Infra' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-sm sm:text-base font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={onOpenAuditLog}
            className="ml-1 p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
            title="Open Immutable Audit Log"
          >
            <FileText className="w-5 h-5" />
          </button>
        </nav>
      </div>
    </header>
  );
};
