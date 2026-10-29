"""
Pytest verification suite for GF-T3-238 Pipeline Parallelism 1F1B & Activation Checkpointing Engine.
Verifies:
1. Gradient correctness and loss parity between non-pipelined reference and interleaved 1F1B execution.
2. Activation memory savings under checkpointing recomputation.
3. Pipeline bubble reduction efficiency and micro-batch dispatch throughput.
4. GridSync zero-trust input sanitization and state machine transitions.
"""

try:
    import pytest
except ImportError:
    pytest = None

from engine import (
    SYNTHETIC_CORRIDORS,
    PipelineParallelEngine,
    compute_activation_checkpoint_memory,
    compute_bubble_metrics,
    generate_1f1b_interleaved_schedule,
    sanitize_payload_string,
    verify_1f1b_gradient_and_loss_parity,
)


def _assert_raises_value_error(fn, *args) -> None:
    try:
        fn(*args)
    except ValueError:
        return
    raise AssertionError("Expected ValueError was not raised")


def test_gradient_and_loss_parity_1f1b_vs_reference() -> None:
    result = verify_1f1b_gradient_and_loss_parity(num_stages=8, num_micro_batches=16)
    assert result["parity_verified"] is True
    assert result["loss_abs_delta"] < 1e-12
    assert result["max_gradient_abs_delta"] < 1e-12
    assert len(result["reference_gradients"]) == 8
    assert len(result["pipelined_1f1b_gradients"]) == 8
    assert result["recomputed_tensors_count"] == 8 * 16


def test_custom_weights_gradient_parity() -> None:
    weights = [0.5, -0.3, 1.1, 0.7]
    inputs = [0.2, -0.4, 0.8, 1.0, 0.5, -0.1, 0.3, 0.9]
    targets = [0.1, 0.2, 0.4, 0.5, 0.3, -0.2, 0.6, 0.7]
    result = verify_1f1b_gradient_and_loss_parity(
        num_stages=4,
        num_micro_batches=8,
        stage_weights=weights,
        micro_batch_inputs=inputs,
        micro_batch_targets=targets,
    )
    assert result["parity_verified"] is True
    for ref_g, pipe_g in zip(result["reference_gradients"], result["pipelined_1f1b_gradients"]):
        assert abs(ref_g - pipe_g) < 1e-8


def test_activation_checkpointing_memory_savings() -> None:
    ckpt_on = compute_activation_checkpoint_memory(
        num_stages=8,
        layers_per_stage=12,
        num_micro_batches=16,
        hidden_dim=4096,
        seq_len=2048,
        checkpointing_enabled=True,
    )
    ckpt_off = compute_activation_checkpoint_memory(
        num_stages=8,
        layers_per_stage=12,
        num_micro_batches=16,
        hidden_dim=4096,
        seq_len=2048,
        checkpointing_enabled=False,
    )
    assert ckpt_on["active_stage_mb"] < ckpt_off["active_stage_mb"]
    assert ckpt_on["memory_savings_pct"] > 90.0
    assert ckpt_off["memory_savings_pct"] == 0.0
    assert ckpt_on["total_cluster_active_mb"] < ckpt_on["total_cluster_uncheckpointed_mb"]


def test_pipeline_bubble_reduction_efficiency() -> None:
    interleaved = compute_bubble_metrics(
        num_stages=8,
        num_micro_batches=16,
        virtual_chunks=6,
        interleaved=True,
    )
    standard = compute_bubble_metrics(
        num_stages=8,
        num_micro_batches=16,
        virtual_chunks=6,
        interleaved=False,
    )
    assert interleaved["interleaved_bubble_pct"] < standard["interleaved_bubble_pct"]
    assert interleaved["bubble_reduction_pct"] > 70.0
    assert interleaved["throughput_tflops"] >= 4200.0
    assert interleaved["pipeline_utilization_pct"] > 90.0


def test_1f1b_schedule_completeness() -> None:
    slots = generate_1f1b_interleaved_schedule(
        num_stages=8,
        num_micro_batches=16,
        virtual_chunks=2,
        checkpointing_enabled=True,
    )
    assert len(slots) == 8 * 16 * 2 * 2
    forward_slots = [s for s in slots if s.phase == "FORWARD"]
    backward_slots = [s for s in slots if s.phase == "BACKWARD"]
    assert len(forward_slots) == 256
    assert len(backward_slots) == 256
    assert all(s.recomputed is True for s in backward_slots)


def test_stateful_engine_lifecycle_and_chaos_controls() -> None:
    eng = PipelineParallelEngine()
    snap0 = eng.get_snapshot()
    assert snap0["engine_id"] == "GF-T3-238"
    assert snap0["processed_tokens"] == 1536000
    assert len(snap0["stages"]) == 8
    assert snap0["stages"][0]["checkpoint_ptr"] == "0x5000"
    assert snap0["stages"][3]["checkpoint_ptr"] == "0x5800"

    snap_burst = eng.trigger_pipeline_burst()
    assert snap_burst["processed_tokens"] == 1536000 + 384000
    assert snap_burst["pipe_xp"] > 26.4

    snap_stall = eng.toggle_bubble_stall()
    assert snap_stall["bubble_stall_active"] is True
    assert snap_stall["stages"][2]["status"] == "FAULT"

    snap_step = eng.step_virtual_stage()
    assert snap_step["step_counter"] == 9

    snap_flush = eng.flush_queues_and_rezero()
    assert snap_flush["processed_tokens"] == 1536000
    assert snap_flush["bubble_stall_active"] is False


def test_gridsync_zero_trust_sanitization() -> None:
    assert sanitize_payload_string("STEP") == "STEP"
    assert len(SYNTHETIC_CORRIDORS) == 4
    _assert_raises_value_error(sanitize_payload_string, "DROP TABLE stages;--")
    _assert_raises_value_error(sanitize_payload_string, "<script>alert(1)</script>")
    _assert_raises_value_error(sanitize_payload_string, "100" + chr(36))


if __name__ == "__main__":
    suite = [
        test_gradient_and_loss_parity_1f1b_vs_reference,
        test_custom_weights_gradient_parity,
        test_activation_checkpointing_memory_savings,
        test_pipeline_bubble_reduction_efficiency,
        test_1f1b_schedule_completeness,
        test_stateful_engine_lifecycle_and_chaos_controls,
        test_gridsync_zero_trust_sanitization,
    ]
    for test_fn in suite:
        test_fn()
    print("ALL 7 PYTHON ENGINE VERIFICATION TESTS PASSED (100% PASS RATE)")
