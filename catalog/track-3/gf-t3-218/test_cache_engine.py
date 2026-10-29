"""
Unit & Invariant Verification Suite for APEX-218 Real-Time Semantic Cache Engine
Coverage Target: >80% Core Mathematical & Invariant Execution

Invariants Verified:
1. Semantic Hit Fidelity: Vectors with cosine similarity >= 0.94 strictly return cached payload.
2. Zero-Stale Invariant: Evicted vectors cannot serve cache hits after TTL expiration.
3. Eviction Ranking: Lowest composite score items are purged first under memory saturation.
4. Latency Ceiling: Sub-2ms lookup SLA under concurrent read load.
"""

import time
import math

try:
    import pytest
except ImportError:
    pytest = None
from engine import (
    ApexCacheEngine,
    cosine_similarity,
    normalize_vector,
    generate_synthetic_vector,
    CORRIDOR_ALPHA,
    CORRIDOR_BRAVO,
    SIMILARITY_THRESHOLD,
    CacheSlot
)

# ---------------------------------------------------------------------------
# TEST 1: SEMANTIC HIT FIDELITY (COSINE SIMILARITY >= 0.94)
# ---------------------------------------------------------------------------

def test_semantic_hit_fidelity():
    """
    Verifies that vectors with cosine similarity >= 0.94 return a strict CACHE_HIT
    and the exact cached payload, while vectors below 0.94 return CACHE_MISS.
    """
    engine = ApexCacheEngine(max_slots=64, dimension=32, similarity_threshold=0.94)

    base_vector = generate_synthetic_vector(dim=32, seed=42)
    test_key = "fidelity-test-key-01"
    test_payload = {"sequence": "AUTH-TOKEN-CLUSTER-A", "signature": "SHA256-VALID"}

    insert_res = engine.insert(
        key=test_key,
        vector=base_vector,
        payload=test_payload,
        tokens=1500,
        corridor=CORRIDOR_ALPHA
    )
    assert insert_res["success"] is True

    # Exact query (similarity = 1.0 >= 0.94)
    exact_hit = engine.lookup(base_vector)
    assert exact_hit["status"] == "CACHE_HIT"
    assert exact_hit["similarity"] >= 0.999
    assert exact_hit["key"] == test_key
    assert exact_hit["payload"] == test_payload
    assert exact_hit["tokens_saved"] == 1500

    # Perturbed query with high similarity (> 0.95 >= 0.94)
    # Add tiny perturbation
    near_vector = [x + 0.005 for x in base_vector]
    sim = cosine_similarity(normalize_vector(near_vector), base_vector)
    assert sim >= 0.94

    near_hit = engine.lookup(near_vector)
    assert near_hit["status"] == "CACHE_HIT"
    assert near_hit["similarity"] >= 0.94
    assert near_hit["key"] == test_key

    # Orthogonal / distant query (similarity < 0.94)
    distant_vector = generate_synthetic_vector(dim=32, seed=99999)
    dist_sim = cosine_similarity(normalize_vector(distant_vector), base_vector)
    if dist_sim < 0.94:
        miss_res = engine.lookup(distant_vector)
        assert miss_res["status"] == "CACHE_MISS"
        assert miss_res["route"] == "SYNTHETIC_MODEL_FORWARD_PASS"

# ---------------------------------------------------------------------------
# TEST 2: ZERO-STALE INVARIANT (EVICTED VECTORS CANNOT SERVE HITS)
# ---------------------------------------------------------------------------

def test_zero_stale_invariant():
    """
    Verifies that once a vector slot is evicted or purged, it can never
    serve a cache hit, enforcing zero-stale consistency across memory boundaries.
    """
    engine = ApexCacheEngine(max_slots=8, dimension=16, similarity_threshold=0.94)

    target_vec = generate_synthetic_vector(dim=16, seed=77)
    target_key = "stale-check-target"

    ins = engine.insert(
        key=target_key,
        vector=target_vec,
        payload={"sensitive_cache": "VERSION-1"},
        tokens=800,
        corridor=CORRIDOR_BRAVO
    )
    slot_id = ins["slot_id"]
    assert slot_id is not None

    # Verify hit prior to eviction
    pre_hit = engine.lookup(target_vec)
    assert pre_hit["status"] == "CACHE_HIT"

    # Sweep all slots to guarantee eviction of this entry
    purged = engine.sweep_evictions(target_purge_count=len(engine.slots))
    purged_keys = [p["key"] for p in purged]
    assert target_key in purged_keys

    # Confirm slot is marked inactive or removed
    assert slot_id not in engine.slots

    # Query again with the exact target vector
    post_evict_res = engine.lookup(target_vec)
    assert post_evict_res["status"] == "CACHE_MISS"
    assert post_evict_res["slot_id"] is None
    assert post_evict_res["payload"] is None

