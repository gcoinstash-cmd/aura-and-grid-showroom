import React, { useState } from 'react';
import { ShieldCheck, FileText, Download, CheckCircle2, DollarSign, Award, Lock } from 'lucide-react';

interface MonopolyVaultTabProps {
  apaContent: string;
  auditContent: string;
}

export const MonopolyVaultTab: React.FC<MonopolyVaultTabProps> = ({ apaContent, auditContent }) => {
  const [activeSubTab, setActiveSubTab] = useState<'APA' | 'AUDIT'>('APA');
  const [signed, setSigned] = useState(false);
  const [signatoryName, setSignatoryName] = useState('Institutional Syndicate Lead');

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Specification & Institutional Badges */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-fuchsia-400 uppercase tracking-wider mb-1 font-mono">
              <Award className="w-4 h-4" />
              <span>GHOST FACTORYOS · TRACK 3 ASSET DOSSIER</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              MONOPOLY VAULT & APA AGREEMENT
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Turnkey Software Asset Purchase Agreement & 100% Permissive Clean-Room IP Audit for GF-T3-155.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-right">
              <div className="text-xs text-slate-400 font-bold uppercase">Standalone Asset Transfer</div>
              <div className="text-2xl font-mono font-black text-emerald-400">20 kHz (0.48ms)</div>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-right">
              <div className="text-xs text-slate-400 font-bold uppercase">Vault License Tier</div>
              <div className="text-2xl font-mono font-black text-fuchsia-400">20 kHz (0.48ms) – 20 kHz (0.48ms)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('APA')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
              activeSubTab === 'APA'
                ? 'bg-fuchsia-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ENTERPRISE_APA_AGREEMENT.MD
          </button>
          <button
            onClick={() => setActiveSubTab('AUDIT')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
              activeSubTab === 'AUDIT'
                ? 'bg-fuchsia-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            LEGAL_IP_AUDIT.MD
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => downloadFile(
              activeSubTab === 'APA' ? apaContent : auditContent,
              activeSubTab === 'APA' ? 'ENTERPRISE_APA_AGREEMENT.md' : 'LEGAL_IP_AUDIT.md'
            )}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-2 text-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-fuchsia-400" />
            <span>DOWNLOAD {activeSubTab === 'APA' ? 'APA (.MD)' : 'AUDIT (.MD)'}</span>
          </button>
        </div>
      </div>

      {/* Contract Viewer */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl font-mono text-sm leading-relaxed text-slate-300">
        {activeSubTab === 'APA' ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-emerald-400 font-bold">STATUS: READY FOR EXECUTION</span> · Commercial Software Asset Standard · JAMS Arbitration · Full IP Assignment
            </div>

            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
              {apaContent}
            </div>

            {/* Interactive Electronic Signature Simulation */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase">
                  Institutional Electronic Execution
                </div>
                <div className="text-sm text-slate-300">
                  {signed
                    ? `Executed by ${signatoryName} · Verification Hash: 0x9f1a...44c2`
                    : 'Awaiting electronic counter-signature from Acquirer.'}
                </div>
              </div>

              {signed ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm bg-emerald-950/60 border border-emerald-800/60 px-4 py-2 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>AGREEMENT EXECUTED</span>
                </div>
              ) : (
                <button
                  onClick={() => setSigned(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40"
                >
                  <Lock className="w-4 h-4" />
                  <span>COUNTER-SIGN APA (20 kHz (0.48ms))</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>
                <strong className="text-white">Clean-Room Certification:</strong> 100% Permissive (Apache 2.0 / MIT). Zero GPL, AGPL, or SSPL copyleft contamination verified by automated AST scanner.
              </span>
            </div>

            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
              {auditContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
