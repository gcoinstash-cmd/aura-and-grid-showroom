import React, { useState, useEffect } from 'react';
import { Network, Wifi, Play, Pause, Copy, Check, Terminal, Globe, ArrowRight } from 'lucide-react';

export const OpenApiTab: React.FC = () => {
  const [copiedContract, setCopiedContract] = useState(false);
  const [wsStreaming, setWsStreaming] = useState(true);
  const [streamFreqHz, setStreamFreqHz] = useState<100 | 1000 | 5000>(1000);
  const [activeEndpoint, setActiveEndpoint] = useState<'torque-ingress' | 'state' | 'ws-stream' | 'verify-hash'>('torque-ingress');
  const [currentFrame, setCurrentFrame] = useState({
    nonce: 1048590,
    timestamp_ns: 1728775680000000000,
    frequency_hz: 5000,
    torques_nm: { fl: 168.4, fr: 214.2, rl: 395.1, rr: 442.8 },
    slip_ratios: { fl: 0.076, fr: 0.081, rl: 0.084, rr: 0.089 },
    dynamics: { lateral_g: 0.88, yaw_rate_deg_s: 18.2, speed_mph: 74.2 },
    pack_state: { voltage_v: 794.2, max_impedance_mohm: 1.34, temp_c: 31.4 },
    hmac_sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  });

  // Mock WebSocket Stream frame generator
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (wsStreaming) {
      interval = setInterval(() => {
        setCurrentFrame((prev) => ({
          nonce: prev.nonce + 1,
          timestamp_ns: Date.now() * 1000000,
          frequency_hz: 5000,
          torques_nm: {
            fl: Number((160 + Math.random() * 20).toFixed(1)),
            fr: Number((210 + Math.random() * 20).toFixed(1)),
            rl: Number((390 + Math.random() * 30).toFixed(1)),
            rr: Number((435 + Math.random() * 30).toFixed(1)),
          },
          slip_ratios: {
            fl: Number((0.072 + Math.random() * 0.008).toFixed(3)),
            fr: Number((0.078 + Math.random() * 0.008).toFixed(3)),
            rl: Number((0.082 + Math.random() * 0.008).toFixed(3)),
            rr: Number((0.086 + Math.random() * 0.008).toFixed(3)),
          },
          dynamics: {
            lateral_g: Number((0.85 + Math.random() * 0.08).toFixed(2)),
            yaw_rate_deg_s: Number((17.5 + Math.random() * 1.5).toFixed(1)),
            speed_mph: Number((73.5 + Math.random() * 1.5).toFixed(1)),
          },
          pack_state: {
            voltage_v: Number((793.8 + Math.random() * 1.2).toFixed(1)),
            max_impedance_mohm: Number((1.32 + Math.random() * 0.08).toFixed(2)),
            temp_c: Number((31.2 + Math.random() * 0.5).toFixed(1)),
          },
          hmac_sha256: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        }));
      }, streamFreqHz === 100 ? 500 : streamFreqHz === 1000 ? 250 : 120);
    }
    return () => clearInterval(interval);
  }, [wsStreaming, streamFreqHz]);

  const handleCopyContract = () => {
    navigator.clipboard.writeText(openApiYamlSource);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          OpenAPI 3.1 &amp; Binary WebSocket Telemetry Contract
        </h2>
        <p className="text-base text-slate-300 leading-relaxed max-w-4xl">
          Complete standardized protocol interfaces for high-frequency individual wheel torque ingress, slip ratio feedback, 800V solid-state pack gradient broadcast, and lateral G vector streams.
        </p>
      </div>

      {/* Live WebSocket Mock Stream Inspector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Wifi className="w-5 h-5 text-cyan-400" />
              Live WebSocket Binary / JSON Frame Stream (/ws/v1/telemetry/stream)
            </h3>
            <p className="text-sm text-slate-400">
              Downsampled CAN-FD gateway stream emitting 5,000 Hz state frames to client telemetry dashboards.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Frequency selection */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs font-mono">
              <span className="px-2 text-slate-500">Rate:</span>
              {([100, 1000, 5000] as const).map((hz) => (
                <button
                  key={hz}
                  onClick={() => setStreamFreqHz(hz)}
                  className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                    streamFreqHz === hz ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {hz} Hz
                </button>
              ))}
            </div>

            {/* Play / Pause button */}
            <button
              onClick={() => setWsStreaming(!wsStreaming)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer transition-colors ${
                wsStreaming ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-600 text-white'
              }`}
            >
              {wsStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause Stream
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Resume Stream
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Frame Payload Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto">
          <div className="flex items-center justify-between text-slate-400 mb-2 pb-2 border-b border-slate-800/80">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${wsStreaming ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              CONNECTED: wss://inverter-gateway.Apex Executive-gf200.internal/ws/v1/telemetry/stream
            </span>
            <span className="text-purple-300">Frame #{currentFrame.nonce}</span>
          </div>
          <pre className="text-cyan-300 leading-relaxed">{JSON.stringify(currentFrame, null, 2)}</pre>
        </div>
      </div>

      {/* Interactive REST Endpoint Explorer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-amber-400" />
          Interactive REST Endpoints Explorer
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-5">
          {[
            { id: 'torque-ingress', method: 'POST', path: '/api/v1/telemetry/torque-ingress', desc: 'Ingest Torque Batch' },
            { id: 'state', method: 'GET', path: '/api/v1/telemetry/state', desc: 'Current Vehicle Dynamics' },
            { id: 'ws-stream', method: 'WS', path: '/ws/v1/telemetry/stream', desc: 'Real-time WebSocket Feed' },
            { id: 'verify-hash', method: 'POST', path: '/api/v1/ledger/verify-hash', desc: 'Audit Ledger Nonce' },
          ].map((ep) => (
            <button
              key={ep.id}
              onClick={() => setActiveEndpoint(ep.id as any)}
              className={`p-3 rounded-lg text-left transition-all border cursor-pointer ${
                activeEndpoint === ep.id
                  ? 'bg-slate-800 border-amber-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-mono text-xs mb-1">
                <span
                  className={`px-1.5 py-0.5 rounded font-bold ${
                    ep.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' : ep.method === 'GET' ? 'bg-sky-500/20 text-sky-400' : 'bg-purple-500/20 text-purple-400'
                  }`}
                >
                  {ep.method}
                </span>
                <span className="truncate">{ep.path}</span>
              </div>
              <span className="text-xs text-slate-400 block">{ep.desc}</span>
            </button>
          ))}
        </div>

        {/* Selected Endpoint Code / Curl Sample */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs">
          <div className="text-slate-400 mb-2 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Developer Curl Test Payload:</span>
          </div>
          <pre className="text-emerald-300 overflow-x-auto p-2 bg-slate-900 rounded border border-slate-800">
            {activeEndpoint === 'torque-ingress' &&
`curl -X POST https://inverter-gateway.Apex Executive-gf200.internal/api/v1/telemetry/torque-ingress \\
  -H "Content-Type: application/json" \\
  -H "X-Inverter-Enclave-Key: hmac_sec_prod_99f4c" \\
  -d '{
    "nonce": 1048591,
    "vehicle_vin": "JTHBN96E1P0020088",
    "timestamp_ns": 1728775680120000000,
    "torques": { "fl": 180.5, "fr": 220.0, "rl": 410.2, "rr": 460.8 },
    "slip_ratios": { "fl": 0.078, "fr": 0.080, "rl": 0.082, "rr": 0.085 },
    "pack_telemetry": { "voltage_v": 794.0, "max_impedance_mohm": 1.35, "temp_c": 31.5 }
  }'`}
            {activeEndpoint === 'state' &&
`curl -X GET https://inverter-gateway.Apex Executive-gf200.internal/api/v1/telemetry/state \\
  -H "Accept: application/json"`}
            {activeEndpoint === 'ws-stream' &&
`# Connect with wscat or WebSocket client:
wscat -c wss://inverter-gateway.Apex Executive-gf200.internal/ws/v1/telemetry/stream`}
            {activeEndpoint === 'verify-hash' &&
`curl -X POST https://inverter-gateway.Apex Executive-gf200.internal/api/v1/ledger/verify-hash \\
  -H "Content-Type: application/json" \\
  -d '{ "block_nonce": 1048590, "expected_digest": "0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08" }'`}
          </pre>
        </div>
      </div>

      {/* OpenAPI 3.1 YAML Contract Source */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400 font-mono">03.</span>
              OpenAPI 3.1 Formal Specification (YAML)
            </h3>
            <p className="text-sm text-slate-400">RFC-compliant schema contracts for OEM vehicle integration &amp; cloud fleet aggregation.</p>
          </div>
          <button
            onClick={handleCopyContract}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
          >
            {copiedContract ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedContract ? 'Copied YAML' : 'Copy OpenAPI YAML'}
          </button>
        </div>

        <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
          <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-96">
            <code>{openApiYamlSource}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

const openApiYamlSource = `# ==============================================================================
# GF-T3-200: OPENAPI 3.1 TELEMETRY & INVERTER GATEWAY CONTRACT
# Clean-Room Formal Interface Specification
# ==============================================================================

openapi: 3.1.0
info:
  title: GF-T3-200 Quad-Motor Vehicle Telemetry Service
  description: High-frequency inverter gateway, torque vectoring telemetry, and solid-state battery ledger.
  version: 1.0.0-PROD
  contact:
    name: Ghost FactoryOS Architecture
    email: systems@ghostfactory.internal
  license:
    name: MIT Permissive
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://inverter-gateway.Apex Executive-gf200.internal
    description: High-Speed CAN-FD Production Gateway

paths:
  /api/v1/telemetry/torque-ingress:
    post:
      summary: Ingest high-frequency independent torque & slip frame
      operationId: ingestTorqueFrame
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TorqueIngressPayload'
      responses:
        '201':
          description: Telemetry block committed to partitioned PostgreSQL 16 ledger
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/IngressAckResponse'
        '400':
          description: Schema validation or physical constraint failure
        '422':
          description: Slip ratio safety threshold breach detected

  /api/v1/telemetry/state:
    get:
      summary: Retrieve current vehicle dynamics snapshot
      operationId: getVehicleState
      responses:
        '200':
          description: Current vehicle dynamics and motor telemetry
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/VehicleDynamicsState'

  /api/v1/ledger/verify-hash:
    post:
      summary: Cryptographically verify block digest and HMAC signature
      operationId: verifyLedgerHash
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [block_nonce, expected_digest]
              properties:
                block_nonce: { type: integer }
                expected_digest: { type: string, pattern: '^0x[a-f0-9]{64}$' }
      responses:
        '200':
          description: Verification audit result

components:
  schemas:
    TorqueIngressPayload:
      type: object
      required:
        - nonce
        - vehicle_vin
        - timestamp_ns
        - torques
        - slip_ratios
        - pack_telemetry
      properties:
        nonce:
          type: integer
          minimum: 1
          description: Monotonic collision-free frame counter
        vehicle_vin:
          type: string
          minLength: 17
          maxLength: 17
        timestamp_ns:
          type: integer
          description: Hardware clock timestamp in nanoseconds
        torques:
          type: object
          required: [fl, fr, rl, rr]
          properties:
            fl: { type: number, minimum: -600, maximum: 600, description: "Front Left Wheel Torque (Nm)" }
            fr: { type: number, minimum: -600, maximum: 600, description: "Front Right Wheel Torque (Nm)" }
            rl: { type: number, minimum: -600, maximum: 600, description: "Rear Left Wheel Torque (Nm)" }
            rr: { type: number, minimum: -600, maximum: 600, description: "Rear Right Wheel Torque (Nm)" }
        slip_ratios:
          type: object
          required: [fl, fr, rl, rr]
          properties:
            fl: { type: number, minimum: -1.0, maximum: 1.0 }
            fr: { type: number, minimum: -1.0, maximum: 1.0 }
            rl: { type: number, minimum: -1.0, maximum: 1.0 }
            rr: { type: number, minimum: -1.0, maximum: 1.0 }
        pack_telemetry:
          type: object
          required: [voltage_v, max_impedance_mohm, temp_c]
          properties:
            voltage_v: { type: number, minimum: 600, maximum: 850 }
            max_impedance_mohm: { type: number, minimum: 0.1, maximum: 10.0 }
            temp_c: { type: number, minimum: -40, maximum: 85 }

    IngressAckResponse:
      type: object
      required: [status, ledger_id, block_hash, hmac_signature, quarantined]
      properties:
        status: { type: string, example: "COMMITTED" }
        ledger_id: { type: integer, example: 9812401 }
        block_hash: { type: string, example: "0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08" }
        hmac_signature: { type: string }
        quarantined: { type: boolean, example: false }

    VehicleDynamicsState:
      type: object
      properties:
        speed_mph: { type: number }
        lateral_g: { type: number }
        yaw_rate_deg_s: { type: number }
        total_torque_nm: { type: number }
        power_kw: { type: number }
        inverter_health: { type: string, example: "OPTIMAL" }
`;
