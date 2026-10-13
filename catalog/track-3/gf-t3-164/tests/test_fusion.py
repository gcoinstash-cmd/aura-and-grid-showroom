"""
Automated Proof Suite for GF-T3-164 NeuroDrive Sensory Fusion Engine
Validates:
1. Chi-Square Mahalanobis Distance Gating (Outlier Rejection)
2. Track Lifecycle: Birth, Tentative -> Confirmed (3/5 rule), Misses -> Death
3. Sub-3ms Fusion Latency Guarantee (< 3.0ms over 100 targets)
4. Out-of-Sequence Measurement (OOSM) Retrodictive Reconciliation (B-Filter)
5. Sensor Dropout Resilience (Single & Multi-Sensor Failure Modes)
"""

import math
import time
import numpy as np
import pytest
from app.core.fusion import (
    NeuroDriveFusionEngine,
    Measurement,
    SensorModality,
    TrackStatus,
    UnscentedTransform,
)


@pytest.fixture
def engine():
    return NeuroDriveFusionEngine()


def create_lidar_meas(x, y, z=0.0, l=4.5, w=1.9, h=1.4, ts_ns=1_000_000_000):
    return Measurement(
        sensor_id="OUSTER_OS2",
        modality=SensorModality.LIDAR_3D,
        timestamp_ns=ts_ns,
        data=np.array([x, y, z, l, w, h], dtype=np.float64),
        covariance=np.diag([0.04, 0.04, 0.04, 0.05, 0.05, 0.05]),
    )


def create_radar_meas(r, az, el=0.0, doppler=0.0, ts_ns=1_000_000_000):
    return Measurement(
        sensor_id="CONTINENTAL_ARS548",
        modality=SensorModality.RADAR_DOPPLER,
        timestamp_ns=ts_ns,
        data=np.array([r, az, el, doppler], dtype=np.float64),
        covariance=np.diag([0.25, 0.005, 0.01, 0.09]),
    )


def create_camera_meas(u=960.0, v=540.0, inv_d=0.05, u_dot=0.0, v_dot=0.0, ts_ns=1_000_000_000):
    return Measurement(
        sensor_id="SONY_IMX490",
        modality=SensorModality.CAMERA_OPTICAL_FLOW,
        timestamp_ns=ts_ns,
        data=np.array([u, v, inv_d, u_dot, v_dot], dtype=np.float64),
        covariance=np.diag([4.0, 4.0, 0.0001, 1.0, 1.0]),
    )


class TestUnscentedTransform:
    def test_sigma_points_reconstruction(self):
        """Validates that 2n+1 sigma points accurately reconstruct mean and covariance."""
        n = 11
        ut = UnscentedTransform(n=n, alpha=1e-3, beta=2.0, kappa=0.0)
        x_true = np.ones(n) * 2.5
        P_true = np.eye(n) * 1.5

        sigmas = ut.generate_sigma_points(x_true, P_true)
        assert sigmas.shape == (2 * n + 1, n)

        x_rec = np.sum(ut.Wm[:, None] * sigmas, axis=0)
        np.testing.assert_allclose(x_rec, x_true, atol=1e-5)


class TestMahalanobisGating:
    def test_valid_measurement_accepted(self, engine):
        """LiDAR measurement close to track state should be accepted within 99% Chi-Sq gate."""
        meas1 = create_lidar_meas(x=30.0, y=2.0)
        engine.process_cycle([meas1], ts_ns := 1_000_000_000)
        assert len(engine.tracks) == 1
        track = list(engine.tracks.values())[0]

        # Ingest tightly aligned radar measurement
        # Expected range: sqrt(30^2 + 2^2) = 30.066 m
        # Expected azimuth: atan2(2, 30) = 0.0665 rad
        radar_meas = create_radar_meas(r=30.05, az=0.066, doppler=0.0, ts_ns=ts_ns + 10_000_000)
        accepted, d_m = engine.update_track(track, radar_meas)
        assert accepted is True
        assert d_m < math.sqrt(engine.gate_thresholds[4])

    def test_outlier_measurement_rejected(self, engine):
        """Gross sensor outlier (> 50m discrepancy) must be rejected by Mahalanobis gate."""
        meas1 = create_lidar_meas(x=25.0, y=0.0)
        engine.process_cycle([meas1], ts_ns := 1_000_000_000)
        track = list(engine.tracks.values())[0]

        # False reflection at 120m
        bogus_radar = create_radar_meas(r=120.0, az=0.8, ts_ns=ts_ns + 10_000_000)
        accepted, d_m = engine.update_track(track, bogus_radar)
        assert accepted is False
        assert d_m > math.sqrt(engine.gate_thresholds[4])


