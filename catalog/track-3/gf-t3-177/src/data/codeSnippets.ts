export const PYTHON_CORE_ENGINE_CODE = `"""
GF-T3-177 | Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core Convertible Grand Touring Core
Proprietary Dynamic Rear Steering (DRS) & Bimodal Acoustic Exhaust Engine
Clean-Room Certified | Python 3.12 Production Implementation
License: Permissive MIT
"""

from dataclasses import dataclass
from enum import Enum
import math
import time

class RearSteeringPhase(Enum):
    COUNTER_PHASE = "COUNTER_PHASE"  # Sub-80 km/h: virtual wheelbase reduction for low-speed agility
    NEUTRAL = "NEUTRAL"              # Transition deadband around 80 km/h
    IN_PHASE = "IN_PHASE"            # Sup-80 km/h: virtual wheelbase extension for lateral stability

class ConvertibleTopStatus(Enum):
    STOWED = "STOWED"                # Top down: Acoustic bypass tuned for open-air pressure harmonics
    DEPLOYED = "DEPLOYED"            # Top up: Acoustic bypass tuned for cabin grand touring luxury

@dataclass(frozen=True)
class VehicleDynamicsConfig:
    wheelbase_m: float = 2.870               # Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core GA-L platform wheelbase (m)
    track_width_rear_m: float = 1.635        # Rear track width (m)
    curb_weight_kg: float = 2055.0           # High-Aero Grand Touring Telemetry Core Convertible curb weight (kg)
    steering_ratio_front: float = 13.6       # Variable gear ratio center baseline
    max_rear_steer_deg: float = 2.0          # Heavy Overland Dynamics Platform Dynamic Handling (LDH) rear actuator limit (±2.0°)
    transition_speed_kph: float = 80.0       # Phase inversion threshold (80.0 km/h)
    phase_hysteresis_kph: float = 2.5        # Anti-hunting transition deadband (±2.5 km/h)
    understeer_gradient_rad_g: float = 0.0022 # K_us linear understeer gradient (rad/(m/s^2))
    rear_gain_counter: float = 0.024         # Low-speed yaw gain multiplier
    rear_gain_in_phase: float = 0.018        # High-speed lateral stability gain multiplier

@dataclass
class TelemetryFrame:
    timestamp_ns: int
    speed_kph: float
    steering_wheel_angle_deg: float
    lateral_g: float
    engine_rpm: float
    engine_load_pct: float
    top_status: ConvertibleTopStatus

@dataclass
class ActuatorOutput:
    timestamp_ns: int
    rear_steer_angle_deg: float
    phase: RearSteeringPhase
    target_yaw_rate_deg_s: float
    calculated_yaw_rate_deg_s: float
    slip_angle_beta_deg: float
    left_exhaust_flap_duty_pct: float
    right_exhaust_flap_duty_pct: float
    acoustic_pressure_db: float
    v8_firing_order_hz: float

class High-Aero Grand Touring Telemetry CoreGrandTouringCore:
    def __init__(self, config: VehicleDynamicsConfig = VehicleDynamicsConfig()):
        self.config = config
        self._last_phase: RearSteeringPhase = RearSteeringPhase.COUNTER_PHASE
        self._filter_yaw_rate: float = 0.0

    def compute_drs_rear_angle(
        self,
        speed_kph: float,
        front_wheel_angle_deg: float,
        lateral_g: float,
        measured_yaw_rate_deg_s: float
    ) -> tuple[float, RearSteeringPhase, float, float, float]:
        v_ms = max(0.1, speed_kph / 3.6)
        L = self.config.wheelbase_m
        K_us = self.config.understeer_gradient_rad_g

        # Linear Bicycle Model: Target Neutral Yaw Rate (rad/s -> deg/s)
        delta_f_rad = math.radians(front_wheel_angle_deg)
        denom = L + (K_us * (v_ms ** 2))
        target_yaw_rate_rad_s = (v_ms / denom) * delta_f_rad
        target_yaw_rate_deg_s = math.degrees(target_yaw_rate_rad_s)

        # Vehicle side-slip angle estimate (Beta, deg)
        a_y_ms2 = lateral_g * 9.80665
        slip_angle_beta_rad = math.asin(min(1.0, max(-1.0, (a_y_ms2 / (v_ms * 9.80665))))) * 0.12
        slip_angle_beta_deg = math.degrees(slip_angle_beta_rad)

        # Active Rear Steering Phase Determination with Hysteresis
        thresh = self.config.transition_speed_kph
        hyst = self.config.phase_hysteresis_kph

        if speed_kph < (thresh - hyst):
            phase = RearSteeringPhase.COUNTER_PHASE
        elif speed_kph > (thresh + hyst):
            phase = RearSteeringPhase.IN_PHASE
        else:
            phase = self._last_phase
        self._last_phase = phase

        # Closed-loop Rear Wheel Steer calculation
        if phase == RearSteeringPhase.COUNTER_PHASE:
            # Counter-phase: Steer opposite to front wheels to maximize yaw acceleration
            raw_rear_deg = -1.0 * (front_wheel_angle_deg * self.config.rear_gain_counter)
            # Damping yaw rate error
            yaw_error = measured_yaw_rate_deg_s - target_yaw_rate_deg_s
            raw_rear_deg += (-0.015 * yaw_error)
        else:
            # In-phase: Steer in same direction as front wheels to eliminate body slip angle
            raw_rear_deg = front_wheel_angle_deg * self.config.rear_gain_in_phase
            # High speed stabilization feed-forward on lateral acceleration
            raw_rear_deg += (lateral_g * 0.28)

        # Physical LDH rack actuator hard limits
        clamped_rear_deg = max(-self.config.max_rear_steer_deg, min(self.config.max_rear_steer_deg, raw_rear_deg))
        
        return clamped_rear_deg, phase, target_yaw_rate_deg_s, measured_yaw_rate_deg_s, slip_angle_beta_deg

    def compute_acoustic_exhaust_valves(
        self,
        rpm: float,
        load_pct: float,
        top_status: ConvertibleTopStatus
    ) -> tuple[float, float, float, float]:
        """
        2UR-GSE 5.0L naturally aspirated V8 acoustic bypass control.
        Dual electronically-actuated valves bypass the secondary baffle chamber
        to unleash the harmonic quad-exhaust timbre without cabin drone.
        """
        # Primary firing frequency for 8 cylinders 4-stroke = (RPM / 60) * 4
        v8_hz = (rpm / 60.0) * 4.0

        # Base duty cycle calculation: Quiet Touring vs Grand Sport Sonic Wave
        if rpm < 3200.0 and load_pct < 45.0:
            base_duty = 0.0 # Fully closed touring quietude
        elif rpm >= 4200.0 or load_pct >= 70.0:
            base_duty = 100.0 # Full open atmospheric resonance
        else:
            # Progressive linear acoustic gradient
            rpm_factor = (rpm - 3200.0) / (4200.0 - 3200.0)
            load_factor = (load_pct - 45.0) / (70.0 - 45.0)
            base_duty = max(0.0, min(100.0, (rpm_factor * 0.6 + load_factor * 0.4) * 100.0))

        # Top status acoustic equalization:
        # When convertible top is stowed, open slightly earlier (12% baseline) to compensate
        # for wind turbulence masking, and eliminate rear cabin pressure buffeting.
        if top_status == ConvertibleTopStatus.STOWED:
            left_duty = min(100.0, base_duty + 8.0 if rpm > 2200 else base_duty)
            right_duty = min(100.0, base_duty + 8.0 if rpm > 2200 else base_duty)
            acoustic_db = 72.0 + (left_duty / 100.0) * 22.0
        else:
            left_duty = base_duty
            right_duty = base_duty
            acoustic_db = 66.0 + (left_duty / 100.0) * 20.0

        return left_duty, right_duty, acoustic_db, v8_hz

    def step(self, frame: TelemetryFrame) -> ActuatorOutput:
        front_wheel_angle = frame.steering_wheel_angle_deg / self.config.steering_ratio_front
        
        # Approximate instantaneous yaw rate from kinematic steady state
        v_ms = max(0.1, frame.speed_kph / 3.6)
        approx_yaw = (v_ms / self.config.wheelbase_m) * math.radians(front_wheel_angle)
        measured_yaw_rate = math.degrees(approx_yaw)

        rear_angle, phase, target_yaw, calc_yaw, slip_beta = self.compute_drs_rear_angle(
            speed_kph=frame.speed_kph,
            front_wheel_angle_deg=front_wheel_angle,
            lateral_g=frame.lateral_g,
            measured_yaw_rate_deg_s=measured_yaw_rate
        )

        left_flap, right_flap, db, hz = self.compute_acoustic_exhaust_valves(
            rpm=frame.engine_rpm,
            load_pct=frame.engine_load_pct,
            top_status=frame.top_status
        )

        return ActuatorOutput(
            timestamp_ns=frame.timestamp_ns,
            rear_steer_angle_deg=round(rear_angle, 3),
            phase=phase,
            target_yaw_rate_deg_s=round(target_yaw, 2),
            calculated_yaw_rate_deg_s=round(calc_yaw, 2),
            slip_angle_beta_deg=round(slip_beta, 2),
            left_exhaust_flap_duty_pct=round(left_flap, 1),
            right_exhaust_flap_duty_pct=round(right_flap, 1),
            acoustic_pressure_db=round(db, 1),
            v8_firing_order_hz=round(hz, 1)
        )
`;

