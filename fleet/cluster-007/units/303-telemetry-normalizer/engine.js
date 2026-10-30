/**
 * Unit #303: JSON/CSV Telemetry Stream Normalizer
 * Track 1 (Lean Tuner) — Standalone High-Speed Telemetry Ingestion Engine
 * 
 * GhostFactoryOS Architecture: Cluster-007
 * Pure ESM | Zero External Dependencies (Node.js Standard Library Only)
 */

import { randomUUID } from 'node:crypto';

/**
 * Custom error class for telemetry normalization issues.
 */
export class TelemetryNormalizationError extends Error {
  /**
   * @param {string} message - Error description
   * @param {string} [code='ERR_TELEMETRY_NORMALIZATION'] - Internal error code
   * @param {any} [details=null] - Additional contextual details
   */
  constructor(message, code = 'ERR_TELEMETRY_NORMALIZATION', details = null) {
    super(message);
    this.name = 'TelemetryNormalizationError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Standard Telemetry Record Definition
 * @typedef {Object} NormalizedTelemetryRecord
 * @property {string} record_id - Unique record UUIDv4
 * @property {string} timestamp_iso - ISO-8601 formatted UTC timestamp
 * @property {number} timestamp_epoch_ms - Milliseconds since Unix Epoch
 * @property {string} source_id - Normalized telemetry transmitter / asset ID
 * @property {string} metric - Standardized snake_case metric identifier
 * @property {number} value - Clean IEEE 754 float / int telemetry reading
 * @property {string} unit - Measurement unit (e.g., 'celsius', 'psi', 'rpm')
 * @property {Record<string, string>} dimensions - Normalized key-value metadata tags
 * @property {'VALID'|'DEGRADED'|'ANOMALOUS'} quality - Signal integrity classification
 */

/**
 * Normalization Engine Configuration
 * @typedef {Object} NormalizerOptions
 * @property {string} [defaultSourceId='GF-TELEMETRY-NODE'] - Fallback source ID if missing
 * @property {string} [defaultUnit='raw'] - Fallback unit
 * @property {boolean} [strict=false] - Throw on individual record parse failure vs skipping
 * @property {Record<string, string>} [csvColumnMap] - Map CSV column names to canonical schema
 * @property {string} [csvDelimiter=','] - Delimiter for CSV parser
 * @property {number} [minTimestampMs=0] - Lower bound epoch ms (rejects garbage dates)
 * @property {number} [maxTimestampMs=4102444800000] - Upper bound epoch ms (defaults to Year 2100)
 */

/**
 * Parses and sanitizes timestamps into ISO string and epoch ms.
 * Supports ISO-8601 strings, UNIX epoch seconds, and UNIX epoch milliseconds.
 * 
 * @param {string|number|Date} rawTime 
 * @param {NormalizerOptions} [opts={}]
 * @returns {{ iso: string, ms: number, degraded: boolean }}
 */
export function normalizeTimestamp(rawTime, opts = {}) {
  const minMs = opts.minTimestampMs ?? 0;
  const maxMs = opts.maxTimestampMs ?? 4102444800000;
  let epochMs;
  let degraded = false;

  if (rawTime === null || rawTime === undefined || rawTime === '') {
    epochMs = Date.now();
    degraded = true;
  } else if (rawTime instanceof Date) {
    epochMs = rawTime.getTime();
  } else if (typeof rawTime === 'number') {
    // If timestamp is in seconds (10 digits around 2020-2030), convert to ms
    if (rawTime > 0 && rawTime < 10000000000) {
      epochMs = Math.round(rawTime * 1000);
    } else {
      epochMs = Math.round(rawTime);
    }
  } else if (typeof rawTime === 'string') {
    const trimmed = rawTime.trim();
    // Check if numeric string
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const num = Number(trimmed);
      if (num < 10000000000) {
        epochMs = Math.round(num * 1000);
      } else {
        epochMs = Math.round(num);
      }
    } else {
      const parsed = Date.parse(trimmed);
      if (Number.isNaN(parsed)) {
        epochMs = Date.now();
        degraded = true;
      } else {
        epochMs = parsed;
      }
    }
  } else {
    epochMs = Date.now();
    degraded = true;
  }

  // Range validation
  if (epochMs < minMs || epochMs > maxMs) {
    if (opts.strict) {
      throw new TelemetryNormalizationError(
        `Timestamp ${epochMs}ms outside valid operational window [${minMs}, ${maxMs}]`,
        'ERR_INVALID_TIMESTAMP',
        { rawTime, epochMs }
      );
    }
    epochMs = Date.now();
    degraded = true;
  }

  return {
    iso: new Date(epochMs).toISOString(),
    ms: epochMs,
    degraded
  };
}

/**
 * Normalizes a metric name to snake_case.
 * @param {string} rawMetric
 * @returns {string}
 */
export function normalizeMetricName(rawMetric) {
  if (!rawMetric || typeof rawMetric !== 'string') {
    return 'unspecified_metric';
  }
  return rawMetric
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
    .replace(/^_+|_+$/g, '');
}

/**
 * Validates and casts numeric telemetry readings.
 * @param {any} rawValue
 * @param {boolean} [strict=false]
 * @returns {{ value: number, degraded: boolean }}
 */
export function normalizeNumericValue(rawValue, strict = false) {
  if (typeof rawValue === 'number') {
    if (Number.isFinite(rawValue)) {
      return { value: rawValue, degraded: false };
    }
    if (strict) {
      throw new TelemetryNormalizationError(`Non-finite numeric reading: ${rawValue}`, 'ERR_INVALID_VALUE');
    }
    return { value: 0, degraded: true };
  }

  if (typeof rawValue === 'string') {
    const cleaned = rawValue.trim();
    const num = Number(cleaned);
    if (!Number.isNaN(num) && Number.isFinite(num)) {
      return { value: num, degraded: false };
    }
  }

  if (strict) {
    throw new TelemetryNormalizationError(`Cannot coerce value '${rawValue}' to finite number`, 'ERR_INVALID_VALUE');
  }
  return { value: 0, degraded: true };
}

/**
 * Normalizes an individual raw telemetry object into the standard vehicle schema.
 * 
 * @param {Record<string, any>} raw 
 * @param {NormalizerOptions} [options={}]
 * @returns {NormalizedTelemetryRecord}
 */
export function normalizeRecord(raw, options = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new TelemetryNormalizationError('Record must be a key-value object', 'ERR_INVALID_RECORD', { raw });
  }

