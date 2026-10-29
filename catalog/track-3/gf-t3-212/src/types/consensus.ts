export type NodeRole = 'LEADER' | 'FOLLOWER' | 'CANDIDATE';

export interface ClusterNodeInfo {
  id: string;
  label: string;
  role: NodeRole;
  stakeUnits: number;
  isByzantine: boolean;
  isPartitioned: boolean;
  committedHeight: number;
  lastPreparedDigest: string;
  lastCommitDigest: string;
  uptimeSeconds: number;
  votesCast: number;
  phaseBadge?: string;
}

export type ConsensusPhase = 'IDLE' | 'PRE_PREPARE' | 'PREPARE' | 'COMMIT' | 'FINALIZED';

export type ConsensusMode = 'PBFT' | 'RAFT';

export interface ConsensusRoundMessage {
  id: string;
  phase: ConsensusPhase;
  viewTerm: number;
  sequenceHeight: number;
  senderNodeId: string;
  targetNodeId: string;
  digest: string;
  signature: string;
  timestampMs: number;
  status: 'DELIVERED' | 'DROPPED_PARTITION' | 'REJECTED_BYZANTINE';
}

export interface LedgerBlock {
  blockNumber: number;
  viewTerm: number;
  previousHash: string;
  stateRoot: string;
  operations: Record<string, unknown>;
  proposerNode: string;
  timestampMs: number;
  commitSignatures: string[];
  blockHash: string;
  gasExecutionUnits: number;
}

export interface MerkleKV {
  key: string;
  value: string;
  leafHash: string;
  lastUpdatedBlock: number;
}

export interface ClusterMetrics {
  currentView: number;
  sequenceHeight: number;
  consensusMode: ConsensusMode;
  totalNodes: number;
  byzantineToleranceF: number;
  requiredQuorum: number;
  roundTripLatencyMs: number;
  stateRoot: string;
  activeLeaderId: string;
  honestCommittedCount: number;
  phase: ConsensusPhase;
}

export interface ChaosActionLog {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  impact: string;
  invariantStatus: 'SAFE' | 'DEGRADED' | 'RECOVERED';
}
