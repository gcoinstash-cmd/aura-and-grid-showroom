/**
 * GF-T3-209: APEX-209 Quantitative Mathematics & Vector Engine
 * Pure TypeScript implementation of:
 * 1. Cornish-Fisher Parametric Expansion
 * 2. Hull-White Volatility-Updating (EWMA lambda=0.94)
 * 3. Peaks-Over-Threshold Extreme Value Theory (EVT GPD)
 * 4. 10,000-Path Correlated Cholesky Monte Carlo Simulation
 * 5. Kupiec POF & Christoffersen Independence Backtesting
 * 6. SHA-256 Append-Only Cryptographic State Ledger
 */

import {
  RiskEvaluationResult,
  MonteCarloSummary,
  KupiecResult,
  ChristoffersenResult,
  AuditBlockData
} from '../types/risk';

export const BASKET_1_CORE_EQUITY = "SYNTH-MULTI-ASSET-01 (CORE-EQUITY / VOL-PROXY / RATES-INDEX)";
export const BASKET_2_QUANT_FACTOR = "QUANT-FACTOR-BASKET (ALPHA-FACTOR / MOMENTUM-VECTOR)";
export const BASKET_3_CREDIT_SPREAD = "CREDIT-SPREAD-SYNTH (SENIOR-DEBT / MEZZ-TRANCHE)";

// Standard normal cumulative distribution function
export function standardNormalCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.SQRT2;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX));

  return 0.5 * (1.0 + sign * y);
}

// Wichura AS 241 algorithm for standard normal quantile
export function standardNormalQuantile(p: number): number {
  if (p <= 0.0 || p >= 1.0) {
    throw new Error("Probability p must lie in (0, 1)");
  }

  const q = p - 0.5;
  if (Math.abs(q) <= 0.425) {
    const r = 0.180625 - q * q;
    return q * (((((((2.5090809287301226727e+3 * r +
                      3.3430575583588128105e+4) * r +
                      6.7265770927008700853e+4) * r +
                      4.5921953931549871457e+4) * r +
                      1.3731693765509461125e+4) * r +
                      1.6573145980072793140e+3) * r +
                      5.4988451877478086022e+1) * r +
                      1.0) / (((((((5.2264952788528545610e+3 * r +
                      2.8729085735721942674e+4) * r +
                      3.9307895800092710610e+4) * r +
                      2.1213794301586595867e+4) * r +
                      5.3941960214247511077e+3) * r +
                      6.8718700749205790830e+2) * r +
                      4.2313330701600911252e+1) * r +
                      1.0);
  }

  let r = p < 0.5 ? p : 1.0 - p;
  r = Math.sqrt(-Math.log(r));
  let val: number;

  if (r <= 5.0) {
    r = r - 1.6;
    val = (((((((7.74545014278341407640e-4 * r +
                2.27238449892697758373e-2) * r +
                2.41780725177450611770e-1) * r +
                1.27045825245236838258e+0) * r +
                3.64784832476320460504e+0) * r +
                5.76949722146069140550e+0) * r +
                4.63033784615654529590e+0) * r +
                1.42343711074968357734e+0) / (((((((1.05075007164441684324e-9 * r +
                5.47593808499534494600e-4) * r +
                1.51986665636164571966e-2) * r +
                1.48103976427480074590e-1) * r +
                6.89767334985100004550e-1) * r +
                1.67638483018380384940e+0) * r +
                2.05319162663775882187e+0) * r +
                1.0);
  } else {
    r = r - 5.0;
    val = (((((((2.01033439929228813265e-7 * r +
                2.71155556874348757815e-5) * r +
                1.24266120338054998580e-3) * r +
                2.65321897265764230300e-2) * r +
                2.96560571828504891230e-1) * r +
                1.78482653991729133580e+0) * r +
                5.46378491116411436990e+0) * r +
                6.65790464350110377720e+0) / (((((((2.04426310699107973530e-15 * r +
                1.42151175831644588870e-7) * r +
                1.84631831751005468180e-5) * r +
                7.86869131145613259100e-4) * r +
                1.48753612908506148525e-2) * r +
                1.36929880922735805310e-1) * r +
                5.99832206555887937690e-1) * r +
                1.0);
  }

  return q < 0.0 ? -val : val;
}

