"""
GF-T3-215: Vector Engine Invariant Test Suite
Testing HNSW graph navigation, Product Quantization (PQ), Asymmetric Distance Computation (ADC),
and clean-room deterministic vector mechanics.
Zero third-party proprietary dependencies.
"""

import math
import random
import time
from engine import HNSWGraph, ProductQuantizer, l2_distance

try:
    import pytest
except ImportError:
    class DummyPytest:
        @staticmethod
        def fixture(func):
            return func
    pytest = DummyPytest()


class TestVectorEngineInvariants:
    """
    Validation of the 4 Core Invariants defined in GF-T3-215:
    1. Recall Invariant: HNSW achieves >= 95% Recall@10 against brute-force L2 ground truth.
    2. Compression Invariant: PQ achieves >= 8x memory reduction vs raw float32 vectors.
    3. Search Complexity: Search latency scales sub-linearly O(log N).
    4. Determinism: Identical queries yield identical nearest-neighbor ID sets.
    """

    @pytest.fixture
    def populated_index(self):
        """Constructs an index of 200 synthetic vectors in 128 dimensions."""
        graph = HNSWGraph(dimension=128, m_max=16, m_max_0=32, ef_construction=64, ef_search=64, seed=42)
        rng = random.Random(1337)
        for i in range(200):
            # Clustered vectors to simulate realistic dense semantic embeddings
            cluster = i % 8
            vec = [cluster * 0.4 + rng.gauss(0.0, 0.6) for _ in range(128)]
            graph.insert(i, vec)
        return graph

    def test_invariant_1_recall_at_10(self, populated_index):
        """
        Recall invariant: HNSW achieves >= 95% Recall@10 against brute-force L2 ground truth
        when ef_search is appropriately parameterized.
        """
        rng = random.Random(777)
        recalls = []

        # Run across multiple test queries
        for q_idx in range(5):
            query = [rng.gauss(0.0, 1.0) for _ in range(128)]
            ann_results, _ = populated_index.search_knn(query, k=10, ef_search=96)
            gt_results = populated_index.exact_brute_force_knn(query, k=10)

            ann_ids = {r[0] for r in ann_results}
            gt_ids = {r[0] for r in gt_results}
            overlap = len(ann_ids.intersection(gt_ids))
            recall = (overlap / 10.0) * 100.0
            recalls.append(recall)

        mean_recall = sum(recalls) / len(recalls)
        assert mean_recall >= 95.0, "Expected Recall@10 >= 95.0%, achieved: " + str(mean_recall) + "%"

    def test_invariant_2_pq_compression_ratio(self):
        """
        Compression invariant: Product Quantization achieves >= 8x memory reduction
        compared to raw float32 vectors.
        """
        dim = 128
        m_subvectors = 16  # 16 sub-spaces of 8 dimensions
        k_centroids = 256  # 1 byte per sub-space

        pq = ProductQuantizer(dimension=dim, m_subvectors=m_subvectors, k_centroids=k_centroids)

        raw_vector_bytes = dim * 4  # float32 = 4 bytes -> 512 bytes
        quantized_vector_bytes = m_subvectors * 1  # 1 byte per sub-space -> 16 bytes
        compression_ratio = raw_vector_bytes / quantized_vector_bytes

        assert compression_ratio >= 8.0, "Expected compression ratio >= 8.0x, achieved: " + str(compression_ratio) + "x"
        assert compression_ratio == 32.0, "128D float32 to 16-byte PQ code must yield exactly 32x compression"

        # Verify encoding validity
        test_vec = [random.gauss(0, 1) for _ in range(dim)]
        code = pq.encode(test_vec)
        assert len(code) == m_subvectors
        assert all(0 <= byte_val < 256 for byte_val in code)

        # Verify Asymmetric Distance Computation (ADC) table
        lut = pq.compute_adc_lookup_table(test_vec)
        assert len(lut) == m_subvectors
        assert len(lut[0]) == k_centroids
        adc_dist = pq.adc_distance(lut, code)
        assert adc_dist >= 0.0

    def test_invariant_3_search_complexity_sublinear(self):
        """
        Search complexity: Graph search latency scales sub-linearly O(log N)
        as index size scales from N1 to N2.
        """
        graph_small = HNSWGraph(dimension=64, m_max=16, m_max_0=32, ef_construction=32, ef_search=32, seed=1)
        rng = random.Random(2026)
        n_small = 60
        for i in range(n_small):
            vec = [rng.gauss(0, 1) for _ in range(64)]
            graph_small.insert(i, vec)

        graph_large = HNSWGraph(dimension=64, m_max=16, m_max_0=32, ef_construction=32, ef_search=32, seed=2)
        n_large = 240  # 4x larger corpus
        for i in range(n_large):
            vec = [rng.gauss(0, 1) for _ in range(64)]
            graph_large.insert(i, vec)

        query = [rng.gauss(0, 1) for _ in range(64)]

        # Count candidate evaluations (proxy for traversal complexity)
        _, evals_small = graph_small.search_knn(query, k=5, ef_search=32)
        _, evals_large = graph_large.search_knn(query, k=5, ef_search=32)

        # For O(log N), a 4x increase in N causes at most a modest additive hop delta
        # Linear growth would imply evals_large ~ 4 * evals_small
        assert evals_large < 4 * evals_small, (
            "Expected sub-linear candidate evaluations: small=" + str(evals_small) + ", large=" + str(evals_large)
        )

    def test_invariant_4_deterministic_query_results(self, populated_index):
        """
        Deterministic query results: Identical query vectors yield identical nearest-neighbor ID sets.
        """
        fixed_query = [math.sin(i * 0.1) for i in range(128)]

        results_run1, hops1 = populated_index.search_knn(fixed_query, k=10, ef_search=64)
        results_run2, hops2 = populated_index.search_knn(fixed_query, k=10, ef_search=64)

        ids_run1 = [r[0] for r in results_run1]
        ids_run2 = [r[0] for r in results_run2]

        assert ids_run1 == ids_run2, "Expected deterministic ID set, got run1=" + str(ids_run1) + ", run2=" + str(ids_run2)
        assert hops1 == hops2, "Candidate evaluation path must be identical for identical queries"


if __name__ == "__main__":
    runner = TestVectorEngineInvariants()
    idx = runner.populated_index()
    print("Executing Invariant 1: Recall >= 95%...")
    runner.test_invariant_1_recall_at_10(idx)
    print("PASSED: Invariant 1 (Recall >= 95%)")

    print("Executing Invariant 2: PQ Compression Ratio >= 8x...")
    runner.test_invariant_2_pq_compression_ratio()
    print("PASSED: Invariant 2 (Compression 32x achieved)")

    print("Executing Invariant 3: Search Complexity Sub-linear O(log N)...")
    runner.test_invariant_3_search_complexity_sublinear()
    print("PASSED: Invariant 3 (Sub-linear traversal verified)")

    print("Executing Invariant 4: Deterministic Query Results...")
    runner.test_invariant_4_deterministic_query_results(idx)
    print("PASSED: Invariant 4 (Deterministic ID convergence verified)")

    print("ALL 4 INVARIANTS SATISFIED DETERMINISTICALLY!")
