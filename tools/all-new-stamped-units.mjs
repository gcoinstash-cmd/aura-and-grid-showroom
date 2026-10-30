/**
 * tools/all-new-stamped-units.mjs
 * 
 * GhostFactoryOS — Manifest Assembler for all newly stamped Track 1 & Track 2 units
 * - Track 1: Units #344 to #405 (62 units: Batch Delta, Batch Echo, Batch Foxtrot)
 * - Track 2: Unit #322 (Batch Alpha 04), Units #334 to #343 (10 units: Batch Charlie), and #406 to #493 (88 units: Delta, Echo, Foxtrot, Golf)
 * Total: Exactly 161 units (bringing fleet.json to exactly 492 units: 164 T1 : 164 T2 : 164 T3).
 */

import fs from 'node:fs';
import path from 'node:path';

// Track 1 definitions
import { PART_1_UNITS as T1_D1 } from './batch-delta-definitions-1.mjs';
import { PART_2_UNITS as T1_D2 } from './batch-delta-definitions-2.mjs';
import { PART_3_UNITS as T1_D3 } from './batch-delta-definitions-3.mjs';
import { PART_4_UNITS as T1_D4 } from './batch-delta-definitions-4.mjs';

import { PART_1_UNITS as T1_E1 } from './batch-echo-definitions-1.mjs';
import { PART_2_UNITS as T1_E2 } from './batch-echo-definitions-2.mjs';
import { PART_3_UNITS as T1_E3 } from './batch-echo-definitions-3.mjs';
import { PART_4_UNITS as T1_E4 } from './batch-echo-definitions-4.mjs';

import { PART_1_UNITS as T1_F1 } from './batch-foxtrot-definitions-1.mjs';
import { PART_2_UNITS as T1_F2 } from './batch-foxtrot-definitions-2.mjs';
import { PART_3_UNITS as T1_F3 } from './batch-foxtrot-definitions-3.mjs';
import { PART_4_UNITS as T1_F4 } from './batch-foxtrot-definitions-4.mjs';

// Track 2 definitions
import { SECURITY_COCKPITS as T2_D1 } from './batch-delta-cockpits-1.mjs';
import { INFRA_COCKPITS as T2_D2 } from './batch-delta-cockpits-2.mjs';
import { DATA_COCKPITS as T2_D3 } from './batch-delta-cockpits-3.mjs';
import { PERF_COCKPITS as T2_D4 } from './batch-delta-cockpits-4.mjs';

import { NETWORK_EDGE_COCKPITS as T2_E1 } from './batch-echo-cockpits-1.mjs';
import { STORAGE_CACHE_COCKPITS as T2_E2 } from './batch-echo-cockpits-2.mjs';
import { DEVSECOPS_COCKPITS as T2_E3 } from './batch-echo-cockpits-3.mjs';
import { FINANCIAL_USAGE_COCKPITS as T2_E4 } from './batch-echo-cockpits-4.mjs';

import { AI_ML_COCKPITS as T2_F1 } from './batch-foxtrot-cockpits-1.mjs';
import { DISTRIBUTED_STREAMING_COCKPITS as T2_F2 } from './batch-foxtrot-cockpits-2.mjs';
import { EDGE_INGESTION_COCKPITS as T2_F3 } from './batch-foxtrot-cockpits-3.mjs';
import { SECURITY_CRYPTO_COCKPITS as T2_F4 } from './batch-foxtrot-cockpits-4.mjs';

import { AUTONOMOUS_SCADA_COCKPITS as T2_G1 } from './batch-golf-cockpits-1.mjs';
import { QUANT_LIQUIDITY_COCKPITS as T2_G2 } from './batch-golf-cockpits-2.mjs';
import { EDGE_AI_SWARM_COCKPITS as T2_G3 } from './batch-golf-cockpits-3.mjs';
import { CLOUD_TELEMETRY_INFRA_COCKPITS as T2_G4 } from './batch-golf-cockpits-4.mjs';