export function chi2Cdf(x: number, df: number): number {
  if (x <= 0) return 0.0;
  if (df === 1) {
    return 2.0 * standardNormalCdf(Math.sqrt(x)) - 1.0;
  } else if (df === 2) {
    return 1.0 - Math.exp(-0.5 * x);
  } else {
    const z = (Math.pow(x / df, 1.0 / 3.0) - (1.0 - 2.0 / (9.0 * df))) / Math.sqrt(2.0 / (9.0 * df));
    return standardNormalCdf(z);
  }
}

// Compute sample moments: mean, standard deviation, skewness, excess kurtosis
export function computeMoments(data: number[]): { mean: number; std: number; skew: number; kurt: number } {
  const n = data.length;
  if (n < 4) throw new Error("Need >= 4 observations");
  const mean = data.reduce((acc, val) => acc + val, 0) / n;
  
  let m2 = 0;
  let m3 = 0;
  let m4 = 0;
  for (let i = 0; i < n; i++) {
    const d = data[i] - mean;
    const d2 = d * d;
    m2 += d2;
    m3 += d2 * d;
    m4 += d2 * d2;
  }
  m2 /= n;
  m3 /= n;
  m4 /= n;

  const std = Math.sqrt(Math.max((m2 * n) / (n - 1), 1e-12));
  const skew = m2 > 1e-12 ? m3 / Math.pow(m2, 1.5) : 0;
  const kurt = m2 > 1e-12 ? (m4 / Math.pow(m2, 2.0)) - 3.0 : 0;

  return { mean, std, skew, kurt };
}

// Cornish-Fisher quantile adjustment
export function cornishFisherQuantile(alpha: number, skewness: number, excessKurt: number): number {
  const z = standardNormalQuantile(alpha);
  const z2 = z * z;
  const z3 = z2 * z;

  const t1 = (skewness / 6.0) * (z2 - 1.0);
  const t2 = (excessKurt / 24.0) * (z3 - 3.0 * z);
  const t3 = ((skewness * skewness) / 36.0) * (2.0 * z3 - 5.0 * z);

  return z + t1 + t2 - t3;
}

// Fit Generalized Pareto Distribution via Method of Moments
export function fitGpdMoments(exceedances: number[]): { xi: number; beta: number } {
  const nU = exceedances.length;
  if (nU < 5) return { xi: 0.24, beta: 50000 };

  const yBar = exceedances.reduce((acc, y) => acc + y, 0) / nU;
  let sumSq = 0;
  for (let i = 0; i < nU; i++) {
    const diff = exceedances[i] - yBar;
    sumSq += diff * diff;
  }
  const varY = Math.max(sumSq / (nU - 1), 1e-12);

  let xi = 0.5 * (1.0 - (yBar * yBar) / varY);
  // Constrain to heavy-tailed Fréchet domain (0.01 <= xi <= 0.49)
  if (xi <= 0.01) xi = 0.215;
  if (xi >= 0.49) xi = 0.44;

  let beta = yBar * (1.0 - xi);
  if (beta <= 0) beta = yBar * 0.75;

  return { xi, beta };
}

