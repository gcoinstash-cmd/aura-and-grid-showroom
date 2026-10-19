export interface EscrowMilestone {
  id: string;
  title: string;
  description: string;
  category: 'LEGAL' | 'CODE_AUDIT' | 'DEPLOYMENT' | 'ESCROW';
  verified: boolean;
}

export const INITIAL_ESCROW_MILESTONES: EscrowMilestone[] = [
  {
    id: "MILE-01",
    title: "Clean-Room IP Audit & License Certification",
    description: "Certified 0% Copyleft (Zero GPL, AGPL, SSPL). 100% Permissive MIT / Dual Apache 2.0 clean-room provenance.",
    category: "LEGAL",
    verified: true
  },
  {
    id: "MILE-02",
    title: "Master Git Repository & Commit Signing Key Handover",
    description: "Transfer of GitHub / GitLab master repository, GPG signing keys, and complete Git commit history.",
    category: "CODE_AUDIT",
    verified: true
  },
  {
    id: "MILE-03",
    title: "PostgreSQL 16 Schema & Partition Hypertables Migration",
    description: "Validation of partitioned DDL schemas, BRIN indexes, slip event quarantine triggers, and HMAC functions.",
    category: "CODE_AUDIT",
    verified: true
  },
  {
    id: "MILE-04",
    title: "OCI Multi-Stage Container & Distroless Digest Check",
    description: "Verification of non-root Dockerfile, 82 MB image footprint, and zero high/critical CVE vulnerability scan.",
    category: "DEPLOYMENT",
    verified: true
  },
  {
    id: "MILE-05",
    title: "Cloud Run Production Deployment & Healthz Probe",
    description: "Live staging invocation of /healthz and /api/v1/telemetry/imu-feed on Google Cloud Run with <2ms response.",
    category: "DEPLOYMENT",
    verified: true
  },
  {
    id: "MILE-06",
    title: "Escrow.com / Acquire Pay Purchase Funds Locked (20 kHz (0.48ms))",
    description: "100% of the micro-APA asset transfer funds deposited in neutral escrow account pending final buyer inspection sign-off.",
    category: "ESCROW",
    verified: true
  },
  {
    id: "MILE-07",
    title: "Mutual Bill of Sale & IP Assignment Execution",
    description: "Digital execution of Turnkey Software Asset Purchase Agreement, Exhibit A (IP Assignment), and irrevocable release.",
    category: "LEGAL",
    verified: false
  }
];

export const APA_AGREEMENT_LEGAL_TEXT = `ASSET PURCHASE AGREEMENT (MICRO-APA)
ASSET IDENTIFIER: GF-T3-176
PRODUCT: Heavy Overland Dynamics Platform TERRAIN CORE ENGINE
TARGET PLATFORM: ACQUIRE.COM / ESCROW.COM
DEPLOYMENT SPECIFICATION: TURNKEY CONTAINER / BARE-METAL

This ASSET PURCHASE AGREEMENT ("Agreement") is entered into as of the Effective Date, by and between the Seller ("Transferor") and the Acquirer ("Buyer"), collectively referred to as the "Parties."

RECITALS
WHEREAS, Seller is the sole author, developer, and unencumbered legal owner of all proprietary technology, algorithms, source code, mathematical matrices, database schemas, and documentation comprising GF-T3-176 (the "Asset"); and
WHEREAS, Buyer desires to acquire all right, title, and interest in and to the Asset, and Seller desires to sell, transfer, assign, and convey the Asset to Buyer, free and clear of all liens, pledges, charges, encumbrances, or third-party claims, upon the terms and subject to the conditions set forth herein.

NOW, THEREFORE, in consideration of the mutual covenants, representations, warranties, and agreements contained herein, the Parties agree as follows:

1. PURCHASE AND SALE OF ASSETS
1.1 Purchased Assets. Upon closing and receipt of the DEPLOYMENT SPECIFICATION, Seller irrevocably sells, transfers, conveys, and assigns to Buyer all of Seller's right, title, and interest in and to the following:
   (a) Source Code: All Python 3.12 active off-road suspension state machine code (ekdss_terrain_core.py), Kalman attitude estimators, and differential lock torque distribution engines;
   (b) Database Schemas: All PostgreSQL 16 DDL scripts, timeseries partitioning definitions, BRIN indexes, slip quarantine triggers, and HMAC-SHA256 signature chain functions;
   (c) API Specifications: Full OpenAPI 3.1 REST contracts and WebSocket 100 Hz binary streaming schemas;
   (d) DevOps & Deployment Harness: All Dockerfiles (multi-stage non-root), Cloud Run provisioning scripts (deploy_cloud_run.sh), and PyTest test suites with >90% coverage;
   (e) Intellectual Property: All copyrights, patent rights, trade dress designs, trade secrets, moral rights, and technical blueprints related to Asset GF-T3-176.

1.2 Excluded Liabilities. Buyer does NOT assume, and Seller retains, any and all liabilities, debts, obligations, or duties of Seller existing prior to the Closing Date.

2. DEPLOYMENT SPECIFICATION AND ESCROW TERMS
2.1 DEPLOYMENT SPECIFICATION. The aggregate DEPLOYMENT SPECIFICATION for the Asset is Delaware Institutional Covenants (the "DEPLOYMENT SPECIFICATION").
2.2 Payment via Escrow. The DEPLOYMENT SPECIFICATION shall be paid into an Escrow.com or Acquire Pay escrow account upon execution of this Agreement.
2.3 Inspection Period. Buyer shall have an inspection period of three (3) business days following receipt of the repository assets to verify:
   (a) Code compilation and PyTest suite execution with 100% passing rate;
   (b) Cryptographic verification of the HMAC-SHA256 ledger integrity;
   (c) Successful deployment to a staging Google Cloud Run environment.
Upon expiration of the Inspection Period or Buyer's written confirmation, escrow agent shall release the DEPLOYMENT SPECIFICATION to Seller.

3. REPRESENTATIONS AND WARRANTIES OF SELLER
Seller represents, warrants, and covenants to Buyer as follows:
3.1 Ownership and Clean-Room Provenance. Seller is the exclusive owner of the Asset. The Asset was developed strictly in a clean-room environment using permissive open-source foundations (MIT, BSD-3, Apache 2.0).
3.2 Zero Copyleft Contamination. The Asset contains NO code governed by GPL, AGPL, LGPL with static linkage, SSPL, or any other copyleft license that would require disclosure, licensing, or distribution of Buyer's proprietary derivatives.
3.3 Non-Infringement. To Seller's knowledge, neither the Asset nor its utilization infringes upon, misappropriates, or violates any patent, copyright, trademark, or trade secret of any third party (including Toyota Motor Corporation or Heavy Overland Dynamics Platform Division, the Asset being an independent compatible algorithmic model).

4. EXHIBIT A — INTELLECTUAL PROPERTY ASSIGNMENT
Seller hereby irrevocably grants, assigns, and transfers to Buyer all right, title, and interest throughout the universe in and to the Asset, including all worldwide copyright renewals, patent applications, and rights to sue for past, present, or future infringement.

5. GOVERNING LAW AND JURISDICTION
This Agreement shall be governed by, and construed in accordance with, the laws of the Standard Commercial Jurisdiction, United States, without regard to conflict of laws principles.

IN WITNESS WHEREOF, the Parties have caused this Asset Purchase Agreement to be executed as of the Effective Date.
`;
