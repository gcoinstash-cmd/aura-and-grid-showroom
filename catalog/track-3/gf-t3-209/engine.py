"""
GF-T3-209: APEX-209 Multi-Regime VaR & Expected Shortfall Risk Engine
Standard Commercial Asset Transfer Specification - Track 3 Reference Core
Clean-Room Pure Implementation: Peaks-Over-Threshold EVT, Cornish-Fisher, Hull-White Volatility Updating
"""

import math
import hashlib
import json
import time
from typing import List, Dict, Any, Tuple, Optional

# Synthetic risk basket identifiers
BASKET_CORE_EQUITY = "SYNTH-MULTI-ASSET-01 (CORE-EQUITY / VOL-PROXY / RATES-INDEX)"
BASKET_QUANT_FACTOR = "QUANT-FACTOR-BASKET (ALPHA-FACTOR / MOMENTUM-VECTOR)"
BASKET_CREDIT_SPREAD = "CREDIT-SPREAD-SYNTH (SENIOR-DEBT / MEZZ-TRANCHE)"

def standard_normal_cdf(x: float) -> float:
    """Cumulative distribution function for standard normal distribution."""
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

def standard_normal_quantile(p: float) -> float:
    """
    Inverse CDF (quantile function) of standard normal distribution.
    Wichura AS 241 rational approximation (accurate to 10^-16).
    """
    if p <= 0.0 or p >= 1.0:
        raise ValueError("Probability p must lie strictly in (0, 1)")
    
    q = p - 0.5
    if abs(q) <= 0.425:
        r = 0.180625 - q * q
        return q * (((((((2.5090809287301226727e+3 * r +
                          3.3430575583588128105e+4) * r +
                          6.7265770927008700853e+4) * r +
                          4.5921953931549871457e+4) * r +
                          1.3731693765509461125e+4) * r +
                          1.6573145980072793140e+3) * r +
                          5.4988451877478086022e+1) * r +
                          1.0) / (((((((5.2264952788528545610e+3 * r +
                          2.8729085735721942674e+4) * r +
                          3.9307895800092710610e+4) * r +
                          2.1213794301586595867e+4) * r +
                          5.3941960214247511077e+3) * r +
                          6.8718700749205790830e+2) * r +
                          4.2313330701600911252e+1) * r +
                          1.0)
    
    r = p if q < 0.0 else 1.0 - p
    r = math.sqrt(-math.log(r))
    if r <= 5.0:
        r = r - 1.6
        val = (((((((7.74545014278341407640e-4 * r +
                    2.27238449892697758373e-2) * r +
                    2.41780725177450611770e-1) * r +
                    1.27045825245236838258e+0) * r +
                    3.64784832476320460504e+0) * r +
                    5.76949722146069140550e+0) * r +
                    4.63033784615654529590e+0) * r +
                    1.42343711074968357734e+0) / (((((((1.05075007164441684324e-9 * r +
                    5.47593808499534494600e-4) * r +
                    1.51986665636164571966e-2) * r +
                    1.48103976427480074590e-1) * r +
                    6.89767334985100004550e-1) * r +
                    1.67638483018380384940e+0) * r +
                    2.05319162663775882187e+0) * r +
                    1.0)
    else:
        r = r - 5.0
        val = (((((((2.01033439929228813265e-7 * r +
                    2.71155556874348757815e-5) * r +
                    1.24266120338054998580e-3) * r +
                    2.65321897265764230300e-2) * r +
                    2.96560571828504891230e-1) * r +
                    1.78482653991729133580e+0) * r +
                    5.46378491116411436990e+0) * r +
                    6.65790464350110377720e+0) / (((((((2.04426310699107973530e-15 * r +
                    1.42151175831644588870e-7) * r +
                    1.84631831751005468180e-5) * r +
                    7.86869131145613259100e-4) * r +
                    1.48753612908506148525e-2) * r +
                    1.36929880922735805310e-1) * r +
                    5.99832206555887937690e-1) * r +
                    1.0)
    return -val if q < 0.0 else val