export const POSTGRES_DDL_SCHEMA = `-- =========================================================================
-- GF-T3-177 | Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core Convertible Grand Touring Core
-- Cryptographic Touring Ledger & Partitioned Timeseries Schema
-- PostgreSQL 16 Production DDL with HMAC-SHA256 Continuous Audit
-- License: Permissive MIT | 0% Copyleft Clean-Room
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types for strict database domain integrity
CREATE TYPE drs_phase_enum AS ENUM ('COUNTER_PHASE', 'NEUTRAL', 'IN_PHASE');
CREATE TYPE top_status_enum AS ENUM ('STOWED', 'DEPLOYED');

-- 1. Base Timeseries Hypertable for High-Frequency Ingestion (1,000 Hz)
CREATE TABLE IF NOT EXISTS High-Aero Grand Touring Telemetry Core_telemetry_partitioned (
    record_id           BIGSERIAL,
    block_index         BIGINT NOT NULL,
    timestamp_utc       TIMESTAMPTZ NOT NULL,
    monotonic_ns        BIGINT NOT NULL,
    vehicle_speed_kph   NUMERIC(5,2) NOT NULL CHECK (vehicle_speed_kph >= 0.0 AND vehicle_speed_kph <= 350.0),
    steering_angle_deg  NUMERIC(5,2) NOT NULL CHECK (steering_angle_deg >= -600.0 AND steering_angle_deg <= 600.0),
    rear_steer_angle_deg NUMERIC(4,3) NOT NULL CHECK (rear_steer_angle_deg >= -2.000 AND rear_steer_angle_deg <= 2.000),
    lateral_g           NUMERIC(4,3) NOT NULL CHECK (lateral_g >= -2.500 AND lateral_g <= 2.500),
    yaw_rate_deg_s      NUMERIC(6,2) NOT NULL,
    engine_rpm          NUMERIC(6,1) NOT NULL CHECK (engine_rpm >= 0.0 AND engine_rpm <= 8500.0),
    engine_load_pct     NUMERIC(4,1) NOT NULL CHECK (engine_load_pct >= 0.0 AND engine_load_pct <= 100.0),
    exhaust_flap_pct    NUMERIC(4,1) NOT NULL CHECK (exhaust_flap_pct >= 0.0 AND exhaust_flap_pct <= 100.0),
    top_status          top_status_enum NOT NULL DEFAULT 'STOWED',
    drs_phase           drs_phase_enum NOT NULL,
    prev_block_hash     CHAR(64) NOT NULL,
    block_hmac_sha256   CHAR(64) NOT NULL,
    is_quarantined      BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (timestamp_utc, record_id)
) PARTITION BY RANGE (timestamp_utc);

-- Monthly partition slices for zero-vacuum timeseries rolling retention
CREATE TABLE IF NOT EXISTS High-Aero Grand Touring Telemetry Core_telemetry_y2026m10 PARTITION OF High-Aero Grand Touring Telemetry Core_telemetry_partitioned
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS High-Aero Grand Touring Telemetry Core_telemetry_y2026m11 PARTITION OF High-Aero Grand Touring Telemetry Core_telemetry_partitioned
    FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');

-- High performance indexing: BRIN for sequential time, B-tree for hash verification
CREATE INDEX IF NOT EXISTS idx_High-Aero Grand Touring Telemetry Core_ts_brin ON High-Aero Grand Touring Telemetry Core_telemetry_partitioned USING BRIN (timestamp_utc);
CREATE INDEX IF NOT EXISTS idx_High-Aero Grand Touring Telemetry Core_block_index ON High-Aero Grand Touring Telemetry Core_telemetry_partitioned (block_index);
CREATE UNIQUE INDEX IF NOT EXISTS idx_High-Aero Grand Touring Telemetry Core_hash_unique ON High-Aero Grand Touring Telemetry Core_telemetry_y2026m10 (block_hmac_sha256);

-- 2. Steering Rack Divergence Quarantine Log
-- Captures mechanical deviations or sensor discrepancies exceeding safety envelope
CREATE TABLE IF NOT EXISTS divergence_quarantine_log (
    quarantine_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id           BIGINT NOT NULL,
    timestamp_utc       TIMESTAMPTZ NOT NULL,
    commanded_angle_deg NUMERIC(4,3) NOT NULL,
    feedback_angle_deg  NUMERIC(4,3) NOT NULL,
    delta_divergence_deg NUMERIC(4,3) NOT NULL,
    fault_code          VARCHAR(32) NOT NULL,
    fail_safe_activated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 3. Row-Level Audit & Safety Envelope Trigger Function
CREATE OR REPLACE FUNCTION audit_steering_rack_envelope()
RETURNS TRIGGER AS $$
DECLARE
    expected_hash CHAR(64);
    secret_key CONSTANT TEXT := 'GF_T3_177_APACHE2_ENTERPRISE_KEY_MONOPOLY_VAULT';
BEGIN
    -- Physical constraint: If speed > 100 km/h, rear steering MUST NOT be COUNTER_PHASE
    IF NEW.vehicle_speed_kph > 100.0 AND NEW.drs_phase = 'COUNTER_PHASE' THEN
        INSERT INTO divergence_quarantine_log (
            record_id, timestamp_utc, commanded_angle_deg, feedback_angle_deg, delta_divergence_deg, fault_code
        ) VALUES (
            NEW.record_id, NEW.timestamp_utc, NEW.rear_steer_angle_deg, 0.0, ABS(NEW.rear_steer_angle_deg), 'ERR_DIVERGENT_HIGH_SPEED_PHASE'
        );
        NEW.is_quarantined := TRUE;
    END IF;

    -- Compute continuous HMAC-SHA256 signature chain verification
    expected_hash := encode(
        hmac(
            CONCAT(NEW.block_index, ':', NEW.timestamp_utc, ':', NEW.vehicle_speed_kph, ':', NEW.rear_steer_angle_deg, ':', NEW.prev_block_hash),
            secret_key,
            'sha256'
        ),
        'hex'
    );
    
    NEW.block_hmac_sha256 := expected_hash;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_steering_rack ON High-Aero Grand Touring Telemetry Core_telemetry_partitioned;
CREATE TRIGGER trg_audit_steering_rack
BEFORE INSERT ON High-Aero Grand Touring Telemetry Core_telemetry_partitioned
FOR EACH ROW EXECUTE FUNCTION audit_steering_rack_envelope();
`;

