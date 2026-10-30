import assert from 'node:assert/strict';
import {
  validateSchema,
  assertValid,
  benchmarkSchemaValidator,
  SchemaValidationError
} from './engine.js';

console.log('⚡ [Unit #312 Test Suite] Initiating verification sequence...');

// Test 1: Primitive Type Validations
{
  assert.equal(validateSchema({ type: 'string' }, 'hello').valid, true);
  assert.equal(validateSchema({ type: 'string' }, 123).valid, false);
  assert.equal(validateSchema({ type: 'number' }, 42.5).valid, true);
  assert.equal(validateSchema({ type: 'integer' }, 42).valid, true);
  assert.equal(validateSchema({ type: 'integer' }, 42.5).valid, false);
  console.log('  ✔ Primitive Type validations passed');
}

// Test 2: Required Properties & Bounds
{
  const schema = {
    type: 'object',
    required: ['chassis', 'speed'],
    properties: {
      chassis: { type: 'string', minLength: 3, maxLength: 10 },
      speed: { type: 'number', minimum: 0, maximum: 300 }
    }
  };

  const valid = { chassis: 'GF-007', speed: 120 };
  assert.equal(validateSchema(schema, valid).valid, true);

  const missing = { chassis: 'GF-007' };
  const resMissing = validateSchema(schema, missing);
  assert.equal(resMissing.valid, false);
  assert.ok(resMissing.errors.some(e => e.rule === 'required'));

  const outOfBounds = { chassis: 'A', speed: 999 };
  const resBounds = validateSchema(schema, outOfBounds);
  assert.equal(resBounds.valid, false);
  assert.equal(resBounds.errors.length, 2);
  console.log('  ✔ Required Properties & Bounds passed');
}

// Test 3: Enums and Patterns
{
  const schema = {
    type: 'string',
    pattern: '^GF-[0-9]{3}$',
    enum: ['GF-303', 'GF-312']
  };

  assert.equal(validateSchema(schema, 'GF-312').valid, true);
  assert.equal(validateSchema(schema, 'GF-999').valid, false); // Not in enum
  assert.equal(validateSchema(schema, 'INVALID').valid, false); // Pattern fails
  console.log('  ✔ Enums and Patterns passed');
}

// Test 4: Array Item Schemas
{
  const schema = {
    type: 'array',
    items: { type: 'integer', minimum: 1 }
  };
  assert.equal(validateSchema(schema, [1, 2, 3, 4]).valid, true);
  assert.equal(validateSchema(schema, [1, 0, 3]).valid, false);
  console.log('  ✔ Array Item Schemas passed');
}

// Test 5: assertValid throwing
{
  assert.equal(assertValid({ type: 'boolean' }, true), true);
  assert.throws(() => {
    assertValid({ type: 'boolean' }, 'true');
  }, SchemaValidationError);
  console.log('  ✔ assertValid passed');
}

// Test 6: Benchmark
{
  const bench = benchmarkSchemaValidator(1000);
  assert.ok(bench.opsPerSec > 50000, `Throughput was ${bench.opsPerSec} ops/sec`);
  console.log(`  ✔ benchmarkSchemaValidator passed (${bench.opsPerSec} ops/sec, latency: ${bench.avgLatencyUs} µs)`);
}

console.log('🏁 [Unit #312 Test Suite] ALL CHECKS 100% GREEN.\n');
