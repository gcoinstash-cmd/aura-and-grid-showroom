"""
APEX-213 Distributed CQRS, Event Sourcing & Projection Engine
Reference Architecture Core for Enterprise Handoff
Standard Commercial Asset Transfer Specification
"""

import time
import json
import hashlib
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware


# ---------------------------------------------------------------------------
# Synthetic Domain Entities & Event Archetypes
# ---------------------------------------------------------------------------

class CorridorId(str, Enum):
    CORRIDOR_ALPHA = "AGGREGATE-CORRIDOR-ALPHA"
    ROUTER_BETA = "STREAM-ROUTER-BETA"
    WORKER_GAMMA = "PROJECTION-WORKER-GAMMA"
    CORPUS_DELTA = "EVENT-CORPUS-DELTA"


class EventType(str, Enum):
    CORRIDOR_INITIALIZED = "CorridorInitialized"
    ALLOCATION_COMMITTED = "AllocationCommitted"
    CREDIT_TRANSFERRED = "CreditTransferred"
    DEBIT_RESERVED = "DebitReserved"
    SETTLEMENT_FINALIZED = "SettlementFinalized"
    RATE_LIMIT_ADJUSTED = "RateLimitAdjusted"
    CORRIDOR_PAUSED = "CorridorPaused"
    CORRIDOR_RESUMED = "CorridorResumed"


class CommandType(str, Enum):
    INITIALIZE_CORRIDOR = "InitializeCorridor"
    COMMIT_ALLOCATION = "CommitAllocation"
    TRANSFER_CREDIT = "TransferCredit"
    RESERVE_DEBIT = "ReserveDebit"
    FINALIZE_SETTLEMENT = "FinalizeSettlement"
    ADJUST_RATE_LIMIT = "AdjustRateLimit"
    PAUSE_CORRIDOR = "PauseCorridor"
    RESUME_CORRIDOR = "ResumeCorridor"


# ---------------------------------------------------------------------------
# Models: Commands, Events, Snapshots, Read Views
# ---------------------------------------------------------------------------

class BaseCommand(BaseModel):
    command_id: str = Field(..., description="Unique deterministic command identifier")
    corridor_id: str = Field(..., description="Target aggregate identifier")
    command_type: CommandType
    expected_version: int = Field(..., ge=0, description="Optimistic Concurrency Control expected version")
    payload: Dict[str, Any] = Field(default_factory=dict)
    timestamp: float = Field(default_factory=time.time)


class EventEnvelope(BaseModel):
    sequence_id: int = Field(..., ge=1, description="Global monotonically increasing sequence")
    corridor_id: str
    aggregate_version: int = Field(..., ge=1, description="Aggregate version after event application")
    event_type: EventType
    payload: Dict[str, Any]
    commit_timestamp: float = Field(..., description="Timestamp in seconds with sub-millisecond precision")
    prev_hash: str = Field(..., description="SHA-256 hash of sequence_id - 1")
    event_hash: str = Field(..., description="SHA-256 hash of this event envelope")


class AggregateSnapshot(BaseModel):
    corridor_id: str
    snapshot_version: int
    snapshot_sequence: int
    state: Dict[str, Any]
    snapshot_hash: str
    created_at: float


class DLQRecord(BaseModel):
    record_id: str
    corridor_id: str
    sequence_id: int
    attempted_at: float
    error_code: str
    reason: str
    raw_payload: Dict[str, Any]


class MaterializedCorridorView(BaseModel):
    corridor_id: str
    current_version: int
    last_sequence_id: int
    ledger_balance: int = Field(..., description="Dimensionless settlement units")
    reserved_balance: int = Field(..., description="Reserved units pending settlement")
    available_balance: int = Field(..., description="Available units for transfer")
    transaction_count: int
    status: str
    throughput_rate_limit: int = Field(..., description="Maximum events per second allowed")
    last_event_hash: str
    last_updated_at: float
    projection_lag_ms: float = Field(..., description="Projection latency in milliseconds")


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class StaleVersionError(Exception):
    def __init__(self, corridor_id: str, expected_version: int, current_version: int):
        self.corridor_id = corridor_id
        self.expected_version = expected_version
        self.current_version = current_version
        super().__init__(
            f"Optimistic Concurrency Conflict on corridor {corridor_id}: "
            f"Expected version v{expected_version}, but aggregate is currently at v{current_version}."
        )


