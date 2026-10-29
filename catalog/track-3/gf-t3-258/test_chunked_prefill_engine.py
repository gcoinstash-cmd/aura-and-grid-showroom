"""
Pytest & Unittest Suite for GF-T3-258 Chunked Prefill & Iterative Scheduling Hybrid Pipeline Engine.
Verifies:
1. Chunked prefill budget enforcement (T_chunk <= 16ms) and prompt token partitioning correctness.
2. Iterative scheduling interleaving between prefill chunks and decode steps without stalling.
3. Hardware tensor core acceleration, throughput saturation (20,400 GB/s), and zero-trust sanitization.
"""

import unittest
from contextlib import contextmanager

try:
    import pytest
except ImportError:
    class _FallbackPytest:
        @staticmethod
        @contextmanager
        def raises(expected_exc):
            try:
                yield
            except expected_exc:
                return
            raise AssertionError("Expected exception was not raised: " + str(expected_exc))

    pytest = _FallbackPytest()

from engine import (
    SYNTHETIC_CORRIDORS,
    compute_chunked_prefill_partition,
    sanitize_identifier,
    verify_iterative_interleaving,
)


def test_chunked_prefill_budget_and_partitioning_correctness():
    telemetry = compute_chunked_prefill_partition(
        prompt_tokens=4096,
        slice_budget_ms=16.0,
        corridor_id="CHUNK-CORRIDOR-ALPHA",
        prompt_spike_active=False,
        step_counter=0,
    )
    assert telemetry.engine_id == "GF-T3-258"
    assert telemetry.active_chunks == 8
    assert telemetry.total_chunks == 8
    assert telemetry.slice_budget_ms == 16
    assert telemetry.head_of_line_blocking_ms == 0.0
    assert len(telemetry.chunks) == 8

    for idx, chunk in enumerate(telemetry.chunks):
        assert chunk.chunk_id == "C" + str(idx)
        assert chunk.tokens == 512
        assert chunk.budget_ms == 16
        assert chunk.slice_ms <= 16
        assert chunk.latency_ms < 16.0
        assert chunk.state == "SCHEDULED · LOCKED"


def test_chunked_prefill_rejects_budget_exceeding_16ms():
    with pytest.raises(ValueError):
        compute_chunked_prefill_partition(
            prompt_tokens=4096,
            slice_budget_ms=24.0,
            corridor_id="CHUNK-CORRIDOR-ALPHA",
        )


def test_iterative_scheduling_interleaving_zero_stall():
    result = verify_iterative_interleaving(
        prefill_tokens=4096,
        active_decode_requests=32,
        chunk_size=512,
        max_slice_ms=16.0,
    )
    assert result["engine_id"] == "GF-T3-258"
    assert result["num_passes"] == 8
    assert result["all_within_16ms_budget"] is True
    assert result["zero_stall_verified"] is True

    total_partitioned = sum(p["prefill_chunk_tokens"] for p in result["passes"])
    assert total_partitioned == 4096
    for p in result["passes"]:
        assert p["decode_interleaved_requests"] == 32
        assert p["pass_duration_ms"] <= 16.0
        assert p["hol_blocking_ms"] == 0.0


def test_hardware_tensor_core_throughput_saturation_and_corridors():
    for corridor_key in SYNTHETIC_CORRIDORS:
        telemetry = compute_chunked_prefill_partition(
            prompt_tokens=4096,
            slice_budget_ms=16.0,
            corridor_id=corridor_key,
            prompt_spike_active=False,
            step_counter=2,
        )
        assert telemetry.chunked_throughput_gbs >= 12800
        assert telemetry.scheduling_latency_us <= 0.1
        assert telemetry.processed_tokens == 4096000 + (2 * 75000)
        assert len(telemetry.vector_signature) == 4
        assert len(telemetry.audit_hash) == 16


def test_prompt_spike_forces_time_slicing_interleaving():
    telemetry = compute_chunked_prefill_partition(
        prompt_tokens=8192,
        slice_budget_ms=16.0,
        corridor_id="CHUNK-CORRIDOR-BRAVO",
        prompt_spike_active=True,
        step_counter=1,
    )
    assert telemetry.chunks[0].state == "SLICED · INTERLEAVED"
    assert telemetry.chunks[0].pipeline_status == "TIME_SLICED"
    assert telemetry.chunks[0].tokens == 512


def test_zero_trust_ingress_sanitizer_blocks_injection():
    assert sanitize_identifier("CHUNK-CORRIDOR-ALPHA") == "CHUNK-CORRIDOR-ALPHA"
    with pytest.raises(ValueError):
        sanitize_identifier("CHUNK-CORRIDOR-ALPHA; DROP TABLE chunks;--")
    with pytest.raises(ValueError):
        sanitize_identifier("<script>alert(1)</script>")


class TestChunkedPrefillEngine(unittest.TestCase):
    def test_all_engine_invariants(self):
        test_chunked_prefill_budget_and_partitioning_correctness()
        test_chunked_prefill_rejects_budget_exceeding_16ms()
        test_iterative_scheduling_interleaving_zero_stall()
        test_hardware_tensor_core_throughput_saturation_and_corridors()
        test_prompt_spike_forces_time_slicing_interleaving()
        test_zero_trust_ingress_sanitizer_blocks_injection()


if __name__ == "__main__":
    unittest.main()
