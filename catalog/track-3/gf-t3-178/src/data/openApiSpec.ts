export const OPENAPI_YAML_SPEC = `openapi: 3.1.0
info:
  title: GF-T3-178 Apex Executive LS 500 Executive AWD Telemetry Gateway
  version: 1.0.0-PROD
  description: >
    Zero-placeholder OpenAPI 3.1 specification for cabin acoustic interior microphone stream ingestion,
    active speaker anti-phase duty cycle commands, and engine load boost telemetry broadcast.
  contact:
    name: Ghost FactoryOS Flagship Systems
    url: https://acquire.com
servers:
  - url: https://gf-t3-178-gateway-c4p6li5nkkjr54vtpqyx6d-uc.a.run.app
    description: Production Cloud Run Deployment Target
paths:
  /v1/telemetry/microphone-stream:
    post:
      summary: Ingest 4-Channel Interior Acoustic Microphone Frames
      description: Ingests 2,000 Hz acoustic sampled vectors from Apex Executive cabin MEMS microphones.
      operationId: ingestMicrophoneStream
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AcousticIngestRequest'
      responses:
        '200':
          description: Acoustic frame ingested and anti-phase duty cycle computed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AcousticIngestResponse'
        '400':
          description: Frame malformed or out of sequence
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /v1/actuators/anti-phase-command:
    post:
      summary: Command Active Speaker Anti-Phase Duty Cycle
      description: Commands inverted phase duty cycle to Acoustic Noise-Inversion Transducer audio amplifier channels.
      operationId: commandAntiPhaseAudio
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AntiPhaseCommandRequest'
      responses:
        '200':
          description: Command acknowledged by DSP DAC
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAckResponse'

  /v1/engine/boost-telemetry:
    get:
      summary: Retrieve Live V35A-FTS Twin-Turbo Boost Telemetry
      description: Fetches current manifold absolute pressure, wastegate PWM solenoid status, and quarantine state.
      operationId: getBoostTelemetry
      responses:
        '200':
          description: Current engine boost status
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BoostTelemetryResponse'

  /v1/stream/cabin-acoustic:
    get:
      summary: Full-Duplex WebSocket Inversion Stream
      description: Protocol upgrade endpoint providing sub-millisecond bidirectional acoustic & boost telemetry.
      operationId: streamCabinAcoustic
      responses:
        '101':
          description: Switching Protocols to WebSocket (ws:// or wss://)

components:
  schemas:
    AcousticIngestRequest:
      type: object
      required:
        - timestamp_ns
        - sequence_id
        - engine_rpm
        - mic_channels_db
        - current_boost_psi
      properties:
        timestamp_ns:
          type: integer
          format: int64
          example: 1776037800000000000
        sequence_id:
          type: integer
          example: 1048576
        engine_rpm:
          type: integer
          minimum: 500
          maximum: 8500
          example: 2400
        mic_channels_db:
          type: array
          items:
            type: number
          minItems: 4
          maxItems: 4
          description: Decibel levels at Front-L, Front-R, Rear-L, Rear-R Executive Lounge microphones
          example: [68.4, 67.9, 69.1, 68.8]
        current_boost_psi:
          type: number
          example: 16.85

    AcousticIngestResponse:
      type: object
      required:
        - status
        - anti_phase_duty_cycle
        - attenuation_achieved_db
        - hmac_signature
      properties:
        status:
          type: string
          enum: [CONVERGED, ADAPTING, SATURATED]
          example: CONVERGED
        anti_phase_duty_cycle:
          type: number
          example: 0.884
        attenuation_achieved_db:
          type: number
          example: -18.42
        residual_cabin_db:
          type: number
          example: 50.18
        hmac_signature:
          type: string
          example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

    AntiPhaseCommandRequest:
      type: object
      required:
        - channel_mask
        - target_gain_db
        - phase_inversion_degrees
      properties:
        channel_mask:
          type: integer
          description: Bitmask of Acoustic Noise-Inversion Transducer output channels (1-23)
          example: 15
        target_gain_db:
          type: number
          example: -18.4
        phase_inversion_degrees:
          type: number
          example: 180.0

    CommandAckResponse:
      type: object
      properties:
        acknowledged:
          type: boolean
          example: true
        latency_us:
          type: integer
          example: 185
        dac_status:
          type: string
          example: ARMED_SYNCED

    BoostTelemetryResponse:
      type: object
      properties:
        engine_rpm:
          type: integer
          example: 2400
        target_boost_psi:
          type: number
          example: 17.20
        actual_boost_psi:
          type: number
          example: 16.95
        wastegate_solenoid_pwm:
          type: number
          example: 44.8
        overshoot_quarantine:
          type: boolean
          example: false

    ErrorResponse:
      type: object
      properties:
        error_code:
          type: string
          example: ERR_SEQUENCE_MISMATCH
        message:
          type: string
          example: Monotonic sequence header missing or out of order.
`;
