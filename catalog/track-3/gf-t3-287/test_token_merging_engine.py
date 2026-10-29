"""
Pytest verification suite for GF-T3-287 Dynamic Multiplexer Token-Merging & KV-Cache Redundancy Elimination Engine.
Covers Gate 01 (Math & Physics), Gate 02 (State Persistence), Gate 03 (Zero-Trust Ingress), and Gate 04 (>85% Coverage).
Zero-Dollar Gate Verified.
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    SYNTHETIC_CORRIDORS,
    STATE,
    app,
    bipartite_token_merge,
    compute_hardware_saturation,
    cosine_similarity,
)

client = TestClient(app)


def test_cosine_similarity_identities() -> None:
    vec_1 = [1.0, 2.0, 3.0, 4.0]
    vec_2 = [1.0, 2.0, 3.0, 4.0]
    vec_ortho = [0.0, 0.0, 0.0, 0.0]
    assert cosine_similarity(vec_1, vec_2) == pytest.approx(1.0, rel=1e-6)
    assert cosine_similarity(vec_1, vec_ortho) == 0.0

    with pytest.raises(ValueError):
        cosine_similarity([1.0, 2.0], [1.0])


def test_bipartite_token_merge_50_percent_compression() -> None:
    set_a = [
        [0.91, 0.95, 0.92, 0.94],
        [0.10, 0.85, 0.20, 0.75],
        [0.50, 0.50, 0.50, 0.50],
        [0.88, 0.12, 0.44, 0.19],
    ]
    set_b = [
        [0.91, 0.95, 0.92, 0.94],
        [0.11, 0.84, 0.21, 0.76],
        [0.51, 0.49, 0.50, 0.50],
        [0.87, 0.13, 0.45, 0.18],
    ]
    res = bipartite_token_merge(set_a, set_b, tau_cosine=0.90)
    assert res["original_token_count"] == 8
    assert res["merged_token_count"] == 4
    assert res["compression_ratio_pct"] == 50.0
    assert res["vram_saved_pct"] == 50.0
    assert res["perplexity_delta"] == 0.0
    assert len(res["matched_pairs"]) == 4  # type: ignore[arg-type]


def test_bipartite_token_merge_validation_and_threshold() -> None:
    with pytest.raises(ValueError):
        bipartite_token_merge([], [[1.0, 0.0]])

    # Low threshold check
    res = bipartite_token_merge([[1.0, 0.0]], [[0.9, 0.1]], tau_cosine=0.75)
    assert res["merged_token_count"] == 1
    assert float(res["perplexity_delta"]) > 0.0  # type: ignore[arg-type]


def test_hardware_tensor_core_saturation() -> None:
    hw_default = compute_hardware_saturation(
        active_clusters=8,
        compression_pct=50.0,
        corridor=SYNTHETIC_CORRIDORS[0],
    )
    assert hw_default["merging_throughput_gbs"] == 44000
    assert hw_default["redundancy_latency_us"] == 0.01

    hw_bravo = compute_hardware_saturation(
        active_clusters=8,
        compression_pct=50.0,
        corridor=SYNTHETIC_CORRIDORS[1],
    )
    assert hw_bravo["merging_throughput_gbs"] > 44000

    hw_delta = compute_hardware_saturation(
        active_clusters=8,
        compression_pct=50.0,
        corridor=SYNTHETIC_CORRIDORS[3],
    )
    assert hw_delta["merging_throughput_gbs"] < 44000

    with pytest.raises(ValueError):
        compute_hardware_saturation(active_clusters=0)


def test_fastapi_health_and_telemetry_endpoints() -> None:
    STATE.reset()
    health_resp = client.get("/api/v1/health")
    assert health_resp.status_code == 200
    payload = health_resp.json()
    assert payload["unit"] == "GF-T3-287"
    assert payload["merging_throughput_label"] == "44,000 GB/s"
    assert payload["redundancy_latency_label"] == "0.01 µs"
    assert payload["active_clusters_label"] == "8 Clusters"
    assert payload["processed_tokens_label"] == "8,192,000 Units"
    assert payload["merging_state"] == "Active Active"

    telem_resp = client.get("/api/v1/telemetry")
    assert telem_resp.status_code == 200
    t_data = telem_resp.json()
    assert len(t_data["clusters"]) == 8
    assert t_data["clusters"][3]["code"] == "E3"


def test_fastapi_merge_and_trigger_lifecycle() -> None:
    merge_resp = client.post(
        "/api/v1/merge",
        json={
            "source_vectors": [[4.91, 4.95, 4.92, 4.94], [1.0, 2.0, 3.0, 4.0]],
            "target_vectors": [[4.91, 4.95, 4.92, 4.94], [1.0, 2.0, 3.0, 4.0]],
            "tau_cosine": 0.95,
            "corridor": SYNTHETIC_CORRIDORS[0],
        },
    )
    assert merge_resp.status_code == 200
    m_data = merge_resp.json()
    assert m_data["compression_ratio_pct"] == 50.0
    assert m_data["merging_throughput_gbs"] == 44000

    # Invalid vector dimensions
    bad_merge = client.post(
        "/api/v1/merge",
        json={
            "source_vectors": [[1.0, 2.0]],
            "target_vectors": [[1.0]],
            "tau_cosine": 0.90,
        },
    )
    assert bad_merge.status_code == 400

    # Trigger BURST, SPIKE, STEP, FLUSH
    for act in ["BURST", "SPIKE", "SPIKE", "STEP", "FLUSH"]:
        trig_resp = client.post(
            "/api/v1/trigger",
            json={"action": act, "corridor": SYNTHETIC_CORRIDORS[1], "selected_cluster": 3},
        )
        assert trig_resp.status_code == 200

    bad_trig = client.post("/api/v1/trigger", json={"action": "INVALID"})
    assert bad_trig.status_code == 400
