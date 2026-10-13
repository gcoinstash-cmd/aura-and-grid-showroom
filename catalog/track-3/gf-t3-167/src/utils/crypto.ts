/**
 * Real Cryptographic Utility for GF-T3-167 HMAC Non-Repudiation
 * Uses Web Crypto API for SHA-256 and HMAC-SHA256
 */

export const MASTER_HMAC_SECRET = 'GF_T3_167_NON_REPUDIATION_MASTER_KEY_2026';

export async function computeSha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeHmacSha256(message: string, secret: string = MASTER_HMAC_SECRET): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function formatTickMessage(tick: {
  sequenceId: number;
  timestamp: string;
  symbol: string;
  side: string;
  price: number;
  quantity: number;
  prevHash: string;
}): string {
  return `${tick.sequenceId}|${tick.timestamp}|${tick.symbol}|${tick.side}|${tick.price.toFixed(2)}|${tick.quantity}|${tick.prevHash}`;
}

export async function verifyTickHmac(tick: {
  sequenceId: number;
  timestamp: string;
  symbol: string;
  side: string;
  price: number;
  quantity: number;
  prevHash: string;
  hmacSignature: string;
}, secret: string = MASTER_HMAC_SECRET): Promise<boolean> {
  const canonical = formatTickMessage(tick);
  const computed = await computeHmacSha256(canonical, secret);
  return computed.toLowerCase() === tick.hmacSignature.toLowerCase();
}
