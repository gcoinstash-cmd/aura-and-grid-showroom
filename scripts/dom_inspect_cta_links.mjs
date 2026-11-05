#!/usr/bin/env node

/**
 * Automated DOM Inspection & Telemetry Audit for Showroom CTA Links
 * Target: site/index.html
 * 
 * Verifies:
 * 1. Extraction of all <a> tags with CTA text matching "ACQUIRE TITLE (APA)" and "INQUIRE VAULT BUYOUT".
 * 2. Assertion that every href starts with "mailto:".
 * 3. Validation that ?subject= and &body= parameters are strictly URL-encoded (zero raw spaces or illegal unescaped characters).
 * 4. Structured telemetry table output with Target Asset Name, Track Tier, Detected Anchor Price, and mailto string preview.
 * 5. Strict assertion of zero missing parameters or malformed tokens.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const HTML_FILE = path.join(rootDir, 'site', 'index.html');

if (!fs.existsSync(HTML_FILE)) {
  console.error(`❌ HTML target not found at: ${HTML_FILE}`);
  process.exit(1);
}

const html = fs.readFileSync(HTML_FILE, 'utf8');

// Regex to capture all anchor tags: <a [attributes]>[inner text]</a>
const anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
let match;
const matchingCtas = [];
const errors = [];

while ((match = anchorRegex.exec(html)) !== null) {
  const fullTag = match[0];
  const attributes = match[1];
  const innerHtml = match[2];

  // Strip inner HTML tags to get pure text content
  const textContent = innerHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const isAcquireTitle = textContent.includes('ACQUIRE TITLE (APA)');
  const isInquireVault = textContent.includes('INQUIRE VAULT BUYOUT');

  if (!isAcquireTitle && !isInquireVault) {
    continue;
  }

  // Extract href attribute
  const hrefMatch = attributes.match(/\bhref="([^"]*)"/i);
  if (!hrefMatch) {
    errors.push({
      ctaText: textContent,
      issue: 'Missing href attribute on anchor tag'
    });
    continue;
  }

  const rawHref = hrefMatch[1];
  const ctaType = isAcquireTitle ? 'ACQUIRE TITLE (APA)' : 'INQUIRE VAULT BUYOUT';

  matchingCtas.push({
    rawTag: fullTag,
    textContent,
    ctaType,
    rawHref
  });
}

if (matchingCtas.length === 0) {
  console.error('❌ Zero acquisition CTA tags found matching "ACQUIRE TITLE (APA)" or "INQUIRE VAULT BUYOUT"!');
  process.exit(1);
}

const tableData = [];

matchingCtas.forEach((cta, index) => {
  const { rawHref, ctaType } = cta;
  const tagId = `#${index + 1}`;

  // 1. Check starts with mailto:
  if (!rawHref.startsWith('mailto:')) {
    errors.push({
      tagId,
      ctaType,
      issue: `Href does not start with "mailto:": "${rawHref.slice(0, 40)}..."`
    });
    return;
  }

  // 2. Strict URL-encoding validation on raw query string
  // Check for illegal unencoded characters: raw spaces, raw line breaks, raw tabs, raw unescaped quotes, etc.
  const hasRawSpaces = rawHref.includes(' ');
  const hasRawNewlines = rawHref.includes('\n') || rawHref.includes('\r');
  const hasRawTabs = rawHref.includes('\t');
  const hasUnescapedBrackets = /[{}[\]\\^`|<>]/.test(rawHref.replace(/^mailto:[^?]+\?/, ''));

  if (hasRawSpaces || hasRawNewlines || hasRawTabs || hasUnescapedBrackets) {
    errors.push({
      tagId,
      ctaType,
      issue: `Malformed URL encoding: contains ${[
        hasRawSpaces ? 'raw spaces' : null,
        hasRawNewlines ? 'raw newlines' : null,
        hasRawTabs ? 'raw tabs' : null,
        hasUnescapedBrackets ? 'raw unescaped special characters' : null
      ].filter(Boolean).join(', ')}`
    });
  }

  // 3. Parse query parameters
  const mailtoParts = rawHref.slice('mailto:'.length).split('?');
  const recipient = mailtoParts[0];
  const queryString = mailtoParts.slice(1).join('?');

  if (!recipient || recipient.trim() === '') {
    errors.push({ tagId, ctaType, issue: 'Missing recipient email in mailto link' });
  }

  const searchParams = new URLSearchParams(queryString);
  const subject = searchParams.get('subject') || '';
  const body = searchParams.get('body') || '';

  if (!subject) {
    errors.push({ tagId, ctaType, issue: 'Missing or empty "?subject=" parameter' });
  }
  if (!body) {
    errors.push({ tagId, ctaType, issue: 'Missing or empty "&body=" parameter' });
  }

  // Check for unparsed template placeholders or malformed tokens
  const malformedTokens = rawHref.match(/(\{[a-zA-Z0-9_]+\}|%7B[a-zA-Z0-9_]+%7D|undefined|NaN|null)/g);
  if (malformedTokens) {
    errors.push({
      tagId,
      ctaType,
      issue: `Unresolved or malformed template tokens detected: ${malformedTokens.join(', ')}`
    });
  }

  // Extract structured fields from body
  const targetMatch = body.match(/• Target Unit:\s*(.*?)(?:\n|$)/);
  const tierMatch = body.match(/• Spec Tier:\s*(.*?)(?:\n|$)/);
  const anchorMatch = body.match(/• APA Buyout Anchor:\s*(.*?)(?:\n|$)/);

  const targetName = targetMatch ? targetMatch[1].trim() : 'UNKNOWN';
  const trackTier = tierMatch ? tierMatch[1].trim() : 'UNKNOWN';
  const anchorPrice = anchorMatch ? anchorMatch[1].trim() : 'UNKNOWN';

  if (targetName === 'UNKNOWN') {
    errors.push({ tagId, ctaType, issue: 'Body missing "• Target Unit:" line' });
  }
  if (trackTier === 'UNKNOWN') {
    errors.push({ tagId, ctaType, issue: 'Body missing "• Spec Tier:" line' });
  }
  if (anchorPrice === 'UNKNOWN') {
    errors.push({ tagId, ctaType, issue: 'Body missing "• APA Buyout Anchor:" line' });
  }

  // Required routing lines verification
  if (!body.includes('Buyer Entity Name:')) {
    errors.push({ tagId, ctaType, issue: 'Body missing "Buyer Entity Name:" routing line' });
  }
  if (!body.includes('Authorized Signer:')) {
    errors.push({ tagId, ctaType, issue: 'Body missing "Authorized Signer:" routing line' });
  }
  if (!body.includes('Wire / Settlement Email:')) {
    errors.push({ tagId, ctaType, issue: 'Body missing "Wire / Settlement Email:" routing line' });
  }

  // Preview string: first 52 characters + '...'
  const preview = rawHref.length > 55 ? rawHref.slice(0, 52) + '...' : rawHref;

  tableData.push({
    '#': tagId,
    'CTA Trigger': ctaType === 'ACQUIRE TITLE (APA)' ? 'ACQUIRE (APA)' : 'INQUIRE VAULT',
    'Target Asset Name': targetName.length > 34 ? targetName.slice(0, 31) + '...' : targetName,
    'Track Tier': trackTier.length > 25 ? trackTier.slice(0, 22) + '...' : trackTier,
    'Anchor Price': anchorPrice,
    'Encoded mailto: Preview': preview
  });
});

// Format terminal output
console.log('\n====================================================================================================================');
console.log('🏁 DOM INSPECTION & TELEMETRY AUDIT: ACQUISITION CTA LINKS');
console.log('   Target File: site/index.html');
console.log('====================================================================================================================\n');

console.table(tableData);

console.log('\n--------------------------------------------------------------------------------------------------------------------');
console.log(`📊 TELEMETRY SUMMARY:`);
console.log(`   • Matching CTA Anchors Audited: ${matchingCtas.length}`);
console.log(`   • Verified "mailto:" Format:    ${matchingCtas.length - errors.filter(e => e.issue.includes('mailto')).length}/${matchingCtas.length}`);
console.log(`   • Strict URL-Encoding Pass:     ${errors.filter(e => e.issue.includes('encoding')).length === 0 ? 'PASS (100% escaped, zero raw spaces)' : 'FAIL'}`);
console.log(`   • Unresolved Placeholder Pass:  ${errors.filter(e => e.issue.includes('tokens')).length === 0 ? 'PASS (0 malformed tokens)' : 'FAIL'}`);
console.log(`   • Total Protocol Violations:    ${errors.length}`);
console.log('--------------------------------------------------------------------------------------------------------------------\n');

if (errors.length > 0) {
  console.error('❌ AUDIT ASSERTION FAILED:');
  errors.forEach(err => {
    console.error(`   [!] ${err.tagId || 'CTA'} [${err.ctaType}]: ${err.issue}`);
  });
  console.log('\n====================================================================================================================\n');
  process.exit(1);
} else {
  console.log('✅ ALL ACQUISITION CTA ANCHORS ARE FULLY COMPLIANT, STRICTLY URL-ENCODED, AND ACCURATELY TELEMETERED!\n');
  console.log('====================================================================================================================\n');
  process.exit(0);
}
