"""
APEX-203 Ornstein-Uhlenbeck (OU) Process & Half-Life Estimator
Clean-Room MIT Architecture — Zero Copyleft Dependencies

Estimates mean-reversion speed theta and half-life tau_{1/2} = ln(2) / theta
via discrete AR(1) OLS regression.
"""

import math
from dataclasses import dataclass
from typing import List


@dataclass
class OrnsteinUhlenbeckStats:
    theta: float
    half_life: float
    is_mean_reverting: bool
    residual_variance: float


class OrnsteinUhlenbeckEstimator:
    def __init__(self, window_size: int = 60):
        self.window_size = max(15, int(window_size))
        self.history: List[float] = []

    def update(self, spread: float) -> OrnsteinUhlenbeckStats:
        self.history.append(float(spread))
        if len(self.history) > self.window_size:
            self.history.pop(0)

        n = len(self.history)
        if n < 10:
            return OrnsteinUhlenbeckStats(
                theta=0.0,
                half_life=float("inf"),
                is_mean_reverting=False,
                residual_variance=0.0,
            )

        sample_count = n - 1
        sum_x = 0.0
        sum_y = 0.0

        for i in range(sample_count):
            s_prev = self.history[i]
            s_curr = self.history[i + 1]
            sum_x += s_prev
            sum_y += (s_curr - s_prev)

        mean_x = sum_x / sample_count
        mean_y = sum_y / sample_count

        cov_xy = 0.0
        var_x = 0.0

        for i in range(sample_count):
            s_prev = self.history[i]
            s_curr = self.history[i + 1]
            dx = s_prev - mean_x
            dy = (s_curr - s_prev) - mean_y
            cov_xy += dx * dy
            var_x += dx * dx

        if var_x < 1e-10:
            return OrnsteinUhlenbeckStats(
                theta=0.0,
                half_life=float("inf"),
                is_mean_reverting=False,
                residual_variance=0.0,
            )

        b = cov_xy / var_x
        a = mean_y - b * mean_x

        theta = 0.0
        half_life = float("inf")
        is_mean_reverting = False

        if b < -1e-6 and (1.0 + b) > 1e-6:
            theta = -math.log(1.0 + b)
            if theta > 1e-6:
                half_life = math.log(2.0) / theta
                is_mean_reverting = (0.5 < half_life < 1000.0)

        sse = 0.0
        for i in range(sample_count):
            s_prev = self.history[i]
            s_curr = self.history[i + 1]
            delta = s_curr - s_prev
            pred = a + b * s_prev
            res = delta - pred
            sse += res * res

        res_var = sse / (sample_count - 2) if sample_count > 2 else 0.0

        return OrnsteinUhlenbeckStats(
            theta=theta,
            half_life=round(half_life, 2) if math.isfinite(half_life) else float("inf"),
            is_mean_reverting=is_mean_reverting,
            residual_variance=res_var,
        )

    def reset(self):
        self.history.clear()
