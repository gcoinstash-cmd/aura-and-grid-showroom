# QUALITY_GATE.md — The Consolidated Six-Layer Governance Architecture & Master Diligence Framework

**Entity**: Aura & Grid Storefront Engine & The Ghost Factory™ Foundry  
**Scope**: All 136 Existing Operating System Blueprints (86 Track 1 + 50 Track 2) & 500-Asset Roadmap Target  
**Valuation Standard**: Grounded Orderly Fair-Market Valuation ($1,112,000 Strategic Anchor / $2.15M–$3.85M+ Ceiling) & Dual-Track Protocol  
**Retention Floor**: 80% Minimum Retained Floor (Current: 109 Assets Retained / Max 27 Micro-APAs)  

---

## PART 1: THE CONSOLIDATED 6-LAYER GOVERNANCE ARCHITECTURE

All software systems, application templates, and UI components forged within the foundry must strictly adhere to the following six structural engineering layers.

```
 [ LAYER 1: NAVIGATION & ROUTE INTEGRITY ]        -> Exact #id mapping + scroll-mt-20 + static SPA rewrites
 [ LAYER 2: VISUAL HIERARCHY & WCAG AAA ]        -> 16px/18px typography floor + 4.5:1 measured contrast + 44px tap
 [ LAYER 3: RESPONSIVE LAYOUT & MEDIA FAULT ]     -> 320px–1440px collision-free + media fallback posters
 [ LAYER 4: DEMO UX GATES VS PROD RBAC ]          -> 1-click auto-fill bypass vs real session auth segregation
 [ LAYER 5: ARCHITECTURAL ROTATION (ANTI-CLONE) ] -> Strict 5-archetype batch cycle (A, B, C, D, E)
 [ LAYER 6: TECHNICAL DILIGENCE & SECURITY ]      -> Supabase RLS on all tables + zero secrets in Git/bundles
```

### LAYER 1: NAVIGATION & ROUTE INTEGRITY
- **Section Anchor Fidelity**: Every navbar link, footer jump, and in-page CTA using `href="#section-name"` must map to a single matching DOM container with `id="section-name"`.
- **Header Offset Clearance**: All section containers must include fixed-header clearance utilities (`scroll-mt-20` to `scroll-mt-24`) so sticky navbars never conceal section headers upon scroll.
- **Direct Router Resolution**: Top-level routes (`/admin`, `/portal`, `/checkout`, etc.) must resolve directly in the client-side router (`react-router-dom` or Vite SPA router) and include static rewrite fallbacks (`public/_redirects` or fallback HTML files in build) to eliminate 404/white-screen errors on direct URL entry or page refresh.
- **Keyboard & State Trapping**: Modals, drawers, and flyout menus must support full keyboard navigation (`Tab`, focus trapping within container, and dismissal via `Esc`).

### LAYER 2: VISUAL HIERARCHY & MEASURED WCAG ACCESSIBILITY
- **Body Typography Floor**: Primary explanatory copy, descriptions, and list items must strictly adhere to a minimum size of 16px (`text-base`), backed by the global 18px root scale (`html { font-size: 18px !important; }`).
- **Measured Contrast Baseline**: Never assume dark palettes comply visually. All foreground/background hex pairs must be verified with an automated contrast engine:
  - Minimum **4.5:1 ratio** for standard copy (e.g., `#F4F4F5` / `#FFFFFF` on obsidian `#0A0A0B`).
  - Minimum **3:1 ratio** for large display typography (headings 24px+ normal or ~18.5px bold).
- **Secondary Metadata Standards**: SKUs, timestamps, tickers, and badges must never drop below 12px–14px (`text-xs` / `text-sm`) and must use bolding/medium weight to prevent visual degradation.
- **Interactive Target Sizing**: While WCAG 2.2 AA establishes 24px × 24px as the legal minimum, our internal premium engineering standard mandates **44px × 44px touch targets** on primary mobile controls, buttons, and form inputs.

### LAYER 3: RESPONSIVE LAYOUT & MEDIA FAULT TOLERANCE
- **Comprehensive Viewport Validation**: Layouts must render cleanly without clipping or horizontal overflow across 320px, 375px, 430px, 768px, 1024px, 1280px, and 1440px+.
- **Collision Avoidance**: Flex and grid elements must wrap responsively (`flex-col md:flex-row`, `gap-4 md:gap-6`, `break-words`) to prevent hero text, badges, or metric cards from colliding on mobile displays.
- **Media Resilience**: Embedded media players (YouTube/Vimeo) must include robust error handling, fallback poster images, or local lightweight loop video backups to prevent blank player errors (e.g., YouTube Error 153).

