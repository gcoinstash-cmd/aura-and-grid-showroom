# GF-T3-296 Integration Guide

## 1. Onboarding Existing Workflows
- Connect inference worker nodes to the `/api/v1/quantize` and `/api/v1/telemetry` endpoints over mTLS.
- Select synthetic corridor `FP8-CORRIDOR-ALPHA` for maximum 51,200 GB/s quantization saturation or `FP8-CORRIDOR-DELTA` for unquantized BF16 validation passes.

## 2. Identity, RBAC & Multi-Factor Authentication
- Supports external OIDC/SAML identity providers (Okta, Active Directory) with mandatory MFA enforcement for administrative trigger operations (`BURST`, `OUTLIER`, `STEP`, `FLUSH`).
- Role-Based Access Control (RBAC) separates read-only telemetry observers from pit-wall calibration operators.

## 3. Observability, Audit Logging & Export Formats
- Real-time distributed tracing via OpenTelemetry headers.
- Structured CSV and PDF compliance audit exports for GDPR, HIPAA, and SOC2 Type II verification.
