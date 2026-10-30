import assert from 'node:assert/strict';
import { HeartbeatBeacon } from './engine.js';

console.log('⚡ [Unit #496 Test Suite] Testing Sub-Millisecond Heartbeat Beacon...');

// Test 1: Frame packing & unpacking
{
  const frame = HeartbeatBeacon.pack(1042, 0xcafe_babe_dead_beefn, 0x03);
  assert.equal(frame.length, 32);

  const unpacked = HeartbeatBeacon.unpack(frame);
  assert.equal(unpacked.valid, true);
  assert.equal(unpacked.seq, 1042);
  assert.equal(unpacked.nodeIdHash, 'cafebabedeadbeef');
  assert.equal(unpacked.statusFlags, 0x03);
  console.log('  ✔ 32-byte binary frame packing & unpacking verified');
}

// Test 2: Checksum corruption detection
{
  const frame = HeartbeatBeacon.pack(1, 0x1234n, 0);
  frame[5] ^= 0xff; // Corrupt sequence byte
  const res = HeartbeatBeacon.unpack(frame);
  assert.equal(res.valid, false);
  assert.equal(res.error, 'CHECKSUM_MISMATCH');
  console.log('  ✔ Corrupted packet checksum rejection verified');
}

// Test 3: RFC 3550 Jitter Computation
{
  const latencies = [1.2, 1.4, 1.1, 1.8, 1.3, 1.2, 1.9, 1.2];
  const stats = HeartbeatBeacon.computeJitter(latencies);
  assert.equal(stats.min, 1.1);
  assert.equal(stats.max, 1.9);
  assert.ok(stats.avg > 1.3 && stats.avg < 1.5);
  assert.ok(stats.jitter > 0);
  console.log(`  ✔ Telemetry jitter & latency window calculated: avg=${stats.avg}ms, jitter=${stats.jitter}ms`);
}

console.log('✅ Unit #496: All tests passed 100% green.');
