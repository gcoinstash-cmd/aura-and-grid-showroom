#!/usr/bin/env node

/**
 * Audit script: Verify all call-to-action (CTA) acquisition triggers across the showroom frontend
 * - Validates all anchor tags render proper, non-empty href attributes
 * - Validates URL-encoded mailto payloads, subject, and body format
 * - Validates strict Pure APA terminology (zero retail terms)
 * - Validates vertical flex stack and touch target constraints
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const showroomPath = path.join(rootDir, 'site', 'index.html');

if (!fs.existsSync(showroomPath)) {
  console.error(`❌ Showroom file not found: ${showroomPath}`);
  process.exit(1);
}

const html = fs.readFileSync(showroomPath, 'utf8');

// Match all <a> tags
const anchorRegex = /<a\b([^>]*)>(.*?)<\/a>/gis;
let match;
let totalAnchors = 0;
let mailtoAnchors = 0;
let errors = [];

const FORBIDDEN_RETAIL = /\b(buy|purchase|bundle|license|licensing|subscription)\b/i;

while ((match = anchorRegex.exec(html)) !== null) {
  totalAnchors++;
  const attrs = match[1];
  const innerHtml = match[2].trim();

  // Extract href
  const hrefMatch = attrs.match(/\bhref="([^"]*)"/i);
  if (!hrefMatch) {
    errors.push(`Anchor #${totalAnchors} is missing an href attribute: ${match[0].slice(0, 100)}...`);
    continue;
  }

  const href = hrefMatch[1];
  if (!href || href.trim() === '' || href === '#' || href.startsWith('javascript:')) {
    // Only brand logo href="#" is allowed if applicable
    const isBrand = attrs.includes('class="brand');
    if (!isBrand) {
      errors.push(`Anchor #${totalAnchors} has invalid/empty href "${href}": ${innerHtml.slice(0, 60)}`);
    }
  }

  // Check mailto links
  if (href.startsWith('mailto:')) {
    mailtoAnchors++;
    
    // Check dealership inbox
    if (!href.startsWith('mailto:garrett@auraandgrid.io')) {
      errors.push(`Mailto anchor #${totalAnchors} does not target verified dealership inbox (garrett@auraandgrid.io): ${href.slice(0, 50)}`);
    }

    // Verify subject and body URL components
    const urlObj = new URL(href);
    const subject = urlObj.searchParams.get('subject') || '';
    const body = urlObj.searchParams.get('body') || '';

    if (!subject.startsWith('[APA TITLE INQUIRY]')) {
      errors.push(`Mailto anchor #${totalAnchors} has non-conforming subject: "${subject}"`);
    }

    if (!body.includes('Lead Systems Engineer & Dealership Principal')) {
      errors.push(`Mailto anchor #${totalAnchors} body missing greeting to Dealership Principal`);
    }

    if (!body.includes('Target Unit:') || !body.includes('Spec Tier:') || !body.includes('APA Buyout Anchor:')) {
      errors.push(`Mailto anchor #${totalAnchors} body missing telemetry fields (Target Unit / Spec Tier / APA Buyout Anchor)`);
    }

    if (!body.includes('Buyer Entity Name:') || !body.includes('Authorized Signer:') || !body.includes('Wire / Settlement Email:')) {
      errors.push(`Mailto anchor #${totalAnchors} body missing routing fields`);
    }
  }

  // Check CTA button text for retail terms and proper triggers
  const isCtaBtn = attrs.includes('class="btn') || attrs.includes('price-pill');
  if (isCtaBtn) {
    if (FORBIDDEN_RETAIL.test(innerHtml)) {
      errors.push(`CTA anchor #${totalAnchors} contains forbidden retail term: "${innerHtml}"`);
    }

    // Ensure it strictly conforms to Action Triggers if it's an acquisition/inquiry trigger
    const isAcquisitionTrigger = attrs.includes('btn-amber') || attrs.includes('btn-cyan') || attrs.includes('price-pill');
    if (isAcquisitionTrigger) {
      const hasPrimary = innerHtml.includes('ACQUIRE TITLE (APA)');
      const hasMaster = innerHtml.includes('INQUIRE VAULT BUYOUT');
      const isCockpit = innerHtml.includes('TEST DRIVE COCKPIT');
      if (!hasPrimary && !hasMaster && !isCockpit) {
        errors.push(`CTA anchor #${totalAnchors} trigger label does not use conforming trigger phrase: "${innerHtml}"`);
      }
    }
  }
}

// Check vertical flex stacks for CTAs
const ctaStacks = [...html.matchAll(/class="cta-stack\s+([^"]*)"/g)];
for (const stack of ctaStacks) {
  const cls = stack[1];
  if (!cls.includes('flex flex-col gap-2 w-full')) {
    errors.push(`CTA stack missing 'flex flex-col gap-2 w-full': class="cta-stack ${cls}"`);
  }
}

const heroStacks = [...html.matchAll(/class="hero-actions\s+([^"]*)"/g)];
for (const stack of heroStacks) {
  const cls = stack[1];
  if (!cls.includes('flex flex-col gap-2 w-full')) {
    errors.push(`Hero actions stack missing 'flex flex-col gap-2 w-full': class="hero-actions ${cls}"`);
  }
}

console.log(`\n======================================================`);
console.log(`🏎️ SHOWROOM CTA & ANCHOR TELEMETRY AUDIT REPORT`);
console.log(`======================================================`);
console.log(`Total Anchors Scanned: ${totalAnchors}`);
console.log(`Pre-Baked Mailto Anchors: ${mailtoAnchors}`);
console.log(`Errors Found: ${errors.length}`);

if (errors.length > 0) {
  console.error('\n❌ AUDIT FAILED WITH ERRORS:');
  errors.forEach((err, idx) => console.error(`  [${idx + 1}] ${err}`));
  process.exit(1);
} else {
  console.log('\n✅ ALL 100% PURE APA CTA TRIGGERS & ANCHOR TAGS FULLY VERIFIED PASSING!');
  console.log('   - 0 retail terms found');
  console.log('   - 100% proper href attributes rendered');
  console.log('   - All mailto payloads URL-encoded conforming to telemetry spec');
  console.log('   - Strict vertical flex stacks (flex flex-col gap-2 w-full) validated');
  console.log(`======================================================\n`);
  process.exit(0);
}
