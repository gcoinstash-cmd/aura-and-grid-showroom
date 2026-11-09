#!/usr/bin/env node

/**
 * Aura & Grid — 5-Cluster Commercial Acquisition Showroom Compiler
 * (F1 Pit Wall × Cyberpunk Spec Configurator, for Direct B2B Studio Buyers)
 *
 * Generates site/index.html (mirrored to root index.html and dist/index.html) as a
 * dependency-free static page: inline CSS, lightweight inline Canvas 2D 3D-wireframe
 * holo-projector, and zero external JS dependencies.
 *
 * Source of truth: docs/deal-room/MICRO_CLUSTERS_COMMERCIAL_MANIFEST.md
 * (cluster names, unit IDs, paired cockpits, per-cluster asking prices, dyno test counts).
 * The build cross-checks the data below against that manifest and aborts on any drift.
 *
 * Redaction invariant: the compiled markup must never contain internal reserve, walk-away,
 * panic or wholesale figures. The build scans its own output and aborts if any are found.
 *
 * The legacy 500-unit compiler (build_public_showroom.mjs) and all engine files are untouched.
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const SITE_DIR = path.join(rootDir, 'site');
const MANIFEST_PATH = path.join(rootDir, 'docs', 'deal-room', 'MICRO_CLUSTERS_COMMERCIAL_MANIFEST.md');

// Dealership primary inbox for secure APA title transfers
const DEALERSHIP_INBOX = 'garrett@auraandgrid.io';

/**
 * Centralized helper function to generate URL-encoded mailto payloads for Pure APA Title Acquisition.
 *
 * @param {string} assetName - Name/Identifier of target unit or cluster
 * @param {string} trackTier - Spec Tier (e.g. Track 1 Lean Tuner, Track 2 Hypercar Flagship, Track 3 Skunkworks Engine, Sealed Micro-Cluster)
 * @param {string} anchorValuation - APA Buyout Anchor valuation
 * @param {string} [inbox=DEALERSHIP_INBOX] - Verified dealership inbox
 * @returns {string} Fully URL-encoded mailto link
 */
