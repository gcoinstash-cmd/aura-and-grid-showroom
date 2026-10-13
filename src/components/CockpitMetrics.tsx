import React from 'react';

export interface CockpitMetricsProps {
  className?: string;
  isCompact?: boolean;
}

export const CockpitMetrics: React.FC<CockpitMetricsProps> = ({
  className = '',
  isCompact: _isCompact = true
}) => {
  return (
    <section className={`w-full font-sans ${className}`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm w-full">
        {/* CARD 1: $25.0M (ASC 350-40 REPLACEMENT CEILING) */}
        <div
          className="flex flex-col justify-between p-4 rounded-2xl border border-white/10 hover:border-purple-400/40 transition-all bg-[#111724]/80 backdrop-blur-xl shadow-[0_0_25px_-5px_rgba(168,85,247,0.18)] group cursor-default"
          title="Enterprise ASC 350-40 Replacement Ceiling ($25.00M — 200 Active Units @ $125,000 ceiling per unit)"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-bold tracking-wider uppercase text-purple-300 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/30">
              Enterprise
            </span>
            <span className="text-sm tracking-tight text-slate-300 font-semibold truncate">
              ASC 350 Ceiling
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-purple-300 to-purple-400 bg-clip-text text-transparent block">
              $25.0M
            </span>
            <span className="text-sm text-slate-300 hidden sm:inline font-medium">
              200 Units
            </span>
          </div>
        </div>

        {/* CARD 2: $9.00M (RETAIL MONRONEY SUM) */}
        <div
          className="flex flex-col justify-between p-4 rounded-2xl border border-white/10 hover:border-emerald-400/40 transition-all bg-[#111724]/80 backdrop-blur-xl shadow-[0_0_25px_-5px_rgba(16,185,129,0.18)] group cursor-default"
          title="Retail Monroney Sum ($9.00M — 200 Units @ $45,000 baseline per unit)"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-bold tracking-wider uppercase text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Monroney
            </span>
            <span className="text-sm tracking-tight text-slate-300 font-semibold truncate">
              Retail Sum
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold tracking-tight text-emerald-400 block">
              $9.00M
            </span>
            <span className="text-sm text-slate-300 hidden sm:inline font-medium">
              $45K / Unit
            </span>
          </div>
        </div>

        {/* CARD 3: $3M-$5M (APA LIQUIDITY BAND) */}
        <div
          className="flex flex-col justify-between p-4 rounded-2xl border border-white/10 hover:border-amber-400/40 transition-all bg-[#111724]/80 backdrop-blur-xl shadow-[0_0_25px_-5px_rgba(245,158,11,0.18)] group cursor-default"
          title="APA Buyout Floor Baseline ($15,000–$25,000 target liquidity band per unit; $3.0M–$5.0M across 200 units)"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-bold tracking-wider uppercase text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              Liquidity {/* [audit-badge-exempt] */}
            </span>
            <span className="text-sm tracking-tight text-slate-300 font-semibold truncate">
              APA Floor Band
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold tracking-tight text-amber-400 block">
              $3M–$5M
            </span>
            <span className="text-sm text-slate-300 hidden sm:inline font-medium">
              $15K–$25K
            </span>
          </div>
        </div>

        {/* CARD 4: $2.19M (SENIOR ARCHITECT FLOOR) */}
        <div
          className="flex flex-col justify-between p-4 rounded-2xl border border-white/10 hover:border-rose-400/40 transition-all bg-[#111724]/80 backdrop-blur-xl shadow-[0_0_25px_-5px_rgba(244,63,94,0.18)] group cursor-default"
          title="ASC 350-40 Factory Build Cost Reserve Floor ($2,189,800 Capitalized Dev Floor — 20,000 Engineering Hours @ $109.49/hr)"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-bold tracking-wider uppercase text-rose-300 bg-rose-500/15 px-2.5 py-0.5 rounded-full border border-rose-500/30">
              Reserve
            </span>
            <span className="text-sm tracking-tight text-slate-300 font-semibold truncate">
              Architect Floor
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold tracking-tight text-rose-400 block">
              $2.19M
            </span>
            <span className="text-sm text-slate-300 hidden sm:inline font-medium">
              20,000 Hrs
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CockpitMetrics;
