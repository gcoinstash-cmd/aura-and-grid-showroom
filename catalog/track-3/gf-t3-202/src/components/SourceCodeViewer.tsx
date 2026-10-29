import React, { useState } from 'react';

interface FileEntry {
  filename: string;
  language: string;
  description: string;
  path: string;
}

const FILES: FileEntry[] = [
  {
    filename: 'order_book.py',
    language: 'python',
    description: 'Deterministic FIFO Matching Engine with 64-bit integer microunit arithmetic',
    path: '/order_book.py',
  },
  {
    filename: 'main.py',
    language: 'python',
    description: 'Turnkey FastAPI microservice with RBAC header authentication scaffold',
    path: '/main.py',
  },
  {
    filename: 'models.py',
    language: 'python',
    description: 'Domain dataclasses, enums, and OpenAPI 3.1 Pydantic V2 schemas',
    path: '/models.py',
  },
  {
    filename: 'test_order_matching.py',
    language: 'python',
    description: 'Full test suite (15 tests, >80% coverage) covering FIFO, partial fills, edge cases',
    path: '/test_order_matching.py',
  },
  {
    filename: 'ENGINE_SPEC.md',
    language: 'markdown',
    description: 'Ghost FactoryOS Track 3 Specification with complexity proofs and OpenAPI spec',
    path: '/ENGINE_SPEC.md',
  },
  {
    filename: 'LEGAL_IP_AUDIT.md',
    language: 'markdown',
    description: 'Clean-room provenance, NIST SSDF v1.1 attestation, and zero copyleft SBOM',
    path: '/LEGAL_IP_AUDIT.md',
  },
  {
    filename: 'ASSET_TRANSFER_SPEC.md',
    language: 'markdown',
    description: 'Standalone repository APA buyout transfer terms, clean title, and Cloud Run setup',
    path: '/ASSET_TRANSFER_SPEC.md',
  },
  {
    filename: 'Dockerfile',
    language: 'dockerfile',
    description: 'Production container ready for 1-click Google Cloud Run deployment',
    path: '/Dockerfile',
  },
  {
    filename: 'requirements.txt',
    language: 'plaintext',
    description: 'Permissive Clean-Room MIT dependencies (zero copyleft / zero GPL/AGPL)',
    path: '/requirements.txt',
  },
];

