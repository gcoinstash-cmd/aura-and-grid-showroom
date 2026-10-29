#!/usr/bin/env node

/**
 * Aura & Grid - Automated Gumroad Publishing Engine
 * Programmatically creates product drafts, configures tiered pricing,
 * and outputs review URLs without premature public release.
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '..');

// Load environment variables from .env
async function loadEnv() {
  const envPath = join(ROOT_DIR, '.env');
  if (!existsSync(envPath)) {
    throw new Error('.env file not found in root directory.');
  }

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
  if (!token) {
    throw new Error('GUMROAD_ACCESS_TOKEN is missing from environment.');
  }

  const url = endpoint.startsWith('http') ? endpoint : `https://api.gumroad.com/v2${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    const msg = json.message || JSON.stringify(json);
    throw new Error(`Gumroad API Error (${response.status}): ${msg}`);
  }

  return json;
}

async function verifyAuth() {
  const data = await apiRequest('/user');
  console.log(` Authenticated as: ${data.user.name || data.user.display_name} (${data.user.email})`);
  console.log(` Storefront: ${data.user.url}`);
  return data.user;
}

/**
 * Upload a local file directly to Gumroad S3 storage using the presign flow
 */
export async function uploadFileToGumroad(filePath) {
  const { stat } = await import('node:fs/promises');
  const { basename } = await import('node:path');
  const filename = basename(filePath);
  const fileStat = await stat(filePath);
  const fileBuffer = await readFile(filePath);

  console.log(`\n Uploading ${filename} (${(fileStat.size / 1024).toFixed(1)} KB) via presign flow...`);

  // 1. Presign
  const presignData = await apiRequest('/files/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      filename,
      file_size: fileStat.size.toString()
    }).toString()
  });

  // 2. Upload part(s) to S3
  const part = presignData.parts[0];
  const s3Res = await fetch(part.presigned_url, {
    method: 'PUT',
    body: fileBuffer
  });

  if (!s3Res.ok) {
    throw new Error(`Failed to upload file part to S3: ${s3Res.statusText}`);
  }

  const etag = (s3Res.headers.get('etag') || '').replace(/"/g, '');

  // 3. Complete upload
  const compData = await apiRequest('/files/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      upload_id: presignData.upload_id,
      key: presignData.key,
      parts: [{ part_number: 1, etag }]
    })
  });

  console.log(` Upload completed: ${compData.file_url}`);
  return {
    url: compData.file_url,
    name: filename
  };
}

