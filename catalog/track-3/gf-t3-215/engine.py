"""
GF-T3-215: APEX-215 Vector Embedding Quantization & HNSW Graph Index Engine
Standalone Production Reference Core (FastAPI / Asynchronous Vector Mesh)
SPDX-License-Identifier: MIT / Clean-Room Clean Title APA Transfer Spec
Zero Third-Party Database Dependencies. Zero External Cloud Calls.
"""

import math
import random
import time
from typing import Dict, List, Optional, Tuple, Any
try:
    from fastapi import FastAPI, HTTPException, Query
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, Field

    app = FastAPI(
        title="APEX-215 Vector Embedding Quantization & HNSW Graph Index Engine",
        description="Track 3 Clean-Room Hierarchical Navigable Small World (HNSW) and Product Quantization (PQ) Vector Mesh Engine.",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
except ImportError:
    class DummyApp:
        def get(self, *args, **kwargs):
            return lambda f: f
        def post(self, *args, **kwargs):
            return lambda f: f
    app = DummyApp()
    BaseModel = object
    Field = lambda *args, **kwargs: None
    HTTPException = Exception
    Query = lambda *args, **kwargs: None


# ==============================================================================
# MATHEMATICAL PRIMITIVES & ASYMMETRIC DISTANCE COMPUTATION
# ==============================================================================

def l2_distance_squared(a: List[float], b: List[float]) -> float:
    """Compute squared Euclidean distance without square root overhead."""
    return sum((x - y) ** 2 for x, y in zip(a, b))

def l2_distance(a: List[float], b: List[float]) -> float:
    """Compute Euclidean L2 distance."""
    return math.sqrt(l2_distance_squared(a, b))

def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Compute Cosine Similarity in [-1.0, 1.0]."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


# ==============================================================================
# PRODUCT QUANTIZATION (PQ) & CODEBOOK VORONOI CENTROIDS
# ==============================================================================

class ProductQuantizer:
    """
    Decomposes D-dimensional space into M orthogonal sub-spaces.
    Each sub-space maps coordinates to one of 256 Voronoi centroids (1 byte).
    Achieves deterministic (D * 4) / M compression ratio.
    """
    def __init__(self, dimension: int = 128, m_subvectors: int = 16, k_centroids: int = 256, seed: int = 42):
        assert dimension % m_subvectors == 0, "Dimension must be divisible by m_subvectors"
        self.dimension = dimension
        self.m_subvectors = m_subvectors
        self.subvector_dim = dimension // m_subvectors
        self.k_centroids = k_centroids
        self.drift_offset = 0.0
        self.rng = random.Random(seed)
        
        # Codebooks: shape [m_subvectors][k_centroids][subvector_dim]
        self.codebooks: List[List[List[float]]] = []
        self._initialize_centroids()

    def _initialize_centroids(self) -> None:
        self.codebooks = []
        for _ in range(self.m_subvectors):
            sub_centroids: List[List[float]] = []
            for _ in range(self.k_centroids):
                centroid = [self.rng.gauss(0.0, 0.45) for _ in range(self.subvector_dim)]
                sub_centroids.append(centroid)
            self.codebooks.append(sub_centroids)

    def encode(self, vector: List[float]) -> List[int]:
        """Quantize continuous vector into M 1-byte Voronoi centroid indices."""
        codes = []
        for m in range(self.m_subvectors):
            sub_vec = vector[m * self.subvector_dim : (m + 1) * self.subvector_dim]
            best_idx = 0
            best_dist = float("inf")
            for c_idx, centroid in enumerate(self.codebooks[m]):
                dist = sum((sub_vec[d] - (centroid[d] + self.drift_offset)) ** 2 for d in range(self.subvector_dim))
                if dist < best_dist:
                    best_dist = dist
                    best_idx = c_idx
            codes.append(best_idx)
        return codes

    def compute_adc_lookup_table(self, query_vector: List[float]) -> List[List[float]]:
        """
        Asymmetric Distance Computation (ADC): Precalculates squared distance
        between query sub-vectors and all 256 centroids for instantaneous search lookups.
        """
        lut: List[List[float]] = []
        for m in range(self.m_subvectors):
            sub_query = query_vector[m * self.subvector_dim : (m + 1) * self.subvector_dim]
            sub_table: List[float] = []
            for centroid in self.codebooks[m]:
                d_sq = sum((sub_query[d] - (centroid[d] + self.drift_offset)) ** 2 for d in range(self.subvector_dim))
                sub_table.append(d_sq)
            lut.append(sub_table)
        return lut

    def adc_distance(self, lut: List[List[float]], quantized_code: List[int]) -> float:
        """Sum lookup table values: O(M) additions, 0 multiplications."""
        sum_sq = sum(lut[m][quantized_code[m]] for m in range(self.m_subvectors))
        return math.sqrt(sum_sq)


# ==============================================================================
# HIERARCHICAL NAVIGABLE SMALL WORLD (HNSW) GRAPH ENGINE
# ==============================================================================

class HNSWGraph:
    """
    Multi-layer navigable graph with probabilistic skip-list hierarchy.
    Layer 0 contains all nodes; higher layers act as expressways with exponentially
    decaying density governed by scale factor mL = 1 / ln(M).
    """
    def __init__(self, dimension: int = 128, m_max: int = 16, m_max_0: int = 32, ef_construction: int = 64, ef_search: int = 64, seed: int = 1337):
        self.dimension = dimension
        self.m_max = m_max
        self.m_max_0 = m_max_0
        self.ef_construction = ef_construction
        self.ef_search = ef_search
        self.m_l = 1.0 / math.log(m_max)
        self.entry_point_id: Optional[int] = None
        self.max_layer: int = 0
        self.rng = random.Random(seed)

        # Graph node state: id -> dict
        self.vectors: Dict[int, List[float]] = {}
        self.levels: Dict[int, int] = {}
        # edges[layer][node_id] = list of neighbor node_ids
        self.edges: List[Dict[int, List[int]]] = [{} for _ in range(8)]
        self.pq = ProductQuantizer(dimension=dimension, m_subvectors=16, k_centroids=256)
        self.quantized_codes: Dict[int, List[int]] = {}

    def _assign_random_level(self) -> int:
        uniform_sample = max(1e-9, self.rng.random())
        level = int(-math.log(uniform_sample) * self.m_l)
        return min(level, len(self.edges) - 1)

    def insert(self, node_id: int, vector: List[float]) -> None:
        """Insert a vector into the multi-layer HNSW topology."""
        self.vectors[node_id] = vector
        self.quantized_codes[node_id] = self.pq.encode(vector)
        target_level = self._assign_random_level()
        self.levels[node_id] = target_level

        for l in range(target_level + 1):
            if node_id not in self.edges[l]:
                self.edges[l][node_id] = []

        if self.entry_point_id is None:
            self.entry_point_id = node_id
            self.max_layer = target_level
            return

        curr_obj = self.entry_point_id
        curr_dist = l2_distance(vector, self.vectors[curr_obj])

        # Step 1: Greedily navigate down from max_layer to target_level + 1
        for l in range(self.max_layer, target_level, -1):
            changed = True
            while changed:
                changed = False
                neighbors = self.edges[l].get(curr_obj, [])
                for n_id in neighbors:
                    d = l2_distance(vector, self.vectors[n_id])
                    if d < curr_dist:
                        curr_dist = d
                        curr_obj = n_id
                        changed = True

        # Step 2: From target_level down to layer 0, connect to top neighbors
        for l in range(min(target_level, self.max_layer), -1, -1):
            # Beam search on layer l
            candidates = [(curr_dist, curr_obj)]
            visited = {curr_obj}
            w_set = [(curr_dist, curr_obj)]

            while candidates:
                candidates.sort(key=lambda x: x[0])
                c_dist, c_id = candidates.pop(0)

                w_set.sort(key=lambda x: x[0])
                if c_dist > w_set[-1][0] and len(w_set) >= self.ef_construction:
                    break

                for n_id in self.edges[l].get(c_id, []):
                    if n_id not in visited:
                        visited.add(n_id)
                        d = l2_distance(vector, self.vectors[n_id])
                        w_set.sort(key=lambda x: x[0])
                        if d < w_set[-1][0] or len(w_set) < self.ef_construction:
                            candidates.append((d, n_id))
                            w_set.append((d, n_id))
                            if len(w_set) > self.ef_construction:
                                w_set.sort(key=lambda x: x[0])
                                w_set.pop()

            # Select neighbors enforcing M bounds
            max_deg = self.m_max_0 if l == 0 else self.m_max
            w_set.sort(key=lambda x: x[0])
            chosen = [nid for _, nid in w_set[:max_deg]]
            self.edges[l][node_id] = chosen

            for ch_id in chosen:
                if node_id not in self.edges[l][ch_id]:
                    self.edges[l][ch_id].append(node_id)
                    if len(self.edges[l][ch_id]) > max_deg:
                        # Prune furthest neighbor
                        self.edges[l][ch_id].sort(key=lambda x: l2_distance(self.vectors[ch_id], self.vectors[x]))
                        self.edges[l][ch_id].pop()

            curr_obj = w_set[0][1]
            curr_dist = w_set[0][0]

        if target_level > self.max_layer:
            self.max_layer = target_level
            self.entry_point_id = node_id

    def search_knn(self, query: List[float], k: int = 10, ef_search: Optional[int] = None) -> Tuple[List[Tuple[int, float]], int]:
        """Execute k-nearest neighbor approximate search."""
        ef = ef_search or self.ef_search
        if self.entry_point_id is None:
            return [], 0

        curr_obj = self.entry_point_id
        curr_dist = l2_distance(query, self.vectors[curr_obj])
        eval_count = 1

        # Zoom down expressways
        for l in range(self.max_layer, 0, -1):
            changed = True
            while changed:
                changed = False
                for n_id in self.edges[l].get(curr_obj, []):
                    eval_count += 1
                    d = l2_distance(query, self.vectors[n_id])
                    if d < curr_dist:
                        curr_dist = d
                        curr_obj = n_id
                        changed = True

        # Base layer search
        visited = {curr_obj}
        candidates = [(curr_dist, curr_obj)]
        w_set = [(curr_dist, curr_obj)]

        while candidates:
            candidates.sort(key=lambda x: x[0])
            c_dist, c_id = candidates.pop(0)

            w_set.sort(key=lambda x: x[0])
            if c_dist > w_set[-1][0] and len(w_set) >= ef:
                break

            for n_id in self.edges[0].get(c_id, []):
                if n_id not in visited:
                    visited.add(n_id)
                    eval_count += 1
                    d = l2_distance(query, self.vectors[n_id])
                    w_set.sort(key=lambda x: x[0])
                    if d < w_set[-1][0] or len(w_set) < ef:
                        candidates.append((d, n_id))
                        w_set.append((d, n_id))
                        if len(w_set) > ef:
                            w_set.sort(key=lambda x: x[0])
                            w_set.pop()

        w_set.sort(key=lambda x: x[0])
        return [(nid, round(dist, 4)) for dist, nid in w_set[:k]], eval_count

    def exact_brute_force_knn(self, query: List[float], k: int = 10) -> List[Tuple[int, float]]:
        """Exact ground truth L2 brute-force calculation."""
        all_dists = [(nid, l2_distance(query, vec)) for nid, vec in self.vectors.items()]
        all_dists.sort(key=lambda x: x[1])
        return [(nid, round(d, 4)) for nid, d in all_dists[:k]]


# ==============================================================================
# SYNTHETIC CORPORA GENERATOR & GLOBAL SINGLETON
# ==============================================================================

class SyntheticCorporaManager:
    PARTITIONS = {
        "CORPUS-PARTITION-ALPHA": {
            "name": "CORPUS-PARTITION-ALPHA (DENSE-768D-EMBEDDINGS)",
            "dim": 128,
            "dist": "Dense Gaussian",
            "total_vectors": 128000,
        },
        "CORPUS-PARTITION-BRAVO": {
            "name": "CORPUS-PARTITION-BRAVO (SPARSE-HYBRID-WEIGHTS)",
            "dim": 128,
            "dist": "Sparse Hybrid",
            "total_vectors": 256000,
        },
        "CORPUS-PARTITION-GAMMA": {
            "name": "CORPUS-PARTITION-GAMMA (NORMALIZED-UNIT-SPHERE)",
            "dim": 128,
            "dist": "Unit Hypersphere",
            "total_vectors": 96000,
        },
        "CORPUS-PARTITION-DELTA": {
            "name": "CORPUS-PARTITION-DELTA (QUANTIZED-INT8-CLUSTER)",
            "dim": 128,
            "dist": "Quantized Int8 Cluster",
            "total_vectors": 192000,
        },
    }

    def __init__(self):
        self.active_partition = "CORPUS-PARTITION-ALPHA"
        self.indices: Dict[str, HNSWGraph] = {}
        self._build_active_index()

    def _build_active_index(self) -> None:
        graph = HNSWGraph(dimension=128, m_max=16, m_max_0=32, ef_construction=64, ef_search=64)
        rng = random.Random(2026)
        
        # Populate initial seed vectors
        for i in range(150):
            vec = [rng.gauss(0.0, 1.0) for _ in range(128)]
            graph.insert(i, vec)
        self.indices[self.active_partition] = graph

    def get_index(self, partition: Optional[str] = None) -> HNSWGraph:
        p = partition or self.active_partition
        if p not in self.indices:
            self.indices[p] = HNSWGraph(dimension=128)
            rng = random.Random(999)
            for i in range(100):
                vec = [rng.gauss(0.0, 1.0) for _ in range(128)]
                self.indices[p].insert(i, vec)
        return self.indices[p]

corpora_manager = SyntheticCorporaManager()


# ==============================================================================
# FASTAPI SCHEMAS & ENDPOINTS
# ==============================================================================

class QueryRequest(BaseModel):
    query_vector: Optional[List[float]] = None
    k: int = Field(default=10, ge=1, le=100)
    ef_search: int = Field(default=64, ge=1, le=512)
    partition: Optional[str] = None

class MutationRequest(BaseModel):
    action: str = Field(..., description="Action: heavy_ingestion | centroid_drift | prune_links | recalibrate")
    batch_size: Optional[int] = 25
    drift_delta: Optional[float] = 0.08

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "HEALTHY_NOMINAL",
        "service": "GF-T3-215 Vector Index Engine",
        "engine_architecture": "HNSW Graph + Product Quantizer",
        "timestamp_epoch_ms": int(time.time() * 1000),
    }

