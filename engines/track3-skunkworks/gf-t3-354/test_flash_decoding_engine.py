"""
Automated Pytest Verification Suite for GF-T3-354
Gate 01 - Gate 04 Verification (>85% Coverage Target)
"""

import math
import pytest
from fastapi.testclient import TestClient
from engine import (
    CorridorID,
    DeterministicFlashDecodingEngine,
    FlashDecodeRequest,
    app,
)

client = TestClient(app)


def test_mqa_gqa_head_mapping_correctness() -> None:
    """Verifies MQA/GQA head sharing topology and divisibility validation."""
    group_size, mapping = DeterministicFlashDecodingEngine.map_mqa_gqa_heads(64, 8)
    assert group_size == 8
    assert len(mapping) == 64
    assert mapping[0] == 0
    assert mapping[7] == 0
    assert mapping[8] == 1
    assert mapping[63] == 7

    # Pure MQA single KV head
    mqa_group, mqa_map = DeterministicFlashDecodingEngine.map_mqa_gqa_heads(32, 1)
    assert mqa_group == 32
    assert all(h == 0 for h in mqa_map)

    with pytest.raises(ValueError):
        DeterministicFlashDecodingEngine.map_mqa_gqa_heads(64, 7)


def test_split_k_attention_reduction_correctness() -> None:
    """Verifies non-blocking split-K shared memory online log-sum-exp reduction."""
    q_vec = [1.11, 1.12, 1.11, 1.12]
    k_blocks = [
        [1.05, 0.98, 1.02, 1.01],
        [1.10, 1.04, 0.99, 1.07],
    ]
    v_blocks = [
        [1.11, 1.12, 1.11, 1.12],
        [1.11, 1.12, 1.11, 1.12],
    ]

    lse_val, reduced_vec = DeterministicFlashDecodingEngine.compute_split_k_flash_operator(
        q_vec, k_blocks, v_blocks, theta_split_k=1.0
    )
    assert math.isfinite(lse_val)
    assert len(reduced_vec) == 4
    assert reduced_vec == [1.11, 1.12, 1.11, 1.12]

    with pytest.raises(ValueError):
        DeterministicFlashDecodingEngine.compute_split_k_flash_operator(q_vec, [], [])

    with pytest.raises(ValueError):
        DeterministicFlashDecodingEngine.compute_split_k_flash_operator(
            q_vec, [[1.0, 2.0]], [[1.0, 2.0, 3.0, 4.0]]
        )


def test_asynchronous_execution_under_long_context_spikes() -> None:
    """Verifies dynamic split-K re-tiling and sub-microsecond latency bounds under 2X context spike."""
    eng = DeterministicFlashDecodingEngine()
    base_res = eng.evaluate_mqa_flash_interlock(FlashDecodeRequest())
    assert base_res.decoding_throughput_gbs == 157000
    assert base_res.tiling_latency_us == 0.01
    assert base_res.kernels[0].tokens_k == 32
    assert base_res.kernels[0].split_k_partitions == 8

    spiked_res = eng.toggle_long_context_spike()
    assert spiked_res.tiling_latency_us == 0.015
    assert spiked_res.kernels[0].tokens_k == 64
    assert spiked_res.kernels[0].split_k_partitions == 16
    assert spiked_res.kernels[0].status == "RE-TILED · LOCKED"


def test_hardware_tensor_core_acceleration_and_throughput_saturation() -> None:
    """Verifies corridor switching, burst saturation, step pass, flush reset, and FastAPI endpoints."""
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["unit_id"] == "GF-T3-354"

    telem = client.get("/api/v1/telemetry")
    assert telem.status_code == 200
    data = telem.json()
    assert data["decoding_throughput_gbs"] == 157000
    assert data["active_kernels_count"] == 8
    assert len(data["kernels"]) == 8

    burst_resp = client.post("/api/v1/actions/burst")
    assert burst_resp.status_code == 200
    assert burst_resp.json()["decoding_throughput_gbs"] > 157000

    step_resp = client.post("/api/v1/actions/step")
    assert step_resp.status_code == 200
    assert step_resp.json()["processed_tokens_units"] > 38200000

    spike_resp = client.post("/api/v1/actions/spike")
    assert spike_resp.status_code == 200

    decode_resp = client.post(
        "/api/v1/decode",
        json={
            "corridor": CorridorID.BRAVO.value,
            "query_heads": 64,
            "kv_heads": 8,
            "context_tokens": 524288,
            "split_k_factor": 8,
            "long_context_spike": False,
            "burst_multiplier": 1.0,
        },
    )
    assert decode_resp.status_code == 200
    assert decode_resp.json()["corridor"] == CorridorID.BRAVO.value

    flush_resp = client.post("/api/v1/actions/flush")
    assert flush_resp.status_code == 200
    assert flush_resp.json()["decoding_throughput_gbs"] == 157000
    assert flush_resp.json()["processed_tokens_units"] == 38200000
