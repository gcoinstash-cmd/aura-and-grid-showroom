import { AuditBlock } from '../types/microstructure';

/**
 * Pure SHA-256 implementation using Web Crypto API.
 * Provides verifiable audit trail blocks for state transitions.
 */
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createBlock(
  index: number,
  eventType: string,
  payload: Record<string, unknown>,
  prevHash: string
): Promise<AuditBlock> {
  const timestamp = Date.now();
  const serialized = JSON.stringify({
    index,
    timestamp,
    eventType,
    payload,
    prevHash
  });
  const hash = await sha256(serialized);
  return {
    index,
    timestamp,
    eventType,
    payload,
    prevHash,
    hash
  };
}

export async function verifyAuditChain(chain: AuditBlock[]): Promise<{ valid: boolean; errorIndex?: number; reason?: string }> {
  for (let i = 1; i < chain.length; i++) {
    const curr = chain[i];
    const prev = chain[i - 1];

    if (curr.prevHash !== prev.hash) {
      return {
        valid: false,
        errorIndex: curr.index,
        reason: 'Broken chain link: prevHash does not match previous block hash'
      };
    }

    const serialized = JSON.stringify({
      index: curr.index,
      timestamp: curr.timestamp,
      eventType: curr.eventType,
      payload: curr.payload,
      prevHash: curr.prevHash
    });
    const recomputedHash = await sha256(serialized);

    if (curr.hash !== recomputedHash) {
      return {
        valid: false,
        errorIndex: curr.index,
        reason: 'Hash mismatch: block content has been tampered with'
      };
    }
  }

  return { valid: true };
}
