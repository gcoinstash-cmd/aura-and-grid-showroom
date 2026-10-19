import React, { useState } from 'react';
import { Cpu, Copy, Check, FileCheck, Layers, BookOpen } from 'lucide-react';

export const EngineSpecViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const engineSpec = `# GHOST FACTORYOS FLEET TRACK 3 (F1 SKUNKWORKS SERVICE ENGINE)
## ASSET SPECIFICATION: GF-T3-144
### Lattice-Mesh: Post-Quantum Cryptographic Mesh Network & Ephemeral Key-Encapsulation Engine for Zero-Trust Edge Fleets

1. ARCHITECTURAL TOPOLOGY & INGESTION FLOWS
- Zero-trust post-quantum overlay mesh across 12 to 64 edge peers.
- Ephemeral KEM handshake P99 latency SLA <= 3.20 ms.
- Out-of-band atomic WireGuard PSK rollover every 120 seconds with 0.0000% packet loss.
- Time-series telemetry partitioned in AlloyDB / PostgreSQL 16+.

2. PROPRIETARY MATHEMATICAL & ALGORITHMIC ENGINE
- Modulus q = 3329, Ring degree n = 256, Rank k = 4 (NIST Security Level 5).
- Number Theoretic Transform (NTT) forward/inverse with root of unity zeta = 17 mod 3329.
- Centered Binomial Distribution sampling (eta1=2, eta2=2).
- Public Key: t = A*s + e (mod 3329) in NTT domain.
- Ciphertext: u = InvNTT(A^T*r) + e1, v = InvNTT(t^T*r) + e2 + Decompress(Encode(m)).
- Shared Secret: K_pqc = Hash(m || Hash(PK)).
- Hybrid Key Schedule: K_session = HKDF-Extract("LATTICE-MESH-V1", SS_classical || K_pqc).

3. PRODUCTION ALLOYDB / POSTGRESQL SCHEMA
- Fully normalized relational schema with time-series partitions on tunnel_telemetry_metrics.
- Tables: mesh_edge_nodes, kem_key_pair_registry, session_ratchet_epochs, tunnel_telemetry_metrics, revocation_audit_ledger.

4. OPENAPI 3.1 & PROTOCOL SPECIFICATION
- REST endpoints: /pqc/kem/encapsulate, /pqc/kem/decapsulate, /pqc/mesh/ratchet, /pqc/mesh/nodes, /pqc/mesh/telemetry.
- Strict RFC 7807 problem details error handling and Bearer JWT authorization.

5. INSTITUTIONAL VAULT DOCUMENTATION
- LEGAL_IP_AUDIT.md: Clean-room derivation record and permissive license whitelist.
- ENTERPRISE_APA_AGREEMENT.md: Turnkey Software Asset Purchase Agreement for $145,000.00 USD.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(engineSpec);
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
              F1 Skunkworks Engine Specification (ENGINE_SPEC.md)
            </h2>
            <span className="text-base text-slate-400 block mt-1 font-mono">
              70% Workload Deliverable · 5 Monopoly Vault Criteria · Antigravity Scaffolding Blueprint
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-base border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            <span>{copied ? 'Copied Specification!' : 'Copy ENGINE_SPEC.md'}</span>
          </button>
        </div>
      </div>

      {/* 2. Document Text View */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            <span className="text-xl font-bold text-white">
              ENGINE_SPEC_T3_LATTICE.md
            </span>
          </div>

          <span className="text-base font-bold font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded">
            MONOPOLY GRADE 10/10
          </span>
        </div>

        <div className="bg-slate-950 p-6 rounded-lg border border-slate-800 max-h-[600px] overflow-y-auto">
          <pre className="text-base font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
            {engineSpec}
          </pre>
        </div>
      </div>

    </div>
  );
};
