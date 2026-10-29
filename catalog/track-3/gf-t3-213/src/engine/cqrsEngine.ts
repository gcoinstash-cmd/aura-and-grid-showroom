/**
 * APEX-213 Distributed CQRS, Event Sourcing & Projection Engine
 * Interactive Client Simulation Engine & Reference Implementation
 * Standard Commercial Asset Transfer Specification
 */

import {
  CorridorId,
  EventType,
  CommandType,
  BaseCommand,
  EventEnvelope,
  AggregateState,
  AggregateSnapshot,
  MaterializedCorridorView,
  DLQRecord,
  AuditVerificationResult,
  TelemetrySummary,
} from '../types/cqrs';
import { sha256Sync } from './sha256';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export function computeEventEnvelopeHash(
  prevHash: string,
  sequenceId: number,
  corridorId: string,
  aggregateVersion: number,
  eventType: string,
  payload: Record<string, any>,
  commitTimestamp: number
): string {
  const canonicalPayload = JSON.stringify(payload, Object.keys(payload).sort());
  const preimage =
    prevHash +
    '|' +
    sequenceId +
    '|' +
    corridorId +
    '|' +
    aggregateVersion +
    '|' +
    eventType +
    '|' +
    canonicalPayload +
    '|' +
    commitTimestamp.toFixed(6);

  return sha256Sync(preimage);
}

export class ClientCQRSEngine {
  public static readonly SNAPSHOT_INTERVAL = 100;

  public eventStream: EventEnvelope[] = [];
  public globalSequence: number = 0;
  public aggregateVersions: Map<string, number> = new Map();
  public snapshots: Map<string, AggregateSnapshot[]> = new Map();
  public materializedViews: Map<string, MaterializedCorridorView> = new Map();
  public dlq: DLQRecord[] = [];

  public totalCommandsProcessed: number = 0;
  public totalOccConflicts: number = 0;
  public startTime: number = Date.now();

  constructor() {
    this.seedGenesisState();
  }

  public seedGenesisState(): void {
    this.eventStream = [];
    this.globalSequence = 0;
    this.aggregateVersions.clear();
    this.snapshots.clear();
    this.materializedViews.clear();
    this.dlq = [];
    this.totalCommandsProcessed = 0;
    this.totalOccConflicts = 0;
    this.startTime = Date.now();

    // Seed Corridor Alpha: Settlement Ledger
    const cmdAlpha: BaseCommand = {
      command_id: 'CMD-GENESIS-001',
      corridor_id: CorridorId.CORRIDOR_ALPHA,
      command_type: CommandType.INITIALIZE_CORRIDOR,
      expected_version: 0,
      payload: {
        initial_units: 142500,
        throughput_rate_limit: 5000,
        label: 'SETTLEMENT-LEDGER-01',
      },
      timestamp: Date.now() / 1000,
    };
    this.dispatchCommand(cmdAlpha);

    // Seed Stream Router Beta: High Velocity Dispatch
    const cmdBeta: BaseCommand = {
      command_id: 'CMD-GENESIS-002',
      corridor_id: CorridorId.ROUTER_BETA,
      command_type: CommandType.INITIALIZE_CORRIDOR,
      expected_version: 0,
      payload: {
        initial_units: 85000,
        throughput_rate_limit: 12000,
        label: 'HIGH-VELOCITY-DISPATCH',
      },
      timestamp: Date.now() / 1000,
    };
    this.dispatchCommand(cmdBeta);

    // Seed Corridor Gamma: Projection Worker
    const cmdGamma: BaseCommand = {
      command_id: 'CMD-GENESIS-003',
      corridor_id: CorridorId.WORKER_GAMMA,
      command_type: CommandType.INITIALIZE_CORRIDOR,
      expected_version: 0,
      payload: {
        initial_units: 50000,
        throughput_rate_limit: 8000,
        label: 'READ-VIEW-MATERIALIZER',
      },
      timestamp: Date.now() / 1000,
    };
    this.dispatchCommand(cmdGamma);

    // Initial business activity
    const vAlpha = this.aggregateVersions.get(CorridorId.CORRIDOR_ALPHA) || 1;
    this.dispatchCommand({
      command_id: 'CMD-ALLOC-INIT',
      corridor_id: CorridorId.CORRIDOR_ALPHA,
      command_type: CommandType.COMMIT_ALLOCATION,
      expected_version: vAlpha,
      payload: {
        units: 25000,
        purpose: 'LIQUIDITY_BUFFER_EXPANSION',
      },
      timestamp: Date.now() / 1000,
    });

    const vAlpha2 = this.aggregateVersions.get(CorridorId.CORRIDOR_ALPHA) || 2;
    this.dispatchCommand({
      command_id: 'CMD-RESERVE-INIT',
      corridor_id: CorridorId.CORRIDOR_ALPHA,
      command_type: CommandType.RESERVE_DEBIT,
      expected_version: vAlpha2,
      payload: {
        units: 18000,
        reserve_tag: 'CLEARING-ESCROW-BATCH-01',
      },
      timestamp: Date.now() / 1000,
    });
  }

