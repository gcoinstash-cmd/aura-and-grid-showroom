import assert from 'node:assert/strict';
import { serializeNdjson, parseNdjson } from './engine.js';

console.log('⚡ [Unit #372 Test Suite] Testing NDJSON Streamer & Validator...');

// Test 1: Serialize and parse roundtrip
{
  const records = [
    { id: 1, event: 'telemetry_ping', latencyMs: 4.2 },
    { id: 2, event: 'telemetry_pong', latencyMs: 3.8 }
  ];
  const ndjson = serializeNdjson(records);
  assert.ok(ndjson.includes('\n'));

  const parsed = parseNdjson(ndjson);
  assert.deepEqual(parsed, records);
  console.log('  ✔ NDJSON serialization & parsing roundtrip passed');
}

// Test 2: Error handling & ignoreErrors option
{
  const malformed = '{"ok": true}\nNOT_JSON\n{"ok": 2}';
  assert.throws(() => parseNdjson(malformed, { ignoreErrors: false }));
  const tolerant = parseNdjson(malformed, { ignoreErrors: true });
  assert.equal(tolerant.length, 2);
  console.log('  ✔ Malformed row filtering passed');
}
