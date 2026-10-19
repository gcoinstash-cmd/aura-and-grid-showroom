import { TestResultItem } from '../types/terrain';

export const DOCKERFILE_CONTENT = `# =====================================================================
# GF-T3-176: Heavy Overland Dynamics Platform Terrain Core
# Production Hardened Multi-Stage Dockerfile (Non-Root Distroless)
# =====================================================================

# Stage 1: Build & Dependency Resolution
FROM python:3.12-slim-bookworm AS builder

WORKDIR /build

ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1 \\
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    libpq-dev \\
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user --no-warn-script-location -r requirements.txt

# Stage 2: Minimal Distroless Execution Image
FROM python:3.12-slim-bookworm AS runner

WORKDIR /app

# Create non-root dedicated application user (UID 10001)
RUN groupadd -g 10001 terrainuser && \\
    useradd -u 10001 -g terrainuser -s /sbin/nologin -d /app terrainuser

# Copy installed wheels from builder
COPY --from=builder /root/.local /home/terrainuser/.local
ENV PATH=/home/terrainuser/.local/bin:$PATH

# Copy application code
COPY --chown=terrainuser:terrainuser src/ /app/src/
COPY --chown=terrainuser:terrainuser config/ /app/config/

USER terrainuser

# Cloud Run HTTP Port
EXPOSE 8080

HEALTHCHECK --interval=5s --timeout=2s --start-period=3s --retries=3 \\
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/healthz')" || exit 1

ENTRYPOINT ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "4"]
`;

export const PYTEST_TEST_BENCH = `"""
Unit & Integration Test Bench: test_ekdss_core.py
Coverage Target: >90% Strict Compliance
Testing Framework: PyTest 8.x + pytest-asyncio
"""

import pytest
from src.ekdss_terrain_core import (
    EkdssStabilizerStateMachine,
    TorsenDifferentialEngine,
    SuspensionStrokeVector,
    TerrainStateEstimate,
    ValveDecoupleMode,
    DiffLockState
)


class TestEkdssHydraulicSafetyAndDecoupling:
    @pytest.fixture
    def controller(self):
        return EkdssStabilizerStateMachine()

    @pytest.fixture
    def diff_engine(self):
        return TorsenDifferentialEngine()

    def test_extreme_cross_axle_24_5_inch_decoupling(self, controller):
        """Simulates 24.5-inch extreme articulation on uneven rock shelf."""
        stroke = SuspensionStrokeVector(
            front_left_in=12.2,
            front_right_in=-8.5,
            rear_left_in=11.8,
            rear_right_in=-9.2
        )
        estimate = TerrainStateEstimate(
            speed_kph=8.0,
            pitch_deg=22.5,
            roll_deg=-14.2,
            yaw_rate_deg_s=0.2,
            surface_roughness_index=0.85
        )
        mode, stiffness, f_dec, r_dec = controller.evaluate_decoupling(stroke, estimate)
        assert mode == ValveDecoupleMode.FULL_DECOUPLED
        assert f_dec is True
        assert r_dec is True
        assert stiffness == 12600.0

    def test_high_speed_highway_lockout_safety(self, controller):
        """Ensures stabilizer bars remain locked at highway speeds (>65 km/h)."""
        stroke = SuspensionStrokeVector(
            front_left_in=6.0,
            front_right_in=-6.0,
            rear_left_in=5.0,
            rear_right_in=-5.0
        )
        estimate = TerrainStateEstimate(
            speed_kph=105.0,
            pitch_deg=0.5,
            roll_deg=2.1,
            yaw_rate_deg_s=0.1,
            surface_roughness_index=0.70
        )
        mode, stiffness, f_dec, r_dec = controller.evaluate_decoupling(stroke, estimate)
        assert mode == ValveDecoupleMode.RIGID_HIGHWAY
        assert f_dec is False
        assert r_dec is False
        assert stiffness == 45000.0

    def test_valve_pressure_drop_failsafe(self, controller):
        """Simulates sudden hydraulic accumulator loss (e.g., line puncture)."""
        controller.hydraulic.front_accumulator_mpa = 4.2  # Below safe threshold 8.5 MPa
        stroke = SuspensionStrokeVector(10.0, -10.0, 10.0, -10.0)
        estimate = TerrainStateEstimate(12.0, 15.0, 10.0, 0.0, 0.90)
        
        mode, stiffness, f_dec, r_dec = controller.evaluate_decoupling(stroke, estimate)
        assert mode == ValveDecoupleMode.HYDRAULIC_FAILSAFE
        assert f_dec is False
        assert r_dec is False
        assert stiffness == 45000.0

    def test_torsen_split_and_rear_elocker_engagement(self, diff_engine):
        """Verifies dog-clutch 100% lock during Crawl Control wheel slip."""
        t_f, t_r, state, ratio = diff_engine.compute_torque_allocation(
            input_torque_nm=700.0,
            front_slip_detected=False,
            rear_slip_detected=True,
            crawl_control_active=True,
            manual_rear_lock_req=False
        )
        assert state == DiffLockState.REAR_ELECTRONIC_LOCKED
        assert t_f == 350.0
        assert t_r == 350.0
        assert "REAR LOCKER 100%" in ratio
`;

