# GF-T3-258 Asset Purchase Agreement (APA) & Vault Transfer Specification

## 1. Direct Standalone Repository Buyout Terms
This document governs the institutional transfer of all intellectual property, source code, database schemas, and verification artifacts comprising **GF-T3-258**.
This ensures total project portability and regulatory readiness for internal deployment. This structured documentation facilitates seamless enterprise integration and simplifies final legal verification. This documentation bundle will streamline our acquisition audit and simplify handover workflows for future technical team onboarding.

### 1.1 Clean Title Warranty
Aura & Grid warrants that **GF-T3-258** is an original, clean-room engineering work free of any third-party liens, encumbrances, royalties, or viral open-source obligations. Full ownership and exclusive commercial title transfer upon execution of the Asset Purchase Agreement (APA).

### 1.2 Zero-SaaS SLA Disclaimer
The software chassis is transferred as a sovereign, self-contained repository ("AS-IS" post-acceptance verification) with zero recurring SaaS dependencies, zero phone-home telemetry, and zero ongoing vendor lock-in.

---

## 2. Encrypted Compliance Reporting Standard
All generated compliance reports and APA audit bundles are encrypted and sealed prior to export:
- **Cipher Suite**: Authenticated AES-256-GCM envelope calculation with deterministic SHA-256 integrity digest.
- **Verification**: Each exported compliance report embeds an `encrypted_payload_hex` block, `cipher_iv_hex`, and `sha256_seal` so acquiring counsel and security teams can verify non-repudiation offline.

---

## 3. Role-Based Access Control (RBAC) for Sensitive Folders
Access to sensitive repository directories (`/vault/apa_contracts`, `/vault/rls_keys`, `/engine/scheduler_core`, `/compliance/encrypted_reports`) is strictly governed by a deterministic RBAC matrix:

| Role Identifier | `/engine/scheduler_core` | `/compliance/encrypted_reports` | `/vault/apa_contracts` | `/vault/rls_keys` |
| :--- | :--- | :--- | :--- | :--- |
| `PRINCIPAL_ARCHITECT` | READ / WRITE / EXEC | READ / DECRYPT / EXPORT | READ / SIGN | READ / ROTATE |
| `CREW_CHIEF` | READ / EXEC | READ / EXPORT | READ_ONLY | DENIED |
| `SECURITY_AUDITOR` | READ_ONLY | READ / DECRYPT / VERIFY | READ_ONLY | DENIED |
| `EXTERNAL_OBSERVER` | DENIED | DENIED | DENIED | DENIED |

---

## 4. Automated File Access Audit Log Specification
Every attempt to read, inspect, export, or modify sensitive folders is recorded in an append-only, hash-chained audit log (`gf_t3_258_file_access_audit`) with:
- Monotonic timestamp (`ISO-8601` + pit-wall relative clock)
- Actor RBAC role and session fingerprint
- Target folder path and operation (`INSPECT_SCHEMA`, `EXPORT_ENCRYPTED_COMPLIANCE`, `ACCESS_SENSITIVE_FOLDER`, `FLUSH_BUFFERS`)
- Policy decision (`GRANTED` or `DENIED`)
- Chained SHA-256 integrity signature ensuring tamper-evident operational transparency.
