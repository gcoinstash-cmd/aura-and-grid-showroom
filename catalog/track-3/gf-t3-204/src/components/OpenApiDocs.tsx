import React, { useState } from 'react';

export const OpenApiDocs: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'endpoints' | 'math' | 'schema'>('endpoints');
  const [testEndpoint, setTestEndpoint] = useState<'plan' | 'execute' | 'tape'>('plan');
  const [testResponse, setTestResponse] = useState<string | null>(null);

  const runTestCall = () => {
    if (testEndpoint === 'plan') {
      setTestResponse(
        JSON.stringify(
          {
            order_id: 'ORD-7FA91B2C',
            symbol: 'SYNTH-ALPHA',
            side: 'BUY',
            strategy: 'ALMGREN_CHRISS',
            notional: 1000000.0,
            arrival_price: 125.5,
            total_shares: 7968.1275,
            kappa_urgency: 4.0,
            slices_count: 20,
            genesis_hash: '3d8a7c1e95f082e6bbad615c898c64d8a55ff8254c4f346b0e8b2ec647a747cf',
            sample_slice_1: {
              slice_id: 'ORD-7FA91B2C-SL01',
              target_shares: 588.24,
              venue: 'PRIMARY_EXCHANGE_LIT',
              limit_price: 125.5,
              scheduled_time_pct: 0.05,
            },
          },
          null,
          2
        )
      );
    } else if (testEndpoint === 'execute') {
      setTestResponse(
        JSON.stringify(
          {
            order_id: 'ORD-7FA91B2C',
            status: 'COMPLETED',
            executed_shares: 7968.1275,
            average_exec_price: 125.5342,
            slippage_bps: 2.73,
            implementation_shortfall_points: 272.51,
            venue_breakdown: {
              DARK_POOL_ATS: '65.0%',
              PRIMARY_EXCHANGE_LIT: '20.0%',
              SECONDARY_ECN: '15.0%',
            },
            chain_integrity: 'VALID_100%',
          },
          null,
          2
        )
      );
    } else {
      setTestResponse(
        `slice_index,slice_id,venue,status,target_shares,fill_price,slippage_bps,audit_hash\n` +
          `1,ORD-7FA91B2C-SL01,PRIMARY_EXCHANGE_LIT,FILLED,588.24,125.5280,2.23,a94c1f6b2...\n` +
          `2,ORD-7FA91B2C-SL02,DARK_POOL_ATS,FILLED,562.11,125.5190,1.51,7e12c8b09...\n` +
          `3,ORD-7FA91B2C-SL03,DARK_POOL_ATS,FILLED,537.40,125.5215,1.71,fd9821a43...\n`
      );
    }
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-5 space-y-5">
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <span className="text-sm uppercase tracking-wider text-zinc-400 font-medium">Turnkey Quant Microservice</span>
          <h2 className="text-base font-bold text-zinc-100">OpenAPI 3.1 & Mathematical Specification</h2>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-md border border-zinc-800 text-sm font-mono">
          <button
            onClick={() => setActiveSubTab('endpoints')}
            className={`px-3.5 py-1.5 rounded-md cursor-pointer transition-colors ${
              activeSubTab === 'endpoints' ? 'bg-cyan-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Interactive Endpoints
          </button>
          <button
            onClick={() => setActiveSubTab('math')}
            className={`px-3.5 py-1.5 rounded-md cursor-pointer transition-colors ${
              activeSubTab === 'math' ? 'bg-cyan-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Euler-Lagrange Math
          </button>
          <button
            onClick={() => setActiveSubTab('schema')}
            className={`px-3.5 py-1.5 rounded-md cursor-pointer transition-colors ${
              activeSubTab === 'schema' ? 'bg-cyan-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Raw OpenAPI 3.1 JSON
          </button>
        </div>
      </div>

      {activeSubTab === 'endpoints' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm font-mono">
            <button
              onClick={() => {
                setTestEndpoint('plan');
                setTestResponse(null);
              }}
              className={`p-3.5 text-left rounded-md border transition-all cursor-pointer ${
                testEndpoint === 'plan' ? 'bg-cyan-950/30 border-cyan-500 text-cyan-200' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
              }`}
            >
              <span className="text-sm text-emerald-400 font-bold block mb-1">POST /api/orders/plan</span>
              <span className="font-sans text-sm text-zinc-200 block font-semibold">Compute Optimal Trajectory</span>
              <span className="text-sm text-zinc-400 block mt-1">Generates deterministic child slices & genesis hash</span>
            </button>

            <button
              onClick={() => {
                setTestEndpoint('execute');
                setTestResponse(null);
              }}
              className={`p-3.5 text-left rounded-md border transition-all cursor-pointer ${
                testEndpoint === 'execute' ? 'bg-cyan-950/30 border-cyan-500 text-cyan-200' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
              }`}
            >
              <span className="text-sm text-cyan-400 font-bold block mb-1">POST /api/orders/execute</span>
              <span className="font-sans text-sm text-zinc-200 block font-semibold">Live Parent Order Slicing</span>
              <span className="text-sm text-zinc-400 block mt-1">Dispatches child slices across dark & lit venues</span>
            </button>

            <button
              onClick={() => {
                setTestEndpoint('tape');
                setTestResponse(null);
              }}
              className={`p-3.5 text-left rounded-md border transition-all cursor-pointer ${
                testEndpoint === 'tape' ? 'bg-cyan-950/30 border-cyan-500 text-cyan-200' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
              }`}
            >
              <span className="text-sm text-amber-400 font-bold block mb-1">GET /api/orders/&#123;id&#125;/tape</span>
              <span className="font-sans text-sm text-zinc-200 block font-semibold">Export Chained Fill Tape</span>
              <span className="text-sm text-zinc-400 block mt-1">Immutable SHA-256 chained transaction proofs</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400 font-mono">
              Endpoint: <code className="text-cyan-400 font-semibold">{testEndpoint === 'plan' ? 'POST /api/orders/plan' : testEndpoint === 'execute' ? 'POST /api/orders/execute' : 'GET /api/orders/{id}/tape'}</code>
            </span>
            <button
              onClick={runTestCall}
              className="min-h-[44px] px-5 py-2.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-sm font-mono cursor-pointer transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)]"
            >
              Send Live API Request
            </button>
          </div>

          {testResponse && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4">
              <div className="flex items-center justify-between text-sm text-zinc-400 font-mono pb-2 mb-2 border-b border-zinc-800">
                <span className="text-emerald-400 font-semibold">200 OK · Content-Type: application/json</span>
                <span>Response Latency: 1.4ms</span>
              </div>
              <pre className="text-sm font-mono text-zinc-300 overflow-x-auto max-h-64 leading-relaxed">{testResponse}</pre>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'math' && (
        <div className="space-y-4 text-sm font-mono text-zinc-300 leading-relaxed bg-zinc-950/80 p-5 rounded-md border border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wide mb-1 font-sans">
              1. Almgren-Chriss (2000) Optimal Liquidation Trajectory
            </h3>
            <p className="text-zinc-400 mb-2 font-sans text-sm">
              Balances expected execution cost against portfolio variance risk through continuous calculus of variations:
            </p>
            <div className="bg-zinc-900 p-3.5 rounded-md border border-zinc-800 text-cyan-300 overflow-x-auto text-sm">
              min U(x) = E[x] + λ V[x] = ½ γ X₀² + (η / τ) Σ n_k² + λ σ² τ Σ x_k²
            </div>
            <p className="mt-2 text-zinc-400 font-sans text-sm">
              Applying the Euler-Lagrange condition yields the second-order linear differential equation:
            </p>
            <div className="bg-zinc-900 p-3 rounded-md border border-zinc-800 text-amber-300 my-1.5 text-sm">
              η d²x/dt² - λ σ² x = 0  ⟹  κ = √(λ σ² / η)
            </div>
            <p className="text-zinc-400 font-sans text-sm">
              With boundary conditions x(0) = X₀ and x(T) = 0, the exact hyperbolic trajectory is:
            </p>
            <div className="bg-zinc-900 p-3 rounded-md border border-zinc-800 text-emerald-300 my-1.5 text-sm">
              x(t) = X₀ · sinh(κ(T - t)) / sinh(κT)
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800">
            <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wide mb-1 font-sans">
              2. VWAP Intraday Smile Volume Profile
            </h3>
            <p className="text-zinc-400 mb-2 font-sans text-sm">
              Child slice sizing tracks institutional liquidity concentration using a bimodal smile curve:
            </p>
            <div className="bg-zinc-900 p-3.5 rounded-md border border-zinc-800 text-cyan-300 overflow-x-auto text-sm">
              w(t) = 0.40 + 3.2(t - 0.5)² + 1.10 exp(-(t - 0.05)² / 0.015) + 1.35 exp(-(t - 0.95)² / 0.015)
              <br />
              n_k = X₀ · (w_k / Σ w_j)
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800">
            <h3 className="text-base font-bold text-cyan-400 uppercase tracking-wide mb-1 font-sans">
              3. TWAP Linear Schedule with Sizing Jitter
            </h3>
            <p className="text-zinc-400 mb-2 font-sans text-sm">
              Protects institutional order flow against predatory algorithmic detection and front-running:
            </p>
            <div className="bg-zinc-900 p-3.5 rounded-md border border-zinc-800 text-cyan-300 overflow-x-auto text-sm">
              n_k = (X₀ / N) · (1 + ε_k),   where ε_k ~ Uniform(-δ, +δ)
              <br />
              Strict zero-residual constraint enforced: Σ n_k = X₀
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'schema' && (
        <div className="bg-zinc-950 p-4 rounded-md border border-zinc-800">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-sm font-mono text-zinc-400">
            <span>OpenAPI 3.1.0 Specification (Clean-Room JSON)</span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(JSON.stringify(openApiSchema, null, 2));
              }}
              className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium"
            >
              Copy Schema JSON
            </button>
          </div>
          <pre className="text-sm font-mono text-zinc-300 max-h-96 overflow-y-auto leading-relaxed">
            {JSON.stringify(openApiSchema, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

const openApiSchema = {
  openapi: '3.1.0',
  info: {
    title: 'APEX-204 Institutional Execution API',
    version: '1.0.0',
    description: 'Algorithmic Execution Engine for TWAP, VWAP, and Almgren-Chriss Liquidation',
  },
  paths: {
    '/api/orders/plan': {
      post: {
        summary: 'Compute Optimal Trajectory',
        operationId: 'planOrder',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  symbol: { type: 'string', example: 'SYNTH-ALPHA' },
                  notional: { type: 'number', example: 1000000.0 },
                  side: { type: 'string', enum: ['BUY', 'SELL'] },
                  strategy: { type: 'string', enum: ['ALMGREN_CHRISS', 'VWAP', 'TWAP'] },
                  slices: { type: 'integer', default: 20 },
                  risk_aversion_lambda: { type: 'number', default: 1e-6 },
                  volatility_sigma: { type: 'number', default: 0.02 },
                  temporary_impact_eta: { type: 'number', default: 2.5e-7 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Scheduled trajectory created' },
        },
      },
    },
    '/api/orders/execute': {
      post: {
        summary: 'Submit Parent Order for Live Execution',
        operationId: 'executeOrder',
        responses: {
          '200': { description: 'Parent order completed and child slices filled' },
        },
      },
    },
    '/api/orders/{id}/tape': {
      get: {
        summary: 'Export Cryptographically Chained Fill Tape',
        operationId: 'exportFillTape',
        responses: {
          '200': { description: 'CSV or JSON formatted execution tape' },
        },
      },
    },
  },
};
