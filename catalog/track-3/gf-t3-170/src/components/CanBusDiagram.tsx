import React from 'react';
import { Shield, Lock, Cpu, Radio, Network } from 'lucide-react';

export const CanBusDiagram: React.FC = () => {
  return (
    <div className="w-full rounded-xl border border-neutral-800 bg-neutral-900/90 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <Network className="h-5 w-5 text-amber-400" />
            Heavy Overland Dynamics Platform ES 350h High-Speed CAN-FD Security Topology
          </h3>
          <p className="text-sm text-neutral-400 mt-1">
            Hardware-enforced zero-trust authentication boundary between in-cabin quietude microcontrollers and telematics gateway.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-neutral-300">
          <span className="flex items-center gap-1.5 font-mono text-emerald-400">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
            5000 kbps CAN-FD
          </span>
          <span className="text-neutral-600">|</span>
          <span className="flex items-center gap-1.5 font-mono text-amber-400">
            <Lock className="h-4 w-4" />
            Ed25519 Signed
          </span>
        </div>
      </div>

      {/* SVG Diagram with strict 14px floor on all text */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 980 340"
          className="w-full min-w-[760px] h-auto select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background grid markings */}
          <defs>
            <linearGradient id="busGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e1e28" />
              <stop offset="100%" stopColor="#14141c" />
            </linearGradient>
          </defs>

          {/* Bus Backbone (Dual Differential Wire CAN-H / CAN-L) */}
          <line x1="60" y1="180" x2="920" y2="180" stroke="#333342" strokeWidth="8" strokeLinecap="round" />
          <line x1="60" y1="180" x2="920" y2="180" stroke="url(#busGrad)" strokeWidth="3" strokeDasharray="8 6" />

          {/* Central Bus Label - 14px font size */}
          <rect x="360" y="165" width="260" height="30" rx="6" fill="#0f0f15" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="490" y="185" textAnchor="middle" fill="#fbbf24" fontSize="14" fontWeight="700" fontFamily="JetBrains Mono">
            CAN-FD DUAL BUS (5.0 Mbps DATA)
          </text>

          {/* NODE 1: ECU-ANC-CHAMBER (0x1A4) */}
          <g transform="translate(60, 25)">
            <rect width="250" height="110" rx="10" fill="url(#cardGrad)" stroke="#2f2f3d" strokeWidth="1.5" />
            <rect x="0" y="0" width="250" height="34" rx="10" fill="#242433" />
            <text x="16" y="23" fill="#f5f5f7" fontSize="14" fontWeight="700">0x1A4 : ECU-ANC-CHAMBER</text>
            <text x="16" y="60" fill="#a1a1aa" fontSize="14">Cabin Noise Inverter (48kHz)</text>
            <text x="16" y="85" fill="#34d399" fontSize="14" fontFamily="JetBrains Mono">Ed25519 Anti-Resonance</text>
            <line x1="125" y1="110" x2="125" y2="180" stroke="#f59e0b" strokeWidth="2.5" />
            <circle cx="125" cy="180" r="5" fill="#f59e0b" />
          </g>

          {/* NODE 2: ECU-HYBRID-INV (0x2B0) */}
          <g transform="translate(365, 25)">
            <rect width="250" height="110" rx="10" fill="url(#cardGrad)" stroke="#2f2f3d" strokeWidth="1.5" />
            <rect x="0" y="0" width="250" height="34" rx="10" fill="#242433" />
            <text x="16" y="23" fill="#f5f5f7" fontSize="14" fontWeight="700">0x2B0 : ECU-HYBRID-INV</text>
            <text x="16" y="60" fill="#a1a1aa" fontSize="14">Dual-Motor Harmonic PWM</text>
            <text x="16" y="85" fill="#34d399" fontSize="14" fontFamily="JetBrains Mono">Sequence Counter Nonce</text>
            <line x1="125" y1="110" x2="125" y2="180" stroke="#f59e0b" strokeWidth="2.5" />
            <circle cx="125" cy="180" r="5" fill="#f59e0b" />
          </g>

          {/* NODE 3: ECU-ACOUSTIC-SEAL (0x3F2) */}
          <g transform="translate(670, 25)">
            <rect width="250" height="110" rx="10" fill="url(#cardGrad)" stroke="#2f2f3d" strokeWidth="1.5" />
            <rect x="0" y="0" width="250" height="34" rx="10" fill="#242433" />
            <text x="16" y="23" fill="#f5f5f7" fontSize="14" fontWeight="700">0x3F2 : ECU-ACOUSTIC-SEAL</text>
            <text x="16" y="60" fill="#a1a1aa" fontSize="14">Acoustic Glass Damping Solenoid</text>
            <text x="16" y="85" fill="#34d399" fontSize="14" fontFamily="JetBrains Mono">Sliding Window &lt;1.5ms</text>
            <line x1="125" y1="110" x2="125" y2="180" stroke="#f59e0b" strokeWidth="2.5" />
            <circle cx="125" cy="180" r="5" fill="#f59e0b" />
          </g>

          {/* BOTTOM: GF-T3-170 HSM ZERO-TRUST CRYPTOGRAPHIC CORE */}
          <g transform="translate(180, 220)">
            <rect width="620" height="100" rx="12" fill="#13141f" stroke="#10b981" strokeWidth="2" />
            <rect x="0" y="0" width="620" height="34" rx="12" fill="#182322" />
            <text x="24" y="23" fill="#34d399" fontSize="15" fontWeight="700">
              GF-T3-170 ZERO-TRUST HSM CORE &amp; TELEMATICS GATEWAY
            </text>
            <text x="24" y="60" fill="#f5f5f7" fontSize="14">
              Microchip ATECC608B / OPTIGA Trust X Cryptographic Engine
            </text>
            <text x="24" y="84" fill="#a1a1aa" fontSize="14" fontFamily="JetBrains Mono">
              Continuous SHA-256 Merkle Ledger Pipeline · 100k msg/sec Throughput
            </text>

            <rect x="460" y="46" width="140" height="42" rx="8" fill="#1e293b" stroke="#334155" />
            <text x="530" y="65" textAnchor="middle" fill="#38bdf8" fontSize="14" fontWeight="700">CLOUD RUN</text>
            <text x="530" y="82" textAnchor="middle" fill="#94a3b8" fontSize="14">TLS 1.3 / gRPC</text>

            {/* Tap connection to bus */}
            <line x1="310" y1="0" x2="310" y2="-40" stroke="#10b981" strokeWidth="3" />
            <circle cx="310" cy="-40" r="6" fill="#10b981" />
          </g>
        </svg>
      </div>
    </div>
  );
};
