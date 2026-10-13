/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const OPENAPI_YAML = `openapi: 3.1.0
info:
  title: GF-T3-172 Lexus TX 500h DIRECT4 Swarm Engine
  description: High-throughput low-latency telemetry ingestion, BFT quorum coordinator, and state broadcasting.
  version: 1.0.0-PROD
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT
servers:
  - url: https://gf-t3-172-direct4-core-7v3x.a.run.app
    description: Google Cloud Run Managed Production Cluster
paths:
  /api/v1/swarm/telemetry/ingest:
    post:
      summary: Ingest dynamic vehicle telemetry packet
      description: Ingests 100 Hz high-frequency chassis sensor data, evaluates against vehicle dynamic models, and dispatches to HotStuff BFT proposal queue.
      operationId: ingestTelemetry
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TelemetryIngestRequest'
      responses:
        '200':
          description: Telemetry accepted and scheduled for next epoch proposal.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TelemetryIngestResponse'
        '422':
          description: Input validation failure or sensor out-of-range error.

  /api/v1/swarm/epochs/{epoch_id}:
    get:
      summary: Retrieve committed consensus epoch block
      description: Returns finalized block state including SHA-256 Merkle root, quorum signatures, and computed DIRECT4 torque split vector.
      operationId: getEpochById
      parameters:
        - name: epoch_id
          in: path
          required: true
          schema:
            type: integer
            example: 1048580
      responses:
        '200':
          description: Finalized epoch data.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EpochBlock'
        '404':
          description: Epoch not found or quarantined.

  /api/v1/swarm/consensus/vote:
    post:
      summary: Submit validator quorum vote
      description: Ingests Ed25519 validator signature for PRE-PREPARE or COMMIT phase.
      operationId: submitVote
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ValidatorVoteRequest'
      responses:
        '200':
          description: Vote registered in quorum matrix.

  /api/v1/swarm/direct4/vector:
    get:
      summary: Get active DIRECT4 torque split ratio
      description: High-speed endpoint returning instantaneous front/rear torque and kW power distribution.
      operationId: getActiveTorqueVector
      responses:
        '200':
          description: Current torque vector.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Direct4Vector'

components:
  schemas:
    TelemetryIngestRequest:
      type: object
      required:
        - speed_kmh
        - throttle_pct
        - steer_angle_deg
        - yaw_rate_deg_s
        - lateral_g
      properties:
        speed_kmh:
          type: number
          minimum: 0
          maximum: 260
          example: 84.5
        throttle_pct:
          type: number
          minimum: 0
          maximum: 100
          example: 45.0
        steer_angle_deg:
          type: number
          minimum: -540
          maximum: 540
          example: 14.2
        yaw_rate_deg_s:
          type: number
          minimum: -120
          maximum: 120
          example: 4.8
        lateral_g:
          type: number
          minimum: -3.0
          maximum: 3.0
          example: 0.42

    TelemetryIngestResponse:
      type: object
      properties:
        status:
          type: string
          example: QUEUED_FOR_CONSENSUS
        target_epoch_id:
          type: integer
          example: 1048581
        timestamp_ns:
          type: integer
          example: 1731339138420000000

    Direct4Vector:
      type: object
      properties:
        front_ratio:
          type: number
          minimum: 0.20
          maximum: 0.70
          example: 0.60
        rear_ratio:
          type: number
          minimum: 0.30
          maximum: 0.80
          example: 0.40
        front_kw:
          type: number
          example: 163.8
        rear_kw:
          type: number
          example: 109.2
        torque_mode:
          type: string
          enum: [CRUISE_EFFICIENCY, TURN_IN_TRACTION, APEX_STABILITY, EXIT_LAUNCH]

    ValidatorVoteRequest:
      type: object
      required:
        - epoch_id
        - node_id
        - phase
        - signature
      properties:
        epoch_id:
          type: integer
          example: 1048580
        node_id:
          type: string
          example: node-1
        phase:
          type: string
          enum: [PRE_PREPARE, PREPARE, COMMIT]
        signature:
          type: string
          example: ed25519_sig_4f92...

    EpochBlock:
      type: object
      properties:
        epoch_id:
          type: integer
        merkle_root:
          type: string
        proposer_node_id:
          type: string
        quorum_count:
          type: integer
        commit_latency_us:
          type: integer
`;

