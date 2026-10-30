import assert from 'node:assert/strict';
import {
  executeWithRetry,
  calculateBackoffDelay,
  benchmarkRetryDispatcher,
  RetryExhaustedError
} from './engine.js';

console.log('⚡ [Unit #311 Test Suite] Initiating verification sequence...');

// Test 1: Delay Calculation
{
  const exact = calculateBackoffDelay(3, 50, 5000, 2, 'none');
  assert.equal(exact, 200); // 50 * 2^2 = 200

  const ceiling = calculateBackoffDelay(10, 50, 500, 2, 'none');
  assert.equal(ceiling, 500); // capped at maxDelay

  const jittered = calculateBackoffDelay(2, 100, 1000, 2, 'full');
  assert.ok(jittered >= 0 && jittered <= 200);
  console.log('  ✔ calculateBackoffDelay passed');
}

// Test 2: Success on First Attempt
{
  let count = 0;
  const res = await executeWithRetry(async () => {
    count++;
    return 'immediate_success';
  });
  assert.equal(res, 'immediate_success');
  assert.equal(count, 1);
  console.log('  ✔ Immediate success passed');
}

// Test 3: Success After Transient Failures
{
  let tries = 0;
  const retryLog = [];

  const res = await executeWithRetry(
    async () => {
      tries++;
      if (tries < 3) throw new Error(`Transient network spike #${tries}`);
      return 'recovered';
    },
    {
      maxRetries: 4,
      baseDelayMs: 5,
      maxDelayMs: 20,
      jitter: 'none',
      onRetry: (att, err, delay) => {
        retryLog.push({ att, delay });
      }
    }
  );

  assert.equal(res, 'recovered');
  assert.equal(tries, 3);
  assert.equal(retryLog.length, 2);
  console.log('  ✔ Transient recovery passed');
}

// Test 4: Max Retries Exhausted
{
  let attempts = 0;
  await assert.rejects(
    async () => {
      await executeWithRetry(
        async () => {
          attempts++;
          throw new Error('Fatal service outage');
        },
        { maxRetries: 2, baseDelayMs: 2, jitter: 'none' }
      );
    },
    (err) => {
      assert.ok(err instanceof RetryExhaustedError);
      assert.equal(err.attempts, 3);
      return true;
    }
  );
  console.log('  ✔ Max retries exhaustion passed');
}

// Test 5: Non-Retryable Error Gate (retryIf)
{
  let runs = 0;
  await assert.rejects(
    async () => {
      await executeWithRetry(
        async () => {
          runs++;
          const err = new Error('HTTP 401 Unauthorized');
          err.status = 401;
          throw err;
        },
        {
          maxRetries: 5,
          retryIf: (err) => err.status >= 500 // Only retry server errors, not 401
        }
      );
    },
    (err) => {
      assert.equal(runs, 1); // Fails fast without useless retries
      return true;
    }
  );
  console.log('  ✔ retryIf filter passed');
}

// Test 6: Benchmark
{
  const bench = benchmarkRetryDispatcher(1000);
  assert.ok(bench.opsPerSec > 50000, `Throughput was ${bench.opsPerSec} ops/sec`);
  console.log(`  ✔ benchmarkRetryDispatcher passed (${bench.opsPerSec} ops/sec, latency: ${bench.avgLatencyUs} µs)`);
}

console.log('🏁 [Unit #311 Test Suite] ALL CHECKS 100% GREEN.\n');
