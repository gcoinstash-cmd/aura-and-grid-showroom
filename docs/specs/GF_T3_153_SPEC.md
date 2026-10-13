# ENGINE_SPEC.md — GF-T3-153: AegisSovereign Engine
**Document Version:** 1.0.0-PROD  
**Classification:** Institutional Monopoly Vault Gate // Tier 3 F1 Skunkworks Service Engine  
**Asset Tag:** `GF-T3-153`  
**Standalone APA Buyout Anchor:** $125,000 USD  
**Commercial Licensing Schedule:** $85,000 – $150,000 USD  
**Target Performance Invariant:** Sub-15 ms 3-of-5 FROST/Feldman VSS signature round aggregation; zero-reorg atomic Delivery-versus-Payment (DvP) state transitions.

---

## 1. ARCHITECTURAL TOPOLOGY & SYSTEM BOUNDARIES

```
                             [ Institutional Clearing API Gateway ]
                                  (Mutual TLS 1.3 / Port 8080)
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        ▼                                             ▼
          ┌───────────────────────────┐                 ┌───────────────────────────┐
          │  Asset Leg Escrow Pipe    │                 │   Cash Leg Escrow Pipe    │
          │  (ERC-3643 / FinP2P / UST)│                 │ (Wholesale CBDC / FedNow) │
          └─────────────┬─────────────┘                 └─────────────┬─────────────┘
                        │                                             │
                        └──────────────────────┬──────────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │ Atomic 2PC DvP Coordinator Core │
                              │    (State Machine / Invariants)  │
                              └────────────────┬─────────────────┘
                                               │
                       ┌───────────────────────┼───────────────────────┐
                       ▼                       ▼                       ▼
               ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
               │ TSS Enclave 1 │       │ TSS Enclave 2 │       │ TSS Enclave 3 │
               │ (AWS Nitro)   │       │ (GCP Shielded)│       │ (Azure SGX)   │
               │ Node Alpha    │       │ Node Beta     │       │ Node Gamma    │
               └───────┬───────┘       └───────┬───────┘       └───────┬───────┘
                       │                       │                       │
                       └───────────────────────┼───────────────────────┘
                                               ▼
                              ┌──────────────────────────────────┐
                              │  FROST Schnorr Signature Round   │
                              │     Aggregator (z = ∑ z_i mod n) │
                              └────────────────┬─────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │ Atomic State Commit & Settlement │
                              │  (Zero-Reorg Ledger Finality)    │
                              └──────────────────────────────────┘
```

### 1.1 Ingestion & Transport Specifications
- **Transport Protocols:** gRPC over HTTP/2 with protobuf v3 payloads; fallback to HTTPS REST (OpenAPI 3.1) with Ed25519 request authorization headers.
- **Mutual TLS Configuration:** TLS 1.3 enforced with curve X25519 and cipher suite `TLS_AES_256_GCM_SHA384`. Client certificates mandatory.
- **Node Enclave Isolation:** TSS node instances execute within isolated hardware security modules (HSM) or confidential VMs (AWS Nitro Enclaves, GCP Confidential Space, Azure SGX).
- **Communication Invariant:** No node ever transmits raw secret key shards across network boundaries. Round 1 exchanges only nonce commitments $(D_i, E_i)$; Round 2 exchanges only partial scalar signatures $z_i$.

---

## 2. PROPRIETARY MATHEMATICAL & ALGORITHMIC ENGINE

### 2.1 Cryptographic Curve & Finite Field Foundations
All scalar operations operate over the Secp256k1 base field and order:
$$\text{Group Order } n = \text{0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141}$$
$$\text{Prime Field } p = \text{0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F}$$
$$\text{Generator Point } G = (G_x, G_y)$$

### 2.2 Feldman Verifiable Secret Sharing (VSS) Scheme
For a $(k, n) = (3, 5)$ threshold consensus:
1. **Polynomial Generation:**
   A secret polynomial $f(x) \in \mathbb{Z}_n[x]$ of degree $k - 1 = 2$ is chosen:
   $$f(x) = s + a_1 x + a_2 x^2 \pmod n$$
   where $s = f(0)$ represents the master private settlement key, and $a_1, a_2 \xleftarrow{\$} \mathbb{Z}_n^*$.

2. **Share Distribution:**
   Each participant node $i \in \{1, 2, 3, 4, 5\}$ receives secret shard $s_i = f(i) \pmod n$.

3. **Verifiable Public Commitments:**
   The dealer publishes coefficient commitments:
   $$C_j = a_j \cdot G \quad \text{for } j \in \{0, 1, 2\} \quad (\text{with } C_0 = s \cdot G = Y)$$
   Each participant verifies their share consistency:
   $$s_i \cdot G \stackrel{?}{=} \sum_{j=0}^{k-1} i^j \cdot C_j$$

