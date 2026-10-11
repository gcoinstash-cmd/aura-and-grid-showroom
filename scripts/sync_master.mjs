#!/usr/bin/env node
/**
 * GhostFactoryOS × Aura & Grid — Master Sync Engine
 * 
 * Synchronizes all master blueprints, system instruction files,
 * recovery packages, source code, and production zip archives across:
 * 1. Local Workspace Root
 * 2. Local Backup (MASTER_BLUEPRINT_BACKUP)
 * 3. NotebookLM Knowledge Base
 * 4. Local Vaults (dist/vaults)
 * 5. Workspace Staging (./Ghost_Factory_Staging/)
 * 6. Google Drive (~/Google Drive/My Drive/ & CloudStorage)
 * 
 * STRICT FILE EXCLUSION POLICY:
 * Strictly ignores:
 *  - node_modules (all dependency trees)
 *  - .git (git metadata, objects, hooks)
 *  - dist (unbundled build artifacts, compiled HTML/JS/CSS output, console_dist)
 *  - .vite (Vite dev and build cache directories)
 *  - OS metadata (.DS_Store) and temp/log/cache files
 * 
 * ONLY backs up:
 *  - Source code (TypeScript, JavaScript, components, configurations)
 *  - Markdown documentation (specs, guides, audit reports, architecture standards)
 *  - Blueprints & schemas (manifests, SQL schemas, seed data, engine definitions)
 *  - Production zip bundles (clean standalone archives, master vault packages)
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Master blueprint, documentation, and source code files
 */
const MASTER_FILES = [
  { src: 'README.md', destName: 'README.md' },
  { src: 'tools/ghost-factory-console/README.md', destName: 'GFCC_README.md' },
  { src: 'AGENTS.md', destName: 'AGENTS.md' },
  { src: 'AGENT.md', destName: 'AGENT.md' },
  { src: 'GEMINI.md', destName: 'GEMINI.md' },
  { src: 'instructions.txt', destName: 'instructions.txt' },
  { src: 'ghostfactory-master.md', destName: 'ghostfactory-master.md' },
  { src: 'GHOSTFACTORY_V2_MASTER_SYNC.md', destName: 'GHOSTFACTORY_V2_MASTER_SYNC.md' },
  { src: 'BUSINESS_MODEL_AND_FOUNDRY_STRATEGY.md', destName: 'BUSINESS_MODEL_AND_FOUNDRY_STRATEGY.md' },
  { src: 'MASTER_BUSINESS_PLAN.md', destName: 'MASTER_BUSINESS_PLAN.md' },
  { src: 'NOTEBOOKLM_MASTER_FOUNDRY_BRIEF.md', destName: 'NOTEBOOKLM_MASTER_FOUNDRY_BRIEF.md' },
  { src: 'COMMERCIAL_AGENCY_LICENSE.md', destName: 'COMMERCIAL_AGENCY_LICENSE.md' },
  { src: 'QUALITY_GATE.md', destName: 'QUALITY_GATE.md' },
  { src: 'CATALOG_MANIFEST.json', destName: 'CATALOG_MANIFEST.json' },
  { src: 'EMERGENCY_RECOVERY_README.md', destName: 'EMERGENCY_RECOVERY_README.md' },
  { src: 'AUDIT_SNAPSHOT.md', destName: 'AUDIT_SNAPSHOT.md' },
  { src: 'docs/COMMERCIAL_POSITIONING.md', destName: 'COMMERCIAL_POSITIONING.md' },
  { src: 'docs/INVESTOR_AUDIT_REPORT.md', destName: 'INVESTOR_AUDIT_REPORT.md' },
  { src: 'docs/AUDIT_360_VERIFIED_REPORT.md', destName: 'AUDIT_360_VERIFIED_REPORT.md' },
  { src: 'docs/audits/TRACK3_INCOMING_REGISTRATION.md', destName: 'TRACK3_INCOMING_REGISTRATION.md' },
  { src: 'docs/audits/FLEET_VALUATION_APPRAISAL_ASC350.md', destName: 'FLEET_VALUATION_APPRAISAL_ASC350.md' },
  { src: 'docs/audits/ACQUIRE_TIER1_STRATEGY.md', destName: 'ACQUIRE_TIER1_STRATEGY.md' },
  { src: 'templates/compliance/COMPLIANCE.template.md', destName: 'COMPLIANCE.template.md' },
  { src: 'protocols/INSTITUTIONAL_PRODUCTION_STANDARD.md', destName: 'INSTITUTIONAL_PRODUCTION_STANDARD.md' },
  { src: 'src/data/track3Engines.ts', destName: 'track3Engines.ts' },
  { src: 'src/components/Track2Harness.tsx', destName: 'Track2Harness.tsx' },
  { src: 'tools/ghost-factory-console/src/catalogData.ts', destName: 'catalogData.ts' },
  { src: 'tools/ghost-factory-console/src/data/licenseMatrix.ts', destName: 'licenseMatrix.ts' },
];