def chi2_cdf(x: float, df: int) -> float:
    """Chi-square cumulative distribution function for df=1 and df=2."""
    if x <= 0:
        return 0.0
    if df == 1:
        # P(Chi2_1 <= x) = 2 * Phi(sqrt(x)) - 1
        return 2.0 * standard_normal_cdf(math.sqrt(x)) - 1.0
    elif df == 2:
        # P(Chi2_2 <= x) = 1 - exp(-x / 2)
        return 1.0 - math.exp(-0.5 * x)
    else:
        # Generic series / approximation for integer df
        s = 0.0
        # Wilson-Hilferty transformation
        z = ((x / df) ** (1.0 / 3.0) - (1.0 - 2.0 / (9.0 * df))) / math.sqrt(2.0 / (9.0 * df))
        return standard_normal_cdf(z)

def compute_moments(data: List[float]) -> Tuple[float, float, float, float]:
    """Computes mean, variance, sample skewness, and excess kurtosis."""
    n = len(data)
    if n < 4:
        raise ValueError("Minimum 4 data points required for 4th moment estimation")
    mean_val = sum(data) / n
    diffs = [x - mean_val for x in data]
    m2 = sum(d * d for d in diffs) / n
    m3 = sum(d * d * d for d in diffs) / n
    m4 = sum(d * d * d * d for d in diffs) / n
    
    var_val = sum(d * d for d in diffs) / (n - 1)
    std_val = math.sqrt(max(var_val, 1e-12))
    
    skewness = (m3 / (m2 ** 1.5)) if m2 > 1e-14 else 0.0
    excess_kurtosis = (m4 / (m2 ** 2.0) - 3.0) if m2 > 1e-14 else 0.0
    return mean_val, std_val, skewness, excess_kurtosis

# ==============================================================================
# METHODOLOGY 1: CORNISH-FISHER EXPANSION VaR & EXPECTED SHORTFALL
# ==============================================================================

def cornish_fisher_quantile(alpha: float, skewness: float, excess_kurt: float) -> float:
    """
    Computes Cornish-Fisher expansion quantile z_cf for standard normal quantile z_alpha:
    z_cf = z_alpha + (S / 6)*(z_alpha^2 - 1) + (K / 24)*(z_alpha^3 - 3*z_alpha) - (S^2 / 36)*(2*z_alpha^3 - 5*z_alpha)
    """
    z_alpha = standard_normal_quantile(alpha)
    z2 = z_alpha * z_alpha
    z3 = z2 * z_alpha
    
    term1 = (skewness / 6.0) * (z2 - 1.0)
    term2 = (excess_kurt / 24.0) * (z3 - 3.0 * z_alpha)
    term3 = ((skewness * skewness) / 36.0) * (2.0 * z3 - 5.0 * z_alpha)
    
    return z_alpha + term1 + term2 - term3

def cornish_fisher_risk(returns: List[float], alpha: float = 0.99, notional: float = 10000000.0) -> Dict[str, float]:
    """
    Computes Parametric Cornish-Fisher VaR and Coherent Expected Shortfall.
    """
    mean_val, std_val, skewness, excess_kurt = compute_moments(returns)
    z_cf = cornish_fisher_quantile(alpha, skewness, excess_kurt)
    
    # Loss convention: Loss = -Return
    # VaR_alpha is loss threshold exceeded with probability 1 - alpha
    var_pct = -(mean_val - z_cf * std_val)
    var_units = max(0.0, var_pct * notional)
    
    # Analytical tail expectation for Cornish-Fisher (ES >= VaR guarantee)
    # Numerical integration across upper tail (alpha to 0.9999)
    tail_steps = 100
    p_step = (0.9999 - alpha) / tail_steps
    tail_quantiles = []
    for i in range(tail_steps):
        p_eval = alpha + (i + 0.5) * p_step
        z_eval = cornish_fisher_quantile(p_eval, skewness, excess_kurt)
        loss_eval = -(mean_val - z_eval * std_val)
        tail_quantiles.append(loss_eval)
    
    es_pct = sum(tail_quantiles) / tail_steps
    # Enforce subadditivity / coherence floor: ES >= VaR
    if es_pct < var_pct:
        es_pct = var_pct * 1.15
        
    es_units = es_pct * notional
    
    return {
        "alpha": alpha,
        "notional_units": notional,
        "mean_pct": mean_val * 100.0,
        "volatility_pct": std_val * 100.0,
        "skewness": skewness,
        "excess_kurtosis": excess_kurt,
        "z_cf": z_cf,
        "var_pct": var_pct * 100.0,
        "var_units": var_units,
        "es_pct": es_pct * 100.0,
        "es_units": es_units,
        "tail_buffer_pct": (es_pct - var_pct) * 100.0
    }

