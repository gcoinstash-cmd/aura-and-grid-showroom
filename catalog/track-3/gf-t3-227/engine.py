"""
GF-T3-227: Prefix-Tree Radix KV-Cache & Speculative Tree Attention Engine
License: MIT
Clean-Room Implementation: Zero third-party proprietary engine marks.
"""

from __future__ import annotations
import math
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator


CORRIDOR_PROFILES: Dict[str, Dict[str, float]] = {
    "TREE-CORRIDOR-ALPHA (RADIX-TREE-LCP · DYNAMIC-PRUNING)": {
        "max_tokens": 512.0,
        "eviction_ratio": 0.25,
        "bandwidth_gbs": 1480.0,
        "verify_threshold": 0.72,
    },
    "TREE-CORRIDOR-BRAVO (TREE-MASK-VERIFY · MULTI-BRANCH)": {
        "max_tokens": 768.0,
        "eviction_ratio": 0.20,
        "bandwidth_gbs": 1620.0,
        "verify_threshold": 0.68,
    },
    "TREE-CORRIDOR-GAMMA (SPECULATIVE-DRAFT-TRIE · RESAMPLE)": {
        "max_tokens": 640.0,
        "eviction_ratio": 0.30,
        "bandwidth_gbs": 1540.0,
        "verify_threshold": 0.75,
    },
    "TREE-CORRIDOR-DELTA (LEAF-EVICTION-FALLBACK)": {
        "max_tokens": 384.0,
        "eviction_ratio": 0.40,
        "bandwidth_gbs": 1390.0,
        "verify_threshold": 0.80,
    },
}


@dataclass
class RadixNode:
    node_id: str
    label: str
    tier: str  # "ROOT" | "BRANCH" | "LEAF"
    tokens: List[int]
    parent_id: Optional[str] = None
    children: Dict[int, "RadixNode"] = field(default_factory=dict)
    pinned: bool = False
    access_count: int = 1
    last_access_tick: int = 0
    kv_page_pointer: str = "KV-BLK-0000"
    verified_state: str = "VERIFIED"  # "VERIFIED" | "SPECULATIVE" | "EVICTED"
    draft_logprob: float = -0.18
    target_logprob: float = -0.15

    def token_length(self) -> int:
        return len(self.tokens)

    def eviction_priority_score(self, current_tick: int) -> float:
        if self.pinned:
            return 1e9
        age = max(1, current_tick - self.last_access_tick)
        return round((self.access_count * 10.0) / float(age), 4)


def compute_lcp_length(seq_a: List[int], seq_b: List[int]) -> int:
    """Computes exact Longest Common Prefix (LCP) length between two token lists."""
    limit = min(len(seq_a), len(seq_b))
    matched = 0
    while matched < limit and seq_a[matched] == seq_b[matched]:
        matched += 1
    return matched


