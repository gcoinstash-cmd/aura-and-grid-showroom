"""
APEX-208 Real-Time Options Surface & Implied Volatility Calibration Engine
Track 3: Production Reference Core (GF-T3-208)

Clean-room implementation of SABR model calibration (Hagan et al. 2002),
vectorized Black-76 implied volatility solver with Brenner-Subrahmanyam seed,
arbitrage-free surface boundary verification, and SHA-256 cryptographic ledger.
All prices, strikes, and metrics are expressed in dimensionless points (pts) or basis points (bps).
"""

import math
import time
import hashlib
import json
from typing import List, Dict, Tuple, Optional, Any
from dataclasses import dataclass, asdict

# Standard mathematical constants
SQRT_2PI = math.sqrt(2.0 * math.pi)
INV_SQRT_2PI = 1.0 / SQRT_2PI


def standard_normal_cdf(x: float) -> float:
    """Accurate polynomial approximation of cumulative standard normal distribution."""
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def standard_normal_pdf(x: float) -> float:
    """Standard normal probability density function."""
    return INV_SQRT_2PI * math.exp(-0.5 * x * x)


def black76_price(
    forward: float,
    strike: float,
    maturity: float,
    volatility: float,
    rate: float = 0.0,
    is_call: bool = True
) -> float:
    """
    Vectorized Black-76 European option pricer for forwards/futures.
    Units: forward (pts), strike (pts), maturity (years), volatility (decimal).
    """
    if maturity <= 1e-6 or volatility <= 1e-6:
        intrinsic = max(0.0, forward - strike) if is_call else max(0.0, strike - forward)
        return math.exp(-rate * maturity) * intrinsic

    discount = math.exp(-rate * maturity)
    sqrt_t = math.sqrt(maturity)
    d1 = (math.log(forward / strike) + 0.5 * volatility * volatility * maturity) / (volatility * sqrt_t)
    d2 = d1 - volatility * sqrt_t

    if is_call:
        return discount * (forward * standard_normal_cdf(d1) - strike * standard_normal_cdf(d2))
    else:
        return discount * (strike * standard_normal_cdf(-d2) - forward * standard_normal_cdf(-d1))


def black76_vega(
    forward: float,
    strike: float,
    maturity: float,
    volatility: float,
    rate: float = 0.0
) -> float:
    """Analytical Vega for Black-76 model: dC / d(vol)."""
    if maturity <= 1e-6 or volatility <= 1e-6:
        return 0.0
    discount = math.exp(-rate * maturity)
    sqrt_t = math.sqrt(maturity)
    d1 = (math.log(forward / strike) + 0.5 * volatility * volatility * maturity) / (volatility * sqrt_t)
    return discount * forward * sqrt_t * standard_normal_pdf(d1)


def black76_greeks(
    forward: float,
    strike: float,
    maturity: float,
    volatility: float,
    rate: float = 0.0,
    is_call: bool = True
) -> Dict[str, float]:
    """Calculate analytic Greeks: Delta, Gamma, Vega, Theta, Rho."""
    if maturity <= 1e-6 or volatility <= 1e-6:
        delta = 1.0 if (is_call and forward >= strike) else (-1.0 if (not is_call and forward < strike) else 0.0)
        return {"delta": delta, "gamma": 0.0, "vega": 0.0, "theta": 0.0, "rho": 0.0}

    discount = math.exp(-rate * maturity)
    sqrt_t = math.sqrt(maturity)
    vol_sqrt_t = volatility * sqrt_t
    d1 = (math.log(forward / strike) + 0.5 * volatility * volatility * maturity) / vol_sqrt_t
    d2 = d1 - vol_sqrt_t

    pdf_d1 = standard_normal_pdf(d1)
    cdf_d1 = standard_normal_cdf(d1)
    cdf_d2 = standard_normal_cdf(d2)

    delta = discount * cdf_d1 if is_call else discount * (cdf_d1 - 1.0)
    gamma = discount * pdf_d1 / (forward * vol_sqrt_t)
    vega = discount * forward * sqrt_t * pdf_d1
    theta_term = -(discount * forward * pdf_d1 * volatility) / (2.0 * sqrt_t)
    if is_call:
        theta = theta_term + rate * discount * (forward * cdf_d1 - strike * cdf_d2)
        rho = maturity * discount * (forward * cdf_d1 - strike * cdf_d2)
    else:
        theta = theta_term - rate * discount * (forward * (1.0 - cdf_d1) - strike * (1.0 - cdf_d2))
        rho = -maturity * discount * (strike * (1.0 - cdf_d2) - forward * (1.0 - cdf_d1))

    return {
        "delta": delta,
        "gamma": gamma,
        "vega": vega,
        "theta": theta / 365.0,  # 1-day theta
        "rho": rho / 100.0       # 1% rho
    }