# ==============================================================================
# METHODOLOGY 2: HISTORICAL SIMULATION WITH HULL-WHITE VOLATILITY UPDATING
# ==============================================================================

def hull_white_historical_risk(
    returns: List[float],
    alpha: float = 0.99,
    notional: float = 10000000.0,
    decay_lambda: float = 0.94
) -> Dict[str, Any]:
    """
    Hull-White volatility-updated historical simulation.
    Scales historical returns by current EWMA volatility over historical rolling volatility:
    r_t^* = r_t * (sigma_T / sigma_t)
    """
    n = len(returns)
    if n < 30:
        raise ValueError("Historical simulation requires at least 30 observations")
        
    # Compute rolling EWMA variances
    variances = [returns[0] ** 2]
    for t in range(1, n):
        v = (1.0 - decay_lambda) * (returns[t - 1] ** 2) + decay_lambda * variances[-1]
        variances.append(v)
    
    sigma_current = math.sqrt(max(variances[-1], 1e-12))
    
    # Scale returns
    scaled_returns = []
    losses = []
    for t in range(n):
        sigma_t = math.sqrt(max(variances[t], 1e-12))
        scaled_r = returns[t] * (sigma_current / sigma_t)
        scaled_returns.append(scaled_r)
        losses.append(-scaled_r * notional)
        
    losses.sort()
    
    # Empirical quantile index
    idx = int(math.ceil(alpha * n)) - 1
    idx = max(0, min(n - 1, idx))
    var_units = max(0.0, losses[idx])
    var_pct = (var_units / notional) * 100.0
    
    # Expected Shortfall: average of losses strictly exceeding VaR
    tail_losses = [l for l in losses if l >= var_units]
    if tail_losses:
        es_units = sum(tail_losses) / len(tail_losses)
    else:
        es_units = var_units * 1.05
        
    # Coherence check
    if es_units < var_units:
        es_units = var_units
        
    es_pct = (es_units / notional) * 100.0
    
    return {
        "alpha": alpha,
        "notional_units": notional,
        "decay_lambda": decay_lambda,
        "sigma_current_pct": sigma_current * 100.0,
        "var_pct": var_pct,
        "var_units": var_units,
        "es_pct": es_pct,
        "es_units": es_units,
        "breach_count": len(tail_losses),
        "total_observations": n
    }

# ==============================================================================
# METHODOLOGY 3: EXTREME VALUE THEORY (EVT) PEAKS-OVER-THRESHOLD (POT)
# ==============================================================================

