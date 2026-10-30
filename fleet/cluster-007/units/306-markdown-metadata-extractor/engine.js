/**
 * Unit #306: Markdown Vault Metadata Extractor & Formatter
 * Track 1 (Lean Tuner) — Standalone Markdown & Frontmatter Vault Engine
 * 
 * GhostFactoryOS Architecture: Cluster-007
 * Pure ESM | Zero External Dependencies (Node.js Standard Library Only)
 */

/**
 * Custom error for markdown vault operations.
 */
export class MarkdownVaultError extends Error {
  /**
   * @param {string} message 
   * @param {string} [code='ERR_MARKDOWN_VAULT'] 
   */
  constructor(message, code = 'ERR_MARKDOWN_VAULT') {
    super(message);
    this.name = 'MarkdownVaultError';
    this.code = code;
  }
}

/**
 * Parses scalar values (strings, numbers, booleans, null, arrays) from YAML.
 * @param {string} rawVal 
 * @returns {any}
 */
export function parseYamlScalar(rawVal) {
  const trimmed = rawVal.trim();
  if (trimmed === '' || trimmed === '~' || trimmed === 'null') return null;
  if (trimmed === 'true' || trimmed === 'True') return true;
  if (trimmed === 'false' || trimmed === 'False') return false;

  // Inline array: [a, b, c]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map(s => parseYamlScalar(s.trim()));
  }

  // Quoted string
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  // Number
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
}

/**
 * Lightweight, zero-dependency YAML frontmatter parser for markdown documents.
 * Handles key-values, lists, inline arrays, and comments.
 * 
 * @param {string} yamlText 
 * @returns {Record<string, any>}
 */
export function parseYamlFrontmatter(yamlText) {
  if (typeof yamlText !== 'string' || !yamlText.trim()) return {};

  const lines = yamlText.split(/\r?\n/);
  const result = {};
  let currentKey = null;
  let currentArray = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    // Ignore pure comment lines
    if (/^\s*#/.test(rawLine)) continue;
    if (!rawLine.trim()) continue;

    // List item: - value
    const listMatch = rawLine.match(/^\s*-\s+(.*)$/);
    if (listMatch) {
      if (currentKey && currentArray) {
        currentArray.push(parseYamlScalar(listMatch[1]));
        result[currentKey] = currentArray;
      }
      continue;
    }

    // Key-value pair: key: value
    const kvMatch = rawLine.match(/^([a-zA-Z0-9_\-\.]+)\s*:\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      const valStr = kvMatch[2].trim();

      if (valStr === '') {
        // Potential upcoming list
        currentKey = key;
        currentArray = [];
        result[key] = currentArray;
      } else {
        currentKey = null;
        currentArray = null;
        result[key] = parseYamlScalar(valStr);
      }
      continue;
    }
  }

  return result;
}

/**
 * Serializes a JavaScript object into clean YAML frontmatter.
 * @param {Record<string, any>} obj 
 * @returns {string}
 */
export function serializeYamlFrontmatter(obj) {
  if (!obj || typeof obj !== 'object') return '';
  const lines = ['---'];

  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      lines.push(`${key}: null`);
    } else if (Array.isArray(val)) {
      lines.push(`${key}:`);
      for (const item of val) {
        lines.push(`  - ${typeof item === 'string' && item.includes(':') ? `"${item}"` : item}`);
      }
    } else if (typeof val === 'object') {
      lines.push(`${key}:`);
      for (const [subK, subV] of Object.entries(val)) {
        lines.push(`  ${subK}: ${subV}`);
      }
    } else if (typeof val === 'string' && (val.includes(':') || val.includes('\n') || val.includes('"'))) {
      lines.push(`${key}: ${JSON.stringify(val)}`);
    } else {
      lines.push(`${key}: ${val}`);
    }
  }

  lines.push('---');
  return lines.join('\n');
}

/**
 * Generates a clean URL slug from heading text.
 * @param {string} text 
 * @returns {string}
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extracted Heading Structure
 * @typedef {Object} HeadingItem
 * @property {number} level - 1 through 6
 * @property {string} text - Clean heading text
 * @property {string} slug - Anchor ID
 */

/**
 * Vault Manifest Structure
 * @typedef {Object} VaultManifest
 * @property {Record<string, any>} frontmatter - Parsed frontmatter properties
 * @property {HeadingItem[]} headings - Extracted document outline
 * @property {Array<{ target: string, alias: string|null }>} wikilinks - Extracted Obsidian [[wikilinks]]
 * @property {string[]} tags - Extracted hashtags (#tag)
 * @property {Array<{ lang: string, lineCount: number }>} codeBlocks - Extracted fenced code snippets
 * @property {{ total: number, completed: number, percent: number }} tasks - Task list completion metrics
 * @property {{ words: number, chars: number, readingTimeMin: number }} stats - Text length heuristics
 */

/**
 * Extracts complete structural and semantic metadata from a markdown document.
 * 
 * @param {string} markdownText 
 * @returns {VaultManifest}
 */
