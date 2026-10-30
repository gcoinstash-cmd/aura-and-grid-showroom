/**
 * Unit #305: Regex Pattern Shield & Sanitizer
 * Track 1 (Lean Tuner) — Zero-Dependency Defensive Payload Firewall & Secret Redactor
 * 
 * GhostFactoryOS Architecture: Cluster-007
 * Pure ESM | Zero External Dependencies (Node.js Standard Library Only)
 */

/**
 * Custom error class thrown when payload fails security clearance.
 */
export class SecurityShieldViolation extends Error {
  /**
   * @param {string} message 
   * @param {string} riskLevel 
   * @param {Array<Object>} matches 
   */
  constructor(message, riskLevel, matches = []) {
    super(message);
    this.name = 'SecurityShieldViolation';
    this.riskLevel = riskLevel;
    this.matches = matches;
  }
}

/**
 * Pre-compiled linear, ReDoS-safe defensive inspection patterns.
 */
export const SHIELD_PATTERNS = {
  // 1. SQL Injection Vectors
  SQLI: [
    { id: 'SQLI_UNION_SELECT', regex: /\bunion\s+(all\s+)?select\b/i, severity: 95, name: 'Union-based SQL Injection' },
    { id: 'SQLI_BOOLEAN_OR', regex: /\b(or|and)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i, severity: 85, name: 'Boolean SQL Tautology' },
    { id: 'SQLI_STACKED_COMMENT', regex: /(--|\/\*|\*\/|#\s*$)/m, severity: 70, name: 'SQL Comment Ingestion' },
    { id: 'SQLI_BLIND_SLEEP', regex: /\b(sleep|benchmark|waitfor\s+delay)\s*\(/i, severity: 90, name: 'Time-based Blind SQL Injection' },
    { id: 'SQLI_DROP_ALTER', regex: /\b(drop\s+table|alter\s+table|truncate\s+table)\b/i, severity: 95, name: 'Destructive DDL SQL Command' }
  ],

  // 2. Cross-Site Scripting (XSS)
  XSS: [
    { id: 'XSS_SCRIPT_TAG', regex: /<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/i, severity: 95, name: 'Script Tag Execution' },
    { id: 'XSS_INLINE_EVENT', regex: /\bon[a-z]{3,12}\s*=\s*['"][^'"]*['"]/i, severity: 85, name: 'Inline HTML Event Handler' },
    { id: 'XSS_JAVASCRIPT_URI', regex: /javascript\s*:\s*[^;\s]+/i, severity: 90, name: 'JavaScript Pseudo-Protocol URI' },
    { id: 'XSS_IFRAME_OBJECT', regex: /<\s*(iframe|object|embed|applet)\b[^>]*>/i, severity: 80, name: 'Embedded Object Vector' },
    { id: 'XSS_EVAL_EXEC', regex: /\b(eval|execScript|Function)\s*\(/i, severity: 90, name: 'Dynamic Code Evaluation' }
  ],

  // 3. Path Traversal & OS Command Injection
  TRAVERSAL_AND_CMD: [
    { id: 'TRAVERSAL_DOT_DOT', regex: /(\.\.[\/\\]|%2e%2e[%2f%5c])/i, severity: 85, name: 'Directory Traversal' },
    { id: 'NULL_BYTE_POISONING', regex: /(%00|\x00)/, severity: 95, name: 'Null Byte Ingestion' },
    { id: 'SHELL_INJECTION_CHAIN', regex: /(;\s*(rm|cat|curl|wget|sh|bash|powershell)\b|`[^`]+`|\$\([^)]+\))/i, severity: 95, name: 'Shell Command Substitution' }
  ],

  // 4. Secret & Credential Leakage Vectors
  SECRETS: [
    { id: 'SECRET_AWS_KEY', regex: /\bAKIA[0-9A-Z]{16}\b/, severity: 90, name: 'AWS Access Key ID' },
    { id: 'SECRET_PEM_KEY', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/, severity: 100, name: 'Private Key PEM Block' },
    { id: 'SECRET_JWT_TOKEN', regex: /\beyJ[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}\b/, severity: 80, name: 'Signed JWT Bearer Token' },
    { id: 'SECRET_GENERIC_KEY', regex: /(?:api[_-]?key|secret[_-]?token|auth[_-]?token|access[_-]?token)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{24,})['"]?/i, severity: 85, name: 'High-Entropy Secret Assignment' }
  ]
};

/**
 * Inspection Options
 * @typedef {Object} ShieldInspectOptions
 * @property {number} [maxInputLength=1048576] - 1MB length threshold to prevent ReDoS on massive inputs
 * @property {number} [toleranceScore=40] - Scores above this are flagged as unsafe
 * @property {string[]} [enabledCategories=['SQLI', 'XSS', 'TRAVERSAL_AND_CMD', 'SECRETS']]
 */

/**
 * Inspection Result
 * @typedef {Object} ShieldInspectionResult
 * @property {boolean} isSafe - True if risk score is within acceptable tolerance
 * @property {number} riskScore - Calculated danger score (0 - 100)
 * @property {'SAFE'|'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'} riskLevel - Qualitative classification
 * @property {Array<{ id: string, name: string, category: string, severity: number }>} matches - Triggered rule details
 */

/**
 * Inspects a string against defensive security heuristics.
 * 
 * @param {string} input 
 * @param {ShieldInspectOptions} [options={}]
 * @returns {ShieldInspectionResult}
 */
export function inspectString(input, options = {}) {
  if (typeof input !== 'string') {
    return { isSafe: true, riskScore: 0, riskLevel: 'SAFE', matches: [] };
  }

  const maxLen = options.maxInputLength ?? 1048576;
  const target = input.length > maxLen ? input.slice(0, maxLen) : input;
  const tolerance = options.toleranceScore ?? 40;
  const categories = options.enabledCategories || ['SQLI', 'XSS', 'TRAVERSAL_AND_CMD', 'SECRETS'];

  const matches = [];
  let maxSeverity = 0;

  for (const cat of categories) {
    const rules = SHIELD_PATTERNS[cat] || [];
    for (const rule of rules) {
      if (rule.regex.test(target)) {
        matches.push({
          id: rule.id,
          name: rule.name,
          category: cat,
          severity: rule.severity
        });
        if (rule.severity > maxSeverity) {
          maxSeverity = rule.severity;
        }
      }
    }
  }

  let riskLevel = 'SAFE';
  if (maxSeverity >= 90) riskLevel = 'CRITICAL';
  else if (maxSeverity >= 70) riskLevel = 'HIGH';
  else if (maxSeverity >= 40) riskLevel = 'MEDIUM';
  else if (maxSeverity > 0) riskLevel = 'LOW';

  const isSafe = maxSeverity < tolerance;

  return {
    isSafe,
    riskScore: maxSeverity,
    riskLevel,
    matches
  };
}

/**
 * Recursively inspects arbitrary objects, arrays, or primitives.
 * 
 * @param {any} target 
 * @param {ShieldInspectOptions} [options={}]
 * @returns {ShieldInspectionResult}
 */
export function inspect(target, options = {}) {
  const accumulatedMatches = new Map();
  let maxScore = 0;

  function traverse(item) {
    if (item === null || item === undefined) return;

    if (typeof item === 'string') {
      const res = inspectString(item, options);
      if (res.riskScore > maxScore) maxScore = res.riskScore;
      for (const m of res.matches) {
        accumulatedMatches.set(m.id, m);
      }
    } else if (Array.isArray(item)) {
      for (const sub of item) traverse(sub);
    } else if (typeof item === 'object') {
      for (const [key, val] of Object.entries(item)) {
        traverse(key);
        traverse(val);
      }
    }
  }

  traverse(target);

  const matches = Array.from(accumulatedMatches.values());
  const tolerance = options.toleranceScore ?? 40;

  let riskLevel = 'SAFE';
  if (maxScore >= 90) riskLevel = 'CRITICAL';
  else if (maxScore >= 70) riskLevel = 'HIGH';
  else if (maxScore >= 40) riskLevel = 'MEDIUM';
  else if (maxScore > 0) riskLevel = 'LOW';

  return {
    isSafe: maxScore < tolerance,
    riskScore: maxScore,
    riskLevel,
    matches
  };
}

/**
 * Sanitization Configuration Options
 * @typedef {Object} SanitizeOptions
 * @property {boolean} [redactSecrets=true] - Replace discovered secrets with [REDACTED_SECRET]
 * @property {boolean} [escapeHtml=true] - Convert <, >, &, ", ' into HTML safe entities
 * @property {boolean} [stripNullBytes=true] - Remove null bytes (%00 / \0)
 * @property {boolean} [stripControlChars=true] - Strip unprintable ASCII control characters
 */

/**
 * Escapes HTML characters to prevent XSS.
 * @param {string} str 
 * @returns {string}
 */
export function escapeHtmlEntities(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes a single string value.
 * 
 * @param {string} input 
 * @param {SanitizeOptions} [options={}]
 * @returns {string}
 */
export function sanitizeString(input, options = {}) {
  if (typeof input !== 'string') return input;

  const redactSecrets = options.redactSecrets ?? true;
  const escapeHtml = options.escapeHtml ?? true;
  const stripNullBytes = options.stripNullBytes ?? true;
  const stripControlChars = options.stripControlChars ?? true;

  let output = input;

  // 1. Strip Null Bytes
  if (stripNullBytes) {
    output = output.replace(/\x00|%00/g, '');
  }

  // 2. Strip Control Characters (except standard \t, \r, \n)
  if (stripControlChars) {
    output = output.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  // 3. Redact Secrets
  if (redactSecrets) {
    for (const rule of SHIELD_PATTERNS.SECRETS) {
      output = output.replace(rule.regex, '[REDACTED_SECRET]');
    }
  }

  // 4. Escape HTML
  if (escapeHtml) {
    output = escapeHtmlEntities(output);
  }

  return output;
}

/**
 * Deeply sanitizes payloads (objects, arrays, strings) while preserving structural integrity.
 * 
 * @template T
 * @param {T} payload 
 * @param {SanitizeOptions} [options={}]
 * @returns {T}
 */
export function sanitize(payload, options = {}) {
  if (payload === null || payload === undefined) {
    return payload;
  }

  if (typeof payload === 'string') {
    return sanitizeString(payload, options);
  }

  if (Array.isArray(payload)) {
    return payload.map(item => sanitize(item, options));
  }

  if (typeof payload === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(payload)) {
      const sanitizedKey = typeof key === 'string' ? sanitizeString(key, { ...options, escapeHtml: false }) : key;
      cleaned[sanitizedKey] = sanitize(value, options);
    }
    return cleaned;
  }

  return payload;
}

/**
 * Protective middleware: validates payload and returns sanitized copy or throws.
 * 
 * @template T
 * @param {T} payload 
 * @param {ShieldInspectOptions & SanitizeOptions} [options={}]
 * @returns {T} Sanitized payload
 * @throws {SecurityShieldViolation}
 */
export function shieldMiddleware(payload, options = {}) {
  const inspection = inspect(payload, options);

  if (!inspection.isSafe) {
    const topThreat = inspection.matches[0]?.name || 'Unknown Security Risk';
    throw new SecurityShieldViolation(
      `Shield violation detected: ${topThreat} (Risk Level: ${inspection.riskLevel}, Score: ${inspection.riskScore})`,
      inspection.riskLevel,
      inspection.matches
    );
  }

  return sanitize(payload, options);
}

/**
 * High-speed benchmark utility for the regex pattern shield.
 * @param {number} [iterations=2000]
 * @returns {{ iterations: number, throughputPerSec: number, avgLatencyUs: number }}
 */
export function benchmarkShield(iterations = 2000) {
  const samplePayload = {
    userId: 'usr_84920',
    query: 'SELECT status FROM fleet_units WHERE id = 305',
    metadata: {
      client: 'GhostFactoryOS-Client',
      comment: 'Regular benign operation parameter'
    }
  };

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    inspect(samplePayload);
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
