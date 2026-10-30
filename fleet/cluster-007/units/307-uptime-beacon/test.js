/**
 * Unit #307 Test Suite: Cron-Ready HTTP Ping & Uptime Telemetry Beacon
 * Track 1 Verification Rig
 */

import assert from 'node:assert/strict';
import http from 'node:http';
import { probeEndpoint, startBeaconLoop } from './engine.js';

console.log('⚡ [Unit #307 Test Suite] Initiating verification sequence...');

// Setup ephemeral local test server
const mockServer = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: 10420 }));
  } else if (url.pathname === '/slow') {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Slow response');
    }, 150);
  } else if (url.pathname === '/timeout') {
    // Hang connection to test timeout
    setTimeout(() => {
      if (!res.writableEnded) {
        res.writeHead(200);
        res.end('Late');
      }
    }, 1000);
  } else if (url.pathname === '/error') {
    res.writeHead(503, { 'Content-Type': 'text/plain' });
    res.end('Service Unavailable');
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

mockServer.listen(0, '127.0.0.1', async () => {
  const port = mockServer.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Test 1: Successful Health Probe
    {
      const report = await probeEndpoint({
        url: `${baseUrl}/healthz`,
        expectedStatus: 200,
        bodyMatch: 'uptime',
        slaMaxLatencyMs: 500
      });

      assert.equal(report.status, 'HEALTHY');
      assert.equal(report.http_status, 200);
      assert.equal(report.assertions.status_ok, true);
      assert.equal(report.assertions.body_match, true);
      assert.equal(report.assertions.sla_met, true);
      assert.ok(report.timings.total_ms > 0);
      console.log(`  ✔ Health Probe (200 OK) passed (${report.timings.total_ms}ms latency)`);
    }

    // Test 2: Error Status (503 Service Unavailable)
    {
      const report = await probeEndpoint({
        url: `${baseUrl}/error`,
        expectedStatus: 200
      });

      assert.equal(report.status, 'DOWN');
      assert.equal(report.http_status, 503);
      assert.equal(report.assertions.status_ok, false);
      console.log('  ✔ Error Status (503 DOWN) passed');
    }

    // Test 3: Body Mismatch
    {
      const report = await probeEndpoint({
        url: `${baseUrl}/healthz`,
        bodyMatch: 'non_existent_key_xyz'
      });

      assert.equal(report.status, 'DOWN');
      assert.equal(report.assertions.body_match, false);
      console.log('  ✔ Body Mismatch Assertion passed');
    }

    // Test 4: Latency SLA Breach -> DEGRADED
    {
      const report = await probeEndpoint({
        url: `${baseUrl}/slow`,
        expectedStatus: 200,
        slaMaxLatencyMs: 50 // Expecting <50ms, but endpoint takes ~150ms
      });

      assert.equal(report.status, 'DEGRADED');
      assert.equal(report.assertions.sla_met, false);
      console.log('  ✔ SLA Breach -> DEGRADED passed');
    }

    // Test 5: Timeout Handling
    {
      const report = await probeEndpoint({
        url: `${baseUrl}/timeout`,
        timeoutMs: 100
      });

      assert.equal(report.status, 'TIMEOUT');
      assert.ok(report.error.includes('timed out'));
      console.log('  ✔ Timeout Handling passed');
    }

    // Test 6: Beacon Loop and Cancellation
    {
      let pingCount = 0;
      const loop = startBeaconLoop(
        { url: `${baseUrl}/healthz` },
        50,
        (rep) => {
          pingCount++;
        }
      );

      await new Promise(r => setTimeout(r, 160));
      loop.stop();

      assert.ok(pingCount >= 2, `Expected at least 2 pings, got ${pingCount}`);
      console.log(`  ✔ startBeaconLoop & stop passed (${pingCount} cycles captured)`);
    }

    console.log('🏁 [Unit #307 Test Suite] ALL CHECKS 100% GREEN.\n');
  } catch (err) {
    console.error('Test Suite Failed:', err);
    process.exitCode = 1;
  } finally {
    mockServer.close();
  }
});