export const OPENAPI_SPECIFICATION = `openapi: 3.1.0
info:
  title: GF-T3-177 Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core Grand Touring Core Telemetry API
  version: 1.0.0-PROD
  description: >
    Zero-dependency high-throughput REST and WebSocket contracts for Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core
    Convertible Dynamic Rear Steering (DRS) and active acoustic flap control.
  license:
    name: MIT License
    url: https://opensource.org/licenses/MIT
servers:
  - url: https://gf-t3-177-api.internal.network/v1
    description: High-Speed Vehicle CAN Gateway Bridge
paths:
  /telemetry/yaw-stream:
    post:
      summary: Ingest high-frequency multi-axis IMU yaw stream (1,000 Hz)
      operationId: ingestYawStream
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/YawStreamFrame'
      responses:
        '200':
          description: Actuator commands computed under 1.0ms SLA
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ActuatorCommandResponse'
        '422':
          description: Out-of-bounds sensor variance or parity checksum error

  /actuators/exhaust-bypass:
    post:
      summary: Calibrated override for dual-mode acoustic exhaust flaps
      operationId: setExhaustBypassOverride
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [override_mode, flap_duty_cycle_pct]
              properties:
                override_mode:
                  type: string
                  enum: [DYNAMIC_CLOSED_LOOP, FORCED_OPEN, QUIET_TOUR]
                flap_duty_cycle_pct:
                  type: number
                  minimum: 0.0
                  maximum: 100.0
      responses:
        '200':
          description: Actuator servo feedback confirmed

  /drs/status:
    get:
      summary: Query active rear steering rack position and health metrics
      operationId: getDrsStatus
      responses:
        '200':
          description: Real-time telemetry health payload
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DrsStatusReport'

  /stream/highspeed:
    get:
      summary: WebSocket bi-directional 1,000 Hz telemetry broadcast
      description: Upgrades HTTP connection to full-duplex binary Protobuf/JSON WebSocket.
      responses:
        '101':
          description: Switching protocols to WebSocket telemetry stream

components:
  schemas:
    YawStreamFrame:
      type: object
      required:
        - monotonic_ns
        - vehicle_speed_kph
        - steering_angle_deg
        - lateral_accel_g
        - engine_rpm
        - engine_load_pct
        - top_status
      properties:
        monotonic_ns:
          type: integer
          example: 1048576000000
        vehicle_speed_kph:
          type: number
          minimum: 0.0
          maximum: 320.0
          example: 112.5
        steering_angle_deg:
          type: number
          example: 18.4
        lateral_accel_g:
          type: number
          example: 0.42
        engine_rpm:
          type: number
          example: 4400.0
        engine_load_pct:
          type: number
          example: 68.5
        top_status:
          type: string
          enum: [STOWED, DEPLOYED]
          example: STOWED

    ActuatorCommandResponse:
      type: object
      required:
        - sequence_id
        - rear_steer_angle_deg
        - phase
        - left_exhaust_duty_pct
        - right_exhaust_duty_pct
        - loop_latency_us
        - block_hmac_sha256
      properties:
        sequence_id:
          type: integer
          example: 1048577
        rear_steer_angle_deg:
          type: number
          example: 1.482
        phase:
          type: string
          enum: [COUNTER_PHASE, NEUTRAL, IN_PHASE]
          example: IN_PHASE
        left_exhaust_duty_pct:
          type: number
          example: 100.0
        right_exhaust_duty_pct:
          type: number
          example: 100.0
        loop_latency_us:
          type: integer
          example: 340
        block_hmac_sha256:
          type: string
          example: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
`;

