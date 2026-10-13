import React, { useState } from 'react';
import { APA_AGREEMENT_MARKDOWN } from '../../data/codeSnippets';
import { 
  FileCheck2, 
  ShieldCheck, 
  DollarSign, 
  CheckCircle2, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ApaCovenantTabProps {
  onOpenApaModal: () => void;
  onExportSpec: () => void;
}

export const ApaCovenantTab: React.FC<ApaCovenantTabProps> = ({
  onOpenApaModal,
  onExportSpec,
}) => {
  const [copiedAgreement, setCopiedAgreement] = useState(false);
  const [activeTier, setActiveTier] = useState<'micro' | 'enterprise'>('micro');

  const handleCopyAgreement = () => {
    navigator.clipboard.writeText(APA_AGREEMENT_MARKDOWN);
    setCopiedAgreement(true);
    setTimeout(() => setCopiedAgreement(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded bg-amber-500/10 text-amber-400 font-mono font-bold text-base border border-amber-500/30">
                Acquire.com Turnkey Asset
              </span>
              <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-base border border-emerald-500/30">
                Escrow.com Compatible
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              Institutional Asset Purchase Agreement (APA) & Clean-Room Covenants
            </h2>
            <p className="text-base text-neutral-300 mt-2 max-w-3xl">
              Turnkey micro-acquisition package for acquiring full legal title, intellectual property, 
              and production artifacts for the Lexus LC 500 Convertible Grand Touring Core.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenApaModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-base transition-colors cursor-pointer"
            >
              <Briefcase className="w-5 h-5 text-neutral-950" />
              <span>Preview Legal Agreement</span>
            </button>
            <button
              type="button"
              onClick={onExportSpec}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 font-semibold text-base transition-colors cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Download Vault Spec</span>
            </button>
          </div>
        </div>

        {/* Valuation Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Tier 1: Micro-APA */}
          <div 
            onClick={() => setActiveTier('micro')}
            className={`p-6 rounded-xl border transition-all cursor-pointer ${
              activeTier === 'micro'
                ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/10'
                : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-base">
                TIER 1: TURNKEY BUYOUT
              </span>
              <span className="text-3xl font-extrabold text-amber-400 font-mono">
                $45,000 USD
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-white mb-2">Micro-APA Acquisition</h3>
            <p className="text-base text-neutral-300 mb-4">
              Complete software IP assignment for indie hackers, boutique automotive studios, or mobility startups seeking a turnkey DRS algorithm.
            </p>
            <ul className="space-y-2 text-base text-neutral-200">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>100% Worldwide IP Transfer (Perpetual, Exclusive)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Python 3.12 Core + PostgreSQL Schema + OpenAPI 3.1</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Acquire.com 72-Hour Inspection Escrow Handoff</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>14 Days Technical Architectural Support</span>
              </li>
            </ul>
          </div>

          {/* Tier 2: Enterprise Monopoly Vault */}
          <div 
            onClick={() => setActiveTier('enterprise')}
            className={`p-6 rounded-xl border transition-all cursor-pointer ${
              activeTier === 'enterprise'
                ? 'bg-purple-500/10 border-purple-500/60 shadow-lg shadow-purple-500/10'
                : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded bg-purple-500/20 text-purple-300 font-mono font-bold text-base">
                TIER 2: INSTITUTIONAL VAULT
              </span>
              <span className="text-3xl font-extrabold text-purple-400 font-mono">
                $125,000 USD
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-white mb-2">Enterprise Monopoly Vault</h3>
            <p className="text-base text-neutral-300 mb-4">
              Comprehensive institutional acquisition including non-compete covenants, full patent defense audit, and private equity escrow guarantees.
            </p>
            <ul className="space-y-2 text-base text-neutral-200">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>All Micro-APA Assets + Private Equity Clean-Room Warranties</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Exhibit B Formal Notarized Bill of Sale</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Seller Non-Compete & Non-Solicitation Covenants</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>60 Days Dedicated Engineering Integration Lead</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Clean-Room Escrow Handoff Checklist */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
          <div>
            <h3 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              Clean-Room Escrow Handoff Checklist
            </h3>
            <p className="text-base text-neutral-300 mt-1">
              Deterministic 4-phase transaction escrow schedule designed for frictionless settlement.
            </p>
          </div>
          <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-base">
            100% Pre-Audited
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800">
            <div className="text-amber-400 font-mono font-bold text-base mb-1">PHASE 1</div>
            <div className="text-base font-bold text-white mb-1">Escrow Deposit</div>
            <p className="text-base text-neutral-400">
              Buyer funds $45k or $125k in escrow on Acquire.com or Escrow.com.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800">
            <div className="text-amber-400 font-mono font-bold text-base mb-1">PHASE 2</div>
            <div className="text-base font-bold text-white mb-1">Master Vault Handoff</div>
            <p className="text-base text-neutral-400">
              Git credentials, cryptographic signing keys, and container registries transferred.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800">
            <div className="text-amber-400 font-mono font-bold text-base mb-1">PHASE 3</div>
            <div className="text-base font-bold text-white mb-1">Inspection Window</div>
            <p className="text-base text-neutral-400">
              72-hour automated verification of PyTest suite (&gt;90% coverage) and ledger proofs.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800">
            <div className="text-emerald-400 font-mono font-bold text-base mb-1">PHASE 4</div>
            <div className="text-base font-bold text-white mb-1">Title Conveyance</div>
            <p className="text-base text-neutral-400">
              Funds disbursed to seller; irrevocable legal ownership vests with buyer.
            </p>
          </div>
        </div>
      </div>

      {/* Agreement Text Preview Card */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
          <div>
            <h3 className="text-2xl font-extrabold text-white">
              Pre-Drafted Asset Purchase Agreement Text
            </h3>
            <p className="text-base text-neutral-300 mt-1">
              Standard Acquire.com micro-APA format ready for digital execution.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyAgreement}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-base font-semibold transition-colors cursor-pointer"
          >
            {copiedAgreement ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-neutral-400" />}
            <span>{copiedAgreement ? 'Copied Agreement!' : 'Copy Legal Agreement'}</span>
          </button>
        </div>

        <pre className="p-5 rounded-lg bg-neutral-950 text-neutral-200 font-mono text-base overflow-x-auto leading-relaxed border border-neutral-800 max-h-[400px] overflow-y-auto">
          <code>{APA_AGREEMENT_MARKDOWN}</code>
        </pre>
      </div>
    </div>
  );
};
