/**
 * Ornstein-Uhlenbeck (OU) Process Parameter & Half-Life Estimator
 * Permissive MIT Clean-Room Implementation
 *
 * Model:
 *   dS_t = theta * (mu - S_t) dt + sigma * dW_t
 * Discrete AR(1) Formulation:
 *   Delta S_t = a + b * S_{t-1} + eta_t
 *   where b = -(1 - e^{-theta * dt}) approx -theta * dt
 * Half-life:
 *   tau_{1/2} = ln(2) / theta
 */

import { OrnsteinUhlenbeckStats } from './types';

export class OrnsteinUhlenbeckEstimator {
  private windowSize: number;
  private spreadHistory: number[] = [];

  constructor(windowSize: number = 60) {
    this.windowSize = Math.max(15, windowSize);
  }

  /**
   * Appends latest spread and computes OU theta and half-life.
   */
  public update(spread: number): OrnsteinUhlenbeckStats {
    this.spreadHistory.push(spread);
    if (this.spreadHistory.length > this.windowSize) {
      this.spreadHistory.shift();
    }

    const n = this.spreadHistory.length;
    if (n < 10) {
      return {
        theta: 0,
        halfLife: Infinity,
        isMeanReverting: false,
        residualVariance: 0,
      };
    }

    // Prepare pairs: X = S_{t-1}, Y = Delta S_t = S_t - S_{t-1}
    const sampleCount = n - 1;
    let sumX = 0;
    let sumY = 0;

    for (let i = 0; i < sampleCount; i++) {
      const sPrev = this.spreadHistory[i];
      const sCurr = this.spreadHistory[i + 1];
      const deltaS = sCurr - sPrev;
      sumX += sPrev;
      sumY += deltaS;
    }

    const meanX = sumX / sampleCount;
    const meanY = sumY / sampleCount;

    let covXY = 0;
    let varX = 0;

    for (let i = 0; i < sampleCount; i++) {
      const sPrev = this.spreadHistory[i];
      const sCurr = this.spreadHistory[i + 1];
      const deltaS = sCurr - sPrev;

      const diffX = sPrev - meanX;
      const diffY = deltaS - meanY;
      covXY += diffX * diffY;
      varX += diffX * diffX;
    }

    const EPSILON = 1e-10;
    if (varX < EPSILON) {
      return {
        theta: 0,
        halfLife: Infinity,
        isMeanReverting: false,
        residualVariance: 0,
      };
    }

    // OLS slope b
    const b = covXY / varX;
    const a = meanY - b * meanX;

    // Mean-reversion requires b < 0 and (1 + b) > 0
    let theta = 0;
    let halfLife = Infinity;
    let isMeanReverting = false;

    if (b < -1e-6 && 1 + b > 1e-6) {
      // theta = -ln(1 + b) / dt (with dt = 1 tick)
      theta = -Math.log(1 + b);
      if (theta > 1e-6) {
        halfLife = Math.LN2 / theta;
        isMeanReverting = halfLife > 0.5 && halfLife < 1000;
      }
    }

    // Compute residual variance
    let sse = 0;
    for (let i = 0; i < sampleCount; i++) {
      const sPrev = this.spreadHistory[i];
      const sCurr = this.spreadHistory[i + 1];
      const deltaS = sCurr - sPrev;
      const pred = a + b * sPrev;
      const res = deltaS - pred;
      sse += res * res;
    }
    const residualVariance = sampleCount > 2 ? sse / (sampleCount - 2) : 0;

    return {
      theta,
      halfLife: isFinite(halfLife) ? Math.round(halfLife * 10) / 10 : Infinity,
      isMeanReverting,
      residualVariance,
    };
  }

  public reset(): void {
    this.spreadHistory = [];
  }
}
