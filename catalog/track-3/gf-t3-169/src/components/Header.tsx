import React from 'react';
import { ShieldCheck, Wifi, WifiOff, Users, Layers, DollarSign, Bell } from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  isMfaVerified: boolean;
  onOpenMfa: () => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  onOpenSync: () => void;
  onOpenAudit: () => void;
  onOpenCost: () => void;
  unreadAlertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onChangeRole,
  isMfaVerified,
  onOpenMfa,
  isOffline,
  onToggleOffline,
  onOpenSync,
  onOpenAudit,
  onOpenCost,
  unreadAlertCount,
}) => {
  const roleLabels: Record<UserRole, string> = {
    CHIEF_SYSTEMS_ARCHITECT: 'Chief Systems Architect',
    ACQUIRE_BUYER_ESCROW: 'Acquire.com Escrow Officer',
    LEAD_POWERTRAIN_AUDITOR: 'Lead Powertrain Auditor',
    FIELD_OPERATIONS_ENGINEER: 'Field Operations Engineer',
  };

  return (
    <header className="relative w-full border-b border-slate-800 bg-slate-950 px-4 md:px-8 py-4 mb-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Brand Zone: 1-line wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center shadow-lg shadow-rose-950/60 font-black text-white text-lg tracking-wider">
            GF
          </div>
          <div>
            <div className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Ghost FactoryOS</span>
              <span className="text-slate-500 font-normal">/</span>
              <span className="text-rose-400 font-mono text-base font-bold">GF-T3-169</span>
            </div>
            <div className="text-sm text-slate-400">
              Apex Executive NX 450h+ High-G Dynamic Telemetry Agile Hybrid Core · Acquire.com Turnkey Asset
            </div>
          </div>
        </div>

        {/* Operational Controls & Enterprise Navigation */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* RBAC Role Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-sm">
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={currentRole}
              onChange={(e) => onChangeRole(e.target.value as UserRole)}
              className="bg-transparent text-slate-200 text-sm font-semibold focus:outline-none cursor-pointer"
            >
              <option value="CHIEF_SYSTEMS_ARCHITECT" className="bg-slate-900 text-white">
                Chief Systems Architect
              </option>
              <option value="ACQUIRE_BUYER_ESCROW" className="bg-slate-900 text-white">
                Acquire.com Buyer / Escrow
              </option>
              <option value="LEAD_POWERTRAIN_AUDITOR" className="bg-slate-900 text-white">
                Lead Powertrain Auditor
              </option>
              <option value="FIELD_OPERATIONS_ENGINEER" className="bg-slate-900 text-white">
                Field Operations Engineer
              </option>
            </select>
          </div>

          {/* MFA Status Badge */}
          <button
            onClick={onOpenMfa}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
              isMfaVerified
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                : 'bg-amber-950/60 border-amber-700 text-amber-300 hover:bg-amber-900/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isMfaVerified ? 'MFA Hardware Active' : 'Verify MFA'}</span>
          </button>

          {/* Offline / Online Sync Toggle */}
          <button
            onClick={onToggleOffline}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
              isOffline
                ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
            <span>{isOffline ? 'Offline (Cached Sync)' : 'Online Real-Time'}</span>
          </button>

          {/* Jira & GitHub Milestone Sync */}
          <button
            onClick={onOpenSync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Jira / GitHub</span>
          </button>

          {/* Audit Logs & Alert Center */}
          <button
            onClick={onOpenAudit}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Audit & Alerts</span>
            {unreadAlertCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-sm font-bold">
                {unreadAlertCount}
              </span>
            )}
          </button>

          {/* Cloud Matrix Ledger */}
          <button
            onClick={onOpenCost}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Matrix: 20 kHz (0.48ms)/mo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
