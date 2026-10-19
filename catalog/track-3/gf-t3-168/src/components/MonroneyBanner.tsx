import React from 'react';
import { Download, ShieldCheck, Activity, CheckCircle, RefreshCw } from 'lucide-react';
import { GF_T3_168_SPEC_MARKDOWN } from '../data/specDocument';

interface MonroneyBannerProps {
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onVerifyChain: () => void;
  isVerifying: boolean;
  verificationStatus: {
    verified: boolean;
    blockCount: number;
    lastVerifiedAt: string | null;
  };
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  isStreaming,
  onToggleStreaming,
  onVerifyChain,
  isVerifying,
  verificationStatus,
}) => {
  const handleExportSpec = () => {
    const blob = new Blob([GF_T3_168_SPEC_MARKDOWN], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'GF_T3_168_SPEC.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="relative w-full border-b border-slate-800 bg-slate-900/90 text-slate-100 px-6 py-6 sm:px-8 sm:py-7">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Monroney Identity Cluster */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm tracking-wider uppercase text-slate-300 font-mono font-semibold">
            <span className="font-bold text-cyan-400">Asset ID: GF-T3-168</span>
            <span aria-hidden="true" className="text-slate-600">/</span>
            <span>Platform: Modular Cyber-Physical Chassis Multi-Link DRS</span>
            <span aria-hidden="true" className="text-slate-600">/</span>
            <span>Version: v1.0.0-PROD</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Heavy Overland Dynamics Platform Dual-Vector Performance Core High-G Dynamic Telemetry Dynamic Performance Core
          </h1>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-base text-slate-200">
            <div>
              <span className="text-slate-400">Runtime Execution:</span> <strong className="text-emerald-400 font-mono text-lg font-bold">20 kHz Sub-ms</strong>
            </div>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <div>
              <span className="text-slate-400">Architecture Moat:</span> <strong className="text-cyan-300 font-mono text-lg font-bold">PostgreSQL 16 + RLS</strong>
            </div>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <div>
              <span className="text-slate-400">Licensing:</span>{' '}
              <span className="text-slate-100 font-semibold">100% Permissive MIT (Clean-Room Certified)</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={onToggleStreaming}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm ${
              isStreaming
                ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Activity className={`w-4 h-4 ${isStreaming ? 'animate-spin' : ''}`} />
            <span>{isStreaming ? 'Stream Active (1,000 Hz)' : 'Inject Telemetry Stream'}</span>
          </button>

          <button
            onClick={onVerifyChain}
            disabled={isVerifying}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isVerifying ? (
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            ) : verificationStatus.verified ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            )}
            <span>Verify Hash Chain</span>
          </button>

          <button
            onClick={handleExportSpec}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-white text-slate-950 hover:bg-slate-100 transition-colors shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Export GF_T3_168_SPEC.md</span>
          </button>
        </div>
      </div>
    </section>
  );
};
