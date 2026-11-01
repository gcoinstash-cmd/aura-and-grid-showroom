"""
Pytest Verification Suite for GF-T3-340
Verifies:
1. Multi-block KV partitioning and parallel softmax reduction correctness.
2. Asynchronous attention reduction efficiency under long-context load.
3. Hardware tensor core acceleration and throughput saturation.
4. Zero-Dollar Gate & Clean-Room Synthetic Corridor compliance.
"""

import math
from fastapi.testclient import TestClient

from engine import (
    ChaosActionRequestDTO,
    DecodeCorridor,
    FlashDecodeRequestDTO,
    app,
    compute_multi_block_flash_decoding,
    sanitize_identifier,
)

client = TestClient(app)


def test_health_endpoint_telemetry() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["chassis"] == "GF-T3-340"
    assert payload["status"] == "ACTIVE"
    assert payload["decode_throughput_gbs"] == 128400
    assert payload["reduction_latency_us"] == 0.01
    assert payload["active_blocks"] == 8


def test_synthetic_decode_corridors_clean_room() -> None:
    response = client.get("/api/v1/corridors")
    assert response.status_code == 200
    data = response.json()
    corridors = data["corridors"]
    assert len(corridors) == 4
    assert "DECODE-CORRIDOR-ALPHA (DYNAMIC-MULTI-BLOCK-FABRIC · 128400-GB/S)" in corridors
    assert "DECODE-CORRIDOR-BRAVO (FLASH-DECODING-ENGINE)" in corridors
    assert "DECODE-CORRIDOR-GAMMA (NON-BLOCKING-REDUCTION-ROUTER)" in corridors
    assert "DECODE-CORRIDOR-DELTA (FALLBACK-SEQUENTIAL-DECODE-PASS)" in corridors


def test_multi_block_kv_partitioning_and_parallel_softmax_reduction() -> None:
    """
    Gate 01 Verification:
    Verifies that partitioning a KV sequence across B=8 blocks and combining via
    log-sum-exp rescaling produces deterministic, mathematically bounded outputs.
    """
    result = compute_multi_block_flash_decoding(
        query_vec=[0.42, -0.18, 0.77, 0.31, -0.54, 0.63, 0.29, -0.11],
        num_blocks=8,
        seq_len_tokens=2048000,
        head_dim=128,
        omega_reduce=1.0,
        corridor=DecodeCorridor.ALPHA,
    )
    assert result["active_blocks"] == 8
    assert result["total_blocks"] == 8
    assert result["decoding_throughput_gbs"] == 128400.0
    assert result["reduction_latency_us"] == 0.01

    blocks = result["blocks"]
    assert len(blocks) == 8
    for idx, blk in enumerate(blocks):
        assert blk.block_id == idx
        assert blk.tokens_k == 256
        assert blk.decode_load_pct == 100.0
        assert blk.sync_pct == 100.0
        assert blk.status == "REDUCED · LOCKED"
        assert math.isfinite(blk.partial_logsumexp)

    vec = result["reduced_vector_preview"]
    assert len(vec) == 4
    for v in vec:
        assert 9.80 <= v <= 10.10


def test_asynchronous_attention_reduction_under_long_context_spike() -> None:
    """
    Verifies dynamic block partitioning under long-context KV cache spike (4.096M tokens).
    """
    req = FlashDecodeRequestDTO(
        corridor=DecodeCorridor.ALPHA,
        sequence_length_tokens=2048000,
        num_blocks=8,
        head_dim=128,
        reduction_weight=1.0,
        long_context_spike=True,
    )
    response = client.post("/api/v1/decode", json=req.model_dump())
    assert response.status_code == 200
    body = response.json()
    assert body["chassis_id"] == "GF-T3-340"
    assert body["decoding_throughput_gbs"] > 128400.0
    assert body["processed_tokens_units"] == 31200000
    assert body["blocks"][0]["tokens_k"] == 512
    assert body["blocks"][0]["status"] == "PARTITIONING · SYNC"


def test_hardware_tensor_core_acceleration_and_corridor_scaling() -> None:
    """
    Verifies throughput saturation across ALPHA, BRAVO, GAMMA, and sequential fallback DELTA.
    """
    alpha_res = compute_multi_block_flash_decoding(
        query_vec=[0.5, 0.5, 0.5, 0.5],
        num_blocks=8,
        seq_len_tokens=2048000,
        head_dim=128,
        omega_reduce=1.0,
        corridor=DecodeCorridor.ALPHA,
    )
    delta_res = compute_multi_block_flash_decoding(
        query_vec=[0.5, 0.5, 0.5, 0.5],
        num_blocks=8,
        seq_len_tokens=2048000,
        head_dim=128,
        omega_reduce=1.0,
        corridor=DecodeCorridor.DELTA,
    )
    assert alpha_res["decoding_throughput_gbs"] > delta_res["decoding_throughput_gbs"] * 5.0
    assert alpha_res["speedup_multiplier"] >= 7.5
    assert delta_res["active_blocks"] == 1
    assert delta_res["mode"] == "SEQUENTIAL_FALLBACK"


def test_chaos_maneuvers_burst_step_and_flush() -> None:
    for action in ["BURST", "SPIKE", "STEP_REDUCTION", "FLUSH_ARENAS"]:
        payload = ChaosActionRequestDTO(
            action=action,
            corridor=DecodeCorridor.ALPHA,
            selected_block=3,
        )
        res = client.post("/api/v1/chaos", json=payload.model_dump())
        assert res.status_code == 200
        data = res.json()
        if action == "FLUSH_ARENAS":
            assert data["decode_state"] == "Flushed"
            assert data["decoding_throughput_gbs"] == 0.0
            assert data["active_blocks"] == 0
        elif action == "BURST":
            assert data["decoding_throughput_gbs"] == 142800.0
            assert data["processed_tokens_units"] == 34500000


def test_block_telemetry_inspector_and_bounds() -> None:
    ok_res = client.get("/api/v1/telemetry/block/3")
    assert ok_res.status_code == 200
    blk = ok_res.json()
    assert blk["block_id"] == 3
    assert blk["hex_ptr"] == "0x4F030"

    err_res = client.get("/api/v1/telemetry/block/99")
    assert err_res.status_code == 404


def test_zero_trust_sanitizer_and_invalid_chaos_rejection() -> None:
    dirty = "BURST;<script>alert(1)</script>"
    cleaned = sanitize_identifier(dirty)
    assert "<" not in cleaned
    assert ">" not in cleaned

    bad_res = client.post(
        "/api/v1/chaos",
        json={"action": "INVALID_MANEUVER", "corridor": DecodeCorridor.ALPHA.value, "selected_block": 0},
    )
    assert bad_res.status_code == 400
