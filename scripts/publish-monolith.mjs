import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';

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

  if (!s3Res.ok) throw new Error(`S3 upload error: ${s3Res.statusText}`);
  const etag = (s3Res.headers.get('etag') || '').replace(/"/g, '');

  const compData = await apiRequest('/files/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      upload_id: presignData.upload_id,
      key: presignData.key,
      parts: [{ part_number: 1, etag }]
    })
  });

  console.log(`Completed upload: ${compData.file_url}`);
  return { url: compData.file_url, name: filename };
}

async function main() {
  await loadEnv();

  console.log('--- Step 1: Uploading Deliverables and Visuals ---');
  const zipResult = await uploadFile('dist/monolith-studio/monolith-studio-v1.0.0.zip');
  const coverResult = await uploadFile('dist/monolith-studio/monolith-studio-cover.jpg');
  const thumbResult = await uploadFile('dist/monolith-studio/monolith-studio-thumbnail.jpg');

  console.log('\n--- Step 2: Creating Gumroad Product ---');
  const description = `<h3>🏛️ MONOLITH STUDIO — Brutalist Architecture &amp; BIM Project Portal OS</h3>
<p><strong>The premier architectural studio operating system, client review chamber, and Building Information Modeling (BIM) model repository engineered specifically for brutalist design ateliers, high-end structural engineers, and luxury commercial practices.</strong></p>

<hr>

<h4>✨ What Inside the Box</h4>
<ul>
  <li><strong>Monolithic Atelier Showcase &amp; Concrete Typologies</strong>: Brutalist editorial layout showcasing civic pavilions, cantilevered sanctuaries, and bespoke residential works with high-density architectural imagery.</li>
  <li><strong>Principal Blueprint &amp; Commission Room (Admin OS)</strong>: 1-tap passcode access (<code>monolith2026</code>) to oversee multi-million dollar active commissions, track construction phases, and inspect client milestones.</li>
  <li><strong>BIM Model Repository &amp; Clash Detection Radar</strong>: Dedicated structural revision desk tracking IFC 4.3, Revit RVT, and Rhino 3DM models with automated clash detection verification.</li>
  <li><strong>High-Ticket Milestone Billing &amp; Escrow Ledger</strong>: Track multi-stage architectural fee schedules, foundation milestone sign-offs, and escrow payment settlement states.</li>
  <li><strong>Deep Focus Architecture Chamber &amp; Studio Mode</strong>: Built-in distraction-free drawing and drafting workspace with ambient studio acoustics and milestone timers.</li>
  <li><strong>Dual-Engine Architecture</strong>: Operates instantaneously out-of-the-box via LocalStorage or seamlessly syncs with PostgreSQL Supabase via pre-configured SQL schemas with Row-Level Security.</li>
</ul>

<hr>

<h4>🕹️ Test Drive the Live Rig</h4>
<ul>
  <li><strong>Live Interactive Showcase</strong>: <a href="https://monolith-studio-os.onrender.com" target="_blank">https://monolith-studio-os.onrender.com</a></li>
  <li><strong>Architecture Atelier Archive</strong>: <a href="https://monolith-studio-os.onrender.com" target="_blank">https://monolith-studio-os.onrender.com</a></li>
  <li><strong>Principal Command Room (Admin OS)</strong>: <a href="https://monolith-studio-os.onrender.com/admin" target="_blank">https://monolith-studio-os.onrender.com/admin</a> (Cheat Code: <code>monolith2026</code>)</li>
</ul>

<hr>

<h4>📦 Choose Your Rig Tier</h4>
<ul>
  <li><strong>Tier 1: Starter UI Rig ($4,500)</strong> — Complete responsive frontend codebase, obsidian and concrete styling, project showcases, and local drafting chamber.</li>
  <li><strong>Tier 2: Full-Stack Working Rig ($4,500)</strong> — Everything in Tier 1 + full Supabase PostgreSQL schemas, seed data, SQL migration scripts, BIM revision tracker, and live database hooks.</li>
  <li><strong>Tier 3: White-Glove VIP Deployment ($3,500)</strong> — Complete custom server provisioning, custom domain DNS configuration, bespoke architectural branding, and VIP concierge onboarding.</li>
</ul>`;

  const createParams = new URLSearchParams({
    name: 'MONOLITH STUDIO — Brutalist Architecture & BIM Project Portal OS',
    description,
    price: '7900', // $4,500 base
    custom_permalink: 'monolith-studio-os',
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
      name: 'Tier 1: Starter Rig ($4,500) - Front-End UI Codebase & Design Chamber',
      price_difference_cents: '0'
    }).toString()
  });

  await apiRequest(`/products/${productId}/variant_categories/${catId}/variants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      name: 'Tier 2: Full-Stack Rig ($4,500) - UI + Supabase DB + BIM Repository OS',
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

  console.log('\n🎉 MONOLITH STUDIO OS successfully published to Gumroad!');
  console.log(`Live Gumroad URL: https://auraandgrid.gumroad.com/l/monolith-studio-os`);
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
