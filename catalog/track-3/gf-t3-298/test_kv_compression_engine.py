"""
Pytest Verification Suite for GF-T3-298 (>85% Coverage)
Verifies:
1. KV cache 4-bit/8-bit quantization and outlier retention correctness.
2. Asynchronous cache block recycling efficiency under heavy long-context workloads.
3. Hardware tensor core acceleration and throughput saturation.
"""

from fastapi.testclient import TestClient
from engine import (
    CORRIDORS,
    KVCacheRingSimulator,
    RecycleRequest,
    app,
    quantize_kv_tensor_with_outliers,
)

client = TestClient(app)


def test_four_bit_quantization_and_outlier_retention() -> None:
    # Construct deterministic KV activation vector with 2 clear outliers
    base_activations = [
        -1.2, -0.8, -0.4, -0.1, 0.0, 0.2, 0.5, 0.9,
        1.1, -0.7, 0.3, -0.5, 0.8, -1.0, 0.4, -0.2,
        18.5, -19.2,  # High-magnitude outlier channels
    ]
    res = quantize_kv_tensor_with_outliers(
        tensor_values=base_activations,
        beta_bits=4,
        outlier_sigma_threshold=2.2,
    )
    assert res.beta_bits == 4
    assert len(res.quantized_codes) == len(base_activations)
    assert 16 in res.outlier_indices
    assert 17 in res.outlier_indices
    # Outliers must be preserved at FP16 accuracy
    assert abs(res.dequantized_values[16] - 18.5) < 1e-5
    assert abs(res.dequantized_values[17] - (-19.2)) < 1e-5
    assert res.effective_compression_ratio >= 3.0
    assert res.perplexity_drift <= 0.008


def test_eight_bit_and_fp16_fallback_quantization() -> None:
    tensor = [-2.0, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5, 2.0, 12.0]
    res_8bit = quantize_kv_tensor_with_outliers(
        tensor_values=tensor,
        beta_bits=8,
        outlier_sigma_threshold=2.0,
    )
    assert res_8bit.beta_bits == 8
    assert res_8bit.mean_squared_error < 0.001
    assert res_8bit.effective_compression_ratio >= 1.7

    res_fp16 = quantize_kv_tensor_with_outliers(
        tensor_values=tensor,
        beta_bits=16,
    )
    assert res_fp16.beta_bits == 16
    assert res_fp16.effective_compression_ratio == 1.0
    assert res_fp16.mean_squared_error == 0.0


def test_non_blocking_cache_block_recycling_efficiency() -> None:
    sim = KVCacheRingSimulator()
    req = RecycleRequest(
        workload_tokens=1048576,
        evict_stale_blocks=6,
        streaming_multiprocessors=132,
    )
    result = sim.recycle_evicted_blocks(req)
    assert result.reclaimed_blocks == 6
    assert result.reclaimed_tokens_k == 1536
    assert result.host_cpu_stall_us == 0.0
    assert result.barrier_sync_latency_us <= 0.02
    assert result.recycling_efficiency_pct >= 99.5


def test_hardware_throughput_saturation_and_chaos_triggers() -> None:
    sim = KVCacheRingSimulator()
    baseline = sim.get_state()
    assert baseline.chassis_id == "GF-T3-298"
    assert baseline.throughput_gbps == 54000
    assert baseline.cache_latency_us == 0.01
    assert len(baseline.blocks) == 8

    burst_state = sim.trigger_kv_compression_burst()
    assert burst_state.throughput_gbps == 58400
    assert burst_state.processed_tokens_units == 10520576
    assert all(b.compression_ratio == 4.0 for b in burst_state.blocks)

    spike_state = sim.toggle_outlier_pruning_spike()
    assert spike_state.outlier_spike_active is True
    assert spike_state.blocks[1].bit_width == 8
    assert spike_state.blocks[0].bit_width == 4

    restored_state = sim.toggle_outlier_pruning_spike()
    assert restored_state.outlier_spike_active is False
    assert all(b.bit_width == 4 for b in restored_state.blocks)

    for corridor in CORRIDORS:
        c_state = sim.select_corridor(corridor)
        assert c_state.corridor == corridor

    step_state = sim.step_async_compression_pass()
    assert step_state.step_counter > 1

    flushed = sim.flush_cache_block_arenas()
    assert flushed.throughput_gbps == 54000
    assert flushed.processed_tokens_units == 9472000


def test_fastapi_endpoints_contract() -> None:
    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json()["chassis"] == "GF-T3-298"

    telem = client.get("/api/telemetry")
    assert telem.status_code == 200
    assert telem.json()["chassis_id"] == "GF-T3-298"

    q_resp = client.post(
        "/api/quantize",
        json={
            "tensor_values": [-1.0, -0.5, 0.0, 0.5, 1.0, 0.2, -0.3, 14.0],
            "beta_bits": 4,
            "outlier_sigma_threshold": 2.0,
        },
    )
    assert q_resp.status_code == 200
    assert q_resp.json()["beta_bits"] == 4

    r_resp = client.post(
        "/api/recycle",
        json={
            "workload_tokens": 524288,
            "evict_stale_blocks": 4,
            "streaming_multiprocessors": 132,
        },
    )
    assert r_resp.status_code == 200
    assert r_resp.json()["host_cpu_stall_us"] == 0.0

    assert client.post("/api/chaos/burst").status_code == 200
    assert client.post("/api/chaos/outlier-spike").status_code == 200
    assert client.post("/api/chaos/step-pass").status_code == 200
    assert client.post("/api/chaos/flush").status_code == 200
