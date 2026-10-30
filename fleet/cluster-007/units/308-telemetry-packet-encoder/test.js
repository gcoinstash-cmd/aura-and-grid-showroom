import assert from 'node:assert/strict';
import {
  encodePacket,
  decodePacket,
  toBase64,
  fromBase64,
  toHex,
  fromHex,
  computeCrc16,
  benchmarkPacketEncoder,
  PacketEncodingError
} from './engine.js';

console.log('⚡ [Unit #308 Test Suite] Initiating verification sequence...');

// Test 1: Base64 & Base64URL
{
  const testMsg = 'AuraGrid//Telemetry::Packet';
  const b64 = toBase64(testMsg, false);
  assert.equal(fromBase64(b64), testMsg);

  const b64Url = toBase64(testMsg, true);
  assert.ok(!b64Url.includes('+') && !b64Url.includes('/') && !b64Url.includes('='));
  assert.equal(fromBase64(b64Url), testMsg);
  console.log('  ✔ toBase64 & fromBase64 passed');
}

// Test 2: Hex Conversion
{
  const testMsg = 'SuperchargedMotor42';
  const hex = toHex(testMsg);
  assert.equal(fromHex(hex), testMsg);
  assert.throws(() => fromHex('invalid_hex'), PacketEncodingError);
  console.log('  ✔ toHex & fromHex passed');
}

// Test 3: Framed Packet Roundtrip with CRC & Prefix
{
  const payload = { rpm: 8400, gear: 4, oil_psi: 58.2 };
  const packet = encodePacket(payload, 'base64url', { prefix: 'GF_TEL', includeCrc: true });
  assert.ok(packet.startsWith('GF_TEL:'));
  assert.ok(packet.includes('#'));

  const decoded = decodePacket(packet, 'base64url', { expectedPrefix: 'GF_TEL', verifyCrc: true, parseJson: true });
  assert.equal(decoded.data.rpm, 8400);
  assert.equal(decoded.crcValid, true);
  console.log('  ✔ Framed Packet Roundtrip with CRC passed');
}

// Test 4: CRC Tampering Detection
{
  const packet = encodePacket('SensorSafe', 'hex', { includeCrc: true });
  const tampered = packet.slice(0, -2) + '00';
  assert.throws(() => {
    decodePacket(tampered, 'hex', { verifyCrc: true });
  }, PacketEncodingError);
  console.log('  ✔ CRC Tampering Detection passed');
}

// Test 5: Benchmark
{
  const bench = benchmarkPacketEncoder(1000);
  assert.ok(bench.opsPerSec > 10000, `Throughput was ${bench.opsPerSec} ops/sec`);
  console.log(`  ✔ benchmarkPacketEncoder passed (${bench.opsPerSec} ops/sec, latency: ${bench.avgLatencyUs} µs)`);
}

console.log('🏁 [Unit #308 Test Suite] ALL CHECKS 100% GREEN.\n');
