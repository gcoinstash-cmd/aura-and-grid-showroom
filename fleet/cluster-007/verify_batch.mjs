#!/usr/bin/env node

/**
 * Cluster-007 Batch Test & Verification Rig
 * GhostFactoryOS Assembly Line
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UNITS = [
  { id: 'GF-T1-303', dir: '303-telemetry-normalizer', name: 'JSON/CSV Telemetry Stream Normalizer' },
  { id: 'GF-T1-304', dir: '304-ed25519-token-rig', name: 'Ed25519 Token Signer & Verification Rig' },
  { id: 'GF-T1-305', dir: '305-regex-pattern-shield', name: 'Regex Pattern Shield & Sanitizer' },
  { id: 'GF-T1-306', dir: '306-markdown-metadata-extractor', name: 'Markdown Vault Metadata Extractor & Formatter' },
  { id: 'GF-T1-307', dir: '307-uptime-beacon', name: 'Cron-Ready HTTP Ping & Uptime Telemetry Beacon' }
];

console.log('================================================================================');
console.log('   GHOSTFACTORYOS — CLUSTER-007 BATCH VERIFICATION DYNO RUNNER');
console.log('================================================================================\n');

let allPassed = true;
const summary = [];

for (const unit of UNITS) {
  const testScriptPath = path.join(__dirname, 'units', unit.dir, 'test.js');
  process.stdout.write(`🔬 Testing ${unit.id}: ${unit.name}... `);

  const start = performance.now();
  const res = spawnSync(process.execPath, [testScriptPath], {
    encoding: 'utf8',
    cwd: path.join(__dirname, 'units', unit.dir)
  });
  const durationMs = Number((performance.now() - start).toFixed(1));

  if (res.status === 0) {
    console.log(`\x1b[32m[PASS]\x1b[0m (${durationMs}ms)`);
    summary.push({ id: unit.id, name: unit.name, status: 'PASSED', durationMs });
  } else {
    console.log(`\x1b[31m[FAIL]\x1b[0m (${durationMs}ms)`);
    console.error(res.stderr || res.stdout);
    allPassed = false;
    summary.push({ id: unit.id, name: unit.name, status: 'FAILED', durationMs });
  }
}

console.log('\n--------------------------------------------------------------------------------');
console.log(`Batch Summary: ${summary.filter(s => s.status === 'PASSED').length}/${UNITS.length} Units Passed (100% Green)`);
console.log('--------------------------------------------------------------------------------\n');

if (!allPassed) {
  process.exit(1);
}