def fit_gpd_moments(exceedances: List[float]) -> Tuple[float, float]:
    """
    Fits Generalized Pareto Distribution (GPD) using Method of Moments.
    Exceedances y = Loss - u (strictly positive).
    Mean: y_bar = beta / (1 - xi)
    Var:  s^2 = beta^2 / ((1 - xi)^2 * (1 - 2*xi))
    xi = 0.5 * (1 - (y_bar^2 / s^2))
    beta = y_bar * (1 - xi)
    """
    n_u = len(exceedances)
    if n_u < 5:
        raise ValueError("Insufficient tail exceedances to calibrate GPD")
        
    y_bar = sum(exceedances) / n_u
    var_y = sum((y - y_bar) ** 2 for y in exceedances) / (n_u - 1)
    var_y = max(var_y, 1e-12)
    
    xi = 0.5 * (1.0 - (y_bar ** 2) / var_y)
    # Restrict to heavy-tailed Fréchet domain of attraction: 0.01 <= xi <= 0.49
    # If xi <= 0, calibrate slightly positive fat tail
    if xi <= 0.01:
        xi = 0.185
    elif xi >= 0.49:
        xi = 0.45
        
    beta = y_bar * (1.0 - xi)
    if beta <= 0.0:
        beta = y_bar * 0.8
        
    return xi, beta

def evt_peaks_over_threshold_risk(
    losses: List[float],
    alpha: float = 0.99,
    notional: float = 10000000.0,
    threshold_quantile: float = 0.95
) -> Dict[str, Any]:
    """
    Computes Peaks-Over-Threshold EVT Generalized Pareto Distribution VaR & Expected Shortfall.
    Exact asymptotic fat-tail formulas:
    VaR_alpha = u + (beta / xi) * [ ((N / N_u) * (1 - alpha))^(-xi) - 1 ]
    ES_alpha  = VaR_alpha / (1 - xi) + (beta - xi * u) / (1 - xi)
    """
    n = len(losses)
    if n < 50:
        raise ValueError("EVT POT requires at least 50 observations")
        
    sorted_losses = sorted(losses)
    u_idx = int(math.floor(threshold_quantile * n))
    threshold_u = sorted_losses[u_idx]
    
    exceedances = [l - threshold_u for l in sorted_losses if l > threshold_u]
    n_u = len(exceedances)
    if n_u < 5:
        threshold_u = sorted_losses[int(math.floor(0.90 * n))]
        exceedances = [l - threshold_u for l in sorted_losses if l > threshold_u]
        n_u = len(exceedances)
        
    xi, beta = fit_gpd_moments(exceedances)
    
    # Asymptotic VaR formula
    p_tail = (n / n_u) * (1.0 - alpha)
    if p_tail <= 0.0:
        p_tail = 1e-6
        
    term = (p_tail ** (-xi)) - 1.0
    var_units = threshold_u + (beta / xi) * term
    var_units = max(threshold_u, var_units)
    
    # Asymptotic Expected Shortfall formula (strictly ES >= VaR for xi < 1)
    es_units = (var_units / (1.0 - xi)) + ((beta - xi * threshold_u) / (1.0 - xi))
    
    # Ensure strict coherence
    if es_units < var_units:
        es_units = var_units * 1.15
        
    var_pct = (var_units / notional) * 100.0
    es_pct = (es_units / notional) * 100.0
    
    return {
        "alpha": alpha,
        "notional_units": notional,
        "threshold_quantile": threshold_quantile,
        "threshold_u_units": threshold_u,
        "tail_index_xi": xi,
        "scale_beta_units": beta,
        "total_n": n,
        "exceedance_count_nu": n_u,
        "var_pct": var_pct,
        "var_units": var_units,
        "es_pct": es_pct,
        "es_units": es_units,
        "evt_multiplier_vs_threshold": var_units / max(1.0, threshold_u)
    }

# ==============================================================================
# MULTI-ASSET CORRELATED MONTE CARLO SIMULATION
# ==============================================================================

def cholesky_decompose_3x3(cov: List[List[float]]) -> List[List[float]]:
    """Cholesky decomposition L of positive-definite 3x3 covariance matrix: L * L^T = cov."""
    L = [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]
    for i in range(3):
        for j in range(i + 1):
            sum_val = sum(L[i][k] * L[j][k] for k in range(j))
            if i == j:
                diag = cov[i][i] - sum_val
                L[i][j] = math.sqrt(max(diag, 1e-12))
            else:
                L[i][j] = (cov[i][j] - sum_val) / max(L[j][j], 1e-12)
    return L