// Batch Alpha Unit 4 (Unit #322)
const BATCH_ALPHA_UNIT_322 = {
  num: 322,
  id: 'GF-T2-CHRONO-04',
  folder: '04-chrono-pulse',
  name: 'CHRONO-PULSE',
  subtitle: 'Scheduled Job & Task Execution Telemetry Board',
  vertical: 'operations'
};

// Batch Charlie Static Metadata (Units #334 to #343)
const BATCH_CHARLIE_UNITS = [
  { num: 334, id: 'GF-T2-NEXUS-01', folder: '01-nexus-fabric', name: 'NEXUS-FABRIC', subtitle: 'Multi-Cloud Mesh Network Topology Visualizer', vertical: 'networking' },
  { num: 335, id: 'GF-T2-AEGIS-02', folder: '02-aegis-gateway', name: 'AEGIS-GATEWAY', subtitle: 'Edge Rate-Limiter & Token Bucket Diagnostics', vertical: 'infrastructure' },
  { num: 336, id: 'GF-T2-PULSE-03', folder: '03-pulse-overload', name: 'PULSE-OVERLOAD', subtitle: 'Circuit Breaker Failure State & Recovery Radar', vertical: 'reliability' },
  { num: 337, id: 'GF-T2-CLOCK-04', folder: '04-chrono-lock', name: 'CHRONO-LOCK', subtitle: 'Distributed Lease & Mutex Deadlock Monitor', vertical: 'distributed' },
  { num: 338, id: 'GF-T2-PRISM-05', folder: '05-prism-telemetry', name: 'PRISM-TELEMETRY', subtitle: 'Distributed OpenTelemetry Span & Trace Explorer', vertical: 'observability' },
  { num: 339, id: 'GF-T2-KINETIC-06', folder: '06-kinetic-queue', name: 'KINETIC-QUEUE', subtitle: 'RabbitMQ/SQS Backpressure & Dead-Letter Gauge', vertical: 'streaming' },
  { num: 340, id: 'GF-T2-CIPHER-07', folder: '07-cipher-ledger', name: 'CIPHER-LEDGER', subtitle: 'Immutable Append-Only Audit Trail Cockpit', vertical: 'security' },
  { num: 341, id: 'GF-T2-SPECTRAL-08', folder: '08-spectral-cdn', name: 'SPECTRAL-CDN', subtitle: 'Anycast Edge Point-of-Presence Routing Map', vertical: 'networking' },
  { num: 342, id: 'GF-T2-IRON-09', folder: '09-iron-schema', name: 'IRON-SCHEMA', subtitle: 'Database Migration Lock & DDL Execution Timeline', vertical: 'database' },
  { num: 343, id: 'GF-T2-HYPER-10', folder: '10-hyper-compact', name: 'HYPER-COMPACT', subtitle: 'Zero-Copy Memory Serialization Profiler', vertical: 'performance' }
];

