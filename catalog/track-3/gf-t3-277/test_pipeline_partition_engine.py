"""
Pytest Suite for GF-T3-277 Multi-GPU Pipeline Partitioning & Layer-Wise Tensor Sharding Engine
Verifies:
1. Layer-wise pipeline stage sharding and micro-batch scheduling correctness.
2. Non-blocking peer-to-peer tensor forwarding efficiency and zero NVLink stalls.
3. Hardware tensor core acceleration and throughput saturation.
"""

import pytest
from engine import (
    PipelinePartitionRequest,
    compute_layer_flops,
    compute_stage_partition_cost,
    compute_1f1b_bubble_fraction,
    compute_p2p_tensor_forwarding_latency_us,
    execute_pipeline_partition_simulation,
    health_check,
)


def test_layer_wise_pipeline_stage_sharding_and_micro_batch_scheduling():
    """Verifies exact 32-layer partitioning across 8 GPU stages and 1F1B bubble math."""
    req = PipelinePartitionRequest(
        corridor_label="PIPE-CORRIDOR-ALPHA (MULTI-GPU-PIPELINE-PARTITIONING-FABRIC · 36000-GB/S)",
        total_layers=32,
        num_stages=8,
        micro_batches=32,
        hidden_dim=8192,
        seq_length=4096,
    )
    result = execute_pipeline_partition_simulation(req)

    assert result["engine_id"] == "GF-T3-277"
    assert result["active_stages_count"] == 8
    assert len(result["stages"]) == 8

    # Verify contiguous non-overlapping layer assignments L0-L4 .. L28-L32
    expected_Bounds = [
        (0, 4, "0xB000"),
        (4, 8, "0xB010"),
        (8, 12, "0xB020"),
        (12, 16, "0xB030"),
        (16, 20, "0xB040"),
        (20, 24, "0xB050"),
        (24, 28, "0xB060"),
        (28, 32, "0xB070"),
    ]
    for idx, (l_start, l_end, hex_ptr) in enumerate(expected_Bounds):
        stage = result["stages"][idx]
        assert stage["stage_code"] == "P" + str(idx)
        assert stage["layer_start"] == l_start
        assert stage["layer_end"] == l_end
        assert stage["hex_ptr"] == hex_ptr
        assert stage["is_balanced"] is True
        assert stage["status_label"] == "BALANCED · LOCKED"

    # Verify 1F1B pipeline bubble decreases monotonically with more micro-batches
    bubble_8 = compute_1f1b_bubble_fraction(num_stages=8, micro_batches=8)
    bubble_32 = compute_1f1b_bubble_fraction(num_stages=8, micro_batches=32)
    bubble_128 = compute_1f1b_bubble_fraction(num_stages=8, micro_batches=128)
    assert bubble_128 < bubble_32 < bubble_8
    assert compute_1f1b_bubble_fraction(num_stages=1, micro_batches=16) == 0.0


def test_non_blocking_p2p_tensor_forwarding_and_zero_nvlink_stalls():
    """Verifies non-blocking P2P activation forwarding and stage imbalance detection."""
    lat_zero_copy = compute_p2p_tensor_forwarding_latency_us(
        hidden_dim=8192,
        seq_length=4096,
        nvlink_bandwidth_gbs=36000.0,
        zero_copy_enabled=True,
    )
    lat_blocking = compute_p2p_tensor_forwarding_latency_us(
        hidden_dim=8192,
        seq_length=4096,
        nvlink_bandwidth_gbs=36000.0,
        zero_copy_enabled=False,
    )
    assert lat_zero_copy <= 0.01
    assert lat_zero_copy < lat_blocking

    # Verify stage imbalance spike triggers micro-batch re-routing alert on P3
    spiked_req = PipelinePartitionRequest(
        corridor_label="PIPE-CORRIDOR-ALPHA (MULTI-GPU-PIPELINE-PARTITIONING-FABRIC · 36000-GB/S)",
        total_layers=32,
        num_stages=8,
        micro_batches=32,
        inject_imbalance_stage=3,
        imbalance_multiplier=2.25,
    )
    spiked_res = execute_pipeline_partition_simulation(spiked_req)
    assert spiked_res["pipeline_state"] == "Stage Imbalance Detected"
    assert spiked_res["stages"][3]["is_balanced"] is False
    assert spiked_res["stages"][3]["status_label"] == "IMBALANCE · FAULT"
    assert spiked_res["stages"][3]["stage_partition_load"] > spiked_res["stages"][0]["stage_partition_load"]
    assert spiked_res["balance_parity_pct"] < 100.0


def test_hardware_tensor_core_acceleration_and_throughput_saturation():
    """Verifies FLOPs scaling, bandwidth saturation at 36,000 GB/s, and GridSync sanitization."""
    flops_base = compute_layer_flops(hidden_dim=4096, seq_length=2048, micro_batch_size=4)
    flops_wide = compute_layer_flops(hidden_dim=8192, seq_length=4096, micro_batch_size=4)
    assert flops_wide > flops_base * 4.0

    cost_alpha = compute_stage_partition_cost([0, 1, 2, 3], 8192, 4096, 36000.0)
    cost_delta = compute_stage_partition_cost([0, 1, 2, 3], 8192, 4096, 9600.0)
    assert cost_alpha < cost_delta

    health = health_check()
    assert health["engine"] == "GF-T3-277"
    assert health["partition_throughput_gbs"] == 36000

    with pytest.raises(ValueError):
        PipelinePartitionRequest(corridor_label="DROP TABLE stages; --")
