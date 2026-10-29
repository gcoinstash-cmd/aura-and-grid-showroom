"""
Pytest Verification Suite for GF-T3-253
Verifies:
1. Virtual-to-physical block table translation correctness and reference counting accuracy.
2. Continuous in-flight batching sequence insertion and retirement without starvation.
3. Zero memory fragmentation ratio enforcement and bandwidth saturation.
4. GridSync zero-trust input sanitization and zero-currency glyph enforcement.
"""

import json
import pytest
from engine import (
    PagedAttentionFabricEngine,
    SYNTHETIC_CORRIDORS,
    scrub_zero_trust_input,
)


def test_initial_engine_state_and_zero_fragmentation() -> None:
    engine = PagedAttentionFabricEngine()
    snap = engine.get_telemetry_snapshot()

    assert snap["project_id"] == "GF-T3-253"
    assert snap["batch_throughput_gbs"] == 15200.0
    assert snap["cache_latency_us"] == 0.01
    assert snap["fragmentation_pct"] == 0.0
    assert snap["active_blocks"] == 8
    assert snap["total_blocks"] == 8
    assert snap["processed_tokens"] == 3456000
    assert snap["batch_state"] == "PagedActive"
    assert len(snap["blocks"]) == 8


def test_virtual_to_physical_block_translation_and_ref_counts() -> None:
    engine = PagedAttentionFabricEngine()
    mapping = engine.translate_virtual_to_physical("SEQ-ALPHA-101", 2)

    assert mapping["sequence_id"] == "SEQ-ALPHA-101"
    assert mapping["virtual_block_idx"] == 2
    assert mapping["physical_block_id"] == "B2"
    assert mapping["physical_block_index"] == 2
    assert mapping["hex_ptr"] == "0x2200"
    assert mapping["ref_count"] == 4
    assert mapping["allocated_tokens"] == 16

    mapping_bravo = engine.translate_virtual_to_physical("SEQ-BRAVO-102", 1)
    assert mapping_bravo["physical_block_id"] == "B4"
    assert mapping_bravo["hex_ptr"] == "0x2400"


def test_continuous_in_flight_batching_insertion_and_retirement() -> None:
    engine = PagedAttentionFabricEngine()
    # SEQ-GAMMA-103 starts with prompt=16, generated=16, max=48 -> retires on step
    snap1 = engine.step_paged_attention_pass()
    assert snap1["retired_sequences_in_step"] >= 1
    assert len(snap1["in_flight_sequences"]) >= 3
    assert snap1["processed_tokens"] == 3520000
    assert snap1["fragmentation_pct"] == 0.0

    # Step again to retire remaining initial sequences and confirm zero starvation
    snap2 = engine.step_paged_attention_pass()
    assert len(snap2["in_flight_sequences"]) >= 3
    for seq in snap2["in_flight_sequences"]:
        assert seq["status"] == "IN_FLIGHT"


def test_paged_batch_burst_and_reference_scaling() -> None:
    engine = PagedAttentionFabricEngine()
    snap = engine.trigger_paged_batch_burst(4)

    assert snap["processed_tokens"] > 3456000
    assert snap["engine_xp"] == 85000
    for blk in snap["blocks"]:
        assert blk["ref_count"] == 5
        assert blk["state"] == "ALLOCATED"
        assert blk["locked"] is True


def test_fragmentation_spike_and_defrag_recovery() -> None:
    engine = PagedAttentionFabricEngine()
    spiked = engine.toggle_fragmentation_spike()

    assert spiked["fragmentation_pct"] > 0.0
    assert spiked["batch_state"] == "FragAlert"
    assert spiked["batch_throughput_gbs"] < 15200.0

    # Stepping the PagedAttention pass automatically defrags and locks blocks
    recovered = engine.step_paged_attention_pass()
    assert recovered["fragmentation_pct"] == 0.0
    assert recovered["batch_state"] == "PagedActive"
    assert recovered["batch_throughput_gbs"] == 15200.0


def test_synthetic_corridor_switching_and_fallback_delta() -> None:
    engine = PagedAttentionFabricEngine()
    for corridor_key in SYNTHETIC_CORRIDORS:
        snap = engine.set_corridor(corridor_key)
        assert snap["corridor"] == corridor_key

    delta_snap = engine.set_corridor(
        "PAGED-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-KV-CACHE)"
    )
    assert delta_snap["fragmentation_pct"] > 0.0
    assert delta_snap["cache_latency_us"] == 0.42

    alpha_snap = engine.set_corridor(
        "PAGED-CORRIDOR-ALPHA (CONTINUOUS-IN-FLIGHT-BATCHING-FABRIC · 15200-GB/S)"
    )
    assert alpha_snap["fragmentation_pct"] == 0.0
    assert alpha_snap["batch_throughput_gbs"] == 15200.0


def test_flush_kv_cache_restores_baseline() -> None:
    engine = PagedAttentionFabricEngine()
    engine.trigger_paged_batch_burst(8)
    engine.toggle_fragmentation_spike()
    flushed = engine.flush_kv_cache_buffers()

    assert flushed["processed_tokens"] == 3456000
    assert flushed["engine_xp"] == 75000
    assert flushed["fragmentation_pct"] == 0.0
    assert flushed["batch_state"] == "PagedActive"


def test_zero_trust_sanitizer_and_zero_currency_gate() -> None:
    engine = PagedAttentionFabricEngine()
    raw_json = json.dumps(engine.get_telemetry_snapshot())
    assert chr(36) not in raw_json

    with pytest.raises(ValueError):
        scrub_zero_trust_input("DROP TABLE kv_blocks;--")

    with pytest.raises(ValueError):
        scrub_zero_trust_input("<script>alert(1)</script>")

    with pytest.raises(ValueError):
        scrub_zero_trust_input("vllm_proprietary_hook")

    with pytest.raises(ValueError):
        scrub_zero_trust_input("cost_in_" + chr(36) + "_units")
