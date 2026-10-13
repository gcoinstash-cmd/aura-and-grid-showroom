import React, { useState, useEffect } from 'react';
import { 
  FileCode, Play, Terminal, Copy, Check, Radio, Send, CheckCircle2, RefreshCw 
} from 'lucide-react';

interface MockPacket {
  seq: number;
  time: string;
  fl_mm: number;
  fr_mm: number;
  rl_mm: number;
  rr_mm: number;
  boost_psi: number;
  hmac: string;
}

export const OpenApiContractTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'endpoints' | 'spec' | 'websocket'>('endpoints');
  const [copiedSpec, setCopiedSpec] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamPackets, setStreamPackets] = useState<MockPacket[]>([]);
  const [packetSeq, setPacketSeq] = useState(1);

  // Selected endpoint tester state
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/v1/telemetry/ahc/corners');
  const [testResponse, setTestResponse] = useState<string | null>(null);

  // Live WebSocket simulation loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStreaming) {
      interval = setInterval(() => {
        setPacketSeq((s) => s + 1);
        const newPacket: MockPacket = {
          seq: packetSeq,
          time: new Date().toISOString().substring(11, 23),
          fl_mm: Number((Math.random() * 2 - 1).toFixed(2)),
          fr_mm: Number((Math.random() * 2 - 1).toFixed(2)),
          rl_mm: Number((Math.random() * 2 - 1).toFixed(2)),
          rr_mm: Number((Math.random() * 2 - 1).toFixed(2)),
          boost_psi: Number((14.2 + Math.random() * 2.1).toFixed(1)),
          hmac: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
        };
        setStreamPackets((prev) => [newPacket, ...prev.slice(0, 19)]);
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isStreaming, packetSeq]);

  const handleTestEndpoint = () => {
    if (selectedEndpoint === '/api/v1/telemetry/ahc/corners') {
      setTestResponse(
        JSON.stringify(
          {
            status: 'ACCEPTED_AND_COMMITTED',
            cycle_rate_hz: 1250,
            monotonic_nonce: 1000042,
            corners: {
              FL: { height_delta_mm: 0.12, pressure_psi: 1452, status: 'OPTIMAL' },
              FR: { height_delta_mm: -0.08, pressure_psi: 1449, status: 'OPTIMAL' },
              RL: { height_delta_mm: 0.05, pressure_psi: 1391, status: 'OPTIMAL' },
              RR: { height_delta_mm: -0.02, pressure_psi: 1389, status: 'OPTIMAL' },
            },
            hmac_sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
          },
          null,
          2
        )
      );
    } else if (selectedEndpoint === '/api/v1/actuators/damping/command') {
      setTestResponse(
        JSON.stringify(
          {
            actuator: 'STEP_MOTOR_PROPORTIONAL_VALVES',
            applied_steps: { FL: 12, FR: 12, RL: 12, RR: 12 },
            damping_target_n: 2840,
            response_latency_us: 420,
            quarantine_override: false,
          },
          null,
          2
        )
      );
    } else {
      setTestResponse(
        JSON.stringify(
          {
            requested_mode: 'HIGH2',
            hydraulic_pump_rpm: 3800,
            pressure_line_mpa: 18.2,
            estimated_duration_sec: 4.5,
            valve_state: 'LIFT_MANIFOLD_OPEN',
          },
          null,
          2
        )
      );
    }
  };

  const copySpec = () => {
    const spec = `openapi: 3.1.0
info:
  title: Lexus LX 600 AHC & Executive Telemetry API
  version: 1.0.0
  description: High-frequency electro-hydraulic telemetry ingestion and V35A-FTS wastegate actuator contracts.
paths:
  /api/v1/telemetry/ahc/corners:
    post:
      summary: Ingest 1,250 Hz 4-Corner Height & Pressure
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [nonce, corners]
              properties:
                nonce: { type: integer }
                corners:
                  type: object
                  properties:
                    FL: { $ref: '#/components/schemas/CornerInput' }
                    FR: { $ref: '#/components/schemas/CornerInput' }
                    RL: { $ref: '#/components/schemas/CornerInput' }
                    RR: { $ref: '#/components/schemas/CornerInput' }
      responses:
        '200':
          description: Telemetry validated and signed into HMAC ledger
  /api/v1/actuators/damping/command:
    post:
      summary: Command Stepper Damping Valves (16-Step)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [corner, step]
              properties:
                corner: { type: string, enum: [FL, FR, RL, RR] }
                step: { type: integer, minimum: 1, maximum: 16 }
      responses:
        '200':
          description: Stepper solenoid position indexed
  /api/v1/suspension/mode:
    post:
      summary: Request Ride Height Mode Transition
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [target_mode]
              properties:
                target_mode:
                  type: string
                  enum: [LOW, NORMAL, COMFORT, SPORT_PLUS, HIGH1, HIGH2, ROCK]
      responses:
        '202':
          description: Transition initiated`;
    navigator.clipboard.writeText(spec);
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Sub-nav */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`px-3 py-1.5 rounded-lg text-[15px] font-mono font-bold cursor-pointer transition-colors ${
              activeTab === 'endpoints'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            REST Endpoints
          </button>
          <button
            onClick={() => setActiveTab('websocket')}
            className={`px-3 py-1.5 rounded-lg text-[15px] font-mono font-bold cursor-pointer transition-colors ${
              activeTab === 'websocket'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            WebSocket 1,250 Hz Stream
          </button>
          <button
            onClick={() => setActiveTab('spec')}
            className={`px-3 py-1.5 rounded-lg text-[15px] font-mono font-bold cursor-pointer transition-colors ${
              activeTab === 'spec'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            OpenAPI 3.1 Spec (YAML)
          </button>
        </div>

        <span className="px-2.5 py-1 rounded text-[15px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
          OpenAPI 3.1.0 Compatible
        </span>
      </div>

      {activeTab === 'endpoints' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Endpoints sidebar */}
          <div className="lg:col-span-1 space-y-2">
            {[
              {
                method: 'POST',
                path: '/api/v1/telemetry/ahc/corners',
                desc: '1,250 Hz 4-Corner Height & Pressure Ingestion',
              },
              {
                method: 'POST',
                path: '/api/v1/actuators/damping/command',
                desc: '16-Step Proportional Solenoid Modulation',
              },
              {
                method: 'POST',
                path: '/api/v1/suspension/mode',
                desc: 'Ride Height Mode Execution (Low to High2)',
              },
            ].map((ep) => (
              <button
                key={ep.path}
                onClick={() => {
                  setSelectedEndpoint(ep.path);
                  setTestResponse(null);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedEndpoint === ep.path
                    ? 'bg-slate-800 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[15px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {ep.method}
                  </span>
                  <span className="font-mono text-[15px] text-white font-bold truncate">
                    {ep.path}
                  </span>
                </div>
                <p className="text-[15px] text-slate-400 line-clamp-1">{ep.desc}</p>
              </button>
            ))}
          </div>

          {/* Tester Panel */}
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <span className="text-[15px] font-mono font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  Interactive Request Inspector
                </span>
                <button
                  onClick={handleTestEndpoint}
                  className="px-4 py-1.5 rounded-lg text-[15px] font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  Send Test Payload
                </button>
              </div>

              <div className="mb-4">
                <div className="text-[15px] font-mono text-slate-400 mb-1">
                  Endpoint Target:
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[15px] text-sky-400">
                  {selectedEndpoint}
                </div>
              </div>

              <div>
                <div className="text-[15px] font-mono text-slate-400 mb-1">
                  Response Payload:
                </div>
                <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[15px] text-emerald-400 overflow-x-auto min-h-[180px] max-h-[300px]">
                  {testResponse ? testResponse : '// Click "Send Test Payload" to verify JSON response contract...'}
                </pre>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[15px] text-slate-400 flex items-center justify-between">
              <span>Schema standard: RFC 7946 / OpenAPI 3.1.0</span>
              <span className="font-mono text-emerald-400 font-semibold">200 OK Guaranteed</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'websocket' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-sky-400 animate-pulse" />
                WebSocket 1,250 Hz Binary / JSON Suspension Stream
              </h3>
              <p className="text-[15px] text-slate-400">
                Low-latency full-duplex socket for real-time corner deflection and wastegate feedback
              </p>
            </div>
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`px-4 py-1.5 rounded-lg text-[15px] font-mono font-bold cursor-pointer transition-colors border ${
                isStreaming
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-sm'
              }`}
            >
              {isStreaming ? 'Disconnect WebSocket' : 'Connect WebSocket (wss://...)'}
            </button>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-[15px] max-h-[420px] overflow-y-auto space-y-2">
            {streamPackets.length === 0 ? (
              <div className="text-slate-500 py-8 text-center">
                WebSocket idle. Click "Connect WebSocket" to start simulated telemetry broadcast stream.
              </div>
            ) : (
              streamPackets.map((pkt) => (
                <div
                  key={pkt.seq}
                  className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/60 rounded border border-slate-800/80 hover:border-slate-700"
                >
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-amber-400 font-bold">#{pkt.seq}</span>
                    <span className="text-slate-500">[{pkt.time}]</span>
                  </div>
                  <div className="text-slate-300">
                    FL:<span className="text-sky-400">{pkt.fl_mm}</span> FR:<span className="text-sky-400">{pkt.fr_mm}</span> RL:<span className="text-sky-400">{pkt.rl_mm}</span> RR:<span className="text-sky-400">{pkt.rr_mm}</span> mm
                  </div>
                  <div className="text-amber-400 font-semibold">
                    Boost: {pkt.boost_psi} PSI
                  </div>
                  <div className="text-emerald-400 font-mono text-[15px] truncate max-w-[140px]">
                    {pkt.hmac}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'spec' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
            <span className="text-[15px] font-mono font-bold text-slate-300">
              openapi_v3_1_lexus_ahc.yaml
            </span>
            <button
              onClick={copySpec}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-[15px] font-mono font-semibold cursor-pointer"
            >
              {copiedSpec ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSpec ? 'Copied' : 'Copy OpenAPI YAML'}</span>
            </button>
          </div>
          <pre className="p-5 font-mono text-[15px] text-slate-300 overflow-x-auto leading-relaxed max-h-[460px] bg-slate-950/70">
            <code>{`openapi: 3.1.0
info:
  title: Lexus LX 600 AHC & Executive Telemetry API
  version: 1.0.0
  description: High-frequency electro-hydraulic telemetry ingestion and V35A-FTS wastegate actuator contracts.
paths:
  /api/v1/telemetry/ahc/corners:
    post:
      summary: Ingest 1,250 Hz 4-Corner Height & Pressure
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [nonce, corners]
              properties:
                nonce: { type: integer }
                corners:
                  type: object
                  properties:
                    FL: { $ref: '#/components/schemas/CornerInput' }
                    FR: { $ref: '#/components/schemas/CornerInput' }
                    RL: { $ref: '#/components/schemas/CornerInput' }
                    RR: { $ref: '#/components/schemas/CornerInput' }
      responses:
        '200':
          description: Telemetry validated and signed into HMAC ledger
  /api/v1/actuators/damping/command:
    post:
      summary: Command Stepper Damping Valves (16-Step)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [corner, step]
              properties:
                corner: { type: string, enum: [FL, FR, RL, RR] }
                step: { type: integer, minimum: 1, maximum: 16 }
      responses:
        '200':
          description: Stepper solenoid position indexed
  /api/v1/suspension/mode:
    post:
      summary: Request Ride Height Mode Transition
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [target_mode]
              properties:
                target_mode:
                  type: string
                  enum: [LOW, NORMAL, COMFORT, SPORT_PLUS, HIGH1, HIGH2, ROCK]
      responses:
        '202':
          description: Transition initiated`}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