export function extractVaultManifest(markdownText) {
  if (typeof markdownText !== 'string') {
    return {
      frontmatter: {},
      headings: [],
      wikilinks: [],
      tags: [],
      codeBlocks: [],
      tasks: { total: 0, completed: 0, percent: 100 },
      stats: { words: 0, chars: 0, readingTimeMin: 0 }
    };
  }

  let body = markdownText;
  let frontmatter = {};

  // 1. Extract Frontmatter
  const frontmatterMatch = markdownText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (frontmatterMatch) {
    frontmatter = parseYamlFrontmatter(frontmatterMatch[1]);
    body = markdownText.slice(frontmatterMatch[0].length);
  }

  // 2. Extract Headings (skipping code blocks)
  const lines = body.split(/\r?\n/);
  const headings = [];
  const codeBlocks = [];
  let inCodeBlock = false;
  let currentCodeLang = '';
  let currentCodeLines = 0;
  let taskTotal = 0;
  let taskCompleted = 0;

  for (const line of lines) {
    // Check Code Block Fences
    const fenceMatch = line.match(/^(`{3,}|~{3,})\s*([a-zA-Z0-9_\-\.]*)/);
    if (fenceMatch) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        currentCodeLang = fenceMatch[2] || 'text';
        currentCodeLines = 0;
      } else {
        inCodeBlock = false;
        codeBlocks.push({ lang: currentCodeLang, lineCount: currentCodeLines });
      }
      continue;
    }

    if (inCodeBlock) {
      currentCodeLines++;
      continue;
    }

    // Heading extraction
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      headings.push({
        level,
        text,
        slug: slugify(text)
      });
      continue;
    }

    // Task Checklist items
    const taskMatch = line.match(/^\s*-\s*\[([ xX])\]\s+(.*)$/);
    if (taskMatch) {
      taskTotal++;
      if (taskMatch[1].toLowerCase() === 'x') {
        taskCompleted++;
      }
    }
  }

  // 3. Extract Wikilinks [[target]] or [[target|alias]]
  const wikilinks = [];
  const wikilinkRegex = /\[\[([a-zA-Z0-9_\-\s\.\/]+?)(?:\|([^\]]+?))?\]\]/g;
  let match;
  while ((match = wikilinkRegex.exec(body)) !== null) {
    wikilinks.push({
      target: match[1].trim(),
      alias: match[2] ? match[2].trim() : null
    });
  }

  // 4. Extract Hashtags (#tag but not # Heading or #123)
  const tags = new Set();
  const tagRegex = /(?:^|\s)#([a-zA-Z][a-zA-Z0-9_\-\/]*)/g;
  while ((match = tagRegex.exec(body)) !== null) {
    tags.add(match[1]);
  }

  // 5. Calculate Metrics
  const words = body.trim().length > 0 ? body.trim().split(/\s+/).length : 0;
  const chars = body.length;
  const readingTimeMin = Number((words / 200).toFixed(1)); // ~200 WPM
  const taskPercent = taskTotal > 0 ? Math.round((taskCompleted / taskTotal) * 100) : 100;

  return {
    frontmatter,
    headings,
    wikilinks,
    tags: Array.from(tags),
    codeBlocks,
    tasks: {
      total: taskTotal,
      completed: taskCompleted,
      percent: taskPercent
    },
    stats: {
      words,
      chars,
      readingTimeMin
    }
  };
}

/**
 * Injects or replaces YAML frontmatter in a markdown document.
 * 
 * @param {string} markdownText 
 * @param {Record<string, any>} newMetadata 
 * @returns {string}
 */
export function injectFrontmatter(markdownText, newMetadata) {
  let body = markdownText;
  const frontmatterMatch = markdownText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (frontmatterMatch) {
    const existing = parseYamlFrontmatter(frontmatterMatch[1]);
    const merged = { ...existing, ...newMetadata };
    body = markdownText.slice(frontmatterMatch[0].length);
    return `${serializeYamlFrontmatter(merged)}\n\n${body.trimStart()}`;
  }

  return `${serializeYamlFrontmatter(newMetadata)}\n\n${markdownText.trimStart()}`;
}

/**
 * Removes frontmatter from markdown content.
 * 
 * @param {string} markdownText 
 * @returns {string}
 */
export function stripFrontmatter(markdownText) {
  const match = markdownText.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? markdownText.slice(match[0].length).trimStart() : markdownText;
}

/**
 * Benchmark markdown extraction utility.
 * @param {number} [iterations=2000]
 * @returns {{ iterations: number, throughputPerSec: number, avgLatencyUs: number }}
 */
export function benchmarkMarkdownExtractor(iterations = 2000) {
  const sampleDoc = `---
unit_id: GF-T1-306
status: active
tags: [telemetry, parser, cluster-007]
price: 4500
---

# Ghost Factory Ingestion Engine
This is a high-speed parser for [[asset-manifest|Asset Manifest]] and [[telemetry-spec]].

## Section 1: Overview #core
Here is a list of operational tasks:
- [x] Implement YAML frontmatter
- [x] Add wikilink scanner
- [ ] Deploy to Cloud Run

\`\`\`javascript
const x = 42;
\`\`\`
`;

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    extractVaultManifest(sampleDoc);
  }
  const end = performance.now();

  const totalTimeMs = end - start;
  const avgLatencyUs = (totalTimeMs * 1000) / iterations;
  const throughputPerSec = Math.round((iterations / totalTimeMs) * 1000);

  return {
    iterations,
    throughputPerSec,
    avgLatencyUs: Number(avgLatencyUs.toFixed(3))
  };
}
