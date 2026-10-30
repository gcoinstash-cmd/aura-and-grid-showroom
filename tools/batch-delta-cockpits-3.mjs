/**
 * Batch Delta Cockpits — Part 3: Units #416 to #420 (Data Pipelines & Dynos)
 * Postgres lock monitor, Redis keyspace heatmap, S3 storage gauge, Kafka consumer lag, ClickHouse speedometer
 */

export const DATA_COCKPITS = [
  // UNIT #416: Postgres Lock Monitor
  {
    num: 416,
    folder: '11-postgres-lock-monitor',
    id: 'GF-T2-LOCK-11',
    name: 'POSTGRES-LOCK-MONITOR',
    subtitle: 'Exclusive Locks & Deadlock Transaction Resolver',
    accent: '#00F0FF',
    componentName: 'PostgresLockMonitorCockpit',
    metric1: { label: 'BLOCKING TRANSACTIONS', value: '0', unit: 'BLOCKED', sub: 'RESOLVED: 100%', color: '#00F0FF' },
    metric2: { label: 'LONGEST TX DURATION', value: '14.2', unit: 'ms', sub: 'P99 QUERY: 2.1ms', color: '#FF9F0A' },
    svgType: 'lock_matrix',
    items: [
      { id: 'PID-48190', relation: 'public.telemetry_events', mode: 'RowShareLock', granted: true, duration: '1.2ms', state: 'ACTIVE' },
      { id: 'PID-48191', relation: 'public.fleet_assets', mode: 'AccessShareLock', granted: true, duration: '0.8ms', state: 'ACTIVE' },
      { id: 'PID-48192', relation: 'public.orderbook_trades', mode: 'RowExclusiveLock', granted: true, duration: '3.4ms', state: 'ACTIVE' },
      { id: 'PID-48193', relation: 'public.billing_ledger', mode: 'RowExclusiveLock', granted: true, duration: '2.1ms', state: 'ACTIVE' },
      { id: 'PID-48194', relation: 'public.api_tokens', mode: 'RowShareLock', granted: true, duration: '0.5ms', state: 'ACTIVE' }
    ]
  },

  // UNIT #417: Redis Keyspace Heatmap
  {
    num: 417,
    folder: '12-redis-keyspace-heatmap',
    id: 'GF-T2-REDIS-12',
    name: 'REDIS-KEYSPACE-HEATMAP',
    subtitle: 'TTL Fragmentation & Big-Key Eviction Scope',
    accent: '#FF9F0A',
    componentName: 'RedisKeyspaceHeatmapCockpit',
    metric1: { label: 'TOTAL KEYSPACE COUNT', value: '4.82', unit: 'M KEYS', sub: 'HIT RATIO: 99.4%', color: '#FF9F0A' },
    metric2: { label: 'MEMORY FRAGMENTATION', value: '1.08', unit: 'RATIO', sub: 'USED MEM: 14.2 GB', color: '#00F0FF' },
    svgType: 'redis_heatmap',
    items: [
      { id: 'DB0:session:*', count: '1,420,000', avgTtl: '3,600s', memEst: '4.2 GB', type: 'STRING', status: 'HEALTHY' },
      { id: 'DB0:rate_limit:*', count: '980,000', avgTtl: '60s', memEst: '1.1 GB', type: 'HASH', status: 'OPTIMAL' },
      { id: 'DB0:cache:catalog', count: '45,000', avgTtl: '86,400s', memEst: '3.8 GB', type: 'JSON', status: 'HEALTHY' },
      { id: 'DB0:mq:ingress', count: '12,000', avgTtl: '300s', memEst: '820 MB', type: 'STREAM', status: 'OPTIMAL' },
      { id: 'DB0:geo:nodes', count: '500', avgTtl: 'PERSIST', memEst: '12 MB', type: 'ZSET', status: 'OPTIMAL' }
    ]
  },

  // UNIT #418: S3 Bucket Storage Gauge
  {
    num: 418,
    folder: '13-s3-storage-gauge',
    id: 'GF-T2-S3-13',
    name: 'S3-STORAGE-GAUGE',
    subtitle: 'Multi-Tier Object Lifecycle & Tiering Waveform',
    accent: '#00F0FF',
    componentName: 'S3StorageGaugeCockpit',
    metric1: { label: 'TOTAL OBJECT VOLUME', value: '42.8', unit: 'TB', sub: 'INTELLIGENT TIER: 92%', color: '#00F0FF' },
    metric2: { label: 'MONTHLY RETRIEVAL COST', value: '$18.40', unit: 'USD', sub: 'GLACIER DEEP: 80TB', color: '#FF9F0A' },
    svgType: 'storage_waveform',
    items: [
      { id: 'BUCKET-TELEMETRY-RAW', tier: 'Standard S3', objects: '14.2M', size: '18.4 TB', encryption: 'SSE-KMS', status: 'ACTIVE' },
      { id: 'BUCKET-AUDIT-LOGS', tier: 'Glacier Instant', objects: '8.9M', size: '12.1 TB', encryption: 'SSE-KMS', status: 'ARCHIVED' },
      { id: 'BUCKET-SHOWROOM-MEDIA', tier: 'Intelligent Tiering', objects: '1.2M', size: '8.4 TB', encryption: 'AES-256', status: 'ACCELERATED' },
      { id: 'BUCKET-BACKUPS-DAILY', tier: 'Standard-IA', objects: '42,000', size: '3.9 TB', encryption: 'SSE-KMS', status: 'SYNCED' },
      { id: 'BUCKET-HISTORIC-ARCHIVE', tier: 'Glacier Deep Archive', objects: '4.8M', size: '80.0 TB', encryption: 'SSE-KMS', status: 'FROZEN' }
    ]
  },

  // UNIT #419: Kafka Consumer Group Lag
  {
    num: 419,
    folder: '14-kafka-consumer-lag',
    id: 'GF-T2-KAFKA-14',
    name: 'KAFKA-CONSUMER-LAG',
    subtitle: 'Partition Offset Drift & Rebalance Lag Scope',
    accent: '#FF9F0A',
    componentName: 'KafkaConsumerLagCockpit',
    metric1: { label: 'TOTAL CONSUMER LAG', value: '14', unit: 'MSGS', sub: 'LAG SECONDS: 0.002s', color: '#FF9F0A' },
    metric2: { label: 'CONSUMER INGEST RATE', value: '184.2', unit: 'k/sec', sub: 'PARTITIONS: 32 ACTIVE', color: '#00F0FF' },
    svgType: 'kafka_lag',
    items: [
      { id: 'TOPIC:telemetry-events-p0', group: 'fleet-ingest-cg', logOffset: '94,180,240', lag: 4, status: 'IN_SYNC' },
      { id: 'TOPIC:telemetry-events-p1', group: 'fleet-ingest-cg', logOffset: '94,180,110', lag: 2, status: 'IN_SYNC' },
      { id: 'TOPIC:billing-settlement-p0', group: 'billing-ledger-cg', logOffset: '12,400,991', lag: 0, status: 'IN_SYNC' },
      { id: 'TOPIC:audit-stream-p0', group: 'audit-merkle-cg', logOffset: '8,421,009', lag: 5, status: 'IN_SYNC' },
      { id: 'TOPIC:notifications-p0', group: 'notification-cg', logOffset: '4,109,240', lag: 3, status: 'IN_SYNC' }
    ]
  },

  // UNIT #420: ClickHouse Ingestion Speedometer
  {
    num: 420,
    folder: '15-clickhouse-speedometer',
    id: 'GF-T2-CLICK-15',
    name: 'CLICKHOUSE-SPEEDOMETER',
    subtitle: 'Columnar Ingestion Rate & Part Merger Dyno',
    accent: '#00F0FF',
    componentName: 'ClickhouseSpeedometerCockpit',
    metric1: { label: 'INSERT ROW VELOCITY', value: '2.4', unit: 'M rows/s', sub: 'PARQUET/ZSTD COMPACT', color: '#00F0FF' },
    metric2: { label: 'ACTIVE MERGING PARTS', value: '8', unit: 'PARTS', sub: 'MERGE LAG: < 1.0s', color: '#FF9F0A' },
    svgType: 'speedometer',
    items: [
      { id: 'TABLE:events_hourly', engine: 'ReplacingMergeTree', rows: '4.8B', compressed: '142 GB', uncompressed: '1.2 TB', ratio: '8.4x' },
      { id: 'TABLE:metrics_raw', engine: 'MergeTree', rows: '12.1B', compressed: '380 GB', uncompressed: '3.1 TB', ratio: '8.1x' },
      { id: 'TABLE:audit_log', engine: 'MergeTree', rows: '890M', compressed: '28 GB', uncompressed: '190 GB', ratio: '6.7x' },
      { id: 'TABLE:trace_spans', engine: 'ReplacingMergeTree', rows: '2.2B', compressed: '94 GB', uncompressed: '710 GB', ratio: '7.5x' },
      { id: 'TABLE:network_flows', engine: 'MergeTree', rows: '8.4B', compressed: '210 GB', uncompressed: '1.9 TB', ratio: '9.0x' }
    ]
  }
];
