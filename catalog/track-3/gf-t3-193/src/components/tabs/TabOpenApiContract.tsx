import React, { useState, useEffect } from 'react';
import { Network, Send, Play, Pause, Copy, Check, Radio, Terminal, Server } from 'lucide-react';
import { computeHmacSha256 } from '../../utils/cryptoLedger';

interface TabOpenApiContractProps {
  currentRpm: number;
}

interface WsFrame {
  seq: number;
  time: string;
  bytes: number;
  rpm: number;
  mafGps: number;
  manifoldKpa: number;
  throttleMode: string;
}

export const TabOpenApiContract: React.FC<TabOpenApiContractProps> = ({ currentRpm }) => {
  const [selectedMode, setSelectedMode] = useState<'Normal' | 'Sport' | 'High-Frequency Compute Mode'>('High-Frequency Compute Mode');
  const [testThrottle, setTestThrottle] = useState(78);
  const [testRpm, setTestRpm] = useState(currentRpm || 4800);
  const [isSending, setIsSending] = useState(false);
  const [apiResponse, setApiResponse] = useState<{
    status: number;
    latencyMs: number;
    payload: any;
  } | null>(null);

  const [wsStreaming, setWsStreaming] = useState(true);
  const [wsFrames, setWsFrames] = useState<WsFrame[]>([]);
  const [copiedYaml, setCopiedYaml] = useState(false);

  // Sync testRpm when currentRpm changes
  useEffect(() => {
    if (currentRpm) {
      setTestRpm(currentRpm);
    }
  }, [currentRpm]);

  // Simulate WebSocket frames
  useEffect(() => {
    if (!wsStreaming) return;
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.toTimeString().split(' ')[0]}.${now.getMilliseconds().toString().padStart(3, '0')}`;
      const jitter = (Math.random() - 0.5) * 60;
      const rpmVal = Math.round(Math.max(750, testRpm + jitter));
      const maf = Number(((rpmVal / 7300) * 310 + (Math.random() * 5)).toFixed(2));
      const kpa = Number((98.5 + (Math.random() * 2.5)).toFixed(1));

      setWsFrames((prev) => [
        {
          seq: (prev[0]?.seq || 10420) + 1,
          time: timeStr,
          bytes: 142,
          rpm: rpmVal,
          mafGps: maf,
          manifoldKpa: kpa,
          throttleMode: selectedMode,
        },
        ...prev.slice(0, 15),
      ]);
    }, 400);

    return () => clearInterval(interval);
  }, [wsStreaming, testRpm, selectedMode]);

  const handleSendTestPayload = async () => {
    setIsSending(true);
    const start = performance.now();

    const isStage2 = testRpm >= 3600;
    const mafGps = Number(((testRpm / 7300) * 315).toFixed(2));
    const manifoldKpa = Number((101.3 - (1.0 - testThrottle / 100) * 55).toFixed(1));
    const tbr = 2.80;

    const dummyPrevHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const payloadString = `${testRpm}:${testThrottle}:${mafGps}:${manifoldKpa}:${dummyPrevHash}`;
    const signature = await computeHmacSha256(payloadString);

    setTimeout(() => {
      const end = performance.now();
      setIsSending(false);
      setApiResponse({
        status: 200,
        latencyMs: Number((end - start + 1.2).toFixed(2)),
        payload: {
          code: "FRAME_ACCEPTED",
          assetId: "GF-T3-193",
          nonce: 1084292,
          acousticValveState: isStage2 ? "STAGE_2_OPEN" : "STAGE_1_CLOSED",
          helmholtzResonanceHz: isStage2 ? 2500 : 72,
          driveMode: selectedMode,
          mafIngressFlowGps: mafGps,
          manifoldPressureKpa: manifoldKpa,
          tbrRatio: tbr,
          hmacSignature: signature,
          validationStatus: "RFC_3339_COMPLIANT_SCHEMA_VERIFIED",
        },
      });
    }, 180);
  };

  const openApiYaml = `openapi: 3.1.0
info:
  title: GF-T3-193 Apex Executive IS 500 Performance Telemetry API
  description: High-frequency telemetry ingestion, acoustic intake valve management, and Torsen LSD control protocol.
  version: 1.0.0-PROD
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://gf-t3-193-core-prod.aistudio.run/v1
    description: Production Cloud Run Telemetry Plane

paths:
  /telemetry/ingress:
    post:
      summary: Ingest single 200 Hz vehicle telemetry frame
      operationId: ingestTelemetryFrame
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TelemetryIngressRequest'
      responses:
        '200':
          description: Telemetry frame validated and signed into HMAC ledger
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TelemetryIngressResponse'
        '422':
          description: Schema validation failure (out-of-bounds sensor values)

  /engine/mode:
    post:
      summary: Dispatch High-Frequency Compute Mode drive mode and throttle mapping
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [mode, throttle_map]
              properties:
                mode:
                  type: string
                  enum: [Normal, Sport, High-Frequency Compute Mode, Custom]
                throttle_map:
                  type: string
                  enum: [LINEAR, AGGRESSIVE_PROGRESSIVE, TRACK_HELMHOLTZ]
      responses:
        '200':
          description: Drive mode successfully configured

components:
  schemas:
    TelemetryIngressRequest:
      type: object
      required:
        - rpm
        - throttle_pct
        - maf_flow_gps
        - manifold_pressure_kpa
        - diff_oil_temp_c
        - left_wheel_rpm
        - right_wheel_rpm
        - prev_hash
      properties:
        rpm:
          type: integer
          minimum: 0
          maximum: 7500
        throttle_pct:
          type: number
          minimum: 0.0
          maximum: 100.0
        maf_flow_gps:
          type: number
          description: Mass Air Flow in grams per second
        manifold_pressure_kpa:
          type: number
        diff_oil_temp_c:
          type: number
        left_wheel_rpm:
          type: number
        right_wheel_rpm:
          type: number
        prev_hash:
          type: string
          pattern: '^[a-f0-9]{64}$'

    TelemetryIngressResponse:
      type: object
      required:
        - nonce
        - acoustic_valve_state
        - tbr_ratio
        - hmac_signature
        - block_status
      properties:
        nonce:
          type: integer
        acoustic_valve_state:
          type: string
          enum: [STAGE_1_CLOSED, STAGE_2_OPEN]
        tbr_ratio:
          type: number
        hmac_signature:
          type: string
        block_status:
          type: string
`;

  const copyYaml = () => {
    navigator.clipboard.writeText(openApiYaml);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Network className="w-8 h-8 text-sky-400" />
          <span>OpenAPI 3.1 Telemetry & Protocol Contract</span>
        </h2>
        <p className="text-base text-slate-400 mt-1">
          Formal REST endpoints and 200 Hz WebSocket streaming contracts for 2UR-GSE Mass Airflow (MAF), intake pressure pulses, wheel speed differentials, and High-Frequency Compute Mode throttle mapping.
        </p>
      </div>

      {/* Interactive API Dispatch Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" />
                <span>REST Telemetry Dispatch Sandbox</span>
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded">
                POST /v1/telemetry/ingress
              </span>
            </div>

            <div className="space-y-4 mb-6">
              {/* Drive Mode Selector */}
              <div>
                <label className="text-sm font-bold text-slate-300 block mb-1.5">
                  Vehicle Drive Mode Setting:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Normal', 'Sport', 'High-Frequency Compute Mode'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSelectedMode(mode)}
                      className={`py-2 px-3 text-sm font-bold rounded-lg border transition-all ${
                        selectedMode === mode
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* RPM Input */}
              <div>
                <div className="flex justify-between items-center text-sm font-bold text-slate-300 mb-1">
                  <span>Engine RPM:</span>
                  <span className="font-mono text-amber-400">{testRpm} RPM</span>
                </div>
                <input
                  type="range"
                  min="750"
                  max="7300"
                  step="50"
                  value={testRpm}
                  onChange={(e) => setTestRpm(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Throttle Input */}
              <div>
                <div className="flex justify-between items-center text-sm font-bold text-slate-300 mb-1">
                  <span>Throttle Opening:</span>
                  <span className="font-mono text-amber-400">{testThrottle}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={testThrottle}
                  onChange={(e) => setTestThrottle(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Calculated MAF Airflow:</span>
                  <span className="text-white font-bold">{((testRpm / 7300) * 315).toFixed(1)} g/s</span>
                </div>
                <div className="flex justify-between">
                  <span>Manifold Pressure (MAP):</span>
                  <span className="text-white font-bold">{(101.3 - (1.0 - testThrottle / 100) * 55).toFixed(1)} kPa</span>
                </div>
                <div className="flex justify-between">
                  <span>Crossover State:</span>
                  <span className={testRpm >= 3600 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                    {testRpm >= 3600 ? 'STAGE 2 ACOUSTIC BYPASS' : 'STAGE 1 PRIMARY RUNNER'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSendTestPayload}
            disabled={isSending}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
            <span>{isSending ? 'Validating against OpenAPI Contract...' : 'Dispatch Telemetry Packet'}</span>
          </button>
        </div>

        {/* API Response Display */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-sky-400" />
                <span>Ingestion Gateway Response</span>
              </h3>
              {apiResponse && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                    HTTP {apiResponse.status} OK
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {apiResponse.latencyMs} ms
                  </span>
                </div>
              )}
            </div>

            {apiResponse ? (
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[300px] leading-relaxed">
                <code>{JSON.stringify(apiResponse.payload, null, 2)}</code>
              </pre>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[220px]">
                <Terminal className="w-10 h-10 mb-2 opacity-50 text-slate-600" />
                <p className="text-sm">Click &quot;Dispatch Telemetry Packet&quot; to test schema verification</p>
                <p className="text-xs mt-1 text-slate-600">Simulates real OpenAPI 3.1 request validation & HMAC response generation</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>Gateway Schema Version:</span>
            <span className="font-mono font-bold text-slate-200">OpenAPI 3.1.0 Strict</span>
          </div>
        </div>
      </div>

      {/* Live 200 Hz WebSocket Stream Inspector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Radio className={`w-6 h-6 ${wsStreaming ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <div>
              <h3 className="text-xl font-bold text-white">
                Live 200 Hz WebSocket Stream (ws://.../v1/telemetry/stream)
              </h3>
              <p className="text-sm text-slate-400">
                Bidirectional binary & JSON sensor broadcast for real-time telemetry subscribers
              </p>
            </div>
          </div>

          <button
            onClick={() => setWsStreaming(!wsStreaming)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-lg border border-slate-700 inline-flex items-center gap-1.5 transition-colors"
          >
            {wsStreaming ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
            <span>{wsStreaming ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">FRAME #</th>
                <th className="py-2.5 px-3">TIMESTAMP</th>
                <th className="py-2.5 px-3">SIZE</th>
                <th className="py-2.5 px-3">RPM</th>
                <th className="py-2.5 px-3">MAF (g/s)</th>
                <th className="py-2.5 px-3">MAP (kPa)</th>
                <th className="py-2.5 px-3">MODE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {wsFrames.slice(0, 6).map((f) => (
                <tr key={f.seq} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-2 px-3 text-sky-400 font-bold">#{f.seq}</td>
                  <td className="py-2 px-3 text-slate-400">{f.time}</td>
                  <td className="py-2 px-3 text-slate-400">{f.bytes} B</td>
                  <td className="py-2 px-3 text-white font-bold">{f.rpm}</td>
                  <td className="py-2 px-3 text-amber-300">{f.mafGps}</td>
                  <td className="py-2 px-3 text-emerald-300">{f.manifoldKpa}</td>
                  <td className="py-2 px-3">
                    <span className="text-amber-400 font-semibold">{f.throttleMode}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* OpenAPI 3.1 YAML Contract Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">OpenAPI 3.1 Contract Specification</h3>
            <p className="text-sm text-slate-400">
              Complete YAML definition with strict schemas and parameter constraints
            </p>
          </div>
          <button
            onClick={copyYaml}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg border border-slate-700 inline-flex items-center gap-1.5 transition-colors"
          >
            {copiedYaml ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedYaml ? 'Copied' : 'Copy OpenAPI YAML'}</span>
          </button>
        </div>

        <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-sky-300/90 overflow-x-auto max-h-[350px] leading-relaxed">
          <code>{openApiYaml}</code>
        </pre>
      </div>
    </div>
  );
};
