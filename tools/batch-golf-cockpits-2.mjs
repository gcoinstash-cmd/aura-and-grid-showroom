/**
 * Batch Golf Cockpits — Part 2: Units #473 to #479 (Quant Finance & Algorithmic Liquidity)
 * Orderbook Depth L3, Darkpool Crossing, VWAP Execution, Arbitrage Spread, VaR Monte Carlo, Options Greeks Surface, Liquidation Cascade Shield
 */

export const QUANT_LIQUIDITY_COCKPITS = [
  // UNIT #473: Orderbook Depth L3
  {
    num: 473,
    folder: '08-orderbook-depth-l3',
    id: 'GF-T2-L3-08',
    name: 'ORDERBOOK-DEPTH-L3',
    subtitle: 'Tick-by-Tick Market By Order (MBO) Liquidity Visualizer',
    accent: '#00F0FF',
    componentName: 'OrderbookDepthL3Cockpit',
    metric1: { label: 'SPREAD BASIS POINTS', value: '0.5', unit: 'bps', sub: 'TOP-OF-BOOK QUEUE: 42.8 BTC', color: '#00F0FF' },
    metric2: { label: 'TICK INGESTION SPEED', value: '184', unit: 'k orders/s', sub: 'ITCH 5.0 FPGA DIRECT PARSER', color: '#FF9F0A' },
    svgType: 'orderbook_ladder',
    items: [
      { id: 'BID-L1-BEST', val: 'Price $68,420.50 // Qty 14.82 BTC (48 Orders)', status: 'TOP_BID', lat: 'Pos #1' },
      { id: 'BID-L2-DEPTH', val: 'Price $68,420.00 // Qty 38.40 BTC (112 Orders)', status: 'BID_DEPTH', lat: 'Pos #2' },
      { id: 'BID-L3-WALL', val: 'Price $68,419.50 // Qty 94.20 BTC (284 Orders)', status: 'ICEBERG_BID', lat: 'Pos #3' },
      { id: 'ASK-L1-BEST', val: 'Price $68,421.00 // Qty 12.40 BTC (39 Orders)', status: 'TOP_ASK', lat: 'Pos #1' },
      { id: 'ASK-L2-DEPTH', val: 'Price $68,421.50 // Qty 44.10 BTC (128 Orders)', status: 'ASK_DEPTH', lat: 'Pos #2' }
    ]
  },

  // UNIT #474: Darkpool Cross Engine
  {
    num: 474,
    folder: '09-darkpool-cross-engine',
    id: 'GF-T2-DARK-09',
    name: 'DARKPOOL-CROSS-ENGINE',
    subtitle: 'Midpoint Crossing & Concealed Liquidity Order Matcher',
    accent: '#FF9F0A',
    componentName: 'DarkpoolCrossEngineCockpit',
    metric1: { label: 'MIDPOINT FILL RATIO', value: '94.6', unit: '%', sub: 'ZERO MARKET IMPACT (SLIPPAGE: 0)', color: '#FF9F0A' },
    metric2: { label: 'CONCEALED BLOCK VOLUME', value: '$84.2', unit: 'M / hr', sub: 'MIN EXEC SIZE: $250,000', color: '#00F0FF' },
    svgType: 'darkpool_crossing',
    items: [
      { id: 'CROSS-BLOCK-1092', val: 'BTC-USDC Mid $68,420.75 // Size $4,200,000', status: 'MATCHED', lat: '0 Slippage' },
      { id: 'CROSS-BLOCK-1093', val: 'ETH-USDC Mid $3,540.20 // Size $1,850,000', status: 'MATCHED', lat: '0 Slippage' },
      { id: 'CROSS-BLOCK-1094', val: 'SOL-USDC Mid $184.50 // Size $920,000', status: 'MATCHED', lat: '0 Slippage' },
      { id: 'CROSS-BLOCK-1095', val: 'AVAX-USDC Mid $28.40 // Size $410,000', status: 'MATCHED', lat: '0 Slippage' },
      { id: 'IOI-INDICATION-01', val: 'LINK-USDC Mid $14.20 // Size $600,000 Pending', status: 'CROSS_PENDING', lat: 'Anti-Gamer' }
    ]
  },

  // UNIT #475: VWAP Execution Horizon
  {
    num: 475,
    folder: '10-vwap-execution-horizon',
    id: 'GF-T2-VWAP-10',
    name: 'VWAP-EXECUTION-HORIZON',
    subtitle: 'Volume-Weighted Average Price Slippage Benchmark Dyno',
    accent: '#00F0FF',
    componentName: 'VwapExecutionHorizonCockpit',
    metric1: { label: 'VWAP SLIPPAGE BENCHMARK', value: '-0.12', unit: 'bps', sub: 'SUPERIOR EXECUTION VS VENUE', color: '#00F0FF' },
    metric2: { label: 'PARTICIPATION RATE', value: '8.4', unit: '% vol', sub: 'ALVINE-URBANSKI OPTIMAL SLICE', color: '#FF9F0A' },
    svgType: 'vwap_bands',
    items: [
      { id: 'SLICE-INTERVAL-01', val: 'Target $68,418.20 // Realized $68,418.10', status: 'OUTPERFORM', lat: '-0.14 bps' },
      { id: 'SLICE-INTERVAL-02', val: 'Target $68,420.40 // Realized $68,420.35', status: 'OUTPERFORM', lat: '-0.07 bps' },
      { id: 'SLICE-INTERVAL-03', val: 'Target $68,422.10 // Realized $68,421.90', status: 'OUTPERFORM', lat: '-0.29 bps' },
      { id: 'SLICE-INTERVAL-04', val: 'Target $68,421.80 // Realized $68,421.85', status: 'NOMINAL', lat: '+0.07 bps' },
      { id: 'SLICE-INTERVAL-05', val: 'Target $68,423.50 // Realized $68,423.40', status: 'OUTPERFORM', lat: '-0.15 bps' }
    ]
  },

  // UNIT #476: Arbitrage Spread Radar
  {
    num: 476,
    folder: '11-arbitrage-spread-radar',
    id: 'GF-T2-ARB-11',
    name: 'ARBITRAGE-SPREAD-RADAR',
    subtitle: 'Cross-Exchange Triangular Basis Spread Scope',
    accent: '#FF9F0A',
    componentName: 'ArbitrageSpreadRadarCockpit',
    metric1: { label: 'NET BASIS SPREAD', value: '+4.8', unit: 'bps', sub: 'POST-FEE ANNUALIZED APR: 42.1%', color: '#FF9F0A' },
    metric2: { label: 'ATOMIC FILL LATENCY', value: '1.82', unit: 'ms', sub: 'ZERO LEGGING-OUT RISK', color: '#00F0FF' },
    svgType: 'triangular_spread',
    items: [
      { id: 'TRIANGLE-BINANCE-COINBASE', val: 'BTC-USDT -> USDT-USD -> USD-BTC', status: 'EXECUTED', lat: '+$1,420 Net' },
      { id: 'TRIANGLE-OKX-KRAKEN', val: 'ETH-USDT -> USDT-EUR -> EUR-ETH', status: 'EXECUTED', lat: '+$980 Net' },
      { id: 'TRIANGLE-BYBIT-DERIBIT', val: 'BTC-PERP -> BTC-SPOT -> BTC-FUT', status: 'EXECUTED', lat: '+$2,140 Net' },
      { id: 'TRIANGLE-UNISWAP-CURVE', val: 'USDC -> DAI -> USDT -> USDC', status: 'EXECUTED', lat: '+$420 Net' },
      { id: 'TRIANGLE-POLYGON-ARBITRUM', val: 'WETH-ARB -> STARGATE -> WETH-POL', status: 'EXECUTED', lat: '+$3,850 Net' }
    ]
  },

  // UNIT #477: VaR Risk Monte Carlo
  {
    num: 477,
    folder: '12-var-risk-montecarlo',
    id: 'GF-T2-VAR-12',
    name: 'VAR-RISK-MONTECARLO',
    subtitle: 'Parametric Value-at-Risk & 100k-Path Monte Carlo Engine',
    accent: '#00F0FF',
    componentName: 'VarRiskMontecarloCockpit',
    metric1: { label: '99% 1-DAY VAR RISK', value: '$184,200', unit: 'USD', sub: 'EXPECTED SHORTFALL (CVAR): $242K', color: '#00F0FF' },
    metric2: { label: 'SIMULATED PATHS RUN', value: '100,000', unit: 'PATHS', sub: 'CUDA HEURISTIC ENGINE (0.42s)', color: '#FF9F0A' },
    svgType: 'monte_carlo_paths',
    items: [
      { id: 'STRESS-LEHMAN-COLLAPSE', val: '-45% Shock // Port -$1.42M', status: 'SURVIVED', lat: '+$840k Buffer' },
      { id: 'STRESS-FLASH-CRASH-2010', val: '-9% 5-Min Shock // Port -$380K', status: 'SURVIVED', lat: '+$1.88M Buffer' },
      { id: 'STRESS-LUNA-DEPEG-2022', val: 'Stablecoin Collapse // Port -$120K', status: 'SURVIVED', lat: '+$2.14M Buffer' },
      { id: 'STRESS-VOLATILITY-SURGE', val: 'VIX -> 85 // Port +$480K (Long Vega)', status: 'HEDGED', lat: '+$2.74M Buffer' },
      { id: 'STRESS-RATES-HIKE-100BP', val: '+100 bps Fed // Port -$94K', status: 'SURVIVED', lat: '+$2.16M Buffer' }
    ]
  },

  // UNIT #478: Options Greeks Surface
  {
    num: 478,
    folder: '13-options-greeks-surface',
    id: 'GF-T2-GREEKS-13',
    name: 'OPTIONS-GREEKS-SURFACE',
    subtitle: 'Delta/Gamma/Vega Volatility Smile & Surface HUD',
    accent: '#FF9F0A',
    componentName: 'OptionsGreeksSurfaceCockpit',
    metric1: { label: 'PORTFOLIO NET DELTA', value: '+1.42', unit: 'Δ BTC', sub: 'DELTA-NEUTRAL BAND: ±2.0 Δ', color: '#FF9F0A' },
    metric2: { label: 'AGGREGATE VEGA EXPOSURE', value: '$8,420', unit: 'per 1% vol', sub: 'IMPLIED VOL SMILE SKEW: +3.2%', color: '#00F0FF' },
    svgType: 'volatility_surface',
    items: [
      { id: 'EXPIRY-7-DAYS', val: 'Delta +0.42 // Gamma +0.014 // IV 52.4%', status: 'NEUTRAL', lat: 'Vega +$1.2K' },
      { id: 'EXPIRY-30-DAYS', val: 'Delta +0.88 // Gamma +0.008 // IV 56.8%', status: 'NEUTRAL', lat: 'Vega +$3.4K' },
      { id: 'EXPIRY-60-DAYS', val: 'Delta +0.12 // Gamma +0.004 // IV 59.2%', status: 'NEUTRAL', lat: 'Vega +$2.1K' },
      { id: 'EXPIRY-90-DAYS', val: 'Delta -0.00 // Gamma +0.002 // IV 62.0%', status: 'NEUTRAL', lat: 'Vega +$1.7K' },
      { id: 'GAMMA-SCALPING-BOT', val: '42 Trades/24h // Realized Theta +$1,120', status: 'ACTIVE', lat: 'Edge +$2.48K' }
    ]
  },

  // UNIT #479: Liquidation Cascade Shield
  {
    num: 479,
    folder: '14-liquidation-cascade-shield',
    id: 'GF-T2-LIQ-14',
    name: 'LIQUIDATION-CASCADE-SHIELD',
    subtitle: 'Margin Call Warning & Collateral De-leveraging Radar',
    accent: '#00F0FF',
    componentName: 'LiquidationCascadeShieldCockpit',
    metric1: { label: 'HEALTH FACTOR BUFFER', value: '2.84', unit: 'HF', sub: 'CRITICAL LIQUIDATION AT 1.05 HF', color: '#00F0FF' },
    metric2: { label: 'COLLATERAL COVERAGE', value: '284', unit: '%', sub: 'AUTOMATED AUTO-UNWIND AT 135%', color: '#FF9F0A' },
    svgType: 'cascade_waterfall',
    items: [
      { id: 'COLLATERAL-STETH', val: '420.0 stETH ($1,486,800) // LTV 38.2%', status: 'OVER_COLLATERALIZED', lat: 'Max 82.5%' },
      { id: 'COLLATERAL-WBTC', val: '24.5 wBTC ($1,676,290) // LTV 34.8%', status: 'OVER_COLLATERALIZED', lat: 'Max 80.0%' },
      { id: 'BORROW-DEBT-USDC', val: '$980,000 USDC // APY 4.8%', status: 'PRISTINE', lat: '+$1.84M Buffer' },
      { id: 'BORROW-DEBT-USDT', val: '$420,000 USDT // APY 5.1%', status: 'PRISTINE', lat: '+$2.12M Buffer' },
      { id: 'AUTO-DELEVERAGE-SENTINEL', val: 'Trigger 1.20 HF // Flash Unwind Slip 0.5%', status: 'ARMED', lat: 'DryRun 0.12s' }
    ]
  }
];