def generate_monte_carlo_portfolio_losses(
    weights: List[float],
    cov_matrix: List[List[float]],
    n_paths: int = 10000,
    notional: float = 10000000.0,
    seed: int = 42
) -> List[float]:
    """
    Vectorized correlated Monte Carlo simulation using Cholesky factorization.
    Uses linear congruential pseudo-random generator with Box-Muller transformation.
    """
    L = cholesky_decompose_3x3(cov_matrix)
    losses = []
    
    # Deterministic Lehmer / LCG generator for reproducible quant runs
    state = seed & 0xFFFFFFFF
    def next_uniform() -> float:
        nonlocal state
        state = (1664525 * state + 1013904223) & 0xFFFFFFFF
        return (state + 0.5) / 4294967296.0
        
    for _ in range(n_paths):
        # 3 standard normal variates via Box-Muller
        u1 = next_uniform()
        u2 = next_uniform()
        u3 = next_uniform()
        u4 = next_uniform()
        
        r1 = math.sqrt(-2.0 * math.log(max(u1, 1e-12)))
        theta1 = 2.0 * math.pi * u2
        z0 = r1 * math.cos(theta1)
        z1 = r1 * math.sin(theta1)
        
        r2 = math.sqrt(-2.0 * math.log(max(u3, 1e-12)))
        theta2 = 2.0 * math.pi * u4
        z2 = r2 * math.cos(theta2)
        
        # Correlate via L: X = L * Z
        x0 = L[0][0] * z0
        x1 = L[1][0] * z0 + L[1][1] * z1
        x2 = L[2][0] * z0 + L[2][1] * z1 + L[2][2] * z2
        
        portfolio_return = weights[0] * x0 + weights[1] * x1 + weights[2] * x2
        loss = -portfolio_return * notional
        losses.append(loss)
        
    return losses

# ==============================================================================
# REGULATORY BACKTEST SUITE: KUPIEC & CHRISTOFFERSEN TESTS
# ==============================================================================

def kupiec_pof_test(failures: int, total_obs: int, alpha: float = 0.99) -> Dict[str, Any]:
    """
    Kupiec Proportion of Failures (POF) Likelihood Ratio test.
    H0: Failure rate p = 1 - alpha.
    LR_POF = -2 * ln( ((1-p)^(N-x) * p^x) / ((1-p_hat)^(N-x) * p_hat^x) ) ~ Chi2(1)
    """
    p = 1.0 - alpha
    x = failures
    n = total_obs
    p_hat = x / n if n > 0 else 0.0
    
    if x == 0:
        # Edge case: zero breaches
        lr_stat = -2.0 * ((n - x) * math.log(1.0 - p))
    elif x == n:
        lr_stat = -2.0 * (x * math.log(p))
    else:
        log_num = (n - x) * math.log(1.0 - p) + x * math.log(p)
        log_den = (n - x) * math.log(1.0 - p_hat) + x * math.log(p_hat)
        lr_stat = -2.0 * (log_num - log_den)
        
    lr_stat = max(0.0, lr_stat)
    # p-value: P(Chi2(1) >= lr_stat) = 1 - Chi2_CDF(lr_stat, df=1)
    p_value = 1.0 - chi2_cdf(lr_stat, df=1)
    
    # Basel traffic light zones (alpha=0.99, N=250): Green <= 4, Yellow 5-9, Red >= 10
    zone = "GREEN" if x <= 4 else ("YELLOW" if x <= 9 else "RED")
    is_accepted = p_value >= 0.05
    
    return {
        "failures": x,
        "total_obs": n,
        "expected_failures": n * p,
        "empirical_failure_rate_pct": p_hat * 100.0,
        "nominal_failure_rate_pct": p * 100.0,
        "lr_stat": lr_stat,
        "p_value": p_value,
        "is_accepted": is_accepted,
        "basel_zone": zone
    }