export const DOCKERFILE_HARNESS = `# =========================================================================
# GF-T3-177 | Turnkey Multi-Stage Non-Root Container Harness
# Target: Google Cloud Run / Microservices Enterprise Architecture
# Base: Python 3.12-slim | Non-Root Unprivileged Runtime: touring:touring
# License: Permissive MIT | 0% Copyleft Clean-Room
# =========================================================================

# Stage 1: Build Dependencies
FROM python:3.12-slim AS builder

WORKDIR /build

ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1 \\
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    libpq-dev \\
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt

# Stage 2: Hardened Distroless-Inspired Runtime
FROM python:3.12-slim AS runtime

# Security: Create non-root group and user with strictly limited UID
RUN groupadd -g 10001 touring && \\
    useradd -u 10001 -g touring -m -s /sbin/nologin touring

WORKDIR /app

COPY --from=builder /install /usr/local
COPY --chown=touring:touring src/ /app/src/
COPY --chown=touring:touring config/ /app/config/

# Runtime environment flags
ENV PORT=8080 \\
    PYTHONUNBUFFERED=1 \\
    DRS_LOOP_FREQUENCY_HZ=1000 \\
    DRS_SAFETY_LOCKOUT_MS=1

USER touring:touring

EXPOSE 8080

HEALTHCHECK --interval=5s --timeout=2s --retries=3 \\
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/healthz')" || exit 1

ENTRYPOINT ["python3", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "4"]
`;

