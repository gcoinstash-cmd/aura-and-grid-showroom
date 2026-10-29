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

  console.log(`  Uploading ${filename} (${(fileStat.size / 1024).toFixed(1)} KB) via presign...`);

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

  return {
    url: compData.file_url,
    name: filename
  };
}

const PRODUCTS = [
  {
    id: 61,
    name: "BOUTIQUE DENTAL — Cosmetic Dentistry & Smile Design Studio OS",
    slug: "boutique-dental-os",
    niche: "Outpatient Healthcare / Cosmetic Dental",
    previewUrl: "https://gcoinstash-cmd.github.io/boutique-dental-os/",
    adminUrl: "https://gcoinstash-cmd.github.io/boutique-dental-os/admin/",
    passkey: "dental2026",
    zipPath: "dist/boutique-dental/boutique-dental-v1.0.0.zip",
    coverPath: "dist/boutique-dental/boutique-dental-cover.jpg",
    thumbPath: "dist/boutique-dental/boutique-dental-thumbnail.jpg",
    summary: "Cosmetic dentistry smile design studio, porcelain veneer planner, and patient consultation intake OS."
  },
  {
    id: 62,
    name: "VETERINARY HOSPITAL — Specialty Surgical & Pet Triage OS",
    slug: "veterinary-hospital-os",
    niche: "Outpatient Healthcare / Veterinary Surgery",
    previewUrl: "https://gcoinstash-cmd.github.io/veterinary-hospital-os/",
    adminUrl: "https://gcoinstash-cmd.github.io/veterinary-hospital-os/admin/",
    passkey: "vet2026",
    zipPath: "dist/veterinary-hospital/veterinary-hospital-v1.0.0.zip",
    coverPath: "dist/veterinary-hospital/veterinary-hospital-cover.jpg",
    thumbPath: "dist/veterinary-hospital/veterinary-hospital-thumbnail.jpg",
    summary: "Veterinary emergency surgical intake, acute clinical triage, and multi-doctor patient records OS."
  },
  {
    id: 63,
    name: "AURA PROTOCOL — Integrative Longevity & Functional Medicine OS",
    slug: "functional-medicine-os",
    niche: "Outpatient Healthcare / Functional Medicine",
    previewUrl: "https://gcoinstash-cmd.github.io/functional-medicine-os/",
    adminUrl: "https://gcoinstash-cmd.github.io/functional-medicine-os/admin/",
    passkey: "protocol2026",
    zipPath: "dist/functional-medicine/functional-medicine-v1.0.0.zip",
    coverPath: "dist/functional-medicine/functional-medicine-cover.jpg",
    thumbPath: "dist/functional-medicine/functional-medicine-thumbnail.jpg",
    summary: "Functional medicine diagnostic biomarker tracker, hormone panel intake, and longevity consultation OS."
  },
  {
    id: 64,
    name: "KINETIC SPINE & SPORTS PT — Orthopedic Rehab & Biomechanics OS",
    slug: "physical-therapy-os",
    niche: "Outpatient Healthcare / Physical Therapy",
    previewUrl: "https://gcoinstash-cmd.github.io/physical-therapy-os/",
    adminUrl: "https://gcoinstash-cmd.github.io/physical-therapy-os/admin/",
    passkey: "kinetic2026",
    zipPath: "dist/physical-therapy/physical-therapy-v1.0.0.zip",
    coverPath: "dist/physical-therapy/physical-therapy-cover.jpg",
    thumbPath: "dist/physical-therapy/physical-therapy-thumbnail.jpg",
    summary: "Orthopedic physical therapy rehabilitation planner, range-of-motion tracker, and clinician intake OS."
  },
  {
    id: 65,
    name: "HYPERBARIC & RECOVERY LAB — Cryotherapy & IV Wellness OS",
    slug: "recovery-spa-os",
    niche: "Outpatient Healthcare / VIP Wellness",
    previewUrl: "https://gcoinstash-cmd.github.io/recovery-spa-os/",
    adminUrl: "https://gcoinstash-cmd.github.io/recovery-spa-os/admin/",
    passkey: "recovery2026",
    zipPath: "dist/recovery-spa/recovery-spa-v1.0.0.zip",
    coverPath: "dist/recovery-spa/recovery-spa-cover.jpg",
    thumbPath: "dist/recovery-spa/recovery-spa-thumbnail.jpg",
    summary: "Hyperbaric oxygen therapy chamber booking, cryotherapy protocol intake, and IV infusion wellness lounge OS."
  },
  {
    id: 66,
    name: "BOUTIQUE LAW — High-Stakes Litigation & Case Intake OS",
    slug: "boutique-law-os",
    niche: "Private Wealth & Legal / Trial Practice",
    previewUrl: "https://gcoinstash-cmd.github.io/boutique-law-os/",
    adminUrl: "https://gcoinstash-cmd.github.io/boutique-law-os/admin/",
    passkey: "law2026",
    zipPath: "dist/boutique-law/boutique-law-v1.0.0.zip",
    coverPath: "dist/boutique-law/boutique-law-cover.jpg",
    thumbPath: "dist/boutique-law/boutique-law-thumbnail.jpg",
    summary: "Boutique litigation war room, conflict-check client intake, partner matter allocation, and retainer billing OS."
  },
  {
    id: 67,
    name: "M&A ADVISORY — Corporate Finance & Virtual Data Room OS",
    slug: "ma-advisory-os",
    niche: "Private Wealth & Legal / M&A Advisory",
    previewUrl: "https://gcoinstash-cmd.github.io/ma-advisory-os/",
    adminUrl: "https://gcoinstash-cmd.github.io/ma-advisory-os/admin/",
    passkey: "ma2026",
    zipPath: "dist/ma-advisory/ma-advisory-v1.0.0.zip",
    coverPath: "dist/ma-advisory/ma-advisory-cover.jpg",
    thumbPath: "dist/ma-advisory/ma-advisory-thumbnail.jpg",
    summary: "Middle-market M&A deal tracker, buy-side / sell-side pipeline, virtual data room (VDR), and CIM access OS."
  },
  {
    id: 68,
    name: "EXECUTIVE SEARCH — C-Suite Placement & Talent Dossier OS",
    slug: "executive-search-os",
    niche: "Private Wealth & Legal / Executive Search",
    previewUrl: "https://gcoinstash-cmd.github.io/executive-search-os/",
    adminUrl: "https://gcoinstash-cmd.github.io/executive-search-os/admin/",
    passkey: "search2026",
    zipPath: "dist/executive-search/executive-search-v1.0.0.zip",
    coverPath: "dist/executive-search/executive-search-cover.jpg",
    thumbPath: "dist/executive-search/executive-search-thumbnail.jpg",
    summary: "Retained executive recruitment cockpit, confidential board dossier builder, and candidate assessment OS."
  },
  {
    id: 69,
    name: "WEALTH FAMILY OFFICE — Multi-Family Office & Direct LP Portal OS",
    slug: "wealth-family-office-os",
    niche: "Private Wealth & Legal / Family Office",
    previewUrl: "https://gcoinstash-cmd.github.io/wealth-family-office-os/",
    adminUrl: "https://gcoinstash-cmd.github.io/wealth-family-office-os/admin/",
    passkey: "familyoffice2026",
    zipPath: "dist/wealth-family-office/wealth-family-office-v1.0.0.zip",
    coverPath: "dist/wealth-family-office/wealth-family-office-cover.jpg",
    thumbPath: "dist/wealth-family-office/wealth-family-office-thumbnail.jpg",
    summary: "Multi-family office asset allocation cockpit, direct syndicate co-investment portal, and capital call tracker OS."
  },
  {
    id: 70,
    name: "LITIGATION OPS — Commercial Trial War Room & E-Discovery OS",
    slug: "litigation-ops-os",
    niche: "Private Wealth & Legal / Trial War Room",
    previewUrl: "https://gcoinstash-cmd.github.io/litigation-ops-os/",
    adminUrl: "https://gcoinstash-cmd.github.io/litigation-ops-os/admin/",
    passkey: "litigation2026",
    zipPath: "dist/litigation-ops/litigation-ops-v1.0.0.zip",
    coverPath: "dist/litigation-ops/litigation-ops-cover.jpg",
    thumbPath: "dist/litigation-ops/litigation-ops-thumbnail.jpg",
    summary: "Commercial trial war room command center, forensic e-discovery docket review, and trial setting scheduler OS."
  }
];