  public dispatchCommand(command: BaseCommand): { success: boolean; event?: EventEnvelope; error?: string } {
    this.totalCommandsProcessed++;
    const corridorId = command.corridor_id;
    const currentVersion = this.aggregateVersions.get(corridorId) || 0;

    // 1. Optimistic Concurrency Control Check
    if (command.expected_version !== currentVersion) {
      this.totalOccConflicts++;
      const dlqRecord: DLQRecord = {
        record_id: 'DLQ-OCC-' + Date.now() + '-' + (this.dlq.length + 1),
        corridor_id: corridorId,
        sequence_id: this.globalSequence + 1,
        attempted_at: Date.now(),
        error_code: 'STALE_VERSION_OCC_CONFLICT',
        reason:
          'OCC StaleVersionError on ' +
          corridorId +
          ': Expected v' +
          command.expected_version +
          ', but aggregate is at v' +
          currentVersion,
        raw_payload: command.payload,
      };
      this.dlq.unshift(dlqRecord);

      return {
        success: false,
        error:
          'OCC Concurrency Conflict: Expected v' +
          command.expected_version +
          ' but current aggregate version is v' +
          currentVersion +
          '. Mutation safely rejected.',
      };
    }

    // 2. Evaluate Invariants & Generate Delta
    const currentState = this.getAggregateState(corridorId);
    const evaluation = this.evaluateInvariants(command, currentState);
    if (!evaluation.valid) {
      return { success: false, error: evaluation.error };
    }

    const deltaEventType = evaluation.eventType!;
    const deltaPayload = evaluation.payload!;

    // 3. Increment Sequence & Build Cryptographic Hash
    this.globalSequence++;
    const newVersion = currentVersion + 1;
    const prevHash =
      this.eventStream.length > 0
        ? this.eventStream[this.eventStream.length - 1].event_hash
        : GENESIS_HASH;
    const commitTs = Date.now() / 1000;

    const eventHash = computeEventEnvelopeHash(
      prevHash,
      this.globalSequence,
      corridorId,
      newVersion,
      deltaEventType,
      deltaPayload,
      commitTs
    );

    const envelope: EventEnvelope = {
      sequence_id: this.globalSequence,
      corridor_id: corridorId,
      aggregate_version: newVersion,
      event_type: deltaEventType,
      payload: deltaPayload,
      commit_timestamp: commitTs,
      prev_hash: prevHash,
      event_hash: eventHash,
    };

    // 4. Commit to Event Stream
    this.eventStream.push(envelope);
    this.aggregateVersions.set(corridorId, newVersion);

    // 5. Automated Snapshot Compaction at N=100 intervals
    if (newVersion % ClientCQRSEngine.SNAPSHOT_INTERVAL === 0) {
      this.createSnapshot(corridorId, newVersion, this.globalSequence);
    }

    // 6. Materialize Read Projection View
    this.materializeProjection(envelope);

    return { success: true, event: envelope };
  }

