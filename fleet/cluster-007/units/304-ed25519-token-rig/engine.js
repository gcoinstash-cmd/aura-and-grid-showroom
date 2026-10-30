/**
 * Unit #304: Ed25519 Token Signer & Verification Rig
 * Track 1 (Lean Tuner) — Asymmetric Cryptographic Authentication Micro-Engine
 * 
 * GhostFactoryOS Architecture: Cluster-007
 * Pure ESM | Zero External Dependencies (Node.js standard library: node:crypto)
 */

import crypto from 'node:crypto';

/**
 * Custom error class for cryptographic token operations.
 */
export class TokenCryptoError extends Error {
  /**
   * @param {string} message - Error description
   * @param {string} [code='ERR_TOKEN_CRYPTO'] - Error code
   * @param {any} [details=null] - Contextual metadata
   */
  constructor(message, code = 'ERR_TOKEN_CRYPTO', details = null) {
    super(message);
    this.name = 'TokenCryptoError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Base64URL encoding according to RFC-7515.
 * @param {Buffer|string} input 
 * @returns {string}
 */
export function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Base64URL decoding according to RFC-7515.
 * @param {string} str 
 * @returns {Buffer}
 */
export function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64');
}

/**
 * Deterministic JSON stringify (canonical key ordering) to ensure bit-level reproducibility.
 * @param {any} obj 
 * @returns {string}
 */
export function canonicalJsonStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalJsonStringify(item)).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const entries = keys.map(k => `${JSON.stringify(k)}:${canonicalJsonStringify(obj[k])}`);
  return '{' + entries.join(',') + '}';
}

/**
 * Generates an asymmetric Ed25519 keypair in PKCS#8 / SPKI PEM format.
 * 
 * @returns {{ publicKeyPem: string, privateKeyPem: string }}
 */
export function generateEd25519KeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  return {
    publicKeyPem: publicKey,
    privateKeyPem: privateKey
  };
}

/**
 * Token Signing Configuration
 * @typedef {Object} SignTokenOptions
 * @property {string} [issuer] - Token issuer (`iss`)
 * @property {string} [subject] - Token subject (`sub`)
 * @property {string|string[]} [audience] - Token audience (`aud`)
 * @property {number} [expiresInSec=3600] - Lifespan in seconds (defaults to 1 hr)
 * @property {number} [notBeforeSec=0] - Delay in seconds before token becomes active
 * @property {string} [tokenId] - Custom token identifier (`jti`)
 */

/**
 * Signs a payload with an Ed25519 private key, outputting a compact base64url token.
 * Format: `header.payload.signature`
 * 
 * @param {Record<string, any>} payload - Custom claims and data
 * @param {string|crypto.KeyObject} privateKey - Ed25519 private key in PEM or KeyObject format
 * @param {SignTokenOptions} [options={}] - Standard claims configuration
 * @returns {string} Compact signed token
 */
export function signToken(payload, privateKey, options = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new TokenCryptoError('Payload must be a non-null object', 'ERR_INVALID_PAYLOAD');
  }
  if (!privateKey) {
    throw new TokenCryptoError('Private key is mandatory for signing', 'ERR_MISSING_KEY');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'Ed25519',
    typ: 'AG-TOKEN-V1'
  };

  const claims = { ...payload };

  // Standard Claims
  if (options.issuer && !claims.iss) claims.iss = options.issuer;
  if (options.subject && !claims.sub) claims.sub = options.subject;
  if (options.audience && !claims.aud) claims.aud = options.audience;
  if (!claims.iat) claims.iat = nowSec;
  if (options.notBeforeSec !== undefined && !claims.nbf) claims.nbf = nowSec + options.notBeforeSec;
  if (options.expiresInSec !== undefined && !claims.exp) claims.exp = nowSec + options.expiresInSec;
  if (!claims.jti) claims.jti = options.tokenId || crypto.randomUUID();

  const encodedHeader = base64UrlEncode(canonicalJsonStringify(header));
  const encodedPayload = base64UrlEncode(canonicalJsonStringify(claims));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  try {
    const signature = crypto.sign(null, Buffer.from(signingInput, 'utf8'), privateKey);
    const encodedSignature = base64UrlEncode(signature);
    return `${signingInput}.${encodedSignature}`;
  } catch (err) {
    throw new TokenCryptoError(`Failed to generate Ed25519 signature: ${err.message}`, 'ERR_SIGN_FAILED', err);
  }
}