// Helper to assemble Track 1 units
function formatTrack1Unit(u) {
  const cohort = u.num < 364 ? 'Cluster-007 (Batch Delta Swarm)' : (u.num < 384 ? 'Cluster-008 (Batch Echo Swarm)' : 'Cluster-008 (Batch Foxtrot Swarm)');
  const batchFolder = u.num < 364 ? 't1-batch-delta' : (u.num < 384 ? 't1-batch-echo' : 't1-batch-foxtrot');
  const clusterFolder = u.num < 364 ? 'cluster-007' : 'cluster-008';

  return {
    id: u.num,
    unit_id: u.tag,
    tag: u.tag,
    name: `${u.tag} ${u.name}`,
    category: u.name,
    gumroad_url: `https://auraandgrid.gumroad.com/l/${u.tag.toLowerCase()}`,
    preview_url: null,
    admin_url: null,
    audit_score: 9.8,
    tables: ['telemetry_metrics', 'execution_logs', 'rate_limits', 'apa_title_ledger'],
    vertical: 'telemetry',
    archetype_id: 'A',
    archetype_name: 'Archetype A: Dense Operational Console',
    archetype_description: `Deterministic standalone micro-utility: ${u.name}. Zero external dependencies. Execution benchmark: ${u.benchmark}.`,
    design_benchmark: 'High-Throughput Node.js Micro-Utility Engine',
    checkout_active: true,
    status_badge: 'Track 1 Lean Tuner Utility Unit',
    commercial_checkout_url: `https://auraandgrid.gumroad.com/l/${u.tag.toLowerCase()}`,
    demo_passcode_type: 'DEMO PASSCODE (READ-ONLY SANDBOX)',
    security_architecture: 'Level 3: Full-Stack Blueprint (Strict Deterministic Micro-Engine)',
    pricing_track: 'Track 1 — Lean Tuner',
    truth_label: 'Working Utility Engine (Zero External Dependencies) — Pure APA Title Transfer',
    truth_badge: 'Working Utility Engine // 100% Pure APA Buyout Title Transfer',
    disclaimer: 'SIMULATED DATA PROTOTYPE — FOR CONCEPT DEMO ONLY — NOT PRODUCTION OR ADVICE',
    best_for: 'Best for: Microservices, high-velocity data pipelines & edge compute runtimes',
    domain: 'Autonomous Telemetry & Operations',
    rarity_tier: 'Core',
    permanent: false,
    buyoutEligible: true,
    live_url: null,
    flagship_qualified: false,
    demo_url: `/fleet/${clusterFolder}/${batchFolder}/${u.folder}/README.md`,
    track: 'Track 1',
    retail_buyout: 4500,
    wholesale_floor: 3800,
    retail_valuation: 4500,
    wholesale_floor_reserve: 3800,
    apa_buyout_floor: 3800,
    exclusive_buyout_anchor: 4500,
    exclusive_buyout_range: [3800, 6500],
    retail_buyout_msrp: 4500,
    wholesale_floor_price: 3800,
    full_stack: true,
    full_stack_status: 'Track 1 Standalone ESM Micro-Utility',
    middleware: 'Lightweight Stream Processing Middleware',
    database_schema: 'PostgreSQL Telemetry Schemas with RLS',
    async_queue_workers: 'Async Utility Execution Workers',
    gridsync_middleware: true,
    schema_rls_enabled: true,
    staging_location: `fleet/${clusterFolder}/${batchFolder}/${u.folder}/`
  };
}

