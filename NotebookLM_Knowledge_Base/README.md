# Aura & Grid × GhostFactoryOS

## Security & Integrity Specification
- **Framework Alignment:** NIST SP 800-218 (SSDF v1.1) / CIS Software Supply Chain
- **Asset Maturity:** Simulation & Clickable Prototype (Non-Production)
- **Secrets Management:** Zero hardcoded credentials (Env injected)
- **Dependency Audit:** Clean build, 0 Critical CVEs
- **IP Status:** Flagship Class (Track 2 - Retained Core Factory IP)

---

## 1. System Overview & Product Truth Classification

Aura & Grid is a curated digital showroom and software asset dealership paired with GhostFactoryOS, a private digital manufacturing command center.

> [!IMPORTANT]
> **PRODUCT TRUTH & REGULATORY DISCLOSURE:**
> All digital vehicles, consoles, and web applications cataloged within this repository are **Simulations, Interactive Prototypes, and Deployable Source Blueprints**.
> - **Non-Production Status:** None of the assets represent live, flight-certified, space-qualified, or safety-certified operational systems.
> - **Simulated Telemetry:** All SCADA, orbital mechanics, industrial sensor feeds, clinical trial data, and financial records utilize mathematical simulation engines and deterministic mock states.
> - **Regulatory Exclusions:** These assets do not constitute legal, medical, financial, or engineering compliance certifications. Production deployment requires customer-specific backend configuration, regulatory auditing, and independent security hardening.

---

## 2. Architecture & Separation of Concerns

The repository enforces a strict two-faced architecture:
1. **Public Showroom (`site/`):** Decoupled, read-only static showroom for interactive test drives, tier-1 license previews, and technical briefs. Zero privileged factory credentials or passkeys are bundled in the public showroom bundle.
2. **Private Command Center (`tools/ghost-factory-console/`):** React 18 + TypeScript + Tailwind CSS executive console (`ghost-factory-console`) providing ledger analytics, fleet valuation stress testing, maintenance bays, and deal room management.

---

## 3. NIST SP 800-218 (SSDF) Supply Chain Compliance

To ensure secure software development practices under NIST SP 800-218:
- **Protect Software (PS):** All sensitive environment variables (`.env`, `.env.local`) are strictly excluded from version control via `.gitignore`. Template credentials are documented exclusively in sanitized `.env.example` files.
- **Produce Well-Secured Software (PW):** Zero hardcoded API tokens or service keys reside in source code. Code replacement and formatting are strictly tracked and audited.
- **Respond to Vulnerabilities (RV):** Continuous `npm audit` verification enforces 0 Critical CVEs across the dependency tree.

---

## 4. Multi-Track Portfolio Structure & ASC 350-40 Appraisal

| Parameter | Track 1: Lean Rapid-Sale (Default) | Track 2: Flagship Tier-1 (Selective) | Track 3: F1 Skunkworks Engine (Production Ref) |
|---|---|---|---|
| **Fleet Count** | 86 Assets | 50 Deep-Tech SCADA Assets | 14 Onboarded & Standardized (`T3-NEXUS-01`, `GF-T3-138` to `GF-T3-150` via Universal Track 2 Telemetry Harness) |
| **Standard APA Title Transfer** | Track 1 Micro-APA Buyout (\$4,500 anchor) | Track 2 Chassis APA (\$14,500 anchor) | Track 3 Engine APA (\$35,000 – \$65,000) |
| **Portfolio Cluster APA** | 50-Unit Cluster Carve-Out (\$1.25M–\$1.5M) | 50-Unit Cluster Carve-Out (\$1.25M–\$1.5M) | 50-Unit Cluster Carve-Out (\$1.25M–\$1.5M) |
| **Exclusive Buyout Anchor** | \$4,500 (\$3,800 – \$6,500 floor) | \$14,500 (\$10,000 – \$18,000 entry) | \$35,000 – \$65,000 Floor / \$75,000 – \$150,000+ Ceiling |
| **Retention Policy** | Transferable via Micro-APA | Strict 80% Retained Factory Floor | Retained Sovereign Fleet (Curated 35 Units Target) |

### ASC 350-40 Enterprise Replacement Valuation Ledger (150 Master Vault Assets & Production Engines)
- **Enterprise Showroom Asking Price:** **\$3,110,000 (~$3.11M)**
- **Agency Build-Cost Appraisal:** **\$1,950,000 (~$1.95M)**
- **Senior Architect Hard Floor:** **\$1,500,000 (~$1.50M)** (13,700 direct engineering hrs @ \$109.49/hr)
- **\"As-Is\" Bare Minimum (Baseline Trim Floor):** **\$1,150,000 (~$1.15M reserve)** (41% bulk asset discount applied to \$1.95M)
- **The Hard Walk-Away Floor:** **\$1,150,000 – \$1,500,000** (Internal reserve threshold; bids below rejected)
- **The Panic Floor Price:** **\$95,000 – \$145,000** (Distressed 50–70% cash liquidation baseline)
- **80% Retention Lock:** 120 assets permanently vaulted / max 30 micro-APAs across fleet.
- **Valuation Legend:** ASC 350/985 enterprise replacement cost methodologies applied with 41% bulk asset discount.

---

## 5. Verification & Build Commands

```bash
# Verify Supply Chain Dependencies (0 Critical CVEs)
npm audit

# Run Full Build (Public Showroom + Private Console + 5 Audit Gates)
npm run build

# Synchronize Blueprints Across Local & Cloud Master Vaults
npm run sync:master
```
