/**
 * Batch Golf Cockpits — Part 4: Units #487 to #493 (High-Velocity Cloud & Telemetry Infra)
 * eBPF Socket Filter, Distributed Tracing Spans, WAL Replication Streamer, TLS Session Resumption, Raft Log Compaction, Memory Pool Fragmentation, Zero-Downtime Canary Gate
 */

export const CLOUD_TELEMETRY_INFRA_COCKPITS = [
  // UNIT #487: eBPF Socket Filter Scope
  {
    num: 487,
    folder: '22-ebpf-socket-filter-scope',
    id: 'GF-T2-EBPF-22',
    name: 'EBPF-SOCKET-FILTER-SCOPE',
    subtitle: 'Kernel XDP Packet Filter & TCP Retransmit Radar',
    accent: '#00F0FF',
    componentName: 'EbpfSocketFilterScopeCockpit',
    metric1: { label: 'XDP PACKET BYPASS SPEED', value: '14.8', unit: 'M pps', sub: 'ZERO CONTEXT-SWITCH KERNEL DROPS', color: '#00F0FF' },
    metric2: { label: 'TCP RETRANSMIT RATE', value: '0.002', unit: '%', sub: 'BBRv3 CONGESTION CONTROL ACTIVE', color: '#FF9F0A' },
    svgType: 'ebpf_xdp_pipeline',
    items: [
      { id: 'EBPF-PROG-XDP-INGRESS', val: 'xdp/rx_hook // 420 Insns JIT Compiled', status: 'RUNNING', lat: '0.00% Drop' },
      { id: 'EBPF-PROG-TCP-METRICS', val: 'kprobe/tcp_rcv // 840 Insns JIT Compiled', status: 'RUNNING', lat: '0.00% Drop' },
      { id: 'EBPF-PROG-SOCKET-ROUTE', val: 'sock_ops/state // 620 Insns JIT Compiled', status: 'RUNNING', lat: '0.00% Drop' },
      { id: 'RING-BUFFER-EVENT-PIPE', val: 'Cap 64 MB // Watermark 12% // 0 Event Loss', status: 'OPTIMAL', lat: '840k evts/s' },
      { id: 'KERNEL-BPF-MAP-REGISTRY', val: '14 Maps // BPF Mem 42 MB // Verifier 2.4ms', status: 'VERIFIED', lat: 'Tail-Call 3' }
    ]
  },

  // UNIT #488: Distributed Tracing Spans
  {
    num: 488,
    folder: '23-distributed-tracing-spans',
    id: 'GF-T2-TRACE-23',
    name: 'DISTRIBUTED-TRACING-SPANS',
    subtitle: 'OpenTelemetry Trace Waterfall & Span Bottleneck Profiler',
    accent: '#FF9F0A',
    componentName: 'DistributedTracingSpansCockpit',
    metric1: { label: 'P99 TRACE WATERFALL', value: '18.4', unit: 'ms', sub: '14 DISTRIBUTED MICRO-SPANS ANALYZED', color: '#FF9F0A' },
    metric2: { label: 'OTEL SPANS PER SECOND', value: '142', unit: 'k spans/s', sub: 'W3C TRACE-CONTEXT PROPAGATION', color: '#00F0FF' },
    svgType: 'trace_span_waterfall',
    items: [
      { id: 'SPAN-HTTP-GATEWAY', val: 'Service: ingress-edge // Duration 18.4ms', status: 'ROOT_OK', lat: 'Self 0.8ms' },
      { id: 'SPAN-AUTH-VALIDATE', val: 'Service: auth-service // Duration 2.1ms', status: 'CHILD_OK', lat: 'Self 1.9ms' },
      { id: 'SPAN-POSTGRES-SELECT', val: 'Service: fleet-db // Duration 4.8ms', status: 'LEAF_OK', lat: 'Self 4.8ms' },
      { id: 'SPAN-REDIS-GET-CACHE', val: 'Service: l1-redis // Duration 0.4ms', status: 'LEAF_OK', lat: 'Self 0.4ms' },
      { id: 'SPAN-KAFKA-PRODUCE', val: 'Service: audit-stream // Duration 1.2ms', status: 'CHILD_OK', lat: 'Self 1.2ms' }
    ]
  },

  // UNIT #489: WAL Replication Streamer
  {
    num: 489,
    folder: '24-wal-replication-streamer',
    id: 'GF-T2-WAL-24',
    name: 'WAL-REPLICATION-STREAMER',
    subtitle: 'Postgres Logical Decoding & LSN Byte Lag Horizon',
    accent: '#00F0FF',
    componentName: 'WalReplicationStreamerCockpit',
    metric1: { label: 'REPLICATION LSN BYTE LAG', value: '0', unit: 'bytes', sub: 'SYNCHRONOUS MULTI-REGION STANDBY', color: '#00F0FF' },
    metric2: { label: 'WAL GENERATION RATE', value: '48.2', unit: 'MB/s', sub: 'ZSTD COMPRESSED ARCHIVE PIPELINE', color: '#FF9F0A' },
    svgType: 'wal_lsn_stream',
    items: [
      { id: 'STANDBY-US-EAST4', val: 'LSN 18/4F20000 // Synchronous Standby', status: 'STREAMING', lat: '0 B (0.4ms)' },
      { id: 'STANDBY-EUROPE-WEST1', val: 'LSN 18/4F1FF80 // Quorum Standby', status: 'STREAMING', lat: '128 B (12ms)' },
      { id: 'STANDBY-ASIA-EAST1', val: 'LSN 18/4F1FE00 // Async Standby', status: 'STREAMING', lat: '512 B (42ms)' },
      { id: 'SLOT-DEBEZIUM-CDC', val: 'LSN 18/4F1FA00 // Logical CDC Slot', status: 'CONSUMING', lat: '1.5 KB Lag' },
      { id: 'PG-WAL-ARCHIVER-STATUS', val: '420 Archived // Last: ...180000004F', status: 'PRISTINE', lat: 'Failures 0' }
    ]
  },

  // UNIT #490: TLS Session Resumption Rig
  {
    num: 490,
    folder: '25-tls-session-resumption-rig',
    id: 'GF-T2-TLS-25',
    name: 'TLS-SESSION-RESUMPTION-RIG',
    subtitle: 'TLS 1.3 Session Ticket & PSK Cache Tachometer',
    accent: '#FF9F0A',
    componentName: 'TlsSessionResumptionRigCockpit',
    metric1: { label: '0-RTT PSK RESUMPTION RATE', value: '96.8', unit: '%', sub: 'HANDSHAKE SAVINGS: 1 RTT ROUNDTRIP', color: '#FF9F0A' },
    metric2: { label: 'HANDSHAKE LATENCY MEAN', value: '0.82', unit: 'ms', sub: 'CHACHA20-POLY1305 / X25519', color: '#00F0FF' },
    svgType: 'tls_session_tach',
    items: [
      { id: 'CIPHER-TLS-AES-128-GCM', val: 'TLSv1.3 // 84k PSK Hits // STEK Rotations 4', status: 'OPTIMAL', lat: 'Anti-Replay OK' },
      { id: 'CIPHER-TLS-CHACHA20-POLY', val: 'TLSv1.3 // 42k PSK Hits // STEK Rotations 4', status: 'OPTIMAL', lat: 'Anti-Replay OK' },
      { id: 'CIPHER-TLS-AES-256-GCM', val: 'TLSv1.3 // 18.5k PSK Hits // STEK Rotations 4', status: 'OPTIMAL', lat: 'Anti-Replay OK' },
      { id: 'STEK-ROTATION-VAULT', val: '3 Active Keys // Key Age 3600s // DHE Forward', status: 'SECURE', lat: 'Rotated' },
      { id: 'EARLY-DATA-ANTI-REPLAY', val: 'Window 10s // Bloom Filter 8 MB', status: 'SHIELDED', lat: 'FP 0.000%' }
    ]
  },

  // UNIT #491: Raft Log Compaction Dyno
  {
    num: 491,
    folder: '26-raft-log-compaction-dyno',
    id: 'GF-T2-RAFT-26',
    name: 'RAFT-LOG-COMPACTION-DYNO',
    subtitle: 'Consensus State Machine Snapshot & Truncation Dyno',
    accent: '#00F0FF',
    componentName: 'RaftLogCompactionDynoCockpit',
    metric1: { label: 'SNAPSHOT COMPACTION RATIO', value: '94.2', unit: '%', sub: 'TRUNCATED ENTRIES: 1.84M ROWS', color: '#00F0FF' },
    metric2: { label: 'RECOVERY TIME OBJECTIVE', value: '0.42', unit: 's', sub: 'ZERO DATA LOSS // RPO = 0', color: '#FF9F0A' },
    svgType: 'raft_snapshot_ring',
    items: [
      { id: 'RAFT-TERM-COMMIT-INDEX', val: 'Term 48 // CommitIdx 4,820,100 // Applied 4.82M', status: 'IN_SYNC', lat: 'Match 100%' },
      { id: 'SNAPSHOT-METADATA-BLOCK', val: 'SnapIdx 4.80M // Term 48 // Size 42 MB', status: 'PERSISTED', lat: 'SHA256 Valid' },
      { id: 'PEER-NODE-01-HEARTBEAT', val: 'Peer AppendEntries Ack // Follower In Sync', status: 'HEALTHY', lat: 'RTT 0.8ms' },
      { id: 'PEER-NODE-02-HEARTBEAT', val: 'Peer AppendEntries Ack // Follower In Sync', status: 'HEALTHY', lat: 'RTT 1.1ms' },
      { id: 'LEADER-LOG-PURGE-THREAD', val: 'Interval 60s // Discard 1.2 GB // Fsync 1.4ms', status: 'PRISTINE', lat: 'Purged' }
    ]
  },

  // UNIT #492: Memory Pool Fragmentation
  {
    num: 492,
    folder: '27-memory-pool-fragmentation',
    id: 'GF-T2-MPOOL-27',
    name: 'MEMORY-POOL-FRAGMENTATION',
    subtitle: 'Arena / Slab Allocator Allocation Waveform',
    accent: '#FF9F0A',
    componentName: 'MemoryPoolFragmentationCockpit',
    metric1: { label: 'POOL FRAGMENTATION INDEX', value: '1.14', unit: '%', sub: 'SLAB RE-USE EFFICIENCY: 98.8%', color: '#FF9F0A' },
    metric2: { label: 'ZERO-MALLOC SPEED', value: '14.2', unit: 'ns / alloc', sub: 'CUSTOM ARENA BUMP POOL', color: '#00F0FF' },
    svgType: 'slab_allocator_blocks',
    items: [
      { id: 'SLAB-CLASS-32B', val: '65,536 Chunks (58.4k Active / 7.1k Free)', status: 'TIGHT', lat: 'Frag 0.8%' },
      { id: 'SLAB-CLASS-128B', val: '32,768 Chunks (31.2k Active / 1.5k Free)', status: 'TIGHT', lat: 'Frag 1.2%' },
      { id: 'SLAB-CLASS-512B', val: '16,384 Chunks (15.4k Active / 984 Free)', status: 'TIGHT', lat: 'Frag 1.4%' },
      { id: 'SLAB-CLASS-4KB', val: '4,096 Chunks (3.8k Active / 246 Free)', status: 'TIGHT', lat: 'Frag 0.9%' },
      { id: 'ARENA-SCRATCH-SCRUBBER', val: '42k Resets/s // L1 Cache Miss 0.04%', status: 'LOCK_FREE', lat: '14.2 ns' }
    ]
  },

  // UNIT #493: Zero-Downtime Canary Gate
  {
    num: 493,
    folder: '28-zero-downtime-canary-gate',
    id: 'GF-T2-CANARY-28',
    name: 'ZERO-DOWNTIME-CANARY-GATE',
    subtitle: 'Automated Rollback & Canary Traffic Shift Console',
    accent: '#00F0FF',
    componentName: 'ZeroDowntimeCanaryGateCockpit',
    metric1: { label: 'CANARY TRAFFIC SPLIT', value: '25.0', unit: '%', sub: 'ERROR BUDGET CONSUMED: 0.00%', color: '#00F0FF' },
    metric2: { label: 'HEALTH SCORE DELTA', value: '+0.04', unit: 'σ vs base', sub: 'AUTO-PROMOTION AT 30 MINS', color: '#FF9F0A' },
    svgType: 'canary_traffic_split',
    items: [
      { id: 'BASELINE-V2.4.0', val: 'Weight 75% // 14,200 RPS // 5xx Err 0.001%', status: 'STABLE_ACTIVE', lat: 'P99 14.2ms' },
      { id: 'CANARY-V2.5.0-RC1', val: 'Weight 25% // 4,730 RPS // 5xx Err 0.000%', status: 'PROMOTING', lat: 'P99 12.8ms' },
      { id: 'STATISTICAL-T-TEST-GATE', val: 'Latency & 5xx Metric // p-Value 0.94', status: 'HEALTHY', lat: 'No Regress' },
      { id: 'AUTOMATED-ROLLBACK-WATCHER', val: 'Breach Count 0 // Max Allowed 5xx 0.05%', status: 'ARMED', lat: 'Armed 0.1s' },
      { id: 'EDGE-WEIGHTED-DNS-SHIFTER', val: 'Step 5 of 20 (5% / 5min Shift) -> 100%', status: 'ADVANCING', lat: 'Step Active' }
    ]
  }
];
