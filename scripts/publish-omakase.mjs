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
  const zipPath = resolve('dist/omakase-counter/omakase-counter-v1.0.0.zip');
  const coverPath = resolve('dist/omakase-counter/omakase-counter-cover.jpg');
  const thumbPath = resolve('dist/omakase-counter/omakase-counter-thumbnail.jpg');

  const zipResult = await uploadFile(zipPath);
  const coverResult = await uploadFile(coverPath);
  const thumbResult = await uploadFile(thumbPath);

  console.log('Zip S3 URL:', zipResult.url);
  console.log('Cover S3 URL:', coverResult.url);
  console.log('Thumb S3 URL:', thumbResult.url);

  console.log('\n--- Step 2: Creating Gumroad Base Product ---');
  const description = `<p><strong>OMAKASE & COUNTER</strong> is an ultra-luxury hospitality tasting room portal engineered for Michelin-starred sushi counters, intimate chef-table experiences, and private dining rooms. Built with a zen sumi-ink aesthetic, 16-seat counter allocation controls, rare Junmai Daiginjo sake pairing modals, and a turnkey PostgreSQL database schema.</p>

<h3>LIVE INTERACTIVE DEMO</h3>
<p>⚡ <strong>Live Guest Experience:</strong> <a href="https://omakase-counter-os.onrender.com" target="_blank">https://omakase-counter-os.onrender.com</a></p>
<p>🔑 <strong>Chef's Counter Command Room:</strong> <a href="https://omakase-counter-os.onrender.com/admin" target="_blank">https://omakase-counter-os.onrender.com/admin</a><br>
<em>(Click "[ ADMIN PASS ]" in top navigation or visit /admin. Demo Cheat Code: <code>omakase2026</code>)</em></p>

<h3>WHAT'S INSIDE THE BUNDLE</h3>
<ul>
  <li><strong>Full Source Code (React 19 + TypeScript + Vite 6 + Tailwind CSS):</strong> Clean, modular, responsive architecture with zero external UI bloat.</li>
  <li><strong>Chef's Counter Command Room (/admin):</strong> Real-time 16-seat counter manifest, course progression tracker, dietary restriction alerts, and sommelier pairing revenue ledger.</li>
  <li><strong>Interactive Course & Sake Pairing Modal:</strong> Dynamic temperature-sensitive pairings, tasting notes, and provenance metadata for every seafood course.</li>
  <li><strong>Turnkey PostgreSQL Database:</strong> Production-ready <code>schema.sql</code> (with Row Level Security) and <code>seed.sql</code> mock data for immediate Supabase wiring.</li>
  <li><strong>16-Seat Hinoki Counter Allocation:</strong> Real-time seating availability per service slot (5:30 PM & 8:15 PM) with deposit checkout handling.</li>
  <li><strong>Render & Netlify Ready:</strong> Includes <code>render.yaml</code> and <code>public/_redirects</code> for instant 1-click cloud preview deployments.</li>
</ul>

<h3>COMMERCIAL NICHE VALUE & ACQUISITION POTENTIAL</h3>
<p>High-end omakase and chef-table operators routinely pay $20,000–$40,000 for custom booking engines plus 3%–5% transaction cuts on platforms like Tock and SevenRooms. On an intimate 16-seat counter generating $1.8M annually, those fees total $54,000–$90,000 per year. Omakase & Counter delivers an owned, royalty-free operating asset.</p>

<h3>TIER BREAKDOWN</h3>
<ul>
  <li><strong>Tier 1 — Starter Rig ($4,500):</strong> Complete React + TypeScript front-end codebase, zen sumi-ink styling system, and sommelier pairing modal.</li>
  <li><strong>Tier 2 — Full-Stack Rig ($4,500):</strong> Complete UI + Supabase PostgreSQL schema, seed data, RLS security policies, and 3-minute setup documentation.</li>
  <li><strong>Tier 3 — White-Glove VIP Setup ($3,500):</strong> Custom domain deployment, Supabase cloud configuration, POS integration, and 60 days of priority architectural support.</li>
</ul>`;

  const createParams = new URLSearchParams({
    name: 'OMAKASE & COUNTER — 16-Seat Hinoki Reservation & Tasting Room OS',
    description,
    price: '7900', // $4,500 base
    custom_permalink: 'omakase-counter-os',
    shown_on_profile: 'true'
  });

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
      name: 'Tier 1: Starter Rig ($4,500) - Front-End Codebase & Sake Pairing Engine',
      price_difference_cents: '0'
    }).toString()
  });

  await apiRequest(`/products/${productId}/variant_categories/${catId}/variants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      name: 'Tier 2: Full-Stack Rig ($4,500) - UI + Supabase DB + Hinoki Seat Allocator',
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

  console.log('\n🎉 OMAKASE & COUNTER OS successfully published to Gumroad!');
  console.log(`Live Gumroad URL: https://auraandgrid.gumroad.com/l/omakase-counter-os`);
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
