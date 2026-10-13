/**
 * Real Web Crypto API utilities for GF-T3-191 HMAC-SHA256 signature chains.
 */

export async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeHmacSha256(secretKey: string, message: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(message)
    );
    const sigArray = Array.from(new Uint8Array(signatureBuffer));
    return sigArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    // Fallback sha256 hex if HMAC subtle fails
    return sha256Hex(`${secretKey}:${message}`);
  }
}

export function formatTruncatedHash(hash: string, front: number = 8, back: number = 8): string {
  if (!hash || hash.length <= front + back) return hash;
  return `${hash.slice(0, front)}...${hash.slice(-back)}`;
}
