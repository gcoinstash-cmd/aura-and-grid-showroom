/**
 * Unit #354: Cookie String Serializer & Decryptor
 * Track 1 (Lean Tuner) — RFC 6265 Cookie Parser & HMAC Signer
 */

import crypto from 'node:crypto';

export function parseCookies(cookieHeader) {
  const map = {};
  if (typeof cookieHeader !== 'string' || !cookieHeader.trim()) return map;

  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx !== -1) {
      const key = pair.slice(0, eqIdx).trim();
      let val = pair.slice(eqIdx + 1).trim();
      try {
        val = decodeURIComponent(val);
      } catch {}
      map[key] = val;
    }
  }
  return map;
}

export function serializeCookie(name, val, options = {}) {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(val)}`;
  if (options.maxAge) cookie += `; Max-Age=${Math.floor(options.maxAge)}`;
  if (options.domain) cookie += `; Domain=${options.domain}`;
  if (options.path) cookie += `; Path=${options.path}`;
  if (options.expires) cookie += `; Expires=${options.expires.toUTCString()}`;
  if (options.httpOnly) cookie += '; HttpOnly';
  if (options.secure) cookie += '; Secure';
  if (options.sameSite) {
    const s = options.sameSite.toLowerCase();
    cookie += `; SameSite=${s.charAt(0).toUpperCase() + s.slice(1)}`;
  }
  return cookie;
}

export function signCookieValue(val, secret) {
  const sig = crypto.createHmac('sha256', secret).update(val).digest('base64url');
  return `s:${val}.${sig}`;
}

export function unsignCookieValue(signedVal, secret) {
  if (typeof signedVal !== 'string' || !signedVal.startsWith('s:')) return null;
  const raw = signedVal.slice(2);
  const dotIdx = raw.lastIndexOf('.');
  if (dotIdx === -1) return null;

  const val = raw.slice(0, dotIdx);
  const expectedSig = raw.slice(dotIdx + 1);
  const actualSig = crypto.createHmac('sha256', secret).update(val).digest('base64url');

  const expectedBuf = Buffer.from(expectedSig);
  const actualBuf = Buffer.from(actualSig);

  if (expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf)) {
    return val;
  }
  return null;
}