// Synthetic market data generator with realistic fat tails and volatility clustering
export function generateSyntheticHistory(
  days: number = 750,
  volShockMultiplier: number = 1.0,
  flashLiquidity: boolean = false,
  tailCorrelationBreakdown: boolean = false
): { returns: number[]; losses: number[]; notional: number } {
  const notional = 10000000; // 10,000,000 Units
  const returns: number[] = [];

  let currentVol = 0.011 * volShockMultiplier;
  const baseDrift = 0.00015;

  // Pseudo-random deterministic seed for consistent baseline
  let seed = 42;
  const nextRand = () => {
    seed = (1664525 * seed + 1013904223) % 4294967296;
    return (seed + 0.5) / 4294967296;
  };

  for (let t = 0; t < days; t++) {
    // Standard normal shock
    const u1 = Math.max(nextRand(), 1e-10);
    const u2 = nextRand();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    // GARCH-style vol clustering
    const shockScale = flashLiquidity && t > days - 30 ? 2.8 : 1.0;
    let r = baseDrift + currentVol * shockScale * z;

    // Fat tail Pareto jumps (simulating tail shocks)
    const jumpProb = tailCorrelationBreakdown ? 0.08 : 0.04;
    if (nextRand() < jumpProb) {
      const jumpU = Math.max(nextRand(), 1e-8);
      const jumpMagnitude = -0.018 * Math.pow(jumpU, -0.28) * volShockMultiplier;
      r += jumpMagnitude;
    }

    returns.push(r);

    // Dynamic EWMA volatility evolution
    const dailyReturnSq = r * r;
    currentVol = Math.sqrt(0.06 * dailyReturnSq + 0.94 * (currentVol * currentVol));
  }

  const losses = returns.map(r => -r * notional);
  return { returns, losses, notional };
}

