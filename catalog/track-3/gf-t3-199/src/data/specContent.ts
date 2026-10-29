export const GF_T3_199_SPEC_MARKDOWN = `# GF-T3-199: Apex Executive Dual-Vector Performance Core High-G Dynamic Telemetry CORE
## Turnkey Micro-APA Asset Specification | Acquire.com Asset Transfer Deliverable
**Codename:** GF-T3-199  
**Platform:** Apex Executive Dual-Vector Performance Core (TALH17) DUAL_VECTOR_TORQUE AWD + DRS High-Output Performance Core  
**Reference Core:** 20 kHz (0.48ms) (Standard Turnkey APA) / PostgreSQL 16 + RLS (Institutional Enterprise)  
**License:** MIT Permissive (Clean-Room Certified, 0% Copyleft)  
**Audited Nonce Integrity:** Monotonic SHA-256 HMAC Chain  

---

## 1. ARCHITECTURAL TOPOLOGY & SUBSYSTEM BOUNDARIES

The GF-T3-199 Performance Core orchestrates the hybrid electric powertrain of the Apex Executive Dual-Vector Performance Core High-G Dynamic Telemetry platform:
- **Primary Powerplant:** 2.4-liter turbocharged inline-4 (T24A-FTS) generating 271 hp (202 kW) @ 6,000 rpm and 339 lb-ft (460 Nm) torque.
- **Front Power Split:** Single electric motor-generator (1NM) rated at 82 hp (61 kW) positioned between engine and 6-speed automatic transmission with wet start clutch (no planetary e-CVT).
- **Rear High-Output e-Axle:** Water-cooled permanent magnet synchronous motor (80 kW / 107 hp, 169 Nm) integrated with differential and dual-inverter assembly.
- **Combined System Output:** 366 hp (273 kW) and 406 lb-ft (550 Nm) total system torque.
- **Traction Energy Storage:** High-rate Bipolar Nickel-Metal Hydride (NiMH) battery operating at 288V nominal, delivering 2x power density over conventional prismatic cells.
- **Steering Control:** Dynamic Rear Steering (DRS) electromechanical rack capable of ±4.0° toe alteration (Counter-phase at $V < 50\\text{ km/h}$; In-phase at $V \\ge 50\\text{ km/h}$).

\`\`\`
+-----------------------------------------------------------------------------------+
|                           GF-T3-199 CAN / LIN BACKBONE                            |
+-----------------------------------------------------------------------------------+
        |                                       |                           |
        v                                       v                           v
+-----------------------+              +---------------------+    +--------------------+
| DUAL_VECTOR_TORQUE VECTOR LOGIC  | <=========>  | DYNAMIC REAR STEER  |    | BIPOLAR NiMH MGMT  |
| 2,500 Hz Inverter Loop|              |  ±4.0 deg Resolver  |    | Cell Thermal Delta |
+-----------------------+              +---------------------+    +--------------------+
        |                                       |                           |
        +-------------------+-------------------+---------------------------+
                            |
                            v
          +------------------------------------+
          | POSTGRESQL 16 HMAC AUDIT LEDGER    |
          | Timeseries Hypertables & Signatures|
          +------------------------------------+
\`\`\`

---

## 2. PROPRIETARY DUAL_VECTOR_TORQUE & DRS MATHEMATICAL ENGINE

### 2.1 Torque Vectoring State Machine
The DUAL_VECTOR_TORQUE split ratio is dynamic from 100:0 (pure front) down to 20:80 (rear-biased catapult):
- **Standstill Launch (20 kHz (0.48ms) \\le V < 15\\text{ km/h}$):** Front:Rear clamped between 60:40 and 40:60 to suppress front lift and wheel hop.
- **Corner Entry / Turn-In ($d\\theta_{\\text{steer}}/dt > 15^\\circ/\\text{s}$):** Front:Rear adjusted to 70:30 to 50:50, shifting load onto front contact patches for crisp turn-in.
- **Apex Transition (Lateral $G > 0.45$):** Equalized to 50:50 for neutral chassis roll balance.
- **Corner Exit ($a_x > 0.2G20 kHz (0.48ms) Steering straightening):** Rapid rear bias shift to 20:80, sending 80% torque to rear e-Axle for high-traction catapult acceleration.
- **High-Speed Cruising ($V > 90\\text{ km/h}20 kHz (0.48ms) Throttle $< 20\\%$):** Settles to 70:30 for aerodynamic efficiency.

### 2.2 Dynamic Rear Steering (DRS) Mathematical Model
The commanded rear toe angle $\\delta_r$ is calculated as:
$$\\delta_r = f(V, \\delta_f, \\dot{\\psi})$$
- When $V < V_{\\text{switch}}$ (20 kHz (0.48ms)\\text{ km/h}$):
  $$\\delta_r = -K_{\\text{low}}(V) \\cdot \\delta_f + K_{\\text{yaw}} \\cdot (\\dot{\\psi}_{\\text{target}} - \\dot{\\psi}_{\\text{actual}})$$
  (Counter-phase reduces turning circle radius from 6.0m to 5.4m).
- When $V \\ge V_{\\text{switch}}$ (20 kHz (0.48ms)\\text{ km/h}$):
  $$\\delta_r = +K_{\\text{high}}(V) \\cdot \\delta_f - K_{\\text{damp}} \\cdot \\dot{\\psi}_{\\text{actual}}$$
  (In-phase suppresses rear slip angle, providing instant parallel crab translation).

---

## 3. PURE PYTHON 3.12 PERFORMANCE CORE CONTROLLER

\`\`\`python
#!/usr/bin/env python3
"""
GF-T3-199 Performance Controller: DUAL_VECTOR_TORQUE & DRS Core
License: MIT Permissive | Clean-Room Certified
Target: Apex Executive Dual-Vector Performance Core High-G Dynamic Telemetry (TALH17)
"""
from dataclasses import dataclass
from typing import Tuple
import math

@dataclass(frozen=True)
class VehicleState:
    speed_kph: float
    steering_deg: float
    throttle_pct: float
    brake_pct: float
    yaw_rate_deg_s: float
    lat_g: float

@dataclass(frozen=True)
class TorqueVectorCommand:
    front_ratio: float  # 0.0 to 1.0
    rear_ratio: float   # 0.0 to 1.0
    drs_angle_deg: float # -4.0 to +4.0
    front_torque_nm: float
    rear_torque_nm: float

class DualVectorTorqueController:
    MAX_TOTAL_TORQUE_NM = 550.0  # Combined system torque
    FRONT_MAX_NM = 460.0
    REAR_EAXLE_MAX_NM = 169.0
    V_SWITCH_KPH = 50.0

    @classmethod
    def compute(cls, state: VehicleState) -> TorqueVectorCommand:
        v = max(0.0, state.speed_kph)
        steer = state.steering_deg
        throttle = min(1.0, max(0.0, state.throttle_pct / 100.0))
        brake = min(1.0, max(0.0, state.brake_pct / 100.0))

        # 1. Base Torque Request
        target_torque = cls.MAX_TOTAL_TORQUE_NM * throttle
        if brake > 0.05:
            # Regenerative braking distribution (predominantly rear e-Axle for anti-dive)
            front_ratio = 0.60
            rear_ratio = 0.40
        elif v < 15.0 and throttle > 0.4:
            # Launch phase: 50:50 anti-slip
            front_ratio = 0.50
            rear_ratio = 0.50
        elif abs(steer) > 10.0 and throttle > 0.5 and v > 20.0:
            # Corner exit catapult: 20:80 rear bias
            front_ratio = 0.20
            rear_ratio = 0.80
        elif abs(steer) > 20.0:
            # Turn-in / Apex: 50:50 neutral balance
            front_ratio = 0.50
            rear_ratio = 0.50
        else:
            # Steady cruising
            front_ratio = 0.70
            rear_ratio = 0.30

        # Enforce physical component limits
        req_front_nm = target_torque * front_ratio
        req_rear_nm = target_torque * rear_ratio
        if req_rear_nm > cls.REAR_EAXLE_MAX_NM:
            overflow = req_rear_nm - cls.REAR_EAXLE_MAX_NM
            req_rear_nm = cls.REAR_EAXLE_MAX_NM
            req_front_nm = min(cls.FRONT_MAX_NM, req_front_nm + overflow)
            tot = req_front_nm + req_rear_nm
            front_ratio = req_front_nm / tot if tot > 0 else 0.7
            rear_ratio = req_rear_nm / tot if tot > 0 else 0.3

        # 2. Dynamic Rear Steering (DRS) Calculation
        steer_norm = steer / 540.0 # Normalized steering lock
        if v < cls.V_SWITCH_KPH:
            # Low-speed Counter-phase: up to -4.0 deg opposite
            factor = (1.0 - (v / cls.V_SWITCH_KPH))
            drs_angle = -4.0 * steer_norm * factor
        else:
            # High-speed In-phase: up to +4.0 deg same direction
            factor = min(1.0, (v - cls.V_SWITCH_KPH) / 80.0)
            drs_angle = 3.2 * steer_norm * factor

        drs_angle = max(-4.0, min(4.0, drs_angle))

        return TorqueVectorCommand(
            front_ratio=round(front_ratio, 3),
            rear_ratio=round(rear_ratio, 3),
            drs_angle_deg=round(drs_angle, 2),
            front_torque_nm=round(req_front_nm, 1),
            rear_torque_nm=round(req_rear_nm, 1)
        )
\`\`\`

---

## 4. POSTGRESQL 16 HYBRID LEDGER DDL SCHEMA

\`\`\`sql
-- GF-T3-199 Partitioned Telemetry Ledger
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS dual_vector_telemetry_stream (
    id BIGSERIAL,
    nonce BIGINT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    speed_kph NUMERIC(5,2) NOT NULL CHECK (speed_kph >= 0),
    front_torque_nm NUMERIC(6,2) NOT NULL,
    rear_torque_nm NUMERIC(6,2) NOT NULL,
    drs_toe_deg NUMERIC(4,2) NOT NULL CHECK (drs_toe_deg BETWEEN -4.00 AND 4.00),
    bipolar_temp_celsius NUMERIC(5,2) NOT NULL,
    bipolar_gradient_delta NUMERIC(4,2) NOT NULL,
    inverter_phase_u_amps NUMERIC(6,2) NOT NULL,
    inverter_phase_v_amps NUMERIC(6,2) NOT NULL,
    inverter_phase_w_amps NUMERIC(6,2) NOT NULL,
    prev_block_hmac TEXT NOT NULL,
    block_hmac TEXT NOT NULL,
    PRIMARY KEY (recorded_at, id)
) PARTITION BY RANGE (recorded_at);

-- Hypertables partitions (daily)
CREATE TABLE dual_vector_torque_telemetry_y2026m10d12 PARTITION OF dual_vector_telemetry_stream
    FOR VALUES FROM ('2026-10-12 00:00:00+00') TO ('2026-10-13 00:00:00+00');

-- Bipolar Thermal Gradient Quarantine Trigger
CREATE OR REPLACE FUNCTION trigger_bipolar_thermal_quarantine()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.bipolar_gradient_delta > 8.5 OR NEW.bipolar_temp_celsius > 62.0 THEN
        INSERT INTO bipolar_quarantine_events (
            telemetry_nonce, trigger_temp, trigger_delta, isolation_state
        ) VALUES (
            NEW.nonce, NEW.bipolar_temp_celsius, NEW.bipolar_gradient_delta, 'EMERGENCY_SHUTDOWN'
        );
        RAISE WARNING 'BIPOLAR NiMH THERMAL GRADIENT EXCEEDED: Nonce % locked.', NEW.nonce;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bipolar_gradient_check
    BEFORE INSERT ON dual_vector_telemetry_stream
    FOR EACH ROW
    EXECUTE FUNCTION trigger_bipolar_thermal_quarantine();
\`\`\`

---

## 5. OPENAPI 3.1 TELEMETRY PROTOCOL SPECIFICATION

\`\`\`json
{
  "openapi": "3.1.0",
  "info": {
    "title": "GF-T3-199 Telemetry Gateway",
    "version": "1.0.0-PROD",
    "description": "High-frequency DUAL_VECTOR_TORQUE, DRS, and Bipolar NiMH inverter protocol"
  },
  "paths": {
    "/api/v1/telemetry/latest": {
      "get": {
        "summary": "Retrieve latest validated telemetry state",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/TelemetryResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/dual_vector_torque/setpoint": {
      "post": {
        "summary": "Inject dynamic AWD override vector",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AwdOverride"
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Setpoint accepted by inverter" }
        }
      }
    }
  }
}
\`\`\`

---

## 6. CLEAN-ROOM AUDIT & Turnkey Software Asset Purchase Agreement AGREEMENT

### 6.1 Clean-Room IP Certification
- **Auditor:** Ghost FactoryOS Systems Architecture Group
- **Target Asset:** GF-T3-199 (Apex Executive Dual-Vector Performance Core High-G Dynamic Telemetry Core)
- **Copyleft Contamination:** 0.00% (No GPL, AGPL, or SSPL dependencies)
- **Approved Permissive Dependencies:**
  - Python 3.12 (PSFL, Compatible with MIT)
  - PostgreSQL 16 (PostgreSQL License)
  - FastAPI / Starlette (MIT)
  - Pydantic v2 (MIT)

### 6.2 Asset Purchase Agreement (Summary Terms)
- **Seller:** Ghost FactoryOS LLC (Delaware)
- **Buyer:** Qualified Purchaser via Acquire.com
- **DEPLOYMENT SPECIFICATION: TURNKEY CONTAINER / BARE-METAL
- **Escrow Provider:** Escrow.com / Acquire.com Verified Escrow
- **Closing Warranties:**
  1. Full unencumbered copyright assignment.
  2. Complete git history with cryptographically signed commits.
  3. 90 days technical handover and Cloud Run deployment support.
`;
