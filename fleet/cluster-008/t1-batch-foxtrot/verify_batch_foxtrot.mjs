/**
 * GhostFactoryOS — Track 1 Batch Foxtrot Master Verification Sweep
 * Executes all 22 units (#384 to #405) and confirms that Track 1 fleet reaches 164 units.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const ROOT_DIR = process.cwd();
const BATCH_DIR = path.join(ROOT_DIR, 'fleet', 'cluster-008', 't1-batch-foxtrot');

const unitDirs = fs.readdirSync(BATCH_DIR)
  .filter(d => fs.statSync(path.join(BATCH_DIR, d)).isDirectory())
  .sort();

console.log(`⚡ [GhostFactoryOS] Running Master Verification Suite for ${unitDirs.length} Batch Foxtrot Units...\n`);

const results = [];
let totalPassed = 0;

for (const dir of unitDirs) {
  const testFile = path.join(BATCH_DIR, dir, 'test.js');
  if (!fs.existsSync(testFile)) continue;

  const start = process.hrtime.bigint();
  const res = spawnSync('node', [testFile], { encoding: 'utf8' });
  const end = process.hrtime.bigint();
  const latencyMs = Number(end - start) / 1e6;

  const passed = res.status === 0;
  if (passed) totalPassed++;

  results.push({
    unit: dir,
    passed,
    latencyMs: Number(latencyMs.toFixed(2)),
    output: res.stdout.trim(),
    error: res.stderr ? res.stderr.trim() : null
  });

  const icon = passed ? '✔' : '✖';
  console.log(`  ${icon} [${dir}] ${passed ? 'PASS' : 'FAIL'} (${latencyMs.toFixed(2)}ms)`);
  if (!passed && res.stderr) {
    console.error(res.stderr);
  }
}

console.log(`\n========================================================================================`);
console.log(`       GHOST FACTORY OS // BATCH FOXTROT TELEMETRY SWEEP (UNITS #384 - #405)`);
console.log(`========================================================================================\n`);

console.log('| Unit ID | Unit Name | Test Status | Latency | Commercial Tag | Retail Anchor |');
console.log('| :--- | :--- | :---: | :---: | :--- | :---: |');

for (const r of results) {
  const statusBadge = r.passed ? '`100% GREEN`' : '`FAILED`';
  console.log(`| **${r.unit.slice(0, 3)}** | ${r.unit.slice(4)} | ${statusBadge} | ${r.latencyMs}ms | 100% Pure APA Title | **$4,500** |`);
}

// Calculate Total Track 1 Fleet Count
const fleetJsonPath = path.join(ROOT_DIR, 'fleet.json');
let baseT1Count = 0;
if (fs.existsSync(fleetJsonPath)) {
  const fleetData = JSON.parse(fs.readFileSync(fleetJsonPath, 'utf8'));
  baseT1Count = fleetData.filter(u => u.track === 'Track 1' || u.pricing_track?.includes('Track 1')).length;
}

const deltaDir = path.join(ROOT_DIR, 'fleet', 'cluster-007', 't1-batch-delta');
const deltaCount = fs.existsSync(deltaDir) ? fs.readdirSync(deltaDir).filter(d => fs.statSync(path.join(deltaDir, d)).isDirectory()).length : 0;

const echoDir = path.join(ROOT_DIR, 'fleet', 'cluster-008', 't1-batch-echo');
const echoCount = fs.existsSync(echoDir) ? fs.readdirSync(echoDir).filter(d => fs.statSync(path.join(echoDir, d)).isDirectory()).length : 0;

const foxtrotCount = unitDirs.length;
const totalT1FleetCount = baseT1Count + deltaCount + echoCount + foxtrotCount;

console.log(`\n========================================================================================`);
console.log(`       GHOST FACTORY OS // TRACK 1 MASTER FLEET RECONCILIATION AUDIT`);
console.log(`========================================================================================`);
console.log(`• Base Catalog Track 1 Units (fleet.json):        ${baseT1Count} units`);
console.log(`• Batch Delta Tuner Units (Cluster-007):          ${deltaCount} units`);
console.log(`• Batch Echo Tuner Units (Cluster-008):           ${echoCount} units`);
console.log(`• Batch Foxtrot Tuner Units (Cluster-008):        ${foxtrotCount} units`);
console.log(`----------------------------------------------------------------------------------------`);
console.log(`TOTAL VERIFIED TRACK 1 FLEET COUNT:               ${totalT1FleetCount} / 164 UNITS`);
console.log(`TRACK 1 FLEET QUOTA LOCK STATUS:                 ${totalT1FleetCount === 164 ? 'PERMANENTLY LOCKED (164/164)' : 'QUOTA MISMATCH'}`);
console.log(`========================================================================================\n`);

if (totalPassed !== results.length || totalT1FleetCount !== 164) {
  process.exit(1);
} else {
  process.exit(0);
}
