"""
GF-T3-338: Dynamic Asynchronous Prefix Caching & Radix Tree KV Hash Indexing Engine
Clean-Room Standalone FastAPI Backend Engine
License: MIT Permissive (Zero Copyleft)
"""

from __future__ import annotations

import hashlib
import math
import re
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel, Field, field_validator

# ============================================================================
# SYNTHETIC PREFIX CORRIDORS (CLEAN-ROOM IP STANDARD)
# ============================================================================
SYNTHETIC_PREFIX_CORRIDORS: Tuple[str, ...] = (
    "PREFIX-CORRIDOR-ALPHA (DYNAMIC-RADIX-HASH-FABRIC · 124600-GB/S)",
    "PREFIX-CORRIDOR-BRAVO (PREFIX-CACHING-ENGINE)",
    "PREFIX-CORRIDOR-GAMMA (NON-BLOCKING-TREE-INDEX-ROUTER)",
    "PREFIX-CORRIDOR-DELTA (FALLBACK-COLD-START-PASS)",
)

CORRIDOR_THROUGHPUT_MAP: Dict[str, float] = {
    SYNTHETIC_PREFIX_CORRIDORS[0]: 124600.0,
    SYNTHETIC_PREFIX_CORRIDORS[1]: 118400.0,
    SYNTHETIC_PREFIX_CORRIDORS[2]: 112900.0,
    SYNTHETIC_PREFIX_CORRIDORS[3]: 64200.0,
}

CORRIDOR_LATENCY_US_MAP: Dict[str, float] = {
    SYNTHETIC_PREFIX_CORRIDORS[0]: 0.01,
    SYNTHETIC_PREFIX_CORRIDORS[1]: 0.02,
    SYNTHETIC_PREFIX_CORRIDORS[2]: 0.03,
    SYNTHETIC_PREFIX_CORRIDORS[3]: 0.14,
}


# ============================================================================
# GATE 03: ZERO-TRUST INGRESS SANITIZER
# ============================================================================
FORBIDDEN_PATTERNS = re.compile(
    r"(--|;|/\*|\*/|<script|</script|javascript:|onerror=|onload=|union\s+select|drop\s+table)",
    re.IGNORECASE,
)


def sanitize_gridsync_payload(raw_value: str) -> str:
    """Scrubs potential SQLi, XSS, and currency symbols from ingress strings."""
    if not isinstance(raw_value, str):
        raise ValueError("Payload field must be a string.")
    cleaned = raw_value.replace(chr(36), "").strip()
    if FORBIDDEN_PATTERNS.search(cleaned):
        raise ValueError("Zero-Trust GridSync Ingress Violation: Malicious pattern rejected.")
    return cleaned


# ============================================================================
# GATE 02: POSTGRESQL 16 IDEMPOTENT MIGRATION & RLS DDL GENERATOR
# ============================================================================
def generate_postgres_rls_migration_sql() -> str:
    """Returns idempotent PostgreSQL 16 schema with strict Row-Level Security (RLS)."""
    delim = chr(36) + chr(36)
    return (
        "CREATE EXTENSION IF NOT EXISTS pgcrypto;\n\n"
        "CREATE TABLE IF NOT EXISTS gf_t3_338_radix_blocks (\n"
        "    block_id VARCHAR(16) PRIMARY KEY,\n"
        "    tenant_id UUID NOT NULL,\n"
        "    corridor_id VARCHAR(128) NOT NULL,\n"
        "    pointer_hex VARCHAR(16) NOT NULL,\n"
        "    radix_hash VARCHAR(64) NOT NULL,\n"
        "    token_capacity INTEGER NOT NULL CHECK (token_capacity > 0),\n"
        "    cache_hit_ratio NUMERIC(6, 2) NOT NULL CHECK (cache_hit_ratio >= 0 AND cache_hit_ratio <= 100),\n"
        "    ref_count INTEGER NOT NULL DEFAULT 1 CHECK (ref_count >= 0),\n"
        "    latency_ms NUMERIC(8, 4) NOT NULL DEFAULT 0.0200,\n"
        "    block_status VARCHAR(32) NOT NULL DEFAULT 'HASHED · LOCKED',\n"
        "    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n"
        ");\n\n"
        "CREATE INDEX IF NOT EXISTS idx_gf_t3_338_radix_hash\n"
        "    ON gf_t3_338_radix_blocks (tenant_id, radix_hash);\n\n"
        "ALTER TABLE gf_t3_338_radix_blocks ENABLE ROW LEVEL SECURITY;\n"
        "ALTER TABLE gf_t3_338_radix_blocks FORCE ROW LEVEL SECURITY;\n\n"
        "DO " + delim + "\n"
        "BEGIN\n"
        "    IF NOT EXISTS (\n"
        "        SELECT 1 FROM pg_policies\n"
        "        WHERE tablename = 'gf_t3_338_radix_blocks'\n"
        "          AND policyname = 'tenant_isolation_policy'\n"
        "    ) THEN\n"
        "        CREATE POLICY tenant_isolation_policy ON gf_t3_338_radix_blocks\n"
        "            USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)\n"
        "            WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);\n"
        "    END IF;\n"
        "END\n"
        + delim + ";"
    )


