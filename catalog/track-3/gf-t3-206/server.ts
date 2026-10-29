/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';

interface LedgerBlock {
  index: number;
  timestamp: number;
  event_type: string;
  z_score: number;
  hedge_ratio: number;
  spread: number;
  previous_hash: string;
  hash: string;
}

class NodeQuantitativeEngine {
  ledger: LedgerBlock[] = [];

  constructor() {
    this._genesisBlock();
  }

  _genesisBlock() {
    const genesis: Omit<LedgerBlock, 'hash'> = {
      index: 0,
      timestamp: Date.now() / 1000,
      event_type: 'GENESIS_BLOCK',
      z_score: 0.0,
      hedge_ratio: 1.0,
      spread: 0.0,
      previous_hash: '0'.repeat(64),
    };
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(genesis, Object.keys(genesis).sort()))
      .digest('hex');
    this.ledger.push({ ...genesis, hash });
  }

  appendLedger(eventType: string, zScore: number, hedgeRatio: number, spread: number): LedgerBlock {
    const prev = this.ledger[this.ledger.length - 1];
    const blockData: Omit<LedgerBlock, 'hash'> = {
      index: this.ledger.length,
      timestamp: Date.now() / 1000,
      event_type: eventType,
      z_score: Number(zScore.toFixed(4)),
      hedge_ratio: Number(hedgeRatio.toFixed(4)),
      spread: Number(spread.toFixed(4)),
      previous_hash: prev.hash,
    };
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(blockData, Object.keys(blockData).sort()))
      .digest('hex');
    const newBlock: LedgerBlock = { ...blockData, hash };
    this.ledger.push(newBlock);
    return newBlock;
  }
}

const quantEngine = new NodeQuantitativeEngine();

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.post('/api/stat-arb/analyze', (req, res) => {
    try {
      const {
        cluster_a = 'SYNTH-CLUSTER-A',
        cluster_b = 'SYNTH-CLUSTER-B',
        prices_a = [100, 100.5, 101, 101.5, 102],
        prices_b = [95, 95.3, 95.6, 95.9, 96.2],
        z_threshold_entry = 2.0,
        z_threshold_exit = 0.2,
        z_threshold_stop = 3.5,
        inject_divergence = false,
        trigger_break = false,
      } = req.body || {};

      let a = Array.isArray(prices_a) ? [...prices_a] : [100, 101, 102];
      let b = Array.isArray(prices_b) ? [...prices_b] : [95, 96, 97];

      if (inject_divergence) {
        const lastA = a[a.length - 1] || 100;
        a.push(lastA + 4.5);
        b.push(b[b.length - 1] || 95);
      }

      if (trigger_break) {
        // Simulate structural break
        for (let i = 0; i < 10; i++) {
          a.push((a[a.length - 1] || 100) + (Math.random() * 2 - 1));
          b.push((b[b.length - 1] || 95) + (Math.random() * 5 - 2));
        }
      }

      const n = Math.min(a.length, b.length);
      const subA = a.slice(-n);
      const subB = b.slice(-n);

      // OLS
      const meanX = subB.reduce((acc, val) => acc + val, 0) / n;
      const meanY = subA.reduce((acc, val) => acc + val, 0) / n;
      let num = 0;
      let den = 0;
      for (let i = 0; i < n; i++) {
        num += (subB[i] - meanX) * (subA[i] - meanY);
        den += (subB[i] - meanX) ** 2;
      }
      const beta = den === 0 ? 1.0 : num / den;
      const alpha = meanY - beta * meanX;

      // Spread series
      const spreadSeries = subA.map((val, idx) => val - (beta * subB[idx] + alpha));
      const currentSpread = spreadSeries[spreadSeries.length - 1];
      const spreadMean = spreadSeries.reduce((acc, val) => acc + val, 0) / n;
      const variance = spreadSeries.reduce((acc, val) => acc + (val - spreadMean) ** 2, 0) / n;
      const spreadStd = Math.sqrt(variance) === 0 ? 1e-8 : Math.sqrt(variance);

      const zScore = (currentSpread - spreadMean) / spreadStd;

      // OU Half-life & ADF simulation
      const spreadLag = spreadSeries.slice(0, -1);
      const spreadDiff = spreadSeries.slice(1).map((val, idx) => val - spreadLag[idx]);
      let betaOu = -0.15;
      if (spreadLag.length > 2) {
        const mLag = spreadLag.reduce((acc, v) => acc + v, 0) / spreadLag.length;
        const mDiff = spreadDiff.reduce((acc, v) => acc + v, 0) / spreadDiff.length;
        let numOu = 0;
        let denOu = 0;
        for (let i = 0; i < spreadLag.length; i++) {
          numOu += (spreadLag[i] - mLag) * (spreadDiff[i] - mDiff);
          denOu += (spreadLag[i] - mLag) ** 2;
        }
        betaOu = denOu === 0 ? -0.15 : numOu / denOu;
      }

      const theta = -betaOu;
      const halfLife = theta <= 0 ? 999.0 : Math.log(2) / theta;

      const adfStat = betaOu / 0.05;
      const adfPValue = trigger_break ? 0.1825 : Math.max(0.001, Math.min(0.99, 1.0 / (1.0 + Math.exp(Math.abs(adfStat) * 1.2))));

      let regime = adfPValue < 0.05 ? 'STATIONARY_COINTEGRATED' : 'STRUCTURAL_REGIME_BREAK';
      let actionSignal = 'HOLD_POSITION';

      if (adfPValue >= 0.05) {
        actionSignal = 'HALT_STOP_LOSS_BREAKDOWN';
      } else if (zScore <= -z_threshold_entry) {
        actionSignal = 'ENTER_LONG_SPREAD';
      } else if (zScore >= z_threshold_entry) {
        actionSignal = 'ENTER_SHORT_SPREAD';
      } else if (Math.abs(zScore) <= z_threshold_exit) {
        actionSignal = 'EXIT_REVERSION_FLAT';
      } else if (Math.abs(zScore) >= z_threshold_stop) {
        actionSignal = 'STOP_LOSS_EMERGENCY';
      }

      quantEngine.appendLedger(actionSignal, zScore, beta, currentSpread);

      res.json({
        status: 'SUCCESS',
        cluster_pair: `${cluster_a} / ${cluster_b}`,
        current_spread: Number(currentSpread.toFixed(4)),
        hedge_ratio_beta: Number(beta.toFixed(4)),
        intercept_alpha: Number(alpha.toFixed(4)),
        z_score: Number(zScore.toFixed(4)),
        adf_statistic: Number(adfStat.toFixed(4)),
        adf_p_value: Number(adfPValue.toFixed(4)),
        half_life_periods: Number(halfLife.toFixed(2)),
        regime,
        action_signal: actionSignal,
        spread_history: spreadSeries.slice(-40),
        ledger_chain: quantEngine.ledger.slice(-15).reverse(),
      });
    } catch (err: any) {
      res.status(500).json({ status: 'ERROR', message: err.message });
    }
  });

  app.get('/api/stat-arb/ledger', (_req, res) => {
    res.json({
      status: 'SUCCESS',
      ledger: [...quantEngine.ledger].reverse(),
    });
  });

  // Vite middleware for development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  const port = process.env.PORT || 3000;
  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`APEX-206 Institutional Engine running on http://0.0.0.0:${port}`);
  });
}

startServer();
