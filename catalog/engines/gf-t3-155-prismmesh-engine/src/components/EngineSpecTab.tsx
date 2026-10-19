import React, { useState } from 'react';
import { BookOpen, Copy, Check, Download, FileCode, Layers, ShieldCheck, Terminal } from 'lucide-react';

interface EngineSpecTabProps {
  specContent: string;
}

export const EngineSpecTab: React.FC<EngineSpecTabProps> = ({ specContent }) => {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('all');

  const handleCopy = () => {
    navigator.clipboard.writeText(specContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([specContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ENGINE_SPEC.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-fuchsia-400" />
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              ENGINE_SPEC.MD · MONOPOLY VAULT DELIVERABLE
            </h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Formal auction theory proofs, sub-12µs Knapsack algorithms, PostgreSQL DDL schemas, and OpenAPI 3.1 endpoints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-2 text-sm transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? 'COPIED SPEC' : 'COPY SPEC.MD'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold flex items-center gap-2 text-sm shadow-lg shadow-fuchsia-950/40 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD ENGINE_SPEC.MD</span>
          </button>
        </div>
      </div>

      {/* Structured Document Content Viewer */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl font-mono text-sm leading-relaxed text-slate-300">
        <div className="space-y-8">
          {/* Section 1 */}
          <section className="border-b border-slate-800 pb-6">
            <h3 className="text-lg font-bold text-fuchsia-400 uppercase tracking-tight mb-3">
              1. Executive Summary & Asset Metrics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500">Asset Tag:</span>
                <p className="font-bold text-white">GF-T3-155</p>
              </div>
              <div>
                <span className="text-slate-500">Codename:</span>
                <p className="font-bold text-fuchsia-400">PrismMesh Engine</p>
              </div>
              <div>
                <span className="text-slate-500">APA Reference Core:</span>
                <p className="font-bold text-emerald-400">20 kHz (0.48ms)</p>
              </div>
              <div>
                <span className="text-slate-500">Clean IP:</span>
                <p className="font-bold text-blue-400">100% Permissive</p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="border-b border-slate-800 pb-6">
            <h3 className="text-lg font-bold text-blue-400 uppercase tracking-tight mb-3">
              2. Architectural Topology & PBS Boundaries
            </h3>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs overflow-x-auto">
              <pre className="text-slate-300">
{`[ SEARCHER FLEET (MEV BOTS) ]
            |  (JSON-RPC: eth_sendBundle)
            v
[ GCP CLOUD ARMOR & L7 RATE LIMITING ]
            |
            v
[ PRISMMESH PBS RELAY CORE (DISTROLESS) ]
  ├── 1. Keccak-256 Commit-Reveal Ingestion
  ├── 2. Atomic Simulation & Revert Insulation (Drop on revert)
  ├── 3. DAG Dependency Matrix & Bernstein Condition Resolver
  ├── 4. Toxic MEV Sandwich Attack Filter
  └── 5. Combinatorial Knapsack Allocator (30M Gas Target)
            |  (gRPC Engine API: builder_getPayloadHeader)
            v
[ VALIDATOR PROPOSER / CONSENSUS CLIENT ]`}
              </pre>
            </div>
          </section>

          {/* Section 3 */}
          <section className="border-b border-slate-800 pb-6">
            <h3 className="text-lg font-bold text-emerald-400 uppercase tracking-tight mb-3">
              3. Proprietary Mathematical & Algorithmic Engine
            </h3>
            <div className="space-y-4 text-xs font-sans text-slate-300">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono">
                <p className="text-fuchsia-300 font-bold mb-2">3.1 Combinatorial Knapsack Formulation:</p>
                <div className="text-slate-200">
                  max ∑ (x_i · v_i) <br />
                  subject to: <br />
                  1. ∑ (x_i · g_i) ≤ 30,000,000 Gas <br />
                  2. ∀ i ≠ j: x_i · x_j = 1 ⟹ (W_i ∩ R_j = ∅) ∧ (R_i ∩ W_j = ∅) ∧ (W_i ∩ W_j = ∅) <br />
                  3. x_i ∈ {'{0, 1}'}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono">
                <p className="text-blue-300 font-bold mb-2">3.2 DAG Kahn Density Preemption:</p>
                <p className="text-slate-300">
                  Directed edge e = (B_i → B_j) is added when State(B_i) ∩ State(B_j) ≠ ∅ and Density(B_i) ≥ Density(B_j).
                  Kahn's topological sort extracts conflict-free order in O(|V| + |E|) time complexity, resolving in sub-12 µs.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono">
                <p className="text-amber-300 font-bold mb-2">3.3 Sandwich Detection Vector:</p>
                <p className="text-slate-300">
                  k ≥ 3 ∧ Sender(tx_1) = Sender(tx_k) ∧ ∃ victim: Sender(victim) ≠ Sender(tx_1) ∧ Pool(tx_1) = Pool(victim) = Pool(tx_k).
                  Flagged as SANDWICH_TOXIC and drops victim exploitation attempts from the relay.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="border-b border-slate-800 pb-6">
            <h3 className="text-lg font-bold text-fuchsia-400 uppercase tracking-tight mb-3">
              4. Production PostgreSQL / AlloyDB DDL Schemas
            </h3>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs overflow-x-auto">
              <pre className="text-slate-300">
{`CREATE TABLE auction_slots (
    slot_number BIGINT PRIMARY KEY,
    block_number BIGINT NOT NULL,
    proposer_address VARCHAR(42) NOT NULL,
    gas_target BIGINT NOT NULL DEFAULT 30000000,
    gas_utilized BIGINT NOT NULL DEFAULT 0,
    total_tip_wei NUMERIC(38, 0) NOT NULL DEFAULT 0,
    bundle_count INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN'
);

CREATE TABLE bundles (
    bundle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_number BIGINT NOT NULL REFERENCES auction_slots(slot_number) ON DELETE CASCADE,
    searcher_address VARCHAR(42) NOT NULL,
    tip_bid_wei NUMERIC(38, 0) NOT NULL,
    gas_limit BIGINT NOT NULL,
    commitment_hash VARCHAR(66) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    insulation_guarantee BOOLEAN NOT NULL DEFAULT TRUE
);`}
              </pre>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h3 className="text-lg font-bold text-amber-400 uppercase tracking-tight mb-3">
              5. Clean-Room Whitelist & Cloud Run Enterprise Architecture
            </h3>
            <p className="text-xs text-slate-300 mb-3">
              Zero GPL/AGPL copyleft dependencies. Packaged in a multi-stage unprivileged distroless container exposing port 8080 with automated health checks at <code>/healthz</code>, GCP Secret Manager integration, 70% CPU horizontal autoscaling triggers, Cloud Trace, and VPC Service Controls.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
