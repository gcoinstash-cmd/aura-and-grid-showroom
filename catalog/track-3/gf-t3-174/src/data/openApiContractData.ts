/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Track 2 Sovereign Flagship Steer-by-Wire Core (GF-T3-174)
 * OpenAPI 3.1 Actuation Contract & WebSocket Subprotocol Specifications
 */

export const OPENAPI_SPEC_OBJECT = {
  openapi: "3.1.0",
  info: {
    title: "GF-T3-174 Track 2 Sovereign Flagship Steer-by-Wire Core Gateway",
    version: "1.0.0-PROD",
    description: "Ultra-low-latency ISO 26262 ASIL-D dual-channel steer-by-wire actuation arbitration contract.",
    contact: {
      name: "Ghost FactoryOS Systems Architecture",
      url: "https://acquire.com",
      email: "architect@ghostfactoryos.internal"
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT"
    }
  },
  servers: [
    {
      url: "https://sbw-precision-core-434044503951.us-east1.run.app",
      description: "Production Cloud Run Cluster (High-Throughput Dedicated VPC)"
    },
    {
      url: "http://localhost:8080",
      description: "Local Hardware-in-the-Loop (HIL) Simulator"
    }
  ],
  paths: {
    "/api/v1/actuation/angle-ingest": {
      post: {
        summary: "Ingest Dual-Channel Yoke Resolver Frames",
        description: "Primary deterministic ingestion loop invoked at 1000 Hz. Performs cross-channel voting, divergence analysis, and variable steering ratio derivation.",
        operationId: "ingestYokeAngle",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AngleIngestRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Actuation cycle arbitrated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ActuationCommandResponse"
                }
              }
            }
          },
          "422": {
            description: "ASIL-D Divergence threshold exceeded or CRC mismatch",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/actuation/force-feedback": {
      post: {
        summary: "Synthesize Driver Haptic Feedback Torque",
        description: "Calculates pneumatic and mechanical trail aligning torques, damping, and road texture excitation sent to the yoke brushless actuator.",
        operationId: "synthesizeForceFeedback",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ForceFeedbackRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Haptic feedback torque vector calculated",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ForceFeedbackResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/actuation/health/divergence": {
      get: {
        summary: "Inspect Real-Time Dual-Channel Redundancy Health",
        description: "Returns instant consensus status, rolling divergence window, and hardware watchdog counters.",
        operationId: "getConsensusHealth",
        responses: {
          "200": {
            description: "Redundancy status verified",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthConsensusResponse"
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      AngleIngestRequest: {
        type: "object",
        required: ["monotonicNonce", "channelAAngleDeg", "channelBAngleDeg", "vehicleSpeedKmh", "crc32Checksum"],
        properties: {
          monotonicNonce: { type: "integer", example: 1048576, description: "Strictly incrementing 64-bit hardware counter" },
          channelAAngleDeg: { type: "number", minimum: -150.0, maximum: 150.0, example: 28.45, description: "TMR Hall resolver angle" },
          channelBAngleDeg: { type: "number", minimum: -150.0, maximum: 150.0, example: 28.43, description: "Optical inductive resolver angle" },
          vehicleSpeedKmh: { type: "number", minimum: 0.0, maximum: 240.0, example: 64.2, description: "Wheel speed sensor aggregate" },
          crc32Checksum: { type: "string", example: "0x8F9C3E1B", description: "Hardware CRC32 over frame bytes" }
        }
      },
      ActuationCommandResponse: {
        type: "object",
        properties: {
          arbitratedAngleDeg: { type: "number", example: 28.44 },
          commandedRoadWheelDeg: { type: "number", example: 2.78 },
          effectiveRatio: { type: "number", example: 10.23 },
          divergenceDeg: { type: "number", example: 0.02 },
          consensusStatus: { type: "string", enum: ["NOMINAL_ASIL_D", "DEGRADED_FAIL_OP", "FAULT_LOCKDOWN"], example: "NOMINAL_ASIL_D" },
          latencyMs: { type: "number", example: 0.68 },
          hmacSignature: { type: "string", example: "9f82c...7b21" }
        }
      },
      ForceFeedbackRequest: {
        type: "object",
        required: ["yokeAngleDeg", "roadWheelAngleDeg", "vehicleSpeedKmh", "surfaceProfile"],
        properties: {
          yokeAngleDeg: { type: "number", example: 28.44 },
          roadWheelAngleDeg: { type: "number", example: 2.78 },
          vehicleSpeedKmh: { type: "number", example: 64.2 },
          surfaceProfile: { type: "string", enum: ["asphalt", "cobblestone", "ice", "rumble"], example: "asphalt" }
        }
      },
      ForceFeedbackResponse: {
        type: "object",
        properties: {
          feedbackTorqueNm: { type: "number", example: 3.42 },
          selfAligningNm: { type: "number", example: 3.15 },
          dampingTorqueNm: { type: "number", example: -0.28 },
          vibrationTextureNm: { type: "number", example: 0.0 }
        }
      },
      HealthConsensusResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "NOMINAL_ASIL_D" },
          channelASyncRate: { type: "number", example: 1.0 },
          channelBSyncRate: { type: "number", example: 1.0 },
          meanDivergenceLast1000FramesDeg: { type: "number", example: 0.014 },
          watchdogViolationsTotal: { type: "integer", example: 0 }
        }
      },
      ErrorResponse: {
        type: "object",
        properties: {
          errorCode: { type: "string", example: "ERR_ASIL_D_DIVERGENCE_BREACH" },
          message: { type: "string", example: "Delta angle exceeded safety boundary: 0.284 deg" },
          failsafeEngaged: { type: "boolean", example: true }
        }
      }
    }
  }
};

export const WEBSOCKET_SPEC_MARKDOWN = `### WebSocket Streaming Subprotocol Specification: \`Apex Executive-sbw-v1\`

**Endpoint:** \`wss://sbw-precision-core-434044503951.us-east1.run.app/ws/v1/telemetry/stream\`  
**Framing Cadence:** 1000 Hz (1 ms interval)  
**Encoding:** Binary Protocol Buffers or Compressed JSON  

#### Binary Telemetry Frame Layout (48 Bytes per frame):
\`\`\`
0                   1                   2                   3
0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|       Magic Header (0x5342)   |   Frame Version (0x01) | Flag |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                  Monotonic Nonce (Bytes 4-7)                  |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                  Monotonic Nonce (Bytes 0-3)                  |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                 Channel A Resolver Angle (IEEE 754 Float32)   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                 Channel B Resolver Angle (IEEE 754 Float32)   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                 Commanded Road Wheel Angle (Float32)          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                 Vehicle Speed m/s (Float32)                   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                 Synthesized Haptic Torque Nm (Float32)        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                 Calculated Yaw Rate rad/s (Float32)           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Status (1B)  | Reserved (3B) |        CRC32 Checksum         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
\`\`\`
`;