/**
 * Token Verification Configuration
 * @typedef {Object} VerifyTokenOptions
 * @property {string} [issuer] - Expected issuer (`iss`)
 * @property {string|string[]} [audience] - Expected audience (`aud`)
 * @property {number} [clockToleranceSec=5] - Allowed clock drift leeway in seconds
 * @property {boolean} [ignoreExpiration=false] - Ignore `exp` claim validation
 */

/**
 * Result of Token Verification
 * @typedef {Object} VerificationResult
 * @property {boolean} valid - Whether the token signature and claims are genuine
 * @property {Record<string, any>|null} payload - Decoded token payload if valid
 * @property {Record<string, any>|null} header - Decoded token header if valid
 * @property {string|null} error - Error description if invalid
 * @property {string|null} errorCode - Standardized error code
 */

/**
 * Verifies an Ed25519 compact signed token.
 * 
 * @param {string} token - The raw compact token (`header.payload.signature`)
 * @param {string|crypto.KeyObject} publicKey - Ed25519 public key in PEM or KeyObject format
 * @param {VerifyTokenOptions} [options={}] - Verification assertions
 * @returns {VerificationResult}
 */
export function verifyToken(token, publicKey, options = {}) {
  if (typeof token !== 'string' || !token.trim()) {
    return { valid: false, payload: null, header: null, error: 'Token must be a non-empty string', errorCode: 'ERR_EMPTY_TOKEN' };
  }
  if (!publicKey) {
    return { valid: false, payload: null, header: null, error: 'Public key is required for verification', errorCode: 'ERR_MISSING_KEY' };
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return { valid: false, payload: null, header: null, error: 'Token structure must contain exactly 3 dot-delimited segments', errorCode: 'ERR_MALFORMED_TOKEN' };
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  // 1. Decode Header
  let header;
  try {
    header = JSON.parse(base64UrlDecode(encodedHeader).toString('utf8'));
  } catch (e) {
    return { valid: false, payload: null, header: null, error: 'Malformed token header JSON', errorCode: 'ERR_HEADER_PARSE' };
  }

  if (header.alg !== 'Ed25519') {
    return { valid: false, payload: null, header, error: `Unsupported algorithm: ${header.alg}. Only Ed25519 is accepted.`, errorCode: 'ERR_UNSUPPORTED_ALG' };
  }

  // 2. Decode Signature
  let signatureBuffer;
  try {
    signatureBuffer = base64UrlDecode(encodedSignature);
    if (signatureBuffer.length !== 64) {
      return { valid: false, payload: null, header, error: `Invalid Ed25519 signature byte length: ${signatureBuffer.length} (expected 64)`, errorCode: 'ERR_INVALID_SIG_LENGTH' };
    }
  } catch (e) {
    return { valid: false, payload: null, header, error: 'Malformed base64url signature encoding', errorCode: 'ERR_SIGNATURE_DECODE' };
  }

  // 3. Cryptographic Signature Verification
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  let isSignatureGenuine = false;
  try {
    isSignatureGenuine = crypto.verify(null, Buffer.from(signingInput, 'utf8'), publicKey, signatureBuffer);
  } catch (err) {
    return { valid: false, payload: null, header, error: `Cryptographic verification failed: ${err.message}`, errorCode: 'ERR_CRYPTO_VERIFY_EXCEPTION' };
  }

  if (!isSignatureGenuine) {
    return { valid: false, payload: null, header, error: 'Signature verification failed: token has been tampered with or key is incorrect', errorCode: 'ERR_SIGNATURE_INVALID' };
  }

  // 4. Decode Payload
  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf8'));
  } catch (e) {
    return { valid: false, payload: null, header, error: 'Malformed token payload JSON', errorCode: 'ERR_PAYLOAD_PARSE' };
  }

  // 5. Claims Verification
  const nowSec = Math.floor(Date.now() / 1000);
  const tolerance = options.clockToleranceSec ?? 5;

  // Expiration Check
  if (!options.ignoreExpiration && typeof payload.exp === 'number') {
    if (nowSec - tolerance > payload.exp) {
      return { valid: false, payload, header, error: `Token expired at epoch ${payload.exp} (current epoch ${nowSec})`, errorCode: 'ERR_TOKEN_EXPIRED' };
    }
  }

  // Not Before Check
  if (typeof payload.nbf === 'number') {
    if (nowSec + tolerance < payload.nbf) {
      return { valid: false, payload, header, error: `Token not valid before epoch ${payload.nbf} (current epoch ${nowSec})`, errorCode: 'ERR_TOKEN_NOT_ACTIVE' };
    }
  }

  // Issuer Check
  if (options.issuer && payload.iss !== options.issuer) {
    return { valid: false, payload, header, error: `Issuer mismatch: expected '${options.issuer}', got '${payload.iss}'`, errorCode: 'ERR_ISSUER_MISMATCH' };
  }

  // Audience Check
  if (options.audience) {
    const expectedAud = Array.isArray(options.audience) ? options.audience : [options.audience];
    const tokenAud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const match = expectedAud.some(aud => tokenAud.includes(aud));
    if (!match) {
      return { valid: false, payload, header, error: `Audience mismatch: expected one of [${expectedAud.join(', ')}]`, errorCode: 'ERR_AUDIENCE_MISMATCH' };
    }
  }

  return {
    valid: true,
    payload,
    header,
    error: null,
    errorCode: null
  };
}

