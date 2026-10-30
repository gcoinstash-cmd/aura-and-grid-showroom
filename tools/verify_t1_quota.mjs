#!/usr/bin/env node

/**
 * verify_t1_quota.mjs
 * 
 * GhostFactoryOS — 11-Unit Track 1 Batch Verification Dyno Runner
 * Sweeps Units #308 through #318 in high-speed parallel / sequential verification.
 * 
 * Authority: Lead Assembly Robot & Dealership Crew Chief
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UNITS = [
  { id: 'GF-T1-308', dir: '308-telemetry-packet-encoder', name: 'Base64 / Hex Telemetry Packet Encoder' },
  { id: 'GF-T1-309', dir: '309-semver-resolver-bumper', name: 'Semantic Version Semver Resolver & Bumper' },
  { id: 'GF-T1-310', dir: '310-sha256-checksum-guard', name: 'Fast SHA-256 Checksum Integrity Guard' },
  { id: 'GF-T1-311', dir: '311-retry-dispatcher', name: 'Exponential Backoff Retry Dispatcher' },
  { id: 'GF-T1-312', dir: '312-json-schema-validator', name: 'JSON Schema Type Validator Rig' },
  { id: 'GF-T1-313', dir: '313-ansi-telemetry-colorizer', name: 'ANSI Terminal Telemetry Colorizer & Formatter' },
  { id: 'GF-T1-314', dir: '314-nanoid-generator', name: 'Nano-ID Cryptographic Identifier Generator' },
  { id: 'GF-T1-315', dir: '315-url-query-serializer', name: 'URL Query Parameter Serializer & Parser' },
  { id: 'GF-T1-316', dir: '316-memory-sampler-beacon', name: 'Memory RSS Footprint Sampler Beacon' },
  { id: 'GF-T1-317', dir: '317-timestamp-drift-checker', name: 'ISO 8601 Timestamp Normalizer & Drift Checker' },
  { id: 'GF-T1-318', dir: '318-lru-cache-box', name: 'Key-Value In-Memory LRU Cache Cache-Box' }
];

console.log('================================================================================');
console.log('   GHOSTFACTORYOS — 11-UNIT TRACK 1 BATCH VERIFICATION DYNO RUNNER');
console.log('   Target Batch: Units #308 through #318 (T1 Cluster Quota Sealing)');
console.log('================================================================================\n');

const suiteStart = performance.now();
let allPassed = true;
const summary = [];

for (const unit of UNITS) {
  const unitDir = path.join(__dirname, 'fleet', 'cluster-007', 'units', unit.dir);
  const testScriptPath = path.join(unitDir, 'test.js');

  process.stdout.write(`🔬 Testing ${unit.id}: ${unit.name.padEnd(46, ' ')} `);

  const start = performance.now();
  const res = spawnSync(process.execPath, [testScriptPath], {
    encoding: 'utf8',
    cwd: unitDir
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

const totalSuiteDurationMs = Number((performance.now() - suiteStart).toFixed(1));

console.log('\n--------------------------------------------------------------------------------');
console.log(`Dyno Receipt: ${summary.filter(s => s.status === 'PASSED').length}/${UNITS.length} Units 100% Green in ${totalSuiteDurationMs}ms`);
console.log('Action Target: Strictly "ACQUIRE TITLE (APA)" | Retail Anchor: $4,500/unit');
console.log('--------------------------------------------------------------------------------\n');

if (!allPassed) {
  process.exit(1);
}
