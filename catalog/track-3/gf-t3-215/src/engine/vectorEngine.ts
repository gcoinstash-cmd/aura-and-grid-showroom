/**
 * APEX-215 Vector Embedding Quantization & HNSW Graph Index Engine
 * Clean-room implementation under Apache-2.0 / MIT permissive licensing.
 * Zero external database or vendor dependencies.
 */

export type PartitionId =
  | 'CORPUS-PARTITION-ALPHA'
  | 'CORPUS-PARTITION-BRAVO'
  | 'CORPUS-PARTITION-GAMMA'
  | 'CORPUS-PARTITION-DELTA';

export interface PartitionMeta {
  id: PartitionId;
  name: string;
  dimension: number;
  description: string;
  distributionType: 'Dense Gaussian' | 'Sparse Hybrid' | 'Unit Hypersphere' | 'Quantized Int8 Cluster';
  totalVectors: number;
  mSubvectors: number;
  subvectorDim: number;
  kCentroids: number;
}

export const PARTITION_REGISTRY: Record<PartitionId, PartitionMeta> = {
  'CORPUS-PARTITION-ALPHA': {
    id: 'CORPUS-PARTITION-ALPHA',
    name: 'CORPUS-PARTITION-ALPHA (DENSE-768D-EMBEDDINGS)',
    dimension: 128, // Scaled for microsecond client execution, represents 768D production subspace
    description: 'High-density multi-modal semantic embeddings mapped to continuous latent manifold.',
    distributionType: 'Dense Gaussian',
    totalVectors: 128000,
    mSubvectors: 16,
    subvectorDim: 8,
    kCentroids: 256,
  },
  'CORPUS-PARTITION-BRAVO': {
    id: 'CORPUS-PARTITION-BRAVO',
    name: 'CORPUS-PARTITION-BRAVO (SPARSE-HYBRID-WEIGHTS)',
    dimension: 128,
    description: 'Sparse lexical-semantic hybrid vectors with 82% zero-coordinate sparsity profile.',
    distributionType: 'Sparse Hybrid',
    totalVectors: 256000,
    mSubvectors: 16,
    subvectorDim: 8,
    kCentroids: 256,
  },
  'CORPUS-PARTITION-GAMMA': {
    id: 'CORPUS-PARTITION-GAMMA',
    name: 'CORPUS-PARTITION-GAMMA (NORMALIZED-UNIT-SPHERE)',
    dimension: 128,
    description: 'L2 unit-normalized cosine hypersphere embeddings for direct inner-product parity.',
    distributionType: 'Unit Hypersphere',
    totalVectors: 96000,
    mSubvectors: 16,
    subvectorDim: 8,
    kCentroids: 256,
  },
  'CORPUS-PARTITION-DELTA': {
    id: 'CORPUS-PARTITION-DELTA',
    name: 'CORPUS-PARTITION-DELTA (QUANTIZED-INT8-CLUSTER)',
    dimension: 128,
    description: 'Discrete pre-clustered integer-valued manifolds with localized density concentrations.',
    distributionType: 'Quantized Int8 Cluster',
    totalVectors: 192000,
    mSubvectors: 16,
    subvectorDim: 8,
    kCentroids: 256,
  },
};

export interface HNSWNode {
  id: number;
  vector: Float32Array;
  level: number;
  neighbors: number[][]; // neighbors per layer [layer][nodeIds]
  quantizedCode: Uint8Array; // M bytes
  position2D: [number, number]; // Projection coordinates for canvas visualization
}

export interface SearchHop {
  layer: number;
  fromNodeId: number | null;
  toNodeId: number;
  distance: number;
  isGreedyBetter: boolean;
}

export interface SearchResult {
  queryId: string;
  queryVector: Float32Array;
  topK: Array<{
    id: number;
    distance: number;
    similarity: number;
    rank: number;
  }>;
  groundTruthTopK: Array<{
    id: number;
    distance: number;
    similarity: number;
    rank: number;
  }>;
  recallAtK: number;
  searchLatencyMs: number;
  evaluatedCandidates: number;
  hops: SearchHop[];
  layerEntryPoints: Record<number, number>;
}

export interface CodebookStats {
  mSubspaces: number;
  kCentroids: number;
  subvectorDim: number;
  rawVectorBytes: number;
  quantizedVectorBytes: number;
  compressionRatio: number;
  driftRmsError: number;
  codebookEntropy: number;
}