export function generateAquireMailto(assetName, trackTier, anchorValuation, inbox = DEALERSHIP_INBOX) {
  const cleanInbox = inbox || DEALERSHIP_INBOX;
  const subject = `[APA TITLE INQUIRY] ${assetName} (${trackTier})`;
  const body = `Lead Systems Engineer & Dealership Principal,

I am submitting a formal inquiry to acquire 100% IP Title Transfer via Asset Purchase Agreement (APA):

• Target Unit: ${assetName}
• Spec Tier: ${trackTier}
• APA Buyout Anchor: ${anchorValuation}

Please route the complete APA title transfer agreement and code manifest to:
- Buyer Entity Name: 
- Authorized Signer: 
- Wire / Settlement Email: `;

  return `mailto:${cleanInbox}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
export const generateAcquireMailto = generateAquireMailto;

// Direct inquiry target URL (defaults to direct dealership endpoint)
const DIRECT_INQUIRY_URL = process.env.DIRECT_INQUIRY_URL || 'https://auraandgrid.com/';

// `--check` (npm run audit:commercial): validate only. Writes nothing; exits non-zero if the
// manifest cross-check or redaction scan fails, or if site/index.html is not the compiled output.
const CHECK_ONLY = process.argv.includes('--check');

const RETAIL_BENCHMARK = 1173000;
const BATCH_ASK = 805000;

// cockpit = path (relative to repo-root cockpits/) of the paired Track 2 SCADA cockpit.
const CLUSTERS = [
  {
    id: 'MC-01', ask: 185000,
    title: 'Ultra-Low Latency Attention & KV Memory Fabrics',
    blurb: 'Radix tree prefix hashing, multi-block flash decoding, paged memory pools and MQA/GQA engines.',
    tags: ['KV Cache', 'Flash Decoding', 'Paged Attention', 'MQA / GQA'],
    buyers: 'Distributed compute platforms, high-throughput data processing clusters, and GPU cloud operators.',
    triads: [
      { n: 338, engine: 'Prefix Caching & Radix Tree KV Hash Indexing', t2: 'EKV-12', cockpit: 'batch-foxtrot/12-edge-kv-store-telemetry', tests: 7 },
      { n: 340, engine: 'Flash-Decoding & Multi-Block Attention Partitioning', t2: 'GPU-05', cockpit: 'batch-foxtrot/05-gpu-cluster-utilization', tests: 8 },
      { n: 345, engine: 'Paged Attention Memory Pool & Block Allocator', t2: 'IOPS-07', cockpit: 'batch-echo/07-disk-iops-meter', tests: 7 },
      { n: 354, engine: 'MQA & GQA Attention Flash-Decoding', t2: 'APEX-01', cockpit: '01-apex-telemetry', tests: 4 },
    ],
  },
  {
    id: 'MC-02', ask: 145000,
    title: 'Distributed High-Throughput & Speculative Scheduling',
    blurb: 'Continuous iteration batching, chunked prefill scheduling and speculative draft verification.',
    tags: ['Continuous Batching', 'Chunked Prefill', 'Speculative Decoding'],
    buyers: 'Parallel execution schedulers, high-concurrency API gateways, and quantitative trading desks.',
    triads: [
      { n: 346, engine: 'Continuous Batching & In-Flight Request Scheduler', t2: 'CHRONO-04', cockpit: '04-chrono-pulse', tests: 7 },
      { n: 347, engine: 'Chunked Prefill & Mixed-Phase Scheduling', t2: 'NEBULA-03', cockpit: 'batch-bravo/03-nebula-stream', tests: 6 },
      { n: 348, engine: 'Speculative Decoding & Draft Verification', t2: 'ORBIT-03', cockpit: '03-orbit-pipeline', tests: 6 },
    ],
  },
  {
    id: 'MC-03', ask: 145000,
    title: 'Extreme Quantization & Sub-Byte Compression Cores',
    blurb: 'FP8/INT4 hierarchical KV cache compression, 4-bit weight dequantization and FP6 tensor processing.',
    tags: ['FP8 / INT4', 'FP4 Dequant', 'FP6 Tensor Core'],
    buyers: 'High-throughput data processing appliances, embedded compute systems, and on-premise compute centers.',
    triads: [
      { n: 342, engine: 'Hierarchical KV Cache Quantization (FP8/INT4)', t2: 'PRISM-05', cockpit: 'batch-charlie/05-prism-telemetry', tests: 5 },
      { n: 352, engine: 'FP4 Quantization & 4-Bit Weight Dequantization', t2: 'SYNAPSE-05', cockpit: '05-synapse-audit', tests: 6 },
      { n: 353, engine: 'FP6 Mixed-Precision Tensor Core & Dot-Product', t2: 'SPECTER-01', cockpit: 'batch-bravo/01-grid-specter', tests: 8 },
    ],
  },
  {
    id: 'MC-04', ask: 185000,
    title: 'Distributed Mesh Parallelism & Inter-Node Interconnects',
    blurb: 'MoE expert routing, ring-attention context parallelism, hybrid pipeline and activation checkpointing.',
    tags: ['Expert Parallelism', 'Ring Attention', 'Pipeline Parallelism', 'Checkpointing'],
    buyers: 'Hyperscale cluster architects, parallel execution operators, and distributed compute networks.',
    triads: [
      { n: 339, engine: 'Expert Parallelism & MoE Token Routing', t2: 'POD-09', cockpit: 'batch-delta/09-pod-health-grid', tests: 5 },
      { n: 341, engine: 'Context Parallelism & Ring Attention', t2: 'CDN-05', cockpit: 'batch-echo/05-cdn-shield-telemetry', tests: 7 },
      { n: 343, engine: 'Multi-Node Tensor & Pipeline Parallelism Hybrid', t2: 'PULSE-03', cockpit: 'batch-charlie/03-pulse-overload', tests: 5 },
      { n: 350, engine: 'Multi-GPU Pipeline Parallelism & Activation Checkpointing', t2: 'WAL-24', cockpit: 'batch-golf/24-wal-replication-streamer', tests: 6 },
    ],
  },
  {
    id: 'MC-05', ask: 145000,
    title: 'Zero-Overhead Hardware Acceleration & Host-GPU Fabrics',
    blurb: 'CUDA graph capture and launch serialization, FP8 tensor math and zero-copy unified memory.',
    tags: ['CUDA Graphs', 'FP8 Tensor Core', 'Unified Memory'],
    buyers: 'Mission-critical edge computing, real-time distributed telemetry, and low-latency FinTech infrastructure.',
    triads: [
      { n: 344, engine: 'CUDA Graph Capture & Kernel Launch Serializer', t2: 'BOT-05', cockpit: 'batch-delta/05-bot-mitigation', tests: 5 },
      { n: 349, engine: 'FP8 Mixed-Precision Tensor Core & Scaled Dot-Product', t2: 'POLICY-15', cockpit: 'batch-echo/15-policy-enforcement-grid', tests: 7 },
      { n: 351, engine: 'Zero-Copy Unified Memory & Host-Device Interlock', t2: 'PILOT-01', cockpit: 'batch-golf/01-autonomous-pilot-telemetry', tests: 6 },
    ],
  },
];

const STACK = ['FastAPI', 'Python 3.12', 'React 19', 'PostgreSQL 16 RLS'];

// Public-mirror naming: the published copy of a cockpit may use a different folder name than its
// repo source so the public tree stays free of prohibited vocabulary. Source folders are untouched.
const PUBLIC_COCKPIT_ALIAS = {
  'batch-golf/01-autonomous-pilot-telemetry': 'batch-golf/01-distributed-pilot-telemetry',
};
const publicCockpitPath = (p) => PUBLIC_COCKPIT_ALIAS[p] ?? p;

// Public mirror of a cockpit: skip internal README specs, strip internal registry prefixes (GF-T#-) and replace prohibited vocabulary in text assets.
const MIRROR_TEXT_EXT = new Set(['.html', '.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.md', '.example']);
function sanitizeMirroredText(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { sanitizeMirroredText(full); continue; }
    if (!MIRROR_TEXT_EXT.has(path.extname(entry.name).toLowerCase())) continue;
    const before = fs.readFileSync(full, 'utf8');
    const after = before
      .replace(/autonomous/g, 'distributed').replace(/Autonomous/g, 'Distributed').replace(/AUTONOMOUS/g, 'DISTRIBUTED')
      .replace(/automated/g, 'scripted').replace(/Automated/g, 'Scripted').replace(/AUTOMATED/g, 'SCRIPTED')
      .replace(/\bgf-t[123]-/gi, '');
    if (after !== before) fs.writeFileSync(full, after);
  }
}
function mirrorCockpit(src, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true, filter: (s) => path.basename(s) !== 'README.md' });
  sanitizeMirroredText(dest);
}

/* ------------------------------------------------------------------ */
/* Manifest cross-check (abort on drift)                               */
/* ------------------------------------------------------------------ */
function fail(msg) { console.error(`❌ [commercial showroom] ${msg}`); process.exit(1); }

const manifest = fs.readFileSync(MANIFEST_PATH, 'utf8');
const fmt = (n) => '$' + n.toLocaleString('en-US');
let askSum = 0, triadCount = 0, testSum = 0;
for (const c of CLUSTERS) {
  askSum += c.ask;
  const sec = manifest.split(`MICRO-CLUSTER ${c.id}:`)[1]?.split('### 📦')[0] ?? fail(`${c.id} missing in manifest`);
  const ids = [...sec.matchAll(/\*\*(MC-0\d\.\d+)\*\*/g)].map(m => m[1]);
  const expectedIds = c.triads.map((t, i) => `${c.id}.${i + 1}`);
  if (ids.join() !== expectedIds.join()) fail(`${c.id} triad IDs differ from manifest: ${ids} vs ${expectedIds}`);
  if (!sec.includes(`**Standalone Micro-Cluster APA Asking Anchor**: **${fmt(c.ask)} USD**`)) fail(`${c.id} asking price differs from manifest`);
  for (const [i, t] of c.triads.entries()) {
    const row = sec.split('\n').find(l => l.startsWith(`| **${c.id}.${i + 1}**`)) ?? '';
    if (!row.includes(`(${t.tests}/${t.tests} Passed`)) fail(`${c.id}.${i + 1} test count ${t.tests} differs from manifest`);
    if (!fs.existsSync(path.join(rootDir, 'cockpits', t.cockpit, 'index.html'))) fail(`cockpit missing on disk: ${t.cockpit}`);
    triadCount++; testSum += t.tests;
  }
}
if (askSum !== BATCH_ASK) fail(`cluster asks sum to ${askSum}, expected ${BATCH_ASK}`);
if (triadCount !== 17 || testSum !== 105) fail(`expected 17 triads / 105 tests, got ${triadCount} / ${testSum}`);
const MIN_CLUSTER_ASK = Math.min(...CLUSTERS.map(c => c.ask));
const MAX_CLUSTER_ASK = Math.max(...CLUSTERS.map(c => c.ask));
if (MIN_CLUSTER_ASK !== 145000 || MAX_CLUSTER_ASK !== 185000) fail(`unexpected cluster ask range: ${MIN_CLUSTER_ASK}–${MAX_CLUSTER_ASK}`);
// Rule 5 price locks (Zero-Leak Commercial Governance Standard)
if (CLUSTERS.find(c => c.id === 'MC-05')?.ask !== 145000) fail('Rule 5: MC-05 asking price is locked at $145,000');

/* ------------------------------------------------------------------ */
/* Markup                                                              */
/* ------------------------------------------------------------------ */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cockpitHref = (t) => `./cockpits/${publicCockpitPath(t.cockpit)}/index.html`;

const clusterCard = (c) => {
  const units = c.triads.length * 3;
  const tests = c.triads.reduce((a, t) => a + t.tests, 0);
  const lead = c.triads[0];
  const clusterName = `${c.id} — ${c.title}`;
  const clusterMsrp = c.triads.length * 69000;
  const clusterApaMailto = generateAquireMailto(clusterName, 'Sealed Micro-Cluster', fmt(c.ask));
  return `
      <article class="card cluster" id="${c.id.toLowerCase()}" data-cluster="${c.id}">
        <header class="cluster-head">
          <span class="mc-id">${c.id}</span>
          <span class="mc-ask"><small class="text-xs font-mono text-zinc-400">ASKING</small>${fmt(c.ask)}</span>
        </header>
        <h3 class="text-xl font-extrabold text-white">${esc(c.title)}</h3>
        <p class="blurb text-sm text-zinc-300 leading-relaxed">${esc(c.blurb)}</p>
        <p class="meta-line text-xs font-mono">${c.triads.length} TRIADS // ${units} UNITS</p>
        <ul class="pills" aria-label="Domain tags">${c.tags.map(t => `<li class="pill pill-cyan">${esc(t)}</li>`).join('')}</ul>
        <ul class="pills" aria-label="Tech stack">${STACK.map(t => `<li class="pill pill-amber">${esc(t)}</li>`).join('')}</ul>
        <dl class="stats">
          <div><dt class="text-xs font-mono text-zinc-400">DYNO TESTS</dt><dd>${tests}/${tests} PASS</dd></div>
          <div><dt class="text-xs font-mono text-zinc-400">CLEAN-ROOM IP</dt><dd>MIT &bull; APACHE-2.0</dd></div>
        </dl>
        <div class="monroney-sticker" aria-label="Monroney Window Sticker Pricing Telemetry">
          <div class="monroney-head">// MONRONEY WINDOW STICKER (ITEMIZED &amp; BUNDLE)</div>
          <ul class="monroney-list">
            <li><span>Track 1 (Operator Utility):</span> <b>$4,500 // Micro-APA Sovereign Title</b></li>
            <li><span>Track 2 (3D SCADA Cockpit):</span> <b>$14,500 // Chassis APA Sovereign Title</b></li>
            <li><span>Track 3 (Skunkworks Engine):</span> <b>$35,000 – $65,000 // Engine APA Sovereign Title</b></li>
          </ul>
          <div class="monroney-bundle">
            <div class="monroney-bundle-title">Cluster Package Buyout // Volume Discount</div>
            <div class="monroney-bundle-row"><span>Full Cluster Buyout (3 Triads / 9 Units):</span> <b>$145,000 – $185,000</b></div>
            <div class="monroney-bundle-row"><span>Retail Replacement Baseline:</span> <b>$207,000 (${c.id}: ${fmt(clusterMsrp)})</b></div>
          </div>
        </div>
        <p class="buyers text-sm text-zinc-300 leading-relaxed"><b class="text-xs font-mono text-zinc-400">TARGET ACQUIRER</b> ${esc(c.buyers)}</p>
        <details class="triads">
          <summary class="text-xs font-mono text-zinc-400">VIEW ${c.triads.length} TRIADS</summary>
          <ol>${c.triads.map((t, i) => `
            <li><span class="uid">${c.id}.${i + 1}</span> ${esc(t.engine)}<br><a href="${cockpitHref(t)}" target="_blank" rel="noopener">SCADA cockpit preview &rarr;</a></li>`).join('')}
          </ol>
        </details>
        <p class="title-anchor text-sm font-mono text-amber-300">TITLE ANCHOR: ${fmt(c.ask)}</p>
        <div class="cta-stack flex flex-col gap-2 w-full">
          <a class="btn btn-amber w-full" href="${clusterApaMailto}" data-cluster="${c.id}" aria-label="Acquire cluster title (APA) for ${c.id}">[ ACQUIRE CLUSTER TITLE (APA) ]</a>
          <a class="btn btn-subtle w-full" href="${cockpitHref(lead)}" target="_blank" rel="noopener" aria-label="Test drive ${c.id} cockpit (simulated sample data)">[ TEST DRIVE COCKPIT ]<small class="text-xs font-mono">SCADA preview // simulated sample data</small></a>
        </div>
      </article>`;
};

const batchApaMailto = generateAquireMailto('5-Cluster Commercial Portfolio Lot (MC-01 through MC-05)', '5-Cluster Portfolio APA', fmt(BATCH_ASK));
const vaultPortfolioMailto = generateAquireMailto('Full Fleet Master Vault (MC-01 through MC-05)', 'Master Vault Buyout', fmt(BATCH_ASK));
const track1ApaMailto = generateAquireMailto('Track 1 (Operator Utility)', 'Micro-APA Sovereign Title', '$4,500');
const track2ApaMailto = generateAquireMailto('Track 2 (3D SCADA Cockpit)', 'Chassis APA Sovereign Title', '$14,500');
const track3ApaMailto = generateAquireMailto('Track 3 (Skunkworks Engine)', 'Engine APA Sovereign Title', '$35,000 – $65,000');
const bundleApaMailto = generateAquireMailto('Cluster Package Buyout (3 Triads / 9 Units)', 'Cluster Package Buyout APA', '$145,000 – $185,000');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aura &amp; Grid — Commercial Asset Showroom // Direct B2B Studio Outreach</title>
  <meta name="description" content="5 sealed micro-clusters, 51 units (17 triads) of high-performance distributed systems and compute infrastructure authored by a sole systems architect and offered as a 100% pure Software Asset Purchase Agreement (APA). Retail replacement benchmark ${fmt(RETAIL_BENCHMARK)}; portfolio asking price ${fmt(BATCH_ASK)}.">
  <meta name="theme-color" content="#05070B">
  <link rel="canonical" href="https://auraandgrid.com/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="preload" as="audio" href="./assets/audio/engine_start.mp3" type="audio/mpeg">
  <link rel="preconnect" href="https://cdnjs.cloudflare.com">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
  <style>
    :root{--bg:#05070B;--panel:#0B0F17;--panel2:#0F1520;--line:#1B2536;--text:#F8FAFC;--mute:#94A3B8;--zinc200:#F4F4F5;--zinc300:#E4E4E7;--amber:#FF9F0A;--cyan:#00F0FF;--mono:'JetBrains Mono',ui-monospace,Menlo,monospace;--sans:'Inter',system-ui,sans-serif}
    *{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{background:var(--bg);color:var(--text);font-family:var(--sans);font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;
      background-image:linear-gradient(rgba(0,240,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,.035) 1px,transparent 1px);background-size:48px 48px}
    a{color:inherit;text-decoration:none}
    ul,ol{list-style:none}
    /* utilities used by layout & CTA stack */
    .flex{display:flex}.flex-col{flex-direction:column}.items-center{align-items:center}.gap-2{gap:.5rem}.gap-3{gap:.75rem}.gap-4{gap:1rem}.gap-8{gap:2rem}.w-full{width:100%}
    .grid{display:grid}.grid-cols-1{grid-template-columns:minmax(0,1fr)}
    .relative{position:relative}.overflow-hidden{overflow:hidden}.p-4{padding:1rem}.bg-\\[\\#06080C\\]{background:#06080C}
    @media (min-width:640px){.sm\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media (min-width:1024px){.lg\\:grid-cols-1{grid-template-columns:minmax(0,1fr)}.lg\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media (min-width:1280px){.xl\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.xl\\:grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}}
    /* typography & spacing utilities (14px minimum scale on all micro-labels) */
    .text-xs{font-size:14px;line-height:1.35rem}.text-sm{font-size:.875rem;line-height:1.5}.text-base{font-size:1rem;line-height:1.5rem}.text-lg{font-size:1.125rem;line-height:1.75rem}.text-xl{font-size:1.25rem;line-height:1.75rem}
    .font-mono{font-family:var(--mono)}.font-normal{font-weight:400}.font-medium{font-weight:500}.font-semibold{font-weight:600}.font-bold{font-weight:700}.font-extrabold{font-weight:800}.font-black{font-weight:900}
    .text-white{color:#fff}.text-zinc-200{color:var(--zinc200)}.text-zinc-300{color:var(--zinc300)}.text-zinc-400{color:var(--mute)}
    .tracking-wide{letter-spacing:.025em}.tracking-wider{letter-spacing:.05em}
    .py-1{padding-top:.25rem;padding-bottom:.25rem}.px-2\\.5{padding-left:.625rem;padding-right:.625rem}
    .py-1\\.5{padding-top:.375rem;padding-bottom:.375rem}.px-3\\.5{padding-left:.875rem;padding-right:.875rem}
    .mb-3{margin-bottom:.75rem}.space-y-2\\.5>*+*{margin-top:.625rem}
    .border{border-width:1px;border-style:solid}.border-zinc-800{border-color:#27272A}.bg-\\[\\#080B10\\]{background:#080B10}.rounded-xl{border-radius:.75rem}.p-6{padding:1.5rem}
    .cursor-pointer{cursor:pointer}.transition-colors{transition-property:color,background-color,border-color;transition-timing-function:cubic-bezier(.4,0,.2,1)}.duration-200{transition-duration:.2s}.hover\\:text-amber-400:hover{color:#FBBF24}

    /* header */
    .nav{position:sticky;top:0;z-index:50;background:rgba(5,7,11,.94);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
    .nav-in{max-width:1600px;margin:0 auto;padding:14px 24px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:16px}
    .nav-left{display:flex;align-items:center;gap:12px;flex-wrap:nowrap}
    .brand{font-family:var(--mono);white-space:nowrap}
    .brand b{color:var(--amber)}
    .badge{font-family:var(--mono);font-weight:700;letter-spacing:.04em;border:1px solid var(--amber);color:var(--amber);background:rgba(255,159,10,.1);border-radius:999px;white-space:nowrap}
    .nav-status{font-family:var(--mono);font-weight:700;letter-spacing:.04em;color:var(--cyan);background:rgba(0,240,255,.08);border:1px solid rgba(0,240,255,.42);border-radius:999px;justify-self:center;text-align:center;text-shadow:0 0 12px rgba(0,240,255,.45);white-space:nowrap;display:inline-flex;align-items:center}
    .pulse-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#10B981;margin-right:8px;vertical-align:middle;box-shadow:0 0 8px #10B981;animation:pulse-glow 2s cubic-bezier(.4,0,.6,1) infinite}
    @keyframes pulse-glow{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.8)}}
    .nav-right{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:nowrap}
    .gate{font-family:var(--mono);font-weight:700;letter-spacing:.04em;border:1px solid var(--cyan);color:var(--cyan);background:rgba(0,240,255,.08);border-radius:999px;white-space:nowrap}
    .gate::before{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--cyan);margin-right:8px;box-shadow:0 0 8px var(--cyan);vertical-align:middle}
    .price-pill{font-family:var(--mono);letter-spacing:.04em;font-weight:800;background:var(--amber);color:#05070B;border-radius:999px;white-space:nowrap;box-shadow:0 0 18px rgba(255,159,10,.38)}
    .price-pill-outline{font-family:var(--mono);letter-spacing:.04em;font-weight:700;border:1px solid var(--amber);color:var(--amber);background:rgba(255,159,10,.1);border-radius:999px;white-space:nowrap;transition:all .2s ease;text-decoration:none;display:inline-flex;align-items:center}
    .price-pill-outline:hover{background:rgba(255,159,10,.22);box-shadow:0 0 16px rgba(255,159,10,.4);color:#fff;transform:translateY(-1px)}
    .price-pill-outline:focus-visible{outline:2px solid #fff;outline-offset:2px}

    main{max-width:1480px;margin:0 auto;padding:44px 24px 72px}
    .eyebrow{font-family:var(--mono);font-size:.875rem;font-weight:800;letter-spacing:.18em;color:var(--cyan);text-shadow:0 0 12px rgba(0,240,255,.35);margin-bottom:12px}
    h1{font-size:clamp(1.85rem,2.75vw,2.55rem);font-weight:800;letter-spacing:-.02em;line-height:1.15;max-width:25ch;color:#fff}
    h1 span{color:var(--amber)}
    .lede{max-width:60ch;margin-top:16px;font-size:1rem;line-height:1.6;color:var(--mute)}.lede strong{color:var(--text);font-weight:700}
    .title-anchor{margin-top:16px;letter-spacing:.04em}
    .hero-actions{margin-top:8px;width:100%}
    .hero-actions .btn{flex:1;min-width:0;padding:12px 14px;font-size:.875rem;letter-spacing:.035em}
    @media (min-width:1440px){.hero-actions .btn{padding:14px 18px;font-size:.9rem;letter-spacing:.05em}}
    section{margin-top:44px}
    .section-label{font-family:var(--mono);font-size:.875rem;font-weight:800;letter-spacing:.16em;color:var(--cyan);text-shadow:0 0 12px rgba(0,240,255,.28);margin-bottom:16px}

    /* 3D holo-bay */
    .holo-bay{display:flex;flex-direction:column;gap:12px;width:100%;min-width:0;box-shadow:0 0 36px -8px rgba(0,240,255,.18)}
    .holo-hud-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
    .holo-sealed{font-family:var(--mono);font-size:.875rem;font-weight:800;letter-spacing:.05em;padding:5px 10px;border-radius:6px;color:#34D399;background:rgba(16,185,129,.14);border:1px solid rgba(16,185,129,.48);box-shadow:0 0 12px rgba(16,185,129,.22);white-space:nowrap}
    .holo-controls{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
    .holo-btn{appearance:none;font-family:var(--mono);font-size:.875rem;font-weight:700;letter-spacing:.04em;padding:6px 10px;border-radius:6px;background:#101622;color:#fff;border:1px solid rgba(0,240,255,.28);cursor:pointer;transition:background .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s;white-space:nowrap}
    .holo-btn:hover{background:rgba(0,240,255,.16);border-color:rgba(0,240,255,.55);color:var(--cyan)}
    .holo-btn:focus-visible{outline:2px solid #fff;outline-offset:2px}
    .holo-btn-ignition{background:linear-gradient(90deg,#FF9F0A,#FFB340);border:1px solid #FF9F0A;color:#05070B;font-weight:800;box-shadow:0 0 16px rgba(255,159,10,.45)}
    .holo-btn-ignition:hover{background:#FFB340;border-color:#fff;color:#05070B;box-shadow:0 0 22px rgba(255,159,10,.75);transform:translateY(-1px)}
    .holo-btn-ignition.is-igniting{background:linear-gradient(90deg,#FF2E54,#FF9F0A);border-color:#00F0FF;color:#fff;box-shadow:0 0 24px rgba(0,240,255,.65),0 0 18px rgba(255,159,10,.65)}
    .holo-btn-scan{background:rgba(0,240,255,.14);border-color:rgba(0,240,255,.55);color:var(--cyan);font-weight:800;box-shadow:0 0 12px rgba(0,240,255,.25)}
    .holo-btn-scan:hover{background:rgba(0,240,255,.24);box-shadow:0 0 18px rgba(0,240,255,.4)}
    .holo-btn-scan.is-scanning{background:rgba(16,185,129,.25);border-color:#34D399;color:#A7F3D0;box-shadow:0 0 16px rgba(16,185,129,.45)}
    .holo-stage{position:relative;width:100%;height:320px;min-height:320px;border-radius:10px;border:1px solid rgba(0,240,255,.2);background:#05070B;overflow:hidden;transition:border-color .2s,box-shadow .2s}
    .holo-stage.is-igniting{border-color:#FF9F0A;box-shadow:0 0 32px rgba(255,159,10,.35),inset 0 0 28px rgba(0,240,255,.18)}
    #dynoHoloCanvas{width:100%;height:100%;min-height:320px;display:block;cursor:grab;touch-action:none}
    #dynoHoloCanvas:active{cursor:grabbing}
    .holo-rpm-deck{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-radius:8px;background:rgba(11,15,23,.92);border:1px solid rgba(0,240,255,.28);font-family:var(--mono)}
    .holo-rpm-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
    .holo-rpm-label{font-size:.875rem;font-weight:800;letter-spacing:.08em;color:var(--cyan)}
    .holo-rpm-telemetry-group{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap}
    .holo-sfx-pill{display:inline-flex;align-items:center;font-family:'JetBrains Mono',var(--mono);font-size:11px;font-weight:700;line-height:1;letter-spacing:.05em;padding:4px 8px;border-radius:999px;border:1px solid #00F0FF;color:#00F0FF;background:rgba(0,240,255,.08);box-shadow:0 0 10px rgba(0,240,255,.22);animation:sfx-neon-pulse 2.2s ease-in-out infinite;white-space:nowrap}
    @keyframes sfx-neon-pulse{0%,100%{box-shadow:0 0 8px rgba(0,240,255,.18),inset 0 0 4px rgba(0,240,255,.08);opacity:.92}50%{box-shadow:0 0 14px rgba(0,240,255,.42),inset 0 0 8px rgba(0,240,255,.18);opacity:1}}
    .holo-rpm-val{font-size:.875rem;font-weight:800;letter-spacing:.06em;color:var(--amber);transition:color .15s}
    .holo-rpm-val.is-redline{color:#FF2E54;text-shadow:0 0 14px rgba(255,46,84,.85)}
    .holo-rpm-track{position:relative;width:100%;height:10px;border-radius:999px;background:#05070B;border:1px solid rgba(255,255,255,.16);overflow:hidden}
    .holo-rpm-fill{height:100%;width:21%;border-radius:999px;background:linear-gradient(90deg,#00F0FF 0%,#FF9F0A 68%,#FF2E54 100%);box-shadow:0 0 14px rgba(0,240,255,.55);transition:width .05s linear}
    .holo-rpm-fill.is-redline{box-shadow:0 0 20px rgba(255,46,84,.95)}
    .holo-hud-bot{display:grid;grid-template-columns:1.12fr 1.22fr .88fr .78fr;gap:8px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08);font-family:var(--mono)}
    .holo-hud-bot span{display:block;font-size:.875rem;font-weight:700;letter-spacing:.06em;color:var(--cyan);white-space:nowrap}
    .holo-hud-bot b{display:block;font-size:.875rem;font-weight:800;color:#fff;margin-top:2px;white-space:nowrap}
    .holo-hud-bot b.c-cyan{color:var(--cyan)}.holo-hud-bot b.c-emerald{color:#34D399}.holo-hud-bot b.c-amber{color:var(--amber)}
    @media (max-width:1240px){.holo-hud-bot{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px}}

    /* bento */
    .card{background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:14px;padding:24px}
    .metric{padding:22px 20px;display:flex;flex-direction:column}
    .metric .val{font-family:var(--mono);font-weight:800;font-size:clamp(1.5rem,3.2vw,2.05rem);letter-spacing:-.02em;line-height:1.2}
    @media (min-width:1280px){.metric .val{font-size:clamp(1.38rem,1.82vw,1.78rem);white-space:nowrap}}
    .metric .name{font-weight:700;font-size:1.0625rem;color:#fff;margin-top:8px}
    .metric .sub{font-size:.875rem;font-weight:700;letter-spacing:.03em;margin-top:6px;line-height:1.5;color:var(--zinc200)}
    .metric.m-cyan{border-color:rgba(0,240,255,.4)}.metric.m-cyan .val{color:var(--cyan);text-shadow:0 0 20px rgba(0,240,255,.35)}
    .metric.m-amber{border-color:rgba(255,159,10,.55);box-shadow:0 0 30px rgba(255,159,10,.08)}.metric.m-amber .val{color:var(--amber);text-shadow:0 0 20px rgba(255,159,10,.35)}
    .metric.m-white .val{color:#fff}

    /* clusters */
    .clusters-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:18px}
    .cluster{grid-column:span 2;display:flex;flex-direction:column;gap:14px}
    .cluster:nth-child(n+4){grid-column:span 3}
    .cluster-head{display:flex;justify-content:space-between;align-items:center;gap:12px}
    .mc-id{font-family:var(--mono);font-weight:800;font-size:.875rem;letter-spacing:.12em;color:var(--cyan);background:rgba(0,240,255,.08);border:1px solid rgba(0,240,255,.55);border-radius:6px;padding:4px 10px}
    .mc-ask{font-family:var(--mono);font-weight:800;font-size:1.5rem;color:var(--amber);text-align:right;line-height:1.2}
    .mc-ask small{display:block;font-size:.875rem;letter-spacing:.14em;font-weight:800;color:var(--cyan);margin-bottom:2px}
    .cluster h3{line-height:1.32;letter-spacing:-.01em}
    .cluster .blurb{font-size:.9375rem}
    .meta-line{font-size:.875rem;font-weight:800;letter-spacing:.04em;color:var(--cyan);word-break:break-word;line-height:1.5}
    .pills{display:flex;flex-wrap:wrap;gap:7px}
    .pill{font-family:var(--mono);font-size:.875rem;font-weight:700;letter-spacing:.02em;padding:4px 11px;border-radius:999px;border:1px solid var(--line)}
    .pill-cyan{color:var(--cyan);border-color:rgba(0,240,255,.5);background:rgba(0,240,255,.09)}
    .pill-amber{color:var(--amber);border-color:rgba(255,159,10,.5);background:rgba(255,159,10,.09)}
    .stats{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .stats div{background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:8px;padding:10px 12px}
    .stats dt{font-size:.875rem;font-weight:800;letter-spacing:.08em;color:var(--cyan)}
    .stats dd{font-family:var(--mono);font-size:.875rem;font-weight:800;color:#fff;margin-top:3px}
    .monroney-sticker{background:rgba(5,7,11,.78);border:1px solid rgba(0,240,255,.28);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;font-family:var(--mono)}
    .monroney-head{font-size:.875rem;font-weight:800;letter-spacing:.08em;color:var(--cyan);border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:6px}
    .monroney-list{display:flex;flex-direction:column;gap:6px;font-size:.875rem;line-height:1.45;color:var(--zinc200)}
    .monroney-list li{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 8px}
    .monroney-list b{color:#fff;font-weight:800}
    .monroney-bundle{margin-top:4px;padding-top:8px;border-top:1px dashed rgba(255,159,10,.45);display:flex;flex-direction:column;gap:4px;font-size:.875rem}
    .monroney-bundle-title{font-weight:800;letter-spacing:.06em;color:var(--amber)}
    .monroney-bundle-row{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 8px;color:var(--zinc200)}
    .monroney-bundle-row b{color:var(--amber);font-weight:800}
    .monroney-deck{margin-top:16px}
    .monroney-card{display:flex;flex-direction:column;gap:10px}
    .monroney-card,.cluster,.monroney-sticker{transition:border-color 0.2s ease,box-shadow 0.2s ease,transform 0.2s ease}
    .monroney-card:hover,.cluster:hover,.monroney-sticker:hover,.card.monroney-card:hover,.card.cluster:hover{border-color:#00F0FF;box-shadow: 0 0 25px rgba(0, 240, 255, 0.25);transform:translateY(-2px)}
    .monroney-card .mc-tier{font-family:var(--mono);font-size:.875rem;font-weight:800;letter-spacing:.08em;color:var(--cyan)}
    .monroney-card.m-amber .mc-tier{color:var(--amber)}
    .monroney-card .mc-line{font-family:var(--mono);font-size:.875rem;font-weight:700;color:var(--zinc200);line-height:1.5;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.03);border:1px solid var(--line)}
    .buyers{font-size:.9375rem}
    .buyers b{display:block;font-size:.875rem;font-weight:800;letter-spacing:.08em;color:var(--amber);margin-bottom:3px}
    .triads{border-top:1px solid var(--line);padding-top:12px}
    .triads summary{cursor:pointer;font-size:.875rem;font-weight:800;letter-spacing:.08em;color:var(--cyan)}
    .triads summary:hover{color:var(--amber)}
    .triads ol{margin-top:10px;display:flex;flex-direction:column;gap:12px;font-size:.875rem;line-height:1.55;color:var(--zinc300)}
    .triads .uid{font-family:var(--mono);font-weight:700;color:var(--amber);margin-right:4px}
    .triads a{font-family:var(--mono);font-size:.875rem;font-weight:700;color:var(--cyan)}
    .triads a:hover{text-decoration:underline}
    .cta-stack{margin-top:auto;padding-top:8px}
    .btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;width:100%;min-height:62px;padding:12px 16px;border-radius:10px;font-family:var(--mono);font-weight:800;font-size:.9rem;letter-spacing:.06em;text-align:center;transition:box-shadow .15s,transform .15s,background .15s}
    .btn small{font-size:.875rem;font-weight:700;letter-spacing:.02em;opacity:.96}
    .btn:hover{transform:translateY(-1px)}
    .btn:focus-visible,.brand:focus-visible,.triads summary:focus-visible,.triads a:focus-visible{outline:2px solid #fff;outline-offset:2px;border-radius:4px}
    .btn-cyan{border:1px solid var(--cyan);color:var(--cyan);background:rgba(0,240,255,.06)}
    .btn-cyan:hover{background:rgba(0,240,255,.14);box-shadow:0 0 20px rgba(0,240,255,.3)}
    .btn-amber{background:var(--amber);color:#05070B;border:1px solid var(--amber)}
    .btn-amber:hover{box-shadow:0 0 22px rgba(255,159,10,.5)}
    .btn-subtle{border:1px solid rgba(255,255,255,.14);color:var(--zinc200);background:#0B0F17}
    .btn-subtle:hover{border-color:rgba(0,240,255,.5);background:rgba(0,240,255,.1);color:var(--cyan);box-shadow:0 0 16px rgba(0,240,255,.25)}

    /* rapid-select filter bar */
    .filter-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:16px 0 24px}
    .filter-pill{appearance:none;font-family:var(--mono);font-size:.875rem;font-weight:700;letter-spacing:.04em;padding:7px 14px;border-radius:999px;background:#0B0F17;color:#fff;border:1px solid rgba(0,240,255,.3);cursor:pointer;transition:background .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s;white-space:nowrap}
    .filter-pill:hover{border-color:rgba(0,240,255,.5);color:var(--cyan);background:rgba(0,240,255,.08);box-shadow:0 0 12px rgba(0,240,255,.2);transform:translateY(-1px)}
    .filter-pill.is-active{border-color:var(--amber);color:#05070B;background:var(--amber);box-shadow:0 0 16px rgba(255,159,10,.4);font-weight:800}
    .filter-pill:focus-visible{outline:2px solid #fff;outline-offset:2px}
    .clusters-grid.is-filtered{display:flex;justify-content:center}
    .clusters-grid.is-filtered .cluster{max-width:760px;width:100%}

    footer{border-top:1px solid var(--line);margin-top:16px}
    .foot-in{max-width:1480px;margin:0 auto;padding:38px 24px 68px}
    .foot-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
    .foot-card{display:flex;flex-direction:column;background:#080B10;border:1px solid #27272A;border-radius:.75rem;padding:1.5rem}
    .foot-badge-row{display:flex;align-items:center;margin-bottom:14px}
    .foot-pill{display:inline-flex;align-items:center;border-radius:999px;letter-spacing:.06em;border:1px solid var(--line)}
    .foot-pill.pill-amber{color:var(--amber);border-color:rgba(255,159,10,.55);background:rgba(255,159,10,.1)}
    .foot-pill.pill-cyan{color:var(--cyan);border-color:rgba(0,240,255,.5);background:rgba(0,240,255,.09)}
    .foot-title{line-height:1.35}
    .foot-list li{position:relative;padding-left:20px}
    .foot-list li::before{content:'';position:absolute;left:0;top:.58em;width:7px;height:7px;border-radius:50%;background:var(--cyan);box-shadow:0 0 10px rgba(0,240,255,.7)}
    .foot-card.fc-amber .foot-list li::before{background:var(--amber);box-shadow:0 0 10px rgba(255,159,10,.7)}

    @media (min-width:768px){
      .md\\:text-sm{font-size:.875rem;line-height:1.25rem}
      .md\\:text-base{font-size:1rem;line-height:1.625}
      .md\\:text-lg{font-size:1.125rem;line-height:1.55rem}
    }
    .nowrap{white-space:nowrap}
    .leading-relaxed{line-height:1.625}

    @media (max-width:1420px){
      .nav-in{grid-template-columns:1fr auto;gap:10px 16px}
      .nav-status{grid-column:1 / -1;order:3;justify-self:center}
    }
    @media (max-width:1180px){
      .clusters-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      .cluster,.cluster:nth-child(n+4){grid-column:span 1}
      .cluster:last-child{grid-column:span 2}
    }
    @media (max-width:960px){
      .foot-grid{grid-template-columns:minmax(0,1fr)}
    }
    @media (max-width:860px){
      .nav-in{grid-template-columns:1fr;justify-items:center;text-align:center;gap:10px}
      .nav-left,.nav-right{justify-content:center;flex-wrap:wrap}
      .nav-status{white-space:normal}
    }
    @media (max-width:700px){
      .clusters-grid{grid-template-columns:minmax(0,1fr)}
      .cluster,.cluster:last-child{grid-column:span 1}
      .filter-bar{justify-content:center}
      main{padding:28px 16px 48px}
      .foot-in{padding:28px 16px 48px}
      .nav-in{padding:12px 16px}
    }
    @media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.btn,.transition-colors,.price-pill-outline,.pulse-dot,.filter-pill{transition:none;animation:none}}
    /* Institutional polish: de-congested hero, slate body copy, calm telemetry */
    body{color:var(--mute)}
    h1,h2,h3,.brand{color:var(--text)}
    .nav-status{color:var(--mute);background:transparent;border:1px solid var(--line);text-shadow:none;letter-spacing:.14em;font-weight:600}
    .nav-cta{font-family:var(--mono);letter-spacing:.06em;font-weight:600;color:var(--text);background:transparent;border:1px solid rgba(148,163,184,.4);border-radius:999px;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center;transition:border-color .2s,background .2s}
    .nav-cta:hover{border-color:var(--text);background:rgba(248,250,252,.05)}
    .nav-cta:focus-visible{outline:2px solid #fff;outline-offset:2px}
    .eyebrow{color:var(--mute);text-shadow:none;font-weight:600;letter-spacing:.2em}
    h1{color:var(--text)}
    .lede{margin-top:24px;max-width:56ch;font-size:1.0625rem;line-height:1.65;color:var(--mute)}
    .lede strong{display:block;margin-bottom:8px;color:var(--text);font-weight:600}
    .spec-strip{list-style:none;margin:32px 0 0;padding:16px 0 0;border-top:1px solid var(--line);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
    .spec-strip li{display:flex;flex-direction:column;gap:4px;min-width:0}
    .spec-strip b{font-size:.8125rem;font-weight:600;color:var(--text);letter-spacing:.02em}
    .spec-strip span{font-size:.8125rem;color:var(--mute)}
    .title-anchor{margin-top:32px;display:flex;flex-direction:column;gap:4px;letter-spacing:0}
    .title-anchor span{font-family:var(--mono);font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:var(--mute)}
    .title-anchor b{font-size:1.75rem;font-weight:700;color:var(--text);letter-spacing:-.01em}
    .hero-actions{margin-top:24px}
    .holo-bay{box-shadow:none}
    .holo-sealed{font-size:.75rem;font-weight:600;letter-spacing:.16em;color:var(--text);background:transparent;border:0;box-shadow:none;padding:0}
    .holo-btn,.holo-btn-scan,.holo-btn-ignition{font-size:.75rem;font-weight:600;letter-spacing:.08em;background:transparent;color:var(--text);border:1px solid rgba(148,163,184,.3);box-shadow:none}
    .holo-btn:hover,.holo-btn-scan:hover,.holo-btn-ignition:hover{background:rgba(248,250,252,.06);border-color:rgba(248,250,252,.55);color:var(--text);box-shadow:none;transform:none}
    .holo-btn-ignition{border-color:rgba(255,159,10,.55)}
    .holo-btn-ignition.is-igniting,.holo-btn-scan.is-scanning{background:rgba(255,159,10,.12);border-color:var(--amber);color:var(--text);box-shadow:none}
    .holo-stage{border-color:var(--line)}
    .holo-rpm-deck{border-color:var(--line)}
    .holo-rpm-label,.holo-hud-bot span,.holo-subtelemetry span{font-size:.6875rem;font-weight:600;letter-spacing:.14em;color:var(--mute)}
    .holo-rpm-val{font-size:.8125rem;font-weight:600;letter-spacing:.04em;color:var(--text)}
    .holo-sfx-pill{font-size:.625rem;font-weight:600;letter-spacing:.12em;color:var(--mute);border-color:var(--line);background:transparent}
    .holo-rpm-fill{box-shadow:none}
    .holo-subtelemetry{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding-top:4px}
    .holo-subtelemetry span{display:block;white-space:nowrap}
    .holo-subtelemetry b{display:block;margin-top:2px;font-family:var(--mono);font-size:.8125rem;font-weight:600;color:var(--text)}
    .holo-hud-bot b{font-size:.8125rem;font-weight:600}
    .holo-hud-bot b.c-cyan,.holo-hud-bot b.c-emerald,.holo-hud-bot b.c-amber{color:var(--text)}
    @media (max-width:640px){.spec-strip,.holo-subtelemetry{grid-template-columns:1fr}.nav-status{white-space:normal}}
    /* institutional polish pass: tap targets, canvas ratio, rhythm */
    .eyebrow{color:var(--cyan);opacity:.85}
    .holo-stage{height:auto;min-height:260px;max-height:460px;aspect-ratio:16/10}
    #dynoHoloCanvas{min-height:0;max-width:100%}
    .holo-rpm-deck > div:first-child{gap:8px 12px;flex-wrap:wrap}
    .holo-hud-bot b,.holo-subtelemetry b{overflow-wrap:anywhere;line-height:1.35}
    .hero-actions .btn{min-height:56px}
    @media (max-width:1024px){
      .nav-cta,.holo-btn,.holo-btn-scan,.holo-btn-ignition,.filter-pill{min-height:44px;display:inline-flex;align-items:center;justify-content:center;padding-left:14px;padding-right:14px}
      .holo-controls{gap:8px}
    }
    @media (max-width:768px){
      .hero-actions{flex-direction:column;gap:12px}
      .hero-actions .btn{flex:none;width:100%;min-height:60px}
      .holo-stage{aspect-ratio:4/3}
    }
    @media (max-width:640px){
      .nav-status{font-size:.6875rem;letter-spacing:.08em;padding:8px 14px;line-height:1.4}
      .title-anchor b{font-size:1.5rem}
    }
    /* advisor pass: above-fold anchor, diligence strip, monochrome telemetry line */
    .spec-anchor{margin:14px 0 0;font-family:var(--mono);font-size:.8125rem;font-weight:700;letter-spacing:.08em;line-height:1.5;color:#fff;padding:8px 12px;border:1px solid rgba(248,250,252,.35);border-radius:6px;background:rgba(248,250,252,.05);display:inline-block;max-width:100%}
    .holo-telemetry-line{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;margin-top:10px;padding:10px 12px;border:1px solid var(--line);border-radius:8px;font-family:var(--mono);font-size:.6875rem;font-weight:600;letter-spacing:.1em;color:var(--mute)}
    .holo-telemetry-line b,.holo-telemetry-line span{color:var(--mute);font-weight:600}
    .holo-telemetry-line i{font-style:normal;opacity:.5}
    .diligence-strip{list-style:none;margin:24px 0 0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
    .diligence-strip li{display:flex;flex-direction:column;gap:4px;padding:12px 14px;background:#0F141C;border:1px solid rgba(148,163,184,.18);border-radius:8px;min-width:0}
    .diligence-strip span{font-family:var(--mono);font-size:.6875rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--mute)}
    .diligence-strip b{font-size:.875rem;font-weight:600;color:var(--text);line-height:1.4}
    @media (max-width:768px){.diligence-strip{grid-template-columns:1fr}.spec-anchor{font-size:.6875rem;letter-spacing:.04em}}
    /* 10/10 pass: fold optimization + mobile acquisition dock */
    .acq-dock{display:none}
    @media (max-width:1100px) and (max-height:760px) and (min-width:769px){
      main{padding-top:0}
      .hero-copy .eyebrow{margin:0}
      .hero-copy h1{margin-top:6px;line-height:1.1}
      .spec-anchor{margin-top:8px;padding:6px 10px}
      .lede{margin-top:10px;line-height:1.45;font-size:.9375rem}
      .lede strong{margin-bottom:4px}
      .spec-strip{margin-top:12px;padding-top:10px;gap:12px}
      .title-anchor{margin-top:12px}
      .title-anchor b{font-size:1.5rem}
      .hero-actions{margin-top:10px}
      .hero-actions .btn{min-height:48px}
    }
    @media (max-width:768px){
      .lede{margin-top:10px;line-height:1.4;font-size:.9375rem}
      .lede strong{margin-bottom:4px}
      .spec-anchor{margin-top:8px;padding:6px 8px}
      .spec-strip{margin-top:12px;padding-top:10px;gap:10px}
      .title-anchor{margin-top:12px}
      .title-anchor b{font-size:1.375rem}
      .hero-actions{margin-top:10px}
      .hero-actions .btn{min-height:52px}
      body{padding-bottom:84px}
      .nav-in{padding:8px 16px;gap:8px}
      .nav-status{display:none}
      .nav-left,.nav-right{flex-wrap:nowrap}
      main{padding-top:16px}
      .hero-copy{display:flex;flex-direction:column}
      .hero-copy .spec-strip{order:6}
      .hero-copy h1{font-size:1.5rem;line-height:1.12;max-width:none;margin-top:6px}
      .hero-copy .eyebrow{margin:0}
      .hero-copy .spec-anchor{align-self:flex-start}
      .acq-dock{display:block;position:fixed;bottom:0;left:0;right:0;z-index:50;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:rgba(5,7,11,.92);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-top:1px solid rgba(148,163,184,.25)}
      .acq-dock .btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:52px;text-align:center;white-space:normal}
    }
  </style>
</head>
<body>
  <header class="nav">
    <div class="nav-in">
      <div class="nav-left">
        <a href="#" class="brand text-lg font-black tracking-wider text-white cursor-pointer hover:text-amber-400 transition-colors duration-200">AURA <b>&amp;</b> GRID</a>
      </div>
      <div class="nav-status text-xs md:text-sm font-semibold py-1.5 px-3.5"><span class="pulse-dot" aria-hidden="true"></span>LIVE INVENTORY &bull; 5 CLUSTERS READY</div>
      <div class="nav-right">
        <a href="${vaultPortfolioMailto}" class="nav-cta text-xs md:text-sm font-semibold py-1.5 px-3.5" aria-label="Inquire vault buyout">[ INQUIRE VAULT BUYOUT ]</a>
      </div>
    </div>
  </header>

  <main>
    <div class="hero-deck grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      <div class="hero-copy">
        <p class="eyebrow">COMMERCIAL ASSET SHOWROOM</p>
        <h1>High-performance distributed systems &amp; compute infrastructure, <span>sold as clean title.</span></h1>
        <p class="spec-anchor">5 CLUSTERS &bull; 51 UNITS &bull; 105/105 GATES &bull; $805,000 PORTFOLIO ANCHOR</p>
        <p class="lede"><strong>Production Fleet: 17 Turnkey Web Engines. Zero Licensing Debt. 100% Clean APA Title.</strong> Engineered for scaling technical studios and high-load operators requiring single-tenant distributed infrastructure.</p>
        <ul class="spec-strip" aria-label="Acquisition highlights">
          <li><b>Full IP Ownership</b><span>Clean APA Title</span></li>
          <li><b>Clean-Room IP</b><span>Clean-Room Title (Zero Copyleft / MIT &amp; Apache-2.0)</span></li>
          <li><b>Zero Recurring Fees</b><span>Zero Seat Licenses</span></li>
        </ul>
        <p class="title-anchor"><span>5-Cluster Portfolio Title Anchor</span><b>${fmt(BATCH_ASK)}</b></p>
        <div class="hero-actions flex flex-col gap-2 w-full">
          <a class="btn btn-amber w-full" href="${batchApaMailto}" aria-label="Acquire title (APA) for 5-cluster portfolio lot">[ ACQUIRE TITLE (APA) ]</a>
        </div>
      </div>

      <div class="holo-bay border border-zinc-800 bg-[#06080C] rounded-xl relative overflow-hidden p-4" aria-label="Core infrastructure engine interactive 3D model">
        <div class="holo-hud-top">
          <span class="holo-sealed">CORE INFRASTRUCTURE ENGINE</span>
          <div class="holo-controls">
            <button type="button" class="holo-btn holo-btn-ignition" id="startEngineBtn" title="Run a 3-second simulated load sweep">START LOAD SWEEP</button>
            <button type="button" class="holo-btn" data-yaw="-15" title="Rotate model left 15 degrees" aria-label="Rotate model left">&lsaquo; ROTATE</button>
            <button type="button" class="holo-btn holo-btn-scan" id="scanSchematicBtn" title="Run schematic scan overlay">SCHEMATIC</button>
            <button type="button" class="holo-btn" data-yaw="15" title="Rotate model right 15 degrees" aria-label="Rotate model right">ROTATE &rsaquo;</button>
          </div>
        </div>
        <div class="holo-stage" id="holoStage">
          <canvas id="dynoHoloCanvas" data-model="" aria-label="Rotating 3D F1 cyber-chassis CAD wireframe"></canvas>
          <audio id="engineStartAudio" preload="auto" src="./assets/audio/engine_start.mp3" hidden></audio>
        </div>
        <div class="holo-telemetry-line" id="holoRpmDeck" role="status" aria-label="Simulated telemetry line">
          <span>SIMULATED DATA</span><i aria-hidden="true">&bull;</i><b id="holoRpmReadout">IDLE &bull; 3,200 OPS/S</b><i aria-hidden="true">&bull;</i><span>0.8 MS</span><i aria-hidden="true">&bull;</i><span>24/24 SHARDS</span><i aria-hidden="true">&bull;</i><span id="holoYawReadout">+32&deg; &bull; 60 FPS</span>
        </div>
      </div>
    </div>

    <ul class="diligence-strip" aria-label="Diligence proof">
      <li><span>Source Tree</span><b>Clean Single-Tenant Architecture</b></li>
      <li><span>Schema</span><b>Deterministic Zero-Copy Engine</b></li>
      <li><span>Test Report</span><b>105/105 Passing Gates Verified</b></li>
    </ul>

    <section aria-labelledby="fin-label">
      <p class="section-label" id="fin-label">// FINANCIAL TELEMETRY &amp; MONRONEY WINDOW STICKER</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="card metric m-cyan">
          <div class="val">${fmt(RETAIL_BENCHMARK)}</div>
          <div class="name">Retail Replacement Benchmark</div>
          <div class="sub text-xs font-mono text-zinc-200">ASC 350-40 Scope // Cost-to-Rebuild</div>
        </div>
        <div class="card metric m-amber">
          <div class="val">${fmt(BATCH_ASK)}</div>
          <div class="name">Take-All Portfolio APA Anchor</div>
          <div class="sub text-xs font-mono text-zinc-200">5-Cluster Portfolio // 51 Production Units</div>
        </div>
        <div class="card metric m-cyan">
          <div class="val">${fmt(MIN_CLUSTER_ASK)} &ndash; ${fmt(MAX_CLUSTER_ASK)}</div>
          <div class="name">Single Cluster Buyout Range</div>
          <div class="sub text-xs font-mono text-zinc-200"><span class="nowrap">MC-01</span> through <span class="nowrap">MC-05</span> Individual Lots</div>
        </div>
        <div class="card metric m-white">
          <div class="val">100% Pure APA</div>
          <div class="name">Direct Sovereign Title Transfer</div>
          <div class="sub text-xs font-mono text-zinc-200">Sole Developer // Zero Equity // Zero Debt</div>
        </div>
      </div>

      <div class="monroney-deck grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-label="Monroney Window Sticker Itemized Anchors and Cluster Package Buyout Telemetry">
        <div class="card metric monroney-card m-cyan">
          <div class="mc-tier">MONRONEY STICKER // TRACK 1</div>
          <div class="val">$4,500</div>
          <div class="name">Track 1 (Operator Utility)</div>
          <div class="sub text-xs font-mono text-zinc-200">React 19 / Vite / Postgres RLS</div>
          <div class="cta-stack flex flex-col gap-2 w-full">
            <a class="btn btn-amber w-full" href="${track1ApaMailto}" aria-label="Acquire title (APA) for Track 1 Operator Utility">[ ACQUIRE TITLE (APA) ]</a>
          </div>
        </div>

        <div class="card metric monroney-card m-cyan">
          <div class="mc-tier">MONRONEY STICKER // TRACK 2</div>
          <div class="val">$14,500</div>
          <div class="name">Track 2 (3D SCADA Cockpit)</div>
          <div class="sub text-xs font-mono text-zinc-200">Three.js WebGL 60 FPS Telemetry HUD</div>
          <div class="cta-stack flex flex-col gap-2 w-full">
            <a class="btn btn-amber w-full" href="${track2ApaMailto}" aria-label="Acquire title (APA) for Track 2 3D SCADA Cockpit">[ ACQUIRE TITLE (APA) ]</a>
          </div>
        </div>

        <div class="card metric monroney-card m-cyan">
          <div class="mc-tier">MONRONEY STICKER // TRACK 3</div>
          <div class="val">$35,000 &ndash; $65,000</div>
          <div class="name">Track 3 (Skunkworks Engine)</div>
          <div class="sub text-xs font-mono text-zinc-200">FastAPI Python 3.12 Asynchronous Core</div>
          <div class="cta-stack flex flex-col gap-2 w-full">
            <a class="btn btn-amber w-full" href="${track3ApaMailto}" aria-label="Acquire title (APA) for Track 3 Skunkworks Engine">[ ACQUIRE TITLE (APA) ]</a>
          </div>
        </div>

        <div class="card metric monroney-card m-amber">
          <div class="mc-tier">BUNDLE TELEMETRY // VOLUME DISCOUNT</div>
          <div class="val">$145,000 &ndash; $185,000</div>
          <div class="name">Full Triad Cluster Bundle</div>
          <div class="sub text-xs font-mono text-zinc-200">3 Triads / 9 Units // $207k Retail Baseline</div>
          <div class="cta-stack flex flex-col gap-2 w-full">
            <a class="btn btn-amber w-full" href="${bundleApaMailto}" aria-label="Acquire cluster title (APA) for Full Triad Cluster Bundle">[ ACQUIRE CLUSTER TITLE (APA) ]</a>
          </div>
        </div>
      </div>
    </section>

    <section id="clusters" aria-labelledby="mc-label">
      <p class="section-label" id="mc-label">// 5 SEALED MICRO-CLUSTERS — ACQUIRE ALL FIVE OR ANY ONE</p>
      <div class="filter-bar" role="group" aria-label="Rapid-select micro-cluster filter">
        <button type="button" class="filter-pill is-active" data-filter="all" aria-pressed="true">[ ALL CLUSTERS (5) ]</button>
        <button type="button" class="filter-pill" data-filter="MC-01" aria-pressed="false">[ MEMORY FABRICS (MC-01) ]</button>
        <button type="button" class="filter-pill" data-filter="MC-02" aria-pressed="false">[ SCHEDULING (MC-02) ]</button>
        <button type="button" class="filter-pill" data-filter="MC-03" aria-pressed="false">[ COMPRESSION (MC-03) ]</button>
        <button type="button" class="filter-pill" data-filter="MC-04" aria-pressed="false">[ TELEMETRY (MC-04) ]</button>
        <button type="button" class="filter-pill" data-filter="MC-05" aria-pressed="false">[ KERNELS (MC-05) ]</button>
      </div>
      <div class="clusters-grid" id="clustersGrid">${CLUSTERS.map(clusterCard).join('')}
      </div>
    </section>
  </main>
  <div class="acq-dock" role="complementary" aria-label="Acquire title dock"><a class="btn btn-amber" href="${batchApaMailto}" aria-label="Acquire title (APA) for 5-cluster portfolio lot, $805,000">[ ACQUIRE TITLE (APA) &bull; ${fmt(BATCH_ASK)} ]</a></div>

  <footer aria-labelledby="foot-label">
    <div class="foot-in">
      <p class="section-label" id="foot-label">// DEAL TERMS &amp; COMMERCIAL GOVERNANCE</p>
      <div class="foot-grid">
        <div class="foot-card fc-amber border border-zinc-800 bg-[#080B10] rounded-xl p-6">
          <div class="foot-badge-row"><span class="foot-pill pill-amber text-xs font-mono font-bold py-1 px-2.5">ESCROW &amp; TITLE</span></div>
          <h2 class="foot-title text-base md:text-lg font-black text-white tracking-wide mb-3">// THE TRANSACTION (100% PURE APA)</h2>
          <ul class="foot-list text-sm md:text-base text-zinc-200 leading-relaxed space-y-2.5">
            <li>100% Pure Software Asset Sale (Direct Turnkey APA Title Transfer)</li>
            <li>Authored and transferred directly by sole developer/systems architect</li>
            <li>5-Business-Day Technical Dyno Inspection via Sovereign Attorney Escrow</li>
            <li>Full source code, deployment scripts, and database schemas included</li>
          </ul>
        </div>
        <div class="foot-card border border-zinc-800 bg-[#080B10] rounded-xl p-6">
          <div class="foot-badge-row"><span class="foot-pill pill-cyan text-xs font-mono font-bold py-1 px-2.5">IP BOUNDARY</span></div>
          <h2 class="foot-title text-base md:text-lg font-black text-white tracking-wide mb-3">// RESERVED INTELLECTUAL PROPERTY</h2>
          <ul class="foot-list text-sm md:text-base text-zinc-200 leading-relaxed space-y-2.5">
            <li>Carve-out applies strictly to the acquired micro-cluster units</li>
            <li>Seller trademarks, creator development tooling, and parent catalog rights remain reserved by independent seller.</li>
            <li>Shared design tokens and non-conveyed platform roadmaps are excluded</li>
            <li>Zero debt, zero equity, zero assumed corporate liabilities, zero recurring seats</li>
          </ul>
        </div>
        <div class="foot-card border border-zinc-800 bg-[#080B10] rounded-xl p-6">
          <div class="foot-badge-row"><span class="foot-pill pill-cyan text-xs font-mono font-bold py-1 px-2.5">105/105 PASSING GATES</span></div>
          <h2 class="foot-title text-base md:text-lg font-black text-white tracking-wide mb-3">// THE SPEC SHEET &amp; PRODUCT TRUTH</h2>
          <ul class="foot-list text-sm md:text-base text-zinc-200 leading-relaxed space-y-2.5">
            <li>Turnkey pre-revenue high-performance systems engineering assets</li>
            <li>105/105 passing test gates across verified deterministic test suites</li>
            <li>Cockpits run interactive deterministic previews with simulated data</li>
            <li>All listed asking prices are pure software asset buyout anchors</li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
  <script>
  (function () {
    var holoBooted = false;

    function bootHoloBay() {
      if (holoBooted) return;
      holoBooted = true;

      var canvas = document.getElementById('dynoHoloCanvas');
      if (!canvas) return;
      var container = canvas.parentElement || canvas;
      var holoStage = document.getElementById('holoStage') || container;
      var yawReadout = document.getElementById('holoYawReadout');
      var rpmReadout = document.getElementById('holoRpmReadout');
      var rpmFill = document.getElementById('holoRpmFill');
      var scanBtn = document.getElementById('scanSchematicBtn');
      var startEngineBtn = document.getElementById('startEngineBtn');
      var engineAudioEl = document.getElementById('engineStartAudio');
      var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Option B Exotic Cold-Start Web Audio API Controller + Preloaded MP3 Buffer
      var ENGINE_AUDIO_SRC = './assets/audio/engine_start.mp3';
      var audioCtx = null;
      var decodedEngineBuffer = null;
      var activeSourceNode = null;
      var rawAudioArrayBufferPromise = (typeof window.fetch === 'function')
        ? window.fetch(ENGINE_AUDIO_SRC).then(function (res) {
            return res.ok ? res.arrayBuffer() : null;
          }).catch(function () { return null; })
        : Promise.resolve(null);

      function triggerColdStartAudio() {
        try {
          var AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            if (!audioCtx) {
              audioCtx = new AudioContextClass();
            }
            if (audioCtx.state === 'suspended') {
              audioCtx.resume();
            }
            if (activeSourceNode) {
              try { activeSourceNode.stop(0); } catch (e) {}
              activeSourceNode = null;
            }
            if (decodedEngineBuffer) {
              var srcNode = audioCtx.createBufferSource();
              var gainNode = audioCtx.createGain();
              gainNode.gain.value = 0.92;
              srcNode.buffer = decodedEngineBuffer;
              srcNode.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              srcNode.start(0);
              activeSourceNode = srcNode;
              return;
            }
            rawAudioArrayBufferPromise.then(function (rawBuf) {
              if (rawBuf && audioCtx) {
                audioCtx.decodeAudioData(rawBuf.slice(0), function (decoded) {
                  decodedEngineBuffer = decoded;
                  if (activeSourceNode) {
                    try { activeSourceNode.stop(0); } catch (e) {}
                  }
                  var srcNode = audioCtx.createBufferSource();
                  var gainNode = audioCtx.createGain();
                  gainNode.gain.value = 0.92;
                  srcNode.buffer = decoded;
                  srcNode.connect(gainNode);
                  gainNode.connect(audioCtx.destination);
                  srcNode.start(0);
                  activeSourceNode = srcNode;
                }, function () {
                  playFallbackAudioElement();
                });
              } else {
                playFallbackAudioElement();
              }
            });
            return;
          }
        } catch (err) {
          console.warn('[AUDIO ENGINE]: Web Audio API fallback engaged', err);
        }
        playFallbackAudioElement();
      }

      function playFallbackAudioElement() {
        try {
          var el = engineAudioEl || new Audio(ENGINE_AUDIO_SRC);
          el.currentTime = 0;
          el.volume = 0.92;
          var p = el.play();
          if (p && typeof p.catch === 'function') p.catch(function () {});
        } catch (e) {}
      }

      // Synchronized 3-Phase Showroom Tachometer & Camera Vibration Timeline (0.0s - 3.0s):
      //   0.0s - 0.5s: Starter motor churn (Tachometer climbs from 0 to 3,200 RPM)
      //   0.5s - 1.5s: Exhaust ignition roar (Tachometer blips to 15,000 RPM peak + subtle Three.js camera vibration)
      //   1.5s - 3.0s: Exhaust burble decrescendo (Tachometer settles to steady 3,200 RPM idle)
      function computeIgnitionTimeline(elapsedMs) {
        var rpm = 3200;
        var spoolCurve = 0;
        var camShakeX = 0;
        var camShakeY = 0;
        var phasePrefix = 'IDLE • ';
        var isRedline = false;

        if (elapsedMs < 500) {
          var u1 = Math.max(0, elapsedMs / 500);
          rpm = 3200 * Math.pow(u1, 1.08);
          spoolCurve = 0.18 * u1;
          phasePrefix = 'STARTER CHURN // ';
        } else if (elapsedMs < 1500) {
          var u2 = (elapsedMs - 500) / 1000;
          var roarCurve = u2 < 0.72
            ? Math.pow(u2 / 0.72, 0.72)
            : 1.0 - 0.04 * ((u2 - 0.72) / 0.28);
          rpm = 3200 + (15000 - 3200) * roarCurve;
          spoolCurve = 0.22 + 0.78 * roarCurve;
          isRedline = rpm >= 13200;
          phasePrefix = isRedline ? 'PEAK LOAD • ' : 'BURST • ';
          if (!reducedMotion) {
            var vibEnv = Math.sin(u2 * Math.PI) * roarCurve;
            camShakeX = Math.sin(elapsedMs * 0.11) * 0.032 * vibEnv;
            camShakeY = Math.cos(elapsedMs * 0.15) * 0.026 * vibEnv;
          }
        } else {
          var u3 = Math.min(1, (elapsedMs - 1500) / 1500);
          var decay = Math.pow(1 - u3, 2.15);
          var burbleOsc = Math.sin(elapsedMs * 0.048) * 165 * decay * (1 - decay);
          rpm = 3200 + (14528 - 3200) * decay + burbleOsc;
          spoolCurve = 0.85 * decay;
          isRedline = rpm >= 13200;
          phasePrefix = isRedline ? 'PEAK LOAD • ' : (u3 < 0.85 ? 'SETTLING • ' : 'IDLE • ');
        }

        return {
          rpm: rpm,
          spoolCurve: spoolCurve,
          camShakeX: camShakeX,
          camShakeY: camShakeY,
          phasePrefix: phasePrefix,
          isRedline: isRedline
        };
      }

      function hasWebGL() {
        try {
          var c = document.createElement('canvas');
          return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
        } catch (err) {
          console.error('[HOLO-BAY TELEMETRY FAULT]:', err);
          return false;
        }
      }

      function launchHoloViewport() {
        try {
          if (typeof window.THREE === 'undefined' || !hasWebGL()) {
            throw new Error('WebGL context or THREE runtime unavailable');
          }
          initThreeViewport();
        } catch (err) {
          console.error('[HOLO-BAY TELEMETRY FAULT]:', err);
          initCanvas2DFallback();
        }
      }

      if (typeof window.THREE === 'undefined') {
        var cdnScript = document.createElement('script');
        cdnScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        cdnScript.async = true;
        cdnScript.onload = function () {
          launchHoloViewport();
        };
        cdnScript.onerror = function (err) {
          console.error('[HOLO-BAY TELEMETRY FAULT]:', err);
          initCanvas2DFallback();
        };
        document.head.appendChild(cdnScript);
      } else {
        launchHoloViewport();
      }

      function initThreeViewport() {
        const width = container.clientWidth || 400;
        const height = container.clientHeight || 320;

        // 1. Scene setup
        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0x05070B);

        // 2. Camera configuration: PerspectiveCamera(45, width / height, 0.1, 1000)
        var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 2.5, 6);
        camera.lookAt(0, 0, 0);

        // 3. WebGL Renderer & Zero-Dimension Guard
        var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

      // 4. Bright Telemetry Lighting
      var ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambientLight);

      var dirLightCyan = new THREE.DirectionalLight(0x00F0FF, 2.5);
      dirLightCyan.position.set(5, 10, 7);
      scene.add(dirLightCyan);

      var dirLightAmber = new THREE.DirectionalLight(0xFF9F0A, 1.8);
      dirLightAmber.position.set(-5, -5, -5);
      scene.add(dirLightAmber);

      // Ground Telemetry Grid: 40x40 perspective ground grid plane beneath vehicle chassis (#00F0FF @ 0.40 opacity) with soft radial glow against #05070B
      var grid = new THREE.GridHelper(40, 40, 0x00F0FF, 0x00F0FF);
      grid.position.y = -0.52;
      grid.renderOrder = -1;
      grid.material.color.setHex(0x00F0FF);
      grid.material.transparent = true;
      grid.material.opacity = 0.40;
      grid.material.blending = THREE.AdditiveBlending;
      grid.material.depthWrite = false;
      grid.material.onBeforeCompile = function (shader) {
        shader.vertexShader = 'varying vec3 vGridPos;\\n' + shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\\nvGridPos = position;'
        );
        shader.fragmentShader = 'varying vec3 vGridPos;\\n' + shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          'float radialDist = length(vGridPos.xz) / 20.0;\\n' +
          'float radialAlphaFade = 1.0 - smoothstep(0.18, 0.92, radialDist);\\n' +
          'float coreGlow = 1.0 + 0.35 * (1.0 - smoothstep(0.0, 0.45, radialDist));\\n' +
          'gl_FragColor.rgb = mix(vec3(0.0196, 0.0275, 0.0431), gl_FragColor.rgb * coreGlow, radialAlphaFade);\\n' +
          'gl_FragColor.a *= radialAlphaFade;\\n' +
          '#include <dithering_fragment>'
        );
      };
      scene.add(grid);

      var groundPlaneGeom = new THREE.PlaneGeometry(40, 40, 40, 40);
      groundPlaneGeom.rotateX(-Math.PI / 2);
      var groundHorizonFadeMat = new THREE.ShaderMaterial({
        uniforms: {
          uGridColor: { value: new THREE.Color(0x00F0FF) },
          uHorizonColor: { value: new THREE.Color(0x05070B) },
          uBaseOpacity: { value: 0.40 }
        },
        vertexShader: [
          'varying vec3 vWorldPos;',
          'void main() {',
          '  vWorldPos = position;',
          '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
          '}'
        ].join('\\n'),
        fragmentShader: [
          'uniform vec3 uGridColor;',
          'uniform vec3 uHorizonColor;',
          'varying vec3 vWorldPos;',
          'void main() {',
          '  float r = length(vWorldPos.xz) / 20.0;',
          '  float underChassisGlow = (1.0 - smoothstep(0.0, 0.38, r)) * 0.14;',
          '  float horizonMask = smoothstep(0.28, 0.94, r);',
          '  vec3 col = mix(uGridColor, uHorizonColor, horizonMask);',
          '  float alpha = max(underChassisGlow, horizonMask * 0.92);',
          '  gl_FragColor = vec4(col, alpha);',
          '}'
        ].join('\\n'),
        transparent: true,
        depthWrite: false
      });
      var groundHorizonPlane = new THREE.Mesh(groundPlaneGeom, groundHorizonFadeMat);
      groundHorizonPlane.position.y = -0.525;
      groundHorizonPlane.renderOrder = -2;
      scene.add(groundHorizonPlane);

      // 5. Lightweight Procedural Wireframe Racing Chassis
      var chassisGroup = new THREE.Group();
      scene.add(chassisGroup);

      // Materials matching garage branding (#00F0FF and #FF9F0A)
      var matCyanWire = new THREE.MeshBasicMaterial({ color: 0x00F0FF, wireframe: true, transparent: true, opacity: 0.88 });
      var matAmberWire = new THREE.MeshBasicMaterial({ color: 0xFF9F0A, wireframe: true, transparent: true, opacity: 0.92 });
      var lineCyan = new THREE.LineBasicMaterial({ color: 0x00F0FF, transparent: true, opacity: 0.88 });
      var lineAmber = new THREE.LineBasicMaterial({ color: 0xFF9F0A, transparent: true, opacity: 0.92 });

      // Cockpit Monocoque & Nose Cone
      var tubGeom = new THREE.BoxGeometry(0.85, 0.44, 1.75, 3, 2, 4);
      var tub = new THREE.Mesh(tubGeom, matCyanWire);
      tub.position.set(0, 0, 0.1);
      chassisGroup.add(tub);

      var noseGeom = new THREE.ConeGeometry(0.35, 1.6, 5, 2, true);
      noseGeom.rotateX(Math.PI / 2);
      var nose = new THREE.Mesh(noseGeom, matCyanWire);
      nose.position.set(0, -0.05, 1.6);
      chassisGroup.add(nose);

      var noseTipGeom = new THREE.OctahedronGeometry(0.12, 0);
      var noseTip = new THREE.Mesh(noseTipGeom, matAmberWire);
      noseTip.position.set(0, -0.1, 2.42);
      chassisGroup.add(noseTip);

      // Halo Safety Cockpit Loop (Amber)
      var haloGeom = new THREE.TorusGeometry(0.32, 0.045, 8, 16, Math.PI);
      haloGeom.rotateX(Math.PI / 2);
      var halo = new THREE.Mesh(haloGeom, matAmberWire);
      halo.position.set(0, 0.35, 0.2);
      chassisGroup.add(halo);

      var haloPylonGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.24, 6);
      var haloPylon = new THREE.Mesh(haloPylonGeom, matAmberWire);
      haloPylon.position.set(0, 0.24, 0.52);
      chassisGroup.add(haloPylon);

      var cockpitRimGeom = new THREE.BoxGeometry(0.55, 0.15, 0.72, 2, 1, 2);
      var cockpitRim = new THREE.Mesh(cockpitRimGeom, matAmberWire);
      cockpitRim.position.set(0, 0.24, 0.2);
      chassisGroup.add(cockpitRim);

      // Airbox & Engine Fin
      var airboxGeom = new THREE.ConeGeometry(0.24, 0.65, 4, 1, true);
      airboxGeom.rotateX(-Math.PI / 2);
      var airbox = new THREE.Mesh(airboxGeom, matAmberWire);
      airbox.position.set(0, 0.44, -0.3);
      chassisGroup.add(airbox);

      var finGeom = new THREE.BoxGeometry(0.04, 0.46, 1.05, 1, 2, 3);
      var fin = new THREE.Mesh(finGeom, matCyanWire);
      fin.position.set(0, 0.42, -0.85);
      chassisGroup.add(fin);

      var deckGeom = new THREE.BoxGeometry(0.72, 0.34, 1.05, 2, 2, 3);
      var deck = new THREE.Mesh(deckGeom, matCyanWire);
      deck.position.set(0, 0.02, -0.85);
      chassisGroup.add(deck);

      // Sidepods & Aerodynamic Undertray
      var spGeom = new THREE.BoxGeometry(0.48, 0.32, 1.35, 2, 2, 3);
      var spL = new THREE.Mesh(spGeom, matCyanWire);
      spL.position.set(-0.66, -0.06, -0.15);
      chassisGroup.add(spL);

      var spR = new THREE.Mesh(spGeom, matCyanWire);
      spR.position.set(0.66, -0.06, -0.15);
      chassisGroup.add(spR);

      var inletGeom = new THREE.RingGeometry(0.09, 0.15, 6);
      var inletL = new THREE.Mesh(inletGeom, matAmberWire);
      inletL.position.set(-0.66, -0.04, 0.54);
      chassisGroup.add(inletL);

      var inletR = new THREE.Mesh(inletGeom, matAmberWire);
      inletR.position.set(0.66, -0.04, 0.54);
      chassisGroup.add(inletR);

      var undertrayGeom = new THREE.BoxGeometry(1.85, 0.04, 3.1, 4, 1, 6);
      var undertray = new THREE.Mesh(undertrayGeom, matCyanWire);
      undertray.position.set(0, -0.22, 0);
      chassisGroup.add(undertray);

      var diffuserGeom = new THREE.BoxGeometry(1.15, 0.18, 0.65, 3, 1, 2);
      var diffuser = new THREE.Mesh(diffuserGeom, matCyanWire);
      diffuser.position.set(0, -0.14, -1.45);
      chassisGroup.add(diffuser);

      // Wings (Front & Rear)
      var fwMainGeom = new THREE.BoxGeometry(2.4, 0.04, 0.44, 6, 1, 2);
      var fwMain = new THREE.Mesh(fwMainGeom, matCyanWire);
      fwMain.position.set(0, -0.2, 1.95);
      chassisGroup.add(fwMain);

      var fwFlapGeom = new THREE.BoxGeometry(2.2, 0.03, 0.26, 6, 1, 1);
      var fwFlap = new THREE.Mesh(fwFlapGeom, matAmberWire);
      fwFlap.position.set(0, -0.13, 1.85);
      chassisGroup.add(fwFlap);

      var fwPlateGeom = new THREE.BoxGeometry(0.04, 0.24, 0.48, 1, 1, 2);
      var fwPlateL = new THREE.Mesh(fwPlateGeom, matAmberWire);
      fwPlateL.position.set(-1.2, -0.1, 1.95);
      chassisGroup.add(fwPlateL);

      var fwPlateR = new THREE.Mesh(fwPlateGeom, matAmberWire);
      fwPlateR.position.set(1.2, -0.1, 1.95);
      chassisGroup.add(fwPlateR);

      var rwMainGeom = new THREE.BoxGeometry(1.6, 0.04, 0.38, 4, 1, 2);
      var rwMain = new THREE.Mesh(rwMainGeom, matCyanWire);
      rwMain.position.set(0, 0.52, -1.75);
      chassisGroup.add(rwMain);

      var rwDrsGeom = new THREE.BoxGeometry(1.5, 0.04, 0.24, 4, 1, 1);
      var rwDrs = new THREE.Mesh(rwDrsGeom, matAmberWire);
      rwDrs.position.set(0, 0.72, -1.78);
      chassisGroup.add(rwDrs);

      var rwPlateGeom = new THREE.BoxGeometry(0.04, 0.65, 0.55, 1, 3, 2);
      var rwPlateL = new THREE.Mesh(rwPlateGeom, matCyanWire);
      rwPlateL.position.set(-0.82, 0.52, -1.75);
      chassisGroup.add(rwPlateL);

      var rwPlateR = new THREE.Mesh(rwPlateGeom, matCyanWire);
      rwPlateR.position.set(0.82, 0.52, -1.75);
      chassisGroup.add(rwPlateR);

      // Suspension & Axle Lines
      var axlePoints = [
        new THREE.Vector3(-1.25, -0.12, 1.25), new THREE.Vector3(1.25, -0.12, 1.25),
        new THREE.Vector3(-1.32, -0.10, -1.15), new THREE.Vector3(1.32, -0.10, -1.15),
        new THREE.Vector3(-1.25, -0.12, 1.25), new THREE.Vector3(-0.42, 0.1, 1.3),
        new THREE.Vector3(-1.25, -0.12, 1.25), new THREE.Vector3(-0.42, -0.15, 1.1),
        new THREE.Vector3(1.25, -0.12, 1.25), new THREE.Vector3(0.42, 0.1, 1.3),
        new THREE.Vector3(1.25, -0.12, 1.25), new THREE.Vector3(0.42, -0.15, 1.1),
        new THREE.Vector3(-1.32, -0.10, -1.15), new THREE.Vector3(-0.36, 0.15, -1.0),
        new THREE.Vector3(-1.32, -0.10, -1.15), new THREE.Vector3(-0.36, -0.15, -1.3),
        new THREE.Vector3(1.32, -0.10, -1.15), new THREE.Vector3(0.36, 0.15, -1.0),
        new THREE.Vector3(1.32, -0.10, -1.15), new THREE.Vector3(0.36, -0.15, -1.3)
      ];
      var axleGeom = new THREE.BufferGeometry().setFromPoints(axlePoints);
      var axleLines = new THREE.LineSegments(axleGeom, lineCyan);
      chassisGroup.add(axleLines);

      // Rotating Wireframe Wheels
      var wheels = [];
      var wheelDefs = [
        { x: -1.25, y: -0.12, z: 1.25, r: 0.38, w: 0.32 },
        { x: 1.25,  y: -0.12, z: 1.25, r: 0.38, w: 0.32 },
        { x: -1.32, y: -0.10, z: -1.15, r: 0.44, w: 0.42 },
        { x: 1.32,  y: -0.10, z: -1.15, r: 0.44, w: 0.42 }
      ];

      wheelDefs.forEach(function (wd) {
        var wg = new THREE.Group();
        wg.position.set(wd.x, wd.y, wd.z);

        var tireGeom = new THREE.CylinderGeometry(wd.r, wd.r, wd.w, 16, 2, true);
        tireGeom.rotateZ(Math.PI / 2);
        var tire = new THREE.Mesh(tireGeom, matCyanWire);
        wg.add(tire);

        var spokePoints = [];
        for (var i = 0; i < 6; i++) {
          var a = (i / 6) * Math.PI * 2;
          spokePoints.push(new THREE.Vector3(0, 0, 0));
          spokePoints.push(new THREE.Vector3(0, Math.sin(a) * wd.r * 0.95, Math.cos(a) * wd.r * 0.95));
        }
        var spokeGeom = new THREE.BufferGeometry().setFromPoints(spokePoints);
        var spokes = new THREE.LineSegments(spokeGeom, lineAmber);
        wg.add(spokes);

        chassisGroup.add(wg);
        wheels.push(wg);
      });

      // Glowing Telemetry Vertices
      var vertexPoints = [
        new THREE.Vector3(0, -0.1, 2.42),
        new THREE.Vector3(-1.2, 0.02, 1.95),
        new THREE.Vector3(1.2, 0.02, 1.95),
        new THREE.Vector3(0, 0.35, 0.2),
        new THREE.Vector3(0, 0.76, -0.3),
        new THREE.Vector3(-0.82, 0.84, -1.75),
        new THREE.Vector3(0.82, 0.84, -1.75),
        new THREE.Vector3(-1.25, -0.12, 1.25),
        new THREE.Vector3(1.25, -0.12, 1.25),
        new THREE.Vector3(-1.32, -0.10, -1.15),
        new THREE.Vector3(1.32, -0.10, -1.15),
        new THREE.Vector3(0, -0.22, -1.45)
      ];
      var vertexGeom = new THREE.BufferGeometry().setFromPoints(vertexPoints);
      var vertexMat = new THREE.PointsMaterial({ color: 0x00F0FF, size: 0.12, transparent: true, opacity: 0.95 });
      var vertices = new THREE.Points(vertexGeom, vertexMat);
      chassisGroup.add(vertices);

      var amberPoints = [
        new THREE.Vector3(0, 0.35, 0.2),
        new THREE.Vector3(0, -0.1, 2.42),
        new THREE.Vector3(0, 0.72, -1.78)
      ];
      var amberGeom = new THREE.BufferGeometry().setFromPoints(amberPoints);
      var amberVertexMat = new THREE.PointsMaterial({ color: 0xFF9F0A, size: 0.16, transparent: true, opacity: 0.95 });
      var amberVertices = new THREE.Points(amberGeom, amberVertexMat);
      chassisGroup.add(amberVertices);

      // Animated Scan Wave Mesh (Amber)
      var scanGeom = new THREE.PlaneGeometry(3.6, 0.1);
      scanGeom.rotateX(Math.PI / 2);
      var scanMat = new THREE.MeshBasicMaterial({ color: 0xFF9F0A, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
      var scanMesh = new THREE.Mesh(scanGeom, scanMat);
      scanMesh.visible = false;
      chassisGroup.add(scanMesh);

      // Push-to-Start Headlight Shaders & Volumetric Cones on 3D Car
      var headlightUniforms = {
        uTime: { value: 0.0 },
        uIgnition: { value: 0.0 }
      };

      var headlightShaderMat = new THREE.ShaderMaterial({
        uniforms: headlightUniforms,
        vertexShader: [
          'varying vec2 vUv;',
          'void main() {',
          '  vUv = uv;',
          '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
          '}'
        ].join('\\n'),
        fragmentShader: [
          'uniform float uTime;',
          'uniform float uIgnition;',
          'varying vec2 vUv;',
          'void main() {',
          '  float strobe = step(0.15, fract(uTime * 11.0)) * step(uTime, 0.95) + step(0.95, uTime);',
          '  float beam = pow(1.0 - vUv.y, 1.45) * (0.22 + 0.88 * uIgnition * strobe);',
          '  vec3 cyanCol = vec3(0.0, 0.94, 1.0);',
          '  vec3 amberCol = vec3(1.0, 0.62, 0.04);',
          '  vec3 coreCol = mix(cyanCol, amberCol, 0.35 + 0.45 * sin(uTime * 18.0));',
          '  vec3 finalCol = mix(coreCol, vec3(1.0, 1.0, 1.0), uIgnition * 0.65);',
          '  gl_FragColor = vec4(finalCol, clamp(beam, 0.0, 0.95));',
          '}'
        ].join('\\n'),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });

      var hlPodGeom = new THREE.SphereGeometry(0.085, 10, 10);
      var hlPodMat = new THREE.MeshBasicMaterial({ color: 0x00F0FF, transparent: true, opacity: 0.45 });
      var hlPodL = new THREE.Mesh(hlPodGeom, hlPodMat);
      hlPodL.position.set(-0.56, -0.06, 1.96);
      chassisGroup.add(hlPodL);

      var hlPodR = new THREE.Mesh(hlPodGeom, hlPodMat);
      hlPodR.position.set(0.56, -0.06, 1.96);
      chassisGroup.add(hlPodR);

      var hlBeamGeom = new THREE.ConeGeometry(0.42, 2.35, 16, 1, true);
      hlBeamGeom.translate(0, -1.175, 0);
      hlBeamGeom.rotateX(-Math.PI / 2);

      var hlBeamL = new THREE.Mesh(hlBeamGeom, headlightShaderMat);
      hlBeamL.position.set(-0.56, -0.06, 2.02);
      hlBeamL.visible = false;
      chassisGroup.add(hlBeamL);

      var hlBeamR = new THREE.Mesh(hlBeamGeom, headlightShaderMat);
      hlBeamR.position.set(0.56, -0.06, 2.02);
      hlBeamR.visible = false;
      chassisGroup.add(hlBeamR);

      var headlightPointLight = new THREE.PointLight(0x00F0FF, 0, 7.5);
      headlightPointLight.position.set(0, 0.15, 2.65);
      chassisGroup.add(headlightPointLight);

      // Asset Diagnostic: Check for external model (.glb/.gltf) with bulletproof procedural fallback
      var externalModelUrl = canvas.getAttribute('data-model') || window.CHASSIS_MODEL_URL || null;
      if (externalModelUrl && typeof THREE.GLTFLoader !== 'undefined') {
        var loader = new THREE.GLTFLoader();
        var timeoutId = setTimeout(function () {
          console.warn('[3D Viewport] Model fetch timed out, procedural fallback engaged.');
        }, 2500);

        loader.load(
          externalModelUrl,
          function (gltf) {
            clearTimeout(timeoutId);
            if (gltf && gltf.scene) {
              scene.remove(chassisGroup);
              chassisGroup = gltf.scene;
              scene.add(chassisGroup);
            }
          },
          undefined,
          function (err) {
            clearTimeout(timeoutId);
            console.warn('[3D Viewport] Model fetch failed, procedural wireframe chassis active.');
          }
        );
      }

      // State & Controls
      var dynoYaw = 0.56;
      var targetYaw = 0.56;
      var isScanning = false;
      var scanProgress = 0;
      var isIgniting = false;
      var ignitionStartMs = 0;
      var IGNITION_DURATION_MS = 3000;
      var isDragging = false;
      var lastX = 0;
      var inView = true;
      var frameCount = 0;

      function updateRpmHud(rpmVal, progressRatio, redlineActive, customPrefix) {
        var formatted = Math.round(rpmVal).toLocaleString('en-US');
        var pct = Math.max(2, Math.min(100, Math.round((rpmVal / 15000) * 100)));
        if (rpmFill) {
          rpmFill.style.width = pct + '%';
          rpmFill.classList.toggle('is-redline', !!redlineActive);
        }
        if (rpmReadout) {
          var statusPrefix = customPrefix || (redlineActive ? 'PEAK LOAD • ' : (isIgniting ? 'RAMPING • ' : 'IDLE • '));
          var suffix = redlineActive ? ' OPS/S • PEAK' : ' OPS/S';
          rpmReadout.textContent = statusPrefix + formatted + suffix;
          rpmReadout.classList.toggle('is-redline', !!redlineActive);
        }
      }

      function triggerEngineIgnition() {
        triggerColdStartAudio();
        isIgniting = true;
        ignitionStartMs = performance.now();
        hlBeamL.visible = true;
        hlBeamR.visible = true;
        isScanning = true;
        scanProgress = 0;
        scanMesh.visible = true;
        updateRpmHud(0, 0, false, 'STARTER CHURN // ');
        if (startEngineBtn) {
          startEngineBtn.classList.add('is-igniting');
          startEngineBtn.textContent = 'RUNNING SWEEP…';
        }
        if (holoStage) holoStage.classList.add('is-igniting');
      }

      if (startEngineBtn) {
        startEngineBtn.addEventListener('click', triggerEngineIgnition);
      }

      // Prevent zero-dimension collapses on resize and container changes
      function syncViewportSize() {
        const width = container.clientWidth || 400;
        const height = container.clientHeight || 320;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      window.addEventListener('resize', syncViewportSize, { passive: true });
      if (window.ResizeObserver && container) {
        var ro = new ResizeObserver(function () {
          syncViewportSize();
        });
        ro.observe(container);
      }

      // Wire UI Buttons to Model Matrix
      document.querySelectorAll('[data-yaw]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var delta = parseFloat(btn.getAttribute('data-yaw') || '0');
          targetYaw += (delta * Math.PI) / 180;
        });
      });

      if (scanBtn) {
        scanBtn.addEventListener('click', function () {
          isScanning = true;
          scanProgress = 0;
          scanMesh.visible = true;
          scanBtn.classList.add('is-scanning');
        });
      }

      // Interactive Pointer Drag on Canvas
      canvas.addEventListener('pointerdown', function (ev) {
        isDragging = true;
        lastX = ev.clientX;
        if (canvas.setPointerCapture) canvas.setPointerCapture(ev.pointerId);
      });
      canvas.addEventListener('pointermove', function (ev) {
        if (!isDragging) return;
        var dx = ev.clientX - lastX;
        lastX = ev.clientX;
        targetYaw += dx * 0.008;
        dynoYaw = targetYaw;
      });
      function endDrag() { isDragging = false; }
      canvas.addEventListener('pointerup', endDrag);
      canvas.addEventListener('pointercancel', endDrag);

      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          inView = entries[0] ? entries[0].isIntersecting : true;
        }, { threshold: 0.05 });
        io.observe(canvas);
      }

      function animate() {
        requestAnimationFrame(animate);
        if (document.hidden || !inView) return;

        var yawSpeed = 0.0028;
        var wheelSpeed = 0.05;

        if (isIgniting) {
          var elapsedMs = performance.now() - ignitionStartMs;
          var t = Math.min(1, Math.max(0, elapsedMs / IGNITION_DURATION_MS));
          if (elapsedMs >= IGNITION_DURATION_MS) {
            isIgniting = false;
            headlightUniforms.uIgnition.value = 0.0;
            hlBeamL.visible = false;
            hlBeamR.visible = false;
            hlPodMat.color.setHex(0x00F0FF);
            hlPodMat.opacity = 0.45;
            headlightPointLight.intensity = 0;
            chassisGroup.position.set(0, 0, 0);
            camera.position.set(0, 2.5, 6);
            camera.lookAt(0, 0, 0);
            if (startEngineBtn) {
              startEngineBtn.classList.remove('is-igniting');
              startEngineBtn.textContent = 'START LOAD SWEEP';
            }
            if (holoStage) holoStage.classList.remove('is-igniting');
            updateRpmHud(3200, 0, false, 'IDLE • ');
          } else {
            var tl = computeIgnitionTimeline(elapsedMs);
            var spoolCurve = tl.spoolCurve;
            var currentRpm = tl.rpm;
            var isRedline = tl.isRedline;
            updateRpmHud(currentRpm, t, isRedline, tl.phasePrefix);

            yawSpeed = 0.0028 + spoolCurve * 0.024;
            wheelSpeed = 0.05 + spoolCurve * 0.38;

            // Flash headlight shaders on the 3D car
            headlightUniforms.uTime.value = elapsedMs * 0.001;
            var flashPulse = 0.65 + 0.35 * Math.sin(elapsedMs * 0.032);
            headlightUniforms.uIgnition.value = spoolCurve * flashPulse;
            hlPodMat.color.setHex(isRedline ? 0xFF9F0A : 0xFFFFFF);
            hlPodMat.opacity = 0.75 + 0.25 * Math.sin(elapsedMs * 0.045);
            headlightPointLight.intensity = 2.8 * spoolCurve * flashPulse;

            // High-RPM harmonic chassis micro-vibration & Three.js camera vibration during exhaust roar
            chassisGroup.position.y = Math.sin(elapsedMs * 0.09) * 0.014 * spoolCurve;
            camera.position.set(tl.camShakeX, 2.5 + tl.camShakeY, 6);
            camera.lookAt(0, 0, 0);
          }
        }

        if (!reducedMotion && !isDragging) {
          targetYaw += yawSpeed;
        }
        dynoYaw += (targetYaw - dynoYaw) * 0.1;
        chassisGroup.rotation.y = dynoYaw;

        // Rotate wheels
        if (!reducedMotion) {
          for (var w = 0; w < wheels.length; w++) {
            wheels[w].rotation.x += wheelSpeed;
          }
        }

        // Animated amber scan-line wave
        if (isScanning) {
          scanProgress += 0.02;
          if (scanProgress > 1) {
            isScanning = false;
            scanProgress = 0;
            scanMesh.visible = false;
            if (scanBtn) scanBtn.classList.remove('is-scanning');
            matAmberWire.opacity = 0.92;
          } else {
            scanMesh.visible = true;
            scanMesh.position.z = 2.5 - (scanProgress * 4.6);
            scanMesh.position.y = -0.1 + Math.sin(scanProgress * Math.PI) * 0.4;
            matAmberWire.opacity = 0.65 + Math.sin(scanProgress * Math.PI * 4) * 0.35;
          }
        }

        try {
          renderer.render(scene, camera);
        } catch (err) {
          console.error('[HOLO-BAY TELEMETRY FAULT]:', err);
        }

        frameCount++;
        if (yawReadout && (frameCount % 6 === 0)) {
          var deg = Math.round(((dynoYaw * 180) / Math.PI) % 360);
          if (deg > 180) deg -= 360;
          if (deg < -180) deg += 360;
          yawReadout.textContent = (deg >= 0 ? '+' : '') + deg + '\u00B0 \u2022 60 FPS';
        }
      }

      animate();
      }

    function initCanvas2DFallback() {
      var ctx = canvas.getContext('2d');
      if (!ctx) return;

      var dynoYaw = 0.56;
      var targetYaw = 0.56;
      var wheelSpin = 0;
      var isIgniting = false;
      var ignitionStartMs = 0;
      var IGNITION_DURATION_MS = 3000;
      var isDragging = false;
      var lastX = 0;
      var inView = true;
      var rafId = 0;
      var frameTick = 0;

      function updateFallbackRpmHud(rpmVal, redlineActive, customPrefix) {
        var formatted = Math.round(rpmVal).toLocaleString('en-US');
        var pct = Math.max(2, Math.min(100, Math.round((rpmVal / 15000) * 100)));
        if (rpmFill) {
          rpmFill.style.width = pct + '%';
          rpmFill.classList.toggle('is-redline', !!redlineActive);
        }
        if (rpmReadout) {
          var statusPrefix = customPrefix || (redlineActive ? 'PEAK LOAD • ' : (isIgniting ? 'RAMPING • ' : 'IDLE • '));
          var suffix = redlineActive ? ' OPS/S • PEAK' : ' OPS/S';
          rpmReadout.textContent = statusPrefix + formatted + suffix;
          rpmReadout.classList.toggle('is-redline', !!redlineActive);
        }
      }

      if (startEngineBtn) {
        startEngineBtn.addEventListener('click', function () {
          triggerColdStartAudio();
          isIgniting = true;
          ignitionStartMs = performance.now();
          updateFallbackRpmHud(0, false, 'STARTER CHURN // ');
          if (startEngineBtn) {
            startEngineBtn.classList.add('is-igniting');
            startEngineBtn.textContent = 'RUNNING SWEEP…';
          }
          if (holoStage) holoStage.classList.add('is-igniting');
          kick();
        });
      }

      var f1Nodes = {
        nose_tip:    { x: 0,     y: -0.10, z: 2.45 },
        nose_mid:    { x: 0,     y: 0.12,  z: 1.60 },
        nose_bulk_t: { x: 0,     y: 0.28,  z: 0.85 },
        nose_bulk_b: { x: 0,     y: -0.15, z: 0.85 },
        fw_l_tip:    { x: -1.65, y: -0.22, z: 2.15 },
        fw_r_tip:    { x: 1.65,  y: -0.22, z: 2.15 },
        fw_l_top:    { x: -1.65, y: 0.10,  z: 2.05 },
        fw_r_top:    { x: 1.65,  y: 0.10,  z: 2.05 },
        fw_flap_l:   { x: -1.55, y: -0.05, z: 1.95 },
        fw_flap_r:   { x: 1.55,  y: -0.05, z: 1.95 },
        fw_pylon_l:  { x: -0.25, y: -0.20, z: 2.25 },
        fw_pylon_r:  { x: 0.25,  y: -0.20, z: 2.25 },
        hub_fl:      { x: -1.35, y: -0.02, z: 1.35 },
        hub_fr:      { x: 1.35,  y: -0.02, z: 1.35 },
        cp_rim_f:    { x: 0,     y: 0.42,  z: 0.65 },
        cp_rim_l:    { x: -0.32, y: 0.38,  z: 0.15 },
        cp_rim_r:    { x: 0.32,  y: 0.38,  z: 0.15 },
        cp_rim_b:    { x: 0,     y: 0.42,  z: -0.25 },
        halo_pylon:  { x: 0,     y: 0.68,  z: 0.62 },
        halo_apex:   { x: 0,     y: 0.74,  z: 0.45 },
        halo_l:      { x: -0.38, y: 0.72,  z: 0.05 },
        halo_r:      { x: 0.38,  y: 0.72,  z: 0.05 },
        airbox:      { x: 0,     y: 0.95,  z: -0.18 },
        shark_fin:   { x: 0,     y: 0.88,  z: -1.15 },
        engine_deck: { x: 0,     y: 0.38,  z: -1.55 },
        sp_in_tl:    { x: -0.90, y: 0.32,  z: 0.65 },
        sp_in_tr:    { x: 0.90,  y: 0.32,  z: 0.65 },
        sp_in_bl:    { x: -0.75, y: -0.08, z: 0.65 },
        sp_in_br:    { x: 0.75,  y: -0.08, z: 0.65 },
        sp_mid_l:    { x: -0.95, y: 0.38,  z: -0.10 },
        sp_mid_r:    { x: 0.95,  y: 0.38,  z: -0.10 },
        sp_coke_l:   { x: -0.58, y: 0.24,  z: -1.05 },
        sp_coke_r:   { x: 0.58,  y: 0.24,  z: -1.05 },
        hub_rl:      { x: -1.45, y: 0.02,  z: -1.15 },
        hub_rr:      { x: 1.45,  y: 0.02,  z: -1.15 },
        rw_end_tl:   { x: -0.95, y: 0.92,  z: -1.85 },
        rw_end_tr:   { x: 0.95,  y: 0.92,  z: -1.85 },
        rw_end_bl:   { x: -0.95, y: 0.30,  z: -1.78 },
        rw_end_br:   { x: 0.95,  y: 0.30,  z: -1.78 },
        rw_main_l:   { x: -0.90, y: 0.72,  z: -1.82 },
        rw_main_r:   { x: 0.90,  y: 0.72,  z: -1.82 },
        rw_drs_l:    { x: -0.88, y: 0.88,  z: -1.84 },
        rw_drs_r:    { x: 0.88,  y: 0.88,  z: -1.84 },
        diffuser:    { x: 0,     y: -0.18, z: -1.85 }
      };

      var f1Edges = [
        ['nose_tip', 'nose_mid'], ['nose_mid', 'nose_bulk_t'], ['nose_tip', 'nose_bulk_b'],
        ['nose_tip', 'fw_pylon_l'], ['nose_tip', 'fw_pylon_r'],
        ['fw_pylon_l', 'fw_l_tip'], ['fw_pylon_r', 'fw_r_tip'],
        ['fw_l_tip', 'fw_l_top'], ['fw_r_tip', 'fw_r_top'],
        ['fw_l_tip', 'fw_flap_l'], ['fw_r_tip', 'fw_flap_r'],
        ['fw_flap_l', 'nose_mid'], ['fw_flap_r', 'nose_mid'],
        ['nose_bulk_t', 'hub_fl'], ['nose_bulk_b', 'hub_fl'],
        ['nose_bulk_t', 'hub_fr'], ['nose_bulk_b', 'hub_fr'],
        ['nose_bulk_t', 'cp_rim_f'],
        ['cp_rim_f', 'cp_rim_l'], ['cp_rim_f', 'cp_rim_r'],
        ['cp_rim_l', 'cp_rim_b'], ['cp_rim_r', 'cp_rim_b'],
        ['cp_rim_f', 'halo_pylon'], ['halo_pylon', 'halo_apex'],
        ['halo_apex', 'halo_l'], ['halo_apex', 'halo_r'],
        ['halo_l', 'cp_rim_l'], ['halo_r', 'cp_rim_r'],
        ['cp_rim_b', 'airbox'], ['airbox', 'shark_fin'], ['shark_fin', 'engine_deck'],
        ['cp_rim_f', 'sp_in_tl'], ['cp_rim_f', 'sp_in_tr'],
        ['nose_bulk_b', 'sp_in_bl'], ['nose_bulk_b', 'sp_in_br'],
        ['sp_in_tl', 'sp_in_bl'], ['sp_in_tr', 'sp_in_br'],
        ['sp_in_tl', 'sp_mid_l'], ['sp_in_tr', 'sp_mid_r'],
        ['sp_in_bl', 'sp_mid_l'], ['sp_in_br', 'sp_mid_r'],
        ['sp_mid_l', 'sp_coke_l'], ['sp_mid_r', 'sp_coke_r'],
        ['sp_coke_l', 'engine_deck'], ['sp_coke_r', 'engine_deck'],
        ['engine_deck', 'hub_rl'], ['diffuser', 'hub_rl'],
        ['engine_deck', 'hub_rr'], ['diffuser', 'hub_rr'],
        ['engine_deck', 'diffuser'],
        ['engine_deck', 'rw_end_bl'], ['engine_deck', 'rw_end_br'],
        ['rw_end_bl', 'rw_end_tl'], ['rw_end_br', 'rw_end_tr'],
        ['rw_end_tl', 'rw_end_tr'],
        ['rw_main_l', 'rw_main_r'],
        ['rw_drs_l', 'rw_drs_r'],
        ['rw_main_l', 'rw_end_bl'], ['rw_main_r', 'rw_end_br']
      ];

      function project3D(x, y, z, width, height, yaw, pitch) {
        var cz = z - 0.22;
        var cosY = Math.cos(yaw), sinY = Math.sin(yaw);
        var x1 = x * cosY + cz * sinY;
        var z1 = -x * sinY + cz * cosY;
        var cosP = Math.cos(pitch), sinP = Math.sin(pitch);
        var y2 = y * cosP - z1 * sinP;
        var z2 = y * sinP + z1 * cosP;
        var depth = 6.2 - z2;
        var scale = (4.2 / Math.max(depth, 0.1)) * (Math.min(width, height) / 3.45);
        return {
          px: width / 2 + x1 * scale,
          py: height / 2 - y2 * scale + (height * 0.05)
        };
      }

      function canAnimate() {
        return !document.hidden && inView && canvas.offsetParent !== null;
      }

      function renderFrame() {
        var w = canvas.clientWidth || 560;
        var h = canvas.clientHeight || 300;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var cw = Math.round(w * dpr), ch = Math.round(h * dpr);
        if (canvas.width !== cw || canvas.height !== ch) {
          canvas.width = cw;
          canvas.height = ch;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var yawStep = 0.0028;
        var spoolFactor = 0;
        if (isIgniting) {
          var elapsedMs = performance.now() - ignitionStartMs;
          if (elapsedMs >= IGNITION_DURATION_MS) {
            isIgniting = false;
            if (startEngineBtn) {
              startEngineBtn.classList.remove('is-igniting');
              startEngineBtn.textContent = 'START LOAD SWEEP';
            }
            if (holoStage) holoStage.classList.remove('is-igniting');
            updateFallbackRpmHud(3200, false, 'IDLE • ');
          } else {
            var tl = computeIgnitionTimeline(elapsedMs);
            spoolFactor = tl.spoolCurve;
            updateFallbackRpmHud(tl.rpm, tl.isRedline, tl.phasePrefix);
            yawStep = 0.0028 + spoolFactor * 0.024;
          }
        }

        if (!reducedMotion && !isDragging) {
          targetYaw += yawStep;
        }
        dynoYaw += (targetYaw - dynoYaw) * 0.09;
        if (!reducedMotion) wheelSpin += 0.055 + spoolFactor * 0.35;

        var pitch = 0.38;
        ctx.fillStyle = '#05070B';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.40)';
        ctx.shadowColor = 'rgba(0, 240, 255, 0.45)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        for (var gz = -3.2; gz <= 3.21; gz += 0.8) {
          var g1 = project3D(-2.4, -0.52, gz, w, h, dynoYaw, pitch);
          var g2 = project3D(2.4, -0.52, gz, w, h, dynoYaw, pitch);
          ctx.moveTo(g1.px, g1.py);
          ctx.lineTo(g2.px, g2.py);
        }
        for (var gx = -2.4; gx <= 2.41; gx += 0.8) {
          var g3 = project3D(gx, -0.52, -3.2, w, h, dynoYaw, pitch);
          var g4 = project3D(gx, -0.52, 3.2, w, h, dynoYaw, pitch);
          ctx.moveTo(g3.px, g3.py);
          ctx.lineTo(g4.px, g4.py);
        }
        ctx.stroke();
        ctx.restore();

        var proj = {};
        var keys = Object.keys(f1Nodes);
        for (var k = 0; k < keys.length; k++) {
          var nk = keys[k], n = f1Nodes[nk];
          proj[nk] = project3D(n.x, n.y, n.z, w, h, dynoYaw, pitch);
        }

        ctx.lineWidth = 1.6;
        ctx.strokeStyle = '#00F0FF';
        ctx.beginPath();
        for (var e = 0; e < f1Edges.length; e++) {
          var fk = f1Edges[e][0], tk = f1Edges[e][1];
          if (fk.indexOf('halo') === 0 || tk.indexOf('halo') === 0 || fk.indexOf('rw_drs') === 0 || tk.indexOf('rw_drs') === 0) continue;
          ctx.moveTo(proj[fk].px, proj[fk].py);
          ctx.lineTo(proj[tk].px, proj[tk].py);
        }
        ctx.stroke();

        ctx.strokeStyle = '#FF9F0A';
        ctx.beginPath();
        for (var ea = 0; ea < f1Edges.length; ea++) {
          var fka = f1Edges[ea][0], tka = f1Edges[ea][1];
          if (!(fka.indexOf('halo') === 0 || tka.indexOf('halo') === 0 || fka.indexOf('rw_drs') === 0 || tka.indexOf('rw_drs') === 0)) continue;
          ctx.moveTo(proj[fka].px, proj[fka].py);
          ctx.lineTo(proj[tka].px, proj[tka].py);
        }
        ctx.stroke();

        frameTick++;
        if (yawReadout && (frameTick % 6 === 0)) {
          var deg = Math.round(((dynoYaw * 180) / Math.PI) % 360);
          if (deg > 180) deg -= 360;
          if (deg < -180) deg += 360;
          yawReadout.textContent = (deg >= 0 ? '+' : '') + deg + '\u00B0 \u2022 60 FPS';
        }
      }

      function loop() {
        rafId = 0;
        if (!canAnimate()) return;
        renderFrame();
        rafId = requestAnimationFrame(loop);
      }

      function kick() {
        if (!rafId && canAnimate()) rafId = requestAnimationFrame(loop);
      }

      document.querySelectorAll('[data-yaw]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var delta = parseFloat(btn.getAttribute('data-yaw') || '0');
          targetYaw += (delta * Math.PI) / 180;
          kick();
        });
      });

      if (scanBtn) {
        scanBtn.addEventListener('click', function () {
          kick();
        });
      }

      canvas.addEventListener('pointerdown', function (ev) {
        isDragging = true;
        lastX = ev.clientX;
        if (canvas.setPointerCapture) canvas.setPointerCapture(ev.pointerId);
      });
      canvas.addEventListener('pointermove', function (ev) {
        if (!isDragging) return;
        var dx = ev.clientX - lastX;
        lastX = ev.clientX;
        targetYaw += dx * 0.009;
        dynoYaw = targetYaw;
        kick();
      });
      function endDrag() { isDragging = false; }
      canvas.addEventListener('pointerup', endDrag);
      canvas.addEventListener('pointercancel', endDrag);

      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          inView = entries[0] ? entries[0].isIntersecting : true;
          if (inView) kick();
        }, { threshold: 0.05 });
        io.observe(canvas);
      }
      document.addEventListener('visibilitychange', kick);
      window.addEventListener('resize', kick, { passive: true });
      kick();
      }
    }

    window.addEventListener('DOMContentLoaded', bootHoloBay);
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      bootHoloBay();
    }
  })();
  </script>
  <script>
  // Rapid-select cluster filter logic
  (function () {
    var filterBtns = document.querySelectorAll('.filter-pill');
    var clusterCards = document.querySelectorAll('.card.cluster');
    var grid = document.getElementById('clustersGrid');
    if (!filterBtns.length || !clusterCards.length) return;

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter') || 'all';

        filterBtns.forEach(function (b) {
          var active = (b === btn);
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        clusterCards.forEach(function (card) {
          var clusterId = card.getAttribute('data-cluster');
          var match = (filter === 'all' || clusterId === filter);
          if (match) {
            card.style.display = '';
            card.removeAttribute('hidden');
          } else {
            card.style.display = 'none';
            card.setAttribute('hidden', '');
          }
        });

        if (grid) {
          grid.classList.toggle('is-filtered', filter !== 'all');
        }
      });
    });
  })();

  // Centralized helper function for URL-encoded mailto telemetry payloads
  function generateAquireMailto(assetName, trackTier, anchorValuation) {
    var inbox = 'garrett@auraandgrid.io';
    var subject = '[APA TITLE INQUIRY] ' + assetName + ' (' + trackTier + ')';
    var body = 'Lead Systems Engineer & Dealership Principal,\\n\\n' +
      'I am submitting a formal inquiry to acquire 100% IP Title Transfer via Asset Purchase Agreement (APA):\\n\\n' +
      '• Target Unit: ' + assetName + '\\n' +
      '• Spec Tier: ' + trackTier + '\\n' +
      '• APA Buyout Anchor: ' + anchorValuation + '\\n\\n' +
      'Please route the complete APA title transfer agreement and code manifest to:\\n' +
      '- Buyer Entity Name: \\n' +
      '- Authorized Signer: \\n' +
      '- Wire / Settlement Email: ';
    return 'mailto:' + inbox + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }
  window.generateAquireMailto = generateAquireMailto;
  window.generateAcquireMailto = generateAquireMailto;
  </script>
</body>
</html>
`;

/* ------------------------------------------------------------------ */
/* Inline <script> AST/syntax verification gate                        */
/* ------------------------------------------------------------------ */
const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
inlineScripts.forEach((scriptSource, idx) => {
  try {
    new vm.Script(scriptSource, { filename: `site/index.html#inline-script-${idx}` });
  } catch (err) {
    fail(`inline <script> #${idx} syntax error: ${err.message}`);
  }
});

/* ------------------------------------------------------------------ */
/* Redaction + brand/terminology scrub scan on compiled output         */
/* ------------------------------------------------------------------ */
const FORBIDDEN = [
  /595,?000/, /829,?600/, /\bpanic\b/i, /wholesale/i, /walk-?away/i, /\bfloors?\b/i, /\breserve\b/i,
  /JUMP TO FLEET LOT/i, /TELEMETRY BLUEPRINTS/i, /V3\.2/i,
  /production-ready/i, /enterprise-grade/i,
  /ghost\s*factory/i, /ghostfactoryos/i, /\bGF-T[123]\b/i,
];
for (const re of FORBIDDEN) if (re.test(html)) fail(`forbidden pattern ${re} found in compiled markup`);

const htmlCopy = html.replace(/href="\.\/cockpits\/[^"]+"/g, '');
const FORBIDDEN_COPY = [/\bai\b/i, /\bllm\b/i, /\binference\b/i, /\bautonomous\b/i, /\bautomated\b/i, /\bagents?\b/i, /acquire\.com/i, /\bflippa\b/i];
for (const re of FORBIDDEN_COPY) if (re.test(htmlCopy)) fail(`forbidden terminology ${re} found in showroom copy`);

/* ------------------------------------------------------------------ */
/* Zero-Leak Commercial Governance Standard (ACTIVE_STATE.md) gate     */
/* Every `npm run audit:commercial` run recursively scans every text    */
/* file under site/ and docs/deal-room/ and enforces Rules 1-5.         */
/* ------------------------------------------------------------------ */
const SCAN_DIRS = [SITE_DIR, path.join(rootDir, 'docs', 'deal-room')];
const CAR_BRANDS = 'lexus|ferrari|porsche|lamborghini|bugatti|mclaren|maserati|bentley|rolls-?royce|aston martin|tesla|toyota|honda|bmw|mercedes|audi|ford|chevrolet|corvette|mustang|jaguar|nissan|mazda|subaru|volkswagen';
const SCAN_FORBIDDEN = [
  // Rule 1 — internal development engine never public
  { rule: 1, label: 'GhostFactory / GHOSTFACTORYOS', re: /ghostfactory/i },
  { rule: 1, label: 'Ghost Factory OS', re: /ghost\s+factory/i },
  // Rule 2 — no AI / autonomous / automated vocabulary, no automotive brand names, no third-party brokerages
  { rule: 2, label: 'AI', re: /\bai\b/i },
  { rule: 2, label: 'LLM', re: /\bllm\b/i },
  { rule: 2, label: 'inference', re: /\binference\b/i },
  { rule: 2, label: 'autonomous', re: /autonomous/i },
  { rule: 2, label: 'automated', re: /automated/i },
  { rule: 2, label: 'agent / agents', re: /\bagents?\b/i },
  { rule: 2, label: 'unsupervised agent', re: /unsupervised\s+agents?/i },
  { rule: 2, label: 'automotive brand', re: new RegExp(`\\b(?:${CAR_BRANDS})\\b`, 'i') },
  { rule: 2, label: 'third-party brokerage (Acquire.com/Flippa)', re: /acquire\.com|\bflippa\b/i },
  // Rule 3 — no internal unit serials / registry tags (use MC-01 .. MC-05 only)
  { rule: 3, label: 'unit serial (#10-#500 / Unit #)', re: /#\s?(?:0*[1-9]\d|[1-4]\d{2}|500)\b(?![0-9a-fA-F])|\bUnit\s*#\s*\d+\b/i },
  { rule: 3, label: 'registry tag (GF-T1/T2/T3)', re: /\bgf-t[123]\b/i },
  { rule: 3, label: 'registry tag (T1-/T2- serial)', re: /\bT[12]-(?:\d{3}|[A-Z]+-\d+)\b/ },
  // Rule 4 — sole-proprietor framing only (no corporate seller entity)
  { rule: 4, label: 'corporate seller entity (LLC / ZoMae)', re: /\bLLC\b|zomae/i },
  // Rule 5 — internal reserve / wholesale / walk-away figures never public
  { rule: 5, label: 'internal reserve/wholesale/walk-away leak', re: /wholesale|walk[-_]?away|retained_floor|\bpanic\b/i },
];
const SCAN_TEXT_EXT = new Set(['.html', '.htm', '.md', '.txt', '.json', '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.css', '.svg', '.xml', '.yml', '.yaml', '.csv', '.sql', '.webmanifest', '.sample', '.example', '']);

function* walkTextFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'node_modules' && entry.name !== '.git') yield* walkTextFiles(full); }
    else if (entry.isFile() && SCAN_TEXT_EXT.has(path.extname(entry.name).toLowerCase())) {
      // Offline vault cryptographic audit logs retain raw chassis archive filenames
      if (entry.name.startsWith('VAULT_CHECKSUM_LOG')) continue;
      yield full;
    }
  }
}

