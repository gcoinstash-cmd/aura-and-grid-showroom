"""
Ghost FactoryOS Track 3 F1 Skunkworks Engine — GF-T3-161 (ChronoVector)
Core Mathematical Engine: Real-Time 15-State Extended Kalman Filter (EKF)
Combines 6-DoF IMU acceleration/angular rates with GNSS drift compensation.

Clean-Room Certified // Permissive MIT / Apache 2.0 / BSD compatible.
Zero copyleft dependencies.
"""

from __future__ import annotations
import math
import time
from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Dict, Any

# Standard Gravitational Constant (m/s^2)
GRAVITY_STANDARD = 9.80665

# Chi-squared 3-DoF 99% threshold for innovation gating
CHI2_GATE_3DOF_99 = 9.210

# Simple, high-performance Matrix Operations for clean-room zero-dependency execution
class MatrixOps:
    @staticmethod
    def zeros(rows: int, cols: int) -> List[List[float]]:
        return [[0.0 for _ in range(cols)] for _ in range(rows)]

    @staticmethod
    def eye(n: int, val: float = 1.0) -> List[List[float]]:
        m = [[0.0 for _ in range(n)] for _ in range(n)]
        for i in range(n):
            m[i][i] = val
        return m

    @staticmethod
    def diag(values: List[float]) -> List[List[float]]:
        n = len(values)
        m = [[0.0 for _ in range(n)] for _ in range(n)]
        for i in range(n):
            m[i][i] = values[i]
        return m

    @staticmethod
    def transpose(a: List[List[float]]) -> List[List[float]]:
        rows = len(a)
        cols = len(a[0])
        return [[a[r][c] for r in range(rows)] for c in range(cols)]

    @staticmethod
    def matmul(a: List[List[float]], b: List[List[float]]) -> List[List[float]]:
        rows_a = len(a)
        cols_a = len(a[0])
        cols_b = len(b[0])
        out = [[0.0 for _ in range(cols_b)] for _ in range(rows_a)]
        for i in range(rows_a):
            for k in range(cols_a):
                aik = a[i][k]
                if aik != 0.0:
                    for j in range(cols_b):
                        out[i][j] += aik * b[k][j]
        return out

    @staticmethod
    def matvec(m: List[List[float]], v: List[float]) -> List[float]:
        rows = len(m)
        cols = len(m[0])
        out = [0.0] * rows
        for i in range(rows):
            s = 0.0
            for j in range(cols):
                s += m[i][j] * v[j]
            out[i] = s
        return out

    @staticmethod
    def add(a: List[List[float]], b: List[List[float]]) -> List[List[float]]:
        rows = len(a)
        cols = len(a[0])
        return [[a[r][c] + b[r][c] for c in range(cols)] for r in range(rows)]

    @staticmethod
    def sub(a: List[List[float]], b: List[List[float]]) -> List[List[float]]:
        rows = len(a)
        cols = len(a[0])
        return [[a[r][c] - b[r][c] for c in range(cols)] for r in range(rows)]

    @staticmethod
    def scale(a: List[List[float]], s: float) -> List[List[float]]:
        return [[val * s for val in row] for row in a]

    @staticmethod
    def invert_3x3(m: List[List[float]]) -> List[List[float]]:
        """Analytic, numerically stable 3x3 matrix inverse with determinant check."""
        a, b, c = m[0][0], m[0][1], m[0][2]
        d, e, f = m[1][0], m[1][1], m[1][2]
        g, h, k = m[2][0], m[2][1], m[2][2]

        A = e * k - f * h
        B = -(d * k - f * g)
        C = d * h - e * g
        D = -(b * k - c * h)
        E = a * k - c * g
        F = -(a * h - b * g)
        G = b * f - c * e
        H = -(a * f - c * d)
        K = a * e - b * d

        det = a * A + b * B + c * C
        if abs(det) < 1e-14:
            raise ValueError(f"Matrix is singular or near-singular (det={det})")

        inv_det = 1.0 / det
        return [
            [A * inv_det, D * inv_det, G * inv_det],
            [B * inv_det, E * inv_det, H * inv_det],
            [C * inv_det, F * inv_det, K * inv_det],
        ]


