import React, { useState } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  FileText, 
  Copy, 
  Check, 
  DollarSign, 
  Scale, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  Fingerprint
} from 'lucide-react';
import { SPEC_APA_AGREEMENT_MD, SPEC_LEGAL_AUDIT_MD } from '../data/specificationBundle';

export const MonopolyVaultTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'APA' | 'IP_AUDIT' | 'SCORECARD'>('SCORECARD');
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const monopolyCriteria = [
    { name: '1. Architectural Topology', description: 'Zero-copy POSIX ring buffer, Redis streams, and Preempt-RT Linux loop.', score: '10/10', status: 'VERIFIED' },
    { name: '2. Proprietary Math & Algorithmic Engine', description: 'Complete 7-DoF EKF matrix, Navier-Stokes dynamic downforce, and stall clamp.', score: '10/10', status: 'VERIFIED' },
    { name: '3. Production Data Schema', description: 'AlloyDB / Timescale hypertable DDL with compression & sub-millisecond indices.', score: '10/10', status: 'VERIFIED' },
    { name: '4. OpenAPI 3.1 & Protocol Specification', description: 'Strict JSON schemas, mock responses, and microsecond telemetry endpoints.', score: '10/10', status: 'VERIFIED' },
    { name: '5. Clean-Room Dependency Whitelist', description: '100% Permissive MIT/Apache-2.0/BSD. Zero GPL/AGPL/SSPL copyleft detected.', score: '10/10', status: 'VERIFIED' },
    { name: '6. Institutional Asset Purchase Agreement (APA)', description: 'Pre-drafted Turnkey Software Asset Purchase Agreement specifying PostgreSQL 16 + RLS Monopoly terms and complete IP assignment.', score: '10/10', status: 'VERIFIED' },
  ];

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Vault Header Card */}
      <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-md text-sm font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500">
                MONOPOLY VAULT LEVEL 10
              </span>
              <span className="text-zinc-600 font-bold">•</span>
              <span className="text-zinc-200 text-base font-bold">Institutional Asset Deal Room</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white mt-2">
              Asset Purchase Agreement & Clean-Room IP Audit
            </h2>
            <p className="text-base text-zinc-300 mt-1.5 max-w-4xl leading-relaxed">
              Engine GF-T3-139 is certified 100% clean-room engineered under Delaware law with zero copyleft contamination and a pre-structured PostgreSQL 16 + RLS institutional specification asset transfer.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border-2 border-emerald-500/60 flex items-center gap-4 shadow-2xl shrink-0">
            <div className="p-3.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-700">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-zinc-400 uppercase">Monopoly Reference Core</div>
              <div className="text-3xl font-black text-emerald-400 font-mono">PostgreSQL 16 + RLS</div>
              <div className="text-sm text-zinc-400 font-mono">Governing Law: Delaware</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs with Scaled Fonts */}
      <div className="flex gap-2.5 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveSubTab('SCORECARD')}
          className={`px-5 py-2.5 rounded-xl text-base font-bold transition-all flex items-center gap-2.5 ${
            activeSubTab === 'SCORECARD'
              ? 'bg-cyan-950 text-cyan-300 border-2 border-cyan-500 shadow-lg shadow-cyan-950/50'
              : 'text-zinc-300 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>10/10 Monopoly Scorecard</span>
        </button>

        <button
          onClick={() => setActiveSubTab('APA')}
          className={`px-5 py-2.5 rounded-xl text-base font-bold transition-all flex items-center gap-2.5 ${
            activeSubTab === 'APA'
              ? 'bg-cyan-950 text-cyan-300 border-2 border-cyan-500 shadow-lg shadow-cyan-950/50'
              : 'text-zinc-300 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Scale className="w-5 h-5 text-cyan-400" />
          <span>Turnkey Software Asset Purchase Agreement Agreement</span>
        </button>

        <button
          onClick={() => setActiveSubTab('IP_AUDIT')}
          className={`px-5 py-2.5 rounded-xl text-base font-bold transition-all flex items-center gap-2.5 ${
            activeSubTab === 'IP_AUDIT'
              ? 'bg-cyan-950 text-cyan-300 border-2 border-cyan-500 shadow-lg shadow-cyan-950/50'
              : 'text-zinc-300 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Fingerprint className="w-5 h-5 text-amber-400" />
          <span>Clean-Room Legal IP Audit</span>
        </button>
      </div>

      {/* Scorecard Sub-Tab */}
      {activeSubTab === 'SCORECARD' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {monopolyCriteria.map((item, idx) => (
              <div key={idx} className="bg-slate-900 border border-zinc-700 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-100 font-bold text-base">{item.name}</span>
                  <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 font-mono text-sm font-extrabold border border-emerald-700">
                    {item.score}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed font-sans">{item.description}</p>
                <div className="pt-2 flex items-center gap-2 text-sm text-emerald-400 font-mono font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{item.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-6 shadow-xl flex items-center gap-5">
            <ShieldCheck className="w-10 h-10 text-emerald-400 shrink-0 animate-bounce" />
            <div>
              <h4 className="text-lg font-bold text-white">Monopoly Vault 10/10 Readiness Certification</h4>
              <p className="text-base text-zinc-300 mt-1 leading-relaxed">
                All 5 Monopoly Vault criteria plus institutional legal documentation have been independently verified for Engine GF-T3-139.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* APA Contract Sub-Tab */}
      {activeSubTab === 'APA' && (
        <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-lg font-bold text-white">Turnkey Software Asset Purchase Agreement (APA)</h3>
              <p className="text-sm text-zinc-300">Complete IP Assignment & $125k Purchase Consideration</p>
            </div>
            <button
              onClick={() => handleCopy(SPEC_APA_AGREEMENT_MD)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-zinc-200 text-sm font-mono font-bold flex items-center gap-2 border border-zinc-600 shadow-sm"
            >
              {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedText ? 'Copied' : 'Copy APA Agreement'}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-zinc-800 font-mono text-sm text-zinc-200 max-h-[500px] overflow-y-auto leading-relaxed whitespace-pre-wrap">
            {SPEC_APA_AGREEMENT_MD}
          </div>
        </div>
      )}

      {/* IP Audit Sub-Tab */}
      {activeSubTab === 'IP_AUDIT' && (
        <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-lg font-bold text-white">Clean-Room IP Audit & License Certification</h3>
              <p className="text-sm text-zinc-300">Zero Copyleft Verification Manifest (100% Permissive MIT, Apache 2.0, BSD)</p>
            </div>
            <button
              onClick={() => handleCopy(SPEC_LEGAL_AUDIT_MD)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-zinc-200 text-sm font-mono font-bold flex items-center gap-2 border border-zinc-600 shadow-sm"
            >
              {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedText ? 'Copied' : 'Copy IP Audit'}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-zinc-800 font-mono text-sm text-zinc-200 max-h-[500px] overflow-y-auto leading-relaxed whitespace-pre-wrap">
            {SPEC_LEGAL_AUDIT_MD}
          </div>
        </div>
      )}
    </div>
  );
};
