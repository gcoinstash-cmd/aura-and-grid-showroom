import React, { useState } from 'react';
import { X, Check, Shield, KeyRound, FileCheck, ArrowRight, Zap, Award } from 'lucide-react';
import { DealershipTier } from '../types/telemetry';

interface DealershipTiersModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTierId?: 'demo' | 'standard' | 'monopoly';
}

const TIERS: DealershipTier[] = [
  {
    id: 'demo',
    name: '$1,500 Evaluation License',
    tagline: 'Sandbox evaluation & telemetry testing environment',
    unitIndex: 1500,
    priceFormatted: '$1,500',
    licenseType: 'Single-Seat 30-Day Evaluation',
    leadTime: 'Instant Digital Key',
    features: [
      'Interactive 3D transparent chassis telemetry sandbox',
      'Real-time sub-picosecond simulated market vector stream',
      'Access to core mathematical & aerodynamic algorithms',
      'Non-commercial research & validation license',
    ],
    deliverables: [
      'Encrypted telemetry runtime container',
      'API access tokens for simulated market feeds',
      'Basic technical architecture dossier',
    ],
    legalStatus: 'Standard EULA · Non-exclusive',
    recommendedFor: 'Quants, telemetry evaluators, and system architects',
  },
  {
    id: 'standard',
    name: '$14,500 Commercial APA Asset Transfer',
    tagline: 'Full commercial production license & source code',
    unitIndex: 14500,
    priceFormatted: '$14,500',
    licenseType: 'Asset Purchase Agreement (APA)',
    leadTime: 'Immediate Escrow Release',
    features: [
      'Complete production chassis CAD models (STEP / IGES)',
      'Deterministic telemetry engine source code (MIT licensed)',
      'Sub-nanosecond cross-exchange routing logic',
      'Commercial deployment & integration rights',
      'Aerodynamic venturi tunnel wind-tunnel test data',
    ],
    deliverables: [
      'Full source code repository access',
      'Precision manufacturing fabrication drawings',
      'Signed Standard Asset Purchase Agreement',
      'Commercial production warrant',
    ],
    legalStatus: 'Commercial Asset Transfer · Non-exclusive',
    recommendedFor: 'Dealership fleets, prop trading firms, and race teams',
  },
  {
    id: 'monopoly',
    name: '$48,500 Monopoly Vault Asset Transfer (USPTO Design Patent Transfer)',
    tagline: 'Perpetual exclusive IP assignment & patent monopoly',
    unitIndex: 48500,
    priceFormatted: '$48,500',
    licenseType: 'Exclusive Monopoly IP Assignment',
    leadTime: 'Priority Legal & Key Escrow',
    features: [
      'Exclusive worldwide ownership of CHRONO-ARBITRAGE IP',
      'Full USPTO Design Patent & Trade-Dress assignment',
      'Clean-room legal certification with non-infringement warrant',
      'Zero future licensing to any competing fleet or dealership',
      'Direct skunkworks engineering consultation & custom tuning',
      'Cryptographic master escrow key handover',
    ],
    deliverables: [
      'Signed Enterprise APA & Patent Assignment Deed',
      'Clean-room IP audit dossier & provenance logs',
      'Unrestricted perpetual worldwide rights',
      'Hardware master blueprints & quantum core schematics',
    ],
    legalStatus: 'Exclusive Monopoly Transfer · 100% Perpetual Assignment',
    recommendedFor: 'Sovereign wealth funds, tier-1 hypercar marques, institutional funds',
  },
];

