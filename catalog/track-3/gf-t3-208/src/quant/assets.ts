/**
 * APEX-208 Synthetic Asset Registry
 * Track 3 Clean-Room Synthetic Underlyings
 * Absolute Zero-Dollar compliance verified: Spot and quotes strictly rendered in pts or bps.
 */

import { SyntheticAsset, OptionQuote, SABRParameters } from './types.ts';
import { sabrImpliedVol, black76Price, black76Greeks, solveImpliedVol } from './math.ts';

export const SYNTHETIC_ASSETS: SyntheticAsset[] = [
  {
    id: 'SYNTH-VOL-BENCH',
    name: 'Synthetic Volatility Benchmark',
    tickerDescriptor: 'SYNTH-VOL-BENCH (Spot: 250.00 pts)',
    spot: 250.0,
    baseSpreadBps: 2.5,
    initialAlpha: 1.15,
    beta: 0.7,
    initialRho: -0.28,
    initialNu: 0.42
  },
  {
    id: 'INDEX-TECH-PROXY',
    name: 'Technology Sector Synthetic Proxy',
    tickerDescriptor: 'INDEX-TECH-PROXY (Spot: 420.00 pts)',
    spot: 420.0,
    baseSpreadBps: 3.2,
    initialAlpha: 1.40,
    beta: 0.7,
    initialRho: -0.36,
    initialNu: 0.52
  },
  {
    id: 'COMMODITY-SYNTH',
    name: 'Commodity Index Synthetic Future',
    tickerDescriptor: 'COMMODITY-SYNTH (Spot: 85.00 pts)',
    spot: 85.0,
    baseSpreadBps: 4.5,
    initialAlpha: 0.95,
    beta: 0.7,
    initialRho: 0.12,
    initialNu: 0.38
  }
];

export const STANDARD_MATURITIES = [
  { label: '1M (30D)', value: 0.0833 },
  { label: '3M (90D)', value: 0.25 },
  { label: '6M (180D)', value: 0.5 },
  { label: '1Y (365D)', value: 1.0 },
  { label: '2Y (730D)', value: 2.0 }
];

export function generateStrikes(spot: number): number[] {
  // Generate 15 strikes centered around spot from 75% to 125% moneyness
  const step = spot * 0.035;
  const roundedStep = Math.max(1.0, Math.round(step * 2) / 2);
  const strikes: number[] = [];
  for (let i = -7; i <= 7; i++) {
    const k = spot + i * roundedStep;
    strikes.push(Math.round(k * 10) / 10);
  }
  return strikes;
}

export function generateMarketQuotes(
  asset: SyntheticAsset,
  maturity: number,
  params: SABRParameters,
  noiseVarianceBps: number = 0.0
): OptionQuote[] {
  const strikes = generateStrikes(asset.spot);
  const quotes: OptionQuote[] = [];

  for (let idx = 0; idx < strikes.length; idx++) {
    const k = strikes[idx];
    const moneyness = k / asset.spot;
    const baseSabr = sabrImpliedVol(asset.spot, k, maturity, params);

    // Deterministic pseudo-noise for live market realism if requested
    const noiseBps = noiseVarianceBps > 0
      ? Math.sin(idx * 2.3 + maturity * 5.0) * (noiseVarianceBps / 10000.0)
      : 0.0;
    const marketIV = Math.max(0.01, baseSabr + noiseBps);

    // Call option pricing
    const midPrice = black76Price(asset.spot, k, maturity, marketIV, 0.0, true);
    const halfSpread = midPrice * (asset.baseSpreadBps / 10000.0) * 0.5 + 0.02;
    const bidPrice = Math.max(0.01, midPrice - halfSpread);
    const askPrice = midPrice + halfSpread;

    const solvedIV = solveImpliedVol(midPrice, asset.spot, k, maturity, 0.0, true);
    const modelIV = sabrImpliedVol(asset.spot, k, maturity, params);
    const residualBps = Math.round((modelIV - solvedIV) * 10000);
    const greeks = black76Greeks(asset.spot, k, maturity, modelIV, 0.0, true);

    quotes.push({
      strike: k,
      moneyness: Math.round(moneyness * 1000) / 1000,
      maturity,
      marketMidPrice: Math.round(midPrice * 100) / 100,
      bidPrice: Math.round(bidPrice * 100) / 100,
      askPrice: Math.round(askPrice * 100) / 100,
      solvedIV: Math.round(solvedIV * 10000) / 10000,
      sabrIV: Math.round(modelIV * 10000) / 10000,
      residualBps,
      greeks
    });
  }

  return quotes;
}
