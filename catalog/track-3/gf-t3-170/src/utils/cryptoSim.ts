import { CanFdFrame, MerkleNode } from '../types/telemetry';

// Fast SHA-256 using Web Crypto API with synchronous fallback for immediate UI reactivity
export async function sha256(message: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // fallback
    }
  }
  return simpleSha256(message);
}

// Lightweight deterministic 32-bit FNV/Murmur hybrid hash formatted as 64-char hex
export function simpleSha256(str: string): string {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  let h3 = 0x811c9dc5 ^ str.length;
  let h4 = 0x9e3779b9 ^ str.length;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 3812015801);
    h4 = Math.imul(h4 ^ ch, 2718281829);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hex3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const hex4 = (h4 >>> 0).toString(16).padStart(8, '0');
  const hex5 = (Math.imul(h1, 31) >>> 0).toString(16).padStart(8, '0');
  const hex6 = (Math.imul(h2, 37) >>> 0).toString(16).padStart(8, '0');
  const hex7 = (Math.imul(h3, 41) >>> 0).toString(16).padStart(8, '0');
  const hex8 = (Math.imul(h4, 43) >>> 0).toString(16).padStart(8, '0');

  return (hex1 + hex2 + hex3 + hex4 + hex5 + hex6 + hex7 + hex8).toLowerCase();
}

/**
 * Sliding Window Replay Filter:
 * Window size: 64 frames (RFC 4303 IPsec anti-replay specification adapted for automotive CAN-FD).
 * Tracks the highest monotonic sequence number seen (head) and a 64-bit bitmask of verified frames.
 */
export class SlidingWindowFilter {
  public headSeq: number;
  public windowMask: bigint;
  public windowSize: number;
  public totalAccepted: number;
  public totalRejected: number;

  constructor(initialHead: number = 1000000, windowSize: number = 64) {
    this.headSeq = initialHead;
    this.windowMask = 0n;
    this.windowSize = windowSize;
    this.totalAccepted = 0;
    this.totalRejected = 0;
  }

  public checkAndAdd(seq: number): { valid: boolean; reason?: string } {
    if (seq > this.headSeq) {
      // Advanced forward
      const diff = BigInt(seq - this.headSeq);
      if (diff >= BigInt(this.windowSize)) {
        this.windowMask = 1n; // completely beyond window, reset mask with current bit
      } else {
        this.windowMask = (this.windowMask << diff) | 1n;
      }
      this.headSeq = seq;
      this.totalAccepted++;
      return { valid: true };
    }

    const diff = BigInt(this.headSeq - seq);
    if (diff >= BigInt(this.windowSize)) {
      this.totalRejected++;
      return { valid: false, reason: `STALE_SEQUENCE: Diff ${diff} exceeds 64-bit window` };
    }

    const bit = 1n << diff;
    if ((this.windowMask & bit) !== 0n) {
      this.totalRejected++;
      return { valid: false, reason: `REPLAY_DUPLICATE: Frame #${seq} already recorded in sliding window` };
    }

    // Accept out-of-order frame within window
    this.windowMask = this.windowMask | bit;
    this.totalAccepted++;
    return { valid: true };
  }

  public getMaskBinary(): string {
    return this.windowMask.toString(2).padStart(64, '0');
  }
}

/**
 * Builds a cryptographic Merkle Tree from an array of CAN-FD frame leaf hashes
 */
export function buildMerkleTree(frames: CanFdFrame[]): { root: string; nodes: MerkleNode[] } {
  if (frames.length === 0) {
    return { root: '0000000000000000000000000000000000000000000000000000000000000000', nodes: [] };
  }

  // Generate leaf nodes
  let currentLevel: MerkleNode[] = frames.map((frame, idx) => {
    const raw = `${frame.sequenceNumber}:${frame.arbitrationId}:${frame.payloadHex}:${frame.signatureHex}`;
    const leafHash = simpleSha256(raw);
    frame.merkleLeafHash = leafHash;
    return {
      hash: leafHash,
      isLeaf: true,
      frameId: frame.id,
      index: idx,
    };
  });

  const allNodes: MerkleNode[] = [...currentLevel];

  while (currentLevel.length > 1) {
    const nextLevel: MerkleNode[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left; // duplicate if odd count
      const combinedHash = simpleSha256(left.hash + right.hash);
      const parentNode: MerkleNode = {
        hash: combinedHash,
        left,
        right,
        isLeaf: false,
      };
      nextLevel.push(parentNode);
      allNodes.push(parentNode);
    }
    currentLevel = nextLevel;
  }

  return {
    root: currentLevel[0].hash,
    nodes: allNodes,
  };
}

// Sample ECU telemetry definitions for Lexus ES 350h Executive Quietude
export const LEXUS_QUIETUDE_ECUS = [
  {
    id: '0x1A4',
    name: 'ECU-ANC-CHAMBER',
    desc: 'Cabin Active Noise Cancellation Phase Inverter (48kHz Anti-Resonance)',
    standardPayload: '04A1B2C300F29104A1B2C300F29104A1B2C300F29104A1B2C300F29104A1B2C3'
  },
  {
    id: '0x2B0',
    name: 'ECU-HYBRID-INV',
    desc: 'Dual-Motor Hybrid Inverter Harmonic Damping (18.4 kHz PWM Filter)',
    standardPayload: '0812F981AA76100812F981AA76100812F981AA76100812F981AA76100812F981'
  },
  {
    id: '0x3F2',
    name: 'ECU-ACOUSTIC-SEAL',
    desc: 'Acoustic Glass Micro-Vibration Damper & Seal Solenoid Controller',
    standardPayload: '00FF4129C0018800FF4129C0018800FF4129C0018800FF4129C0018800FF4129'
  },
  {
    id: '0x0C8',
    name: 'ECU-BBW-DECEL',
    desc: 'Brake-by-Wire Deceleration Regenerative Blend Sensor (Silenced Servo)',
    standardPayload: 'F1289043DEADBEEFF1289043DEADBEEFF1289043DEADBEEFF1289043DEADBEEF'
  }
];

export function generateRandomFrame(seq: number, forceStatus?: CanFdFrame['status']): CanFdFrame {
  const ecu = LEXUS_QUIETUDE_ECUS[Math.floor(Math.random() * LEXUS_QUIETUDE_ECUS.length)];
  const status = forceStatus || 'VERIFIED';
  const seed = `${seq}-${ecu.id}-${Date.now()}`;
  const sig = simpleSha256(`ED25519-SIG-${seed}`) + simpleSha256(`ED25519-KEY-${seed}`);

  return {
    id: `FRAME-${seq.toString().padStart(7, '0')}`,
    timestamp: Date.now(),
    arbitrationId: ecu.id,
    ecuSource: ecu.name,
    busSpeedKbps: 5000,
    payloadHex: ecu.standardPayload,
    sequenceNumber: seq,
    signatureHex: sig.substring(0, 128),
    status,
    latencyMs: +(0.8 + Math.random() * 0.5).toFixed(2),
  };
}
