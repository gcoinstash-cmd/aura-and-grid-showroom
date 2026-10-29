import React, { useState } from 'react';
import { ShieldCheck, FileText, CheckCircle2, Copy, Download, Code2, Server } from 'lucide-react';

export const TransferSpecTab: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<'ENGINE_SPEC' | 'LEGAL_IP_AUDIT' | 'ASSET_TRANSFER_SPEC' | 'engine.py' | 'test_vector_engine.py' | 'Dockerfile'>('LEGAL_IP_AUDIT');
  const [copied, setCopied] = useState<boolean>(false);

  const docContents: Record<string, string> = {
    LEGAL_IP_AUDIT: `# LEGAL_IP_AUDIT.md: GF-T3-215 Clean-Room IP & Compliance Attestation

## 1. Clean-Room Provenance & Intellectual Property Attestation
The APEX-215 Vector Embedding Quantization & HNSW Graph Index Engine represents an original, clean-room software asset architected from foundational algorithmic literature (Malkov & Yashunin, 2018; Jegou et al., 2011).
- Independent Clean-Room Creation: All mathematical routines, data structures, and graph navigation algorithms were implemented de novo.
- Zero Third-Party Trademark / Proprietary Embeddings: Zero integration with or code from commercial vector database vendors.
- Zero Copyleft Contamination: Strictly clean of GNU GPL (v1/v2/v3), AGPL, LGPL, SSPL, or reciprocal copyleft code.

## 2. Permissive License Whitelist
- FastAPI: MIT Permissive (Approved)
- Pydantic: MIT Permissive (Approved)
- Uvicorn: BSD-3-Clause Permissive (Approved)
- React: MIT Permissive (Approved)
- Tailwind CSS: MIT Permissive (Approved)

## 3. NIST SP 800-218 SSDF v1.1 Compliance Checklist
- PO.1.1: Security Requirements Defined (Compliant)
- PO.3.1: Maintain Toolchains Hermetically (Compliant)
- PS.1.1: Code Protection & Standalone Repository (Compliant)
- PW.1.1: Security Architecture & Boundary Verification (Compliant)
- PW.4.1: Human-Readable Code Static Analysis (Compliant)
- PW.7.1: Secure Default Configurations (UID 10001 Non-Root) (Compliant)
- RV.1.1: Vulnerability Regression & Invariant Unit Tests (Compliant)`,

    ASSET_TRANSFER_SPEC: `# ASSET_TRANSFER_SPEC.md: GF-T3-215 Standalone Asset Transfer Specification

## 1. Scope of Asset Purchase & Deliverables
This technical transfer specification governs the complete, clean-room handoff of the APEX-215 Vector Embedding Quantization & HNSW Graph Index Engine (Catalog Track 3: Enterprise Reference Core) from sole proprietor developer to acquiring entity under a standard commercial Asset Purchase Agreement (APA).

In-Scope Deliverables:
1. engine.py: Standalone FastAPI vector index service, HNSW multi-layer graph engine, Product Quantizer codebooks, and Asymmetric Distance Computation (ADC) matrix.
2. test_vector_engine.py: Automated Pytest verification suite covering recall, compression, O(log N) complexity, and determinism.
3. Dockerfile: Multi-stage, unprivileged non-root container profile designed for container engines and cloud orchestration.
4. Institutional Vector Index Terminal: High-density React/TypeScript cockpit for graph inspection, ADC table exploration, and recall benchmarking.
5. Technical Specs: ENGINE_SPEC.md, LEGAL_IP_AUDIT.md, ASSET_TRANSFER_SPEC.md.

## 2. Direct Repository Transfer Protocol
- Zero-SaaS Disclaimer: Standalone unencumbered source code transfer. Zero ongoing SaaS fees, zero per-seat licensing, zero per-node fees, zero uptime SLAs.
- Clean Title Warranty: Full sole ownership, free and clear of all liens, encumbrances, security interests, or third-party claims.`,

    ENGINE_SPEC: `# ENGINE_SPEC.md: GF-T3-215 APEX-215 Vector Index & Quantization Engine

## 1. Architectural Topology & System Boundaries
High-dimensional vector search mesh with embedded Product Quantization (PQ) and Asymmetric Distance Computation (ADC).
Multi-layer graph traversal with skip-list mechanics: Layer 0 (dense base) to Layer L (sparse highway).
Heuristic neighbor pruning enforcing maximum degree M and search width ef_search.

## 2. Algorithmic Formulations
- HNSW Skip-Graph Navigation: L_max down to 0, priority queue bounded by ef_search.
- Product Quantization: D dimensions split into M sub-vectors mapped to 256 Voronoi centroids per sub-space.
- Asymmetric Distance Computation (ADC): Precomputed distance table LUT[M, 256] resolves distances with zero decompression.
- Brute Force Exact Ground Truth: Verifies deterministic Recall@10 >= 95.0%.`,

    'engine.py': `# Standalone FastAPI backend engine
# Available in root workspace as /engine.py
# Implements HNSWGraph, ProductQuantizer, ADC matrix, and FastAPI endpoints.`,

    'test_vector_engine.py': `# Pytest suite validating the 4 Core Invariants:
# 1. Recall invariant (>= 95% Recall@10)
# 2. Compression invariant (>= 8x memory reduction)
# 3. Search complexity (sub-linear O(log N))
# 4. Determinism (identical queries yield identical ID sets)`,

    Dockerfile: `# Multi-stage non-root container for Google Cloud Run deployment
# Stage 1: python:3.11-slim builder
# Stage 2: python:3.11-slim runner (UID 10001 unprivileged non-root)`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(docContents[activeDoc] || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Top Banner: APA Buyout & Clean-Room Parity */}
      <div className="rounded-lg border border-slate-800 bg-[#090D18] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Asset Purchase Agreement (APA) Buyout Technical Specifications
              </h2>
              <div className="text-sm text-slate-400 mt-0.5">
                Catalog Track 3: Enterprise Reference Core · Clean Title Warranty · Zero-SaaS SLA Disclaimer
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="min-h-[44px] px-5 py-2.5 text-base font-bold flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Copy className="h-4 w-4" />
              <span>{copied ? 'Copied to Clipboard' : 'Copy Active Document'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* NIST SP 800-218 SSDF v1.1 Verification Matrix Table */}
      <div className="rounded-lg border border-slate-800 bg-[#090D18] overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-[#0B1120]">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            NIST SP 800-218 Secure Software Development Framework (SSDF v1.1) Audit
          </h3>
          <div className="text-sm text-slate-400 mt-0.5">
            Verified clean-room software development lifecycle practices
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-[#070A11] text-slate-400 font-medium">
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Practice Description</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Technical Verification Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              <tr className="hover:bg-slate-900/30">
                <td className="py-3 px-4 text-cyan-400 font-bold">PO.1.1</td>
                <td className="py-3 px-4 text-slate-200 font-sans">Define Security Requirements</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">COMPLIANT</td>
                <td className="py-3 px-4 text-slate-400 font-sans">Memory-safe typed arrays, non-root user (UID 10001)</td>
              </tr>
              <tr className="hover:bg-slate-900/30">
                <td className="py-3 px-4 text-cyan-400 font-bold">PO.3.1</td>
                <td className="py-3 px-4 text-slate-200 font-sans">Maintain Toolchains</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">COMPLIANT</td>
                <td className="py-3 px-4 text-slate-400 font-sans">Multi-stage Dockerfile, reproducible Python 3.11 environment</td>
              </tr>
              <tr className="hover:bg-slate-900/30">
                <td className="py-3 px-4 text-cyan-400 font-bold">PS.1.1</td>
                <td className="py-3 px-4 text-slate-200 font-sans">Protect Code Integrity</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">COMPLIANT</td>
                <td className="py-3 px-4 text-slate-400 font-sans">Standalone repository, zero external database vendor links</td>
              </tr>
              <tr className="hover:bg-slate-900/30">
                <td className="py-3 px-4 text-cyan-400 font-bold">PW.1.1</td>
                <td className="py-3 px-4 text-slate-200 font-sans">Design Software for Security</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">COMPLIANT</td>
                <td className="py-3 px-4 text-slate-400 font-sans">Pydantic input bounds validation, strict parameter types</td>
              </tr>
              <tr className="hover:bg-slate-900/30">
                <td className="py-3 px-4 text-cyan-400 font-bold">PW.7.1</td>
                <td className="py-3 px-4 text-slate-200 font-sans">Secure Defaults</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">COMPLIANT</td>
                <td className="py-3 px-4 text-slate-400 font-sans">Unprivileged container execution, isolated ports</td>
              </tr>
              <tr className="hover:bg-slate-900/30">
                <td className="py-3 px-4 text-cyan-400 font-bold">RV.1.1</td>
                <td className="py-3 px-4 text-slate-200 font-sans">Confirm Vulnerabilities & Invariants</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">COMPLIANT</td>
                <td className="py-3 px-4 text-slate-400 font-sans">test_vector_engine.py automated regression suite</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Embedded Document Inspector */}
      <div className="rounded-lg border border-slate-800 bg-[#090D18] flex flex-col">
        {/* Document Selector Tabs */}
        <div className="flex flex-wrap items-center border-b border-slate-800 bg-[#0B1120] p-2 gap-2">
          {(['LEGAL_IP_AUDIT', 'ASSET_TRANSFER_SPEC', 'ENGINE_SPEC', 'engine.py', 'test_vector_engine.py', 'Dockerfile'] as const).map(
            (doc) => (
              <button
                key={doc}
                onClick={() => setActiveDoc(doc)}
                className={
                  'px-4 py-2 text-sm font-semibold rounded-md transition-colors cursor-pointer ' +
                  (activeDoc === doc
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200')
                }
              >
                {doc}
              </button>
            )
          )}
        </div>

        {/* Document Code Viewer */}
        <div className="p-5 bg-[#070A11] max-h-[460px] overflow-y-auto">
          <pre className="font-mono text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
            {docContents[activeDoc]}
          </pre>
        </div>
      </div>
    </div>
  );
};
