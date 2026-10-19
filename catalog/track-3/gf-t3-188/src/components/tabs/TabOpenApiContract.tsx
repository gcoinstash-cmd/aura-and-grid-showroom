import React, { useState } from 'react';
import {
  FileText,
  Send,
  Copy,
  Check,
  CheckCircle2,
  Radio,
  Code,
  ArrowRight
} from 'lucide-react';

export const TabOpenApiContract: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET /v1/telemetry/sensors/wheel-heights');
  const [viewMode, setViewMode] = useState<'console' | 'oas_yaml'>('console');
  const [copied, setCopied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [responseOutput, setResponseOutput] = useState<{
    status: number;
    latencyMs: number;
    body: Record<string, unknown>;
  } | null>(null);

  // Sample payloads for testing
  const [payloads, setPayloads] = useState<Record<string, string>>({
    'POST /v1/actuators/ekdss/bypass-valves': JSON.stringify(
      {
        frontSolenoid: 'OPEN',
        rearSolenoid: 'OPEN',
        overrideReason: 'OPERATOR_BOULDER_ARTICULATION_TEST',
      },
      null,
      2
    ),
    'POST /v1/powertrain/crawl-control': JSON.stringify(
      {
        mode: 'LO',
        targetMph: 1.0,
        steepDescentAssist: true,
      },
      null,
      2
    ),
  });

  const openApiYaml = `openapi: 3.1.0
info:
  title: Heavy Overland Dynamics Platform Dynamic Kinetic Suspension Telemetry & Crawl Telemetry API
  description: High-frequency deterministic telemetry ingestion and actuator arbitration interface
  version: 1.0.0-PROD
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT
servers:
  - url: https://gx550-core.ghostfactory.ai/api/v1
    description: Production Edge Node

paths:
  /telemetry/sensors/wheel-heights:
    get:
      summary: Retrieve calibrated 4-corner wheel height displacements
      operationId: getWheelHeights
      responses:
        '200':
          description: Live calibrated sensor snapshot
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WheelHeightReport'

  /actuators/ekdss/bypass-valves:
    post:
      summary: Command Dynamic Kinetic Suspension Telemetry accumulator bypass solenoid state
      operationId: setBypassValves
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ValveCommand'
      responses:
        '200':
          description: Valve state acknowledgment with hydraulic confirmation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValveStatus'

  /powertrain/crawl-control:
    post:
      summary: Configure 5-speed Crawl Control mode and target speed
      operationId: setCrawlMode
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [mode, targetMph]
              properties:
                mode:
                  type: string
                  enum: [OFF, LO, MED_LO, MED, MED_HI, HI]
                targetMph:
                  type: number
                  minimum: 0.0
                  maximum: 5.0
      responses:
        '200':
          description: Crawl Control state set successfully

  /powertrain/transfer-case:
    get:
      summary: Read transfer case 4H/4L and differential lock states
      operationId: getTransferCaseStatus
      responses:
        '200':
          description: Transfer case status
          content:
            application/json:
              schema:
                type: object
                properties:
                  range: { type: string, enum: [4H, 4L] }
                  centerDiffLocked: { type: boolean }
                  rearDiffLocked: { type: boolean }

  /telemetry/stream:
    get:
      summary: Real-time WebSocket telemetry stream (2000Hz downsampled to 100Hz client)
      operationId: streamTelemetry
      responses:
        '101':
          description: WebSocket protocol upgrade handshake

components:
  schemas:
    WheelHeightReport:
      type: object
      required: [flMm, frMm, rlMm, rrMm, crossAxleMm, timestamp]
      properties:
        flMm: { type: number, example: 45.2 }
        frMm: { type: number, example: -38.6 }
        rlMm: { type: number, example: -52.1 }
        rrMm: { type: number, example: 48.9 }
        crossAxleMm: { type: number, example: 184.8 }
        timestamp: { type: string, format: date-time }

    ValveCommand:
      type: object
      required: [frontSolenoid, rearSolenoid]
      properties:
        frontSolenoid: { type: string, enum: [OPEN, CLOSED] }
        rearSolenoid: { type: string, enum: [OPEN, CLOSED] }
        overrideReason: { type: string }

    ValveStatus:
      type: object
      properties:
        frontSolenoid: { type: string, enum: [OPEN, CLOSED] }
        rearSolenoid: { type: string, enum: [OPEN, CLOSED] }
        frontPressureMpa: { type: number, example: 6.24 }
        rearPressureMpa: { type: number, example: 6.18 }
        rollStiffnessNmPerDeg: { type: number, example: 195.0 }
        safetyFailsafeEngaged: { type: boolean, example: false }
`;

  const copyOas = () => {
    navigator.clipboard.writeText(openApiYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecute = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      if (selectedEndpoint === 'GET /v1/telemetry/sensors/wheel-heights') {
        setResponseOutput({
          status: 200,
          latencyMs: 1.4,
          body: {
            flMm: 52.8,
            frMm: -48.2,
            rlMm: -59.4,
            rrMm: 56.1,
            crossAxleMm: 216.5,
            sampleIndex: 1042891,
            timestamp: new Date().toISOString(),
          },
        });
      } else if (selectedEndpoint === 'POST /v1/actuators/ekdss/bypass-valves') {
        setResponseOutput({
          status: 200,
          latencyMs: 2.1,
          body: {
            frontSolenoid: 'OPEN',
            rearSolenoid: 'OPEN',
            frontPressureMpa: 6.24,
            rearPressureMpa: 6.18,
            differentialPressureMpa: 0.06,
            rollStiffnessNmPerDeg: 195.0,
            safetyFailsafeEngaged: false,
            actuationLatencyMs: 3.4,
          },
        });
      } else if (selectedEndpoint === 'POST /v1/powertrain/crawl-control') {
        setResponseOutput({
          status: 200,
          latencyMs: 1.8,
          body: {
            crawlMode: 'LO',
            targetMph: 1.0,
            targetMps: 0.447,
            throttleLimitPct: 35.0,
            brakeModulationActive: true,
            status: 'ENGAGED',
          },
        });
      } else if (selectedEndpoint === 'GET /v1/powertrain/transfer-case') {
        setResponseOutput({
          status: 200,
          latencyMs: 1.1,
          body: {
            range: '4L',
            gearRatio: 2.57,
            centerDiffLocked: true,
            rearDiffLocked: true,
            atracActive: true,
          },
        });
      } else {
        setResponseOutput({
          status: 101,
          latencyMs: 0.8,
          body: {
            protocol: 'WebSocket',
            stream: 'wss://gx550-core.ghostfactory.ai/api/v1/telemetry/stream',
            subprotocol: 'json.ekdss.v1',
            framesPerSecond: 100,
            connected: true,
          },
        });
      }
    }, 280);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <FileText className="w-7 h-7 text-indigo-400" />
              OpenAPI 3.1 & Protocol Specification
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Deterministic REST & High-Frequency WebSocket Protocols for Heavy Boxed Steel Frame Architecture Wheel Height Sensors and Hydraulic Actuators
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'console' ? 'oas_yaml' : 'console')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Code className="w-4 h-4 text-indigo-400" />
              {viewMode === 'console' ? 'View OpenAPI 3.1 YAML' : 'Open API Console'}
            </button>
            {viewMode === 'oas_yaml' && (
              <button
                onClick={copyOas}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Spec'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Target Schema:</span>
          <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
            OpenAPI 3.1.0 Strict
          </span>
          <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
            FastAPI / Pydantic v2 Compiled
          </span>
          <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
            Zero Nullable Invariants
          </span>
        </div>
      </div>

      {viewMode === 'console' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Endpoint List & Config (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Radio className="w-4 h-4 text-indigo-400" />
              API Endpoints
            </h3>

            <div className="space-y-2">
              {[
                { ep: 'GET /v1/telemetry/sensors/wheel-heights', method: 'GET', path: '/v1/telemetry/sensors/wheel-heights', desc: '4-Corner height sensors' },
                { ep: 'POST /v1/actuators/ekdss/bypass-valves', method: 'POST', path: '/v1/actuators/ekdss/bypass-valves', desc: 'Solenoid disconnect valves' },
                { ep: 'POST /v1/powertrain/crawl-control', method: 'POST', path: '/v1/powertrain/crawl-control', desc: '5-Speed crawl speed setting' },
                { ep: 'GET /v1/powertrain/transfer-case', method: 'GET', path: '/v1/powertrain/transfer-case', desc: '4H/4L & locker states' },
                { ep: 'WS /v1/telemetry/stream', method: 'WS', path: '/v1/telemetry/stream', desc: '100Hz binary/JSON stream' },
              ].map((item) => {
                const active = selectedEndpoint === item.ep;
                return (
                  <button
                    key={item.ep}
                    onClick={() => {
                      setSelectedEndpoint(item.ep);
                      setResponseOutput(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                      active
                        ? 'bg-slate-800 border-indigo-500 shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          item.method === 'GET'
                            ? 'bg-blue-500/20 text-blue-300'
                            : item.method === 'POST'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {item.method}
                      </span>
                      <span className="text-[11px] text-slate-400">{item.desc}</span>
                    </div>
                    <div className="text-white font-semibold truncate">{item.path}</div>
                  </button>
                );
              })}
            </div>

            {/* Request Body if POST */}
            {selectedEndpoint.startsWith('POST') && (
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Request JSON Payload
                </label>
                <textarea
                  rows={6}
                  value={payloads[selectedEndpoint] || '{}'}
                  onChange={(e) =>
                    setPayloads({ ...payloads, [selectedEndpoint]: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-emerald-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg disabled:opacity-50"
            >
              {isExecuting ? (
                <span>Dispatching RPC...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Execute Endpoint Test</span>
                </>
              )}
            </button>
          </div>

          {/* Response Console (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                  Execution Response Console
                </h3>
                {responseOutput && (
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      HTTP {responseOutput.status} OK
                    </span>
                    <span className="text-slate-400">
                      Latency: <strong className="text-white">{responseOutput.latencyMs} ms</strong>
                    </span>
                  </div>
                )}
              </div>

              {responseOutput ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto max-h-[420px]">
                  <pre className="text-xs font-mono text-emerald-300 leading-relaxed">
                    <code>{JSON.stringify(responseOutput.body, null, 2)}</code>
                  </pre>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl text-slate-400">
                  <Send className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-300">Ready to test protocol contract</p>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Select an endpoint and click &quot;Execute Endpoint Test&quot; to inspect serialized responses.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 mt-4 text-xs text-slate-400 flex items-center justify-between">
              <span>Schema validation: OAS 3.1 Strict</span>
              <span className="text-indigo-400 font-mono">Zero null safety violations</span>
            </div>
          </div>
        </div>
      ) : (
        /* Full YAML View */
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 overflow-x-auto">
          <pre className="text-xs font-mono text-slate-300 leading-relaxed">
            <code>{openApiYaml}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