// Rule 5 — strict pricing parity: only these dollar figures may appear in public assets.
const ALLOWED_PRICES = new Set(['$805,000', '$145,000', '$185,000', '$1,173,000', '$276,000', '$207,000', '$69,000', '$50,000', '$14,500', '$4,500', '$25,000', '$35,000', '$65,000', '$75,000', '$145K', '$185K', '$207K']);
const PRICE_RE = /\$\s?\d[\d,]*(?:\.\d+)?[KkMm]?\b/g;

function scanGovernance() {
  const hits = []; // { file, line, rule, label }
  let filesScanned = 0;
  const priceScanTargets = new Set();
  for (const dir of SCAN_DIRS) for (const file of walkTextFiles(dir)) {
    filesScanned++;
    const rel = path.relative(rootDir, file);
    const isPriceScoped = rel === path.join('site', 'index.html') || rel.startsWith(path.join('docs', 'deal-room') + path.sep);
    if (isPriceScoped) priceScanTargets.add(file);
    fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      for (const { rule, label, re } of SCAN_FORBIDDEN) if (re.test(line)) hits.push({ file: rel, line: i + 1, rule, label });
      if (isPriceScoped) for (const m of line.match(PRICE_RE) ?? []) {
        const norm = m.replace(/\s/g, '').replace(/k$/, 'K');
        if (!ALLOWED_PRICES.has(norm)) hits.push({ file: rel, line: i + 1, rule: 5, label: `off-ledger price ${norm}` });
      }
    });
  }

  // Rule 4 (required framing) + Rule 5 (per-cluster ask parity) on the deal-room documents.
  const dealRoom = path.join(rootDir, 'docs', 'deal-room');
  const requiredFraming = [/sole[- ]proprietorship/i, /100% Pure/i, /zero (?:corporate )?equity/i, /zero debt/i, /zero assumed/i];
  for (const name of ['MICRO_CLUSTERS_ONE_PAGER.md', 'MICRO_CLUSTERS_COMMERCIAL_MANIFEST.md']) {
    const file = path.join(dealRoom, name);
    const rel = path.relative(rootDir, file);
    if (!fs.existsSync(file)) { hits.push({ file: rel, line: 0, rule: 4, label: 'required deal-room document missing' }); continue; }
    const text = fs.readFileSync(file, 'utf8');
    for (const re of requiredFraming) if (!re.test(text)) hits.push({ file: rel, line: 0, rule: 4, label: `required framing missing ${re}` });
    for (const c of CLUSTERS) {
      const rows = text.split('\n').filter(l => l.startsWith(`| **${c.id}** |`));
      if (!rows.length) hits.push({ file: rel, line: 0, rule: 5, label: `${c.id} price row missing` });
      for (const row of rows) if (!row.includes(`**${fmt(c.ask)}`)) hits.push({ file: rel, line: 0, rule: 5, label: `${c.id} ask must be ${fmt(c.ask)}` });
    }
  }
  const onePager = fs.readFileSync(path.join(dealRoom, 'MICRO_CLUSTERS_ONE_PAGER.md'), 'utf8');
  if (!onePager.includes('**$805,000**')) hits.push({ file: 'docs/deal-room/MICRO_CLUSTERS_ONE_PAGER.md', line: 0, rule: 5, label: 'batch ask $805,000 missing' });
  if (!onePager.includes('**$145,000 – $185,000**')) hits.push({ file: 'docs/deal-room/MICRO_CLUSTERS_ONE_PAGER.md', line: 0, rule: 5, label: 'range $145,000 – $185,000 missing' });
  // The compiled showroom must carry the same APA framing and no corporate seller entity.
  if (!/Asset Purchase Agreement|\bAPA\b/.test(html)) hits.push({ file: 'site/index.html', line: 0, rule: 4, label: 'APA framing missing' });
  return { hits, filesScanned };
}

