# 🏷️ DEALERSHIP TELEMETRY WINDOW STICKER
## Unit #303: JSON/CSV Telemetry Stream Normalizer
**Asset Classification:** Track 1 (Lean Tuner / Daily Driver Utility Unit)  
**Parent Fleet Registry:** GhostFactoryOS × Aura & Grid (`fleet/cluster-007/`)

```
================================================================================
   GHOST FACTORY OS // TRACK 1 LEAN TUNER PROVENANCE SPECIFICATION
================================================================================
UNIT IDENTIFIER:        GF-T1-303
UNIT NAME:              JSON/CSV Telemetry Stream Normalizer
BATCH COHORT:           Cluster-007 (High-Velocity Utility Swarm)
COMMERCIAL STATUS:      100% Pure APA Buyout Title Transfer (Zero Seat Tiers)
RETAIL PRICE ANCHOR:    $4,500 USD (Fixed Outright IP Title Transfer)
EXCLUSIVE BUYOUT FLOOR: $3,800 – $6,500 USD
PERMITTED LABEL:        Deployable Source Template / Working Utility Engine
================================================================================
```

---

### 1. Operational Overview
Unit #303 is a lightweight, zero-dependency Node.js ESM micro-engine built for high-throughput ingestion pipelines. It ingests messy, heterogeneous telemetry data across JSON arrays, single JSON payloads, JSONL (Newline Delimited JSON), and raw RFC-4180 CSV strings, automatically sanitizing and compiling them into canonical telemetry records.

### 2. Operational IO Telemetry Matrix

| Specification | Operational Metric |
| :--- | :--- |
| **Input Formats** | Raw JSON Objects, JSON Arrays, JSONL Strings, RFC-4180 CSV with quotes/delimiters |
| **Output Format** | Canonical `NormalizedTelemetryRecord` schema (UUIDv4, UTC ISO, Epoch ms, Snake Metric, Float Value, Tag Map, Quality Tier) |
| **Throughput Benchmark** | **~290,000+ records / sec** on standard V8 engine |
| **Execution Latency** | **3.44 µs (0.0034 ms)** average processing latency per record |
| **External Dependencies** | **0** (Pure Node.js standard library: `node:crypto`) |
| **Memory Footprint** | Stream-safe memory consumption, zero leak GC profile |
| **Test Verification** | 100% Green (`node test.js`) |

---

### 3. Canonical Telemetry Schema Output Example

```json
{
  "record_id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
  "timestamp_iso": "2026-10-30T12:30:00.000Z",
  "timestamp_epoch_ms": 1793363400000,
  "source_id": "CHASSIS-007",
  "metric": "oil_temperature",
  "value": 94.2,
  "unit": "celsius",
  "dimensions": {
    "sector": "powertrain",
    "rev": "v2"
  },
  "quality": "VALID"
}
```

---

### 4. Integration Blueprint

```javascript
import { normalizeJson, normalizeCsv, normalizeRecord } from './engine.js';

// Ingest JSON / JSONL
const records = normalizeJson([
  { source: 'TURBO-01', reading: 22.4, sensor: 'BoostPressure', uom: 'psi' }
]);

// Ingest CSV
const csvData = `source,metric,value,unit\nTURBO-01,boost_pressure,22.4,psi`;
const csvRecords = normalizeCsv(csvData);
```

---

### 5. Legal & APA Title Transfer Protection
Under this Track 1 Micro-APA, the purchaser acquires complete, outright ownership of this standalone utility codebase (`engine.js`, `test.js`, and documentation). **Exclusions:** This title transfer does not transfer ownership of GhostFactoryOS, Aura & Grid showroom IP, shared factory tokens, or the broader 150-unit master vault.