### 2.3 FROST Two-Round Threshold Schnorr Signature Scheme (RFC 9380)

#### Round 1: Nonce Commitment Generation
Each selected signer $i \in S$ (where $|S| \ge 3$):
1. Samples secret hiding nonce $d_i \xleftarrow{\$} \mathbb{Z}_n^*$ and binding nonce $e_i \xleftarrow{\$} \mathbb{Z}_n^*$.
2. Computes public commitments $D_i = d_i \cdot G$ and $E_i = e_i \cdot G$.
3. Publishes tuple $(i, D_i, E_i)$ to the settlement coordinator.

#### Coordinator Aggregation & Binding Factor
1. Let $B = \{(i, D_i, E_i)\}_{i \in S}$.
2. For each $i \in S$, the coordinator derives the unique binding factor $\rho_i$:
   $$\rho_i = H_1(i, m, B) \pmod n$$
   This prevents concurrent session forgery attacks (Drijvers et al., 2019).
3. The group nonce commitment $R$ is computed:
   $$R = \sum_{i \in S} (D_i + \rho_i \cdot E_i)$$
4. The Fiat-Shamir challenge is derived:
   $$c = H_2(R, Y, m) \pmod n$$

#### Round 2: Partial Signature Generation
Each participant $i \in S$ calculates their Lagrange interpolation coefficient:
$$\lambda_i = \prod_{j \in S, j \neq i} \frac{j}{j - i} \pmod n$$
Participant $i$ produces partial signature:
$$z_i = d_i + (e_i \cdot \rho_i) + (\lambda_i \cdot s_i \cdot c) \pmod n$$

#### Verification & Aggregation
Coordinator verifies each $z_i \cdot G \stackrel{?}{=} D_i + \rho_i \cdot E_i + c \cdot \lambda_i \cdot Y_i$.
Upon passing all checks, aggregate signature scalar is formed:
$$z = \sum_{i \in S} z_i \pmod n$$
The resulting pair $(R, z)$ is a standard Schnorr signature satisfying:
$$z \cdot G = R + c \cdot Y$$

---

## 3. ATOMIC DELIVERY-VERSUS-PAYMENT (DvP) STATE MACHINE

### 3.1 State Transition Matrix

| Current State | Event Trigger | Next State | Collateral State | Timeout Guard |
|---|---|---|---|---|
| `INITIALIZED` | Verify Solvency & Nonce | `PREPARE_LEGS` | Unlocked | $T_0 + 1000\text{ms}$ |
| `PREPARE_LEGS` | Lock Collateral on Both Ledgers | `ESCROW_LOCKED` | Bilateral Lock | $T_0 + 3000\text{ms}$ |
| `PREPARE_LEGS` | Cash/Asset Lock Timeout | `ROLLBACK_EXPIRED` | Escrow Refunded | Terminated |
| `ESCROW_LOCKED` | Round 1 Commitments Emitted | `TSS_ROUND_1_NONCE` | Escrow Locked | $T_0 + 4000\text{ms}$ |
| `TSS_ROUND_1_NONCE` | Round 2 Signatures Emitted | `TSS_ROUND_2_PARTIAL_SIGN` | Escrow Locked | $T_0 + 4500\text{ms}$ |
| `TSS_ROUND_2_PARTIAL_SIGN` | $k \ge 3$ Signatures Verified | `COMMIT_SETTLED` | Ownership Swapped | Zero-Reorg Commit |
| Any TSS State | Rogue Node or Byzantine Failure | `ROLLBACK_FAULT` | Auto-Refund Escrow | Immediate |

---

## 4. PRODUCTION DATA SCHEMA (POSTGRESQL 16 / ALLOYDB)