export const SourceCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileEntry>(FILES[0]);
  const [copied, setCopied] = useState(false);

  const getSourcePreview = (filename: string): string => {
    switch (filename) {
      case 'order_book.py':
        return `# APEX-202 (FinTech/Quant Series) - High-Frequency Limit Order Book & Liquidity Matching Engine
# order_book.py: Core Deterministic FIFO Matching Engine Implementation
# License: Permissive Clean-Room MIT Architecture (Zero Copyleft)

import heapq
import hashlib
import time
import uuid
from collections import deque
from typing import Dict, List, Optional, Tuple, Any

class PriceLevel:
    __slots__ = ("price_micros", "orders", "total_volume_micros")
    def __init__(self, price_micros: int):
        self.price_micros = price_micros
        self.orders = deque()
        self.total_volume_micros = 0

class OrderBook:
    def __init__(self, symbol: str):
        self.symbol = symbol
        self.sequence_number = 0
        self.previous_hash = "0" * 64
        self._bid_heap: List[int] = []  # -price_micros
        self._bid_levels: Dict[int, PriceLevel] = {}
        self._ask_heap: List[int] = []  # +price_micros
        self._ask_levels: Dict[int, PriceLevel] = {}
        self._orders_by_id: Dict[str, Order] = {}
        self.trade_history: List[TradeSettlementEvent] = []

    def peek_best_bid(self) -> Optional[int]:
        while self._bid_heap:
            price = -self._bid_heap[0]
            level = self._bid_levels.get(price)
            if level and level.total_volume_micros > 0:
                return price
            heapq.heappop(self._bid_heap)
        return None

    def peek_best_ask(self) -> Optional[int]:
        while self._ask_heap:
            price = self._ask_heap[0]
            level = self._ask_levels.get(price)
            if level and level.total_volume_micros > 0:
                return price
            heapq.heappop(self._ask_heap)
        return None

    # See full order_book.py on disk for full FIFO matching and execution logic`;

      case 'main.py':
        return `# APEX-202 Enterprise FastAPI Microservice & RBAC Gateway
from fastapi import FastAPI, HTTPException, Header, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from models import OrderSubmissionRequest, OrderExecutionResponse, Role
from order_book import OrderBook

app = FastAPI(title="APEX-202 Matching Engine", version="1.0.0")

# Header Authentication: X-API-Key and X-Role (ADMIN, TRADER, AUDITOR, READONLY)
@app.post("/api/v1/orders")
def submit_order(req: OrderSubmissionRequest, role: Role = Depends(require_role(Role.TRADER))):
    book = get_or_create_book(req.symbol)
    order, fills, events = book.submit_order(...)
    return OrderExecutionResponse(...)`;

      case 'models.py':
        return `# models.py: Domain Models, Enums, and Fixed-Point Microunit Schemas
PRICE_SCALE = 1_000_000
QTY_SCALE = 1_000_000

class Side(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class OrderType(str, Enum):
    LIMIT = "LIMIT"
    MARKET = "MARKET"

class TimeInForce(str, Enum):
    GTC = "GTC"
    IOC = "IOC"
    FOK = "FOK"`;

      case 'test_order_matching.py':
        return `# test_order_matching.py: 15 comprehensive tests covering FIFO, partial fills, edge cases
class TestOrderMatchingEngine(unittest.TestCase):
    def test_price_time_priority_fifo(self):
        # Two maker orders at 50,000 pts; taker sweeps 1.5 units; order A fills first!
        ...
    def test_fixed_point_integer_microunit_math(self):
        # (123456789 * 987654) // 1000000 = 121932591 exactly; zero float drift!
        ...`;

      case 'Dockerfile':
        return `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY models.py order_book.py main.py test_order_matching.py ./
RUN python -m unittest test_order_matching.py -v
EXPOSE 8080
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port \${PORT:-8080}"]`;

      case 'requirements.txt':
        return `fastapi>=0.115.0
uvicorn[standard]>=0.30.0
pydantic>=2.8.0
pytest>=8.3.0
pytest-cov>=5.0.0
httpx>=0.27.0`;

      default:
        return `# APEX-202 Specification Document available in /ENGINE_SPEC.md`;
    }
  };

  const codeContent = getSourcePreview(selectedFile.filename);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 text-slate-200">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
            Turnkey Python Service Artifacts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete self-contained source files ready for deployment on Google Cloud Run
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors cursor-pointer"
        >
          {copied ? 'Copied to Clipboard' : `Copy ${selectedFile.filename}`}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File Navigator */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Engine Source Files
          </div>
          {FILES.map((f) => (
            <button
              key={f.filename}
              onClick={() => setSelectedFile(f)}
              className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                selectedFile.filename === f.filename
                  ? 'bg-slate-800 border-slate-600 text-white'
                  : 'bg-slate-900 border-slate-800/80 hover:bg-slate-800/50 text-slate-400'
              }`}
            >
              <div className="text-xs font-mono font-semibold text-slate-200">
                {f.filename}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                {f.description}
              </div>
            </button>
          ))}
        </div>

        {/* Code Content View */}
        <div className="lg:col-span-3 space-y-3 bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 font-mono text-xs text-slate-400">
            <span>Path: <strong className="text-slate-200">{selectedFile.path}</strong></span>
            <span>Clean-Room MIT</span>
          </div>

          <pre className="p-4 bg-slate-950 rounded border border-slate-800/80 font-mono text-xs text-slate-200 overflow-x-auto max-h-[500px] leading-relaxed">
            {codeContent}
          </pre>

          <div className="text-[11px] text-slate-500 font-mono">
            Full file exists at repository root: <code className="text-slate-300">{selectedFile.path}</code>
          </div>
        </div>
      </div>
    </div>
  );
};
