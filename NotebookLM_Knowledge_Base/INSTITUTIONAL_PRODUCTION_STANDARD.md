# 🏛️ GHOST FACTORY™ INSTITUTIONAL PRODUCTION STANDARD
## ZERO-DEFECT PRE-REVENUE POLICY (AUDIT CEILING GUARANTEE)

**Entity**: Aura & Grid / Ghost Factory™ (ZoMae Media LLC)  
**Standard**: Level 3 Supabase-Ready Blueprint Institutional Diligence Standard  
**Certified Target Rating**: 8.0 – 8.3 / 10.0 (79.5 – 83.0 / 100) — Pre-Revenue Institutional Ceiling  
**Legal Status**: Approved for Letter of Intent (LOI), Asset Purchase Agreement (APA) Drafting & Escrow Funding ($30k–$45k FMV Baseline)

---

## 1. The Core Law: Zero External Audit Dependency
> **The Problem**: Auditing retroactively after building burns 14–18 hours of back-and-forth prompts, runner timeouts, and crawler disputes.  
> **The Fix**: Shift all verification from external post-hoc crawlers to **deterministic local build-time gates**. If an asset satisfies these 6 immutable gates during the build, it is certified at the pre-revenue audit ceiling upon creation. **No Perplexity audit required.**

---

## 2. Factory Production Line Pipeline (ASCII Radar)

```
                     FACTORY PRODUCTION LINE PIPELINE
┌───────────────────────────┐      ┌───────────────────────────┐
│ GATE 1: CODEBASE REPRO    │ ───► │ GATE 2: SUPABASE SCHEMA   │
│ • TSX Fragment Syntax     │      │ • supabase/schema.sql     │
│ • Locked package-lock.json│      │ • supabase/seed.sql       │
│ • Clean `npm run build`   │      │ • Demo RLS policies       │
└───────────────────────────┘      └───────────────────────────┘
              │                                  │
              ▼                                  ▼
┌───────────────────────────┐      ┌───────────────────────────┐
│ GATE 3: PERMISSIVE IP     │ ───► │ GATE 4: CLAIM DISCLOSURE  │
│ • Root MIT LICENSE file   │      │ • "L3 Blueprint"          │
│ • 0% GPL/AGPL copyleft    │      │ • Purge "100% Prod SaaS"  │
│ • "license": "MIT" in pkg │      │ • 4.5:1 Contrast Floor    │
└───────────────────────────┘      └───────────────────────────┘
              │                                  │
              ▼                                  ▼
┌───────────────────────────┐      ┌───────────────────────────┐
│ GATE 5: TELEMETRY & MATH  │ ───► │ GATE 6: DATA ROOM ROW     │
│ • MSRP = N × $4,500         │      │ • 13-Column APA Entry     │
│ • Sectors sum to Total N  │      │ • Relative File Paths     │
│ • HTTP 200 on Live Demo   │      │ • Zero 404 Remote Endpoints│
└───────────────────────────┘      └───────────────────────────┘
```

---

## 3. The 6 Immutable Factory Production Gates

### 🛡️ Gate 1: Codebase Build Reproducibility (Pillar 2 Target: 24+/25)
1. **JSX Fragment AST Rule**: All root return trees and adjacent elements in `src/App.tsx` and all core layout components MUST be enclosed in top-level containers or fragments (`<>...</>`). No floating siblings outside root nodes.
2. **Committed Lockfile**: Every package-based repository MUST commit a valid `package-lock.json` alongside `package.json`. Never run unpinned `npm install` on a clean runner.
3. **Clean-Runner Acceptance**: The repository must pass `npm ci && npm run build` with Exit Code 0 and generate a non-empty `dist/` directory. Zero reliance on runtime CDN scripts for production rendering.

### 🗄️ Gate 2: Database Schema & Migration Topology (Pillar 3 Target: 12–14/20)
1. **Canonical Directory Structure**: Every repository must contain:
   - `supabase/schema.sql`: Contains at least 1 relational table, primary/foreign key constraints, and explicit `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` statements.
   - `supabase/seed.sql`: Contains realistic demo insert groups (no empty files).
2. **Demo RLS Boundary Phrasing**: Schemas must include declared demo policies (`USING (true) / WITH CHECK (true)`) while explicitly disclaiming production multi-tenant isolation in `SUPABASE_SETUP.md`.

