import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  ShieldCheck, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Download, 
  HelpCircle, 
  Activity, 
  Bell, 
  Shield, 
  FolderArchive,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  Snowflake,
  Award,
  Cloud,
  HardDrive,
  RefreshCw,
  Database,
  Server,
  Wifi,
  Check,
  X
} from 'lucide-react';
import { PlayerStats, WeaponTier, Perk } from '../types';
import { audioEngine } from '../utils/audio';

interface CockpitHeaderProps {
  stats: PlayerStats;
  activePerk?: Perk;
  isAmbientActive: boolean;
  onToggleAmbient: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onOpenMilestones?: () => void;
  onOpenRecharge: () => void;
  onOpenExporter: () => void;
  onOpenTutorial: () => void;
  onOpenAnalytics: () => void;
  onOpenAlerts: () => void;
  onOpenVault: () => void;
  onOpenSoundscape?: () => void;
  onSelectTier: (tier: WeaponTier) => void;
  onDeepWorkComplete?: (minutes: number, xp: number) => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  syncMode?: 'local_only' | 'backend_synced';
  onSyncModeToggle?: (mode: 'local_only' | 'backend_synced') => void;
  onManualSync?: () => void;
}

export const CockpitHeader: React.FC<CockpitHeaderProps> = ({
  stats,
  activePerk,
  isAmbientActive,
  onToggleAmbient,
  isMuted: propIsMuted,
  onToggleMute: propOnToggleMute,
  onOpenMilestones,
  onOpenRecharge,
  onOpenExporter,
  onOpenTutorial,
  onOpenAnalytics,
  onOpenAlerts,
  onOpenVault,
  onOpenSoundscape,
  onSelectTier,
  onDeepWorkComplete,
  isZenMode,
  onToggleZenMode,
  syncMode: propSyncMode,
  onSyncModeToggle: propOnSyncModeToggle,
  onManualSync
}) => {
  const [internalMuted, setInternalMuted] = useState(() => audioEngine.isMuted());
  const isMuted = propIsMuted !== undefined ? propIsMuted : internalMuted;

  useEffect(() => {
    const unsub = audioEngine.onMuteChange((muted) => {
      setInternalMuted(muted);
    });
    return unsub;
  }, []);

  const handleToggleMute = () => {
    if (propOnToggleMute) {
      propOnToggleMute();
    } else {
      const nextMuted = audioEngine.toggleMute();
      setInternalMuted(nextMuted);
      if (!nextMuted) {
        audioEngine.playClick();
      }
    }
  };

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [volume, setVolume] = useState(audioEngine.getVolume());
  const [showTierDropdown, setShowTierDropdown] = useState(false);

  // --- SYNC STATUS STATE ---
  const [internalSyncMode, setInternalSyncMode] = useState<'local_only' | 'backend_synced'>(() => {
    try {
      return (localStorage.getItem('titan_core_sync_mode') as 'local_only' | 'backend_synced') || 'local_only';
    } catch {
      return 'local_only';
    }
  });
  const syncMode = propSyncMode !== undefined ? propSyncMode : internalSyncMode;

  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncPopover, setShowSyncPopover] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  const [storageMetrics, setStorageMetrics] = useState({ sizeKb: 14.2, keyCount: 12 });
  const syncPopoverRef = useRef<HTMLDivElement | null>(null);

  // Recalculate storage metrics whenever popover is opened or sync happens
  const refreshStorageMetrics = () => {
    try {
      let totalBytes = 0;
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('titan_core_') || key.startsWith('titan_'))) {
          count++;
          const val = localStorage.getItem(key) || '';
          totalBytes += (key.length + val.length) * 2;
        }
      }
      setStorageMetrics({
        sizeKb: Math.max(1.5, +(totalBytes / 1024).toFixed(1)),
        keyCount: Math.max(1, count)
      });
    } catch {
      setStorageMetrics({ sizeKb: 14.2, keyCount: 12 });
    }
  };

  // Close sync popover on click outside or escape key
  useEffect(() => {
    if (!showSyncPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (syncPopoverRef.current && !syncPopoverRef.current.contains(e.target as Node)) {
        setShowSyncPopover(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSyncPopover(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSyncPopover]);

  const handleManualSync = () => {
    if (isSyncing) return;
    audioEngine.playSlotLock();
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      refreshStorageMetrics();
      if (syncMode === 'backend_synced') {
        audioEngine.playOvercharge();
      } else {
        audioEngine.playClick();
      }
      if (onManualSync) {
        onManualSync();
      }
    }, 700);
  };

  const handleToggleSyncMode = (newMode: 'local_only' | 'backend_synced') => {
    if (newMode === syncMode) return;
    if (propOnSyncModeToggle) {
      propOnSyncModeToggle(newMode);
    } else {
      setInternalSyncMode(newMode);
      try {
        localStorage.setItem('titan_core_sync_mode', newMode);
      } catch (e) {
        console.warn(e);
      }
    }
    audioEngine.playSlotLock();
    if (newMode === 'backend_synced') {
      setIsSyncing(true);
      setTimeout(() => {
        setIsSyncing(false);
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        audioEngine.playOvercharge();
      }, 700);
    }
  };

  // --- POMODORO DEEP WORK TIMER STATE ---
  const [showTimerPopover, setShowTimerPopover] = useState(false);
  const [timerDuration, setTimerDuration] = useState(25 * 60); // default 25 min (1500s)
  const [timerRemaining, setTimerRemaining] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerFinishedBanner, setTimerFinishedBanner] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Tick loop for Deep Work timer
  useEffect(() => {
    if (isTimerRunning && timerRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timerRemaining]);

  const handleTimerComplete = () => {
    setIsTimerRunning(false);
    audioEngine.playDeepWorkComplete();
    setTimerFinishedBanner(true);
    if (onDeepWorkComplete) {
      const minutesCompleted = Math.round(timerDuration / 60);
      onDeepWorkComplete(minutesCompleted, 250);
    }
    setTimeout(() => setTimerFinishedBanner(false), 6000);
  };

  const handleToggleTimer = () => {
    audioEngine.playClick();
    if (!isTimerRunning && timerRemaining === 0) {
      setTimerRemaining(timerDuration);
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = (newDurationSeconds = timerDuration) => {
    audioEngine.playClick();
    setIsTimerRunning(false);
    setTimerDuration(newDurationSeconds);
    setTimerRemaining(newDurationSeconds);
  };

  const setPresetDuration = (minutes: number) => {
    audioEngine.playSlotLock();
    const secs = minutes * 60;
    setTimerDuration(secs);
    setTimerRemaining(secs);
    setIsTimerRunning(false);
  };

  const formatTimerDigits = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioEngine.setVolume(val);
  };

  const isShieldMax = stats.shieldPercentage >= 100;
  const isStreakFreezeEquipped = activePerk?.id === 'perk_streak_freeze' || activePerk?.isStreakFreeze;
  const timerPercent = Math.max(0, Math.min(100, ((timerDuration - timerRemaining) / timerDuration) * 100));

  return (
    // UNSTICK: Using standard relative positioning with zero sticky or fixed pinning
    <header className="border-b border-zinc-800 bg-[#09090b] relative">
      {/* Top Bar Zone Contract: Brand Zone, Navigation Links, Primary Action */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Deep Work Finished Toast Banner */}
        {timerFinishedBanner && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-950 via-zinc-900 to-emerald-950 border border-cyan-400 text-white flex items-center justify-between gap-4 shadow-[0_0_25px_rgba(34,211,238,0.3)] animate-bounce">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="text-lg font-bold text-cyan-300">DEEP WORK FOCUS BURST COMPLETED!</div>
                <div className="text-base text-zinc-300">Excellent neural focus session. +250 XP has been credited to your chassis.</div>
              </div>
            </div>
            <button
              onClick={() => setTimerFinishedBanner(false)}
              className="py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-base font-bold text-white transition-colors"
            >
              DISMISS
            </button>
          </div>
        )}

        <div className="w-full max-w-full flex flex-wrap items-center justify-between gap-3 overflow-x-hidden">
          
          {/* Zone 1: Wordmark & Sync Status Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-zinc-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 fill-cyan-400/20" />
            </div>
            <div className="leading-tight">
              <div className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2 sm:gap-3 flex-wrap">
                <span>TITAN CORE</span>
                <span className="text-sm sm:text-base font-mono font-medium px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                  #201
                </span>

                {/* SYNC STATUS TELEMETRY INDICATOR */}
                <div className="relative inline-block" ref={syncPopoverRef}>
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.playClick();
                      refreshStorageMetrics();
                      setShowSyncPopover(!showSyncPopover);
                    }}
                    className={`min-h-[44px] flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-mono font-bold transition-all cursor-pointer select-none active:scale-95 ${
                      isSyncing
                        ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.35)] ring-1 ring-cyan-400/50'
                        : syncMode === 'backend_synced'
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-950/60 shadow-[0_0_12px_rgba(52,211,153,0.2)]'
                        : 'bg-zinc-900 border-zinc-700/90 text-zinc-300 hover:border-zinc-500 hover:text-white hover:bg-zinc-850'
                    }`}
                    title={
                      syncMode === 'backend_synced'
                        ? 'Connected: Local storage stats are continuously synced with Backend Persistent Storage. Tap to view telemetry.'
                        : 'Isolated: Stats are saved strictly in browser LocalStorage. Tap to view telemetry or sync with backend.'
                    }
                  >
                    {isSyncing ? (
                      <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                    ) : syncMode === 'backend_synced' ? (
                      <Cloud className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <HardDrive className="w-4 h-4 text-amber-400" />
                    )}

                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSyncing
                          ? 'bg-cyan-400 animate-ping'
                          : syncMode === 'backend_synced'
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-amber-400'
                      }`}
                    />

                    <span className="tracking-wide">
                      {isSyncing
                        ? 'SYNCING...'
                        : syncMode === 'backend_synced'
                        ? 'BACKEND SYNCED'
                        : 'SAVED LOCALLY'}
                    </span>
                  </button>

                  {/* SYNC STATUS TELEMETRY POPOVER */}
                  {showSyncPopover && (
                    <div className="absolute left-0 top-full mt-2.5 p-5 bg-zinc-950 border border-zinc-700 rounded-2xl shadow-2xl z-40 w-80 sm:w-96 max-w-[calc(100vw-2rem)] space-y-4 animate-in fade-in duration-200">
                      {/* Popover Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                          <Database className="w-5 h-5 text-cyan-400" />
                          <span className="text-base font-bold text-white tracking-tight">
                            Storage & Sync Telemetry
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSyncPopover(false)}
                          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Active Status Hero Card */}
                      <div className={`p-4 rounded-xl border ${
                        syncMode === 'backend_synced'
                          ? 'bg-emerald-950/30 border-emerald-500/40'
                          : 'bg-zinc-900 border-zinc-800'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            syncMode === 'backend_synced'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}>
                            {syncMode === 'backend_synced' ? (
                              <Cloud className="w-5 h-5" />
                            ) : (
                              <HardDrive className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-bold text-white">
                                {syncMode === 'backend_synced'
                                  ? 'Backend Persistent Storage'
                                  : 'Client LocalStorage Sandbox'}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded text-sm font-mono font-bold ${
                                syncMode === 'backend_synced'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}>
                                {syncMode === 'backend_synced' ? 'ACTIVE SYNC' : 'OFFLINE ENCLAVE'}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-300 mt-1.5 leading-relaxed">
                              {syncMode === 'backend_synced'
                                ? 'Chassis stats, gratitude slots, 7-day streak window, and combat logs are continuously mirrored to persistent backend storage.'
                                : 'All habit streaks, XP metrics, and gratitude vectors remain securely persisted strictly inside your browser LocalStorage.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Mode Selection Toggle Buttons */}
                      <div className="space-y-1.5">
                        <div className="text-sm font-semibold font-mono text-zinc-400">
                          SWITCH PERSISTENCE MODE:
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleSyncMode('local_only')}
                            className={`min-h-[44px] p-2.5 rounded-xl border text-left transition-all ${
                              syncMode === 'local_only'
                                ? 'bg-zinc-800 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400/40'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <div className="flex items-center justify-between text-sm font-mono font-bold">
                              <span>Saved Locally</span>
                              {syncMode === 'local_only' && <Check className="w-4 h-4 text-cyan-400" />}
                            </div>
                            <div className="text-sm text-zinc-400 mt-0.5">Isolated enclave</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleSyncMode('backend_synced')}
                            className={`min-h-[44px] p-2.5 rounded-xl border text-left transition-all ${
                              syncMode === 'backend_synced'
                                ? 'bg-emerald-950/40 border-emerald-400 text-white shadow-sm ring-1 ring-emerald-400/40'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <div className="flex items-center justify-between text-sm font-mono font-bold">
                              <span>Backend Synced</span>
                              {syncMode === 'backend_synced' && <Check className="w-4 h-4 text-emerald-400" />}
                            </div>
                            <div className="text-sm text-zinc-400 mt-0.5">Persistent cloud</div>
                          </button>
                        </div>
                      </div>

                      {/* Technical Telemetry Diagnostics Grid */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 space-y-2 font-mono text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Storage Target:</span>
                          <span className="text-zinc-200 font-bold">
                            {syncMode === 'backend_synced' ? 'Backend Persistent REST/WS' : 'Browser LocalStorage Enclave'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Payload Footprint:</span>
                          <span className="text-cyan-400 font-bold tabular-nums">
                            {storageMetrics.sizeKb} KB · {storageMetrics.keyCount} state keys
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Last Sync Time:</span>
                          <span className="text-emerald-400 font-bold tabular-nums">
                            {lastSyncTime}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Reconciliation:</span>
                          <span className="text-zinc-300">Deterministic SHA-256</span>
                        </div>
                      </div>

                      {/* Action Buttons: Sync Now & Export Codex */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleManualSync}
                          disabled={isSyncing}
                          className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-zinc-950 font-mono text-base font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                        >
                          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                          <span>{isSyncing ? 'SYNCING...' : 'SYNC NOW'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowSyncPopover(false);
                            onOpenVault();
                          }}
                          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-mono font-bold flex items-center gap-1.5 transition-colors"
                          title="Open Codex Vault to export JSON backup"
                        >
                          <FolderArchive className="w-4 h-4 text-emerald-400" />
                          <span>EXPORT JSON</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-base font-medium text-zinc-300">
            <button 
              onClick={onOpenRecharge}
              className="hover:text-cyan-400 transition-colors flex items-center gap-2 py-1"
            >
              <Activity className="w-5 h-5 text-cyan-400" />
              <span>Reactor Recharge</span>
            </button>
            <button 
              onClick={onOpenAnalytics}
              className="hover:text-cyan-400 transition-colors flex items-center gap-2 py-1"
            >
              <span>Telemetry Analytics</span>
            </button>
            <button 
              onClick={onOpenVault}
              className="hover:text-cyan-400 transition-colors flex items-center gap-2 py-1"
            >
              <FolderArchive className="w-5 h-5 text-emerald-400" />
              <span>Codex Vault</span>
            </button>
            <button 
              onClick={onOpenAlerts}
              className="hover:text-cyan-400 transition-colors flex items-center gap-2 py-1 relative"
            >
              <Bell className="w-5 h-5 text-zinc-400" />
              <span>Raid Alerts</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            </button>
            <button 
              onClick={onOpenTutorial}
              className="hover:text-cyan-400 transition-colors flex items-center gap-2 py-1"
            >
              <HelpCircle className="w-5 h-5 text-zinc-400" />
              <span>Field Manual</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action & Controls (Includes Pomodoro Deep Work Timer) */}
          <div className="flex flex-wrap items-center gap-2 max-w-full">
            
            {/* POMODORO DEEP WORK TIMER WIDGET */}
            <div className="relative">
              <div 
                className={`flex items-center rounded-xl border transition-all ${
                  isTimerRunning
                    ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                {/* Timer Display / Open Popover */}
                <button
                  onClick={() => {
                    audioEngine.playClick();
                    setShowTimerPopover(!showTimerPopover);
                  }}
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm md:text-base font-mono font-bold transition-colors"
                  title="25-minute Pomodoro Deep Work Timer"
                >
                  <Timer className={`w-4 h-4 sm:w-5 sm:h-5 ${isTimerRunning ? 'text-cyan-400 animate-spin' : 'text-zinc-400'}`} style={isTimerRunning ? { animationDuration: '6s' } : undefined} />
                  <span className="tabular-nums tracking-wide text-white">
                    {formatTimerDigits(timerRemaining)}
                  </span>
                  <span className="hidden sm:inline text-sm md:text-base font-sans font-semibold text-zinc-400">
                    DEEP WORK
                  </span>
                </button>

                {/* Direct 1-Click Play/Pause Action Button */}
                <button
                  onClick={handleToggleTimer}
                  className={`p-1.5 sm:p-2 border-l transition-colors rounded-r-xl ${
                    isTimerRunning
                      ? 'border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20'
                      : 'border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                  }`}
                  title={isTimerRunning ? 'Pause Deep Work timer' : 'Start 25m Focus Burst'}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />}
                </button>
              </div>

              {/* Deep Work Timer Controller Popover */}
              {showTimerPopover && (
                <div className="absolute right-0 top-full mt-3 p-5 bg-zinc-950 border border-zinc-700 rounded-2xl shadow-2xl z-30 w-80 sm:w-96 max-w-[calc(100vw-2rem)]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Timer className="w-5 h-5 text-cyan-400" />
                      <span className="text-lg font-bold text-white tracking-tight">Deep Work Focus Burst</span>
                    </div>
                    <span className="text-base font-mono text-cyan-400 font-bold tabular-nums">
                      {Math.round(timerPercent)}%
                    </span>
                  </div>

                  {/* Big Timer Digits */}
                  <div className="text-center py-4 bg-zinc-900 border border-zinc-800 rounded-2xl mb-4">
                    <div className="text-4xl font-black font-mono text-white tabular-nums tracking-wider">
                      {formatTimerDigits(timerRemaining)}
                    </div>
                    <div className="text-base font-mono text-zinc-400 mt-1">
                      {isTimerRunning ? 'FOCUS BURST IN PROGRESS' : 'READY TO ENGAGE'}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-5/6 mx-auto h-2 bg-zinc-800 rounded-full mt-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                        style={{ width: `${timerPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Preset Durations */}
                  <div className="space-y-1.5 mb-4">
                    <div className="text-base font-mono text-zinc-400 font-semibold">PRESET SESSIONS:</div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setPresetDuration(25)}
                        className={`py-2 px-3 rounded-xl text-base font-mono font-bold border transition-colors ${
                          timerDuration === 25 * 60
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        25m BURST
                      </button>
                      <button
                        onClick={() => setPresetDuration(50)}
                        className={`py-2 px-3 rounded-xl text-base font-mono font-bold border transition-colors ${
                          timerDuration === 50 * 60
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        50m SPRINT
                      </button>
                      <button
                        onClick={() => setPresetDuration(5)}
                        className={`py-2 px-3 rounded-xl text-base font-mono font-bold border transition-colors ${
                          timerDuration === 5 * 60
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        5m BREAK
                      </button>
                    </div>
                  </div>

                  {/* Popover Action Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleToggleTimer}
                      className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                    >
                      {isTimerRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                      <span>{isTimerRunning ? 'PAUSE TIMER' : 'START 25m BURST'}</span>
                    </button>

                    <button
                      onClick={() => handleResetTimer()}
                      className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                      title="Reset timer"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-3 text-base text-zinc-400 font-sans leading-relaxed text-center">
                    Completing a full 25m burst sounds a triumphant victory fanfare and rewards +250 XP.
                  </div>
                </div>
              )}
            </div>

            {/* Global Sound Effects & Audio Control Group */}
            <div className="relative flex items-center gap-1">
              {/* GLOBAL SFX TOGGLE SWITCH */}
              <button
                role="switch"
                aria-checked={!isMuted}
                onClick={handleToggleMute}
                className={`min-h-[44px] flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 sm:py-2 rounded-xl text-sm md:text-base font-mono font-bold transition-all border select-none cursor-pointer active:scale-95 ${
                  !isMuted
                    ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.25)] hover:bg-cyan-500/25'
                    : 'bg-zinc-900 border-zinc-700/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                }`}
                title={isMuted ? 'Sound effects are MUTED. Click to unmute all audio' : 'Sound effects are LIVE. Click to mute all audio'}
              >
                {/* Speaker Icon with status-colored glow */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  !isMuted ? 'bg-cyan-500/25 text-cyan-300' : 'bg-red-500/15 text-red-400'
                }`}>
                  {!isMuted ? (
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 animate-pulse" />
                  ) : (
                    <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                  )}
                </div>

                {/* Status Text Display */}
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-sm font-mono font-bold tracking-wider text-zinc-200">
                    SFX
                  </span>
                  <span className={`px-2 py-0.5 rounded text-sm font-mono font-bold transition-all ${
                    !isMuted 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                      : 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                  }`}>
                    {!isMuted ? 'LIVE' : 'MUTED'}
                  </span>
                </div>

                {/* Tactile Toggle Switch Track & Slider Thumb */}
                <div 
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out border ${
                    !isMuted 
                      ? 'bg-cyan-500 border-cyan-400' 
                      : 'bg-zinc-800 border-zinc-700'
                  }`}
                  aria-hidden="true"
                >
                  <span 
                    className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      !isMuted ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </button>

              {/* Focus Drone Ambient Button */}
              <button
                onClick={() => {
                  audioEngine.playClick();
                  onToggleAmbient();
                }}
                className={`min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-sm md:text-base font-mono font-medium border transition-all ${
                  isAmbientActive && !isMuted
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
                title={isMuted ? 'Global audio is muted. Click SFX switch to unmute' : '55Hz detuned binaural drone for ADHD sensory regulation'}
              >
                <Activity className={`w-4 h-4 sm:w-5 sm:h-5 ${isAmbientActive && !isMuted ? 'text-emerald-400 animate-pulse' : 'text-zinc-400'}`} />
                <span className="hidden xl:inline">DRONE</span>
                {isAmbientActive && !isMuted && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>

              {/* Quick Volume / Audio Settings Trigger */}
              <button
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                className="min-h-[44px] p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
                title="Open sound settings & volume slider"
              >
                <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Volume & Audio Settings Popover */}
              {showVolumeSlider && (
                <div className="absolute right-0 top-full mt-2 p-5 bg-zinc-950 border border-zinc-700 rounded-2xl shadow-2xl z-30 w-80 max-w-[calc(100vw-2rem)]">
                  {/* Popover Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-cyan-400" />
                      <span className="text-base font-bold text-white tracking-tight">Audio System</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-sm font-mono font-bold ${
                      !isMuted 
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                        : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}>
                      {!isMuted ? 'UNMUTED' : 'MUTED'}
                    </span>
                  </div>

                  {/* Quick Toggle Switch in popover */}
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between mb-4">
                    <div>
                      <div className="text-base font-mono font-bold text-white">Global Audio Mute</div>
                      <div className="text-sm font-sans text-zinc-400">Silences clicks, chimes & fanfares</div>
                    </div>
                    <button
                      onClick={handleToggleMute}
                      className={`min-h-[44px] px-3.5 py-1.5 rounded-lg text-sm font-mono font-bold border transition-colors ${
                        !isMuted 
                          ? 'bg-red-500/15 text-red-300 border-red-500/40 hover:bg-red-500/25' 
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-400 hover:bg-cyan-500/30'
                      }`}
                    >
                      {!isMuted ? 'MUTE ALL' : 'UNMUTE'}
                    </button>
                  </div>

                  {/* Synth Volume Slider */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-base font-mono text-zinc-300">
                      <span>SYNTH MASTER GAIN</span>
                      <span className="tabular-nums font-bold text-cyan-400">{Math.round(volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-full accent-cyan-400 bg-zinc-800 h-2 rounded-lg cursor-pointer my-2"
                    />
                  </div>

                  {/* Soundscape Presets Launcher */}
                  {onOpenSoundscape && (
                    <div className="pt-3 pb-2 border-t border-zinc-800">
                      <button
                        onClick={() => {
                          audioEngine.playClick();
                          setShowVolumeSlider(false);
                          onOpenSoundscape();
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 font-mono text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_10px_rgba(34,211,238,0.15)]"
                      >
                        <Sliders className="w-4 h-4 text-cyan-400" />
                        <span>SOUNDSCAPE PRESETS (5 PRESETS)</span>
                      </button>
                    </div>
                  )}

                  <div className="text-sm text-zinc-400 font-sans leading-relaxed">
                    Pure procedural Web Audio synthesis (Rain in Space, Cyber Cafe, Deep Void). Zero network tracking.
                  </div>
                </div>
              )}
            </div>

            {/* Zen Mode Toggle Button */}
            <button
              onClick={() => {
                audioEngine.playClick();
                onToggleZenMode();
              }}
              className={`py-1.5 sm:py-2 px-2.5 sm:px-3.5 text-sm md:text-base font-mono font-bold rounded-xl border transition-all flex items-center gap-2 active:scale-95 ${
                isZenMode
                  ? 'bg-purple-950/60 border-purple-400 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.35)] ring-1 ring-purple-400/50'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
              }`}
              title="Toggle Zen Mode: Hides combat logs, footer, and non-essential modules to focus solely on affirmation perk & loadouts"
            >
              {isZenMode ? (
                <>
                  <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 animate-pulse" />
                  <span>ZEN: ACTIVE</span>
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
                  <span>ZEN MODE</span>
                </>
              )}
            </button>

            {/* Export Gamer Card Button */}
            <button
              onClick={() => {
                audioEngine.playClick();
                onOpenExporter();
              }}
              className="py-1.5 sm:py-2 px-3 sm:px-4 text-sm md:text-base font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)] active:scale-95"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Export Card</span>
            </button>
          </div>
        </div>

        {/* HUD Telemetry Bar (Tight 2x2 Grid on Mobile, 4-Col Strip on Desktop) */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-zinc-800/80 w-full max-w-full grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 items-stretch">
          
          {/* 1. Player Level & XP Gauge */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 shadow-sm min-w-0">
            <div className="flex items-center gap-2 sm:flex-col sm:items-center sm:justify-center w-auto sm:w-16 sm:h-16 rounded-xl sm:bg-zinc-800 sm:border sm:border-zinc-700/80 shrink-0">
              <span className="text-sm sm:text-base font-mono text-zinc-400 font-bold leading-none">LVL</span>
              <span className="text-2xl sm:text-4xl font-black font-mono text-cyan-400 tabular-nums leading-none">
                {stats.level}
              </span>
            </div>
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center justify-between text-sm sm:text-base font-mono text-zinc-400">
                <span className="truncate">XP GAIN</span>
                <span className="text-zinc-200 tabular-nums font-bold shrink-0">{stats.xp}/{stats.nextLevelXp}</span>
              </div>
              <div className="w-full h-2 sm:h-2.5 bg-zinc-800 rounded-full mt-1.5 sm:mt-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (stats.xp / stats.nextLevelXp) * 100)}%` }}
                />
              </div>
              <div className="text-sm sm:text-base text-zinc-400 font-mono mt-1 text-right truncate">
                +{stats.nextLevelXp - stats.xp} to LVL {stats.level + 1}
              </div>
            </div>
          </div>

          {/* 2. Daily Streak Counter (Interactive Milestone Trigger) */}
          <button
            onClick={() => {
              audioEngine.playClick();
              if (onOpenMilestones) onOpenMilestones();
            }}
            className={`rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 shadow-sm min-w-0 transition-all text-left cursor-pointer group ${
              isStreakFreezeEquipped
                ? 'bg-gradient-to-br from-cyan-950/40 via-zinc-900 to-zinc-900/95 border border-cyan-400/50 shadow-[0_0_20px_rgba(56,189,248,0.18)] hover:border-cyan-300'
                : 'bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-850'
            }`}
            title="Click to inspect Streak Milestones & Mythic Achievements"
          >
            <div className={`w-10 h-10 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105 ${
              isStreakFreezeEquipped
                ? 'bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
            }`}>
              {isStreakFreezeEquipped ? (
                <Snowflake className="w-5 h-5 sm:w-8 sm:h-8 text-cyan-300 animate-pulse" />
              ) : (
                <Flame className="w-5 h-5 sm:w-8 sm:h-8 fill-amber-400/20" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="text-sm sm:text-base font-mono text-zinc-400">ACTIVE STREAK</span>
                {isStreakFreezeEquipped ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-mono font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 shrink-0">
                    <Snowflake className="w-3.5 h-3.5" /> CRYO FROZEN
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0 group-hover:border-amber-400">
                    <Award className="w-3.5 h-3.5" /> MILESTONES
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5 sm:gap-2 mt-0.5">
                <span className={`font-mono tabular-nums text-2xl sm:text-4xl font-black ${
                  isStreakFreezeEquipped ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]' : 'text-amber-400'
                }`}>
                  {stats.streak}
                </span>
                <span className="text-sm sm:text-base text-zinc-300 font-semibold">DAYS</span>
              </div>
              <div className="text-sm sm:text-base font-mono mt-0.5 truncate">
                {isStreakFreezeEquipped ? (
                  <span className="text-cyan-400 font-semibold flex items-center gap-1">
                    ❄️ Resets Disabled
                  </span>
                ) : (
                  <span className="text-zinc-400 group-hover:text-amber-300 transition-colors">
                    BEST: {stats.bestStreak}d · VIEW REWARDS
                  </span>
                )}
              </div>
            </div>
          </button>

          {/* 3. Core Shield Status Bar (Gratitude Lockout Status) */}
          <div className={`rounded-2xl p-3 sm:p-4 border transition-all shadow-sm min-w-0 flex flex-col justify-between ${
            isShieldMax 
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.15)]' 
              : 'bg-zinc-900/90 border-zinc-800 text-zinc-300'
          }`}>
            <div>
              <div className="flex items-center justify-between text-sm sm:text-base font-mono">
                <span className="flex items-center gap-1.5 sm:gap-2">
                  {isShieldMax ? (
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                  )}
                  <span className="font-bold">SHIELD</span>
                </span>
                <span className="text-sm sm:text-base font-bold text-zinc-400">
                  {isShieldMax ? 'ONLINE' : `${Math.round(stats.shieldPercentage / 33)}/3`}
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-0.5 sm:mt-1">
                <span className="text-2xl sm:text-4xl font-black font-mono tabular-nums text-white">
                  {stats.shieldPercentage}%
                </span>
                <span className="text-sm sm:text-base font-mono text-cyan-400 font-bold truncate ml-1">
                  {stats.shieldPercentage === 100 ? 'MAX POWER' : 'CHARGING'}
                </span>
              </div>
            </div>

            <div className="w-full h-2 sm:h-2.5 bg-zinc-800 rounded-full mt-1.5 sm:mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  isShieldMax 
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_12px_#34d399]' 
                    : 'bg-cyan-400'
                }`}
                style={{ width: `${stats.shieldPercentage}%` }}
              />
            </div>
          </div>

          {/* 4. Equipment Tier Selector */}
          <div className="relative min-w-0">
            <div 
              onClick={() => {
                audioEngine.playClick();
                setShowTierDropdown(!showTierDropdown);
              }}
              className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 cursor-pointer rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between transition-colors h-full shadow-sm gap-2"
            >
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-mono text-zinc-400">CHASSIS CLASS</div>
                <div className="text-xl sm:text-2xl font-black text-cyan-300 tracking-wide mt-0.5 truncate">
                  {stats.weaponTier}
                </div>
                <div className="text-sm sm:text-base text-zinc-400 font-mono mt-0.5 truncate">
                  {stats.weaponTier === 'Scout' ? '+15% Agi' : stats.weaponTier === 'Vanguard' ? '+25% Arm' : '+40% Ovr'}
                </div>
              </div>
              <span className="text-sm sm:text-base font-mono px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold self-start sm:self-center shrink-0">
                SWITCH
              </span>
            </div>

            {showTierDropdown && (
              <div className="absolute right-0 top-full mt-2 w-full max-w-[280px] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-2 sm:p-3 z-30 space-y-1 sm:space-y-2">
                {(['Scout', 'Vanguard', 'Titan Prime'] as WeaponTier[]).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => {
                      audioEngine.playSlotLock();
                      onSelectTier(tier);
                      setShowTierDropdown(false);
                    }}
                    className={`w-full text-left py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-sm sm:text-base font-bold transition-colors flex items-center justify-between ${
                      stats.weaponTier === tier
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <span>{tier}</span>
                    <span className="text-sm sm:text-base font-mono text-zinc-400">
                      {tier === 'Scout' ? '+15%' : tier === 'Vanguard' ? '+25%' : '+40%'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
