/**
 * Ghost FactoryOS Track 3 (F1 Skunkworks Engine)
 * Asset GF-T3-147: Sol-Rotor Autonomous Heavy-Lift eVTOL & Swarm Flight Telemetry Engine
 * 
 * Master Avionics Header & Navigation Bar
 */

import React from 'react';
import { MasterBundleExport } from '../export/MasterBundleExport';
import { Gauge, Radio, Clock, Sliders, FileCode, Shield, Zap } from 'lucide-react';

export type ActiveTab = 'PFD' | 'SWARM_RADAR' | 'NDI_LOOP' | 'DISTURBANCE_LAB' | 'DOCS_EXPLORER';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  flightMode: string;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab, flightMode }) => {
  const navTabs: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'PFD', label: 'Primary Flight Display (PFD)', icon: Gauge },
    { id: 'SWARM_RADAR', label: 'Swarm Tactical Mesh & RVO', icon: Radio },
    { id: 'NDI_LOOP', label: 'NDI Guidance Loop (<4.5ms)', icon: Clock },
    { id: 'DISTURBANCE_LAB', label: 'Atmosphere & Fault Lab', icon: Sliders },
    { id: 'DOCS_EXPLORER', label: '10/10 Enterprise Specs & APA', icon: FileCode },
  ];

  return (
    <header className="flex flex-col gap-4 border-b border-cyan-500/20 bg-slate-950/90 pb-4 backdrop-blur-xl sticky top-0 z-50">
      {/* Top Asset Identity Strip */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pt-4 px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-avionics font-extrabold text-2xl text-slate-950 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/40">
            GF
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-cyan-950 text-cyan-300 font-mono text-xs px-2.5 py-0.5 rounded-full border border-cyan-400/40 font-bold tracking-wider">
                TRACK 3: F1 SKUNKWORKS
              </span>
              <span className="bg-slate-800 text-slate-300 font-mono text-xs px-2 py-0.5 rounded border border-slate-700">
                ASSET: GF-T3-147
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-avionics tracking-wide text-white mt-1">
              SOL-ROTOR: <span className="text-cyan-400">AUTONOMOUS HEAVY-LIFT eVTOL & SWARM ENGINE</span>
            </h1>
          </div>
        </div>

        {/* Master Action & Export */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <MasterBundleExport />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 sm:px-8 pb-1 scrollbar-none">
        {navTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-avionics font-bold text-base transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
