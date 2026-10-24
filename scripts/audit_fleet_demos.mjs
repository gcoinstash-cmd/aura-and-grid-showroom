#!/usr/bin/env node
/**
 * Aura & Grid — Automated 200-Unit Fleet Demo Link & Dyno Telemetry Audit Engine
 *
 * Directives:
 * 1. Ingests `site/index.html` and catalog state (`src/data/fleet.json` / `window.FLEET_DATA`).
 * 2. Extracts the target demo URL/action and `mountChassisToDyno` binding for all 200 units (#001-#200).
 * 3. Concurrently tests every link:
 *    - Local Paths (`./demos/...`, `./demo.html?...`): Verifies physical file exists in `site/` and `fs.statSync().size > 100`.
 *    - Remote URLs (`http://` or `https://`): Executes an HTTP `fetch` probe (6s timeout + browser User-Agent) for HTTP 200.
 *    - Dyno Mount buttons (`mountChassisToDyno`): Verifies unit ID exists and resolves against catalog state.
 * 4. Writes full audit report to `fleet_demo_audit.json` and outputs summary + Markdown table.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SITE_DIR = path.join(rootDir, 'site');
const SITE_HTML_PATH = path.join(SITE_DIR, 'index.html');
const FLEET_JSON_PATH = path.join(rootDir, 'src', 'data', 'fleet.json');
const MANIFEST_PATH = path.join(rootDir, 'CATALOG_MANIFEST.json');
const AUDIT_OUTPUT_PATH = path.join(rootDir, 'fleet_demo_audit.json');

const TIMEOUT_MS = 6000;
const CONCURRENCY = 20;
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

if (!fs.existsSync(SITE_HTML_PATH)) {
  console.error(`❌ Missing site/index.html at: ${SITE_HTML_PATH}`);
  process.exit(1);
}

const siteHtml = fs.readFileSync(SITE_HTML_PATH, 'utf-8');
const catalogData = fs.existsSync(FLEET_JSON_PATH)
  ? JSON.parse(fs.readFileSync(FLEET_JSON_PATH, 'utf-8'))
  : JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')).products;

// Extract embedded window.FLEET_DATA from site/index.html
let embeddedFleetData = [];
const fleetDataMatch = siteHtml.match(/window\.FLEET_DATA\s*=\s*(\[\{[\s\S]*?\}\]);/);
if (fleetDataMatch) {
  try {
    embeddedFleetData = JSON.parse(fleetDataMatch[1]);
  } catch (err) {
    console.warn(`⚠️ Could not JSON.parse window.FLEET_DATA: ${err.message}`);
  }
}

const catalogById = new Map(catalogData.map(u => [Number(u.id), u]));
const embeddedById = new Map(embeddedFleetData.map(u => [Number(u.id), u]));

/**
 * Extract card HTML block and action bindings for a specific unit ID (1..200)
 */