class RadixPrefixCache:
    """
    Radix Trie KV-Cache managing shared prefix blocks, edge splitting on partial
    LCP matches, non-linear speculative tree attention mask generation, and
    dynamic LRU leaf pruning.
    """

    def __init__(self, max_cached_tokens: int = 512) -> None:
        self.max_cached_tokens = max_cached_tokens
        self.tick = 1
        self.node_counter = 1
        self.total_queries = 0
        self.total_requested_tokens = 0
        self.total_reused_tokens = 0
        self.root = RadixNode(
            node_id="NODE-ROOT-00",
            label="System Prompt Root",
            tier="ROOT",
            tokens=[101, 2054, 2003, 1996, 3928, 4007],
            parent_id=None,
            pinned=True,
            access_count=64,
            last_access_tick=1,
            kv_page_pointer="KV-BLK-0000:0128",
            verified_state="VERIFIED",
            draft_logprob=-0.02,
            target_logprob=-0.02,
        )
        self.nodes: Dict[str, RadixNode] = {self.root.node_id: self.root}

    def _allocate_id(self, prefix: str) -> str:
        self.node_counter += 1
        return f"NODE-{prefix}-{self.node_counter:02d}"

    def _allocate_kv_pointer(self, token_len: int) -> str:
        blk = self.node_counter * 16
        return f"KV-BLK-{blk:04X}:{token_len:04d}"

    def total_allocated_tokens(self) -> int:
        return sum(len(n.tokens) for n in self.nodes.values() if n.verified_state != "EVICTED")

    def match_prefix(self, prompt_tokens: List[int]) -> Tuple[List[str], int, RadixNode]:
        """
        Traverses the Radix Trie along prompt_tokens and returns:
        - matched_path_ids: ordered list of visited node IDs
        - matched_token_count: total LCP tokens reused without KV recomputation
        - deepest_node: terminal matched RadixNode
        """
        self.tick += 1
        self.total_queries += 1
        self.total_requested_tokens += len(prompt_tokens)

        root_lcp = compute_lcp_length(self.root.tokens, prompt_tokens)
        self.root.access_count += 1
        self.root.last_access_tick = self.tick

        if root_lcp < len(self.root.tokens):
            self.total_reused_tokens += root_lcp
            return [self.root.node_id], root_lcp, self.root

        matched_tokens = root_lcp
        remaining = prompt_tokens[root_lcp:]
        curr = self.root
        path_ids = [self.root.node_id]

        while remaining:
            first_tok = remaining[0]
            child = curr.children.get(first_tok)
            if child is None or child.verified_state == "EVICTED":
                break
            lcp = compute_lcp_length(child.tokens, remaining)
            if lcp == 0:
                break
            child.access_count += 1
            child.last_access_tick = self.tick
            matched_tokens += lcp
            path_ids.append(child.node_id)
            curr = child
            remaining = remaining[lcp:]
            if lcp < len(child.tokens):
                break

        self.total_reused_tokens += matched_tokens
        return path_ids, matched_tokens, curr

    def insert_sequence(
        self,
        prompt_tokens: List[int],
        label: str = "Branch Segment",
        tier: str = "BRANCH",
        verified_state: str = "VERIFIED",
    ) -> Tuple[RadixNode, int]:
        """
        Inserts a token sequence into the Radix Trie, splitting existing edges
        whenever a partial LCP match occurs. Automatically triggers LRU leaf
        eviction if capacity is exceeded.
        """
        self.tick += 1
        root_lcp = compute_lcp_length(self.root.tokens, prompt_tokens)
        remaining = prompt_tokens[root_lcp:]
        curr = self.root
        curr.access_count += 1
        curr.last_access_tick = self.tick
        reused = root_lcp

        while remaining:
            first_tok = remaining[0]
            child = curr.children.get(first_tok)
            if child is None:
                new_id = self._allocate_id(tier[:3].upper())
                new_node = RadixNode(
                    node_id=new_id,
                    label=label,
                    tier=tier,
                    tokens=list(remaining),
                    parent_id=curr.node_id,
                    pinned=False,
                    access_count=1,
                    last_access_tick=self.tick,
                    kv_page_pointer=self._allocate_kv_pointer(len(remaining)),
                    verified_state=verified_state,
                )
                curr.children[first_tok] = new_node
                self.nodes[new_id] = new_node
                curr = new_node
                break

            lcp = compute_lcp_length(child.tokens, remaining)
            reused += lcp
            if lcp == len(child.tokens):
                child.access_count += 1
                child.last_access_tick = self.tick
                curr = child
                remaining = remaining[lcp:]
            else:
                # Split child node at lcp boundary
                shared_tokens = child.tokens[:lcp]
                child_suffix = child.tokens[lcp:]
                new_branch_suffix = remaining[lcp:]

                split_id = self._allocate_id("SPL")
                split_node = RadixNode(
                    node_id=split_id,
                    label=child.label + " [Prefix]",
                    tier="BRANCH",
                    tokens=shared_tokens,
                    parent_id=curr.node_id,
                    pinned=child.pinned,
                    access_count=child.access_count + 1,
                    last_access_tick=self.tick,
                    kv_page_pointer=self._allocate_kv_pointer(len(shared_tokens)),
                    verified_state="VERIFIED",
                )

                child.tokens = child_suffix
                child.parent_id = split_id
                split_node.children[child_suffix[0]] = child
                curr.children[first_tok] = split_node
                self.nodes[split_id] = split_node

                if new_branch_suffix:
                    leaf_id = self._allocate_id(tier[:3].upper())
                    leaf_node = RadixNode(
                        node_id=leaf_id,
                        label=label,
                        tier=tier,
                        tokens=new_branch_suffix,
                        parent_id=split_id,
                        pinned=False,
                        access_count=1,
                        last_access_tick=self.tick,
                        kv_page_pointer=self._allocate_kv_pointer(len(new_branch_suffix)),
                        verified_state=verified_state,
                    )
                    split_node.children[new_branch_suffix[0]] = leaf_node
                    self.nodes[leaf_id] = leaf_node
                    curr = leaf_node
                else:
                    curr = split_node
                break

        if self.total_allocated_tokens() > self.max_cached_tokens:
            self.evict_lru(target_tokens=self.max_cached_tokens)

        return curr, reused

    def get_leaves(self) -> List[RadixNode]:
        return [
            node
            for node in self.nodes.values()
            if len(node.children) == 0 and not node.pinned and node.verified_state != "EVICTED"
        ]

    def evict_lru(self, target_tokens: Optional[int] = None) -> List[str]:
        """
        Evicts lowest-priority unpinned leaf nodes until total_allocated_tokens <= target_tokens.
        Priority is determined by (access_count, last_access_tick).
        """
        limit = target_tokens if target_tokens is not None else int(self.max_cached_tokens * 0.75)
        evicted_ids: List[str] = []

        while self.total_allocated_tokens() > limit:
            leaves = self.get_leaves()
            if not leaves:
                break
            leaves.sort(key=lambda n: (n.access_count, n.last_access_tick))
            victim = leaves[0]
            if victim.parent_id and victim.parent_id in self.nodes:
                parent = self.nodes[victim.parent_id]
                first_tok = victim.tokens[0]
                if first_tok in parent.children and parent.children[first_tok].node_id == victim.node_id:
                    del parent.children[first_tok]
            victim.verified_state = "EVICTED"
            del self.nodes[victim.node_id]
            evicted_ids.append(victim.node_id)

        return evicted_ids

    def build_tree_attention_mask(self, node_order: Optional[List[str]] = None) -> Tuple[List[str], List[List[int]]]:
        """
        Constructs the 2D binary causal tree attention mask M_tree[i][j] in {0, 1}
        where M_tree[i][j] = 1 iff node j is an ancestor of (or identical to) node i.
        """
        ordered_ids = node_order if node_order is not None else list(self.nodes.keys())
        ordered_ids = [nid for nid in ordered_ids if nid in self.nodes]

        ancestors_map: Dict[str, set] = {}
        for nid in ordered_ids:
            anc = set()
            curr_id: Optional[str] = nid
            while curr_id is not None and curr_id in self.nodes:
                anc.add(curr_id)
                curr_id = self.nodes[curr_id].parent_id
            ancestors_map[nid] = anc

        mask: List[List[int]] = []
        for row_id in ordered_ids:
            row: List[int] = []
            for col_id in ordered_ids:
                row.append(1 if col_id in ancestors_map[row_id] else 0)
            mask.append(row)

        return ordered_ids, mask


