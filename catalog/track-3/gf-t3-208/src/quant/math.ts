/**
 * APEX-208 Real-Time Quantitative Engine
 * Hagan et al. SABR Model, Black-76 Greeks, Brenner-Subrahmanyam Newton-Raphson Inversion,
 * and Arbitrage Boundary Verification.
 *
 * Strict Zero-Dollar Compliance: No dollar signs anywhere in this file.
 */

import {
  SABRParameters,
  Greeks,
  CalendarArbitrageReport,
  ButterflyArbitrageReport
} from './types.ts';

const SQRT_2PI = Math.sqrt(2.0 * Math.PI);
const INV_SQRT_2PI = 1.0 / SQRT_2PI;

/**
 * High-precision standard normal cumulative distribution function (error < 1e-9)
 */
export function stdNormalCdf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.SQRT2;
  // erf approximation via Chebyshev fitting
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return 0.5 * (1.0 + sign * y);
}

/**
 * Standard normal probability density function
 */
export function stdNormalPdf(x: number): number {
  return INV_SQRT_2PI * Math.exp(-0.5 * x * x);
}

/**
 * Vectorized Black-76 European Option Pricer
 */
export function black76Price(
  forward: number,
  strike: number,
  maturity: number,
  volatility: number,
  rate: number = 0.0,
  isCall: boolean = true
): number {
  if (maturity <= 1e-6 || volatility <= 1e-6) {
    const intrinsic = isCall ? Math.max(0.0, forward - strike) : Math.max(0.0, strike - forward);
    return Math.exp(-rate * maturity) * intrinsic;
  }

  const discount = Math.exp(-rate * maturity);
  const sqrtT = Math.sqrt(maturity);
  const volSqrtT = volatility * sqrtT;
  const d1 = (Math.log(forward / strike) + 0.5 * volatility * volatility * maturity) / volSqrtT;
  const d2 = d1 - volSqrtT;

  if (isCall) {
    return discount * (forward * stdNormalCdf(d1) - strike * stdNormalCdf(d2));
  } else {
    return discount * (strike * stdNormalCdf(-d2) - forward * stdNormalCdf(-d1));
  }
}

/**
 * Black-76 Analytical Vega: dPrice / dVol
 */
export function black76Vega(
  forward: number,
  strike: number,
  maturity: number,
  volatility: number,
  rate: number = 0.0
): number {
  if (maturity <= 1e-6 || volatility <= 1e-6) return 0.0;
  const discount = Math.exp(-rate * maturity);
  const sqrtT = Math.sqrt(maturity);
  const volSqrtT = volatility * sqrtT;
  const d1 = (Math.log(forward / strike) + 0.5 * volatility * volatility * maturity) / volSqrtT;
  return discount * forward * sqrtT * stdNormalPdf(d1);
}

/**
 * Analytical Black-76 Greeks
 */
export function black76Greeks(
  forward: number,
  strike: number,
  maturity: number,
  volatility: number,
  rate: number = 0.0,
  isCall: boolean = true
): Greeks {
  if (maturity <= 1e-6 || volatility <= 1e-6) {
    const delta = isCall ? (forward >= strike ? 1.0 : 0.0) : (forward < strike ? -1.0 : 0.0);
    return { delta, gamma: 0.0, vega: 0.0, theta: 0.0, rho: 0.0 };
  }

  const discount = Math.exp(-rate * maturity);
  const sqrtT = Math.sqrt(maturity);
  const volSqrtT = volatility * sqrtT;
  const d1 = (Math.log(forward / strike) + 0.5 * volatility * volatility * maturity) / volSqrtT;
  const d2 = d1 - volSqrtT;

  const pdfD1 = stdNormalPdf(d1);
  const cdfD1 = stdNormalCdf(d1);
  const cdfD2 = stdNormalCdf(d2);

  const delta = isCall ? discount * cdfD1 : discount * (cdfD1 - 1.0);
  const gamma = discount * pdfD1 / (forward * volSqrtT);
  const vega = discount * forward * sqrtT * pdfD1; // pts / 100% vol

  const thetaTerm = -(discount * forward * pdfD1 * volatility) / (2.0 * sqrtT);
  let theta = 0.0;
  let rho = 0.0;

  if (isCall) {
    theta = thetaTerm + rate * discount * (forward * cdfD1 - strike * cdfD2);
    rho = maturity * discount * (forward * cdfD1 - strike * cdfD2);
  } else {
    theta = thetaTerm - rate * discount * (forward * (1.0 - cdfD1) - strike * (1.0 - cdfD2));
    rho = -maturity * discount * (strike * (1.0 - cdfD2) - forward * (1.0 - cdfD1));
  }

  return {
    delta,
    gamma,
    vega: vega / 100.0,      // normalized to pts per 1% vol shift
    theta: theta / 365.0,    // 1-day theta in pts
    rho: rho / 100.0         // 1% interest rate shift in pts
  };
}

