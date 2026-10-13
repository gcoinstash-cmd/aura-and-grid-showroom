/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Lexus RZ 450e Steer-by-Wire Precision Core (GF-T3-174)
 * Top Bar Navigation (Standard relative positioning - scrolls naturally)
 */

import React from 'react';
import { Download, ShieldCheck, Terminal } from 'lucide-react';

interface HeaderProps {
  onExportSpec: () => void;
  onOpenSimulation: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onExportSpec, onOpenSimulation }) => {
  return (
    <header className="relative w-full border-b border-slate-800 bg-slate-950/80 px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8">
        {/* Zone 1: Single element wordmark brand zone */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-base">
            GF
          </div>
          <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
            Ghost FactoryOS
          </span>
        </div>

        {/* Zone 2: Clean single-line text links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#cockpit-section" className="hover:text-white transition-colors whitespace-nowrap">
            Interactive Cockpit
          </a>
          <a href="#technical-tabs" className="hover:text-white transition-colors whitespace-nowrap">
            Algorithm & Ledger
          </a>
          <a href="#technical-tabs" className="hover:text-white transition-colors whitespace-nowrap">
            OpenAPI & Cloud Run
          </a>
          <a href="#technical-tabs" className="hover:text-white transition-colors whitespace-nowrap">
            Acquire.com APA
          </a>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onExportSpec}
            className="flex items-center gap-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-sm font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>Export GF_T3_174_SPEC.md</span>
          </button>
        </div>
      </div>
    </header>
  );
};
