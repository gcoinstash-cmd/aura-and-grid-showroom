# GF-T3-242 Asset Purchase Agreement (APA) & Transfer Specification

## 1. Direct Standalone Repository APA Buyout Terms
- **Asset Title**: `GF-T3-242`
- **Transfer Mechanism**: Outright intellectual property assignment and standalone repository transfer under standard Asset Purchase Agreement (APA) terms.
- **Commercial Actions**: Authorized acquisition pathways are strictly designated as `ACQUIRE TITLE (APA)` and `INQUIRE VAULT BUYOUT`.
- **Clean Title Warranty**: Aura & Grid warrants that `GF-T3-242` is an original clean-room fabrication free of encumbrances, liens, third-party royalties, or viral copyleft obligations.
- **Zero-SaaS SLA Disclaimer**: Delivered as a sovereign, self-contained software chassis (`AS-IS` under APA title transfer) with zero recurring vendor lock-in or external telemetry phone-home dependencies.

---

## 2. Finalized Repository File Tree Structure
```text
/
├── ASSET_TRANSFER_SPEC.md
├── Dockerfile
├── ENGINE_SPEC.md
├── LEGAL_IP_AUDIT.md
├── engine.py
├── index.html
├── metadata.json
├── package.json
├── server.ts
├── supabase_schema.sql
├── test_fp4_quant_engine.py
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    └── engine/
        ├── fp4QuantEngine.ts
        └── fp4QuantEngine.test.ts
```

---

## 3. Automated CI/CD Delivery & Verification Workflow
The automated delivery pipeline executes deterministic verification prior to container archival and deployment across staging and production environments:
1. **Static & Type Verification**: Executes `tsc --noEmit` to validate strict TypeScript interfaces and zero-trust payload schemas.
2. **Mathematical & Security Gate Suite**: Runs both the TypeScript verification suite (`fp4QuantEngine.test.ts`) and Python verification suite (`pytest test_fp4_quant_engine.py`) verifying SQNR parity (`>24 dB`), outlier channel preservation, and SQLi/XSS rejection.
3. **Zero-Dollar Gate Scan**: Verifies that zero currency symbols appear anywhere in source code, telemetry logs, or JSON responses.
4. **Immutable Container Packaging**: Builds the multi-stage `Dockerfile` and pushes the verified image to Google Cloud Run.

---

## 4. Automated Environment Variable Injection & Security
- Runtime secrets and configuration parameters (`GEMINI_API_KEY`, `APP_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LOG_ENCRYPTION_KEY_ID`) are injected exclusively at container startup via Cloud Run Secret Manager bindings.
- Zero credentials or private keys are persisted in build layers or client bundles.

---

## 5. Encrypted Audit Logging & Key Rotation Architecture
- **Envelope Encryption**: All Pit-Wall telemetry exports and audit logs persisted to the `gf_t3_242_audit_logs` partitioned PostgreSQL table are encrypted using AES-256-GCM envelope encryption.
- **Automated Key Rotation**: Data Encryption Keys (DEKs) are rotated on a 24-hour epoch schedule (`key_epoch_id`), wrapped by a master Key Encryption Key (KEK) managed in hardware security modules, guaranteeing forward secrecy and continuous regulatory compliance.