// Helper to assemble Track 2 units
function formatTrack2Unit(u, batchKey) {
  let batchFolder = 'batch-delta';
  let demoPath = `/cockpits/${batchFolder}/${u.folder}/index.html`;
  let stagingLoc = `cockpits/${batchFolder}/${u.folder}/`;

  if (batchKey === 'ALPHA') {
    batchFolder = 'cockpits';
    demoPath = `/cockpits/${u.folder}/index.html`;
    stagingLoc = `cockpits/${u.folder}/`;
  } else if (batchKey === 'CHARLIE') {
    batchFolder = 'batch-charlie';
    demoPath = `/cockpits/batch-charlie/${u.folder}/index.html`;
    stagingLoc = `cockpits/batch-charlie/${u.folder}/`;
  } else if (batchKey === 'ECHO') {
    batchFolder = 'batch-echo';
    demoPath = `/cockpits/batch-echo/${u.folder}/index.html`;
    stagingLoc = `cockpits/batch-echo/${u.folder}/`;
  } else if (batchKey === 'FOXTROT') {
    batchFolder = 'batch-foxtrot';
    demoPath = `/cockpits/batch-foxtrot/${u.folder}/index.html`;
    stagingLoc = `cockpits/batch-foxtrot/${u.folder}/`;
  } else if (batchKey === 'GOLF') {
    batchFolder = 'batch-golf';
    demoPath = `/cockpits/batch-golf/${u.folder}/index.html`;
    stagingLoc = `cockpits/batch-golf/${u.folder}/`;
  }

  return {
    id: u.num,
    unit_id: u.id,
    tag: u.id,
    name: `${u.id} ${u.name}`,
    category: u.subtitle,
    gumroad_url: `https://auraandgrid.gumroad.com/l/${u.id.toLowerCase()}`,
    preview_url: demoPath,
    admin_url: null,
    audit_score: 9.9,
    tables: ['telemetry_streams', 'system_signals', 'operator_events', 'apa_title_ledger'],
    vertical: u.vertical || 'infrastructure',
    archetype_id: 'A',
    archetype_name: 'Archetype A: Dense Operational Console',
    archetype_description: `${u.subtitle} with animated SVG radar scope, dual metric HUDs, and real-time event stream.`,
    design_benchmark: 'Obsidian Carbon SCADA Telemetry Console',
    checkout_active: true,
    status_badge: 'Track 2 Hypercar Flagship Cockpit',
    commercial_checkout_url: `https://auraandgrid.gumroad.com/l/${u.id.toLowerCase()}`,
    demo_passcode_type: 'DEMO PASSCODE (READ-ONLY SANDBOX)',
    security_architecture: 'Level 3: Full-Stack Blueprint (NIST SP 800-218 SSDF v1.1 + Zero Copyleft)',
    pricing_track: 'Track 2 — Hypercar Flagship',
    truth_label: 'Interactive Prototype (Simulated Data Stream) — 100% Pure APA Buyout Title Transfer',
    truth_badge: '[Product Truth: Interactive Prototype // Simulated Data Stream]',
    commercial_tag: '100% Pure APA Buyout Title Transfer (Zero Licenses)',
    disclaimer: 'SIMULATED DATA PROTOTYPE — FOR CONCEPT DEMO ONLY — NOT PRODUCTION OR ADVICE',
    best_for: 'Best for: Security Operations Centers (SOC), network engineers & telemetry analysts',
    domain: 'High-Density Operational Cockpits',
    rarity_tier: 'Elite',
    permanent: false,
    buyoutEligible: true,
    live_url: null,
    flagship_qualified: true,
    demo_url: demoPath,
    track: 'Track 2',
    retail_buyout: 14500,
    wholesale_floor: 10000,
    retail_valuation: 14500,
    wholesale_floor_reserve: 10000,
    apa_buyout_floor: 10000,
    exclusive_buyout_anchor: 14500,
    exclusive_buyout_range: [10000, 18000],
    vault_buyout_range: [25000, 50000],
    retail_buyout_msrp: 14500,
    wholesale_floor_price: 10000,
    full_stack: true,
    full_stack_status: 'Track 2 Standalone React 19 Flagship Cockpit',
    complianceStandard: 'NIST-SP-800-218',
    staging_location: stagingLoc
  };
}

// Assemble all 62 Track 1 units
export const ALL_NEW_TRACK1_UNITS = [
  ...[...T1_D1, ...T1_D2, ...T1_D3, ...T1_D4].map(formatTrack1Unit),
  ...[...T1_E1, ...T1_E2, ...T1_E3, ...T1_E4].map(formatTrack1Unit),
  ...[...T1_F1, ...T1_F2, ...T1_F3, ...T1_F4].map(formatTrack1Unit)
];

// Assemble all 99 Track 2 units (Unit 322 + Batch Charlie + Delta + Echo + Foxtrot + Golf)
export const ALL_NEW_TRACK2_UNITS = [
  formatTrack2Unit(BATCH_ALPHA_UNIT_322, 'ALPHA'),
  ...BATCH_CHARLIE_UNITS.map(u => formatTrack2Unit(u, 'CHARLIE')),
  ...[...T2_D1, ...T2_D2, ...T2_D3, ...T2_D4].map(u => formatTrack2Unit(u, 'DELTA')),
  ...[...T2_E1, ...T2_E2, ...T2_E3, ...T2_E4].map(u => formatTrack2Unit(u, 'ECHO')),
  ...[...T2_F1, ...T2_F2, ...T2_F3, ...T2_F4].map(u => formatTrack2Unit(u, 'FOXTROT')),
  ...[...T2_G1, ...T2_G2, ...T2_G3, ...T2_G4].map(u => formatTrack2Unit(u, 'GOLF'))
];

export const ALL_NEW_STAMPED_UNITS = [
  ...ALL_NEW_TRACK1_UNITS,
  ...ALL_NEW_TRACK2_UNITS
];