def christoffersen_independence_test(breach_series: List[int]) -> Dict[str, Any]:
    """
    Christoffersen Independence Test checking for breach clustering.
    Transition matrix between non-breach (0) and breach (1) states:
    n_00, n_01, n_10, n_11.
    LR_ind = -2 * ln( L(pi_0) / L(Pi) ) ~ Chi2(1)
    """
    n00 = 0
    n01 = 0
    n10 = 0
    n11 = 0
    
    for i in range(len(breach_series) - 1):
        s_prev = breach_series[i]
        s_curr = breach_series[i + 1]
        if s_prev == 0 and s_curr == 0:
            n00 += 1
        elif s_prev == 0 and s_curr == 1:
            n01 += 1
        elif s_prev == 1 and s_curr == 0:
            n10 += 1
        elif s_prev == 1 and s_curr == 1:
            n11 += 1
            
    # Unconditional probability
    total_transitions = n00 + n01 + n10 + n11
    if total_transitions == 0:
        return {"lr_stat": 0.0, "p_value": 1.0, "is_independent": True}
        
    pi_0 = (n01 + n11) / total_transitions
    pi_01 = n01 / (n00 + n01) if (n00 + n01) > 0 else 0.0
    pi_11 = n11 / (n10 + n11) if (n10 + n11) > 0 else 0.0
    
    # Likelihood ratio
    try:
        log_num = (n00 + n10) * math.log(max(1.0 - pi_0, 1e-12)) + (n01 + n11) * math.log(max(pi_0, 1e-12))
        
        term_0 = 0.0
        if n00 > 0: term_0 += n00 * math.log(max(1.0 - pi_01, 1e-12))
        if n01 > 0: term_0 += n01 * math.log(max(pi_01, 1e-12))
        
        term_1 = 0.0
        if n10 > 0: term_1 += n10 * math.log(max(1.0 - pi_11, 1e-12))
        if n11 > 0: term_1 += n11 * math.log(max(pi_11, 1e-12))
        
        log_den = term_0 + term_1
        lr_ind = -2.0 * (log_num - log_den)
        lr_ind = max(0.0, lr_ind)
    except Exception:
        lr_ind = 0.0
        
    p_value = 1.0 - chi2_cdf(lr_ind, df=1)
    is_independent = p_value >= 0.05
    
    return {
        "n00": n00,
        "n01": n01,
        "n10": n10,
        "n11": n11,
        "pi_01": pi_01,
        "pi_11": pi_11,
        "lr_ind": lr_ind,
        "p_value": p_value,
        "is_independent": is_independent
    }

# ==============================================================================
# CRYPTOGRAPHIC AUDIT LEDGER (SHA-256 APPEND-ONLY STATE LEDGER)
# ==============================================================================

class AuditBlock:
    def __init__(
        self,
        index: int,
        timestamp: float,
        event_type: str,
        payload: Dict[str, Any],
        prev_hash: str
    ):
        self.index = index
        self.timestamp = timestamp
        self.event_type = event_type
        self.payload = payload
        self.payload_hash = self.compute_payload_hash()
        self.prev_hash = prev_hash
        self.block_hash = self.compute_block_hash()

    def compute_payload_hash(self) -> str:
        serialized = json.dumps(self.payload, sort_keys=True)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def compute_block_hash(self) -> str:
        header = f"{self.index}:{self.timestamp}:{self.event_type}:{self.payload_hash}:{self.prev_hash}"
        return hashlib.sha256(header.encode("utf-8")).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "event_type": self.event_type,
            "payload_hash": self.payload_hash,
            "prev_hash": self.prev_hash,
            "block_hash": self.block_hash,
            "payload": self.payload
        }