// Master evaluation function across all 3 methodologies
export function evaluateMultiRegimeRisk(
  returns: number[],
  losses: number[],
  alpha: number = 0.99,
  notionalUnits: number = 10000000
): RiskEvaluationResult {
  const { mean, std, skew, kurt } = computeMoments(returns);

  // METHODOLOGY 1: CORNISH-FISHER EXPANSION
  const zCf = cornishFisherQuantile(alpha, skew, kurt);
  const cfVarPct = -(mean - zCf * std);
  const cfVarUnits = Math.max(0, cfVarPct * notionalUnits);

  // Analytical upper tail integration for Cornish-Fisher Expected Shortfall
  const tailSteps = 60;
  const pStep = (0.9999 - alpha) / tailSteps;
  let esSum = 0;
  for (let i = 0; i < tailSteps; i++) {
    const pEval = alpha + (i + 0.5) * pStep;
    const zEval = cornishFisherQuantile(pEval, skew, kurt);
    esSum += -(mean - zEval * std);
  }
  let cfEsPct = esSum / tailSteps;
  if (cfEsPct < cfVarPct) cfEsPct = cfVarPct * 1.14;
  const cfEsUnits = cfEsPct * notionalUnits;

  // METHODOLOGY 2: HULL-WHITE HISTORICAL SIMULATION
  const decayLambda = 0.94;
  const n = returns.length;
  const variances: number[] = [returns[0] * returns[0]];
  for (let t = 1; t < n; t++) {
    const v = (1.0 - decayLambda) * (returns[t - 1] * returns[t - 1]) + decayLambda * variances[t - 1];
    variances.push(v);
  }
  const sigmaCurrent = Math.sqrt(Math.max(variances[n - 1], 1e-12));

  const scaledLosses: number[] = [];
  for (let t = 0; t < n; t++) {
    const sigmaT = Math.sqrt(Math.max(variances[t], 1e-12));
    const scaledR = returns[t] * (sigmaCurrent / sigmaT);
    scaledLosses.push(-scaledR * notionalUnits);
  }
  scaledLosses.sort((a, b) => a - b);

  const hwIdx = Math.min(n - 1, Math.max(0, Math.ceil(alpha * n) - 1));
  const hwVarUnits = Math.max(0, scaledLosses[hwIdx]);
  const hwVarPct = (hwVarUnits / notionalUnits) * 100;

  const hwTailLosses = scaledLosses.filter(l => l >= hwVarUnits);
  let hwEsUnits = hwTailLosses.length > 0
    ? hwTailLosses.reduce((acc, l) => acc + l, 0) / hwTailLosses.length
    : hwVarUnits * 1.08;
  if (hwEsUnits < hwVarUnits) hwEsUnits = hwVarUnits * 1.1;
  const hwEsPct = (hwEsUnits / notionalUnits) * 100;

  // METHODOLOGY 3: EXTREME VALUE THEORY (EVT) PEAKS-OVER-THRESHOLD (POT)
  const sortedLosses = [...losses].sort((a, b) => a - b);
  const thresholdQuantile = 0.95;
  const uIdx = Math.floor(thresholdQuantile * n);
  const thresholdU = sortedLosses[uIdx];

  const exceedances = sortedLosses.filter(l => l > thresholdU).map(l => l - thresholdU);
  const nU = exceedances.length;
  const { xi, beta } = fitGpdMoments(exceedances);

  // Asymptotic EVT VaR formula:
  // VaR_alpha = u + (beta / xi) * [ ((N / N_u) * (1 - alpha))^(-xi) - 1 ]
  const pTail = (n / Math.max(nU, 1)) * (1.0 - alpha);
  const term = Math.pow(Math.max(pTail, 1e-6), -xi) - 1.0;
  let evtVarUnits = thresholdU + (beta / xi) * term;
  evtVarUnits = Math.max(thresholdU, evtVarUnits);

  // Asymptotic EVT Expected Shortfall formula:
  // ES_alpha = VaR_alpha / (1 - xi) + (beta - xi * u) / (1 - xi)
  let evtEsUnits = (evtVarUnits / (1.0 - xi)) + ((beta - xi * thresholdU) / (1.0 - xi));
  if (evtEsUnits < evtVarUnits) evtEsUnits = evtVarUnits * 1.16;

  const evtVarPct = (evtVarUnits / notionalUnits) * 100;
  const evtEsPct = (evtEsUnits / notionalUnits) * 100;

  return {
    alpha,
    notionalUnits,
    meanPct: mean * 100,
    volatilityPct: std * 100,
    skewness: skew,
    excessKurtosis: kurt,
    
    cfVarUnits,
    cfVarPct: cfVarPct * 100,
    cfEsUnits,
    cfEsPct: cfEsPct * 100,
    cfZQuantile: zCf,

    hwVarUnits,
    hwVarPct,
    hwEsUnits,
    hwEsPct,
    hwCurrentVolPct: sigmaCurrent * 100,

    evtVarUnits,
    evtVarPct,
    evtEsUnits,
    evtEsPct,
    evtThresholdUnits: thresholdU,
    evtTailIndexXi: xi,
    evtScaleBetaUnits: beta,
    evtExceedanceCount: nU
  };
}

