/**
 * APEX-213 Distributed CQRS, Event Sourcing & Projection Engine
 * Synthetic Type Declarations & Invariant Contracts
 * Standard Commercial Asset Transfer Specification
 */

export enum CorridorId {
  CORRIDOR_ALPHA = 'AGGREGATE-CORRIDOR-ALPHA',
  ROUTER_BETA = 'STREAM-ROUTER-BETA',
  WORKER_GAMMA = 'PROJECTION-WORKER-GAMMA',
  CORPUS_DELTA = 'EVENT-CORPUS-DELTA',
}

export enum EventType {
  CORRIDOR_INITIALIZED = 'CorridorInitialized',
  ALLOCATION_COMMITTED = 'AllocationCommitted',
  CREDIT_TRANSFERRED = 'CreditTransferred',
  DEBIT_RESERVED = 'DebitReserved',
  SETTLEMENT_FINALIZED = 'SettlementFinalized',
  RATE_LIMIT_ADJUSTED = 'RateLimitAdjusted',
  CORRIDOR_PAUSED = 'CorridorPaused',
  CORRIDOR_RESUMED = 'CorridorResumed',
}

export enum CommandType {
  INITIALIZE_CORRIDOR = 'InitializeCorridor',
  COMMIT_ALLOCATION = 'CommitAllocation',
  TRANSFER_CREDIT = 'TransferCredit',
  RESERVE_DEBIT = 'ReserveDebit',
  FINALIZE_SETTLEMENT = 'FinalizeSettlement',
  ADJUST_RATE_LIMIT = 'AdjustRateLimit',
  PAUSE_CORRIDOR = 'PauseCorridor',
  RESUME_CORRIDOR = 'ResumeCorridor',
}

export interface BaseCommand {
  command_id: string;
  corridor_id: string;
  command_type: CommandType;
  expected_version: number;
  payload: Record<string, any>;
  timestamp: number;
}

export interface EventEnvelope {
  sequence_id: number;
  corridor_id: string;
  aggregate_version: number;
  event_type: EventType;
  payload: Record<string, any>;
  commit_timestamp: number;
  prev_hash: string;
  event_hash: string;
}

export interface AggregateState {
  corridor_id: string;
  version: number;
  ledger_balance: number;
  reserved_balance: number;
  available_balance: number;
  transaction_count: number;
  status: 'ACTIVE' | 'PAUSED' | 'UNINITIALIZED';
  throughput_rate_limit: number;
}

export interface AggregateSnapshot {
  corridor_id: string;
  snapshot_version: number;
  snapshot_sequence: number;
  state: AggregateState;
  snapshot_hash: string;
  created_at: number;
}

export interface MaterializedCorridorView {
  corridor_id: string;
  current_version: number;
  last_sequence_id: number;
  ledger_balance: number;
  reserved_balance: number;
  available_balance: number;
  transaction_count: number;
  status: 'ACTIVE' | 'PAUSED' | 'UNINITIALIZED';
  throughput_rate_limit: number;
  last_event_hash: string;
  last_updated_at: number;
  projection_lag_ms: number;
}

export interface DLQRecord {
  record_id: string;
  corridor_id: string;
  sequence_id: number;
  attempted_at: number;
  error_code: string;
  reason: string;
  raw_payload: Record<string, any>;
}

export interface AuditVerificationResult {
  valid: boolean;
  inspected_count: number;
  head_hash?: string;
  status: string;
  tamper_detected_at_sequence?: number;
  error_reason?: string;
  expected_prev?: string;
  found_prev?: string;
  recorded_hash?: string;
  recomputed_hash?: string;
}

export interface TelemetrySummary {
  global_sequence_id: number;
  projection_worker_sequence: number;
  projection_lag_ms: number;
  commit_throughput_events_per_sec: number;
  total_commands_processed: number;
  total_occ_conflicts: number;
  total_snapshots: number;
  dlq_size: number;
  audit_chain_status: 'SECURE_IMMUTABLE' | 'TAMPER_ALERT';
}
