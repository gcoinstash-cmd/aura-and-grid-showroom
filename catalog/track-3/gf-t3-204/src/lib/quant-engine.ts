import {
  ChildSlice,
  ExecutionStrategy,
  ExecutionVenue,
  OrderSide,
  ParentOrder,
  ParentOrderStatus,
  SimulationParams,
  SliceStatus,
  IntradayVolumeBin,
} from '../types';

/**
 * Fast synchronous SHA-256 implementation ensuring instant cryptographic audit hashing
 * even if crypto.subtle is restricted or synchronous access is required.
 */
export function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i = 0;
  let j = 0;

  const words: number[] = [];
  const asciiLen = ascii.length;
  const asciiBitLength = asciiLen * 8;

  const hash: number[] = [];
  const k: number[] = [];

  let primeCounter = 0;
  const isComposite: { [key: number]: boolean } = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < asciiLen; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << ((3 - (i % 4)) * 8);
  }

  for (j = 0; j < words.length; j += 16) {
    const w: number[] = words.slice(j, j + 16);
    const oldHash = [...hash];

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const s0 = i >= 16 ? rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3) : 0;
      const s1 = i >= 16 ? rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10) : 0;
      if (i >= 16) {
        w[i] = ((w[i - 16] + s0) | 0) + ((w[i - 7] + s1) | 0);
      }

      const s1b = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1b + ch + k[i] + (w[i] | 0)) | 0;
      const s0b = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0b + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  let result = '';
  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (b * 8)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }
  return result;
}

/**
 * Institutional U-curve intraday volume profile
 */
export function getIntradayVolumeProfile(nSlices: number): number[] {
  const weights: number[] = [];
  for (let i = 0; i < nSlices; i++) {
    const t = (i + 0.5) / nSlices;
    const uCurve = 0.40 + 3.2 * Math.pow(t - 0.5, 2);
    const openSurge = 1.10 * Math.exp(-Math.pow(t - 0.05, 2) / 0.015);
    const closeSurge = 1.35 * Math.exp(-Math.pow(t - 0.95, 2) / 0.015);
    const weight = Math.max(uCurve + openSurge + closeSurge, 0.05);
    weights.push(weight);
  }
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => w / total);
}

/**
 * Generate discrete bins for volume profile visualization with times (09:30 - 16:00 EST)
 */
export function getIntradayVolumeBins(
  nSlices: number,
  activeSliceIndex: number,
  volumeShock: boolean
): IntradayVolumeBin[] {
  const profile = getIntradayVolumeProfile(nSlices);
  const startMinute = 9 * 60 + 30; // 09:30 = 570 min
  const endMinute = 16 * 60; // 16:00 = 960 min
  const totalMinutes = endMinute - startMinute;

  return profile.map((weight, idx) => {
    const binStartMin = startMinute + Math.floor((idx / nSlices) * totalMinutes);
    const hour = Math.floor(binStartMin / 60);
    const min = binStartMin % 60;
    const timeLabel = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    
    // Shock modifies middle volume if active
    let realized = weight;
    if (volumeShock && idx >= Math.floor(nSlices * 0.4) && idx <= Math.floor(nSlices * 0.65)) {
      realized *= 1.85;
    }

    return {
      bin_index: idx + 1,
      time_label: timeLabel,
      expected_weight: weight,
      realized_weight: realized,
      volume_shares: Math.round(weight * 100000),
      is_active: idx === activeSliceIndex,
    };
  });
}

/**
 * Almgren-Chriss (2000) optimal liquidation trajectory solver
 * Solves: d²x/dt² - κ² x = 0, boundary x(0) = X_0, x(T) = 0
 * x(t) = X_0 * sinh(κ(T - t)) / sinh(κT)
 */
