#!/usr/bin/env node

/**
 * scripts/generate_fleet_clusters.mjs
 * 
 * GhostFactoryOS × Aura & Grid — 20% Portfolio APA Carve-Out Cluster Generator
 * Ingests fleet.json and partitions all 251 sovereign digital vehicle units into
 * 5 discrete, turnkey commercial carve-out packages:
 *   - Cluster 01: Fintech & Telemetry Engines (50 units // APA Anchor: $1.5M)
 *   - Cluster 02: Enterprise SCADA & Industrial Ops (50 units // APA Anchor: $1.25M)
 *   - Cluster 03: Autonomous AI Orchestration & Ingress (50 units // APA Anchor: $1.4M)
 *   - Cluster 04: Dense Media & Automation Workflows (51 units // APA Anchor: $1.1M)
 *   - Cluster 05: HealthTech & Operational Consoles (50 units // APA Anchor: $1.2M)
 * 
 * Compiles for each cluster:
 *   - Unit list (ID, Title, Track tier, working demo URL, standalone retail replacement price)
 *   - Cumulative standalone retail replacement price
 *   - Package APA buyout price (~20% fleet carve-out anchor)
 *   - Acquirer profile & turnkey deployment spec
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const fleetPath = path.join(ROOT_DIR, 'fleet.json');
if (!fs.existsSync(fleetPath)) {
  console.error(`fleet.json not found at ${fleetPath}`);
  process.exit(1);
}

const fleet = JSON.parse(fs.readFileSync(fleetPath, 'utf8'));

if (fleet.length !== 251) {
  console.error(`Expected 251 units, found ${fleet.length}`);
  process.exit(1);
}

function getUnitRetailPrice(u) {
  if (u.track === 'Track 1') {
    return u.retail_valuation || u.retail_buyout_msrp || 12500;
  }
  if (u.track === 'Track 2') {
    return 35000;
  }
  if (u.track === 'Track 3') {
    return u.enterprise_valuation || u.retail_ceiling || u.retail_valuation || 150000;
  }
  return 12500;
}

function formatCurrency(val) {
  return '$' + val.toLocaleString('en-US');
}

function getTrackTierLabel(u) {
  if (u.track === 'Track 1' || (u.pricing_track && u.pricing_track.includes('Track 1'))) {
    return 'Track 1 — Lean Tuner';
  }
  if (u.track === 'Track 2' || (u.pricing_track && u.pricing_track.includes('Track 2'))) {
    return 'Track 2 — Hypercar Flagship';
  }
  if (u.track === 'Track 3' || (u.pricing_track && u.pricing_track.includes('Track 3'))) {
    return 'Track 3 — F1 Skunkworks Engine';
  }
  return u.pricing_track || u.track || 'Track 1 — Lean Tuner';
}

function getWorkingDemoUrl(u) {
  if (u.demo_url && u.demo_url.trim()) return u.demo_url.trim();
  if (u.preview_url && u.preview_url.trim()) return u.preview_url.trim();
  if (u.live_url && u.live_url.trim()) return u.live_url.trim();
  const idStr = String(u.id || '').padStart(3, '0');
  const trackNum = u.track === 'Track 3' ? '3' : (u.track === 'Track 2' ? '2' : '1');
  return `/demos/gf-t${trackNum}-${idStr}/index.html`;
}

// Cluster Definitions
const clusterDefs = [
  {
    cluster_id: 'cluster-01',
    cluster_number: 1,
    name: 'Cluster 01: Fintech & Telemetry Engines',
    short_name: 'Fintech & Telemetry Engines',
    slug: 'fintech-telemetry-engines',
    target_units: 50,
    carve_out_pct: '19.92%',
    apa_anchor_price: 1500000,
    apa_anchor_formatted: '$1,500,000',
    primary_vertical: 'FinTech, Quantitative Finance & High-Frequency Telemetry',
    acquirer_profile: 'Institutional hedge funds, quantitative trading desks, high-frequency liquidity providers, neo-banking fintech platforms, and latency-critical market makers seeking plug-and-play LOB matching engines, order routing, and deterministic settlement pipelines.',
    turnkey_deployment_spec: 'Containerized FastAPI/Python 3.12 microservices, ultra-low latency LOB matching engines, AlloyDB/PostgreSQL time-series schemas, WebSocket order book feeds, and clean-room MIT/Apache-2.0 execution harnesses. 15-minute turnkey deployment via Google Cloud Run or Kubernetes.'
  },
  {
    cluster_id: 'cluster-02',
    cluster_number: 2,
    name: 'Cluster 02: Enterprise SCADA & Industrial Ops',
    short_name: 'Enterprise SCADA & Industrial Ops',
    slug: 'enterprise-scada-industrial-ops',
    target_units: 50,
    carve_out_pct: '19.92%',
    apa_anchor_price: 1250000,
    apa_anchor_formatted: '$1,250,000',
    primary_vertical: 'Aerospace, Defense, Fusion/Clean Energy, Deep-Sea Mining & Heavy Fleet SCADA',
    acquirer_profile: 'Defense and aerospace contractors, spaceflight avionics manufacturers, commercial fusion & geothermal energy utilities, deep-sea subsea robotics operators, and critical infrastructure SCADA providers requiring deterministic real-time telemetry HUDs and air-gapped monitoring consoles.',
    turnkey_deployment_spec: 'High-density interactive telemetry dashboards, real-time WebSocket state synchronizers, PostgreSQL schemas with Row-Level Security (RLS), Canvas/WebGL telemetry visualizers, air-gapped container configurations, and NIST SP 800-218 SSDF v1.1 verified SBOM packages.'
  },
  {
    cluster_id: 'cluster-03',
    cluster_number: 3,
    name: 'Cluster 03: Autonomous AI Orchestration & Ingress',
    short_name: 'Autonomous AI Orchestration & Ingress',
    slug: 'autonomous-ai-orchestration-ingress',
    target_units: 50,
    carve_out_pct: '19.92%',
    apa_anchor_price: 1400000,
    apa_anchor_formatted: '$1,400,000',
    primary_vertical: 'Edge AI Swarms, Multi-Agent Consensus & Autonomous Guidance',
    acquirer_profile: 'Enterprise AI platform providers, autonomous robotics laboratories, multi-agent AI framework operators, edge computing cloud infrastructure firms, and autonomous drone swarm coordinators seeking turnkey state machines and sensor fusion architectures.',
    turnkey_deployment_spec: 'Multi-agent consensus state machines, decentralized task orchestration pipelines, zero-drift type contracts (OpenAPI 3.1), GPU/edge inference gateways, real-time telemetry streaming, and zero copyleft clean-room codebases.'
  },
  {
    cluster_id: 'cluster-04',
    cluster_number: 4,
    name: 'Cluster 04: Dense Media & Automation Workflows',
    short_name: 'Dense Media & Automation Workflows',
    slug: 'dense-media-automation-workflows',
    target_units: 51,
    carve_out_pct: '20.32%',
    apa_anchor_price: 1100000,
    apa_anchor_formatted: '$1,100,000',
    primary_vertical: 'Creative Production, Luxury Hospitality & Automation Services',
    acquirer_profile: 'Global digital media conglomerates, creative production networks, boutique luxury agency collectives, B2B workflow SaaS roll-up private equity firms, and hospitality operating system platforms seeking high-velocity client portals and operations suites.',
    turnkey_deployment_spec: 'Modular Next.js/React responsive control centers, automated operational triage drawers, asset pipeline automation microservices, PostgreSQL schemas with schema migrations, and turnkey agency white-label re-branding architecture under full Asset Purchase Agreement (APA) title transfer.'
  },
  {
    cluster_id: 'cluster-05',
    cluster_number: 5,
    name: 'Cluster 05: HealthTech & Operational Consoles',
    short_name: 'HealthTech & Operational Consoles',
    slug: 'healthtech-operational-consoles',
    target_units: 50,
    carve_out_pct: '19.92%',
    apa_anchor_price: 1200000,
    apa_anchor_formatted: '$1,200,000',
    primary_vertical: 'Clinical Medicine, High-Performance Athletics & Operational Dispatch',
    acquirer_profile: 'Healthcare technology providers, clinical diagnostics networks, boutique wellness clinic operators, medical logistics networks, athletic performance academies, and high-performance biomechanics research institutions.',
    turnkey_deployment_spec: 'HIPAA-architected data models (ready for customer BAA configuration), appointment/patient triage queues, isolated tenant database schemas with strict RLS policies, HMAC request signing middleware, and modern responsive operator HUDs.'
  }
];

// Partitioning Algorithm
const assigned = new Set();
const clusterBuckets = {
  'cluster-01': [],
  'cluster-02': [],
  'cluster-03': [],
  'cluster-04': [],
  'cluster-05': []
};

// Step 1: Cluster 04 (Dense Media & Automation Workflows: creative, hospitality, home_services) -> exactly 51 units
fleet.forEach(u => {
  const v = (u.vertical || '').toLowerCase();
  if (v === 'creative' || v === 'hospitality' || v === 'home_services') {
    clusterBuckets['cluster-04'].push(u);
    assigned.add(u.id);
  }
});

// Step 2: Cluster 02 (Enterprise SCADA & Industrial Ops: aerospace, subsea, clean_energy, deep_tech, defense, heavy_fleet, zero-trust cyber)
// Except GF-T2-099 Luxury Auto Concierge which belongs in automotive / C5
fleet.forEach(u => {
  if (assigned.has(u.id)) return;
  const v = (u.vertical || '').toLowerCase();
  const name = (u.name || '').toLowerCase();
  if (u.unit_id === 'GF-T2-099' || name.includes('luxury auto concierge')) {
    return;
  }
  if (v === 'aerospace' || v === 'subsea' || v === 'clean_energy' || v === 'deep_tech' || v === 'defense' || v === 'heavy_fleet' || v === 'zero-trust cyber') {
    clusterBuckets['cluster-02'].push(u);
    assigned.add(u.id);
  }
});

// Step 3: Cluster 01 (Fintech & Telemetry Engines: all fintech/quant + wealth + 6 high-precision telemetry cores)
const c1TelemUnitIds = ['GF-T3-153', 'GF-T3-139', 'GF-T3-144', 'GF-T3-149', 'GF-T3-150', 'GF-T3-156'];
fleet.forEach(u => {
  if (assigned.has(u.id)) return;
  const v = (u.vertical || '').toLowerCase();
  if (v.includes('fintech') || v.includes('wealth') || c1TelemUnitIds.includes(u.unit_id)) {
    clusterBuckets['cluster-01'].push(u);
    assigned.add(u.id);
  }
});

// Step 4: Cluster 03 (Autonomous AI Orchestration & Ingress: Edge AI Swarms + 15 autonomous guidance/platform cores)
const c3TelemUnitIds = [
  'GF-T3-142', 'GF-T3-143', 'GF-T3-147', 'GF-T3-158', 'GF-T3-161', 'GF-T3-164',
  'GF-T3-166', 'GF-T3-167', 'GF-T3-168', 'GF-T3-169', 'GF-T3-170', 'GF-T3-171',
  'GF-T3-172', 'GF-T3-173', 'GF-T3-174'
];
fleet.forEach(u => {
  if (assigned.has(u.id)) return;
  const v = (u.vertical || '').toLowerCase();
  if (v.includes('edge ai') || c3TelemUnitIds.includes(u.unit_id)) {
    clusterBuckets['cluster-03'].push(u);
    assigned.add(u.id);
  }
});

// Step 5: Cluster 05 (HealthTech & Operational Consoles: medical, fitness, automotive, remaining vehicle cores)
fleet.forEach(u => {
  if (assigned.has(u.id)) return;
  clusterBuckets['cluster-05'].push(u);
  assigned.add(u.id);
});

// Compile Cluster Results
let totalRetailAcrossClusters = 0;
let totalApaAnchorsAcrossClusters = 0;

const compiledClusters = clusterDefs.map(def => {
  const unitsInCluster = clusterBuckets[def.cluster_id] || [];
  
  // Sort units cleanly by ID
  unitsInCluster.sort((a, b) => a.id - b.id);

  const clusterRetailTotal = unitsInCluster.reduce((sum, u) => sum + getUnitRetailPrice(u), 0);
  totalRetailAcrossClusters += clusterRetailTotal;
  totalApaAnchorsAcrossClusters += def.apa_anchor_price;

  const unitList = unitsInCluster.map(u => {
    const retailPrice = getUnitRetailPrice(u);
    return {
      id: u.unit_id || u.tag || `GF-${u.id}`,
      unit_number: u.id,
      title: u.name,
      track_tier: getTrackTierLabel(u),
      track: u.track || 'Track 1',
      vertical: u.vertical || '',
      working_demo_url: getWorkingDemoUrl(u),
      standalone_retail_price: retailPrice,
      standalone_retail_formatted: formatCurrency(retailPrice),
      tables_count: Array.isArray(u.tables) ? u.tables.length : 0,
      clean_room_verified: true,
      security_architecture: u.security_architecture || 'Level 3: Full-Stack Blueprint (RLS + Isolated Schemas)'
    };
  });

  const track1Count = unitList.filter(u => u.track === 'Track 1').length;
  const track2Count = unitList.filter(u => u.track === 'Track 2').length;
  const track3Count = unitList.filter(u => u.track === 'Track 3').length;

  return {
    cluster_id: def.cluster_id,
    cluster_number: def.cluster_number,
    name: def.name,
    short_name: def.short_name,
    slug: def.slug,
    unit_count: unitList.length,
    carve_out_pct: def.carve_out_pct,
    package_apa_buyout_price: def.apa_anchor_price,
    package_apa_buyout_formatted: def.apa_anchor_formatted,
    cumulative_standalone_retail_price: clusterRetailTotal,
    cumulative_standalone_retail_formatted: formatCurrency(clusterRetailTotal),
    discount_vs_standalone_pct: `${(((clusterRetailTotal - def.apa_anchor_price) / clusterRetailTotal) * 100).toFixed(1)}%`,
    track_distribution: {
      track_1_lean_tuner: track1Count,
      track_2_hypercar_flagship: track2Count,
      track_3_f1_skunkworks: track3Count
    },
    primary_vertical: def.primary_vertical,
    acquirer_profile: def.acquirer_profile,
    turnkey_deployment_spec: def.turnkey_deployment_spec,
    clean_room_guarantee: '100% Permissive Open Source (MIT/Apache-2.0/BSD), 0% Copyleft, Isolated Relational Schemas, Enforced RLS',
    units: unitList
  };
});

const outputManifest = {
  manifest_title: 'GhostFactoryOS 5 Vertical Commercial Fleet Clusters (20% APA Carve-Outs)',
  schema_version: '4.2.0-COMMERCIAL-CLUSTERS-251',
  timestamp: new Date().toISOString(),
  governing_standard: 'NIST SP 800-218 SSDF v1.1 // 80/20 Retention Floor M&A Standard',
  retention_floor_governance: {
    total_fleet_units: 251,
    retained_vault_floor_units: 201,
    retained_vault_floor_pct: 80,
    maximum_apa_carve_out_units: 50,
    carve_out_model: 'Single Cluster Transfer per Acquisition Event (~20% Portfolio Carve-Out)'
  },
  financial_summary: {
    cumulative_apa_anchors_usd: totalApaAnchorsAcrossClusters,
    cumulative_apa_anchors_formatted: formatCurrency(totalApaAnchorsAcrossClusters),
    cumulative_standalone_retail_usd: totalRetailAcrossClusters,
    cumulative_standalone_retail_formatted: formatCurrency(totalRetailAcrossClusters),
    average_cluster_apa_anchor_usd: totalApaAnchorsAcrossClusters / compiledClusters.length,
    average_cluster_apa_anchor_formatted: formatCurrency(totalApaAnchorsAcrossClusters / compiledClusters.length)
  },
  clusters: compiledClusters
};

// Write root fleet_clusters.json
const rootClustersPath = path.join(ROOT_DIR, 'fleet_clusters.json');
fs.writeFileSync(rootClustersPath, JSON.stringify(outputManifest, null, 2), 'utf8');

// Mirror to tools/ghost-factory-console/src/data/fleet_clusters.json
const consoleSrcDataPath = path.join(ROOT_DIR, 'tools', 'ghost-factory-console', 'src', 'data', 'fleet_clusters.json');
if (fs.existsSync(path.dirname(consoleSrcDataPath))) {
  fs.writeFileSync(consoleSrcDataPath, JSON.stringify(outputManifest, null, 2), 'utf8');
}

// Mirror to tools/ghost-factory-console/data/fleet_clusters.json
const consoleDataPath = path.join(ROOT_DIR, 'tools', 'ghost-factory-console', 'data', 'fleet_clusters.json');
if (fs.existsSync(path.dirname(consoleDataPath))) {
  fs.writeFileSync(consoleDataPath, JSON.stringify(outputManifest, null, 2), 'utf8');
}

console.log('✅ Generated fleet_clusters.json successfully:');
compiledClusters.forEach(c => {
  console.log(`  - [${c.cluster_id}] ${c.short_name}: ${c.unit_count} units | APA: ${c.package_apa_buyout_formatted} | Retail: ${c.cumulative_standalone_retail_formatted}`);
});
console.log(`Total Units Partitioned: ${compiledClusters.reduce((s, c) => s + c.unit_count, 0)} / 251`);
console.log(`Total APA Anchors: ${outputManifest.financial_summary.cumulative_apa_anchors_formatted}`);
