import React from 'react';
import { 
  Play, 
  Square, 
  ShieldCheck, 
  Download, 
  Search, 
  Bell, 
  History, 
  KeyRound, 
  Wifi, 
  WifiOff, 
  UserCheck 
} from 'lucide-react';
import { UserRole, UserRoleInfo, MultiSigState } from '../types/engine';

interface MonroneyBannerProps {
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onOpenHmacAudit: () => void;
  onExportSpec: () => void;
  onOpenMultiSig: () => void;
  onOpenAuditLogs: () => void;
  onOpenNotifications: () => void;
  onOpenSearch: () => void;
  unreadCount: number;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  multiSigState: MultiSigState;
  isOffline: boolean;
  onToggleOffline: () => void;
}

export const USER_ROLES: Record<UserRole, UserRoleInfo> = {
  BUYER_ESCROW: {
    role: 'BUYER_ESCROW',
    title: 'Acquire.com Escrow Officer',
    actor: 'Escrow Keyholder #01',
    permissions: ['Escrow Verification', 'Fund Disbursement', 'Dual-Key Signing'],
  },
  SELLER_ARCHITECT: {
    role: 'SELLER_ARCHITECT',
    title: 'Lead Systems Architect (Ghost FactoryOS)',
    actor: 'Founding Engineer Keyholder #02',
    permissions: ['Codebase IP Assignment', 'Master Key Release', 'Dual-Key Signing'],
  },
  SEC_AUDITOR: {
    role: 'SEC_AUDITOR',
    title: 'Institutional Clean-Room Auditor',
    actor: 'Independent Legal Counsel',
    permissions: ['AST Compliance Review', 'HMAC Verification', 'Read-Only Audit Trail'],
  },
  OBSERVER: {
    role: 'OBSERVER',
    title: 'Prospective Acquirer Observer',
    actor: 'Due Diligence Analyst',
    permissions: ['Telemetry Inspection', 'L2 Book Inspection', 'Export Specs'],
  },
};

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  isSimulating,
  onToggleSimulation,
  onOpenHmacAudit,
  onExportSpec,
  onOpenMultiSig,
  onOpenAuditLogs,
  onOpenNotifications,
  onOpenSearch,
  unreadCount,
  currentRole,
  onRoleChange,
  multiSigState,
  isOffline,
  onToggleOffline,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950 relative transition-colors">
      {/* Top Utility Ribbon */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-base sm:text-lg font-mono text-zinc-300">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2.5 font-bold text-zinc-200">
            <span className="relative flex h-3.5 w-3.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSimulating ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isSimulating ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            GHOST FACTORYOS FLEET // TRACK 3 F1 SKUNKWORKS
          </span>
          <span className="text-zinc-600 hidden sm:inline">|</span>
          <span className="hidden sm:inline text-zinc-400 font-semibold">CLASSIFICATION: MONOPOLY VAULT DELIVERABLE</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Offline Sync Mode Toggle */}
          <button
            onClick={onToggleOffline}
            title={isOffline ? 'Offline Mode Active (Encrypted Local Storage Sync)' : 'Online Real-Time Telemetry Connected'}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm sm:text-base font-mono font-bold transition-all ${
              isOffline
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-zinc-900 text-zinc-200 border border-zinc-800 hover:border-zinc-600'
            }`}
          >
            {isOffline ? <WifiOff className="w-5 h-5 text-amber-400" /> : <Wifi className="w-5 h-5 text-emerald-400" />}
            <span>{isOffline ? 'OFFLINE CACHED' : 'ONLINE CLOUD RUN'}</span>
          </button>

          {/* Role Selector */}
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-zinc-400" />
            <select
              value={currentRole}
              aria-label="Active Security Role"
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-zinc-900 text-zinc-100 border border-zinc-700 hover:border-zinc-500 rounded-xl px-4 py-2 text-sm sm:text-base font-mono font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {Object.values(USER_ROLES).map((role) => (
                <option key={role.role} value={role.role}>
                  {role.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Telemetry Header Bar with Scaled-Up Big Typography */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Asset Identification & Architecture Title */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="bg-amber-500/15 text-amber-300 border border-amber-500/40 text-sm font-mono font-bold px-3 py-1 rounded-lg tracking-wider shadow-sm">
                ASSET ID: GF-T3-167
              </span>
              <span className="bg-zinc-800 text-zinc-200 text-xs sm:text-sm font-mono font-semibold px-2.5 py-1 rounded-lg border border-zinc-700">
                TIER 3 // F1 SERVICE ENGINE
              </span>
              <span className="text-zinc-400 font-mono text-xs sm:text-sm hidden md:inline font-medium">
                CHASSIS: LC-500-DYN-V8
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core Dynamic Core
              </h1>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-400 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-700 shadow-sm">
                v1.0.0-PROD
              </span>
            </div>

            <p className="text-sm sm:text-base text-zinc-300 mt-2 max-w-3xl leading-relaxed font-normal">
              Zero-allocation lock-free order matching core with PostgreSQL 16 partitioned tick ledger & non-repudiation HMAC-SHA256 write-ahead triggers.
            </p>
          </div>

          {/* Technical Architecture Badges */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
            {/* Runtime Execution Badge */}
            <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-3.5 sm:p-4 px-5 flex flex-col justify-center shadow-lg shadow-emerald-950/20">
              <div className="text-xs sm:text-sm font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Runtime Execution
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-300 mt-1">
                20 kHz <span className="text-xs sm:text-sm font-bold text-emerald-400">Sub-ms</span>
              </div>
            </div>

            {/* Architecture Moat Badge */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3.5 sm:p-4 px-5 flex flex-col justify-center shadow-lg">
              <div className="text-xs sm:text-sm font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                Architecture Moat
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-zinc-200 mt-1">
                PostgreSQL 16 <span className="text-xs sm:text-sm font-normal text-zinc-400">+ RLS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="mt-6 pt-5 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4">
          {/* Main Requested Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5">
            {/* 1. Simulate Order Flow Button */}
            <button
              onClick={onToggleSimulation}
              className={`flex items-center gap-3 px-6 py-3.5 rounded-xl text-base sm:text-lg font-mono font-bold transition-all shadow-lg active:scale-95 ${
                isSimulating
                  ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/20'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              {isSimulating ? (
                <>
                  <Square className="w-5 h-5 fill-current" />
                  <span>Pause Order Flow</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Simulate Order Flow</span>
                </>
              )}
            </button>

            {/* 2. Verify HMAC Audit Button */}
            <button
              onClick={onOpenHmacAudit}
              className="flex items-center gap-3 px-6 py-3.5 rounded-xl text-base sm:text-lg font-mono font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700 hover:border-zinc-500 transition-all shadow-md active:scale-95"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Verify HMAC Audit</span>
            </button>

            {/* 3. Export GF_T3_167_SPEC.md Button */}
            <button
              onClick={onExportSpec}
              className="flex items-center gap-3 px-6 py-3.5 rounded-xl text-base sm:text-lg font-mono font-bold bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/50 hover:border-amber-400 transition-all shadow-md active:scale-95"
            >
              <Download className="w-5 h-5 text-amber-400" />
              <span>Export GF_T3_167_SPEC.md</span>
            </button>

            {/* Multi-Signature Status Button */}
            <button
              onClick={onOpenMultiSig}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl text-base sm:text-lg font-mono font-bold transition-all border shadow-sm ${
                multiSigState.escrowStatus === 'FULLY_EXECUTED_VAULTED'
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/40'
                  : 'bg-zinc-900 text-zinc-200 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <KeyRound className="w-5 h-5 text-amber-400" />
              <span className="hidden sm:inline">Dual-Key Escrow:</span>
              <span className="text-sm sm:text-base font-extrabold uppercase">
                {multiSigState.escrowStatus === 'FULLY_EXECUTED_VAULTED' ? 'VAULT SEALED (2/2)' : 'PENDING (1/2)'}
              </span>
            </button>
          </div>

          {/* Quick Utility Icon Triggers */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSearch}
              title="Search Specification & Schemas (Ctrl+K)"
              className="p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-500 transition-all shadow-sm"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenAuditLogs}
              title="Immutable Audit Log Vault"
              className="p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-500 transition-all shadow-sm"
            >
              <History className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenNotifications}
              title="System Alerts & Notifications"
              className="p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-500 transition-all shadow-sm relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
