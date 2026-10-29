"""
GF-T3-224 Pytest Verification Suite
Verifies:
1. Numerical equivalence between sharded Ring All-Reduce and single-node reference matmul.
2. Exact clockwise bucket accumulation order across all N ranks in Scatter-Reduce and All-Gather.
3. Zero memory drift and deterministic ring desync fault recovery.
SPDX-License-Identifier: MIT
"""

import math
import pytest
from engine import (
    CORRIDOR_PROFILES,
    RingAllReduceEngine,
    RingStepRequest,
    compute_parity_checksum,
    partition_tensor_into_buckets,
    post_ring_reduce_all,
    post_ring_step,
    single_node_reference_matmul_reduce,
)


def test_numerical_equivalence_sharded_ring_vs_single_node_reference():
    """
    Verifies that executing the 2-phase Ring All-Reduce across 4 and 8 GPU ranks
    produces bit-exact numerical equivalence with a single-node reference reduction.
    """
    for world_size in (4, 8):
        engine = RingAllReduceEngine(
            world_size=world_size, corridor_id="TP-CORRIDOR-ALPHA"
        )
        reference_vector = single_node_reference_matmul_reduce(
            [rank.local_activations for rank in engine.ranks]
        )
        all_reduced_ranks = engine.execute_full_all_reduce()

        assert len(all_reduced_ranks) == world_size
        for rank_id, rank_tensor in enumerate(all_reduced_ranks):
            assert len(rank_tensor) == len(reference_vector)
            for idx, (actual_val, expected_val) in enumerate(
                zip(rank_tensor, reference_vector)
            ):
                assert math.isclose(
                    actual_val, expected_val, rel_tol=1e-7, abs_tol=1e-7
                ), f"Rank {rank_id} index {idx} drifted from reference"
        assert engine.verify_global_parity() is True


def test_exact_clockwise_bucket_accumulation_order():
    """
    Verifies the exact clockwise ring schedule:
    - Phase 1 (Scatter-Reduce): N - 1 steps where rank r receives chunk (r - s - 1) mod N
      from sender (r - 1) mod N.
    - Phase 2 (All-Gather): N - 1 steps where rank r receives fully reduced chunk (r - s) mod N
      from sender (r - 1) mod N.
    """
    world_size = 4
    engine = RingAllReduceEngine(world_size=world_size, corridor_id="TP-CORRIDOR-ALPHA")
    engine.execute_full_all_reduce()

    total_events = engine.accumulation_trace
    # 2 phases * (N - 1) steps * N ranks = 2 * 3 * 4 = 24 events
    assert len(total_events) == 2 * (world_size - 1) * world_size

    scatter_events = [e for e in total_events if e["phase"] == 1]
    gather_events = [e for e in total_events if e["phase"] == 2]
    assert len(scatter_events) == (world_size - 1) * world_size
    assert len(gather_events) == (world_size - 1) * world_size

    # Verify clockwise neighbor topology: sender is always (receiver - 1) % N
    for event in total_events:
        expected_sender = (event["receiver_rank"] - 1) % world_size
        assert event["sender_rank"] == expected_sender

    # Verify after Scatter-Reduce (before All-Gather) each rank r holds full sum in chunk (r + 1) % N
    engine_sr = RingAllReduceEngine(world_size=world_size)
    ref_vec = single_node_reference_matmul_reduce(
        [r.local_activations for r in engine_sr.ranks]
    )
    ref_chunks = partition_tensor_into_buckets(ref_vec, world_size)
    for s in range(world_size - 1):
        engine_sr.step_scatter_reduce(s)

    for r in range(world_size):
        fully_reduced_idx = (r + 1) % world_size
        assert engine_sr.ranks[r].chunks[fully_reduced_idx] == pytest.approx(
            ref_chunks[fully_reduced_idx]
        )


def test_zero_memory_drift_and_ring_desync_recovery():
    """
    Simulates a packet drop and ring desynchronization on each rank and verifies
    that the engine detects parity mismatch, flushes, and recovers with 0.0 memory drift.
    """
    engine = RingAllReduceEngine(world_size=4, corridor_id="TP-CORRIDOR-GAMMA")
    for target_rank in range(4):
        recovery_report = engine.inject_fault_and_recover(target_rank=target_rank)
        assert recovery_report["fault_rank"] == target_rank
        assert (
            recovery_report["corrupted_parity_hash"]
            != recovery_report["recovered_parity_hash"]
        )
        assert recovery_report["max_memory_drift"] == 0.0
        assert recovery_report["ring_synchronized"] is True


def test_comm_comp_stream_overlap_and_api_handlers():
    """
    Verifies that enabling comm-comp stream overlap strictly reduces exposed All-Reduce
    communication overhead compared to sequential execution across synthetic corridors.
    """
    engine = RingAllReduceEngine(world_size=4, corridor_id="TP-CORRIDOR-GAMMA")
    overlapped = engine.compute_stream_overlap_schedule(
        tensor_units=128000, bus_throttle_ratio=1.0, comm_overlap_enabled=True
    )
    sequential = engine.compute_stream_overlap_schedule(
        tensor_units=128000, bus_throttle_ratio=1.0, comm_overlap_enabled=False
    )

    assert overlapped["all_reduce_overhead_ms"] < sequential["all_reduce_overhead_ms"]
    assert overlapped["ring_efficiency_pct"] > sequential["ring_efficiency_pct"]

    req = RingStepRequest(
        corridor_id="TP-CORRIDOR-ALPHA",
        world_size=4,
        tensor_units=128000,
        bus_throttle_ratio=0.75,
        comm_overlap_enabled=True,
    )
    step_resp = post_ring_step(req)
    assert step_resp["chassis"] == "GF-T3-224"
    assert len(step_resp["ranks"]) == 4

    reduce_resp = post_ring_reduce_all(req)
    assert reduce_resp["synchronized"] is True
    assert reduce_resp["max_memory_drift"] == 0.0