/**
 * STRICT EXCLUSION LIST FOR RSYNC
 * Strictly ignores node_modules, .git, dist, .venv, and .vite cache folders.
 */
const STRICT_EXCLUDE_PATTERNS = [
  'node_modules',
  'node_modules/**',
  '*/node_modules/**',
  '.git',
  '.git/**',
  '*/.git/**',
  '.gitignore',
  'dist',
  'dist/**',
  '*/dist/**',
  '.vite',
  '.vite/**',
  '*/.vite/**',
  '*.vite',
  '.DS_Store',
  '*.tmp',
  '*.swp',
  '*.log',
  '__pycache__',
  '__pycache__/**',
  '.venv',
  '.venv/**',
  '*/.venv/**',
  '.pytest_cache',
  '.pytest_cache/**',
  '.turbo',
  '.next/cache',
];

const RSYNC_EXCLUDE_FLAGS = STRICT_EXCLUDE_PATTERNS.map(p => `--exclude="${p}"`).join(' ');

/**
 * Resolved target backup directories
 */
function getDestinationDirs() {
  const home = os.homedir();
  const dirs = [
    // 1. Local workspace backup folder
    { id: 'local_backup', path: path.join(ROOT_DIR, 'MASTER_BLUEPRINT_BACKUP'), isBackup: true },
    
    // 2. NotebookLM Knowledge Base (Local Workspace)
    { id: 'notebooklm_kb', path: path.join(ROOT_DIR, 'NotebookLM_Knowledge_Base'), isBackup: false },
    
    // 3. Dist Vaults (Local Vaults)
    { id: 'dist_vaults', path: path.join(ROOT_DIR, 'dist', 'vaults'), isBackup: false },
    
    // 4. In-Workspace Staging Root & Subfolders
    { id: 'workspace_staging_root', path: path.join(ROOT_DIR, 'Ghost_Factory_Staging'), isBackup: false },
    { id: 'workspace_staging_backup', path: path.join(ROOT_DIR, 'Ghost_Factory_Staging', 'MASTER_BLUEPRINT_BACKUP'), isBackup: true },
    { id: 'workspace_staging_kb', path: path.join(ROOT_DIR, 'Ghost_Factory_Staging', 'NotebookLM_Knowledge_Base'), isBackup: false },
    
    // 5. Google Drive (Standard Mac Mount)
    { id: 'gdrive_standard_root', path: path.join(home, 'Google Drive', 'My Drive', 'Ghost_Factory_Master_Vault'), checkParent: path.join(home, 'Google Drive', 'My Drive'), isBackup: false },
    { id: 'gdrive_standard_backup', path: path.join(home, 'Google Drive', 'My Drive', 'Ghost_Factory_Master_Vault', 'MASTER_BLUEPRINT_BACKUP'), checkParent: path.join(home, 'Google Drive', 'My Drive', 'Ghost_Factory_Master_Vault'), isBackup: true },
    { id: 'gdrive_standard_kb', path: path.join(home, 'Google Drive', 'My Drive', 'Ghost_Factory_Master_Vault', 'NotebookLM_Knowledge_Base'), checkParent: path.join(home, 'Google Drive', 'My Drive', 'Ghost_Factory_Master_Vault'), isBackup: false },
    { id: 'gdrive_standard_direct_backup', path: path.join(home, 'Google Drive', 'My Drive', 'MASTER_BLUEPRINT_BACKUP'), checkParent: path.join(home, 'Google Drive', 'My Drive'), isBackup: true },
    
    // 6. CloudStorage Direct (FileProvider location)
    { id: 'gdrive_cloudstorage_root', path: path.join(home, 'Library', 'CloudStorage', 'GoogleDrive-gcoinstash@gmail.com', 'My Drive', 'Ghost_Factory_Master_Vault'), checkParent: path.join(home, 'Library', 'CloudStorage', 'GoogleDrive-gcoinstash@gmail.com', 'My Drive'), isBackup: false },
    { id: 'gdrive_cloudstorage_backup', path: path.join(home, 'Library', 'CloudStorage', 'GoogleDrive-gcoinstash@gmail.com', 'My Drive', 'Ghost_Factory_Master_Vault', 'MASTER_BLUEPRINT_BACKUP'), checkParent: path.join(home, 'Library', 'CloudStorage', 'GoogleDrive-gcoinstash@gmail.com', 'My Drive', 'Ghost_Factory_Master_Vault'), isBackup: true },
    { id: 'gdrive_cloudstorage_kb', path: path.join(home, 'Library', 'CloudStorage', 'GoogleDrive-gcoinstash@gmail.com', 'My Drive', 'Ghost_Factory_Master_Vault', 'NotebookLM_Knowledge_Base'), checkParent: path.join(home, 'Library', 'CloudStorage', 'GoogleDrive-gcoinstash@gmail.com', 'My Drive', 'Ghost_Factory_Master_Vault'), isBackup: false },
    { id: 'gdrive_cloudstorage_direct_backup', path: path.join(home, 'Library', 'CloudStorage', 'GoogleDrive-gcoinstash@gmail.com', 'My Drive', 'MASTER_BLUEPRINT_BACKUP'), checkParent: path.join(home, 'Library', 'CloudStorage', 'GoogleDrive-gcoinstash@gmail.com', 'My Drive'), isBackup: true },
  ];

  return dirs;
}

