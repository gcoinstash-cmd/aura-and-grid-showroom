export interface TelemetryMetrics {
  latencyP50: number; // in nanoseconds
  latencyP90: number;
  latencyP99: number;
  latencyP999: number;
  bufferCapacity: number; // 1,048,576
  claimedSequence: number;
  committedSequence: number;
  consumedSequence: number;
  throughputOpsSec: number;
  backpressureState: 'NOMINAL' | 'ELEVATED' | 'BACKPRESSURE_ENGAGED';
  ipAuditStatus: 'VERIFIED_CLEAN_ROOM';
  licenseType: 'MIT_PERMISSIVE_100';
  copyleftRatio: 0;
}

export interface RingBufferSlot {
  index: number;
  sequence: number;
  status: 'FREE' | 'CLAIMED' | 'COMMITTED' | 'CONSUMED';
  rpm: number;
  throttle: number;
  timestampNs: number;
  vvtCamDeg: number;
  manifoldKpa: number;
}

export interface AuditRecord {
  sequenceId: number;
  timestampUtc: string;
  rpm: number;
  throttlePct: number;
  vvtDeg: number;
  manifoldKpa: number;
  oilTempC: number;
  previousHash: string;
  monotonicHash: string;
  isTampered: boolean;
}

export interface TestCaseResult {
  id: string;
  name: string;
  durationMs: number;
  status: 'PASSED' | 'RUNNING' | 'PENDING';
  assertions: number;
  description: string;
}

export interface EscrowChecklistStep {
  id: string;
  title: string;
  category: 'CODEBASE' | 'INFRASTRUCTURE' | 'LEGAL' | 'ESCROW';
  description: string;
  completed: boolean;
}
