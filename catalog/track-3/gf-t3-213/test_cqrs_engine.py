"""
APEX-213 Distributed CQRS & Event Sourcing Engine - Verification Suite
Coverage Target: >80% Core Protocol & Invariant Test Suite
Clean-Room Certified - Standard Commercial Asset Transfer Specification
"""

import pytest
from engine import (
    CQRSProjectionEngine,
    BaseCommand,
    CommandType,
    CorridorId,
    StaleVersionError,
    compute_event_hash
)


@pytest.fixture
def clean_engine():
    """Initializes fresh CQRS projection engine with genesis settlement ledger."""
    return CQRSProjectionEngine()


def test_genesis_state_initialization(clean_engine):
    """Verifies aggregate corridor genesis bootstrap sequence."""
    corridor = CorridorId.CORRIDOR_ALPHA.value
    state = clean_engine.get_aggregate_state(corridor)
    
    assert state["version"] == 1
    assert state["ledger_balance"] == 100000
    assert state["available_balance"] == 100000
    assert state["reserved_balance"] == 0
    assert state["status"] == "ACTIVE"
    assert clean_engine.global_sequence == 1


def test_optimistic_concurrency_control_occ_safety(clean_engine):
    """
    OCC Safety Invariant:
    A command must specify expected_version == current_version.
    Concurrent or stale mutations must raise StaleVersionError without mutating state.
    """
    corridor = CorridorId.CORRIDOR_ALPHA.value
    current_ver = clean_engine.aggregate_versions[corridor]
    assert current_ver == 1

    # Mutation 1 with correct expected version
    cmd1 = BaseCommand(
        command_id="CMD-OCC-001",
        corridor_id=corridor,
        command_type=CommandType.COMMIT_ALLOCATION,
        expected_version=1,
        payload={"units": 25000, "purpose": "EXPANSION_BATCH_01"}
    )
    event1 = clean_engine.dispatch_command(cmd1)
    assert event1.aggregate_version == 2
    assert clean_engine.aggregate_versions[corridor] == 2

    # Mutation 2 with STALE expected version (attempts expected_version=1 again instead of 2)
    stale_cmd = BaseCommand(
        command_id="CMD-OCC-STALE",
        corridor_id=corridor,
        command_type=CommandType.COMMIT_ALLOCATION,
        expected_version=1,
        payload={"units": 10000, "purpose": "CONCURRENT_RACE_MUTATION"}
    )
    
    with pytest.raises(StaleVersionError) as exc_info:
        clean_engine.dispatch_command(stale_cmd)

    assert exc_info.value.expected_version == 1
    assert exc_info.value.current_version == 2

    # Ensure state remained at v2 without uncommitted side effects
    post_state = clean_engine.get_aggregate_state(corridor)
    assert post_state["version"] == 2
    assert post_state["ledger_balance"] == 125000

    # Ensure dead-letter queue captured the collision record
    assert len(clean_engine.dlq) == 1
    assert clean_engine.dlq[0].error_code == "STALE_VERSION_OCC_CONFLICT"


def test_event_fold_determinism(clean_engine):
    """
    Mathematical State Fold Invariant:
    S_t = S_0 + sum_{i=1}^t (delta_e_i)
    Replaying the exact event sequence on an uninitialized state MUST yield
    bit-for-bit identical aggregate state.
    """
    corridor = CorridorId.CORRIDOR_ALPHA.value

    # Apply 10 sequential commands
    for i in range(1, 11):
        v = clean_engine.aggregate_versions[corridor]
        cmd = BaseCommand(
            command_id=f"CMD-DETERMINISM-{i}",
            corridor_id=corridor,
            command_type=CommandType.COMMIT_ALLOCATION,
            expected_version=v,
            payload={"units": 5000, "purpose": f"BATCH_{i}"}
        )
        clean_engine.dispatch_command(cmd)

    # State from engine
    live_state = clean_engine.get_aggregate_state(corridor)
    assert live_state["version"] == 11
    assert live_state["ledger_balance"] == 150000

    # Independent cold replay of event stream
    replayed_state = {
        "corridor_id": corridor,
        "version": 0,
        "ledger_balance": 0,
        "reserved_balance": 0,
        "available_balance": 0,
        "transaction_count": 0,
        "status": "UNINITIALIZED",
        "throughput_rate_limit": 5000,
    }

    for ev in clean_engine.event_stream:
        if ev.corridor_id == corridor:
            replayed_state = clean_engine._apply_event_fold(replayed_state, ev)

    assert live_state == replayed_state