  // 1. Source ID
  const rawSource = raw.source_id ?? raw.source ?? raw.asset_id ?? raw.deviceId ?? raw.node;
  const sourceId = (typeof rawSource === 'string' && rawSource.trim().length > 0)
    ? rawSource.trim().toUpperCase()
    : (options.defaultSourceId || 'GF-TELEMETRY-NODE');

  // 2. Metric Identifier
  const rawMetric = raw.metric ?? raw.name ?? raw.sensor ?? raw.measurement ?? raw.key;
  const metric = normalizeMetricName(rawMetric);

  // 3. Numeric Value
  const rawVal = raw.value ?? raw.val ?? raw.reading ?? raw.data;
  const valResult = normalizeNumericValue(rawVal, options.strict);

  // 4. Timestamp
  const rawTime = raw.timestamp ?? raw.time ?? raw.ts ?? raw.epoch ?? raw.created_at;
  const timeResult = normalizeTimestamp(rawTime, options);

  // 5. Unit
  const rawUnit = raw.unit ?? raw.uom ?? options.defaultUnit ?? 'raw';
  const unit = String(rawUnit).trim().toLowerCase();

  // 6. Dimensions / Tags
  const rawDimensions = raw.dimensions ?? raw.tags ?? raw.meta ?? {};
  const dimensions = {};
  if (typeof rawDimensions === 'object' && rawDimensions !== null && !Array.isArray(rawDimensions)) {
    for (const [k, v] of Object.entries(rawDimensions)) {
      if (v !== undefined && v !== null) {
        dimensions[String(k).trim()] = String(v).trim();
      }
    }
  }

  // 7. Quality Flag
  let quality = 'VALID';
  if (raw.quality === 'ANOMALOUS' || raw.anomalous === true) {
    quality = 'ANOMALOUS';
  } else if (valResult.degraded || timeResult.degraded || raw.quality === 'DEGRADED') {
    quality = 'DEGRADED';
  }

  return {
    record_id: randomUUID(),
    timestamp_iso: timeResult.iso,
    timestamp_epoch_ms: timeResult.ms,
    source_id: sourceId,
    metric,
    value: valResult.value,
    unit,
    dimensions,
    quality
  };
}

/**
 * Normalizes JSON data in object, array, or JSONL string format.
 * 
 * @param {string|Array<any>|Object} jsonInput 
 * @param {NormalizerOptions} [options={}]
 * @returns {NormalizedTelemetryRecord[]}
 */
export function normalizeJson(jsonInput, options = {}) {
  if (jsonInput === null || jsonInput === undefined) {
    return [];
  }

  let items = [];

  if (Array.isArray(jsonInput)) {
    items = jsonInput;
  } else if (typeof jsonInput === 'object') {
    // If single object
    items = [jsonInput];
  } else if (typeof jsonInput === 'string') {
    const trimmed = jsonInput.trim();
    if (trimmed.length === 0) return [];

    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        items = Array.isArray(parsed) ? parsed : [parsed];
      } catch (err) {
        // Fallback: check if JSONL (newline-delimited JSON)
        items = parseJsonLines(trimmed, options.strict);
      }
    } else {
      // JSONL
      items = parseJsonLines(trimmed, options.strict);
    }
  } else {
    throw new TelemetryNormalizationError('Unsupported JSON input format', 'ERR_INPUT_FORMAT');
  }

  const results = [];
  for (const item of items) {
    try {
      results.push(normalizeRecord(item, options));
    } catch (err) {
      if (options.strict) throw err;
      // In non-strict mode, ignore malformed single records
    }
  }

  return results;
}