class CorruptedChainError(Exception):
    def __init__(self, sequence_id: int, expected_hash: str, computed_hash: str):
        super().__init__(
            f"Cryptographic hash chain violation at sequence #{sequence_id}: "
            f"Expected previous {expected_hash}, computed {computed_hash}."
        )


# ---------------------------------------------------------------------------
# Cryptographic Rolling Hash Utility
# ---------------------------------------------------------------------------

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def compute_event_hash(prev_hash: str, sequence_id: int, corridor_id: str,
                       aggregate_version: int, event_type: str,
                       payload: Dict[str, Any], commit_timestamp: float) -> str:
    canonical_payload = json.dumps(payload, sort_keys=True)
    envelope_preimage = (
        f"{prev_hash}|{sequence_id}|{corridor_id}|"
        f"{aggregate_version}|{event_type}|{canonical_payload}|{commit_timestamp:.6f}"
    )
    return hashlib.sha256(envelope_preimage.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# Engine Core: Event Store, OCC, Projections, Snapshots
# ---------------------------------------------------------------------------

class CQRSProjectionEngine:
    SNAPSHOT_INTERVAL = 100

    def __init__(self):
        # Global append-only sequence
        self.event_stream: List[EventEnvelope] = []
        self.global_sequence: int = 0
        
        # Aggregate versions: corridor_id -> int
        self.aggregate_versions: Dict[str, int] = {}
        
        # Periodic Snapshots: corridor_id -> List[AggregateSnapshot]
        self.snapshots: Dict[str, List[AggregateSnapshot]] = {}
        
        # Read Model Projections
        self.materialized_views: Dict[str, MaterializedCorridorView] = {}
        
        # Dead Letter Queue
        self.dlq: List[DLQRecord] = []
        
        # Telemetry Metrics
        self.total_commands_processed: int = 0
        self.total_occ_conflicts: int = 0
        self.projection_worker_sequence: int = 0
        self.engine_start_time: float = time.time()
        
        # Seed initial canonical corridor
        self._seed_genesis_state()

    def _seed_genesis_state(self):
        corridor = CorridorId.CORRIDOR_ALPHA.value
        init_cmd = BaseCommand(
            command_id="CMD-GENESIS-001",
            corridor_id=corridor,
            command_type=CommandType.INITIALIZE_CORRIDOR,
            expected_version=0,
            payload={
                "initial_units": 100000,
                "throughput_rate_limit": 5000,
                "label": "SETTLEMENT-LEDGER-01"
            }
        )
        self.dispatch_command(init_cmd)

    def dispatch_command(self, command: BaseCommand) -> EventEnvelope:
        """
        Executes Write Command Pipeline under Optimistic Concurrency Control.
        Guarantees: expected_version == current_version or raises StaleVersionError.
        """
        self.total_commands_processed += 1
        corridor_id = command.corridor_id
        current_version = self.aggregate_versions.get(corridor_id, 0)

        # 1. Optimistic Concurrency Control Verification
        if command.expected_version != current_version:
            self.total_occ_conflicts += 1
            # Send conflict audit record to DLQ if forced out-of-order
            dlq_entry = DLQRecord(
                record_id=f"DLQ-OCC-{int(time.time()*1000)}-{len(self.dlq)+1}",
                corridor_id=corridor_id,
                sequence_id=self.global_sequence + 1,
                attempted_at=time.time(),
                error_code="STALE_VERSION_OCC_CONFLICT",
                reason=f"Optimistic Concurrency Conflict: Expected v{command.expected_version}, found v{current_version}",
                raw_payload=command.dict()
            )
            self.dlq.append(dlq_entry)
            raise StaleVersionError(corridor_id, command.expected_version, current_version)

        # 2. Command Validation against current aggregate state
        current_state = self.get_aggregate_state(corridor_id)
        delta_event_type, delta_payload = self._evaluate_business_invariants(command, current_state)

        # 3. Create committed event with rolling cryptographic SHA-256 hash
        self.global_sequence += 1
        new_version = current_version + 1
        prev_hash = self.event_stream[-1].event_hash if self.event_stream else GENESIS_HASH
        commit_now = time.time()

        event_hash = compute_event_hash(
            prev_hash=prev_hash,
            sequence_id=self.global_sequence,
            corridor_id=corridor_id,
            aggregate_version=new_version,
            event_type=delta_event_type.value,
            payload=delta_payload,
            commit_timestamp=commit_now
        )

        envelope = EventEnvelope(
            sequence_id=self.global_sequence,
            corridor_id=corridor_id,
            aggregate_version=new_version,
            event_type=delta_event_type,
            payload=delta_payload,
            commit_timestamp=commit_now,
            prev_hash=prev_hash,
            event_hash=event_hash
        )

        # 4. Append to immutable log
        self.event_stream.append(envelope)
        self.aggregate_versions[corridor_id] = new_version

        # 5. Automated Snapshot Compaction check every N=100 events
        if new_version % self.SNAPSHOT_INTERVAL == 0:
            self._create_snapshot(corridor_id, new_version, self.global_sequence)

        # 6. Synchronous projection materializer pipeline
        self._materialize_projection(envelope)

        return envelope

    def _evaluate_business_invariants(self, command: BaseCommand, state: Dict[str, Any]) -> Tuple[EventType, Dict[str, Any]]:
        ctype = command.command_type
        payload = command.payload

        if ctype == CommandType.INITIALIZE_CORRIDOR:
            units = int(payload.get("initial_units", 0))
            limit = int(payload.get("throughput_rate_limit", 5000))
            return EventType.CORRIDOR_INITIALIZED, {
                "initial_units": units,
                "throughput_rate_limit": limit,
                "label": payload.get("label", "PRIMARY-CORRIDOR")
            }

        if state.get("status") == "PAUSED" and ctype not in (CommandType.RESUME_CORRIDOR,):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Corridor {command.corridor_id} is currently PAUSED. Commands rejected."
            )

        if ctype == CommandType.COMMIT_ALLOCATION:
            units = int(payload.get("units", 0))
            if units <= 0:
                raise HTTPException(status_code=400, detail="Allocation units must be strictly positive")
            return EventType.ALLOCATION_COMMITTED, {
                "units": units,
                "purpose": payload.get("purpose", "LIQUIDITY_BUFFER_EXPANSION")
            }

        elif ctype == CommandType.RESERVE_DEBIT:
            units = int(payload.get("units", 0))
            available = state.get("available_balance", 0)
            if units <= 0:
                raise HTTPException(status_code=400, detail="Reserve units must be strictly positive")
            if units > available:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient available units. Requested {units}, available: {available}"
                )
            return EventType.DEBIT_RESERVED, {
                "units": units,
                "reserve_tag": payload.get("reserve_tag", "SETTLEMENT-RESERVATION")
            }

        elif ctype == CommandType.FINALIZE_SETTLEMENT:
            units = int(payload.get("units", 0))
            reserved = state.get("reserved_balance", 0)
            if units <= 0 or units > reserved:
                raise HTTPException(
                    status_code=400,
                    detail=f"Settlement finalize units must be <= current reserved balance ({reserved})"
                )
            return EventType.SETTLEMENT_FINALIZED, {
                "units": units,
                "settlement_batch_id": payload.get("batch_id", f"BATCH-SETTLE-{self.global_sequence+1}")
            }

        elif ctype == CommandType.TRANSFER_CREDIT:
            units = int(payload.get("units", 0))
            available = state.get("available_balance", 0)
            if units <= 0 or units > available:
                raise HTTPException(
                    status_code=400,
                    detail=f"Transfer amount exceeds available balance. Units: {units}, Available: {available}"
                )
            return EventType.CREDIT_TRANSFERRED, {
                "units": units,
                "destination_corridor": payload.get("destination_corridor", CorridorId.ROUTER_BETA.value),
                "routing_code": payload.get("routing_code", "INTERNAL-CLEARING")
            }

        elif ctype == CommandType.ADJUST_RATE_LIMIT:
            new_limit = int(payload.get("new_limit", 5000))
            return EventType.RATE_LIMIT_ADJUSTED, {"new_limit": new_limit}

        elif ctype == CommandType.PAUSE_CORRIDOR:
            return EventType.CORRIDOR_PAUSED, {"reason": payload.get("reason", "OPERATIONAL_CIRCUIT_BREAKER")}

        elif ctype == CommandType.RESUME_CORRIDOR:
            return EventType.CORRIDOR_RESUMED, {"reason": payload.get("reason", "OPERATIONAL_RESUMPTION")}

        raise HTTPException(status_code=400, detail=f"Unrecognized command type: {ctype}")

    def _materialize_projection(self, event: EventEnvelope):
        """
        Updates query read-side projections and computes real-time projection lag:
        tau_lag = t_projection - t_commit
        """
        now = time.time()
        lag_ms = max(0.0, (now - event.commit_timestamp) * 1000.0)
        corridor_id = event.corridor_id
        
        # State fold for read-model
        current_state = self.get_aggregate_state(corridor_id)
        
        view = MaterializedCorridorView(
            corridor_id=corridor_id,
            current_version=current_state["version"],
            last_sequence_id=event.sequence_id,
            ledger_balance=current_state["ledger_balance"],
            reserved_balance=current_state["reserved_balance"],
            available_balance=current_state["available_balance"],
            transaction_count=current_state["transaction_count"],
            status=current_state["status"],
            throughput_rate_limit=current_state["throughput_rate_limit"],
            last_event_hash=event.event_hash,
            last_updated_at=now,
            projection_lag_ms=round(lag_ms, 2)
        )
        self.materialized_views[corridor_id] = view
        self.projection_worker_sequence = event.sequence_id

    def _create_snapshot(self, corridor_id: str, version: int, sequence_id: int):
        """
        Creates automated snapshot at N=100 checkpoints for O(1) state bootstrap.
        """
        state = self.get_aggregate_state(corridor_id)
        snapshot_preimage = f"{corridor_id}|{version}|{sequence_id}|{json.dumps(state, sort_keys=True)}"
        s_hash = hashlib.sha256(snapshot_preimage.encode("utf-8")).hexdigest()
        
        snapshot = AggregateSnapshot(
            corridor_id=corridor_id,
            snapshot_version=version,
            snapshot_sequence=sequence_id,
            state=state,
            snapshot_hash=s_hash,
            created_at=time.time()
        )
        
        if corridor_id not in self.snapshots:
            self.snapshots[corridor_id] = []
        self.snapshots[corridor_id].append(snapshot)

    def get_aggregate_state(self, corridor_id: str, up_to_sequence: Optional[int] = None) -> Dict[str, Any]:
        """
        Mathematical State Fold:
        S_t = S_0 + sum_{i=1}^t (delta_e_i)
        Utilizes latest snapshot <= target sequence for O(1) bootstrap when available.
        """
        # 1. Check for closest snapshot
        latest_snapshot: Optional[AggregateSnapshot] = None
        if corridor_id in self.snapshots:
            for s in reversed(self.snapshots[corridor_id]):
                if up_to_sequence is None or s.snapshot_sequence <= up_to_sequence:
                    latest_snapshot = s
                    break

        if latest_snapshot:
            state = dict(latest_snapshot.state)
            start_seq = latest_snapshot.snapshot_sequence
        else:
            state = {
                "corridor_id": corridor_id,
                "version": 0,
                "ledger_balance": 0,
                "reserved_balance": 0,
                "available_balance": 0,
                "transaction_count": 0,
                "status": "UNINITIALIZED",
                "throughput_rate_limit": 5000,
            }
            start_seq = 0

        # 2. Replay subsequent events
        for event in self.event_stream:
            if event.corridor_id != corridor_id:
                continue
            if event.sequence_id <= start_seq:
                continue
            if up_to_sequence is not None and event.sequence_id > up_to_sequence:
                break

            state = self._apply_event_fold(state, event)

        return state

    def _apply_event_fold(self, state: Dict[str, Any], event: EventEnvelope) -> Dict[str, Any]:
        """
        Deterministic pure reducer function for state transitions.
        """
        p = event.payload
        state["version"] = event.aggregate_version
        state["transaction_count"] += 1

        if event.event_type == EventType.CORRIDOR_INITIALIZED:
            units = p["initial_units"]
            state["ledger_balance"] = units
            state["available_balance"] = units
            state["reserved_balance"] = 0
            state["status"] = "ACTIVE"
            state["throughput_rate_limit"] = p.get("throughput_rate_limit", 5000)

        elif event.event_type == EventType.ALLOCATION_COMMITTED:
            units = p["units"]
            state["ledger_balance"] += units
            state["available_balance"] += units

        elif event.event_type == EventType.DEBIT_RESERVED:
            units = p["units"]
            state["reserved_balance"] += units
            state["available_balance"] -= units

        elif event.event_type == EventType.FINALIZE_SETTLEMENT:
            units = p["units"]
            state["reserved_balance"] -= units
            state["ledger_balance"] -= units

        elif event.event_type == EventType.CREDIT_TRANSFERRED:
            units = p["units"]
            state["ledger_balance"] -= units
            state["available_balance"] -= units

        elif event.event_type == EventType.RATE_LIMIT_ADJUSTED:
            state["throughput_rate_limit"] = p["new_limit"]

        elif event.event_type == EventType.CORRIDOR_PAUSED:
            state["status"] = "PAUSED"

        elif event.event_type == EventType.CORRIDOR_RESUMED:
            state["status"] = "ACTIVE"

        return state

    def verify_cryptographic_audit_chain(self) -> Dict[str, Any]:
        """
        Full verification of SHA-256 rolling event hash chain:
        event_n_hash == SHA256(event_{n-1}_hash + payload + seq + ...)
        """
        if not self.event_stream:
            return {"valid": True, "inspected_count": 0, "status": "EMPTY_CHAIN"}

        expected_prev = GENESIS_HASH
        for idx, event in enumerate(self.event_stream):
            # Check link to previous hash
            if event.prev_hash != expected_prev:
                return {
                    "valid": False,
                    "tamper_detected_at_sequence": event.sequence_id,
                    "error_reason": f"Mismatched previous hash link at sequence #{event.sequence_id}",
                    "expected_prev": expected_prev,
                    "found_prev": event.prev_hash
                }

            # Recompute hash
            recomputed = compute_event_hash(
                prev_hash=event.prev_hash,
                sequence_id=event.sequence_id,
                corridor_id=event.corridor_id,
                aggregate_version=event.aggregate_version,
                event_type=event.event_type.value,
                payload=event.payload,
                commit_timestamp=event.commit_timestamp
            )

            if recomputed != event.event_hash:
                return {
                    "valid": False,
                    "tamper_detected_at_sequence": event.sequence_id,
                    "error_reason": f"Payload tamper detected at sequence #{event.sequence_id}. Hash preimage mismatch.",
                    "recorded_hash": event.event_hash,
                    "recomputed_hash": recomputed
                }

            expected_prev = event.event_hash

        return {
            "valid": True,
            "inspected_count": len(self.event_stream),
            "head_hash": self.event_stream[-1].event_hash,
            "status": "CRYPTOGRAPHICALLY_VERIFIED"
        }

    def tamper_payload_for_testing(self, sequence_id: int, new_units: int) -> bool:
        """
        Test utility to simulate payload tamper and verify cryptographic detection.
        """
        for event in self.event_stream:
            if event.sequence_id == sequence_id:
                event.payload["units"] = new_units
                return True
        return False


