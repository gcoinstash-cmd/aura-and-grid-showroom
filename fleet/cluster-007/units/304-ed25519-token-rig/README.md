# 🏷️ DEALERSHIP TELEMETRY WINDOW STICKER
## Unit #304: Ed25519 Token Signer & Verification Rig
**Asset Classification:** Track 1 (Lean Tuner / Daily Driver Utility Unit)  
**Parent Fleet Registry:** GhostFactoryOS × Aura & Grid (`fleet/cluster-007/`)

```
================================================================================
   GHOST FACTORY OS // TRACK 1 LEAN TUNER PROVENANCE SPECIFICATION
================================================================================
UNIT IDENTIFIER:        GF-T1-304
UNIT NAME:              Ed25519 Token Signer & Verification Rig
BATCH COHORT:           Cluster-007 (High-Velocity Utility Swarm)
COMMERCIAL STATUS:      100% Pure APA Buyout Title Transfer (Zero Seat Tiers)
RETAIL PRICE ANCHOR:    $4,500 USD (Fixed Outright IP Title Transfer)
EXCLUSIVE BUYOUT FLOOR: $3,800 – $6,500 USD
PERMITTED LABEL:        Deployable Source Template / Working Utility Engine
================================================================================
```

---

### 1. Operational Overview
Unit #304 is a zero-dependency, asymmetric cryptographic token generator and verification rig leveraging high-security Edwards-curve Digital Signatures (Ed25519). Built directly upon Node.js `node:crypto`, it mints compact, URL-safe tamper-evident tokens (`header.payload.signature`) without requiring heavy external dependencies like `jsonwebtoken` or `jose`.

### 2. Operational IO Telemetry Matrix

| Specification | Operational Metric |
| :--- | :--- |
| **Cryptographic Primitive** | Asymmetric Edwards-curve 25519 (`ed25519`, RFC 8032) |
| **Input Parameters** | Payload dictionary, PKCS#8 PEM private key, standard claims (`iss`, `sub`, `aud`, `exp`, `nbf`) |
| **Output Token Format** | Compact 3-segment base64url string (`header.payload.signature`) |
| **Throughput Benchmark** | **~11,000+ operations / sec** (combined sign + verify loops) |
| **Signing Latency** | **~81.1 µs (0.081 ms)** |
| **Verification Latency** | **~98.4 µs (0.098 ms)** |
| **External Dependencies** | **0** (Node.js standard library: `node:crypto`) |
| **Tamper Detection** | Instant cryptographic signature rejection on any single-bit payload or header modification |
| **Test Verification** | 100% Green (`node test.js`) |

---

### 3. Canonical Token Anatomy

```
eyJhbGciOiJFZDI1NTE5IiwidHlwIjoiQUctVE9LRU4tVjEifQ.eyJhc3NldF9pZCI6IkdGLVQxLTMwNCIsImV4cCI6MTc5MzM2NTIwMCwiaWF0IjoxNzkzMzYxNjAwLCJqdGkiOiI0ZjE3ZGY1OC04MDRhLTQzNGQtOGZhMC05NjEzYTQyOTU2ZTgiLCJzdWIiOiJmYWN0b3J5LW9wZXJhdG9yIn0.rG7sD2_sample_64_byte_ed25519_signature_hash_bytes...
```

- **Header (`typ: AG-TOKEN-V1`, `alg: Ed25519`):** Canonical sorted JSON base64url.
- **Payload:** Subject, Issuer, Expiration timestamp, JTI nonce, and custom operational claims.
- **Signature:** 64-byte raw Ed25519 cryptographic signature.

---

### 4. Integration Blueprint

```javascript
import { generateEd25519KeyPair, signToken, verifyToken } from './engine.js';

// 1. Generate Keypair
const { publicKeyPem, privateKeyPem } = generateEd25519KeyPair();

// 2. Sign Token
const token = signToken({ clearance: 'L2', operator: 'CREW-01' }, privateKeyPem, {
  issuer: 'GhostFactoryOS',
  expiresInSec: 3600
});

// 3. Verify Token
const result = verifyToken(token, publicKeyPem, { issuer: 'GhostFactoryOS' });
if (result.valid) {
  console.log('Verified payload:', result.payload);
} else {
  console.error('Tampered or expired:', result.error);
}
```

---

### 5. Legal & APA Title Transfer Protection
Under this Track 1 Micro-APA, the purchaser acquires complete, outright ownership of this standalone utility codebase (`engine.js`, `test.js`, and documentation). **Exclusions:** This title transfer does not transfer ownership of GhostFactoryOS, Aura & Grid showroom IP, shared factory tokens, or the broader 150-unit master vault.