```sql
-- Schema: aegis_settlement_v1
CREATE SCHEMA IF NOT EXISTS aegis_settlement_v1;

CREATE TYPE aegis_settlement_v1.dvp_state AS ENUM (
    'INITIALIZED',
    'PREPARE_LEGS',
    'ESCROW_LOCKED',
    'TSS_ROUND_1_NONCE',
    'TSS_ROUND_2_PARTIAL_SIGN',
    'COMMIT_SETTLED',
    'ROLLBACK_EXPIRED',
    'ROLLBACK_FAULT'
);

-- Master Settlement Transactions Table
CREATE TABLE aegis_settlement_v1.settlement_transactions (
    trade_id VARCHAR(64) PRIMARY KEY,
    settlement_nonce BIGINT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    state aegis_settlement_v1.dvp_state NOT NULL DEFAULT 'INITIALIZED',
    timeout_window_ms INTEGER NOT NULL DEFAULT 5000,
    
    -- Asset Leg (Security / Tokenized Bond)
    asset_ticker VARCHAR(32) NOT NULL,
    asset_units NUMERIC(38, 0) NOT NULL CHECK (asset_units > 0),
    asset_seller VARCHAR(128) NOT NULL,
    asset_destination VARCHAR(128) NOT NULL,
    asset_escrow_hash VARCHAR(64),
    
    -- Cash Leg (Wholesale CBDC / USDC)
    cash_ticker VARCHAR(32) NOT NULL,
    cash_units NUMERIC(38, 0) NOT NULL CHECK (cash_units > 0),
    cash_buyer VARCHAR(128) NOT NULL,
    cash_destination VARCHAR(128) NOT NULL,
    cash_escrow_hash VARCHAR(64),
    
    -- TSS Consensus Metadata
    active_signer_set INTEGER[] DEFAULT '{}',
    schnorr_r_commitment VARCHAR(130),
    schnorr_z_aggregate VARCHAR(66),
    state_root_hash VARCHAR(64) NOT NULL
);

-- Audit Trail Log
CREATE TABLE aegis_settlement_v1.settlement_audit_log (
    audit_id BIGSERIAL PRIMARY KEY,
    trade_id VARCHAR(64) NOT NULL REFERENCES aegis_settlement_v1.settlement_transactions(trade_id) ON DELETE RESTRICT,
    previous_state aegis_settlement_v1.dvp_state,
    new_state aegis_settlement_v1.dvp_state NOT NULL,
    transitioned_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    transition_latency_ms NUMERIC(10, 4) NOT NULL,
    log_detail TEXT NOT NULL
);

-- Indices for sub-millisecond query execution
CREATE INDEX idx_settlement_nonce ON aegis_settlement_v1.settlement_transactions(settlement_nonce);
CREATE INDEX idx_settlement_state ON aegis_settlement_v1.settlement_transactions(state);
CREATE INDEX idx_audit_trade_id ON aegis_settlement_v1.settlement_audit_log(trade_id);
```

---

## 5. OPENAPI 3.1 REST SPECIFICATION

```yaml
openapi: 3.1.0
info:
  title: AegisSovereign Engine Settlement API
  version: 1.0.0-PROD
  description: High-throughput atomic Delivery-versus-Payment & FROST TSS consensus gateway.
paths:
  /api/v1/settlement/initiate:
    post:
      summary: Initialize new atomic DvP settlement transaction
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [asset_ticker, asset_units, cash_ticker, cash_units, asset_seller, cash_buyer]
              properties:
                asset_ticker: { type: string, example: "UST-2028-TKN" }
                asset_units: { type: string, example: "5000000000000" }
                cash_ticker: { type: string, example: "USDC-INSTITUTIONAL" }
                cash_units: { type: string, example: "49850000000000" }
                asset_seller: { type: string, example: "BLACKROCK_TREASURY_DESK" }
                cash_buyer: { type: string, example: "JPM_INSTITUTIONAL_DVP" }
                timeout_ms: { type: integer, example: 5000 }
      responses:
        '201':
          description: Settlement trade created and nonce reserved

  /api/v1/tss/round1/commit:
    post:
      summary: Submit Round 1 Nonce Commitments (D_i, E_i)
      responses:
        '200':
          description: Commitments registered into session bundle

  /api/v1/tss/round2/sign:
    post:
      summary: Submit Round 2 Partial Signature Share (z_i)
      responses:
        '200':
          description: Partial signature accepted and checked against Lagrange term

  /api/v1/settlement/finalize:
    post:
      summary: Trigger atomic DvP swap execution
      responses:
        '200':
          description: Aggregate Schnorr signature generated, legs swapped, transaction settled

  /healthz:
    get:
      summary: Liveness and readiness probe
      responses:
        '200':
          content:
            application/json:
              example: { status: "HEALTHY", tss_cluster_quorum: true, active_nodes: 5 }
```

---

## 6. CLEAN-ROOM DEPENDENCY WHITELIST

| Package | Version | Permissive License | Usage Purpose | Copyleft Risk |
|---|---|---|---|---|
| Python Standard Library (`hashlib`, `secrets`, `hmac`) | 3.10+ | PSF-2.0 | Zero external crypto dependencies | NONE |
| FastAPI | 0.110+ | MIT | Asynchronous REST routing | NONE |
| Uvicorn | 0.29+ | BSD-3-Clause | ASGI server runner | NONE |
| Pydantic | 2.6+ | MIT | Data validation & schemas | NONE |
| cryptography (pyca) | 42.0+ | Apache-2.0 / BSD | Low-level constant time ops | NONE |

### Blacklisted Copyleft Packages:
- ❌ **GPL v2/v3 / LGPL v3 / AGPL v3**: Strictly prohibited across all microservices.
- ❌ **SSPL / BSL**: Strictly prohibited to preserve 100% unrestricted enterprise ownership.
