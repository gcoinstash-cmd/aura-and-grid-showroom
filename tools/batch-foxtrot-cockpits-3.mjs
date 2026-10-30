/**
 * Batch Foxtrot Cockpits — Part 3: Units #456 to #460 (Edge Routing & High-Frequency Ingestion)
 * Timeseries compaction, Edge KV store, MQTT broker, Event store replay, Load balancer health radar
 */

export const EDGE_INGESTION_COCKPITS = [
  // UNIT #456: Timeseries Compaction Dyno
  {
    num: 456,
    folder: '11-timeseries-compaction-dyno',
    id: 'GF-T2-TS-11',
    name: 'TIMESERIES-COMPACTION-DYNO',
    subtitle: 'Gorilla / Delta-of-Delta Ingestion & Rollup Compression Dyno',
    accent: '#00F0FF',
    componentName: 'TimeseriesCompactionDynoCockpit',
    metric1: { label: 'COMPRESSION RATIO', value: '11.8', unit: 'x', sub: 'GORILLA XOR FLOAT64', color: '#00F0FF' },
    metric2: { label: 'INGESTION VELOCITY', value: '4.82', unit: 'M pts/s', sub: 'ZERO DATA LOSS', color: '#FF9F0A' },
    svgType: 'timeseries_compression',
    items: [
      { id: 'SERIES:cpu_saturation', rawPoints: '14.2M/hr', compressedBytes: '18 MB', ratio: '12.4x', status: 'COMPACTED' },
      { id: 'SERIES:network_egress', rawPoints: '28.4M/hr', compressedBytes: '32 MB', ratio: '11.9x', status: 'COMPACTED' },
      { id: 'SERIES:memory_rss', rawPoints: '8.1M/hr', compressedBytes: '9 MB', ratio: '12.8x', status: 'COMPACTED' },
      { id: 'SERIES:orderbook_ticks', rawPoints: '64.0M/hr', compressedBytes: '94 MB', ratio: '10.4x', status: 'COMPACTED' },
      { id: 'SERIES:rpc_latency_hist', rawPoints: '12.8M/hr', compressedBytes: '16 MB', ratio: '11.2x', status: 'COMPACTED' }
    ]
  },

  // UNIT #457: Edge Key-Value Store Telemetry
  {
    num: 457,
    folder: '12-edge-kv-store-telemetry',
    id: 'GF-T2-EKV-12',
    name: 'EDGE-KV-STORE-TELEMETRY',
    subtitle: 'Global Replicated Key-Value Low-Latency Invalidation Hub',
    accent: '#FF9F0A',
    componentName: 'EdgeKvStoreTelemetryCockpit',
    metric1: { label: 'GLOBAL READ LATENCY', value: '0.42', unit: 'ms', sub: 'LOCAL V8 ISOLATE CACHE', color: '#FF9F0A' },
    metric2: { label: 'GLOBAL INVALIDATION TIME', value: '120', unit: 'ms', sub: 'WORLDWIDE 310 PoPs', color: '#00F0FF' },
    svgType: 'edge_kv_mesh',
    items: [
      { id: 'KEY:feature_flags_v2', reads: '184k/s', writes: '2/min', replicationLag: '80ms', status: 'SYNCED' },
      { id: 'KEY:tenant_rate_limits', reads: '92k/s', writes: '48/min', replicationLag: '110ms', status: 'SYNCED' },
      { id: 'KEY:session_tokens_ephem', reads: '240k/s', writes: '180/min', replicationLag: '95ms', status: 'SYNCED' },
      { id: 'KEY:catalog_monroney_cache', reads: '14k/s', writes: '1/hr', replicationLag: '60ms', status: 'SYNCED' },
      { id: 'KEY:waf_ip_tarpit_list', reads: '380k/s', writes: '12/min', replicationLag: '120ms', status: 'SYNCED' }
    ]
  },

  // UNIT #458: MQTT IoT Telemetry Broker
  {
    num: 458,
    folder: '13-mqtt-iot-telemetry-broker',
    id: 'GF-T2-MQTT-13',
    name: 'MQTT-IOT-BROKER',
    subtitle: 'High-Throughput Sensor Telemetry QoS 1/2 Topic Router',
    accent: '#00F0FF',
    componentName: 'MqttIotTelemetryBrokerCockpit',
    metric1: { label: 'CONNECTED IOT SENSORS', value: '1,240,000', unit: 'NODES', sub: 'QoS 1 CONFIRMED: 100%', color: '#00F0FF' },
    metric2: { label: 'MESSAGE INGESTION RATE', value: '2.84', unit: 'M msg/s', sub: 'LATENCY: < 1.0ms', color: '#FF9F0A' },
    svgType: 'mqtt_fanout',
    items: [
      { id: 'TOPIC: fleet/cluster/telemetry', clients: '420,000', qos: 1, retain: true, status: 'STREAMING' },
      { id: 'TOPIC: sensors/vibration/nvme', clients: '280,000', qos: 1, retain: false, status: 'STREAMING' },
      { id: 'TOPIC: thermal/gpu/h100', clients: '140,000', qos: 2, retain: true, status: 'STREAMING' },
      { id: 'TOPIC: power/pdu/datacenter', clients: '95,000', qos: 1, retain: true, status: 'STREAMING' },
      { id: 'TOPIC: security/perimeter/mtls', clients: '305,000', qos: 2, retain: true, status: 'STREAMING' }
    ]
  },

  // UNIT #459: Event Store Time-Travel Replay Console
  {
    num: 459,
    folder: '14-event-store-replay-console',
    id: 'GF-T2-EVT-14',
    name: 'EVENT-STORE-REPLAY-CONSOLE',
    subtitle: 'Event Sourcing Historical Stream Time-Travel & Snapshot Dyno',
    accent: '#FF9F0A',
    componentName: 'EventStoreReplayConsoleCockpit',
    metric1: { label: 'EVENT STREAM VELOCITY', value: '184,000', unit: 'evt/s', sub: 'APPEND-ONLY IMMUTABLE', color: '#FF9F0A' },
    metric2: { label: 'SNAPSHOT REPLAY SPEED', value: '12.4', unit: 'M evt/s', sub: 'REPLAY LAG: 0.00s', color: '#00F0FF' },
    svgType: 'event_replay',
    items: [
      { id: 'STREAM-ASSET-TITLES', totalEvents: '48.2M', lastSeq: 48201940, snapshotAge: '14m ago', status: 'ACTIVE' },
      { id: 'STREAM-BILLING-LEDGER', totalEvents: '12.1M', lastSeq: 12100412, snapshotAge: '2m ago', status: 'ACTIVE' },
      { id: 'STREAM-USER-PROVENANCE', totalEvents: '8.4M', lastSeq: 8410290, snapshotAge: '30m ago', status: 'ACTIVE' },
      { id: 'STREAM-FLEET-CLUSTERS', totalEvents: '2.4M', lastSeq: 2410091, snapshotAge: '5m ago', status: 'ACTIVE' },
      { id: 'STREAM-AUDIT-FORENSICS', totalEvents: '94.0M', lastSeq: 94002188, snapshotAge: '1m ago', status: 'ACTIVE' }
    ]
  },

  // UNIT #460: Load Balancer Health Radar
  {
    num: 460,
    folder: '15-load-balancer-health-radar',
    id: 'GF-T2-LB-15',
    name: 'LOAD-BALANCER-HEALTH-RADAR',
    subtitle: 'Weighted Round-Robin & Least-Connections Target Pool Scope',
    accent: '#00F0FF',
    componentName: 'LoadBalancerHealthRadarCockpit',
    metric1: { label: 'HEALTHY BACKEND WEIGHT', value: '100', unit: '%', sub: 'ALL 64 TARGETS PASS', color: '#00F0FF' },
    metric2: { label: 'ALGORITHM DISTRIBUTION', value: '0.01', unit: '% DRIFT', sub: 'LEAST-CONN WEIGHTED', color: '#FF9F0A' },
    svgType: 'lb_radar',
    items: [
      { id: 'TARGET-POOL-API-CORE', healthy: '16/16', algorithm: 'LeastConn', connCount: '14,200', status: 'HEALTHY' },
      { id: 'TARGET-POOL-SHOWROOM', healthy: '16/16', algorithm: 'RoundRobin', connCount: '9,800', status: 'HEALTHY' },
      { id: 'TARGET-POOL-INGEST', healthy: '16/16', algorithm: 'LeastConn', connCount: '24,100', status: 'HEALTHY' },
      { id: 'TARGET-POOL-AUTH-IDP', healthy: '8/8', algorithm: 'IP-Hash', connCount: '4,200', status: 'HEALTHY' },
      { id: 'TARGET-POOL-ORDERBOOK', healthy: '8/8', algorithm: 'LeastConn', connCount: '18,400', status: 'HEALTHY' }
    ]
  }
];
