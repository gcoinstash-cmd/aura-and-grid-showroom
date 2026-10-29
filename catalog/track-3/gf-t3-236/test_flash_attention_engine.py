"""
Pytest verification suite for GF-T3-236 FlashAttention Ring-Block Scale & Causal Mask Engine.
Verifies:
1. Numerical equivalence between block-wise online softmax attention and standard O(N^2) attention.
2. Causal mask omission efficiency and upper-triangular tile skipping.
3. Shared memory tile staging and bandwidth saturation under peak context lengths.
4. Zero-Trust GridSync input sanitization and Zero-Dollar Gate enforcement.
"""

import math
import pytest
from engine import (
    SYNTHETIC_CORRIDORS,
    FlashKernelRequest,
    calculate_bandwidth_and_latency,
    compute_blockwise_online_softmax_attention,
    compute_standard_attention,
    execute_flash_engine,
    generate_deterministic_qkv,
    health_check,
    sanitize_gridsync_identifier,
)


def test_numerical_equivalence_online_vs_standard_causal():
    """Verifies online tiled softmax matches materialized O(N^2) softmax within 1e-9."""
    q_mat, k_mat, v_mat = generate_deterministic_qkv(seq_len=32, head_dim=32)
    online_out, blocks, skipped, evaluated = compute_blockwise_online_softmax_attention(
        q_mat, k_mat, v_mat, block_size=8, causal_mask=True
    )
    standard_out = compute_standard_attention(q_mat, k_mat, v_mat, causal_mask=True)

    assert len(online_out) == 32
    assert len(online_out[0]) == 32
    assert len(blocks) == 4
    assert skipped > 0
    assert evaluated > 0

    for i in range(32):
        for d in range(32):
            assert math.isclose(online_out[i][d], standard_out[i][d], abs_tol=1e-9)


def test_numerical_equivalence_online_vs_standard_unmasked():
    """Verifies unmasked dense online softmax matches O(N^2) attention across tiles."""
    q_mat, k_mat, v_mat = generate_deterministic_qkv(seq_len=24, head_dim=16)
    online_out, blocks, skipped, evaluated = compute_blockwise_online_softmax_attention(
        q_mat, k_mat, v_mat, block_size=6, causal_mask=False
    )
    standard_out = compute_standard_attention(q_mat, k_mat, v_mat, causal_mask=False)

    assert skipped == 0
    assert evaluated == 16  # 4 x 4 tiles

    for i in range(24):
        for d in range(16):
            assert math.isclose(online_out[i][d], standard_out[i][d], abs_tol=1e-9)


def test_causal_mask_upper_triangular_omission():
    """Verifies upper-triangular tiles are dynamically skipped during causal execution."""
    q_mat, k_mat, v_mat = generate_deterministic_qkv(seq_len=64, head_dim=64)
    _, blocks, skipped, evaluated = compute_blockwise_online_softmax_attention(
        q_mat, k_mat, v_mat, block_size=8, causal_mask=True
    )
    # For 8x8 tile grid (64 tiles total): lower triangle + diagonal = 8*9/2 = 36 evaluated, 28 skipped
    assert evaluated == 36
    assert skipped == 28
    assert blocks[0].skipped_tiles == 7
    assert blocks[7].skipped_tiles == 0
    assert blocks[3].scale_factor == 0.125


def test_shared_memory_staging_and_bandwidth_saturation():
    """Verifies SRAM tile staging size and 2,100 GB/s peak bandwidth saturation."""
    stats_alpha = calculate_bandwidth_and_latency(
        seq_len=512,
        head_dim=64,
        block_size=16,
        causal_mask=True,
        corridor=SYNTHETIC_CORRIDORS[0],
        context_spill=False,
    )
    assert stats_alpha["bandwidth_gbs"] == 2100.0
    assert stats_alpha["sram_kb"] == 6.0  # 3 * 16 * 64 * 2 bytes = 6144 bytes = 6.0 KB
    assert stats_alpha["latency_us"] <= 0.10

    stats_spill = calculate_bandwidth_and_latency(
        seq_len=512,
        head_dim=64,
        block_size=16,
        causal_mask=True,
        corridor=SYNTHETIC_CORRIDORS[0],
        context_spill=True,
    )
    assert stats_spill["bandwidth_gbs"] < stats_alpha["bandwidth_gbs"]
    assert stats_spill["latency_us"] > stats_alpha["latency_us"]


def test_execute_flash_engine_and_zero_dollar_gate():
    """Verifies end-to-end engine payload, B3 canonical telemetry, and Zero-Dollar Gate."""
    req = FlashKernelRequest(
        corridor=SYNTHETIC_CORRIDORS[0],
        seq_len=64,
        head_dim=64,
        block_size=8,
        causal_mask=True,
        context_spill=False,
    )
    resp = execute_flash_engine(req)
    assert resp.engine_id == "GF-T3-236"
    assert resp.attention_bandwidth_gbs == 2100.0
    assert resp.active_blocks == 16
    assert resp.processed_tokens == 1280000
    assert resp.mask_state == "Causal Active"
    assert resp.max_numerical_drift < 1e-8
    assert len(resp.blocks) == 8
    assert resp.blocks[3].block_id == "B3"
    assert resp.blocks[3].tile_coords == [64, 64]
    assert resp.blocks[3].scale_factor == 0.125

    serialized = resp.model_dump_json()
    assert "\x24" not in serialized


def test_gridsync_security_sanitizer():
    """Verifies Zero-Trust GridSync input scrubbing against SQLi, XSS, and invalid corridors."""
    valid = sanitize_gridsync_identifier(SYNTHETIC_CORRIDORS[1])
    assert valid == SYNTHETIC_CORRIDORS[1]

    with pytest.raises(ValueError):
        sanitize_gridsync_identifier("FLASH-CORRIDOR-ALPHA; DROP TABLE telemetry;--")

    with pytest.raises(ValueError):
        sanitize_gridsync_identifier("<script>alert(1)</script>")

    with pytest.raises(ValueError):
        FlashKernelRequest(corridor="INVALID-PROPRIETARY-CORRIDOR")


def test_health_endpoint():
    """Verifies health check metadata."""
    status = health_check()
    assert status["engine"] == "GF-T3-236"
    assert status["status"] == "LOCKED"