### LAYER 4: DEMO UX GATES VS. PRODUCTION SECURITY SEGREGATION
- **Clear Classification Boundary**: Hardcoded browser passkeys (`<slug>2026`, etc.) are classified strictly as **"Demo UX Convenience Gates"** for buyer walkthroughs, NEVER as security controls.
- **1-Click Buyer Passkey**: Public showcase admin portals must feature an "Auto-Fill Demo Passcode" button (`[ ⚡ ADMIN PASS ]`) so prospective buyers, auditors, and agencies can inspect operational tooling with zero friction.
- **Production RBAC Segregation**: Production-grade deployments must isolate demo state from real authentication, enforcing server-side session authorization and role-based access control (RBAC).

### LAYER 5: ARCHITECTURAL ROTATION (ANTI-HOMOGENEITY LAW)
To prevent valuation markdowns caused by repetitive 3-column card layouts, every sequential batch of 5 applications must strictly cycle through 5 distinct functional archetypes:
- **Archetype A (Dense Operational Console)**: Sidebar rail, persistent status bar, live dispatch/triage queue, and slide-out master-detail inspection drawers (Fleet, Logistics, Heavy Equipment, Dispatch, Operations).
- **Archetype B (Asymmetric Editorial Showcase)**: Full-bleed photography, staggered masonry cards, editorial serif/sans typography, and slide-over commission sheets (Creative, Fashion, Tattoo, Maritime Studios, Fine Art).
- **Archetype C (Step-by-Step Calculator / Wizard)**: Multi-stage progressive stepper, stateful price/spec tallies, and interactive configuration sliders (Legal Retainers, PPF/Coating, MedSpa Intake, Capital Underwriting, Estimators).
- **Archetype D (Timeline & Station Reservation Grid)**: Interactive day/hour slot matrices, bay/suite capacity chips, and time-block booking modals (Michelin Dining, Recovery Labs, Dental Suites, Boarding, Hospitality).
- **Archetype E (Split-Screen Spec & Proof Panel)**: Fixed left inspection canvas with macro preview; right scrollable technical specifications, compliance logs, and certification vaults (Horology, Rare Collectibles, Gemology, Provenance Assets, Private Wealth).

### LAYER 6: TECHNICAL DILIGENCE, DATABASE ACCESS & SECURITY
- **Supabase Row Level Security (RLS)**: Database migration files (`schema.sql`) must declare `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` across all exposed user tables and views, defining least-privilege policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- **Zero Secret Bundling**: No private API keys, JWT secrets, or Supabase service-role keys may be committed to Git or bundled into client JavaScript. Repositories must utilize sanitized `.env.example` templates.
- **Clean-Clone Compilations**: Running `npm install && npm run build` must compile cleanly with 0 TypeScript or Vite warnings/errors.
- **Turnkey Handover Assets**: Every repository must contain an exhaustive `README.md`, environment setup notes, `schema.sql` database initialization scripts, and mock seed data.

---

## PART 2: THE MASTER DILIGENCE FRAMEWORK (3-TIER RELEASE GATE)

Every digital asset within the portfolio is governed by a three-stage release gate to defend orderly fair-market valuation ($85,500–$148,375 orderly range, ~$115,000 planning value) and support Dual-Track pricing:

```
 [ TIER 1: BUYER-DEMO READY ]       ──> HTTP 200 + Smooth Anchors + 1-Click Passkey + Zero P0s
             │
 [ TIER 2: PRODUCTION-READY ]       ──> Clean Build + 18px WCAG Contrast + RLS + Zero Secrets
             │
 [ TIER 3: COMMERCIALLY TRANSFERABLE ] ─> Chain of Title + SBOM/Licenses + Loot Crate .Zip Handover
```

### 1. TIER 1: BUYER-DEMO READY
- Verified HTTP 200 rendering without layout collapse or DOM blanking.
- Smooth navigation anchor jumps with fixed-header clearance (`scroll-mt-20`).
- Zero visual P0 defects (no broken iframes, missing images, or text collisions).
- Turnkey 1-click demo passkey modal configured on `/admin`.

