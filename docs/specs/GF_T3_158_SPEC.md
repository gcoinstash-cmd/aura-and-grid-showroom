# ENGINE_SPEC.md: GF-T3-158 AeroVex CBF
## Decentralized Multi-Agent Trajectory Deconfliction Service Engine
### Track 3 / F1 Skunkworks Service Engine (Monopoly Vault Asset)

---

## 1. Architectural Topology & Service Boundaries
- **Microsecond Ingestion Ring**: Shared memory POSIX IPC circular buffers (\`shm_open\`) running at 100 kHz on quadrotor micro-APUs.
- **Decentralized Boundary**: Zero master server dependence. Each node executes its local active-set QP solver asynchronously.
- **Gossip Discovery Layer**: Zero-copy UDP multicast for local neighbor state broadcast within 3 * r_safe horizon.
- **Fail-Safe Invariant**: Under message loss, worst-case reachability analysis expands r_safe to ensure continuous forward invariance.

---

## 2. Proprietary Mathematical & Algorithmic Engine
- **Class-K Extended Barrier**: $\\alpha(h) = \\alpha_0 h + \\alpha_1 h^3$ for progressive exponential stiffness near boundary $\\partial C$.
- **Active-Set 2D QP Solver**: Closed-form recursive projection with guaranteed $O(K)$ convergence in $\\le 8$ iterations.
- **Tangential Circulation Perturbation**: Resolves symmetric head-on deadlocks by evaluating the cross product $(p_i - p_j) \\times (v_i - v_j)$ and injecting an orthogonal vector $\\hat{u}_\\perp$.

---

## 3. Production AlloyDB / PostgreSQL DDL
\`\`\`sql
${schemaDdl}
\`\`\`

---

## 4. Protocol Specification & OpenAPI 3.1
\`\`\`yaml
${openApiSpec}
\`\`\`

---

## 5. Protobuf 3 gRPC Specification
\`\`\`protobuf
${grpcProto}
\`\`\`

---

## 6. Clean-Room Dependency Whitelist & Audit
- **Whitelisted Licenses**: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC.
- **Strictly Blacklisted**: GPLv2, GPLv3, AGPLv3, SSPL, Commons Clause, LGPL.
- **Clean-Room Verification**: Zero proprietary code contamination. Written from fundamental control theory principles.
