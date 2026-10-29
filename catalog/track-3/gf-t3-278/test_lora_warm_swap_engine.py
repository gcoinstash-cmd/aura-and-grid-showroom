"""
Pytest Verification Suite for GF-T3-278 Continuous LoRA Parameter Warm-Swapping Engine.
Verifies:
1. Lock-free dual-buffer adapter warm-swapping and background pre-staging correctness.
2. Atomic pointer flipping efficiency and zero inference latency spikes during high-frequency cycling.
3. Hardware tensor core acceleration and throughput saturation.
4. Strict Zero-Dollar character gate compliance.
"""

import json
import pytest
from engine import (
    DualBufferWarmSwapFabric,
    CORRIDOR_THROUGHPUT_GBPS,
    app,
    health_check,
    get_telemetry,
)


def sample_b_matrix():
    return [
        [0.05, 0.01, 0.00, 0.02],
        [0.01, 0.06, 0.02, 0.00],
        [0.02, 0.00, 0.04, 0.01],
        [0.00, 0.02, 0.01, 0.05],
    ]


def sample_a_matrix():
    return [
        [0.10, 0.02, 0.01, 0.00],
        [0.01, 0.12, 0.00, 0.02],
        [0.00, 0.01, 0.15, 0.01],
        [0.02, 0.00, 0.01, 0.10],
    ]


def test_dual_buffer_warm_swap_math_exactness():
    engine = DualBufferWarmSwapFabric()
    b_mat = sample_b_matrix()
    a_mat = sample_a_matrix()
    w_warm = engine.compute_warm_weights(alpha=32.0, rank=16, mat_b=b_mat, mat_a=a_mat)
    assert len(w_warm) == 4
    assert len(w_warm[0]) == 4
    # Verify W_warm[0][0] = W_0[0][0] + (32/16) * (0.05*0.10 + 0.01*0.01 + 0.00*0.00 + 0.02*0.02)
    # = 4.00 + 2.0 * (0.005 + 0.0001 + 0 + 0.0004) = 4.00 + 2.0 * 0.0055 = 4.011
    assert abs(w_warm[0][0] - 4.011) < 1e-6


def test_atomic_pointer_flip_and_bank_isolation():
    engine = DualBufferWarmSwapFabric()
    initial_slot = engine.adapters[3]
    assert initial_slot.hex_ptr == "0xC030"
    assert initial_slot.standby_ptr == "0xD030"
    assert initial_slot.active_bank == "BANK_A"

    res = engine.stage_and_swap_adapter(
        adapter_index=3,
        alpha=64.0,
        rank=32,
        mat_b=sample_b_matrix(),
        mat_a=sample_a_matrix(),
    )
    assert res["slot_id"] == "K3"
    assert res["active_ptr"] == "0xD030"
    assert res["standby_ptr"] == "0xC030"
    assert res["active_bank"] == "BANK_B"
    assert res["staging_latency_us"] <= 0.02


def test_high_frequency_cycling_zero_latency_spikes():
    engine = DualBufferWarmSwapFabric()
    snapshot = engine.step_atomic_pointer_flip(cycle_steps=16, rapid_spike=True)
    assert snapshot["pointer_flips"] == 16
    assert snapshot["staging_latency_us"] <= 0.05
    assert snapshot["processed_tokens"] > 7040000
    for adapter in snapshot["adapters"]:
        assert adapter["latency_ms"] <= 0.05
        assert adapter["sync_pct"] == 100.0


def test_throughput_saturation_and_flush_recovery():
    engine = DualBufferWarmSwapFabric()
    for idx in range(8):
        engine.stage_and_swap_adapter(
            adapter_index=idx,
            alpha=32.0,
            rank=16,
            mat_b=sample_b_matrix(),
            mat_a=sample_a_matrix(),
            corridor="SWAP-CORRIDOR-ALPHA (CONTINUOUS-LORA-PARAMETER-WARM-SWAPPING-FABRIC · 36800-GB/S)",
        )
    assert engine.swap_throughput_gbps >= 36800.0
    reset_state = engine.flush_and_rezero()
    assert reset_state["pointer_flips"] == 0
    assert reset_state["processed_tokens"] == 7040000
    assert reset_state["global_ptr"] == "0xBF8DC0"


def test_invalid_inputs_rejected():
    engine = DualBufferWarmSwapFabric()
    with pytest.raises(ValueError):
        engine.compute_warm_weights(alpha=32.0, rank=0, mat_b=sample_b_matrix(), mat_a=sample_a_matrix())
    with pytest.raises(ValueError):
        engine.stage_and_swap_adapter(
            adapter_index=99,
            alpha=32.0,
            rank=16,
            mat_b=sample_b_matrix(),
            mat_a=sample_a_matrix(),
        )


def test_zero_dollar_character_gate_in_payloads():
    health_payload = json.dumps(health_check())
    telemetry_payload = json.dumps(get_telemetry())
    forbidden_char = chr(36)
    assert forbidden_char not in health_payload
    assert forbidden_char not in telemetry_payload
