# GF-T3-228 Contributor & Engineering Workflow Guidelines

## 1. Clean-Room Engineering Standards
- **Zero Mock Data**: Never introduce `Math.random()` filler loops or hardcoded fake telemetry timers. All speculative tree operations must execute real deterministic mathematical transforms.
- **Zero-Dollar Gate**: Never introduce currency symbols in code, comments, UI labels, or test logs.
- **Permissive Licensing**: Only MIT or Apache-2.0 dependencies are permitted.

## 2. Pre-Commit Verification Checklist
Run both test suites and the TypeScript compiler check prior to submitting changes:
```bash
npm run lint
npx vitest run
pytest test_spec_tree_engine.py
```
