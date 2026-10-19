/**
 * Vanguard-ECLSS: Autonomous Closed-Loop Environmental Control & Life Support System
 * Asset Code: GF-T3-143 (Ghost FactoryOS Fleet Track 3 - F1 Skunkworks Engine)
 * 
 * Production OpenAPI 3.1.0 Specification Contract
 */

export const OPENAPI_SPEC_JSON = {
  "openapi": "3.1.0",
  "info": {
    "title": "Vanguard-ECLSS Autonomous Life Support REST & Telemetry API",
    "version": "1.0.0",
    "description": "Deterministic, real-time closed-loop API for deep-space habitat atmospheric gas-balancing, water processor distillation loop recovery, and FDIR automated fault triage.",
    "contact": {
      "name": "Ghost FactoryOS Skunkworks Engineering",
      "email": "skunkworks@ghostfactory.os",
      "url": "https://ghostfactory.os/fleet/track3/vanguard"
    },
    "license": {
      "name": "Apache-2.0",
      "url": "https://www.apache.org/licenses/LICENSE-2.0.html"
    }
  },
  "servers": [
    {
      "url": "https://vanguard-eclss.internal.ghostfactory.os/api/v1",
      "description": "Production High-Reliability Habitat Edge Mesh"
    },
    {
      "url": "http://localhost:3000/api/v1",
      "description": "Local Telemetry Simulator & Testbed"
    }
  ],
  "security": [
    {
      "ECLSS_RBAC_BearerAuth": [
        "eclss:telemetry:read",
        "eclss:actuator:write",
        "eclss:fdir:admin"
      ]
    }
  ],
  "paths": {
    "/eclss/atmosphere/balance": {
      "post": {
        "summary": "Solve Real-Time Closed-Loop Atmospheric Gas Balance",
        "description": "Ingests current barometric and gas partial pressure telemetry, calculates metabolic burn from crew profile, and computes optimal MIMO-MPC actuator rates.",
        "operationId": "solveAtmosphericBalance",
        "tags": ["Atmospheric Control"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AtmosphericBalanceRequest"
              },
              "example": {
                "nodeId": "VANGUARD-OUTPOST-01",
                "totalPressureKpa": 101.325,
                "ppO2Kpa": 21.28,
                "ppCO2Kpa": 0.36,
                "ppN2Kpa": 78.42,
                "temperatureCelsius": 21.5,
                "relativeHumidityPct": 45.2,
                "crewHeadcount": 6,
                "metabolicActivity": "NOMINAL"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Optimal actuator commands generated within sub-6.5ms compute threshold.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AtmosphericBalanceResponse"
                },
                "example": {
                  "status": "OPTIMAL",
                  "solverLatencyMs": 1.18,
                  "actuatorCommands": {
                    "o2InjectionRateGps": 0.058,
                    "n2InjectionRateGps": 0.012,
                    "co2ScrubberBlowerDutyPct": 52.4,
                    "condensingHeatExchangerTempC": 9.8
                  },
                  "projectedState1Min": {
                    "totalPressureKpa": 101.325,
                    "ppO2Kpa": 21.30,
                    "ppCO2Kpa": 0.35,
                    "relativeHumidityPct": 45.0,
                    "dewPointCelsius": 9.25
                  },
                  "activeConstraintViolations": []
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/400BadRequest"
          },
          "401": {
            "$ref": "#/components/responses/401Unauthorized"
          },
          "500": {
            "$ref": "#/components/responses/500InternalError"
          }
        }
      }
    },
    "/eclss/water/recovery": {
      "post": {
        "summary": "Process Hydrologic Inflow & Calculate Recovery Yield",
        "description": "Calculates distillate yield, catalytic oxidizer purity, and filter life index from urine distillation assembly and greywater stream inflows.",
        "operationId": "calculateWaterRecovery",
        "tags": ["Hydrologic Subsystem"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/WaterRecoveryRequest"
              },
              "example": {
                "nodeId": "VANGUARD-OUTPOST-01",
                "greywaterInflowLph": 3.85,
                "urineDistillateInflowLph": 1.25,
                "distillateConductivityMicroSiemens": 0.08,
                "catalyticOxidizerTempC": 135.0
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Water processor output metrics and consumable depletion vector.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/WaterRecoveryResponse"
                },
                "example": {
                  "potableYieldLph": 5.02,
                  "loopRecoveryEfficiencyPct": 98.4,
                  "totalOrganicCarbonPpb": 120,
                  "potableQualityStandardMet": true,
                  "filterSaturationIndexPct": 14.5,
                  "estimatedFilterBedHoursRemaining": 1850.0
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/400BadRequest"
          }
        }
      }
    },
    "/eclss/fdir/triage": {
      "post": {
        "summary": "Execute Automated Fault Detection & Emergency Isolation",
        "description": "Takes in an anomaly telemetry vector, evaluates probabilistic root-cause hypotheses, and generates real-time valve isolation sequences.",
        "operationId": "executeFDIRTriage",
        "tags": ["FDIR Safety Architecture"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/FDIRTriageRequest"
              },
              "example": {
                "nodeId": "VANGUARD-OUTPOST-01",
                "anomalyCategory": "DECOMPRESSION",
                "deltaPressureRateKpaPerSec": -0.18,
                "currentTotalPressureKpa": 99.4,
                "acousticSensorAlertVector": ["SECTOR_ALPHA_SEAL"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Triage analysis with automated containment isolation sequence.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/FDIRTriageResponse"
                },
                "example": {
                  "incidentId": "INC-7910F",
                  "severity": "CRITICAL",
                  "rootCauseProbabilities": [
                    { "hypothesis": "Module Alpha Outer Seal Failure", "probability": 0.74 },
                    { "hypothesis": "Micrometeorite Penetration in Bay 3", "probability": 0.22 },
                    { "hypothesis": "Relief Valve Stuck Open", "probability": 0.04 }
                  ],
                  "prescribedProtocol": "ENGAGE_ISOLATION_SECTOR_A + HIGH_FLOW_N2_INJECTION",
                  "automatedValvesEngaged": ["ISO-V101-ALPHA", "ISO-V102-ALPHA-RETURN"],
                  "crewEgressAdvisory": "SEAL_COMPARTMENT_ALPHA_EVACUATE_TO_CORE_NODE"
                }
              }
            }
          },
          "400": {
            "$ref": "#/components/responses/400BadRequest"
          }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "ECLSS_RBAC_BearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Cryptographically signed JWT containing roles: eclss:telemetry:read, eclss:actuator:write, eclss:fdir:admin."
      }
    },
    "schemas": {
      "AtmosphericBalanceRequest": {
        "type": "object",
        "required": ["nodeId", "totalPressureKpa", "ppO2Kpa", "ppCO2Kpa", "crewHeadcount"],
        "properties": {
          "nodeId": { "type": "string", "example": "VANGUARD-OUTPOST-01" },
          "totalPressureKpa": { "type": "number", "minimum": 0, "maximum": 150.0 },
          "ppO2Kpa": { "type": "number", "minimum": 0, "maximum": 50.0 },
          "ppCO2Kpa": { "type": "number", "minimum": 0, "maximum": 10.0 },
          "ppN2Kpa": { "type": "number", "minimum": 0, "maximum": 120.0 },
          "temperatureCelsius": { "type": "number", "minimum": -20, "maximum": 50 },
          "relativeHumidityPct": { "type": "number", "minimum": 0, "maximum": 100 },
          "crewHeadcount": { "type": "integer", "minimum": 1, "maximum": 32 },
          "metabolicActivity": { "type": "string", "enum": ["REST", "NOMINAL", "STRENUOUS_EVA"] }
        }
      },
      "AtmosphericBalanceResponse": {
        "type": "object",
        "required": ["status", "solverLatencyMs", "actuatorCommands", "projectedState1Min"],
        "properties": {
          "status": { "type": "string", "enum": ["OPTIMAL", "CONSTRAINED", "EMERGENCY_OVERRIDE"] },
          "solverLatencyMs": { "type": "number" },
          "actuatorCommands": {
            "type": "object",
            "required": ["o2InjectionRateGps", "n2InjectionRateGps", "co2ScrubberBlowerDutyPct", "condensingHeatExchangerTempC"],
            "properties": {
              "o2InjectionRateGps": { "type": "number", "minimum": 0 },
              "n2InjectionRateGps": { "type": "number", "minimum": 0 },
              "co2ScrubberBlowerDutyPct": { "type": "number", "minimum": 0, "maximum": 100 },
              "condensingHeatExchangerTempC": { "type": "number", "minimum": 2.0, "maximum": 20.0 }
            }
          },
          "projectedState1Min": { "type": "object" },
          "activeConstraintViolations": { "type": "array", "items": { "type": "string" } }
        }
      },
      "WaterRecoveryRequest": {
        "type": "object",
        "required": ["nodeId", "greywaterInflowLph", "urineDistillateInflowLph"],
        "properties": {
          "nodeId": { "type": "string" },
          "greywaterInflowLph": { "type": "number", "minimum": 0 },
          "urineDistillateInflowLph": { "type": "number", "minimum": 0 },
          "distillateConductivityMicroSiemens": { "type": "number" },
          "catalyticOxidizerTempC": { "type": "number" }
        }
      },
      "WaterRecoveryResponse": {
        "type": "object",
        "required": ["potableYieldLph", "loopRecoveryEfficiencyPct", "totalOrganicCarbonPpb", "potableQualityStandardMet"],
        "properties": {
          "potableYieldLph": { "type": "number" },
          "loopRecoveryEfficiencyPct": { "type": "number" },
          "totalOrganicCarbonPpb": { "type": "number" },
          "potableQualityStandardMet": { "type": "boolean" },
          "filterSaturationIndexPct": { "type": "number" },
          "estimatedFilterBedHoursRemaining": { "type": "number" }
        }
      },
      "FDIRTriageRequest": {
        "type": "object",
        "required": ["nodeId", "anomalyCategory"],
        "properties": {
          "nodeId": { "type": "string" },
          "anomalyCategory": { "type": "string", "enum": ["DECOMPRESSION", "SABATIER_QUENCH", "OGS_DEGRADATION", "VOC_SPIKE"] },
          "deltaPressureRateKpaPerSec": { "type": "number" },
          "currentTotalPressureKpa": { "type": "number" },
          "acousticSensorAlertVector": { "type": "array", "items": { "type": "string" } }
        }
      },
      "FDIRTriageResponse": {
        "type": "object",
        "required": ["incidentId", "severity", "rootCauseProbabilities", "prescribedProtocol", "automatedValvesEngaged"],
        "properties": {
          "incidentId": { "type": "string" },
          "severity": { "type": "string", "enum": ["INFO", "ADVISORY", "WARNING", "CRITICAL"] },
          "rootCauseProbabilities": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "hypothesis": { "type": "string" },
                "probability": { "type": "number" }
              }
            }
          },
          "prescribedProtocol": { "type": "string" },
          "automatedValvesEngaged": { "type": "array", "items": { "type": "string" } },
          "crewEgressAdvisory": { "type": "string" }
        }
      },
      "ProblemDetails": {
        "type": "object",
        "required": ["type", "title", "status", "detail"],
        "properties": {
          "type": { "type": "string", "format": "uri" },
          "title": { "type": "string" },
          "status": { "type": "integer" },
          "detail": { "type": "string" },
          "instance": { "type": "string" }
        }
      }
    },
    "responses": {
      "400BadRequest": {
        "description": "Invalid parameter boundary or unphysical telemetry values provided (RFC 7807 Problem Details).",
        "content": {
          "application/problem+json": {
            "schema": { "$ref": "#/components/schemas/ProblemDetails" }
          }
        }
      },
      "401Unauthorized": {
        "description": "Missing, expired, or invalid HMAC/JWT token authorization.",
        "content": {
          "application/problem+json": {
            "schema": { "$ref": "#/components/schemas/ProblemDetails" }
          }
        }
      },
      "500InternalError": {
        "description": "Internal solver failure or hardware timeout.",
        "content": {
          "application/problem+json": {
            "schema": { "$ref": "#/components/schemas/ProblemDetails" }
          }
        }
      }
    }
  }
};