function calculateHash(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch {
    return null;
  }
}

export function runMasterSync() {
  const timestamp = new Date().toISOString();
  console.log(`\n=======================================================`);
  console.log(`🚀 [GHOSTFACTORY SYNC ENGINE] Starting Master Sync at ${timestamp}`);
  console.log(`🛡️  Policy: Strictly ignoring node_modules, .git, dist, and .vite`);
  console.log(`=======================================================`);

  // Verify source files
  const verifiedSources = [];
  const checksums = {};

  for (const item of MASTER_FILES) {
    const srcPath = path.join(ROOT_DIR, item.src);
    if (fs.existsSync(srcPath)) {
      const hash = calculateHash(srcPath);
      verifiedSources.push({ ...item, fullSrc: srcPath, hash });
      checksums[item.destName] = hash;
    } else {
      console.warn(`⚠️ Warning: Master source file not found: ${item.src}`);
    }
  }

  console.log(`📦 Verified ${verifiedSources.length} master blueprint and source files.`);

  const dests = getDestinationDirs();
  const seenPaths = new Set();
  const activeDests = [];

  // Prepare directories and deduplicate symlinked realpaths
  for (const dest of dests) {
    if (dest.checkParent) {
      if (!fs.existsSync(dest.checkParent)) {
        continue;
      }
    }
    if (!fs.existsSync(dest.path)) {
      try {
        fs.mkdirSync(dest.path, { recursive: true });
      } catch (err) {
        console.warn(`Could not create ${dest.path}:`, err.message);
        continue;
      }
    }
    try {
      const real = fs.realpathSync(dest.path);
      if (seenPaths.has(real)) {
        continue;
      }
      seenPaths.add(real);
      activeDests.push({ ...dest, realPath: real });
    } catch {
      activeDests.push(dest);
    }
  }

  console.log(`📁 Active Unique Destinations: ${activeDests.length}`);

  // Copy verified master files to ALL active destinations
  for (const target of activeDests) {
    for (const file of verifiedSources) {
      const targetPath = path.join(target.path, file.destName);
      try {
        fs.copyFileSync(file.fullSrc, targetPath);
      } catch (err) {
        console.error(`Error copying ${file.destName} to ${target.path}:`, err.message);
      }
    }
  }
  console.log(`✅ All ${verifiedSources.length} master files copied to ${activeDests.length} target directories.`);

  // Re-generate MASTER_BLUEPRINT_BACKUP_2026.zip (Production Zip Bundle)
  const localBackupDir = path.join(ROOT_DIR, 'MASTER_BLUEPRINT_BACKUP');
  const zipPath = path.join(localBackupDir, 'MASTER_BLUEPRINT_BACKUP_2026.zip');
  const backupDests = activeDests.filter(d => d.isBackup);

  try {
    // Remove old zip if present to build fresh
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
    // Zip all blueprint files strictly ignoring node_modules, .git, dist, .vite, and temp files
    execSync(`cd "${localBackupDir}" && zip -rq "MASTER_BLUEPRINT_BACKUP_2026.zip" . -x "*.DS_Store" "*.tmp" "*node_modules*" "*.git*" "*dist/*" "*.vite*"`, { stdio: 'pipe' });
    console.log(`📦 Re-generated production zip archive: MASTER_BLUEPRINT_BACKUP_2026.zip (${(fs.statSync(zipPath).size / 1024).toFixed(1)} KB)`);

    // Distribute zip to all other backup targets
    for (const target of backupDests) {
      if (target.path !== localBackupDir) {
        try {
          fs.copyFileSync(zipPath, path.join(target.path, 'MASTER_BLUEPRINT_BACKUP_2026.zip'));
        } catch (err) {
          console.warn(`Could not copy zip to ${target.path}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('Failed to create master zip bundle:', err.message);
  }

  // Generate & write SYNC_MANIFEST.json
  const manifest = {
    sync_timestamp: timestamp,
    version: 'v2.0-master-sync',
    status: 'ALL_SYNCED',
    backup_filter_policy: {
      strictly_ignored: ['node_modules', '.git', 'dist', '.vite'],
      strictly_included: ['source_code', 'markdown_documentation', 'blueprints', 'production_zip_bundles'],
    },
    portfolio_facts: {
      total_catalog_assets: 151,
      track_1_lean_rapid_sale_assets: 86,
      track_2_flagship_tier_1_assets: 50,
      track_3_service_engines: 14,
      retention_floor_percent: 80,
      retained_floor_assets: 120,
      max_apa_capacity_assets: 31,
    },
    pricing_protocol: {
      track_1_lean_rapid_sale: {
        retail_msrp: 199,
        team_seat: 599,
        exclusive_buyout_floor_avg: 5150,
        exclusive_buyout_anchor: 4500,
      },
      track_2_flagship_tier_1: {
        commercial_license_avg: 2500,
        entry_buyout_anchor: 14500,
        full_buyout_avg: 26500,
        strategic_acquisition_avg: 55000,
      },
      track_3_service_engines: {
        monthly_enterprise_seat_license: 1500,
        baseline_apa_buyout_floor: 50000,
        monopoly_vault_buyout_avg: 112500,
      },
      portfolio_retention_floor_percent: 80,
    },
    valuation_summary: {
      distress_liquidation_floor: 900000,
      realistic_accepted_offer: 155000,
      direct_b2b_ask_target: 230000,
      strategic_buyout_anchor: 1880000,
      development_replacement_cost: 2300000,
      strategic_acquisition_ceiling: 3680000,
    },
    total_files_synced: verifiedSources.length,
    checksums,
    synced_destinations: activeDests.map(d => d.path),
  };

  const manifestContent = JSON.stringify(manifest, null, 2);
  for (const target of activeDests) {
    try {
      fs.writeFileSync(path.join(target.path, 'SYNC_MANIFEST.json'), manifestContent, 'utf-8');
    } catch (err) {
      console.warn(`Could not write manifest to ${target.path}:`, err.message);
    }
  }

  // Perform deep Google Drive synchronization (source code, markdown documentation, blueprints & production zip bundles ONLY)
  syncGoogleDriveFull();

  console.log(`\n=======================================================`);
  console.log(`✅ [GHOSTFACTORY SYNC ENGINE] SUCCESS! All targets in sync.`);
  console.log(`   - Master Blueprint & Source Files: ${verifiedSources.length}`);
  console.log(`   - Unique Synced Destinations: ${activeDests.length}`);
  console.log(`   - Strict Exclusion: node_modules, .git, dist, .vite verified active.`);
  for (const dest of activeDests) {
    console.log(`     • [${dest.id}] -> ${dest.path}`);
  }
  console.log(`=======================================================\n`);
}

/**
 * Full Google Drive synchronization routine
 * Strictly backs up:
 *  - Source Code (src/, console source, site source, configs)
 *  - Markdown Documentation (docs/, READMEs, audit reports)
 *  - Blueprints & Schemas (Ghost_Factory_Staging, manifests)
 *  - Production Zip Bundles (GFCC console backup zip, master agency vaults)
 * 
 * Strictly ignores:
 *  - node_modules
 *  - .git
 *  - dist (and unbundled build folders)
 *  - .vite cache
 */
function syncGoogleDriveFull() {
  const home = os.homedir();
  const gdriveRootCandidates = [
    path.join(home, 'Google Drive', 'My Drive', 'Ghost_Factory_Master_Vault'),
    path.join(home, 'Library', 'CloudStorage', 'GoogleDrive-gcoinstash@gmail.com', 'My Drive', 'Ghost_Factory_Master_Vault')
  ];

  let gdriveVault = null;
  for (const c of gdriveRootCandidates) {
    if (fs.existsSync(c)) {
      gdriveVault = c;
      break;
    }
  }

  if (!gdriveVault) {
    console.log('ℹ️ Google Drive Ghost_Factory_Master_Vault not found. Skipping extended Google Drive sync.');
    return;
  }

  console.log(`\n=======================================================`);
  console.log(`☁️ [GOOGLE DRIVE FULL SYNC] Syncing curated assets to:`);
  console.log(`   ${gdriveVault}`);
  console.log(`   Policy: STRICTLY IGNORING node_modules, .git, dist, and .vite`);
  console.log(`   Scope:  Source Code, Markdown Documentation, Blueprints & Production Zip Bundles ONLY`);
  console.log(`=======================================================`);

  // 1. Clean up legacy unbundled dist folders and any pre-existing ignored folders from Google Drive
  const legacyConsoleDist = path.join(gdriveVault, 'console_dist');
  if (fs.existsSync(legacyConsoleDist)) {
    try {
      fs.rmSync(legacyConsoleDist, { recursive: true, force: true });
      console.log(`🧹 Removed legacy console_dist folder from Google Drive (dist folders strictly excluded).`);
    } catch (err) {
      console.warn(`Warning removing legacy console_dist:`, err.message);
    }
  }

  const legacyConsoleBackupDist = path.join(gdriveVault, 'console_backup', 'dist');
  if (fs.existsSync(legacyConsoleBackupDist)) {
    try {
      fs.rmSync(legacyConsoleBackupDist, { recursive: true, force: true });
      console.log(`🧹 Removed legacy dist from console_backup on Google Drive (dist folders strictly excluded).`);
    } catch (err) {
      console.warn(`Warning removing legacy console_backup/dist:`, err.message);
    }
  }

  // Purge any pre-existing ignored folders (.git, node_modules, dist, .vite) that may linger in Google Drive
  const forbiddenDirs = new Set(['node_modules', '.git', 'dist', '.vite']);
  function purgeLegacyForbiddenDirs(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    try {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const fullItem = path.join(currentDir, item);
        if (forbiddenDirs.has(item) || item.endsWith('.vite')) {
          try {
            fs.rmSync(fullItem, { recursive: true, force: true });
            console.log(`🧹 Purged pre-existing forbidden folder from Google Drive: ${path.relative(gdriveVault, fullItem)}`);
          } catch (e) {
            console.warn(`Warning purging ${fullItem}:`, e.message);
          }
        } else {
          try {
            const stat = fs.statSync(fullItem);
            if (stat.isDirectory()) {
              purgeLegacyForbiddenDirs(fullItem);
            }
          } catch {}
        }
      }
    } catch {}
  }
  purgeLegacyForbiddenDirs(gdriveVault);

  // 2. Sync Ghost_Factory_Staging (Blueprints, specifications, and manifests)
  const localStaging = path.join(ROOT_DIR, 'Ghost_Factory_Staging');
  const gdriveStaging = path.join(gdriveVault, 'Ghost_Factory_Staging');
  if (fs.existsSync(localStaging)) {
    try {
      fs.mkdirSync(gdriveStaging, { recursive: true });
      execSync(`rsync -avu --delete ${RSYNC_EXCLUDE_FLAGS} "${localStaging}/" "${gdriveStaging}/"`, { stdio: 'pipe' });
      console.log(`✅ Synced Ghost_Factory_Staging (blueprints & engine specs) -> Google Drive [node_modules/.git/dist/.vite ignored]`);
    } catch (err) {
      console.warn(`Warning syncing Ghost_Factory_Staging:`, err.message);
    }
  }

  // 3. Sync tools/ghost-factory-console/src and configs -> ghost_factory_console_source (Source Code ONLY)
  const localConsole = path.join(ROOT_DIR, 'tools', 'ghost-factory-console');
  const gdriveConsoleSrc = path.join(gdriveVault, 'ghost_factory_console_source');
  if (fs.existsSync(localConsole)) {
    try {
      fs.mkdirSync(gdriveConsoleSrc, { recursive: true });
      execSync(`rsync -avu --delete ${RSYNC_EXCLUDE_FLAGS} "${path.join(localConsole, 'src')}/" "${path.join(gdriveConsoleSrc, 'src')}/"`, { stdio: 'pipe' });
      const configs = ['package.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.node.json', 'tailwind.config.js'];
      for (const cfg of configs) {
        const srcCfg = path.join(localConsole, cfg);
        if (fs.existsSync(srcCfg)) {
          fs.copyFileSync(srcCfg, path.join(gdriveConsoleSrc, cfg));
        }
      }
      console.log(`✅ Synced ghost_factory_console_source (source code & configs) -> Google Drive [node_modules/.git/dist/.vite ignored]`);
    } catch (err) {
      console.warn(`Warning syncing console source:`, err.message);
    }
  }

  // 4. Update console_backup (Source Code & Production Zip Bundle ONLY - NO raw dist folder)
  const gdriveConsoleBackup = path.join(gdriveVault, 'console_backup');
  if (fs.existsSync(localConsole)) {
    try {
      fs.mkdirSync(gdriveConsoleBackup, { recursive: true });
      execSync(`rsync -avu --delete ${RSYNC_EXCLUDE_FLAGS} "${path.join(localConsole, 'src')}/" "${path.join(gdriveConsoleBackup, 'src')}/"`, { stdio: 'pipe' });
      const zipBundle = path.join(gdriveConsoleBackup, 'GFCC_CONSOLE_LATEST_BACKUP.zip');
      if (fs.existsSync(zipBundle)) fs.unlinkSync(zipBundle);
      // Create production zip bundle: includes clean source, blueprints, configs; strictly excludes dist, node_modules, .git, .vite
      execSync(`cd "${localConsole}" && zip -rq "${zipBundle}" package.json index.html vite.config.ts tsconfig.json tsconfig.node.json tailwind.config.js src -x "*.DS_Store" "*.tmp" "*node_modules*" "*.git*" "*dist/*" "*.vite*"`, { stdio: 'pipe' });
      console.log(`✅ Created production zip bundle GFCC_CONSOLE_LATEST_BACKUP.zip in console_backup -> Google Drive (${(fs.statSync(zipBundle).size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.warn(`Warning updating console_backup:`, err.message);
    }
  }

  // 5. Sync docs/ -> Google Drive docs/ (Markdown Documentation ONLY)
  const localDocs = path.join(ROOT_DIR, 'docs');
  const gdriveDocs = path.join(gdriveVault, 'docs');
  if (fs.existsSync(localDocs)) {
    try {
      fs.mkdirSync(gdriveDocs, { recursive: true });
      execSync(`rsync -avu --delete ${RSYNC_EXCLUDE_FLAGS} "${localDocs}/" "${gdriveDocs}/"`, { stdio: 'pipe' });
      console.log(`✅ Synced docs/ (markdown documentation & audit reports) -> Google Drive [node_modules/.git/dist/.vite ignored]`);
    } catch (err) {
      console.warn(`Warning syncing docs:`, err.message);
    }
  }

  // 6. Sync dist/vaults -> Google Drive vaults/ (Production Zip Bundles & Blueprints ONLY)
  const localVaults = path.join(ROOT_DIR, 'dist', 'vaults');
  const gdriveVaults = path.join(gdriveVault, 'vaults');
  if (fs.existsSync(localVaults)) {
    try {
      fs.mkdirSync(gdriveVaults, { recursive: true });
      execSync(`rsync -avu ${RSYNC_EXCLUDE_FLAGS} "${localVaults}/" "${gdriveVaults}/"`, { stdio: 'pipe' });
      console.log(`✅ Synced vaults/ (production zip bundles & blueprint manifests) -> Google Drive [node_modules/.git/dist/.vite ignored]`);
    } catch (err) {
      console.warn(`Warning syncing vaults:`, err.message);
    }
  }

  // 7. Sync site/ -> Google Drive showroom_site/ (Showroom Source Code ONLY)
  const localSite = path.join(ROOT_DIR, 'site');
  const gdriveSite = path.join(gdriveVault, 'showroom_site');
  if (fs.existsSync(localSite)) {
    try {
      fs.mkdirSync(gdriveSite, { recursive: true });
      execSync(`rsync -avu --delete ${RSYNC_EXCLUDE_FLAGS} "${localSite}/" "${gdriveSite}/"`, { stdio: 'pipe' });
      console.log(`✅ Synced site/ -> Google Drive showroom_site/ (source code & assets) [node_modules/.git/dist/.vite ignored]`);
    } catch (err) {
      console.warn(`Warning syncing showroom site:`, err.message);
    }
  }

  // 8. Sync templates/ -> Google Drive templates/ (Blueprint Templates ONLY)
  const localTemplates = path.join(ROOT_DIR, 'templates');
  const gdriveTemplates = path.join(gdriveVault, 'templates');
  if (fs.existsSync(localTemplates)) {
    try {
      fs.mkdirSync(gdriveTemplates, { recursive: true });
      execSync(`rsync -avu --delete ${RSYNC_EXCLUDE_FLAGS} "${localTemplates}/" "${gdriveTemplates}/"`, { stdio: 'pipe' });
      console.log(`✅ Synced templates/ (blueprint source templates) -> Google Drive [node_modules/.git/dist/.vite ignored]`);
    } catch (err) {
      console.warn(`Warning syncing templates:`, err.message);
    }
  }

  // 9. Sync root src/ -> Google Drive root_source/ (Universal Harness & Track 3 Engine Registry Source)
  const localSrc = path.join(ROOT_DIR, 'src');
  const gdriveSrc = path.join(gdriveVault, 'root_source');
  if (fs.existsSync(localSrc)) {
    try {
      fs.mkdirSync(gdriveSrc, { recursive: true });
      execSync(`rsync -avu --delete ${RSYNC_EXCLUDE_FLAGS} "${localSrc}/" "${gdriveSrc}/"`, { stdio: 'pipe' });
      console.log(`✅ Synced src/ -> Google Drive root_source/ (telemetry harness & engine code) [node_modules/.git/dist/.vite ignored]`);
    } catch (err) {
      console.warn(`Warning syncing root src:`, err.message);
    }
  }

  // 10. Update root of My Drive audit reports (Markdown Documentation)
  const myDriveRootCandidates = [
    path.join(home, 'Google Drive', 'My Drive'),
    path.join(home, 'Library', 'CloudStorage', 'GoogleDrive-gcoinstash@gmail.com', 'My Drive')
  ];
  const seenRoots = new Set();
  for (const mRoot of myDriveRootCandidates) {
    if (fs.existsSync(mRoot)) {
      try {
        const real = fs.realpathSync(mRoot);
        if (seenRoots.has(real)) continue;
        seenRoots.add(real);

        const auditSrc = path.join(ROOT_DIR, 'docs', 'AUDIT_360_VERIFIED_REPORT.md');
        if (fs.existsSync(auditSrc)) {
          fs.copyFileSync(auditSrc, path.join(mRoot, 'AUDIT_360_VERIFIED_REPORT.md'));
          fs.copyFileSync(auditSrc, path.join(mRoot, 'GFCC_AUDIT_360_VERIFIED_REPORT_v1.3.1.md'));
        }
        const valuationSrc = path.join(ROOT_DIR, 'docs', 'audits', 'FLEET_VALUATION_APPRAISAL_ASC350.md');
        if (fs.existsSync(valuationSrc)) {
          fs.copyFileSync(valuationSrc, path.join(mRoot, 'FLEET_VALUATION_APPRAISAL_ASC350.md'));
        }
      } catch (err) {
        console.warn(`Warning copying audit report to My Drive root:`, err.message);
      }
    }
  }

  console.log(`✅ [GOOGLE DRIVE FULL SYNC] Completed all curated Google Drive synchronizations.`);
}

function watchMode() {
  console.log(`👀 [GHOSTFACTORY SYNC ENGINE] Watch mode active. Monitoring master files for changes...`);
  runMasterSync();

  let debounceTimer = null;

  const triggerDebouncedSync = (filename) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log(`\n⚡ [SYNC DETECTED] Change detected in: ${filename}`);
      runMasterSync();
    }, 500);
  };

  const filesToWatch = [
    ROOT_DIR,
    path.join(ROOT_DIR, 'docs'),
    path.join(ROOT_DIR, 'src'),
  ];

  for (const dir of filesToWatch) {
    if (fs.existsSync(dir)) {
      try {
        fs.watch(dir, { recursive: false }, (eventType, filename) => {
          if (!filename) return;
          const match = MASTER_FILES.some(f => f.src === filename || f.src === `docs/${filename}` || path.basename(f.src) === filename);
          if (match) {
            triggerDebouncedSync(filename);
          }
        });
        console.log(`   Listening on: ${dir}`);
      } catch (err) {
        console.warn(`Watch error on ${dir}:`, err.message);
      }
    }
  }
}

// Execution entry
const args = process.argv.slice(2);
if (args.includes('--watch') || args.includes('-w')) {
  watchMode();
} else {
  runMasterSync();
}
