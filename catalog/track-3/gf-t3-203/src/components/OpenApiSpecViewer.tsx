import React, { useState } from 'react';

const OPENAPI_SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'APEX-203 Kalman Filter Statistical Arbitrage API',
    version: '1.0.0',
    description:
      'Production-grade Turnkey Python & REST Service for High-Frequency Pairs Trading and Dynamic Beta Extraction',
    contact: {
      name: 'Ghost FactoryOS Track 3 Quant Desk',
      url: 'https://github.com/ghost-factoryos/apex-203',
    },
    license: {
      name: 'MIT Permissive Clean-Room',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:8080',
      description: 'Local Turnkey Python Service (service/main.py)',
    },
    {
      url: 'https://apex203-quant-service-xyz.a.run.app',
      description: 'Google Cloud Run Production Deployment',
    },
  ],
  paths: {
    '/api/v1/tick': {
      post: {
        summary: 'Ingest live market tick and execute Kalman recursion',
        description: 'Updates Beta slope, Intercept Alpha, Welford moments, OU half-life, and evaluates trading signals.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  price_y: { type: 'number', description: 'Observed price of Asset Y', example: 64250.0 },
                  price_x: { type: 'number', description: 'Observed price of Asset X', example: 3415.0 },
                  timestamp: { type: 'integer', description: 'Epoch millisecond timestamp', example: 1773648000000 },
                },
                required: ['price_y', 'price_x'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated state vector, innovation, and trading signal',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    timestamp: { type: 'integer' },
                    beta: { type: 'number', example: 18.824 },
                    alpha: { type: 'number', example: 48.2 },
                    spread: { type: 'number', example: -14.2 },
                    z_score: { type: 'number', example: -2.15 },
                    ou_half_life: { type: 'number', example: 12.4 },
                    signal: {
                      type: 'string',
                      enum: ['NONE', 'ENTER_LONG_SPREAD', 'ENTER_SHORT_SPREAD', 'EXIT_NEUTRAL', 'STOP_OUT'],
                      example: 'ENTER_LONG_SPREAD',
                    },
                    position_side: { type: 'string', example: 'LONG_SPREAD' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/state': {
      get: {
        summary: 'Retrieve current model state vector and covariance matrix',
        responses: {
          '200': {
            description: 'Active model snapshot',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    pair: { type: 'string', example: 'SYNTH_ALPHA_BETA' },
                    beta: { type: 'number', example: 18.82 },
                    alpha: { type: 'number', example: 50.0 },
                    p_matrix: {
                      type: 'array',
                      items: { type: 'array', items: { type: 'number' } },
                      example: [[0.00045, 0.0], [0.0, 0.00045]],
                    },
                    position_side: { type: 'string', example: 'FLAT' },
                    audit_chain_length: { type: 'integer', example: 14 },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/signals': {
      get: {
        summary: 'Retrieve cryptographically chained SHA-256 audit log',
        responses: {
          '200': {
            description: 'Chained signal blocks and integrity verification status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    total_blocks: { type: 'integer', example: 8 },
                    chain_valid: { type: 'boolean', example: true },
                    broken_at_index: { type: 'integer', nullable: true, example: null },
                    blocks: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          index: { type: 'integer' },
                          timestamp: { type: 'integer' },
                          previous_hash: { type: 'string' },
                          hash: { type: 'string' },
                          signal: { type: 'string' },
                          beta: { type: 'number' },
                          spread: { type: 'number' },
                          z_score: { type: 'number' },
                          half_life: { type: 'number' },
                          verified: { type: 'boolean' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/control/burst': {
      post: {
        summary: 'Trigger volatility burst stress test (4.5x multiplier)',
        responses: {
          '200': { description: 'Stress test acknowledged' },
        },
      },
    },
    '/api/v1/control/reversion': {
      post: {
        summary: 'Force Ornstein-Uhlenbeck rapid mean reversion',
        responses: {
          '200': { description: 'Forced reversion acknowledged' },
        },
      },
    },
    '/api/v1/control/regime_shift': {
      post: {
        summary: 'Simulate structural cointegration breakdown (Delta Beta +/- 35%)',
        responses: {
          '200': { description: 'Regime shift acknowledged' },
        },
      },
    },
  },
};

export const OpenApiSpecViewer: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'python' | 'curl' | 'json'>('python');

  const downloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(OPENAPI_SPEC, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'apex203_openapi_3_1.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const pythonSnippet = `import requests

BASE_URL = "http://localhost:8080"

# 1. Ingest live tick into Kalman Filter
response = requests.post(f"{BASE_URL}/api/v1/tick", json={
    "price_y": 64200.0,
    "price_x": 3410.0
})
state = response.json()
print(f"Dynamic Beta: {state['beta']:.4f} | Z-Score: {state['z_score']:.2f} | Signal: {state['signal']}")

# 2. Query SHA-256 Chained Audit Log
audit_resp = requests.get(f"{BASE_URL}/api/v1/signals")
audit = audit_resp.json()
print(f"Chain Integrity Valid: {audit['chain_valid']} | Total Blocks: {audit['total_blocks']}")`;

  const curlSnippet = `# Ingest Tick
curl -X POST http://localhost:8080/api/v1/tick \\
  -H "Content-Type: application/json" \\
  -d '{"price_y": 64200.0, "price_x": 3410.0}'

# Check State
curl -X GET http://localhost:8080/api/v1/state

# Trigger Volatility Burst Load Stress
curl -X POST http://localhost:8080/api/v1/control/burst`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4 font-mono text-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] font-sans">
            OpenAPI 3.1 Engine Specification & Client SDK
          </span>
          <p className="text-[11px] text-slate-500 font-sans mt-0.5">
            Turnkey REST and WebSocket specification for algorithmic execution and institutional auditing.
          </p>
        </div>

        <button
          onClick={downloadJson}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded font-sans text-xs font-medium transition-colors"
        >
          Download openapi.json
        </button>
      </div>

      {/* Code Snippets Segmented Selector */}
      <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <span className="text-slate-400 font-semibold font-sans text-[11px]">Integration Snippets</span>
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded">
            <button
              onClick={() => setActiveCodeTab('python')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                activeCodeTab === 'python' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400'
              }`}
            >
              Python Client
            </button>
            <button
              onClick={() => setActiveCodeTab('curl')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                activeCodeTab === 'curl' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400'
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setActiveCodeTab('json')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                activeCodeTab === 'json' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400'
              }`}
            >
              Raw Schema
            </button>
          </div>
        </div>

        <pre className="p-3 bg-slate-950 rounded text-slate-300 overflow-x-auto text-[11px] leading-relaxed max-h-72">
          {activeCodeTab === 'python' && pythonSnippet}
          {activeCodeTab === 'curl' && curlSnippet}
          {activeCodeTab === 'json' && JSON.stringify(OPENAPI_SPEC, null, 2)}
        </pre>
      </div>

      {/* Endpoints Table */}
      <div>
        <div className="text-[11px] text-slate-400 uppercase tracking-wider font-sans mb-2">
          Available REST Endpoints
        </div>
        <div className="divide-y divide-slate-800/80 border border-slate-800 rounded overflow-hidden">
          {Object.entries(OPENAPI_SPEC.paths).map(([endpoint, methods]) => {
            const method = Object.keys(methods)[0].toUpperCase();
            const details = (methods as any)[method.toLowerCase()];
            return (
              <div key={endpoint} className="p-3 bg-slate-950/70 hover:bg-slate-800/30 flex items-start gap-3">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    method === 'POST' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}
                >
                  {method}
                </span>
                <div className="flex-1">
                  <div className="text-slate-200 font-mono text-[11px] font-semibold">{endpoint}</div>
                  <div className="text-slate-400 font-sans text-[11px] mt-0.5">{details.summary}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
