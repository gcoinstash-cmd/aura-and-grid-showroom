#!/usr/bin/env node

/**
 * Aura & Grid — Acquire.com Executive Buyer Brief PDF Exporter
 *
 * Compiles `docs/deal-room/MICRO_CLUSTERS_ONE_PAGER.md` into a clean, print-ready
 * institutional PDF (`docs/deal-room/MICRO_CLUSTERS_ONE_PAGER.pdf`) using headless
 * Chromium via Playwright, preserving all valuation tables, dyno gate blocks, and
 * interactive `mailto:` acquisition links.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const mdPath = path.join(rootDir, 'docs', 'deal-room', 'MICRO_CLUSTERS_ONE_PAGER.md');
const pdfPath = path.join(rootDir, 'docs', 'deal-room', 'MICRO_CLUSTERS_ONE_PAGER.pdf');

const md = fs.readFileSync(mdPath, 'utf8');

function formatInline(text) {
  return text
    // Links [label](url) — support parentheses inside mailto:/https: query strings
    .replace(/\[([^\]]+)\]\(((?:mailto:|https?:\/\/)\S+)\)/g, (_, label, href) => {
      const isCta = /ACQUIRE TITLE|INQUIRE VAULT/i.test(label);
      const cls = isCta ? ' class="cta-link"' : '';
      const safeHref = href.replace(/"/g, '&quot;');
      return `<a href="${safeHref}"${cls}>${label}</a>`;
    })
    // Bold **text**
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Inline code `code`
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const out = [];
  let i = 0;
  let inCode = false;
  let codeBuf = [];
  let metaLines = [];
  let seenFirstRule = false;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (!inCode) {
        inCode = true;
        codeBuf = [];
      } else {
        inCode = false;
        out.push(`<pre class="dyno-box"><code>${codeBuf.map(l => l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')).join('\n')}</code></pre>`);
      }
      i++;
      continue;
    }

    if (inCode) {
      codeBuf.push(line);
      i++;
      continue;
    }

    if (line.startsWith('# ')) {
      out.push(`<header class="doc-header"><div class="doc-eyebrow">AURA &amp; GRID // ACQUIRE.COM EXECUTIVE BUYER BRIEF</div><h1>${formatInline(line.slice(2).trim())}</h1>`);
      i++;
      while (i < lines.length && lines[i].trim() !== '---') {
        if (lines[i].trim()) {
          metaLines.push(lines[i].trim());
        }
        i++;
      }
      if (metaLines.length) {
        out.push('<div class="meta-grid">');
        for (const ml of metaLines) {
          const m = ml.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
          if (m) {
            out.push(`<div class="meta-item"><span class="meta-k">${m[1]}</span><span class="meta-v">${formatInline(m[2])}</span></div>`);
          } else {
            out.push(`<div class="meta-item"><span class="meta-v">${formatInline(ml)}</span></div>`);
          }
        }
        out.push('</div>');
      }
      out.push('</header>');
      seenFirstRule = true;
      i++; // skip '---'
      continue;
    }

    if (line.trim() === '---') {
      out.push('<hr class="section-rule">');
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      out.push(`<h2>${formatInline(line.slice(4).trim())}</h2>`);
      i++;
      continue;
    }

    // GitHub Alert / Blockquote
    if (line.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        const cleaned = lines[i].replace(/^>\s?/, '');
        if (!/^\[!IMPORTANT\]/i.test(cleaned.trim())) {
          quoteLines.push(formatInline(cleaned));
        }
        i++;
      }
      out.push(`<div class="callout-box">${quoteLines.join('<br>')}</div>`);
      continue;
    }

    // Markdown Table
    if (line.trim().startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (r) => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        const headers = parseRow(tableLines[0]);
        const aligns = parseRow(tableLines[1]).map(a => {
          if (a.startsWith(':') && a.endsWith(':')) return 'center';
          if (a.endsWith(':')) return 'right';
          return 'left';
        });
        const bodyRows = tableLines.slice(2).map(parseRow);
        out.push('<table><thead><tr>');
        headers.forEach((h, idx) => {
          out.push(`<th style="text-align:${aligns[idx] || 'left'}">${formatInline(h)}</th>`);
        });
        out.push('</tr></thead><tbody>');
        bodyRows.forEach(row => {
          out.push('<tr>');
          row.forEach((cell, idx) => {
            out.push(`<td style="text-align:${aligns[idx] || 'left'}">${formatInline(cell)}</td>`);
          });
          out.push('</tr>');
        });
        out.push('</tbody></table>');
      }
      continue;
    }

    // Unordered list
    if (line.startsWith('- ')) {
      out.push('<ul>');
      while (i < lines.length && lines[i].startsWith('- ')) {
        out.push(`<li>${formatInline(lines[i].slice(2).trim())}</li>`);
        i++;
      }
      out.push('</ul>');
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      out.push('<ol>');
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        out.push(`<li>${formatInline(lines[i].replace(/^\d+\.\s+/, '').trim())}</li>`);
        i++;
      }
      out.push('</ol>');
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph
    const pLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('>') &&
      !lines[i].startsWith('- ') &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].trim().startsWith('```') &&
      lines[i].trim() !== '---' &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      pLines.push(formatInline(lines[i].trim()));
      i++;
    }
    if (pLines.length) {
      out.push(`<p>${pLines.join(' ')}</p>`);
    }
  }

  return out.join('\n');
}

const bodyHtml = markdownToHtml(md);

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Aura &amp; Grid — Acquire.com Buyer Brief (MICRO_CLUSTERS_ONE_PAGER)</title>
  <style>
    @page {
      size: Letter;
      margin: 0.34in 0.44in;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      font-size: 8.6pt;
      line-height: 1.36;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .doc-header {
      background: #070B12;
      color: #F8FAFC;
      padding: 12px 16px;
      border-radius: 8px;
      border-left: 4px solid #FF9F0A;
      margin-bottom: 9px;
    }
    .doc-eyebrow {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 7pt;
      font-weight: 700;
      letter-spacing: 0.14em;
      color: #00F0FF;
      margin-bottom: 3px;
    }
    h1 {
      font-size: 12.2pt;
      font-weight: 800;
      line-height: 1.2;
      color: #FFFFFF;
      margin-bottom: 8px;
      letter-spacing: -0.01em;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 4px 12px;
      border-top: 1px solid #1E293B;
      padding-top: 7px;
      font-size: 7.6pt;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
    }
    .meta-k {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 6.4pt;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #94A3B8;
    }
    .meta-v {
      color: #E2E8F0;
      font-weight: 600;
    }
    h2 {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 8.8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #0F172A;
      border-bottom: 1.5px solid #0F172A;
      padding-bottom: 2px;
      margin: 8px 0 5px;
      page-break-after: avoid;
    }
    p {
      margin-bottom: 4.5px;
      color: #1E293B;
    }
    .section-rule {
      border: 0;
      height: 0;
      margin: 2px 0;
    }
    .callout-box {
      background: #FFFBEB;
      border: 1px solid #F59E0B;
      border-left: 4px solid #D97706;
      border-radius: 6px;
      padding: 6px 10px;
      margin: 6px 0;
      font-size: 8pt;
      color: #1E293B;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0 7px;
      font-size: 7.9pt;
      page-break-inside: avoid;
    }
    th {
      background: #0F172A;
      color: #F8FAFC;
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 4.5px 7px;
      border: 1px solid #0F172A;
    }
    td {
      padding: 4px 7px;
      border: 1px solid #CBD5E1;
      vertical-align: top;
      color: #1E293B;
    }
    td:nth-child(4), td:nth-child(5), th:nth-child(5) {
      white-space: nowrap;
    }
    tbody tr:nth-child(even) td {
      background: #F8FAFC;
    }
    code {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 7.8pt;
      background: #F1F5F9;
      color: #0F172A;
      padding: 1px 4px;
      border-radius: 3px;
      border: 1px solid #E2E8F0;
    }
    .dyno-box {
      background: #070B12;
      color: #34D399;
      padding: 9px 12px;
      border-radius: 6px;
      border: 1px solid #1E293B;
      margin: 6px 0 8px;
      overflow-x: auto;
      page-break-inside: avoid;
    }
    .dyno-box code {
      background: transparent;
      border: 0;
      color: #34D399;
      font-size: 7.4pt;
      line-height: 1.35;
      padding: 0;
    }
    ul, ol {
      margin: 4px 0 8px 18px;
    }
    li {
      margin-bottom: 3.5px;
      color: #1E293B;
    }
    a {
      color: #0284C7;
      text-decoration: none;
      font-weight: 600;
    }
    a.cta-link {
      display: inline-block;
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 7.3pt;
      font-weight: 800;
      letter-spacing: 0.04em;
      color: #0F172A;
      background: #FDE68A;
      border: 1px solid #D97706;
      padding: 2.5px 7px;
      border-radius: 4px;
      white-space: nowrap;
    }
    .doc-footer {
      margin-top: 10px;
      padding-top: 6px;
      border-top: 1px solid #CBD5E1;
      display: flex;
      justify-content: space-between;
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 7pt;
      color: #64748B;
    }
  </style>
</head>
<body>
  ${bodyHtml}
  <footer class="doc-footer">
    <span>AURA &amp; GRID // SOLE ENTREPRENEUR DIRECT TURNKEY APA</span>
    <span>SHOWROOM: https://auraandgrid.com/ &bull; DEAL DESK: garrett@auraandgrid.io</span>
  </footer>
</body>
</html>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(fullHtml, { waitUntil: 'networkidle' });
await page.pdf({
  path: pdfPath,
  format: 'Letter',
  scale: 0.75,
  margin: { top: '0.28in', bottom: '0.28in', left: '0.38in', right: '0.38in' },
  printBackground: true,
  preferCSSPageSize: false,
});
await browser.close();

const stat = fs.statSync(pdfPath);
console.log(`✅ [PDF Export] Generated ${path.relative(rootDir, pdfPath)} (${stat.size.toLocaleString()} bytes)`);