  private evaluateInvariants(
    command: BaseCommand,
    state: AggregateState
  ): { valid: boolean; eventType?: EventType; payload?: Record<string, any>; error?: string } {
    const ctype = command.command_type;
    const p = command.payload;

    if (ctype === CommandType.INITIALIZE_CORRIDOR) {
      return {
        valid: true,
        eventType: EventType.CORRIDOR_INITIALIZED,
        payload: {
          initial_units: Number(p.initial_units || 0),
          throughput_rate_limit: Number(p.throughput_rate_limit || 5000),
          label: String(p.label || 'PRIMARY-CORRIDOR'),
        },
      };
    }

    if (state.status === 'PAUSED' && ctype !== CommandType.RESUME_CORRIDOR) {
      return {
        valid: false,
        error: 'Corridor ' + command.corridor_id + ' is PAUSED. Mutations rejected.',
      };
    }

    if (ctype === CommandType.COMMIT_ALLOCATION) {
      const units = Number(p.units || 0);
      if (units <= 0) return { valid: false, error: 'Allocation units must be strictly positive' };
      return {
        valid: true,
        eventType: EventType.ALLOCATION_COMMITTED,
        payload: { units, purpose: String(p.purpose || 'LIQUIDITY_BUFFER_EXPANSION') },
      };
    }

    if (ctype === CommandType.RESERVE_DEBIT) {
      const units = Number(p.units || 0);
      if (units <= 0) return { valid: false, error: 'Reserve units must be strictly positive' };
      if (units > state.available_balance) {
        return {
          valid: false,
          error:
            'Insufficient available balance. Requested: ' +
            units +
            ' Units, Available: ' +
            state.available_balance +
            ' Units',
        };
      }
      return {
        valid: true,
        eventType: EventType.DEBIT_RESERVED,
        payload: { units, reserve_tag: String(p.reserve_tag || 'SETTLEMENT-RESERVATION') },
      };
    }

    if (ctype === CommandType.FINALIZE_SETTLEMENT) {
      const units = Number(p.units || 0);
      if (units <= 0 || units > state.reserved_balance) {
        return {
          valid: false,
          error:
            'Finalize units must be <= current reserved balance (' +
            state.reserved_balance +
            ' Units)',
        };
      }
      return {
        valid: true,
        eventType: EventType.SETTLEMENT_FINALIZED,
        payload: { units, settlement_batch_id: String(p.batch_id || 'BATCH-SETTLE-' + this.globalSequence) },
      };
    }

    if (ctype === CommandType.TRANSFER_CREDIT) {
      const units = Number(p.units || 0);
      if (units <= 0 || units > state.available_balance) {
        return {
          valid: false,
          error:
            'Transfer units exceed available balance. Requested: ' +
            units +
            ' Units, Available: ' +
            state.available_balance +
            ' Units',
        };
      }
      return {
        valid: true,
        eventType: EventType.CREDIT_TRANSFERRED,
        payload: {
          units,
          destination_corridor: String(p.destination_corridor || CorridorId.ROUTER_BETA),
          routing_code: String(p.routing_code || 'INTERNAL-CLEARING'),
        },
      };
    }

    if (ctype === CommandType.ADJUST_RATE_LIMIT) {
      const newLimit = Number(p.new_limit || 5000);
      return {
        valid: true,
        eventType: EventType.RATE_LIMIT_ADJUSTED,
        payload: { new_limit: newLimit },
      };
    }

    if (ctype === CommandType.PAUSE_CORRIDOR) {
      return {
        valid: true,
        eventType: EventType.CORRIDOR_PAUSED,
        payload: { reason: String(p.reason || 'OPERATIONAL_CIRCUIT_BREAKER') },
      };
    }

    if (ctype === CommandType.RESUME_CORRIDOR) {
      return {
        valid: true,
        eventType: EventType.CORRIDOR_RESUMED,
        payload: { reason: String(p.reason || 'OPERATIONAL_RESUMPTION') },
      };
    }

    return { valid: false, error: 'Unrecognized command type: ' + ctype };
  }