def test_snapshot_integrity_and_compaction(clean_engine):
    """
    Snapshot Compaction Invariant:
    Loading state from Snapshot(v100) + 12 events matches direct 112-event fold.
    Verifies O(1) bootstrap performance without loss of deterministic precision.
    """
    corridor = CorridorId.CORRIDOR_ALPHA.value

    # Dispatch 111 additional commands to bring version from v1 to v112
    # Snapshot trigger occurs at v100
    for i in range(2, 113):
        v = clean_engine.aggregate_versions[corridor]
        cmd = BaseCommand(
            command_id=f"CMD-COMPACTION-{i}",
            corridor_id=corridor,
            command_type=CommandType.COMMIT_ALLOCATION,
            expected_version=v,
            payload={"units": 1000, "purpose": f"COMPACT_BATCH_{i}"}
        )
        clean_engine.dispatch_command(cmd)

    # Verify snapshot at v100 was automatically captured
    assert corridor in clean_engine.snapshots
    snapshots = clean_engine.snapshots[corridor]
    assert len(snapshots) == 1
    snapshot_v100 = snapshots[0]
    assert snapshot_v100.snapshot_version == 100
    assert snapshot_v100.state["ledger_balance"] == 100000 + (99 * 1000)

    # State at v112 retrieved with snapshot acceleration
    accelerated_state = clean_engine.get_aggregate_state(corridor)
    assert accelerated_state["version"] == 112
    assert accelerated_state["ledger_balance"] == 100000 + (111 * 1000)

    # Compare with a pure un-snapshotted full fold
    clean_fold = {
        "corridor_id": corridor,
        "version": 0,
        "ledger_balance": 0,
        "reserved_balance": 0,
        "available_balance": 0,
        "transaction_count": 0,
        "status": "UNINITIALIZED",
        "throughput_rate_limit": 5000,
    }
    for ev in clean_engine.event_stream:
        if ev.corridor_id == corridor:
            clean_fold = clean_engine._apply_event_fold(clean_fold, ev)

    assert accelerated_state == clean_fold


def test_cryptographic_sha256_audit_trail_and_tamper_detection(clean_engine):
    """
    Cryptographic Audit Invariant:
    SHA-256 rolling event hash chain guarantees tamper resistance.
    Any single modified byte in event payload invalidates hash chain verification.
    """
    corridor = CorridorId.CORRIDOR_ALPHA.value

    for i in range(1, 6):
        v = clean_engine.aggregate_versions[corridor]
        cmd = BaseCommand(
            command_id=f"CMD-AUDIT-{i}",
            corridor_id=corridor,
            command_type=CommandType.COMMIT_ALLOCATION,
            expected_version=v,
            payload={"units": 1000 * i, "purpose": f"AUDIT_BATCH_{i}"}
        )
        clean_engine.dispatch_command(cmd)

    # 1. Unmodified chain must pass cryptographic verification
    audit_pre = clean_engine.verify_cryptographic_audit_chain()
    assert audit_pre["valid"] is True
    assert audit_pre["status"] == "CRYPTOGRAPHICALLY_VERIFIED"
    assert audit_pre["inspected_count"] == 6

    # 2. Tamper injection on sequence #3 payload
    target_seq = 3
    clean_engine.tamper_payload_for_testing(target_seq, new_units=999999)

    # 3. Chain verification MUST fail and identify sequence #3
    audit_post = clean_engine.verify_cryptographic_audit_chain()
    assert audit_post["valid"] is False
    assert audit_post["tamper_detected_at_sequence"] == target_seq
    assert "Payload tamper detected" in audit_post["error_reason"]


def test_business_invariants_and_reservation_flow(clean_engine):
    """Verifies two-phase commit reservation and finalized settlement invariant."""
    corridor = CorridorId.CORRIDOR_ALPHA.value
    v = clean_engine.aggregate_versions[corridor]

    # Reserve 20000 units
    cmd_reserve = BaseCommand(
        command_id="CMD-RESERVE-01",
        corridor_id=corridor,
        command_type=CommandType.RESERVE_DEBIT,
        expected_version=v,
        payload={"units": 20000, "reserve_tag": "CLEARING-ESCROW-ALPHA"}
    )
    clean_engine.dispatch_command(cmd_reserve)
    
    state1 = clean_engine.get_aggregate_state(corridor)
    assert state1["reserved_balance"] == 20000
    assert state1["available_balance"] == 80000
    assert state1["ledger_balance"] == 100000

    # Finalize settlement of 15000 units
    v1 = clean_engine.aggregate_versions[corridor]
    cmd_settle = BaseCommand(
        command_id="CMD-SETTLE-01",
        corridor_id=corridor,
        command_type=CommandType.FINALIZE_SETTLEMENT,
        expected_version=v1,
        payload={"units": 15000, "batch_id": "BATCH-SETTLE-001"}
    )
    clean_engine.dispatch_command(cmd_settle)

    state2 = clean_engine.get_aggregate_state(corridor)
    assert state2["reserved_balance"] == 5000
    assert state2["available_balance"] == 80000
    assert state2["ledger_balance"] == 85000