function extractCardTelemetry(unitId) {
  const cardMarker = `<!-- F1 Spec Card #${unitId} -->`;
  const nextMarker = unitId < 200 ? `<!-- F1 Spec Card #${unitId + 1} -->` : `</div>\n\n    <div id="noResults"`;
  const startIdx = siteHtml.indexOf(cardMarker);
  const catalogUnit = catalogById.get(unitId);
  const embeddedUnit = embeddedById.get(unitId);

  if (startIdx === -1) {
    return {
      id: unitId,
      unitNumber: `#${String(unitId).padStart(3, '0')}`,
      name: catalogUnit?.name || `UNIT #${unitId}`,
      track: catalogUnit?.pricing_track || 'Unknown',
      cardFoundInDom: false,
      demoUrl: '',
      dynoBound: false,
      catalogResolved: Boolean(catalogUnit && embeddedUnit)
    };
  }

  const endIdx = siteHtml.indexOf(nextMarker, startIdx);
  const cardHtml = endIdx !== -1 ? siteHtml.slice(startIdx, endIdx) : siteHtml.slice(startIdx, startIdx + 6500);

  // Extract [ ↗ TEST DRIVE LIVE DEMO ] href
  const demoHrefMatch =
    cardHtml.match(/<a\s+href="([^"]+)"[^>]*>\s*\[\s*↗\s*TEST DRIVE LIVE DEMO\s*\]\s*<\/a>/i) ||
    cardHtml.match(/data-preview="([^"]+)"/i);
  const demoUrl = demoHrefMatch ? demoHrefMatch[1].trim() : '';

  // Extract [ ⚡ MOUNT CHASSIS ON DYNO ] binding
  const dynoMatch = cardHtml.match(/mountChassisToDyno\(['"]?(\d+)['"]?/);
  const dynoBound = Boolean(dynoMatch && Number(dynoMatch[1]) === unitId);

  const trackMatch = cardHtml.match(/data-track="([^"]+)"/);
  const nameMatch = cardHtml.match(/data-name="([^"]+)"/);

  return {
    id: unitId,
    unitNumber: `#${String(unitId).padStart(3, '0')}`,
    name: nameMatch ? nameMatch[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"') : (catalogUnit?.name || `UNIT #${unitId}`),
    track: trackMatch ? trackMatch[1] : (catalogUnit?.pricing_track || 'track1'),
    cardFoundInDom: true,
    demoUrl,
    dynoBound,
    catalogResolved: Boolean(catalogUnit && embeddedUnit)
  };
}

/**
 * Audit a single unit's demo URL and dyno binding
 */
async function auditUnit(unitId) {
  const meta = extractCardTelemetry(unitId);

  if (!meta.cardFoundInDom) {
    return {
      ...meta,
      targetType: 'missing_card',
      operational: false,
      status: 'BROKEN',
      httpStatus: null,
      fileSizeBytes: null,
      detail: 'Card missing from site/index.html DOM'
    };
  }

  if (!meta.dynoBound || !meta.catalogResolved) {
    return {
      ...meta,
      targetType: 'dyno_Check',
      operational: false,
      status: 'BROKEN',
      httpStatus: null,
      fileSizeBytes: null,
      detail: !meta.dynoBound
        ? 'Missing mountChassisToDyno binding on card'
        : 'Unit ID failed to resolve in window.FLEET_DATA / catalog'
    };
  }

  const url = meta.demoUrl;
  if (!url || url === '#' || url.startsWith('#')) {
    return {
      ...meta,
      targetType: 'unassigned_or_hash',
      operational: false,
      status: 'BROKEN',
      httpStatus: null,
      fileSizeBytes: null,
      detail: `Invalid or placeholder demo target (${url || 'empty'})`
    };
  }

  // Case A: Local Path (./demos/..., ./demo.html?..., /demos/...)
  if (url.startsWith('./') || url.startsWith('/') || !/^https?:\/\//i.test(url)) {
    const cleanRel = url.split('?')[0].split('#')[0].replace(/^\.\//, '').replace(/^\//, '');
    let targetFile = path.join(SITE_DIR, cleanRel);
    if (fs.existsSync(targetFile) && fs.statSync(targetFile).isDirectory()) {
      targetFile = path.join(targetFile, 'index.html');
    } else if (url.endsWith('/')) {
      targetFile = path.join(SITE_DIR, cleanRel, 'index.html');
    }

    if (!fs.existsSync(targetFile)) {
      return {
        ...meta,
        targetType: 'local_file',
        operational: false,
        status: 'BROKEN',
        httpStatus: null,
        fileSizeBytes: 0,
        detail: `Missing local file in site/: ${path.relative(rootDir, targetFile)}`
      };
    }

    const stat = fs.statSync(targetFile);
    const isValidSize = stat.size > 100;
    return {
      ...meta,
      targetType: 'local_file',
      operational: isValidSize,
      status: isValidSize ? 'OPERATIONAL' : 'BROKEN',
      httpStatus: null,
      fileSizeBytes: stat.size,
      detail: isValidSize
        ? `Valid local file (${stat.size} bytes)`
        : `Zero-byte or stub file (${stat.size} bytes <= 100)`
    };
  }

  // Case B: Remote URL (http:// or https://)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startMs = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': BROWSER_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    const latencyMs = Date.now() - startMs;
    const isOk = response.status === 200;
    return {
      ...meta,
      targetType: 'remote_http',
      operational: isOk,
      status: isOk ? 'OPERATIONAL' : 'BROKEN',
      httpStatus: response.status,
      latencyMs,
      fileSizeBytes: null,
      detail: `HTTP ${response.status} (${latencyMs}ms)`
    };
  } catch (err) {
    const latencyMs = Date.now() - startMs;
    const reason = err.name === 'AbortError' ? `Timeout (> ${TIMEOUT_MS}ms)` : (err.cause?.code || err.message);
    return {
      ...meta,
      targetType: 'remote_http',
      operational: false,
      status: 'BROKEN',
      httpStatus: null,
      latencyMs,
      fileSizeBytes: null,
      detail: reason
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log('⚡ [Aura & Grid] Launching 200-Unit Automated Fleet Demo Link & Dyno Telemetry Audit...');
  const unitIds = Array.from({ length: 200 }, (_, i) => i + 1);
  const results = new Array(unitIds.length);
  let cursor = 0;

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < unitIds.length) {
        const idx = cursor++;
        results[idx] = await auditUnit(unitIds[idx]);
      }
    })
  );

  const operationalUnits = results.filter(r => r.operational);
  const brokenUnits = results.filter(r => !r.operational);
  const dynoVerifiedUnits = results.filter(r => r.dynoBound && r.catalogResolved);

  const reportPayload = {
    audited_at: new Date().toISOString(),
    source_file: 'site/index.html',
    timeout_ms: TIMEOUT_MS,
    summary: {
      total_units_audited: results.length,
      verified_operational: operationalUnits.length,
      flagged_broken: brokenUnits.length,
      dyno_mount_verified: dynoVerifiedUnits.length
    },
    flagged_broken_units: brokenUnits,
    units: results
  };

  fs.writeFileSync(AUDIT_OUTPUT_PATH, JSON.stringify(reportPayload, null, 2) + '\n', 'utf-8');

  console.log('\n============================================================');
  console.log('📊 FLEET DEMO TELEMETRY AUDIT SUMMARY');
  console.log('============================================================');
  console.log(`Total Units Audited: ${results.length}`);
  console.log(`Verified Operational (HTTP 200 / Valid File): ${operationalUnits.length}`);
  console.log(`Flagged Broken (404, Timeout, or Zero-Byte Stub): ${brokenUnits.length}`);
  console.log(`Dyno Mount Resolved (mountChassisToDyno): ${dynoVerifiedUnits.length}/${results.length}`);
  console.log(`Audit Report Written: ${AUDIT_OUTPUT_PATH}`);
  console.log('============================================================\n');

  console.log('### Flagged / Broken Units Ledger\n');
  console.log('| Unit # | Title | Track | Target Demo URL | Diagnostic Status |');
  console.log('| :--- | :--- | :--- | :--- | :--- |');
  if (brokenUnits.length === 0) {
    console.log('| NONE (0/200) | All 200 Fleet Units Verified Operational | Tracks 1, 2, 3 | 200/200 Valid Targets | HTTP 200 & Dyno Coupled |');
  } else {
    for (const b of brokenUnits) {
      console.log(`| ${b.unitNumber} | ${b.name} | ${b.track} | ${b.demoUrl || 'N/A'} | ${b.detail} |`);
    }
  }
  console.log('\nFLEET TELEMETRY AUDIT COMPLETE');

  const isStrict = process.argv.includes('--strict');
  if (isStrict && brokenUnits.length > 0) {
    console.error(`❌ [STRICT PRE-DEPLOY GATE FAILED] ${brokenUnits.length} unit(s) failed HTTP 200 / zero-byte stub verification. Halting deployment.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Audit execution error:', err);
  process.exit(1);
});
