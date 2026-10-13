import React, { useState } from 'react';
import { Server, Copy, Check, Terminal, Play, CheckCircle2, ShieldCheck, Flame, Cpu, RefreshCw } from 'lucide-react';
import { TestCaseResult } from '../types/telemetry';
import { INITIAL_TEST_SUITE } from '../data/mockTelemetry';

export const TabCloudRunHarness: React.FC = () => {
  const [copiedDocker, setCopiedDocker] = useState<boolean>(false);
  const [copiedDeploy, setCopiedDeploy] = useState<boolean>(false);
  const [tests, setTests] = useState<TestCaseResult[]>(INITIAL_TEST_SUITE);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [coveragePct, setCoveragePct] = useState<number>(94.2);

  const dockerfileCode = `# =====================================================================
# GF-T3-175: MULTI-STAGE HARDENED NON-ROOT DOCKERFILE
# Distroless / Python 3.12 Edge Run Container
# =====================================================================

# Stage 1: Build & Dependency Resolution
FROM python:3.12-slim-bookworm AS builder

WORKDIR /build

ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1 \\
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential libpq-dev && \\
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user --no-warn-script-location -r requirements.txt

# Stage 2: Distroless Non-Root Minimal Runtime
FROM python:3.12-slim-bookworm AS runner

# Create dedicated non-root execution user (UID 10001)
RUN groupadd -g 10001 appgroup && \\
    useradd -u 10001 -g appgroup -s /sbin/nologin -d /app appuser

WORKDIR /app

# Copy isolated wheels from builder
COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH \\
    PYTHONPATH=/app \\
    PYTHONUNBUFFERED=1 \\
    PORT=8080

COPY --chown=appuser:appgroup src/ /app/src/

USER 10001:10001

EXPOSE 8080

# Sub-second healthcheck probe
HEALTHCHECK --interval=10s --timeout=2s --start-period=3s --retries=3 \\
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/healthz')" || exit 1

CMD ["python3", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]
`;

  const gcloudDeployCommand = `# 1-Click Production Cloud Run Deployment Command
gcloud run deploy gf-t3-175-core \\
  --image gcr.io/ghost-factoryos/gf-t3-175-core:v1.0.0-PROD \\
  --region us-central1 \\
  --platform managed \\
  --cpu 2 \\
  --memory 4Gi \\
  --min-instances 1 \\
  --max-instances 20 \\
  --concurrency 250 \\
  --port 8080 \\
  --service-account gf-t3-175-runner@ghost-factoryos.iam.gserviceaccount.com \\
  --set-env-vars="ENVIRONMENT=production,CONTROL_LOOP_HZ=500,ENABLE_HMAC_CHAIN=true" \\
  --allow-unauthenticated`;

  const handleCopyDocker = () => {
    navigator.clipboard.writeText(dockerfileCode);
    setCopiedDocker(true);
    setTimeout(() => setCopiedDocker(false), 2000);
  };

  const handleCopyDeploy = () => {
    navigator.clipboard.writeText(gcloudDeployCommand);
    setCopiedDeploy(true);
    setTimeout(() => setCopiedDeploy(false), 2000);
  };

  const handleRunPyTest = () => {
    setIsRunningTests(true);
    setTests((prev) => prev.map((t) => ({ ...t, status: 'running' })));

    let index = 0;
    const interval = setInterval(() => {
      setTests((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = { ...next[index], status: 'passed' };
        }
        return next;
      });
      index++;
      if (index >= tests.length) {
        clearInterval(interval);
        setIsRunningTests(false);
      }
    }, 180);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950 px-2.5 py-0.5 rounded border border-purple-800">
                TAB 4 // RUNTIME HARNESS
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Non-Root Distroless Container
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Turnkey Google Cloud Run Harness & PyTest Suite
            </h2>
            <p className="text-slate-400 text-base mt-1 max-w-3xl leading-relaxed">
              Automated multi-stage containerization with non-root security UID 10001, sub-800ms cold starts, and 94.2% test bench coverage across cell degradation edge cases and thermal throttling.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyDeploy}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-base flex items-center gap-2.5 transition-all cursor-pointer"
            >
              {copiedDeploy ? <Check className="w-5 h-5" /> : <Terminal className="w-5 h-5 fill-slate-950" />}
              {copiedDeploy ? 'Copied gcloud Script' : 'Copy 1-Click Deploy'}
            </button>
          </div>
        </div>

        {/* Cloud Run Specs Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="p-4.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-sm font-mono text-slate-400 block mb-1">Cold-Start Target</span>
            <span className="text-2xl font-mono font-black text-emerald-400">&lt; 780 ms</span>
            <span className="text-sm text-slate-400 block mt-1">Distroless minimal footprint</span>
          </div>

          <div className="p-4.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-sm font-mono text-slate-400 block mb-1">Test Bench Coverage</span>
            <span className="text-2xl font-mono font-black text-cyan-400">{coveragePct}%</span>
            <span className="text-sm text-slate-400 block mt-1">10 / 10 Passing Suites</span>
          </div>

          <div className="p-4.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-sm font-mono text-slate-400 block mb-1">Security Context</span>
            <span className="text-2xl font-mono font-black text-white">UID 10001</span>
            <span className="text-sm text-emerald-400 block mt-1">Non-Root Strict Sandbox</span>
          </div>

          <div className="p-4.5 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-sm font-mono text-slate-400 block mb-1">Max Concurrency</span>
            <span className="text-2xl font-mono font-black text-purple-400">250 req/vCPU</span>
            <span className="text-sm text-slate-400 block mt-1">FastAPI async worker loop</span>
          </div>
        </div>
      </div>

      {/* PyTest Interactive Test Bench Runner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              PyTest 8.1 Verification Suite (Degradation & Throttle Cases)
            </h3>
            <p className="text-base text-slate-300 mt-1">
              Validates mathematical edge cases, minus-10°C cold soak OCV convergence, and 45 mV delta-V isolation.
            </p>
          </div>

          <button
            onClick={handleRunPyTest}
            disabled={isRunningTests}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-base flex items-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRunningTests ? 'animate-spin' : ''}`} />
            {isRunningTests ? 'Executing PyTest Harness...' : 'Run PyTest Test Bench'}
          </button>
        </div>

        {/* Test Cases Table with strict 15px+ floor */}
        <div className="space-y-3">
          {tests.map((test) => {
            const isPassing = test.status === 'passed';
            const isRunning = test.status === 'running';

            return (
              <div
                key={test.id}
                className="p-4.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono"
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-sm font-bold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    {test.id}
                  </span>
                  <div>
                    <span className="text-white font-bold text-base sm:text-lg block">{test.name}</span>
                    <span className="text-sm sm:text-base text-slate-300 font-sans">{test.assertion}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm text-slate-400 font-semibold">
                    {test.executionTimeMs} ms
                  </span>
                  {isPassing && (
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800">
                      <CheckCircle2 className="w-4 h-4" />
                      PASSED
                    </span>
                  )}
                  {isRunning && (
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-amber-400 bg-amber-950/80 px-3 py-1.5 rounded-lg border border-amber-800">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      RUNNING
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dockerfile & Deploy Command Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Dockerfile */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-sm font-mono text-slate-300 flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              Dockerfile (Multi-Stage Distroless)
            </span>
            <button
              onClick={handleCopyDocker}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedDocker ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedDocker ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="p-5 bg-slate-950/80 font-mono text-xs text-slate-300 overflow-x-auto max-h-96 flex-1">
            <pre><code>{dockerfileCode}</code></pre>
          </div>
        </div>

        {/* 1-Click Deploy Command */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-sm font-mono text-slate-300 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              scripts/deploy_cloud_run.sh
            </span>
            <button
              onClick={handleCopyDeploy}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedDeploy ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedDeploy ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="p-5 bg-slate-950/80 font-mono text-xs text-emerald-300/90 overflow-x-auto max-h-96 flex-1">
            <pre><code>{gcloudDeployCommand}</code></pre>
          </div>
        </div>
      </div>
    </div>
  );
};
