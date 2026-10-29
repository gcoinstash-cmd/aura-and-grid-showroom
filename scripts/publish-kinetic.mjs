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
  const zipResult = await uploadFile('dist/kinetic-lab/kinetic-lab-v1.0.0.zip');
  const coverResult = await uploadFile('dist/kinetic-lab/kinetic-lab-cover.jpg');
  const thumbResult = await uploadFile('dist/kinetic-lab/kinetic-lab-thumbnail.jpg');

  console.log('\n--- Step 2: Creating Gumroad Product ---');
  const description = `<h3>⚡ KINETIC LAB — High-Performance Biomechanics &amp; Athletic Testing OS</h3>
<p><strong>The premier sports science assessment portal, 1000Hz dual force plate asymmetry tracker, and laser split timing radar engineered specifically for sprint performance centers, NFL combine training facilities, and elite collegiate athletic departments.</strong></p>

<hr>

<h4>✨ What Inside the Box</h4>
<ul>
  <li><strong>Track &amp; Field Telemetry Hub</strong>: High-contrast obsidian and racing red editorial interface featuring 1000Hz force sensor feeds, sprint velocity radars (27.4 MPH peak), and live lane status.</li>
  <li><strong>Director Command Desk (Admin OS)</strong>: 1-tap passcode access (<code>kinetic2026</code>) to oversee active athlete rosters, laser split trials, RSI reactive strength indices, and team retainers.</li>
  <li><strong>Interactive Testing Scheduler</strong>: 4-step intake wizard covering 4 athletic disciplines (Sprint, Combine, Soccer, Decathlon), pre-loaded collegiate programs, and automated ticket generation.</li>
  <li><strong>Real-Time Assessment Radar</strong>: Live multi-stage status tracker (Force Plate Baseline &rarr; 3D Markerless Kinematics &rarr; Optojump Laser Timing &rarr; Certified Dossier Release).</li>
  <li><strong>Kinematic Motion Comparator</strong>: Interactive drag slider allowing coaches and biomechanists to visually compare sprint start block angles before and after lab interventions.</li>
  <li><strong>Dual-Engine Architecture</strong>: Works instantaneously out-of-the-box via LocalStorage or connects in under 3 minutes to PostgreSQL Supabase with pre-packaged schemas and Row-Level Security.</li>
</ul>

<hr>

<h4>🕹️ Test Drive the Live Rig</h4>
<ul>
  <li><strong>Live Interactive Showcase</strong>: <a href="https://kinetic-lab-os.onrender.com" target="_blank">https://kinetic-lab-os.onrender.com</a></li>
  <li><strong>Real-Time Telemetry Radar</strong>: <a href="https://kinetic-lab-os.onrender.com" target="_blank">https://kinetic-lab-os.onrender.com</a></li>
  <li><strong>Lab Director Command Desk (Admin OS)</strong>: <a href="https://kinetic-lab-os.onrender.com/admin" target="_blank">https://kinetic-lab-os.onrender.com/admin</a> (Cheat Code: <code>kinetic2026</code>)</li>
</ul>

<hr>

<h4>📦 Choose Your Rig Tier</h4>
<ul>
  <li><strong>Tier 1: Starter UI Rig ($4,500)</strong> — Complete responsive frontend codebase, obsidian athletic styling, scheduler, and local testing tracker.</li>
  <li><strong>Tier 2: Full-Stack Working Rig ($4,500)</strong> — Everything in Tier 1 + full Supabase PostgreSQL schemas, seed data, SQL migration scripts, force plate telemetry logs, and live database hooks.</li>
  <li><strong>Tier 3: White-Glove VIP Deployment ($3,500)</strong> — Complete custom server provisioning, custom domain DNS configuration, bespoke athletic facility branding, and VIP concierge onboarding.</li>
</ul>`;

  const createParams = new URLSearchParams({
    name: 'KINETIC LAB — High-Performance Biomechanics & Athletic Testing OS',
    description,
    price: '7900', // $4,500 base
    custom_permalink: 'kinetic-lab-os',
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
      name: 'Tier 1: Starter Rig ($4,500) - Front-End UI Codebase & Telemetry Engine',
      price_difference_cents: '0'
    }).toString()
  });

  await apiRequest(`/products/${productId}/variant_categories/${catId}/variants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      name: 'Tier 2: Full-Stack Rig ($4,500) - UI + Supabase DB + Force Plate Radar',
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

  console.log('\n🎉 KINETIC LAB OS successfully published to Gumroad!');
  console.log(`Live Gumroad URL: https://auraandgrid.gumroad.com/l/kinetic-lab-os`);
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