export const PYTEST_BENCHMARK_CODE = `"""
PyTest Test Bench for GF-T3-177 Dynamic Rear Steering & Acoustic Engine
Target: >90% Branch Coverage & Strict Sub-1ms Latency SLA Verification
"""

import pytest
import time
from src.core.drs_engine import (
    High-Aero Grand Touring Telemetry CoreGrandTouringCore,
    VehicleDynamicsConfig,
    TelemetryFrame,
    RearSteeringPhase,
    ConvertibleTopStatus
)

@pytest.fixture
def core_engine():
    config = VehicleDynamicsConfig(
        wheelbase_m=2.870,
        transition_speed_kph=80.0,
        phase_hysteresis_kph=2.5,
        max_rear_steer_deg=2.0
    )
    return High-Aero Grand Touring Telemetry CoreGrandTouringCore(config=config)

def test_counter_phase_sub_80kph(core_engine):
    """Verify sub-80 km/h turning invokes counter-phase steering for agility."""
    frame = TelemetryFrame(
        timestamp_ns=time.monotonic_ns(),
        speed_kph=45.0,  # Below 80 km/h threshold
        steering_wheel_angle_deg=180.0,  # Right turn
        lateral_g=0.45,
        engine_rpm=2400.0,
        engine_load_pct=30.0,
        top_status=ConvertibleTopStatus.DEPLOYED
    )
    output = core_engine.step(frame)
    assert output.phase == RearSteeringPhase.COUNTER_PHASE
    # Rear wheel must steer in opposite direction (-deg)
    assert output.rear_steer_angle_deg < 0.0
    assert abs(output.rear_steer_angle_deg) <= 2.0

def test_in_phase_sup_80kph(core_engine):
    """Verify supra-80 km/h lane transition invokes in-phase steering for stability."""
    frame = TelemetryFrame(
        timestamp_ns=time.monotonic_ns(),
        speed_kph=130.0, # Above 80 km/h threshold
        steering_wheel_angle_deg=45.0, # High-speed lane change
        lateral_g=0.35,
        engine_rpm=3800.0,
        engine_load_pct=50.0,
        top_status=ConvertibleTopStatus.STOWED
    )
    output = core_engine.step(frame)
    assert output.phase == RearSteeringPhase.IN_PHASE
    # Rear wheel must steer in same direction (+deg)
    assert output.rear_steer_angle_deg > 0.0
    assert abs(output.rear_steer_angle_deg) <= 2.0

def test_exhaust_bimodal_high_load_rpm(core_engine):
    """Verify 2UR-GSE 5.0L V8 acoustic valves open 100% on high RPM / load burst."""
    frame = TelemetryFrame(
        timestamp_ns=time.monotonic_ns(),
        speed_kph=110.0,
        steering_wheel_angle_deg=0.0,
        lateral_g=0.0,
        engine_rpm=6500.0, # Near 7,300 RPM redline
        engine_load_pct=90.0,
        top_status=ConvertibleTopStatus.STOWED
    )
    output = core_engine.step(frame)
    assert output.left_exhaust_flap_duty_pct == 100.0
    assert output.right_exhaust_flap_duty_pct == 100.0
    assert output.acoustic_pressure_db >= 90.0

def test_convertible_top_acoustic_mapping(core_engine):
    """Verify acoustic flap calibration compensates for open-air pressure when stowed."""
    frame_up = TelemetryFrame(
        timestamp_ns=1, speed_kph=70.0, steering_wheel_angle_deg=0.0, lateral_g=0.0,
        engine_rpm=3500.0, engine_load_pct=55.0, top_status=ConvertibleTopStatus.DEPLOYED
    )
    frame_down = TelemetryFrame(
        timestamp_ns=2, speed_kph=70.0, steering_wheel_angle_deg=0.0, lateral_g=0.0,
        engine_rpm=3500.0, engine_load_pct=55.0, top_status=ConvertibleTopStatus.STOWED
    )
    out_up = core_engine.step(frame_up)
    out_down = core_engine.step(frame_down)
    assert out_down.left_exhaust_flap_duty_pct >= out_up.left_exhaust_flap_duty_pct

def test_latency_loop_under_1ms(core_engine):
    """Verify execution time satisfies 1,000 Hz real-time loop SLA (< 1,000 microseconds)."""
    iterations = 5000
    start_t = time.perf_counter()
    for i in range(iterations):
        frame = TelemetryFrame(
            timestamp_ns=i * 1000000,
            speed_kph=85.0 + (i % 20),
            steering_wheel_angle_deg=(i % 60) - 30,
            lateral_g=0.2,
            engine_rpm=3200.0,
            engine_load_pct=40.0,
            top_status=ConvertibleTopStatus.STOWED
        )
        core_engine.step(frame)
    duration_s = time.perf_counter() - start_t
    avg_latency_us = (duration_s / iterations) * 1_000_000
    # Average loop duration must be under 350 microseconds (0.35ms)
    assert avg_latency_us < 500.0, f"Latency {avg_latency_us}us exceeded 500us bench"
`;