def compute_tree_vs_linear_attention_parity(
    q_vectors: List[List[float]],
    k_vectors: List[List[float]],
    v_vectors: List[List[float]],
    tree_mask: List[List[int]],
    root_to_leaf_indices: List[int],
) -> Tuple[List[float], List[float], float]:
    """
    Verifies mathematical parity between 2D Masked Tree Attention over all candidate
    nodes simultaneously and Sequential Causal Attention along any root-to-leaf path.
    Returns (tree_leaf_output, linear_leaf_output, max_abs_diff).
    """
    dim = len(q_vectors[0])
    scale = 1.0 / math.sqrt(float(dim))

    # 1. Masked Tree Attention at the target leaf index
    leaf_idx = root_to_leaf_indices[-1]
    q_leaf = q_vectors[leaf_idx]
    logits_tree: List[float] = []
    valid_cols: List[int] = []

    for j, mask_bit in enumerate(tree_mask[leaf_idx]):
        if mask_bit == 1:
            dot = sum(q_leaf[d] * k_vectors[j][d] for d in range(dim)) * scale
            logits_tree.append(dot)
            valid_cols.append(j)

    max_logit_t = max(logits_tree)
    exps_t = [math.exp(x - max_logit_t) for x in logits_tree]
    sum_exp_t = sum(exps_t)
    weights_t = [e / sum_exp_t for e in exps_t]

    tree_out = [0.0] * dim
    for weight, col_idx in zip(weights_t, valid_cols):
        for d in range(dim):
            tree_out[d] += weight * v_vectors[col_idx][d]

    # 2. Standard Linear Causal Attention strictly along the root-to-leaf sequence
    logits_lin: List[float] = []
    for seq_idx in root_to_leaf_indices:
        dot = sum(q_leaf[d] * k_vectors[seq_idx][d] for d in range(dim)) * scale
        logits_lin.append(dot)

    max_logit_l = max(logits_lin)
    exps_l = [math.exp(x - max_logit_l) for x in logits_lin]
    sum_exp_l = sum(exps_l)
    weights_l = [e / sum_exp_l for e in exps_l]

    linear_out = [0.0] * dim
    for weight, seq_idx in zip(weights_l, root_to_leaf_indices):
        for d in range(dim):
            linear_out[d] += weight * v_vectors[seq_idx][d]

    max_diff = max(abs(a - b) for a, b in zip(tree_out, linear_out))
    return tree_out, linear_out, max_diff


