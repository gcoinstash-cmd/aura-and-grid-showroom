# GF-T3-228

Dynamic Speculative Tree Decoding · Multi-Candidate Verification · Tree Masking

## 1. System Overview
`GF-T3-228` is a Track 3 Speculative Tree Decoding backend engine and institutional F1 Pit Wall telemetry cockpit. It accelerates autoregressive sequence generation by expanding a non-autoregressive multi-token candidate tree (Root + 3 Level-1 Draft Nodes + 8 Level-2 Candidate Leaves) and verifying all candidate paths simultaneously in a single forward pass using a causal tree-attention mask.

## 2. Synthetic Speculative Corridors
- `SPEC-CORRIDOR-ALPHA (DYNAMIC-TREE-DRAFT · PARALLEL-VERIFY)`
- `SPEC-CORRIDOR-BRAVO (CONFIDENCE-WEIGHTED-BRANCH-PRUNING)`
- `SPEC-CORRIDOR-GAMMA (NON-AUTOREGRESSIVE-TRIE-EXPANSION)`
- `SPEC-CORRIDOR-DELTA (GREEDY-FALLBACK-SINGLE-PATH)`

## 3. Local & Air-Gapped Setup Instructions
### Frontend Cockpit & Vitest Verification
```bash
npm install
npx vitest run
npm run build
```

### Python FastAPI Engine & Pytest Verification
```bash
pip install fastapi uvicorn pydantic pytest httpx
pytest test_spec_tree_engine.py
uvicorn engine:app --host 0.0.0.0 --port 8080
```

## 4. Environment Configuration
All runtime variables are defined in `.env.example` without secret literals. For air-gapped deployments, bundle wheels in a local wheelhouse and vendor `node_modules` prior to container build.
