export const OPENAPI_SPEC_YAML = `openapi: 3.1.0
info:
  title: Vanguard ECLSS Terrain Core Telemetry Contract
  version: 1.0.0-PROD
  description: >
    Zero-copy, deterministic telemetry ingestion & active suspension control
    contract for Ghost FactoryOS / Acquire.com Turnkey Asset GF-T3-176.
  contact:
    name: Ghost FactoryOS Architecture Council
    url: https://ghostfactory.os/gf-t3-176
  license:
    name: MIT Permissive
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://terrain-core-edge.us-central1.run.app
    description: Production Cloud Run Low-Latency Harness

paths:
  /api/v1/telemetry/imu-feed:
    post:
      summary: Ingest 6-Axis IMU & 4-Corner LVDT Suspension Strokes
      description: Ingests 1,000 Hz or batched 100 Hz kinematic frames from vehicle CAN-FD gateway.
      operationId: ingestImuFeed
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ImuFeedPayload'
      responses:
        '201':
          description: Telemetry Frame Committed to Partitioned Ledger
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ImuIngestResponse'
        '422':
          description: Quarantined Slip Anomaly or Checksum Failure

  /api/v1/crawl-control/setpoint:
    post:
      summary: Command Low-Speed Crawl Control Speed Regulation
      description: Sets vehicle target crawl speed between 1.0 and 5.0 mph with active ABS torque modulation.
      operationId: setCrawlControl
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [target_speed_mph, auto_diff_lock_override]
              properties:
                target_speed_mph:
                  type: number
                  minimum: 1.0
                  maximum: 5.0
                  example: 2.5
                auto_diff_lock_override:
                  type: boolean
                  example: true
      responses:
        '200':
          description: Crawl Control Loop Updated
          content:
            application/json:
              schema:
                type: object
                properties:
                  status: { type: string, example: "ACTIVE" }
                  allocated_brake_duty_cycle: { type: number, example: 0.42 }
                  rear_locker_status: { type: string, example: "LOCKED" }

  /api/v1/diff-lock/command:
    post:
      summary: Toggle Center Torsen / Rear Electronic Differential Locker
      operationId: commandDiffLock
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [target_differential, lock_state]
              properties:
                target_differential:
                  type: string
                  enum: [TORSEN_CENTER, ELECTRONIC_REAR]
                  example: ELECTRONIC_REAR
                lock_state:
                  type: boolean
                  example: true
      responses:
        '200':
          description: Solenoid Relay Acknowledged
          content:
            application/json:
              schema:
                type: object
                properties:
                  acknowledged: { type: boolean, example: true }
                  transition_time_ms: { type: number, example: 12.4 }

components:
  schemas:
    ImuFeedPayload:
      type: object
      required:
        - sequence_id
        - timestamp
        - pitch_deg
        - roll_deg
        - strokes
      properties:
        sequence_id:
          type: integer
          format: int64
          example: 1000420
        timestamp:
          type: string
          format: date-time
          example: "2026-10-11T16:55:00.000Z"
        pitch_deg:
          type: number
          example: 14.25
        roll_deg:
          type: number
          example: -8.10
        yaw_rate_deg_s:
          type: number
          example: 1.45
        strokes:
          type: object
          required: [fl, fr, rl, rr]
          properties:
            fl: { type: number, example: 8.2 }
            fr: { type: number, example: -4.1 }
            rl: { type: number, example: 11.8 }
            rr: { type: number, example: -8.9 }

    ImuIngestResponse:
      type: object
      properties:
        ledger_block_height: { type: integer, example: 1000420 }
        current_block_hash: { type: string, example: "0x8f2ac94b8e721a3b9012f45811cba908d1f2e456..." }
        hmac_sha256: { type: string, example: "0x6e2c90a187..." }
        ekdss_front_decoupled: { type: boolean, example: true }
        ekdss_rear_decoupled: { type: boolean, example: true }
        effective_roll_stiffness_nm_rad: { type: number, example: 12600.0 }
        quarantined: { type: boolean, example: false }

  webSocketChannels:
    /ws/v1/telemetry/stream:
      description: 100 Hz Real-Time Binary/JSON Telemetry Stream
      messages:
        subscribe:
          payload: { type: object, properties: { topic: { type: string, example: "all" } } }
        publish:
          payload:
            $ref: '#/components/schemas/ImuIngestResponse'
`;

export const OPENAPI_SPEC_JSON = JSON.stringify({
  openapi: "3.1.0",
  info: {
    title: "Vanguard ECLSS Terrain Core Telemetry Contract",
    version: "1.0.0-PROD",
    description: "Zero-copy, deterministic telemetry ingestion & active suspension control contract for Ghost FactoryOS / Acquire.com Turnkey Asset GF-T3-176.",
    license: { name: "MIT Permissive", url: "https://opensource.org/licenses/MIT" }
  },
  servers: [{ url: "https://terrain-core-edge.us-central1.run.app", description: "Production Cloud Run Harness" }],
  paths: {
    "/api/v1/telemetry/imu-feed": {
      post: {
        summary: "Ingest 6-Axis IMU & 4-Corner LVDT Suspension Strokes",
        operationId: "ingestImuFeed",
        responses: {
          "201": { description: "Telemetry Frame Committed to Partitioned Ledger" }
        }
      }
    },
    "/api/v1/crawl-control/setpoint": {
      post: {
        summary: "Command Low-Speed Crawl Control Speed Regulation",
        operationId: "setCrawlControl",
        responses: { "200": { description: "Crawl Control Loop Updated" } }
      }
    },
    "/api/v1/diff-lock/command": {
      post: {
        summary: "Toggle Center Torsen / Rear Electronic Differential Locker",
        operationId: "commandDiffLock",
        responses: { "200": { description: "Solenoid Relay Acknowledged" } }
      }
    }
  }
}, null, 2);
