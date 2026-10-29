"""
APEX-217 Multi-Model Semantic Router Test Suite
Track 3 Enterprise Reference Verification
Zero-Dollar Compliance Attestation: Dimensionless compute units only
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    app,
    ModelTierId,
    CircuitState,
    CircuitBreaker,
    UCB1BanditBalancer,
    SemanticIntentClassifier,
    CIRCUIT_BREAKERS,
    RoutingIntent,
)

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"
    assert "circuits" in data
    assert "total_routed_tokens" in data


def test_semantic_classifier_entropy_bounds():
    # Complex analytical prompt
    complex_prompt = (
        "Formulate a deterministic distributed consensus matrix evaluating partition tolerance, "
        "byzantine fault verification, and asymmetric cryptographic signature cascades across "
        "non-blocking actor networks with bounded queuing delays."
    )
    result = SemanticIntentClassifier.classify_intent(complex_prompt)
    assert result["intent"] == RoutingIntent.ANALYTICAL_REASONING
    assert result["primary_tier"] == ModelTierId.TIER_ALPHA
    assert 0.0 <= result["token_entropy"] <= 1.0
    assert 0.0 <= result["structural_density"] <= 1.0

    # Low entropy micro-query
    short_prompt = "ping status ok"
    short_res = SemanticIntentClassifier.classify_intent(short_prompt)
    assert short_res["structural_density"] < 0.65


def test_circuit_breaker_state_machine():
    cb = CircuitBreaker(tier_id=ModelTierId.TIER_ALPHA, failure_threshold=2, recovery_timeout_sec=0.1)
    assert cb.state == CircuitState.CLOSED
    assert cb.can_execute() is True

    # First failure
    cb.record_failure()
    assert cb.state == CircuitState.CLOSED
    assert cb.failure_count == 1

    # Second failure trips breaker to OPEN
    cb.record_failure()
    assert cb.state == CircuitState.OPEN
    assert cb.can_execute() is False

    # Simulate timeout elapsed
    cb.last_failure_timestamp -= 1.0
    assert cb.can_execute() is True
    assert cb.state == CircuitState.HALF_OPEN

    # Recovery successes
    cb.record_success()
    cb.record_success()
    assert cb.state == CircuitState.CLOSED
    assert cb.failure_count == 0


def test_zero_drop_cascade_when_alpha_trips():
    # Ensure alpha is OPEN
    CIRCUIT_BREAKERS[ModelTierId.TIER_ALPHA].force_state(CircuitState.OPEN)
    CIRCUIT_BREAKERS[ModelTierId.TIER_BRAVO].force_state(CircuitState.CLOSED)

    response = client.post(
        "/api/v1/route",
        json={
            "prompt": "Evaluate cryptographic proof verification matrices and latency bounds.",
            "allow_cascade": True,
        }
    )
    assert response.status_code == 200
    data = response.json()
    # Should cascade from Alpha to Bravo without dropping request
    assert data["execution_status"] == "DISPATCHED_ZERO_DROP"
    assert data["selected_tier"] == ModelTierId.TIER_BRAVO.value
    assert ModelTierId.TIER_ALPHA.value in data["fallback_path"]
    assert ModelTierId.TIER_BRAVO.value in data["fallback_path"]

    # Reset alpha
    CIRCUIT_BREAKERS[ModelTierId.TIER_ALPHA].force_state(CircuitState.CLOSED)


def test_monotonic_fallback_all_tripped():
    # Force trip Alpha, Bravo, Gamma
    CIRCUIT_BREAKERS[ModelTierId.TIER_ALPHA].force_state(CircuitState.OPEN)
    CIRCUIT_BREAKERS[ModelTierId.TIER_BRAVO].force_state(CircuitState.OPEN)
    CIRCUIT_BREAKERS[ModelTierId.TIER_GAMMA].force_state(CircuitState.OPEN)

    response = client.post(
        "/api/v1/route",
        json={
            "prompt": "Analyze micro-batch routing throughput under saturation.",
            "allow_cascade": True,
        }
    )
    assert response.status_code == 200
    data = response.json()
    # Must fallback to Delta local edge
    assert data["selected_tier"] == ModelTierId.TIER_DELTA.value
    assert data["execution_status"] == "DISPATCHED_ZERO_DROP"

    # Reset circuits
    for cb in CIRCUIT_BREAKERS.values():
        cb.force_state(CircuitState.CLOSED)


def test_ucb1_bandit_telemetry_and_scoring():
    bandit = UCB1BanditBalancer(exploration_constant=1.414)
    initial_score = bandit.compute_ucb_score(ModelTierId.TIER_ALPHA.value)
    assert initial_score > 0.0

    bandit.update_reward(ModelTierId.TIER_ALPHA.value, reward_score=0.98, latency_ms=12.4)
    updated_score = bandit.compute_ucb_score(ModelTierId.TIER_ALPHA.value)
    assert updated_score > 0.0

    telemetry_resp = client.get("/api/v1/telemetry/bandit")
    assert telemetry_resp.status_code == 200
    tel_data = telemetry_resp.json()
    assert "ucb_scores" in tel_data
    assert "arm_pulls" in tel_data


def test_chaos_trip_and_probe_endpoints():
    trip_resp = client.post(
        "/api/v1/chaos/trip",
        json={"tier": ModelTierId.TIER_GAMMA.value, "trip_circuit": True}
    )
    assert trip_resp.status_code == 200
    assert trip_resp.json()["circuit_state"] == CircuitState.OPEN.value

    probe_resp = client.post(
        "/api/v1/chaos/probe-half-open?tier=" + ModelTierId.TIER_GAMMA.value
    )
    assert probe_resp.status_code == 200
    assert probe_resp.json()["circuit_state"] == CircuitState.HALF_OPEN.value

    # Reset
    client.post(
        "/api/v1/chaos/trip",
        json={"tier": ModelTierId.TIER_GAMMA.value, "trip_circuit": False}
    )