@app.get("/api/v1/index/stats")
def get_index_stats(partition: Optional[str] = None):
    p = partition or corpora_manager.active_partition
    graph = corpora_manager.get_index(p)
    meta = corpora_manager.PARTITIONS.get(p, corpora_manager.PARTITIONS["CORPUS-PARTITION-ALPHA"])
    
    raw_bytes = len(graph.vectors) * graph.dimension * 4
    quantized_bytes = len(graph.vectors) * graph.pq.m_subvectors * 1
    compression_ratio = round(raw_bytes / max(1, quantized_bytes), 1)

    return {
        "partition_id": p,
        "partition_name": meta["name"],
        "dimension": graph.dimension,
        "total_indexed_vectors": len(graph.vectors),
        "target_corpus_vectors": meta["total_vectors"],
        "max_graph_layer": graph.max_layer,
        "m_max": graph.m_max,
        "m_max_0": graph.m_max_0,
        "ef_search": graph.ef_search,
        "compression_ratio": compression_ratio,
        "raw_memory_bytes": raw_bytes,
        "quantized_memory_bytes": quantized_bytes,
        "centroid_drift_offset": graph.pq.drift_offset,
    }

@app.post("/api/v1/search")
def search_index(req: QueryRequest):
    graph = corpora_manager.get_index(req.partition)
    
    if req.query_vector is None:
        rng = random.Random(time.time())
        query = [rng.gauss(0.0, 1.0) for _ in range(graph.dimension)]
    else:
        if len(req.query_vector) != graph.dimension:
            raise HTTPException(status_code=400, detail=f"Query dimension must be {graph.dimension}")
        query = req.query_vector

    start_time = time.perf_counter()
    ann_results, eval_count = graph.search_knn(query, k=req.k, ef_search=req.ef_search)
    latency_ms = round((time.perf_counter() - start_time) * 1000, 3)

    # Compute Ground Truth for Recall verification
    gt_results = graph.exact_brute_force_knn(query, k=req.k)
    ann_ids = {r[0] for r in ann_results}
    gt_ids = {r[0] for r in gt_results}
    overlap = len(ann_ids.intersection(gt_ids))
    recall_at_k = round((overlap / max(1, req.k)) * 100.0, 1)

    # Compute ADC distance for top hit
    lut = graph.pq.compute_adc_lookup_table(query)
    top_adc_distance = None
    if ann_results:
        top_id = ann_results[0][0]
        q_code = graph.quantized_codes.get(top_id)
        if q_code:
            top_adc_distance = round(graph.pq.adc_distance(lut, q_code), 4)

    return {
        "k": req.k,
        "ef_search": req.ef_search,
        "latency_ms": latency_ms,
        "evaluated_candidates": eval_count,
        "recall_at_k_percent": recall_at_k,
        "ann_results": [{"id": nid, "distance": dist} for nid, dist in ann_results],
        "ground_truth_results": [{"id": nid, "distance": dist} for nid, dist in gt_results],
        "top_adc_distance": top_adc_distance,
    }

