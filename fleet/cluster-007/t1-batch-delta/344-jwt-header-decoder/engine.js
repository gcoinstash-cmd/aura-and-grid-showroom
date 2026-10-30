/**
 * Unit #344: JWT Header Decoder & Alg-None Validator
 * Track 1 (Lean Tuner) — Zero-Dependency JWT Framing & Security Rig
 */

export class JwtSecurityError extends Error {
  constructor(message, code = 'ERR_JWT_SECURITY', details = null) {
    super(message);
    this.name = 'JwtSecurityError';
    this.code = code;
    this.details = details;
  }
}

function base64UrlDecode(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  return Buffer.from(b64, 'base64').toString('utf8');
}

export function decodeJwt(token, options = {}) {
  const { strictAlgNone = true, clockTolerance = 0 } = options;
  if (typeof token !== 'string' || !token.trim()) {
    throw new JwtSecurityError('JWT token must be a non-empty string', 'ERR_INVALID_TOKEN');
  }

  const parts = token.trim().split('.');
  if (parts.length < 2 || parts.length > 3) {
    throw new JwtSecurityError('Malformed JWT structure: expected 3 dot-delimited segments', 'ERR_MALFORMED_JWT');
  }

  let header, payload;
  try {
    header = JSON.parse(base64UrlDecode(parts[0]));
  } catch (err) {
    throw new JwtSecurityError('Failed to parse JWT header JSON', 'ERR_HEADER_PARSE', err.message);
  }

  try {
    payload = JSON.parse(base64UrlDecode(parts[1]));
  } catch (err) {
    throw new JwtSecurityError('Failed to parse JWT payload JSON', 'ERR_PAYLOAD_PARSE', err.message);
  }

  const signature = parts[2] || '';

  // Validate "alg: none" vulnerability
  if (strictAlgNone) {
    const alg = (header.alg || '').trim().toLowerCase();
    if (alg === 'none' || alg === '' || !header.alg) {
      throw new JwtSecurityError('CRITICAL: Insecure algorithm "none" detected in JWT header', 'ERR_ALG_NONE_FORBIDDEN');
    }
  }

  // Check expiration if exp is present
  const nowSec = Math.floor(Date.now() / 1000);
  let isExpired = false;
  if (typeof payload.exp === 'number') {
    isExpired = nowSec > (payload.exp + clockTolerance);
  }

  return {
    header,
    payload,
    signature,
    isExpired,
    algorithm: header.alg,
    hasSignature: signature.length > 0
  };
}

export function validateAlgNoneSecurity(header) {
  if (!header || typeof header !== 'object') return false;
  const alg = String(header.alg || '').trim().toLowerCase();
  return alg !== 'none' && alg.length > 0;
}
