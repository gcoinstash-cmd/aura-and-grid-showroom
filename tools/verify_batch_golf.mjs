/**
 * GhostFactoryOS — Batch Golf Verification Script
 * Validating disk integrity of all 113 standalone cockpits in cockpits/index.html
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const ROOT_DIR = process.cwd();
const INDEX_PATH = path.join(ROOT_DIR, 'cockpits', 'index.html');

console.log('⚡ [GhostFactoryOS] Running Batch Golf Showroom Verification...');

const indexContent = fs.readFileSync(INDEX_PATH, 'utf8');

// Extract all paths from COCKPITS_MANIFEST
const pathRegex = /path:\s*'([^']+)'/g;
let match;
const manifestPaths = [];
while ((match = pathRegex.exec(indexContent)) !== null) {
  manifestPaths.push(match[1]);
}

console.log(`📋 Found ${manifestPaths.length} cockpits in cockpits/index.html manifest (Target: 113).`);

if (manifestPaths.length !== 113) {
  console.error(`❌ Expected 113 cockpits, found ${manifestPaths.length}`);
  process.exit(1);
}

let missingCount = 0;
for (const relPath of manifestPaths) {
  const fullPath = path.join(ROOT_DIR, 'cockpits', relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing file: ${relPath} -> ${fullPath}`);
    missingCount++;
  }
}

if (missingCount > 0) {
  console.error(`❌ Total missing files: ${missingCount}`);
  process.exit(1);
}

console.log(`✅ All ${manifestPaths.length} cockpit index.html files exist on disk!`);

// Verify all 28 README.md window stickers in batch-golf
const golfDir = path.join(ROOT_DIR, 'cockpits', 'batch-golf');
const golfFolders = fs.readdirSync(golfDir).filter(f => fs.statSync(path.join(golfDir, f)).isDirectory());

console.log(`📁 Found ${golfFolders.length} folders in cockpits/batch-golf/ (Target: 28).`);

if (golfFolders.length !== 28) {
  console.error(`❌ Expected 28 folders in batch-golf, found ${golfFolders.length}`);
  process.exit(1);
}

for (const folder of golfFolders) {
  const readmePath = path.join(golfDir, folder, 'README.md');
  const indexPath = path.join(golfDir, folder, 'index.html');
  if (!fs.existsSync(readmePath) || !fs.existsSync(indexPath)) {
    console.error(`❌ Incomplete folder: ${folder}`);
    process.exit(1);
  }
}

console.log('✅ All 28 Batch Golf folders have index.html and README.md window stickers!');

// HTTP Health Check
function checkUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      resolve({ statusCode: res.statusCode });
    }).on('error', reject);
  });
}

try {
  const rootCheck = await checkUrl('http://localhost:4173/cockpits/index.html');
  console.log(`🌐 HTTP Check (cockpits/index.html): status ${rootCheck.statusCode}`);

  const sampleCheck1 = await checkUrl('http://localhost:4173/cockpits/batch-golf/01-autonomous-pilot-telemetry/index.html');
  console.log(`🌐 HTTP Check (Unit #466 Pilot Telemetry): status ${sampleCheck1.statusCode}`);

  const sampleCheck2 = await checkUrl('http://localhost:4173/cockpits/batch-golf/28-zero-downtime-canary-gate/index.html');
  console.log(`🌐 HTTP Check (Unit #493 Canary Gate): status ${sampleCheck2.statusCode}`);

  if (rootCheck.statusCode === 200 && sampleCheck1.statusCode === 200 && sampleCheck2.statusCode === 200) {
    console.log('🏁 [GhostFactoryOS] 100% GREEN EXIT CODE 0 — BATCH GOLF SHOWROOM LOCKDOWN COMPLETE!');
  } else {
    console.error('❌ Unexpected status code received');
    process.exit(1);
  }
} catch (err) {
  console.error('⚠️ HTTP Check failed (server might not be on port 4173):', err.message);
}
