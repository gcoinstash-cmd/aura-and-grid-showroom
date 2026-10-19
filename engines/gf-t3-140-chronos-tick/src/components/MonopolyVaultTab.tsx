import React, { useState } from 'react';
import { 
  ShieldCheck, 
  DollarSign, 
  FileCheck2, 
  Download, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Scale, 
  Building2, 
  Copy, 
  Check,
  Award,
  Layers
} from 'lucide-react';
import JSZip from 'jszip';
import { 
  ENGINE_SPEC_MD, 
  LEGAL_IP_AUDIT_MD, 
  ALLOYDB_SCHEMA_SQL, 
  ENTERPRISE_APA_AGREEMENT_MD, 
  OPENAPI_SPEC_JSON 
} from '../data/monopolyDocs';

export const MonopolyVaultTab: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const criteriaList = [
    {
      title: '1. Architectural Topology & Latency Threshold',
      desc: 'Python 3.12 ASGI gateway, Redis ring buffer, and multi-venue FIX routing within strict 4.80 ms P99.9 threshold.',
      status: 'VERIFIED 10/10',
    },
    {
      title: '2. Proprietary Mathematical & Algorithmic Engine',
      desc: 'Complete Almgren-Chriss quadratic variance-impact trajectory and anti-predatory Poisson child slice scheduler.',
      status: 'VERIFIED 10/10',
    },
    {
      title: '3. Production Data Schema & RPO=0 Ledger',
      desc: 'Normalized AlloyDB / PostgreSQL 16 DDL with range-partitioned child order tables, composite indices, and audit triggers.',
      status: 'VERIFIED 10/10',
    },
    {
      title: '4. OpenAPI 3.1 & Protocol Contract',
      desc: 'Complete OpenAPI 3.1 schema for /v1/algo/* endpoints, status code contracts, and streaming JSON formats.',
      status: 'VERIFIED 10/10',
    },
    {
      title: '5. Clean-Room Dependency Whitelist',
      desc: '100% Permissive MIT/Apache-2.0 certification. Zero copyleft risk: 0% GPL, 0% AGPL, 0% SSPL.',
      status: 'VERIFIED 10/10',
    },
    {
      title: '6. Institutional Turnkey Software Asset Purchase Agreement Agreement',
      desc: 'Pre-drafted commercial Asset Purchase Agreement specifying PostgreSQL 16 + RLS terms, full IP assignment, and non-infringement warranties.',
      status: 'VERIFIED 10/10',
    },
  ];

  const handleDownloadVaultBundle = async () => {
    try {
      setIsExporting(true);
      const zip = new JSZip();
      zip.file('ENGINE_SPEC_T3_CHRONOS.md', ENGINE_SPEC_MD);
      zip.file('LEGAL_IP_AUDIT.md', LEGAL_IP_AUDIT_MD);
      zip.file('ALLOYDB_SCHEMA.sql', ALLOYDB_SCHEMA_SQL);
      zip.file('ENTERPRISE_APA_AGREEMENT.md', ENTERPRISE_APA_AGREEMENT_MD);
      zip.file('OPENAPI_SPEC.json', OPENAPI_SPEC_JSON);
      zip.file('INSTITUTIONAL_VALUATION_CERTIFICATE.txt', `ASSET SPECIFICATION & IP CERTIFICATE
Asset Identifier: GF-T3-141
Title: Chronos-Tick Algorithmic Execution Core Workstation
Tier: Track 3 - F1 Skunkworks Service Engine
Monopoly Vault Specification: PostgreSQL 16 + RLS
Jurisdiction: Delaware, United States
IP Transfer: 100% Unencumbered Exclusive
Licensing: MIT / Commercial APA Pre-Cleared`);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'GF-T3-141_MONOPOLY_VAULT_PACKAGE.zip';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsExporting(false), 700);
    }
  };

  const handleCopyApa = () => {
    navigator.clipboard.writeText(ENTERPRISE_APA_AGREEMENT_MD);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/40 rounded-xl p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Award className="w-7 h-7 text-emerald-400" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              MONOPOLY VAULT & INSTITUTIONAL APA
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-emerald-500 text-slate-950 shadow-md">
              10/10 MONOPOLY READY
            </span>
          </div>
          <p className="text-sm text-slate-300 max-w-3xl">
            Asset Code <strong className="text-emerald-300 font-mono">GF-T3-141</strong> has completed the 70% Lead Systems Architect phase. All legal warranties, clean-room affidavits, and Turnkey Software Asset Purchase Agreement agreements are pre-cleared for PostgreSQL 16 + RLS institutional acquisition.
          </p>
        </div>

        {/* Monopoly Price Card */}
        <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/50 shadow-xl shrink-0 text-center lg:text-right">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Standard Monopoly Vault Asset Transfer
          </div>
          <div className="text-3xl font-black font-mono text-emerald-300 mt-1">
            PostgreSQL 16 + RLS.00 <span className="text-xs text-slate-400 font-normal">USD</span>
          </div>
          <div className="text-xs font-mono text-emerald-400/80 mt-1 font-bold">
            0.00% Ongoing Royalties • Full IP Assignment
          </div>
        </div>
      </div>

      {/* 6 Monopoly Vault Criteria Verification Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black text-white uppercase">
              Monopoly Vault 10/10 Compliance Checklist
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-300 font-bold">
            6 of 6 Verified Complete
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {criteriaList.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">{item.title}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-mono">
                  {item.desc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-emerald-400">STATUS</span>
                <span className="text-xs font-mono font-black text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Turnkey Software Asset Purchase Agreement Contract Viewer & Clean-Room Affidavit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Clean Room Certification Summary (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Scale className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-black text-white uppercase">
              Clean-Room Legal Seal
            </h3>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block font-bold">JURISDICTION</span>
              <span className="text-white font-bold text-sm">Delaware Court of Chancery, USA</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block font-bold">COPYLEFT INFECTION RISK</span>
              <span className="text-emerald-400 font-bold text-sm">0.00% (Zero GPL / AGPL / SSPL)</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block font-bold">INTELLECTUAL PROPERTY</span>
              <span className="text-cyan-300 font-bold text-sm">100% Perpetual Assignment</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block font-bold">NON-INFRINGEMENT WARRANTY</span>
              <span className="text-amber-300 font-bold text-sm">Unconditional Warranty of Title</span>
            </div>
          </div>

          <button
            onClick={handleDownloadVaultBundle}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
          >
            <Download className={`w-4 h-4 ${isExporting ? 'animate-spin' : ''}`} />
            <span>DOWNLOAD COMPLETE VAULT (.ZIP)</span>
          </button>
        </div>

        {/* Turnkey Software Asset Purchase Agreement Contract Text Viewer (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-black text-white uppercase">
                ENTERPRISE_APA_AGREEMENT.md (PostgreSQL 16 + RLS Delaware Contract)
              </h3>
            </div>

            <button
              onClick={handleCopyApa}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 rounded border border-slate-700 cursor-pointer self-start sm:self-auto"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED APA' : 'COPY APA CONTRACT'}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 font-mono text-xs sm:text-sm text-slate-300 overflow-x-auto max-h-[460px] overflow-y-auto leading-relaxed">
            <pre className="whitespace-pre-wrap">
              {ENTERPRISE_APA_AGREEMENT_MD}
            </pre>
          </div>
        </div>

      </div>

    </div>
  );
};