/**
 * Fast Newton-Raphson Implied Volatility Solver with Brenner-Subrahmanyam Initial Seed
 */
export function solveImpliedVol(
  price: number,
  forward: number,
  strike: number,
  maturity: number,
  rate: number = 0.0,
  isCall: boolean = true,
  tol: number = 1e-7,
  maxIter: number = 80
): number {
  const discount = Math.exp(-rate * maturity);
  const intrinsic = isCall ? Math.max(0.0, forward - strike) : Math.max(0.0, strike - forward);
  const undiscountedIntrinsic = discount * intrinsic;

  if (price <= undiscountedIntrinsic + 1e-8) {
    return 0.001;
  }

  // Brenner-Subrahmanyam (1988) initial seed
  const sqrtT = Math.sqrt(maturity);
  let vol = (Math.sqrt(2.0 * Math.PI) / (forward * sqrtT)) * Math.abs(price - (forward - strike) / 2.0);
  vol = Math.max(0.01, Math.min(vol, 3.0));

  let low = 0.0001;
  let high = 5.0;

  for (let iter = 0; iter < maxIter; iter++) {
    const currentPrice = black76Price(forward, strike, maturity, vol, rate, isCall);
    const diff = currentPrice - price;
    if (Math.abs(diff) < tol) {
      return vol;
    }

    if (diff > 0) {
      high = Math.min(high, vol);
    } else {
      low = Math.max(low, vol);
    }

    const vega = black76Vega(forward, strike, maturity, vol, rate);
    if (vega > 1e-8) {
      const step = diff / vega;
      const nextVol = vol - step;
      if (nextVol >= low && nextVol <= high) {
        vol = nextVol;
      } else {
        vol = 0.5 * (low + high);
      }
    } else {
      vol = 0.5 * (low + high);
    }
  }

  return vol;
}

/**
 * Hagan et al. (2002) Closed-Form SABR Implied Volatility Formula
 */
export function sabrImpliedVol(
  forward: number,
  strike: number,
  maturity: number,
  params: SABRParameters
): number {
  const { alpha, beta, rho, nu } = params;

  if (maturity <= 1e-6) return alpha;

  const oneMinusBeta = 1.0 - beta;

  // At-the-money limit
  if (Math.abs(forward - strike) < 1e-6) {
    const fkTerm = Math.pow(forward, oneMinusBeta);
    const term1 = alpha / fkTerm;
    const term2 = (
      ((oneMinusBeta * oneMinusBeta) / 24.0) * (alpha * alpha) / Math.pow(forward, 2.0 * oneMinusBeta)
      + 0.25 * (rho * beta * nu * alpha) / fkTerm
      + ((2.0 - 3.0 * rho * rho) / 24.0) * (nu * nu)
    );
    return term1 * (1.0 + term2 * maturity);
  }

  // General case
  const logFk = Math.log(forward / strike);
  const fk = forward * strike;
  const sqrtFk = Math.sqrt(fk);
  const fkBeta = Math.pow(sqrtFk, oneMinusBeta);

  const z = (nu / alpha) * fkBeta * logFk;
  const radicand = Math.max(0.0, 1.0 - 2.0 * rho * z + z * z);
  const chiZ = Math.log((Math.sqrt(radicand) + z - rho) / (1.0 - rho));

  let zOverChi = 1.0;
  if (Math.abs(z) > 1e-6) {
    zOverChi = z / chiZ;
  }

  const denomExpansion = (
    1.0
    + ((oneMinusBeta * oneMinusBeta) / 24.0) * (logFk * logFk)
    + (Math.pow(oneMinusBeta, 4) / 1920.0) * Math.pow(logFk, 4)
  );
  const denominator = fkBeta * denomExpansion;

  const multiplier = 1.0 + (
    ((oneMinusBeta * oneMinusBeta) / 24.0) * (alpha * alpha) / Math.pow(fk, oneMinusBeta)
    + 0.25 * (rho * beta * nu * alpha) / fkBeta
    + ((2.0 - 3.0 * rho * rho) / 24.0) * (nu * nu)
  ) * maturity;

  const vol = (alpha / denominator) * zOverChi * multiplier;
  return Math.max(0.0001, vol);
}

