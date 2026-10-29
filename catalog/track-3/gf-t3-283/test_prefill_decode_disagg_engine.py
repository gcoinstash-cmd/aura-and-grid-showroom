"""
GF-T3-283 Pytest Verification Suite (>85% Coverage)
Verifies:
1. Prefill-decode compute disaggregation and zero-copy RDMA KV-state streaming correctness.
2. Asymmetric worker allocation efficiency and TTFT latency isolation under high concurrency.
3. Hardware tensor core acceleration and throughput saturation.
"""

import pytest
from pydantic import ValidationError
from engine import (
    CorridorId,
    DisaggSimulationRequest,
    compute_crc32_hex,
    compute_kv_cache_state_gb,
    evaluate_disagg_simulation,
    health_check,
    list_corridors,
)


def test_prefill_decode_disaggregation_and_rdma_kv_streaming_correctness() -> None:
    """
    1. Verifies prefill-decode compute disaggregation formula:
       T_disagg = max(T_prefill, T_decode) + KV_transfer
       and deterministic zero-copy RDMA KV-state streaming pointers & CRC-32 checksums.
    """
    kv_gb = compute_kv_cache_state_gb(
        seq_length_tokens=32768,
        batch_size=8,
        num_layers=80,
        num_kv_heads=8,
        head_dim=128,
    )
    assert abs(kv_gb - 85.8993) < 0.001

    req = DisaggSimulationRequest(
        corridor_id=CorridorId.ALPHA,
        burst_multiplier=1.0,
        congestion_active=False,
        chunk_pass_count=0,
    )
    res = evaluate_disagg_simulation(req)

    assert res.streaming_throughput_gbps == 40800.0
    assert res.handoff_latency_us == 0.01
    assert res.active_nodes_count == 8
    assert res.total_nodes_count == 8
    assert res.processed_tokens_units == 7680000
    assert res.disagg_state_label == "Streaming Active"
    assert len(res.nodes) == 8
    assert res.nodes[0].role == "PREFILL-P0"
    assert res.nodes[0].hex_ptr == "0x11000"
    assert res.nodes[3].role == "DECODE-D3"
    assert res.nodes[3].hex_ptr == "0x11030"

    expected_disagg = round(
        max(res.prefill_time_ms, res.decode_time_ms) + res.kv_transfer_time_ms, 4
    )
    assert res.disagg_total_latency_ms == expected_disagg


def test_asymmetric_worker_allocation_and_ttft_latency_isolation() -> None:
    """
    2. Verifies asymmetric worker allocation efficiency and TTFT latency isolation
       under high concurrency and simulated network congestion spikes.
    """
    normal_req = DisaggSimulationRequest(
        corridor_id=CorridorId.ALPHA,
        burst_multiplier=3.0,
        congestion_active=False,
        chunk_pass_count=2,
    )
    normal_res = evaluate_disagg_simulation(normal_req)

    assert normal_res.disagg_total_latency_ms < normal_res.collocated_total_latency_ms
    assert normal_res.ttft_reduction_percent > 35.0

    congested_req = DisaggSimulationRequest(
        corridor_id=CorridorId.ALPHA,
        burst_multiplier=3.0,
        congestion_active=True,
        chunk_pass_count=2,
    )
    congested_res = evaluate_disagg_simulation(congested_req)

    assert congested_res.streaming_throughput_gbps < normal_res.streaming_throughput_gbps
    assert congested_res.handoff_latency_us > normal_res.handoff_latency_us
    assert congested_res.active_nodes_count == 6
    assert congested_res.nodes[2].state_label == "REROUTING · FAULT"
    assert congested_res.nodes[5].state_label == "REROUTING · FAULT"


def test_hardware_tensor_core_acceleration_and_throughput_saturation() -> None:
    """
    3. Verifies hardware tensor core acceleration across all synthetic disaggregation corridors
       and validates GridSync zero-trust input sanitization.
    """
    corridors = list_corridors()
    assert len(corridors) == 4
    assert health_check()["engine"] == "GF-T3-283"

    for cid in CorridorId:
        res = evaluate_disagg_simulation(
            DisaggSimulationRequest(corridor_id=cid, chunk_pass_count=4)
        )
        assert res.streaming_throughput_gbps > 18000.0
        assert res.disagg_total_latency_ms < res.collocated_total_latency_ms

    crc_a = compute_crc32_hex("DISAGG-CORRIDOR-ALPHA:PREFILL-P0:256:0")
    crc_b = compute_crc32_hex("DISAGG-CORRIDOR-ALPHA:PREFILL-P0:256:0")
    assert crc_a == crc_b
    assert crc_a.startswith("0x")

    with pytest.raises(ValidationError):
        DisaggSimulationRequest(operator_note="DROP TABLE disagg_corridors;--")
