import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, CheckSquare, Square, FileText, DollarSign, Award, ExternalLink } from 'lucide-react';
import { APA_AGREEMENT_LEGAL_TEXT, INITIAL_ESCROW_MILESTONES, EscrowMilestone } from '../../data/apaAgreement';

export const ApaCovenantTab: React.FC = () => {
  const [milestones, setMilestones] = useState<EscrowMilestone[]>(INITIAL_ESCROW_MILESTONES);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const toggleMilestone = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, verified: !m.verified } : m))
    );
  };

  const verifiedCount = milestones.filter((m) => m.verified).length;
  const readinessPct = Math.round((verifiedCount / milestones.length) * 100);

  const handleCopyLegal = async () => {
    try {
      await navigator.clipboard.writeText(APA_AGREEMENT_LEGAL_TEXT);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative w-full space-y-8 p-6 md:p-8 bg-neutral-950 text-neutral-100">
      
      {/* Intro Header */}
      <div className="border-b border-neutral-800 pb-5">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Acquire.com Asset Purchase Agreement (Micro-APA) Covenant
        </h2>
        <p className="mt-2 text-[16px] text-neutral-400 max-w-4xl leading-relaxed">
          Pre-drafted, institutional-grade micro-APA contract, Exhibit A Intellectual Property Assignment schedule, and Escrow.com closing protocol. Clean-room certified with comprehensive non-infringement warranties.
        </p>
      </div>

      {/* Financial Specification & Escrow Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="text-base font-mono text-neutral-400 uppercase font-semibold">Micro-APA Asset Transfer</span>
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-4 text-3xl md:text-4xl font-extrabold text-amber-400 num-tabular">
            20 kHz (0.48ms)
          </div>
          <p className="mt-2.5 text-base text-neutral-300 leading-relaxed">
            All-cash reference core via Escrow.com or Acquire Pay. Standard 3-day inspection window.
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="text-base font-mono text-neutral-400 uppercase font-semibold">Enterprise Replacement</span>
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-4 text-3xl md:text-4xl font-extrabold text-white num-tabular">
            PostgreSQL 16 + RLS
          </div>
          <p className="mt-2.5 text-base text-neutral-300 leading-relaxed">
            Calculated institutional replacement matrix for full Dynamic Kinetic Suspension Telemetry suspension model and PostgreSQL timeseries ledger.
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="text-base font-mono text-neutral-400 uppercase font-semibold">Deal Readiness</span>
            <ShieldCheck className="w-5 h-5 text-sky-400" />
          </div>
          <div className="mt-4 text-3xl md:text-4xl font-extrabold text-sky-400 num-tabular">
            {readinessPct}% Complete
          </div>
          <p className="mt-2.5 text-base text-neutral-300 leading-relaxed">
            {verifiedCount} of {milestones.length} due diligence closing milestones verified in escrow vault.
          </p>
        </div>
      </div>

      {/* Interactive Due Diligence Escrow Handoff Checklist */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-xl font-bold text-white">
              Escrow Handoff & Due Diligence Checklist
            </h3>
            <p className="text-base text-neutral-300 mt-1">
              Click any milestone to simulate legal and technical due diligence completion.
            </p>
          </div>
          <span className="text-base font-mono font-bold px-3.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-emerald-400">
            Vault Status: READY FOR TRANSFER
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {milestones.map((m) => (
            <div
              key={m.id}
              onClick={() => toggleMilestone(m.id)}
              className={`flex items-start gap-4 p-4 md:p-5 rounded-xl border transition-all cursor-pointer ${
                m.verified
                  ? 'bg-neutral-950/80 border-emerald-500/30 text-neutral-200'
                  : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {m.verified ? (
                  <CheckSquare className="w-6 h-6 text-emerald-400" />
                ) : (
                  <Square className="w-6 h-6 text-neutral-500" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{m.title}</span>
                    <span className="text-base font-mono text-neutral-400 font-normal">({m.id})</span>
                  </h4>
                  <span className={`px-3 py-1 rounded-lg text-base font-mono font-semibold ${
                    m.verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {m.category}
                  </span>
                </div>
                <p className="text-base text-neutral-300 leading-relaxed">
                  {m.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pre-Drafted Asset Purchase Agreement Document View */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between p-4 bg-neutral-950 border-b border-neutral-800 gap-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="text-[15px] font-mono font-bold text-white">
              LEGAL_MICRO_APA_AGREEMENT.md
            </span>
            <span className="text-[15px] px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20">
              Standard Commercial Jurisdiction Jurisdiction
            </span>
          </div>

          <button
            onClick={handleCopyLegal}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[15px] font-medium transition-colors cursor-pointer"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-neutral-400" />}
            <span>{isCopied ? 'Copied Contract' : 'Copy APA Agreement'}</span>
          </button>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto bg-neutral-950 text-neutral-300 font-mono text-[15px] leading-relaxed whitespace-pre-wrap">
          {APA_AGREEMENT_LEGAL_TEXT}
        </div>
      </div>

    </div>
  );
};
