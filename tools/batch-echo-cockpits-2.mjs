/**
 * Batch Echo Cockpits — Part 2: Units #431 to #435 (Storage & Cache Consoles)
 * Cache hit/miss tachometer, Disk IOPS meter, Ephemeral storage tracker, Blob replication status, Storage egress throttle
 */

export const STORAGE_CACHE_COCKPITS = [
  // UNIT #431: Cache Hit/Miss Tachometer
  {
    num: 431,
    folder: '06-cache-tachometer',
    id: 'GF-T2-CACHE-06',
    name: 'CACHE-TACHOMETER',
    subtitle: 'Sub-Millisecond L1/L2 Cache Hit/Miss RPM Gauge',
    accent: '#FF9F0A',
    componentName: 'CacheTachometerCockpit',
    metric1: { label: 'GLOBAL CACHE HIT RATE', value: '99.82', unit: '%', sub: 'L1 HIT: 94.2% | L2: 5.6%', color: '#FF9F0A' },
    metric2: { label: 'CACHE QUERY RPM VELOCITY', value: '4.2', unit: 'M rpm', sub: 'P99 LATENCY: 0.18ms', color: '#00F0FF' },
    svgType: 'tachometer_arc',
    items: [
      { id: 'TIER-L1-RAM', hits: '3.9M/min', misses: '240k/min', ratio: '94.2%', avgLat: '0.04ms', status: 'OPTIMAL' },
      { id: 'TIER-L2-REDIS', hits: '235k/min', misses: '5k/min', ratio: '97.9%', avgLat: '0.42ms', status: 'OPTIMAL' },
      { id: 'TIER-L3-NVME', hits: '4.8k/min', misses: '200/min', ratio: '96.0%', avgLat: '1.2ms', status: 'HEALTHY' },
      { id: 'TIER-ORIGIN-DB', hits: '200/min', misses: '0/min', ratio: '100%', avgLat: '4.8ms', status: 'PROTECTED' },
      { id: 'TIER-CDN-EDGE', hits: '18.4M/min', misses: '42k/min', ratio: '99.8%', avgLat: '8.4ms', status: 'OPTIMAL' }
    ]
  },

  // UNIT #432: Disk IOPS Read/Write Meter
  {
    num: 432,
    folder: '07-disk-iops-meter',
    id: 'GF-T2-IOPS-07',
    name: 'DISK-IOPS-METER',
    subtitle: 'NVMe Direct I/O Read/Write Burst & Queue Depth Dyno',
    accent: '#00F0FF',
    componentName: 'DiskIopsMeterCockpit',
    metric1: { label: 'TOTAL NVME IOPS', value: '482,000', unit: 'IOPS', sub: 'READ: 320k | WRITE: 162k', color: '#00F0FF' },
    metric2: { label: 'I/O QUEUE DEPTH', value: '2.4', unit: 'QUEUED', sub: 'I/O WAIT: 0.01%', color: '#FF9F0A' },
    svgType: 'iops_bars',
    items: [
      { id: 'DRIVE-NVME-01', readIops: '84,000', writeIops: '42,000', throughput: '1.8 GB/s', waitMs: '0.12ms', status: 'HEALTHY' },
      { id: 'DRIVE-NVME-02', readIops: '82,000', writeIops: '41,000', throughput: '1.7 GB/s', waitMs: '0.11ms', status: 'HEALTHY' },
      { id: 'DRIVE-NVME-03', readIops: '78,000', writeIops: '39,000', throughput: '1.6 GB/s', waitMs: '0.14ms', status: 'HEALTHY' },
      { id: 'DRIVE-NVME-04', readIops: '76,000', writeIops: '40,000', throughput: '1.6 GB/s', waitMs: '0.13ms', status: 'HEALTHY' },
      { id: 'DRIVE-WAL-SSD', readIops: '12,000', writeIops: '48,000', throughput: '840 MB/s', waitMs: '0.08ms', status: 'LOW_LATENCY' }
    ]
  },

  // UNIT #433: Ephemeral Storage Tracker
  {
    num: 433,
    folder: '08-ephemeral-storage-tracker',
    id: 'GF-T2-STORAGE-08',
    name: 'EPHEMERAL-STORAGE-TRACKER',
    subtitle: 'Node Scratch Disk & EmptyDir Quota Saturation Horizon',
    accent: '#FF9F0A',
    componentName: 'EphemeralStorageTrackerCockpit',
    metric1: { label: 'EPHEMERAL QUOTA USAGE', value: '28.4', unit: '%', sub: 'HEADROOM: 1.4 TB', color: '#FF9F0A' },
    metric2: { label: 'CONTAINER EVICTION RISK', value: '0.00', unit: '%', sub: 'EMPTYDIR SAFE', color: '#00F0FF' },
    svgType: 'ephemeral_gauge',
    items: [
      { id: 'NODE-SCRATCH-01', used: '240 GB', quota: '1.0 TB', activePods: 32, evictionRisk: 'ZERO', status: 'OPTIMAL' },
      { id: 'NODE-SCRATCH-02', used: '310 GB', quota: '1.0 TB', activePods: 38, evictionRisk: 'ZERO', status: 'OPTIMAL' },
      { id: 'NODE-SCRATCH-03', used: '190 GB', quota: '1.0 TB', activePods: 24, evictionRisk: 'ZERO', status: 'OPTIMAL' },
      { id: 'NODE-SCRATCH-04', used: '280 GB', quota: '1.0 TB', activePods: 34, evictionRisk: 'ZERO', status: 'OPTIMAL' },
      { id: 'NODE-SCRATCH-05', used: '150 GB', quota: '1.0 TB', activePods: 18, evictionRisk: 'ZERO', status: 'OPTIMAL' }
    ]
  },

  // UNIT #434: Blob Replication Status
  {
    num: 434,
    folder: '09-blob-replication-status',
    id: 'GF-T2-REPL-09',
    name: 'BLOB-REPLICATION-STATUS',
    subtitle: 'Cross-Region Object Sync & Conflict Resolution HUD',
    accent: '#00F0FF',
    componentName: 'BlobReplicationStatusCockpit',
    metric1: { label: 'CROSS-REGION SYNC RATIO', value: '99.99', unit: '%', sub: 'CONFLICTS: 0 RESOLVED', color: '#00F0FF' },
    metric2: { label: 'REPLICATION LAG MEAN', value: '140', unit: 'ms', sub: 'P99 DRIFT: 280ms', color: '#FF9F0A' },
    svgType: 'repl_flow',
    items: [
      { id: 'PAIR:us-east-1 -> eu-central-1', throughput: '4.8 GB/s', lagMs: '120ms', queue: '12 items', status: 'IN_SYNC' },
      { id: 'PAIR:us-east-1 -> ap-northeast-1', throughput: '3.9 GB/s', lagMs: '160ms', queue: '18 items', status: 'IN_SYNC' },
      { id: 'PAIR:eu-central-1 -> sa-east-1', throughput: '1.8 GB/s', lagMs: '210ms', queue: '8 items', status: 'IN_SYNC' },
      { id: 'PAIR:us-east-1 -> us-west-2', throughput: '6.2 GB/s', lagMs: '42ms', queue: '4 items', status: 'IN_SYNC' },
      { id: 'PAIR:eu-central-1 -> ap-southeast-1', throughput: '2.4 GB/s', lagMs: '190ms', queue: '10 items', status: 'IN_SYNC' }
    ]
  },

  // UNIT #435: Storage Egress Throttle
  {
    num: 435,
    folder: '10-storage-egress-throttle',
    id: 'GF-T2-EGRESS-10',
    name: 'STORAGE-EGRESS-THROTTLE',
    subtitle: 'Multi-Tenant Bandwidth Shaper & Bucket Rate Limiter',
    accent: '#FF9F0A',
    componentName: 'StorageEgressThrottleCockpit',
    metric1: { label: 'TOTAL EGRESS SHAPED', value: '48.2', unit: 'Gbps', sub: 'SHAPED LEAK: 0.00%', color: '#FF9F0A' },
    metric2: { label: 'TENANT FAIRNESS INDEX', value: '0.998', unit: '/1.0', sub: 'ZERO STARVATION', color: '#00F0FF' },
    svgType: 'throttle_matrix',
    items: [
      { id: 'TENANT-PROPRIETARY-A', cap: '20 Gbps', current: '14.2 Gbps', throttled: '0.0%', status: 'OPTIMAL' },
      { id: 'TENANT-ENTERPRISE-B', cap: '15 Gbps', current: '12.8 Gbps', throttled: '0.0%', status: 'OPTIMAL' },
      { id: 'TENANT-GROWTH-C', cap: '10 Gbps', current: '8.4 Gbps', throttled: '0.0%', status: 'OPTIMAL' },
      { id: 'TENANT-SHOWROOM-D', cap: '10 Gbps', current: '7.6 Gbps', throttled: '0.0%', status: 'OPTIMAL' },
      { id: 'TENANT-PUBLIC-POOL', cap: '5 Gbps', current: '4.2 Gbps', throttled: '0.2%', status: 'SHAPING' }
    ]
  }
];
