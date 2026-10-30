/**
 * Batch Delta Cockpits — Part 2: Units #411 to #415 (Infrastructure & Mesh)
 * VPC flow logger, Service mesh topology, BGP routing map, Pod health grid, NAT gateway throughput
 */

export const INFRA_COCKPITS = [
  // UNIT #411: VPC Flow Logger
  {
    num: 411,
    folder: '06-vpc-flow-logger',
    id: 'GF-T2-VPC-06',
    name: 'VPC-FLOW-LOGGER',
    subtitle: 'Packet Matrix & Security Group Traffic Flow',
    accent: '#00F0FF',
    componentName: 'VpcFlowLoggerCockpit',
    metric1: { label: 'PACKET THROUGHPUT', value: '8.4', unit: 'Mpps', sub: 'ACCEPTED: 99.8%', color: '#00F0FF' },
    metric2: { label: 'REJECTED FLOW RATIO', value: '0.02', unit: '%', sub: 'SG VIOLATIONS: 142/s', color: '#FF9F0A' },
    svgType: 'flow_stream',
    items: [
      { id: 'FLOW-01', src: '10.0.1.44:5432', dst: '10.0.2.89:48102', proto: 'TCP', bytes: '4.8 GB', action: 'ACCEPT' },
      { id: 'FLOW-02', src: '198.51.100.9:443', dst: '10.0.1.10:8080', proto: 'TCP', bytes: '12.4 MB', action: 'ACCEPT' },
      { id: 'FLOW-03', src: '203.0.113.77:22', dst: '10.0.1.4:22', proto: 'TCP', bytes: '64 B', action: 'REJECT' },
      { id: 'FLOW-04', src: '10.0.3.15:9092', dst: '10.0.2.11:51200', proto: 'TCP', bytes: '1.2 GB', action: 'ACCEPT' },
      { id: 'FLOW-05', src: '192.0.2.88:123', dst: '10.0.0.1:123', proto: 'UDP', bytes: '128 B', action: 'REJECT' }
    ]
  },

  // UNIT #412: Service Mesh Topology
  {
    num: 412,
    folder: '07-service-mesh-topology',
    id: 'GF-T2-MESH-07',
    name: 'SERVICE-MESH-TOPOLOGY',
    subtitle: 'Envoy / Istio Sidecar Mesh Graph & Tripper',
    accent: '#FF9F0A',
    componentName: 'ServiceMeshTopologyCockpit',
    metric1: { label: 'SIDECAR PROXY COUNT', value: '384', unit: 'ENVOY', sub: 'SYNCED: 100%', color: '#FF9F0A' },
    metric2: { label: 'INTER-SERVICE LATENCY', value: '0.85', unit: 'ms', sub: 'CIRCUIT BREAK: 0', color: '#00F0FF' },
    svgType: 'mesh_graph',
    items: [
      { id: 'SVC-INGRESS', sidecar: 'envoy-gateway-v1.28', rps: '48,200', p99: '1.2ms', errorRate: '0.00%', state: 'OPTIMAL' },
      { id: 'SVC-AUTH', sidecar: 'envoy-sidecar-auth', rps: '18,400', p99: '0.4ms', errorRate: '0.00%', state: 'OPTIMAL' },
      { id: 'SVC-BILLING', sidecar: 'envoy-sidecar-billing', rps: '4,100', p99: '2.1ms', errorRate: '0.01%', state: 'HEALTHY' },
      { id: 'SVC-TELEMETRY', sidecar: 'envoy-sidecar-telemetry', rps: '64,000', p99: '0.6ms', errorRate: '0.00%', state: 'OPTIMAL' },
      { id: 'SVC-CATALOG', sidecar: 'envoy-sidecar-catalog', rps: '12,900', p99: '0.9ms', errorRate: '0.00%', state: 'OPTIMAL' }
    ]
  },

  // UNIT #413: BGP Routing Map
  {
    num: 413,
    folder: '08-bgp-routing-map',
    id: 'GF-T2-BGP-08',
    name: 'BGP-ROUTING-MAP',
    subtitle: 'Autonomous System (ASN) Peer Latency & Flap Radar',
    accent: '#00F0FF',
    componentName: 'BgpRoutingMapCockpit',
    metric1: { label: 'ACTIVE BGP SESSIONS', value: '64', unit: 'PEERS', sub: 'ESTABLISHED: 100%', color: '#00F0FF' },
    metric2: { label: 'ANYCAST FLAP RATE', value: '0.00', unit: '/min', sub: 'CONVERGED: T-0.1s', color: '#FF9F0A' },
    svgType: 'bgp_map',
    items: [
      { id: 'PEER-AS13335', asn: 'AS13335 (Cloudflare)', rtt: '1.1ms', prefixes: '942,100', status: 'ESTABLISHED', state: 'STABLE' },
      { id: 'PEER-AS15169', asn: 'AS15169 (Google LLC)', rtt: '1.4ms', prefixes: '941,850', status: 'ESTABLISHED', state: 'STABLE' },
      { id: 'PEER-AS16509', asn: 'AS16509 (Amazon AWS)', rtt: '2.2ms', prefixes: '940,200', status: 'ESTABLISHED', state: 'STABLE' },
      { id: 'PEER-AS6939', asn: 'AS6939 (Hurricane Electric)', rtt: '0.9ms', prefixes: '944,010', status: 'ESTABLISHED', state: 'STABLE' },
      { id: 'PEER-AS2914', asn: 'AS2914 (NTT America)', rtt: '4.8ms', prefixes: '939,900', status: 'ESTABLISHED', state: 'STABLE' }
    ]
  },

  // UNIT #414: Pod Health Grid
  {
    num: 414,
    folder: '09-pod-health-grid',
    id: 'GF-T2-POD-09',
    name: 'POD-HEALTH-GRID',
    subtitle: 'Kubernetes DaemonSet & StatefulSet Cluster Matrix',
    accent: '#FF9F0A',
    componentName: 'PodHealthGridCockpit',
    metric1: { label: 'RUNNING POD REPLICAS', value: '412', unit: '/412', sub: 'OOMKILLS: 0', color: '#FF9F0A' },
    metric2: { label: 'CLUSTER CPU HEADROOM', value: '64.2', unit: '%', sub: 'NODE MEMORY: 42%', color: '#00F0FF' },
    svgType: 'k8s_grid',
    items: [
      { id: 'POD-DISPATCH-01', ns: 'production', node: 'ip-10-0-4-12', cpu: '142m', mem: '210Mi', restarts: 0, status: 'RUNNING' },
      { id: 'POD-DISPATCH-02', ns: 'production', node: 'ip-10-0-4-13', cpu: '138m', mem: '205Mi', restarts: 0, status: 'RUNNING' },
      { id: 'POD-DB-REPLICA-01', ns: 'database', node: 'ip-10-0-8-99', cpu: '850m', mem: '4.2Gi', restarts: 0, status: 'RUNNING' },
      { id: 'POD-INGRESS-NGINX', ns: 'ingress', node: 'ip-10-0-1-5', cpu: '410m', mem: '512Mi', restarts: 0, status: 'RUNNING' },
      { id: 'POD-TELEMETRY-WORKER', ns: 'telemetry', node: 'ip-10-0-2-8', cpu: '220m', mem: '340Mi', restarts: 0, status: 'RUNNING' }
    ]
  },

  // UNIT #415: NAT Gateway Throughput
  {
    num: 415,
    folder: '10-nat-gateway-throughput',
    id: 'GF-T2-NAT-10',
    name: 'NAT-GATEWAY-DYNO',
    subtitle: 'Multi-AZ Egress Saturation & Port Exhaustion Scope',
    accent: '#00F0FF',
    componentName: 'NatGatewayThroughputCockpit',
    metric1: { label: 'EGRESS BANDWIDTH', value: '38.4', unit: 'Gbps', sub: 'BANDWIDTH CAP: 100G', color: '#00F0FF' },
    metric2: { label: 'PORT ALLOCATION DEPTH', value: '4.2', unit: '%', sub: 'PORTS FREE: 61,400', color: '#FF9F0A' },
    svgType: 'nat_waveform',
    items: [
      { id: 'NAT-GW-AZ-A', az: 'us-east-1a', egress: '14.2 Gbps', conns: '128,400', drops: 0, state: 'OPTIMAL' },
      { id: 'NAT-GW-AZ-B', az: 'us-east-1b', egress: '12.8 Gbps', conns: '114,200', drops: 0, state: 'OPTIMAL' },
      { id: 'NAT-GW-AZ-C', az: 'us-east-1c', egress: '11.4 Gbps', conns: '98,000', drops: 0, state: 'OPTIMAL' },
      { id: 'NAT-GW-EU-A', az: 'eu-central-1a', egress: '8.1 Gbps', conns: '64,100', drops: 0, state: 'OPTIMAL' },
      { id: 'NAT-GW-AP-A', az: 'ap-southeast-1a', egress: '6.4 Gbps', conns: '48,000', drops: 0, state: 'OPTIMAL' }
    ]
  }
];