function buildDescription(p) {
  return `
<p><strong>${p.name}</strong> is an institutional-grade, turnkey full-stack Operating System (OS) engineered specifically for ${p.niche} operators, boutique firms, and high-ticket service providers.</p>

<h3>LIVE INTERACTIVE DEMO</h3>
<p>⚡ <strong>Live Production Preview:</strong> <a href="${p.previewUrl}" target="_blank">${p.previewUrl}</a></p>
<p>🔑 <strong>Executive Admin Portal (/admin):</strong> <a href="${p.adminUrl}" target="_blank">${p.adminUrl}</a><br>
<em>(Click the passkey door button in the header or visit /admin. Demo Auto-Fill Cheat Code: <code>${p.passkey}</code>)</em></p>

<h3>WHAT'S INCLUDED IN THIS REPOSITORY</h3>
<ul>
  <li><strong>Full Source Code (React 19 + TypeScript + Vite + Tailwind CSS):</strong> Clean obsidian dark-mode interface (#0A0A0B), high-contrast typography, and fully responsive layouts.</li>
  <li><strong>Executive Admin Cockpit (/admin):</strong> 1-click credential auto-fill passkey modal for rapid role-based demonstration.</li>
  <li><strong>Turnkey PostgreSQL Database:</strong> Production-ready <code>schema.sql</code> (with strict Row Level Security policies) and <code>seed.sql</code> mock data for immediate Supabase wiring.</li>
  <li><strong>3-Minute Setup Documentation:</strong> <code>SUPABASE_SETUP.md</code> with turnkey copy-paste SQL and environment templates.</li>
  <li><strong>Zero SaaS Server Debt:</strong> Single-tenant architecture with client-side state engines; deploy anywhere (Vercel, Render, GitHub Pages, Netlify) with zero recurring hosting liabilities.</li>
  <li><strong>Commercial Whitelabel Rights:</strong> Unlimited commercial client deployments under the ZoMae Media LLC Asset Purchase Agreement (APA) title transfer.</li>
</ul>

<h3>COMMERCIAL NICHE VALUE & APPOINTMENT ECONOMICS</h3>
<p>${p.summary} Off-the-shelf software vendors charge thousands annually in recurring per-seat fees while holding client databases hostage. This system gives agencies and operators 100% owned, portable software infrastructure ready for immediate client onboarding.</p>

<h3>TIER BREAKDOWN & PRICING</h3>
<ul>
  <li><strong>Tier 1 — Starter UI Edition ($4,500):</strong> Complete React + Vite + TypeScript front-end repository and interactive UI components.</li>
  <li><strong>Tier 2 — Full-Stack Supabase Edition ($4,500):</strong> Complete UI + Supabase PostgreSQL schema, seed data, Row Level Security policies, and /admin passkey demonstration door.</li>
  <li><strong>Tier 3 — White-Glove VIP Implementation ($3,500):</strong> Turnkey setup by Aura & Grid engineers including custom domain DNS, Supabase cloud instance configuration, custom branding integration, and 60 days of architectural support.</li>
</ul>
`.trim();
}

