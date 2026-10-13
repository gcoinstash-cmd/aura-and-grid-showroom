/**
 * Cryptographic ledger utilities for GF-T3-193 telemetry blocks
 * Implements real HMAC-SHA256 signature chains and hash verification
 */

export interface TelemetryBlock {
  blockHeight: number;
  nonce: number;
  timestamp: string;
  rpm: number;
  throttlePct: number;
  manifoldPressureKpa: number;
  acousticValveState: 'STAGE_1_CLOSED' | 'STAGE_2_OPEN';
  diffOilTempC: number;
  tbrRatio: number;
  leftWheelRpm: number;
  rightWheelRpm: number;
  yawMomentNm: number;
  prevHash: string;
  hmacSignature: string;
  status: 'COMMITTED' | 'QUARANTINED_THERMAL_LIMIT' | 'CORRUPTED';
}

const LEDGER_SECRET = "GF-T3-193-ACQUIRE-DELAWARE-LEDGER-KEY-2026";

export async function computeHmacSha256(dataString: string, secret = LEDGER_SECRET): Promise<string> {
  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  const msgData = enc.encode(dataString);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeSha256(dataString: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(dataString));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function formatBlockHashPayload(block: Omit<TelemetryBlock, 'hmacSignature'>): string {
  return `${block.blockHeight}:${block.nonce}:${block.timestamp}:${block.rpm}:${block.throttlePct}:${block.diffOilTempC.toFixed(1)}:${block.tbrRatio.toFixed(2)}:${block.prevHash}`;
}

export async function verifyBlockHmac(block: TelemetryBlock, secret = LEDGER_SECRET): Promise<boolean> {
  const payload = formatBlockHashPayload(block);
  const expectedHmac = await computeHmacSha256(payload, secret);
  return expectedHmac === block.hmacSignature;
}
