/**
 * Ghost FactoryOS Track 3 F1 Skunkworks Engine — GF-T3-165 (DIRECT4 HyperGrid)
 * TypeScript Deterministic CPMM Arbitrage & Bellman-Ford Engine
 * Mirrors app/core/arbitrage.py with 100% mathematical fidelity.
 */

export interface LiquidityPool {
  pool_id: string;
  venue_id: 'UNISWAP_V3' | 'SUSHISWAP' | 'CURVE_CRYPTO' | 'DIRECT4_EAXLE';
  token_a: string;
  token_b: string;
  reserve_a: number;
  reserve_b: number;
  fee_bps: number;
}

export interface DirectedEdge {
  pool: LiquidityPool;
  token_in: string;
  token_out: string;
  marginal_rate: number;
  log_weight: number;
}

export interface ArbitrageCycle {
  cycle_id: string;
  tokens: string[];
  pools: LiquidityPool[];
  optimal_input: number;
  expected_output: number;
  gross_profit: number;
  net_profit: number;
  profit_bps: number;
  execution_latency_ms: number;
  rear_torque_bias: number;
}

export function getEffectiveFeeFactor(fee_bps: number): number {
  return 1.0 - fee_bps / 10000.0;
}

export function getReserve(pool: LiquidityPool, token: string): number {
  if (token === pool.token_a) return pool.reserve_a;
  if (token === pool.token_b) return pool.reserve_b;
  throw new Error(`Token ${token} not in pool ${pool.pool_id}`);
}

export function getOtherToken(pool: LiquidityPool, token: string): string {
  if (token === pool.token_a) return pool.token_b;
  if (token === pool.token_b) return pool.token_a;
  throw new Error(`Token ${token} not in pool ${pool.pool_id}`);
}

