"""
Ghost FactoryOS Track 3 F1 Skunkworks Engine — GF-T3-161 (ChronoVector)
Hardened Validation Suite: 6-DoF Dead Reckoning, Covariance Convergence, and Matrix Inversion Stability.
"""

import math
import time
import unittest
from typing import List

from app.core.kalman import (
    ExtendedKalmanFilter,
    SensorMeasurement,
    MatrixOps,
    GRAVITY_STANDARD,
    CHI2_GATE_3DOF_99,
)
from app.api.telemetry import TelemetryBuffer, TelemetryIngestRequest


class TestChronoVectorEKF(unittest.TestCase):
    def setUp(self):
        self.ekf = ExtendedKalmanFilter()

    def test_state_vector_initialization_and_dimensions(self):
        """Validates 15-state dimensions and initial conservative prior covariance."""
        self.assertEqual(len(self.ekf.x), 15)
        self.assertEqual(len(self.ekf.P), 15)
        for row in self.ekf.P:
            self.assertEqual(len(row), 15)

        # Check positive-definiteness on initial diagonal elements
        for i in range(15):
            self.assertGreater(self.ekf.P[i][i], 0.0)

        # Initial position and velocity should be zero
        for i in range(6):
            self.assertEqual(self.ekf.x[i], 0.0)

    def test_dcm_orthogonality_and_determinant(self):
        """Ensures Direction Cosine Matrix C_b^n is strictly orthogonal with det(C) = +1."""
        test_angles = [
            (0.0, 0.0, 0.0),
            (0.15, -0.25, 1.20),
            (math.pi / 4, -math.pi / 6, math.pi / 3),
            (-0.35, 0.40, -1.57),
        ]

        for roll, pitch, yaw in test_angles:
            C = self.ekf.dcm_body_to_nav(roll, pitch, yaw)
            C_T = MatrixOps.transpose(C)
            I_check = MatrixOps.matmul(C, C_T)

            # Test identity diagonal ≈ 1.0 and off-diagonal ≈ 0.0
            for i in range(3):
                for j in range(3):
                    expected = 1.0 if i == j else 0.0
                    self.assertAlmostEqual(I_check[i][j], expected, places=7)

            # Determinant check
            det = (
                C[0][0] * (C[1][1] * C[2][2] - C[1][2] * C[2][1])
                - C[0][1] * (C[1][0] * C[2][2] - C[1][2] * C[2][0])
                + C[0][2] * (C[1][0] * C[2][1] - C[1][1] * C[2][0])
            )
            self.assertAlmostEqual(det, 1.0, places=7)

    def test_stationary_gravity_compensation(self):
        """Verifies that static gravity acceleration cancels out exactly in ENU frame."""
        # Body frame experiencing pure +1g upward normal force (0, 0, 9.80665)
        dt = 0.01  # 10ms
        for _ in range(50):
            self.ekf.predict(accel=(0.0, 0.0, GRAVITY_STANDARD), gyro=(0.0, 0.0, 0.0), dt=dt)

        # State should experience zero vertical acceleration and zero velocity
        self.assertAlmostEqual(self.ekf.x[0], 0.0, places=5)
        self.assertAlmostEqual(self.ekf.x[1], 0.0, places=5)
        self.assertAlmostEqual(self.ekf.x[2], 0.0, places=5)
        self.assertAlmostEqual(self.ekf.x[3], 0.0, places=5)
        self.assertAlmostEqual(self.ekf.x[4], 0.0, places=5)
        self.assertAlmostEqual(self.ekf.x[5], 0.0, places=5)

    def test_dead_reckoning_constant_velocity(self):
        """Tests pure IMU dead-reckoning kinematics under constant linear acceleration."""
        # 1 m/s^2 forward acceleration in body X for 2 seconds (200 steps at dt=0.01)
        accel_forward = 1.0
        dt = 0.01
        steps = 200

        for _ in range(steps):
            self.ekf.predict(accel=(accel_forward, 0.0, GRAVITY_STANDARD), gyro=(0.0, 0.0, 0.0), dt=dt)

        total_t = steps * dt  # 2.0 seconds
        expected_pos_x = 0.5 * accel_forward * (total_t ** 2)  # 0.5 * 1.0 * 4.0 = 2.0 meters
        expected_vel_x = accel_forward * total_t               # 2.0 m/s

        self.assertAlmostEqual(self.ekf.x[0], expected_pos_x, places=2)
        self.assertAlmostEqual(self.ekf.x[3], expected_vel_x, places=2)

    def test_gnss_sensor_fusion_and_covariance_convergence(self):
        """
        Validates error covariance convergence when GNSS fixes are provided.
        Error covariance trace must decrease and error bound must stay within 0.05m.
        """
        initial_trace = sum(self.ekf.P[i][i] for i in range(15))
        true_pos = (15.20, 28.45, 1.10)
        dt = 0.05

        # Run 40 fusion steps
        for step in range(40):
            # True acceleration is 0 (vehicle stationary at true_pos)
            meas = SensorMeasurement(
                accel=(0.0, 0.0, GRAVITY_STANDARD),
                gyro=(0.0, 0.0, 0.0),
                timestamp_ms=step * 50.0,
                dt=dt,
                gnss_pos=true_pos,
                gnss_noise_std=0.05,
            )
            state = self.ekf.process_frame(meas)

        final_trace = sum(self.ekf.P[i][i] for i in range(15))
        # Covariance trace must have shrunk significantly
        self.assertLess(final_trace, initial_trace)

        # Position error must converge tightly to ground truth within 0.05m
        pos_err_x = abs(self.ekf.x[0] - true_pos[0])
        pos_err_y = abs(self.ekf.x[1] - true_pos[1])
        pos_err_z = abs(self.ekf.x[2] - true_pos[2])

        self.assertLess(pos_err_x, 0.05)
        self.assertLess(pos_err_y, 0.05)
        self.assertLess(pos_err_z, 0.05)

    def test_matrix_inversion_stability(self):
        """Tests analytic 3x3 matrix inverse under ill-conditioned and scaling variances."""
        # Ill-conditioned matrix with wide eigenvalue spread
        m = [
            [1e4, 0.5, 0.2],
            [0.5, 1e-2, 0.01],
            [0.2, 0.01, 1.0],
        ]
        m_inv = MatrixOps.invert_3x3(m)
        product = MatrixOps.matmul(m, m_inv)

        for i in range(3):
            for j in range(3):
                expected = 1.0 if i == j else 0.0
                self.assertAlmostEqual(product[i][j], expected, places=5)

    def test_chi_squared_outlier_rejection(self):
        """Verifies that an erratic GNSS multipath spike (>100m) is safely rejected by innovation gating."""
        # Settle the filter first
        for _ in range(20):
            self.ekf.process_frame(SensorMeasurement(
                accel=(0.0, 0.0, GRAVITY_STANDARD),
                gyro=(0.0, 0.0, 0.0),
                timestamp_ms=100.0,
                dt=0.05,
                gnss_pos=(5.0, 5.0, 0.0),
                gnss_noise_std=0.1,
            ))

        pos_before_spike = (self.ekf.x[0], self.ekf.x[1], self.ekf.x[2])

        # Inject massive multipath spike (150 meters away)
        spoofed_fix = (155.0, 5.0, 0.0)
        meas_spike = SensorMeasurement(
            accel=(0.0, 0.0, GRAVITY_STANDARD),
            gyro=(0.0, 0.0, 0.0),
            timestamp_ms=200.0,
            dt=0.05,
            gnss_pos=spoofed_fix,
            gnss_noise_std=0.1,
        )

        state = self.ekf.process_frame(meas_spike)

        # Innovation gating should flag rejection
        self.assertFalse(state.is_gnss_fused)
        self.assertGreater(state.last_mahalanobis_residual, CHI2_GATE_3DOF_99)

        # State position should not have jumped to 155m
        self.assertAlmostEqual(self.ekf.x[0], pos_before_spike[0], places=1)

    def test_sliding_telemetry_buffer_bounds(self):
        """Validates that TelemetryBuffer maintains exactly 1,000 states and never overflows."""
        buffer = TelemetryBuffer()
        for i in range(1250):
            req = TelemetryIngestRequest(
                timestamp_ms=float(i * 10),
                dt=0.01,
                accel=[0.0, 0.0, GRAVITY_STANDARD],
                gyro=[0.0, 0.0, 0.0],
                gnss_pos=[float(i) * 0.1, 0.0, 0.0],
            )
            buffer.ingest(req)

        self.assertEqual(len(buffer.buffer), 1000)
        self.assertEqual(buffer.total_ingested_frames, 1250)

        # FIFO verification: earliest item should be frame 250
        earliest = buffer.buffer[0]
        self.assertEqual(earliest.timestamp_ms, 2500.0)

    def test_sub_10ms_deterministic_latency_benchmark(self):
        """Verifies that 100 consecutive frames achieve deterministic latency well under 10ms."""
        buffer = TelemetryBuffer()
        latencies: List[float] = []

        for i in range(100):
            t_start = time.perf_counter()
            req = TelemetryIngestRequest(
                timestamp_ms=float(i * 5),
                dt=0.005,
                accel=[0.1, -0.05, GRAVITY_STANDARD + 0.02],
                gyro=[0.01, -0.005, 0.02],
                gnss_pos=[float(i) * 0.05, 10.0, 0.0] if (i % 10 == 0) else None,
            )
            buffer.ingest(req)
            elapsed_ms = (time.perf_counter() - t_start) * 1000.0
            latencies.append(elapsed_ms)

        mean_latency = sum(latencies) / len(latencies)
        max_latency = max(latencies)

        # Must be well under the 10ms threshold
        self.assertLess(mean_latency, 5.0)
        self.assertLess(max_latency, 10.0)


if __name__ == "__main__":
    unittest.main()
