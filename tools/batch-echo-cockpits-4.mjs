/**
 * Batch Echo Cockpits — Part 4: Units #441 to #445 (Financial & Usage Telemetry)
 * API cost meter, Token burn dial, Satoshis accounting gauge, Cloud runway dashboard, Unit economics dyno
 */

export const FINANCIAL_USAGE_COCKPITS = [
  // UNIT #441: API Cost-Per-Call Meter
  {
    num: 441,
    folder: '16-api-cost-meter',
    id: 'GF-T2-COST-16',
    name: 'API-COST-METER',
    subtitle: 'Micro-Cent RPC Cost & Ingress Unit-Economics Gauge',
    accent: '#FF9F0A',
    componentName: 'ApiCostMeterCockpit',
    metric1: { label: 'AVERAGE COST PER RPC', value: '$0.000042', unit: 'USD', sub: 'GROSS MARGIN: 91.4%', color: '#FF9F0A' },
    metric2: { label: 'INGRESS MARGIN HEADROOM', value: '88.6', unit: '%', sub: 'CLOUD BILL: UNDER BUDGET', color: '#00F0FF' },
    svgType: 'cost_tachometer',
    items: [
      { id: 'ENDPOINT: /telemetry/heartbeat', calls: '48.2M/mo', costTotal: '$202.44', costPer1k: '$0.0042', status: 'PROFITABLE' },
      { id: 'ENDPOINT: /auth/session/token', calls: '12.1M/mo', costTotal: '$145.20', costPer1k: '$0.0120', status: 'PROFITABLE' },
      { id: 'ENDPOINT: /orderbook/depth/l2', calls: '64.8M/mo', costTotal: '$194.40', costPer1k: '$0.0030', status: 'PROFITABLE' },
      { id: 'ENDPOINT: /fleet/catalog/clusters', calls: '8.4M/mo', costTotal: '$42.00', costPer1k: '$0.0050', status: 'PROFITABLE' },
      { id: 'ENDPOINT: /billing/settlement/apa', calls: '420k/mo', costTotal: '$33.60', costPer1k: '$0.0800', status: 'PROFITABLE' }
    ]
  },

  // UNIT #442: Token Burn Rate Dial
  {
    num: 442,
    folder: '17-token-burn-dial',
    id: 'GF-T2-BURN-17',
    name: 'TOKEN-BURN-DIAL',
    subtitle: 'LLM Prompt / Completion Token Velocity & Budget Limiter',
    accent: '#00F0FF',
    componentName: 'TokenBurnDialCockpit',
    metric1: { label: 'BURN VELOCITY RATE', value: '42,100', unit: 't/sec', sub: 'GEMINI 2.0 FLASH CORE', color: '#00F0FF' },
    metric2: { label: 'CACHE EFFICIENCY REUSE', value: '78.4', unit: '%', sub: 'CONTEXT CACHE ACTIVE', color: '#FF9F0A' },
    svgType: 'burn_dial',
    items: [
      { id: 'AGENT-CHIEF-ARCHITECT', promptTokens: '1.2M/hr', completionTokens: '240k/hr', cacheHit: '84%', costEst: '$0.18/hr', status: 'ACTIVE' },
      { id: 'AGENT-CODE-GENERATOR', promptTokens: '3.4M/hr', completionTokens: '680k/hr', cacheHit: '76%', costEst: '$0.42/hr', status: 'ACTIVE' },
      { id: 'AGENT-TEST-VERIFIER', promptTokens: '980k/hr', completionTokens: '120k/hr', cacheHit: '89%', costEst: '$0.09/hr', status: 'ACTIVE' },
      { id: 'AGENT-SHOWROOM-BOT', promptTokens: '450k/hr', completionTokens: '80k/hr', cacheHit: '92%', costEst: '$0.04/hr', status: 'ACTIVE' },
      { id: 'AGENT-LEGAL-AUDITOR', promptTokens: '320k/hr', completionTokens: '40k/hr', cacheHit: '94%', costEst: '$0.02/hr', status: 'ACTIVE' }
    ]
  },

  // UNIT #443: Satoshis Micro-Accounting Gauge
  {
    num: 443,
    folder: '18-satoshis-accounting-gauge',
    id: 'GF-T2-SATS-18',
    name: 'SATOSHIS-ACCOUNTING-GAUGE',
    subtitle: 'Lightning Network Millisatoshis Streaming Settlement',
    accent: '#FF9F0A',
    componentName: 'SatoshisAccountingGaugeCockpit',
    metric1: { label: 'STREAMED SATS BALANCE', value: '1,420,850', unit: 'SATS', sub: 'SETTLED: 100% ON-CHAIN', color: '#FF9F0A' },
    metric2: { label: 'SETTLEMENT LATENCY', value: '0.84', unit: 'sec', sub: 'LIGHTNING HTLC ROUTE', color: '#00F0FF' },
    svgType: 'sats_stream',
    items: [
      { id: 'CHANNEL-01 (ACINQ)', balance: '840,000 sats', capacity: '2.0M sats', routedToday: '142k sats', fee: '1 ppm', status: 'OPEN' },
      { id: 'CHANNEL-02 (KRAKEN)', balance: '1,200,000 sats', capacity: '5.0M sats', routedToday: '380k sats', fee: '2 ppm', status: 'OPEN' },
      { id: 'CHANNEL-03 (BITSTAMP)', balance: '450,000 sats', capacity: '1.0M sats', routedToday: '84k sats', fee: '1 ppm', status: 'OPEN' },
      { id: 'CHANNEL-04 (RIVER)', balance: '920,000 sats', capacity: '2.5M sats', routedToday: '210k sats', fee: '2 ppm', status: 'OPEN' },
      { id: 'CHANNEL-05 (LIGHTNING-LABS)', balance: '1,800,000 sats', capacity: '5.0M sats', routedToday: '420k sats', fee: '1 ppm', status: 'OPEN' }
    ]
  },

  // UNIT #444: Cloud Spend Runway Dashboard
  {
    num: 444,
    folder: '19-cloud-runway-dashboard',
    id: 'GF-T2-RUNWAY-19',
    name: 'CLOUD-RUNWAY-DASHBOARD',
    subtitle: 'Burn Rate Extrapolator & 18-Month Runway Horizon',
    accent: '#00F0FF',
    componentName: 'CloudRunwayDashboardCockpit',
    metric1: { label: 'CURRENT RUNWAY HORIZON', value: '38.4', unit: 'MONTHS', sub: 'ZERO EXTERNAL DEBT', color: '#00F0FF' },
    metric2: { label: 'MONTHLY INFRA BURN', value: '$840', unit: '/mo', sub: 'REVENUE COVERAGE: 18x', color: '#FF9F0A' },
    svgType: 'runway_curve',
    items: [
      { id: 'BUDGET: Cloud Run Compute', allocated: '$450/mo', spent: '$320/mo', delta: '-$130', status: 'UNDER_BUDGET' },
      { id: 'BUDGET: Cloudflare Anycast CDN', allocated: '$200/mo', spent: '$160/mo', delta: '-$40', status: 'UNDER_BUDGET' },
      { id: 'BUDGET: Supabase PostgreSQL 16', allocated: '$150/mo', spent: '$120/mo', delta: '-$30', status: 'UNDER_BUDGET' },
      { id: 'BUDGET: KMS & Secrets Vault', allocated: '$100/mo', spent: '$80/mo', delta: '-$20', status: 'UNDER_BUDGET' },
      { id: 'BUDGET: S3 Blob Storage & Archive', allocated: '$200/mo', spent: '$160/mo', delta: '-$40', status: 'UNDER_BUDGET' }
    ]
  },

  // UNIT #445: Unit Economics Dyno
  {
    num: 445,
    folder: '20-unit-economics-dyno',
    id: 'GF-T2-DYNO-20',
    name: 'UNIT-ECONOMICS-DYNO',
    subtitle: 'Gross Margin Per Request & Infrastructure Efficiency Console',
    accent: '#FF9F0A',
    componentName: 'UnitEconomicsDynoCockpit',
    metric1: { label: 'FLEET GROSS MARGIN', value: '94.2', unit: '%', sub: 'LTV/CAC RATIO: 8.4x', color: '#FF9F0A' },
    metric2: { label: 'REVENUE / COMPUTE DOLLAR', value: '$17.20', unit: 'MSRP', sub: 'CAPITAL EFFICIENCY: HIGH', color: '#00F0FF' },
    svgType: 'margin_tachometer',
    items: [
      { id: 'TRACK-1: LEAN TUNER', retailAnchor: '$4,500', buildCost: '$210', grossMargin: '95.3%', payback: 'IMMEDIATE', status: 'MAX_MARGIN' },
      { id: 'TRACK-2: HYPERCAR FLAGSHIP', retailAnchor: '$14,500', buildCost: '$680', grossMargin: '95.3%', payback: 'IMMEDIATE', status: 'MAX_MARGIN' },
      { id: 'TRACK-3: F1 SERVICE ENGINE', retailAnchor: '$35,000', buildCost: '$1,850', grossMargin: '94.7%', payback: 'IMMEDIATE', status: 'MAX_MARGIN' },
      { id: 'SERVICE-PLAN: BESPOKE HOSTING', retailAnchor: '$1,500/mo', buildCost: '$80/mo', grossMargin: '94.6%', payback: 'RECURRING', status: 'HIGH_MARGIN' },
      { id: 'CLUSTER-CARVEOUT: 50-UNIT', retailAnchor: '$145,000', buildCost: '$7,200', grossMargin: '95.0%', payback: 'WIRE_CLOSE', status: 'ENTERPRISE' }
    ]
  }
];