export function computeAlmgrenChrissTrajectory(
  totalShares: number,
  nSlices: number,
  riskAversion: number,
  volatility: number,
  temporaryImpact: number
): { trajectory: number[]; slices: number[]; kappa: number } {
  const variance = Math.pow(volatility, 2);
  const eta = Math.max(temporaryImpact, 1e-12);
  const kappaSq = (riskAversion * variance) / eta;
  const kappa = Math.sqrt(Math.max(kappaSq, 1e-10));
  const effectiveKappa = Math.min(kappa, 50.0);
  const T = 1.0;

  const trajectory: number[] = [totalShares];
  if (effectiveKappa < 1e-4) {
    // Linear TWAP limit
    for (let k = 1; k <= nSlices; k++) {
      const tk = k / nSlices;
      trajectory.push(Math.max(0, totalShares * (1.0 - tk)));
    }
  } else {
    const sinhKT = Math.sinh(effectiveKappa * T);
    for (let k = 1; k <= nSlices; k++) {
      const tk = k / nSlices;
      const xk = totalShares * (Math.sinh(effectiveKappa * (T - tk)) / sinhKT);
      trajectory.push(Math.max(0, xk));
    }
  }
  trajectory[trajectory.length - 1] = 0.0;

  const rawSlices: number[] = [];
  for (let k = 1; k <= nSlices; k++) {
    rawSlices.push(Math.max(0, trajectory[k - 1] - trajectory[k]));
  }

  // Exact normalization
  const sumSlices = rawSlices.reduce((a, b) => a + b, 0);
  const scale = sumSlices > 0 ? totalShares / sumSlices : 1;
  const slices = rawSlices.map((s) => s * scale);

  // Exact residual zero leakage
  const finalDiff = totalShares - slices.reduce((a, b) => a + b, 0);
  slices[slices.length - 1] += finalDiff;

  // Rebuild trajectory strictly from normalized slices
  const exactTraj = [totalShares];
  let cur = totalShares;
  for (const s of slices) {
    cur -= s;
    exactTraj.push(Math.max(0, Math.round(cur * 1e4) / 1e4));
  }
  exactTraj[exactTraj.length - 1] = 0.0;

  return { trajectory: exactTraj, slices, kappa };
}

/**
 * VWAP Slices proportional to expected volume profile
 */
export function computeVwapSlices(
  totalShares: number,
  nSlices: number
): { trajectory: number[]; slices: number[] } {
  const profile = getIntradayVolumeProfile(nSlices);
  const slices = profile.map((w) => totalShares * w);

  // Exact sum preservation
  const diff = totalShares - slices.reduce((a, b) => a + b, 0);
  slices[slices.length - 1] += diff;

  const trajectory = [totalShares];
  let rem = totalShares;
  for (const s of slices) {
    rem -= s;
    trajectory.push(Math.max(0, Math.round(rem * 1e4) / 1e4));
  }
  trajectory[trajectory.length - 1] = 0.0;

  return { trajectory, slices };
}

/**
 * TWAP Slices with bounded randomized sizing jitter
 */
export function computeTwapSlices(
  totalShares: number,
  nSlices: number,
  jitterPct: number
): { trajectory: number[]; slices: number[] } {
  const base = totalShares / nSlices;
  const boundedJitter = Math.max(0, Math.min(jitterPct, 0.5));

  const rawSlices: number[] = [];
  for (let i = 0; i < nSlices; i++) {
    // Pseudo-random jitter in [-jitter, +jitter]
    const j = (Math.random() * 2 - 1) * boundedJitter;
    rawSlices.push(base * (1.0 + j));
  }

  const rawSum = rawSlices.reduce((a, b) => a + b, 0);
  const scale = totalShares / rawSum;
  const slices = rawSlices.map((s) => s * scale);

  const diff = totalShares - slices.reduce((a, b) => a + b, 0);
  slices[slices.length - 1] += diff;

  const trajectory = [totalShares];
  let rem = totalShares;
  for (const s of slices) {
    rem -= s;
    trajectory.push(Math.max(0, Math.round(rem * 1e4) / 1e4));
  }
  trajectory[trajectory.length - 1] = 0.0;

  return { trajectory, slices };
}

/**
 * Smart Order Router (SOR) multi-venue routing rule
 */
export function routeSlice(
  sliceShares: number,
  spreadBps: number,
  sliceIndex: number,
  nSlices: number
): ExecutionVenue {
  if (sliceIndex === 0 || sliceIndex === nSlices - 1) {
    return 'PRIMARY_EXCHANGE_LIT';
  }
  if (spreadBps < 4.0 || sliceShares > 400) {
    return 'DARK_POOL_ATS';
  }
  return 'SECONDARY_ECN';
}

/**
 * Simulate single slice execution fill with realistic microstructure dynamics
 */
