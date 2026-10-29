# Ghost Factory Command Console (GFCC)

## Security & Integrity Specification
- **Framework Alignment:** NIST SP 800-218 (SSDF v1.1) / CIS Software Supply Chain
- **Asset Maturity:** Simulation & Clickable Prototype (Non-Production)
- **Secrets Management:** Zero hardcoded credentials (Env injected)
- **Dependency Audit:** Clean build, 0 Critical CVEs
- **IP Status:** Flagship Class (Track 2 - Retained Core Factory IP)

---

## 1. System Overview & Product Truth

Ghost Factory Command Console (GFCC) is the private operations dashboard, portfolio valuation engine, and APA title transfer ledger for the 136-asset digital vehicle fleet.

> [!IMPORTANT]
> **SIMULATION & PROTOTYPE NOTICE:**
> The console and all 136 cataloged assets are **Interactive Simulations & Clickable Technical Prototypes**.
> - Not certified for live industrial operations, flight control, or safety-critical automation.
> - Telemetry streams, plasma diagnostics, cryostat thermal loops, and orbit trajectories represent client-side mathematical physics models.
> - Pre-revenue inventory modeling is provided for management strategy and does not constitute certified appraisal valuations or audited financial statements.

---

## 2. Hardened Quality Gates (Build Pipeline)

Every production build executes 5 deterministic audit gates before Vite packaging:
1. `scripts/audit/assert_best_for.mjs`: Validates 136/136 domain mappings.
2. `scripts/assert-disclaimer.mjs`: Ensures 100% disclaimer compliance across all regulated assets.
3. `scripts/assert-no-claims.mjs`: Guarantees 0 forbidden marketing claims ("enterprise-grade", "production-ready", "flight-qualified").
4. `scripts/assert-license-matrix.mjs`: Verifies SKU and licensing consistency across 136 blueprints.
5. `scripts/assert-flagships-gate4.mjs`: Validates schema integrity, SQL migration policies, and RLS tables for all 50 Flagships.

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
