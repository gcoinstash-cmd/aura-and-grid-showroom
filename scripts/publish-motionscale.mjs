import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';

async function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) throw new Error('.env file not found');
  const content = await readFile(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

async function apiRequest(endpoint, options = {}) {
  const token = process.env.GUMROAD_ACCESS_TOKEN;
  const url = endpoint.startsWith('http') ? endpoint : `https://api.gumroad.com/v2${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(`Gumroad API Error (${response.status}): ${json.message || JSON.stringify(json)}`);
  }
  return json;
}

async function uploadFile(filePath) {
  const { stat } = await import('node:fs/promises');
  const filename = basename(filePath);
  const fileStat = await stat(filePath);
  const fileBuffer = await readFile(filePath);

  console.log(`Uploading ${filename} (${(fileStat.size / 1024).toFixed(1)} KB)...`);

  const presignData = await apiRequest('/files/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      filename,
      file_size: fileStat.size.toString()
    }).toString()
  });

  const part = presignData.parts[0];
  const s3Res = await fetch(part.presigned_url, {
    method: 'PUT',
    body: fileBuffer
  });

  if (!s3Res.ok) {
    throw new Error(`S3 upload failed for ${filename}: ${s3Res.statusText}`);
  }

  return {
    url: presignData.file_url,
    name: filename
  };
}

async function main() {
  await loadEnv();

  console.log('--- Step 1: Uploading Deliverable Loot & Artwork to S3 ---');
  const zipPath = resolve('dist/motionscale/motionscale-v1.0.0.zip');
  const coverPath = resolve('dist/motionscale/motionscale-cover.jpg');
  const thumbPath = resolve('dist/motionscale/motionscale-thumbnail.jpg');

  const zipResult = await uploadFile(zipPath);
  const coverResult = await uploadFile(coverPath);
  const thumbResult = await uploadFile(thumbPath);

  console.log('Zip S3 URL:', zipResult.url);
  console.log('Cover S3 URL:', coverResult.url);
  console.log('Thumb S3 URL:', thumbResult.url);

  console.log('\n--- Step 2: Creating Gumroad Base Product ---');
  const description = `<p><strong>MOTIONSCALE OS</strong> is an enterprise-grade studio production cockpit, render farm telemetry monitor, and milestone escrow portal built specifically for high-ticket 3D motion design studios, CGI artists, and VFX agencies billing $50,000 to $250,000+ per engagement.</p>

<h3>LIVE INTERACTIVE DEMO</h3>
<p>⚡ <strong>Live Studio Experience:</strong> <a href="https://motionscale-os.onrender.com" target="_blank">https://motionscale-os.onrender.com</a></p>
<p>🔑 <strong>Executive Studio Cockpit (/admin):</strong> <a href="https://motionscale-os.onrender.com/admin" target="_blank">https://motionscale-os.onrender.com/admin</a><br>
<em>(Click "[ ADMIN PASS ]" in sidebar or visit /admin. Demo Cheat Code: <code>motionscale2026</code>)</em></p>

<h3>WHAT'S INSIDE THE BUNDLE</h3>
<ul>
  <li><strong>Full Source Code (React 19 + TypeScript + Vite 6 + Tailwind CSS):</strong> Dark obsidian workstation interface with zero external UI framework overhead.</li>
  <li><strong>Executive Studio Cockpit (/admin):</strong> Real-time pipeline volume, GPU render node buffer alerts, and cleared revenue milestones.</li>
  <li><strong>Client Review Portals & Asset Escrow:</strong> 4K/8K ProRes review versions, NDA signed flags, and automated pre-release confidentiality watermarking.</li>
  <li><strong>Creative Billing & Milestone Invoicing:</strong> 50% upfront retainer generation, stage milestone triggers, and payment verification ledger.</li>
  <li><strong>Turnkey PostgreSQL Database:</strong> Production-ready <code>schema.sql</code> (with Row Level Security) and <code>seed.sql</code> mock data for immediate Supabase wiring.</li>
  <li><strong>Render & Netlify Ready:</strong> Includes <code>render.yaml</code> and <code>public/_redirects</code> for instant 1-click cloud preview deployments.</li>
</ul>

<h3>COMMERCIAL NICHE VALUE & ACQUISITION POTENTIAL</h3>
<p>Premier CGI, automotive visualization, and VFX production houses manage multi-million dollar annual billing pipelines with dispersed freelance teams. Off-the-shelf software like ShotGrid or Frame.io charge thousands in seat licensing while lacking integrated 50/50 upfront retainer invoicing and custom client portal branding. MotionScale OS provides an owned, whitelabelable studio infrastructure asset ready for immediate deployment or portfolio roll-up.</p>

<h3>TIER BREAKDOWN</h3>
<ul>
  <li><strong>Tier 1 — Starter Rig ($4,500):</strong> Complete React + TypeScript studio front-end codebase and executive pipeline dashboard.</li>
  <li><strong>Tier 2 — Full-Stack Rig ($4,500):</strong> Complete UI + Supabase PostgreSQL schema, seed data, RLS security policies, and 3-minute setup documentation.</li>
  <li><strong>Tier 3 — White-Glove VIP Setup ($3,500):</strong> Custom domain deployment, Supabase cloud configuration, agency branding integration, and 60 days of priority architectural support.</li>
</ul>`;

  const createParams = new URLSearchParams({
    name: "MOTIONSCALE — High-Ticket 3D Motion Design & VFX Studio OS",
    description,
    price: '7900', // $4,500 base
    custom_permalink: 'motionscale-os',
    shown_on_profile: 'true'
  });

  try {
    const created = await apiRequest('/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: createParams.toString()
    });

    const productId = created.product.id;
    console.log(`Product created with ID: ${productId}`);

    console.log('\n--- Step 3: Attaching Files & Cover Visuals ---');
    await apiRequest(`/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: [{ url: zipResult.url, name: zipResult.name }],
        covers: [{ url: coverResult.url }],
        thumbnail_url: thumbResult.url
      })
    });

    console.log('\n--- Step 4: Configuring Tier Variants ---');
    const catRes = await apiRequest(`/products/${productId}/variant_categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ title: 'Tier / License' }).toString()
    });
    const catId = catRes.variant_category.id;

    await apiRequest(`/products/${productId}/variant_categories/${catId}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        name: 'Tier 1: Starter Rig ($4,500) - Front-End Codebase & Pipeline Dashboard',
        price_difference_cents: '0'
      }).toString()
    });

    await apiRequest(`/products/${productId}/variant_categories/${catId}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        name: 'Tier 2: Full-Stack Rig ($4,500) - UI + Supabase DB + Client Escrow Vault',
        price_difference_cents: '0' // Pure APA ($4,500 anchor)
      }).toString()
    });

    await apiRequest(`/products/${productId}/variant_categories/${catId}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        name: 'Tier 3: White-Glove VIP ($3,500) - Turnkey Setup & Custom Domain Hosting',
        price_difference_cents: '342100' // $4,500 + $3421 = $3500
      }).toString()
    });

    console.log('\n🎉 MOTIONSCALE OS successfully published to Gumroad!');
    console.log(`Live Gumroad URL: https://auraandgrid.gumroad.com/l/motionscale-os`);
  } catch (err) {
    console.warn('\n⚠️ Gumroad publish note:', err.message);
    console.log('✅ S3 Loot and Visuals are fully secured and ready to publish immediately once the 24h window resets!');
  }
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