export interface ApiEndpoint {
  method: 'POST' | 'GET' | 'WSS';
  path: string;
  summary: string;
  description: string;
  requestSample?: Record<string, unknown>;
  responseSample: Record<string, unknown>;
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'POST',
    path: '/api/v1/swarm/telemetry/ingest',
    summary: 'Ingest Vehicle Chassis Telemetry',
    description: 'Pushes high-rate CAN-FD chassis measurements directly into the HotStuff BFT proposal pipeline.',
    requestSample: {
      speed_kmh: 88.4,
      throttle_pct: 62.0,
      steer_angle_deg: 18.5,
      yaw_rate_deg_s: 6.2,
      lateral_g: 0.58,
    },
    responseSample: {
      status: 'COMMITTED_IN_EPOCH',
      epoch_id: 1048581,
      direct4_split: {
        front_ratio: 0.42,
        rear_ratio: 0.58,
        front_kw: 114.66,
        rear_kw: 158.34,
        mode: 'TURN_IN_TRACTION',
      },
      bft_consensus_latency_ms: 0.46,
      quorum_verified: true,
    },
  },
  {
    method: 'GET',
    path: '/api/v1/swarm/epochs/1048580',
    summary: 'Query Committed Epoch Block',
    description: 'Retrieves finalized epoch metadata, Ed25519 quorum signatures, and cryptographic Merkle tree root.',
    responseSample: {
      epoch_id: 1048580,
      merkle_root: '0xd7a9f4381b82e45cf8733299c0119bf2e334a1795c6130de910f0814bb6012aa',
      proposer_node: 'Leader Node 0 (T24A-FTS Hybrid PCM)',
      signatures_count: 3,
      quorum_status: 'SUPERMAJORITY_ACHIEVED (3/4)',
      commit_latency_us: 480,
      quarantined: false,
    },
  },
  {
    method: 'POST',
    path: '/api/v1/swarm/consensus/vote',
    summary: 'Broadcast Validator BFT Vote',
    description: 'Submits Ed25519 signature affirming block validity within the sub-2 ms commit window.',
    requestSample: {
      epoch_id: 1048581,
      node_id: 'node-2',
      phase: 'COMMIT',
      vote_hash: '0xb22d5894f29fa3312c109db45902cdb8392',
      signature: 'ed25519_sig_node2_a98f42...',
    },
    responseSample: {
      vote_registered: true,
      current_quorum_weight: '3/4 (75% - Finalized)',
      transition_to: 'DECIDE',
    },
  },
  {
    method: 'GET',
    path: '/api/v1/swarm/direct4/vector',
    summary: 'Read Active DIRECT4 Split Vector',
    description: 'Real-time telemetry readout of instantaneous front/rear motor output and dynamic bias mode.',
    responseSample: {
      front_ratio: 0.35,
      rear_ratio: 0.65,
      front_kw: 95.55,
      rear_kw: 177.45,
      system_hp_output: 366,
      bias_strategy: 'APEX_STABILITY',
      eaxle_temp_c: 62.4,
    },
  },
  {
    method: 'WSS',
    path: '/ws/v1/swarm/telemetry-stream',
    summary: 'Real-time Swarm Telemetry WebSocket (100 Hz)',
    description: 'Low-overhead binary/JSON WebSocket framing streaming live epoch proposals, consensus phase steps, and DIRECT4 splits.',
    responseSample: {
      event: 'EPOCH_COMMITTED',
      epoch_id: 1048581,
      phase: 'DECIDE',
      front_ratio: 0.42,
      rear_ratio: 0.58,
      merkle_root: '0x88b1ce32d51029f832ba52cd59120ba3921',
      latency_ms: 0.46,
    },
  },
];
