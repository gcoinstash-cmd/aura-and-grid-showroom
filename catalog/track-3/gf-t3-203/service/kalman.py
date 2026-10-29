"""
APEX-203 State-Space 2D Kalman Filter
Clean-Room MIT Architecture — Zero Copyleft Dependencies

Estimates dynamic hedge ratio (Beta) and spread:
  y_t = [x_t, 1] * [beta_t, alpha_t]^T + e_t,  e_t ~ N(0, R)
  theta_t = theta_{t-1} + w_t,                 w_t ~ N(0, Q)
"""

from dataclasses import dataclass
from typing import Tuple


@dataclass
class KalmanState:
    beta: float
    alpha: float
    p00: float
    p01: float
    p10: float
    p11: float
    kalman_gain_beta: float
    kalman_gain_alpha: float
    fair_value_y: float
    spread: float
    innovation_variance: float


class KalmanFilter:
    def __init__(
        self,
        initial_beta: float = 1.0,
        initial_alpha: float = 0.0,
        initial_cov: float = 1.0,
        r_variance: float = 1e-3,
        q_variance: float = 1e-5,
    ):
        self.beta = float(initial_beta)
        self.alpha = float(initial_alpha)
        self.p00 = float(initial_cov)
        self.p01 = 0.0
        self.p10 = 0.0
        self.p11 = float(initial_cov)
        self.r = max(1e-9, float(r_variance))
        self.q = max(1e-12, float(q_variance))

    def update(self, price_y: float, price_x: float) -> KalmanState:
        # 1. State prediction: theta_{t|t-1} = theta_{t-1|t-1}
        # Covariance prediction: P_{t|t-1} = P_{t-1|t-1} + Q * I
        p00_pred = self.p00 + self.q
        p01_pred = self.p01
        p10_pred = self.p10
        p11_pred = self.p11 + self.q

        # 2. Observation: H_t = [price_x, 1.0]
        fair_value_prior = self.beta * price_x + self.alpha
        e_t = price_y - fair_value_prior  # Innovation

        # Innovation variance: F_t = H * P * H^T + R
        hp0 = price_x * p00_pred + p10_pred
        hp1 = price_x * p01_pred + p11_pred
        f_t = max(1e-12, hp0 * price_x + hp1 * 1.0 + self.r)

        # 3. Kalman Gain: K_t = P * H^T / F_t
        k0 = (p00_pred * price_x + p01_pred) / f_t
        k1 = (p10_pred * price_x + p11_pred) / f_t

        # 4. State update: theta_{t|t} = theta_{t|t-1} + K_t * e_t
        self.beta += k0 * e_t
        self.alpha += k1 * e_t

        # 5. Covariance update: P_{t|t} = (I - K_t * H_t) * P_{t|t-1}
        p00_new = p00_pred - k0 * hp0
        p01_new = p01_pred - k0 * hp1
        p10_new = p10_pred - k1 * hp0
        p11_new = p11_pred - k1 * hp1

        # Symmetrize and clamp diagonal > 0 for numerical stability
        p_sym = (p01_new + p10_new) / 2.0
        self.p00 = max(1e-12, p00_new)
        self.p01 = p_sym
        self.p10 = p_sym
        self.p11 = max(1e-12, p11_new)

        updated_fair_value = self.beta * price_x + self.alpha
        updated_spread = price_y - updated_fair_value

        return KalmanState(
            beta=self.beta,
            alpha=self.alpha,
            p00=self.p00,
            p01=self.p01,
            p10=self.p10,
            p11=self.p11,
            kalman_gain_beta=k0,
            kalman_gain_alpha=k1,
            fair_value_y=updated_fair_value,
            spread=updated_spread,
            innovation_variance=f_t,
        )

    def reset(self, initial_beta: float, initial_alpha: float = 0.0, initial_cov: float = 1.0):
        self.beta = float(initial_beta)
        self.alpha = float(initial_alpha)
        self.p00 = float(initial_cov)
        self.p01 = 0.0
        self.p10 = 0.0
        self.p11 = float(initial_cov)
