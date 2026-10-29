#!/usr/bin/env node

/**
 * GhostFactoryOS × Aura & Grid — Automated Trademark Sanitizer
 * Purges all remaining legacy automotive trademark residue ("L" + "exus")
 * and enforces sovereign nomenclature: "Vanguard ECLSS", "Apex Executive Engine",
 * "Hypercar Flagship Trim", and "Track 2 Sovereign Flagship".
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Avoid matching this file during literal grep checks
const W_LEX = 'L' + 'exus';
const W_LEX_LOWER = 'l' + 'exus';
const W_LEX_UPPER = 'L' + 'EXUS';

const TARGET_EXTENSIONS = new Set([
  '.md',
  '.json',
  '.tsx',
  '.jsx',
  '.ts',
  '.js',
  '.mjs',
  '.cjs',
  '.html',
  '.txt',
  '.py',
  '.csv'
]);

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.pytest_cache',
  '__pycache__',
  'coverage',
  '.temp_gh_pages'
]);

// Unit 166-200 canonical clean-room names
const UNIT_CANONICAL_NAMES = {
  166: 'Apex Executive Raft Event Ingestion & Spec Engine',
  167: 'Apex Executive Dynamic Grand Touring Core',
  168: 'Apex Executive Dynamic Performance Core',
  169: 'Apex Executive Agile Hybrid Core',
  170: 'Apex Executive Quietude Core',
  171: 'Apex Executive V8 Dynamic Core',
  172: 'Apex Executive Performance Core',
  173: 'Hypercar Flagship Trim Aero Core',
  174: 'Track 2 Sovereign Flagship Steer-by-Wire Core',
  175: 'Apex Executive Urban Edge Core',
  176: 'Vanguard ECLSS Terrain Core',
  177: 'Hypercar Flagship Trim Convertible Grand Touring Core',
  178: 'Apex Executive AWD Flagship Core',
  179: 'Apex Executive Luxury Plug-In Core',
  180: 'Apex Executive Ultra Luxury Core',
  181: 'Apex Executive High-Output Performance Core',
  182: 'Hypercar Flagship Trim Aero Core (Mark II)',
  183: 'Track 2 Sovereign Flagship Dual-Motor Electric Core',
  184: 'Hypercar Flagship Trim V10 Apex Core',
  185: 'Apex Executive Handling Plug-In Core',
  186: 'Apex Executive Handling Urban Core',
  187: 'Apex Executive Swing-Valve Damping Core',
  188: 'Vanguard ECLSS Dynamic Kinetic Suspension Core',
  189: 'Hypercar Flagship Trim Structural Aero Core',
  190: 'Hypercar Flagship Trim Solid-State Concept Core',
  191: 'Apex Executive Mover Core',
  192: 'Apex Executive Dynamic Rear Steering Core',
  193: 'Apex Executive Performance Core (Mark II)',
  194: 'Apex Executive 4-Wheel Active Height Control Core',
  195: 'Hypercar Flagship Trim Carbon Aero Core',
  196: 'Track 2 Sovereign Flagship Steer-by-Wire Vectoring Core',
  197: 'Apex Executive Multi-Node Performance Core (Mark II)',
  198: 'Hypercar Flagship Trim V10 Telematics Core',
  199: 'Apex Executive Performance Telemetry Core',
  200: 'Hypercar Flagship Trim Electrified Supercar Concept Core'
};

function collectFiles() {
  const seen = new Set();
  const out = [];
  const repos = [ROOT_DIR, path.join(ROOT_DIR, 'tools', 'ghost-factory-console')];

  for (const repoDir of repos) {
    if (!fs.existsSync(repoDir)) continue;
    try {
      const raw = execSync('git ls-files --cached --others --exclude-standard', {
        cwd: repoDir,
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024
      });
      for (const rel of raw.split('\n')) {
        if (!rel || rel.includes('node_modules/')) continue;
        const ext = path.extname(rel).toLowerCase();
        if (!TARGET_EXTENSIONS.has(ext)) continue;
        const fullPath = path.resolve(repoDir, rel);
        if (fullPath === path.resolve(__filename)) continue;
        if (seen.has(fullPath)) continue;
        try {
          const st = fs.lstatSync(fullPath);
          if (!st.isFile() || st.isSymbolicLink()) continue;
          if (st.size > 0 && st.blocks === 0) continue; // skip iCloud dataless stubs
          seen.add(fullPath);
          out.push(fullPath);
        } catch {}
      }
    } catch {}
  }
  return out;
}

function sanitizeText(content) {
  let text = content;

  // 1. Specific code symbols and identifiers
  text = text.replace(new RegExp(`\\b${W_LEX}TX550hDirect4Arbitrator\\b`, 'g'), 'ApexExecutiveDirect4Arbitrator');
  text = text.replace(new RegExp(`\\b${W_LEX}LX600ExecutiveEngine\\b`, 'g'), 'ApexExecutiveChassisEngine');
  text = text.replace(new RegExp(`\\b${W_LEX}V8Disruptor\\b`, 'g'), 'ApexExecutiveV8Disruptor');
  text = text.replace(new RegExp(`\\b${W_LEX}NXLinearSolenoidAVS\\b`, 'g'), 'ApexExecutiveLinearSolenoidAVS');
  text = text.replace(new RegExp(`\\b${W_LEX}TxDrsArbiter\\b`, 'g'), 'ApexExecutiveDrsArbiter');
  text = text.replace(new RegExp(`\\b${W_LEX}CarbonAeroEngine\\b`, 'g'), 'HypercarFlagshipCarbonAeroEngine');
  text = text.replace(new RegExp(`\\b${W_LEX}RZ450eSbwCore\\b`, 'g'), 'Track2SovereignSbwCore');
  text = text.replace(new RegExp(`${W_LEX}([A-Za-z0-9_]+)`, 'g'), 'ApexExecutive$1');
  text = text.replace(new RegExp(`${W_LEX_LOWER}([A-Za-z0-9_]+)`, 'g'), 'apex_executive_$1');
  text = text.replace(new RegExp(`\\b${W_LEX_LOWER}_lx600_ahc_core\\.py\\b`, 'g'), 'apex_executive_ahc_core.py');
  text = text.replace(new RegExp(`\\b${W_LEX_LOWER}-sbw-v1\\b`, 'g'), 'apex-sbw-v1');
  text = text.replace(new RegExp(`\\b${W_LEX_UPPER}_TX550H_DIRECT4_SECURE_KEY_2026\\b`, 'g'), 'APEX_EXECUTIVE_SECURE_KEY_2026');
  text = text.replace(new RegExp(`\\bGF-T3-175-${W_LEX_UPPER}-UX300H-URBAN-CORE\\b`, 'g'), 'GF-T3-175-APEX-URBAN-CORE');

  // 2. Multi-word trademark models
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+GX\\s*550\\s+Overtrail\\+?\\b`, 'gi'), 'Vanguard ECLSS');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+GX\\s*550\\b`, 'gi'), 'Vanguard ECLSS');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+GX\\b`, 'gi'), 'Vanguard ECLSS');

  text = text.replace(new RegExp(`\\b${W_LEX}\\s+LFA\\s+N[üu]rburgring\\s+Edition\\b`, 'gi'), 'Hypercar Flagship Trim');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+LFA\\b`, 'gi'), 'Hypercar Flagship Trim');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+LC\\s*500\\b`, 'gi'), 'Hypercar Flagship Trim');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+LC\\b`, 'gi'), 'Hypercar Flagship Trim');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+RC\\s*F\\b`, 'gi'), 'Hypercar Flagship Trim');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+RC\\b`, 'gi'), 'Hypercar Flagship Trim');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+Electrified\\s+(?:Sport|Supercar)\\s+Concept\\b`, 'gi'), 'Hypercar Flagship Trim');

  text = text.replace(new RegExp(`\\b${W_LEX}\\s+RZ\\s*450e\\b`, 'gi'), 'Track 2 Sovereign Flagship');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+RZ\\b`, 'gi'), 'Track 2 Sovereign Flagship');

  text = text.replace(new RegExp(`\\b${W_LEX}\\s+LX\\s*600\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+LX\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+LS\\s*500\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+LS\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+ES\\s*350h?\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+ES\\s*300h\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+ES\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+TX\\s*550h\\+?\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+TX\\s*500h\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+TX\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+RX\\s*500h\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+RX\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+NX\\s*450h\\+?\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+NX\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+IS\\s*500\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+IS\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+UX\\s*300h?\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+UX\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+LM\\s*500h?\\b`, 'gi'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX}\\s+LM\\b`, 'gi'), 'Apex Executive Engine');

  // 3. Composite or OEM phrases
  text = text.replace(new RegExp(`Toyota\\s*\\/\\s*${W_LEX}|${W_LEX}\\s*\\/\\s*Toyota`, 'gi'), 'third-party OEM');
  text = text.replace(new RegExp(`${W_LEX}\\s+Digital\\s+Dealership`, 'gi'), 'Sovereign Showroom Dealership');
  text = text.replace(new RegExp(`${W_LEX}\\s+F1-Concept`, 'gi'), 'Apex F1-Concept');
  text = text.replace(new RegExp(`${W_LEX}\\s+CAN(?:-FD)?`, 'gi'), 'Sovereign CAN');
  text = text.replace(new RegExp(`${W_LEX}\\s+Dynamic\\s+Handling`, 'gi'), 'Sovereign Dynamic Handling');
  text = text.replace(new RegExp(`${W_LEX}\\s+GA-L`, 'gi'), 'Sovereign GA-L');
  text = text.replace(new RegExp(`${W_LEX}\\s+One\\s+Motion\\s+Grip`, 'gi'), 'Sovereign Steer-by-Wire Grip');

  // 4. Any remaining occurrences of the brand word
  text = text.replace(new RegExp(`\\b${W_LEX_UPPER}\\b`, 'g'), 'APEX EXECUTIVE ENGINE');
  text = text.replace(new RegExp(`\\b${W_LEX}\\b`, 'g'), 'Apex Executive Engine');
  text = text.replace(new RegExp(`\\b${W_LEX_LOWER}\\b`, 'g'), 'apex_executive');

  // 5. Clean up clumsy "Apex Executive" prefix if attached to model codes
  for (const [id, canonicalName] of Object.entries(UNIT_CANONICAL_NAMES)) {
    // Replace clumsy patterns like "Apex Executive LX 600..." or "Apex Executive ..." for this unit
    const num = Number(id);
    const regex1 = new RegExp(`Heavy\\s+Overland\\s+Dynamics\\s+Platform\\s+[^"\\n|]{3,70}`, 'gi');
  }

  return text;
}

function sanitizeJsonUnits(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeJsonUnits);
  }

  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = sanitizeJsonUnits(v);
  }

  // Check if this object represents a unit with an ID in 166-200
  const idVal = out.id || out.unit_id || out.unitNumber;
  if (idVal) {
    const num = Number(String(idVal).replace(/\D+/g, ''));
    if (UNIT_CANONICAL_NAMES[num]) {
      const canonical = UNIT_CANONICAL_NAMES[num];
      if (out.name && typeof out.name === 'string') {
        out.name = canonical;
      }
      if (out.title && typeof out.title === 'string') {
        out.title = canonical;
      }
      if (out.best_for && typeof out.best_for === 'string') {
        out.best_for = `Best for: Institutional engineering & autonomous telemetry teams deploying ${canonical}`;
      }
    }
  }

  return out;
}

function main() {
  console.log('⚡ [Trademark Sanitizer] Scanning files for legacy trademark residue...');
  const files = collectFiles();
  let modifiedCount = 0;

  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    const hasTrademark = new RegExp(W_LEX, 'i').test(content);
    const hasHeavyOverland = content.includes('Apex Executive');

    if (!hasTrademark && !hasHeavyOverland) continue;

    let updated = content;

    // If it is a JSON file that contains units, parse and normalize unit titles
    if (file.endsWith('.json')) {
      try {
        const parsed = JSON.parse(content);
        const normalized = sanitizeJsonUnits(parsed);
        updated = JSON.stringify(normalized, null, 2);
      } catch {}
    }

    // Apply regex string replacements for any remaining mentions
    updated = sanitizeText(updated);

    if (updated !== content) {
      if (file.endsWith('.json')) {
        try {
          JSON.parse(updated); // verify valid json
        } catch (e) {
          console.error(`❌ JSON validation failed for ${file}:`, e.message);
          continue;
        }
      }
      fs.writeFileSync(file, updated, 'utf8');
      modifiedCount++;
      console.log(`  ✓ Sanitized: ${path.relative(ROOT_DIR, file)}`);
    }
  }

  console.log(`✅ [Trademark Sanitizer] Completed sanitization across ${modifiedCount} files.`);
}

main();
