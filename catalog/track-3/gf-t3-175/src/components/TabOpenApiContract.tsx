import React, { useState, useEffect } from 'react';
import { FileCode2, Copy, Check, Terminal, Play, Radio, Send, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export const TabOpenApiContract: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/v1/telemetry/pack-ingress');
  const [isWsStreaming, setIsWsStreaming] = useState<boolean>(false);
  const [wsMessages, setWsMessages] = useState<any[]>([]);
  const [apiResponse, setApiResponse] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // WebSocket mock stream simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWsStreaming) {
      interval = setInterval(() => {
        const frame = {
          event: 'TELEMETRY_PACK_FRAME_500HZ',
          seq_id: Math.floor(1000190 + Math.random() * 100),
          timestamp_ns: Date.now() * 1000000,
          pack_voltage_v: Number((222.1 + (Math.random() - 0.5) * 0.4).toFixed(2)),
          pack_current_a: Number((-48.5 + (Math.random() - 0.5) * 3.2).toFixed(1)),
          soc_pct: Number((78.9 + Math.random() * 0.1).toFixed(2)),
          regen_recovery_pct: 92.4,
          max_cell_temp_c: Number((28.5 + Math.random() * 0.8).toFixed(1)),
          cell_delta_mv: 11.4,
          tamper_verified: true,
        };
        setWsMessages((prev) => [frame, ...prev.slice(0, 4)]);
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isWsStreaming]);

  const openApiYaml = `openapi: 3.1.0
info:
  title: GF-T3-175 Lexus UX 300h Urban Edge Core API
  version: 1.0.0-PROD
  description: High-frequency 500 Hz telemetry ingestion, WebSocket telemetry broadcast, and urban brake dispatch.
servers:
  - url: https://gf-t3-175-core.aistudio.run
    description: Google Cloud Run Turnkey Edge Deployment

paths:
  /api/v1/telemetry/pack-ingress:
    post:
      summary: High-frequency cell voltage & current ingestion
      description: Ingests 60 cell channels, shunt current, and HMAC signature with sub-millisecond validation.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - sequence_id
                - timestamp_ns
                - cell_voltages
                - pack_current_a
                - ambient_temp_c
                - hmac_signature
              properties:
                sequence_id:
                  type: integer
                  minimum: 1
                  example: 1000192
                timestamp_ns:
                  type: integer
                  example: 1773284200000000
                cell_voltages:
                  type: array
                  items:
                    type: number
                  minItems: 60
                  maxItems: 60
                  description: 60 distinct ADC voltage floats (3.200 - 4.200 V)
                pack_current_a:
                  type: number
                  description: Current in Amperes (< 0 is regen charging)
                  example: -54.2
                ambient_temp_c:
                  type: number
                  example: 24.5
                hmac_signature:
                  type: string
                  pattern: "^[0-9a-fA-F]{64}$"
      responses:
        '200':
          description: Telemetry validated and appended to ledger
          content:
            application/json:
              schema:
                type: object
                properties:
                  status: { type: string, example: "INGESTED" }
                  block_height: { type: integer, example: 1048576 }
                  curr_hash: { type: string }
                  isolation_required: { type: boolean, example: false }

  /api/v1/control/regen-dispatch:
    post:
      summary: Urban kinetic regenerative brake command dispatch
      description: Computes torque split between electric motor MG2 and hydraulic calipers.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - speed_kmh
                - decel_request_mps2
                - pack_soc
              properties:
                speed_kmh: { type: number, minimum: 0, example: 45.0 }
                decel_request_mps2: { type: number, minimum: 0, maximum: 10.0, example: 2.2 }
                pack_soc: { type: number, minimum: 0, maximum: 100, example: 78.5 }
      responses:
        '200':
          description: Dispatch command calculated
          content:
            application/json:
              schema:
                type: object
                properties:
                  regen_torque_nm: { type: number, example: 185.4 }
                  friction_torque_nm: { type: number, example: 15.2 }
                  efficiency_pct: { type: number, example: 92.4 }

  /api/v1/telemetry/stream:
    get:
      summary: WebSocket 500 Hz high-frequency broadcast stream
      description: Bidirectional channel for real-time pack telemetry and thermal alerts.
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(openApiYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTestRequest = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      if (selectedEndpoint === '/api/v1/telemetry/pack-ingress') {
        setApiResponse({
          status: 'INGESTED',
          block_height: 1048576,
          sequence_id: 1000192,
          curr_hash: '0x17c0a82b99ef73145021a8d9b13907cbf41982ea09c0012e8b23398ca12801ef',
          latency_us: 142,
          isolation_required: false,
          computed_soc: 78.92,
          kinetic_efficiency: '92.4%',
        });
      } else {
        setApiResponse({
          status: 'DISPATCH_COMPUTED',
          regen_torque_nm: 184.2,
          friction_torque_nm: 15.1,
          recapture_efficiency: 92.4,
          slip_status: 'NOMINAL_ADHESION',
          hydraulic_override_active: false,
          latency_us: 88,
        });
      }
    }, 250);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded border border-amber-800">
                TAB 3 // PROTOCOL CONTRACT
              </span>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                OpenAPI 3.1 & WebSocket
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              OpenAPI 3.1 & WebSocket Telemetry Interface
            </h2>
            <p className="text-slate-400 text-base mt-1 max-w-3xl leading-relaxed">
              Formal endpoint schemas for high-frequency 60-cell ADC telemetry ingestion, WebSocket real-time frame streaming, and sub-millisecond urban regenerative brake dispatch.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied OpenAPI YAML' : 'Copy OpenAPI 3.1 Contract'}
            </button>
          </div>
        </div>

        {/* Endpoint Selector Tabs */}
        <div className="flex flex-wrap gap-3 border-b border-slate-800 pb-4">
          <button
            onClick={() => setSelectedEndpoint('/api/v1/telemetry/pack-ingress')}
            className={`px-4.5 py-2.5 rounded-xl text-base font-mono font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              selectedEndpoint === '/api/v1/telemetry/pack-ingress'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-700/80 shadow-sm'
                : 'text-slate-300 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">POST</span>
            /api/v1/telemetry/pack-ingress
          </button>

          <button
            onClick={() => setSelectedEndpoint('/api/v1/control/regen-dispatch')}
            className={`px-4.5 py-2.5 rounded-xl text-base font-mono font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              selectedEndpoint === '/api/v1/control/regen-dispatch'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-700/80 shadow-sm'
                : 'text-slate-300 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">POST</span>
            /api/v1/control/regen-dispatch
          </button>

          <button
            onClick={() => setSelectedEndpoint('/api/v1/telemetry/stream')}
            className={`px-4.5 py-2.5 rounded-xl text-base font-mono font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              selectedEndpoint === '/api/v1/telemetry/stream'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-700/80 shadow-sm'
                : 'text-slate-300 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono font-bold">WSS</span>
            /api/v1/telemetry/stream (WebSocket)
          </button>
        </div>
      </div>

      {/* Interactive API Testing Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Request & Parameters */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-7">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <Terminal className="w-6 h-6 text-cyan-400" />
              API Test Dispatcher
            </h3>
            <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded-lg border border-emerald-800">
              Mock Server Active
            </span>
          </div>

          {selectedEndpoint === '/api/v1/telemetry/stream' ? (
            <div className="space-y-4">
              <p className="text-base text-slate-300 leading-relaxed">
                Connect to the 500 Hz high-frequency WebSocket stream to receive continuous telemetry packets, cell delta-V metrics, and instant thermal alert broadcasts.
              </p>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${isWsStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="font-mono text-base font-semibold text-white">
                    {isWsStreaming ? 'STREAMING ACTIVE @ 500 Hz' : 'STREAM DISCONNECTED'}
                  </span>
                </div>
                <button
                  onClick={() => setIsWsStreaming(!isWsStreaming)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-base flex items-center gap-2 transition-all cursor-pointer ${
                    isWsStreaming
                      ? 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                      : 'bg-emerald-600 text-slate-950 hover:bg-emerald-500'
                  }`}
                >
                  <Radio className="w-5 h-5" />
                  {isWsStreaming ? 'Disconnect WebSocket' : 'Connect WebSocket'}
                </button>
              </div>

              {/* Streaming Logs */}
              <div className="space-y-2.5 mt-4 max-h-72 overflow-y-auto">
                {wsMessages.length === 0 ? (
                  <div className="p-6 bg-slate-950 border border-slate-800/80 rounded-xl text-center text-base font-mono text-slate-400">
                    Click "Connect WebSocket" to start streaming simulated live frames.
                  </div>
                ) : (
                  wsMessages.map((msg, i) => (
                    <div key={i} className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-sm text-slate-200 space-y-1">
                      <div className="flex justify-between text-cyan-400 font-bold">
                        <span>{msg.event}</span>
                        <span>#{msg.seq_id}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Pack: {msg.pack_voltage_v}V / {msg.pack_current_a}A</span>
                        <span>SOC: {msg.soc_pct}%</span>
                        <span className="text-emerald-400 font-semibold">Regen: {msg.regen_recovery_pct}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-cyan-300">
                <span className="text-slate-400 block mb-2 text-xs">// Sample Payload for {selectedEndpoint}</span>
                <pre className="overflow-x-auto leading-relaxed">
                  {selectedEndpoint === '/api/v1/telemetry/pack-ingress' ? (
`{
  "sequence_id": 1000192,
  "timestamp_ns": ${Date.now()}000000,
  "cell_voltages": [3.702, 3.698, 3.711, ... 60 cells],
  "pack_current_a": -52.4,
  "ambient_temp_c": 24.5,
  "hmac_signature": "0x17c0a82b99ef73145021a8d9b13907cbf41982ea09c0012e8b23398ca12801ef"
}`
                  ) : (
`{
  "speed_kmh": 48.0,
  "decel_request_mps2": 2.2,
  "pack_soc": 78.92,
  "brake_pedal_pressure_pct": 34.0
}`
                  )}
                </pre>
              </div>

              <button
                onClick={handleSendTestRequest}
                disabled={isTesting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-5 h-5 fill-slate-950" />
                {isTesting ? 'Sending Request...' : 'Send HTTP Test Request'}
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Response Viewer */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-7">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              Response Payload
            </h3>
            {apiResponse && (
              <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded-lg border border-emerald-800">
                200 OK • {apiResponse.latency_us} µs
              </span>
            )}
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-base text-slate-200 min-h-[260px] overflow-x-auto">
            {apiResponse ? (
              <pre className="text-sm sm:text-base text-emerald-300 leading-relaxed">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-base">
                <span>No active response yet.</span>
                <span className="text-sm text-slate-500 mt-1">Click "Send HTTP Test Request" to simulate ingress.</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3.5 mt-5 text-center font-mono">
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-sm text-slate-400 block mb-0.5">Avg Ingress Latency</span>
              <span className="text-emerald-400 font-bold text-lg sm:text-xl">142 µs</span>
            </div>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-sm text-slate-400 block mb-0.5">Throughput Ceiling</span>
              <span className="text-cyan-400 font-bold text-lg sm:text-xl">5,000 req/s</span>
            </div>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-sm text-slate-400 block mb-0.5">Schema Compliance</span>
              <span className="text-white font-bold text-lg sm:text-xl">100% Strict</span>
            </div>
          </div>
        </div>
      </div>

      {/* OpenAPI YAML Schema Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-mono text-slate-300">
            <FileCode2 className="w-4 h-4 text-amber-400" />
            <span>spec/openapi_3_1.yaml (Machine-Readable OpenAPI Contract)</span>
          </div>
          <span className="text-xs font-mono text-slate-500">OpenAPI 3.1.0 Standard</span>
        </div>
        <div className="p-6 bg-slate-950/70 overflow-x-auto text-sm font-mono text-amber-300/90 leading-relaxed max-h-[450px]">
          <pre><code>{openApiYaml}</code></pre>
        </div>
      </div>
    </div>
  );
};
