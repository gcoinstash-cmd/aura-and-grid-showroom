/**
 * Unit #307: Cron-Ready HTTP Ping & Uptime Telemetry Beacon
 * Track 1 (Lean Tuner) — Zero-Dependency Standalone Network Health Probe
 * 
 * GhostFactoryOS Architecture: Cluster-007
 * Pure ESM | Zero External Dependencies (Node.js standard library: node:http, node:https, node:tls, node:crypto)
 */

import http from 'node:http';
import https from 'node:https';
import { randomUUID } from 'node:crypto';

/**
 * Custom probe error
 */
export class UptimeBeaconError extends Error {
  /**
   * @param {string} message 
   * @param {string} [code='ERR_UPTIME_BEACON'] 
   * @param {any} [details=null] 
   */
  constructor(message, code = 'ERR_UPTIME_BEACON', details = null) {
    super(message);
    this.name = 'UptimeBeaconError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Probe Options
 * @typedef {Object} ProbeOptions
 * @property {string} url - Target URL to probe
 * @property {'GET'|'HEAD'|'POST'} [method='GET'] - HTTP Method
 * @property {Record<string, string>} [headers={}] - Custom request headers
 * @property {number} [timeoutMs=5000] - Socket & overall timeout threshold
 * @property {number|number[]} [expectedStatus=200] - Expected status code(s)
 * @property {string|RegExp} [bodyMatch] - Substring or Regex that must appear in body
 * @property {number} [slaMaxLatencyMs=1000] - Latency SLA ceiling in ms
 * @property {boolean} [inspectSsl=true] - Inspect SSL/TLS certificate if https
 */

/**
 * Timing breakdown in milliseconds
 * @typedef {Object} ProbeTimings
 * @property {number} dns_ms - Time to resolve DNS
 * @property {number} tcp_ms - Time to establish TCP socket
 * @property {number} tls_ms - Time to negotiate TLS handshake (0 if http)
 * @property {number} ttfb_ms - Time To First Byte received
 * @property {number} total_ms - Total request-response lifecycle duration
 */

/**
 * Standard Telemetry Beacon Report
 * @typedef {Object} BeaconReport
 * @property {string} beacon_id - Unique report UUIDv4
 * @property {string} timestamp_iso - UTC ISO timestamp of probe
 * @property {number} timestamp_epoch_ms - Epoch milliseconds
 * @property {string} target_url - Target URL probed
 * @property {'HEALTHY'|'DEGRADED'|'DOWN'|'TIMEOUT'} status - Qualitative health classification
 * @property {number|null} http_status - HTTP status code
 * @property {ProbeTimings} timings - Nanosecond/microsecond resolution timings
 * @property {Object|null} ssl - TLS certificate telemetry (or null if HTTP)
 * @property {{ status_ok: boolean, body_match: boolean, sla_met: boolean }} assertions - Check results
 * @property {string|null} error - Error string if failed
 */

/**
 * Executes a high-resolution HTTP or HTTPS probe against an endpoint.
 * 
 * @param {ProbeOptions} options 
 * @returns {Promise<BeaconReport>}
 */
export function probeEndpoint(options) {
  return new Promise((resolve) => {
    if (!options || !options.url) {
      const now = Date.now();
      return resolve({
        beacon_id: randomUUID(),
        timestamp_iso: new Date(now).toISOString(),
        timestamp_epoch_ms: now,
        target_url: options?.url || '',
        status: 'DOWN',
        http_status: null,
        timings: { dns_ms: 0, tcp_ms: 0, tls_ms: 0, ttfb_ms: 0, total_ms: 0 },
        ssl: null,
        assertions: { status_ok: false, body_match: false, sla_met: false },
        error: 'Missing required target URL'
      });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(options.url);
    } catch (err) {
      const now = Date.now();
      return resolve({
        beacon_id: randomUUID(),
        timestamp_iso: new Date(now).toISOString(),
        timestamp_epoch_ms: now,
        target_url: options.url,
        status: 'DOWN',
        http_status: null,
        timings: { dns_ms: 0, tcp_ms: 0, tls_ms: 0, ttfb_ms: 0, total_ms: 0 },
        ssl: null,
        assertions: { status_ok: false, body_match: false, sla_met: false },
        error: `Malformed URL: ${err.message}`
      });
    }

    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    const timeoutMs = options.timeoutMs ?? 5000;
    const slaMaxLatencyMs = options.slaMaxLatencyMs ?? 1000;
    const expectedStatus = Array.isArray(options.expectedStatus)
      ? options.expectedStatus
      : [options.expectedStatus ?? 200];

    const startTime = performance.now();
    let dnsTime = 0;
    let tcpTime = 0;
    let tlsTime = 0;
    let ttfbTime = 0;

    let sslInfo = null;
    let settled = false;

    const reqOptions = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'GhostFactoryOS-TelemetryBeacon/1.0',
        'Accept': '*/*',
        ...(options.headers || {})
      },
      timeout: timeoutMs
    };

    const req = client.request(reqOptions, (res) => {
      ttfbTime = performance.now() - startTime;

      // Extract SSL Certificate info if HTTPS
      if (isHttps && options.inspectSsl !== false && res.socket.getPeerCertificate) {
        try {
          const cert = res.socket.getPeerCertificate(true);
          if (cert && cert.valid_to) {
            const validToEpoch = Date.parse(cert.valid_to);
            const daysRemaining = Math.max(0, Math.floor((validToEpoch - Date.now()) / (1000 * 60 * 60 * 24)));
            sslInfo = {
              valid: daysRemaining > 0,
              days_remaining: daysRemaining,
              issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown',
              subject: cert.subject?.CN || 'Unknown',
              valid_to: new Date(validToEpoch).toISOString()
            };
          }
        } catch {}
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));

      res.on('end', () => {
        if (settled) return;
        settled = true;

        const totalTime = performance.now() - startTime;
        const bodyText = Buffer.concat(chunks).toString('utf8');

        // Check Assertions
        const httpStatus = res.statusCode || 0;
        const statusOk = expectedStatus.includes(httpStatus);

        let bodyMatchOk = true;
        if (options.bodyMatch) {
          if (options.bodyMatch instanceof RegExp) {
            bodyMatchOk = options.bodyMatch.test(bodyText);
          } else {
            bodyMatchOk = bodyText.includes(String(options.bodyMatch));
          }
        }

        const slaMet = totalTime <= slaMaxLatencyMs;

        // Determine Status Tier
        let healthStatus = 'HEALTHY';
        if (!statusOk || !bodyMatchOk) {
          healthStatus = 'DOWN';
        } else if (!slaMet || (sslInfo && sslInfo.days_remaining < 14)) {
          healthStatus = 'DEGRADED';
        }

        const now = Date.now();
        resolve({
          beacon_id: randomUUID(),
          timestamp_iso: new Date(now).toISOString(),
          timestamp_epoch_ms: now,
          target_url: options.url,
          status: healthStatus,
          http_status: httpStatus,
          timings: {
            dns_ms: Number(dnsTime.toFixed(2)),
            tcp_ms: Number(tcpTime.toFixed(2)),
            tls_ms: Number(tlsTime.toFixed(2)),
            ttfb_ms: Number(ttfbTime.toFixed(2)),
            total_ms: Number(totalTime.toFixed(2))
          },
          ssl: sslInfo,
          assertions: {
            status_ok: statusOk,
            body_match: bodyMatchOk,
            sla_met: slaMet
          },
          error: null
        });
      });
    });

    // Capture Socket Timing Milestones
    req.on('socket', (socket) => {
      socket.on('lookup', () => {
        dnsTime = performance.now() - startTime;
      });
      socket.on('connect', () => {
        tcpTime = performance.now() - startTime;
      });
      socket.on('secureConnect', () => {
        tlsTime = performance.now() - startTime;
      });
    });

    req.on('timeout', () => {
      if (settled) return;
      settled = true;
      req.destroy();
      const totalTime = performance.now() - startTime;
      const now = Date.now();

      resolve({
        beacon_id: randomUUID(),
        timestamp_iso: new Date(now).toISOString(),
        timestamp_epoch_ms: now,
        target_url: options.url,
        status: 'TIMEOUT',
        http_status: null,
        timings: {
          dns_ms: Number(dnsTime.toFixed(2)),
          tcp_ms: Number(tcpTime.toFixed(2)),
          tls_ms: Number(tlsTime.toFixed(2)),
          ttfb_ms: 0,
          total_ms: Number(totalTime.toFixed(2))
        },
        ssl: null,
        assertions: { status_ok: false, body_match: false, sla_met: false },
        error: `Request timed out after ${timeoutMs}ms`
      });
    });

    req.on('error', (err) => {
      if (settled) return;
      settled = true;
      const totalTime = performance.now() - startTime;
      const now = Date.now();

      resolve({
        beacon_id: randomUUID(),
        timestamp_iso: new Date(now).toISOString(),
        timestamp_epoch_ms: now,
        target_url: options.url,
        status: 'DOWN',
        http_status: null,
        timings: {
          dns_ms: Number(dnsTime.toFixed(2)),
          tcp_ms: Number(tcpTime.toFixed(2)),
          tls_ms: Number(tlsTime.toFixed(2)),
          ttfb_ms: 0,
          total_ms: Number(totalTime.toFixed(2))
        },
        ssl: null,
        assertions: { status_ok: false, body_match: false, sla_met: false },
        error: err.message
      });
    });

    req.end();
  });
}

/**
 * Creates a scheduled cron/interval beacon loop.
 * 
 * @param {ProbeOptions} options 
 * @param {number} intervalMs - Milliseconds between pings
 * @param {(report: BeaconReport) => void} onReport - Callback invoked with each beacon report
 * @returns {{ stop: () => void }} Controller object with stop handle
 */
export function startBeaconLoop(options, intervalMs, onReport) {
  let active = true;
  let timerId = null;

  async function cycle() {
    if (!active) return;
    try {
      const report = await probeEndpoint(options);
      if (active && typeof onReport === 'function') {
        onReport(report);
      }
    } catch {}

    if (active) {
      timerId = setTimeout(cycle, intervalMs);
    }
  }

  // Kick off first immediate probe
  cycle();

  return {
    stop: () => {
      active = false;
      if (timerId) clearTimeout(timerId);
    }
  };
}
