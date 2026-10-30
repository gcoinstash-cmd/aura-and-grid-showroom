/**
 * Unit #306 Test Suite: Markdown Vault Metadata Extractor & Formatter
 * Track 1 Verification Rig
 */

import assert from 'node:assert/strict';
import {
  parseYamlScalar,
  parseYamlFrontmatter,
  serializeYamlFrontmatter,
  slugify,
  extractVaultManifest,
  injectFrontmatter,
  stripFrontmatter,
  benchmarkMarkdownExtractor
} from './engine.js';

console.log('⚡ [Unit #306 Test Suite] Initiating verification sequence...');

// Test 1: YAML Scalar Parsing
{
  assert.equal(parseYamlScalar('true'), true);
  assert.equal(parseYamlScalar('false'), false);
  assert.equal(parseYamlScalar('4500'), 4500);
  assert.equal(parseYamlScalar('null'), null);
  assert.equal(parseYamlScalar('"quoted string"'), 'quoted string');
  assert.deepEqual(parseYamlScalar('[a, b, 10]'), ['a', 'b', 10]);
  console.log('  ✔ parseYamlScalar passed');
}

// Test 2: YAML Frontmatter Parser
{
  const yaml = `
# Ignore comment
title: "Cluster 007 Spec"
unit_id: GF-T1-306
verified: true
price: 4500
tags:
  - telemetry
  - markdown
  - lean-tuner
`;
  const parsed = parseYamlFrontmatter(yaml);
  assert.equal(parsed.title, 'Cluster 007 Spec');
  assert.equal(parsed.unit_id, 'GF-T1-306');
  assert.equal(parsed.verified, true);
  assert.equal(parsed.price, 4500);
  assert.deepEqual(parsed.tags, ['telemetry', 'markdown', 'lean-tuner']);
  console.log('  ✔ parseYamlFrontmatter passed');
}

// Test 3: Slugify
{
  assert.equal(slugify('🏷️ Dealership Telemetry Window Sticker!'), 'dealership-telemetry-window-sticker');
  assert.equal(slugify('Section 1.2: Deep Dive into Engine'), 'section-12-deep-dive-into-engine');
  console.log('  ✔ slugify passed');
}

// Test 4: Comprehensive Vault Manifest Extraction
{
  const markdown = `---
author: Lead Robot
version: 1.0.0
---

# Dealership Overview
Welcome to the showroom. Inspect [[specs/cluster-007|Cluster Specs]] and [[pricing-guide]].

## Performance Benchmarks #telemetry #fast
Here are the operations:
- [x] Write engine.js
- [x] Run test suite
- [ ] Deploy live beacon

\`\`\`javascript
const speed = 250000;
\`\`\`
`;

  const manifest = extractVaultManifest(markdown);

  // Frontmatter
  assert.equal(manifest.frontmatter.author, 'Lead Robot');
  assert.equal(manifest.frontmatter.version, '1.0.0');

  // Headings
  assert.equal(manifest.headings.length, 2);
  assert.equal(manifest.headings[0].text, 'Dealership Overview');
  assert.equal(manifest.headings[0].level, 1);
  assert.equal(manifest.headings[1].level, 2);

  // Wikilinks
  assert.equal(manifest.wikilinks.length, 2);
  assert.equal(manifest.wikilinks[0].target, 'specs/cluster-007');
  assert.equal(manifest.wikilinks[0].alias, 'Cluster Specs');
  assert.equal(manifest.wikilinks[1].target, 'pricing-guide');
  assert.equal(manifest.wikilinks[1].alias, null);

  // Tags
  assert.ok(manifest.tags.includes('telemetry'));
  assert.ok(manifest.tags.includes('fast'));

  // Tasks
  assert.equal(manifest.tasks.total, 3);
  assert.equal(manifest.tasks.completed, 2);
  assert.equal(manifest.tasks.percent, 67);

  // Code Blocks
  assert.equal(manifest.codeBlocks.length, 1);
  assert.equal(manifest.codeBlocks[0].lang, 'javascript');

  console.log('  ✔ extractVaultManifest passed');
}

// Test 5: Frontmatter Injection & Stripping
{
  const doc = '# Pure Document\nHello world.';
  const injected = injectFrontmatter(doc, { status: 'draft', sku: 'GF-306' });
  assert.ok(injected.startsWith('---\nstatus: draft\nsku: GF-306\n---'));
  assert.ok(injected.includes('# Pure Document'));

  const stripped = stripFrontmatter(injected);
  assert.equal(stripped, doc);
  console.log('  ✔ injectFrontmatter & stripFrontmatter passed');
}

// Test 6: Benchmark Execution
{
  const bench = benchmarkMarkdownExtractor(1000);
  assert.ok(bench.throughputPerSec > 1000, `Throughput was ${bench.throughputPerSec} / sec`);
  console.log(`  ✔ benchmarkMarkdownExtractor passed (${bench.throughputPerSec} docs/sec, latency: ${bench.avgLatencyUs} µs)`);
}

console.log('🏁 [Unit #306 Test Suite] ALL CHECKS 100% GREEN.\n');
