import { describe, expect, it } from "vitest";
import {
  SYNTHETIC_CORRIDORS,
  computeHybridPipelineState,
  evaluateRbacFolderAccess,
  generateEncryptedComplianceReport,
  sanitizeGridSyncString,
} from "./chunkedPrefillEngine";

describe("GF-T3-258 Chunked Prefill & Iterative Scheduling Hybrid Pipeline Engine", () => {
  it("enforces 16ms time-slice budget and partitions prompts across 8 chunks (C0-C7)", () => {
    const state = computeHybridPipelineState({
      corridorId: "CHUNK-CORRIDOR-ALPHA",
      promptTokens: 4096,
      sliceBudgetMs: 16,
      promptSpikeActive: false,
      burstCount: 0,
      stepCount: 0,
    });

    expect(state.engineId).toBe("GF-T3-258");
    expect(state.chunkedThroughputGbs).toBe(20400);
    expect(state.schedulingLatencyUs).toBe(0.01);
    expect(state.activeChunksCount).toBe(8);
    expect(state.totalChunksCount).toBe(8);
    expect(state.processedTokens).toBe(4096000);
    expect(state.pipelineState).toBe("Hybrid Active");
    expect(state.headOfLineBlockingMs).toBe(0);
    expect(state.chunks).toHaveLength(8);

    state.chunks.forEach((chunk, index) => {
      expect(chunk.id).toBe("C" + String(index));
      expect(chunk.tokens).toBe(512);
      expect(chunk.budgetMs).toBe(16);
      expect(chunk.sliceMs).toBeLessThanOrEqual(16);
      expect(chunk.state).toBe("SCHEDULED · LOCKED");
    });
  });

  it("rejects slice budgets exceeding the 16ms hardware threshold via GridSync Zod gate", () => {
    expect(() =>
      computeHybridPipelineState({
        corridorId: "CHUNK-CORRIDOR-ALPHA",
        promptTokens: 4096,
        sliceBudgetMs: 25,
        promptSpikeActive: false,
        burstCount: 0,
        stepCount: 0,
      })
    ).toThrow();
  });

  it("interleaves prefill chunks with decode batches across all synthetic corridors", () => {
    const corridorKeys = Object.keys(SYNTHETIC_CORRIDORS) as Array<
      keyof typeof SYNTHETIC_CORRIDORS
    >;
    for (const key of corridorKeys) {
      const state = computeHybridPipelineState({
        corridorId: key,
        promptTokens: 4096,
        sliceBudgetMs: 16,
        promptSpikeActive: true,
        burstCount: 2,
        stepCount: 3,
      });
      expect(state.chunks.every((c) => c.decodeTokensInterleaved > 0)).toBe(true);
      expect(state.processedTokens).toBeGreaterThan(4096000);
      expect(state.vectorSignature).toHaveLength(4);
    }
  });

  it("scrubs SQL injection and XSS payloads via GridSync zero-trust ingress sanitizer", () => {
    expect(sanitizeGridSyncString("INSPECT_SCHEMA")).toBe("INSPECT_SCHEMA");
    expect(() => sanitizeGridSyncString("DROP TABLE gf_t3_258_schedule_runs;--")).toThrow();
    expect(() => sanitizeGridSyncString("<script>alert(1)</script>")).toThrow();
  });

  it("enforces RBAC on sensitive folders and logs hash-chained file access attempts", () => {
    const architectAccess = evaluateRbacFolderAccess(
      "PRINCIPAL_ARCHITECT",
      "/vault/rls_keys",
      "READ_SENSITIVE_KEYRING",
      "00:02.10",
      "0000000000000000"
    );
    expect(architectAccess.decision).toBe("GRANTED");

    const crewDenied = evaluateRbacFolderAccess(
      "CREW_CHIEF",
      "/vault/rls_keys",
      "READ_SENSITIVE_KEYRING",
      "00:02.14",
      architectAccess.chainDigestHex
    );
    expect(crewDenied.decision).toBe("DENIED");
    expect(crewDenied.chainDigestHex).not.toBe(architectAccess.chainDigestHex);
  });

  it("seals compliance reports with AES-256-GCM envelope and SHA-256 integrity digest", () => {
    const state = computeHybridPipelineState({
      corridorId: "CHUNK-CORRIDOR-GAMMA",
      promptSpikeActive: false,
      burstCount: 1,
      stepCount: 1,
    });
    const report = generateEncryptedComplianceReport(state, "SECURITY_AUDITOR");
    expect(report.cipherAlgorithm).toBe("AES-256-GCM-SEALED");
    expect(report.encryptedPayloadHex.length).toBe(64);
    expect(report.sha256IntegritySeal.length).toBe(32);
    expect(report.nistSsdfCompliant).toBe(true);
  });
});