export function simulateSliceFill(
  sliceShares: number,
  arrivalPrice: number,
  side: OrderSide,
  venue: ExecutionVenue,
  temporaryImpact: number,
  spreadBps: number,
  volumeShock: boolean
): { fillPrice: number; slippageBps: number } {
  const halfSpread = arrivalPrice * (spreadBps / 10000.0) / 2.0;
  const tempCost = temporaryImpact * Math.pow(sliceShares, 1.05);

  let venueDiscount = 0.0;
  if (venue === 'DARK_POOL_ATS') {
    venueDiscount = halfSpread * 0.70; // 70% midpoint price improvement
  } else if (venue === 'SECONDARY_ECN') {
    venueDiscount = halfSpread * 0.20;
  }

  const shockFactor = volumeShock ? 2.3 : 1.0;
  let priceDelta = (halfSpread - venueDiscount + tempCost) * shockFactor;
  
  // Microstructure random gaussian-like noise
  const noise = (Math.random() - 0.5) * 0.01 * arrivalPrice * (spreadBps / 10000.0);
  priceDelta += noise;

  let fillPrice: number;
  let slippageBps: number;

  if (side === 'BUY') {
    fillPrice = arrivalPrice + Math.max(0.001, priceDelta);
    slippageBps = ((fillPrice - arrivalPrice) / arrivalPrice) * 10000.0;
  } else {
    fillPrice = arrivalPrice - Math.max(0.001, priceDelta);
    slippageBps = ((arrivalPrice - fillPrice) / arrivalPrice) * 10000.0;
  }

  return {
    fillPrice: Math.round(fillPrice * 10000) / 10000,
    slippageBps: Math.round(slippageBps * 100) / 100,
  };
}

/**
 * Plan a complete parent order with child slices and initial genesis SHA-256 hash
 */
export function planParentOrder(params: SimulationParams): ParentOrder {
  const orderId = `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const totalShares = Math.round((params.notional / params.arrival_price) * 10000) / 10000;
  const nowIso = new Date().toISOString();

  let slices: number[];
  if (params.strategy === 'ALMGREN_CHRISS') {
    const res = computeAlmgrenChrissTrajectory(
      totalShares,
      params.slices,
      params.risk_aversion_lambda,
      params.volatility_sigma,
      params.temporary_impact_eta
    );
    slices = res.slices;
  } else if (params.strategy === 'VWAP') {
    const res = computeVwapSlices(totalShares, params.slices);
    slices = res.slices;
  } else {
    const res = computeTwapSlices(totalShares, params.slices, params.twap_jitter_pct);
    slices = res.slices;
  }

  const genesisPayload = `GENESIS|${orderId}|${params.symbol}|${params.notional}|${nowIso}`;
  const genesisHash = sha256Sync(genesisPayload);
  let latestHash = genesisHash;

  const childSlices: ChildSlice[] = slices.map((shares, i) => {
    const sliceId = `${orderId}-SL${(i + 1).toString().padStart(2, '0')}`;
    const venue = routeSlice(shares, 2.5, i, params.slices);
    const schedTimePct = Math.round(((i + 1) / params.slices) * 10000) / 10000;

    const blockData = `${latestHash}|${sliceId}|${shares.toFixed(4)}|${venue}|${schedTimePct.toFixed(4)}`;
    const currentHash = sha256Sync(blockData);
    latestHash = currentHash;

    return {
      slice_id: sliceId,
      slice_index: i + 1,
      parent_id: orderId,
      target_shares: Math.round(shares * 100) / 100,
      filled_shares: 0,
      scheduled_time_pct: schedTimePct,
      execution_time_sec: i * 30,
      venue,
      limit_price: params.arrival_price,
      fill_price: null,
      slippage_bps: 0,
      status: 'PENDING' as SliceStatus,
      audit_hash: currentHash,
      timestamp: nowIso,
    };
  });

  return {
    order_id: orderId,
    symbol: params.symbol,
    side: params.side,
    strategy: params.strategy,
    notional: params.notional,
    arrival_price: params.arrival_price,
    total_shares: totalShares,
    executed_shares: 0,
    remaining_shares: totalShares,
    average_exec_price: 0,
    implementation_shortfall_usd: 0,
    slippage_bps: 0,
    status: 'ACTIVE' as ParentOrderStatus,
    slices: childSlices,
    created_at: nowIso,
    completed_at: null,
    genesis_hash: genesisHash,
    latest_audit_hash: latestHash,
  };
}
