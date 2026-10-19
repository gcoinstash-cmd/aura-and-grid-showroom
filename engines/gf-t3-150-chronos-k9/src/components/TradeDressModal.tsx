import React from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Award, 
  Lock, 
  CheckCircle
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

interface TradeDressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TradeDressModal: React.FC<TradeDressModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-zinc-900/90 border-b border-zinc-800">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-display-hud font-extrabold text-white uppercase tracking-wide">
                GHOST FACTORYOS // TRACK 2: HYPERCAR FLAGSHIP ASSET
              </h2>
              <p className="text-sm font-mono-tactical text-zinc-300 mt-0.5">
                CHRONOS KINETIC-9: MagLev Telemetry & Vector Rig (IP VAULT #GH-8092-K9)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              tacticalAudio.playClick(800);
              onClose();
            }}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 sm:p-8 space-y-7 max-h-[75vh] overflow-y-auto font-mono-tactical text-sm text-zinc-200">
          {/* Section 1: Dealership Fleet Tier & Inventory Specification Card */}
          <div className="p-6 rounded-xl bg-zinc-900/80 border border-blue-500/40 glow-blue">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 flex-wrap gap-2">
              <span className="text-sm sm:text-base font-extrabold text-blue-300 font-display-hud tracking-wider uppercase flex items-center gap-2.5">
                <Award className="w-5 h-5 text-blue-400" />
                DEALERSHIP FLEET TIER ACQUISITION MATRIX
              </span>
              <span className="text-xs sm:text-sm px-3 py-1 rounded bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold uppercase tracking-wide">
                AUDITED & ESCROW-READY
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              {/* Tier 1 */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
                <div className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Assessment Tier</div>
                <div className="text-base font-bold text-white mt-1">SANDBOX ACCESS</div>
                <div className="text-3xl font-black text-blue-400 mt-2">$1,500 <span className="text-xs font-normal text-zinc-400">USD</span></div>
                <p className="text-xs sm:text-sm text-zinc-300 mt-2.5 leading-relaxed font-medium">
                  Interactive operational build access, localized client telemetry harness, non-exclusive internal evaluation rights.
                </p>
              </div>

              {/* Tier 2 */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-purple-500/50 glow-purple">
                <div className="text-xs text-purple-300 uppercase font-bold tracking-wider">Commercial Standard</div>
                <div className="text-base font-bold text-white mt-1">STANDARD APA ASSET TRANSFER</div>
                <div className="text-3xl font-black text-purple-400 mt-2">$14,500 <span className="text-xs font-normal text-zinc-400">USD</span></div>
                <p className="text-xs sm:text-sm text-zinc-300 mt-2.5 leading-relaxed font-medium">
                  Full Asset Purchase Agreement (APA) with clean-room codebase transfer, royalty-free perpetual commercial license.
                </p>
              </div>

              {/* Tier 3 */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-amber-500/50 glow-amber">
                <div className="text-xs text-amber-300 uppercase font-bold tracking-wider">Institutional Monopoly</div>
                <div className="text-base font-bold text-white mt-1">MONOPOLY VAULT ASSET TRANSFER</div>
                <div className="text-3xl font-black text-amber-400 mt-2">$35,000 <span className="text-xs font-normal text-zinc-400">USD</span></div>
                <p className="text-xs sm:text-sm text-zinc-300 mt-2.5 leading-relaxed font-medium">
                  Total exclusive IP assignment, worldwide trade-dress defense warranty, complete source surrender, and patent declaration.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Trade-Dress Defense Clause & Structural Novelty Points */}
          <div className="p-6 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-4">
            <h3 className="text-sm sm:text-base font-display-hud font-extrabold text-white tracking-wider uppercase flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-purple-400" />
              TRADE-DRESS DEFENSE CLAUSE & STRUCTURAL NOVELTY POINTS
            </h3>
            <p className="text-zinc-300 text-sm leading-relaxed font-medium">
              Pursuant to 35 U.S.C. § 171 and international design patent treaties, the visual arrangement, tactile interaction telemetry, and dynamic HUD architecture of CHRONOS KINETIC-9 are documented under the following novel design claims:
            </p>

            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <CheckCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-100">Novelty Point 1 — 4-Point Bogie Dynamic Gap Matrix:</strong> Quad-planar real-time representation of 15.0mm cryogenic levitation tolerance paired with magnetic flux density (Tesla) indicators and real-time deviation alerts.
                </div>
              </li>

              <li className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <CheckCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-100">Novelty Point 2 — Endless Perspective Magnetic Guideway Grid:</strong> Hardware-accelerated canvas engine projecting longitudinal stator rails, transverse sleeper ties with accelerating perspective warp, and active alignment crosshairs.
                </div>
              </li>

              <li className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <CheckCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-100">Novelty Point 3 — Tri-State Linear Inverter & Regen Matrix:</strong> Micro-synchronized dual capacitor bank charge visualization coupled with 8-sector linear induction stator load percentage gauges.
                </div>
              </li>
            </ul>
          </div>

          {/* Section 3: Clean-Room Dependency Whitelist Certification */}
          <div className="p-6 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
            <h3 className="text-sm sm:text-base font-display-hud font-extrabold text-white tracking-wider uppercase flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-emerald-400" />
              CLEAN-ROOM DEPENDENCY CERTIFICATION (ZERO VIRAL LICENSES)
            </h3>
            <p className="text-zinc-300 text-sm leading-relaxed font-medium">
              All runtime modules adhere strictly to institutional commercial standards (MIT / Apache 2.0 / BSD-3). Completely free of GPL, AGPL, or SSPL copyleft contaminations:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs sm:text-sm">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center">
                <div className="text-zinc-400 font-semibold">REACT 19</div>
                <div className="text-emerald-400 font-extrabold mt-1">MIT LICENSE</div>
              </div>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center">
                <div className="text-zinc-400 font-semibold">TAILWIND CSS</div>
                <div className="text-emerald-400 font-extrabold mt-1">MIT LICENSE</div>
              </div>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center">
                <div className="text-zinc-400 font-semibold">LUCIDE ICONS</div>
                <div className="text-emerald-400 font-extrabold mt-1">ISC LICENSE</div>
              </div>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center">
                <div className="text-zinc-400 font-semibold">AUDIO ENGINE</div>
                <div className="text-emerald-400 font-extrabold mt-1">PROPRIETARY 100%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-900/90 border-t border-zinc-800 flex-wrap gap-3">
          <div className="text-xs sm:text-sm font-mono-tactical text-zinc-400 font-semibold uppercase tracking-wide">
            ANTIGRAVITY BLUEPRINT INGESTION READY // RFC-09-MONOPOLY
          </div>
          <button
            onClick={() => {
              tacticalAudio.playClick(1200);
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono-tactical text-sm font-bold transition-colors cursor-pointer uppercase tracking-wider shadow-lg"
          >
            CONFIRM & RETURN TO COCKPIT
          </button>
        </div>
      </div>
    </div>
  );
};