export async function publishProduct({
  name,
  description,
  priceInCents = 450000, // $4,500
  shownOnProfile = false, // Draft mode default
  customSummary = 'Editorial & Zen-Minimalist B2B Web Application Systems',
  upsellDifferenceInCents = 330100, // $3,500 total ($4,500 + $3,301)
  fileBundlePath = null
}) {
  console.log('\n========================================');
  console.log(' AURA & GRID — STOREFRONT PUBLISHING');
  console.log('========================================');
  console.log(`Product Name:    ${name}`);
  console.log(`Base Price:      $${(priceInCents / 100).toFixed(2)}`);
  console.log(`Draft Mode:      ${!shownOnProfile ? 'ACTIVE (Hidden from profile)' : 'OFF (Live)'}`);

  // 1. Create Product
  console.log('\n[1/3] Creating product draft...');
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 30);
  const createPayload = new URLSearchParams({
    name,
    description,
    price: priceInCents.toString(),
    custom_summary: customSummary,
    custom_permalink: slug,
    shown_on_profile: shownOnProfile ? 'true' : 'false'
  });

  const created = await apiRequest('/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: createPayload.toString()
  });

  let product = created.product;
  const permalink = product.custom_permalink || product.short_url.split('/').pop();
  console.log(` Product draft created: ${product.name}`);
  console.log(` Direct Edit Link:     https://gumroad.com/products/${permalink}/edit`);
  console.log(` Storefront Link:       ${product.short_url}`);

  // Upload file bundle if provided
  if (fileBundlePath && existsSync(fileBundlePath)) {
    const uploaded = await uploadFileToGumroad(fileBundlePath);
    const attachRes = await apiRequest(`/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: [{ url: uploaded.url, name: uploaded.name }]
      })
    });
    product = attachRes.product;
    console.log(` Attached delivery bundle to product: ${uploaded.name}`);
  }

  // 2. Configure Tiered Variants
  console.log('\n[2/3] Configuring tiered pricing & white-glove upsell...');
  const catRes = await apiRequest(`/products/${product.id}/variant_categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ title: 'License Tier' }).toString()
  });

  const catId = catRes.variant_category.id;

  // Tier 1: Starter UI License ($4,500)
  await apiRequest(`/products/${product.id}/variant_categories/${catId}/variants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      name: 'Starter UI License ($4,500)',
      price_difference_cents: '0'
    }).toString()
  });
  console.log(' Added: Tier 1 - Starter UI License ($4,500)');

  // Tier 2: Full-Stack Supabase Edition ($4,500)
  await apiRequest(`/products/${product.id}/variant_categories/${catId}/variants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      name: 'Full-Stack Supabase Edition ($4,500)',
      price_difference_cents: '12000'
    }).toString()
  });
  console.log(' Added: Tier 2 - Full-Stack Supabase Edition ($4,500)');

  // Tier 3: White-Glove Deployment & Domain Hookup ($3,500)
  await apiRequest(`/products/${product.id}/variant_categories/${catId}/variants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      name: 'Done-For-You White-Glove Deployment & Custom Domain Hookup ($3,500)',
      price_difference_cents: '342100'
    }).toString()
  });
  console.log(' Added: Tier 3 - Turnkey White-Glove Custom Deployment ($3,500)');

  // 3. Output Confirmation
  const permalink = product.custom_permalink || product.short_url.split('/').pop();
  console.log('\n[3/3] Verification & Next Steps');
  console.log('----------------------------------------------------');
  console.log(` Product:           ${product.name}`);
  console.log(` Direct Edit Link:  https://gumroad.com/products/${permalink}/edit`);
  console.log(` Storefront Link:   ${product.short_url}`);
  console.log(` Status:            DRAFT (${shownOnProfile ? 'Published to profile' : 'Hidden from profile until manual review'})`);
  console.log('----------------------------------------------------\n');

  return product;
}

// CLI Execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    try {
      await loadEnv();
      await verifyAuth();

      const isLive = process.argv.includes('--live');
      
      const productDescription = `
# STRIDE MB — Luxury Sneaker Boutique & E-Commerce Webflow Template

STRIDE MB is a turn-key, high-fashion e-commerce website template engineered specifically for boutique sneaker stores, streetwear labels, and luxury collector storefronts.

Built with a high-contrast aesthetic merging coastal California luxury with Tokyo/NYC streetwear minimalism.

---

###  What’s Included:
- **Complete 7-Page Responsive Architecture**:
  1. Homepage (Editorial Hero & Drop Radar)
  2. Shop & Footwear Archive (Instant Filters & Sort Controls)
  3. Product Detail Page / PDP (Interactive Size Selector & Accordions)
  4. Drop Radar & Live Raffles (JavaScript Countdown Timers)
  5. Editorial Lookbook (35mm coastal street culture layouts)
  6. The Beach House Story (Heritage & Philosophy)
  7. VIP Concierge & Booking (Private Fitting Suite Reservation)
- **Component Design System & Styleguide**
- **Webflow CMS Collection Blueprint**
- **Interactive JavaScript Modules (Slide-out cart, live counters)**
- **Asset Purchase Agreement (APA) title transfer**

---

###  Choose Your Tier:
- **Single Asset Purchase Agreement (APA) title transfer ($4,500)**: Full source code, CMS schema, assets, and documentation for self-hosting.
- **Done-For-You White-Glove Deployment ($3,500)**: Complete end-to-end setup by Aura & Grid engineers including custom domain configuration, CMS data population, staging verification, and deployment to Netlify/Render.
`.trim();

      await publishProduct({
        name: 'STRIDE MB — Luxury Boutique & E-Commerce System',
        description: productDescription,
        priceInCents: 450000,
        shownOnProfile: isLive,
        customSummary: 'Luxury E-Commerce & Sneaker Boutique Web Application Template'
      });

    } catch (err) {
      console.error(' Execution failed:', err.message);
      process.exit(1);
    }
  })();
}
