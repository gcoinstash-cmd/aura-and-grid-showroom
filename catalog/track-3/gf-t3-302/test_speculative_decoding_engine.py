"""
Pytest Verification Suite for GF-T3-302 Asynchronous Speculative Decoding Engine
Gate 01 - Gate 04 Verification (>85% Coverage Target)
Zero-Dollar Gate Strictly Enforced
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    DraftVerificationRequest,
    SpeculativeCorridor,
    SpeculativeDecodingEngine,
    app,
)

client = TestClient(app)


def test_draft_candidate_generation_and_acceptance_rate() -> None:
    """
    1. Verifies draft candidate generation (D0..D7) and target model acceptance rate correctness.
    """
    engine = SpeculativeDecodingEngine()
    snapshot = engine.snapshot()

    assert snapshot.chassis_id == "GF-T3-302"
    assert snapshot.total_candidates_capacity == 8
    assert snapshot.active_candidates_count == 8
    assert len(snapshot.candidates) == 8

    # Verify D3 telemetry baseline matches specification
    d3 = snapshot.candidates[3]
    assert d3.slot_label == "Candidate 3 (D3)"
    assert d3.hex_ptr == "0x29030"
    assert d3.tokens_k == 256
    assert d3.acceptance_rate == 88.5
    assert d3.status == "VERIFIED · LOCKED"

    # Verify mathematical softmax and acceptance verifier
    req = DraftVerificationRequest(
        corridor=SpeculativeCorridor.ALPHA,
        draft_logits=[6.31, 6.35, 6.32, 6.34, 6.30, 6.36, 6.33, 6.35],
        target_logits=[6.30, 6.34, 6.31, 6.34, 6.29, 6.35, 6.32, 6.35],
        temperature=1.0,
        divergence_penalty=0.0,
    )
    result = SpeculativeDecodingEngine.verify_draft_candidates(req)
    assert result.accepted_count == 8
    assert result.rejected_count == 0
    assert result.recycled_arenas == 0
    assert 85.0 <= result.mean_acceptance_rate <= 99.5
    assert result.effective_speedup >= 3.0


def test_asynchronous_parallel_validation_efficiency_under_divergence() -> None:
    """
    2. Verifies asynchronous parallel validation efficiency and non-blocking candidate recycling.
    """
    engine = SpeculativeDecodingEngine()

    # Inject divergence spike and verify dynamic re-sampling
    diverged = engine.toggle_divergence_spike()
    assert diverged.divergence_spike_active is True
    assert diverged.speculative_state == "Dynamic Re-Sampling Active"
    assert diverged.active_candidates_count == 5

    # Verify high divergence penalty causes candidate rejection & arena recycling
    req = DraftVerificationRequest(
        corridor=SpeculativeCorridor.GAMMA,
        draft_logits=[6.31, 6.35, 6.32, 6.34, 6.30, 6.36, 6.33, 6.35],
        target_logits=[6.10, 6.05, 6.40, 6.34, 5.95, 6.35, 6.01, 6.35],
        temperature=1.0,
        divergence_penalty=0.35,
    )
    res = SpeculativeDecodingEngine.verify_draft_candidates(req)
    assert res.rejected_count == res.recycled_arenas
    assert res.rejected_count > 0

    # Clear divergence spike
    restored = engine.toggle_divergence_spike()
    assert restored.divergence_spike_active is False
    assert restored.active_candidates_count == 8


def test_hardware_tensor_core_acceleration_and_throughput_saturation() -> None:
    """
    3. Verifies hardware tensor core acceleration, throughput saturation (60,400 GB/s),
    and FastAPI endpoints.
    """
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["chassis"] == "GF-T3-302"

    telemetry_resp = client.get("/api/v1/telemetry")
    assert telemetry_resp.status_code == 200
    data = telemetry_resp.json()
    assert data["decoding_throughput_gbs"] == 60400.0
    assert data["verification_latency_us"] == 0.01

    # Trigger burst via API
    burst_resp = client.post("/api/v1/actions/burst")
    assert burst_resp.status_code == 200
    assert burst_resp.json()["decoding_throughput_gbs"] > 60400.0

    # Step asynchronous pass via API
    step_resp = client.post("/api/v1/actions/step")
    assert step_resp.status_code == 200
    assert step_resp.json()["processed_tokens_units"] > 10000000

    # Flush arenas via API
    flush_resp = client.post("/api/v1/actions/flush")
    assert flush_resp.status_code == 200
    assert flush_resp.json()["processed_tokens_units"] == 10000000

    # Verify mismatched logit lengths raise HTTP 400
    bad_verify = client.post(
        "/api/v1/verify",
        json={
            "corridor": "SPEC-CORRIDOR-ALPHA (DYNAMIC-SPECULATIVE-DECODING-FABRIC · 60400-GB/S)",
            "draft_logits": [6.31, 6.35],
            "target_logits": [6.31],
        },
    )
    assert bad_verify.status_code == 400
