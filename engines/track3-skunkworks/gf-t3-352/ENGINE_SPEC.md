# GF-T3-352 Technical Specification & OpenAPI 3.1 Architecture

## 1. Unit Identity & Cluster Assignment
- **Unit Title**: GF-T3-352
- **Chassis Classification**: Track 3 (F1 Skunkworks Engine)
- **Assigned Cluster**: CLUSTER-006
- **Core Architecture**: Asynchronous FP4 Quantization & 4-Bit Weight-Only Dequantization Interlock

## 2. Synthetic Clean-Room Corridors
1. `FP4-CORRIDOR-ALPHA (DYNAMIC-4BIT-PACKING-FABRIC · 152600-GB/S)`
2. `FP4-CORRIDOR-BRAVO (WEIGHT-ONLY-DEQUANT-ENGINE)`
3. `FP4-CORRIDOR-GAMMA (NON-BLOCKING-FP4-UNPACKING-ROUTER)`
4. `FP4-CORRIDOR-DELTA (FALLBACK-INT8-UNPACKED-PASS)`

## 3. Mathematical Formulation (Zero-Dollar Notation)
The Asynchronous FP4 Quantization & 4-Bit Weight-Only Dequantization Interlock compresses frontier model weights to 4-bit E2M1 floating-point precision (1 sign bit, 2 exponent bits, 1 mantissa bit) and executes hardware-accelerated register-level unpacking fused with tensor core matrix multiplication:

```text
F_fp4 = sum_{j=0..J-1} D_fp4(W_fp4[j], X_activation[j], Delta_scale)
```

Where:
- `W_fp4`: Packed 4-bit E2M1 weight nibbles (2 weights per 8-bit byte, achieving 4X memory footprint reduction relative to 16-bit formats).
- `Delta_scale`: Block-level dynamic scaling factor computed as `max(abs(W_block)) / 6.0`.
- `D_fp4(nibble, Delta_scale)`: Register-level lookup decoding `(-1)^sign * LUT_E2M1[nibble & 0x07] * Delta_scale` with 0.01 µs unpacking latency and zero host CPU synchronization stalls.

## 4. OpenAPI 3.1 Endpoints (`engine.py`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/telemetry` | Returns live FP4 throughput (152,600 GB/s baseline), unpacking latency (0.01 µs), W0-W7 weight states, and token counters. |
| `POST` | `/api/v1/quantize-pass` | Executes packed 4-bit E2M1 quantization and fused dequantization dot-product verification. |
| `POST` | `/api/v1/actions/burst` | Triggers an asynchronous FP4 quantization burst across all 8 weight slots (168,400 GB/s peak). |
| `POST` | `/api/v1/actions/outlier-spike` | Toggles dynamic FP4 block scale re-calibration under simulated activation/weight outlier spikes. |
| `POST` | `/api/v1/actions/step-pass` | Steps a single non-blocking 4-bit weight-only dequantization pass across W0-W7. |
| `POST` | `/api/v1/actions/flush` | Flushes FP4 arenas and re-zeros weight buffers to deterministic baseline state. |