# ---------------------------------------------------------------------------
# FastAPI Engine Service Application
# ---------------------------------------------------------------------------

engine = CQRSProjectionEngine()
app = FastAPI(
    title="APEX-213 Distributed CQRS, Event Sourcing & Projection Engine",
    description="Institutional Distributed Telemetry Engine. Standard Commercial Asset Transfer Specification.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {
        "status": "HEALTHY",
        "service": "APEX-213-CQRS-ENGINE",
        "uptime_seconds": round(time.time() - engine.engine_start_time, 2),
        "global_sequence": engine.global_sequence
    }


@app.post("/api/commands/dispatch", response_model=EventEnvelope, status_code=status.HTTP_201_CREATED)
def dispatch(cmd: BaseCommand):
    try:
        return engine.dispatch_command(cmd)
    except StaleVersionError as err:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "STALE_VERSION_OCC_CONFLICT",
                "message": str(err),
                "corridor_id": err.corridor_id,
                "expected_version": err.expected_version,
                "current_version": err.current_version
            }
        )


@app.get("/api/corridors/{corridor_id}/projection", response_model=MaterializedCorridorView)
def get_projection(corridor_id: str):
    if corridor_id not in engine.materialized_views:
        # Materialize on demand if corridor has state
        state = engine.get_aggregate_state(corridor_id)
        if state["version"] == 0:
            raise HTTPException(status_code=404, detail=f"Corridor {corridor_id} not initialized")
        
        view = MaterializedCorridorView(
            corridor_id=corridor_id,
            current_version=state["version"],
            last_sequence_id=engine.global_sequence,
            ledger_balance=state["ledger_balance"],
            reserved_balance=state["reserved_balance"],
            available_balance=state["available_balance"],
            transaction_count=state["transaction_count"],
            status=state["status"],
            throughput_rate_limit=state["throughput_rate_limit"],
            last_event_hash=engine.event_stream[-1].event_hash if engine.event_stream else GENESIS_HASH,
            last_updated_at=time.time(),
            projection_lag_ms=0.0
        )
        engine.materialized_views[corridor_id] = view

    return engine.materialized_views[corridor_id]


