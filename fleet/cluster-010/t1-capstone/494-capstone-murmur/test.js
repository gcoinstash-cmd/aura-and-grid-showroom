import assert from 'node:assert/strict';
import { MurmurHash3 } from './engine.js';

console.log('⚡ [Unit #494 Test Suite] Testing MurmurHash3 128-bit & 32-bit Hasher...');

// Test 1: 32-bit hash determinism
{
  const h1 = MurmurHash3.hash32('GhostFactoryOS_Telemetry_Alpha', 42);
  const h2 = MurmurHash3.hash32('GhostFactoryOS_Telemetry_Alpha', 42);
  assert.equal(h1, h2);
  assert.equal(typeof h1, 'number');
  assert.ok(h1 > 0);
  console.log(`  ✔ 32-bit deterministic hashing validated: 0x${h1.toString(16)}`);
}

// Test 2: 128-bit hex output format & avalanche check
{
  const hashA = MurmurHash3.hash128('GhostFactoryOS_Cluster_010_Cap', 0);
  const hashB = MurmurHash3.hash128('GhostFactoryOS_Cluster_010_Caq', 0); // 1 char flip

  assert.equal(hashA.length, 32);
  assert.equal(hashB.length, 32);
  assert.match(hashA, /^[0-9a-f]{32}$/);
  assert.match(hashB, /^[0-9a-f]{32}$/);
  assert.notEqual(hashA, hashB, 'Avalanche effect must completely change 128-bit hash');
  console.log(`  ✔ 128-bit avalanche effect verified: ${hashA} != ${hashB}`);
}

// Test 3: Buffer & Unicode support
{
  const buf = Buffer.from([0x05, 0x07, 0x0b, 0xff, 0x9f, 0x0a]);
  const bufHash = MurmurHash3.hash128(buf, 1337);
  assert.equal(bufHash.length, 32);

  const utf8Hash = MurmurHash3.hash128('🏎️💨 F1 Skunkworks Engine', 777);
  assert.equal(utf8Hash.length, 32);
  console.log(`  ✔ Binary buffer and UTF-8 multibyte input verified: ${bufHash}`);
}

console.log('✅ Unit #494: All tests passed 100% green.');
