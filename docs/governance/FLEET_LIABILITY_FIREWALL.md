# FLEET LIABILITY FIREWALL & GOVERNANCE SPECIFICATION
**Standard Identifier**: GF-GOV-FIREWALL-2026.1  
**Authority Hierarchy**: Executive Dealership Principal / Chief Architecture Desk  
**Effective Date**: October 14, 2026  
**Status**: BINDING FLEET INVARIANT (STRICT LIABILITY PROTOCOL)  

---

## 1. EXECUTIVE SUMMARY & JURISDICTIONAL PURPOSE
This document establishes the permanent, non-negotiable **Fleet Liability Firewall** across the GhostFactoryOS engineering ecosystem, Aura & Grid showroom dealership, and all production/preview assets.

To ensure total legal compliance, protect intellectual property separation, eliminate consumer confusion, and maintain enterprise institutional positioning, strict prohibitions and mandatory terminology replacements are hereby locked into all codebases, UI cockpits, build scripts, documentation, and automated deployment pipelines.

---

## 2. BINDING PROHIBITIONS

### PROHIBITION 1: ABSOLUTE BAN ON FINANCIAL VALUATIONS IN UI
- **Zero Dollar-Figure Policy**: No financial valuations, MSRP prices, team seat prices, buyout figures, liquidation reserves, or dollar signs (`$`) may appear on customer-facing web apps, showroom cards, demo cockpits, header navigation tabs, badges, or footer bars.
- **Scope**: Covers all HTML, JSX, TSX, CSS, metadata, and runtime JSON consumed by client-side renderers.
- **Permitted Metric Alternatives**: All front-facing metrics must reflect pure technical performance and engineering specifications (e.g., refresh rates in Hz, loop latency in microseconds ($\mu\text{s}$), transaction throughput in OPS, memory allocation in MB/GB, and RPO/RTO SLAs).

### PROHIBITION 2: PROHIBITION OF LEGAL BUYOUT & JURISDICTIONAL LABELS IN PUBLIC UI
- **Legal Entity Protection**: Do not expose internal legal transaction structures or Delaware chancery court jargon in customer-facing UI or demo viewports.
- **Prohibited Terms**:
  - `"Delaware Court of Chancery"`
  - `"Delaware APA"`
  - `"micro-APA deliverable"`
  - `"Monopoly Vault Asset"` / `"Monopoly Vault"`
  - `"Acquire.com Turnkey Buyout Ready"`

---

## 3. MANDATORY TERMINOLOGY REPLACEMENTS

All future engineering commits, AI Studio prompt templates, documentation, and frontend components must strictly adhere to the following mapping:

| Prohibited Legacy Term | Mandatory Enterprise Standard Term | Context / Scope |
| :--- | :--- | :--- |
| `Delaware Court of Chancery` | **Enterprise Architecture Clearance** | Legal compliance, regulatory jurisdiction, and governance badges |
| `Delaware APA` | **Enterprise Asset Spec** | Diligence documentation, transaction ledgers, and contract references |
| `micro-APA deliverable` | **Modular Reference Implementation** | Architecture packages, deployable modules, and asset deliverables |
| `Monopoly Vault` | **Enterprise Reference Core** | Track 3 flagship engineering architectures, deep-tech consoles, and schemas |
| `Acquire.com Turnkey Buyout Ready` | **Enterprise Production Ready** | Production deployment status, readiness chips, and release tags |

---

## 4. PRE-DEPLOYMENT AUDIT ENFORCEMENT

Every future build, release candidate, and deployment artifact must execute and pass automated pre-commit and pre-deployment validation gates.

### 4.1 Regex Gate Invariant
Before any deployment command (`gcloud run deploy`, `git push`, or Vercel/Netlify release) is executed, an automated zero-dollar-sign regex audit must verify zero unauthorized currency symbols in public UI assets:
```bash
# Mandatory Audit Scan (Exit Code 0 Required)
python3 -c '
import os, re, sys
pattern = re.compile(r"(\$[0-9,]+(\.[0-9]{2})?|\bUSD\b|\bMSRP\b)", re.IGNORECASE)
violations = []
for root, _, files in os.walk("public"):
    for f in files:
        if f.endswith((".html", ".js", ".json")):
            path = os.path.join(root, f)
            with open(path, "r", errors="ignore") as fh:
                for line_no, line in enumerate(fh, 1):
                    if pattern.search(line):
                        violations.append((path, line_no, line.strip()[:100]))
if violations:
    print(f"FAILED: {len(violations)} valuation violations found!")
    for v in violations[:10]: print(f"  {v[0]}:{v[1]} -> {v[2]}")
    sys.exit(1)
print("PASSED: 0 valuation violations detected.")
'
```

### 4.2 Product Truth Classification Standard
All public-facing assets must display approved product truth badges:
- `Template`
- `Interactive Prototype`
- `Hosted Demo`
- `Simulation`
- `Deployable Source Template`
- `Customer-Configured Deployment`
- `Working Service Engine`
- `Production Reference Architecture`

Under no circumstances may an asset claim "flight-qualified", "space-qualified", "safety-certified", or "enterprise-grade" without verified empirical operating telemetry and explicit Executive Dealership Principal clearance.

---

## 5. REPOSITORY ARCHITECTURE & SAFE DEPLOYMENT INVARIANT

1. **Submodule Synchronization**: `tools/ghost-factory-console` functions as a distinct submodule. All public demo modifications must be staged, committed, and pushed inside `tools/ghost-factory-console` first, followed by root pointer update.
2. **APFS Dataless Protection**: To prevent macOS APFS hangs on iCloud offloaded files (`Website Templates/Archive & Legacy Templates/`), unconstrained root `git commit` is prohibited. Engineers and autonomous agents must stage specific pathspecs or utilize atomic git tree plumbing (`git write-tree` / `git commit-tree`).
3. **Continuous Enforcement**: Any PR or direct push violating this standard is subject to immediate automated reversal.