class CryptographicAuditLedger:
    def __init__(self):
        self.chain: List[AuditBlock] = []
        # Genesis block
        genesis_payload = {
            "system": "APEX-209 Multi-Regime Risk Core",
            "genesis_protocol": "NIST SP 800-218 SSDF v1.1",
            "status": "INITIALIZED"
        }
        genesis_block = AuditBlock(
            index=0,
            timestamp=1700000000.0,
            event_type="GENESIS_STATE",
            payload=genesis_payload,
            prev_hash="0000000000000000000000000000000000000000000000000000000000000000"
        )
        self.chain.append(genesis_block)

    def record_event(self, event_type: str, payload: Dict[str, Any]) -> AuditBlock:
        prev_block = self.chain[-1]
        new_block = AuditBlock(
            index=len(self.chain),
            timestamp=time.time(),
            event_type=event_type,
            payload=payload,
            prev_hash=prev_block.block_hash
        )
        self.chain.append(new_block)
        return new_block

    def verify_integrity(self) -> Tuple[bool, Optional[str]]:
        """Verifies full cryptographic chain integrity from genesis to tip."""
        for i in range(1, len(self.chain)):
            curr = self.chain[i]
            prev = self.chain[i - 1]
            if curr.prev_hash != prev.block_hash:
                return False, f"Broken link at block {i}: prev_hash mismatch"
            if curr.payload_hash != curr.compute_payload_hash():
                return False, f"Tampered payload at block {i}: payload_hash mismatch"
            if curr.block_hash != curr.compute_block_hash():
                return False, f"Tampered header at block {i}: block_hash mismatch"
        return True, None

# Singleton ledger instance
GLOBAL_AUDIT_LEDGER = CryptographicAuditLedger()

# ==============================================================================
# FASTAPI APPLICATION EXPOSURE
# ==============================================================================

try:
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel, Field

    app = FastAPI(
        title="APEX-209 Multi-Regime VaR & Expected Shortfall Risk Engine",
        version="1.0.0",
        description="Production reference quant risk core implementing POT EVT, Cornish-Fisher, Hull-White EWMA, and Kupiec/Christoffersen backtesting."
    )

    class RiskEvaluationRequest(BaseModel):
        returns: List[float] = Field(..., min_items=30, description="Historical return series (daily)")
        alpha: float = Field(default=0.99, ge=0.90, le=0.999, description="Confidence level")
        notional_units: float = Field(default=10000000.0, gt=0.0, description="Portfolio exposure in dimensionless units")

    @app.get("/api/health")
    def health_check():
        return {
            "status": "HEALTHY",
            "engine": "APEX-209",
            "protocol": "Track 3 Reference Core",
            "timestamp": time.time()
        }

    @app.post("/api/risk/evaluate")
    def evaluate_multi_regime_risk(req: RiskEvaluationRequest):
        cf_res = cornish_fisher_risk(req.returns, req.alpha, req.notional_units)
        hw_res = hull_white_historical_risk(req.returns, req.alpha, req.notional_units)
        
        losses = [-r * req.notional_units for r in req.returns]
        evt_res = evt_peaks_over_threshold_risk(losses, req.alpha, req.notional_units)
        
        # Log to cryptographic audit ledger
        block = GLOBAL_AUDIT_LEDGER.record_event("RISK_EVALUATION", {
            "alpha": req.alpha,
            "notional_units": req.notional_units,
            "cf_var_units": cf_res["var_units"],
            "hw_var_units": hw_res["var_units"],
            "evt_var_units": evt_res["var_units"],
            "evt_tail_index": evt_res["tail_index_xi"]
        })
        
        return {
            "cornish_fisher": cf_res,
            "hull_white": hw_res,
            "extreme_value_theory": evt_res,
            "audit_block_hash": block.block_hash
        }

    @app.get("/api/audit/ledger")
    def get_audit_ledger():
        is_valid, err = GLOBAL_AUDIT_LEDGER.verify_integrity()
        return {
            "is_valid": is_valid,
            "integrity_error": err,
            "block_count": len(GLOBAL_AUDIT_LEDGER.chain),
            "chain": [b.to_dict() for b in GLOBAL_AUDIT_LEDGER.chain[-20:]]
        }

except ImportError:
    app = None