  private materializeProjection(event: EventEnvelope): void {
    const now = Date.now();
    const commitMs = event.commit_timestamp * 1000;
    // Jittered projection lag simulation between 0.4ms and 2.2ms
    const lagMs = Math.max(0.42, Number((now - commitMs + (Math.random() * 0.8 + 0.4)).toFixed(2)));
    const state = this.getAggregateState(event.corridor_id);

    const view: MaterializedCorridorView = {
      corridor_id: event.corridor_id,
      current_version: state.version,
      last_sequence_id: event.sequence_id,
      ledger_balance: state.ledger_balance,
      reserved_balance: state.reserved_balance,
      available_balance: state.available_balance,
      transaction_count: state.transaction_count,
      status: state.status,
      throughput_rate_limit: state.throughput_rate_limit,
      last_event_hash: event.event_hash,
      last_updated_at: now,
      projection_lag_ms: lagMs,
    };

    this.materializedViews.set(event.corridor_id, view);
  }

  private createSnapshot(corridorId: string, version: number, sequenceId: number): void {
    const state = this.getAggregateState(corridorId);
    const preimage =
      corridorId + '|' + version + '|' + sequenceId + '|' + JSON.stringify(state);
    const sHash = sha256Sync(preimage);

    const snapshot: AggregateSnapshot = {
      corridor_id: corridorId,
      snapshot_version: version,
      snapshot_sequence: sequenceId,
      state: { ...state },
      snapshot_hash: sHash,
      created_at: Date.now(),
    };

    const existing = this.snapshots.get(corridorId) || [];
    existing.push(snapshot);
    this.snapshots.set(corridorId, existing);
  }

  public getAggregateState(corridorId: string, upToSequence?: number): AggregateState {
    // 1. Check for closest snapshot
    let state: AggregateState = {
      corridor_id: corridorId,
      version: 0,
      ledger_balance: 0,
      reserved_balance: 0,
      available_balance: 0,
      transaction_count: 0,
      status: 'UNINITIALIZED',
      throughput_rate_limit: 5000,
    };
    let startSeq = 0;

    const snapList = this.snapshots.get(corridorId);
    if (snapList && snapList.length > 0) {
      for (let i = snapList.length - 1; i >= 0; i--) {
        const s = snapList[i];
        if (upToSequence === undefined || s.snapshot_sequence <= upToSequence) {
          state = { ...s.state };
          startSeq = s.snapshot_sequence;
          break;
        }
      }
    }

    // 2. Replay events after snapshot
    for (const ev of this.eventStream) {
      if (ev.corridor_id !== corridorId) continue;
      if (ev.sequence_id <= startSeq) continue;
      if (upToSequence !== undefined && ev.sequence_id > upToSequence) break;

      state = this.applyEventFold(state, ev);
    }

    return state;
  }

  public applyEventFold(state: AggregateState, event: EventEnvelope): AggregateState {
    const next: AggregateState = { ...state };
    next.version = event.aggregate_version;
    next.transaction_count++;
    const p = event.payload;

    if (event.event_type === EventType.CORRIDOR_INITIALIZED) {
      next.ledger_balance = p.initial_units;
      next.available_balance = p.initial_units;
      next.reserved_balance = 0;
      next.status = 'ACTIVE';
      next.throughput_rate_limit = p.throughput_rate_limit || 5000;
    } else if (event.event_type === EventType.ALLOCATION_COMMITTED) {
      next.ledger_balance += p.units;
      next.available_balance += p.units;
    } else if (event.event_type === EventType.DEBIT_RESERVED) {
      next.reserved_balance += p.units;
      next.available_balance -= p.units;
    } else if (event.event_type === EventType.SETTLEMENT_FINALIZED) {
      next.reserved_balance -= p.units;
      next.ledger_balance -= p.units;
    } else if (event.event_type === EventType.CREDIT_TRANSFERRED) {
      next.ledger_balance -= p.units;
      next.available_balance -= p.units;
    } else if (event.event_type === EventType.RATE_LIMIT_ADJUSTED) {
      next.throughput_rate_limit = p.new_limit;
    } else if (event.event_type === EventType.CORRIDOR_PAUSED) {
      next.status = 'PAUSED';
    } else if (event.event_type === EventType.CORRIDOR_RESUMED) {
      next.status = 'ACTIVE';
    }

    return next;
  }

