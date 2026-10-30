import assert from 'node:assert/strict';
import { formatMetric, formatMetricsBatch } from './engine.js';

console.log('⚡ [Unit #397 Test Suite] Testing Prometheus Metric Formatter...');

// Test 1: Single metric with labels and help
{
  const out = formatMetric('fleet_telemetry_latency_ms', 12.4, { cluster: '008', track: '1' }, 'Telemetry latency in milliseconds', 'gauge');
  assert.ok(out.includes('# HELP fleet_telemetry_latency_ms'));
  assert.ok(out.includes('# TYPE fleet_telemetry_latency_ms gauge'));
  assert.ok(out.includes('fleet_telemetry_latency_ms{cluster="008",track="1"} 12.4'));
  console.log('  ✔ Prometheus standard line formatting verified');
}

// Test 2: Batch formatting
{
  const batch = [
    { name: 'requests_total', value: 1050, labels: { method: 'POST' }, type: 'counter' },
    { name: 'active_sessions', value: 42, labels: {}, type: 'gauge' }
  ];
  const rendered = formatMetricsBatch(batch);
  assert.ok(rendered.includes('requests_total{method="POST"} 1050'));
  assert.ok(rendered.includes('active_sessions 42'));
  console.log('  ✔ Prometheus batch output verified');
}