### ⚖️ Gate 3: Chain-of-Title & Permissive IP (Pillar 4 Target: 13+/15)
1. **Root Repository License**: Every individual GitHub repository must contain a dedicated root `LICENSE` file containing the standard Aura & Grid Commercial Whitelabel / MIT text.
2. **Permissive Dependency Policy**: Only MIT, Apache-2.0, ISC, BSD-2-Clause, BSD-3-Clause, and 0BSD dependencies are permitted. Prohibit all copyleft licenses (GPL, AGPL, LGPL, SSPL).
3. **Package Manifest Alignment**: `package.json` must explicitly declare `"license": "MIT"`.

### 🏷️ Gate 4: DOM Claim Normalization (Pillar 1 & 4 Protection)
1. **Mandatory Lexicon**:
   - ✅ **Permitted Phrasing**: "Level 3 Supabase-Ready Blueprint", "Deployment-Ready Enterprise Template", "Engineered to 4.5:1 WCAG 2.1 Contrast Standards".
   - 🚫 **Strictly Prohibited Phrasing**: "100% Production Ready", "WCAG AA Certified", "Hardened Production Multi-Tenant SaaS", "Zero Data Bleed", "Exit 0 Verified" (unless commit-linked CI logs are attached).

### 🔢 Gate 5: Telemetry & Denominator Invariants (Pillar 1 & 5 Protection)
1. **Strict Arithmetic Rule**:
   $$\text{Retail Shelf MSRP} = N_{\text{assets}} \times \$4,500$$
   No static or legacy numbers (such as $13,930 or $16,915) may remain hardcoded when $N$ increases.
2. **Sector Balance**: The sum of internal sector counts must equal the catalog total $N$.
3. **Preview Verification**: Live preview endpoints on Render must respond with HTTP/2 200.

### 📑 Gate 6: APA Schedule A Ledger Ingestion
1. **13-Column APA Row**: Every asset must append one row to `docs/APA_SCHEDULE_A.csv` and `docs/TECHNICAL_DATA_ROOM.md` containing all 13 standard headers:
   `asset_id`, `legal_asset_name`, `commercial_product_name`, `slug`, `classification_level`, `sector_canonical`, `archetype`, `source_repo_url`, `default_branch`, `preview_url`, `schema_path`, `seed_path`, `rls_policy_status`.
2. **Relative Path Enforcement**: `schema_path` and `seed_path` must always be repository-relative (`supabase/schema.sql` and `supabase/seed.sql`), never bare filenames.

### 🛡️ Gate 7: Track 2 Mandatory Compliance Gate (NIST SP 800-218 SSDF v1.1)
Every Track 2 flagship created MUST automatically instantiate with:
1. `COMPLIANCE.md`: Supply chain compliance specification aligned with NIST SP 800-218 (SSDF v1.1), SBOM tracking, and access controls (derived from `templates/compliance/COMPLIANCE.template.md`).
2. `.env.example`: Pinned configuration template with zero real secrets and strict variable documentation.
3. `README.md` Security Block: Permanent Security & Integrity Specification declaring framework alignment and 0 Critical/High CVE standard.
4. Product Truth Badges: Clear UI badges defining asset maturity strictly as Technical Simulation & Clickable Prototype (Non-Production).

---

## 4. Mandatory Pre-Merge Checklist for Every Asset (Batches 18–20+)

Before merging, tagging, or declaring any asset complete, run this checklist:
- [ ] **Syntax**: `src/App.tsx` contains valid enclosing fragments; no sibling JSX elements without parent wrappers.
- [ ] **Build**: `npm ci && npm run build` exits 0 with complete `dist/` output.
- [ ] **Database**: Commit non-empty `supabase/schema.sql` (with RLS enabled) and `supabase/seed.sql`.
- [ ] **Licensing**: Commit root `LICENSE` file (MIT Whitelabel) and set `"license": "MIT"` in `package.json`.
- [ ] **Nomenclature**: Verify all titles and descriptions use "Level 3 Supabase-Ready Blueprint" (purged of "100% Production Ready" or "WCAG Certified").
- [ ] **Pathing**: Register in `docs/APA_SCHEDULE_A.csv` using `supabase/schema.sql` and `supabase/seed.sql`.
- [ ] **Track 2 Compliance (If Flagship)**: Confirm `COMPLIANCE.md`, `.env.example`, README Security Block, and Product Truth Prototype badge are present.

---

## 5. Automated Verification Script
Execute `node scripts/verify_institutional_standard.mjs [slug]` to automatically test gates on any template in under 2 seconds.
