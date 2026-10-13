import React, { useState, useEffect } from 'react';
import { Network, Play, Pause, Copy, Check, Send, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { TelemetryPacket } from '../../types/telemetry';

interface TabOpenApiContractProps {
  currentTelemetry: TelemetryPacket;
}

export const TabOpenApiContract: React.FC<TabOpenApiContractProps> = ({ currentTelemetry }) => {
  const [activeSubTab, setActiveSubTab] = useState<'ENDPOINTS' | 'WS_STREAM' | 'OPENAPI_YAML'>('ENDPOINTS');
  const [isStreamingWs, setIsStreamingWs] = useState(true);
  const [streamLog, setStreamLog] = useState<string[]>([]);
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [testApiResult, setTestApiResult] = useState<string | null>(null);

  // Live WebSocket stream simulator
  useEffect(() => {
    if (!isStreamingWs) return;

    const interval = setInterval(() => {
      const payload = {
        ws_event: 'TELEMETRY_SAMPLE',
        nonce: currentTelemetry.nonce + Math.floor(Math.random() * 5),
        speed_kmh: (currentTelemetry.speedKmh + (Math.random() * 1.2 - 0.6)).toFixed(1),
        decel_g: currentTelemetry.decelerationG.toFixed(2),
        pitch_angle_deg: currentTelemetry.pitchAngleDeg.toFixed(2),
        rear_bias_pct: currentTelemetry.rearBiasPercent,
        cabin_spl_dba: (currentTelemetry.cabinSplDb + (Math.random() * 0.4 - 0.2)).toFixed(1),
        partition_opacity: `${currentTelemetry.partitionOpacityPercent}%`,
        hmac: currentTelemetry.hmacSignature.slice(0, 16) + '...',
      };

      setStreamLog(prev => [JSON.stringify(payload), ...prev.slice(0, 14)]);
    }, 1200);

    return () => clearInterval(interval);
  }, [isStreamingWs, currentTelemetry]);

  const openApiYaml = `openapi: 3.1.0
info:
  title: GF-T3-191 Executive Luxury Mover Core API
  version: 1.0.0-PROD
  description: >
    Production REST and WebSocket telemetry contracts for the Lexus LM 500h Executive Core.
    Arbitrates rear-biased hydraulic pitch control and 48-inch acoustic partition state.
servers:
  - url: https://gf-t3-191-core-434044503951.us-east1.run.app
    description: Google Cloud Run Production Microservice
paths:
  /api/v1/telemetry/pitch-loop:
    post:
      summary: Ingest 2,500 Hz Longitudinal G and Wheel Cylinder Telemetry
      operationId: ingestPitchTelemetry
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PitchLoopTelemetryPacket'
      responses:
        '200':
          description: Telemetry verified and committed to PostgreSQL 16 hypertable
          content:
            application/json:
              schema:
                type: object
                properties:
                  status: { type: string, example: "COMMITTED" }
                  nonce: { type: integer, example: 1000005 }
                  rear_bias_ratio: { type: number, example: 0.58 }
                  quarantined: { type: boolean, example: false }

  /api/v1/telemetry/acoustic-isolation:
    get:
      summary: Poll 48-Inch Partition Transmission Loss and Cabin Decibel Feedback
      operationId: getAcousticState
      responses:
        '200':
          description: Real-time sound transmission loss and electrochromic glass state
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AcousticPartitionState'

  /api/v1/ledger/records:
    get:
      summary: Query Tamper-Proof HMAC-SHA256 Chained Telemetry Records
      parameters:
        - name: limit
          in: query
          schema: { type: integer, default: 50 }
      responses:
        '200':
          description: List of verified blocks with cryptographic proofs

components:
  schemas:
    PitchLoopTelemetryPacket:
      type: object
      required:
        - nonce
        - longitudinal_g
        - wheel_pressures_bar
        - hmac_signature
      properties:
        nonce:
          type: integer
          example: 1000001
        speed_kmh:
          type: number
          example: 62.5
        longitudinal_g:
          type: number
          example: 0.45
        pitch_angle_deg:
          type: number
          example: -0.28
        wheel_pressures_bar:
          type: object
          properties:
            front_left: { type: number, example: 52.4 }
            front_right: { type: number, example: 52.4 }
            rear_left: { type: number, example: 78.1 }
            rear_right: { type: number, example: 78.1 }
        hmac_signature:
          type: string
          example: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

    AcousticPartitionState:
      type: object
      properties:
        transmission_loss_db:
          type: number
          example: -28.6
        partition_dimming_opacity_pct:
          type: integer
          example: 85
        driver_cabin_spl_dba:
          type: number
          example: 64.8
        executive_lounge_spl_dba:
          type: number
          example: 32.4`;

  const copyYaml = () => {
    navigator.clipboard.writeText(openApiYaml);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  const handleTestApi = () => {
    setTestApiResult(JSON.stringify({
      status: "SUCCESS_200",
      acknowledged_at: new Date().toISOString(),
      service: "GF-T3-191-CORE",
      loop_frequency: "2500_HZ",
      arbitration: {
        deceleration_g: currentTelemetry.decelerationG,
        rear_bias_ratio: "58.2%",
        pitch_suppressed_deg: currentTelemetry.pitchAngleDeg,
        passenger_comfort_state: "EXECUTIVE_SMOOTH_STOP"
      },
      audit: {
        nonce: currentTelemetry.nonce,
        hmac_sha256: currentTelemetry.hmacSignature,
        quarantine: false
      }
    }, null, 2));
  };

  return (
    <div className="space-y-6">
      {/* Header and Subview Navigator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Network className="w-7 h-7 text-blue-400" />
            OpenAPI 3.1 & WebSocket Telemetry Contract
          </h2>
          <p className="text-slate-400 text-base mt-1">
            Complete API specifications for 2,500 Hz brake line pressure, longitudinal G, and rear cabin SPL.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveSubTab('ENDPOINTS')}
            className={`px-3 py-1.5 rounded-md text-base font-semibold transition-all cursor-pointer ${
              activeSubTab === 'ENDPOINTS'
                ? 'bg-blue-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            REST Endpoints
          </button>
          <button
            onClick={() => setActiveSubTab('WS_STREAM')}
            className={`px-3 py-1.5 rounded-md text-base font-semibold transition-all cursor-pointer ${
              activeSubTab === 'WS_STREAM'
                ? 'bg-blue-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            WebSocket Stream
          </button>
          <button
            onClick={() => setActiveSubTab('OPENAPI_YAML')}
            className={`px-3 py-1.5 rounded-md text-base font-semibold transition-all cursor-pointer ${
              activeSubTab === 'OPENAPI_YAML'
                ? 'bg-blue-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            OpenAPI 3.1 YAML
          </button>
        </div>
      </div>

      {activeSubTab === 'ENDPOINTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Endpoints List */}
          <div className="lg:col-span-6 space-y-4">
            {/* POST Ingestion */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    POST
                  </span>
                  <span className="font-mono text-base font-bold text-white">
                    /api/v1/telemetry/pitch-loop
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">2,500 Hz Ingest</span>
              </div>
              <p className="text-slate-400 text-sm mb-3">
                Ingests wheel pressure CAN bus packets and executes real-time rear-bias arbitration.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-sm">
                <span className="text-slate-500 font-mono">Rate: 0.40 ms loop</span>
                <button
                  onClick={handleTestApi}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Test Request
                </button>
              </div>
            </div>

            {/* GET Acoustic Isolation */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    GET
                  </span>
                  <span className="font-mono text-base font-bold text-white">
                    /api/v1/telemetry/acoustic-isolation
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">Sensors</span>
              </div>
              <p className="text-slate-400 text-sm mb-3">
                Polls the 48-inch electrochromic partition transmission loss (-28.6 dB) and cabin SPL.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-sm font-mono text-slate-400">
                <span>Output: Sound Loss & Opacity %</span>
                <span className="text-emerald-400">200 OK</span>
              </div>
            </div>

            {/* GET Ledger */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    GET
                  </span>
                  <span className="font-mono text-base font-bold text-white">
                    /api/v1/ledger/records
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">Audit Vault</span>
              </div>
              <p className="text-slate-400 text-sm mb-3">
                Retrieves cryptographically chained HMAC-SHA256 blocks from PostgreSQL 16.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-sm font-mono text-slate-400">
                <span>Zero-Tamper Verification</span>
                <span className="text-purple-400">Cryptographic Proofs</span>
              </div>
            </div>
          </div>

          {/* Live Request / Response Viewer */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-white text-base font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  API Response Inspector
                </span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  HTTP 200 OK
                </span>
              </div>

              <pre className="p-4 bg-slate-950 rounded-lg text-emerald-400 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto border border-slate-800/80 min-h-[300px]">
                {testApiResult || JSON.stringify({
                  status: "READY",
                  message: "Click 'Test Request' on any endpoint to execute a mock client call with live telemetry parameters.",
                  active_chassis: "Lexus LM 500h Executive Mover",
                  pitch_suppression: "ACTIVE (-0.28 deg)",
                  acoustic_barrier: "-28.6 dB transmission loss"
                }, null, 2)}
              </pre>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-500 font-mono flex justify-between items-center">
              <span>Standard: OpenAPI 3.1.0 Strict JSON Schema</span>
              <span>TLS 1.3 Strict HTTPS</span>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'WS_STREAM' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
            <div>
              <span className="text-white text-base font-bold flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isStreamingWs ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                wss://gf-t3-191-core.run.app/ws/v1/telemetry/live
              </span>
              <p className="text-slate-400 text-sm mt-0.5">
                Streaming WebSocket channel for high-frequency client telemetry subscription.
              </p>
            </div>

            <button
              onClick={() => setIsStreamingWs(!isStreamingWs)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                isStreamingWs
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {isStreamingWs ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Stream</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Resume Stream</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs sm:text-sm text-slate-300 space-y-2 max-h-[460px] overflow-y-auto border border-slate-800/80">
            {streamLog.map((log, index) => (
              <div key={index} className="flex items-start gap-2 p-1.5 rounded hover:bg-slate-900 transition-colors">
                <span className="text-blue-400 select-none shrink-0">[WS_IN]</span>
                <span className="text-emerald-300 break-all">{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'OPENAPI_YAML' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
              <span className="text-white text-base font-bold font-mono">
                docs/openapi_3_1_telemetry_spec.yaml
              </span>
              <p className="text-slate-400 text-sm mt-0.5">
                Full schema definitions, parameters, and contract declarations.
              </p>
            </div>
            <button
              onClick={copyYaml}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-base font-mono font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedYaml ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy YAML</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 bg-slate-950 rounded-lg text-slate-200 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto border border-slate-800/80 max-h-[500px]">
            {openApiYaml}
          </pre>
        </div>
      )}
    </div>
  );
};
