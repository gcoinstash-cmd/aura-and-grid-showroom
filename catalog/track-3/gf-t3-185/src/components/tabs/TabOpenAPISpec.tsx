import React, { useState } from 'react';
import { Network, Send, Copy, Check, Radio, Code2, Globe } from 'lucide-react';

export const TabOpenAPISpec: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('POST /v1/telemetry/ingress');
  const [copiedContract, setCopiedContract] = useState(false);
  const [testResult, setTestResult] = useState<{ status: number; latency: string; data: any } | null>(null);
  const [isSending, setIsSending] = useState(false);

  const openApiYaml = `openapi: 3.1.0
info:
  title: Apex Executive NX 450h+ High-G Dynamic Telemetry AVS Telemetry Gateway
  version: 1.0.0-PROD
  description: High-throughput telemetry ingress, 650-step linear solenoid dispatch, and PHEV battery regen broadcast for GF-T3-185.
servers:
  - url: https://telemetry.Apex Executive-nx.ghostfactory.io/v1
    description: Production High-Performance Gateway (Cloud Run)
paths:
  /telemetry/ingress:
    post:
      summary: Ingress 2,000 Hz 6-DOF IMU and suspension stroke sensor frame
      operationId: postTelemetryFrame
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [speed_mps, roll_angle_deg, pitch_velocity_deg_s, vertical_accel_g, stroke_velocities_mms]
              properties:
                speed_mps:
                  type: number
                  example: 28.5
                roll_angle_deg:
                  type: number
                  example: 3.2
                pitch_velocity_deg_s:
                  type: number
                  example: -1.4
                vertical_accel_g:
                  type: number
                  example: 0.85
                stroke_velocities_mms:
                  type: object
                  properties:
                    FL: { type: number, example: 45.2 }
                    FR: { type: number, example: -38.6 }
                    RL: { type: number, example: 22.1 }
                    RR: { type: number, example: -19.4 }
      responses:
        '200':
          description: Actuation dispatch calculated and persisted to HMAC ledger
          content:
            application/json:
              schema:
                type: object
                properties:
                  nonce: { type: integer, example: 1048291 }
                  timestamp: { type: string, format: date-time }
                  solenoid_steps:
                    type: object
                    properties:
                      FL: { type: integer, minimum: 1, maximum: 650, example: 412 }
                      FR: { type: integer, minimum: 1, maximum: 650, example: 388 }
                      RL: { type: integer, minimum: 1, maximum: 650, example: 295 }
                      RR: { type: integer, minimum: 1, maximum: 650, example: 310 }
                  hmac_sha256: { type: string, example: "9f82c0b..." }

  /actuators/avs-dispatch:
    post:
      summary: Direct solenoid current override (Test Bench Mode)
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [corner, target_current_ma]
              properties:
                corner: { type: string, enum: [FL, FR, RL, RR] }
                target_current_ma: { type: number, minimum: 200, maximum: 1800 }
      responses:
        '200':
          description: Current override accepted by Solenoid PWM Controller

  /phev/battery-regen:
    get:
      summary: Query 18.1 kWh battery SoC and predictive deceleration capacity
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  pack_voltage_v: { type: number, example: 355.2 }
                  soc_percent: { type: number, example: 84.6 }
                  peak_regen_kw: { type: number, example: 62.0 }
                  current_regen_kw: { type: number, example: 35.8 }
                  friction_blending_ratio: { type: number, example: 0.18 }
                  predictive_deceleration_active: { type: boolean, example: true }

webhooks:
  stream_avs_phev:
    summary: WebSocket 2,000 Hz Binary / JSON Stream
    servers:
      - url: wss://telemetry.Apex Executive-nx.ghostfactory.io/v1/stream/avs-phev
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(openApiYaml);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const handleExecuteRequest = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      if (selectedEndpoint === 'POST /v1/telemetry/ingress') {
        setTestResult({
          status: 200,
          latency: '1.82 ms',
          data: {
            status: 'ACCEPTED',
            nonce: 1048292,
            timestamp: new Date().toISOString(),
            solenoid_steps: { FL: 412, FR: 388, RL: 295, RR: 310 },
            excitation_current_ma: { FL: 1214.15, FR: 1155.08, RL: 926.15, RR: 963.08 },
            hydraulic_pressure_bar: { FL: 30.8, FR: 29.8, RL: 26.0, RR: 26.6 },
            hmac_sha256: '9f82c0b4819d45e09214ab69037841cde04fa991752b04f6e1f0e219736c5890',
            quarantine_flag: false
          }
        });
      } else if (selectedEndpoint === 'GET /v1/phev/battery-regen') {
        setTestResult({
          status: 200,
          latency: '0.94 ms',
          data: {
            battery_pack_id: 'PHEV-18KWH-355V-L450H',
            pack_voltage_v: 355.4,
            soc_percent: 84.5,
            available_regen_capacity_kw: 58.2,
            active_regen_kw: 38.6,
            friction_brake_blending_ratio: 0.16,
            curve_predictive_support: true,
            thermal_headroom_celsius: 14.8
          }
        });
      } else {
        setTestResult({
          status: 200,
          latency: '1.25 ms',
          data: {
            actuator: 'FL_LINEAR_SOLENOID',
            dispatched_current_ma: 1200.0,
            feedback_impedance_ohms: 6.84,
            transition_time_ms: 1.95,
            status: 'LOCKED_IN_POSITION'
          }
        });
      }
    }, 350);
  };

  return (
    <div className="space-y-4">
      {/* OpenAPI Header Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <Network className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              OpenAPI 3.1.0 Protocol & WebSocket Contract
            </h2>
            <p className="text-xs text-slate-400">
              Low-latency 2,000 Hz telemetry ingress, AVS current command dispatch, and PHEV battery stream
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
        >
          {copiedContract ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedContract ? 'Copied' : 'Copy OpenAPI YAML'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Interactive Endpoint Tester (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 md:p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-cyan-400" />
                Live API Endpoint Test Console
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                Mock Gateway Ready
              </span>
            </div>

            {/* Endpoint Selector */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-slate-400 block font-medium">Select Endpoint:</label>
              <div className="space-y-1.5">
                {[
                  'POST /v1/telemetry/ingress',
                  'GET /v1/phev/battery-regen',
                  'POST /actuators/avs-dispatch'
                ].map((ep) => (
                  <button
                    key={ep}
                    onClick={() => {
                      setSelectedEndpoint(ep);
                      setTestResult(null);
                    }}
                    className={`w-full text-left text-xs font-mono p-2.5 rounded-lg border transition-colors cursor-pointer flex items-center justify-between ${
                      selectedEndpoint === ep
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{ep}</span>
                    <span className="text-xs text-slate-500">
                      {ep.startsWith('POST') ? 'MUTATION' : 'READ'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trigger Button */}
            <button
              onClick={handleExecuteRequest}
              disabled={isSending}
              className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs h-9 px-4 rounded-lg inline-flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
              <span>{isSending ? 'Sending Request...' : 'Dispatch Request to API Gateway'}</span>
            </button>

            {/* Test Result Display */}
            {testResult && (
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                    HTTP {testResult.status} OK
                  </span>
                  <span className="text-slate-400">
                    Round-Trip Latency: <span className="text-cyan-300 font-bold">{testResult.latency}</span>
                  </span>
                </div>
                <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-emerald-400 border border-slate-800 max-h-56 overflow-y-auto">
                  <code>{JSON.stringify(testResult.data, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>

          {/* WebSocket Streaming Specification */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300">
                WebSocket High-Frequency Binary/JSON Stream
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Real-time duplex socket channel delivering 2,000 frames/sec with zero TCP head-of-line blocking:
            </p>
            <div className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-cyan-300 border border-slate-800">
              <code>wss://telemetry.Apex Executive-nx.ghostfactory.io/v1/stream/avs-phev</code>
            </div>
          </div>
        </div>

        {/* Full OpenAPI 3.1 Contract Viewer (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-4 md:p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-300">
                OpenAPI 3.1.0 Formal Contract (YAML)
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono">Strict Specification</span>
          </div>

          <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed border border-slate-800 max-h-[550px] overflow-y-auto">
            <code>{openApiYaml}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