# FastAPI Application & Zero-Trust Request Schemas
app = FastAPI(
    title="GF-T3-227",
    description="Prefix-Tree Radix KV Cache · Speculative Tree Verification · Dynamic LRU Pruning",
    version="3.2.7",
)

GLOBAL_CACHE = RadixPrefixCache(max_cached_tokens=512)


class PrefixMatchRequest(BaseModel):
    corridor: str = Field(default="TREE-CORRIDOR-ALPHA (RADIX-TREE-LCP · DYNAMIC-PRUNING)")
    prompt_tokens: List[int] = Field(..., min_length=1, max_length=2048)
    insert_on_miss: bool = Field(default=True)
    label: str = Field(default="Multi-Turn Branch", max_length=64)

    @field_validator("prompt_tokens")
    @classmethod
    def validate_tokens(cls, v: List[int]) -> List[int]:
        if any(tok < 0 or tok > 200000 for tok in v):
            raise ValueError("Token IDs must remain within [0, 200000]")
        return v


class EvictRequest(BaseModel):
    target_tokens: int = Field(default=256, ge=6, le=4096)


@app.get("/health")
def health_check() -> Dict[str, object]:
    return {
        "engine": "GF-T3-227",
        "track": "TRACK 3",
        "status": "LOCKED",
        "node_count": len(GLOBAL_CACHE.nodes),
        "allocated_tokens": GLOBAL_CACHE.total_allocated_tokens(),
    }


@app.post("/v1/radix/match")
def match_or_insert_prefix(req: PrefixMatchRequest) -> Dict[str, object]:
    start_ns = time.perf_counter_ns()
    if req.corridor not in CORRIDOR_PROFILES:
        raise HTTPException(status_code=400, detail="Unsupported synthetic tree corridor")

    path_ids, matched_len, terminal_node = GLOBAL_CACHE.match_prefix(req.prompt_tokens)
    inserted_node_id = terminal_node.node_id
    if req.insert_on_miss and matched_len < len(req.prompt_tokens):
        created_node, _ = GLOBAL_CACHE.insert_sequence(
            req.prompt_tokens, label=req.label, tier="BRANCH", verified_state="VERIFIED"
        )
        inserted_node_id = created_node.node_id

    elapsed_ms = round((time.perf_counter_ns() - start_ns) / 1e6, 4)
    hit_rate = round((matched_len / max(1, len(req.prompt_tokens))) * 100.0, 2)

    return {
        "engine": "GF-T3-227",
        "corridor": req.corridor,
        "matched_path": path_ids,
        "lcp_matched_tokens": matched_len,
        "prompt_length": len(req.prompt_tokens),
        "prefix_hit_rate_pct": hit_rate,
        "terminal_node_id": inserted_node_id,
        "traversal_latency_ms": elapsed_ms,
    }


@app.get("/v1/radix/mask")
def get_tree_mask() -> Dict[str, object]:
    node_ids, mask = GLOBAL_CACHE.build_tree_attention_mask()
    return {
        "engine": "GF-T3-227",
        "node_ids": node_ids,
        "tree_attention_mask": mask,
        "dimension": len(node_ids),
    }


@app.post("/v1/radix/evict")
def trigger_lru_eviction(req: EvictRequest) -> Dict[str, object]:
    evicted = GLOBAL_CACHE.evict_lru(target_tokens=req.target_tokens)
    return {
        "engine": "GF-T3-227",
        "evicted_node_ids": evicted,
        "remaining_nodes": len(GLOBAL_CACHE.nodes),
        "remaining_tokens": GLOBAL_CACHE.total_allocated_tokens(),
    }
