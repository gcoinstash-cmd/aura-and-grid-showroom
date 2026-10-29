/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Send,
  Radio,
  Check,
  Copy,
  Code2,
  Terminal,
  Activity,
  Layers
} from 'lucide-react';

export const OpenApiContractTab: React.FC = () => {
  const [activeEndpoint, setActiveEndpoint] = useState<'INGRESS' | 'ACTUATOR_STATUS' | 'DUAL_VECTOR_TORQUE_SPLIT' | 'WS_STREAM'>('INGRESS');
  const [copiedContract, setCopiedContract] = useState(false);
  const [simulatingCall, setSimulatingCall] = useState(false);
  const [responsePayload, setResponsePayload] = useState<string | null>(null);

  const openApiYaml = `openapi: 3.1.0
info:
  title: Apex Executive Multi-Node High-Output Core High-G Dynamic Telemetry Dynamic Rear Steering & DUAL_VECTOR_TORQUE Service
  version: 1.0.0-PROD
  description: >
    High-frequency CAN-bus translation, Dynamic Rear Steering (DRS) actuator commands,
    and DUAL_VECTOR_TORQUE torque vectoring telemetry engine for GF-T3-197.
servers:
  - url: https://gf-t3-197-telemetry-engine-a1b2c3.run.app
    description: Production Google Cloud Run Gateway (VPC-Secured)

paths:
  /api/v1/telemetry/drs/ingress:
    post:
      summary: Ingest Raw Steering & Speed Telemetry (2,500 Hz Ingress)
      operationId: ingestDrsTelemetry
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DrsIngressPayload'
      responses:
        '200':
          description: Dynamic Rear Steering Angle Calculated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DrsActuatorResponse'

  /api/v1/telemetry/drs/actuator/status:
    get:
      summary: Query Physical DRS Toe Actuator Health & Thermal Metrics
      operationId: getActuatorStatus
      responses:
        '200':
          description: Actuator Telemetry
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ActuatorStatus'

  /api/v1/telemetry/dual_vector_torque/torque-split:
    post:
      summary: Request DUAL_VECTOR_TORQUE Front/Rear eAxle Power Distribution
      operationId: calculateTorqueSplit
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TorqueSplitRequest'
      responses:
        '200':
          description: Torque Split Command
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TorqueSplitResponse'

components:
  schemas:
    DrsIngressPayload:
      type: object
      required:
        - nonce
        - vehicle_speed_mps
        - steering_wheel_angle_deg
        - lateral_accel_g
      properties:
        nonce:
          type: integer
          example: 1048590
        vehicle_speed_mps:
          type: number
          format: float
          example: 22.35
        steering_wheel_angle_deg:
          type: number
          format: float
          example: 45.0
        lateral_accel_g:
          type: number
          format: float
          example: 0.35
        yaw_rate_deg_s:
          type: number
          format: float
          example: 8.2

    DrsActuatorResponse:
      type: object
      required:
        - target_rear_steer_deg
        - phase
        - dual_vector_torque_front_pct
        - dual_vector_torque_rear_pct
        - hmac_signature
      properties:
        target_rear_steer_deg:
          type: number
          format: float
          example: 2.14
        phase:
          type: string
          enum: [COUNTER_PHASE, IN_PHASE, NEUTRAL]
          example: IN_PHASE
        dual_vector_torque_front_pct:
          type: integer
          example: 50
        dual_vector_torque_rear_pct:
          type: integer
          example: 50
        hmac_signature:
          type: string
          example: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
`;

  const handleTestCall = () => {
    setSimulatingCall(true);
    setTimeout(() => {
      setSimulatingCall(false);
      if (activeEndpoint === 'INGRESS') {
        setResponsePayload(
          JSON.stringify(
            {
              status: 'OK',
              execution_time_ms: 0.38,
              nonce: 1048592,
              target_rear_steer_deg: -3.85,
              phase: 'COUNTER_PHASE',
              kinematic_gain: 0.88,
              turning_radius_m: 5.24,
              turning_radius_reduction_pct: 12.1,
              dual_vector_torque_front_pct: 75,
              dual_vector_torque_rear_pct: 25,
              hmac_signature: '7d8f99e3a012bcf4e98d8214fa762110c73298a44b91f1a2384a6b291c98110b',
              ledger_persisted: true,
            },
            null,
            2
          )
        );
      } else if (activeEndpoint === 'ACTUATOR_STATUS') {
        setResponsePayload(
          JSON.stringify(
            {
              actuator_id: 'DRS-ACT-0197-TX',
              hardware_rev: 'REV-B3-STEPPER',
              frequency_hz: 2500,
              current_angle_deg: 0.0,
              max_limit_deg: 4.0,
              min_limit_deg: -4.0,
              motor_temp_celsius: 42.6,
              voltage_v: 13.8,
              current_draw_a: 4.2,
              failsafe_interlock: 'ACTIVE_HEALTHY',
            },
            null,
            2
          )
        );
      } else if (activeEndpoint === 'DUAL_VECTOR_TORQUE_SPLIT') {
        setResponsePayload(
          JSON.stringify(
            {
              front_powertrain_kw: 145,
              rear_eaxle_kw: 120,
              torque_ratio: '50:50',
              slip_mitigation_engaged: false,
              yaw_damping_nm: 240,
            },
            null,
            2
          )
        );
      } else {
        setResponsePayload(
          JSON.stringify(
            {
              websocket_protocol: 'RFC-6455',
              channel: 'wss://gf-t3-197.run.app/ws/v1/kinematics/stream',
              framing: 'BINARY_PROTOBUF',
              client_subscriptions: 1,
              frame_rate_fps: 120,
              last_heartbeat_ms: 12,
            },
            null,
            2
          )
        );
      }
    }, 450);
  };

  const copyContract = () => {
    navigator.clipboard.writeText(openApiYaml);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-cyan-400" />
            OpenAPI 3.1 Telemetry Contract
          </h2>
          <p className="text-base text-slate-400 mt-1">
            Zero-friction REST & WebSocket contracts for Drive-by-Wire bus ingestion and DRS toe actuator commands.
          </p>
        </div>

        <button
          onClick={copyContract}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-base font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          {copiedContract ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied OpenAPI YAML</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Full OpenAPI 3.1</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoint Selector & Tester (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
            <span className="text-base font-bold text-white uppercase tracking-wider block mb-3">
              Production Endpoints & Channels
            </span>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setActiveEndpoint('INGRESS');
                  setResponsePayload(null);
                }}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  activeEndpoint === 'INGRESS'
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-base font-mono font-bold">
                      POST
                    </span>
                    <span className="text-base font-mono font-semibold text-white">
                      /api/v1/telemetry/drs/ingress
                    </span>
                  </div>
                  <p className="text-base text-slate-400 mt-1">
                    2,500 Hz high-frequency steering & speed ingress
                  </p>
                </div>
                <Send className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveEndpoint('ACTUATOR_STATUS');
                  setResponsePayload(null);
                }}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  activeEndpoint === 'ACTUATOR_STATUS'
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-base font-mono font-bold">
                      GET
                    </span>
                    <span className="text-base font-mono font-semibold text-white">
                      /api/v1/telemetry/drs/actuator/status
                    </span>
                  </div>
                  <p className="text-base text-slate-400 mt-1">
                    Direct servo angle, thermal reading, voltage telemetry
                  </p>
                </div>
                <Activity className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveEndpoint('DUAL_VECTOR_TORQUE_SPLIT');
                  setResponsePayload(null);
                }}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  activeEndpoint === 'DUAL_VECTOR_TORQUE_SPLIT'
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-base font-mono font-bold">
                      POST
                    </span>
                    <span className="text-base font-mono font-semibold text-white">
                      /api/v1/telemetry/dual_vector_torque/torque-split
                    </span>
                  </div>
                  <p className="text-base text-slate-400 mt-1">
                    Front hybrid & rear eAxle dynamic torque dispatch
                  </p>
                </div>
                <Layers className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveEndpoint('WS_STREAM');
                  setResponsePayload(null);
                }}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  activeEndpoint === 'WS_STREAM'
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-base font-mono font-bold">
                      WSS
                    </span>
                    <span className="text-base font-mono font-semibold text-white">
                      /ws/v1/kinematics/stream
                    </span>
                  </div>
                  <p className="text-base text-slate-400 mt-1">
                    Bidirectional Protobuf/Binary telemetry WebSocket
                  </p>
                </div>
                <Radio className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Test Trigger Button */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-base text-slate-400 font-mono">
                Latency SLA: &lt; 1.0 ms
              </span>
              <button
                type="button"
                onClick={handleTestCall}
                disabled={simulatingCall}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-base px-4 py-2.5 rounded-xl inline-flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
              >
                <Terminal className="w-4 h-4" />
                <span>{simulatingCall ? 'Executing Request...' : 'Send Test Request'}</span>
              </button>
            </div>
          </div>

          {/* Response Payload Inspector */}
          {responsePayload && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <span className="text-base font-bold text-emerald-400 font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  HTTP 200 OK — 0.38 ms response time
                </span>
                <span className="text-base text-slate-400 font-mono">Content-Type: application/json</span>
              </div>
              <pre className="font-mono text-base text-slate-300 overflow-x-auto max-h-60 leading-relaxed">
                <code>{responsePayload}</code>
              </pre>
            </div>
          )}
        </div>

        {/* OpenAPI Specification Code View (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <span className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Code2 className="w-5 h-5 text-cyan-400" />
              openapi.yaml (Specification 3.1.0)
            </span>
            <span className="text-base text-slate-400">Strict JSON-Schema Compliant</span>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl overflow-x-auto text-base font-mono text-slate-300 leading-relaxed border border-slate-800 flex-1 max-h-[540px]">
            <code>{openApiYaml}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
