/**
 * Batch Foxtrot Cockpits — Part 4: Units #461 to #465 (Security, Cryptography & Compliance)
 * Merkle proof verifier, Audit trail tamper guard, RBAC permission evaluator, Rate limit sliding bubble, Zero-leak sanitizer
 */

export const SECURITY_CRYPTO_COCKPITS = [
  // UNIT #461: Merkle Proof Verifier
  {
    num: 461,
    folder: '16-merkle-proof-verifier',
    id: 'GF-T2-MERKLE-16',
    name: 'MERKLE-PROOF-VERIFIER',
    subtitle: 'Cryptographic Zero-Knowledge Inclusion & State Root Guard',
    accent: '#FF9F0A',
    componentName: 'MerkleProofVerifierCockpit',
    metric1: { label: 'MERKLE PROOF LATENCY', value: '0.04', unit: 'ms', sub: 'SHA-256 TREE DEPTH: 16', color: '#FF9F0A' },
    metric2: { label: 'STATE ROOT INTEGRITY', value: '100', unit: '%', sub: 'CRYPTOGRAPHIC AUDIT: OK', color: '#00F0FF' },
    svgType: 'merkle_tree',
    items: [
      { id: 'ROOT: 0x4819a...f021', leafCount: '65,536', depth: 16, verifiedLeaves: '100%', status: 'IMMUTABLE' },
      { id: 'PROOF: APA-TITLE-308', leafHash: '0x9912b...', siblingNodes: 16, verifyDuration: '0.04ms', status: 'INCLUDED' },
      { id: 'PROOF: APA-TITLE-364', leafHash: '0x1104c...', siblingNodes: 16, verifyDuration: '0.04ms', status: 'INCLUDED' },
      { id: 'PROOF: APA-TITLE-406', leafHash: '0x8841d...', siblingNodes: 16, verifyDuration: '0.04ms', status: 'INCLUDED' },
      { id: 'PROOF: APA-TITLE-446', leafHash: '0x3392e...', siblingNodes: 16, verifyDuration: '0.04ms', status: 'INCLUDED' }
    ]
  },

  // UNIT #462: Audit Trail Tamper Guard
  {
    num: 462,
    folder: '17-audit-trail-tamper-guard',
    id: 'GF-T2-AUDIT-17',
    name: 'AUDIT-TRAIL-TAMPER-GUARD',
    subtitle: 'Append-Only Hash-Chained Forensic Immutable Ledger',
    accent: '#00F0FF',
    componentName: 'AuditTrailTamperGuardCockpit',
    metric1: { label: 'IMMUTABLE LEDGER ENTRIES', value: '94,180,240', unit: 'EVENTS', sub: 'ZERO HASH BREAKS', color: '#00F0FF' },
    metric2: { label: 'FORENSIC AUDIT PASS', value: '100', unit: '%', sub: 'WORM STORAGE ARMED', color: '#FF9F0A' },
    svgType: 'blockchain_chain',
    items: [
      { id: 'BLOCK-941802', prevHash: '0x8812...09', currHash: '0x4421...aa', records: 100, status: 'SEALED' },
      { id: 'BLOCK-941801', prevHash: '0x3310...88', currHash: '0x8812...09', records: 100, status: 'SEALED' },
      { id: 'BLOCK-941800', prevHash: '0x7721...bc', currHash: '0x3310...88', records: 100, status: 'SEALED' },
      { id: 'BLOCK-941799', prevHash: '0x1194...de', currHash: '0x7721...bc', records: 100, status: 'SEALED' },
      { id: 'BLOCK-941798', prevHash: '0x0091...fa', currHash: '0x1194...de', records: 100, status: 'SEALED' }
    ]
  },

  // UNIT #463: RBAC / ABAC Permission Evaluator
  {
    num: 463,
    folder: '18-rbac-permission-evaluator',
    id: 'GF-T2-RBAC-18',
    name: 'RBAC-PERMISSION-EVALUATOR',
    subtitle: 'Attribute-Based Access Control (ABAC) & Identity Graph',
    accent: '#FF9F0A',
    componentName: 'RbacPermissionEvaluatorCockpit',
    metric1: { label: 'ACCESS DECISION LATENCY', value: '0.18', unit: 'ms', sub: 'EVALS: 148,000 / sec', color: '#FF9F0A' },
    metric2: { label: 'POLICY RE-EVALUATION CACHE', value: '99.4', unit: '%', sub: 'ZERO UNAUTHORIZED ACCESS', color: '#00F0FF' },
    svgType: 'rbac_graph',
    items: [
      { id: 'ROLE: DealershipPrincipal', permissions: 'ALL:ROOT', scope: 'GLOBAL', mfaRequired: true, status: 'SUPER_ADMIN' },
      { id: 'ROLE: LeadArchitect', permissions: 'DEPLOY:STAGING, SPEC:WRITE', scope: 'FLEET', mfaRequired: true, status: 'AUTHORIZED' },
      { id: 'ROLE: PortfolioAuditor', permissions: 'READ:TELEMETRY, READ:APA', scope: 'SHOWROOM', mfaRequired: true, status: 'AUTHORIZED' },
      { id: 'ROLE: CustomerTrial', permissions: 'DEMO:READONLY', scope: 'EPHEMERAL', mfaRequired: false, status: 'SANDBOX' },
      { id: 'ROLE: AutomatedServiceWorker', permissions: 'INGEST:SIGNALS', scope: 'INTERNAL', mfaRequired: true, status: 'SERVICE_ACCOUNT' }
    ]
  },

  // UNIT #464: Rate-Limit Sliding Bubble Throttler
  {
    num: 464,
    folder: '19-rate-limit-sliding-bubble',
    id: 'GF-T2-RATE-19',
    name: 'RATE-LIMIT-SLIDING-BUBBLE',
    subtitle: 'Leaky Bucket / Sliding Log Distributed IP Throttler',
    accent: '#00F0FF',
    componentName: 'RateLimitSlidingBubbleCockpit',
    metric1: { label: 'THROTTLED REQUEST RATIO', value: '0.12', unit: '%', sub: 'BURST TOLERANCE: 500 RPS', color: '#00F0FF' },
    metric2: { label: 'SLIDING WINDOW ACCURACY', value: '99.99', unit: '%', sub: 'REDIS CELL TOKEN BUCKET', color: '#FF9F0A' },
    svgType: 'bubble_limiter',
    items: [
      { id: 'IP: 198.51.100.42', limit: '10,000/min', consumed: '4,820', remaining: '5,180', status: 'ALLOW' },
      { id: 'IP: 203.0.113.89', limit: '1,000/min', consumed: '998', remaining: '2', status: 'WARNING' },
      { id: 'IP: 192.0.2.14', limit: '100/min', consumed: '142', remaining: '0', status: 'THROTTLED_429' },
      { id: 'API-KEY: key_live_99', limit: '50,000/min', consumed: '18,400', remaining: '31,600', status: 'ALLOW' },
      { id: 'API-KEY: key_free_01', limit: '500/min', consumed: '480', remaining: '20', status: 'ALLOW' }
    ]
  },

  // UNIT #465: Zero-Leak Payload Sanitizer
  {
    num: 465,
    folder: '20-zero-leak-payload-sanitizer',
    id: 'GF-T2-CLEAN-20',
    name: 'ZERO-LEAK-PAYLOAD-SANITIZER',
    subtitle: 'PII / Credit Card Regex Masker & Ingress Payload Scrubber',
    accent: '#FF9F0A',
    componentName: 'ZeroLeakPayloadSanitizerCockpit',
    metric1: { label: 'SCRUBBER THROUGHPUT', value: '184.2', unit: 'MB/s', sub: 'PII LEAKS PREVENTED: 100%', color: '#FF9F0A' },
    metric2: { label: 'SCRUBBING LATENCY OVERHEAD', value: '0.08', unit: 'ms', sub: 'PARALLEL SIMD REGEX', color: '#00F0FF' },
    svgType: 'sanitizer_filter',
    items: [
      { id: 'MASK-CREDIT-CARD', pattern: 'Luhn 16-Digit Regex', replacement: '****-****-****-1234', latency: '0.04ms', status: 'ACTIVE' },
      { id: 'MASK-SSN-TAX-ID', pattern: '9-Digit SSN Pattern', replacement: '***-**-6789', latency: '0.03ms', status: 'ACTIVE' },
      { id: 'MASK-API-SECRET-KEY', pattern: 'sk_live_ / Bearer Tokens', replacement: '[REDACTED_SECRET]', latency: '0.05ms', status: 'ACTIVE' },
      { id: 'MASK-PHONE-NUMBER', pattern: 'E.164 Global Phone Format', replacement: '+1 ***-***-4567', latency: '0.03ms', status: 'ACTIVE' },
      { id: 'MASK-EMAIL-ADDRESS', pattern: 'RFC 5322 Email Format', replacement: 'u***r@domain.com', latency: '0.04ms', status: 'ACTIVE' }
    ]
  }
];
