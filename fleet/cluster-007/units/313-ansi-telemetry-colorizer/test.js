import assert from 'node:assert/strict';
import {
  color,
  stripAnsi,
  drawBox,
  renderProgressBar,
  benchmarkColorizer
} from './engine.js';

console.log('⚡ [Unit #313 Test Suite] Initiating verification sequence...');

// Test 1: Color Styling & Strip ANSI
{
  const text = 'VehicleStatus: Nominal';
  const styled = color.green(color.bold(text));
  assert.ok(styled.includes('\x1b[32m'));
  assert.ok(styled.includes('\x1b[1m'));
  assert.equal(stripAnsi(styled), text);
  console.log('  ✔ Color styling & stripAnsi passed');
}

// Test 2: TrueColor Hex Support
{
  const hexStyled = color.hex('#FF0077', 'HotPinkTelemetry');
  assert.ok(hexStyled.includes('\x1b[38;2;255;0;119m'));
  assert.equal(stripAnsi(hexStyled), 'HotPinkTelemetry');
  console.log('  ✔ TrueColor Hex passed');
}

// Test 3: Box Drawing
{
  const boxOutput = drawBox('Cluster-007\nTrack 1 Unit', { title: 'DEALERSHIP', borderStyle: 'rounded' });
  assert.ok(boxOutput.includes('╭'));
  assert.ok(boxOutput.includes('DEALERSHIP'));
  assert.ok(boxOutput.includes('Track 1 Unit'));
  assert.ok(boxOutput.includes('╰'));
  console.log('  ✔ drawBox passed');
}

// Test 4: Progress Bar
{
  const bar = renderProgressBar(50, 10, true);
  assert.ok(bar.includes('50%'));
  const cleanBar = stripAnsi(bar);
  assert.ok(cleanBar.includes('[█████░░░░░]'));
  console.log('  ✔ renderProgressBar passed');
}

// Test 5: Benchmark
{
  const bench = benchmarkColorizer(1000);
  assert.ok(bench.opsPerSec > 50000, `Throughput was ${bench.opsPerSec} ops/sec`);
  console.log(`  ✔ benchmarkColorizer passed (${bench.opsPerSec} ops/sec, latency: ${bench.avgLatencyUs} µs)`);
}

console.log('🏁 [Unit #313 Test Suite] ALL CHECKS 100% GREEN.\n');
