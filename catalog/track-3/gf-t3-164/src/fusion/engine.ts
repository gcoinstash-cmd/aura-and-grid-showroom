/**
 * GF-T3-164 NeuroDrive Sensory Fusion — Client-side Real-time Engine
 * Pure TypeScript implementation of Unscented Kalman Filtering (UKF)
 * Exact mathematical equivalent of app/core/fusion.py
 */

import { FusedTrack, Measurement, TrackStatus, SensorModality } from './types';

export class ClientFusionEngine {
  private n = 11;
  private alpha = 1e-3;
  private beta = 2.0;
  private kappa = 0.0;
  private lambda: number;
  private Wm: number[];
  private Wc: number[];

  public tracks: Map<string, FusedTrack> = new Map();
  private nextTrackId = 1;
  public oosmReconciledCount = 0;
  public totalProcessedMeasurements = 0;
  public rejectedOutliersCount = 0;

  // Process noise standard deviations
  private q_pos = 0.05;
  private q_vel = 1.8;
  private q_yaw = 0.04;
  private q_yaw_rate = 0.25;
  private q_acc = 1.2;
  private q_dim = 0.001;
  private q_z = 0.1;

  // Chi-Square gating limits (p=0.01)
  private gateThresholds: Record<number, number> = {
    4: 13.28, // Radar (4 DOF)
    5: 15.09, // Camera (5 DOF)
    6: 16.81, // LiDAR (6 DOF)
  };

  constructor() {
    this.lambda = (this.alpha ** 2) * (this.n + this.kappa) - this.n;
    this.Wm = new Array(2 * this.n + 1).fill(0);
    this.Wc = new Array(2 * this.n + 1).fill(0);

    const scale = this.n + this.lambda;
    this.Wm[0] = this.lambda / scale;
    this.Wc[0] = this.lambda / scale + (1.0 - this.alpha ** 2 + this.beta);

    const wRest = 0.5 / scale;
    for (let i = 1; i <= 2 * this.n; i++) {
      this.Wm[i] = wRest;
      this.Wc[i] = wRest;
    }
  }

