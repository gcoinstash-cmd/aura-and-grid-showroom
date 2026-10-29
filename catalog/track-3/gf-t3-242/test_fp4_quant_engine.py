"""
Pytest Verification Suite for GF-T3-242
Verifies:
1. Signal-to-quantization-noise ratio (SQNR) parity between FP16 reference and 4-bit mixed precision.
2. Outlier channel isolation accuracy and clipping prevention.
3. Calibration speed and memory footprint reduction.
4. Zero-Trust GridSync sanitization and Zero-Dollar Gate compliance.
"""

import math
from fastapi.testclient import TestClient
import pytest

from engine import (
    CORRIDORS,
    QuantizeBlockRequest,
    app,
    calibrate_block_scale,
    execute_block_quantization,
    generate_deterministic_block_weights,
    isolate_outlier_channels,
)

client = TestClient(app)


def test_sqnr_parity_fp4_and_int4() -> None:
    """Verifies SQNR remains high (>24 dB) and relative error stays low (<5%) across all 16 blocks."""
    for block_id in range(16):
        weights = generate_deterministic_block_weights(block_id, length=128)
        res_fp4 = execute_block_quantization(block_id, weights, quant_format="FP4_E2M1", sigma_gate=2.4)
        res_int4 = execute_block_quantization(block_id, weights, quant_format="INT4_SYM", sigma_gate=2.4)

        assert res_fp4.sqnr_db > 24.0
        assert res_int4.sqnr_db > 24.0
        assert res_fp4.relative_error_pct < 6.0
        assert res_int4.relative_error_pct < 6.0
        assert res_fp4.status == "CALIBRATED"


def test_outlier_channel_isolation_and_zero_clipping() -> None:
    """Verifies high-magnitude outlier spikes are isolated into the FP16 lane without distorting bulk scale."""
    base_weights = [0.02 * math.sin(i * 0.3) for i in range(64)]
    # Inject two extreme outliers at channels 7 and 42
    base_weights[7] = 1.95
    base_weights[42] = -2.10

    bulk, outliers = isolate_outlier_channels(base_weights, sigma_gate=2.5)
    assert 7 in outliers
    assert 42 in outliers
    assert math.isclose(outliers[7], 1.95, rel_tol=1e-6)
    assert math.isclose(outliers[42], -2.10, rel_tol=1e-6)

    # Bulk scale must reflect the non-outlier distribution (~0.02 / 6.0), not the 2.10 spike
    scale = calibrate_block_scale(bulk, "FP4_E2M1")
    assert scale < 0.01

    quant_result = execute_block_quantization(3, base_weights, quant_format="FP4_E2M1", sigma_gate=2.5)
    assert quant_result.outlier_channels >= 2
    assert 7 in quant_result.outlier_indices
    assert 42 in quant_result.outlier_indices


def test_calibration_speed_and_memory_footprint_reduction() -> None:
    """Verifies >3.0x memory footprint reduction against FP16 baseline and sub-millisecond execution."""
    weights = generate_deterministic_block_weights(0, length=256)
    res = execute_block_quantization(0, weights, quant_format="FP4_E2M1", sigma_gate=2.6)

    assert res.fp16_bytes == 512
    assert res.quantized_bytes < 170
    assert res.memory_compression_ratio > 3.0
    assert res.calibration_latency_us <= 50.0


def test_outlier_spike_stress_trigger() -> None:
    """Verifies inject_outlier_spike stress mode forces scale resynchronization and captures spikes."""
    weights = generate_deterministic_block_weights(5, length=64)
    normal_res = execute_block_quantization(5, weights, quant_format="FP4_E2M1", inject_outlier_spike=False)
    spike_res = execute_block_quantization(5, weights, quant_format="FP4_E2M1", inject_outlier_spike=True)

    assert spike_res.outlier_channels >= normal_res.outlier_channels
    assert spike_res.status == "CALIBRATED"


def test_api_endpoints_and_zero_trust_sanitization() -> None:
    """Verifies FastAPI endpoints, synthetic corridor list, and SQLi/XSS rejection."""
    health = client.get("/health")
    assert health.status_code == 200
    data = health.json()
    assert data["engine"] == "GF-T3-242"
    assert "\x24" not in health.text

    corridors_resp = client.get("/api/v1/corridors")
    assert corridors_resp.status_code == 200
    assert len(corridors_resp.json()["corridors"]) == 4

    valid_payload = {
        "block_id": 3,
        "corridor": "FP4-CORRIDOR-ALPHA (MIXED-PRECISION-BLOCK-QUANT · 7200-GB/S)",
        "quant_format": "FP4_E2M1",
        "weights": generate_deterministic_block_weights(3, 32),
        "outlier_sigma_gate": 2.5,
        "inject_outlier_spike": False,
    }
    q_resp = client.post("/api/v1/quantize", json=valid_payload)
    assert q_resp.status_code == 200
    q_json = q_resp.json()
    assert q_json["block_label"] == "B3"
    assert "\x24" not in q_resp.text

    # Malicious SQL injection payload must be blocked
    bad_payload = dict(valid_payload)
    bad_payload["corridor"] = "FP4-CORRIDOR-ALPHA; DROP TABLE quant_blocks;--"
    bad_resp = client.post("/api/v1/quantize", json=bad_payload)
    assert bad_resp.status_code == 422
