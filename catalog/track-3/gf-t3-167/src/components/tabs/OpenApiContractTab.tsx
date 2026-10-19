import React, { useState } from 'react';
import { 
  Globe, 
  Send, 
  Copy, 
  Check, 
  Code2, 
  Radio, 
  Terminal, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';

export const OpenApiContractTab: React.FC = () => {
  const [activeEndpoint, setActiveEndpoint] = useState<'POST_ORDER' | 'CANCEL_ORDER' | 'GET_L2' | 'GET_HEALTH' | 'WS_TRADES'>('POST_ORDER');
  const [requestExecuting, setRequestExecuting] = useState(false);
  const [simulatedResponse, setSimulatedResponse] = useState<any>(null);
  const [responseLatency, setResponseLatency] = useState<number | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [viewFormat, setViewFormat] = useState<'INTERACTIVE' | 'RAW_OPENAPI'>('INTERACTIVE');

  const executeRequest = () => {
    setRequestExecuting(true);
    setSimulatedResponse(null);
    setResponseLatency(null);

    const start = performance.now();
    setTimeout(() => {
      const end = performance.now();
      setResponseLatency(parseFloat((end - start + 0.42).toFixed(2)));

      if (activeEndpoint === 'POST_ORDER') {
        setSimulatedResponse({
          status: 'SUCCESS',
          order_id: 'ord_' + crypto.randomUUID().substring(0, 13),
          sequence_id: 1000193,
          symbol: 'High-Aero Grand Touring Telemetry Core-DYN',
          side: 'BUY',
          price: 104525.00,
          quantity: 10,
          status_code: 'ENQUEUED_RING_BUFFER',
          latency_us: 412,
          hmac_ingress_token: '0x88fe2a9011...',
        });
      } else if (activeEndpoint === 'CANCEL_ORDER') {
        setSimulatedResponse({
          status: 'CANCELED',
          order_id: 'ord_c7a109bf-4819',
          canceled_at: new Date().toISOString(),
          refunded_lots: 12,
        });
      } else if (activeEndpoint === 'GET_L2') {
        setSimulatedResponse({
          symbol: 'High-Aero Grand Touring Telemetry Core-DYN',
          timestamp: new Date().toISOString(),
          bids: [
            [104520.00, 18],
            [104515.00, 34],
            [104510.00, 45],
          ],
          asks: [
            [104530.00, 15],
            [104535.00, 28],
            [104540.00, 50],
          ],
          spread: 10.00,
          monotonic_watermark: 1000192,
        });
      } else if (activeEndpoint === 'GET_HEALTH') {
        setSimulatedResponse({
          status: 'HEALTHY',
          engine_version: 'v1.0.0-PROD',
          monotonic_sequence: 1000192,
          p99_latency_ms: 0.84,
          ring_buffer_slots: 65536,
          lock_free_state: 'ACTIVE',
        });
      } else {
        setSimulatedResponse({
          event: 'subscribed',
          channel: 'trades.High-Aero Grand Touring Telemetry Core-DYN',
          heartbeat_interval_ms: 1000,
          message: 'Connected to live execution feed. Chained HMAC stream verified.',
        });
      }

      setRequestExecuting(false);
    }, 280);
  };

  const getCurlSnippet = () => {
    switch (activeEndpoint) {
      case 'POST_ORDER':
        return `curl -X POST "https://engine.ghostfactoryos.internal/api/v1/orders" \\
  -H "Content-Type: application/json" \\
  -H "X-Client-Key: CLNT_ACQ_9982" \\
  -d '{
    "side": "BUY",
    "type": "LIMIT",
    "price": 104525.00,
    "quantity": 10,
    "trader_id": "TRD-ACQ-981"
  }'`;
      case 'CANCEL_ORDER':
        return `curl -X DELETE "https://engine.ghostfactoryos.internal/api/v1/orders/ord_c7a109bf-4819" \\
  -H "X-Client-Key: CLNT_ACQ_9982"`;
      case 'GET_L2':
        return `curl -X GET "https://engine.ghostfactoryos.internal/api/v1/book/l2?symbol=High-Aero Grand Touring Telemetry Core-DYN&depth=20"`;
      case 'GET_HEALTH':
        return `curl -X GET "https://engine.ghostfactoryos.internal/api/v1/telemetry/health"`;
      case 'WS_TRADES':
        return `wscat -c "wss://engine.ghostfactoryos.internal/ws/v1/trades?symbol=High-Aero Grand Touring Telemetry Core-DYN"`;
    }
  };

  const openApiRawYaml = `openapi: 3.1.0
info:
  title: GF-T3-167 Dynamic Core Engine API
  version: 1.0.0-PROD
  description: High-throughput matching engine and HMAC tick ledger interface for Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core Dynamic Core.
servers:
  - url: https://engine.ghostfactoryos.internal/api/v1
    description: Production Internal Cloud Run Service
paths:
  /orders:
    post:
      summary: Submit Limit/Market Order
      operationId: submitOrder
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [side, type, price, quantity, trader_id]
              properties:
                side: { type: string, enum: [BUY, SELL] }
                type: { type: string, enum: [LIMIT, MARKET, IOC, FOK] }
                price: { type: number, format: double }
                quantity: { type: integer, minimum: 1 }
                trader_id: { type: string }
      responses:
        '201':
          description: Order queued to lock-free ring-buffer
  /orders/{order_id}:
    delete:
      summary: Cancel Active Order
      parameters:
        - name: order_id
          in: path
          required: true
          schema: { type: string }
  /book/l2:
    get:
      summary: Retrieve Top-20 Market Depth
  /telemetry/health:
    get:
      summary: Query Deterministic Latency and Monotonic Sequence
`;

  return (
    <div className="space-y-7">
      {/* Tab Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm font-bold uppercase tracking-wider mb-1">
            <Globe className="w-4 h-4" />
            OpenAPI 3.1 & Protocol Specification
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            REST Ingress Endpoints & Streaming WebSocket Feeds
          </h2>
          <p className="text-zinc-300 text-sm sm:text-base mt-1.5 leading-relaxed max-w-3xl">
            Strict schema enforcement with typed request/response models. Sub-millisecond synchronous order injection and full market-depth feeds.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-stretch md:self-auto bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
          <button
            onClick={() => setViewFormat('INTERACTIVE')}
            className={`px-4 py-2 rounded-lg text-sm sm:text-base font-mono font-bold transition-all ${
              viewFormat === 'INTERACTIVE'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Interactive Console
          </button>
          <button
            onClick={() => setViewFormat('RAW_OPENAPI')}
            className={`px-4 py-2 rounded-lg text-sm sm:text-base font-mono font-bold transition-all ${
              viewFormat === 'RAW_OPENAPI'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Raw OpenAPI 3.1 YAML
          </button>
        </div>
      </div>

      {viewFormat === 'INTERACTIVE' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          {/* ENDPOINT SELECTOR SIDEBAR (4 Cols) */}
          <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-3.5 font-mono">
            <div className="text-base font-black text-zinc-300 uppercase tracking-wider px-2 py-1">
              Engine Service Contracts
            </div>

            <button
              onClick={() => { setActiveEndpoint('POST_ORDER'); setSimulatedResponse(null); }}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                activeEndpoint === 'POST_ORDER'
                  ? 'bg-zinc-800 border-cyan-500/60 text-white shadow-md'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-sm font-black px-2.5 py-1 rounded-md">
                  POST
                </span>
                <span className="text-base sm:text-lg font-bold">/api/v1/orders</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-zinc-400">Inject Order</span>
            </button>

            <button
              onClick={() => { setActiveEndpoint('CANCEL_ORDER'); setSimulatedResponse(null); }}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                activeEndpoint === 'CANCEL_ORDER'
                  ? 'bg-zinc-800 border-cyan-500/60 text-white shadow-md'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="bg-rose-950 text-rose-300 border border-rose-500/40 text-sm font-black px-2.5 py-1 rounded-md">
                  DELETE
                </span>
                <span className="text-base sm:text-lg font-bold">/orders/{'{id}'}</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-zinc-400">Cancel</span>
            </button>

            <button
              onClick={() => { setActiveEndpoint('GET_L2'); setSimulatedResponse(null); }}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                activeEndpoint === 'GET_L2'
                  ? 'bg-zinc-800 border-cyan-500/60 text-white shadow-md'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="bg-blue-950 text-blue-300 border border-blue-500/40 text-sm font-black px-2.5 py-1 rounded-md">
                  GET
                </span>
                <span className="text-base sm:text-lg font-bold">/api/v1/book/l2</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-zinc-400">Depth-20</span>
            </button>

            <button
              onClick={() => { setActiveEndpoint('GET_HEALTH'); setSimulatedResponse(null); }}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                activeEndpoint === 'GET_HEALTH'
                  ? 'bg-zinc-800 border-cyan-500/60 text-white shadow-md'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="bg-blue-950 text-blue-300 border border-blue-500/40 text-sm font-black px-2.5 py-1 rounded-md">
                  GET
                </span>
                <span className="text-base sm:text-lg font-bold">/telemetry/health</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-zinc-400">Latency/SLA</span>
            </button>

            <button
              onClick={() => { setActiveEndpoint('WS_TRADES'); setSimulatedResponse(null); }}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                activeEndpoint === 'WS_TRADES'
                  ? 'bg-zinc-800 border-cyan-500/60 text-white shadow-md'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="bg-purple-950 text-purple-300 border border-purple-500/40 text-sm font-black px-2.5 py-1 rounded-md flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-purple-400" /> WS
                </span>
                <span className="text-base sm:text-lg font-bold">/ws/v1/trades</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-zinc-400">Streaming</span>
            </button>
          </div>

          {/* PLAYGROUND & EXECUTION CONSOLE (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Request Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-xl font-mono">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4.5 border-b border-zinc-800 mb-5">
                <div className="flex items-center gap-3">
                  <Terminal className="w-6 h-6 text-cyan-400" />
                  <span className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                    Console Playground
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getCurlSnippet());
                      setCopiedCurl(true);
                      setTimeout(() => setCopiedCurl(false), 2000);
                    }}
                    className="flex items-center gap-2 text-base text-zinc-300 hover:text-white bg-zinc-950 border border-zinc-700 px-4 py-2.5 rounded-xl transition-colors font-bold"
                  >
                    {copiedCurl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCurl ? 'cURL Copied' : 'Copy cURL'}</span>
                  </button>

                  <button
                    onClick={executeRequest}
                    disabled={requestExecuting}
                    className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-black text-base px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>{requestExecuting ? 'Executing...' : 'Send Request'}</span>
                  </button>
                </div>
              </div>

              {/* cURL Snippet Display */}
              <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 text-base font-mono text-zinc-200 overflow-x-auto mb-6 leading-relaxed">
                <pre><code>{getCurlSnippet()}</code></pre>
              </div>

              {/* Simulated Live Response HUD */}
              <div>
                <div className="flex items-center justify-between text-base text-zinc-300 mb-3">
                  <span className="font-bold uppercase tracking-wider text-zinc-200">
                    Live Response Payload
                  </span>
                  {responseLatency !== null && (
                    <span className="flex items-center gap-2 text-emerald-300 font-bold bg-emerald-950/70 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl text-base">
                      <Clock className="w-4.5 h-4.5" />
                      {responseLatency} ms RTT
                    </span>
                  )}
                </div>

                <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 min-h-[200px] text-base sm:text-lg leading-relaxed overflow-x-auto font-mono">
                  {requestExecuting ? (
                    <div className="h-full flex items-center justify-center text-zinc-400 font-bold animate-pulse py-12 text-base sm:text-lg">
                      Dispatching request through lock-free ring-buffer...
                    </div>
                  ) : simulatedResponse ? (
                    <pre className="text-emerald-300">
                      <code>{JSON.stringify(simulatedResponse, null, 2)}</code>
                    </pre>
                  ) : (
                    <div className="text-zinc-500 italic py-12 text-center text-lg">
                      Click "Send Request" to test deterministic API response.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* RAW OPENAPI VIEW */
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-zinc-950 px-6 py-4.5 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-base sm:text-lg font-mono font-bold text-zinc-200">
              openapi_v3_1_dynamic_core.yaml
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(openApiRawYaml);
                setCopiedCurl(true);
                setTimeout(() => setCopiedCurl(false), 2000);
              }}
              className="flex items-center gap-2.5 text-base font-mono font-bold text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-700 px-5 py-2.5 rounded-xl transition-colors"
            >
              {copiedCurl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCurl ? 'Copied' : 'Copy OpenAPI YAML'}</span>
            </button>
          </div>
          <div className="p-6 bg-zinc-950/80 overflow-x-auto text-base sm:text-lg font-mono leading-relaxed text-zinc-200">
            <pre><code>{openApiRawYaml}</code></pre>
          </div>
        </div>
      )}
    </div>
  );
};
