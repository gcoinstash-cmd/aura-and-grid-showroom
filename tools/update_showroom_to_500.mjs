/**
 * tools/update_showroom_to_500.mjs
 * Updates showroom builder scripts to 500-unit historic capstone and compiles site/index.html
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const filesToUpdate = [
  path.join(ROOT_DIR, 'scripts', 'site', 'build_public_showroom.mjs'),
  path.join(ROOT_DIR, 'scripts', 'factory', 'build_public_showroom.mjs'),
  path.join(ROOT_DIR, 'build_public_showroom.mjs')
];

for (const filePath of filesToUpdate) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  // Descriptions and headers
  content = content.replace(/492 Production Software Assets \(164 Track 1 Lean Tuners \+ 164 Track 2 Hypercars \+ 164 Track 3 Skunkworks Engines\)/g,
    '500 Production Software Assets (168 Track 1 Lean Tuners + 168 Track 2 Hypercars + 164 Track 3 Skunkworks Engines)');
  content = content.replace(/492 VERIFIED UNITS \/\/ TRACK 1 \(164\) • TRACK 2 \(164\) • TRACK 3 \(164\)/g,
    '500 VERIFIED UNITS // TRACK 1 (168) • TRACK 2 (168) • TRACK 3 (164)');
  content = content.replace(/492 VERIFIED UNITS/g, '500 VERIFIED UNITS');
  content = content.replace(/\$31,850,000/g, '$32,450,000');
  content = content.replace(/across all 492 upgraded chassis\./g, 'across all 500 upgraded chassis.');
  content = content.replace(/\[ TRACK 1 \/\/ LEAN TUNER \(164\) \]/g, '[ TRACK 1 // LEAN TUNER (168) ]');
  content = content.replace(/\[ TRACK 2 \/\/ HYPERCAR \(164\) \]/g, '[ TRACK 2 // HYPERCAR (168) ]');
  content = content.replace(/\[ ALL LOTS \(492\) \]/g, '[ ALL LOTS (500) ]');
  content = content.replace(/Search 492 units/g, 'Search 500 units');
  content = content.replace(/ALL LOTS \/\/ 492 VERIFIED UNITS/g, 'ALL LOTS // 500 VERIFIED UNITS');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated showroom builder: ${path.relative(ROOT_DIR, filePath)}`);
}

// Compile the showroom
console.log('Compiling showroom via scripts/site/build_public_showroom.mjs...');
execSync('node scripts/site/build_public_showroom.mjs', { stdio: 'inherit', cwd: ROOT_DIR });

// Mirror to dist, public, and root index.html
const siteIndex = path.join(ROOT_DIR, 'site', 'index.html');
const mirrors = [
  path.join(ROOT_DIR, 'index.html'),
  path.join(ROOT_DIR, 'dist', 'index.html'),
  path.join(ROOT_DIR, 'public', 'index.html')
];

mirrors.forEach(mirrorPath => {
  fs.mkdirSync(path.dirname(mirrorPath), { recursive: true });
  fs.copyFileSync(siteIndex, mirrorPath);
  console.log(`Mirrored site/index.html -> ${path.relative(ROOT_DIR, mirrorPath)}`);
});

console.log('✓ Public showroom completely recompiled and mirrored with 500 units.');
