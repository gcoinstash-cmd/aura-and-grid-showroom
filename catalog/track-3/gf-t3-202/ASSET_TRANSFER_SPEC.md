# APEX-202 High-Frequency Matching Engine
## Technical Asset Transfer Specification
**Document ID:** ASSET_TRANSFER_SPEC.md  
**Classification:** Enterprise Reference Core · Standalone Repository Transfer  
**Transfer Standard:** Standard Commercial Asset Transfer Specification  
**Transaction Structure:** Direct Clean-Room Asset Purchase Agreement (APA) Buyout  

---

## 1. Asset Scope & Handoff Structure

This technical asset transfer specification governs the complete, standalone repository transfer of the **APEX-202 High-Frequency Limit Order Book & Liquidity Matching Engine**.

### 1.1 Deliverable Manifest
The transacted asset comprises the complete self-contained codebase, specifications, and deployment manifests:
1. **Core Matching Engine**: `order_book.py` (Deterministic Price-Time Priority FIFO, dual-heap indexing, integer microunit arithmetic).
2. **Domain Models & OpenAPI Contract**: `models.py` (Pydantic V2 schemas, execution events, L2 depth responses).
3. **Turnkey Service Gateway**: `main.py` (FastAPI async microservice, RBAC header security scaffold).
4. **Automated Verification Suite**: `test_order_matching.py` (15 comprehensive unit tests, coverage verification).
5. **Technical Specifications**: `ENGINE_SPEC.md` (Algorithmic proofs, OpenAPI 3.1 definitions, data schemas).
6. **Container & Deployment Manifest**: `Dockerfile`, `requirements.txt` (Google Cloud Run turnkey production configuration).
7. **Legal & Compliance Manifests**: `LEGAL_IP_AUDIT.md`, `ASSET_TRANSFER_SPEC.md`.

---

## 2. Licensing Disclaimers & Clean Title Warranty

### 2.1 Direct Repository Handoff (Zero-SaaS Disclaimer)
- **Direct Repository Handoff**: The asset is transferred as a self-contained, standalone software repository delivered directly to the buyer's private source control infrastructure.
- **Zero Ongoing SaaS / Subscription Dependencies**: The software operates entirely on-premise or within the buyer's private cloud infrastructure. No external SaaS licensing servers, phone-home telemetry, or subscription verification endpoints exist in this codebase.
- **Zero Seat-Based Licensing**: The buyer receives unrestricted enterprise rights to deploy, scale, replicate, and run unlimited instances across internal clusters without per-seat, per-core, or per-node restrictions.
- **Zero Service-Level Agreement (SLA) Obligations**: The transfer is an outright asset purchase. Post-transfer maintenance, hosting, and operations are managed exclusively by the buyer's engineering personnel.

### 2.2 Clean Title Warranty
The transferor warrants that:
- The software assets are delivered free and clear of all liens, encumbrances, security interests, and adverse claims.
- The transfer conveys all assignable intellectual property rights, copyright, and trade secrets related to the APEX-202 implementation.

---

## 3. Google Cloud Run 1-Click Verification & Deployment

The APEX-202 engine container is configured for turnkey, single-command deployment to Google Cloud Run.

### 3.1 Environment Configuration
The service reads execution configuration from environment variables:

| Environment Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `8080` | Ingress listening port (injected dynamically by Cloud Run) |
| `PYTHONDONTWRITEBYTECODE` | `1` | Prevents Python bytecode cache generation |
| `PYTHONUNBUFFERED` | `1` | Forces unbuffered stdout/stderr streaming for audit logging |

### 3.2 Verification & Build Procedure

```bash
# 1. Build the production container image
docker build -t apex-matching-engine:latest .

# 2. Run container locally with health check validation
docker run -d --name apex-engine -p 8080:8080 apex-matching-engine:latest

# 3. Verify health endpoint
curl -s http://localhost:8080/api/v1/health | jq .

# 4. Deploy directly to Google Cloud Run
gcloud run deploy apex-matching-engine \
    --image gcr.io/[PROJECT-ID]/apex-matching-engine:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 1 \
    --max-instances 10
```

---

## 4. Cryptographic Ledger Validation Procedure

The APEX-202 engine incorporates continuous SHA-256 cryptographic chaining across all trade settlement events to ensure tamper-evident execution auditing.

### 4.1 Hash Chaining Formula
For each trade fill $i$, the checksum is deterministically calculated as:

$$H_i = \text{SHA-256}\left( H_{i-1} \parallel \text{Seq}_i \parallel \text{Symbol}_i \parallel \text{Price}_i \parallel \text{Quantity}_i \parallel \text{Settlement}_i \parallel \text{MakerID}_i \parallel \text{TakerID}_i \right)$$

where $H_0 = 0^{64}$ (64 hexadecimal zeros).

### 4.2 Audit Verification Script

To verify ledger integrity post-execution, execute the following deterministic validation script:

```python
import hashlib
import json

def verify_trade_chain(settlement_events: list) -> bool:
    """
    Verifies that every event in the settlement history satisfies the SHA-256 chain invariant.
    """
    previous_hash = "0" * 64
    for event in settlement_events:
        seq = event["sequence_number"]
        sym = event["symbol"]
        price = event["price_micros"]
        qty = event["quantity_micros"]
        settle = event["settlement_micros"]
        maker = event["maker_order_id"]
        taker = event["taker_order_id"]
        expected_digest = event["checksum_sha256"]

        payload = f"{previous_hash}:{seq}:{sym}:{price}:{qty}:{settle}:{maker}:{taker}"
        calculated_digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()

        if calculated_digest != expected_digest:
            print(f"Audit failure at sequence #{seq}!")
            return False

        previous_hash = calculated_digest

    print(f"Cryptographic chain verified: {len(settlement_events)} events tamper-free.")
    return True
```

This ensures zero-loss, audit-grade verification for institutional quantitative asset acquisitions.