export const GCLOUD_DEPLOY_SCRIPT = `#!/usr/bin/env bash
# =====================================================================
# 1-Click Production Cloud Run Deployment Script
# Asset: GF-T3-176 | Heavy Overland Dynamics Platform Terrain Core
# =====================================================================
set -euo pipefail

PROJECT_ID="\${GCP_PROJECT_ID:-Heavy Overland Dynamics Platform-terrain-vault}"
REGION="us-central1"
SERVICE_NAME="gf-t3-176-terrain-core"
IMAGE_TAG="gcr.io/\${PROJECT_ID}/\${SERVICE_NAME}:v1.0.0-PROD"

echo ">>> Building Multi-Stage OCI Container via Google Cloud Build..."
gcloud builds submit --tag "\${IMAGE_TAG}" .

echo ">>> Deploying Non-Root Image to Cloud Run (Edge Telemetry Tier)..."
gcloud run deploy "\${SERVICE_NAME}" \\
    --image "\${IMAGE_TAG}" \\
    --platform "managed" \\
    --region "\${REGION}" \\
    --allow-unauthenticated \\
    --port 8080 \\
    --cpu 2 \\
    --memory 2Gi \\
    --min-instances 1 \\
    --max-instances 20 \\
    --concurrency 1000 \\
    --execution-environment gen2 \\
    --set-env-vars "NODE_ENV=production,LEDGER_HMAC_KEY=secret_vault_2026,POSTGRES_MAX_CONN=50" \\
    --service-account "terrain-core-runner@\${PROJECT_ID}.iam.gserviceaccount.com"

echo ">>> Service successfully deployed at:"
gcloud run services describe "\${SERVICE_NAME}" --region "\${REGION}" --format="value(status.url)"
`;

export const MOCK_PYTEST_RESULTS: TestResultItem[] = [
  {
    id: "TEST-01",
    name: "test_extreme_cross_axle_24_5_inch_decoupling",
    category: "SUSPENSION",
    durationMs: 1.42,
    status: "PASSED",
    details: "Full 24.5-inch independent wheel travel verified. Both hydraulic bypass solenoid valves actuated in 3.8ms."
  },
  {
    id: "TEST-02",
    name: "test_high_speed_highway_lockout_safety",
    category: "SUSPENSION",
    durationMs: 0.98,
    status: "PASSED",
    details: "Vehicle speed 105 km/h verified. Decoupling inhibited; 45,000 Nm/rad roll stiffness maintained."
  },
  {
    id: "TEST-03",
    name: "test_valve_pressure_drop_failsafe",
    category: "HYDRAULIC_FAILOVER",
    durationMs: 1.15,
    status: "PASSED",
    details: "Accumulator pressure dropped to 4.2 MPa. Mechanical spring-return lockout triggered in <2.0ms."
  },
  {
    id: "TEST-04",
    name: "test_torsen_split_and_rear_elocker_engagement",
    category: "DIFF_LOCK",
    durationMs: 0.88,
    status: "PASSED",
    details: "Crawl Control active + slip condition triggered 50:50 torque lock and rear dog-clutch engagement."
  },
  {
    id: "TEST-05",
    name: "test_hmac_chain_monotonic_integrity",
    category: "LEDGER_HMAC",
    durationMs: 2.30,
    status: "PASSED",
    details: "Chained 1,000,000 consecutive telemetry blocks. Zero hash collision or sequence drift detected."
  },
  {
    id: "TEST-06",
    name: "test_crawl_control_speed_regulation_abs_pid",
    category: "CRAWL_CONTROL",
    durationMs: 1.65,
    status: "PASSED",
    details: "2.5 mph speed setpoint maintained across 35-degree rock incline with <0.18 mph error variance."
  },
  {
    id: "TEST-07",
    name: "test_quarantine_trigger_on_cross_axle_desync",
    category: "LEDGER_HMAC",
    durationMs: 1.84,
    status: "PASSED",
    details: "Simulated 8.5-inch cross-axle stroke with rigid valve state. Database trigger successfully quarantined row."
  }
];
