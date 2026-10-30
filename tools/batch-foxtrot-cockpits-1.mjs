/**
 * Batch Foxtrot Cockpits — Part 1: Units #446 to #450 (AI & ML Infrastructure)
 * AI inference latency, Vector DB query, Context window pressure, Model throughput, GPU cluster utilization
 */

export const AI_ML_COCKPITS = [
  // UNIT #446: AI Inference Latency Monitor
  {
    num: 446,
    folder: '01-ai-inference-latency',
    id: 'GF-T2-AI-01',
    name: 'AI-INFERENCE-MONITOR',
    subtitle: 'Time-To-First-Token (TTFT) & Speculative Decoding Scope',
    accent: '#00F0FF',
    componentName: 'AiInferenceLatencyCockpit',
    metric1: { label: 'TIME-TO-FIRST-TOKEN', value: '18.4', unit: 'ms', sub: 'SPECULATIVE ACCEPT: 88%', color: '#00F0FF' },
    metric2: { label: 'INTER-TOKEN LATENCY', value: '4.2', unit: 'ms/t', sub: '238 TOKENS/SEC PER STREAM', color: '#FF9F0A' },
    svgType: 'inference_wave',
    items: [
      { id: 'MODEL-GEMINI-FLASH', ttft: '14.2ms', itl: '3.8ms', speculative: '92%', ctxSize: '128k', status: 'ACCELERATED' },
      { id: 'MODEL-LLAMA3-70B', ttft: '32.1ms', itl: '8.4ms', speculative: '84%', ctxSize: '32k', status: 'OPTIMAL' },
      { id: 'MODEL-DEEPSEEK-R1', ttft: '28.9ms', itl: '6.9ms', speculative: '86%', ctxSize: '64k', status: 'OPTIMAL' },
      { id: 'MODEL-CLAUDE-3.5', ttft: '22.0ms', itl: '5.1ms', speculative: '89%', ctxSize: '200k', status: 'ACCELERATED' },
      { id: 'MODEL-MISTRAL-NEMO', ttft: '12.8ms', itl: '3.2ms', speculative: '94%', ctxSize: '128k', status: 'ACCELERATED' }
    ]
  },

  // UNIT #447: Vector Database Query Visualizer
  {
    num: 447,
    folder: '02-vector-db-visualizer',
    id: 'GF-T2-VEC-02',
    name: 'VECTOR-QUERY-VISUALIZER',
    subtitle: 'HNSW Approximate Nearest Neighbor (ANN) Spatial Radar',
    accent: '#FF9F0A',
    componentName: 'VectorDbVisualizerCockpit',
    metric1: { label: 'ANN SEARCH LATENCY', value: '1.42', unit: 'ms', sub: 'RECALL@10: 99.4%', color: '#FF9F0A' },
    metric2: { label: 'INDEXED VECTORS COUNT', value: '14.2', unit: 'M VECS', sub: '1536-DIM COSINE HNSW', color: '#00F0FF' },
    svgType: 'vector_space',
    items: [
      { id: 'NS-FLEET-CATALOG', dim: '1536-d', topK: 10, distance: 'Cosine', searchLat: '1.1ms', status: 'IN_MEMORY' },
      { id: 'NS-SHOWROOM-DOCS', dim: '1536-d', topK: 5, distance: 'Cosine', searchLat: '0.8ms', status: 'IN_MEMORY' },
      { id: 'NS-CODE-CHUNKS', dim: '768-d', topK: 20, distance: 'DotProduct', searchLat: '1.6ms', status: 'IN_MEMORY' },
      { id: 'NS-LEGAL-APA-INDEX', dim: '1536-d', topK: 10, distance: 'Cosine', searchLat: '1.2ms', status: 'IN_MEMORY' },
      { id: 'NS-TELEMETRY-SIGNALS', dim: '256-d', topK: 50, distance: 'Euclidean', searchLat: '0.6ms', status: 'IN_MEMORY' }
    ]
  },

  // UNIT #448: Token Context Window Pressure Gauge
  {
    num: 448,
    folder: '03-context-window-pressure',
    id: 'GF-T2-CTX-03',
    name: 'CONTEXT-PRESSURE-GAUGE',
    subtitle: 'KV-Cache Memory Saturation & 1M-Token Context Horizon',
    accent: '#00F0FF',
    componentName: 'ContextWindowPressureCockpit',
    metric1: { label: 'ACTIVE CONTEXT WINDOW', value: '384', unit: 'k tokens', sub: 'SATURATION: 38.4%', color: '#00F0FF' },
    metric2: { label: 'PAGED-ATTENTION VRAM', value: '14.8', unit: 'GB', sub: 'FRAGMENTATION: 1.2%', color: '#FF9F0A' },
    svgType: 'context_gauge',
    items: [
      { id: 'SESSION-AGENT-01', promptLen: '124,000', kvCacheMb: '4,820 MB', pagedBlocks: 380, status: 'STABLE' },
      { id: 'SESSION-AGENT-02', promptLen: '84,000', kvCacheMb: '3,210 MB', pagedBlocks: 260, status: 'STABLE' },
      { id: 'SESSION-AGENT-03', promptLen: '62,000', kvCacheMb: '2,400 MB', pagedBlocks: 195, status: 'STABLE' },
      { id: 'SESSION-AGENT-04', promptLen: '48,000', kvCacheMb: '1,890 MB', pagedBlocks: 150, status: 'STABLE' },
      { id: 'SESSION-AGENT-05', promptLen: '24,000', kvCacheMb: '940 MB', pagedBlocks: 75, status: 'STABLE' }
    ]
  },

  // UNIT #449: Model Throughput Tokens-Per-Second Dial
  {
    num: 449,
    folder: '04-model-throughput-dial',
    id: 'GF-T2-TPUT-04',
    name: 'MODEL-THROUGHPUT-DIAL',
    subtitle: 'vLLM Continuous Batching Tokens-Per-Second Tachometer',
    accent: '#FF9F0A',
    componentName: 'ModelThroughputDialCockpit',
    metric1: { label: 'AGGREGATE GENERATION', value: '4,820', unit: 'tokens/s', sub: 'CONCURRENT STREAMS: 128', color: '#FF9F0A' },
    metric2: { label: 'BATCH COMPACT RATIO', value: '98.6', unit: '%', sub: 'PREEMPTION: 0.00%', color: '#00F0FF' },
    svgType: 'throughput_tachometer',
    items: [
      { id: 'ENGINE-NODE-01', tps: '1,240 t/s', batchSize: 32, gpuMemUtil: '88%', status: 'OPTIMAL' },
      { id: 'ENGINE-NODE-02', tps: '1,220 t/s', batchSize: 32, gpuMemUtil: '87%', status: 'OPTIMAL' },
      { id: 'ENGINE-NODE-03', tps: '1,190 t/s', batchSize: 32, gpuMemUtil: '89%', status: 'OPTIMAL' },
      { id: 'ENGINE-NODE-04', tps: '1,170 t/s', batchSize: 32, gpuMemUtil: '86%', status: 'OPTIMAL' },
      { id: 'ENGINE-STANDBY-05', tps: '0 t/s (WARM)', batchSize: 0, gpuMemUtil: '42%', status: 'STANDBY' }
    ]
  },

  // UNIT #450: GPU Compute Cluster Utilization Board
  {
    num: 450,
    folder: '05-gpu-cluster-utilization',
    id: 'GF-T2-GPU-05',
    name: 'GPU-CLUSTER-UTILIZATION',
    subtitle: 'NVIDIA H100 / A100 Tensor Core & VRAM Thermal Board',
    accent: '#00F0FF',
    componentName: 'GpuClusterUtilizationCockpit',
    metric1: { label: 'TENSOR CORE LOAD', value: '94.2', unit: '%', sub: 'FP8 / FP16 ACCEL', color: '#00F0FF' },
    metric2: { label: 'CLUSTER MEAN TEMP', value: '58.4', unit: '°C', sub: 'FAN SPEED: 64% (QUIET)', color: '#FF9F0A' },
    svgType: 'gpu_thermal_grid',
    items: [
      { id: 'GPU-H100-NODE-1A', util: '96%', vramUsed: '76/80 GB', temp: '59°C', power: '480W', status: 'HEALTHY' },
      { id: 'GPU-H100-NODE-1B', util: '95%', vramUsed: '75/80 GB', temp: '58°C', power: '475W', status: 'HEALTHY' },
      { id: 'GPU-H100-NODE-2A', util: '93%', vramUsed: '74/80 GB', temp: '57°C', power: '465W', status: 'HEALTHY' },
      { id: 'GPU-H100-NODE-2B', util: '94%', vramUsed: '76/80 GB', temp: '59°C', power: '478W', status: 'HEALTHY' },
      { id: 'GPU-A100-NODE-3A', util: '91%', vramUsed: '78/80 GB', temp: '62°C', power: '380W', status: 'HEALTHY' }
    ]
  }
];
