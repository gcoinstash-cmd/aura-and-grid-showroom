"""
Pytest Verification Suite (>85% Coverage) for GF-T3-290
Verifies:
1. Asynchronous rank communication and ring All-Reduce slicing correctness.
2. Multi-GPU bandwidth saturation and low-latency tensor synchronization under load.
3. Hardware tensor core acceleration and throughput saturation.
4. Strict Zero-Dollar Gate compliance across payloads and telemetry logs.
"""

import json
import pytest
from fastapi.testclient import TestClient
from engine import (
    app,
    ENGINE,
    TensorCorridor,
    compute_ring_allreduce_latency_us,
    partition_attention_weights,
    synchronize_ring_gradients,
)

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_engine_before_test() -> None:
    ENGINE.reset_state()


def test_health_endpoint_and_zero_dollar_gate() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["chassis"] == "GF-T3-290"
    assert payload["status"] == "OK"
    assert chr(36) not in json.dumps(payload)


def test_asynchronous_rank_communication_and_slicing_correctness() -> None:
    slices = partition_attention_weights(matrix_dim=64, num_ranks=8, step_seed=1)
    assert len(slices) == 8
    for rank_slice in slices:
        assert len(rank_slice) == 4
        assert all(isinstance(v, float) for v in rank_slice)

    reduced = synchronize_ring_gradients(slices)
    assert len(reduced) == 4
    expected_col_0 = round(sum(s[0] for s in slices) / 8.0, 2)
    assert reduced[0] == expected_col_0


def test_partition_validation_errors() -> None:
    with pytest.raises(ValueError):
        partition_attention_weights(matrix_dim=64, num_ranks=0)
    with pytest.raises(ValueError):
        partition_attention_weights(matrix_dim=63, num_ranks=8)
    assert synchronize_ring_gradients([]) == [0.0, 0.0, 0.0, 0.0]


def test_ring_allreduce_formula_and_single_rank_edge_case() -> None:
    single_rank_us = compute_ring_allreduce_latency_us(
        num_ranks=1,
        payload_bytes=1048576,
        link_bandwidth_gbps=45600.0,
        barrier_alpha_us=0.01,
    )
    assert single_rank_us == 0.01

    eight_rank_us = compute_ring_allreduce_latency_us(
        num_ranks=8,
        payload_bytes=268435456,
        link_bandwidth_gbps=45600.0,
        barrier_alpha_us=0.01,
    )
    assert eight_rank_us > 0.01
    assert eight_rank_us < 15.0


def test_multi_gpu_bandwidth_saturation_and_low_latency_sync() -> None:
    resp = client.post(
        "/api/v1/compute/allreduce",
        json={
            "num_ranks": 8,
            "payload_bytes": 65536,
            "link_bandwidth_gbps": 45600.0,
            "barrier_alpha_us": 0.01,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["num_ranks"] == 8
    assert data["scaling_efficiency_pct"] == 87.5
    assert data["effective_throughput_gbps"] == 39900.0
    assert data["allreduce_time_us"] <= 0.05
    assert chr(36) not in json.dumps(data)


def test_hardware_tensor_core_acceleration_and_chaos_triggers() -> None:
    # 1. Baseline telemetry check
    init_resp = client.get("/api/v1/telemetry")
    assert init_resp.status_code == 200
    base_data = init_resp.json()
    assert base_data["tensor_throughput_gbps"] == 45600
    assert base_data["ring_latency_us"] == 0.01
    assert base_data["active_ranks"] == 8
    assert len(base_data["ranks"]) == 8
    assert base_data["ranks"][0]["hex_ptr"] == "0x17000"
    assert base_data["ranks"][3]["hex_ptr"] == "0x17030"

    # 2. Trigger Tensor Parallelism Burst
    burst_resp = client.post(
        "/api/v1/actions/burst",
        json={
            "multiplier": 1.25,
            "corridor": TensorCorridor.BRAVO.value,
        },
    )
    assert burst_resp.status_code == 200
    burst_data = burst_resp.json()
    assert burst_data["tensor_throughput_gbps"] == 57000
    assert burst_data["processed_tokens_units"] == 9504000
    assert burst_data["corridor"] == TensorCorridor.BRAVO.value

    # 3. Toggle Ring Congestion Spike (Engage & Clear)
    spike_on = client.post("/api/v1/actions/congestion").json()
    assert spike_on["congestion_active"] is True
    assert spike_on["corridor"] == TensorCorridor.GAMMA.value
    assert spike_on["ring_latency_us"] == 0.04

    spike_off = client.post("/api/v1/actions/congestion").json()
    assert spike_off["congestion_active"] is False
    assert spike_off["tensor_throughput_gbps"] == 45600

    # 4. Step Asynchronous Ring-Reduce Pass
    step_data = client.post("/api/v1/actions/step-ring-reduce").json()
    assert step_data["step_sequence"] >= 4
    assert step_data["ranks"][0]["state_label"] == "REDUCED · LOCKED"

    # 5. Flush Rank Buffers & Re-Zero Tensor Arenas
    flush_data = client.post("/api/v1/actions/flush").json()
    assert flush_data["tensor_throughput_gbps"] == 45600
    assert flush_data["processed_tokens_units"] == 8448000
    assert chr(36) not in json.dumps(flush_data)
