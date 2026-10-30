/**
 * Batch Delta Cockpits — Part 1: Units #406 to #410 (Security & Trust)
 * WAF inspector, Zero-trust session viewer, API key rotator, SSL cert telemetry, Bot mitigation
 */

export const SECURITY_COCKPITS = [
  // UNIT #406: WAF Inspector
  {
    num: 406,
    folder: '01-waf-inspector',
    id: 'GF-T2-WAF-01',
    name: 'WAF-INSPECTOR',
    subtitle: 'L7 Deep Inspection & WAF Rules Engine',
    accent: '#00F0FF',
    componentName: 'WafInspectorCockpit',
    metric1: { label: 'THREAT MITIGATION RATE', value: '99.98', unit: '%', sub: 'BLOCKED: 14,892 rq/s', color: '#00F0FF' },
    metric2: { label: 'RULE EXECUTION LATENCY', value: '0.42', unit: 'ms', sub: 'eBPF KERNEL BYPASS', color: '#FF9F0A' },
    svgType: 'waf_radar',
    items: [
      { id: 'RULE-SQLI-01', rule: 'OWASP-CRS: SQLi Union Probe', action: 'BLOCK_DROP', ip: '198.51.100.44', geo: 'US-VA', latency: '0.38ms' },
      { id: 'RULE-XSS-02', rule: 'Script Vector in Cookie Header', action: 'CHALLENGE_CAPTCHA', ip: '203.0.113.89', geo: 'SG-SIN', latency: '0.41ms' },
      { id: 'RULE-RCE-03', rule: 'Log4j / JNDI Expression Lookup', action: 'BLOCK_RESET', ip: '192.0.2.14', geo: 'DE-FRA', latency: '0.29ms' },
      { id: 'RULE-PATH-04', rule: 'Directory Traversal ..//..//', action: 'BLOCK_DROP', ip: '185.220.101.5', geo: 'NL-AMS', latency: '0.35ms' },
      { id: 'RULE-AUTH-05', rule: 'Credential Stuffing Anomaly', action: 'RATE_LIMIT_429', ip: '45.154.255.88', geo: 'BR-SAO', latency: '0.46ms' }
    ]
  },

  // UNIT #407: Zero-Trust Session Viewer
  {
    num: 407,
    folder: '02-zero-trust-session',
    id: 'GF-T2-SESSION-02',
    name: 'ZERO-TRUST-SESSION',
    subtitle: 'mTLS & Ephemeral JWT Identity Perimeter',
    accent: '#FF9F0A',
    componentName: 'ZeroTrustSessionCockpit',
    metric1: { label: 'ACTIVE IDENTITY SESSIONS', value: '8,420', unit: 'mTLS', sub: 'VALIDATED: 100%', color: '#FF9F0A' },
    metric2: { label: 'EPHEMERAL TOKEN LIFETIME', value: '300', unit: 'sec', sub: 'ROTATING IN: 42s', color: '#00F0FF' },
    svgType: 'session_mesh',
    items: [
      { id: 'SES-9912', principal: 'service:payments-worker-3', cert: 'SPIFFE:ID-0921', alg: 'Ed25519', ip: '10.240.4.12', status: 'VERIFIED' },
      { id: 'SES-9913', principal: 'operator:lead-arch@auragrid', cert: 'FIDO2-Yubi-5C', alg: 'ECDSA-P256', ip: '172.16.8.99', status: 'PRIVILEGED' },
      { id: 'SES-9914', principal: 'service:ingest-telemetry-01', cert: 'SPIFFE:ID-0442', alg: 'Ed25519', ip: '10.240.2.88', status: 'VERIFIED' },
      { id: 'SES-9915', principal: 'operator:audit-bot-sec', cert: 'mTLS-X509-v3', alg: 'RSA-4096', ip: '10.240.1.15', status: 'READONLY' },
      { id: 'SES-9916', principal: 'service:orderbook-engine', cert: 'DPDK-KMS-007', alg: 'Post-Quantum', ip: '10.240.0.4', status: 'CRITICAL' }
    ]
  },

  // UNIT #408: API Key Rotator Console
  {
    num: 408,
    folder: '03-api-key-rotator',
    id: 'GF-T2-ROTATOR-03',
    name: 'API-KEY-ROTATOR',
    subtitle: 'Zero-Downtime Secret & Key Lifecycle Vault',
    accent: '#00F0FF',
    componentName: 'ApiKeyRotatorCockpit',
    metric1: { label: 'ACTIVE MANAGED SECRETS', value: '1,248', unit: 'KEYS', sub: 'ZERO EXPIRED', color: '#00F0FF' },
    metric2: { label: 'AUTO-ROTATION CYCLE', value: '24', unit: 'HRS', sub: 'NEXT SWAP: 1h 14m', color: '#FF9F0A' },
    svgType: 'rotation_ring',
    items: [
      { id: 'KEY-PG-MASTER', target: 'PostgreSQL RDS Primary', algo: 'AES-256-GCM', age: '18h 42m', grace: 'Dual-Active', status: 'ROTATING' },
      { id: 'KEY-STRIPE-LIVE', target: 'Stripe Settlement Webhook', algo: 'HMAC-SHA256', age: '4h 12m', grace: 'Synced', status: 'ACTIVE' },
      { id: 'KEY-REDIS-AUTH', target: 'ElastiCache L2 Cluster', algo: 'Argon2id', age: '22h 50m', grace: 'Queued', status: 'PENDING' },
      { id: 'KEY-AWS-KMS-01', target: 'IAM Telemetry Egress Role', algo: 'RSA-OAEP', age: '2h 10m', grace: 'Synced', status: 'ACTIVE' },
      { id: 'KEY-JWT-SIGNER', target: 'AuraGrid Auth Issuer', algo: 'Ed25519', age: '12h 05m', grace: 'Dual-Active', status: 'SYNCED' }
    ]
  },

  // UNIT #409: SSL/TLS Certificate Telemetry
  {
    num: 409,
    folder: '04-ssl-cert-telemetry',
    id: 'GF-T2-CERT-04',
    name: 'SSL-CERT-RADAR',
    subtitle: 'Anycast Edge Certificate & OCSP Stapling Radar',
    accent: '#FF9F0A',
    componentName: 'SslCertTelemetryCockpit',
    metric1: { label: 'MINIMUM CERT VALIDITY', value: '84', unit: 'DAYS', sub: 'AUTO-ACME ARMED', color: '#FF9F0A' },
    metric2: { label: 'OCSP STAPLE LATENCY', value: '1.8', unit: 'ms', sub: 'CACHE HIT: 99.9%', color: '#00F0FF' },
    svgType: 'cert_radar',
    items: [
      { id: 'CERT-01', domain: 'api.auraandgrid.com', issuer: "Let's Encrypt E6", cipher: 'TLS_AES_256_GCM_SHA384', days: '84d', ocsp: 'STAPLED' },
      { id: 'CERT-02', domain: 'vault.ghostfactoryos.internal', issuer: 'Internal CA Root v2', cipher: 'TLS_CHACHA20_POLY1305', days: '320d', ocsp: 'VALID' },
      { id: 'CERT-03', domain: 'telemetry.cluster-008.io', issuer: 'DigiCert TLS G2', cipher: 'TLS_AES_128_GCM_SHA256', days: '192d', ocsp: 'STAPLED' },
      { id: 'CERT-04', domain: 'edge.cockpit-fleet.dev', issuer: "Let's Encrypt E5", cipher: 'TLS_AES_256_GCM_SHA384', days: '62d', ocsp: 'STAPLED' },
      { id: 'CERT-05', domain: 'auth.showroom-mesh.net', issuer: 'Cloudflare Inc ECC-3', cipher: 'TLS_CHACHA20_POLY1305', days: '110d', ocsp: 'STAPLED' }
    ]
  },

  // UNIT #410: Bot Mitigation Cockpit
  {
    num: 410,
    folder: '05-bot-mitigation',
    id: 'GF-T2-BOT-05',
    name: 'BOT-DEFENSE-GRID',
    subtitle: 'Autonomous CAPTCHAless Behavioral Entropy Shield',
    accent: '#00F0FF',
    componentName: 'BotMitigationCockpit',
    metric1: { label: 'BOT TRAFFIC SHUNTED', value: '42.8', unit: '%', sub: 'ZERO HUMAN FRICTION', color: '#00F0FF' },
    metric2: { label: 'CLIENT ENTROPY SCORE', value: '98.6', unit: '/100', sub: 'PROOF-OF-WORK ACTIVE', color: '#FF9F0A' },
    svgType: 'bot_entropy',
    items: [
      { id: 'SIG-BOT-01', userAgent: 'HeadlessChrome/124.0.0 (Scraper)', fingerprint: 'fp-9981-a', confidence: '99.4%', action: 'SILENT_TARPIT' },
      { id: 'SIG-BOT-02', userAgent: 'Python-urllib/3.11 Automated Scan', fingerprint: 'fp-1102-c', confidence: '99.8%', action: 'POISON_PAYLOAD' },
      { id: 'SIG-HUMAN-03', userAgent: 'Mozilla/5.0 Mac OS X Safari/17.4', fingerprint: 'fp-4412-f', confidence: '1.2%', action: 'FAST_PASSTHROUGH' },
      { id: 'SIG-BOT-04', userAgent: 'Go-http-client/2.0 Credential Rig', fingerprint: 'fp-8841-b', confidence: '98.9%', action: 'DROP_CONNECTION' },
      { id: 'SIG-HUMAN-05', userAgent: 'Mozilla/5.0 Linux Firefox/125.0', fingerprint: 'fp-3319-e', confidence: '2.4%', action: 'FAST_PASSTHROUGH' }
    ]
  }
];