export const DealershipTiersModal: React.FC<DealershipTiersModalProps> = ({
  isOpen,
  onClose,
  defaultTierId = 'standard',
}) => {
  const [selectedTier, setSelectedTier] = useState<'demo' | 'standard' | 'monopoly'>(defaultTierId);
  const [entityName, setEntityName] = useState('');
  const [signatoryName, setSignatoryName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [escrowKey, setEscrowKey] = useState('');

  if (!isOpen) return null;

  const currentTier = TIERS.find((t) => t.id === selectedTier) || TIERS[1];

  const handleExecuteAcquisition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityName.trim() || !signatoryName.trim()) return;

    // Generate deterministic mock cryptographic SHA-256 escrow key
    const mockHash = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setEscrowKey(`GF-ESCROW-${mockHash.toUpperCase()}`);
    setIsSubmitted(true);
  };

  const handleDownloadLicenseAgreement = () => {
    const text = `================================================================================
GHOST FACTORYOS · FLEET DEALERSHIP ASSET PURCHASE & LICENSE DEED
TRANSACTION ID: ${escrowKey}
TIER: ${currentTier.name.toUpperCase()} (${currentTier.priceFormatted} USD)
PURCHASER ENTITY: ${entityName.toUpperCase()}
AUTHORIZED SIGNATORY: ${signatoryName.toUpperCase()}
DATE: ${new Date().toISOString()}
================================================================================

1. GRANT OF RIGHTS / ASSET TRANSFER:
Under the terms of this Agreement, Ghost FactoryOS assigns to the Purchaser the rights,
licenses, and technical assets defined under Tier: ${currentTier.name}.

2. ASSET SPECIFICATION:
- Vehicle: CHRONO-ARBITRAGE Transparent Concept Hypercar Chassis
- Core: 512-Qubit Topological Dilution Refrigerator (12.4 mK)
- Conduits: Dual 532nm Emerald / 589nm Gold Coherent Laser Waveguides
- Telemetry: Sub-picosecond Global Financial Vector Stream HUD

3. INTELLECTUAL PROPERTY & TRADE-DRESS:
This transaction conforms to the USPTO 35 U.S.C. § 171 Design Patent specification
and Ghost FactoryOS Clean-Room Certification standard.

4. ESCROW RELEASE KEY:
${escrowKey}

AUTHORIZED & CERTIFIED BY GHOST FACTORYOS ARCHITECT
================================================================================`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CHRONO_ARBITRAGE_${selectedTier.toUpperCase()}_AGREEMENT.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold uppercase">
              <Award className="w-4 h-4 text-emerald-400" />
              GHOST FACTORYOS · DEALERSHIP FLEET ACQUISITION
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              CHRONO-ARBITRAGE Flagship Procurement Tiers
            </h2>
            <p className="text-xs text-slate-400">
              Institutional Asset Purchase Agreements (APA) & Exclusive Monopoly Vault Allocations
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isSubmitted ? (
          <>
            {/* Tier Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TIERS.map((tier) => {
                const isSelected = selectedTier === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`cursor-pointer rounded-2xl p-5 transition-all border flex flex-col justify-between relative ${
                      isSelected
                        ? tier.id === 'monopoly'
                          ? 'bg-amber-950/40 border-amber-500 shadow-xl shadow-amber-950/50'
                          : 'bg-emerald-950/40 border-emerald-500 shadow-xl shadow-emerald-950/50'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {tier.id === 'monopoly' && (
                      <div className="absolute -top-3 right-3 text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950">
                        VAULT EXCLUSIVE
                      </div>
                    )}

                    <div className="space-y-2.5">
                      <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                        {tier.licenseType}
                      </div>
                      <div className="text-xl font-extrabold text-white leading-tight">
                        {tier.name}
                      </div>
                      <div className="text-3xl font-mono font-black text-emerald-400">
                        {tier.priceFormatted}
                        <span className="text-xs font-normal text-zinc-400 ml-1.5">USD</span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                        {tier.tagline}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
                      {tier.features.slice(0, 3).map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-200">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{f}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5">
                      <div
                        className={`w-full py-2.5 text-center text-xs sm:text-sm font-mono rounded-lg transition-colors font-bold ${
                          isSelected
                            ? tier.id === 'monopoly'
                              ? 'bg-amber-500 text-slate-950 shadow-md'
                              : 'bg-emerald-500 text-slate-950 shadow-md'
                            : 'bg-slate-800 text-zinc-200'
                        }`}
                      >
                        {isSelected ? 'SELECTED TIER' : 'SELECT TIER'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Tier Deep-Dive Details */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm font-mono gap-2">
                <span className="text-zinc-300">
                  LEGAL INSTRUMENT: <strong className="text-emerald-400">{currentTier.legalStatus}</strong>
                </span>
                <span className="text-zinc-300">
                  FULFILLMENT: <strong className="text-amber-400">{currentTier.leadTime}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="space-y-2">
                  <div className="text-xs sm:text-sm font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Key Features Included
                  </div>
                  <ul className="space-y-1.5 text-sm text-zinc-200">
                    {currentTier.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="text-xs sm:text-sm font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Deliverables & Legal Package
                  </div>
                  <ul className="space-y-1.5 text-sm text-zinc-200">
                    {currentTier.deliverables.map((d, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Procurement Signing Form */}
            <form onSubmit={handleExecuteAcquisition} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Authorized Acquisition & Escrow Sign-off
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Purchasing Entity / Dealership / Fund
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Sovereign Holdings LLC"
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Authorized Signatory & Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Elena Rostova, Managing Director"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-400 font-mono">
                  Total Allocation: <strong className="text-white text-sm">{currentTier.priceFormatted} USD</strong>
                </div>

                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-2 ${
                    currentTier.id === 'monopoly'
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  <span>Execute {currentTier.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Confirmation Screen */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/80 flex items-center justify-center mx-auto text-emerald-400">
              <Shield className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono text-emerald-400 font-bold tracking-widest uppercase">
                ACQUISITION CONFIRMED · ESCROW ACTIVE
              </div>
              <h3 className="text-2xl font-bold text-white">
                {currentTier.name} Successfully Initialized
              </h3>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                Asset transfer deed registered for <strong className="text-slate-200">{entityName}</strong> under authorized signatory <strong className="text-slate-200">{signatoryName}</strong>.
              </p>
            </div>

            {/* Escrow Key Box */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 max-w-md mx-auto space-y-2">
              <div className="text-xs font-mono text-slate-400 flex items-center justify-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                CRYPTOGRAPHIC ASSET ESCROW KEY
              </div>
              <div className="text-xs font-mono font-bold text-emerald-300 break-all bg-black/50 p-2.5 rounded border border-slate-800">
                {escrowKey}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleDownloadLicenseAgreement}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-mono font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center justify-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>Download Executed Agreement (.txt)</span>
              </button>

              <button
                onClick={() => {
                  setIsSubmitted(false);
                  onClose();
                }}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Return to Showroom
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
