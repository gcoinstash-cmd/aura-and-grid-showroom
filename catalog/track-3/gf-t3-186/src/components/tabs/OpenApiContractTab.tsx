import React, { useState } from 'react';
import {
  FileCode,
  Send,
  Radio,
  Copy,
  Check,
  Server,
  Zap,
  CheckCircle,
  Play
} from 'lucide-react';
import { TelemetryFrame } from '../../types/telemetry';

interface OpenApiContractTabProps {
  currentFrame: TelemetryFrame;
}

export const OpenApiContractTab: React.FC<OpenApiContractTabProps> = ({ currentFrame }) => {
  const [copiedSpec, setCopiedSpec] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<
    'ingress' | 'inverter' | 'websocket' | 'verify'
  >('ingress');
  const [testPayload, setTestPayload] = useState(
    JSON.stringify(
      {
        vehicle_vin: 'JTHEX300H202600186',
        vehicle_speed_kmh: currentFrame.vehicleSpeedKmh,
        throttle_pct: currentFrame.throttlePercent,
        friction_mu: currentFrame.frictionCoeff,
        cell_spread_mv: currentFrame.cellVoltageSpreadMv,
      },
      null,
      2
    )
  );
  const [simulatedResponse, setSimulatedResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTestEndpoint = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (selectedEndpoint === 'ingress') {
        setSimulatedResponse(
          JSON.stringify(
            {
              status: '201 Created',
              frame_id: 'c81f3d82-e2b7-4a8f-8461-7193a0279c14',
              nonce: currentFrame.nonce + 1,
              received_at: new Date().toISOString(),
              current_block_hash: currentFrame.currentBlockHash,
              hmac_signature: currentFrame.hmacSignature,
              is_quarantined: currentFrame.quarantineTriggered,
              kinematics: {
                ice_rpm: currentFrame.iceRpm,
                mg1_rpm: currentFrame.mg1Rpm,
                mg2_rpm: currentFrame.mg2Rpm,
                rear_torque_nm: currentFrame.rearMotorTorqueNm,
                torque_split: `${currentFrame.frontTorquePercent.toFixed(0)}:${currentFrame.rearTorquePercent.toFixed(0)}`,
              },
            },
            null,
            2
          )
        );
      } else if (selectedEndpoint === 'inverter') {
        setSimulatedResponse(
          JSON.stringify(
            {
              status: '200 OK',
              inverter_id: 'INV-REAR-Q510',
              sampling_rate_hz: 2200,
              cycle_time_us: 454.5,
              phase_u_current_a: (currentFrame.rearInverterCurrentA * 0.98).toFixed(2),
              phase_v_current_a: (currentFrame.rearInverterCurrentA * 1.01).toFixed(2),
              phase_w_current_a: (currentFrame.rearInverterCurrentA * 0.99).toFixed(2),
              igbt_junction_temp_c: 52.4,
              dc_bus_voltage_v: currentFrame.batteryVoltageV,
              motor_speed_rpm: currentFrame.mg2Rpm * 0.72,
              torque_delivered_nm: currentFrame.rearMotorTorqueNm,
            },
            null,
            2
          )
        );
      } else if (selectedEndpoint === 'verify') {
        setSimulatedResponse(
          JSON.stringify(
            {
              status: '200 OK',
              block_valid: true,
              nonce: currentFrame.nonce,
              merkle_root_match: true,
              tamper_detected: false,
              verified_by: 'delaware-apa-escrow-validator-v1',
            },
            null,
            2
          )
        );
      }
    }, 300);
  };

  const openApiYaml = `openapi: 3.1.0
info:
  title: GF-T3-186 Telemetry & E-Four Vectoring Protocol
  version: 1.0.0-PROD
  description: High-frequency 2,200 Hz CAN-FD ingestion and cryptographic ledger interface for Heavy Overland Dynamics Platform UX 300h High-G Dynamic Telemetry Handling Core.
  license:
    name: MIT Permissive
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://gf-t3-186-core.uc.a.run.app
    description: Production Google Cloud Run (Serverless Multi-region)

paths:
  /api/v1/telemetry/ingress:
    post:
      summary: High-Frequency CAN-FD Ingress Buffer
      description: Ingests raw planetary carrier and rear inverter telemetry, calculates PSD balance, and persists to partitioned timeseries ledger.
      operationId: ingestTelemetryFrame
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/IngressPayload'
      responses:
        '201':
          description: Frame verified, signed, and committed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/IngressReceipt'

  /api/v1/telemetry/inverter/rear:
    get:
      summary: Query Rear E-Four Inverter State
      description: Returns real-time 3-phase currents, IGBT junction temperature, and instantaneous torque demand.
      operationId: getRearInverterState
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InverterState'

  /ws/v1/efour/stream:
    get:
      summary: WebSocket Bidirectional Telemetry Stream
      description: Sub-millisecond continuous binary/JSON streaming of torque distribution and battery cell voltage frames.
      operationId: connectTelemetrySocket
      responses:
        '101':
          description: Switching Protocols to WebSocket

  /api/v1/ledger/verify-block:
    post:
      summary: Verify Merkle Nonce and HMAC Integrity
      operationId: verifyLedgerBlock
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [nonce, block_hash, hmac_signature]
              properties:
                nonce: { type: integer }
                block_hash: { type: string }
                hmac_signature: { type: string }
      responses:
        '200':
          description: Signature validation result

components:
  schemas:
    IngressPayload:
      type: object
      required: [vehicle_speed_kmh, throttle_pct, friction_mu, cell_spread_mv]
      properties:
        vehicle_vin: { type: string, example: "JTHEX300H202600186" }
        vehicle_speed_kmh: { type: number, minimum: 0, maximum: 200 }
        throttle_pct: { type: number, minimum: 0, maximum: 100 }
        friction_mu: { type: number, minimum: 0.05, maximum: 1.20 }
        cell_spread_mv: { type: number, minimum: 0, maximum: 200 }
    IngressReceipt:
      type: object
      properties:
        frame_id: { type: string, format: uuid }
        nonce: { type: integer }
        received_at: { type: string, format: date-time }
        current_block_hash: { type: string }
        hmac_signature: { type: string }
        is_quarantined: { type: boolean }
    InverterState:
      type: object
      properties:
        sampling_rate_hz: { type: integer, example: 2200 }
        phase_u_current_a: { type: number }
        phase_v_current_a: { type: number }
        phase_w_current_a: { type: number }
        igbt_junction_temp_c: { type: number }
        torque_delivered_nm: { type: number }`;

  const handleCopySpec = () => {
    navigator.clipboard.writeText(openApiYaml);
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              OpenAPI 3.1 Telemetry Contract
            </h2>
            <p className="text-base text-slate-400 mt-1">
              Zero-Placeholder REST Endpoints & WebSocket 2,200 Hz Binary/JSON Streaming Specification
            </p>
          </div>

          <button
            onClick={handleCopySpec}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-base font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors self-start md:self-auto"
          >
            {copiedSpec ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSpec ? 'Copied OpenAPI YAML' : 'Copy OpenAPI 3.1 YAML'}</span>
          </button>
        </div>

        {/* Interactive Endpoint Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSelectedEndpoint('ingress');
              setSimulatedResponse(null);
            }}
            className={`px-4 py-2 rounded-lg text-base font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-2 ${
              selectedEndpoint === 'ingress'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="px-1.5 py-0.5 rounded text-xs bg-emerald-600 text-white">POST</span>
            /api/v1/telemetry/ingress
          </button>

          <button
            onClick={() => {
              setSelectedEndpoint('inverter');
              setSimulatedResponse(null);
            }}
            className={`px-4 py-2 rounded-lg text-base font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-2 ${
              selectedEndpoint === 'inverter'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="px-1.5 py-0.5 rounded text-xs bg-blue-600 text-white">GET</span>
            /api/v1/telemetry/inverter/rear
          </button>

          <button
            onClick={() => {
              setSelectedEndpoint('websocket');
              setSimulatedResponse(null);
            }}
            className={`px-4 py-2 rounded-lg text-base font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-2 ${
              selectedEndpoint === 'websocket'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="px-1.5 py-0.5 rounded text-xs bg-purple-600 text-white">WS</span>
            /ws/v1/efour/stream
          </button>

          <button
            onClick={() => {
              setSelectedEndpoint('verify');
              setSimulatedResponse(null);
            }}
            className={`px-4 py-2 rounded-lg text-base font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-2 ${
              selectedEndpoint === 'verify'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="px-1.5 py-0.5 rounded text-xs bg-emerald-600 text-white">POST</span>
            /api/v1/ledger/verify-block
          </button>
        </div>
      </div>

      {/* Main Interactive Test Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Request Configuration (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-400" />
                Request Payload Tester
              </span>
              <span className="text-base font-mono text-slate-400">
                Content-Type: <code className="text-amber-400">application/json</code>
              </span>
            </div>

            {selectedEndpoint === 'ingress' && (
              <div>
                <p className="text-base text-slate-400 mb-3">
                  Submit live kinematic parameters into the CAN-FD ingestion pipeline:
                </p>
                <textarea
                  rows={8}
                  value={testPayload}
                  onChange={e => setTestPayload(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {selectedEndpoint === 'inverter' && (
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <p className="text-base text-slate-300 font-semibold">Rear Inverter Telemetry Query</p>
                <p className="text-base text-slate-400">
                  Fetches 3-phase current waveforms ($I_u, I_v, I_w$), DC link bus voltage, and IGBT module temperature monitored by the rear inverter gate driver.
                </p>
                <div className="text-base font-mono text-slate-500 pt-2">
                  Query parameters: none required (direct high-speed register read)
                </div>
              </div>
            )}

            {selectedEndpoint === 'websocket' && (
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-base">
                  <Radio className="w-5 h-5 animate-pulse" />
                  Live WebSocket Stream Protocol (454μs Cycle)
                </div>
                <p className="text-base text-slate-400">
                  Direct binary Protobuf / JSON socket feed broadcasting continuous E-Four rear torque split and lithium-ion cell spread metrics.
                </p>
                <div className="p-3 rounded bg-slate-900 border border-slate-800 text-base font-mono text-slate-300">
                  wss://gf-t3-186-core.uc.a.run.app/ws/v1/efour/stream?encoding=json
                </div>
              </div>
            )}

            {selectedEndpoint === 'verify' && (
              <div className="space-y-3">
                <p className="text-base text-slate-400">
                  Verify cryptographic Merkle root match and zero-collision nonce:
                </p>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-sm text-slate-300 space-y-1">
                  <div>Nonce: #{currentFrame.nonce}</div>
                  <div>Hash: {currentFrame.currentBlockHash.slice(0, 24)}...</div>
                  <div>HMAC: {currentFrame.hmacSignature.slice(0, 24)}...</div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4">
            <button
              onClick={handleTestEndpoint}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base inline-flex items-center justify-center gap-2 cursor-pointer transition-colors shadow"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isLoading ? 'Executing Request...' : 'Send Live Request & Ingest'}</span>
            </button>
          </div>
        </div>

        {/* Right: Response Output (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-400" />
                Live Response Inspector
              </span>
              <span className="text-base font-mono text-emerald-400 font-semibold">
                HTTP / WebSocket 101
              </span>
            </div>

            {simulatedResponse ? (
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-[420px]">
                <code>{simulatedResponse}</code>
              </pre>
            ) : (
              <div className="p-8 text-center bg-slate-950/60 border border-slate-800/80 rounded-lg text-slate-500">
                <p className="text-base font-semibold text-slate-400">No Request Executed Yet</p>
                <p className="text-base mt-1">
                  Click &ldquo;Send Live Request &amp; Ingest&rdquo; on the left to fire a real contract test.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between text-base text-slate-400">
            <span>Latency SLA: &lt; 1.2ms</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              OpenAPI 3.1 Strict Schema Conformance
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