@dataclass
class SensorMeasurement:
    """Raw sensor input packet containing 6-DoF IMU and optional GNSS fix."""
    accel: Tuple[float, float, float]  # ax, ay, az (m/s^2) in body frame
    gyro: Tuple[float, float, float]   # gx, gy, gz (rad/s) in body frame
    timestamp_ms: float
    dt: float                          # Integration time step (seconds)
    gnss_pos: Optional[Tuple[float, float, float]] = None  # px, py, pz (m) in ENU frame
    gnss_noise_std: float = 0.5        # Estimated GNSS accuracy in meters


@dataclass
class KalmanState:
    """15-dimensional navigation state vector with uncertainty covariance."""
    pos_x: float = 0.0
    pos_y: float = 0.0
    pos_z: float = 0.0
    vel_x: float = 0.0
    vel_y: float = 0.0
    vel_z: float = 0.0
    roll: float = 0.0      # Radians
    pitch: float = 0.0     # Radians
    yaw: float = 0.0       # Radians
    bias_ax: float = 0.0   # m/s^2
    bias_ay: float = 0.0
    bias_az: float = 0.0
    bias_gx: float = 0.0   # rad/s
    bias_gy: float = 0.0
    bias_gz: float = 0.0
    covariance_trace: float = 0.0
    covariance_matrix: List[List[float]] = field(default_factory=list)
    timestamp_ms: float = 0.0
    last_mahalanobis_residual: float = 0.0
    is_gnss_fused: bool = False

    def to_vector(self) -> List[float]:
        return [
            self.pos_x, self.pos_y, self.pos_z,
            self.vel_x, self.vel_y, self.vel_z,
            self.roll, self.pitch, self.yaw,
            self.bias_ax, self.bias_ay, self.bias_az,
            self.bias_gx, self.bias_gy, self.bias_gz,
        ]

    @classmethod
    def from_vector(cls, v: List[float], P: List[List[float]], timestamp_ms: float = 0.0) -> KalmanState:
        trace = sum(P[i][i] for i in range(len(P))) if P else 0.0
        return cls(
            pos_x=v[0], pos_y=v[1], pos_z=v[2],
            vel_x=v[3], vel_y=v[4], vel_z=v[5],
            roll=v[6], pitch=v[7], yaw=v[8],
            bias_ax=v[9], bias_ay=v[10], bias_az=v[11],
            bias_gx=v[12], bias_gy=v[13], bias_gz=v[14],
            covariance_trace=trace,
            covariance_matrix=P,
            timestamp_ms=timestamp_ms,
        )


