import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  app.use(express.json());

  // In-memory stat-arb state & audit ledger
  let kalmanState = {
    beta: 1.184,
    alpha: 5.420,
    P: [[1.0, 0.0], [0.0, 1.0]],
    W: [[1e-5, 0.0], [0.0, 1e-5]],
    R: 1e-3
  };

  let auditLedger: Array<{ index: number; timestamp: string; payload: any; prev_hash: string; hash: string }> = [
    {
      index: 0,
      timestamp: new Date().toISOString(),
      payload: { event: "GENESIS", system: "GF-T3-211 APEX-211 STAT-ARB ENGINE" },
      prev_hash: "0".repeat(64),
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
  ];

  function appendLedger(payload: any) {
    const index = auditLedger.length;
    const prev_hash = auditLedger[index - 1].hash;
    const block = {
      index,
      timestamp: new Date().toISOString(),
      payload,
      prev_hash,
      hash: ""
    };
    // compute sha256 mock / simple hash
    const str = JSON.stringify(block);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    block.hash = Math.abs(hash).toString(16).padStart(64, '0');
    auditLedger.push(block);
    return block;
  }

  // API Routes
  app.post('/api/stat-arb/simulate', (req, res) => {
    const { price_a, price_b } = req.body;
    const pa = typeof price_a === 'number' ? price_a : 105.5;
    const pb = typeof price_b === 'number' ? price_b : 98.2;

    // Kalman filter step
    // H = [pb, 1.0]
    const H = [pb, 1.0];
    const pred_y = kalmanState.beta * pb + kalmanState.alpha;
    const e = pa - pred_y;

    // Innovation variance S = H P H^T + R
    const S = H[0] * (kalmanState.P[0][0] * H[0] + kalmanState.P[0][1] * H[1]) +
              H[1] * (kalmanState.P[1][0] * H[0] + kalmanState.P[1][1] * H[1]) + kalmanState.R;

    // Kalman gain K = P H^T / S
    const k0 = (kalmanState.P[0][0] * H[0] + kalmanState.P[0][1] * H[1]) / S;
    const k1 = (kalmanState.P[1][0] * H[0] + kalmanState.P[1][1] * H[1]) / S;

    kalmanState.beta += k0 * e;
    kalmanState.alpha += k1 * e;

    const spread = pa - (kalmanState.beta * pb + kalmanState.alpha);
    const z_score = spread / (Math.sqrt(S) + 1e-8);

    let signal = "NEUTRAL";
    if (z_score >= 2.0) {
      signal = "SHORT_SPREAD (SHORT A / LONG B)";
    } else if (z_score <= -2.0) {
      signal = "LONG_SPREAD (LONG A / SHORT B)";
    } else if (Math.abs(z_score) <= 0.5) {
      signal = "FLAT / EXIT";
    } else if (Math.abs(z_score) >= 3.5) {
      signal = "STOP_LOSS / EMERGENCY UNWIND";
    }

    const payload = {
      price_a: pa,
      price_b: pb,
      beta: Number(kalmanState.beta.toFixed(4)),
      alpha: Number(kalmanState.alpha.toFixed(4)),
      spread: Number(spread.toFixed(4)),
      z_score: Number(z_score.toFixed(4)),
      signal,
      forecast_variance: Number(S.toFixed(5))
    };

    appendLedger({ event_type: "KALMAN_STATE_UPDATE", details: payload });

    res.json({
      success: true,
      data: payload
    });
  });

  app.post('/api/copula/analyze', (req, res) => {
    const { series_u, series_v } = req.body;
    // Compute simulated copula dependence parameters
    const u = series_u || Array.from({ length: 50 }, () => Math.random());
    const v = series_v || Array.from({ length: 50 }, () => Math.random());

    // Kendall's tau approximation
    let concordant = 0;
    let discordant = 0;
    const n = u.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const prod = (u[i] - u[j]) * (v[i] - v[j]);
        if (prod > 0) concordant++;
        else if (prod < 0) discordant++;
      }
    }
    const totalPairs = (n * (n - 1)) / 2;
    const kendallTau = totalPairs > 0 ? (concordant - discordant) / totalPairs : 0.65;

    const claytonTheta = Math.max(0.1, (2 * kendallTau) / (1 - kendallTau + 1e-6));
    const lowerTailDep = Math.pow(2, -1 / claytonTheta);
    const gumbelTheta = Math.max(1.0, 1 / (1 - kendallTau + 1e-6));
    const upperTailDep = 2 - Math.pow(2, 1 / gumbelTheta);
    const gaussianRho = Math.sin((Math.PI * kendallTau) / 2);

    const result = {
      kendall_tau: Number(kendallTau.toFixed(4)),
      clayton_theta: Number(claytonTheta.toFixed(4)),
      lower_tail_dependence: Number(lowerTailDep.toFixed(4)),
      gumbel_theta: Number(gumbelTheta.toFixed(4)),
      upper_tail_dependence: Number(upperTailDep.toFixed(4)),
      gaussian_rho: Number(gaussianRho.toFixed(4)),
      sample_size: n
    };

    appendLedger({ event_type: "COPULA_RECALIBRATION", details: result });

    res.json({
      success: true,
      data: result
    });
  });

  app.get('/api/audit/ledger', (req, res) => {
    // Verify chain
    let verified = true;
    for (let i = 1; i < auditLedger.length; i++) {
      if (auditLedger[i].prev_hash !== auditLedger[i - 1].hash) {
        verified = false;
        break;
      }
    }
    res.json({
      success: true,
      verified,
      chain_length: auditLedger.length,
      chain: auditLedger
    });
  });

  app.get('/api/specs/docs', (req, res) => {
    try {
      const engineSpec = fs.readFileSync(path.join(__dirname, 'ENGINE_SPEC.md'), 'utf-8');
      const legalAudit = fs.readFileSync(path.join(__dirname, 'LEGAL_IP_AUDIT.md'), 'utf-8');
      const assetTransfer = fs.readFileSync(path.join(__dirname, 'ASSET_TRANSFER_SPEC.md'), 'utf-8');
      res.json({
        success: true,
        engine_spec: engineSpec,
        legal_audit: legalAudit,
        asset_transfer: assetTransfer
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/backtest/run', (req, res) => {
    const { pair_id, lookback } = req.body;
    // Return performance matrix for synthetic pair
    const metrics: Record<string, any> = {
      "SYNTH-PAIR-01": {
        sharpe_ratio: 3.42,
        max_drawdown_pts: -1.82,
        win_rate_pct: 68.4,
        cumulative_alpha_units: 420.50,
        trades_executed: 142,
        ou_half_life_days: 3.8,
        adf_p_value: 0.0012
      },
      "COMMODITY-CRACK-SYNTH": {
        sharpe_ratio: 2.91,
        max_drawdown_pts: -2.45,
        win_rate_pct: 64.1,
        cumulative_alpha_units: 315.20,
        trades_executed: 98,
        ou_half_life_days: 5.2,
        adf_p_value: 0.0041
      },
      "RATES-CURVE-VECTOR": {
        sharpe_ratio: 4.10,
        max_drawdown_pts: -1.10,
        win_rate_pct: 72.8,
        cumulative_alpha_units: 512.80,
        trades_executed: 210,
        ou_half_life_days: 2.1,
        adf_p_value: 0.0003
      }
    };

    const result = metrics[pair_id] || metrics["SYNTH-PAIR-01"];
    appendLedger({ event_type: "BACKTEST_EXECUTION", details: { pair_id, lookback, result } });

    res.json({
      success: true,
      data: result
    });
  });

  // Vite integration in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`[GF-T3-211] APEX-211 Engine running on port ${port}`);
  });
}

startServer();
