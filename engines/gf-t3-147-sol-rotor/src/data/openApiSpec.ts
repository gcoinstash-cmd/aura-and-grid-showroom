/**
 * Ghost FactoryOS Track 3 (F1 Skunkworks Engine)
 * Asset GF-T3-147: Sol-Rotor Autonomous Heavy-Lift eVTOL & Swarm Flight Telemetry Engine
 * 
 * Production OpenAPI 3.1.0 Specification (OPENAPI_SPEC.json)
 */

export const OPENAPI_SPEC_JSON = {
  "openapi": "3.1.0",
  "info": {
    "title": "Ghost FactoryOS GF-T3-147: Sol-Rotor Autonomous Heavy-Lift eVTOL Flight Engine API",
    "version": "1.0.0-MONOPOLY-T3",
    "description": "High-throughput, sub-5ms low-latency gRPC/HTTP-2 REST interface for real-time 6-DOF flight state estimation, BEM aerodynamic allocation, distributed swarm consensus synchronization, and fail-safe actuator control.",
    "contact": {
      "name": "Ghost FactoryOS Autonomy Labs",
      "email": "telemetry-eng@ghostfactoryos.internal",
      "url": "https://ghostfactoryos.internal/skunkworks/gf-t3-147"
    },
    "license": {
      "name": "Proprietary Enterprise Fleet Asset License (GF-T3-147)",
      "url": "https://ghostfactoryos.internal/legal/enterprise-apa"
    }
  },
  "servers": [
    {
      "url": "https://avionics.gf-t3-147.internal/api/v1",
      "description": "Onboard Dual-Redundant Flight Management Computer (FMC-Primary)"
    },
    {
      "url": "https://swarm-relay.ground.internal/api/v1",
      "description": "Ground Control Station (GCS) Swarm Telemetry Hub"
    }
  ],
  "paths": {
    "/flight/state/update": {
      "post": {
        "summary": "High-Frequency 6-DOF Inertial Sensor & State Vector Ingestion",
        "description": "Consumes 100Hz fused IMU, dual RTK-GPS, barometric altimeter, radar AGL, and nacelle angle resolver data. Computes state estimation variance and updates the primary flight state vector.",
        "operationId": "updateFlightState",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/FlightStateUpdateRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "6-DOF State filtered and attitude quaternion validated.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/FlightStateResponse"
                }
              }
            }
          },
          "400": {
            "description": "Invalid sensor vector or non-normalized quaternion.",
            "content": {
              "application/problem+json": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              }
            }
          }
        }
      }
    },
    "/control/attitude/compute": {
      "post": {
        "summary": "Nonlinear Dynamic Inversion (NDI) Inner-Loop Attitude & Control Allocation",
        "description": "Calculates closed-loop actuator PWM duty cycles, rotor RPM setpoints, and tilting nacelle rates under active aerodynamic disturbances (crosswind, microburst, BEM inflow).",
        "operationId": "computeAttitudeControl",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ControlAttitudeComputeRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Actuator control allocation computed within the < 4.5ms threshold.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ControlAttitudeResponse"
                }
              }
            }
          }
        }
      }
    },
    "/swarm/consensus/sync": {
      "post": {
        "summary": "Distributed Swarm Consensus Epoch & RVO Collision Sync",
        "description": "Performs Laplacian graph consensus across active peer airframes, calculates potential-field separation gradients, and resolves Reciprocal Velocity Obstacles (RVO).",
        "operationId": "syncSwarmConsensus",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/SwarmSyncRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Swarm consensus epoch synchronized with collision avoidance margins.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SwarmSyncResponse"
                }
              }
            }
          }
        }
      }
    },
    "/actuators/reallocate": {
      "post": {
        "summary": "Emergency Actuator Thrust Re-allocation on Rotor/ESC Failure",
        "description": "Reconfigures control matrix pseudo-inverse B^+ in real-time when one or more rotors fail, maintaining 6-DOF hover stability.",
        "operationId": "reallocateActuators",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ActuatorReallocateRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Emergency thrust reallocation matrix applied.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ActuatorReallocateResponse"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Vector3D": {
        "type": "object",
        "required": ["x", "y", "z"],
        "properties": {
          "x": { "type": "number", "description": "Longitudinal component [m or m/s or N]" },
          "y": { "type": "number", "description": "Lateral component [m or m/s or N]" },
          "z": { "type": "number", "description": "Vertical/Normal component [m or m/s or N]" }
        }
      },
      "Quaternion": {
        "type": "object",
        "required": ["w", "x", "y", "z"],
        "properties": {
          "w": { "type": "number", "minimum": -1.0, "maximum": 1.0 },
          "x": { "type": "number", "minimum": -1.0, "maximum": 1.0 },
          "y": { "type": "number", "minimum": -1.0, "maximum": 1.0 },
          "z": { "type": "number", "minimum": -1.0, "maximum": 1.0 }
        }
      },
      "FlightStateUpdateRequest": {
        "type": "object",
        "required": ["airframe_id", "timestamp_ns", "imu_accel", "imu_gyro", "gps_pos", "nacelle_angle_deg"],
        "properties": {
          "airframe_id": { "type": "string", "example": "GF-T3-147" },
          "timestamp_ns": { "type": "integer", "example": 1791244800000000000 },
          "imu_accel": { "$ref": "#/components/schemas/Vector3D" },
          "imu_gyro": { "$ref": "#/components/schemas/Vector3D" },
          "gps_pos": { "$ref": "#/components/schemas/Vector3D" },
          "baro_alt_m": { "type": "number", "example": 450.2 },
          "radar_alt_agl_m": { "type": "number", "example": 448.5 },
          "nacelle_angle_deg": { "type": "number", "minimum": 0, "maximum": 90, "example": 45.0 }
        }
      },
      "FlightStateResponse": {
        "type": "object",
        "required": ["status", "airframe_id", "quaternion", "euler_deg", "airspeed_kts", "vsi_mps", "ndi_latency_ms", "vrs_risk"],
        "properties": {
          "status": { "type": "string", "example": "STATE_ESTIMATED" },
          "airframe_id": { "type": "string", "example": "GF-T3-147" },
          "quaternion": { "$ref": "#/components/schemas/Quaternion" },
          "euler_deg": {
            "type": "object",
            "properties": {
              "roll": { "type": "number", "example": 0.8 },
              "pitch": { "type": "number", "example": 3.6 },
              "yaw": { "type": "number", "example": 85.0 }
            }
          },
          "airspeed_kts": { "type": "number", "example": 82.5 },
          "vsi_mps": { "type": "number", "example": 1.2 },
          "ndi_latency_ms": { "type": "number", "example": 4.02 },
          "vrs_risk": { "type": "string", "enum": ["NONE", "CAUTION", "CRITICAL"], "example": "NONE" },
          "block_hash_sha256": { "type": "string", "example": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" }
        }
      },
      "ControlAttitudeComputeRequest": {
        "type": "object",
        "required": ["airframe_id", "target_trajectory", "current_state", "nacelle_target_deg"],
        "properties": {
          "airframe_id": { "type": "string", "example": "GF-T3-147" },
          "target_trajectory": {
            "type": "object",
            "properties": {
              "roll_cmd_deg": { "type": "number", "example": 0.0 },
              "pitch_cmd_deg": { "type": "number", "example": 5.0 },
              "yaw_cmd_deg": { "type": "number", "example": 90.0 },
              "target_altitude_m": { "type": "number", "example": 500.0 }
            }
          },
          "nacelle_target_deg": { "type": "number", "minimum": 0, "maximum": 90, "example": 60.0 }
        }
      },
      "ControlAttitudeResponse": {
        "type": "object",
        "required": ["calculation_time_ms", "rotors_rpm", "total_thrust_kn", "ndi_budget_ok"],
        "properties": {
          "calculation_time_ms": { "type": "number", "example": 3.94 },
          "ndi_budget_ok": { "type": "boolean", "example": true },
          "total_thrust_kn": { "type": "number", "example": 39.8 },
          "rotors_rpm": {
            "type": "array",
            "items": { "type": "number" },
            "example": [1850, 1850, 1850, 1850, 1720, 1720, 1720, 1720]
          },
          "aerodynamic_inflow_bem_vi_mps": { "type": "number", "example": 9.2 }
        }
      },
      "SwarmSyncRequest": {
        "type": "object",
        "required": ["swarm_id", "formation_pattern", "ego_state", "peer_beacons"],
        "properties": {
          "swarm_id": { "type": "string", "example": "SWARM-GF-ALPHA-770" },
          "formation_pattern": { "type": "string", "example": "TACTICAL_DIAMOND" },
          "target_spacing_m": { "type": "number", "example": 45.0 }
        }
      },
      "SwarmSyncResponse": {
        "type": "object",
        "required": ["consensus_epoch_ns", "algebraic_connectivity_lambda2", "mean_latency_ms", "formation_rms_error_m", "collision_warnings"],
        "properties": {
          "consensus_epoch_ns": { "type": "integer", "example": 1791244800100000000 },
          "algebraic_connectivity_lambda2": { "type": "number", "example": 1.84 },
          "mean_latency_ms": { "type": "number", "example": 2.8 },
          "formation_rms_error_m": { "type": "number", "example": 1.45 },
          "collision_warnings": { "type": "integer", "example": 0 }
        }
      },
      "ActuatorReallocateRequest": {
        "type": "object",
        "required": ["airframe_id", "failed_rotor_id"],
        "properties": {
          "airframe_id": { "type": "string", "example": "GF-T3-147" },
          "failed_rotor_id": { "type": "integer", "minimum": 1, "maximum": 8, "example": 3 }
        }
      },
      "ActuatorReallocateResponse": {
        "type": "object",
        "required": ["reallocation_success", "active_rotors_count", "ndi_thrust_margin_pct", "safe_flight_envelope_maintained"],
        "properties": {
          "reallocation_success": { "type": "boolean", "example": true },
          "active_rotors_count": { "type": "integer", "example": 7 },
          "ndi_thrust_margin_pct": { "type": "number", "example": 24.5 },
          "safe_flight_envelope_maintained": { "type": "boolean", "example": true }
        }
      },
      "ProblemDetails": {
        "type": "object",
        "required": ["type", "title", "status", "detail"],
        "properties": {
          "type": { "type": "string", "example": "https://errors.gf-t3-147.internal/invalid-state" },
          "title": { "type": "string", "example": "Sensor Ingestion Anomaly" },
          "status": { "type": "integer", "example": 400 },
          "detail": { "type": "string", "example": "Attitude quaternion norm deviated beyond 1.0 +/- 0.01 tolerance." }
        }
      }
    }
  }
};