def solve_implied_volatility(
    price: float,
    forward: float,
    strike: float,
    maturity: float,
    rate: float = 0.0,
    is_call: bool = True,
    tol: float = 1e-7,
    max_iter: int = 100
) -> float:
    """
    Robust Newton-Raphson solver with Brenner-Subrahmanyam (1988) initial seed
    and bounded bisection fallback to prevent divergence.
    """
    discount = math.exp(-rate * maturity)
    intrinsic = max(0.0, forward - strike) if is_call else max(0.0, strike - forward)
    undiscounted_intrinsic = discount * intrinsic

    if price <= undiscounted_intrinsic + 1e-9:
        return 0.001

    # Brenner-Subrahmanyam approximation for ATM / near-the-money seed
    sqrt_t = math.sqrt(maturity)
    vol = (math.sqrt(2.0 * math.pi) / (forward * sqrt_t)) * abs(price - (forward - strike) / 2.0)
    vol = max(0.01, min(vol, 3.0))

    low = 0.0001
    high = 5.0

    for _ in range(max_iter):
        p = black76_price(forward, strike, maturity, vol, rate, is_call)
        diff = p - price
        if abs(diff) < tol:
            return vol

        if diff > 0:
            high = min(high, vol)
        else:
            low = max(low, vol)

        vega = black76_vega(forward, strike, maturity, vol, rate)
        if vega > 1e-8:
            step = diff / vega
            new_vol = vol - step
            if low <= new_vol <= high:
                vol = new_vol
            else:
                vol = 0.5 * (low + high)
        else:
            vol = 0.5 * (low + high)

    return vol


def sabr_implied_volatility(
    forward: float,
    strike: float,
    maturity: float,
    alpha: float,
    beta: float,
    rho: float,
    nu: float
) -> float:
    """
    Hagan et al. (2002) analytical closed-form SABR implied volatility formula.
    Forward (pts), Strike (pts), Maturity (years).
    Parameters: alpha > 0, 0 <= beta <= 1, -1 < rho < 1, nu >= 0.
    """
    if maturity <= 1e-6:
        return alpha

    one_minus_beta = 1.0 - beta

    # ATM Case
    if abs(forward - strike) < 1e-6:
        fk_term = forward ** one_minus_beta
        term1 = alpha / fk_term
        term2 = (
            ((one_minus_beta ** 2) / 24.0) * (alpha ** 2) / (forward ** (2.0 * one_minus_beta))
            + 0.25 * (rho * beta * nu * alpha) / fk_term
            + ((2.0 - 3.0 * rho * rho) / 24.0) * (nu ** 2)
        )
        return term1 * (1.0 + term2 * maturity)

    # General OTM / ITM Case
    log_fk = math.log(forward / strike)
    fk = forward * strike
    sqrt_fk = math.sqrt(fk)
    fk_beta = sqrt_fk ** one_minus_beta

    z = (nu / alpha) * fk_beta * log_fk
    sq_term = 1.0 - 2.0 * rho * z + z * z
    if sq_term < 0.0:
        sq_term = 0.0
    chi_z = math.log((math.sqrt(sq_term) + z - rho) / (1.0 - rho))

    if abs(z) < 1e-6:
        z_over_chi = 1.0
    else:
        z_over_chi = z / chi_z

    denom_expansion = (
        1.0
        + ((one_minus_beta ** 2) / 24.0) * (log_fk ** 2)
        + ((one_minus_beta ** 4) / 1920.0) * (log_fk ** 4)
    )
    denominator = fk_beta * denom_expansion

    multiplier = 1.0 + (
        ((one_minus_beta ** 2) / 24.0) * (alpha ** 2) / (fk ** one_minus_beta)
        + 0.25 * (rho * beta * nu * alpha) / fk_beta
        + ((2.0 - 3.0 * rho * rho) / 24.0) * (nu ** 2)
    ) * maturity

    vol = (alpha / denominator) * z_over_chi * multiplier
    return max(0.0001, vol)


