import assert from 'node:assert/strict';
import { TelemetryEventBus } from './engine.js';

console.log('⚡ [Unit #373 Test Suite] Testing Wildcard Event Bus...');

// Test 1: Exact and wildcard matching
{
  const bus = new TelemetryEventBus();
  const received = [];

  bus.on('sensor:voltage', (data) => received.push(['exact', data]));
  bus.on('sensor:*', (data) => received.push(['wildcard', data]));
  bus.on('*', (data) => received.push(['all', data]));

  const count = bus.emit('sensor:voltage', 12.4);
  assert.equal(count, 3);
  assert.equal(received.length, 3);

  const count2 = bus.emit('sensor:temp', 45);
  assert.equal(count2, 2); // wildcard and all
  console.log('  ✔ Exact and wildcard topic matching verified');
}

// Test 2: Once and unsubscribe
{
  const bus = new TelemetryEventBus();
  let calls = 0;
  bus.once('ping', () => calls++);
  bus.emit('ping', 1);
  bus.emit('ping', 2);
  assert.equal(calls, 1);
  console.log('  ✔ One-time listener lifecycle verified');
}