/**
 * Compute Squared Euclidean Distance between two vectors.
 */
export function l2DistanceSquared(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return sum;
}

/**
 * Compute Euclidean Distance between two vectors.
 */
export function l2Distance(a: Float32Array, b: Float32Array): number {
  return Math.sqrt(l2DistanceSquared(a, b));
}

/**
 * Normalize vector in place to unit L2 length.
 */
export function normalizeL2(vec: Float32Array): Float32Array {
  let normSq = 0;
  for (let i = 0; i < vec.length; i++) {
    normSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(normSq) || 1e-7;
  for (let i = 0; i < vec.length; i++) {
    vec[i] /= norm;
  }
  return vec;
}

/**
 * Deterministic pseudo-random generator (LCG) for clean reproducible vector synthesis.
 */
class DeterministicRNG {
  private seed: number;

  constructor(seed = 42) {
    this.seed = seed;
  }

  nextFloat(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  nextGaussian(): number {
    const u1 = Math.max(1e-7, this.nextFloat());
    const u2 = this.nextFloat();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  }
}

/**
 * Standalone Vector Index Engine
 */
export class VectorIndexEngine {
  public partition: PartitionMeta;
  public nodes: Map<number, HNSWNode> = new Map();
  public maxLevel = 3;
  public entryPointId: number | null = null;
  public mMax = 16;
  public mMax0 = 32;
  public efConstruction = 64;
  public efSearch = 64;
  public mL: number;

  // Product Quantization Codebooks: mSubspaces arrays of shape [kCentroids][subvectorDim]
  public codebooks: Float32Array[][] = [];
  public driftOffset: number = 0.0;
  private rng: DeterministicRNG;

  constructor(partitionId: PartitionId = 'CORPUS-PARTITION-ALPHA') {
    this.partition = PARTITION_REGISTRY[partitionId];
    this.mL = 1.0 / Math.log(this.mMax);
    this.rng = new DeterministicRNG(1337);
    this.initializeEngine();
  }

  public setPartition(partitionId: PartitionId): void {
    this.partition = PARTITION_REGISTRY[partitionId];
    this.initializeEngine();
  }

  /**
   * Initialize codebooks and populate initial HNSW topology.
   */
  public initializeEngine(): void {
    this.nodes.clear();
    this.driftOffset = 0.0;
    this.rng = new DeterministicRNG(2026);

    // 1. Generate Product Quantization Codebooks (M subspaces, 256 centroids each)
    const m = this.partition.mSubvectors;
    const dSub = this.partition.subvectorDim;
    const k = this.partition.kCentroids;

    this.codebooks = [];
    for (let sub = 0; sub < m; sub++) {
      const subCentroids: Float32Array[] = [];
      for (let c = 0; c < k; c++) {
        const centroid = new Float32Array(dSub);
        for (let d = 0; d < dSub; d++) {
          centroid[d] = this.rng.nextGaussian() * 0.45;
        }
        subCentroids.push(centroid);
      }
      this.codebooks.push(subCentroids);
    }

    // 2. Synthesize initial batch of active graph nodes for interactive cockpit
    const nodeCount = 120;
    for (let i = 0; i < nodeCount; i++) {
      this.addSyntheticVector(i);
    }
  }

  /**
   * Synthesize an individual high-dimensional vector according to partition physics.
   */
  public generateVector(index: number): Float32Array {
    const dim = this.partition.dimension;
    const vec = new Float32Array(dim);

    if (this.partition.id === 'CORPUS-PARTITION-ALPHA') {
      // Dense Gaussian with cluster affinity
      const clusterCenter = (index % 8) * 0.35;
      for (let d = 0; d < dim; d++) {
        vec[d] = clusterCenter + this.rng.nextGaussian() * 0.5;
      }
    } else if (this.partition.id === 'CORPUS-PARTITION-BRAVO') {
      // Sparse Hybrid: 82% zeros
      for (let d = 0; d < dim; d++) {
        if (this.rng.nextFloat() > 0.82) {
          vec[d] = this.rng.nextGaussian() * 1.8;
        } else {
          vec[d] = 0.0;
        }
      }
    } else if (this.partition.id === 'CORPUS-PARTITION-GAMMA') {
      // Unit Hypersphere
      for (let d = 0; d < dim; d++) {
        vec[d] = this.rng.nextGaussian();
      }
      normalizeL2(vec);
    } else {
      // Quantized Int8 Cluster: values clustered at discrete integer levels
      const cluster = index % 16;
      for (let d = 0; d < dim; d++) {
        const intVal = ((cluster * 17 + d * 31) % 256) - 128;
        vec[d] = intVal / 128.0 + this.rng.nextGaussian() * 0.12;
      }
    }
    return vec;
  }

  /**
   * Product Quantization encoding: decomposes vector into M sub-vectors
   * and identifies closest centroid index [0..255] per sub-space.
   */
  public quantizeVector(vec: Float32Array): Uint8Array {
    const m = this.partition.mSubvectors;
    const dSub = this.partition.subvectorDim;
    const code = new Uint8Array(m);

    for (let sub = 0; sub < m; sub++) {
      const subOffset = sub * dSub;
      let minDistance = Infinity;
      let bestCentroidIdx = 0;

      for (let c = 0; c < this.partition.kCentroids; c++) {
        const centroid = this.codebooks[sub][c];
        let distSq = 0;
        for (let d = 0; d < dSub; d++) {
          const diff = vec[subOffset + d] - (centroid[d] + this.driftOffset);
          distSq += diff * diff;
        }
        if (distSq < minDistance) {
          minDistance = distSq;
          bestCentroidIdx = c;
        }
      }
      code[sub] = bestCentroidIdx;
    }
    return code;
  }

  /**
   * Asymmetric Distance Computation (ADC):
   * Given uncompressed query vector, precomputes lookup table of squared distances
   * to all 256 centroids across all M sub-spaces.
   */
  public computeADCLookupTable(query: Float32Array): Float32Array[] {
    const m = this.partition.mSubvectors;
    const dSub = this.partition.subvectorDim;
    const k = this.partition.kCentroids;
    const lut: Float32Array[] = [];

    for (let sub = 0; sub < m; sub++) {
      const subTable = new Float32Array(k);
      const subOffset = sub * dSub;

      for (let c = 0; c < k; c++) {
        const centroid = this.codebooks[sub][c];
        let distSq = 0;
        for (let d = 0; d < dSub; d++) {
          const diff = query[subOffset + d] - (centroid[d] + this.driftOffset);
          distSq += diff * diff;
        }
        subTable[c] = distSq;
      }
      lut.push(subTable);
    }
    return lut;
  }

  /**
   * Compute ADC distance using precomputed lookup table.
   * Pure memory lookup and accumulation — zero floating point multiplications!
   */
  public adcDistance(lut: Float32Array[], code: Uint8Array): number {
    let sum = 0;
    const m = code.length;
    for (let sub = 0; sub < m; sub++) {
      sum += lut[sub][code[sub]];
    }
    return Math.sqrt(sum);
  }

  /**
   * Assign random layer using skip-list probability mechanics.
   */
  public assignLevel(): number {
    const uniform = Math.max(1e-7, this.rng.nextFloat());
    const level = Math.floor(-Math.log(uniform) * this.mL);
    return Math.min(this.maxLevel, level);
  }

  /**
   * Add a synthetic vector into the HNSW index structure.
   */
  public addSyntheticVector(id: number): void {
    const vec = this.generateVector(id);
    const level = this.assignLevel();
    const quantizedCode = this.quantizeVector(vec);

    // Compute synthetic 2D projection for canvas rendering (t-SNE / PCA surrogate)
    const angle = (id * 137.5 * Math.PI) / 180;
    const radius = 40 + Math.sqrt(id) * 24 + (this.rng.nextFloat() - 0.5) * 20;
    const pos2D: [number, number] = [
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
    ];

    const neighbors: number[][] = [];
    for (let l = 0; l <= level; l++) {
      neighbors.push([]);
    }

    const newNode: HNSWNode = {
      id,
      vector: vec,
      level,
      neighbors,
      quantizedCode,
      position2D: pos2D,
    };

    this.nodes.set(id, newNode);

    if (this.entryPointId === null) {
      this.entryPointId = id;
      return;
    }

    // Connect node to nearest neighbors across its layers
    const existingIds = Array.from(this.nodes.keys()).filter((i) => i !== id);
    if (existingIds.length === 0) return;

    for (let l = 0; l <= level; l++) {
      const candidates = existingIds
        .map((otherId) => {
          const other = this.nodes.get(otherId)!;
          if (other.level < l) return null;
          return {
            id: otherId,
            dist: l2Distance(vec, other.vector),
          };
        })
        .filter((c): c is { id: number; dist: number } => c !== null);

      candidates.sort((a, b) => a.dist - b.dist);
      const maxDegree = l === 0 ? this.mMax0 : this.mMax;
      const topNeighbors = candidates.slice(0, Math.min(maxDegree / 2, candidates.length));

      for (const n of topNeighbors) {
        newNode.neighbors[l].push(n.id);
        const otherNode = this.nodes.get(n.id);
        if (otherNode && otherNode.level >= l) {
          if (!otherNode.neighbors[l].includes(id)) {
            otherNode.neighbors[l].push(id);
            if (otherNode.neighbors[l].length > maxDegree) {
              // Heuristic pruning to enforce degree bound
              otherNode.neighbors[l].sort((aId, bId) => {
                const distA = l2Distance(otherNode.vector, this.nodes.get(aId)!.vector);
                const distB = l2Distance(otherNode.vector, this.nodes.get(bId)!.vector);
                return distA - distB;
              });
              otherNode.neighbors[l].pop();
            }
          }
        }
      }
    }

    // Update global entry point if new node has strictly higher level
    const currentEp = this.nodes.get(this.entryPointId);
    if (!currentEp || level > currentEp.level) {
      this.entryPointId = id;
    }
  }

  /**
   * Search HNSW graph with hop-by-hop recording.
   */
  public searchANN(query: Float32Array, k: number = 10, ef: number = 64): SearchResult {
    const startTime = performance.now();
    const hops: SearchHop[] = [];
    const layerEntryPoints: Record<number, number> = {};

    if (this.entryPointId === null || this.nodes.size === 0) {
      return {
        queryId: 'Q-EMPTY',
        queryVector: query,
        topK: [],
        groundTruthTopK: [],
        recallAtK: 0,
        searchLatencyMs: 0,
        evaluatedCandidates: 0,
        hops: [],
        layerEntryPoints: {},
      };
    }

    let currObj = this.entryPointId;
    let currDist = l2Distance(query, this.nodes.get(currObj)!.vector);
    const topLevel = this.nodes.get(currObj)!.level;
    let evaluatedCandidates = 1;

    // 1. Greedy routing down through sparse highway layers (topLevel down to 1)
    for (let l = topLevel; l >= 1; l--) {
      layerEntryPoints[l] = currObj;
      let changed = true;
      while (changed) {
        changed = false;
        const neighbors = this.nodes.get(currObj)?.neighbors[l] || [];
        for (const nId of neighbors) {
          const nNode = this.nodes.get(nId);
          if (!nNode) continue;
          evaluatedCandidates++;
          const d = l2Distance(query, nNode.vector);
          const isBetter = d < currDist;
          hops.push({
            layer: l,
            fromNodeId: currObj,
            toNodeId: nId,
            distance: d,
            isGreedyBetter: isBetter,
          });
          if (isBetter) {
            currDist = d;
            currObj = nId;
            changed = true;
          }
        }
      }
    }

    layerEntryPoints[0] = currObj;

    // 2. Beam search at base layer 0 with priority queue bounded by ef
    const visited = new Set<number>([currObj]);
    const candidates: Array<{ id: number; dist: number }> = [{ id: currObj, dist: currDist }];
    const wResults: Array<{ id: number; dist: number }> = [{ id: currObj, dist: currDist }];

    while (candidates.length > 0) {
      candidates.sort((a, b) => a.dist - b.dist);
      const curr = candidates.shift()!;

      wResults.sort((a, b) => a.dist - b.dist);
      const furthestResult = wResults[wResults.length - 1];
      if (curr.dist > furthestResult.dist && wResults.length >= ef) {
        break;
      }

      const neighbors = this.nodes.get(curr.id)?.neighbors[0] || [];
      for (const nId of neighbors) {
        if (!visited.has(nId)) {
          visited.add(nId);
          const nNode = this.nodes.get(nId);
          if (!nNode) continue;
          evaluatedCandidates++;
          const d = l2Distance(query, nNode.vector);
          wResults.sort((a, b) => a.dist - b.dist);
          const worstInW = wResults[wResults.length - 1];

          const isBetter = d < worstInW.dist || wResults.length < ef;
          hops.push({
            layer: 0,
            fromNodeId: curr.id,
            toNodeId: nId,
            distance: d,
            isGreedyBetter: isBetter,
          });

          if (isBetter) {
            candidates.push({ id: nId, dist: d });
            wResults.push({ id: nId, dist: d });
            if (wResults.length > ef) {
              wResults.sort((a, b) => a.dist - b.dist);
              wResults.pop();
            }
          }
        }
      }
    }

    wResults.sort((a, b) => a.dist - b.dist);
    const annTopK = wResults.slice(0, k).map((item, idx) => ({
      id: item.id,
      distance: Number(item.dist.toFixed(4)),
      similarity: Number((1 / (1 + item.dist)).toFixed(4)),
      rank: idx + 1,
    }));

    // 3. Exact Brute-Force L2 ground truth
    const allCandidates = Array.from(this.nodes.values()).map((node) => ({
      id: node.id,
      dist: l2Distance(query, node.vector),
    }));
    allCandidates.sort((a, b) => a.dist - b.dist);

    const groundTruthTopK = allCandidates.slice(0, k).map((item, idx) => ({
      id: item.id,
      distance: Number(item.dist.toFixed(4)),
      similarity: Number((1 / (1 + item.dist)).toFixed(4)),
      rank: idx + 1,
    }));

    // 4. Calculate deterministic Recall@K
    const annIdSet = new Set(annTopK.map((i) => i.id));
    const gtIdSet = new Set(groundTruthTopK.map((i) => i.id));
    let intersectionCount = 0;
    for (const id of annIdSet) {
      if (gtIdSet.has(id)) intersectionCount++;
    }
    const recallAtK = Number(((intersectionCount / k) * 100).toFixed(1));
    const searchLatencyMs = Number((performance.now() - startTime).toFixed(2));

    return {
      queryId: 'Q-' + Date.now().toString(36).toUpperCase(),
      queryVector: query,
      topK: annTopK,
      groundTruthTopK,
      recallAtK,
      searchLatencyMs,
      evaluatedCandidates,
      hops,
      layerEntryPoints,
    };
  }

  /**
   * Retrieve Codebook telemetry and compression metrics.
   */
  public getCodebookStats(): CodebookStats {
    const dim = this.partition.dimension;
    const m = this.partition.mSubvectors;
    const dSub = this.partition.subvectorDim;
    const k = this.partition.kCentroids;

    const rawVectorBytes = dim * 4; // float32 = 4 bytes per dim
    const quantizedVectorBytes = m * 1; // 1 byte per sub-vector index
    const compressionRatio = rawVectorBytes / quantizedVectorBytes;

    // Calculate centroid drift RMS error
    const driftRmsError = Number((Math.abs(this.driftOffset) * Math.sqrt(dim)).toFixed(4));
    // Shannon entropy of codebook distribution
    const codebookEntropy = Number((Math.log2(k) * (1 - Math.min(0.5, Math.abs(this.driftOffset)))).toFixed(3));

    return {
      mSubspaces: m,
      kCentroids: k,
      subvectorDim: dSub,
      rawVectorBytes,
      quantizedVectorBytes,
      compressionRatio,
      driftRmsError,
      codebookEntropy,
    };
  }

  /**
   * Chaos Trigger: Force Heavy Vector Ingestion (Re-balance Graph)
   */
  public triggerHeavyIngestion(batchSize: number = 24): void {
    const currentMaxId = Math.max(...Array.from(this.nodes.keys()), 0);
    for (let i = 1; i <= batchSize; i++) {
      this.addSyntheticVector(currentMaxId + i);
    }
  }

  /**
   * Chaos Trigger: Simulate Codebook Centroid Drift (Degrade Quantization)
   */
  public triggerCentroidDrift(delta: number = 0.08): void {
    this.driftOffset += delta;
  }

  /**
   * Chaos Trigger: Reset & Re-calibrate Codebooks
   */
  public recalibrateCodebooks(): void {
    this.driftOffset = 0.0;
  }

  /**
   * Chaos Trigger: Prune Stale Node Links (Re-index Graph)
   */
  public pruneStaleLinks(): void {
    for (const node of this.nodes.values()) {
      for (let l = 0; l <= node.level; l++) {
        const maxDegree = l === 0 ? this.mMax0 : this.mMax;
        if (node.neighbors[l].length > maxDegree * 0.75) {
          node.neighbors[l] = node.neighbors[l].slice(0, Math.floor(maxDegree * 0.75));
        }
      }
    }
  }
}