def calibrate_sabr_nelder_mead(
    forward: float,
    maturity: float,
    strikes: List[float],
    market_vols: List[float],
    beta: float = 0.7,
    initial_params: Optional[Tuple[float, float, float]] = None,
    max_iter: int = 400
) -> Tuple[float, float, float, float]:
    """
    Nelder-Mead downhill simplex optimization for calibrating SABR (alpha, rho, nu)
    with fixed beta (standard beta=0.7).
    Returns (alpha, rho, nu, rmse).
    """
    # Objective function: Root Mean Squared Error (RMSE) against market vols
    def objective(params: List[float]) -> float:
        alpha, rho, nu = params
        if alpha <= 0.0001 or nu <= 0.0001 or rho <= -0.999 or rho >= 0.999:
            return 1e6

        total_sq_err = 0.0
        for k, mv in zip(strikes, market_vols):
            model_vol = sabr_implied_volatility(forward, k, maturity, alpha, beta, rho, nu)
            err = model_vol - mv
            total_sq_err += err * err
        return math.sqrt(total_sq_err / len(strikes))

    # Initial parameter guess
    atm_vol = market_vols[len(market_vols) // 2]
    alpha_init = atm_vol * (forward ** (1.0 - beta))
    if initial_params:
        x0 = [initial_params[0], initial_params[1], initial_params[2]]
    else:
        x0 = [alpha_init, -0.25, 0.45]

    # Simplex construction: 3 parameters -> 4 vertices
    dim = 3
    simplex = [x0.copy()]
    steps = [x0[0] * 0.15, 0.1, 0.1]
    for i in range(dim):
        vertex = x0.copy()
        vertex[i] += steps[i]
        simplex.append(vertex)

    scores = [objective(v) for v in simplex]

    for _ in range(max_iter):
        # Sort simplex by score
        order = sorted(range(dim + 1), key=lambda i: scores[i])
        simplex = [simplex[i] for i in order]
        scores = [scores[i] for i in order]

        best = simplex[0]
        worst = simplex[-1]
        best_score = scores[0]

        if best_score < 1e-5:
            break

        # Centroid of all points except worst
        centroid = [sum(simplex[i][d] for i in range(dim)) / dim for d in range(dim)]

        # Reflection
        refl = [centroid[d] + 1.0 * (centroid[d] - worst[d]) for d in range(dim)]
        refl_score = objective(refl)

        if best_score <= refl_score < scores[dim - 1]:
            simplex[-1] = refl
            scores[-1] = refl_score
            continue

        # Expansion
        if refl_score < best_score:
            expn = [centroid[d] + 2.0 * (refl[d] - centroid[d]) for d in range(dim)]
            expn_score = objective(expn)
            if expn_score < refl_score:
                simplex[-1] = expn
                scores[-1] = expn_score
            else:
                simplex[-1] = refl
                scores[-1] = refl_score
            continue

        # Contraction
        contr = [centroid[d] + 0.5 * (worst[d] - centroid[d]) for d in range(dim)]
        contr_score = objective(contr)
        if contr_score < scores[-1]:
            simplex[-1] = contr
            scores[-1] = contr_score
            continue

        # Shrink toward best
        for i in range(1, dim + 1):
            simplex[i] = [best[d] + 0.5 * (simplex[i][d] - best[d]) for d in range(dim)]
            scores[i] = objective(simplex[i])

    opt_alpha, opt_rho, opt_nu = simplex[0]
    final_rmse = scores[0]
    return opt_alpha, opt_rho, opt_nu, final_rmse


def verify_calendar_arbitrage(
    forward: float,
    strikes: List[float],
    maturities: List[float],
    alpha: float,
    beta: float,
    rho: float,
    nu: float
) -> Dict[str, Any]:
    """
    Check calendar spread arbitrage: Total implied variance w(K, T) = vol^2 * T
    must be monotonically non-decreasing with respect to maturity T for each strike K.
    """
    violations = []
    w_matrix = []

    for k in strikes:
        row = []
        for t in maturities:
            vol = sabr_implied_volatility(forward, k, t, alpha, beta, rho, nu)
            w = (vol ** 2) * t
            row.append(w)
        w_matrix.append(row)

        for j in range(len(maturities) - 1):
            t1, t2 = maturities[j], maturities[j + 1]
            w1, w2 = row[j], row[j + 1]
            if w2 < w1 - 1e-6:
                violations.append({
                    "strike": k,
                    "maturity_1": t1,
                    "maturity_2": t2,
                    "variance_1": w1,
                    "variance_2": w2,
                    "spread_pts": w2 - w1
                })

    return {
        "is_arbitrage_free": len(violations) == 0,
        "violation_count": len(violations),
        "violations": violations,
        "variance_matrix": w_matrix
    }


def verify_butterfly_arbitrage(
    forward: float,
    maturity: float,
    strikes: List[float],
    alpha: float,
    beta: float,
    rho: float,
    nu: float,
    rate: float = 0.0
) -> Dict[str, Any]:
    """
    Check butterfly arbitrage / Breeden-Litzenberger risk-neutral density:
    d^2 C / dK^2 >= 0 for all strikes.
    Calculated via central second-order finite differences.
    """
    violations = []
    density_curve = []
    prices = []

    for k in strikes:
        vol = sabr_implied_volatility(forward, k, maturity, alpha, beta, rho, nu)
        c = black76_price(forward, k, maturity, vol, rate, is_call=True)
        prices.append(c)

    for i in range(1, len(strikes) - 1):
        k_prev, k_curr, k_next = strikes[i - 1], strikes[i], strikes[i + 1]
        c_prev, c_curr, c_next = prices[i - 1], prices[i], prices[i + 1]

        # Non-uniform strike mesh second derivative formula
        h1 = k_curr - k_prev
        h2 = k_next - k_curr
        d2c = 2.0 * ((c_next - c_curr) / h2 - (c_curr - c_prev) / h1) / (h1 + h2)
        density = math.exp(rate * maturity) * d2c
        density_curve.append({"strike": k_curr, "density": density, "d2c": d2c})

        if density < -1e-5:
            violations.append({
                "strike": k_curr,
                "density": density,
                "butterfly_cost_pts": c_prev - 2.0 * c_curr + c_next
            })

    return {
        "is_arbitrage_free": len(violations) == 0,
        "violation_count": len(violations),
        "violations": violations,
        "density_curve": density_curve
    }


@dataclass
class AuditLedgerBlock:
    index: int
    timestamp_utc: str
    prev_hash: str
    underlying: str
    spot: float
    sabr_params: Dict[str, float]
    rmse: float
    status: str
    block_hash: str


class CryptographicLedger:
    """Append-only SHA-256 state ledger for quant calibration tracking."""

    def __init__(self):
        self.chain: List[AuditLedgerBlock] = []
        # Genesis block
        genesis_hash = "0" * 64
        genesis_block = AuditLedgerBlock(
            index=0,
            timestamp_utc="2026-10-17T00:00:00.000000Z",
            prev_hash=genesis_hash,
            underlying="GENESIS-CORE",
            spot=0.0,
            sabr_params={"alpha": 0.0, "beta": 0.7, "rho": 0.0, "nu": 0.0},
            rmse=0.0,
            status="GENESIS_INITIALIZED",
            block_hash=hashlib.sha256("APEX-208_GENESIS_CORE".encode("utf-8")).hexdigest()
        )
        self.chain.append(genesis_block)

    def record_calibration(
        self,
        underlying: str,
        spot: float,
        alpha: float,
        beta: float,
        rho: float,
        nu: float,
        rmse: float,
        is_arbitrage_free: bool
    ) -> AuditLedgerBlock:
        prev = self.chain[-1]
        timestamp = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
        status = "ARBITRAGE_FREE" if is_arbitrage_free else "ARBITRAGE_VIOLATION"

        payload = {
            "index": prev.index + 1,
            "timestamp_utc": timestamp,
            "prev_hash": prev.block_hash,
            "underlying": underlying,
            "spot": spot,
            "sabr_params": {"alpha": alpha, "beta": beta, "rho": rho, "nu": nu},
            "rmse": rmse,
            "status": status
        }
        serialized = json.dumps(payload, sort_keys=True)
        block_hash = hashlib.sha256(serialized.encode("utf-8")).hexdigest()

        block = AuditLedgerBlock(
            index=payload["index"],
            timestamp_utc=timestamp,
            prev_hash=prev.block_hash,
            underlying=underlying,
            spot=spot,
            sabr_params=payload["sabr_params"],
            rmse=rmse,
            status=status,
            block_hash=block_hash
        )
        self.chain.append(block)
        return block

    def verify_integrity(self) -> Tuple[bool, Optional[str]]:
        for i in range(1, len(self.chain)):
            curr = self.chain[i]
            prev = self.chain[i - 1]

            if curr.prev_hash != prev.block_hash:
                return False, f"Broken link at block {curr.index}"

            payload = {
                "index": curr.index,
                "timestamp_utc": curr.timestamp_utc,
                "prev_hash": curr.prev_hash,
                "underlying": curr.underlying,
                "spot": curr.spot,
                "sabr_params": curr.sabr_params,
                "rmse": curr.rmse,
                "status": curr.status
            }
            computed = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()
            if computed != curr.block_hash:
                return False, f"Hash mismatch at block {curr.index}"

        return True, None


# Instantiated global ledger
GLOBAL_LEDGER = CryptographicLedger()


# Standard FastAPI backend implementation
try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel

    app = FastAPI(
        title="APEX-208 Options Surface & Volatility Calibration Engine",
        version="1.0.0",
        description="Institutional quantitative derivatives volatility surface engine."
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class CalibrationRequest(BaseModel):
        underlying: str
        spot: float
        maturity: float
        strikes: List[float]
        market_vols: List[float]
        beta: float = 0.7

    class SurfaceRequest(BaseModel):
        underlying: str
        spot: float
        maturities: List[float]
        strikes: List[float]
        alpha: float
        beta: float = 0.7
        rho: float
        nu: float

    @app.get("/health")
    def health_check():
        return {
            "status": "HEALTHY",
            "module": "APEX-208-VOL-ENGINE",
            "ledger_height": len(GLOBAL_LEDGER.chain),
            "timestamp": time.time()
        }

    @app.post("/api/v1/calibrate")
    def calibrate_surface(req: CalibrationRequest):
        alpha, rho, nu, rmse = calibrate_sabr_nelder_mead(
            forward=req.spot,
            maturity=req.maturity,
            strikes=req.strikes,
            market_vols=req.market_vols,
            beta=req.beta
        )
        butterfly = verify_butterfly_arbitrage(
            forward=req.spot,
            maturity=req.maturity,
            strikes=req.strikes,
            alpha=alpha,
            beta=req.beta,
            rho=rho,
            nu=nu
        )
        block = GLOBAL_LEDGER.record_calibration(
            underlying=req.underlying,
            spot=req.spot,
            alpha=alpha,
            beta=req.beta,
            rho=rho,
            nu=nu,
            rmse=rmse,
            is_arbitrage_free=butterfly["is_arbitrage_free"]
        )
        return {
            "underlying": req.underlying,
            "parameters": {"alpha": alpha, "beta": req.beta, "rho": rho, "nu": nu},
            "rmse": rmse,
            "butterfly_arbitrage": butterfly,
            "ledger_block": asdict(block)
        }

    @app.post("/api/v1/surface")
    def compute_surface(req: SurfaceRequest):
        grid = []
        for t in req.maturities:
            slice_points = []
            for k in req.strikes:
                vol = sabr_implied_volatility(req.spot, k, t, req.alpha, req.beta, req.rho, req.nu)
                price = black76_price(req.spot, k, t, vol, is_call=True)
                greeks = black76_greeks(req.spot, k, t, vol, is_call=True)
                slice_points.append({
                    "strike": k,
                    "maturity": t,
                    "implied_vol": vol,
                    "call_price": price,
                    "greeks": greeks
                })
            grid.append({"maturity": t, "points": slice_points})

        cal_check = verify_calendar_arbitrage(
            req.spot, req.strikes, req.maturities, req.alpha, req.beta, req.rho, req.nu
        )

        return {
            "underlying": req.underlying,
            "spot": req.spot,
            "grid": grid,
            "calendar_arbitrage": cal_check
        }

    @app.get("/api/v1/ledger")
    def get_ledger():
        valid, err = GLOBAL_LEDGER.verify_integrity()
        return {
            "height": len(GLOBAL_LEDGER.chain),
            "is_valid": valid,
            "verification_error": err,
            "blocks": [asdict(b) for b in GLOBAL_LEDGER.chain]
        }

except ImportError:
    # Standalone math engine mode without web dependencies installed
    app = None