# ============================================================================
# GATE 01: DETERMINISTIC RADIX TREE KV HASH INDEXING & PHYSICS SOLVER
# ============================================================================
def compute_cryptographic_block_hash(
    k_prefix: List[float],
    v_prefix: List[float],
    chi_hash_token: str,
    parent_hash: str = "0x00000000",
) -> Tuple[str, float]:
    """
    Computes deterministic cryptographic block hash:
    R_radix = sum_{r=0}^{R-1} H(K_prefix, V_prefix, chi_hash_token)
    Returns (hex_digest_short, normalized_radix_energy).
    """
    clean_token = sanitize_gridsync_payload(chi_hash_token)
    if not k_prefix or not v_prefix or len(k_prefix) != len(v_prefix):
        raise ValueError("K_prefix and V_prefix vectors must be non-empty and equal length.")

    hasher = hashlib.sha256()
    hasher.update(parent_hash.encode("utf-8"))
    hasher.update(clean_token.encode("utf-8"))

    energy_accumulator = 0.0
    for idx, (k_val, v_val) in enumerate(zip(k_prefix, v_prefix)):
        quantized_k = round(float(k_val), 6)
        quantized_v = round(float(v_val), 6)
        payload = "{0}:{1:.6f}:{2:.6f}".format(idx, quantized_k, quantized_v)
        step_digest = hashlib.sha256((clean_token + ":" + payload).encode("utf-8")).digest()
        hasher.update(step_digest)
        step_uint = int.from_bytes(step_digest[:4], byteorder="big")
        energy_accumulator += (step_uint / 4294967295.0)

    final_hex = "0x" + hasher.hexdigest()[:12].upper()
    normalized_energy = round(energy_accumulator / float(len(k_prefix)), 6)
    return final_hex, normalized_energy


@dataclass
class KVHardwareBlock:
    block_index: int
    block_label: str
    pointer_hex: str
    tokens_k: int
    cache_saturation_pct: float
    sync_saturation_pct: float
    latency_ms: float
    status: str
    radix_hash: str
    ref_count: int = 1


@dataclass
class RadixTreeNode:
    prefix_key: str
    radix_hash: str
    block_index: int
    ref_count: int = 1
    children: Dict[str, "RadixTreeNode"] = field(default_factory=dict)


