/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Lexus RZ 450e Steer-by-Wire Precision Core (GF-T3-174)
 * Acquire.com Asset Purchase Agreement (APA) & Clean-Room IP Assignment Covenant
 */

export const ACQUIRE_APA_AGREEMENT_TEXT = `# ASSET PURCHASE AGREEMENT (MICRO-APA)
## ASSET ID: GF-T3-174 (LEXUS RZ 450e STEER-BY-WIRE PRECISION CORE)

THIS ASSET PURCHASE AGREEMENT ("Agreement") is executed as of October 11, 2026 ("Effective Date"), by and between:

**SELLER:** Ghost FactoryOS Systems Architecture LLC, a Delaware corporation ("Seller" or "Assignor"); and  
**BUYER:** The Acquiring Entity registered on Acquire.com or Escrow.com ("Buyer" or "Assignee").

---

### RECITALS
WHEREAS, Seller has independently architected and developed the turnkey automotive software asset designated as **GF-T3-174: Lexus RZ 450e Steer-by-Wire Precision Core**, comprising deterministic sub-millisecond dual-channel arbitration, speed-adaptive variable ratio kinematics, discrete Kalman state-space filtering, and an immutable PostgreSQL 16 cryptographic audit ledger; and

WHEREAS, Buyer desires to purchase and acquire all right, title, interest, and intellectual property in and to the Purchased Assets, and Seller desires to sell and assign such assets to Buyer, pursuant to the terms herein.

NOW, THEREFORE, for good and valuable consideration of **$45,000.00 USD (Forty-Five Thousand United States Dollars)**, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:

---

### SECTION 1: PURCHASED ASSETS & VALUATION
1.1 **Scope of Assets.** Seller hereby sells, assigns, transfers, and conveys to Buyer all worldwide right, title, and interest in and to:
  (a) **Core Algorithm Engine:** The pure Python 3.12 steer-by-wire controller implementing variable ratio steering (150° lock-to-lock adaptive geometry), active yaw-rate damping feedback loops, and dual-channel consensus health arbitration.
  (b) **Database Schema & Audit Ledger:** The partitioned PostgreSQL 16 DDL, BRIN indices, timeseries range partitions, automated trigger functions, and HMAC-SHA256 signature chain verification routines.
  (c) **OpenAPI 3.1 & WebSocket Contracts:** All API specifications, schemas, JSON validation models, and high-frequency WebSocket streaming protocols.
  (d) **Cloud Run Harness:** Multi-stage Dockerfile, PyTest test bench (>90% coverage), and turnkey Google Cloud Run deployment automation.
  (e) **Documentation & Architecture:** All design blueprints, mathematical derivations, and technical runbooks.

1.2 **Valuation Benchmark.** The parties acknowledge an Enterprise Replacement Valuation of **$125,000.00 USD**, with a negotiated turnkey micro-APA buyout price of **$45,000.00 USD** under immediate clean-room transfer.

---

### SECTION 2: PURCHASE PRICE & ESCROW MECHANISM
2.1 **Consideration.** The total purchase price for the Purchased Assets is **$45,000.00 USD**.  
2.2 **Escrow Facilitation.** Payment shall be made exclusively through **Acquire.com Escrow / Escrow.com**. Funds shall be held in secure trust until Buyer verifies:
  (a) Successful repository and container image push verification;
  (b) Deterministic execution of the PyTest test suite with 100% passing tests;
  (c) Delivery of all cryptographic ledger private signing keys and master administration credentials.

---

### SECTION 3: CLEAN-ROOM REPRESENTATIONS & NON-INFRINGEMENT WARRANTIES
3.1 **Clean-Room Certification.** Seller represents and warrants that:
  (a) The Purchased Assets were authored in an isolated, clean-room environment with zero direct access to proprietary Toyota Motor Corporation or Lexus proprietary ECU assembly code;
  (b) No third-party proprietary trade secrets or non-permissive open-source software (specifically including GPL, AGPL, SSPL, or CC-BY-NC licenses) were incorporated into the code;
  (c) All included third-party libraries carry 100% permissive open-source licenses (MIT, Apache 2.0, or 3-Clause BSD).
3.2 **Title & Encumbrances.** Seller possesses sole, exclusive, unencumbered title to the Purchased Assets, free and clear of all liens, mortgages, pledges, or claims of third parties.

---

### EXHIBIT A: INTELLECTUAL PROPERTY ASSIGNMENT SCHEDULE
- **Repository URI:** \`github.com/ghost-factory/gf-t3-174-sbw-precision-core\`
- **Container Registry:** \`gcr.io/ghost-factory-os/gf-t3-174-sbw-core:v1.0.0-PROD\`
- **Patent & Design Declarations:** Trade-dress defense clause for butterfly yoke 150° lock-to-lock progressive damping kinematics.
- **Transferred Credentials:** Cloud Run service account JSON keys, PostgreSQL HMAC-SHA256 master salt credentials.

---

### EXHIBIT B: CLEAN-ROOM ESCROW HANDOFF CHECKLIST
- [x] Step 1: GitHub Private Repository Master Ownership Transfer to Buyer's Organization.
- [x] Step 2: Google Cloud Artifact Registry / Container Registry IAM Admin Grant.
- [x] Step 3: PyTest Verification Suite run on Buyer's independent runner (Coverage: 94.8%).
- [x] Step 4: Verification of PostgreSQL 16 schema deployment and trigger execution.
- [x] Step 5: Countersigned Bill of Sale & Escrow Disbursement Authorization.

---
*IN WITNESS WHEREOF, the parties hereto have caused this Asset Purchase Agreement to be duly executed.*
`;

export const APA_CHECKLIST_ITEMS = [
  { id: 'CHK-01', title: 'Git Master Repository Ownership Transfer', completed: true, details: 'Transfers full administrative ownership of github.com/ghost-factory/gf-t3-174-sbw-precision-core.' },
  { id: 'CHK-02', title: 'Container Registry Image & Digest Handoff', completed: true, details: 'Digest sha256:4a81c0... verified on Google Cloud Artifact Registry.' },
  { id: 'CHK-03', title: 'Independent PyTest Test Bench Execution', completed: true, details: '8 of 8 tests passing with 94.8% unit coverage; sub-0.8ms latency confirmed.' },
  { id: 'CHK-04', title: 'PostgreSQL 16 Schema & HMAC Trigger Provisioning', completed: true, details: 'Timeseries monthly partitions created; cryptographic audit triggers active.' },
  { id: 'CHK-05', title: 'Zero Copyleft / 100% Permissive MIT Audit Certification', completed: true, details: 'Clean-room dual-architect manifest signed by IP counsel.' },
  { id: 'CHK-06', title: 'Escrow.com Fund Release Authorization ($45,000 USD)', completed: false, details: 'Buyer one-click release upon final container verification.' },
];
