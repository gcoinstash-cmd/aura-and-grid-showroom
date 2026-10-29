"""
Pytest verification suite for GF-T3-247 Distributed Sequence Parallelism Engine.
Verifies:
1. All-To-All token tensor transposition correctness across GPU ranks.
2. Ring-attention KV block pipelining overlap efficiency with matrix multiplication.
3. Interconnect bandwidth saturation and communication bubble elimination.
4. Absolute zero-dollar sign compliance across payloads.
"""

import json
import pytest
from engine import (
    TensorTranspositionRequest,
    RingPipelineRequest,
    compute_all_to_all_transposition,
    simulate_ring_attention_pipeline,
    health_check,
    list_corridors,
)


def test_all_to_all_tensor_transposition_correctness():
    req = TensorTranspositionRequest(
        batch_size=2,
        sequence_length=262144,
        num_heads=64,
        head_dim=128,
        world_size=8,
        bytes_per_element=2,
        interconnect_gbps=10400.0,
    )
    res = compute_all_to_all_transposition(req)
    assert res["input_shape"] == [2, 32768, 64, 128]
    assert res["transposed_shape"] == [2, 262144, 8, 128]
    assert res["parity_verified"] is True
    assert res["input_elements_per_rank"] == res["transposed_elements_per_rank"]
    assert res["seq_chunk_per_rank"] == 32768
    assert res["heads_per_rank"] == 8
    assert res["all_to_all_bytes_per_rank"] > 0


def test_all_to_all_invalid_head_divisibility_raises():
    req = TensorTranspositionRequest(
        batch_size=2,
        sequence_length=262144,
        num_heads=60,
        head_dim=128,
        world_size=8,
    )
    with pytest.raises(ValueError, match="divisible"):
        compute_all_to_all_transposition(req)


def test_ring_attention_kv_pipelining_overlap_efficiency():
    req = RingPipelineRequest(
        sequence_length=262144,
        world_size=8,
        hidden_dim=8192,
        device_tflops=989.0,
        interconnect_gbps=10400.0,
        interconnect_stall_factor=0.0,
    )
    res = simulate_ring_attention_pipeline(req)
    assert res["world_size"] == 8
    assert res["chunk_tokens"] == 32768
    assert res["ring_steps"] == 7
    assert res["overlap_efficiency_pct"] >= 96.0
    assert res["zero_bubble_verified"] is True
    assert len(res["ranks"]) == 8
    for idx, rank in enumerate(res["ranks"]):
        assert rank["rank_id"] == idx
        assert rank["peer_rank"] == (idx + 1) % 8
        assert rank["status"] == "LOCKED"


def test_interconnect_stall_fault_injection_and_resync():
    req = RingPipelineRequest(
        sequence_length=262144,
        world_size=8,
        hidden_dim=8192,
        device_tflops=989.0,
        interconnect_gbps=10400.0,
        interconnect_stall_factor=0.5,
    )
    res = simulate_ring_attention_pipeline(req)
    assert res["saturation_gbps"] == 5200.0
    assert res["zero_bubble_verified"] is False
    fault_ranks = [r for r in res["ranks"] if r["status"] == "FAULT"]
    assert len(fault_ranks) == 2
    assert fault_ranks[0]["ring_state"] == "RING_RESYNC"


def test_health_and_corridors_zero_currency_glyph():
    health_payload = json.dumps(health_check())
    corridors_payload = json.dumps(list_corridors())
    assert chr(36) not in health_payload
    assert chr(36) not in corridors_payload
    assert "GF-T3-247" in health_payload
    assert "10,400 GB/s" in health_payload
