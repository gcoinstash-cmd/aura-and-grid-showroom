# GF-T3-231 — Asset Purchase Agreement (APA) & Encrypted Transfer Protocol

## 1. Direct Standalone Repository APA Buyout Terms
- **Asset Designation**: `GF-T3-231` (Track 3 FP8 E4M3/E5M2 Quantization & Dynamic Scaling Engine)
- **Conveyance Structure**: 100% Outright Intellectual Property Assignment and Standalone Source Repository Conveyance under an institutional Asset Purchase Agreement (APA).
- **Transferable Deliverables**:
  1. Complete TypeScript & React Gamified FP8 Quantization Cockpit (`src/`).
  2. Standalone Python FastAPI FP8 Quantization & Dynamic Scaling Backend (`engine.py`).
  3. Dual Automated Verification Suites (`test_fp8_quant_engine.py` and `src/engine/fp8Engine.test.ts`).
  4. Partitioned PostgreSQL / Supabase Persistence Schema with Row-Level Security (`supabase_schema.sql`).
  5. Cloud Run Containerization Specification (`Dockerfile`) and OpenAPI 3.1 Technical Spec (`ENGINE_SPEC.md`).

---

## 2. Clean Title Warranty
- **Seller Representation**: Aura & Grid warrants that it holds sole, unencumbered, and marketable legal title to `GF-T3-231`, free and clear of any liens, royalties, security interests, third-party open-source copyleft obligations, or pending litigation.
- **Indemnification**: Full clean-room provenance attestation is backed by the accompanying `LEGAL_IP_AUDIT.md` and deterministic cryptographic Merkle root verification.

---

## 3. Zero-SaaS SLA Disclaimer
- **No Recurring Hosting Obligation**: This transaction constitutes a pure capital asset conveyance of sovereign source code and technical documentation.
- **AS-IS Operational Handoff**: Upon verification of the dual-signed cryptographic transfer ledger and delivery of the repository archive, Seller assumes zero ongoing SaaS hosting obligations, managed service level agreements (SLAs), or post-closing operational liabilities.

---

## 4. Dual-Party Cryptographic Encryption & Signature Protocol
All project handoff records are encrypted at rest and in transit and signed by both authorized parties prior to final repository release:
1. **Payload Encryption Standard**: `AES-256-GCM` authenticated encryption over the canonical repository tarball and schema manifest.
2. **Dual-Party Signature Scheme**:
   - **Party A (Dealership Principal — Aura & Grid)**: Signs the canonical repository digest (`SHA-256`) using institutional `ED25519-SHA256` signing key.
   - **Party B (Authorized Institutional Acquirer)**: Counter-signs the Principal signature and repository digest to lock the bilateral escrow record.
3. **Merkle Escrow Root Integration**:
   - Both signatures are hashed into a deterministic `merkle_escrow_root` persisted in the `apa_transfer_ledger` table (`supabase_schema.sql`) and rendered live inside the `APA` verification tab of the `GF-T3-231` deployment dashboard for real-time stakeholder inspection.
