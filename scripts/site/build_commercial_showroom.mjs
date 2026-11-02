#!/usr/bin/env node

/**
 * Aura & Grid — 5-Cluster Commercial Acquisition Showroom Compiler
 * (F1 Pit Wall × Cyberpunk Spec Configurator, for Acquire.com buyers)
 *
 * Generates site/index.html (mirrored to root index.html and dist/index.html) as a
 * dependency-free static page: inline CSS, zero JavaScript, zero external scripts.
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
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const SITE_DIR = path.join(rootDir, 'site');
const MANIFEST_PATH = path.join(rootDir, 'docs', 'deal-room', 'MICRO_CLUSTERS_COMMERCIAL_MANIFEST.md');

// Acquire.com listing inquiry target. Override with ACQUIRE_LISTING_URL once the live listing URL exists.
const ACQUIRE_URL = process.env.ACQUIRE_LISTING_URL || 'https://acquire.com/';

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
    buyers: 'AI inference infrastructure, LLM serving platforms, GPU cloud operators',
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
    buyers: 'AI orchestration engines, high-concurrency API gateways, quantitative trading desks',
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
    buyers: 'Edge AI device makers, embedded robotics, on-premise compute centers',
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
    buyers: 'Hyperscale cluster architects, distributed training operators, decentralized compute networks',
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
    buyers: 'Autonomous vehicle systems, mission-critical edge computing, low-latency FinTech',
    triads: [
      { n: 344, engine: 'CUDA Graph Capture & Kernel Launch Serializer', t2: 'BOT-05', cockpit: 'batch-delta/05-bot-mitigation', tests: 5 },
      { n: 349, engine: 'FP8 Mixed-Precision Tensor Core & Scaled Dot-Product', t2: 'POLICY-15', cockpit: 'batch-echo/15-policy-enforcement-grid', tests: 7 },
      { n: 351, engine: 'Zero-Copy Unified Memory & Host-Device Interlock', t2: 'PILOT-01', cockpit: 'batch-golf/01-autonomous-pilot-telemetry', tests: 6 },
    ],
  },
];

const STACK = ['FastAPI', 'Python 3.11', 'React 19', 'PostgreSQL 16 RLS'];

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
  const ids = [...sec.matchAll(/\*\*GF-T3-(\d{3})\*\*/g)].map(m => +m[1]);
  if (ids.join() !== c.triads.map(t => t.n).join()) fail(`${c.id} unit IDs differ from manifest: ${ids} vs ${c.triads.map(t => t.n)}`);
  if (!sec.includes(`**Standalone Micro-Cluster APA Asking Anchor**: **${fmt(c.ask)} USD**`)) fail(`${c.id} asking price differs from manifest`);
  for (const t of c.triads) {
    if (!sec.includes(`GF-T2-${t.t2}`)) fail(`${c.id} cockpit GF-T2-${t.t2} not in manifest`);
    if (!sec.includes(`(${t.tests}/${t.tests} Passed`)) fail(`#${t.n} test count ${t.tests} differs from manifest`);
    if (!fs.existsSync(path.join(rootDir, 'cockpits', t.cockpit, 'index.html'))) fail(`cockpit missing on disk: ${t.cockpit}`);
    triadCount++; testSum += t.tests;
  }
}
if (askSum !== BATCH_ASK) fail(`cluster asks sum to ${askSum}, expected ${BATCH_ASK}`);
if (triadCount !== 17 || testSum !== 105) fail(`expected 17 triads / 105 tests, got ${triadCount} / ${testSum}`);

/* ------------------------------------------------------------------ */
/* Markup                                                              */
/* ------------------------------------------------------------------ */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cockpitHref = (t) => `./cockpits/${t.cockpit}/index.html`;