  public verifyCryptographicAuditChain(): AuditVerificationResult {
    if (this.eventStream.length === 0) {
      return { valid: true, inspected_count: 0, status: 'EMPTY_CHAIN' };
    }

    let expectedPrev = GENESIS_HASH;
    for (const ev of this.eventStream) {
      if (ev.prev_hash !== expectedPrev) {
        return {
          valid: false,
          inspected_count: ev.sequence_id,
          tamper_detected_at_sequence: ev.sequence_id,
          error_reason:
            'Mismatched prev_hash link at sequence #' +
            ev.sequence_id +
            '. Link broken between adjacent event envelopes.',
          expected_prev: expectedPrev,
          found_prev: ev.prev_hash,
          status: 'TAMPER_ALERT',
        };
      }

      const recomputed = computeEventEnvelopeHash(
        ev.prev_hash,
        ev.sequence_id,
        ev.corridor_id,
        ev.aggregate_version,
        ev.event_type,
        ev.payload,
        ev.commit_timestamp
      );

      if (recomputed !== ev.event_hash) {
        return {
          valid: false,
          inspected_count: ev.sequence_id,
          tamper_detected_at_sequence: ev.sequence_id,
          error_reason:
            'Payload tamper detected at sequence #' +
            ev.sequence_id +
            '. Preimage hash does not match recorded SHA-256 seal.',
          recorded_hash: ev.event_hash,
          recomputed_hash: recomputed,
          status: 'TAMPER_ALERT',
        };
      }

      expectedPrev = ev.event_hash;
    }

    return {
      valid: true,
      inspected_count: this.eventStream.length,
      head_hash: this.eventStream[this.eventStream.length - 1].event_hash,
      status: 'CRYPTOGRAPHICALLY_VERIFIED',
    };
  }

  public tamperPayload(sequenceId: number, alteredUnits: number): boolean {
    const ev = this.eventStream.find((e) => e.sequence_id === sequenceId);
    if (!ev) return false;
    ev.payload = { ...ev.payload, units: alteredUnits };
    return true;
  }

  public recalculateHashChain(): void {
    let prev = GENESIS_HASH;
    for (const ev of this.eventStream) {
      ev.prev_hash = prev;
      ev.event_hash = computeEventEnvelopeHash(
        ev.prev_hash,
        ev.sequence_id,
        ev.corridor_id,
        ev.aggregate_version,
        ev.event_type,
        ev.payload,
        ev.commit_timestamp
      );
      prev = ev.event_hash;
    }
  }

  public getTelemetry(): TelemetrySummary {
    const elapsedSec = Math.max(1, (Date.now() - this.startTime) / 1000);
    const throughput = Number((this.globalSequence / elapsedSec).toFixed(2));
    let latestLag = 1.25;

    const views = Array.from(this.materializedViews.values());
    if (views.length > 0) {
      latestLag = views[views.length - 1].projection_lag_ms;
    }

    let snapCount = 0;
    this.snapshots.forEach((list) => {
      snapCount += list.length;
    });

    const audit = this.verifyCryptographicAuditChain();

    return {
      global_sequence_id: this.globalSequence,
      projection_worker_sequence: this.globalSequence,
      projection_lag_ms: latestLag,
      commit_throughput_events_per_sec: throughput,
      total_commands_processed: this.totalCommandsProcessed,
      total_occ_conflicts: this.totalOccConflicts,
      total_snapshots: snapCount,
      dlq_size: this.dlq.length,
      audit_chain_status: audit.valid ? 'SECURE_IMMUTABLE' : 'TAMPER_ALERT',
    };
  }
}
