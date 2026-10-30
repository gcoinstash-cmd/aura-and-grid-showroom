/**
 * Batch Echo Cockpits — Part 3: Units #436 to #440 (DevSecOps Cockpits)
 * Vulnerability triage board, Container layer analyzer, Secret alert wall, CI/CD pipeline flow, Policy enforcement grid
 */

export const DEVSECOPS_COCKPITS = [
  // UNIT #436: Vulnerability Scan Triage Board
  {
    num: 436,
    folder: '11-vulnerability-triage-board',
    id: 'GF-T2-VULN-11',
    name: 'VULNERABILITY-TRIAGE-BOARD',
    subtitle: 'Real-Time CVE Severity Matrix & Automated Patch Radar',
    accent: '#00F0FF',
    componentName: 'VulnerabilityTriageBoardCockpit',
    metric1: { label: 'CRITICAL CVE BACKLOG', value: '0', unit: 'CRITICAL', sub: 'RESOLVED: 100%', color: '#00F0FF' },
    metric2: { label: 'MEAN TIME TO REMEDIATE', value: '42', unit: 'min', sub: 'ZERO EXPLOITABLE SURFACE', color: '#FF9F0A' },
    svgType: 'vuln_matrix',
    items: [
      { id: 'CVE-2026-1192', pkg: 'openssl-3.0.14', severity: 'MEDIUM', patchAvailable: 'YES', fix: '3.0.15-r0', status: 'AUTO_PATCHED' },
      { id: 'CVE-2026-0841', pkg: 'libcurl-8.7.1', severity: 'LOW', patchAvailable: 'YES', fix: '8.7.2-r0', status: 'AUTO_PATCHED' },
      { id: 'CVE-2026-0042', pkg: 'linux-kernel-6.8', severity: 'CRITICAL', patchAvailable: 'YES', fix: '6.8.12-sec', status: 'DEPLOYED' },
      { id: 'CVE-2026-3390', pkg: 'busybox-1.36.1', severity: 'LOW', patchAvailable: 'NO', fix: 'VULN_SHIELD', status: 'MITIGATED' },
      { id: 'CVE-2026-4421', pkg: 'node-24.14.0', severity: 'MEDIUM', patchAvailable: 'YES', fix: '24.15.0', status: 'CURRENT' }
    ]
  },

  // UNIT #437: Container Image Layer Analyzer
  {
    num: 437,
    folder: '12-container-layer-analyzer',
    id: 'GF-T2-LAYER-12',
    name: 'CONTAINER-LAYER-ANALYZER',
    subtitle: 'OCI Container Image Bloat & Dependency Exploder',
    accent: '#FF9F0A',
    componentName: 'ContainerLayerAnalyzerCockpit',
    metric1: { label: 'TOTAL IMAGE FOOTPRINT', value: '18.4', unit: 'MB', sub: 'DISTROLESS BASE', color: '#FF9F0A' },
    metric2: { label: 'LAYER REUSE EFFICIENCY', value: '94.2', unit: '%', sub: 'CACHE HIT RATIO', color: '#00F0FF' },
    svgType: 'layer_stack',
    items: [
      { id: 'LAYER-01', desc: 'FROM gcr.io/distroless/nodejs22', size: '12.1 MB', cached: true, hash: 'sha256:48192a...', status: 'SHARED' },
      { id: 'LAYER-02', desc: 'COPY --chown=nonroot app/ /app', size: '4.2 MB', cached: true, hash: 'sha256:99810c...', status: 'BUILD' },
      { id: 'LAYER-03', desc: 'COPY package.json /app/', size: '12 KB', cached: true, hash: 'sha256:11094b...', status: 'SHARED' },
      { id: 'LAYER-04', desc: 'COPY licenses/ LICENSE.md', size: '4 KB', cached: true, hash: 'sha256:77218d...', status: 'SHARED' },
      { id: 'LAYER-05', desc: 'ENTRYPOINT ["node", "server.js"]', size: '0 B', cached: true, hash: 'sha256:33991e...', status: 'METADATA' }
    ]
  },

  // UNIT #438: Secret Exposure Alert Wall
  {
    num: 438,
    folder: '13-secret-alert-wall',
    id: 'GF-T2-WALL-13',
    name: 'SECRET-ALERT-WALL',
    subtitle: 'Git Pre-Commit Leak & Unencrypted Key Wall',
    accent: '#00F0FF',
    componentName: 'SecretAlertWallCockpit',
    metric1: { label: 'SECRETS DETECTED IN COMMITS', value: '0', unit: 'LEAKS', sub: 'PRE-COMMIT HOOK: 100%', color: '#00F0FF' },
    metric2: { label: 'ENTROPY SCAN LATENCY', value: '4.2', unit: 'ms', sub: 'REGEX ENGINE: COMPILED', color: '#FF9F0A' },
    svgType: 'secret_shield',
    items: [
      { id: 'RULE-AWS-AKIA', regex: 'AKIA[0-9A-Z]{16}', entropy: '3.82', status: 'BLOCKED', hits: 0 },
      { id: 'RULE-STRIPE-SK', regex: 'sk_live_[0-9a-zA-Z]{24}', entropy: '4.12', status: 'BLOCKED', hits: 0 },
      { id: 'RULE-PRIVATE-KEY', regex: '-----BEGIN OPENSSH PRIVATE', entropy: '4.91', status: 'BLOCKED', hits: 0 },
      { id: 'RULE-GITHUB-TOKEN', regex: 'ghp_[0-9a-zA-Z]{36}', entropy: '4.02', status: 'BLOCKED', hits: 0 },
      { id: 'RULE-POSTGRES-URL', regex: 'postgres://[^:]+:[^@]+@', entropy: '3.95', status: 'BLOCKED', hits: 0 }
    ]
  },

  // UNIT #439: CI/CD Pipeline Flow
  {
    num: 439,
    folder: '14-cicd-pipeline-flow',
    id: 'GF-T2-CICD-14',
    name: 'CICD-PIPELINE-FLOW',
    subtitle: 'Concurrent Build Stage DAG & Artifact Promotion Horizon',
    accent: '#FF9F0A',
    componentName: 'CicdPipelineFlowCockpit',
    metric1: { label: 'MEAN BUILD DURATION', value: '1m 14s', unit: 'TIME', sub: 'CACHE WARMED: 100%', color: '#FF9F0A' },
    metric2: { label: 'PIPELINE SUCCESS RATE', value: '100', unit: '%', sub: 'RUNS: 1,420 (0 FAILED)', color: '#00F0FF' },
    svgType: 'pipeline_dag',
    items: [
      { id: 'STAGE-1: LINT', duration: '4.2s', concurrency: 'x8', tool: 'Biome + TypeScript', status: 'SUCCESS' },
      { id: 'STAGE-2: TEST', duration: '12.8s', concurrency: 'x16', tool: 'Node test runner + Pytest', status: 'SUCCESS' },
      { id: 'STAGE-3: AUDIT', duration: '8.1s', concurrency: 'x4', tool: 'Trivy + SBOM Scan', status: 'SUCCESS' },
      { id: 'STAGE-4: BUILD', duration: '24.2s', concurrency: 'x4', tool: 'Docker BuildKit + OCI', status: 'SUCCESS' },
      { id: 'STAGE-5: PROMO', duration: '6.4s', concurrency: 'x1', tool: 'Cloud Run Canary Deploy', status: 'SUCCESS' }
    ]
  },

  // UNIT #440: Policy Enforcement Grid
  {
    num: 440,
    folder: '15-policy-enforcement-grid',
    id: 'GF-T2-POLICY-15',
    name: 'POLICY-ENFORCEMENT-GRID',
    subtitle: 'OPA / Gatekeeper Admission Controller Compliance Console',
    accent: '#00F0FF',
    componentName: 'PolicyEnforcementGridCockpit',
    metric1: { label: 'ADMISSION COMPLIANCE', value: '100', unit: '%', sub: 'VIOLATIONS: 0 BLOCKED', color: '#00F0FF' },
    metric2: { label: 'WEBHOOK EVALUATION LATENCY', value: '0.62', unit: 'ms', sub: 'OPA WASM ENGINE', color: '#FF9F0A' },
    svgType: 'policy_grid',
    items: [
      { id: 'POL-REQUIRE-RUNASNONROOT', target: 'PodSecurityStandards', enforcement: 'ENFORCE', latency: '0.4ms', status: 'COMPLIANT' },
      { id: 'POL-NO-PRIVILEGED-CONTAINERS', target: 'ContainerSecurity', enforcement: 'ENFORCE', latency: '0.3ms', status: 'COMPLIANT' },
      { id: 'POL-STRICT-INGRESS-TLS', target: 'NetworkingV1', enforcement: 'ENFORCE', latency: '0.5ms', status: 'COMPLIANT' },
      { id: 'POL-LIMIT-CPU-REQUESTS', target: 'ResourceManagement', enforcement: 'ENFORCE', latency: '0.4ms', status: 'COMPLIANT' },
      { id: 'POL-IMAGE-REGISTRY-WHITELIST', target: 'SupplyChainSecurity', enforcement: 'ENFORCE', latency: '0.8ms', status: 'COMPLIANT' }
    ]
  }
];
