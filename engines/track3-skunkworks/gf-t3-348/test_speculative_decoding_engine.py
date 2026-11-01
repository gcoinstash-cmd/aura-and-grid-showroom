"""
Pytest Verification Suite for GF-T3-348
Tests:
1. Draft candidate expansion and target model parallel verification correctness.
2. Asynchronous verification efficiency under divergence spikes.
3. Hardware tensor core acceleration and throughput saturation.
4. Zero-Dollar Gate compliance across telemetry payloads.
"""

import json
import pytest
from fastapi.testclient import TestClient
from engine import (
    app,
    SYNTHETIC_CORRIDORS,
    compute_verification_kernel,
    compute_speculative_score,
    SpeculativeEngineSimulator,
)

client = TestClient(app)


def test_verification_kernel_determinism():
    score_high = compute_verification_kernel(101, 0.95, 0.85, 0.0)
    assert score_high > 1.0
    score_low = compute_verification_kernel(101, 0.60, 0.85, 0.0)
    assert 0.0 < score_low < 0.5

    with pytest.raises(ValueError):
        compute_verification_kernel(-1, 0.90, 0.85)


def test_draft_candidate_expansion_and_parallel_verification():
    drafts = [11, 22, 33, 44, 55, 66, 77, 88]
    probs = [0.99, 0.97, 0.96, 0.95, 0.93, 0.92, 0.91, 0.90]
    res = compute_speculative_score(drafts, probs, gamma_acceptance=0.85, divergence_spike=False)

    assert res["accepted_count"] == 8
    assert res["total_candidates"] == 8
    assert res["acceptance_rate_pct"] == 100
    assert res["speedup_multiplier"] == 3.0
    assert res["throughput_gb_s"] == 144600
    assert res["verification_latency_us"] == 0.01
    assert res["s_spec"] > 8.0


def test_asynchronous_verification_under_divergence_spike():
    drafts = [11, 22, 33, 44, 55, 66, 77, 88]
    probs = [0.99, 0.97, 0.96, 0.95, 0.88, 0.86, 0.84, 0.82]
    res_spike = compute_speculative_score(drafts, probs, gamma_acceptance=0.80, divergence_spike=True)

    assert res_spike["accepted_count"] < 8
    assert res_spike["throughput_gb_s"] < 144600
    assert res_spike["verification_latency_us"] == 0.04
    assert 1.0 <= res_spike["speedup_multiplier"] < 3.0


def test_invalid_speculative_inputs():
    with pytest.raises(ValueError):
        compute_speculative_score([], [], 0.85)
    with pytest.raises(ValueError):
        compute_speculative_score([1, 2], [0.9], 0.85)


def test_simulator_lifecycle_and_hardware_saturation():
    sim = SpeculativeEngineSimulator()
    initial = sim.snapshot()
    assert initial["engine_id"] == "GF-T3-348"
    assert initial["throughput_gb_s"] == 144600
    assert initial["active_drafts"] == 8
    assert len(initial["draft_slots"]) == 8

    after_burst = sim.trigger_burst()
    assert after_burst["processed_tokens_units"] > initial["processed_tokens_units"]

    after_spike = sim.toggle_divergence_spike()
    assert after_spike["divergence_spike"] is True
    assert after_spike["acceptance_pct"] == 76

    after_step = sim.step_verification_pass()
    assert after_step["acceptance_pct"] >= 78

    after_flush = sim.flush_arenas()
    assert after_flush["divergence_spike"] is False
    assert after_flush["processed_tokens_units"] == 33400000
    assert after_flush["throughput_gb_s"] == 144600


def test_fastapi_endpoints_and_zero_dollar_gate():
    r_health = client.get("/health")
    assert r_health.status_code == 200
    assert r_health.json()["engine"] == "GF-T3-348"

    r_tel = client.get("/api/v1/telemetry")
    assert r_tel.status_code == 200
    payload_str = json.dumps(r_tel.json())
    assert chr(36) not in payload_str

    r_verf = client.post(
        "/api/v1/verify",
        json={
            "corridor": SYNTHETIC_CORRIDORS[0],
            "draft_tokens": [10, 20, 30, 40, 50, 60, 70, 80],
            "target_logits_match": [0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95],
            "acceptance_threshold": 0.85,
            "divergence_spike_active": False,
        },
    )
    assert r_verf.status_code == 200
    assert r_verf.json()["speedup_multiplier"] == 3.0
    assert chr(36) not in json.dumps(r_verf.json())

    r_bad = client.post(
        "/api/v1/verify",
        json={
            "corridor": "INVALID-CORRIDOR",
            "draft_tokens": [10],
            "target_logits_match": [0.95],
        },
    )
    assert r_bad.status_code == 400

    assert client.post("/api/v1/actions/burst").status_code == 200
    assert client.post("/api/v1/actions/divergence").status_code == 200
    assert client.post("/api/v1/actions/step").status_code == 200
    assert client.post("/api/v1/actions/flush").status_code == 200