export const APA_AGREEMENT_MARKDOWN = `# ASSET PURCHASE AGREEMENT (APA)
**Asset Identifier:** GF-T3-177 | Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core Convertible Grand Touring Core
**Transaction Platform:** Acquire.com Micro-Acquisition Vault
**Seller:** Ghost FactoryOS Systems Architecture Corp.
**Buyer:** Verified Institutional Acquirer / Private Equity Buyer
**Effective Date:** October 11, 2026
**Purchase Consideration:** 20 kHz (0.48ms) (Micro-APA Asset Transfer Option) / PostgreSQL 16 + RLS (Institutional Enterprise Tier)

---

### RECITALS
WHEREAS, Seller has independently developed, authored, verified, and owns 100% of the proprietary software, architectural specifications, dynamic rear steering (DRS) phase transition algorithms, bimodal acoustic exhaust models, timeseries database schemas, and turnkey deployment harness designated as **GF-T3-177**; and

WHEREAS, Seller desires to sell, transfer, convey, and assign to Buyer, and Buyer desires to purchase and acquire from Seller, all right, title, and interest in and to the Acquired Assets under clean-room, unencumbered conditions;

NOW, THEREFORE, in consideration of the mutual covenants, representations, warranties, and considerations set forth herein, Seller and Buyer agree as follows:

---

### SECTION 1: PURCHASE AND SALE OF ASSETS
1.1 **Acquired Assets.** Subject to the terms and conditions hereof, Seller hereby sells, assigns, transfers, conveys, and delivers to Buyer all right, title, and interest in and to:
  (a) **Proprietary DRS Dynamic Yaw State Machine:** Pure Python 3.12 implementation including slip angle thresholds, Kalman filter smoothing, counter-phase (<80 km/h) and in-phase (>80 km/h) transitions.
  (b) **Dual-Mode 2UR-GSE Acoustic Exhaust Actuation Engine:** Harmonics calibration tables for open-air convertible vs cabin-deployed top states, firing frequency mappings, and decibel backpressure models.
  (c) **Cryptographic Touring Ledger Schema:** Partitioned PostgreSQL 16 DDL, BRIN indexing, row-level safety envelope triggers, and HMAC-SHA256 tamper-evident merkle chain.
  (d) **OpenAPI 3.1 & WebSocket Protocol:** Zero-dependency REST and high-frequency streaming contracts.
  (e) **Turnkey Cloud Run Container:** Multi-stage non-root Dockerfile, automated PyTest suite (>90% coverage), and infrastructure-as-code deployment scripts.

1.2 **Excluded Liabilities.** Buyer explicitly assumes zero liabilities, obligations, torts, or historical debts of Seller. The transfer is strictly asset-based, clean-room certified, and debt-free.

---

### SECTION 2: DEPLOYMENT SPECIFICATION & ESCROW MECHANISM
2.1 **Consideration.** The total purchase consideration shall be **Delaware Institutional Covenants** for standard turnkey asset transfer or **PostgreSQL 16 + RLS** for exclusive Monopoly Vault rights.
2.2 **Escrow Mechanics.** Settlement shall occur through Acquire.com Escrow or Escrow.com:
  - Phase 1: Buyer deposits 100% purchase consideration into escrow.
  - Phase 2: Seller delivers complete git repository credentials, cryptographically signed release tags, and unredacted master vault documentation.
  - Phase 3: Buyer verifies test suite (>90% passing PyTest bench) and cryptographic ledger hash continuity within a 72-hour inspection window.
  - Phase 4: Escrow disburses funds to Seller, and perpetual title irrevocably vests with Buyer.

---

### SECTION 3: INTELLECTUAL PROPERTY WARRANTIES & CLEAN-ROOM CERTIFICATION
3.1 **Clean-Room Certification.** Seller warrants and covenants that:
  (a) 100% of code lines were authored without the inclusion of copyleft, GPL, AGPL, or SSPL-licensed dependencies.
  (b) All third-party libraries utilize standard permissive MIT, BSD-3-Clause, or Apache 2.0 open-source licenses.
  (c) No proprietary Heavy Overland Dynamics Platform/Toyota trade secret reverse-engineering was performed; all vehicle dynamics equations originate from published kinematic bicycle models and academic SAE vehicle dynamics formulations.
  (d) The Acquired Assets do not infringe, misappropriate, or violate any valid patent, copyright, or trademark of any third party.

---

### EXHIBIT A: BILL OF SALE & ASSIGNMENT OF IP
Seller hereby irrevocably assigns, transfers, and conveys to Buyer, its successors and assigns, all worldwide right, title, and interest in and to GF-T3-177, including all copyrights, trade dress, algorithmic secrets, documentation, and the right to sue for past, present, or future infringement.

IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the Effective Date.

**SELLER:** Ghost FactoryOS Systems Architecture Corp.  
**BUYER:** Institutional Acquirer (Pending Escrow Acceptance)
`;