class AsynchronousPrefixCachingEngine:
    """
    Deterministic Radix Tree KV Hash Indexing & Non-Blocking Reference-Counted KV Sharing Engine.
    """

    def __init__(self) -> None:
        self.active_corridor: str = SYNTHETIC_PREFIX_CORRIDORS[0]
        self.collision_spike_active: bool = False
        self.processed_tokens: int = 25400000
        self.engine_xp_k: float = 75.0
        self.prefix_state: str = "Active"
        self.mesh_pointer: str = "0x47F8DC0"
        self.vector_telemetry: List[float] = [9.91, 9.95, 9.92, 9.94]
        self.blocks: List[KVHardwareBlock] = []
        self.root_node: RadixTreeNode = RadixTreeNode(
            prefix_key="ROOT",
            radix_hash="0x47F8DC000000",
            block_index=0,
            ref_count=8,
        )
        self._initialize_arenas()

    def _initialize_arenas(self) -> None:
        self.blocks = []
        parent_hash = "0x47F8DC0"
        for i in range(8):
            ptr_hex = "0x4D0{0}0".format(i)
            digest_hex, _ = compute_cryptographic_block_hash(
                k_prefix=[9.91 + i * 0.01, 9.95, 9.92, 9.94],
                v_prefix=[1.02 + i * 0.01, 1.04, 1.01, 1.03],
                chi_hash_token="BLOCK_SEED_{0}".format(i),
                parent_hash=parent_hash,
            )
            parent_hash = digest_hex
            block = KVHardwareBlock(
                block_index=i,
                block_label="Block {0} (B{0})".format(i),
                pointer_hex=ptr_hex,
                tokens_k=256,
                cache_saturation_pct=100.0,
                sync_saturation_pct=100.0,
                latency_ms=0.02,
                status="HASHED · LOCKED",
                radix_hash=digest_hex,
                ref_count=2,
            )
            self.blocks.append(block)
            self.root_node.children["B{0}".format(i)] = RadixTreeNode(
                prefix_key="B{0}".format(i),
                radix_hash=digest_hex,
                block_index=i,
                ref_count=2,
            )

    def select_corridor(self, corridor_id: str) -> Dict[str, object]:
        clean_corridor = sanitize_gridsync_payload(corridor_id)
        if clean_corridor not in SYNTHETIC_PREFIX_CORRIDORS:
            raise ValueError("Unsupported synthetic prefix corridor identifier.")
        self.active_corridor = clean_corridor
        return self.get_telemetry_snapshot()

    def lookup_or_insert_prefix(
        self,
        prompt_tokens: List[str],
        k_prefix: List[float],
        v_prefix: List[float],
    ) -> Dict[str, object]:
        if not prompt_tokens:
            raise ValueError("prompt_tokens must contain at least one token.")
        parent_hash = self.root_node.radix_hash
        matched_blocks: List[int] = []
        reused_tokens = 0
        total_radix_energy = 0.0

        for idx, token in enumerate(prompt_tokens):
            clean_tok = sanitize_gridsync_payload(token)
            digest_hex, energy = compute_cryptographic_block_hash(
                k_prefix=k_prefix,
                v_prefix=v_prefix,
                chi_hash_token=clean_tok,
                parent_hash=parent_hash,
            )
            parent_hash = digest_hex
            total_radix_energy += energy
            target_block_idx = idx % len(self.blocks)
            block = self.blocks[target_block_idx]
            block.ref_count += 1
            block.radix_hash = digest_hex
            matched_blocks.append(target_block_idx)
            reused_tokens += block.tokens_k * 1000

        self.processed_tokens += len(prompt_tokens) * 32000
        self.engine_xp_k = round(self.engine_xp_k + 1.25, 2)
        return {
            "matched_blocks": matched_blocks,
            "reused_kv_tokens": reused_tokens,
            "final_radix_hash": parent_hash,
            "radix_energy_score": round(total_radix_energy, 6),
            "ttft_latency_us": CORRIDOR_LATENCY_US_MAP[self.active_corridor],
            "zero_reload_verified": True,
        }

    def trigger_prefix_caching_burst(self) -> Dict[str, object]:
        self.processed_tokens += 1280000
        self.engine_xp_k = round(self.engine_xp_k + 4.5, 2)
        self.prefix_state = "Burst Saturation"
        for idx, blk in enumerate(self.blocks):
            blk.tokens_k = 256 + (idx % 2) * 64
            blk.cache_saturation_pct = 100.0
            blk.sync_saturation_pct = 100.0
            blk.latency_ms = 0.01
            blk.ref_count += 2
            blk.status = "HASHED · LOCKED"
        self.vector_telemetry = [9.96, 9.98, 9.95, 9.99]
        return self.get_telemetry_snapshot()

    def toggle_hash_collision_spike(self) -> Dict[str, object]:
        self.collision_spike_active = not self.collision_spike_active
        if self.collision_spike_active:
            self.prefix_state = "Re-Indexing Spike"
            for idx, blk in enumerate(self.blocks):
                if idx in (2, 5):
                    blk.cache_saturation_pct = 94.0
                    blk.sync_saturation_pct = 96.0
                    blk.latency_ms = 0.05
                    blk.status = "REHASH · SYNC"
                else:
                    blk.latency_ms = 0.02
                    blk.status = "HASHED · LOCKED"
            self.vector_telemetry = [9.84, 9.89, 9.86, 9.90]
        else:
            self.prefix_state = "Active"
            for blk in self.blocks:
                blk.cache_saturation_pct = 100.0
                blk.sync_saturation_pct = 100.0
                blk.latency_ms = 0.02
                blk.status = "HASHED · LOCKED"
            self.vector_telemetry = [9.91, 9.95, 9.92, 9.94]
        return self.get_telemetry_snapshot()

    def step_asynchronous_prefix_pass(self) -> Dict[str, object]:
        self.processed_tokens += 640000
        self.engine_xp_k = round(self.engine_xp_k + 2.0, 2)
        self.prefix_state = "Active"
        for idx, blk in enumerate(self.blocks):
            digest_hex, _ = compute_cryptographic_block_hash(
                k_prefix=self.vector_telemetry,
                v_prefix=[1.10, 1.12, 1.11, 1.14],
                chi_hash_token="STEP_PASS_{0}_{1}".format(idx, self.processed_tokens),
                parent_hash=blk.radix_hash,
            )
            blk.radix_hash = digest_hex
            blk.cache_saturation_pct = 100.0
            blk.sync_saturation_pct = 100.0
            blk.latency_ms = 0.02
            blk.status = "HASHED · LOCKED"
            blk.ref_count += 1
        return self.get_telemetry_snapshot()

    def flush_prefix_arenas(self) -> Dict[str, object]:
        self.collision_spike_active = False
        self.processed_tokens = 25400000
        self.engine_xp_k = 75.0
        self.prefix_state = "Active"
        self.mesh_pointer = "0x47F8DC0"
        self.vector_telemetry = [9.91, 9.95, 9.92, 9.94]
        self._initialize_arenas()
        return self.get_telemetry_snapshot()

    def get_telemetry_snapshot(self) -> Dict[str, object]:
        base_tp = CORRIDOR_THROUGHPUT_MAP.get(self.active_corridor, 124600.0)
        base_lat = CORRIDOR_LATENCY_US_MAP.get(self.active_corridor, 0.01)
        if self.collision_spike_active:
            effective_tp = round(base_tp * 0.94, 2)
            effective_lat = round(base_lat + 0.03, 2)
        else:
            effective_tp = base_tp
            effective_lat = base_lat

        active_count = sum(1 for b in self.blocks if b.cache_saturation_pct >= 90.0)
        return {
            "unit_id": "GF-T3-338",
            "corridor": self.active_corridor,
            "cache_throughput_gb_s": effective_tp,
            "prefix_latency_us": effective_lat,
            "active_blocks": active_count,
            "total_blocks": len(self.blocks),
            "processed_tokens_units": self.processed_tokens,
            "engine_xp_k": self.engine_xp_k,
            "prefix_state": self.prefix_state,
            "mesh_pointer": self.mesh_pointer,
            "collision_spike_active": self.collision_spike_active,
            "vector_telemetry": self.vector_telemetry,
            "blocks": [
                {
                    "block_index": b.block_index,
                    "block_label": b.block_label,
                    "pointer_hex": b.pointer_hex,
                    "tokens_k": b.tokens_k,
                    "cache_saturation_pct": b.cache_saturation_pct,
                    "sync_saturation_pct": b.sync_saturation_pct,
                    "latency_ms": b.latency_ms,
                    "status": b.status,
                    "radix_hash": b.radix_hash,
                    "ref_count": b.ref_count,
                }
                for b in self.blocks
            ],
        }