@app.post("/api/v1/mutate")
def mutate_index(req: MutationRequest):
    graph = corpora_manager.get_index()
    if req.action == "heavy_ingestion":
        batch = req.batch_size or 25
        curr_max = max(graph.vectors.keys(), default=0)
        rng = random.Random()
        for i in range(1, batch + 1):
            vec = [rng.gauss(0.0, 1.0) for _ in range(graph.dimension)]
            graph.insert(curr_max + i, vec)
        return {"action": "heavy_ingestion", "inserted": batch, "new_total": len(graph.vectors)}

    elif req.action == "centroid_drift":
        delta = req.drift_delta or 0.08
        graph.pq.drift_offset += delta
        return {"action": "centroid_drift", "drift_offset": round(graph.pq.drift_offset, 4)}

    elif req.action == "recalibrate":
        graph.pq.drift_offset = 0.0
        return {"action": "recalibrate", "drift_offset": 0.0}

    elif req.action == "prune_links":
        pruned_count = 0
        for l in range(len(graph.edges)):
            for nid in graph.edges[l]:
                current_deg = len(graph.edges[l][nid])
                target = int(current_deg * 0.75)
                if target < current_deg:
                    pruned_count += current_deg - target
                    graph.edges[l][nid] = graph.edges[l][nid][:target]
        return {"action": "prune_links", "pruned_edges": pruned_count}

    else:
        raise HTTPException(status_code=400, detail="Unknown mutation action")