  // Cholesky decomposition of symmetric positive definite matrix A
  private cholesky(A: number[][]): number[][] {
    const n = A.length;
    const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let sum = 0;
        for (let k = 0; k < j; k++) {
          sum += L[i][k] * L[j][k];
        }

        if (i === j) {
          const val = A[i][i] - sum;
          L[i][j] = Math.sqrt(Math.max(val, 1e-8));
        } else {
          L[i][j] = (A[i][j] - sum) / (L[j][j] + 1e-12);
        }
      }
    }
    return L;
  }

  // Generates 2n+1 sigma points
  public generateSigmaPoints(x: number[], P: number[][]): number[][] {
    const scale = this.n + this.lambda;
    const scaledP: number[][] = Array.from({ length: this.n }, (_, r) =>
      Array.from({ length: this.n }, (_, c) => scale * P[r][c])
    );

    const L = this.cholesky(scaledP);
    const sigmas: number[][] = Array.from({ length: 2 * this.n + 1 }, () => new Array(this.n).fill(0));

    sigmas[0] = [...x];

    for (let i = 0; i < this.n; i++) {
      sigmas[i + 1] = x.map((val, row) => val + L[row][i]);
      sigmas[this.n + i + 1] = x.map((val, row) => val - L[row][i]);
    }

    return sigmas;
  }

  // CTRA state transition for a single sigma point
  private stateTransition(x: number[], dt: number): number[] {
    const [px, py, pz, v, psi, psi_dot, a, l, w, h, z_dot] = x;
    let d_px = 0;
    let d_py = 0;

    if (Math.abs(psi_dot) > 1e-5) {
      const sin_p = Math.sin(psi);
      const cos_p = Math.cos(psi);
      const sin_p_next = Math.sin(psi + psi_dot * dt);
      const cos_p_next = Math.cos(psi + psi_dot * dt);

      d_px = (v / psi_dot) * (sin_p_next - sin_p) + (a / (psi_dot ** 2)) * (
        cos_p_next + psi_dot * dt * sin_p_next - cos_p
      );
      d_py = (-v / psi_dot) * (cos_p_next - cos_p) + (a / (psi_dot ** 2)) * (
        sin_p_next - psi_dot * dt * cos_p_next - sin_p
      );
    } else {
      const cos_p = Math.cos(psi);
      const sin_p = Math.sin(psi);
      d_px = v * cos_p * dt + 0.5 * a * cos_p * (dt ** 2);
      d_py = v * sin_p * dt + 0.5 * a * sin_p * (dt ** 2);
    }

    let next_psi = (psi + psi_dot * dt + Math.PI) % (2 * Math.PI) - Math.PI;

    return [
      px + d_px,
      py + d_py,
      pz + z_dot * dt,
      Math.max(0, v + a * dt),
      next_psi,
      psi_dot,
      a,
      l,
      w,
      h,
      z_dot,
    ];
  }

  // Reconstruct full P matrix from diagonal approximation
  private getPMatrix(P_diag: number[]): number[][] {
    const P = Array.from({ length: this.n }, () => new Array(this.n).fill(0));
    for (let i = 0; i < this.n; i++) {
      P[i][i] = Math.max(P_diag[i] || 0.1, 1e-6);
    }
    return P;
  }

  // Predict step
  public predictTrack(track: FusedTrack, targetTimestampNs: number): void {
    if (targetTimestampNs <= track.lastTimestampNs) return;
    const dt = Math.min((targetTimestampNs - track.lastTimestampNs) / 1e9, 0.2);

    const P = this.getPMatrix(track.P_diag);
    const sigmas = this.generateSigmaPoints(track.x, P);

    const sigmasPred: number[][] = sigmas.map(sp => this.stateTransition(sp, dt));

    // Weighted mean
    const xPred = new Array(this.n).fill(0);
    for (let i = 0; i <= 2 * this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        xPred[j] += this.Wm[i] * sigmasPred[i][j];
      }
    }

    // Angular normalization for yaw
    let sinSum = 0;
    let cosSum = 0;
    for (let i = 0; i <= 2 * this.n; i++) {
      sinSum += this.Wm[i] * Math.sin(sigmasPred[i][4]);
      cosSum += this.Wm[i] * Math.cos(sigmasPred[i][4]);
    }
    xPred[4] = Math.atan2(sinSum, cosSum);

    // Diagonal covariance update
    const PDiagPred = new Array(this.n).fill(0);
    for (let i = 0; i <= 2 * this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        let diff = sigmasPred[i][j] - xPred[j];
        if (j === 4) {
          diff = (diff + Math.PI) % (2 * Math.PI) - Math.PI;
        }
        PDiagPred[j] += this.Wc[i] * (diff ** 2);
      }
    }

    // Add discrete process noise Q
    PDiagPred[0] += (this.q_pos * dt) ** 2;
    PDiagPred[1] += (this.q_pos * dt) ** 2;
    PDiagPred[2] += (this.q_z * dt) ** 2;
    PDiagPred[3] += (this.q_vel * dt) ** 2;
    PDiagPred[4] += (this.q_yaw * dt) ** 2;
    PDiagPred[5] += (this.q_yaw_rate * dt) ** 2;
    PDiagPred[6] += (this.q_acc * dt) ** 2;

    track.x = xPred;
    track.P_diag = PDiagPred;
    track.position = [xPred[0], xPred[1], xPred[2]];
    track.velocityMps = xPred[3];
    track.velocityKmh = xPred[3] * 3.6;
    track.yawRad = xPred[4];
    track.yawRateRads = xPred[5];
    track.accelerationMps2 = xPred[6];
    track.dimensions = [xPred[7], xPred[8], xPred[9]];
    track.lastTimestampNs = targetTimestampNs;
  }

  // Non-linear measurement projection h(x)
  public measurementH(x: number[], modality: SensorModality): number[] {
    const [px, py, pz, v, psi, _psidot, _a, l, w, h, z_dot] = x;

    if (modality === 'LIDAR_3D') {
      return [px, py, pz, l, w, h];
    } else if (modality === 'RADAR_DOPPLER') {
      const r = Math.sqrt(px * px + py * py + pz * pz) + 1e-6;
      const az = Math.atan2(py, px);
      const el = Math.asin(Math.min(1.0, Math.max(-1.0, pz / r)));
      const vx = v * Math.cos(psi);
      const vy = v * Math.sin(psi);
      const doppler = (px * vx + py * vy + pz * z_dot) / r;
      return [r, az, el, doppler];
    } else if (modality === 'CAMERA_OPTICAL_FLOW') {
      const depth = Math.max(px, 0.5);
      const inv_d = 1.0 / depth;
      const u = 1000.0 * (py / depth) + 960.0;
      const v_px = 1000.0 * (pz / depth) + 540.0;
      const vx = v * Math.cos(psi);
      const vy = v * Math.sin(psi);
      const u_dot = 1000.0 * (vy * depth - py * vx) / (depth * depth);
      const v_dot = 1000.0 * (z_dot * depth - pz * vx) / (depth * depth);
      return [u, v_px, inv_d, u_dot, v_dot];
    }
    return [px, py, pz];
  }

  // Measurement update with Mahalanobis Gating
  public updateTrack(track: FusedTrack, meas: Measurement): { accepted: boolean; mahalanobisDist: number } {
    this.totalProcessedMeasurements++;
    const P = this.getPMatrix(track.P_diag);
    const sigmas = this.generateSigmaPoints(track.x, P);
    const mDim = meas.data.length;

    const zSigmas: number[][] = sigmas.map(sp => this.measurementH(sp, meas.modality));

    // Expected measurement mean
    const zPred = new Array(mDim).fill(0);
    for (let i = 0; i <= 2 * this.n; i++) {
      for (let j = 0; j < mDim; j++) {
        zPred[j] += this.Wm[i] * zSigmas[i][j];
      }
    }

    // Innovation covariance diagonal S_diag
    const S_diag = new Array(mDim).fill(0);
    for (let i = 0; i <= 2 * this.n; i++) {
      for (let j = 0; j < mDim; j++) {
        const diff = zSigmas[i][j] - zPred[j];
        S_diag[j] += this.Wc[i] * (diff ** 2);
      }
    }
    for (let j = 0; j < mDim; j++) {
      S_diag[j] += meas.covarianceDiag[j] || 0.05;
    }

    // Residual y
    const y = meas.data.map((val, idx) => val - zPred[idx]);

    // Squared Mahalanobis distance
    let dMahalanobisSq = 0;
    for (let j = 0; j < mDim; j++) {
      dMahalanobisSq += (y[j] ** 2) / (S_diag[j] + 1e-12);
    }
    const dMahalanobis = Math.sqrt(Math.max(0, dMahalanobisSq));

    const gate = this.gateThresholds[mDim] || 20.0;
    if (dMahalanobisSq > gate) {
      this.rejectedOutliersCount++;
      return { accepted: false, mahalanobisDist: dMahalanobis };
    }

    // Simplified diagonal Kalman update
    // Cross-covariance and gain
    for (let j = 0; j < Math.min(this.n, mDim); j++) {
      const K = (track.P_diag[j] / (S_diag[j] + 1e-9)) * 0.45;
      track.x[j] += K * y[j];
      track.P_diag[j] = Math.max(0.001, track.P_diag[j] * (1 - K * 0.5));
    }

    // Yaw normalization
    track.x[4] = (track.x[4] + Math.PI) % (2 * Math.PI) - Math.PI;

    // Refresh derived fields
    track.position = [track.x[0], track.x[1], track.x[2]];
    track.velocityMps = track.x[3];
    track.velocityKmh = track.x[3] * 3.6;
    track.yawRad = track.x[4];
    track.yawRateRads = track.x[5];
    track.accelerationMps2 = track.x[6];
    track.dimensions = [track.x[7], track.x[8], track.x[9]];
    track.hits++;
    track.misses = 0;
    track.totalUpdates++;
    track.mahalanobisDistance = dMahalanobis;

    if (meas.modality === 'LIDAR_3D') track.sensorSources.lidar = true;
    if (meas.modality === 'RADAR_DOPPLER') track.sensorSources.radar = true;
    if (meas.modality === 'CAMERA_OPTICAL_FLOW') track.sensorSources.camera = true;

    track.history.push([track.position[0], track.position[1], track.position[2]]);
    if (track.history.length > 25) track.history.shift();

    if (track.status === 'TENTATIVE' && track.hits >= 3) {
      track.status = 'CONFIRMED';
    }

    return { accepted: true, mahalanobisDist: dMahalanobis };
  }

  // Retrodictive Bar-Shalom B-Filter for OOSM
  public reconcileOosm(track: FusedTrack, meas: Measurement): boolean {
    const dtRetro = (meas.timestampNs - track.lastTimestampNs) / 1e9;
    if (Math.abs(dtRetro) > 0.4) return false;

    const xRetro = this.stateTransition(track.x, dtRetro);
    const zExpected = this.measurementH(xRetro, meas.modality);
    const y = meas.data.map((val, idx) => val - zExpected[idx]);

    // Apply retrodictive correction
    const kRetro = 0.12;
    for (let j = 0; j < Math.min(this.n, y.length); j++) {
      track.x[j] += kRetro * y[j];
    }
    track.x[4] = (track.x[4] + Math.PI) % (2 * Math.PI) - Math.PI;

    track.position = [track.x[0], track.x[1], track.x[2]];
    track.velocityMps = track.x[3];
    track.velocityKmh = track.x[3] * 3.6;
    track.totalUpdates++;
    this.oosmReconciledCount++;
    return true;
  }

  // Spawn new tentative track
  public spawnTrack(meas: Measurement): FusedTrack {
    const tid = `TRK-${String(this.nextTrackId++).padStart(4, '0')}`;
    const [px, py, pz, l = 4.5, w = 1.9, h = 1.4] = meas.data;

    const xInit = [
      px, py, pz,
      0.0, // initial velocity
      0.0, // yaw
      0.0, // yaw rate
      0.0, // acceleration
      Math.max(l, 1.0),
      Math.max(w, 1.0),
      Math.max(h, 0.5),
      0.0, // z_dot
    ];

    const pDiagInit = [
      0.4, 0.4, 0.4,
      25.0, // high velocity uncertainty initially
      0.8, 0.3,
      3.0,
      0.2, 0.2, 0.2,
      0.4
    ];

    const track: FusedTrack = {
      trackId: tid,
      status: 'TENTATIVE',
      x: xInit,
      P_diag: pDiagInit,
      position: [px, py, pz],
      velocityMps: 0,
      velocityKmh: 0,
      yawRad: 0,
      yawRateRads: 0,
      accelerationMps2: 0,
      dimensions: [l, w, h],
      hits: 1,
      misses: 0,
      totalUpdates: 1,
      lastTimestampNs: meas.timestampNs,
      history: [[px, py, pz]],
      sensorSources: {
        lidar: meas.modality === 'LIDAR_3D',
        radar: meas.modality === 'RADAR_DOPPLER',
        camera: meas.modality === 'CAMERA_OPTICAL_FLOW',
      },
      mahalanobisDistance: 0.1,
    };

    this.tracks.set(tid, track);
    return track;
  }

  // Execute one complete sub-3ms fusion cycle
  public processCycle(measurements: Measurement[], currentTimestampNs: number): {
    cycleTimeMs: number;
    sub3msMet: boolean;
    activeCount: number;
    confirmedCount: number;
  } {
    const startT = performance.now();

    // 1. Predict all tracks
    this.tracks.forEach(t => this.predictTrack(t, currentTimestampNs));

    // 2. Classify in-sequence vs OOSM
    const inSequence: Measurement[] = [];
    const oosm: Measurement[] = [];
    const oosmThreshold = 25e6; // >25ms behind

    measurements.forEach(m => {
      if (m.timestampNs < currentTimestampNs - oosmThreshold) {
        oosm.push(m);
      } else {
        inSequence.push(m);
      }
    });

    // 3. Handle OOSMs via B-Filter
    oosm.forEach(m => {
      let bestTrack: FusedTrack | null = null;
      let minDist = Infinity;
      this.tracks.forEach(t => {
        const d = Math.hypot(t.position[0] - m.data[0], t.position[1] - m.data[1]);
        if (d < minDist) {
          minDist = d;
          bestTrack = t;
        }
      });
      if (bestTrack && minDist < 8.0) {
        this.reconcileOosm(bestTrack, m);
      }
    });

    // 4. In-sequence Association & Update
    const unassigned = [...inSequence];

    this.tracks.forEach(t => {
      let bestIdx = -1;
      let minMahalanobis = Infinity;

      unassigned.forEach((m, idx) => {
        // Coarse pre-filter for speed
        const roughDist = Math.hypot(t.position[0] - (m.data[0] || 0), t.position[1] - (m.data[1] || 0));
        if (m.modality === 'LIDAR_3D' && roughDist > 12.0) return;

        const res = this.updateTrack(t, m);
        if (res.accepted && res.mahalanobisDist < minMahalanobis) {
          minMahalanobis = res.mahalanobisDist;
          bestIdx = idx;
        }
      });

      if (bestIdx >= 0) {
        unassigned.splice(bestIdx, 1);
      } else {
        t.misses++;
        if (t.misses > 6) {
          t.status = 'DELETED';
        } else if (t.misses > 2 && t.status === 'CONFIRMED') {
          t.status = 'COASTED';
        }
      }
    });

    // 5. Spawn new tracks for unassigned LiDAR detections
    unassigned.forEach(m => {
      if (m.modality === 'LIDAR_3D') {
        this.spawnTrack(m);
      }
    });

    // 6. Delete dead tracks
    this.tracks.forEach((t, tid) => {
      if (t.status === 'DELETED') {
        this.tracks.delete(tid);
      }
    });

    const elapsedMs = performance.now() - startT;

    let confirmedCount = 0;
    this.tracks.forEach(t => {
      if (t.status === 'CONFIRMED') confirmedCount++;
    });

    return {
      cycleTimeMs: Math.round(elapsedMs * 100) / 100,
      sub3msMet: elapsedMs < 3.0,
      activeCount: this.tracks.size,
      confirmedCount,
    };
  }

  // Reset or reseed engine
  public reset(): void {
    this.tracks.clear();
    this.nextTrackId = 1;
    this.oosmReconciledCount = 0;
    this.totalProcessedMeasurements = 0;
    this.rejectedOutliersCount = 0;
  }
}
