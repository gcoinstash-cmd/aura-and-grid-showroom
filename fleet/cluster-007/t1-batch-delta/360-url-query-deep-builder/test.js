import assert from 'node:assert/strict';
import { buildQuery } from './engine.js';

console.log('⚡ [Unit #360 Test Suite] Testing URL Query Deep Builder...');

// Test 1: Nested object flattening
{
  const payload = {
    filter: { status: 'active', tier: 2 },
    tags: ['audit', 'scada']
  };

  const query = buildQuery(payload);
  assert.ok(query.includes('filter%5Bstatus%5D=active'));
  assert.ok(query.includes('filter%5Btier%5D=2'));
  assert.ok(query.includes('tags%5B%5D=audit'));
  console.log('  ✔ Bracket-nested query string built correctly');
}
