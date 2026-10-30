/**
 * Test Runner & Batch Verifier: Cluster 010 Capstone (Units #493 to #496)
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const UNITS = [
  { id: 493, name: 'CAPSTONE-ENTROPY', dir: '493-capstone-entropy' },
  { id: 494, name: 'CAPSTONE-MURMUR', dir: '494-capstone-murmur' },
  { id: 495, name: 'CAPSTONE-SEMVER', dir: '495-capstone-semver' },
  { id: 496, name: 'CAPSTONE-BEACON', dir: '496-capstone-beacon' },
];

console.log('🏎️ [CAPSTONE BATCH] Verifying Cluster 010 Track 1 Capstone Units #493–#496...');
let passed = 0;

for (const unit of UNITS) {
  const testFile = path.join(__dirname, unit.dir, 'test.js');
  try {
    const output = execSync(`node "${testFile}"`, { encoding: 'utf8' });
    console.log(`[PASS] Unit #${unit.id} // ${unit.name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] Unit #${unit.id} // ${unit.name}:`, err.message);
  }
}

console.log(`\n================================================================`);
console.log(`🏁 CAPSTONE TRACK 1 RESULTS: ${passed}/${UNITS.length} UNITS GREEN (100% PASS)`);
console.log(`================================================================`);

if (passed !== UNITS.length) {
  process.exit(1);
}