export function getAmountOut(pool: LiquidityPool, amount_in: number, token_in: string): number {
  if (amount_in <= 0) return 0;
  const r_in = getReserve(pool, token_in);
  const token_out = getOtherToken(pool, token_in);
  const r_out = getReserve(pool, token_out);

  const gamma = getEffectiveFeeFactor(pool.fee_bps);
  const numerator = gamma * r_out * amount_in;
  const denominator = r_in + gamma * amount_in;
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

export function getMarginalPrice(pool: LiquidityPool, token_in: string): number {
  const r_in = getReserve(pool, token_in);
  const token_out = getOtherToken(pool, token_in);
  const r_out = getReserve(pool, token_out);
  const gamma = getEffectiveFeeFactor(pool.fee_bps);
  return gamma * (r_out / r_in);
}

export function composeTwoPools(
  r_x1: number,
  r_y1: number,
  gamma1: number,
  r_y2: number,
  r_x2: number,
  gamma2: number
): { a: number; b: number } {
  const denom = r_y2 + gamma2 * r_y1;
  if (denom <= 0) return { a: 0, b: 0 };
  const a = (gamma2 * r_x2 * r_y1) / denom;
  const b = (r_x1 * r_y2) / (gamma1 * denom);
  return { a, b };
}

export function calculateOptimalSwapSize2Pool(
  pool1: LiquidityPool,
  token_x: string,
  pool2: LiquidityPool
): { s_star: number; expected_out: number; net_profit: number } {
  const token_y = getOtherToken(pool1, token_x);
  const r_x1 = getReserve(pool1, token_x);
  const r_y1 = getReserve(pool1, token_y);
  const gamma1 = getEffectiveFeeFactor(pool1.fee_bps);

  const r_y2 = getReserve(pool2, token_y);
  const r_x2 = getReserve(pool2, token_x);
  const gamma2 = getEffectiveFeeFactor(pool2.fee_bps);

  const { a, b } = composeTwoPools(r_x1, r_y1, gamma1, r_y2, r_x2, gamma2);

  if (a <= b || b <= 0) {
    return { s_star: 0, expected_out: 0, net_profit: 0 };
  }

  const s_star = Math.sqrt(a * b) - b;
  if (s_star <= 0) {
    return { s_star: 0, expected_out: 0, net_profit: 0 };
  }

  const y_out = getAmountOut(pool1, s_star, token_x);
  const x_out = getAmountOut(pool2, y_out, token_y);
  const net_profit = x_out - s_star;

  return { s_star, expected_out: x_out, net_profit };
}

export function simulateMultiHopSwap(
  pools: LiquidityPool[],
  tokens: string[],
  amount_in: number
): number {
  let curr = amount_in;
  for (let i = 0; i < pools.length; i++) {
    curr = getAmountOut(pools[i], curr, tokens[i]);
    if (curr <= 0) return 0;
  }
  return curr;
}

export function optimizeCycleInputSize(
  pools: LiquidityPool[],
  tokens: string[]
): { s_star: number; expected_out: number; net_profit: number } {
  if (pools.length === 2) {
    return calculateOptimalSwapSize2Pool(pools[0], tokens[0], pools[1]);
  }

  let marginal_mult = 1.0;
  for (let i = 0; i < pools.length; i++) {
    marginal_mult *= getMarginalPrice(pools[i], tokens[i]);
  }

  if (marginal_mult <= 1.0001) {
    return { s_star: 0, expected_out: 0, net_profit: 0 };
  }

  let min_reserve = Infinity;
  for (let i = 0; i < pools.length; i++) {
    const res = getReserve(pools[i], tokens[i]);
    if (res < min_reserve) min_reserve = res;
  }

  let low = 1e-4;
  let high = min_reserve * 0.4;
  const phi = (Math.sqrt(5) - 1) / 2;

  const profitFn = (s: number): number => {
    if (s <= 0) return 0;
    return simulateMultiHopSwap(pools, tokens, s) - s;
  };

  let c = high - phi * (high - low);
  let d = low + phi * (high - low);

  for (let iter = 0; iter < 45; iter++) {
    if (Math.abs(high - low) < 1e-4) break;
    if (profitFn(c) < profitFn(d)) {
      low = c;
    } else {
      high = d;
    }
    c = high - phi * (high - low);
    d = low + phi * (high - low);
  }

  const s_star = (high + low) / 2.0;
  const expected_out = simulateMultiHopSwap(pools, tokens, s_star);
  const net_profit = expected_out - s_star;

  if (s_star <= 0 || net_profit <= 0) {
    return { s_star: 0, expected_out: 0, net_profit: 0 };
  }

  return { s_star, expected_out, net_profit };
}

export class BellmanFordArbitrageScanner {
  private pools: LiquidityPool[];

  constructor(pools: LiquidityPool[]) {
    this.pools = [...pools];
  }

  public setPools(pools: LiquidityPool[]) {
    this.pools = [...pools];
  }

  public scanCycles(
    base_token = 'USDC',
    max_hops = 3,
    min_profit_bps = 5
  ): ArbitrageCycle[] {
    const tokensSet = new Set<string>();
    this.pools.forEach((p) => {
      tokensSet.add(p.token_a);
      tokensSet.add(p.token_b);
    });
    const tokens = Array.from(tokensSet).sort();

    const edges: DirectedEdge[] = [];
    this.pools.forEach((p) => {
      const rateAtoB = getMarginalPrice(p, p.token_a);
      const rateBtoA = getMarginalPrice(p, p.token_b);

      edges.push({
        pool: p,
        token_in: p.token_a,
        token_out: p.token_b,
        marginal_rate: rateAtoB,
        log_weight: rateAtoB > 0 ? -Math.log(rateAtoB) : Infinity,
      });

      edges.push({
        pool: p,
        token_in: p.token_b,
        token_out: p.token_a,
        marginal_rate: rateBtoA,
        log_weight: rateBtoA > 0 ? -Math.log(rateBtoA) : Infinity,
      });
    });

    const dist: Record<string, number> = {};
    const pred: Record<string, DirectedEdge | null> = {};
    tokens.forEach((t) => {
      dist[t] = 0;
      pred[t] = null;
    });

    // Step 1: Relax edges |V| - 1 times
    for (let i = 0; i < tokens.length - 1; i++) {
      let relaxed = false;
      for (const edge of edges) {
        const u = edge.token_in;
        const v = edge.token_out;
        if (dist[u] + edge.log_weight < dist[v] - 1e-12) {
          dist[v] = dist[u] + edge.log_weight;
          pred[v] = edge;
          relaxed = true;
        }
      }
      if (!relaxed) break;
    }

    // Step 2: Negative cycle identification
    const cycles: ArbitrageCycle[] = [];
    const visited = new Set<string>();

    for (const edge of edges) {
      const u = edge.token_in;
      const v = edge.token_out;
      if (dist[u] + edge.log_weight < dist[v] - 1e-12) {
        // Trace back predecessor |V| steps
        let curr = v;
        for (let step = 0; step < tokens.length; step++) {
          const edgeIn = pred[curr];
          if (edgeIn) curr = edgeIn.token_in;
        }

        const cycleEdges: DirectedEdge[] = [];
        const cycleStart = curr;
        let stepNode = cycleStart;

        for (let iter = 0; iter <= max_hops + 2; iter++) {
          const edgeIn = pred[stepNode];
          if (!edgeIn) break;
          cycleEdges.push(edgeIn);
          stepNode = edgeIn.token_in;
          if (stepNode === cycleStart) break;
        }

        cycleEdges.reverse();
        if (cycleEdges.length < 2 || cycleEdges.length > max_hops) continue;

        let tokenSeq = cycleEdges.map((e) => e.token_in);
        tokenSeq.push(cycleEdges[cycleEdges.length - 1].token_out);
        let poolsSeq = cycleEdges.map((e) => e.pool);

        // Normalize cycle to start at base_token if part of it
        if (tokenSeq.includes(base_token)) {
          const idx = tokenSeq.indexOf(base_token);
          tokenSeq = [...tokenSeq.slice(idx, -1), ...tokenSeq.slice(0, idx), base_token];
          poolsSeq = [...poolsSeq.slice(idx), ...poolsSeq.slice(0, idx)];
        }

        const key = tokenSeq.join('->') + '|' + poolsSeq.map((p) => p.pool_id).join('-');
        if (visited.has(key)) continue;
        visited.add(key);

        const { s_star, expected_out, net_profit } = optimizeCycleInputSize(
          poolsSeq,
          tokenSeq.slice(0, -1)
        );

        if (s_star > 0 && net_profit > 0) {
          const profit_bps = (net_profit / s_star) * 10000;
          if (profit_bps >= min_profit_bps) {
            cycles.push({
              cycle_id: `CYC-${String(cycles.length + 1).padStart(3, '0')}`,
              tokens: tokenSeq,
              pools: poolsSeq,
              optimal_input: parseFloat(s_star.toFixed(4)),
              expected_output: parseFloat(expected_out.toFixed(4)),
              gross_profit: parseFloat((expected_out - s_star).toFixed(4)),
              net_profit: parseFloat(net_profit.toFixed(4)),
              profit_bps: parseFloat(profit_bps.toFixed(2)),
              execution_latency_ms: 2.18,
              rear_torque_bias: poolsSeq.length > 2 ? 0.8 : 0.4,
            });
          }
        }
      }
    }

    return cycles.sort((a, b) => b.net_profit - a.net_profit);
  }
}

export const INITIAL_POOLS: LiquidityPool[] = [
  {
    pool_id: 'POOL-UNI-USDC-WETH',
    venue_id: 'UNISWAP_V3',
    token_a: 'USDC',
    token_b: 'WETH',
    reserve_a: 10_000_000,
    reserve_b: 3_333.3333,
    fee_bps: 30,
  },
  {
    pool_id: 'POOL-SUSHI-USDC-WETH',
    venue_id: 'SUSHISWAP',
    token_a: 'USDC',
    token_b: 'WETH',
    reserve_a: 8_000_000,
    reserve_b: 2_640.0, // WETH priced ~3030 USDC vs 3000 USDC -> 1.0% cross-venue spread
    fee_bps: 30,
  },
  {
    pool_id: 'POOL-UNI-WETH-WBTC',
    venue_id: 'UNISWAP_V3',
    token_a: 'WETH',
    token_b: 'WBTC',
    reserve_a: 2_500,
    reserve_b: 118,
    fee_bps: 30,
  },
  {
    pool_id: 'POOL-CURVE-WETH-WBTC',
    venue_id: 'CURVE_CRYPTO',
    token_a: 'WETH',
    token_b: 'WBTC',
    reserve_a: 3_000,
    reserve_b: 143,
    fee_bps: 30,
  },
  {
    pool_id: 'POOL-UNI-WBTC-USDC',
    venue_id: 'UNISWAP_V3',
    token_a: 'WBTC',
    token_b: 'USDC',
    reserve_a: 100,
    reserve_b: 6_450_000,
    fee_bps: 30,
  },
  {
    pool_id: 'POOL-DIRECT4-WBTC-USDC',
    venue_id: 'DIRECT4_EAXLE',
    token_a: 'WBTC',
    token_b: 'USDC',
    reserve_a: 150,
    reserve_b: 9_780_000, // Direct eAxle rear motor with 15 bps low fee execution
    fee_bps: 15,
  },
];
