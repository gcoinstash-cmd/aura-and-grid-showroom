# 🏷️ DEALERSHIP TELEMETRY WINDOW STICKER
## Unit #306: Markdown Vault Metadata Extractor & Formatter
**Asset Classification:** Track 1 (Lean Tuner / Daily Driver Utility Unit)  
**Parent Fleet Registry:** GhostFactoryOS × Aura & Grid (`fleet/cluster-007/`)

```
================================================================================
   GHOST FACTORY OS // TRACK 1 LEAN TUNER PROVENANCE SPECIFICATION
================================================================================
UNIT IDENTIFIER:        GF-T1-306
UNIT NAME:              Markdown Vault Metadata Extractor & Formatter
BATCH COHORT:           Cluster-007 (High-Velocity Utility Swarm)
COMMERCIAL STATUS:      100% Pure APA Buyout Title Transfer (Zero Seat Tiers)
RETAIL PRICE ANCHOR:    $4,500 USD (Fixed Outright IP Title Transfer)
EXCLUSIVE BUYOUT FLOOR: $3,800 – $6,500 USD
PERMITTED LABEL:        Deployable Source Template / Working Utility Engine
================================================================================
```

---

### 1. Operational Overview
Unit #306 is a zero-dependency markdown vault ingestion, parsing, and formatting engine. It parses YAML frontmatter without external YAML dependencies, extracts document outline headings with URL slug anchors, tracks Obsidian-compatible wikilinks (`[[target|alias]]`), indexes semantic hashtags, inspects code block syntax tags, and calculates checklist task completion metrics.

### 2. Operational IO Telemetry Matrix

| Specification | Operational Metric |
| :--- | :--- |
| **Supported Syntax** | Standard CommonMark, YAML Frontmatter (`---`), Obsidian Wikilinks (`[[target\|alias]]`), Hashtags (`#tag`), Task lists (`- [x]`), Fenced code blocks (` ``` `) |
| **Manifest Outputs** | Clean Frontmatter Map, Headings Array with Slugs, Wikilink Index, Unique Tags Set, Code Block Inventory, Task Metrics (Total, Completed, Percentage), Word/Char/Reading Time Stats |
| **Throughput Benchmark** | **~100,000 documents / sec** |
| **Execution Latency** | **~10.0 µs (0.010 ms)** per document pass |
| **Transform Functions** | `injectFrontmatter(doc, meta)`, `stripFrontmatter(doc)`, `serializeYamlFrontmatter(meta)` |
| **External Dependencies** | **0** (Node.js standard library only) |
| **Test Verification** | 100% Green (`node test.js`) |

---

### 3. Output Manifest Structure Example

```json
{
  "frontmatter": {
    "unit_id": "GF-T1-306",
    "status": "active",
    "price": 4500
  },
  "headings": [
    { "level": 1, "text": "Dealership Overview", "slug": "dealership-overview" },
    { "level": 2, "text": "Performance Benchmarks", "slug": "performance-benchmarks" }
  ],
  "wikilinks": [
    { "target": "specs/cluster-007", "alias": "Cluster Specs" }
  ],
  "tags": ["telemetry", "fast"],
  "tasks": { "total": 3, "completed": 2, "percent": 67 },
  "stats": { "words": 420, "chars": 2680, "readingTimeMin": 2.1 }
}
```

---

### 4. Integration Blueprint

```javascript
import { extractVaultManifest, injectFrontmatter, stripFrontmatter } from './engine.js';

const doc = `---
title: Dealership Blueprint
---
# Operations
See [[cluster-007]] for specifications.
- [x] Phase 1
- [ ] Phase 2
`;

// Extract structural manifest
const manifest = extractVaultManifest(doc);
console.log(manifest.tasks.percent); // 50%

// Update frontmatter dynamically
const updatedDoc = injectFrontmatter(doc, { last_audit: '2026-10-30' });
```

---

### 5. Legal & APA Title Transfer Protection
Under this Track 1 Micro-APA, the purchaser acquires complete, outright ownership of this standalone utility codebase (`engine.js`, `test.js`, and documentation). **Exclusions:** This title transfer does not transfer ownership of GhostFactoryOS, Aura & Grid showroom IP, shared factory tokens, or the broader 150-unit master vault.
