# GF-T3-228 API Reference & Service Mesh Integration

## 1. Public & Internal Endpoints

### `GET /health`
Returns operational lock state and verification kernel status.

**Response (`200 OK`)**:
```json
{
  "engine_id": "GF-T3-228",
  "track": "TRACK 3",
  "status": "LOCKED",
  "verification_kernel": "UNIFIED_TREE_ATTENTION"
}
```

### `POST /api/v1/tree/verify`
Executes non-autoregressive candidate tree expansion, constructs the 12x12 causal tree-attention mask, performs single-pass target probability verification, and prunes low-confidence branches.

**Request Payload**:
```json
{
  "root_token": "def",
  "corridor": "SPEC-CORRIDOR-ALPHA (DYNAMIC-TREE-DRAFT · PARALLEL-VERIFY)",
  "pruning_threshold": 0.72,
  "temperature": 0.80,
  "low_confidence_divergence": false,
  "step_seed": 228
}
```

**Response Payload (`200 OK`)**:
- `engine_id`: `"GF-T3-228"`
- `accepted_count`: `7`
- `total_candidates`: `8`
- `acceptance_rate_pct`: `84.6`
- `speculative_speedup`: `2.85`
- `verification_overhead_ms`: `0.18`
- `verified_tokens_units`: `384000`
- `numerical_equivalence_delta`: `0.0`

## 2. Versioning & Authentication Policy
- All endpoints are versioned under `/api/v1/*`.
- Service mesh integration supports mTLS client certificates and Bearer JWT tokens mapped to PostgreSQL Row-Level Security (`auth.uid()`).
