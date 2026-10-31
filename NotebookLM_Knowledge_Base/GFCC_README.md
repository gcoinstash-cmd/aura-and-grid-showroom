# Ghost Factory Command Console (GFCC)

## Security & Integrity Specification
- **Framework Alignment:** NIST SP 800-218 (SSDF v1.1) / CIS Software Supply Chain
- **Asset Maturity:** Simulation & Clickable Prototype (Non-Production)
- **Secrets Management:** Zero hardcoded credentials (Env injected)
- **Dependency Audit:** Clean build, 0 Critical CVEs
- **IP Status:** Flagship Class (Track 2 - Retained Core Factory IP)

---

## 1. System Overview & Product Truth

Ghost Factory Command Console (GFCC) is the private operations dashboard, portfolio valuation engine, 10-cluster vault tracker, and APA title transfer ledger for the **500-asset digital vehicle fleet** (`168` Track 1 Lean Tuners + `168` Track 2 Hypercar Flagships + `164` Track 3 F1 Skunkworks Engines).

> [!IMPORTANT]
> **SIMULATION & PROTOTYPE NOTICE:**
> The console and cataloged prototype assets are **Interactive Simulations, Clickable Technical Prototypes & Reference Architectures**.
> - Not certified for live industrial operations, flight control, or safety-critical automation.
> - Telemetry streams, plasma diagnostics, cryostat thermal loops, and orbit trajectories represent client-side mathematical physics models and sample states.
> - Pre-revenue inventory modeling (`$32.45M` Retail / `$13.0M` FMV / `$8.4M` Wholesale / `$4.2M` Walk-Away) is provided for management strategy and does not constitute audited financial statements.

---

## 2. Hardened Quality Gates (Build Pipeline)

Every production build executes 5 deterministic audit gates before Vite packaging:
1. `scripts/audit/assert_best_for.mjs`: Validates `500/500` `CATALOG_MANIFEST.json` + `136/136` regression baseline domain mappings.
2. `scripts/assert-disclaimer.mjs`: Ensures 100% disclaimer compliance across all regulated assets.
3. `scripts/assert-no-claims.mjs`: Guarantees 0 forbidden marketing claims ("enterprise-grade", "production-ready", "flight-qualified").
4. `scripts/assert-license-matrix.mjs`: Verifies SKU and licensing consistency across the regression matrix.
5. `scripts/assert-flagships-gate4.mjs`: Validates schema integrity, SQL migration policies, and RLS tables for the founding 50 Flagships.

---

## 3. Development & Verification

```bash
# Verify Zero Critical CVEs
npm audit

# Run Full 5-Gate Build
npm run build

# Start Local Dev Server
npm run dev
```
