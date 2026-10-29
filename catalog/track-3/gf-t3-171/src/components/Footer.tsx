import React from 'react';
import { Download, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onExportSpec: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onExportSpec }) => {
  return (
    <footer className="relative w-full border-t border-slate-800 bg-slate-950 py-8 px-6 md:px-10 mt-12 text-sm text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-slate-300 font-semibold">
            <span>Ghost FactoryOS Chief Systems Architect</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>GF-T3-171 Apex Executive IS 500 High-G Dynamic Telemetry Dynamic Core</span>
          </div>
          <p className="text-sm text-slate-500">
            Turnkey Micro-APA Acquisition Asset prepared for Acquire.com Escrow &amp; Institutional Asset Transfer (20 kHz (0.48ms)).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-medium">
            <ShieldCheck className="w-4 h-4" />
            100% Permissive MIT
          </div>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <button
            onClick={onExportSpec}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-cyan-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Export GF_T3_171_SPEC.md
          </button>
        </div>
      </div>
    </footer>
  );
};
