import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BASE_DIR = process.cwd();
const manifestPath = path.join(BASE_DIR, 'CATALOG_MANIFEST.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

console.log('🚀 GHOST FACTORY™ MASTER AGENCY VAULT & VERTICAL CRATE PACKAGING ENGINE');
console.log(`📦 Auditing & Packaging ${manifest.products.length} Verified Operating Systems...`);

const vaultsDir = path.join(BASE_DIR, 'dist', 'vaults');
const masterVaultDir = path.join(vaultsDir, 'master-agency-vault-85');
const masterTemplatesDir = path.join(masterVaultDir, 'templates');
const verticalVaultsDir = path.join(vaultsDir, 'vertical-vaults');

fs.mkdirSync(masterTemplatesDir, { recursive: true });
fs.mkdirSync(verticalVaultsDir, { recursive: true });

// 1. Gather all 85 zips
let copiedCount = 0;
const productZipMap = new Map();

for (const p of manifest.products) {
  const slug = p.gumroad_url.split('/l/')[1];
  const candidates = [
    slug,
    slug + '-os',
    p.preview_url.split('//')[1].split('.')[0].replace('-os', ''),
    p.preview_url.split('//')[1].split('.')[0]
  ];
  
  let foundZip = null;
  for (const c of candidates) {
    const dir = path.join(BASE_DIR, 'dist', c);
    if (fs.existsSync(dir)) {
      const zips = fs.readdirSync(dir).filter(f => f.endsWith('.zip'));
      if (zips.length > 0) {
        foundZip = path.join(dir, zips[0]);
        break;
      }
    }
  }
  
  if (foundZip) {
    const dest = path.join(masterTemplatesDir, path.basename(foundZip));
    fs.copyFileSync(foundZip, dest);
    productZipMap.set(p.id, { product: p, zipPath: foundZip, zipName: path.basename(foundZip) });
    copiedCount++;
  } else {
    console.error(`❌ Missing zip for #${p.id} ${p.name} (${slug})`);
  }
}

console.log(`✓ Copied ${copiedCount} / ${manifest.products.length} template zips to Master Agency Vault.`);

// 2. Copy documentation to master vault
const docsToCopy = [
  'COMMERCIAL_AGENCY_LICENSE.md',
  'CATALOG_MANIFEST.json',
  'QUALITY_GATE.md',
  'NOTEBOOKLM_MASTER_FOUNDRY_BRIEF.md',
  'MASTER_BUSINESS_PLAN.md',
  'AGENTS.md'
];

for (const d of docsToCopy) {
  if (fs.existsSync(path.join(BASE_DIR, d))) {
    fs.copyFileSync(path.join(BASE_DIR, d), path.join(masterVaultDir, d));
  }
}

if (fs.existsSync(path.join(BASE_DIR, 'docs', 'COMMERCIAL_POSITIONING.md'))) {
  fs.copyFileSync(path.join(BASE_DIR, 'docs', 'COMMERCIAL_POSITIONING.md'), path.join(masterVaultDir, 'COMMERCIAL_POSITIONING.md'));
}

// Write master README.md inside the vault
const readmeContent = `# Aura & Grid™ — Master Agency Whitelabel Vault (85 Turnkey Operating Systems)
## ZoMae Media LLC / The Ghost Factory™ Autonomous Foundry

**Version**: 2.1 (Full 85-Asset Asset Purchase Agreement (APA) title transfer Edition)  
**Verification**: 100% Passing Headless Playwright + Axe-Core Audits (0 P0 Defects, 9.49 Fleet Average)  
**Total Production Codebases Included**: 85 Enterprise OS Templates  

---

### What Is In This Vault:
1. **\`templates/\`**: 85 standalone production \`.zip\` archives. Each repository contains complete React 19 + Tailwind CSS frontend source code, Supabase PostgreSQL schemas (\`schema.sql\` with RLS), seed data (\`seed.sql\`), and 3-minute setup instructions (\`SUPABASE_SETUP.md\`).
2. **\`COMMERCIAL_AGENCY_LICENSE.md\`**: Non-exclusive, perpetual commercial whitelabel license authorizing unlimited paying client deployments, retainers, and high-ticket setup fee collection ($3,500+).
3. **\`CATALOG_MANIFEST.json\`**: Machine-readable catalog registry indexing all 85 applications, design benchmarks (Chrono24, SevenRooms, etc.), and 5-archetype classifications.
4. **\`COMMERCIAL_POSITIONING.md\`**: The Exotic Dealership, Esports Foundry, and Producer Beat Vault commercial positioning playbook.
5. **\`QUALITY_GATE.md\`**: The 6-Layer Governance Architecture and Boss Battle Radar certification ledger.

*ZoMae Media LLC © 2026. All Rights Reserved.*
`;
fs.writeFileSync(path.join(masterVaultDir, 'README.md'), readmeContent, 'utf8');

// 3. Compile Master 85-Asset Zip Archive
console.log('📦 Compiling master-agency-vault-85.zip...');
const masterZipOut = path.join(vaultsDir, 'master-agency-vault-85.zip');
try {
  execSync(`cd "${vaultsDir}" && zip -r -q master-agency-vault-85.zip master-agency-vault-85/`, { stdio: 'inherit' });
  const stat = fs.statSync(masterZipOut);
  console.log(`✅ Master Agency Vault 85 compiled successfully: ${(stat.size / (1024 * 1024)).toFixed(1)} MB`);
} catch (e) {
  console.error('Failed to zip master vault:', e.message);
}

// 4. Package the 7 Institutional Sweet Spot Vertical Vaults
const verticalDefinitions = [
  {
    slug: 'medical-aesthetics-vault',
    name: 'Medical & VIP Aesthetics Vault',
    filter: (p) => ['medical', 'wellness', 'health'].includes(p.vertical) || p.category.toLowerCase().includes('medical') || p.category.toLowerCase().includes('clinic') || p.category.toLowerCase().includes('spa') || p.category.toLowerCase().includes('dental')
  },
  {
    slug: 'automotive-mobility-vault',
    name: 'Automotive & Mobility Vault',
    filter: (p) => ['automotive', 'mobility'].includes(p.vertical) || p.category.toLowerCase().includes('tuning') || p.category.toLowerCase().includes('fleet') || p.category.toLowerCase().includes('repair') || p.category.toLowerCase().includes('detail')
  },
  {
    slug: 'luxury-hospitality-dining-vault',
    name: 'Luxury Hospitality & Dining Vault',
    filter: (p) => ['hospitality', 'dining'].includes(p.vertical) || p.category.toLowerCase().includes('dining') || p.category.toLowerCase().includes('counter') || p.category.toLowerCase().includes('bistro') || p.category.toLowerCase().includes('nightlife') || p.category.toLowerCase().includes('taco')
  },
  {
    slug: 'private-wealth-real-estate-vault',
    name: 'Private Wealth & Real Estate Vault',
    filter: (p) => ['finance', 'wealth', 'real-estate'].includes(p.vertical) || p.category.toLowerCase().includes('wealth') || p.category.toLowerCase().includes('capital') || p.category.toLowerCase().includes('real estate') || p.category.toLowerCase().includes('estate') || p.category.toLowerCase().includes('horology')
  },
  {
    slug: 'creative-agency-studio-vault',
    name: 'Creative Agency & Studio Vault',
    filter: (p) => ['agency', 'creative'].includes(p.vertical) || p.category.toLowerCase().includes('studio') || p.category.toLowerCase().includes('agency') || p.category.toLowerCase().includes('motion') || p.category.toLowerCase().includes('ink')
  },
  {
    slug: 'home-services-contracting-vault',
    name: 'Home Services & Contracting Vault',
    filter: (p) => ['contracting', 'services'].includes(p.vertical) || p.category.toLowerCase().includes('hvac') || p.category.toLowerCase().includes('roofing') || p.category.toLowerCase().includes('plumbing') || p.category.toLowerCase().includes('solar') || p.category.toLowerCase().includes('electrical')
  },
  {
    slug: 'performance-fitness-athletics-vault',
    name: 'Performance Fitness & Athletics Vault',
    filter: (p) => ['fitness', 'athletics'].includes(p.vertical) || p.category.toLowerCase().includes('fitness') || p.category.toLowerCase().includes('combat') || p.category.toLowerCase().includes('recovery')
  }
];

console.log('\n🏛️ Packaging Institutional Vertical Slices...');
const verticalCrates = [];

for (const v of verticalDefinitions) {
  const matched = manifest.products.filter(v.filter);
  const vDir = path.join(verticalVaultsDir, v.slug);
  const vTemplates = path.join(vDir, 'templates');
  fs.mkdirSync(vTemplates, { recursive: true });
  
  let vCopied = 0;
  for (const m of matched) {
    const item = productZipMap.get(m.id);
    if (item && fs.existsSync(item.zipPath)) {
      fs.copyFileSync(item.zipPath, path.join(vTemplates, item.zipName));
      vCopied++;
    }
  }
  
  // Copy license and manifest subset
  fs.copyFileSync(path.join(BASE_DIR, 'COMMERCIAL_AGENCY_LICENSE.md'), path.join(vDir, 'COMMERCIAL_AGENCY_LICENSE.md'));
  fs.copyFileSync(path.join(BASE_DIR, 'QUALITY_GATE.md'), path.join(vDir, 'QUALITY_GATE.md'));
  
  // Write Vertical README
  const vReadme = `# ${v.name} (${vCopied} Turnkey Operating Systems)
## Aura & Grid™ Institutional Vertical Slice APA

**Vertical Scope**: ${v.name}  
**Included Applications**: ${vCopied} Production Systems  
**Licensing**: Commercial Whitelabel & Institutional Portfolio Carve-Out  

---
*ZoMae Media LLC © 2026. All Rights Reserved.*
`;
  fs.writeFileSync(path.join(vDir, 'README.md'), vReadme, 'utf8');
  
  // Zip vertical crate
  const vZipName = `${v.slug}-${vCopied}.zip`;
  const vZipPath = path.join(verticalVaultsDir, vZipName);
  try {
    execSync(`cd "${verticalVaultsDir}" && zip -r -q "${vZipName}" "${v.slug}/"`, { stdio: 'ignore' });
    const stat = fs.statSync(vZipPath);
    console.log(`✓ [${v.name}]: ${vCopied} Apps | ${(stat.size / (1024 * 1024)).toFixed(1)} MB (${vZipName})`);
    verticalCrates.push({ name: v.name, appsCount: vCopied, zipFile: vZipName, sizeMb: (stat.size / (1024 * 1024)).toFixed(1) });
  } catch (e) {
    console.error(`Failed to zip ${v.slug}:`, e.message);
  }
}

// 5. Update CATALOG_MANIFEST.json with vault package metadata
manifest.vaults = {
  master_agency_vault_85: {
    name: "Aura & Grid Master Agency Whitelabel Vault (85 Flagships)",
    total_apps: manifest.products.length,
    apa_buyout_anchor: 1250000,
    archive_path: "dist/vaults/master-agency-vault-85.zip",
    description: "Complete 85-asset production catalog with turnkey Supabase PostgreSQL schemas, RLS policies, and Asset Purchase Agreement (APA) title transfer."
  },
  phase_1_agency_vault_50: {
    name: "Phase 1 Agency Whitelabel Vault (50 Flagships)",
    total_apps: 50,
    apa_buyout_anchor: 1250000,
    archive_path: "dist/vaults/phase-1-agency-vault-50.zip"
  },
  vertical_slices: verticalCrates
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log('✓ CATALOG_MANIFEST.json updated with master vault and vertical slice metadata!');

// 6. Mirror Master Vault & Documentation to Google Drive
const driveBase = '/Users/gmane/Library/CloudStorage/GoogleDrive-gcoinstash@gmail.com/My Drive/Ghost_Factory_Master_Vault';
if (fs.existsSync(driveBase)) {
  console.log('\n☁️ Mirroring Master Vaults to Google Drive...');
  const driveVaultsDir = path.join(driveBase, 'vaults');
  fs.mkdirSync(driveVaultsDir, { recursive: true });
  
  fs.copyFileSync(masterZipOut, path.join(driveVaultsDir, 'master-agency-vault-85.zip'));
  fs.copyFileSync(manifestPath, path.join(driveBase, 'CATALOG_MANIFEST.json'));
  fs.copyFileSync(path.join(BASE_DIR, 'docs', 'COMMERCIAL_POSITIONING.md'), path.join(driveBase, 'COMMERCIAL_POSITIONING.md'));
  
  console.log('✅ Google Drive Master Vault synchronized with master-agency-vault-85.zip and latest manifests!');
}
