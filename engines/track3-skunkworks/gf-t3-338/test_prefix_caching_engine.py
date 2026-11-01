"""
Pytest Verification Suite for GF-T3-338
Covers Gate 01 (Math/Physics), Gate 02 (PostgreSQL RLS), Gate 03 (Zero-Trust Ingress), Gate 04 (>85% Coverage)
"""

import pytest
from fastapi.testclient import TestClient
from engine import (
    SYNTHETIC_PREFIX_CORRIDORS,
    AsynchronousPrefixCachingEngine,
    app,
    compute_cryptographic_block_hash,
    generate_postgres_rls_migration_sql,
    sanitize_gridsync_payload,
)

client = TestClient(app)


def test_cryptographic_prefix_block_hashing_determinism():
    """Verifies R_radix cryptographic prefix block hashing determinism and collision resistance."""
    k_vec = [9.91, 9.95, 9.92, 9.94]
    v_vec = [1.02, 1.04, 1.01, 1.03]

    hash_a, energy_a = compute_cryptographic_block_hash(k_vec, v_vec, "SYSTEM_PROMPT_BLOCK_0")
    hash_b, energy_b = compute_cryptographic_block_hash(k_vec, v_vec, "SYSTEM_PROMPT_BLOCK_0")
    hash_c, _ = compute_cryptographic_block_hash(k_vec, v_vec, "SYSTEM_PROMPT_BLOCK_1")

    assert hash_a == hash_b
    assert energy_a == energy_b
    assert hash_a != hash_c
    assert hash_a.startswith("0x")
    assert len(hash_a) == 14
    assert 0.0 <= energy_a <= 1.0


def test_cryptographic_hash_invalid_vectors():
    """Verifies vector length validation in compute_cryptographic_block_hash."""
    with pytest.raises(ValueError):
        compute_cryptographic_block_hash([], [], "TOKEN_A")
    with pytest.raises(ValueError):
        compute_cryptographic_block_hash([1.0, 2.0], [1.0], "TOKEN_B")


def test_asynchronous_reference_counted_kv_sharing_multi_turn():
    """Verifies multi-turn prefix lookup, KV block reference counting, and zero reload latency."""
    engine = AsynchronousPrefixCachingEngine()
    initial_tokens = engine.processed_tokens
    initial_ref_b0 = engine.blocks[0].ref_count

    res = engine.lookup_or_insert_prefix(
        prompt_tokens=["CTX_TURN_1", "CTX_TURN_2", "CTX_TURN_3", "CTX_TURN_4"],
        k_prefix=[9.91, 9.95, 9.92, 9.94],
        v_prefix=[1.02, 1.04, 1.01, 1.03],
    )

    assert res["zero_reload_verified"] is True
    assert res["reused_kv_tokens"] == 4 * 256 * 1000
    assert res["ttft_latency_us"] == 0.01
    assert engine.blocks[0].ref_count == initial_ref_b0 + 1
    assert engine.processed_tokens > initial_tokens


def test_hardware_tensor_core_throughput_and_corridors():
    """Verifies synthetic prefix corridor switching and throughput saturation."""
    engine = AsynchronousPrefixCachingEngine()
    for corridor in SYNTHETIC_PREFIX_CORRIDORS:
        snap = engine.select_corridor(corridor)
        assert snap["corridor"] == corridor
        assert snap["cache_throughput_gb_s"] > 50000.0
        assert snap["active_blocks"] == 8
        assert snap["total_blocks"] == 8


def test_chaos_stress_triggers_and_arena_flush():
    """Verifies Prefix Caching Burst, Hash Collision Spike, Step Pass, and Arena Flush."""
    engine = AsynchronousPrefixCachingEngine()

    burst_snap = engine.trigger_prefix_caching_burst()
    assert burst_snap["prefix_state"] == "Burst Saturation"
    assert burst_snap["processed_tokens_units"] == 26680000

    spike_snap = engine.toggle_hash_collision_spike()
    assert spike_snap["collision_spike_active"] is True
    assert spike_snap["prefix_state"] == "Re-Indexing Spike"
    assert spike_snap["blocks"][2]["status"] == "REHASH · SYNC"

    recovered_snap = engine.toggle_hash_collision_spike()
    assert recovered_snap["collision_spike_active"] is False
    assert recovered_snap["prefix_state"] == "Active"

    step_snap = engine.step_asynchronous_prefix_pass()
    assert step_snap["processed_tokens_units"] > 26680000

    flushed_snap = engine.flush_prefix_arenas()
    assert flushed_snap["processed_tokens_units"] == 25400000
    assert flushed_snap["engine_xp_k"] == 75.0
    assert flushed_snap["prefix_state"] == "Active"


def test_zero_trust_ingress_sanitizer_and_postgres_rls():
    """Verifies Gate 02 PostgreSQL 16 RLS DDL and Gate 03 SQLi/XSS ingress scrubber."""
    ddl = generate_postgres_rls_migration_sql()
    assert "ENABLE ROW LEVEL SECURITY" in ddl
    assert "FORCE ROW LEVEL SECURITY" in ddl
    assert "tenant_isolation_policy" in ddl

    clean = sanitize_gridsync_payload("VALID_TOKEN_338")
    assert clean == "VALID_TOKEN_338"

    with pytest.raises(ValueError):
        sanitize_gridsync_payload("DROP TABLE gf_t3_338_radix_blocks; --")

    with pytest.raises(ValueError):
        sanitize_gridsync_payload("<script>alert(1)</script>")


def test_fastapi_endpoints_full_cycle():
    """Verifies FastAPI REST endpoints for health, telemetry, lookup, and chaos triggers."""
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["unit"] == "GF-T3-338"

    telemetry = client.get("/api/v1/telemetry")
    assert telemetry.status_code == 200
    assert telemetry.json()["cache_throughput_gb_s"] == 124600.0

    lookup = client.post(
        "/api/v1/radix/lookup",
        json={
            "prompt_tokens": ["SYS_HEADER", "USER_CTX"],
            "k_prefix": [9.91, 9.95, 9.92, 9.94],
            "v_prefix": [1.01, 1.02, 1.03, 1.04],
        },
    )
    assert lookup.status_code == 200
    assert lookup.json()["zero_reload_verified"] is True

    burst = client.post("/api/v1/chaos/burst")
    assert burst.status_code == 200
    assert burst.json()["prefix_state"] == "Burst Saturation"

    spike = client.post("/api/v1/chaos/collision-spike")
    assert spike.status_code == 200
    assert spike.json()["collision_spike_active"] is True

    step = client.post("/api/v1/chaos/step-pass")
    assert step.status_code == 200

    flush = client.post("/api/v1/chaos/flush")
    assert flush.status_code == 200
    assert flush.json()["processed_tokens_units"] == 25400000