// 10,000-Path Monte Carlo Simulation with Cholesky factorization
export function runMonteCarlo10k(
  weights: [number, number, number] = [0.45, 0.35, 0.20],
  volMultiplier: number = 1.0,
  correlationBreakdown: boolean = false,
  notionalUnits: number = 10000000
): MonteCarloSummary {
  const pathCount = 10000;
  
  // Dynamic 3x3 covariance matrix between synthetic baskets
  const baseCorrel = correlationBreakdown ? 0.78 : 0.32;
  const sig1 = 0.014 * volMultiplier;
  const sig2 = 0.021 * volMultiplier;
  const sig3 = 0.009 * volMultiplier;

  const cov = [
    [sig1 * sig1, baseCorrel * sig1 * sig2, (baseCorrel * 0.7) * sig1 * sig3],
    [baseCorrel * sig1 * sig2, sig2 * sig2, (baseCorrel * 0.8) * sig2 * sig3],
    [(baseCorrel * 0.7) * sig1 * sig3, (baseCorrel * 0.8) * sig2 * sig3, sig3 * sig3]
  ];

  // Cholesky decomposition L
  const L = [
    [Math.sqrt(cov[0][0]), 0, 0],
    [cov[1][0] / Math.sqrt(cov[0][0]), 0, 0],
    [cov[2][0] / Math.sqrt(cov[0][0]), 0, 0]
  ];
  L[1][1] = Math.sqrt(Math.max(cov[1][1] - L[1][0] * L[1][0], 1e-12));
  L[2][1] = (cov[2][1] - L[2][0] * L[1][0]) / L[1][1];
  L[2][2] = Math.sqrt(Math.max(cov[2][2] - L[2][0] * L[2][0] - L[2][1] * L[2][1], 1e-12));

  const simulatedLosses: number[] = new Array(pathCount);

  let seed = 98765;
  const nextRand = () => {
    seed = (1664525 * seed + 1013904223) % 4294967296;
    return (seed + 0.5) / 4294967296;
  };

  for (let i = 0; i < pathCount; i++) {
    // 3 standard normal variates
    const u1 = Math.max(nextRand(), 1e-10);
    const u2 = nextRand();
    const u3 = Math.max(nextRand(), 1e-10);
    const u4 = nextRand();

    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
    const z2 = Math.sqrt(-2.0 * Math.log(u3)) * Math.cos(2.0 * Math.PI * u4);

    const x0 = L[0][0] * z0;
    const x1 = L[1][0] * z0 + L[1][1] * z1;
    const x2 = L[2][0] * z0 + L[2][1] * z1 + L[2][2] * z2;

    const portReturn = weights[0] * x0 + weights[1] * x1 + weights[2] * x2;
    simulatedLosses[i] = -portReturn * notionalUnits;
  }

  simulatedLosses.sort((a, b) => a - b);

  const idx95 = Math.floor(0.95 * pathCount);
  const idx99 = Math.floor(0.99 * pathCount);
  const idx995 = Math.floor(0.995 * pathCount);

  const var95Units = simulatedLosses[idx95];
  const var99Units = simulatedLosses[idx99];
  const var995Units = simulatedLosses[idx995];

  const tail99 = simulatedLosses.slice(idx99);
  const es99Units = tail99.reduce((a, b) => a + b, 0) / tail99.length;
  const worstLossUnits = simulatedLosses[pathCount - 1];

  return {
    pathCount,
    worstLossUnits,
    var95Units,
    var99Units,
    var995Units,
    es99Units,
    simulatedLosses
  };
}

// Kupiec POF Likelihood Ratio Test
export function evaluateKupiecTest(failures: number, totalObs: number = 250, alpha: number = 0.99): KupiecResult {
  const p = 1.0 - alpha;
  const x = failures;
  const n = totalObs;
  const pHat = x / n;

  let lrStat = 0;
  if (x === 0) {
    lrStat = -2.0 * ((n - x) * Math.log(1.0 - p));
  } else if (x === n) {
    lrStat = -2.0 * (x * Math.log(p));
  } else {
    const logNum = (n - x) * Math.log(1.0 - p) + x * Math.log(p);
    const logDen = (n - x) * Math.log(1.0 - pHat) + x * Math.log(pHat);
    lrStat = -2.0 * (logNum - logDen);
  }
  lrStat = Math.max(0, lrStat);
  const pValue = 1.0 - chi2Cdf(lrStat, 1);
  const isAccepted = pValue >= 0.05;

  const baselZone: 'GREEN' | 'YELLOW' | 'RED' = x <= 4 ? 'GREEN' : x <= 9 ? 'YELLOW' : 'RED';

  return {
    failures: x,
    totalObs: n,
    nominalRatePct: p * 100,
    empiricalRatePct: pHat * 100,
    lrStat,
    pValue,
    isAccepted,
    baselZone
  };
}

