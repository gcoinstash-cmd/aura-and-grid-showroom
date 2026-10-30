/**
 * Unit #303 Test Suite: JSON/CSV Telemetry Stream Normalizer
 * Track 1 Verification Rig
 */

import assert from 'node:assert/strict';
import {
  normalizeRecord,
  normalizeJson,
  normalizeCsv,
  parseCsvRows,
  normalizeTimestamp,
  normalizeMetricName,
  normalizeNumericValue,
  benchmarkNormalizer,
  TelemetryNormalizationError
} from './engine.js';

console.log('⚡ [Unit #303 Test Suite] Initiating verification sequence...');

// Test 1: Timestamp normalization
{
  const isoTest = normalizeTimestamp('2026-10-30T12:00:00.000Z');
  assert.equal(isoTest.iso, '2026-10-30T12:00:00.000Z');
  assert.equal(isoTest.ms, 1793361600000);
  assert.equal(isoTest.degraded, false);

  const secTest = normalizeTimestamp(1793361600); // 10-digit seconds
  assert.equal(secTest.ms, 1793361600000);
  assert.equal(secTest.degraded, false);

  const fallbackTest = normalizeTimestamp('invalid-date-string');
  assert.equal(fallbackTest.degraded, true);
  assert.ok(fallbackTest.ms > 0);

  console.log('  ✔ normalizeTimestamp passed');
}

// Test 2: Metric name sanitization
{
  assert.equal(normalizeMetricName('EngineRPM'), 'engine_rpm');
  assert.equal(normalizeMetricName('  manifold.pressure-psi!  '), 'manifold_pressure_psi');
  assert.equal(normalizeMetricName(''), 'unspecified_metric');
  console.log('  ✔ normalizeMetricName passed');
}

// Test 3: Numeric value coercion
{
  assert.deepEqual(normalizeNumericValue(42.5), { value: 42.5, degraded: false });
  assert.deepEqual(normalizeNumericValue('128.9'), { value: 128.9, degraded: false });
  assert.deepEqual(normalizeNumericValue('invalid', false), { value: 0, degraded: true });

  assert.throws(() => {
    normalizeNumericValue('corrupt', true);
  }, TelemetryNormalizationError);
  console.log('  ✔ normalizeNumericValue passed');
}

// Test 4: Record normalization
{
  const raw = {
    source: 'CHASSIS-007',
    sensor: 'OilTemperature',
    reading: '94.2',
    unit: 'celsius',
    time: '2026-10-30T12:30:00.000Z',
    tags: { sector: 'powertrain', rev: 'v2' }
  };

  const record = normalizeRecord(raw);
  assert.ok(record.record_id);
  assert.equal(record.source_id, 'CHASSIS-007');
  assert.equal(record.metric, 'oil_temperature');
  assert.equal(record.value, 94.2);
  assert.equal(record.unit, 'celsius');
  assert.equal(record.quality, 'VALID');
  assert.equal(record.dimensions.sector, 'powertrain');
  console.log('  ✔ normalizeRecord passed');
}

// Test 5: JSON parsing (Array, Object, JSONL)
{
  const jsonArray = [
    { source: 'S1', metric: 'm1', value: 10 },
    { source: 'S2', metric: 'm2', value: 20 }
  ];
  const normalizedArr = normalizeJson(jsonArray);
  assert.equal(normalizedArr.length, 2);

  const jsonlString = `{"source":"L1","value":1.1}\n{"source":"L2","value":2.2}`;
  const normalizedJsonl = normalizeJson(jsonlString);
  assert.equal(normalizedJsonl.length, 2);
  assert.equal(normalizedJsonl[0].source_id, 'L1');
  assert.equal(normalizedJsonl[1].value, 2.2);
  console.log('  ✔ normalizeJson (Array + JSONL) passed');
}

// Test 6: CSV parsing & normalization
{
  const csvRaw = `source,metric,value,unit,rack\nUNIT-A,exhaust_temp,550.4,celsius,bay-1\nUNIT-B,boost_psi,"18,5",psi,bay-2`;
  const parsedRows = parseCsvRows(csvRaw);
  assert.equal(parsedRows.length, 3);
  assert.equal(parsedRows[2][2], '18,5'); // Handles quotes with internal comma

  const standardCsv = `source,sensor,reading,unit,bay\nNODE-9,voltage,13.8,volts,main\nNODE-9,amperage,4.2,amps,main`;
  const normalizedCsv = normalizeCsv(standardCsv);
  assert.equal(normalizedCsv.length, 2);
  assert.equal(normalizedCsv[0].metric, 'voltage');
  assert.equal(normalizedCsv[0].value, 13.8);
  assert.equal(normalizedCsv[1].dimensions.bay, 'main');
  console.log('  ✔ normalizeCsv & parseCsvRows passed');
}

// Test 7: Benchmark execution
{
  const bench = benchmarkNormalizer(1000);
  assert.equal(bench.count, 1000);
  assert.ok(bench.throughputRps > 1000, `Throughput was ${bench.throughputRps} rps`);
  console.log(`  ✔ benchmarkNormalizer passed (${bench.throughputRps} records/sec, latency ${bench.avgLatencyUs} µs/record)`);
}

console.log('🏁 [Unit #303 Test Suite] ALL CHECKS 100% GREEN.\n');
