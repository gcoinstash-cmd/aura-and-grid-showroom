#!/usr/bin/env node
/**
 * Aura & Grid — Fleet Demo Link Audit
 * Pings every unit's demoUrl / liveUrl (same candidate logic as build_public_showroom.mjs)
 * with a 3000ms timeout and classifies it:
 *   VALID_LIVE            HTTP 200
 *   BROKEN_OR_PLACEHOLDER 404, dead domain, '#', timeout, or any non-200
 *   UNASSIGNED            null / empty / undefined
 * Writes src/data/demo_link_audit.json (id -> status). The showroom builder only renders
 * [ ↗ TEST DRIVE LIVE DEMO ] for VALID_LIVE units; everything else gets the simulator button.
 * Note: a slow cold-start host (>3s) is classified BROKEN_OR_PLACEHOLDER by design.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FLEET_PATH = path.join(rootDir, 'src', 'data', 'fleet.json');
const MANIFEST_PATH = path.join(rootDir, 'CATALOG_MANIFEST.json');
const OUT_PATH = path.join(rootDir, 'src', 'data', 'demo_link_audit.json');
const TIMEOUT_MS = 3000;
const CONCURRENCY = 20;

const fleet = fs.existsSync(FLEET_PATH)
  ? JSON.parse(fs.readFileSync(FLEET_PATH, 'utf-8'))
  : JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')).products;

function candidateUrl(p) {
  const raw = p.demoUrl || p.liveUrl ||
    (p.preview_url && p.preview_url.startsWith('http') && !p.preview_url.includes('gumroad.com') ? p.preview_url : '');
  return typeof raw === 'string' ? raw.trim() : '';
}

async function classify(p) {
  const url = candidateUrl(p);
  if (!url) return { id: p.id, name: p.name, url: '', status: 'UNASSIGNED', detail: 'no url' };
  if (url === '#' || !/^https?:\/\//i.test(url)) {
    return { id: p.id, name: p.name, url, status: 'BROKEN_OR_PLACEHOLDER', detail: 'placeholder' };
  }
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctl.signal });
    const ok = res.status === 200;
    return { id: p.id, name: p.name, url, status: ok ? 'VALID_LIVE' : 'BROKEN_OR_PLACEHOLDER', detail: `HTTP ${res.status}` };
  } catch (e) {
    return { id: p.id, name: p.name, url, status: 'BROKEN_OR_PLACEHOLDER', detail: e.name === 'AbortError' ? 'timeout' : (e.cause?.code || e.message) };
  } finally {
    clearTimeout(timer);
  }
}

const results = new Array(fleet.length);
let next = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (next < fleet.length) {
    const i = next++;
    results[i] = await classify(fleet[i]);
  }
}));

const count = s => results.filter(r => r.status === s).length;
const summary = {
  total: results.length,
  VALID_LIVE: count('VALID_LIVE'),
  BROKEN_OR_PLACEHOLDER: count('BROKEN_OR_PLACEHOLDER'),
  UNASSIGNED: count('UNASSIGNED')
};
fs.writeFileSync(OUT_PATH, JSON.stringify({ audited_at: new Date().toISOString(), timeout_ms: TIMEOUT_MS, summary, units: results }, null, 2) + '\n');

console.log('| Classification | Units |\n|---|---|');
console.log(`| VALID_LIVE (HTTP 200) | ${summary.VALID_LIVE} |`);
console.log(`| BROKEN_OR_PLACEHOLDER | ${summary.BROKEN_OR_PLACEHOLDER} |`);
console.log(`| UNASSIGNED (headless) | ${summary.UNASSIGNED} |`);
console.log(`| TOTAL | ${summary.total} |`);
results.filter(r => r.status === 'BROKEN_OR_PLACEHOLDER').slice(0, 15)
  .forEach(r => console.log(`  broken #${r.id} ${r.url} -> ${r.detail}`));