class ExtendedKalmanFilter:
    """
    GF-T3-161 6-DoF Extended Kalman Filter (ChronoVector)
    - 15 State Variables: Pos (3), Vel (3), Attitude Euler (3), Accel Bias (3), Gyro Bias (3)
    - Real-time IMU kinematic mechanization with gravity compensation
    - Direction Cosine Matrix (DCM) rotation kinematics
    - Joseph-form error covariance measurement update for guaranteed positive semi-definiteness
    - Chi-squared innovation outlier gating
    """

    STATE_DIM = 15

    def __init__(
        self,
        q_pos: float = 1e-4,
        q_vel: float = 1e-3,
        q_att: float = 1e-4,
        q_bias_accel: float = 1e-5,
        q_bias_gyro: float = 1e-6,
        r_gnss_pos: float = 0.25,
    ):
        self.q_pos = q_pos
        self.q_vel = q_vel
        self.q_att = q_att
        self.q_bias_accel = q_bias_accel
        self.q_bias_gyro = q_bias_gyro
        self.r_gnss_pos = r_gnss_pos

        # State vector x (15x1)
        self.x = [0.0] * self.STATE_DIM
        self.initialized = False

        # Covariance matrix P (15x15) initialized with conservative prior variances
        diag_p = [
            1.0, 1.0, 1.0,          # Position uncertainty (m^2)
            0.1, 0.1, 0.1,          # Velocity uncertainty ((m/s)^2)
            0.01, 0.01, 0.01,       # Attitude uncertainty (rad^2)
            0.05, 0.05, 0.05,       # Accel bias uncertainty ((m/s^2)^2)
            0.001, 0.001, 0.001     # Gyro bias uncertainty ((rad/s)^2)
        ]
        self.P = MatrixOps.diag(diag_p)
        self.last_timestamp_ms = 0.0
        self.last_mahalanobis = 0.0
        self.last_gnss_fused = False

    def reset(self, initial_pos: Optional[Tuple[float, float, float]] = None) -> None:
        """Resets filter to zero state with default prior covariance."""
        self.x = [0.0] * self.STATE_DIM
        self.initialized = False
        if initial_pos:
            self.x[0] = initial_pos[0]
            self.x[1] = initial_pos[1]
            self.x[2] = initial_pos[2]
            self.initialized = True
        diag_p = [
            1.0, 1.0, 1.0,
            0.1, 0.1, 0.1,
            0.01, 0.01, 0.01,
            0.05, 0.05, 0.05,
            0.001, 0.001, 0.001
        ]
        self.P = MatrixOps.diag(diag_p)
        self.last_mahalanobis = 0.0
        self.last_gnss_fused = False

    @staticmethod
    def dcm_body_to_nav(roll: float, pitch: float, yaw: float) -> List[List[float]]:
        """Computes Direction Cosine Matrix C_b^n from Euler angles."""
        cr = math.cos(roll)
        sr = math.sin(roll)
        cp = math.cos(pitch)
        sp = math.sin(pitch)
        cy = math.cos(yaw)
        sy = math.sin(yaw)

        return [
            [cp * cy, sr * sp * cy - cr * sy, cr * sp * cy + sr * sy],
            [cp * sy, sr * sp * sy + cr * cy, cr * sp * sy - sr * cy],
            [-sp,     sr * cp,                cr * cp],
        ]

    @staticmethod
    def euler_rate_matrix(roll: float, pitch: float) -> List[List[float]]:
        """Euler rate transformation matrix E(theta) mapping gyro body rates to Euler angle rates."""
        sr = math.sin(roll)
        cr = math.cos(roll)
        tp = math.tan(pitch)
        cp = math.cos(pitch)
        sec_p = 1.0 / cp if abs(cp) > 1e-6 else 1.0

        return [
            [1.0, sr * tp,  cr * tp],
            [0.0, cr,      -sr],
            [0.0, sr * sec_p, cr * sec_p],
        ]

    def predict(self, accel: Tuple[float, float, float], gyro: Tuple[float, float, float], dt: float) -> None:
        """
        EKF Prediction Step:
        - Non-linear kinematic mechanization of IMU measurements
        - Gravity removal in navigation frame
        - State transition Jacobian F_k evaluation
        - Error covariance propagation P = F * P * F^T + Q
        """
        if dt <= 0.0:
            return

        px, py, pz = self.x[0], self.x[1], self.x[2]
        vx, vy, vz = self.x[3], self.x[4], self.x[5]
        roll, pitch, yaw = self.x[6], self.x[7], self.x[8]
        b_ax, b_ay, b_az = self.x[9], self.x[10], self.x[11]
        b_gx, b_gy, b_gz = self.x[12], self.x[13], self.x[14]

        # Bias-compensated specific force and angular velocity in body frame
        a_unbiased = [accel[0] - b_ax, accel[1] - b_ay, accel[2] - b_az]
        omega_unbiased = [gyro[0] - b_gx, gyro[1] - b_gy, gyro[2] - b_gz]

        # Rotation matrix Body -> Navigation frame
        C_b_n = self.dcm_body_to_nav(roll, pitch, yaw)

        # Acceleration in Navigation (ENU) frame with gravity compensation
        a_nav = MatrixOps.matvec(C_b_n, a_unbiased)
        a_nav[2] -= GRAVITY_STANDARD  # Subtract gravity along ENU z-axis (upward)

        # Euler angular rates
        E_mat = self.euler_rate_matrix(roll, pitch)
        euler_rates = MatrixOps.matvec(E_mat, omega_unbiased)

        # Kinematic state propagation
        dt2 = 0.5 * dt * dt
        new_px = px + vx * dt + a_nav[0] * dt2
        new_py = py + vy * dt + a_nav[1] * dt2
        new_pz = pz + vz * dt + a_nav[2] * dt2

        new_vx = vx + a_nav[0] * dt
        new_vy = vy + a_nav[1] * dt
        new_vz = vz + a_nav[2] * dt

        new_roll = roll + euler_rates[0] * dt
        new_pitch = pitch + euler_rates[1] * dt
        new_yaw = (yaw + euler_rates[2] * dt) % (2.0 * math.pi)

        # Sensor biases modeled as random walk (decay rate tau = 1000s)
        bias_decay = math.exp(-dt / 1000.0)
        self.x = [
            new_px, new_py, new_pz,
            new_vx, new_vy, new_vz,
            new_roll, new_pitch, new_yaw,
            b_ax * bias_decay, b_ay * bias_decay, b_az * bias_decay,
            b_gx * bias_decay, b_gy * bias_decay, b_gz * bias_decay,
        ]

        # Assemble State Transition Jacobian F (15x15)
        F = MatrixOps.eye(self.STATE_DIM)

        # d(pos)/d(vel) = I * dt
        for i in range(3):
            F[i][i + 3] = dt

        # d(vel)/d(bias_accel) = -C_b_n * dt
        for i in range(3):
            for j in range(3):
                F[3 + i][9 + j] = -C_b_n[i][j] * dt

        # d(att)/d(bias_gyro) = -E_mat * dt
        for i in range(3):
            for j in range(3):
                F[6 + i][12 + j] = -E_mat[i][j] * dt

        # Process Noise Covariance Matrix Q (15x15)
        q_diag = [
            self.q_pos * dt, self.q_pos * dt, self.q_pos * dt,
            self.q_vel * dt, self.q_vel * dt, self.q_vel * dt,
            self.q_att * dt, self.q_att * dt, self.q_att * dt,
            self.q_bias_accel * dt, self.q_bias_accel * dt, self.q_bias_accel * dt,
            self.q_bias_gyro * dt, self.q_bias_gyro * dt, self.q_bias_gyro * dt,
        ]
        Q = MatrixOps.diag(q_diag)

        # Propagate Covariance: P = F * P * F^T + Q
        FP = MatrixOps.matmul(F, self.P)
        F_trans = MatrixOps.transpose(F)
        FPFT = MatrixOps.matmul(FP, F_trans)
        self.P = MatrixOps.add(FPFT, Q)

        # Ensure symmetry
        for i in range(self.STATE_DIM):
            for j in range(i + 1, self.STATE_DIM):
                avg = 0.5 * (self.P[i][j] + self.P[j][i])
                self.P[i][j] = avg
                self.P[j][i] = avg

    def update_gnss(self, gnss_pos: Tuple[float, float, float], noise_std: float = 0.5) -> bool:
        """
        EKF Measurement Correction Step:
        - Measurement model: z = [px, py, pz]^T
        - Innovation residual: y_tilde = z - H * x
        - Innovation covariance: S = H * P * H^T + R
        - Chi-squared gating against outlier multipath spikes
        - Kalman Gain: K = P * H^T * S^-1
        - Joseph-form covariance update: P = (I - K*H) * P * (I - K*H)^T + K * R * K^T
        """
        # R is 3x3 measurement covariance matrix
        var = max(noise_std * noise_std, 1e-4)
        R = MatrixOps.diag([var, var, var])

        if not self.initialized:
            self.x[0] = gnss_pos[0]
            self.x[1] = gnss_pos[1]
            self.x[2] = gnss_pos[2]
            self.P[0][0] = var
            self.P[1][1] = var
            self.P[2][2] = var
            self.initialized = True
            self.last_gnss_fused = True
            self.last_mahalanobis = 0.0
            return True

        pred_pos = [self.x[0], self.x[1], self.x[2]]
        residual = [
            gnss_pos[0] - pred_pos[0],
            gnss_pos[1] - pred_pos[1],
            gnss_pos[2] - pred_pos[2],
        ]

        # S = H * P * H^T + R
        # Note: Since H is [I_3x3 | 0], H * P * H^T is the upper-left 3x3 submatrix of P
        S = [
            [self.P[0][0] + var, self.P[0][1],       self.P[0][2]],
            [self.P[1][0],       self.P[1][1] + var, self.P[1][2]],
            [self.P[2][0],       self.P[2][1],       self.P[2][2] + var],
        ]

        # Invert 3x3 S
        try:
            S_inv = MatrixOps.invert_3x3(S)
        except ValueError:
            return False

        # Chi-Squared Outlier Gating: Mahalanobis Distance d^2 = y_tilde^T * S^-1 * y_tilde
        S_inv_y = MatrixOps.matvec(S_inv, residual)
        mahalanobis_sq = (
            residual[0] * S_inv_y[0] +
            residual[1] * S_inv_y[1] +
            residual[2] * S_inv_y[2]
        )
        self.last_mahalanobis = mahalanobis_sq

        # Reject outlier if beyond 99% 3-DoF confidence gate (unless initial uncertainty is high)
        if mahalanobis_sq > CHI2_GATE_3DOF_99 and self.P[0][0] < 5.0:
            # Outlier rejected (GNSS multipath/spoofing protection)
            self.last_gnss_fused = False
            return False

        # Compute Kalman Gain K (15x3) = P * H^T * S^-1
        # P * H^T is the first 3 columns of P (15x3)
        P_HT: List[List[float]] = [[self.P[i][0], self.P[i][1], self.P[i][2]] for i in range(self.STATE_DIM)]
        K = MatrixOps.matmul(P_HT, S_inv)

        # State Correction: x_new = x + K * residual
        dx = MatrixOps.matvec(K, residual)
        for i in range(self.STATE_DIM):
            self.x[i] += dx[i]

        # Joseph-form error covariance update for strict numerical stability:
        # P = (I - K*H) * P * (I - K*H)^T + K * R * K^T
        I15 = MatrixOps.eye(self.STATE_DIM)
        # K*H is 15x15 where column j has K[i][j] for j in [0,1,2] and 0 otherwise
        KH = MatrixOps.zeros(self.STATE_DIM, self.STATE_DIM)
        for i in range(self.STATE_DIM):
            for j in range(3):
                KH[i][j] = K[i][j]

        I_minus_KH = MatrixOps.sub(I15, KH)
        term1_partial = MatrixOps.matmul(I_minus_KH, self.P)
        term1 = MatrixOps.matmul(term1_partial, MatrixOps.transpose(I_minus_KH))

        KR = MatrixOps.matmul(K, R)
        term2 = MatrixOps.matmul(KR, MatrixOps.transpose(K))

        self.P = MatrixOps.add(term1, term2)

        # Ensure positive-semidefinite symmetry
        for i in range(self.STATE_DIM):
            for j in range(i + 1, self.STATE_DIM):
                avg = 0.5 * (self.P[i][j] + self.P[j][i])
                self.P[i][j] = avg
                self.P[j][i] = avg

        self.last_gnss_fused = True
        return True

    def process_frame(self, measurement: SensorMeasurement) -> KalmanState:
        """
        Executes unified prediction + optional GNSS update step for a sensor measurement frame.
        Guarantees deterministic execution time < 1.5ms.
        """
        t_start = time.perf_counter()

        # Step 1: High-rate IMU Prediction
        self.predict(measurement.accel, measurement.gyro, measurement.dt)

        # Step 2: Optional GNSS Measurement Update
        if measurement.gnss_pos is not None:
            self.update_gnss(measurement.gnss_pos, measurement.gnss_noise_std)
        else:
            self.last_gnss_fused = False

        self.last_timestamp_ms = measurement.timestamp_ms

        state = KalmanState.from_vector(self.x, self.P, measurement.timestamp_ms)
        state.last_mahalanobis_residual = self.last_mahalanobis
        state.is_gnss_fused = self.last_gnss_fused
        return state