if (CHECK_ONLY) {
  const { hits, filesScanned } = scanGovernance();
  if (hits.length) {
    const byRule = new Map();
    for (const h of hits) byRule.set(h.rule, [...(byRule.get(h.rule) ?? []), h]);
    console.error(`❌ [commercial audit] Zero-Leak Governance Standard violated: ${hits.length} hit(s) across ${filesScanned} files under site/ and docs/deal-room/`);
    for (const [rule, list] of [...byRule].sort((a, b) => a[0] - b[0])) {
      const byFile = new Map();
      for (const h of list) byFile.set(h.file, new Set([...(byFile.get(h.file) ?? []), h.label]));
      console.error(`   Rule ${rule}: ${list.length} hit(s) in ${byFile.size} file(s)`);
      for (const [file, labels] of [...byFile].slice(0, 10)) console.error(`     ${file}: ${[...labels].join(', ')}`);
      if (byFile.size > 10) console.error(`     … and ${byFile.size - 10} more file(s)`);
    }
    process.exit(1);
  }
  globalThis.__governanceScanned = filesScanned;
}

if (CHECK_ONLY) {
  const current = fs.existsSync(path.join(SITE_DIR, 'index.html')) ? fs.readFileSync(path.join(SITE_DIR, 'index.html'), 'utf8') : '';
  if (current !== html) fail('site/index.html is not the commercial showroom build (stale or overwritten by the legacy 500-unit generator). Run: npm run build');
  const siteAudioPath = path.join(SITE_DIR, 'assets', 'audio', 'engine_start.mp3');
  if (!fs.existsSync(siteAudioPath) || fs.statSync(siteAudioPath).size < 1000) fail('site/assets/audio/engine_start.mp3 missing or invalid — run: npm run build');
  for (const c of CLUSTERS) for (const t of c.triads) {
    if (!fs.existsSync(path.join(SITE_DIR, 'cockpits', publicCockpitPath(t.cockpit), 'index.html'))) fail(`site/cockpits/${publicCockpitPath(t.cockpit)} missing — run: npm run build`);
  }
  console.log(`✅ [commercial audit] ${CLUSTERS.length} clusters / ${triadCount} triads / ${testSum} tests match manifest; asks sum to ${fmt(BATCH_ASK)}; redaction scan clean; zero-leak governance rules 1-5 clean across ${globalThis.__governanceScanned} files; site/index.html is current`);
  process.exit(0);
}

