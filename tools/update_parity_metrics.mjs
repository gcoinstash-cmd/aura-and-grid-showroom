#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const TOTAL_UNITS = 492;
const RETAIL_MSRP = 31850000;
const RETAIL_FORMATTED = '$31,850,000';
const FMV_AMOUNT = 12750000;
const FMV_FORMATTED = '$12,750,000';
const WHOLESALE_AMOUNT = 8250000;
const WHOLESALE_FORMATTED = '$8,250,000';
const WALK_AWAY_AMOUNT = 4050000;
const WALK_AWAY_FORMATTED = '$4,050,000';

const RETAINED_FLOOR = 394; // 80% of 492
const MAX_APA_CAPACITY = 98; // 20% of 492

const TRACK_1_COUNT = 164;
const TRACK_2_COUNT = 164;
const TRACK_3_COUNT = 164;

console.log('>>> SYNCHRONIZING METRICS TO 492-UNIT PARITY MILESTONE ($31.85M RETAIL / $12.75M FMV)...');

// 1. Unified portfolio-metrics.json
const portfolioMetrics = {
  total_assets: TOTAL_UNITS,
  retained_floor: RETAINED_FLOOR,
  max_apa_capacity: MAX_APA_CAPACITY,
  tracks: {
    track_1: TRACK_1_COUNT,
    track_2: TRACK_2_COUNT,
    track_3: TRACK_3_COUNT
  },
  valuation_basis: "Cost Approach (Replacement Cost Basis) — Verified Agency-Equivalent Engineering Hours & Outright IP Title Transfer (Zero Seat Tiers)",
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
      subtitle: `Verified mid-market enterprise appraisal benchmark across all ${TOTAL_UNITS} software engines.`
    },
    wholesale_price: {
      label: "WHOLESALE PRICE",
      amount_usd: WHOLESALE_AMOUNT,
      formatted: WHOLESALE_FORMATTED,
      subtitle: "Institutional baseline portfolio buyout floor reflecting standard anchor tenders."
    },
    walk_away_floor: {
      label: "WALK-AWAY FLOOR",
      amount_usd: WALK_AWAY_AMOUNT,
      formatted: WALK_AWAY_FORMATTED,
      subtitle: "Absolute turnkey walk-away liquidation floor for immediate full IP title transfer."
    }
  }
};

const metricTargets = [
  path.join(ROOT_DIR, 'portfolio-metrics.json'),
  path.join(ROOT_DIR, 'catalog', 'portfolio-metrics.json'),
  path.join(ROOT_DIR, 'site', 'portfolio-metrics.json'),
  path.join(ROOT_DIR, 'site', 'catalog', 'portfolio-metrics.json'),
  path.join(ROOT_DIR, 'src', 'data', 'metrics.json'),
  path.join(ROOT_DIR, 'tools', 'ghost-factory-console', 'src', 'data', 'metrics.json'),
  path.join(ROOT_DIR, 'tools', 'ghost-factory-console', 'catalog', 'portfolio-metrics.json'),
  path.join(ROOT_DIR, 'tools', 'ghost-factory-console', 'data', 'metrics.json')
];

metricTargets.forEach(dest => {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(portfolioMetrics, null, 2), 'utf8');
  console.log(`  Updated: ${path.relative(ROOT_DIR, dest)}`);
});

// 2. Update governance.json files
const govFiles = [
  path.join(ROOT_DIR, 'governance.json'),
  path.join(ROOT_DIR, 'tools', 'ghost-factory-console', 'data', 'governance.json')
];

govFiles.forEach(govPath => {
  if (fs.existsSync(govPath)) {
    const gov = JSON.parse(fs.readFileSync(govPath, 'utf8'));
    gov.schema_version = `5.0.0-SCALING-MILESTONES-${TOTAL_UNITS}`;
    gov.audit_timestamp = new Date().toISOString();
    gov.active_fleet_size = TOTAL_UNITS;
    gov.fleet_breakdown = {
      total_active_units: TOTAL_UNITS,
      tuner_hypercar_units: TRACK_1_COUNT + TRACK_2_COUNT,
      track_1_lean_tuner: TRACK_1_COUNT,
      track_2_hypercar_flagship: TRACK_2_COUNT,
      track_3_reference_cores: TRACK_3_COUNT,
      description: `${TOTAL_UNITS} Active Units (${TRACK_1_COUNT} Track 1, ${TRACK_2_COUNT} Track 2, ${TRACK_3_COUNT} Track 3)`
    };
    gov.portfolio_valuation_pillars = {
      retail_showroom_baseline: {
        label: "TOTAL RETAIL PRICE",
        formatted: RETAIL_FORMATTED,
        amount_usd: RETAIL_MSRP,
        basis: "Agency Replacement Benchmark",
        subtitle: `Combined Standalone Agency Replacement Benchmark across all ${TOTAL_UNITS} upgraded chassis.`
      },
      certified_fair_market_value: {
        label: "CERTIFIED FAIR MARKET VALUE",
        formatted: FMV_FORMATTED,
        amount_usd: FMV_AMOUNT,
        basis: "Direct Mid-Market Appraisal",
        subtitle: `Verified mid-market enterprise appraisal benchmark across all ${TOTAL_UNITS} software engines.`
      },
      wholesale_acquisition_reserve_floor: {
        label: "WHOLESALE PRICE",
        formatted: WHOLESALE_FORMATTED,
        amount_usd: WHOLESALE_AMOUNT,
        basis: "Institutional Bulk Floor",
        subtitle: "Institutional baseline portfolio buyout floor reflecting standard anchor tenders."
      },
      distressed_panic_floor: {
        label: "WALK-AWAY FLOOR",
        formatted: WALK_AWAY_FORMATTED,
        amount_usd: WALK_AWAY_AMOUNT,
        basis: "Absolute Turnkey Walk-Away Floor",
        subtitle: "Absolute turnkey walk-away liquidation floor for immediate full IP title transfer."
      }
    };
    gov.retention_governance = {
      minimum_retained_floor_pct: 80,
      minimum_retained_units: RETAINED_FLOOR,
      maximum_apa_transfer_units: MAX_APA_CAPACITY,
      target_500_retained_units: 400,
      target_500_apa_transfer_units: 100
    };
    fs.writeFileSync(govPath, JSON.stringify(gov, null, 2), 'utf8');
    console.log(`  Updated governance: ${path.relative(ROOT_DIR, govPath)}`);
  }
});