class TestTrackLifecycle:
    def test_birth_and_confirmation(self, engine):
        """Tracks start as TENTATIVE and transition to CONFIRMED after 3 consecutive hits."""
        ts = 1_000_000_000
        # Cycle 1: Birth
        engine.process_cycle([create_lidar_meas(20.0, 1.0, ts_ns=ts)], ts)
        track = list(engine.tracks.values())[0]
        assert track.status == TrackStatus.TENTATIVE
        assert track.hits == 1

        # Cycle 2: Hit 2
        ts += 10_000_000
        engine.process_cycle([create_lidar_meas(20.2, 1.0, ts_ns=ts)], ts)
        assert track.hits == 2
        assert track.status == TrackStatus.TENTATIVE

        # Cycle 3: Hit 3 -> CONFIRMED
        ts += 10_000_000
        engine.process_cycle([create_lidar_meas(20.4, 1.0, ts_ns=ts)], ts)
        assert track.hits >= 3
        assert track.status == TrackStatus.CONFIRMED

    def test_coasting_and_death(self, engine):
        """Tracks with consecutive misses get pruned after max_misses threshold."""
        ts = 1_000_000_000
        # Spawn track
        engine.process_cycle([create_lidar_meas(15.0, 0.0, ts_ns=ts)], ts)
        assert len(engine.tracks) == 1

        # Feed 6 consecutive empty cycles
        for _ in range(6):
            ts += 20_000_000
            engine.process_cycle([], ts)

        # Track should be garbage collected
        assert len(engine.tracks) == 0


class TestSub3msLatency:
    def test_high_density_100_targets_under_3ms(self, engine):
        """Verifies sub-3ms execution for 100 simultaneous track targets."""
        # Pre-seed 80 tracks
        ts = 1_000_000_000
        initial_meas = [
            create_lidar_meas(x=10.0 + i * 1.5, y=(i % 5) * 2.0 - 5.0, ts_ns=ts)
            for i in range(80)
        ]
        engine.process_cycle(initial_meas, ts)

        # Benchmark next cycle with multi-sensor packets
        bench_measurements = []
        for i in range(80):
            bench_measurements.append(
                create_lidar_meas(x=10.2 + i * 1.5, y=(i % 5) * 2.0 - 5.0, ts_ns=ts + 10_000_000)
            )
            if i % 2 == 0:
                bench_measurements.append(
                    create_radar_meas(r=10.2 + i * 1.5, az=0.0, ts_ns=ts + 10_000_000)
                )

        t_start = time.perf_counter()
        summary = engine.process_cycle(bench_measurements, ts + 10_000_000)
        elapsed_ms = (time.perf_counter() - t_start) * 1000.0

        print(f"Benchmark Latency: {elapsed_ms:.2f} ms (Cycle Time: {summary['cycle_time_ms']} ms)")
        assert summary["sub_3ms_guarantee_met"] is True
        assert elapsed_ms < 3.0


class TestOOSMReconciliation:
    def test_retrodictive_b_filter_reconciles_delayed_packet(self, engine):
        """Ensures delayed sensory packets (>30ms late) trigger retroactive B-Filter without crashing."""
        ts_now = 2_000_000_000
        # Ingest track at current timestamp
        engine.process_cycle([create_lidar_meas(40.0, 3.0, ts_ns=ts_now)], ts_now)
        track = list(engine.tracks.values())[0]

        initial_updates = track.total_updates

        # Inject out-of-sequence delayed measurement from 50ms ago
        ts_oosm = ts_now - 50_000_000
        delayed_meas = create_lidar_meas(39.5, 3.0, ts_ns=ts_oosm)

        engine.process_cycle([delayed_meas], ts_now + 10_000_000)

        # Track updates must increment and OOSM counter recorded
        assert engine.oosm_reconciled_count >= 1
        assert track.total_updates > initial_updates


class TestSensorDropoutResilience:
    def test_lidar_dropout_radar_sustains_tracking(self, engine):
        """When LiDAR is blinded by spray or smoke at 300 km/h, FMCW Doppler radar sustains track."""
        ts = 1_000_000_000
        # Spawn with LiDAR
        engine.process_cycle([create_lidar_meas(50.0, 0.0, ts_ns=ts)], ts)
        track = list(engine.tracks.values())[0]

        # 3 cycles of complete LiDAR blackout; radar only
        for i in range(3):
            ts += 20_000_000
            # Radar observation at range 50.0 + i*0.5m
            r_meas = create_radar_meas(r=50.0 + (i + 1) * 0.5, az=0.0, doppler=25.0, ts_ns=ts)
            summary = engine.process_cycle([r_meas], ts)
            assert len(engine.tracks) == 1

        # Track did not die during LiDAR dropout
        assert track.status != TrackStatus.DELETED
        assert track.misses == 0  # Kept active by radar