@app.get("/api/corridors/{corridor_id}/state")
def get_reconstructed_state(corridor_id: str, up_to_sequence: Optional[int] = Query(None)):
    return engine.get_aggregate_state(corridor_id, up_to_sequence)


@app.get("/api/events/stream", response_model=List[EventEnvelope])
def get_event_stream(limit: int = 50, offset: int = 0):
    return engine.event_stream[offset:offset+limit]


@app.get("/api/snapshots/{corridor_id}", response_model=List[AggregateSnapshot])
def get_snapshots(corridor_id: str):
    return engine.snapshots.get(corridor_id, [])


@app.get("/api/dlq", response_model=List[DLQRecord])
def get_dead_letter_queue():
    return engine.dlq


@app.get("/api/audit/verify")
def verify_audit_trail():
    return engine.verify_cryptographic_audit_chain()


@app.post("/api/audit/test-tamper")
def test_tamper(sequence_id: int, new_units: int):
    success = engine.tamper_payload_for_testing(sequence_id, new_units)
    if not success:
        raise HTTPException(status_code=404, detail=f"Sequence #{sequence_id} not found in event stream")
    return {
        "status": "TAMPER_INJECTED",
        "target_sequence": sequence_id,
        "new_units": new_units,
        "audit_verification": engine.verify_cryptographic_audit_chain()
    }


@app.get("/api/telemetry")
def get_system_telemetry():
    now = time.time()
    elapsed = max(1.0, now - engine.engine_start_time)
    throughput = round(engine.global_sequence / elapsed, 2)
    latest_lag = 0.0
    if engine.materialized_views:
        latest_lag = list(engine.materialized_views.values())[-1].projection_lag_ms

    return {
        "global_sequence_id": engine.global_sequence,
        "projection_worker_sequence": engine.projection_worker_sequence,
        "projection_lag_ms": latest_lag,
        "commit_throughput_events_per_sec": throughput,
        "total_commands_processed": engine.total_commands_processed,
        "total_occ_conflicts": engine.total_occ_conflicts,
        "total_snapshots": sum(len(s) for s in engine.snapshots.values()),
        "dlq_size": len(engine.dlq),
        "audit_chain_status": "SECURE_IMMUTABLE" if engine.verify_cryptographic_audit_chain()["valid"] else "TAMPER_ALERT"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
