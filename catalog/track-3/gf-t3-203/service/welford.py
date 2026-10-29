"""
APEX-203 Welford's Algorithm Implementation for Rolling Z-Score
Clean-Room MIT Architecture — Zero Copyleft Dependencies

Provides O(1) time complexity updates with zero catastrophic cancellation.
"""

import math
from dataclasses import dataclass
from typing import List


@dataclass
class WelfordStats:
    count: int
    mean: float
    variance: float
    stdev: float
    z_score: float


class WelfordRollingStats:
    def __init__(self, window_size: int = 50):
        self.window_size = max(5, int(window_size))
        self.buffer: List[float] = [0.0] * self.window_size
        self.head = 0
        self.count = 0
        self.mean = 0.0
        self.m2 = 0.0

    def update(self, val: float) -> WelfordStats:
        val = float(val)
        if self.count < self.window_size:
            self.buffer[self.count] = val
            self.count += 1
            delta = val - self.mean
            self.mean += delta / self.count
            delta2 = val - self.mean
            self.m2 += delta * delta2
        else:
            old_val = self.buffer[self.head]
            self.buffer[self.head] = val
            self.head = (self.head + 1) % self.window_size

            old_mean = self.mean
            delta = val - old_val
            self.mean += delta / self.window_size

            self.m2 += (val - old_val) * (val - self.mean + (old_val - old_mean))

            if self.m2 < 0 or self.head == 0:
                self._recompute_moments()

        variance = max(0.0, self.m2 / (self.count - 1)) if self.count > 1 else 0.0
        stdev = math.sqrt(variance)

        epsilon = 1e-8
        z_score = (val - self.mean) / stdev if stdev > epsilon else 0.0

        return WelfordStats(
            count=self.count,
            mean=self.mean,
            variance=variance,
            stdev=stdev,
            z_score=z_score,
        )

    def _recompute_moments(self):
        n = self.count
        if n == 0:
            return
        mean = 0.0
        m2 = 0.0
        for i in range(n):
            x = self.buffer[i]
            delta = x - mean
            mean += delta / (i + 1)
            delta2 = x - mean
            m2 += delta * delta2
        self.mean = mean
        self.m2 = max(0.0, m2)

    def reset(self):
        self.buffer = [0.0] * self.window_size
        self.head = 0
        self.count = 0
        self.mean = 0.0
        self.m2 = 0.0
