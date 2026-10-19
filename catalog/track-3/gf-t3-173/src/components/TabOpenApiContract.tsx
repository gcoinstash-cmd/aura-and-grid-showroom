import React, { useState } from 'react';
import { FileCode, Copy, Check, Send, Radio, ArrowRight } from 'lucide-react';

const OPENAPI_SPEC = `openapi: 3.1.0
info:
  title: GF-T3-173 Heavy Overland Dynamics Platform RC F Track Edition Aero Core API
  version: 1.0.0-PROD
  description: High-frequency telemetry ingestion, active downforce control loop, and cryptographic ledger verification.
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://aero-api.ghostfactory.io
    description: Production Cloud Run Cluster
  - url: http://localhost:8080
    description: Local Test Harness

paths:
  /api/v1/telemetry/pitot-stream:
    post:
      summary: Ingest high-speed multi-point pitot pressure transducer vector
      description: Ingests 8-channel differential pressure readings from front splitter, underbody venturis, and rear wing pylon pitots.
      operationId: ingestPitotStream
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - sequence_nonce
                - vehicle_vin
                - speed_kmh
                - dynamic_pressure_pa
                - sensors
                - previous_hash
              properties:
                sequence_nonce:
                  type: integer
                  minimum: 1
                  example: 1000420
                vehicle_vin:
                  type: string
                  minLength: 17
                  maxLength: 17
                  example: "JTHHP5BC8L5000173"
                speed_kmh:
                  type: number
                  minimum: 0.0
                  maximum: 420.0
                  example: 250.0
                dynamic_pressure_pa:
                  type: number
                  example: 2953.5
                sensors:
                  type: array
                  items:
                    type: object
                    required: [sensor_id, pressure_pa, local_velocity_ms]
                    properties:
                      sensor_id: { type: string, example: "PITOT-FL-01" }
                      pressure_pa: { type: number, example: 3189.8 }
                      local_velocity_ms: { type: number, example: 72.2 }
                previous_hash:
                  type: string
                  pattern: "^[a-f0-9]{64}$"
      responses:
        "200":
          description: Ingestion verified and recorded into cryptographic ledger
          content:
            application/json:
              schema:
                type: object
                properties:
                  status: { type: string, example: "VERIFIED_INGESTED" }
                  nonce: { type: integer, example: 1000420 }
                  calculated_downforce_n: { type: number, example: 3850.0 }
                  record_hash: { type: string, example: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" }

  /api/v1/actuators/command:
    post:
      summary: Dispatch dual carbon flap actuator command
      operationId: commandActuators
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [target_mode, left_flap_deg, right_flap_deg]
              properties:
                target_mode:
                  type: string
                  enum: [NOMINAL_DOWNFORCE, CORNERING_VECTORING, HIGH_SPEED_STABILITY, LOW_DRAG_DRS, EMERGENCY_AIRBRAKE]
                left_flap_deg:
                  type: number
                  minimum: -5.0
                  maximum: 35.0
                  example: 12.0
                right_flap_deg:
                  type: number
                  minimum: -5.0
                  maximum: 35.0
                  example: 12.0
      responses:
        "200":
          description: Actuator servo command acknowledged
          content:
            application/json:
              schema:
                type: object
                properties:
                  executed: { type: boolean, example: true }
                  actuator_slew_rate_deg_s: { type: number, example: 120.0 }
                  latency_ms: { type: number, example: 1.1 }

  /api/v1/aero/ledger/verify-chain:
    get:
      summary: Audit cryptographic HMAC-SHA256 telemetry hash sequence
      responses:
        "200":
          description: Hash chain integrity status
          content:
            application/json:
              schema:
                type: object
                properties:
                  chain_valid: { type: boolean, example: true }
                  total_nonces_verified: { type: integer, example: 1000420 }
                  quarantined_records: { type: integer, example: 0 }

# WebSocket Real-Time Frame Protocol
components:
  schemas:
    WebSocketAeroFrame:
      type: object
      properties:
        event: { type: string, enum: ["TELEMETRY_BROADCAST", "ACTUATOR_FAULT", "AIRBRAKE_DEPLOYED"] }
        payload:
          type: object
          properties:
            nonce: { type: integer }
            speed_kmh: { type: number }
            total_downforce_n: { type: number }
            left_flap_deg: { type: number }
            right_flap_deg: { type: number }
            timestamp_ns: { type: integer }
`;

export const TabOpenApiContract: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(OPENAPI_SPEC);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeMockRequest = () => {
    setIsSending(true);
    setTimeout(() => {
      setApiResponse(
        JSON.stringify(
          {
            status: "VERIFIED_INGESTED",
            nonce: 1000421,
            calculated_downforce_n: 3850.0,
            front_aero_balance_pct: 39.2,
            rear_aero_balance_pct: 60.8,
            actuator_ack: {
              left_flap_deg: 10.5,
              right_flap_deg: 10.5,
              slew_rate_deg_s: 120.0,
              latency_ms: 0.94
            },
            record_hash: "a4f89d34201bc7e829370129bc65ef3190847291a1829038472918237492aef1",
            hmac_signature: "77218bbcf992839210293847a982371928374910293847192837491827364512"
          },
          null,
          2
        )
      );
      setIsSending(false);
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm font-mono text-cyan-400 uppercase tracking-wider mb-1">
              Tab 3 · OpenAPI 3.1 & WebSocket Protocol
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Deterministic Aero Ingestion & Actuator Contracts
            </h2>
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied OpenAPI YAML' : 'Copy OpenAPI Contract'}</span>
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-300 max-w-3xl">
          Complete OpenAPI 3.1 endpoints and binary WebSocket broadcast protocols for high-frequency Pitot telemetry stream ingestion, dynamic brushless servo actuator control, and unbroken cryptographic chain validation.
        </p>

        {/* Live Mock Sandbox */}
        <div className="mt-6 bg-slate-950 border border-slate-800 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-sm font-mono font-bold bg-cyan-900/80 text-cyan-200 rounded border border-cyan-700">
                POST
              </span>
              <span className="text-sm font-mono text-white font-semibold">
                /api/v1/telemetry/pitot-stream
              </span>
            </div>
            <button
              onClick={executeMockRequest}
              disabled={isSending}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending Frame...' : 'Test Ingestion Endpoint'}</span>
            </button>
          </div>

          {apiResponse && (
            <div className="mt-3">
              <div className="text-sm font-mono text-emerald-400 mb-1">Response: 200 OK (0.94 ms latency)</div>
              <pre className="p-3 bg-slate-900 border border-slate-800 rounded text-sm font-mono text-emerald-300 overflow-x-auto">
                {apiResponse}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* OpenAPI Specification Code View */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-mono text-slate-200">contracts/openapi_3_1_aero.yaml</span>
            <span className="text-sm font-mono text-slate-500">· YAML 1.2</span>
          </div>
          <span className="text-sm font-mono text-cyan-400">REST & WebSocket Channel</span>
        </div>

        <div className="p-4 overflow-x-auto">
          <pre className="text-sm font-mono text-slate-300 leading-relaxed">
            <code>{OPENAPI_SPEC}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
