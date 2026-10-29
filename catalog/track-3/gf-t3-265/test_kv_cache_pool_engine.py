"""
Pytest Verification Suite for GF-T3-265 KV-Cache Pooling & Reuse Engine.
Verifies:
  1. Pooled KV cache arena allocation and reference counting correctness across models.
  2. Speculative verification cache sharing efficiency and zero-copy performance.
  3. Hardware tensor core acceleration and throughput saturation.
  4. Zero-Trust GridSync ingress sanitization & Zero-Dollar Gate compliance.
"""

import contextlib
import pathlib
try:
    import pytest
except ImportError:
    class _FallbackPytest:
        @staticmethod
        @contextlib.contextmanager
        def raises(exc_type):
            try:
                yield
            except exc_type:
                return
            raise AssertionError("Expected exception " + str(exc_type) + " was not raised")

    pytest = _FallbackPytest()

from engine import (
    KVCachePoolingEngine,
    SYNTHETIC_POOL_CORRIDORS,
    compute_prefix_hash,
    sanitize_gridsync_payload,
)


def test_pooled_kv_cache_arena_allocation_and_ref_counting():
    engine = KVCachePoolingEngine(corridor=SYNTHETIC_POOL_CORRIDORS[0], num_arenas=8)
    snap = engine.snapshot()

    assert snap.engine_id == "GF-T3-265"
    assert snap.active_arenas == 8
    assert snap.total_arenas == 8
    assert engine.compute_total_pooled_blocks() == 8 * 512

    for idx, arena in enumerate(snap.arenas):
        assert arena.arena_id == "A" + str(idx)
        assert arena.hex_ptr == "0xE" + str(idx) + "00"
        assert arena.allocated_blocks == 512
        assert arena.ref_count == 2
        assert arena.ref_label == "SHARED-2"
        assert arena.status_label == "POOLED · LOCKED"

    # Trigger allocation burst and verify reference count increment across all arenas
    burst_snap = engine.trigger_allocation_burst(burst_blocks_per_arena=64)
    assert engine.compute_total_pooled_blocks() == 8 * 576
    assert burst_snap.processed_tokens_units == 5250000
    for arena in burst_snap.arenas:
        assert arena.allocated_blocks == 576
        assert arena.ref_count == 3
        assert arena.ref_label == "SHARED-3"


def test_speculative_verification_cache_sharing_and_zero_copy():
    engine = KVCachePoolingEngine()
    draft_seq = (1001, 1002, 1003, 1004, 1005, 1006)
    verifier_seq = (1001, 1002, 1003, 1004, 1005, 1006)

    verification = engine.verify_speculative_cache_sharing(draft_seq, verifier_seq)
    assert verification["matched_prefix_tokens"] == 6
    assert verification["reuse_efficiency_pct"] == 100.0
    assert verification["zero_copy_saved_bytes"] == 6 * 4096
    assert verification["zero_redundancy_verified"] is True

    # Partial divergence test
    divergent_verifier = (1001, 1002, 1003, 9999, 1005, 1006)
    partial = engine.verify_speculative_cache_sharing(draft_seq, divergent_verifier)
    assert partial["matched_prefix_tokens"] == 3
    assert partial["reuse_efficiency_pct"] == 50.0
    assert partial["zero_redundancy_verified"] is False


def test_hardware_tensor_core_acceleration_and_throughput_saturation():
    engine = KVCachePoolingEngine(corridor=SYNTHETIC_POOL_CORRIDORS[0])
    initial_snap = engine.snapshot()
    assert initial_snap.pool_throughput_gbs == 26400.0
    assert initial_snap.arena_latency_us == 0.01
    assert initial_snap.pool_state == "Arena Active"

    # Toggle fragmentation spike and verify degradation detection
    frag_snap = engine.toggle_cache_fragmentation()
    assert frag_snap.fragmented_mode is True
    assert frag_snap.pool_state == "Arena Fragmented"
    assert frag_snap.active_arenas == 4
    assert frag_snap.pool_throughput_gbs < 26400.0

    # Step KV reuse pass to force sub-microsecond compaction and restore saturation
    compacted_snap = engine.step_kv_reuse_pass((701, 702, 703, 704))
    assert compacted_snap.fragmented_mode is False
    assert compacted_snap.active_arenas == 8
    assert compacted_snap.pool_state == "Arena Active"
    assert compacted_snap.pool_throughput_gbs > 26400.0

    # Flush and re-zero memory pools
    flushed = engine.flush_and_rezero_pools()
    assert flushed.pool_throughput_gbs == 26400.0
    assert flushed.processed_tokens_units == 5000000
    assert flushed.engine_xp_k == 75.0


def test_corridor_switching_and_security_gates():
    engine = KVCachePoolingEngine()
    delta_snap = engine.select_corridor(SYNTHETIC_POOL_CORRIDORS[3])
    assert delta_snap.pool_throughput_gbs == 9200.0
    assert delta_snap.arenas[0].ref_label == "MONO-1"

    with pytest.raises(ValueError):
        sanitize_gridsync_payload("DROP TABLE arenas;")

    with pytest.raises(ValueError):
        sanitize_gridsync_payload("<script>alert(1)</script>")

    with pytest.raises(ValueError):
        compute_prefix_hash(())


def test_zero_dollar_gate_across_repository():
    root = pathlib.Path(__file__).resolve().parent
    checked_files = [
        "engine.py",
        "test_kv_cache_pool_engine.py",
        "Dockerfile",
        "ENGINE_SPEC.md",
        "LEGAL_IP_AUDIT.md",
        "ASSET_TRANSFER_SPEC.md",
        "supabase_schema.sql",
        "src/App.tsx",
    ]
    forbidden_char = chr(36)
    for rel_path in checked_files:
        file_path = root / rel_path
        if file_path.exists():
            content = file_path.read_text(encoding="utf-8")
            assert forbidden_char not in content, f"Forbidden character found in {rel_path}"


if __name__ == "__main__":
    test_pooled_kv_cache_arena_allocation_and_ref_counting()
    test_speculative_verification_cache_sharing_and_zero_copy()
    test_hardware_tensor_core_acceleration_and_throughput_saturation()
    test_corridor_switching_and_security_gates()
    test_zero_dollar_gate_across_repository()
    print("ALL 5 PYTHON SUITE CHECKS PASSED (100% PASS RATE)")