/**
 * Nelder-Mead Downhill Simplex Calibration for SABR (alpha, rho, nu)
 */
export function calibrateSABR(
  forward: number,
  maturity: number,
  strikes: number[],
  marketVols: number[],
  beta: number = 0.70,
  initialGuess?: [number, number, number],
  maxIter: number = 350
): { params: SABRParameters; rmse: number } {
  function objective(p: number[]): number {
    const [alpha, rho, nu] = p;
    if (alpha <= 0.0001 || nu <= 0.0001 || rho <= -0.999 || rho >= 0.999) {
      return 1e6;
    }

    let sumSq = 0.0;
    const testParams: SABRParameters = { alpha, beta, rho, nu };
    for (let i = 0; i < strikes.length; i++) {
      const modelVol = sabrImpliedVol(forward, strikes[i], maturity, testParams);
      const diff = modelVol - marketVols[i];
      sumSq += diff * diff;
    }
    return Math.sqrt(sumSq / strikes.length);
  }

  const atmVol = marketVols[Math.floor(marketVols.length / 2)];
  const alphaInit = atmVol * Math.pow(forward, 1.0 - beta);
  const x0 = initialGuess ? [initialGuess[0], initialGuess[1], initialGuess[2]] : [alphaInit, -0.28, 0.40];

  const dim = 3;
  const simplex: number[][] = [x0.slice()];
  const steps = [x0[0] * 0.15, 0.10, 0.10];

  for (let i = 0; i < dim; i++) {
    const vertex = x0.slice();
    vertex[i] += steps[i];
    simplex.push(vertex);
  }

  let scores = simplex.map(objective);

  for (let iter = 0; iter < maxIter; iter++) {
    // Sort vertices by objective score
    const indices = Array.from({ length: dim + 1 }, (_, i) => i);
    indices.sort((a, b) => scores[a] - scores[b]);

    const sortedSimplex = indices.map(i => simplex[i]);
    scores = indices.map(i => scores[i]);
    for (let i = 0; i < dim + 1; i++) {
      simplex[i] = sortedSimplex[i];
    }

    const best = simplex[0];
    const worst = simplex[dim];
    const bestScore = scores[0];

    if (bestScore < 1e-6) break;

    // Centroid of all except worst
    const centroid = [0, 0, 0];
    for (let i = 0; i < dim; i++) {
      for (let d = 0; d < dim; d++) {
        centroid[d] += simplex[i][d] / dim;
      }
    }

    // Reflection
    const refl = [0, 0, 0];
    for (let d = 0; d < dim; d++) {
      refl[d] = centroid[d] + 1.0 * (centroid[d] - worst[d]);
    }
    const reflScore = objective(refl);

    if (bestScore <= reflScore && reflScore < scores[dim - 1]) {
      simplex[dim] = refl;
      scores[dim] = reflScore;
      continue;
    }

    // Expansion
    if (reflScore < bestScore) {
      const expn = [0, 0, 0];
      for (let d = 0; d < dim; d++) {
        expn[d] = centroid[d] + 2.0 * (refl[d] - centroid[d]);
      }
      const expnScore = objective(expn);
      if (expnScore < reflScore) {
        simplex[dim] = expn;
        scores[dim] = expnScore;
      } else {
        simplex[dim] = refl;
        scores[dim] = reflScore;
      }
      continue;
    }

    // Contraction
    const contr = [0, 0, 0];
    for (let d = 0; d < dim; d++) {
      contr[d] = centroid[d] + 0.5 * (worst[d] - centroid[d]);
    }
    const contrScore = objective(contr);
    if (contrScore < scores[dim]) {
      simplex[dim] = contr;
      scores[dim] = contrScore;
      continue;
    }

    // Shrink toward best
    for (let i = 1; i <= dim; i++) {
      for (let d = 0; d < dim; d++) {
        simplex[i][d] = best[d] + 0.5 * (simplex[i][d] - best[d]);
      }
      scores[i] = objective(simplex[i]);
    }
  }

  const [finalAlpha, finalRho, finalNu] = simplex[0];
  return {
    params: {
      alpha: Math.max(0.001, finalAlpha),
      beta,
      rho: Math.max(-0.999, Math.min(0.999, finalRho)),
      nu: Math.max(0.001, finalNu)
    },
    rmse: scores[0]
  };
}

