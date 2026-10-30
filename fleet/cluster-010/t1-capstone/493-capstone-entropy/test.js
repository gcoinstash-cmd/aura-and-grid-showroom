import assert from 'node:assert/strict';
import { EntropySampler } from './engine.js';

console.log('⚡ [Unit #493 Test Suite] Testing Hardware CSPRNG Entropy Sampler...');

// Test 1: Byte sampling formats & lengths
{
  const hex32 = EntropySampler.sampleBytes(32, 'hex');
  assert.equal(hex32.length, 64);
  assert.match(hex32, /^[0-9a-f]{64}$/);

  const b64 = EntropySampler.sampleBytes(16, 'base64');
  assert.ok(b64.length > 0);

  const rawBuf = EntropySampler.sampleBytes(64, 'buffer');
  assert.equal(rawBuf.length, 64);
  console.log('  ✔ Sample bytes format and length validated');
}

// Test 2: In-place buffer fill
{
  const u8 = new Uint8Array(128);
  EntropySampler.fillBuffer(u8);
  const sum = u8.reduce((acc, val) => acc + val, 0);
  assert.ok(sum > 0, 'Buffer must be populated with non-zero bytes');
  console.log('  ✔ In-place buffer fill validated');
}

// Test 3: Shannon entropy check
{
  const testBytes = EntropySampler.sampleBytes(4096, 'buffer');
  const entropy = EntropySampler.shannonEntropy(testBytes);
  // A uniform random distribution on 256 states has theoretical entropy of 8.0 bits/byte
  assert.ok(entropy > 7.8, `Entropy must be close to 8.0, got ${entropy}`);
  console.log(`  ✔ Shannon entropy evaluated: ${entropy} bits/byte`);
}

// Test 4: Uniform random integer & UUID v4
{
  const randInt = EntropySampler.sampleSecureInt(10, 100);
  assert.ok(randInt >= 10 && randInt < 100);

  const uuid = EntropySampler.sampleUUIDv4();
  assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  console.log(`  ✔ UUID v4 format and CSPRNG bounds validated: ${uuid}`);
}

console.log('✅ Unit #493: All tests passed 100% green.');
