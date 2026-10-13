export interface CanFdFrame {
  id: string;
  timestamp: number;
  arbitrationId: string; // e.g. 0x1A4
  ecuSource: string; // e.g. 'ECU-QUIETUDE-ANC'
  busSpeedKbps: number; // 5000 kbps (CAN-FD data phase)
  payloadHex: string; // 64 bytes hex
  sequenceNumber: number; // Monotonic counter
  signatureHex: string; // 64-byte Ed25519 signature
  status: 'VERIFIED' | 'REPLAY_REJECTED' | 'SIGNATURE_FORGED' | 'RATE_LIMITED';
  latencyMs: number;
  merkleLeafHash?: string;
}

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  isLeaf: boolean;
  frameId?: string;
  index?: number;
}

export interface DiligenceItem {
  id: string;
  category: 'LEGAL' | 'TECHNICAL' | 'SECURITY' | 'ESCROW';
  title: string;
  status: 'VERIFIED' | 'PENDING' | 'ATTESTED';
  detail: string;
  artifactRef: string;
}

export interface PyTestCase {
  id: string;
  name: string;
  category: string;
  status: 'PASSED' | 'FAILED' | 'RUNNING';
  durationMs: number;
  description: string;
}
