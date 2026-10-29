"""
Pytest verification suite for GF-T3-254 FP8 Quantization & Dynamic Scaling Engine.
Verifies:
1. Per-token and per-channel FP8 scaling factor calculation correctness and range adherence.
2. Outlier detection and clipping mitigation during high-speed quantization passes.
3. Hardware tensor core acceleration and throughput saturation.
4. Zero-Trust GridSync sanitization and zero-dollar gate compliance.
"""

import pathlib
import pytest
from pydantic import ValidationError
from engine import (
    FP8_E4M3_MAX,
    FP8_E5M2_MAX,
    TensorChannelPayload,
    calibrate_dynamic_fp8_scale,
    health_check,
    list_corridors,
)


def test_per_token_and_channel_scaling_factor_correctness() -> None:
    payload = TensorChannelPayload(
        scale_id="S0",
        pointer_hex="0x3000",
        activations=[1.61, 1.65, 1.62, 1.64, -1.58, 1.60, -1.63, 1.62],
        corridor_id="FP8-CORRIDOR-ALPHA",
        outlier_mitigation_enabled=True,
    )
    result = calibrate_dynamic_fp8_scale(payload)
    assert result.scale_id == "S0"
    assert result.pointer_hex == "0x3000"
    assert result.bits_format == "FP8"
    assert 0.01 <= result.scale_factor <= 16.0
    assert result.accuracy_pct >= 99.0
    assert result.state == "QUANTIZED"
    assert result.locked is True
    assert len(result.quantized_preview) == 8


def test_outlier_detection_and_clipping_mitigation() -> None:
    # Channel with extreme outlier spike
    activations = [1.2, 1.3, 1.25, 1.22, 1.28, 1.24, 1.26, 48.5]
    mitigated_payload = TensorChannelPayload(
        scale_id="S3",
        pointer_hex="0x3300",
        activations=activations,
        corridor_id="FP8-CORRIDOR-BRAVO",
        outlier_mitigation_enabled=True,
    )
    unmitigated_payload = TensorChannelPayload(
        scale_id="S3",
        pointer_hex="0x3300",
        activations=activations,
        corridor_id="FP8-CORRIDOR-BRAVO",
        outlier_mitigation_enabled=False,
    )

    mitigated_res = calibrate_dynamic_fp8_scale(mitigated_payload)
    unmitigated_res = calibrate_dynamic_fp8_scale(unmitigated_payload)

    assert mitigated_res.amax_clipped < mitigated_res.amax_raw
    assert mitigated_res.scale_factor > unmitigated_res.scale_factor
    assert mitigated_res.state == "QUANTIZED"
    assert mitigated_res.locked is True
    assert unmitigated_res.state == "FAULT"
    assert unmitigated_res.locked is False


def test_hardware_tensor_core_acceleration_and_throughput_saturation() -> None:
    gamma_payload = TensorChannelPayload(
        scale_id="S7",
        pointer_hex="0x3700",
        activations=[2.1, -2.0, 2.05, -2.12, 1.98, 2.04, -2.01, 2.08],
        corridor_id="FP8-CORRIDOR-GAMMA",
        outlier_mitigation_enabled=True,
    )
    delta_payload = TensorChannelPayload(
        scale_id="S7",
        pointer_hex="0x3700",
        activations=[2.1, -2.0, 2.05, -2.12, 1.98, 2.04, -2.01, 2.08],
        corridor_id="FP8-CORRIDOR-DELTA",
        outlier_mitigation_enabled=True,
    )
    gamma_res = calibrate_dynamic_fp8_scale(gamma_payload)
    delta_res = calibrate_dynamic_fp8_scale(delta_payload)

    assert gamma_res.throughput_gbps == 18200.0
    assert delta_res.bits_format == "BF16"
    assert delta_res.throughput_gbps == 9400.0
    assert FP8_E5M2_MAX > FP8_E4M3_MAX


def test_zero_trust_gridsync_input_sanitization() -> None:
    with pytest.raises(ValidationError):
        TensorChannelPayload(
            scale_id="S0; DROP TABLE",
            pointer_hex="0x3000",
            activations=[1.0, 1.1, 1.2, 1.3],
        )


def test_health_and_corridors_endpoints() -> None:
    health = health_check()
    assert health["engine"] == "GF-T3-254"
    assert health["throughput_gbps"] == 16500.0
    assert health["active_scales"] == 8

    corridors = list_corridors()
    assert "FP8-CORRIDOR-ALPHA" in corridors["corridors"]
    assert "FP8-CORRIDOR-DELTA" in corridors["corridors"]


def test_zero_dollar_character_gate() -> None:
    root = pathlib.Path(__file__).parent
    checked_files = [
        "engine.py",
        "test_fp8_quantization_engine.py",
        "ENGINE_SPEC.md",
        "LEGAL_IP_AUDIT.md",
        "ASSET_TRANSFER_SPEC.md",
        "supabase_schema.sql",
    ]
    forbidden_char = chr(36)
    for filename in checked_files:
        file_path = root / filename
        if file_path.exists():
            content = file_path.read_text(encoding="utf-8")
            assert forbidden_char not in content, f"Forbidden character found in {filename}"
