import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_DIR = process.cwd();
const VAULTS_DIR = path.join(BASE_DIR, 'dist', 'vaults');

function generateCoverHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,700;0,6..96,900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,700;1,6..72,400&family=Plus+Jakarta+Sans:wght@700;800&family=Space+Grotesk:wght@600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1280px;
    height: 720px;
    background: #08090A;
    background-image: 
      radial-gradient(circle at 15% 15%, rgba(197, 168, 128, 0.22) 0%, transparent 45%),
      radial-gradient(circle at 85% 85%, rgba(6, 182, 212, 0.12) 0%, transparent 45%),
      radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.06) 0%, transparent 60%);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: #F4F4F5;
    position: relative;
    overflow: hidden;
    padding: 38px 52px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  /* Matrix grid pattern overlay */
  .grid-pattern {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
    z-index: 0;
  }

  .content-layer {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: space-between;
  }

  /* Header Section */
  .header-stack {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .badge-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    background: rgba(197, 168, 128, 0.1);
    border: 1px solid #C5A880;
    color: #C5A880;
    margin-bottom: 8px;
  }
  .badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #C5A880;
    box-shadow: 0 0 8px #C5A880;
  }

  .headline-main {
    font-family: 'Newsreader', Georgia, serif;
    font-size: 38px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #FFFFFF;
    line-height: 1.1;
    text-shadow: 0 4px 20px rgba(0,0,0,0.6);
  }

  .subheadline {
    font-size: 15px;
    font-weight: 500;
    color: #A1A1AA;
    margin-top: 4px;
    letter-spacing: -0.01em;
  }

  .edition-badge {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(197, 168, 128, 0.4);
    padding: 10px 18px;
    border-radius: 6px;
    text-align: right;
  }
  .edition-val {
    font-size: 18px;
    font-weight: 800;
    color: #C5A880;
    font-family: 'JetBrains Mono', monospace;
  }
  .edition-sub {
    font-size: 10px;
    font-weight: 600;
    color: #71717A;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* 3-Dashboard Elevated Stack */
  .trio-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin: 16px 0;
  }

  .dashboard-card {
    background: #0E1013;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.85), 0 0 0 1px rgba(255, 255, 255, 0.04);
    display: flex;
    flex-direction: column;
  }

  .card-topbar {
    background: #14171C;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .topbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dots { display: flex; gap: 4px; }
  .dot { width: 7px; height: 7px; border-radius: 50%; }
  .dot-r { background: #FF5F56; }
  .dot-y { background: #FFBD2E; }
  .dot-g { background: #27C93F; }

  .sector-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .sector-title.gold { color: #C5A880; }
  .sector-title.cyan { color: #00F2FE; }
  .sector-title.blue { color: #3B82F6; }

  .status-tag {
    font-size: 9px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    padding: 2px 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.06);
    color: #10B981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .card-body {
    padding: 12px 14px;
    font-size: 11px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-grow: 1;
    justify-content: space-around;
  }

  .app-name-row {
    font-family: 'Newsreader', Georgia, serif;
    font-size: 15px;
    font-weight: 700;
    color: #FFFFFF;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding-bottom: 6px;
  }

  .data-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10.5px;
  }
  .data-left {
    color: #D4D4D8;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;
  }
  .data-right {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    color: #C5A880;
    font-size: 10px;
  }
  .data-right.cyan { color: #00F2FE; }
  .data-right.blue { color: #38BDF8; }

  .spec-chip-row {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 4px;
    padding: 5px 8px;
    font-size: 9.5px;
    color: #71717A;
    font-family: 'JetBrains Mono', monospace;
    display: flex;
    justify-content: space-between;
  }

  /* Footer Section */
  .footer-stack {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 12px;
  }

  .proof-badges {
    display: flex;
    gap: 8px;
  }
  .badge-chip {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    padding: 5px 12px;
    font-size: 11px;
    font-weight: 600;
    color: #E4E4E7;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .guarantee-tag {
    font-size: 12px;
    font-weight: 600;
    color: #A1A1AA;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .guarantee-tag strong {
    color: #C5A880;
  }
</style>
</head>
<body>
  <div class="grid-pattern"></div>
  <div class="content-layer">
    <!-- Header -->
    <div class="header-stack">
      <div>
        <div class="badge-pill">
          <div class="badge-dot"></div>
          GHOST FACTORY™ FOUNDRY • AGENCY WHITELABEL VAULT
        </div>
        <h1 class="headline-main">85 PRODUCTION-READY OPERATING SYSTEM BLUEPRINTS</h1>
        <p class="subheadline">Turnkey Enterprise Foundry for High-Ticket Agencies & Micro-Holding Companies</p>
      </div>
      <div class="edition-badge">
        <div class="edition-val">85 SYSTEMS</div>
        <div class="edition-sub">UNLIMITED Asset Purchase Agreement (APA) title transfer</div>
      </div>
    </div>

    <!-- 3 Multi-Device Vertical Dashboards -->
    <div class="trio-grid">
      <!-- 1. Legal Docket -->
      <div class="dashboard-card">
        <div class="card-topbar">
          <div class="topbar-left">
            <div class="dots"><div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div></div>
            <span class="sector-title gold">LEGAL & WEALTH DOSSIER</span>
          </div>
          <span class="status-tag">RLS SECURED</span>
        </div>
        <div class="card-body">
          <div class="app-name-row">Litigation Ops OS</div>
          <div class="data-row">
            <span class="data-left">Case #24-CV-8821: Apex Bio v. Horizon</span>
            <span class="data-right">$42.5M CLAIM</span>
          </div>
          <div class="data-row">
            <span class="data-left">Case #24-BK-4019: In re Vanguard (VDR)</span>
            <span class="data-right">$18.2M ASSET</span>
          </div>
          <div class="spec-chip-row">
            <span>TABLES: 4 (RLS ON)</span>
            <span>PASSKEY: litigation2026</span>
          </div>
        </div>
      </div>

      <!-- 2. Clinical Vanguard -->
      <div class="dashboard-card">
        <div class="card-topbar">
          <div class="topbar-left">
            <div class="dots"><div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div></div>
            <span class="sector-title cyan">CLINICAL VANGUARD</span>
          </div>
          <span class="status-tag">TELEMETRY LIVE</span>
        </div>
        <div class="card-body">
          <div class="app-name-row">Hyperbaric & Recovery Lab OS</div>
          <div class="data-row">
            <span class="data-left">Suite 01: Hyperbaric 2.0 ATA (90m)</span>
            <span class="data-right cyan">IN SESSION</span>
          </div>
          <div class="data-row">
            <span class="data-left">Suite 02: Whole-Body Cryo (-160°F)</span>
            <span class="data-right cyan">RESERVED 2:30</span>
          </div>
          <div class="spec-chip-row">
            <span>TABLES: 4 (RLS ON)</span>
            <span>PASSKEY: recovery2026</span>
          </div>
        </div>
      </div>

      <!-- 3. Trade Dispatch -->
      <div class="dashboard-card">
        <div class="card-topbar">
          <div class="topbar-left">
            <div class="dots"><div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div></div>
            <span class="sector-title blue">COMMAND CENTER</span>
          </div>
          <span class="status-tag">ACTIVE QUEUE</span>
        </div>
        <div class="card-body">
          <div class="app-name-row">Apex Electric Dispatch OS</div>
          <div class="data-row">
            <span class="data-left">Truck #04: Commercial 480V Service</span>
            <span class="data-right blue">DISPATCHED</span>
          </div>
          <div class="data-row">
            <span class="data-left">Truck #08: 3-Phase Transformer Sizing</span>
            <span class="data-right blue">IN ROUTE</span>
          </div>
          <div class="spec-chip-row">
            <span>TABLES: 4 (RLS ON)</span>
            <span>PASSKEY: electric2026</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-stack">
      <div class="proof-badges">
        <div class="badge-chip">⚡ React 19 + Tailwind CSS</div>
        <div class="badge-chip">🗄️ Supabase PostgreSQL + RLS Active</div>
        <div class="badge-chip">🔑 1-Click Valet Showcase Keys</div>
        <div class="badge-chip">📦 7.3 MB Clean Standalone Source</div>
      </div>
      <div class="guarantee-tag">
        <span>COMMERCIAL AGENCY LICENSE:</span> <strong>UNLIMITED CLIENT DEPLOYS</strong>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateThumbnailHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,700;1,6..72,400&family=Plus+Jakarta+Sans:wght@700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 600px;
    height: 600px;
    background: #08090A;
    background-image: 
      radial-gradient(circle at 50% 20%, rgba(197, 168, 128, 0.28) 0%, transparent 60%),
      radial-gradient(circle at 50% 85%, rgba(6, 182, 212, 0.12) 0%, transparent 50%);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: #F4F4F5;
    position: relative;
    overflow: hidden;
    padding: 36px 32px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
  }

  .badge-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 14px;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    background: rgba(197, 168, 128, 0.1);
    border: 1px solid #C5A880;
    color: #C5A880;
    margin: 0 auto 6px auto;
  }

  .main-title {
    font-family: 'Newsreader', Georgia, serif;
    font-size: 30px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #FFFFFF;
    line-height: 1.15;
    margin-bottom: 4px;
  }

  .subtitle {
    font-size: 12px;
    color: #A1A1AA;
    font-weight: 500;
    max-width: 440px;
    margin: 0 auto 12px auto;
  }

  /* Centered Vault Core Emblem */
  .vault-core {
    background: #0E1013;
    border: 1px solid rgba(197, 168, 128, 0.35);
    border-radius: 12px;
    padding: 20px 24px;
    box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.9), 0 0 24px rgba(197, 168, 128, 0.08);
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 12px;
  }

  .emblem-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 10px;
  }

  .badge-85 {
    background: linear-gradient(135deg, #D4AF37 0%, #C5A880 100%);
    color: #08090A;
    font-weight: 900;
    font-size: 20px;
    font-family: 'JetBrains Mono', monospace;
    padding: 6px 14px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  }

  .emblem-status {
    text-align: right;
  }
  .emblem-status-main {
    font-size: 13px;
    font-weight: 700;
    color: #FFFFFF;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .emblem-status-sub {
    font-size: 10px;
    color: #10B981;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
  }

  .verticals-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    font-size: 10.5px;
    text-align: left;
  }
  .vertical-item {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 6px 10px;
    border-radius: 4px;
    color: #D4D4D8;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .dot-gold { width: 5px; height: 5px; border-radius: 50%; background: #C5A880; }

  /* Trust Banner */
  .trust-strip {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 10px 14px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    font-size: 11px;
    font-weight: 600;
    color: #D4D4D8;
  }
  .trust-strip span {
    color: #C5A880;
    font-weight: 700;
  }
</style>
</head>
<body>
  <div>
    <div class="badge-tag">FOUNDING AGENCY VAULT</div>
    <h2 class="main-title">MASTER OPERATING SYSTEM VAULT</h2>
    <p class="subtitle">Complete Turnkey Codebase Library for Boutique Agencies</p>
  </div>

  <div class="vault-core">
    <div class="emblem-row">
      <div class="badge-85">85 APPS</div>
      <div class="emblem-status">
        <div class="emblem-status-main">ENTERPRISE FOUNDRY</div>
        <div class="emblem-status-sub">● 100% PRODUCTION VERIFIED</div>
      </div>
    </div>
    <div class="verticals-grid">
      <div class="vertical-item"><div class="dot-gold"></div> Medical & Aesthetics (50)</div>
      <div class="vertical-item"><div class="dot-gold"></div> Commercial Trades (10)</div>
      <div class="vertical-item"><div class="dot-gold"></div> Legal & Advisory (8)</div>
      <div class="vertical-item"><div class="dot-gold"></div> Luxury Hospitality (17)</div>
    </div>
  </div>

  <div class="trust-strip">
    <div>⚡ <span>React 19</span></div>
    <div>🗄️ <span>Supabase RLS</span></div>
    <div>📜 <span>Whitelabel License</span></div>
  </div>
</body>
</html>`;
}

async function run() {
  console.log('================================================================================');
  console.log(' 🎨 GHOST FACTORY™ MASTER AGENCY VAULT ASSET GENERATOR (PHASE 1)');
  console.log('================================================================================');
  console.log('🎯 Target: Founding Agency Vault (85 Turnkey OS Blueprints)');
  console.log('📐 Specs: 1280x720 Cover (16:9) | 600x600 Thumbnail (1:1)');
  console.log('🏛️ Style: Hybrid Editorial Dossier & Matrix Grid (Deep Obsidian & Burnished Gold)\n');

  const browser = await chromium.launch({ headless: true });

  // 1. Render Cover (1280x720)
  console.log('▶️ Rendering Master Vault Cover (1280x720)...');
  const pageCover = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await pageCover.setContent(generateCoverHtml(), { waitUntil: 'load' });
  await pageCover.waitForTimeout(700);
  const coverPngBuf = await pageCover.screenshot({ type: 'png' });
  const coverPath = path.join(VAULTS_DIR, 'master_agency_vault_cover.png');
  fs.writeFileSync(coverPath, coverPngBuf);
  await pageCover.close();

  // 2. Render Thumbnail (600x600)
  console.log('▶️ Rendering Master Vault Thumbnail (600x600)...');
  const pageThumb = await browser.newPage({ viewport: { width: 600, height: 600 } });
  await pageThumb.setContent(generateThumbnailHtml(), { waitUntil: 'load' });
  await pageThumb.waitForTimeout(700);
  const thumbPngBuf = await pageThumb.screenshot({ type: 'png' });
  const thumbPath = path.join(VAULTS_DIR, 'master_agency_vault_thumbnail.png');
  fs.writeFileSync(thumbPath, thumbPngBuf);
  await pageThumb.close();

  await browser.close();

  // Also stage in dist/gumroad_assets/master-agency-vault/
  const stagingDir = path.join(BASE_DIR, 'dist', 'gumroad_assets', 'master-agency-vault');
  fs.mkdirSync(stagingDir, { recursive: true });
  fs.writeFileSync(path.join(stagingDir, 'cover.png'), coverPngBuf);
  fs.writeFileSync(path.join(stagingDir, 'thumbnail.png'), thumbPngBuf);

  const coverKb = Math.round(coverPngBuf.length / 1024);
  const thumbKb = Math.round(thumbPngBuf.length / 1024);

  console.log(`\n✅ Generated Cover: ${coverPath} (${coverKb} KB)`);
  console.log(`✅ Generated Thumbnail: ${thumbPath} (${thumbKb} KB)`);
  console.log(`✅ Staged in: ${stagingDir}`);
}

run().catch(err => {
  console.error('Fatal generator error:', err);
  process.exit(1);
});
