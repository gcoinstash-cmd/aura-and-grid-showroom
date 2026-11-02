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

## 4. Multi-Track Portfolio Structure & ASC 350-40 Appraisal (500-Unit Capstone)

| Parameter | Track 1: Lean Rapid-Sale (Default) | Track 2: Flagship Tier-1 (Selective) | Track 3: F1 Skunkworks Engine (Production Ref) |
|---|---|---|---|
| **Fleet Count (500 Total)** | **168 Sealed Units** | **168 Deep-Tech SCADA Units** (+ **117 Live Cockpits**) | **164 Working Service Engines & Reference Cores** |
| **Standard APA Title Transfer** | Track 1 Micro-APA Buyout (\$4,500 Retail / \$3,800 Wholesale) | Track 2 Chassis APA (\$14,500 Retail / \$10,000 Wholesale) | Track 3 Engine APA (\$50,000 Retail / \$35,000 Wholesale) |
| **Portfolio Cluster APA** | 50-Unit Cluster Carve-Out (\$1.25M–\$1.5M) | 50-Unit Cluster Carve-Out (\$1.25M–\$1.5M) | 50-Unit Cluster Carve-Out (\$1.25M–\$1.5M) |
| **Exclusive Buyout Range** | \$3,800 – \$6,500 (\$4,500 Anchor) | \$10,000 – \$18,000 Entry / \$18k–\$75k+ Strategic | \$35,000 – \$65,000 Floor / \$75,000 – \$150,000+ Ceiling |
| **Retention Policy** | 80% Fleet Retention Lock (400 Vaulted / 100 Max APA) | 80% Fleet Retention Lock (400 Vaulted / 100 Max APA) | 80% Fleet Retention Lock (10 Sealed 50-Unit Clusters) |

### ASC 350-40 Enterprise Replacement Valuation Ledger (500 Master Vault Assets & Production Engines)
- **Total Retail Price (Combined Agency Replacement Benchmark):** **\$32,450,000 (\$32.45M)**
- **Certified Fair Market Value (FMV):** **\$13,000,000 (\$13.0M)**
- **Wholesale Price / Institutional Bulk Floor:** **\$8,400,000 (\$8.4M)**
- **The Hard Walk-Away Floor (Sovereign Reserve Liquidation Floor):** **\$4,200,000 (\$4.2M)** (Internal reserve threshold; bids below rejected)
- **50-Unit Sealed Cluster Carve-Out APA Anchor:** **\$1,250,000 – \$1,500,000** per cluster (\$650,000 – \$750,000 cluster reserve floor across `CLUSTER-001`–`010`)
- **80% Retention Lock:** **400 assets** (8 clusters) permanently vaulted / max **100 assets** (2 clusters) transferable via selective micro-APAs or cluster carve-outs.
- **Valuation Legend:** ASC 350-40 / ASC 985 Cost Approach (Replacement Cost Basis) applied across all 500 vaulted chassis (168 T1 @ \$4.5k | 168 T2 @ \$14.5k | 164 T3 @ \$50k).

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

### Due-Diligence Test Run (17 Engine Triads, 105 Tests)

Activate the bundled Python 3.11 virtual environment first. Running bare `pytest` against an unactivated system Python fails at collection with `ModuleNotFoundError: No module named 'fastapi'`.

```bash
source T3-NEXUS-ORDERBOOK/.venv/bin/activate && pytest
```

**Expected result:** `105 passed`, exit code 0. Root `pytest.ini` and `conftest.py` scope discovery to `gf-t3-338` through `gf-t3-354` and isolate each triad's `engine` module.
