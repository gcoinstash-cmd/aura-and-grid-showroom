import React, { useEffect, useState } from 'react';
import { TelemetryState } from './types/telemetry';
import { telemetryEngine } from './services/telemetryEngine';
import { TopBar } from './components/TopBar';
import { ChassisVisualizer } from './components/ChassisVisualizer';
import { CockpitHUD } from './components/CockpitHUD';
import { TradeDressModal } from './components/TradeDressModal';
import { DealershipTiersModal } from './components/DealershipTiersModal';
import {
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Award,
  Key,
  Flame,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  const [telemetry, setTelemetry] = useState<TelemetryState>(telemetryEngine.getState());
  const [activeSection, setActiveSection] = useState<string>('showroom');
  const [isTradeDressOpen, setIsTradeDressOpen] = useState<boolean>(false);
  const [isDealershipOpen, setIsDealershipOpen] = useState<boolean>(false);
  const [selectedDealershipTier, setSelectedDealershipTier] = useState<'demo' | 'standard' | 'monopoly'>('standard');

  useEffect(() => {
    telemetryEngine.start();
    const unsubscribe = telemetryEngine.subscribe((next) => {
      setTelemetry(next);
    });
    return () => {
      unsubscribe();
      telemetryEngine.stop();
    };
  }, []);

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenTier = (tier: 'demo' | 'standard' | 'monopoly') => {
    setSelectedDealershipTier(tier);
    setIsDealershipOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#060709] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 3-Zone Top Navigation */}
      <TopBar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onOpenTradeDress={() => setIsTradeDressOpen(true)}
        onOpenDealership={() => {
          setSelectedDealershipTier('standard');
          setIsDealershipOpen(true);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-20">
        {/* 1. Hero & Interactive 3D Showroom Viewport */}
        <section id="showroom" className="w-full space-y-6 pt-16 sm:pt-20">
          {/* Header Title Block */}
          <div className="w-full max-w-7xl block space-y-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-emerald-400 font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>TRACK 2 HYPERCAR FLAGSHIP</span>
              <span aria-hidden="true">·</span>
              <span>512-QUBIT TOPOLOGICAL CORE</span>
              <span aria-hidden="true">·</span>
              <span>SUB-PICOSECOND ARBITRAGE</span>
            </div>

            <h1 className="text-[clamp(1.75rem,3.5vw,3rem)] font-black tracking-tight leading-tight uppercase w-full whitespace-normal text-white font-display drop-shadow-md">
              <span className="inline-block whitespace-nowrap">CHRONO-ARBITRAGE:</span>{' '}
              <span className="inline-block whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                QUANTUM MONOCOQUE
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-zinc-200 w-full max-w-5xl leading-relaxed font-normal">
              An optical-grade crystalline monocoque housing a 12.4 mK sapphire cryostat.
              Coherent emerald and amber laser conduits pulse through exposed Grade 5 titanium
              suspension wishbones directly into twin thermodynamic carbon fiber diffusers.
            </p>

            {/* Primary Live Metrics Banner (Enlarged bold text-xl font-mono with vibrant glowing color accents) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-2xl font-mono mt-4">
              <div className="space-y-1">
                <span className="text-xs text-zinc-400 uppercase tracking-wider block font-bold">
                  Accumulated Alpha
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums drop-shadow-[0_0_12px_rgba(16,185,129,0.45)]">
                  ${telemetry.accumulatedAlphaUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span className="text-xs text-emerald-400/90 font-sans block">
                  Live sub-picosecond capture
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-zinc-400 uppercase tracking-wider block font-bold">
                  Quantum Coherence
                </span>
                <div className="text-xl sm:text-2xl font-black text-teal-300 tabular-nums drop-shadow-[0_0_12px_rgba(45,212,191,0.45)]">
                  {telemetry.quantum.coherenceRate.toFixed(3)}%
                </div>
                <span className="text-xs text-teal-400/90 font-sans block">
                  512 topological qubits active
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-zinc-400 uppercase tracking-wider block font-bold">
                  Aero Downforce
                </span>
                <div className="text-xl sm:text-2xl font-black text-amber-400 tabular-nums drop-shadow-[0_0_12px_rgba(245,158,11,0.45)]">
                  {telemetry.aero.downforceKgf} kgf
                </div>
                <span className="text-xs text-amber-400/90 font-sans block">
                  Ground-effect venturi lock
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-zinc-400 uppercase tracking-wider block font-bold">
                  Cryo Temperature
                </span>
                <div className="text-xl sm:text-2xl font-black text-sky-400 tabular-nums drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]">
                  {telemetry.quantum.cryoTempMK.toFixed(2)} mK
                </div>
                <span className="text-xs text-sky-400/90 font-sans block">
                  Dilution refrigerator core
                </span>
              </div>
            </div>
          </div>

          {/* Interactive 3D Canvas Visualizer */}
          <ChassisVisualizer telemetry={telemetry} />

          {/* Feature Highlight Kicker Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 shrink-0">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="text-base font-bold text-white">Longitudinal Dilution Cryostat</div>
                <div className="text-sm text-zinc-300 leading-relaxed font-normal">
                  Centrally aligned 512-qubit topological matrix maintained at 12.4 mK within a sapphire crystal vacuum manifold.
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-800/60 text-amber-400 shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="text-base font-bold text-white">Dual 532nm / 589nm Conduits</div>
                <div className="text-sm text-zinc-300 leading-relaxed font-normal">
                  Pulsing emerald and amber optical laser waveguides routing photons through titanium suspension wishbones.
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-sky-950/80 border border-sky-800/60 text-sky-400 shrink-0">
                <Flame className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="text-base font-bold text-white">Thermodynamic Carbon Diffusers</div>
                <div className="text-sm text-zinc-300 leading-relaxed font-normal">
                  Stepped venturi underfloor channels producing up to 2,120 kgf downforce while rejecting helium thermal dissipation.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Cockpit Visual Telemetry & HUD Section */}
        <section id="telemetry" className="space-y-8 pt-6 w-full">
          <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="text-xs sm:text-sm font-mono text-emerald-400 font-bold uppercase tracking-wider">
                COCKPIT TELEMETRY ARCHITECTURE
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white font-display tracking-tight leading-tight whitespace-normal">
                Multi-Panel Quantum & Aero Telemetry HUD
              </h2>
            </div>
            <div className="text-xs sm:text-sm font-mono text-zinc-300 flex items-center gap-3 shrink-0 whitespace-nowrap pt-1 md:pt-0">
              <span>Status: <strong className="text-emerald-400 font-bold">ONLINE (0.12ps Drift)</strong></span>
              <span aria-hidden="true">·</span>
              <span>Bus: <strong className="text-white font-bold">420.8 THz</strong></span>
            </div>
          </div>

          <CockpitHUD telemetry={telemetry} />
        </section>

        {/* 3. Institutional Engineering Specifications (Upgraded to text-lg with high-contrast text-zinc-200) */}
        <section id="specifications" className="space-y-8 pt-6">
          <div className="border-b border-slate-800 pb-5">
            <div className="text-xs sm:text-sm font-mono text-emerald-400 font-bold uppercase tracking-wider">
              FLAGSHIP ENGINEERING BLUEPRINT
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-display">
              Chassis Mechanical & Quantum Specifications
            </h2>
            <p className="text-base sm:text-lg text-zinc-200 mt-2 max-w-3xl leading-relaxed">
              Precision design parameters developed for Ghost FactoryOS Dealership Fleet Tier 2. Fully certified under institutional clean-room standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Spec 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3.5 shadow-md">
              <div className="text-xs sm:text-sm font-mono text-emerald-400 font-bold">
                01. MONOCOQUE CHASSIS
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                Optical-Grade Polymethyl Matrix
              </h3>
              <p className="text-base text-zinc-200 leading-relaxed font-normal">
                Seamless transparent cockpit canopy with 99.4% light transmission and internal laser waveguide grooves, bonded to a Toray T1100G carbon tub.
              </p>
              <div className="pt-3 border-t border-slate-800/80 font-mono text-xs sm:text-sm text-zinc-300 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Torsional Rigidity:</span>
                  <span className="text-white font-bold">68,500 Nm/deg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Kerb Weight:</span>
                  <span className="text-white font-bold">1,140 kg</span>
                </div>
              </div>
            </div>

            {/* Spec 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3.5 shadow-md">
              <div className="text-xs sm:text-sm font-mono text-emerald-400 font-bold">
                02. QUANTUM CRYOSTAT
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                Sapphire Dilution Cylinder
              </h3>
              <p className="text-base text-zinc-200 leading-relaxed font-normal">
                Helium-3/Helium-4 closed-loop dilution refrigerator maintaining 512 topological qubits at 12.4 mK with vibration-isolated magnetic dampening.
              </p>
              <div className="pt-3 border-t border-slate-800/80 font-mono text-xs sm:text-sm text-zinc-300 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Base Temperature:</span>
                  <span className="text-sky-300 font-bold">12.38 mK</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Qubit Modality:</span>
                  <span className="text-white font-bold">Topological Majorana</span>
                </div>
              </div>
            </div>

            {/* Spec 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3.5 shadow-md">
              <div className="text-xs sm:text-sm font-mono text-emerald-400 font-bold">
                03. OPTICAL CONDUITS
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                Coherent Dual-Spectrum Conduits
              </h3>
              <p className="text-base text-zinc-200 leading-relaxed font-normal">
                532 nm (emerald) for sub-picosecond packet arbitration and 589 nm (gold) for cryogenic state synchrony across Grade 5 Ti-6Al-4V wishbones.
              </p>
              <div className="pt-3 border-t border-slate-800/80 font-mono text-xs sm:text-sm text-zinc-300 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Optical Output:</span>
                  <span className="text-emerald-400 font-bold">102.7 W Combined</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Attenuation:</span>
                  <span className="text-white font-bold">&lt; 0.08 dB/km</span>
                </div>
              </div>
            </div>

            {/* Spec 4 */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3.5 shadow-md">
              <div className="text-xs sm:text-sm font-mono text-emerald-400 font-bold">
                04. AERODYNAMIC VENTURI
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                Stepped Carbon Diffusers
              </h3>
              <p className="text-base text-zinc-200 leading-relaxed font-normal">
                Twin stepped-throat underfloor venturi tunnels equipped with dynamic servo-actuated diffusers (8° to 24°) delivering up to 2,120 kgf at 380 km/h.
              </p>
              <div className="pt-3 border-t border-slate-800/80 font-mono text-xs sm:text-sm text-zinc-300 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Max Downforce:</span>
                  <span className="text-amber-400 font-bold">2,120 kgf</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Drag Factor (Cd):</span>
                  <span className="text-white font-bold">0.284</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Dealership Fleet Acquisition Tiers (Track 2 Flagship Anchors Confirmed) */}
        <section id="fleet-vault" className="space-y-8 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="text-xs sm:text-sm font-mono text-emerald-400 font-bold uppercase tracking-wider">
                DEALERSHIP FLEET PROCUREMENT
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-display">
                Flagship Inventory & Commercial Asset Transfer Tiers
              </h2>
            </div>
            <button
              onClick={() => setIsTradeDressOpen(true)}
              className="text-sm font-mono text-amber-400 hover:text-amber-300 flex items-center gap-2 underline underline-offset-4 font-bold"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Review USPTO Trade-Dress Patent Filing</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: $1,500 Evaluation License */}
            <div className="rounded-2xl p-7 bg-slate-900/50 border border-slate-800 flex flex-col justify-between space-y-6 hover:border-slate-700 transition-colors shadow-lg">
              <div className="space-y-3.5">
                <div className="text-xs sm:text-sm font-mono text-zinc-400 uppercase tracking-wider font-bold">
                  Tier 2 · Evaluation License
                </div>
                <h3 className="text-2xl font-extrabold text-white leading-tight font-display">
                  $1,500 Evaluation License
                </h3>
                <div className="text-4xl font-mono font-black text-white">
                  $1,500
                  <span className="text-sm font-normal text-zinc-400 ml-1.5">USD</span>
                </div>
                <p className="text-base text-zinc-200 leading-relaxed font-normal">
                  30-day interactive simulation runtime, deterministic market vector sandbox, and basic CAD architectural preview.
                </p>
                <div className="pt-4 border-t border-slate-800/80 space-y-2.5 text-sm text-zinc-200">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Sub-picosecond simulated market feeds</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>3D transparent chassis telemetry console</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Single-seat research & evaluation grant</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenTier('demo')}
                className="w-full py-3 text-sm font-mono font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors shadow-md"
              >
                Procure Evaluation License ($1,500)
              </button>
            </div>

            {/* Card 2: $14,500 Commercial APA Asset Transfer */}
            <div className="rounded-2xl p-7 bg-emerald-950/25 border border-emerald-500/80 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-emerald-950/40">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-mono font-black uppercase tracking-wider px-3.5 py-1 rounded-full bg-emerald-500 text-slate-950 shadow-md">
                RECOMMENDED DEALERSHIP STANDARD
              </div>

              <div className="space-y-3.5">
                <div className="text-xs sm:text-sm font-mono text-emerald-400 uppercase tracking-wider font-bold">
                  Tier 2 · Commercial APA
                </div>
                <h3 className="text-2xl font-extrabold text-white leading-tight font-display">
                  $14,500 Commercial APA Asset Transfer
                </h3>
                <div className="text-4xl font-mono font-black text-emerald-400">
                  $14,500
                  <span className="text-sm font-normal text-zinc-400 ml-1.5">USD</span>
                </div>
                <p className="text-base text-zinc-200 leading-relaxed font-normal">
                  Full Asset Purchase Agreement with commercial production license, manufacturing STEP CAD, and complete telemetry engine source.
                </p>
                <div className="pt-4 border-t border-slate-800/80 space-y-2.5 text-sm text-zinc-200">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Production chassis CAD (STEP / IGES)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Complete telemetry engine source code (MIT)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Commercial deployment & fabrication rights</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Aerodynamic downforce wind tunnel data</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenTier('standard')}
                className="w-full py-3 text-sm font-mono font-extrabold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-lg shadow-emerald-950/60"
              >
                Execute Commercial APA
              </button>
            </div>

            {/* Card 3: $48,500 Monopoly Vault Asset Transfer */}
            <div className="rounded-2xl p-7 bg-amber-950/25 border border-amber-500/80 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-amber-950/40">
              <div className="absolute -top-3.5 right-6 text-xs font-mono font-black uppercase tracking-wider px-3.5 py-1 rounded-full bg-amber-500 text-slate-950 shadow-md">
                EXCLUSIVE VAULT RIGHTS
              </div>

              <div className="space-y-3.5">
                <div className="text-xs sm:text-sm font-mono text-amber-400 uppercase tracking-wider font-bold">
                  Tier 2 · Monopoly Vault
                </div>
                <h3 className="text-2xl font-extrabold text-white leading-tight font-display">
                  $48,500 Monopoly Vault Asset Transfer (USPTO Design Patent Transfer)
                </h3>
                <div className="text-4xl font-mono font-black text-amber-400">
                  $48,500
                  <span className="text-sm font-normal text-zinc-400 ml-1.5">USD</span>
                </div>
                <p className="text-base text-zinc-200 leading-relaxed font-normal">
                  Perpetual exclusive IP assignment, USPTO trade-dress transfer, clean-room audit warranty, and complete monopoly lockout.
                </p>
                <div className="pt-4 border-t border-slate-800/80 space-y-2.5 text-sm text-zinc-200">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>100% Perpetual exclusive IP assignment</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Full USPTO 35 U.S.C. § 171 Design Patent deed</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Clean-Room Audit certificate & zero GPL warrant</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Master cryptographic escrow key handover</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenTier('monopoly')}
                className="w-full py-3 text-sm font-mono font-extrabold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-lg shadow-amber-950/60"
              >
                Lock Monopoly Vault ($48,500)
              </button>
            </div>
          </div>
        </section>

        {/* 5. Trade-Dress Defense & IP Governance Banner */}
        <section className="p-8 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-emerald-400 font-bold uppercase">
              <Award className="w-5 h-5 text-emerald-400" />
              GHOST FACTORYOS ARCHITECTURAL CERTIFICATION
            </div>
            <h3 className="text-2xl font-bold text-white font-display">
              Institutional Trade-Dress & Clean-Room Warranty
            </h3>
            <p className="text-base text-zinc-200 max-w-3xl leading-relaxed font-normal">
              Every CHRONO-ARBITRAGE asset satisfies the 5 Monopoly Vault Criteria. Fully indemnified, clean-room developed, and ready for autonomous Antigravity assembly line ingestion.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsTradeDressOpen(true)}
              className="px-5 py-3 text-sm font-mono font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700 flex items-center gap-2 shadow-md"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Inspect IP Defense Dossier</span>
            </button>

            <button
              onClick={() => handleOpenTier('monopoly')}
              className="px-5 py-3 text-sm font-mono font-extrabold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-950/50"
            >
              <span>Monopoly Escrow</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      {/* Quiet Footer adhering strictly to Anti-Slop Guidelines */}
      <footer className="w-full border-t border-slate-800/80 bg-[#040507] mt-16 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-300 font-display">CHRONO-ARBITRAGE</span>
            <span aria-hidden="true">·</span>
            <span>Ghost FactoryOS Track 2 Hypercar Flagship</span>
            <span aria-hidden="true">·</span>
            <span>USPTO Docket #GF-CHRONO-2026-T2</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsTradeDressOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Trade-Dress Defense
            </button>
            <button
              onClick={() => handleOpenTier('standard')}
              className="hover:text-slate-300 transition-colors"
            >
              Standard APA
            </button>
            <button
              onClick={() => handleOpenTier('monopoly')}
              className="hover:text-slate-300 transition-colors text-amber-400/80 hover:text-amber-300"
            >
              Monopoly Vault
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TradeDressModal
        isOpen={isTradeDressOpen}
        onClose={() => setIsTradeDressOpen(false)}
      />

      <DealershipTiersModal
        isOpen={isDealershipOpen}
        onClose={() => setIsDealershipOpen(false)}
        defaultTierId={selectedDealershipTier}
      />
    </div>
  );
}