/**
 * Parses JSONL strings into an array of objects.
 * @param {string} text 
 * @param {boolean} strict 
 * @returns {Object[]}
 */
function parseJsonLines(text, strict) {
  const lines = text.split(/\r?\n/);
  const items = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      items.push(JSON.parse(line));
    } catch (err) {
      if (strict) {
        throw new TelemetryNormalizationError(`Malformed JSON on line ${i + 1}: ${err.message}`, 'ERR_JSON_LINE');
      }
    }
  }
  return items;
}

/**
 * Parses standard RFC-4180 CSV strings with quotes and delimiter support.
 * Zero external libraries.
 * 
 * @param {string} csvText 
 * @param {string} [delimiter=',']
 * @returns {string[][]} Array of row tokens
 */
export function parseCsvRows(csvText, delimiter = ',') {
  if (typeof csvText !== 'string' || !csvText.trim()) return [];

  const rows = [];
  let currentRow = [];
  let currentToken = '';
  let inQuotes = false;
  const len = csvText.length;

  for (let i = 0; i < len; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip LF after CR
      }
      currentRow.push(currentToken.trim());
      if (currentRow.some(col => col.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentToken = '';
    } else {
      currentToken += char;
    }
  }

  // Push final trailing field/row
  if (currentToken.length > 0 || currentRow.length > 0) {
    currentRow.push(currentToken.trim());
    if (currentRow.some(col => col.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes CSV telemetry text into standardized Telemetry Records.
 * 
 * @param {string} csvText - Raw CSV content
 * @param {NormalizerOptions} [options={}]
 * @returns {NormalizedTelemetryRecord[]}
 */
export function normalizeCsv(csvText, options = {}) {
  const delimiter = options.csvDelimiter || ',';
  const rows = parseCsvRows(csvText, delimiter);

  if (rows.length < 2) {
    return []; // Needs at least header + 1 row
  }

  const rawHeaders = rows[0].map(h => h.trim().toLowerCase());
  const columnMap = options.csvColumnMap || {};

  // Standardize headers using map or default heuristic
  const headerKeys = rawHeaders.map(h => columnMap[h] || h);

  const results = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rawObj = {};
    const dimensions = {};

    for (let c = 0; c < headerKeys.length; c++) {
      const key = headerKeys[c];
      const val = row[c] ?? '';

      if (['source_id', 'source', 'asset_id', 'device'].includes(key)) {
        rawObj.source_id = val;
      } else if (['metric', 'name', 'sensor', 'measurement'].includes(key)) {
        rawObj.metric = val;
      } else if (['value', 'val', 'reading'].includes(key)) {
        rawObj.value = val;
      } else if (['timestamp', 'time', 'ts', 'date'].includes(key)) {
        rawObj.timestamp = val;
      } else if (['unit', 'uom'].includes(key)) {
        rawObj.unit = val;
      } else if (['quality', 'status'].includes(key)) {
        rawObj.quality = val;
      } else if (key) {
        dimensions[key] = val;
      }
    }

    if (Object.keys(dimensions).length > 0) {
      rawObj.dimensions = dimensions;
    }

    try {
      results.push(normalizeRecord(rawObj, options));
    } catch (err) {
      if (options.strict) throw err;
    }
  }

  return results;
}

/**
 * Benchmarking utility measuring throughput and latency.
 * @param {number} [recordCount=5000]
 * @returns {{ count: number, totalTimeMs: number, avgLatencyUs: number, throughputRps: number }}
 */
export function benchmarkNormalizer(recordCount = 5000) {
  const sampleRecords = [];
  for (let i = 0; i < recordCount; i++) {
    sampleRecords.push({
      sensor: `CORE-TEMP-${i % 8}`,
      reading: 42.1 + (i % 100) * 0.1,
      time: '2026-10-30T12:00:00.000Z',
      uom: 'celsius',
      node: `CLUSTER-007-CHASSIS-${i % 4}`,
      tags: { rack: `R-${i % 10}`, env: 'production' }
    });
  }

  const start = performance.now();
  const normalized = normalizeJson(sampleRecords);
  const end = performance.now();

  const totalTimeMs = end - start;
  const avgLatencyUs = (totalTimeMs * 1000) / recordCount;
  const throughputRps = Math.round((recordCount / totalTimeMs) * 1000);

  return {
    count: normalized.length,
    totalTimeMs: Number(totalTimeMs.toFixed(3)),
    avgLatencyUs: Number(avgLatencyUs.toFixed(3)),
    throughputRps
  };
}
