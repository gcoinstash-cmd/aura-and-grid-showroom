/**
 * GhostFactoryOS — Track 1 Batch Echo Master Verification Sweep
 * Executes all 20 units (#364 to #383) and prints a telemetry markdown table.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const ROOT_DIR = process.cwd();
const BATCH_DIR = path.join(ROOT_DIR, 'fleet', 'cluster-008', 't1-batch-echo');

const unitDirs = fs.readdirSync(BATCH_DIR)
  .filter(d => fs.statSync(path.join(BATCH_DIR, d)).isDirectory())
  .sort();

console.log(`⚡ [GhostFactoryOS] Running Master Verification Suite for ${unitDirs.length} Batch Echo Units...\n`);

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
console.log(`       GHOST FACTORY OS // BATCH ECHO TELEMETRY SWEEP (UNITS #364 - #383)`);
console.log(`========================================================================================\n`);

console.log('| Unit ID | Unit Name | Test Status | Latency | Commercial Tag | Retail Anchor |');
console.log('| :--- | :--- | :---: | :---: | :--- | :---: |');

for (const r of results) {
  const statusBadge = r.passed ? '`100% GREEN`' : '`FAILED`';
  console.log(`| **${r.unit.slice(0, 3)}** | ${r.unit.slice(4)} | ${statusBadge} | ${r.latencyMs}ms | 100% Pure APA Title | **$4,500** |`);
}

console.log(`\n----------------------------------------------------------------------------------------`);
console.log(`BATCH ECHO AUDIT: ${totalPassed}/${results.length} UNITS GREEN (${totalPassed === results.length ? '100% Green Target Achieved' : 'FAILURES DETECTED'})`);
console.log(`----------------------------------------------------------------------------------------\n`);

if (totalPassed !== results.length) {
  process.exit(1);
} else {
  process.exit(0);
}
