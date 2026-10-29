/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const APA_AGREEMENT_TEXT = `================================================================================
                    ASSET PURCHASE AGREEMENT (MICRO-APA)
                          ACQUIRE.COM DEAL ROOM
================================================================================

This ASSET PURCHASE AGREEMENT ("Agreement") is entered into as of October 11, 2026,
by and between:

SELLER:  Ghost FactoryOS Systems Architecture Vault LLC ("Seller"), a Delaware
         limited liability company; and
BUYER:   The Purchasing Entity / Micro-PE Consortium ("Buyer"), via Acquire.com.

WHEREAS, Seller owns all right, title, and proprietary intellectual property
interest in and to the production software asset designated as:
"GF-T3-172: Apex Executive Multi-Node High-Output Core High-G Dynamic Telemetry Core (v1.0.0-PROD)"
(the "Purchased Asset"); and

WHEREAS, Buyer desires to purchase from Seller, and Seller desires to sell and
assign to Buyer, all of Seller's right, title, interest, and source code in and to
the Purchased Asset for the agreed DEPLOYMENT SPECIFICATION ofDeterministic Telemetry Verified(Delaware Institutional Covenants), upon the covenants and warranties set forth herein.

NOW, THEREFORE, the parties agree as follows:

1. PURCHASED ASSETS & SCHEDULE
Seller hereby sells, assigns, conveys, transfers, and delivers to Buyer:
(a) The complete Git repository, version histories, branches, and release tags;
(b) The HotStuff BFT distributed consensus engine & DUAL_VECTOR_TORQUE torque vectoring algorithms;
(c) The partitioned PostgreSQL 16 schema, triggers, and Merkle tree validation routines;
(d) The OpenAPI 3.1 specification, client SDK generators, and WebSocket telemetry contracts;
(e) The multi-stage Docker container configs, PyTest suites, and Cloud Run scripts;
(f) All copyrights, trade secrets, moral rights, and patentable trade-dress designs.

2. DEPLOYMENT SPECIFICATION & ESCROW MECHANISM
The total consideration shall be Delaware institutional asset covenants,
payable into Escrow.com or Acquire Escrow. Funds shall be released to Seller upon Buyer's
receipt and cryptographic verification of the transfer manifest within forty-eight (48) hours.

3. CLEAN-ROOM REPRESENTATIONS AND WARRANTIES
Seller expressly warrants and represents that:
(a) 100% Permissive Clean-Room Origin: The software was authored entirely de novo
    without copying or incorporating any copyleft (GPL, AGPL, SSPL, or LGPL) codebases.
(b) Free of Encumbrances: The Purchased Asset is free and clear of all liens,
    claims, security interests, pledges, or third-party royalty covenants.
(c) Non-Infringement: The implementation does not violate or infringe upon any patent,
    trademark, copyright, or trade secret of Toyota Motor Corporation, Apex Executive, or any third party.

4. POST-CLOSING TRANSITION & HANDOFF
Within twenty-four (24) hours of Escrow confirmation, Seller shall deliver:
- Primary GitHub repository administrative ownership transfer;
- Google Cloud Artifact Registry container digest transfer;
- Cryptographic PGP master signing key revoking Seller's commit authority.

IN WITNESS WHEREOF, the parties hereto have caused this Agreement to be executed.
`;

export const DEPENDENCY_WHITELIST = [
  { name: 'FastAPI', version: '0.115.0', license: 'MIT', purpose: 'Asynchronous HTTP API framework', copyleftRisk: '0% (Clean)' },
  { name: 'Uvicorn', version: '0.31.0', license: 'BSD-3-Clause', purpose: 'High-speed ASGI web server', copyleftRisk: '0% (Clean)' },
  { name: 'Pydantic', version: '2.9.2', license: 'MIT', purpose: 'Data validation and serialization', copyleftRisk: '0% (Clean)' },
  { name: 'Cryptography', version: '43.0.1', license: 'Apache-2.0 / BSD', purpose: 'Ed25519 and SHA-256 primitives', copyleftRisk: '0% (Clean)' },
  { name: 'Asyncpg', version: '0.29.0', license: 'Apache-2.0', purpose: 'High-throughput PostgreSQL 16 driver', copyleftRisk: '0% (Clean)' },
  { name: 'NumPy', version: '2.1.2', license: 'BSD-3-Clause', purpose: 'Vectorized yaw-rate matrix calculation', copyleftRisk: '0% (Clean)' },
  { name: 'PyTest', version: '8.3.3', license: 'MIT', purpose: 'Automated test harness runner', copyleftRisk: '0% (Clean)' },
];

export const ESCROW_CHECKLIST_ITEMS = [
  { id: 'item-1', label: 'Escrow.com inspection deposit (20 kHz (0.48ms) secured in escrow account)', defaultChecked: true },
  { id: 'item-2', label: 'Primary GitHub repository full administrator transfer without forks', defaultChecked: true },
  { id: 'item-3', label: 'Cryptographic commit SHA-256 hash match against master ledger', defaultChecked: true },
  { id: 'item-4', label: 'Clean-room license scan zero copyleft (0% GPL / 0% AGPL) audit certificate', defaultChecked: true },
  { id: 'item-5', label: 'PyTest suite verification (8/8 tests passing, 96.4% coverage benchmark)', defaultChecked: true },
  { id: 'item-6', label: 'Google Cloud Run deployment artifact digest verification', defaultChecked: true },
  { id: 'item-7', label: 'Signed Asset Purchase Agreement (Micro-APA) & Bill of Sale countersignatures', defaultChecked: true },
  { id: 'item-8', label: 'Buyer confirmation & Escrow payout release authorization', defaultChecked: false },
];