### 2. TIER 2: PRODUCTION-READY
- Clean, reproducible builds (`npm run build`, linting, and typecheck passes with 0 errors).
- 16px+ typography floor with measured 4.5:1 WCAG AA contrast against obsidian dark palettes.
- Responsive stability verified from 320px mobile to 1440px desktop screens.
- Supabase RLS policies written and verified for least-privilege access.
- Zero hardcoded secrets in source control or client distributions.

### 3. TIER 3: COMMERCIALLY TRANSFERABLE
- Clean IP chain of title with documented code ownership.
- Complete dependency SBOM and verified open-source / font Asset Purchase Agreement (APA) title transfer compliance.
- Full packaging crate: Source repository, `.env.example`, database migrations, seed scripts, README deployment guide, and registered asset manifest in `dist/<slug>/`.

---

## PART 3: OPERATIONAL EXECUTION PROTOCOL
1. **Memory & Rule Locking**: Permanently inject and enforce this framework in `AGENTS.md`, `GEMINI.md`, `QUALITY_GATE.md`, and `MASTER_BUSINESS_PLAN.md`.
2. **Headless Execution**: Use the Playwright + Axe-Core automated auditor (`scripts/audit/run_fleet_audit.mjs`) to verify all 114 flagships and future batch expansions up to 3,000–5,000 assets.
3. **Continuous Remediation Pipeline**: Systematically patch defects in order of priority (P0 Routing/Passkeys -> P1 Accessibility/Contrast -> P2 UI Polish) until 100% of targets achieve S-Tier certification.

---

## PART 4: THE PERMANENT BOSS BATTLE RADAR (NAV DEFENSE GATE)

```
 [ THE BOSS BATTLE RADAR: FLEET SCORE BREAKDOWN ]
    │
    ├── 🟢 S-TIER CHAMPIONS (9.6–10.0 / 10)  ──> Zero P0/P1 defects. Certified for Track 1 ($4,500 anchor) or Flagship Gate.
    ├── 🟡 A-TIER POLISH (8.0–9.5 / 10)     ──> Non-breaking typography/contrast tweaks. Queued for batch patch.
    └── 🔴 P0 BOSS BATTLES (< 8.0 / 10)      ──> 404s, broken routing, or unlinked passkeys. Deployment BLOCKED.
```

### Institutional Valuation & Grounded Dual-Track Defense
1. **Orderly Fair-Market Valuation Standard**:
   $$\text{Catalog Fair-Market Value} = \$935,000 – \$1,600,000 \quad (\text{Strategic Buyout Anchor: } \sim\$1,112,000)$$
   Every template certified at **🟢 S-Tier (9.6–10.0)** satisfies the baseline technical floor, eliminating technical due diligence discounts.
   - **Track 1 — Lean Rapid-Sale (Default)**: $4,500 Retail / $4,500 Team Seat / Exclusive Buyout Floor: $3,800–$6,500 (Anchor: **$4,500**).
   - **Track 2 — Flagship $10K+ (Selective Tier-1)**: $1,500–$3,500 Flagship License / Entry Exclusive Buyout Anchor: **$14,500** ($10,000–$18,000 range) / Full Buyout: $18,000–$35,000 / Strategic Acquisition: $35,000–$75,000+.
   - **80% Minimum Retained Floor**: Always retain at least 80% of the collection (Current: 109 assets permanently kept / max 27 transfer capacity; at 500 assets: 400 permanently kept / max 100 transfer capacity).
   - **Micro-APA Scope**: Transfers defined rights/code to **one specific asset only**. A micro-APA never transfers GhostFactoryOS, Aura & Grid, shared IP, or the full portfolio.

2. **Zero-Discount Due Diligence Guarantee**:
   Institutional private equity funds, aggregators, and agency buyers use automated scanners (Lighthouse, Axe-Core, Playwright) to find minor bugs and justify 30%–60% purchase price discounts. By enforcing 100% automated pass rates across all 6 structural layers and maintaining a clean **Boss Battle Radar** audit trail, buyers have **zero legal, technical, or financial grounds to mark down portfolio valuation**.

