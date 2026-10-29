import React, { useState } from 'react';

export const SpecViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const rawMarkdown = `# APEX-202 (FinTech/Quant Series) - High-Frequency Limit Order Book & Liquidity Matching Engine
## Engineering Specification Document (ENGINE_SPEC.md)
**Standard:** Ghost FactoryOS Track 3 Backend Monopoly Architecture
**Licensing:** Permissive Clean-Room MIT Architecture (Zero Copyleft / Zero GPL/AGPL)
**System Classification:** Deterministic Real-Time Fixed-Point Matching Engine

---

### Track 3 Monopoly Gate Verification Matrix

| Gate | Category | Requirement | Architectural Proof & Compliance |
| :--- | :--- | :--- | :--- |
| Gate 1 | Core Matching Engine & Math | Deterministic Price-Time Priority (FIFO) | Strict queue-per-price-level structure; oldest timestamp matched first at best price. |
| Gate 1 | Fixed-Point Arithmetic | Zero floating-point drift | Integer microunits (10^6 multiplier); zero float primitives in critical paths. |
| Gate 1 | Algorithmic Complexity | O(1) best bid/ask; O(log P) price insertion; O(1) queue execution | Min/Max heap with price-indexed doubly-linked queues and hash table index. |
| Gate 1 | Order Primitives | Limit, Market, and Cancel orders | Native limit crossing, market aggressive sweep, and sub-millisecond cancel. |
| Gate 1 | Trade Settlements | Atomic fills & event emission | Deterministic monotonic sequence numbers with hash-chained audit settlement stream. |
| Gate 2 | Clean-Room IP | MIT License / Zero copyleft | 100% clean-room Python standard library + permissive MIT dependencies only. |
| Gate 2 | Async Framework | High-performance Python backend | Asynchronous FastAPI service with non-blocking event loops and in-memory caches. |
| Gate 3 | Enterprise Hardening | OpenAPI 3.1 & RBAC Security | Complete OpenAPI 3.1 spec; Header-based RBAC (X-API-Key & X-Role) enforcement. |
| Gate 3 | Audit & Durability | State snapshotting & audit trail | Bit-exact state serialization, deterministic replay, and integrity verification. |

---

### Algorithmic Complexity Proofs

Let N denote the total open orders, and P denote the number of unique price levels (P <= N).

- Best-Bid & Best-Ask Access in O(1):
  Heaps index the best prices. The root element is accessed in O(1) amortized with lazy tombstone pruning.

- Order Insertion in O(log P):
  If the price level already exists, queue append is O(1). If a new price level is formed, heap insertion is O(log P).

- Order Cancellation in O(1) Amortized:
  Order lookup by order_id is O(1). Removing from queue and adjusting price level volume is O(1). Exhausted levels are lazily pruned.

- Fixed-Point Settlement Calculation:
  Settlement = floor((FillPrice_micros * FillQty_micros) / 1,000,000)
  Strict integer arithmetic with zero floating point representation error.
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 text-slate-200">
      {/* Title Banner */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
            APEX-202 Specification (ENGINE_SPEC.md)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ghost FactoryOS Track 3 Backend Monopoly Architecture · Clean-Room MIT
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors cursor-pointer"
        >
          {copied ? 'Copied Markdown' : 'Copy ENGINE_SPEC.md'}
        </button>
      </div>

      {/* Monopoly Gates Compliance Table */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-white">
          1. Ghost FactoryOS Track 3 Monopoly Gates Matrix
        </h2>
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="py-2.5 px-4">Gate</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Requirement</th>
                <th className="py-2.5 px-4">Architectural Proof & Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono text-[11px]">
              <tr>
                <td className="py-2.5 px-4 font-semibold text-emerald-400">Gate 1</td>
                <td className="py-2.5 px-4 text-slate-300">Core Matching Engine & Math</td>
                <td className="py-2.5 px-4 text-slate-400">Price-Time FIFO Priority</td>
                <td className="py-2.5 px-4 text-slate-300">
                  Strict queue-per-price-level structure; head deque item executed first.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-emerald-400">Gate 1</td>
                <td className="py-2.5 px-4 text-slate-300">Fixed-Point Arithmetic</td>
                <td className="py-2.5 px-4 text-slate-400">Zero Floating Drift</td>
                <td className="py-2.5 px-4 text-slate-300">
                  Integer microunits (10^6); 64-bit integer floor division for settlements.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-emerald-400">Gate 1</td>
                <td className="py-2.5 px-4 text-slate-300">Algorithmic Bounds</td>
                <td className="py-2.5 px-4 text-slate-400">O(1) Top of Book</td>
                <td className="py-2.5 px-4 text-slate-300">
                  Min/Max heap roots index best bid/ask; O(log P) price discovery.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-emerald-400">Gate 1</td>
                <td className="py-2.5 px-4 text-slate-300">Order Primitives</td>
                <td className="py-2.5 px-4 text-slate-400">Limit, Market, Cancel</td>
                <td className="py-2.5 px-4 text-slate-300">
                  GTC, IOC, and FOK order execution with price improvement for takers.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-emerald-400">Gate 2</td>
                <td className="py-2.5 px-4 text-slate-300">Clean-Room IP</td>
                <td className="py-2.5 px-4 text-slate-400">MIT / Zero Copyleft</td>
                <td className="py-2.5 px-4 text-slate-300">
                  Zero GPL/AGPL dependencies; standard Python heapq and dataclasses.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-emerald-400">Gate 3</td>
                <td className="py-2.5 px-4 text-slate-300">Enterprise Hardening</td>
                <td className="py-2.5 px-4 text-slate-400">OpenAPI 3.1 & RBAC</td>
                <td className="py-2.5 px-4 text-slate-300">
                  Header-based RBAC (ADMIN, TRADER, AUDITOR, READONLY) & strict schemas.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-emerald-400">Gate 3</td>
                <td className="py-2.5 px-4 text-slate-300">Audit & Durability</td>
                <td className="py-2.5 px-4 text-slate-400">State Snapshotting</td>
                <td className="py-2.5 px-4 text-slate-300">
                  Monotonic sequencing, cryptographic SHA-256 trade chaining, and bit-exact recovery.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Mathematical Formulation Section */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-white">
          2. Mathematical Rigor & Fixed-Point Microunit Arithmetic
        </h2>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            Standard financial systems suffer from representation drift when using standard IEEE 754 floating-point types:
            binary fractions cannot represent values like <code className="text-emerald-400 font-mono">0.1</code> or <code className="text-emerald-400 font-mono">0.01</code> exactly, leading to accumulated rounding discrepancies.
          </p>
          <div className="p-3 bg-slate-950 rounded border border-slate-800/80 font-mono text-[11px] space-y-1">
            <div className="text-slate-400">// Scaling Constant: 10^6</div>
            <div>Price_micros = round(Price_decimal × 1,000,000)</div>
            <div>Quantity_micros = round(Quantity_decimal × 1,000,000)</div>
            <div className="text-emerald-400 font-semibold">
              Settlement_micros = (Price_micros × Quantity_micros) // 1,000,000
            </div>
          </div>
          <p>
            The integer floor division operator <code className="text-emerald-400 font-mono">//</code> ensures zero fractional remainders and identical execution across CPU architectures.
          </p>
        </div>
      </section>

      {/* Algorithmic Complexity Section */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-white">
          3. Algorithmic Complexity Proofs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
            <h3 className="text-xs font-semibold text-slate-200">
              O(1) Best Bid & Ask Access
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Price levels are organized in a dual binary heap (max-heap for bids, min-heap for asks). Best prices are fetched directly from root index 0. Depleted levels are lazily removed upon access.
            </p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
            <h3 className="text-xs font-semibold text-slate-200">
              O(log P) Order Insertion
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Existing price levels resolve via hash table in O(1). Newly created price levels are inserted into the binary heap in O(log P), where P is the number of distinct price levels.
            </p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
            <h3 className="text-xs font-semibold text-slate-200">
              O(1) Amortized Cancellation
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Orders are mapped directly via hash index <code className="text-slate-300 font-mono">orders_by_id</code>. Deletion from the price level deque and volume decrement execute in O(1).
            </p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
            <h3 className="text-xs font-semibold text-slate-200">
              Strict FIFO Time Priority
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Each price level maintains a FIFO queue. Incoming market sweeps consume resting orders from queue head to tail, ensuring priority for earlier arrivals.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
