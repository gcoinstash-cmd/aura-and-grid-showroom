/**
 * State-space Kalman Filter for Dynamic Beta Hedge Ratio & Spread Extraction
 * Permissive MIT Clean-Room Implementation
 *
 * System Model:
 *   Observation: y_t = [x_t, 1] * [beta_t, alpha_t]^T + e_t,   e_t ~ N(0, R)
 *   State Drift: theta_t = theta_{t-1} + w_t,                  w_t ~ N(0, Q)
 */

import { KalmanState } from './types';

export class KalmanFilter {
  // State vector theta = [beta, alpha]^T
  private beta: number;
  private alpha: number;

  // Covariance matrix P = [[p00, p01], [p10, p11]]
  private p00: number;
  private p01: number;
  private p10: number;
  private p11: number;

  // Noise hyperparameters
  private R: number; // Measurement variance
  private Q: number; // Process variance diagonal

  constructor(
    initialBeta: number = 1.0,
    initialAlpha: number = 0.0,
    initialCovariance: number = 1.0,
    measurementVarianceR: number = 1e-3,
    processVarianceQ: number = 1e-5
  ) {
    this.beta = initialBeta;
    this.alpha = initialAlpha;

    this.p00 = initialCovariance;
    this.p01 = 0.0;
    this.p10 = 0.0;
    this.p11 = initialCovariance;

    this.R = Math.max(1e-9, measurementVarianceR);
    this.Q = Math.max(1e-12, processVarianceQ);
  }

  /**
   * Updates state with observation (priceY, priceX) and returns new state.
   */
  public update(priceY: number, priceX: number): KalmanState {
    // 1. Prediction step: theta_{t|t-1} = theta_{t-1|t-1}
    // Covariance prediction: P_{t|t-1} = P_{t-1|t-1} + Q * I
    const p00_pred = this.p00 + this.Q;
    const p01_pred = this.p01;
    const p10_pred = this.p10;
    const p11_pred = this.p11 + this.Q;

    // 2. Observation matrix H_t = [priceX, 1.0]
    // Measurement prediction: y_hat = beta * priceX + alpha
    const fairValueY = this.beta * priceX + this.alpha;
    const e_t = priceY - fairValueY; // Innovation (spread residual)

    // Innovation covariance: F_t = H * P_{t|t-1} * H^T + R
    // H * P = [priceX * p00_pred + p10_pred, priceX * p01_pred + p11_pred]
    const hp0 = priceX * p00_pred + p10_pred;
    const hp1 = priceX * p01_pred + p11_pred;
    const F_t = Math.max(1e-12, hp0 * priceX + hp1 * 1.0 + this.R);

    // 3. Kalman Gain: K_t = P_{t|t-1} * H^T / F_t
    // P * H^T = [p00_pred * priceX + p01_pred, p10_pred * priceX + p11_pred]^T
    const k0 = (p00_pred * priceX + p01_pred) / F_t;
    const k1 = (p10_pred * priceX + p11_pred) / F_t;

    // 4. State update: theta_{t|t} = theta_{t|t-1} + K_t * e_t
    this.beta += k0 * e_t;
    this.alpha += k1 * e_t;

    // 5. Covariance update: P_{t|t} = (I - K_t * H_t) * P_{t|t-1}
    // Using Joseph or standard form with symmetry enforcement
    const p00_new = p00_pred - k0 * hp0;
    const p01_new = p01_pred - k0 * hp1;
    const p10_new = p10_pred - k1 * hp0;
    const p11_new = p11_pred - k1 * hp1;

    // Symmetrize and clamp diagonal > 0 for numerical stability
    const pSym = (p01_new + p10_new) / 2.0;
    this.p00 = Math.max(1e-12, p00_new);
    this.p01 = pSym;
    this.p10 = pSym;
    this.p11 = Math.max(1e-12, p11_new);

    // Current Fair Value after state update
    const updatedFairValue = this.beta * priceX + this.alpha;
    const updatedSpread = priceY - updatedFairValue;

    return {
      beta: this.beta,
      alpha: this.alpha,
      p00: this.p00,
      p01: this.p01,
      p10: this.p10,
      p11: this.p11,
      kalmanGainBeta: k0,
      kalmanGainAlpha: k1,
      fairValueY: updatedFairValue,
      spread: updatedSpread,
      innovationVariance: F_t,
    };
  }

  /**
   * Resets or adjusts hyperparameters dynamically
   */
  public setHyperparameters(R: number, Q: number): void {
    this.R = Math.max(1e-9, R);
    this.Q = Math.max(1e-12, Q);
  }

  public reset(initialBeta: number, initialAlpha: number = 0.0, initialCovariance: number = 1.0): void {
    this.beta = initialBeta;
    this.alpha = initialAlpha;
    this.p00 = initialCovariance;
    this.p01 = 0.0;
    this.p10 = 0.0;
    this.p11 = initialCovariance;
  }

  public getState(): { beta: number; alpha: number; P: number[][] } {
    return {
      beta: this.beta,
      alpha: this.alpha,
      P: [
        [this.p00, this.p01],
        [this.p10, this.p11],
      ],
    };
  }
}
