import React, { useState } from 'react';

interface Endpoint {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  summary: string;
  role: string;
  requestBody?: string;
  responseExample: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/health',
    summary: 'Health check and engine telemetry',
    role: 'PUBLIC / ALL',
    responseExample: `{
  "status": "OPERATIONAL",
  "service": "APEX-202-LOB-MATCHING-ENGINE",
  "version": "1.0.0",
  "engine_time_ns": 1773641200000000,
  "active_symbols": ["SYNTH-ALPHA / CORE-PT", "ETH-USD", "SOL-USD"],
  "total_orders_matched": 1042,
  "total_fills_generated": 512,
  "current_sequence": 2408
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/orders',
    summary: 'Submit limit or market order',
    role: 'TRADER, ADMIN',
    requestBody: `{
  "symbol": "SYNTH-ALPHA / CORE-PT",
  "side": "BUY",
  "order_type": "LIMIT",
  "price_micros": 65000000000,
  "quantity_micros": 1500000,
  "time_in_force": "GTC",
  "client_order_id": "trader_seq_98124"
}`,
    responseExample: `{
  "order_id": "ord_9b83f124",
  "symbol": "SYNTH-ALPHA / CORE-PT",
  "side": "BUY",
  "order_type": "LIMIT",
  "price_micros": 65000000000,
  "initial_qty_micros": 1500000,
  "remaining_qty_micros": 500000,
  "filled_qty_micros": 1000000,
  "status": "PARTIALLY_FILLED",
  "fills": [
    {
      "fill_id": "fill_82a17",
      "price_micros": 65000000000,
      "quantity_micros": 1000000,
      "settlement_micros": 65000000000,
      "maker_order_id": "ord_maker_01",
      "taker_order_id": "ord_9b83f124"
    }
  ],
  "sequence_number": 2409
}`,
  },
  {
    method: 'DELETE',
    path: '/api/v1/orders/{order_id}?symbol=SYNTH-ALPHA / CORE-PT',
    summary: 'Cancel resting order in O(1)',
    role: 'TRADER, ADMIN',
    responseExample: `{
  "order_id": "ord_9b83f124",
  "symbol": "SYNTH-ALPHA / CORE-PT",
  "status": "CANCELLED",
  "cancelled_qty_micros": 500000,
  "sequence_number": 2410
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/book/{symbol}/l2?depth=20',
    summary: 'Aggregated Level 2 market depth',
    role: 'READONLY, TRADER, ADMIN',
    responseExample: `{
  "symbol": "SYNTH-ALPHA / CORE-PT",
  "timestamp_ns": 1773641200000000,
  "sequence_number": 2410,
  "best_bid_micros": 64990000000,
  "best_ask_micros": 65010000000,
  "spread_micros": 20000000,
  "bids": [
    [64990000000, 1500000, 2],
    [64980000000, 3200000, 4]
  ],
  "asks": [
    [65010000000, 1800000, 1],
    [65020000000, 4500000, 5]
  ]
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/trades/{symbol}?limit=50',
    summary: 'Deterministic trade settlement audit log',
    role: 'AUDITOR, TRADER, ADMIN',
    responseExample: `[
  {
    "sequence_number": 2409,
    "fill_id": "fill_82a17",
    "symbol": "SYNTH-ALPHA / CORE-PT",
    "price_micros": 65000000000,
    "quantity_micros": 1000000,
    "settlement_micros": 65000000000,
    "maker_order_id": "ord_maker_01",
    "taker_order_id": "ord_9b83f124",
    "maker_side": "SELL",
    "taker_side": "BUY",
    "checksum_sha256": "4b92c48f98...e1"
  }
]`,
  },
  {
    method: 'POST',
    path: '/api/v1/book/{symbol}/snapshot',
    summary: 'Create bit-exact engine state snapshot',
    role: 'ADMIN',
    responseExample: `{
  "status": "SNAPSHOT_CREATED",
  "symbol": "SYNTH-ALPHA / CORE-PT",
  "snapshot": {
    "sequence_number": 2410,
    "previous_hash": "4b92c48f98...",
    "orders": [...]
  }
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/book/{symbol}/restore',
    summary: 'Restore state from checkpoint',
    role: 'ADMIN',
    requestBody: `{
  "snapshot": {
    "symbol": "SYNTH-ALPHA / CORE-PT",
    "sequence_number": 2410,
    "orders": [...]
  }
}`,
    responseExample: `{
  "status": "RESTORED",
  "symbol": "SYNTH-ALPHA / CORE-PT",
  "sequence_number": 2410
}`,
  },
];

export const OpenApiViewer: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(ENDPOINTS[1]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 text-slate-200">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
            OpenAPI 3.1 REST Specification
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise RBAC Authentication & Fixed-Point Endpoint Documentation
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Auth: Header <span className="text-emerald-400 font-semibold">X-API-Key</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Endpoint List */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Available Endpoints
          </div>
          <div className="space-y-1.5">
            {ENDPOINTS.map((ep) => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
              return (
                <button
                  key={`${ep.method}-${ep.path}`}
                  onClick={() => setSelectedEndpoint(ep)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-slate-900 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        ep.method === 'GET'
                          ? 'bg-sky-950 text-sky-400 border border-sky-800'
                          : ep.method === 'POST'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-xs font-mono truncate">{ep.path.split('?')[0]}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{ep.summary}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Endpoint Detail */}
        <div className="lg:col-span-2 space-y-4 bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                  selectedEndpoint.method === 'GET'
                    ? 'bg-sky-950 text-sky-400 border border-sky-800'
                    : selectedEndpoint.method === 'POST'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}
              >
                {selectedEndpoint.method}
              </span>
              <span className="text-sm font-mono font-semibold text-white">
                {selectedEndpoint.path}
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Role: <span className="text-slate-200 font-semibold">{selectedEndpoint.role}</span>
            </span>
          </div>

          <div className="text-xs text-slate-300">{selectedEndpoint.summary}</div>

          {selectedEndpoint.requestBody && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-400">
                JSON Request Body
              </div>
              <pre className="p-3 bg-slate-950 rounded border border-slate-800/80 font-mono text-xs text-emerald-400 overflow-x-auto">
                {selectedEndpoint.requestBody}
              </pre>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-400">
              200 OK Response Schema
            </div>
            <pre className="p-3 bg-slate-950 rounded border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto">
              {selectedEndpoint.responseExample}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
