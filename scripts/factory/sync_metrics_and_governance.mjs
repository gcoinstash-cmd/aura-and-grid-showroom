#!/usr/bin/env node
/**
 * scripts/factory/sync_metrics_and_governance.mjs
 * 
 * Synchronizes portfolio metrics, governance specifications, and console telemetry
 * to the 301-unit baseline, $23,787,000 retail MSRP (~$23.78M+), and Cluster 006 sealed status.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

const TOTAL_UNITS = 301;
const RETAIL_MSRP = 23787000;
const RETAIL_FORMATTED = '$23,787,000';
const FMV_AMOUNT = 9864000;
const FMV_FORMATTED = '$9,864,000';
const WHOLESALE_AMOUNT = 6073500;
const WHOLESALE_FORMATTED = '$6,073,500';
const WALK_AWAY_AMOUNT = 2968000;
const WALK_AWAY_FORMATTED = '$2,968,000';

const RETAINED_FLOOR = 241; // 80% of 301
const MAX_APA_CAPACITY = 60; // 20% of 301

const TRACK_1_COUNT = 86;
const TRACK_2_COUNT = 51;
const TRACK_3_COUNT = 164; // 114 + 50

console.log('>>> SYNCHRONIZING METRICS & GOVERNANCE TO 301-UNIT BASELINE...');

// 1. UPDATE portfolio-metrics.json
const portfolioMetrics = {
  total_assets: TOTAL_UNITS,
  retained_floor: RETAINED_FLOOR,
  max_apa_capacity: MAX_APA_CAPACITY,
  tracks: {
    track_1: TRACK_1_COUNT,
    track_2: TRACK_2_COUNT,
    track_3: TRACK_3_COUNT
  },
  valuation_basis: "Cost Approach (Replacement Cost Basis) — Verified Agency-Equivalent Engineering Hours & Zero Licensing",
  valuation: {
    total_retail_price: RETAIL_MSRP,
    certified_fair_market_value: FMV_AMOUNT,
    wholesale_price: WHOLESALE_AMOUNT,
    walk_away_floor: WALK_AWAY_AMOUNT
  },
  pillars: {
    total_retail_price: {
      label: "TOTAL RETAIL PRICE",
      amount_usd: RETAIL_MSRP,
      formatted: RETAIL_FORMATTED,
      subtitle: `Combined Standalone Agency Replacement Benchmark across all ${TOTAL_UNITS} upgraded chassis.`
    },
    certified_fair_market_value: {
      label: "CERTIFIED FAIR MARKET VALUE",
      amount_usd: FMV_AMOUNT,
      formatted: FMV_FORMATTED,
      subtitle: "Direct Mid-Market Appraisal"
    },
    wholesale_price: {
      label: "WHOLESALE PRICE",
      amount_usd: WHOLESALE_AMOUNT,
      formatted: WHOLESALE_FORMATTED,
      subtitle: "Institutional Bulk Floor"
    },
    walk_away_floor: {
      label: "WALK-AWAY FLOOR",
      amount_usd: WALK_AWAY_AMOUNT,
      formatted: WALK_AWAY_FORMATTED,
      subtitle: "Sovereign Liquidation Reserve"
    }
  }
};

const metricTargets = [
  path.join(ROOT_DIR, 'portfolio-metrics.json'),
  path.join(ROOT_DIR, 'catalog', 'portfolio-metrics.json'),
  path.join(ROOT_DIR, 'site', 'portfolio-metrics.json'),
  path.join(ROOT_DIR, 'site', 'catalog', 'portfolio-metrics.json'),
  path.join(ROOT_DIR, 'tools', 'ghost-factory-console', 'src', 'data', 'metrics.json')
];

metricTargets.forEach(dest => {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(portfolioMetrics, null, 2), 'utf8');
});

// 2. UPDATE governance.json
const govPath = path.join(ROOT_DIR, 'governance.json');
const governance = JSON.parse(fs.readFileSync(govPath, 'utf8'));

governance.schema_version = `5.0.0-SCALING-MILESTONES-${TOTAL_UNITS}`;
governance.audit_timestamp = new Date().toISOString();
governance.active_fleet_size = TOTAL_UNITS;
governance.fleet_breakdown = {
  total_active_units: TOTAL_UNITS,
  tuner_hypercar_units: TRACK_1_COUNT + TRACK_2_COUNT,
  track_1_lean_tuner: TRACK_1_COUNT,
  track_2_hypercar_flagship: TRACK_2_COUNT,
  track_3_reference_cores: TRACK_3_COUNT,
  description: `${TOTAL_UNITS} Active Units (${TRACK_1_COUNT} Track 1, ${TRACK_2_COUNT} Track 2, ${TRACK_3_COUNT} Track 3)`
};

governance.portfolio_valuation_pillars.retail_showroom_baseline.amount_usd = RETAIL_MSRP;
governance.portfolio_valuation_pillars.retail_showroom_baseline.formatted = RETAIL_FORMATTED;
governance.portfolio_valuation_pillars.retail_showroom_baseline.subtitle = `Combined Standalone Agency Replacement Benchmark across all ${TOTAL_UNITS} upgraded chassis.`;

governance.portfolio_valuation_pillars.certified_fair_market_value.amount_usd = FMV_AMOUNT;
governance.portfolio_valuation_pillars.certified_fair_market_value.formatted = FMV_FORMATTED;
governance.portfolio_valuation_pillars.certified_fair_market_value.subtitle = `Verified mid-market enterprise appraisal benchmark across all ${TOTAL_UNITS} software engines.`;

governance.portfolio_valuation_pillars.wholesale_acquisition_reserve_floor.amount_usd = WHOLESALE_AMOUNT;
governance.portfolio_valuation_pillars.wholesale_acquisition_reserve_floor.formatted = WHOLESALE_FORMATTED;

governance.portfolio_valuation_pillars.distressed_panic_floor.amount_usd = WALK_AWAY_AMOUNT;
governance.portfolio_valuation_pillars.distressed_panic_floor.formatted = WALK_AWAY_FORMATTED;

governance.retention_governance = {
  minimum_retained_floor_pct: 80,
  minimum_retained_units: RETAINED_FLOOR,
  maximum_apa_transfer_units: MAX_APA_CAPACITY,
  target_500_retained_units: 400,
  target_500_apa_transfer_units: 100
};

// Ingest sealed clusters from fleet_clusters.json
const fcPath = path.join(ROOT_DIR, 'fleet_clusters.json');
if (fs.existsSync(fcPath)) {
  const fc = JSON.parse(fs.readFileSync(fcPath, 'utf8'));
  governance.commercial_fleet_clusters = {
    carve_out_architecture: "20% Portfolio APA Carve-Out Standard",
    retention_floor_pct: 80,
    vault_retained_units: RETAINED_FLOOR,
    max_transferable_units: MAX_APA_CAPACITY,
    total_clusters: fc.clusters.length,
    total_partitioned_units: TOTAL_UNITS,
    cumulative_apa_anchors_usd: fc.financial_summary.cumulative_apa_anchors_usd,
    cumulative_apa_anchors_formatted: fc.financial_summary.cumulative_apa_anchors_formatted,
    cumulative_standalone_retail_usd: fc.financial_summary.cumulative_agency_replacement_usd,
    cumulative_standalone_retail_formatted: fc.financial_summary.cumulative_agency_replacement_formatted,
    clean_room_guarantee: "100% Permissive Commercial Open Source (MIT/Apache-2.0/BSD), 0% Copyleft, Isolated Relational Schemas, Enforced RLS",
    clusters: fc.clusters.map(c => ({
      cluster_id: c.cluster_id.toLowerCase().replace('-', ''),
      cluster_number: parseInt(c.cluster_id.replace('CLUSTER-', ''), 10),
      name: c.cluster_title,
      short_name: c.commercial_vertical_theme,
      slug: c.cluster_id.toLowerCase(),
      status: c.status,
      unit_count: c.unit_count,
      carve_out_pct: c.carve_out_pct,
      apa_anchor_price: c.carve_out_apa_asking_anchor,
      apa_anchor_formatted: c.carve_out_apa_asking_anchor_formatted,
      cumulative_standalone_retail_price: c.combined_agency_replacement_value,
      cumulative_standalone_retail_formatted: c.combined_agency_replacement_formatted,
      track_distribution: {
        track_1_lean_tuner: c.track_distribution.track_1_lean_tuner,
        track_2_hypercar_flagship: c.track_distribution.track_2_hypercar_flagship,
        track_3_f1_skunkworks: c.track_distribution.track_3_f1_skunkworks
      },
      primary_vertical: c.commercial_vertical_theme,
      acquirer_profile: c.acquirer_profile,
      turnkey_deployment_spec: c.turnkey_deployment_spec
    }))
  };

  governance.cluster_protocol = {
    protocol_version: "1.0.0",
    protocol_name: "Rolling 50-Unit Portfolio APA Carve-Out Protocol",
    batch_size: 50,
    clusters_active: fc.clusters.length,
    clusters_sealed: fc.clusters.filter(c => c.status === 'SEALED').length,
    unsealed_clusters: fc.clusters.filter(c => c.status === 'ACTIVE_UNSEALED').length,
    total_units_audited: TOTAL_UNITS,
    minimum_pof_gate_usd: 1000000,
    escrow_standard: "Escrow.com / Acquire.com Institutional M&A Escrow ($1M POF Gate)",
    equity_policy: "Zero Company Equity Sales — 100% Retained Sovereign Title",
    cleanroom_pass_rate: "100% verified MIT/Apache-2.0"
  };

  governance.scaling_milestones.tiers[0] = {
    milestone_name: "Baseline (Cluster 006 Sealed)",
    units: TOTAL_UNITS,
    clusters_count: fc.clusters.filter(c => c.status === 'SEALED').length,
    retail_msrp_usd: RETAIL_MSRP,
    retail_msrp_formatted: `${RETAIL_FORMATTED} Retail MSRP`,
    carve_out_value_usd: 7650000,
    carve_out_value_formatted: "~$7.65M Carve-Out Value",
    retained_vault_units: RETAINED_FLOOR,
    retained_vault_pct: 80
  };
}

fs.writeFileSync(govPath, JSON.stringify(governance, null, 2), 'utf8');

const consoleGovPath = path.join(ROOT_DIR, 'tools', 'ghost-factory-console', 'data', 'governance.json');
if (fs.existsSync(path.dirname(consoleGovPath))) {
  fs.writeFileSync(consoleGovPath, JSON.stringify(governance, null, 2), 'utf8');
}

// 3. UPDATE tools/ghost-factory-console/src/data/governance.ts
const tsGovPath = path.join(ROOT_DIR, 'tools', 'ghost-factory-console', 'src', 'data', 'governance.ts');
if (fs.existsSync(tsGovPath)) {
  let ts = fs.readFileSync(tsGovPath, 'utf8');
  ts = ts.replace(/activeFleetSize:\s*251/g, `activeFleetSize: ${TOTAL_UNITS}`);
  ts = ts.replace(/track3ReferenceCores:\s*114/g, `track3ReferenceCores: ${TRACK_3_COUNT}`);
  ts = ts.replace(/sovereignRetainedUnits:\s*201/g, `sovereignRetainedUnits: ${RETAINED_FLOOR}`);
  ts = ts.replace(/maxApaTransferUnits:\s*50/g, `maxApaTransferUnits: ${MAX_APA_CAPACITY}`);

  ts = ts.replace(/value:\s*'\$20,037,000'/g, `value: '${RETAIL_FORMATTED}'`);
  ts = ts.replace(/numericValue:\s*20037000/g, `numericValue: ${RETAIL_MSRP}`);
  ts = ts.replace(/value:\s*'\$8,307,000'/g, `value: '${FMV_FORMATTED}'`);
  ts = ts.replace(/numericValue:\s*8307000/g, `numericValue: ${FMV_AMOUNT}`);
  ts = ts.replace(/value:\s*'\$5,116,500'/g, `value: '${WHOLESALE_FORMATTED}'`);
  ts = ts.replace(/numericValue:\s*5116500/g, `numericValue: ${WHOLESALE_AMOUNT}`);
  ts = ts.replace(/value:\s*'\$2,500,000'/g, `value: '${WALK_AWAY_FORMATTED}'`);
  ts = ts.replace(/numericValue:\s*2500000/g, `numericValue: ${WALK_AWAY_AMOUNT}`);

  ts = ts.replace(/across all 251 upgraded chassis/g, `across all ${TOTAL_UNITS} upgraded chassis`);
  ts = ts.replace(/across all 251 software engines/g, `across all ${TOTAL_UNITS} software engines`);

  fs.writeFileSync(tsGovPath, ts, 'utf8');
}

// 4. UPDATE Screen7ValuationHub.tsx and CockpitMetrics.tsx
const s7Path = path.join(ROOT_DIR, 'tools', 'ghost-factory-console', 'src', 'screens', 'Screen7ValuationHub.tsx');
if (fs.existsSync(s7Path)) {
  let s7 = fs.readFileSync(s7Path, 'utf8');
  s7 = s7.replace(/totalAssets\s*=\s*251/g, `totalAssets = ${TOTAL_UNITS}`);
  s7 = s7.replace(/stat:\s*'\$20,037,000'/g, `stat: '${RETAIL_FORMATTED}'`);
  s7 = s7.replace(/stat:\s*'\$8,307,000'/g, `stat: '${FMV_FORMATTED}'`);
  s7 = s7.replace(/stat:\s*'\$5,116,500'/g, `stat: '${WHOLESALE_FORMATTED}'`);
  s7 = s7.replace(/stat:\s*'\$2,500,000'/g, `stat: '${WALK_AWAY_FORMATTED}'`);
  s7 = s7.replace(/across all 251 upgraded chassis/g, `across all ${TOTAL_UNITS} upgraded chassis`);
  s7 = s7.replace(/across all 251 software engines/g, `across all ${TOTAL_UNITS} software engines`);
  fs.writeFileSync(s7Path, s7, 'utf8');
}

const cmPath = path.join(ROOT_DIR, 'tools', 'ghost-factory-console', 'src', 'components', 'CockpitMetrics.tsx');
if (fs.existsSync(cmPath)) {
  let cm = fs.readFileSync(cmPath, 'utf8');
  cm = cm.replace(/metric:\s*'\$20,037,000'/g, `metric: '${RETAIL_FORMATTED}'`);
  cm = cm.replace(/metric:\s*'\$8,307,000'/g, `metric: '${FMV_FORMATTED}'`);
  cm = cm.replace(/metric:\s*'\$5,116,500'/g, `metric: '${WHOLESALE_FORMATTED}'`);
  cm = cm.replace(/metric:\s*'\$2,500,000'/g, `metric: '${WALK_AWAY_FORMATTED}'`);
  cm = cm.replace(/across all 251 upgraded chassis/g, `across all ${TOTAL_UNITS} upgraded chassis`);
  cm = cm.replace(/across all 251 software engines/g, `across all ${TOTAL_UNITS} software engines`);
  fs.writeFileSync(cmPath, cm, 'utf8');
}

console.log('✔ Successfully synchronized metrics, governance, and console components to 301 units ($23,787,000 MSRP)!');
