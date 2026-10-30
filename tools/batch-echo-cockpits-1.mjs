/**
 * Batch Echo Cockpits — Part 1: Units #426 to #430 (Network Latency & Edge)
 * Anycast ping radar, WebSocket flood guard, DNS propagation checker, QUIC inspector, CDN shield
 */

export const NETWORK_EDGE_COCKPITS = [
  // UNIT #426: Anycast Ping Radar
  {
    num: 426,
    folder: '01-anycast-ping-radar',
    id: 'GF-T2-PING-01',
    name: 'ANYCAST-PING-RADAR',
    subtitle: 'Global Anycast RTT & Edge PoP Latency Radar',
    accent: '#00F0FF',
    componentName: 'AnycastPingRadarCockpit',
    metric1: { label: 'GLOBAL MEAN LATENCY', value: '11.8', unit: 'ms', sub: 'WORLDWIDE 95TH: 24ms', color: '#00F0FF' },
    metric2: { label: 'SUB-20MS POP COVERAGE', value: '98.4', unit: '%', sub: '310 ANYCAST EDGES', color: '#FF9F0A' },
    svgType: 'anycast_radar',
    items: [
      { id: 'POP-IAD-VA', region: 'North America (Ashburn)', rtt: '1.8ms', jitter: '0.1ms', status: 'OPTIMAL' },
      { id: 'POP-LHR-UK', region: 'Europe (London)', rtt: '4.2ms', jitter: '0.2ms', status: 'OPTIMAL' },
      { id: 'POP-NRT-JP', region: 'Asia-Pacific (Tokyo)', rtt: '8.4ms', jitter: '0.4ms', status: 'HEALTHY' },
      { id: 'POP-FRA-DE', region: 'Europe (Frankfurt)', rtt: '3.9ms', jitter: '0.2ms', status: 'OPTIMAL' },
      { id: 'POP-SYD-AU', region: 'Oceania (Sydney)', rtt: '14.2ms', jitter: '0.6ms', status: 'HEALTHY' }
    ]
  },

  // UNIT #427: WebSocket Connection Flood Guard
  {
    num: 427,
    folder: '02-websocket-flood-guard',
    id: 'GF-T2-WS-02',
    name: 'WEBSOCKET-FLOOD-GUARD',
    subtitle: 'WebSocket Frame Saturation & Heartbeat Shield',
    accent: '#FF9F0A',
    componentName: 'WebSocketFloodGuardCockpit',
    metric1: { label: 'CONCURRENT WS SESSIONS', value: '482,000', unit: 'CONNS', sub: 'SATURATION: 48.2%', color: '#FF9F0A' },
    metric2: { label: 'FRAME INGESTION VELOCITY', value: '1.24', unit: 'M frames/s', sub: 'PING/PONG DRIFT: < 2ms', color: '#00F0FF' },
    svgType: 'ws_flood',
    items: [
      { id: 'POOL-US-EAST', active: '184,200', framesPerSec: '480k', dropRate: '0.00%', state: 'STABLE' },
      { id: 'POOL-EU-CENTRAL', active: '142,000', framesPerSec: '360k', dropRate: '0.00%', state: 'STABLE' },
      { id: 'POOL-AP-NORTHEAST', active: '98,000', framesPerSec: '240k', dropRate: '0.00%', state: 'STABLE' },
      { id: 'POOL-SA-EAST', active: '34,000', framesPerSec: '88k', dropRate: '0.00%', state: 'STABLE' },
      { id: 'POOL-AF-SOUTH', active: '23,800', framesPerSec: '62k', dropRate: '0.00%', state: 'STABLE' }
    ]
  },

  // UNIT #428: DNS Propagation Checker
  {
    num: 428,
    folder: '03-dns-propagation-checker',
    id: 'GF-T2-DNS-03',
    name: 'DNS-PROPAGATION-CHECKER',
    subtitle: 'Authoritative Anycast Nameserver Propagation Grid',
    accent: '#00F0FF',
    componentName: 'DnsPropagationCheckerCockpit',
    metric1: { label: 'GLOBAL PROPAGATION', value: '100', unit: '%', sub: 'ALL 64 NS IN SYNC', color: '#00F0FF' },
    metric2: { label: 'RECORD RESOLUTION TTL', value: '60', unit: 'sec', sub: 'SOA SERIAL: 2026103001', color: '#FF9F0A' },
    svgType: 'dns_grid',
    items: [
      { id: 'NS-1.AURA.NET', resolver: 'Cloudflare (1.1.1.1)', ipTarget: '198.51.100.10', ttl: '60s', status: 'SYNCED' },
      { id: 'NS-2.AURA.NET', resolver: 'Google (8.8.8.8)', ipTarget: '198.51.100.10', ttl: '60s', status: 'SYNCED' },
      { id: 'NS-3.AURA.NET', resolver: 'Quad9 (9.9.9.9)', ipTarget: '198.51.100.10', ttl: '60s', status: 'SYNCED' },
      { id: 'NS-4.AURA.NET', resolver: 'OpenDNS (208.67.222.222)', ipTarget: '198.51.100.10', ttl: '60s', status: 'SYNCED' },
      { id: 'NS-5.AURA.NET', resolver: 'AdGuard (94.140.14.14)', ipTarget: '198.51.100.10', ttl: '60s', status: 'SYNCED' }
    ]
  },

  // UNIT #429: QUIC / HTTP3 Packet Inspector
  {
    num: 429,
    folder: '04-quic-http3-inspector',
    id: 'GF-T2-QUIC-04',
    name: 'QUIC-HTTP3-INSPECTOR',
    subtitle: '0-RTT Handshake & Stream Multiplexing Inspector',
    accent: '#FF9F0A',
    componentName: 'QuicHttp3InspectorCockpit',
    metric1: { label: '0-RTT HANDSHAKE RATIO', value: '88.6', unit: '%', sub: 'UDP/443 ZERO RTT', color: '#FF9F0A' },
    metric2: { label: 'STREAM MULTIPLEXING GAIN', value: '3.4', unit: 'x', sub: 'HEAD-OF-LINE BLOCK: 0', color: '#00F0FF' },
    svgType: 'quic_streams',
    items: [
      { id: 'STREAM-001', proto: 'HTTP/3 (QUICv1)', connId: 'cid-99812-a', congestion: 'BBRv3', rtt: '2.1ms', status: 'ACTIVE' },
      { id: 'STREAM-005', proto: 'HTTP/3 (QUICv1)', connId: 'cid-44102-b', congestion: 'BBRv3', rtt: '1.8ms', status: 'ACTIVE' },
      { id: 'STREAM-009', proto: 'HTTP/3 (QUICv1)', connId: 'cid-11894-c', congestion: 'BBRv3', rtt: '3.4ms', status: 'ACTIVE' },
      { id: 'STREAM-013', proto: 'HTTP/3 (QUICv1)', connId: 'cid-77401-d', congestion: 'BBRv3', rtt: '2.4ms', status: 'ACTIVE' },
      { id: 'STREAM-017', proto: 'HTTP/3 (QUICv1)', connId: 'cid-33108-e', congestion: 'BBRv3', rtt: '4.1ms', status: 'ACTIVE' }
    ]
  },

  // UNIT #430: CDN Shield & Origin Protection
  {
    num: 430,
    folder: '05-cdn-shield-telemetry',
    id: 'GF-T2-CDN-05',
    name: 'CDN-SHIELD-TELEMETRY',
    subtitle: 'Tiered Cache Egress & Origin Shield Protection',
    accent: '#00F0FF',
    componentName: 'CdnShieldTelemetryCockpit',
    metric1: { label: 'ORIGIN OFFLOAD RATIO', value: '99.4', unit: '%', sub: 'SHIELD HIT: 98.9%', color: '#00F0FF' },
    metric2: { label: 'ORIGIN REQUEST PRESSURE', value: '142', unit: 'rps', sub: 'SAVINGS: $12,400/mo', color: '#FF9F0A' },
    svgType: 'cdn_shield',
    items: [
      { id: 'ZONE-ASSETS', hits: '14.2M/hr', misses: '12k/hr', offload: '99.9%', shieldPoP: 'IAD-01', status: 'SHIELDED' },
      { id: 'ZONE-API-DYNAMIC', hits: '4.8M/hr', misses: '48k/hr', offload: '99.0%', shieldPoP: 'LHR-02', status: 'SHIELDED' },
      { id: 'ZONE-SHOWROOM', hits: '8.1M/hr', misses: '18k/hr', offload: '99.8%', shieldPoP: 'FRA-01', status: 'SHIELDED' },
      { id: 'ZONE-MEDIA-BLOB', hits: '2.4M/hr', misses: '4k/hr', offload: '99.8%', shieldPoP: 'NRT-01', status: 'SHIELDED' },
      { id: 'ZONE-AUTH-STATIC', hits: '1.1M/hr', misses: '2k/hr', offload: '99.8%', shieldPoP: 'SYD-01', status: 'SHIELDED' }
    ]
  }
];