3. **Mandatory Audit Telemetry Mirroring**:
   On every batch completion, the headless auditor automatically compiles and mirrors the following to Google Drive Master Vault (`Ghost_Factory_Master_Vault`):
   - `GHOST_FACTORY_QA_MASTER_AUDIT.csv` (Universal Diligence Ledger)
   - `AUDIT_RESULTS_FULL_85_FLEET.md` (Markdown Executive Summary)
   - `AUDIT_RESULTS_FULL_85_FLEET.json` (Machine-Readable Diligence Telemetry)

---

## PART 5: THE TRUTH-ENFORCER PROTOCOL (GROUNDING & ANTI-HALLUCINATION GOVERNANCE)

```
 [ THE TRUTH-ENFORCER GOVERNANCE TRIANGLE ]
    │
    ├── 1. PROOF-FIRST REPORTING     ──> Raw terminal logs, exit codes (0/1), and real HTTP statuses.
    ├── 2. ZERO MARKETING HYPERBOLE  ──> Cold facts only. Zero ungrounded "defense shield" or "exit" claims.
    └── 3. SEPARATION OF CONCERNS    ──> Technical Floor ≠ Commercial Valuation. Revenue requires buyers.
```

### The 4 Mandatory Grounding Directives:

1. **Proof-First Deterministic Verification**:
   - Every claim of a defect being "Fixed", "Resolved", or "Verified" MUST be accompanied by deterministic technical evidence:
     - Exact terminal execution command (e.g. `node scripts/audit/test_p0_targets.mjs`).
     - Process exit code (`code 0`).
     - Concrete HTTP response header (e.g. `HTTP/2 200 OK`).
     - Specific Git commit SHA and file diff.
   - Reporting status from conversational memory, assumptions, or untracked state is strictly prohibited.

2. **Strict Separation of Concerns (Floor vs. Valuation)**:
   - **Technical Baseline Floor**: Clean compilation, zero 404 routes, functional `/admin` passkey bypass, and WCAG typography represent only the **defensible technical floor**. Meeting this standard proves the software works and avoids immediate disqualification during due diligence.
   - **Commercial Exit Valuation**: Actual cash buyout or licensing value ($35k–$50k slices, $1,499–$2,999 whitelabel licenses) requires **verifiable commercial proof**: live paying clients, signed non-exclusive agency licenses, distribution volume, and audited bank records. Code health alone never generates revenue.

3. **Zero Sycophancy & Cold Fact Reporting**:
   - Agents must never use flattering, exaggerated, or comforting marketing hyperbole.
   - No statements claiming "institutional buyers cannot touch your price" or "perfection achieved."
   - State engineering and financial realities plainly, directly, and neutrally.

4. **Explicit Immediate Failure Disclosure**:
   - If a route returns 404 or 500, a build fails, or a file does not exist, the agent MUST flag it immediately as a failure with the exact error message.
   - Masking defects or prematurely declaring victory is a P0 governance violation.

---

## PART 6: MANDATORY 3-STAGE BATCH LIFECYCLE (PRE-PRODUCTION PROTOCOL)

Every future 5-app production batch must strictly complete Stage 1 before any application code, React components, or database scripts are generated.

### Stage 1: Pre-Production & Creative Direction Sign-Off (MANDATORY GATE)
No template repository may be scaffolded until the Creative Director approves the batch blueprint.
1. **Vertical Persona & Hook:** Identify the exact end-buyer, operational pain point, and core functional thesis.
2. **Archetype Binding:** Map the batch to one of the 5 archetypes in `docs/design_system/SECTOR_DESIGN_SYSTEMS.md`:
   - Archetype 1: The Editorial Dossier (Legal, Wealth, Advisory)
   - Archetype 2: The Command Center (Field Dispatch, Logistics, Trades)
   - Archetype 3: The Luxury Atelier (Hospitality, Bespoke Goods, Real Estate)
   - Archetype 4: The Matrix Grid (Fintech, Analytics, Crypto, SaaS)
   - Archetype 5: Clinical Vanguard (MedSpa, Physical Therapy, Biohacking)
3. **Design Tokens & Typography:** Lock in exact heading/body fonts, hex color tokens, and border geometry.
4. **Visual Proof Preview (`spec_preview.html`):** The agent must compile a standalone HTML/CSS visual layout showcasing the 3 signature functional UI modules and the proposed Gumroad card composition. 
5. **Human Sign-Off:** The agent must halt and await human approval of `spec_preview.html` before initiating Stage 2.

