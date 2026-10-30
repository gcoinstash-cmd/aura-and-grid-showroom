import assert from 'node:assert/strict';
import { CircuitBreaker } from './engine.js';

console.log('⚡ [Unit #403 Test Suite] Testing Circuit Breaker State Machine...');

// Test 1: Trip to OPEN state after threshold failures
{
  const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 100 });
  assert.equal(cb.getState(), 'CLOSED');

  cb.recordFailure();
  cb.recordFailure();
  assert.equal(cb.getState(), 'CLOSED');

  cb.recordFailure();
  assert.equal(cb.getState(), 'OPEN');

  assert.throws(() => cb.execute(() => 'should fail'), /CircuitBreakerOpenError/);
  console.log('  ✔ Circuit tripping and fast-failure verified');
}
