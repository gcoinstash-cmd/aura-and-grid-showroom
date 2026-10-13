import React from 'react';
import { Shield, Droplets, Gauge } from 'lucide-react';

interface SuspensionDiagramProps {
  speedMph: number;
  articulationAngleDeg: number;
  frontValve: 'OPEN' | 'CLOSED';
  rearValve: 'OPEN' | 'CLOSED';
  frontPressureMpa: number;
  rearPressureMpa: number;
  wheelStroke: {
    fl: number;
    fr: number;
    rl: number;
    rr: number;
  };
  rollStiffnessNmPerDeg: number;
}

export const SuspensionDiagram: React.FC<SuspensionDiagramProps> = ({
  speedMph,
  articulationAngleDeg,
  frontValve,
  rearValve,
  frontPressureMpa,
  rearPressureMpa,
  wheelStroke,
  rollStiffnessNmPerDeg,
}) => {
  // Normalize stroke values for visual SVG offsets (-120 to +120 px approx)
  const flOffset = (wheelStroke.fl / 320) * 45;
  const frOffset = (wheelStroke.fr / 320) * 45;
  const rlOffset = (wheelStroke.rl / 320) * 45;
  const rrOffset = (wheelStroke.rr / 320) * 45;

  const isBypassOpen = frontValve === 'OPEN';

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            E-KDSS Kinetic Hydraulic Suspension Architecture
          </h2>
          <p className="text-xs text-slate-400">
            GA-F Chassis Bi-directional Cross-Interlinked Double-Acting Cylinders & Accumulator Circuit
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Front Circuit:</span>
            <span className="font-mono font-bold text-cyan-300">{frontPressureMpa.toFixed(2)} MPa</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Rear Circuit:</span>
            <span className="font-mono font-bold text-cyan-300">{rearPressureMpa.toFixed(2)} MPa</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Schematic */}
      <div className="relative w-full h-[320px] bg-slate-900/60 rounded-xl border border-slate-800/70 p-2 flex items-center justify-center">
        <svg
          viewBox="0 0 900 360"
          className="w-full h-full max-h-[310px] select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            <linearGradient id="fluidFlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>

            <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="glowAmber" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid Lines */}
          <g opacity="0.15" stroke="#64748b" strokeWidth="0.5">
            <line x1="50" y1="60" x2="850" y2="60" />
            <line x1="50" y1="120" x2="850" y2="120" />
            <line x1="50" y1="180" x2="850" y2="180" />
            <line x1="50" y1="240" x2="850" y2="240" />
            <line x1="50" y1="300" x2="850" y2="300" />
            <line x1="225" y1="40" x2="225" y2="320" />
            <line x1="450" y1="40" x2="450" y2="320" />
            <line x1="675" y1="40" x2="675" y2="320" />
          </g>

          {/* Central Ladder Chassis Rails (GA-F Steel Box Frame) */}
          <rect x="220" y="90" width="460" height="18" rx="4" fill="url(#chassisGrad)" stroke="#475569" strokeWidth="1.5" />
          <rect x="220" y="250" width="460" height="18" rx="4" fill="url(#chassisGrad)" stroke="#475569" strokeWidth="1.5" />
          <rect x="360" y="108" width="16" height="142" rx="2" fill="#334155" opacity="0.7" />
          <rect x="520" y="108" width="16" height="142" rx="2" fill="#334155" opacity="0.7" />

          <text x="450" y="185" textAnchor="middle" fill="#64748b" className="text-xs font-mono font-bold tracking-widest">
            GA-F FULL BOXED FRAME
          </text>

          {/* Hydraulic Cross-Piping Lines */}
          {/* Circuit Line A: Front Upper -> Rear Lower */}
          <path
            d="M 170 120 C 300 120, 420 220, 730 220"
            fill="none"
            stroke={isBypassOpen ? '#06b6d4' : '#1e3a5f'}
            strokeWidth="3.5"
            strokeDasharray={isBypassOpen ? '6,3' : 'none'}
            className={isBypassOpen ? 'animate-pulse' : ''}
            filter={isBypassOpen ? 'url(#glowCyan)' : undefined}
          />

          {/* Circuit Line B: Front Lower -> Rear Upper */}
          <path
            d="M 170 238 C 300 238, 420 138, 730 138"
            fill="none"
            stroke={isBypassOpen ? '#38bdf8' : '#1e3a5f'}
            strokeWidth="3.5"
            strokeDasharray={isBypassOpen ? '6,3' : 'none'}
            className={isBypassOpen ? 'animate-pulse' : ''}
            filter={isBypassOpen ? 'url(#glowCyan)' : undefined}
          />

          {/* FRONT SUSPENSION (Left: Double Wishbone + E-KDSS Hydraulic Cylinder) */}
          {/* Front Stabilizer Bar */}
          <path
            d={`M 140 ${80 - flOffset} Q 190 90, 240 100 T 240 258 Q 190 268, 140 ${278 - frOffset}`}
            fill="none"
            stroke={isBypassOpen ? '#fbbf24' : '#3b82f6'}
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Front Hydraulic Cylinder Unit (Left side) */}
          <g transform={`translate(150, ${95 - flOffset * 0.5})`}>
            {/* Cylinder Body */}
            <rect x="0" y="0" width="30" height="50" rx="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
            {/* Piston Rod */}
            <line x1="15" y1="-15" x2="15" y2="10" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
            {/* Pressure port */}
            <circle cx="15" cy="25" r="4" fill={isBypassOpen ? '#22d3ee' : '#334155'} />
            <text x="36" y="28" fill="#94a3b8" className="text-xs font-mono font-bold">Front Cyl</text>
          </g>

          {/* Front Right Rigid Link */}
          <g transform={`translate(150, ${215 - frOffset * 0.5})`}>
            <rect x="0" y="0" width="16" height="40" rx="2" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
            <text x="22" y="24" fill="#64748b" className="text-xs font-mono">Rigid Link</text>
          </g>

          {/* REAR SUSPENSION (Multi-Link Rigid Axle with Inverted E-KDSS Cylinder) */}
          {/* Rear Solid Axle Bar */}
          <line
            x1="760"
            y1={75 - rlOffset}
            x2="760"
            y2={285 - rrOffset}
            stroke="#475569"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Rear Stabilizer Bar */}
          <path
            d={`M 750 ${90 - rlOffset} Q 700 110, 660 120 T 660 238 Q 700 248, 750 ${268 - rrOffset}`}
            fill="none"
            stroke={isBypassOpen ? '#fbbf24' : '#3b82f6'}
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Rear Hydraulic Cylinder Unit */}
          <g transform={`translate(710, ${180 - rrOffset * 0.5})`}>
            <rect x="0" y="0" width="28" height="48" rx="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
            <line x1="14" y1="40" x2="14" y2="65" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
            <circle cx="14" cy="24" r="4" fill={isBypassOpen ? '#22d3ee' : '#334155'} />
            <text x="-55" y="28" fill="#94a3b8" className="text-xs font-mono font-bold">Rear Cyl</text>
          </g>

          {/* Central Accumulator Valve Module (Between Chassis Rails) */}
          <g transform="translate(415, 125)">
            <rect
              x="0"
              y="0"
              width="70"
              height="110"
              rx="8"
              fill="#0f172a"
              stroke={isBypassOpen ? '#f59e0b' : '#3b82f6'}
              strokeWidth="2.5"
              filter={isBypassOpen ? 'url(#glowAmber)' : undefined}
            />
            {/* Valve Solenoid A */}
            <circle cx="24" cy="35" r="12" fill={isBypassOpen ? '#10b981' : '#1e293b'} stroke="#64748b" strokeWidth="1.5" />
            <text x="24" y="39" textAnchor="middle" fill="#fff" className="text-xs font-mono font-bold">A</text>
            
            {/* Valve Solenoid B */}
            <circle cx="46" cy="75" r="12" fill={isBypassOpen ? '#10b981' : '#1e293b'} stroke="#64748b" strokeWidth="1.5" />
            <text x="46" y="79" textAnchor="middle" fill="#fff" className="text-xs font-mono font-bold">B</text>

            <text x="35" y="103" textAnchor="middle" fill={isBypassOpen ? '#fbbf24' : '#94a3b8'} className="text-xs font-mono font-bold">
              {isBypassOpen ? 'BYPASS' : 'LOCKED'}
            </text>
          </g>

          {/* 4 WHEEL HUBS & TIRES WITH ARTICULATION OFFSETS */}
          {/* Front Left Wheel */}
          <g transform={`translate(80, ${50 - flOffset})`}>
            <rect x="0" y="0" width="38" height="60" rx="8" fill="#020617" stroke={flOffset > 10 ? '#10b981' : '#475569'} strokeWidth="3" />
            {/* Wheel Hub Center */}
            <circle cx="19" cy="30" r="6" fill="#38bdf8" />
            <text x="19" y="-8" textAnchor="middle" fill="#f8fafc" className="text-xs font-mono font-bold">
              FL: {wheelStroke.fl > 0 ? `+${wheelStroke.fl.toFixed(0)}` : wheelStroke.fl.toFixed(0)}mm
            </text>
          </g>

          {/* Front Right Wheel */}
          <g transform={`translate(80, ${250 - frOffset})`}>
            <rect x="0" y="0" width="38" height="60" rx="8" fill="#020617" stroke={frOffset < -10 ? '#ef4444' : '#475569'} strokeWidth="3" />
            <circle cx="19" cy="30" r="6" fill="#38bdf8" />
            <text x="19" y="80" textAnchor="middle" fill="#f8fafc" className="text-xs font-mono font-bold">
              FR: {wheelStroke.fr > 0 ? `+${wheelStroke.fr.toFixed(0)}` : wheelStroke.fr.toFixed(0)}mm
            </text>
          </g>

          {/* Rear Left Wheel */}
          <g transform={`translate(780, ${45 - rlOffset})`}>
            <rect x="0" y="0" width="38" height="60" rx="8" fill="#020617" stroke={rlOffset > 10 ? '#10b981' : '#475569'} strokeWidth="3" />
            <circle cx="19" cy="30" r="6" fill="#38bdf8" />
            <text x="19" y="-8" textAnchor="middle" fill="#f8fafc" className="text-xs font-mono font-bold">
              RL: {wheelStroke.rl > 0 ? `+${wheelStroke.rl.toFixed(0)}` : wheelStroke.rl.toFixed(0)}mm
            </text>
          </g>

          {/* Rear Right Wheel */}
          <g transform={`translate(780, ${255 - rrOffset})`}>
            <rect x="0" y="0" width="38" height="60" rx="8" fill="#020617" stroke={rrOffset < -10 ? '#ef4444' : '#475569'} strokeWidth="3" />
            <circle cx="19" cy="30" r="6" fill="#38bdf8" />
            <text x="19" y="80" textAnchor="middle" fill="#f8fafc" className="text-xs font-mono font-bold">
              RR: {wheelStroke.rr > 0 ? `+${wheelStroke.rr.toFixed(0)}` : wheelStroke.rr.toFixed(0)}mm
            </text>
          </g>

          {/* Front Axle Centerline Label */}
          <text x="99" y="185" textAnchor="middle" fill="#64748b" className="text-xs font-mono">
            FRONT IFS
          </text>

          {/* Rear Axle Centerline Label */}
          <text x="799" y="185" textAnchor="middle" fill="#64748b" className="text-xs font-mono">
            REAR 4-LINK
          </text>
        </svg>

        {/* Floating Real-Time Status Legend inside canvas */}
        <div className="absolute bottom-2 left-3 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isBypassOpen ? 'bg-amber-400' : 'bg-blue-500'}`}></span>
            <span className="text-slate-300">
              Sway Bar Status: <strong className={isBypassOpen ? 'text-amber-400' : 'text-blue-400'}>{isBypassOpen ? 'DISCONNECTED (FREE FLUID)' : 'RIGID TIED (CORNERING)'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            <span>Roll Stiffness: <strong className="text-emerald-300 font-mono">{rollStiffnessNmPerDeg.toFixed(0)} Nm/°</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Angle: <strong className="text-indigo-300 font-mono">{articulationAngleDeg > 0 ? `+${articulationAngleDeg}` : articulationAngleDeg}°</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
