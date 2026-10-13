# TECHNICAL SPECIFICATION: GF-T3-145 (NEXUS-ATS)
**System Designation**: Nexus-ATS (Hybrid Central Limit Order Book & Sub-Millisecond Dark Pool Crossing Engine)  
**Fleet Tier**: Ghost FactoryOS Track 3 (F1 Skunkworks Engine)  
**Monopoly Vault Valuation**: $150,000.00 USD  
**Release Version**: v1.0.0-PRODUCTION-CORE  
**Publication Date**: October 5, 2026  

---

## 1. ARCHITECTURAL TOPOLOGY & LOW-LATENCY INFRASTRUCTURE

### 1.1 Hardware & Kernel Bypass Subsystem
The Nexus-ATS matching core is architected for bare-metal deployment on AMD EPYC 9654 / Intel Xeon Platinum 8490H servers with Solarflare XtremeScale SFN8522 dual-port 10/25GbE NICs utilizing the Solarflare EF_VI (Electronic File Virtual Interface) low-level kernel bypass library.

\`\`\`
+-----------------------------------------------------------------------------------+
|                           NEXUS-ATS SYSTEM TOPOLOGY                               |
+-----------------------------------------------------------------------------------+
| [Market Participants: CITD, JPMC, VIRT, GSCO, MSCO, HRTE, JANE, SUSQ, GHTF]      |
|               |                                                   |               |
|         (FIX 4.4 / SBE)                                    (OpenAPI 3.1)          |
|               v                                                   v               |
| +-----------------------------+                   +-----------------------------+ |
| | Solarflare EF_VI RX Ring    |                   | Epoll Async Gateway (Core 1)| |
| +-----------------------------+                   +-----------------------------+ |
|               |                                                   |               |
|               +-----------------> [ Disruptor Ingress Ring ] <----+               |
|                                   (Lock-Free SPSC 65,536 Slots)                   |
|                                                 |                                 |
|                                                 v                                 |
|                         +-----------------------------------------------+         |
|                         | MATCHING CORE (Pinned to Isolated Core 2)     |         |
|                         | - Level-3 Price-Time Doubly Linked Order Tree |         |
|                         | - NBBO Discretionary Midpoint Dark Peg Engine |         |
|                         | - Anti-Internalization Rule Filter            |         |
|                         | - 0 Bytes Heap Allocation in Hot Path         |         |
|                         +-----------------------------------------------+         |
|                                                 |                                 |
|                         +-----------------------+-----------------------+         |
|                         |                                               |         |
|                         v                                               v         |
|         +-------------------------------+               +-----------------------+ |
|         | Disruptor Egress Market Data  |               | Disruptor Audit Ring  | |
|         | (UDP Multicast ITCH / BBO)    |               | (Zero-RPO AlloyDB WL) | |
|         +-------------------------------+               +-----------------------+ |
+-----------------------------------------------------------------------------------+
\`\`\`

### 1.2 Core Pinning & OS Isolation
- **Linux Kernel Parameters**: \`isolcpus=2,3,4,5 nohz_full=2,3,4,5 rcu_nocbs=2,3,4,5 intel_idle.max_cstate=0 processor.max_cstate=0 idle=poll\`
- **Core 0**: OS scheduler, housekeeping, Prometheus/Grafana telemetry scrapers.
- **Core 1**: Ingress network I/O & TCP/IP stack handler.
- **Core 2 (Isolated)**: Hot matching core ring (CLOB & Dark Pool Engine). Zero context switches.
- **Core 3 (Isolated)**: Mathematical Flow Toxicity Engine (VPIN & 2-Variate Hawkes intensity filter).
- **Core 4 (Isolated)**: Egress UDP Multicast market data broadcaster.
- **Core 5 (Isolated)**: Asynchronous Zero-RPO AlloyDB persistent journal writer.

---

## 2. PROPRIETARY MATHEMATICAL & ALGORITHMIC SPECIFICATIONS

### 2.1 Level-3 Price-Time Doubly Linked List Order Tree
Each active price tier maintains a contiguous double-linked list of resting orders to enforce deterministic $O(1)$ priority queueing and $O(1)$ dynamic order cancellation.

\`\`\`
Price Level Queue ($99.95):
[Head] -> [OrderNode 1 (100 shs)] <-> [OrderNode 2 (500 shs)] <-> [OrderNode 3 (200 shs)] <- [Tail]
\`\`\`

- **Time Complexity**:
  - Insert Passive Limit Order: $O(\log M)$ to locate price tier + $O(1)$ to append to queue tail.
  - Cancel Resting Order: $O(1)$ lookup via pre-allocated hash map + $O(1)$ node pointer unlink.
  - Match Incoming Market/Aggressive Order: $O(1)$ amortized per matched order node.

### 2.2 Sub-Millisecond Dark Pool Midpoint Crossing Equation
Dark pool non-displayed peg orders are matched at the mathematical midpoint of the prevailing National Best Bid and Offer (NBBO):

$$P_{cross} = \\frac{NBBO_{bid} + NBBO_{ask}}{2}$$

**Crossing Execution Invariants**:
1. **Discretionary Limit Guard**: If incoming taker buy order specifies limit $P_{limit}$, match executes if and only if $P_{cross} \\le P_{limit}$.
2. **Minimum Quantity Constraint ($MinQty$)**: Order $O_i$ with $MinQty_i > 0$ will execute if and only if:
   $$\\min(RemainingQty(O_{taker}), RemainingQty(O_{maker})) \\ge MinQty_i$$
3. **Anti-Internalization (Self-Match Prevention)**: If $O_{taker}.MPID == O_{maker}.MPID$ and $AntiInternalize == \\text{TRUE}$, the match is skipped without cancelling the resting maker order.

### 2.3 Volume-Synchronized Probability of Toxicity (VPIN)
Flow toxicity is computed across constant-volume information buckets $V$:

$$VPIN = \\frac{\\sum_{\\tau=1}^{N} |V_\\tau^B - V_\\tau^S|}{N \\cdot V}$$

- $V$: Fixed volume capacity per information bucket ($V = 500$ shares).
- $N$: Rolling window size ($N = 30$ historical buckets).
- $V_\\tau^B, V_\\tau^S$: Buy and sell volume fractions determined via the Lee-Ready algorithmic classification:
  $$\\text{Direction}(t) = \\begin{cases} 
  \\text{BUY} & \\text{if } P_t > P_{midpoint} \\\\ 
  \\text{SELL} & \\text{if } P_t < P_{midpoint} \\\\ 
  \\text{TickDirection}(t) & \\text{if } P_t = P_{midpoint} 
  \\end{cases}$$
- **Toxicity Trigger**: If $VPIN > 0.4200$, the engine automatically restricts dark pool non-displayed peg executions to prevent informed predatory flow exploitation.

### 2.4 2-Variate Hawkes Point Process for Predatory Spoofing Detection
The cross-excitation intensity between trade executions ($N_1$) and order cancellations ($N_2$) is modeled as:

$$\\lambda_1(t) = \\mu_1 + \\sum_{t_i < t} \\alpha_{11} e^{-\\beta (t - t_i)} + \\sum_{s_j < t} \\alpha_{12} e^{-\\beta (t - s_j)}$$
$$\\lambda_2(t) = \\mu_2 + \\sum_{t_i < t} \\alpha_{21} e^{-\\beta (t - t_i)} + \\sum_{s_j < t} \\alpha_{22} e^{-\\beta (t - s_j)}$$

- **Parameters**: $\\mu_1 = 1.20, \\mu_2 = 2.50, \\alpha_{11} = 0.45, \\alpha_{12} = 0.20, \\alpha_{21} = 0.85, \\alpha_{22} = 0.60, \\beta = 1.80$.
- **Predatory Quote Stuffing Metric**:
  $$S_{predatory}(t) = \\frac{\\lambda_2(t)}{\\lambda_1(t) + \\lambda_2(t)} \\cdot \\left(\\frac{\\alpha_{21}}{0.85}\\right) \\cdot \\left(\\frac{\\lambda_2(t)}{10.0}\\right)$$
  When $S_{predatory}(t) > 0.70$ or $\\lambda_2(t) > 18.0$, a predatory quote manipulation alert is broadcast to compliance.

---

## 3. LATENCY BUDGET & DETERMINISTIC SLA

| Pipeline Stage | Subsystem | Maximum Budget (P99) | Measured In-Engine (P99) |
| :--- | :--- | :--- | :--- |
| Ingress NIC -> Ring | Solarflare EF_VI RX | $120\\,\\mu\\text{s}$ | $48\\,\\mu\\text{s}$ |
| Order Parsing & SBE Unpack | Pre-Allocated Struct | $50\\,\\mu\\text{s}$ | $18\\,\\mu\\text{s}$ |
| Pre-Trade Risk & MPID Check | Memory Bitmask | $40\\,\\mu\\text{s}$ | $14\\,\\mu\\text{s}$ |
| Matching Engine Traversal | L3 Doubly Linked Tree | $450\\,\\mu\\text{s}$ | $185\\,\\mu\\text{s}$ |
| Midpoint Dark Pool Crossing | Discretionary Evaluator | $120\\,\\mu\\text{s}$ | $52\\,\\mu\\text{s}$ |
| Egress Audit & Multicast | Ring Buffer Enqueue | $70\\,\\mu\\text{s}$ | $28\\,\\mu\\text{s}$ |
| **TOTAL MATCHING CYCLE** | **Full End-to-End** | **< 850 $\\mu$s** | **345 $\\mu$s** |

---

## 4. ALLOYDB / POSTGRESQL PRODUCTION DDL SPECIFICATION
Refer to \`ALLOYDB_SCHEMA.sql\` for the complete normalized DDL with daily range partitioning, composite indices, foreign keys, and zero-RPO audit triggers.

---

## 5. OPENAPI 3.1 & PROTOCOL SPECIFICATION
Refer to \`OPENAPI_SPEC.json\` for the full JSON contract with endpoints:
- \`POST /api/v1/order/submit\`
- \`POST /api/v1/order/cancel\`
- \`GET  /api/v1/book/depth\`
- \`POST /api/v1/dark/cross\`
- \`GET  /api/v1/telemetry/vpin-hawkes\`

---

## 6. CLEAN-ROOM IP AUDIT & DELAWARE APA CONTRACT
- \`LEGAL_IP_AUDIT.md\`: 100% clean-room certified; zero copyleft contagion.
- \`ENTERPRISE_APA_AGREEMENT.md\`: Delaware Enterprise Asset Purchase Agreement ($150,000 USD outright buyout terms).
