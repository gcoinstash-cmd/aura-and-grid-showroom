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
        {/* CARD 1: $4.54M (RETAIL MSRP) */}
        <div
          className="flex flex-col justify-between p-4 rounded-2xl border border-white/10 hover:border-purple-400/40 transition-all bg-[#111724]/80 backdrop-blur-xl shadow-[0_0_25px_-5px_rgba(168,85,247,0.18)] group cursor-default"
          title="Retail MSRP ($4.54M — 200 Active Units)"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-bold tracking-wider uppercase text-purple-300 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/30">
              Retail
            </span>
            <span className="text-sm tracking-tight text-slate-300 font-semibold truncate">
              MSRP
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-purple-300 to-purple-400 bg-clip-text text-transparent block">
              $4.54M
            </span>
            <span className="text-sm text-slate-300 hidden sm:inline font-medium">
              200 Units
            </span>
          </div>
        </div>

        {/* CARD 2: $2.85M (DEV REPLACEMENT) */}
        <div
          className="flex flex-col justify-between p-4 rounded-2xl border border-white/10 hover:border-emerald-400/40 transition-all bg-[#111724]/80 backdrop-blur-xl shadow-[0_0_25px_-5px_rgba(16,185,129,0.18)] group cursor-default"
          title="Dev Replacement ($2.85M — Agency Build-Cost Rebuild)"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-bold tracking-wider uppercase text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Build Cost
            </span>
            <span className="text-sm tracking-tight text-slate-300 font-semibold truncate">
              Dev Replacement
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold tracking-tight text-emerald-400 block">
              $2.85M
            </span>
            <span className="text-sm text-slate-300 hidden sm:inline font-medium">
              Agency Rebuild
            </span>
          </div>
        </div>

        {/* CARD 3: $2.19M (WHOLESALE FLOOR) */}
        <div
          className="flex flex-col justify-between p-4 rounded-2xl border border-white/10 hover:border-amber-400/40 transition-all bg-[#111724]/80 backdrop-blur-xl shadow-[0_0_25px_-5px_rgba(245,158,11,0.18)] group cursor-default"
          title="Clean-Room IP ($2.19M Reserve Floor — 20,000 Engineering Hours @ $109.49/hr)"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-bold tracking-wider uppercase text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              Wholesale
            </span>
            <span className="text-sm tracking-tight text-slate-300 font-semibold truncate">
              Reserve Floor
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold tracking-tight text-amber-400 block">
              $2.19M
            </span>
            <span className="text-sm text-slate-300 hidden sm:inline font-medium">
              Architect Reserve
            </span>
          </div>
        </div>

        {/* CARD 4: $1.31M (PANIC LIQUIDATION) */}
        <div
          className="flex flex-col justify-between p-4 rounded-2xl border border-white/10 hover:border-rose-400/40 transition-all bg-[#111724]/80 backdrop-blur-xl shadow-[0_0_25px_-5px_rgba(244,63,94,0.18)] group cursor-default"
          title="Panic Liquidation ($1.31M Distressed Cash Buyout Floor)"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-bold tracking-wider uppercase text-rose-300 bg-rose-500/15 px-2.5 py-0.5 rounded-full border border-rose-500/30">
              Liquidation
            </span>
            <span className="text-sm tracking-tight text-slate-300 font-semibold truncate">
              Panic Floor
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold tracking-tight text-rose-400 block">
              $1.31M
            </span>
            <span className="text-sm text-slate-300 hidden sm:inline font-medium">
              Distressed Cash
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CockpitMetrics;