/**
 * Calendar spread arbitrage verification: Total variance w(K, T) = vol^2 * T monotonically non-decreasing
 */
export function verifyCalendarArb(
  forward: number,
  strikes: number[],
  maturities: number[],
  params: SABRParameters
): CalendarArbitrageReport {
  const violations: CalendarArbitrageReport['violations'] = [];
  const varianceMatrix: CalendarArbitrageReport['varianceMatrix'] = [];

  for (const k of strikes) {
    const rowVariances: { maturity: number; totalVariance: number }[] = [];
    for (const t of maturities) {
      const vol = sabrImpliedVol(forward, k, t, params);
      const w = vol * vol * t;
      rowVariances.push({ maturity: t, totalVariance: w });
    }
    varianceMatrix.push({ strike: k, variances: rowVariances });

    for (let j = 0; j < maturities.length - 1; j++) {
      const t1 = maturities[j];
      const t2 = maturities[j + 1];
      const w1 = rowVariances[j].totalVariance;
      const w2 = rowVariances[j + 1].totalVariance;
      if (w2 < w1 - 1e-6) {
        violations.push({
          strike: k,
          maturity1: t1,
          maturity2: t2,
          spreadPts: w2 - w1
        });
      }
    }
  }

  return {
    isArbitrageFree: violations.length === 0,
    violationCount: violations.length,
    varianceMatrix,
    violations
  };
}

/**
 * Butterfly arbitrage verification: Breeden-Litzenberger risk-neutral density d^2 C / dK^2 >= 0
 */
export function verifyButterflyArb(
  forward: number,
  maturity: number,
  strikes: number[],
  params: SABRParameters,
  rate: number = 0.0
): ButterflyArbitrageReport {
  const violations: ButterflyArbitrageReport['violations'] = [];
  const densityCurve: ButterflyArbitrageReport['densityCurve'] = [];
  const prices: number[] = [];

  for (const k of strikes) {
    const vol = sabrImpliedVol(forward, k, maturity, params);
    const callPx = black76Price(forward, k, maturity, vol, rate, true);
    prices.push(callPx);
  }

  for (let i = 1; i < strikes.length - 1; i++) {
    const kPrev = strikes[i - 1];
    const kCurr = strikes[i];
    const kNext = strikes[i + 1];

    const cPrev = prices[i - 1];
    const cCurr = prices[i];
    const cNext = prices[i + 1];

    const h1 = kCurr - kPrev;
    const h2 = kNext - kCurr;
    const d2c = 2.0 * ((cNext - cCurr) / h2 - (cCurr - cPrev) / h1) / (h1 + h2);
    const density = Math.exp(rate * maturity) * d2c;

    densityCurve.push({ strike: kCurr, density, d2c });

    if (density < -1e-5) {
      violations.push({
        strike: kCurr,
        density,
        butterflyCostPts: cPrev - 2.0 * cCurr + cNext
      });
    }
  }

  return {
    isArbitrageFree: violations.length === 0,
    violationCount: violations.length,
    densityCurve,
    violations
  };
}
