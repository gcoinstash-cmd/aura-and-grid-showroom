import React, { useState } from 'react';
import { Scale, FileText, CheckCircle2, ShieldAlert, Copy, Check, Lock } from 'lucide-react';

export const LegalVaultViewer: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<'apa' | 'audit'>('apa');
  const [copied, setCopied] = useState(false);

  const apaText = `# ASSET PURCHASE AGREEMENT (ENTERPRISE MONOPOLY VAULT)
CONTRACT REFERENCE: APA-GF-T3-144-2026
TRANSACTION SPECIFICATION: $145,000.00 USD (ONE HUNDRED FORTY-FIVE THOUSAND UNITED STATES DOLLARS)
ASSET CODE & DESCRIPTION: GF-T3-144 (Lattice-Mesh: Post-Quantum Cryptographic Mesh Network & Ephemeral Key-Encapsulation Engine)
GOVERNING LAW: STATE OF DELAWARE, UNITED STATES OF AMERICA

This ASSET PURCHASE AGREEMENT (the "Agreement"), effective as of October 5, 2026, is entered into by and between GHOST FACTORYOS ARCHITECTURAL SYSTEMS LLC, a Delaware limited liability company ("Seller"), and THE INSTITUTIONAL ACQUIRER ("Purchaser").

ARTICLE I: PURCHASE AND SALE OF ASSETS
1.1 Acquired Intellectual Property Assets: Seller sells, assigns, transfers, and conveys to Purchaser free and clear of all liens and encumbrances:
  (a) Module-LWE (ML-KEM-1024) and Number Theoretic Transform (NTT) ring arithmetic over R_q = Z_3329[X]/(X^256 + 1);
  (b) Hybrid Curve25519/HKDF-SHA512 key schedules and WireGuard PSK epoch ratchets;
  (c) Normalized AlloyDB / PostgreSQL enterprise schema scripts and partition definitions (ALLOYDB_SCHEMA.sql);
  (d) OpenAPI 3.1 REST contracts and real-time telemetry collectors (OPENAPI_SPEC.json);
  (e) The complete Skunkworks Engine Specification (ENGINE_SPEC_T3_LATTICE.md).

1.2 Purchase Price: The aggregate purchase price is $145,000.00 USD payable upon delivery of the Master Vault Archive (GF-T3-144-LATTICE-MESH-10-10-VAULT-BUNDLE.zip).

ARTICLE II: REPRESENTATIONS AND WARRANTIES
2.1 Good Title: Seller is the sole legal and beneficial owner of all Acquired Assets.
2.2 Clean-Room & Non-Infringement: Zero copyleft (GPL, AGPL, SSPL) licenses contaminate the deliverable.
2.3 Mathematical Rigor: Conforms strictly to NIST FIPS 203 standards with bit-exact validation.

ARTICLE III: INTELLECTUAL PROPERTY ASSIGNMENT
3.1 Complete Worldwide Assignment: Seller irrevocably transfers all worldwide patents, copyrights, moral rights, and trade secrets in Asset GF-T3-144.

ARTICLE IV: GOVERNING LAW & JURISDICTION
4.1 Delaware Jurisdiction: Exclusive venue in the Court of Chancery of the State of Delaware.`;

  const auditText = `# INSTITUTIONAL LEGAL & INTELLECTUAL PROPERTY AUDIT
ASSET CODE: GF-T3-144
TITLE: Lattice-Mesh: Post-Quantum Cryptographic Mesh Network & Ephemeral Key-Encapsulation Engine
AUDIT CLASSIFICATION: Pristine Clean-Room Certification / Zero-Copyleft Contagion
REFERENCE CORE: $145,000.00 USD
EFFECTIVE DATE: October 5, 2026

1. EXECUTIVE CLEAN-ROOM CERTIFICATION
Ghost FactoryOS Architecture Legal and Engineering Counsel certifies that Asset GF-T3-144 was engineered under strict clean-room procedures, derived from first-principles mathematical definitions under NIST FIPS 203. No reference code from liboqs, PQClean, or third-party proprietary libraries was ingested.

2. DEPENDENCY WHITELIST & AUDIT
- react (MIT) -> Permissive -> Zero Contagion
- react-dom (MIT) -> Permissive -> Zero Contagion
- lucide-react (ISC) -> Permissive -> Zero Contagion
- motion (MIT) -> Permissive -> Zero Contagion
- jszip (MIT) -> Permissive -> Zero Contagion
- tailwindcss (MIT) -> Permissive -> Zero Contagion
- express (MIT) -> Permissive -> Zero Contagion
- typescript (Apache-2.0) -> Permissive -> Zero Contagion

Strict Blacklist: Zero GPL, AGPL, SSPL, or copyleft licenses.

3. FREEDOM TO OPERATE (FTO)
Underlying ML-KEM algorithms operate under royalty-free, universal public patent covenants submitted to NIST.

LEGAL CLEARANCE ID: CLR-GF-T3-144-2026-OCT
STATUS: 100% UNENCUMBERED / READY FOR FULL ASSET PURCHASE TRANSFER`;

  const currentContent = activeDoc === 'apa' ? apaText : auditText;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Institutional Legal &amp; Intellectual Property Vault
            </h2>
            <span className="text-base text-slate-400 block mt-1 font-mono">
              Delaware Court of Chancery Jurisdiction · $145,000.00 USD Reference Core · Zero-Copyleft Certified
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-base border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            <span>{copied ? 'Copied Contract Text!' : 'Copy Document'}</span>
          </button>
        </div>
      </div>

      {/* 2. Document Switcher Tabs */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setActiveDoc('apa')}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl border text-base font-bold transition-all ${
            activeDoc === 'apa'
              ? 'bg-slate-800 border-emerald-500 text-emerald-400 shadow-md'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
          }`}
        >
          <Scale className="w-5 h-5" />
          <span>Enterprise APA Agreement ($145,000 USD)</span>
        </button>

        <button
          onClick={() => setActiveDoc('audit')}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl border text-base font-bold transition-all ${
            activeDoc === 'audit'
              ? 'bg-slate-800 border-emerald-500 text-emerald-400 shadow-md'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Clean-Room IP Audit &amp; Whitelist</span>
        </button>
      </div>

      {/* 3. Document Text Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span className="text-xl font-bold text-white">
              {activeDoc === 'apa' ? 'ENTERPRISE_APA_AGREEMENT.md' : 'LEGAL_IP_AUDIT.md'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-base text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded font-bold font-mono">
              UNENCUMBERED
            </span>
          </div>
        </div>

        <div className="bg-slate-950 p-6 rounded-lg border border-slate-800 max-h-[600px] overflow-y-auto">
          <pre className="text-base font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
            {currentContent}
          </pre>
        </div>
      </div>

    </div>
  );
};