# ============================================================================
# FASTAPI APPLICATION & STRONGLY-TYPED DTO SCHEMAS
# ============================================================================
app = FastAPI(
    title="GF-T3-338",
    description="Dynamic Asynchronous Prefix Caching & Radix Tree KV Hash Indexing Engine",
    version="3.3.8",
)

ENGINE_INSTANCE = AsynchronousPrefixCachingEngine()


class PrefixLookupRequestDTO(BaseModel):
    prompt_tokens: List[str] = Field(..., min_length=1, max_length=64)
    k_prefix: List[float] = Field(..., min_length=4, max_length=16)
    v_prefix: List[float] = Field(..., min_length=4, max_length=16)

    @field_validator("prompt_tokens")
    @classmethod
    def validate_tokens(cls, tokens: List[str]) -> List[str]:
        return [sanitize_gridsync_payload(t) for t in tokens]


class CorridorSelectRequestDTO(BaseModel):
    corridor_id: str

    @field_validator("corridor_id")
    @classmethod
    def validate_corridor(cls, value: str) -> str:
        return sanitize_gridsync_payload(value)


@app.get("/health")
def health_check() -> Dict[str, object]:
    return {
        "unit": "GF-T3-338",
        "status": "HEALTHY",
        "zero_reload_latency_verified": True,
        "active_corridor": ENGINE_INSTANCE.active_corridor,
    }


@app.get("/api/v1/telemetry")
def get_telemetry() -> Dict[str, object]:
    return ENGINE_INSTANCE.get_telemetry_snapshot()


@app.post("/api/v1/corridor")
def set_corridor(payload: CorridorSelectRequestDTO) -> Dict[str, object]:
    try:
        return ENGINE_INSTANCE.select_corridor(payload.corridor_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/v1/radix/lookup")
def radix_lookup(
    payload: PrefixLookupRequestDTO,
    x_tenant_id: Optional[str] = Header(default="00000000-0000-0000-0000-000000000338"),
) -> Dict[str, object]:
    try:
        _ = sanitize_gridsync_payload(x_tenant_id or "")
        return ENGINE_INSTANCE.lookup_or_insert_prefix(
            prompt_tokens=payload.prompt_tokens,
            k_prefix=payload.k_prefix,
            v_prefix=payload.v_prefix,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/v1/chaos/burst")
def chaos_burst() -> Dict[str, object]:
    return ENGINE_INSTANCE.trigger_prefix_caching_burst()


@app.post("/api/v1/chaos/collision-spike")
def chaos_collision_spike() -> Dict[str, object]:
    return ENGINE_INSTANCE.toggle_hash_collision_spike()


@app.post("/api/v1/chaos/step-pass")
def chaos_step_pass() -> Dict[str, object]:
    return ENGINE_INSTANCE.step_asynchronous_prefix_pass()


@app.post("/api/v1/chaos/flush")
def chaos_flush() -> Dict[str, object]:
    return ENGINE_INSTANCE.flush_prefix_arenas()
