"""
SPDX-License-Identifier: MIT
Pytest & Unittest Verification Suite for GF-T3-239 Tensor Parallelism & Ring All-Reduce Accelerator
Verifies:
1. Numerical equivalence between non-sharded linear layers and sharded column-row tensor parallel passes.
2. Ring All-Reduce gradient/activation accumulation accuracy across 8 mock ranks.
3. Communication bandwidth saturation and overlap efficiency.
"""

import unittest
from engine import (
    CORRIDOR_PROFILES,
    ShardExecuteRequest,
    compute_ring_bandwidth_and_overlap,
    execute_column_row_tensor_parallel,
    execute_tp_step,
    generate_deterministic_matrix,
    get_health,
    matmul_2d,
    ring_all_reduce_sum,
    shard_column_wise,
    shard_row_wise,
)


def test_health_endpoint_contract() -> None:
    health = get_health()
    assert health["engine_id"] == "GF-T3-239"
    assert health["active_ranks"] == 8
    assert health["ring_bandwidth_gbs"] == 4800.0
    assert health["all_reduce_latency_us"] == 0.04


def test_column_and_row_sharding_conservation() -> None:
    weight_col = generate_deterministic_matrix(16, 32, seed_offset=5)
    col_shards = shard_column_wise(weight_col, world_size=8)
    assert len(col_shards) == 8
    assert len(col_shards[0]) == 16
    assert len(col_shards[0][0]) == 4

    weight_row = generate_deterministic_matrix(32, 16, seed_offset=9)
    row_shards = shard_row_wise(weight_row, world_size=8)
    assert len(row_shards) == 8
    assert len(row_shards[0]) == 4
    assert len(row_shards[0][0]) == 16


def test_numerical_equivalence_column_row_tensor_parallel_8_ranks() -> None:
    x_input = generate_deterministic_matrix(6, 16, seed_offset=11)
    w_col = generate_deterministic_matrix(16, 32, seed_offset=22)
    w_row = generate_deterministic_matrix(32, 16, seed_offset=33)

    result = execute_column_row_tensor_parallel(x_input, w_col, w_row, world_size=8)
    assert result["numerically_equivalent"] is True
    assert float(result["max_abs_diff"]) < 1e-9  # type: ignore[arg-type]
    assert len(result["hop_trace"]) == 8  # type: ignore[arg-type]


def test_ring_all_reduce_gradient_accumulation_8_ranks() -> None:
    rank_partials = [
        generate_deterministic_matrix(4, 8, seed_offset=rank + 10) for rank in range(8)
    ]
    reduced, trace = ring_all_reduce_sum(rank_partials)
    assert len(trace) == 8
    assert trace[0]["phase"] == "SCATTER_REDUCE"
    assert trace[7]["phase"] == "ALL_GATHER"

    for r in range(4):
        for c in range(8):
            expected = sum(rank_partials[rank][r][c] for rank in range(8))
            assert abs(reduced[r][c] - expected) < 1e-9


def test_communication_bandwidth_saturation_and_overlap() -> None:
    healthy = compute_ring_bandwidth_and_overlap(
        shard_bytes_mb=32.0,
        world_size=8,
        link_bandwidth_gbs=4800.0,
        compute_window_us=14.0,
        overlap_ratio=0.94,
        desync_ranks=0,
    )
    degraded = compute_ring_bandwidth_and_overlap(
        shard_bytes_mb=32.0,
        world_size=8,
        link_bandwidth_gbs=4800.0,
        compute_window_us=14.0,
        overlap_ratio=0.94,
        desync_ranks=2,
    )
    assert healthy["ring_factor"] == 1.75
    assert healthy["effective_bandwidth_gbs"] == 4800.0
    assert healthy["effective_bandwidth_gbs"] > degraded["effective_bandwidth_gbs"]
    assert healthy["overlap_efficiency_pct"] > degraded["overlap_efficiency_pct"]


def test_api_execute_tp_step_all_corridors() -> None:
    for corridor_name in CORRIDOR_PROFILES:
        req = ShardExecuteRequest(
            corridor=corridor_name,
            batch_tokens=4,
            hidden_dim=16,
            ffn_dim=32,
            shard_size_mb=32.0,
            desync_ranks=0,
        )
        res = execute_tp_step(req)
        assert res["engine_id"] == "GF-T3-239"
        assert res["numerically_equivalent"] is True


def test_invalid_sharding_dimensions_rejected() -> None:
    raised_col = False
    try:
        shard_column_wise([[1.0, 2.0, 3.0]], world_size=8)
    except ValueError:
        raised_col = True
    assert raised_col is True

    raised_mm = False
    try:
        matmul_2d([[1.0, 2.0]], [[1.0, 2.0]])
    except ValueError:
        raised_mm = True
    assert raised_mm is True


class TestTensorParallelEngine(unittest.TestCase):
    def test_all_suites(self) -> None:
        test_health_endpoint_contract()
        test_column_and_row_sharding_conservation()
        test_numerical_equivalence_column_row_tensor_parallel_8_ranks()
        test_ring_all_reduce_gradient_accumulation_8_ranks()
        test_communication_bandwidth_saturation_and_overlap()
        test_api_execute_tp_step_all_corridors()
        test_invalid_sharding_dimensions_rejected()


if __name__ == "__main__":
    unittest.main()