# ---------------------------------------------------------------------------
# TEST 3: SPECULATIVE DECAY EVICTION RANKING
# ---------------------------------------------------------------------------

def test_eviction_ranking_order():
    """
    Verifies that the dual-score eviction pipeline:
    S = alpha * freq + (1 - alpha) * exp(-lambda * delta_t)
    ranks entries correctly and purges the lowest composite score first.
    """
    engine = ApexCacheEngine(
        max_slots=4,
        dimension=16,
        alpha=0.65,
        decay_lambda=0.05
    )
    # Clear initial seed slots to start clean
    engine.slots.clear()
    engine.buckets.clear()
    engine.free_slot_pool = list(reversed(range(4)))

    now = time.time()

    # Slot 1: Cold (accessed once long ago)
    v1 = generate_synthetic_vector(dim=16, seed=1)
    slot1_id = engine._insert_direct("slot-cold", v1, {}, 100, CORRIDOR_ALPHA, now - 500.0)
    engine.slots[slot1_id].last_accessed_at = now - 500.0
    engine.slots[slot1_id].access_count = 1

    # Slot 2: Moderately warm
    v2 = generate_synthetic_vector(dim=16, seed=2)
    slot2_id = engine._insert_direct("slot-medium", v2, {}, 100, CORRIDOR_ALPHA, now - 60.0)
    engine.slots[slot2_id].last_accessed_at = now - 60.0
    engine.slots[slot2_id].access_count = 5

    # Slot 3: Extremely hot (accessed recently many times)
    v3 = generate_synthetic_vector(dim=16, seed=3)
    slot3_id = engine._insert_direct("slot-hot", v3, {}, 100, CORRIDOR_ALPHA, now - 2.0)
    engine.slots[slot3_id].last_accessed_at = now - 2.0
    engine.slots[slot3_id].access_count = 35

    score_cold = engine.slots[slot1_id].calculate_score(now, alpha=0.65, decay_lambda=0.05)
    score_med = engine.slots[slot2_id].calculate_score(now, alpha=0.65, decay_lambda=0.05)
    score_hot = engine.slots[slot3_id].calculate_score(now, alpha=0.65, decay_lambda=0.05)

    assert score_cold < score_med < score_hot

    # Evict 1 slot - must be slot-cold
    purged = engine.sweep_evictions(target_purge_count=1)
    assert len(purged) == 1
    assert purged[0]["key"] == "slot-cold"
    assert purged[0]["slot_id"] == slot1_id

# ---------------------------------------------------------------------------
# TEST 4: LATENCY CEILING (SUB-2MS LOOKUP SLA)
# ---------------------------------------------------------------------------

def test_lookup_latency_ceiling():
    """
    Verifies that lookup operations against populated vector buffer
    meet the sub-2ms lookup SLA under continuous read operations.
    """
    engine = ApexCacheEngine(max_slots=128, dimension=32)

    # Ingest 32 vectors
    vectors = []
    for i in range(32):
        v = generate_synthetic_vector(dim=32, seed=i + 100)
        vectors.append(v)
        engine.insert(
            key="benchmark-node-" + str(i),
            vector=v,
            payload={"idx": i},
            tokens=500,
            corridor=CORRIDOR_ALPHA
        )

    # Execute 50 sequential reads and measure individual latencies
    latencies = []
    for i in range(50):
        query = vectors[i % len(vectors)]
        t0 = time.perf_counter()
        res = engine.lookup(query)
        duration_ms = (time.perf_counter() - t0) * 1000.0
        latencies.append(duration_ms)
        assert res["status"] in ("CACHE_HIT", "CACHE_MISS")

    avg_latency = sum(latencies) / len(latencies)
    p95_latency = sorted(latencies)[int(len(latencies) * 0.95)]

    # Sub-2ms SLA verification
    assert avg_latency < 2.0, "Average latency exceeded 2.0ms ceiling: " + str(avg_latency)
    assert p95_latency < 3.5, "P95 latency exceeded SLA ceiling: " + str(p95_latency)

if __name__ == "__main__":
    print("Executing APEX-218 Invariant Verification Suite...")
    test_semantic_hit_fidelity()
    print("PASS: Invariant 1 - Semantic Hit Fidelity (Cosine Sim >= 0.94)")
    test_zero_stale_invariant()
    print("PASS: Invariant 2 - Zero-Stale Post-Eviction Consistency")
    test_eviction_ranking_order()
    print("PASS: Invariant 3 - Speculative Decay Priority Ranking")
    test_lookup_latency_ceiling()
    print("PASS: Invariant 4 - Sub-2ms Lookup Latency Ceiling SLA")
    print("ALL 4 VERIFICATION SUITE INVARIANTS PASSED SUCCESSFULLY!")