// Christoffersen Independence Test
export function evaluateChristoffersenTest(breachSeries: number[]): ChristoffersenResult {
  let n00 = 0;
  let n01 = 0;
  let n10 = 0;
  let n11 = 0;

  for (let i = 0; i < breachSeries.length - 1; i++) {
    const s0 = breachSeries[i];
    const s1 = breachSeries[i + 1];
    if (s0 === 0 && s1 === 0) n00++;
    else if (s0 === 0 && s1 === 1) n01++;
    else if (s0 === 1 && s1 === 0) n10++;
    else if (s0 === 1 && s1 === 1) n11++;
  }

  const total = n00 + n01 + n10 + n11;
  const pi0 = total > 0 ? (n01 + n11) / total : 0;
  const pi01 = (n00 + n01) > 0 ? n01 / (n00 + n01) : 0;
  const pi11 = (n10 + n11) > 0 ? n11 / (n10 + n11) : 0;

  let lrStat = 0;
  try {
    const logNum = (n00 + n10) * Math.log(Math.max(1.0 - pi0, 1e-12)) + (n01 + n11) * Math.log(Math.max(pi0, 1e-12));
    let logDen = 0;
    if (n00 > 0) logDen += n00 * Math.log(Math.max(1.0 - pi01, 1e-12));
    if (n01 > 0) logDen += n01 * Math.log(Math.max(pi01, 1e-12));
    if (n10 > 0) logDen += n10 * Math.log(Math.max(1.0 - pi11, 1e-12));
    if (n11 > 0) logDen += n11 * Math.log(Math.max(pi11, 1e-12));
    lrStat = Math.max(0, -2.0 * (logNum - logDen));
  } catch {
    lrStat = 0;
  }

  const pValue = 1.0 - chi2Cdf(lrStat, 1);
  const isIndependent = pValue >= 0.05;

  return {
    n00,
    n01,
    n10,
    n11,
    pi01,
    pi11,
    lrStat,
    pValue,
    isIndependent
  };
}

// Pure JS SHA-256 implementation for synchronous browser cryptographic hashing
export function sha256Hex(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0;
  let j = 0;
  const result: string[] = [];

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isPrime = (n: number) => {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength | 0;

  for (j = 0; j < words.length;) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const s_0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const s_1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const temp1 = (hash[7] + s_1 + ch + k[i] + w[i]) | 0;
      const temp2 = (s_0 + maj) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result.push((b < 16 ? '0' : '') + b.toString(16));
    }
  }

  return result.join('');
}

export function createAuditBlock(
  index: number,
  eventType: string,
  payload: Record<string, string | number | boolean>,
  prevHash: string
): AuditBlockData {
  const timestamp = new Date().toISOString();
  const serialized = JSON.stringify(payload);
  const payloadHash = sha256Hex(serialized);
  const header = index + ":" + timestamp + ":" + eventType + ":" + payloadHash + ":" + prevHash;
  const blockHash = sha256Hex(header);

  return {
    index,
    timestamp,
    eventType,
    payloadHash,
    prevHash,
    blockHash,
    payload
  };
}

export function verifyLedgerChain(chain: AuditBlockData[]): { isValid: boolean; error: string | null } {
  for (let i = 1; i < chain.length; i++) {
    const curr = chain[i];
    const prev = chain[i - 1];

    if (curr.prevHash !== prev.blockHash) {
      return { isValid: false, error: "Hash chain broken at Block #" + curr.index + " (prevHash does not match previous blockHash)" };
    }

    const payloadRehash = sha256Hex(JSON.stringify(curr.payload));
    if (curr.payloadHash !== payloadRehash) {
      return { isValid: false, error: "Payload tampering detected at Block #" + curr.index + " (payload hash mismatch)" };
    }

    const header = curr.index + ":" + curr.timestamp + ":" + curr.eventType + ":" + curr.payloadHash + ":" + curr.prevHash;
    const blockRehash = sha256Hex(header);
    if (curr.blockHash !== blockRehash) {
      return { isValid: false, error: "Block header tampering detected at Block #" + curr.index };
    }
  }
  return { isValid: true, error: null };
}
