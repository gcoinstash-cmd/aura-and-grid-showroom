"""
Pytest Verification Suite for GF-T3-270 Ring Attention & Hierarchical KV-Cache Compression Engine
Verifies:
1. Ring attention block partitioning and cyclic peer-to-peer token passing correctness.
2. Hierarchical KV-cache quantization and context scaling efficiency under massive loads.
3. Hardware tensor core acceleration and throughput saturation.
"""

import math
import pytest
from engine import (
    KVCompressionRequest,
    RingPartitionRequest,
    ThroughputValidationRequest,
    api_kv_compress,
    api_ring_partition,
    api_validate_throughput,
    compute_ring_attention,
    health_check,
    simulate_kv_compression,
    validate_throughput_saturation,
)


def reference_full_attention(
    query: list[list[float]],
    keys: list[list[float]],
    values: list[list[float]],
    head_dim: int,
) -> list[list[float]]:
    scale = 1.0 / math.sqrt(float(head_dim))
    val_dim = len(values[0])
    out: list[list[float]] = []
    for q_vec in query:
        logits = [
            sum(q_vec[d] * k_vec[d] for d in range(len(q_vec))) * scale for k_vec in keys
        ]
        m = max(logits)
        exps = [math.exp(x - m) for x in logits]
        denom = sum(exps)
        row = [0.0] * val_dim
        for idx, w in enumerate(exps):
            for d in range(val_dim):
                row[d] += (w / denom) * values[idx][d]
        out.append([round(x, 6) for x in row])
    return out


def test_ring_attention_partition_matches_exact_softmax() -> None:
    query_block = [[1.0, 0.5, -0.25, 0.75], [0.2, -0.4, 0.8, 0.1]]
    key_blocks = [
        [[0.5, 0.2, -0.1, 0.4], [0.1, 0.9, 0.3, -0.2]],
        [[-0.3, 0.6, 0.5, 0.2], [0.8, -0.1, 0.4, 0.7]],
        [[0.2, 0.3, 0.9, -0.5], [-0.4, 0.2, 0.1, 0.6]],
        [[0.7, -0.2, 0.3, 0.1], [0.0, 0.5, -0.3, 0.8]],
    ]
    value_blocks = [
        [[1.0, 2.0], [3.0, 4.0]],
        [[0.5, 1.5], [2.5, 3.5]],
        [[-1.0, 0.0], [1.0, 2.0]],
        [[2.0, -0.5], [0.5, 1.0]],
    ]

    ring_res = compute_ring_attention(
        query_block=query_block,
        key_blocks=key_blocks,
        value_blocks=value_blocks,
        head_dim=4,
        step_offset=0,
    )

    flat_keys = [k for blk in key_blocks for k in blk]
    flat_values = [v for blk in value_blocks for v in blk]
    exact_res = reference_full_attention(query_block, flat_keys, flat_values, head_dim=4)

    assert ring_res.engine_id == "GF-T3-270"
    assert ring_res.window_count == 4
    assert ring_res.ring_state == "Attention Active"
    for r_idx in range(len(exact_res)):
        for c_idx in range(len(exact_res[0])):
            assert math.isclose(
                ring_res.output_matrix[r_idx][c_idx],
                exact_res[r_idx][c_idx],
                abs_tol=1e-5,
            )


def test_cyclic_peer_to_peer_step_invariance() -> None:
    query_block = [[0.6, -0.1, 0.4, 0.9]]
    key_blocks = [
        [[0.2, 0.4, 0.1, -0.3]],
        [[0.7, -0.5, 0.2, 0.8]],
        [[-0.1, 0.3, 0.6, 0.2]],
        [[0.4, 0.4, -0.2, 0.5]],
    ]
    value_blocks = [
        [[1.2, 0.8]],
        [[2.4, -0.4]],
        [[0.6, 1.9]],
        [[3.1, 0.2]],
    ]

    res_step_0 = compute_ring_attention(query_block, key_blocks, value_blocks, 4, step_offset=0)
    res_step_2 = compute_ring_attention(query_block, key_blocks, value_blocks, 4, step_offset=2)

    assert res_step_0.output_matrix == res_step_2.output_matrix
    assert res_step_0.block_lse == res_step_2.block_lse
    assert res_step_2.peer_topology[0] == "W2->W3"


def test_hierarchical_kv_cache_compression_scaling() -> None:
    req_int4 = KVCompressionRequest(
        total_tokens=6000000,
        num_layers=80,
        num_kv_heads=8,
        head_dim=128,
        target_quant="INT-4",
        heavy_hitter_ratio=0.25,
        sink_tokens=512,
    )
    res_int4 = simulate_kv_compression(req_int4)

    req_int8 = KVCompressionRequest(
        total_tokens=6000000,
        num_layers=80,
        num_kv_heads=8,
        head_dim=128,
        target_quant="INT-8",
        heavy_hitter_ratio=0.50,
        sink_tokens=512,
    )
    res_int8 = simulate_kv_compression(req_int8)

    assert res_int4.uncompressed_gb > res_int4.compressed_gb
    assert res_int4.compression_ratio > 10.0
    assert res_int4.compressed_gb < res_int8.compressed_gb
    assert res_int4.retained_tokens + res_int4.pruned_tokens == 6000000
    assert res_int4.parity_percent >= 95.0


def test_hardware_tensor_core_throughput_saturation() -> None:
    base_req = ThroughputValidationRequest(
        corridor_label="RING-CORRIDOR-ALPHA (ULTRA-WIDE-CONTEXT-RING-ATTENTION-FABRIC · 30400-GB/S)",
        active_windows=8,
        burst_active=False,
        spike_active=False,
        cyclic_step=0,
    )
    base_res = validate_throughput_saturation(base_req)
    assert base_res.project_id == "GF-T3-270"
    assert base_res.attention_throughput_gbs == 30400.0
    assert base_res.ring_latency_us == 0.01
    assert len(base_res.windows) == 8
    assert base_res.windows[3].hex_ptr == "0x4030"

    burst_req = ThroughputValidationRequest(
        corridor_label="RING-CORRIDOR-ALPHA (ULTRA-WIDE-CONTEXT-RING-ATTENTION-FABRIC · 30400-GB/S)",
        active_windows=8,
        burst_active=True,
        spike_active=True,
        cyclic_step=2,
    )
    burst_res = validate_throughput_saturation(burst_req)
    assert burst_res.processed_tokens_units > base_res.processed_tokens_units
    assert burst_res.ring_state == "KV Spike Mitigation"
    assert burst_res.windows[2].state_label == "FAULT · KV-SPIKE"


def test_api_endpoints_and_error_handling() -> None:
    health = health_check()
    assert health["project"] == "GF-T3-270"
    assert health["attention_throughput"] == "30,400 GB/s"

    kv_res = api_kv_compress(KVCompressionRequest())
    assert kv_res.quant_mode == "INT-4"

    tp_res = api_validate_throughput(ThroughputValidationRequest())
    assert tp_res.active_windows == 8

    part_res = api_ring_partition(
        RingPartitionRequest(
            query_block=[[1.0, 0.0]],
            key_blocks=[[[1.0, 0.0]]],
            value_blocks=[[[5.0, 2.0]]],
            head_dim=2,
        )
    )
    assert part_res.output_matrix == [[5.0, 2.0]]

    with pytest.raises(Exception):
        compute_ring_attention(
            query_block=[[1.0, 0.0]],
            key_blocks=[[[1.0, 0.0]]],
            value_blocks=[[[1.0, 0.0]], [[2.0, 0.0]]],
            head_dim=2,
        )