### Stage 2: Deterministic Production Build
1. Scaffold frontend components matching the approved Stage 1 layout with zero stylistic deviation.
2. Implement backend Supabase SQL schema with Row Level Security (RLS) active.
3. Validate WCAG AA contrast compliance and ensure 0 P0 routing blockers across local and live targets.

### Stage 3: Packaging & Verifiable Asset Generation
1. Gumroad Cover (`cover.png` — 1280x720) and Thumbnail (`thumbnail.png` — 600x600) must be rendered using dedicated HTML canvas mockups featuring elevated containers, title typography, and metadata badges.
2. Flat top-fold browser screenshots are strictly disqualified.
3. Every generated image asset must be verified via terminal `ls -lh` to confirm a file size > 50 KB.

---

## PART 7: THE ZERO-DEFECT PRE-REVENUE AUDIT CEILING (6 IMMUTABLE FACTORY GATES)
To permanently eliminate external audit friction and guarantee that every blueprint achieves the institutional audit ceiling (8.0–8.3 FMV Tier) at creation time, every digital operating system must satisfy the 6 Immutable Production Gates detailed in `protocols/INSTITUTIONAL_PRODUCTION_STANDARD.md`:
1. **Gate 1 (Build Reproducibility)**: AST fragment validity in `src/App.tsx`, committed `package-lock.json`, and clean `npm ci && npm run build` exit code 0.
2. **Gate 2 (Database Schema Topology)**: Non-empty `supabase/schema.sql` (with RLS enabled) and `supabase/seed.sql`.
3. **Gate 3 (Chain-of-Title & Permissive IP)**: Root `LICENSE` file with MIT text, `"license": "MIT"` in package manifest, and 0% copyleft exposure.
4. **Gate 4 (DOM Claim Normalization)**: Mandatory Level 3 Blueprint lexicon; strict ban on "100% Production Ready" or "WCAG AA Certified".
5. **Gate 5 (Telemetry & Denominator Invariants)**: Strict Retail Shelf MSRP = $N \times \$4,500$, internal sectors sum to total $N$, HTTP 200 on live preview.
6. **Gate 6 (APA Schedule A Ingestion)**: 13-column row added to `docs/APA_SCHEDULE_A.csv` and `docs/TECHNICAL_DATA_ROOM.md` with repo-relative `supabase/` paths.
7. **Gate 7 (Track 2 Mandatory Compliance Gate — NIST SP 800-218 SSDF v1.1)**: Every Track 2 flagship created MUST automatically instantiate with:
   - a) `COMPLIANCE.md` (detailing NIST SP 800-218 SSDF v1.1 alignment, SBOM tracking, and access controls)
   - b) `.env.example` (with zero real secrets, strict variable documentation)
   - c) `README.md` Security & Integrity Specification block
   - d) Product Truth badge defining asset maturity as Prototype/Simulation.

Automated verification command: `node scripts/verify_institutional_standard.mjs [slug]`. Assets passing this gate are declared Institutional Diligence Approved upon creation without external Perplexity dependency.

---

## PART 8: TRACK 2 MANDATORY COMPLIANCE GATE (NIST SP 800-218 SSDF v1.1)

Every Track 2 flagship model ($14,500 Buyout Anchor / Asset Purchase Agreement (APA) title transfer ($14,500 anchor)) manufactured within GhostFactoryOS must instantiate from `templates/compliance/COMPLIANCE.template.md` and satisfy the 4 mandatory compliance deliverables:
1. **`COMPLIANCE.md`**: Dedicated supply chain security specification covering NIST SP 800-218 SSDF v1.1 practices (PO, PS, PW, RV), SBOM integration, and access controls.
2. **Sanitized `.env.example`**: Strict environment variable schema documenting all required tokens with non-functional placeholders and zero hardcoded secrets.
3. **`README.md` Security Specification**: Permanent top-fold block declaring framework alignment, maturity level, secrets management, and dependency audit standards.
4. **Product Truth Badges & Disclosures**: Explicit labeling across UI components establishing the asset as an **Interactive Simulation / Technical Prototype (Non-Production)**, strictly disclaiming live operational, flight, space, or regulatory certification.