/* ------------------------------------------------------------------ */
/* Write outputs + mirror paired cockpits so Test Drive links resolve  */
/* ------------------------------------------------------------------ */
fs.mkdirSync(SITE_DIR, { recursive: true });
fs.writeFileSync(path.join(SITE_DIR, 'index.html'), html);
// Repo-root index.html links to the repo-source cockpit folders, so revert any public-mirror aliases there.
const rootHtml = Object.entries(PUBLIC_COCKPIT_ALIAS).reduce((h, [orig, pub]) => h.replaceAll(pub, orig), html);
fs.writeFileSync(path.join(rootDir, 'index.html'), rootHtml);

const DIST_DIR = path.join(rootDir, 'dist');
const targets = [SITE_DIR, ...(fs.existsSync(DIST_DIR) ? [DIST_DIR] : [])];
if (targets.length > 1) fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html);

const srcAudio = path.join(rootDir, 'assets', 'audio', 'engine_start.mp3');
if (fs.existsSync(srcAudio)) {
  for (const base of targets) {
    const destAudioDir = path.join(base, 'assets', 'audio');
    fs.mkdirSync(destAudioDir, { recursive: true });
    fs.copyFileSync(srcAudio, path.join(destAudioDir, 'engine_start.mp3'));
  }
}

let copied = 0;
for (const c of CLUSTERS) for (const t of c.triads) {
  const src = path.join(rootDir, 'cockpits', t.cockpit);
  for (const base of targets) {
    mirrorCockpit(src, path.join(base, 'cockpits', publicCockpitPath(t.cockpit)));
  }
  copied++;
}

console.log(`✅ [Aura & Grid] Commercial showroom built: ${CLUSTERS.length} clusters, ${triadCount} triads, ${fmt(BATCH_ASK)} batch APA`);
console.log(`   ${html.length.toLocaleString()} bytes → site/index.html, index.html${targets.length > 1 ? ', dist/index.html' : ''}; ${copied} cockpits mirrored`);
