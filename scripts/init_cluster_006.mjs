#!/usr/bin/env node

/**
 * scripts/init_cluster_006.mjs
 * 
 * GhostFactoryOS × Aura & Grid — Cluster 006 Intake Pipeline Initializer
 * Establishes the automated intake queue for Unit #252 through Unit #300
 * (49 open slots remaining to reach 300 active units / 6 sealed clusters).
 * 
 * Configures intake metadata to automatically tag new units to:
 *   cluster_id: "CLUSTER-006"
 *   cluster_theme: "Next-Gen Autonomous Telemetry / FinTech Series 2"
 *   dyno_gate_status: "PENDING_VERIFICATION"
 * 
 * Authority: Lead Systems Engineer & Dealership Crew Chief
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const MAGENTA = '\x1b[35m';
const WHITE = '\x1b[37m';

const BATCH_SIZE = 50;
const CLUSTER_ID = 'CLUSTER-006';
const CLUSTER_THEME = 'Next-Gen Autonomous Telemetry / FinTech Series 2';

console.log(`${BOLD}${CYAN}================================================================================${RESET}`);
console.log(`${BOLD}${CYAN}   GHOSTFACTORYOS — CLUSTER 006 INTAKE PIPELINE INITIALIZER v1.0${RESET}`);
console.log(`${DIM}   Scope: Units #252 through #300 (49 Slots to Reach 6 Sealed Batches)${RESET}`);
console.log(`${BOLD}${CYAN}================================================================================${RESET}\n`);

// 1. INGEST CURRENT FLEET
const fleetPath = path.join(ROOT_DIR, 'fleet.json');
if (!fs.existsSync(fleetPath)) {
  console.error(`[ERROR] fleet.json not found at ${fleetPath}`);
  process.exit(1);
}

const fleet = JSON.parse(fs.readFileSync(fleetPath, 'utf8'));
const currentUnits = fleet.length; // 251

// 2. COMPILE ACTIVE QUEUE SPECIFICATION
const startUnitNumber = currentUnits + 1; // 252
const endUnitNumber = 300;
const totalSlots = endUnitNumber - startUnitNumber + 1; // 49

const queueSlots = [];

for (let unitNum = startUnitNumber; unitNum <= endUnitNumber; unitNum++) {
  const slotIndex = unitNum - 250; // slot 2 of 50 (since unit 251 is slot 1)
  const unitTag = `GF-T3-${String(unitNum).padStart(3, '0')}`;

  queueSlots.push({
    slot_index: slotIndex,
    target_unit_id: unitTag,
    unit_number: unitNum,
    cluster_id: CLUSTER_ID,
    cluster_theme: CLUSTER_THEME,
    tier_classification: 'Track 3 — F1 Skunkworks Engine',
    status: 'PENDING_INTAKE',
    auto_tag_rule: {
      on_dyno_pass: {
        cluster_id: CLUSTER_ID,
        tag: unitTag,
        commercial_theme: CLUSTER_THEME,
        clean_room_standard: 'NIST-SP-800-218-SSDF-v1.1'
      }
    },
    dyno_verification_criteria: {
      gate_1_state_machine: 'REQUIRED (Deterministic math / Kalman filtering / order book)',
      gate_2_clean_room_ip: 'REQUIRED (100% Permissive MIT/Apache-2.0, Zero Copyleft)',
      gate_3_hardened_schema: 'REQUIRED (PostgreSQL DDL + Row Level Security)',
      gate_4_turnkey_deploy: 'REQUIRED (Cloud Run Docker Container + OpenAPI 3.1 contract)'
    }
  });
}

// 3. COMPILE INTAKE MANIFEST
const intakeManifest = {
  manifest_title: 'GhostFactoryOS Cluster 006 Intake Pipeline Specification',
  schema_version: '1.0.0-INTAKE-QUEUE',
  timestamp: new Date().toISOString(),
  cluster_id: CLUSTER_ID,
  cluster_theme: CLUSTER_THEME,
  seal_threshold: BATCH_SIZE,
  units_currently_sealed_in_cluster: 1, // unit 251
  units_remaining_to_seal: totalSlots,  // 49
  target_fleet_capacity_at_seal: endUnitNumber, // 300
  commercial_parameters: {
    asking_anchor_usd: 1250000,
    asking_anchor_formatted: '$1,250,000',
    reserve_walk_away_floor_usd: 750000,
    reserve_walk_away_floor_formatted: '$750,000',
    minimum_pof_gate_usd: 1000000,
    escrow_protocol: 'Escrow.com / Acquire.com Institutional Desk'
  },
  queue_slots: queueSlots
};

// Write intake queue files
const queueOutputPath = path.join(ROOT_DIR, 'cluster_006_intake_queue.json');
fs.writeFileSync(queueOutputPath, JSON.stringify(intakeManifest, null, 2), 'utf8');

const escrowQueuePath = path.join(ROOT_DIR, 'docs', 'escrow', 'CLUSTER_006_INTAKE_MANIFEST.json');
fs.writeFileSync(escrowQueuePath, JSON.stringify(intakeManifest, null, 2), 'utf8');

// 4. PRINT TELEMETRY SUMMARY
console.log(`${BOLD}CLUSTER 006 INTAKE QUEUE TELEMETRY:${RESET}`);
console.log(`--------------------------------------------------------------------------------`);
console.log(`  Target Cluster ID       : ${BOLD}${CYAN}${CLUSTER_ID}${RESET}`);
console.log(`  Commercial Theme        : ${BOLD}${WHITE || ''}${CLUSTER_THEME}${RESET}`);
console.log(`  Current Units Sealed    : ${BOLD}${GREEN}1 / 50 Chassis${RESET} (Unit #251 in place)`);
console.log(`  Slots Available         : ${BOLD}${YELLOW}${totalSlots} Slots Remaining${RESET} (Units #${startUnitNumber} through #${endUnitNumber})`);
console.log(`  Batch Seal Target       : ${BOLD}${CYAN}300 Total Fleet Units${RESET} (6 Sealed Clusters)`);
console.log(`  Asking Anchor           : ${BOLD}${GREEN}$1,250,000 USD${RESET} | Floor: ${BOLD}$750,000 USD${RESET}`);
console.log(`  Proof of Funds Gate     : ${BOLD}$1,000,000 USD${RESET} (Mandatory Pre-Qualification)`);
console.log(`--------------------------------------------------------------------------------`);
console.log(`  Intake Manifest Saved   : ${BOLD}${queueOutputPath}${RESET}`);
console.log(`  Escrow Pipeline Mirrored: ${BOLD}${escrowQueuePath}${RESET}\n`);
console.log(`${BOLD}${GREEN}✔ CLUSTER 006 INTAKE QUEUE INITIALIZED SUCCESSFULLY!${RESET}\n`);