const clusterCard = (c) => {
  const units = c.triads.length * 3;
  const tests = c.triads.reduce((a, t) => a + t.tests, 0);
  const lead = c.triads[0];
  return `
      <article class="card cluster" id="${c.id.toLowerCase()}" data-cluster="${c.id}">
        <header class="cluster-head">
          <span class="mc-id">${c.id}</span>
          <span class="mc-ask"><small class="text-xs font-mono text-zinc-400">ASKING</small>${fmt(c.ask)}</span>
        </header>
        <h3 class="text-xl font-extrabold text-white">${esc(c.title)}</h3>
        <p class="blurb text-sm text-zinc-300 leading-relaxed">${esc(c.blurb)}</p>
        <p class="meta-line text-xs font-mono">${c.triads.length} TRIADS // ${units} UNITS // #${c.triads.map(t => t.n).join(' #')}</p>
        <ul class="pills" aria-label="Domain tags">${c.tags.map(t => `<li class="pill pill-cyan">${esc(t)}</li>`).join('')}</ul>
        <ul class="pills" aria-label="Tech stack">${STACK.map(t => `<li class="pill pill-amber">${esc(t)}</li>`).join('')}</ul>
        <dl class="stats">
          <div><dt class="text-xs font-mono text-zinc-400">DYNO TESTS</dt><dd>${tests}/${tests} PASS</dd></div>
          <div><dt class="text-xs font-mono text-zinc-400">LICENSE</dt><dd>MIT / APACHE-2.0</dd></div>
        </dl>
        <p class="buyers text-sm text-zinc-300 leading-relaxed"><b class="text-xs font-mono text-zinc-400">TARGET ACQUIRER</b> ${esc(c.buyers)}</p>
        <details class="triads">
          <summary class="text-xs font-mono text-zinc-400">VIEW ${c.triads.length} TRIADS</summary>
          <ol>${c.triads.map(t => `
            <li><span class="uid">#${t.n}</span> ${esc(t.engine)}<br><a href="${cockpitHref(t)}" target="_blank" rel="noopener">GF-T2-${t.t2} cockpit &rarr;</a></li>`).join('')}
          </ol>
        </details>
        <div class="cta-stack flex flex-col gap-2 w-full">
          <a class="btn btn-cyan" href="${cockpitHref(lead)}" target="_blank" rel="noopener" aria-label="Test drive ${c.id} cockpit (simulated sample data)">[ TEST DRIVE COCKPIT ]<small class="text-xs font-mono">SCADA preview // simulated sample data</small></a>
          <a class="btn btn-amber" href="${ACQUIRE_URL}" target="_blank" rel="noopener" data-cluster="${c.id}" aria-label="Acquire title for ${c.id} via Acquire.com listing inquiry">[ ACQUIRE TITLE (APA) ]<small class="text-xs font-mono">Inquire on Acquire.com // ${fmt(c.ask)}</small></a>
        </div>
      </article>`;
};

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aura &amp; Grid — 5-Cluster Commercial Acquisition Showroom // Acquire.com</title>
  <meta name="description" content="5 sealed micro-clusters, 51 units (17 triads) offered as 100% pure Asset Purchase Agreement title transfers. Retail replacement benchmark ${fmt(RETAIL_BENCHMARK)}; portfolio asking price ${fmt(BATCH_ASK)}.">
  <meta name="theme-color" content="#05070B">
  <link rel="canonical" href="https://auraandgrid.com/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root{--bg:#05070B;--panel:#0B0F17;--panel2:#0F1520;--line:#1B2536;--text:#E6EAF2;--mute:#A1A1AA;--zinc200:#E4E4E7;--zinc300:#D4D4D8;--amber:#FF9F0A;--cyan:#00F0FF;--mono:'JetBrains Mono',ui-monospace,Menlo,monospace;--sans:'Inter',system-ui,sans-serif}
    *{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{background:var(--bg);color:var(--text);font-family:var(--sans);line-height:1.5;-webkit-font-smoothing:antialiased;
      background-image:linear-gradient(rgba(0,240,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,.035) 1px,transparent 1px);background-size:48px 48px}
    a{color:inherit;text-decoration:none}
    ul,ol{list-style:none}
    /* utilities used by the CTA stack */
    .flex{display:flex}.flex-col{flex-direction:column}.gap-2{gap:.5rem}.w-full{width:100%}
    /* typography & spacing utilities (Tailwind-equivalent scale) */
    .text-xs{font-size:.75rem;line-height:1rem}.text-sm{font-size:.875rem;line-height:1.5}.text-base{font-size:1rem;line-height:1.5rem}.text-lg{font-size:1.125rem;line-height:1.75rem}.text-xl{font-size:1.25rem;line-height:1.75rem}
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
    .badge{font-family:var(--mono);letter-spacing:.04em;border:1px solid var(--amber);color:var(--amber);background:rgba(255,159,10,.08);border-radius:999px;white-space:nowrap}
    .nav-status{font-family:var(--mono);letter-spacing:.04em;color:var(--cyan);background:rgba(0,240,255,.06);border:1px solid rgba(0,240,255,.32);border-radius:999px;justify-self:center;text-align:center;text-shadow:0 0 12px rgba(0,240,255,.4);white-space:nowrap}
    .nav-right{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:nowrap}
    .gate{font-family:var(--mono);letter-spacing:.04em;border:1px solid var(--cyan);color:var(--cyan);background:rgba(0,240,255,.06);border-radius:999px;white-space:nowrap}
    .gate::before{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--cyan);margin-right:8px;box-shadow:0 0 8px var(--cyan);vertical-align:middle}
    .price-pill{font-family:var(--mono);letter-spacing:.04em;font-weight:800;background:var(--amber);color:#05070B;border-radius:999px;white-space:nowrap;box-shadow:0 0 18px rgba(255,159,10,.38)}

    main{max-width:1480px;margin:0 auto;padding:44px 24px 72px}
    .eyebrow{font-family:var(--mono);font-size:.8125rem;letter-spacing:.18em;color:var(--cyan);margin-bottom:12px}
    h1{font-size:clamp(2rem,4vw,3.15rem);font-weight:800;letter-spacing:-.02em;line-height:1.12;max-width:26ch;color:#fff}
    h1 span{color:var(--amber)}
    .lede{max-width:68ch;margin-top:16px}
    section{margin-top:44px}
    .section-label{font-family:var(--mono);font-size:.8125rem;letter-spacing:.16em;color:var(--mute);margin-bottom:16px}

    /* bento */
    .card{background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:14px;padding:24px}
    .metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
    .metric .val{font-family:var(--mono);font-weight:800;font-size:clamp(1.7rem,3vw,2.5rem);letter-spacing:-.02em}
    .metric .name{font-weight:700;font-size:1.1rem;color:#fff;margin-top:8px}
    .metric .sub{font-size:.8125rem;letter-spacing:.04em;margin-top:6px;line-height:1.5}
    .metric.m-cyan{border-color:rgba(0,240,255,.4)}.metric.m-cyan .val{color:var(--cyan);text-shadow:0 0 20px rgba(0,240,255,.35)}
    .metric.m-amber{border-color:rgba(255,159,10,.55);box-shadow:0 0 30px rgba(255,159,10,.08)}.metric.m-amber .val{color:var(--amber);text-shadow:0 0 20px rgba(255,159,10,.35)}
    .metric.m-white .val{color:#fff}

    /* clusters */
    .grid{display:grid;grid-template-columns:repeat(6,1fr);gap:18px}
    .cluster{grid-column:span 2;display:flex;flex-direction:column;gap:14px}
    .cluster:nth-child(n+4){grid-column:span 3}
    .cluster-head{display:flex;justify-content:space-between;align-items:center;gap:12px}
    .mc-id{font-family:var(--mono);font-weight:800;font-size:.875rem;letter-spacing:.12em;color:var(--cyan);border:1px solid rgba(0,240,255,.45);border-radius:6px;padding:4px 10px}
    .mc-ask{font-family:var(--mono);font-weight:800;font-size:1.5rem;color:var(--amber);text-align:right;line-height:1.2}
    .mc-ask small{display:block;font-size:.75rem;letter-spacing:.14em;font-weight:600;margin-bottom:2px}
    .cluster h3{line-height:1.32;letter-spacing:-.01em}
    .cluster .blurb{font-size:.9375rem}
    .meta-line{font-size:.78125rem;letter-spacing:.04em;color:var(--cyan);word-break:break-word;line-height:1.5}
    .pills{display:flex;flex-wrap:wrap;gap:7px}
    .pill{font-family:var(--mono);font-size:.75rem;font-weight:600;letter-spacing:.02em;padding:4px 11px;border-radius:999px;border:1px solid var(--line)}
    .pill-cyan{color:var(--cyan);border-color:rgba(0,240,255,.35);background:rgba(0,240,255,.05)}
    .pill-amber{color:var(--amber);border-color:rgba(255,159,10,.35);background:rgba(255,159,10,.05)}
    .stats{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .stats div{background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:8px;padding:10px 12px}
    .stats dt{font-size:.75rem;letter-spacing:.08em}
    .stats dd{font-family:var(--mono);font-size:.875rem;font-weight:700;color:#fff;margin-top:3px}
    .buyers{font-size:.9375rem}
    .buyers b{display:block;font-size:.75rem;letter-spacing:.08em;margin-bottom:3px}
    .triads{border-top:1px solid var(--line);padding-top:12px}
    .triads summary{cursor:pointer;font-size:.78125rem;letter-spacing:.08em}
    .triads summary:hover{color:var(--cyan)}
    .triads ol{margin-top:10px;display:flex;flex-direction:column;gap:12px;font-size:.875rem;line-height:1.55;color:var(--zinc300)}
    .triads .uid{font-family:var(--mono);font-weight:700;color:var(--amber);margin-right:4px}
    .triads a{font-family:var(--mono);font-size:.78125rem;color:var(--cyan)}
    .triads a:hover{text-decoration:underline}
    .cta-stack{margin-top:auto;padding-top:8px}
    .btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;width:100%;min-height:62px;padding:12px 16px;border-radius:10px;font-family:var(--mono);font-weight:800;font-size:.9rem;letter-spacing:.06em;text-align:center;transition:box-shadow .15s,transform .15s,background .15s}
    .btn small{font-size:.75rem;font-weight:500;letter-spacing:.02em;opacity:.92}
    .btn:hover{transform:translateY(-1px)}
    .btn:focus-visible,.brand:focus-visible,.triads summary:focus-visible,.triads a:focus-visible{outline:2px solid #fff;outline-offset:2px;border-radius:4px}
    .btn-cyan{border:1px solid var(--cyan);color:var(--cyan);background:rgba(0,240,255,.06)}
    .btn-cyan:hover{background:rgba(0,240,255,.14);box-shadow:0 0 20px rgba(0,240,255,.3)}
    .btn-amber{background:var(--amber);color:#05070B;border:1px solid var(--amber)}
    .btn-amber:hover{box-shadow:0 0 22px rgba(255,159,10,.5)}

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
    .leading-relaxed{line-height:1.625}

    @media (max-width:1420px){
      .nav-in{grid-template-columns:1fr auto;gap:10px 16px}
      .nav-status{grid-column:1 / -1;order:3;justify-self:center}
    }
    @media (max-width:1180px){
      .grid{grid-template-columns:repeat(2,minmax(0,1fr))}
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
      .metrics{grid-template-columns:minmax(0,1fr)}
      .grid{grid-template-columns:minmax(0,1fr)}
      .cluster,.cluster:last-child{grid-column:span 1}
      main{padding:28px 16px 48px}
      .foot-in{padding:28px 16px 48px}
      .nav-in{padding:12px 16px}
    }
    @media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.btn,.transition-colors{transition:none}}
  </style>
</head>
<body>
  <header class="nav">
    <div class="nav-in">
      <div class="nav-left">
        <a href="#" class="brand text-lg font-black tracking-wider text-white cursor-pointer hover:text-amber-400 transition-colors duration-200">AURA <b>&amp;</b> GRID</a>
        <span class="badge text-xs md:text-sm font-semibold py-1.5 px-3.5">COMMERCIAL LOT // ACQUIRE.COM</span>
      </div>
      <div class="nav-status text-xs md:text-sm font-semibold py-1.5 px-3.5">5 SEALED MICRO-CLUSTERS // 51 PRODUCTION UNITS (17 TRIADS)</div>
      <div class="nav-right">
        <span class="gate text-xs md:text-sm font-semibold py-1.5 px-3.5">4/4 VERIFIED GATES</span>
        <span class="price-pill text-xs md:text-sm font-semibold py-1.5 px-3.5">${fmt(BATCH_ASK)} BATCH APA</span>
      </div>
    </div>
  </header>

  <main>
    <p class="eyebrow">GHOSTFACTORYOS × AURA &amp; GRID // COMMERCIAL ACQUISITION SHOWROOM</p>
    <h1>Next-gen inference infrastructure, <span>sold as clean title.</span></h1>
    <p class="lede text-lg text-zinc-200 font-medium leading-relaxed">17 triads — each a containerized Track 3 FastAPI engine, a Track 2 SCADA cockpit and a Track 1 React 19 utility — sealed into 5 micro-clusters. One Asset Purchase Agreement. Full source, schemas and deployment rights.</p>

    <section aria-labelledby="fin-label">
      <p class="section-label" id="fin-label">// FINANCIAL TELEMETRY</p>
      <div class="metrics">
        <div class="card metric m-cyan">
          <div class="val">${fmt(RETAIL_BENCHMARK)}</div>
          <div class="name">Retail Replacement Benchmark</div>
          <div class="sub text-xs font-mono text-zinc-400">ASC 350-40 SCOPE // COST-TO-REBUILD, 17 TRIADS</div>
        </div>
        <div class="card metric m-amber">
          <div class="val">${fmt(BATCH_ASK)}</div>
          <div class="name">Official 5-Cluster Portfolio Asking Price</div>
          <div class="sub text-xs font-mono text-zinc-400">100% PURE APA</div>
        </div>
        <div class="card metric m-white">
          <div class="val">100% Pure APA</div>
          <div class="name">Sovereign Title Transfer</div>
          <div class="sub text-xs font-mono text-zinc-400">ZERO LICENSES // ZERO SEAT FEES</div>
        </div>
      </div>
    </section>

    <section aria-labelledby="mc-label">
      <p class="section-label" id="mc-label">// 5 SEALED MICRO-CLUSTERS — BUY ALL FIVE OR ANY ONE</p>
      <div class="grid">${CLUSTERS.map(clusterCard).join('')}
      </div>
    </section>
  </main>

  <footer aria-labelledby="foot-label">
    <div class="foot-in">
      <p class="section-label" id="foot-label">// DEAL TERMS &amp; COMMERCIAL GOVERNANCE</p>
      <div class="foot-grid">
        <div class="foot-card fc-amber border border-zinc-800 bg-[#080B10] rounded-xl p-6">
          <div class="foot-badge-row"><span class="foot-pill pill-amber text-xs font-mono font-bold py-1 px-2.5">ESCROW &amp; TITLE</span></div>
          <h2 class="foot-title text-base md:text-lg font-black text-white tracking-wide mb-3">// THE TRANSACTION (100% PURE APA)</h2>
          <ul class="foot-list text-sm md:text-base text-zinc-200 leading-relaxed space-y-2.5">
            <li>Sovereign IP Title Transfer via Acquire.com Escrow</li>
            <li>5-Business-Day Technical Dyno Inspection Period</li>
            <li>Full source code, deployment scripts, and database schemas included</li>
            <li>Zero recurring seat fees or software licensing traps</li>
          </ul>
        </div>
        <div class="foot-card border border-zinc-800 bg-[#080B10] rounded-xl p-6">
          <div class="foot-badge-row"><span class="foot-pill pill-cyan text-xs font-mono font-bold py-1 px-2.5">IP BOUNDARY</span></div>
          <h2 class="foot-title text-base md:text-lg font-black text-white tracking-wide mb-3">// RESERVED INTELLECTUAL PROPERTY</h2>
          <ul class="foot-list text-sm md:text-base text-zinc-200 leading-relaxed space-y-2.5">
            <li>Carve-out applies strictly to the acquired micro-cluster units</li>
            <li>Ghost Factory OS and Aura &amp; Grid master brands remain private</li>
            <li>Shared design tokens and future platform roadmaps are excluded</li>
            <li>Clean asset sale: zero corporate equity or liabilities conveyed</li>
          </ul>
        </div>
        <div class="foot-card border border-zinc-800 bg-[#080B10] rounded-xl p-6">
          <div class="foot-badge-row"><span class="foot-pill pill-cyan text-xs font-mono font-bold py-1 px-2.5">105/105 DYNO GATES</span></div>
          <h2 class="foot-title text-base md:text-lg font-black text-white tracking-wide mb-3">// THE SPEC SHEET &amp; PRODUCT TRUTH</h2>
          <ul class="foot-list text-sm md:text-base text-zinc-200 leading-relaxed space-y-2.5">
            <li>Turnkey pre-revenue software engineering assets</li>
            <li>105/105 automated unit and dyno test gates verified passing</li>
            <li>Cockpits run interactive deterministic previews with simulated data</li>
            <li>All listed asking prices are pure asset buyout anchors</li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</body>
</html>
`;

/* ------------------------------------------------------------------ */
/* Redaction + anti-clutter scan on compiled output                    */
/* ------------------------------------------------------------------ */
const FORBIDDEN = [
  /595,?000/, /829,?600/, /\bpanic\b/i, /wholesale/i, /walk-?away/i, /\bfloors?\b/i, /\breserve\b/i,
  /JUMP TO FLEET LOT/i, /YAW\s*-?\d+/i, /SCAN SCHEMATIC/i, /TELEMETRY BLUEPRINTS/i, /V3\.2/i,
  /production-ready/i, /enterprise-grade/i,
];
for (const re of FORBIDDEN) if (re.test(html)) fail(`forbidden pattern ${re} found in compiled markup`);

if (CHECK_ONLY) {
  const current = fs.existsSync(path.join(SITE_DIR, 'index.html')) ? fs.readFileSync(path.join(SITE_DIR, 'index.html'), 'utf8') : '';
  if (current !== html) fail('site/index.html is not the commercial showroom build (stale or overwritten by the legacy 500-unit generator). Run: npm run build');
  for (const c of CLUSTERS) for (const t of c.triads) {
    if (!fs.existsSync(path.join(SITE_DIR, 'cockpits', t.cockpit, 'index.html'))) fail(`site/cockpits/${t.cockpit} missing — run: npm run build`);
  }
  console.log(`✅ [commercial audit] ${CLUSTERS.length} clusters / ${triadCount} triads / ${testSum} tests match manifest; asks sum to ${fmt(BATCH_ASK)}; redaction scan clean; site/index.html is current`);
  process.exit(0);
}

/* ------------------------------------------------------------------ */
/* Write outputs + mirror paired cockpits so Test Drive links resolve  */
/* ------------------------------------------------------------------ */
fs.mkdirSync(SITE_DIR, { recursive: true });
fs.writeFileSync(path.join(SITE_DIR, 'index.html'), html);
fs.writeFileSync(path.join(rootDir, 'index.html'), html);

const DIST_DIR = path.join(rootDir, 'dist');
const targets = [SITE_DIR, ...(fs.existsSync(DIST_DIR) ? [DIST_DIR] : [])];
if (targets.length > 1) fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html);

let copied = 0;
for (const c of CLUSTERS) for (const t of c.triads) {
  const src = path.join(rootDir, 'cockpits', t.cockpit);
  for (const base of targets) {
    fs.cpSync(src, path.join(base, 'cockpits', t.cockpit), { recursive: true });
  }
  copied++;
}

console.log(`✅ [Aura & Grid] Commercial showroom built: ${CLUSTERS.length} clusters, ${triadCount} triads, ${fmt(BATCH_ASK)} batch APA`);
console.log(`   ${html.length.toLocaleString()} bytes → site/index.html, index.html${targets.length > 1 ? ', dist/index.html' : ''}; ${copied} cockpits mirrored`);
