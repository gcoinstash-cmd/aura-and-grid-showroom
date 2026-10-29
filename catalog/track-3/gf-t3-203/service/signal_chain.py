"""
APEX-203 Signal Emitter & SHA-256 Chained Signal Audit Log
Clean-Room MIT Architecture — Zero Copyleft Dependencies
"""

import hashlib
import json
import time
from dataclasses import asdict, dataclass
from typing import List, Optional, Tuple


@dataclass
class AuditBlock:
    index: int
    timestamp: int
    previous_hash: str
    hash: str
    signal: str
    price_y: float
    price_x: float
    beta: float
    spread: float
    z_score: float
    half_life: float
    verified: bool


class SignalAuditChain:
    GENESIS_HASH = "0" * 64

    def __init__(self):
        self.chain: List[AuditBlock] = []
        self._create_genesis()

    def _create_genesis(self):
        ts = int(time.time() * 1000)
        payload = "APEX-203 QUANT ENGINE INITIALIZED // CLEAN-ROOM MIT IP AUDIT ROOT"
        raw_header = f"0:{self.GENESIS_HASH}:{ts}:{payload}"
        genesis_hash = hashlib.sha256(raw_header.encode("utf-8")).hexdigest()

        self.chain.append(
            AuditBlock(
                index=0,
                timestamp=ts,
                previous_hash=self.GENESIS_HASH,
                hash=genesis_hash,
                signal="NONE",
                price_y=0.0,
                price_x=0.0,
                beta=1.0,
                spread=0.0,
                z_score=0.0,
                half_life=0.0,
                verified=True,
            )
        )

    def append_signal(
        self,
        signal: str,
        price_y: float,
        price_x: float,
        beta: float,
        spread: float,
        z_score: float,
        half_life: float,
        timestamp: Optional[int] = None,
    ) -> AuditBlock:
        prev = self.chain[-1]
        index = prev.index + 1
        ts = timestamp if timestamp is not None else int(time.time() * 1000)
        hl_str = f"{half_life:.1f}" if half_life != float("inf") else "INF"
        payload = f"{signal}:{price_y:.4f}:{price_x:.4f}:{beta:.4f}:{spread:.4f}:{z_score:.4f}:{hl_str}"
        raw_header = f"{index}:{prev.hash}:{ts}:{payload}"
        block_hash = hashlib.sha256(raw_header.encode("utf-8")).hexdigest()

        block = AuditBlock(
            index=index,
            timestamp=ts,
            previous_hash=prev.hash,
            hash=block_hash,
            signal=signal,
            price_y=price_y,
            price_x=price_x,
            beta=beta,
            spread=spread,
            z_score=z_score,
            half_life=half_life,
            verified=True,
        )
        self.chain.append(block)
        return block

    def verify_integrity(self) -> Tuple[bool, Optional[int]]:
        if not self.chain:
            return False, 0
        for i in range(1, len(self.chain)):
            curr = self.chain[i]
            prev = self.chain[i - 1]
            if curr.previous_hash != prev.hash:
                return False, i

            hl_str = f"{curr.half_life:.1f}" if curr.half_life != float("inf") else "INF"
            payload = f"{curr.signal}:{curr.price_y:.4f}:{curr.price_x:.4f}:{curr.beta:.4f}:{curr.spread:.4f}:{curr.z_score:.4f}:{hl_str}"
            raw_header = f"{curr.index}:{curr.previous_hash}:{curr.timestamp}:{payload}"
            computed = hashlib.sha256(raw_header.encode("utf-8")).hexdigest()
            if computed != curr.hash:
                return False, i
        return True, None


class SignalEmitter:
    def __init__(
        self,
        entry_threshold: float = 2.0,
        exit_threshold: float = 0.5,
        stop_threshold: float = 3.5,
    ):
        self.entry_threshold = float(entry_threshold)
        self.exit_threshold = float(exit_threshold)
        self.stop_threshold = float(stop_threshold)
        self.position_side = "FLAT"  # FLAT, LONG_SPREAD, SHORT_SPREAD
        self.entry_beta = 1.0
        self.entry_spread = 0.0
        self.entry_price_y = 0.0
        self.entry_price_x = 0.0

    def evaluate(
        self,
        price_y: float,
        price_x: float,
        current_beta: float,
        current_spread: float,
        z_score: float,
    ) -> Tuple[str, str]:
        if self.position_side != "FLAT":
            # Check Stop-out
            if abs(z_score) >= self.stop_threshold:
                self.position_side = "FLAT"
                return "STOP_OUT", f"Stop-Out triggered at |Z|={abs(z_score):.2f}"

            # Check Exit Neutral
            if self.position_side == "LONG_SPREAD" and z_score >= -self.exit_threshold:
                self.position_side = "FLAT"
                return "EXIT_NEUTRAL", f"Long spread converged: Z={z_score:.2f} >= -{self.exit_threshold}"
            elif self.position_side == "SHORT_SPREAD" and z_score <= self.exit_threshold:
                self.position_side = "FLAT"
                return "EXIT_NEUTRAL", f"Short spread converged: Z={z_score:.2f} <= +{self.exit_threshold}"

            return "NONE", "Holding active spread position"

        # Position is FLAT
        if z_score <= -self.entry_threshold:
            self.position_side = "LONG_SPREAD"
            self.entry_beta = current_beta
            self.entry_spread = current_spread
            self.entry_price_y = price_y
            self.entry_price_x = price_x
            return "ENTER_LONG_SPREAD", f"Long spread entered at Z={z_score:.2f}"
        elif z_score >= self.entry_threshold:
            self.position_side = "SHORT_SPREAD"
            self.entry_beta = current_beta
            self.entry_spread = current_spread
            self.entry_price_y = price_y
            self.entry_price_x = price_x
            return "ENTER_SHORT_SPREAD", f"Short spread entered at Z={z_score:.2f}"

        return "NONE", "Holding neutral"