/**
 * Decodes header and payload without verifying cryptographic signatures.
 * (Inspection only — do not trust unverified data for authorization).
 * 
 * @param {string} token 
 * @returns {{ header: Record<string, any>|null, payload: Record<string, any>|null }}
 */
export function decodeToken(token) {
  if (typeof token !== 'string') return { header: null, payload: null };
  const parts = token.split('.');
  if (parts.length < 2) return { header: null, payload: null };

  let header = null;
  let payload = null;
  try {
    header = JSON.parse(base64UrlDecode(parts[0]).toString('utf8'));
  } catch {}
  try {
    payload = JSON.parse(base64UrlDecode(parts[1]).toString('utf8'));
  } catch {}

  return { header, payload };
}

/**
 * Performance benchmark utility measuring sign and verify speeds.
 * @param {number} [iterations=1000]
 * @returns {{ iterations: number, signLatencyUs: number, verifyLatencyUs: number, opsPerSec: number }}
 */
export function benchmarkTokenRig(iterations = 1000) {
  const { publicKeyPem, privateKeyPem } = generateEd25519KeyPair();
  const samplePayload = {
    role: 'operator',
    asset_id: 'GF-T1-CHASSIS-007',
    clearance: 'omega-level',
    telemetry_stream: 'active'
  };

  // Benchmark Signing
  const signStart = performance.now();
  let sampleToken = '';
  for (let i = 0; i < iterations; i++) {
    sampleToken = signToken(samplePayload, privateKeyPem, { expiresInSec: 3600 });
  }
  const signEnd = performance.now();
  const totalSignMs = signEnd - signStart;
  const signLatencyUs = (totalSignMs * 1000) / iterations;

  // Benchmark Verification
  const verifyStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    verifyToken(sampleToken, publicKeyPem);
  }
  const verifyEnd = performance.now();
  const totalVerifyMs = verifyEnd - verifyStart;
  const verifyLatencyUs = (totalVerifyMs * 1000) / iterations;

  const totalOps = iterations * 2;
  const totalTimeMs = totalSignMs + totalVerifyMs;
  const opsPerSec = Math.round((totalOps / totalTimeMs) * 1000);

  return {
    iterations,
    signLatencyUs: Number(signLatencyUs.toFixed(3)),
    verifyLatencyUs: Number(verifyLatencyUs.toFixed(3)),
    opsPerSec
  };
}
