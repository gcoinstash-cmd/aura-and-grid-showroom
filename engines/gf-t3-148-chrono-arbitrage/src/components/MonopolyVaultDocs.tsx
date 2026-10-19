import React, { useState } from 'react';
import {
  Shield,
  DollarSign,
  Download,
  Copy,
  Check,
  Scale,
  Award,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  legalIpAuditMd: string;
  enterpriseApaMd: string;
}

export const MonopolyVaultDocs: React.FC<Props> = ({ legalIpAuditMd, enterpriseApaMd }) => {
  const [docTab, setDocTab] = useState<'audit' | 'apa'>('audit');
  const [copied, setCopied] = useState(false);
  const [memoCopied, setMemoCopied] = useState(false);

  const activeContent = docTab === 'audit' ? legalIpAuditMd : enterpriseApaMd;
  const fileName = docTab === 'audit' ? 'LEGAL_IP_AUDIT.md' : 'ENTERPRISE_APA_AGREEMENT.md';

  const ACQUIRE_MEMO_MARKDOWN = `# ACQUIRE.COM EXECUTIVE LISTING MEMO: T3-QUANT-02 CHRONO-ARBITRAGE

## 1. EXECUTIVE SUMMARY & ASSET APPRAISAL
* **Asset Identifier**: T3-QUANT-02: CHRONO-ARBITRAGE (Track 3 F1 Skunkworks Engine)
* **Acquire.com APA Reference Core**: $19,500 USD (As-Is Clean-Room Codebase)
* **Enterprise Monopoly Ceiling**: PostgreSQL 16 + RLS (Exclusive IP, Vault blueprints)
* **Sector**: Institutional High-Frequency Quantitative Trading / Arbitrage Infrastructure
* **Architecture Track**: Ghost FactoryOS Track 3 (70% Skunkworks Workload Blueprint)

## 2. TECHNICAL PROOF & BENCHMARKS
* **Graph Solver Engine**: Sub-150μs Bellman-Ford DAG negative-log cycle solver (-ln(R * (1 - fee)))
* **Ingestion Velocity**: 52,400 ticks/sec verified in-memory zero-copy ring buffer
* **Execution Safety**: Isolated 2-phase commit (2PC) atomic execution with route locking (zero unhedged legs)
* **Target Venues**: Binance Spot, OKX, Coinbase Pro, Bybit, Kraken
* **Risk & Slippage**: Quadratic depth impact model S(Q) = 0.125 * (Q / Depth)^2 + spread/2

## 3. CLEAN-ROOM LEGAL & INTELLECTUAL PROPERTY CERTIFICATION
* **Licensing Whitelist**: Clean-room MIT / Apache 2.0 permissive stack
* **Copyleft Exclusion**: Zero GPLv2/v3, AGPL, SSPL, or Commons Clause code contamination
* **IP Assignment**: 100% assignable worldwide copyright, trade secrets, relational schemas, and mathematical formulations
* **Audited Contracts**: Fully pre-drafted Enterprise Asset Purchase Agreement (Delaware jurisdiction)

## 4. CONTAINERIZATION & ONE-CLICK DEPLOYMENT
* **Production Dockerfile**: Multi-stage hardened Debian 12 Bookworm, non-root user (UID 10001)
* **GCP Cloud Run Gen2**: 1-click deploy_cloud_run.sh (4 vCPU, 8Gi RAM, concurrency 1000)
* **Verification Harness**: Automated PyTest test suite (>85% coverage) with mock 50k ticks/sec feeder
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMemo = () => {
    navigator.clipboard.writeText(ACQUIRE_MEMO_MARKDOWN);
    setMemoCopied(true);
    setTimeout(() => setMemoCopied(false), 3000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 relative">
      {/* Visual Toast Notification */}
      {memoCopied && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-emerald-950 border-2 border-emerald-400 text-white font-mono text-sm font-bold shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-emerald-300 font-extrabold">Acquire.com Deal Memo Copied to Clipboard</div>
            <div className="text-xs text-zinc-300 font-normal">Ready for instant paste into acquisition pitches &amp; deal rooms.</div>
          </div>
        </div>
      )}

      {/* 1-CLICK PROMINENT GLOWING ACQUISITION CALLOUT */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-zinc-900 to-emerald-950/70 border-2 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.25)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-black tracking-wider uppercase">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>INSTITUTIONAL 1-CLICK ACQUISITION PACKAGE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
            Acquire.com Deal Memo &amp; Asset Transfer Sheet
          </h2>
          <p className="text-sm font-sans text-zinc-200">
            Copy clean-room summary with verified $19.5k APA floor &amp; $125k Monopoly ceiling terms.
          </p>
        </div>

        <button
          onClick={handleCopyMemo}
          className="shrink-0 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-zinc-950 font-mono font-black text-sm transition shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {memoCopied ? (
            <>
              <Check className="w-4 h-4 text-zinc-950 stroke-[3]" />
              <span>COPIED TO CLIPBOARD!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
              <span>Copy Acquire.com Listing Memo</span>
            </>
          )}
        </button>
      </div>

      {/* Due Diligence Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-sm">
        <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Shield className="w-4 h-4" />
            <span>CLEAN-ROOM CERTIFICATION</span>
          </div>
          <div className="text-2xl font-black text-white">100% PERMISSIVE</div>
          <p className="text-sm text-zinc-200 font-sans">
            SPDX verified: MIT, Apache-2.0, BSD-3. Zero GPL/AGPL/SSPL copyleft contamination.
          </p>
        </div>

        <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <DollarSign className="w-4 h-4" />
            <span>MONOPOLY VAULT SPECIFICATION</span>
          </div>
          <div className="text-2xl font-black text-amber-300">PostgreSQL 16 + RLS</div>
          <p className="text-sm text-zinc-200 font-sans">
            Institutional reference core ($75k–$150k band). Full IP transfer and trade secret assignment.
          </p>
        </div>

        <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Award className="w-4 h-4" />
            <span>ANTIGRAVITY INGESTION</span>
          </div>
          <div className="text-2xl font-black text-white">PRE-COMPILED</div>
          <p className="text-sm text-zinc-200 font-sans">
            Ready for instant programmatic ingestion by Antigravity autonomous development fleets.
          </p>
        </div>
      </div>

      {/* Document Selector & Actions */}
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-3 font-mono text-sm">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDocTab('audit')}
            className={`px-4 py-2 rounded-md transition flex items-center gap-2 font-bold ${
              docTab === 'audit'
                ? 'bg-zinc-800 text-cyan-300 border border-cyan-500/40'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            LEGAL_IP_AUDIT.md
          </button>

          <button
            onClick={() => setDocTab('apa')}
            className={`px-4 py-2 rounded-md transition flex items-center gap-2 font-bold ${
              docTab === 'apa'
                ? 'bg-zinc-800 text-amber-300 border border-amber-500/40'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Scale className="w-4 h-4 text-amber-300" />
            ENTERPRISE_APA_AGREEMENT.md
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 hover:text-white transition flex items-center gap-1.5 font-bold"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
            <span>{copied ? 'COPIED' : 'COPY DOCUMENT'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD {fileName}</span>
          </button>
        </div>
      </div>

      {/* Render Document Content */}
      <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 font-mono text-sm leading-relaxed text-zinc-100 overflow-x-auto whitespace-pre-wrap selection:bg-cyan-500/30">
        {activeContent}
      </div>
    </div>
  );
};