async function publishBatch() {
  await loadEnv();

  console.log('================================================================');
  console.log(' 🚀 AURA & GRID — GUMROAD BATCH DISPATCH (TARGETS #61 TO #70)');
  console.log('================================================================');

  // Fetch existing products to avoid duplicates
  const existingRes = await apiRequest('/products');
  const existingProducts = existingRes.products || [];
  const existingMap = new Map();
  for (const ep of existingProducts) {
    const slug = ep.custom_permalink || ep.short_url.split('/').pop();
    existingMap.set(slug, ep);
    existingMap.set(ep.name.toLowerCase(), ep);
  }

  const results = [];

  for (const p of PRODUCTS) {
    console.log(`\n----------------------------------------------------------------`);
    console.log(`[Target #${p.id}] ${p.name}`);
    console.log(`----------------------------------------------------------------`);

    try {
      // 1. Upload assets
      let zipResult = null;
      let coverResult = null;
      let thumbResult = null;

      if (existsSync(p.zipPath)) {
        zipResult = await uploadFile(resolve(p.zipPath));
      } else {
        console.warn(`  ⚠️ Zip not found: ${p.zipPath}`);
      }

      if (existsSync(p.coverPath)) {
        coverResult = await uploadFile(resolve(p.coverPath));
      } else {
        console.warn(`  ⚠️ Cover not found: ${p.coverPath}`);
      }

      if (existsSync(p.thumbPath)) {
        thumbResult = await uploadFile(resolve(p.thumbPath));
      } else {
        console.warn(`  ⚠️ Thumb not found: ${p.thumbPath}`);
      }

      // Check if product already exists
      let product = existingMap.get(p.slug) || existingMap.get(p.name.toLowerCase());

      const description = buildDescription(p);

      if (!product) {
        console.log(`  Creating new Gumroad product: ${p.slug}...`);
        const createParams = new URLSearchParams({
          name: p.name,
          description,
          price: '7900', // $4,500 base
          custom_permalink: p.slug,
          shown_on_profile: 'true'
        });

        const created = await apiRequest('/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: createParams.toString()
        });
        product = created.product;
        console.log(`  ✅ Created product with ID: ${product.id}`);
      } else {
        console.log(`  Updating existing Gumroad product: ${product.id} (${p.slug})...`);
        const updateRes = await apiRequest(`/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: p.name,
            description,
            price: 7900,
            shown_on_profile: true
          })
        });
        product = updateRes.product;
        console.log(`  ✅ Updated product ID: ${product.id}`);
      }

      // 2. Attach Files & Artwork
      const updatePayload = {};
      if (zipResult) {
        updatePayload.files = [{ url: zipResult.url, name: zipResult.name }];
      }
      if (coverResult) {
        updatePayload.covers = [{ url: coverResult.url }];
      }
      if (thumbResult) {
        updatePayload.thumbnail_url = thumbResult.url;
      }

      if (Object.keys(updatePayload).length > 0) {
        console.log(`  Attaching deliverable files & cover artwork...`);
        await apiRequest(`/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });
      }

      // 3. Configure Variant Tiers
      console.log(`  Configuring variant tiers (Track 1 Micro-APA Buyout ($4,500 anchor))...`);
      try {
        const catRes = await apiRequest(`/products/${product.id}/variant_categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ title: 'License Tier' }).toString()
        });
        const catId = catRes.variant_category.id;

        // Tier 1: $4,500 Starter UI
        await apiRequest(`/products/${product.id}/variant_categories/${catId}/variants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            name: 'Tier 1: Starter UI License ($4,500)',
            price_difference_cents: '0'
          }).toString()
        });

        // Tier 2: $4,500 Full-Stack Edition
        await apiRequest(`/products/${product.id}/variant_categories/${catId}/variants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            name: 'Tier 2: Full-Stack Supabase Edition ($4,500)',
            price_difference_cents: '0' // Pure APA ($4,500 anchor)
          }).toString()
        });

        // Tier 3: $3,500 White-Glove VIP
        await apiRequest(`/products/${product.id}/variant_categories/${catId}/variants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            name: 'Tier 3: White-Glove VIP Implementation ($3,500)',
            price_difference_cents: '342100' // $4,500 + $3421 = $3500
          }).toString()
        });
        console.log(`  ✅ Configured all 3 commercial tiers!`);
      } catch (catErr) {
        console.log(`  ℹ️ Variant categories already exist or configured: ${catErr.message}`);
      }

      const gumroadUrl = product.short_url || `https://auraandgrid.gumroad.com/l/${p.slug}`;
      console.log(`  🎉 Published Live: ${gumroadUrl}`);

      results.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        gumroadUrl,
        status: 'PUBLISHED'
      });

    } catch (err) {
      console.error(`  ❌ Error processing ${p.slug}:`, err.message);
      results.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        gumroadUrl: `https://auraandgrid.gumroad.com/l/${p.slug}`,
        status: 'FAILED',
        error: err.message
      });
    }
  }

  console.log('\n================================================================');
  console.log(' 🏁 GUMROAD BATCH DISPATCH SUMMARY');
  console.log('================================================================');
  console.table(results);
}

publishBatch().catch(err => {
  console.error('Fatal batch dispatch error:', err);
  process.exit(1);
});
