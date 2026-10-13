import React, { useState } from 'react';
import { 
  Cpu, 
  Layers, 
  PlusCircle, 
  Activity, 
  Copy, 
  Check, 
  ArrowDownUp, 
  Sparkles,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import { OrderBookEntry, OrderSide, OrderType, Order } from '../../types/engine';

interface EngineCoreTabProps {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  activeOrders: Order[];
  onPlaceOrder: (order: {
    side: OrderSide;
    type: OrderType;
    price: number;
    quantity: number;
    traderId: string;
  }) => void;
  ringBufferHead: number;
  ringBufferTail: number;
  ringBufferOccupancy: number;
}

export const EngineCoreTab: React.FC<EngineCoreTabProps> = ({
  bids,
  asks,
  activeOrders,
  onPlaceOrder,
  ringBufferHead,
  ringBufferTail,
  ringBufferOccupancy,
}) => {
  // Order form state
  const [orderSide, setOrderSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('LIMIT');
  const [priceInput, setPriceInput] = useState<string>('104525.00');
  const [qtyInput, setQtyInput] = useState<string>('10');
  const [traderIdInput, setTraderIdInput] = useState<string>('TRD-LC500-DESK1');
  const [codeViewTab, setCodeViewTab] = useState<'C_STRUCT' | 'PYTHON_ENGINE'>('C_STRUCT');
  const [copiedCode, setCopiedCode] = useState(false);

  // Calculate Best Bid, Best Ask, Spread
  const bestBid = bids[0]?.price ?? 104520.00;
  const bestAsk = asks[0]?.price ?? 104530.00;
  const spread = bestAsk - bestBid;
  const spreadBps = ((spread / bestBid) * 10000).toFixed(1);

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(priceInput);
    const quantity = parseInt(qtyInput, 10);
    if (isNaN(price) || isNaN(quantity) || quantity <= 0) return;

    onPlaceOrder({
      side: orderSide,
      type: orderType,
      price: orderType === 'MARKET' ? (orderSide === 'BUY' ? bestAsk : bestBid) : price,
      quantity,
      traderId: traderIdInput || 'TRD-ANON',
    });
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const cStructCode = `// GF-T3-167: High-Frequency Lock-Free C-Struct Engine
// Cache-Line Aligned: 64 Bytes per OrderSlot
#include <stdint.h>
#include <stdbool.h>
#include <stdatomic.h>

#define RING_BUFFER_CAPACITY 65536
#define RING_BUFFER_MASK (RING_BUFFER_CAPACITY - 1)

typedef struct __attribute__((aligned(64))) {
    uint64_t sequence_id;        // Monotonic sequence counter (#1M+)
    uint64_t timestamp_ns;       // CLOCK_MONOTONIC_RAW (nanosecond resolution)
    uint64_t order_id;           // Unique 64-bit client order key
    uint32_t trader_id;          // Compact 32-bit participant identifier
    uint32_t instrument_id;      // 0x0167 (Lexus LC 500 Dynamic Core)
    uint32_t price_fixed;        // Scaled fixed-point price (price * 10,000)
    uint32_t quantity;           // Unsigned contract size
    uint8_t  side;               // 0 = BUY, 1 = SELL
    uint8_t  order_type;         // 0 = LIMIT, 1 = MARKET, 2 = IOC, 3 = FOK
    uint8_t  flags;              // 0x01 = POST_ONLY, 0x02 = REDUCE_ONLY
    uint8_t  padding[21];        // Padding to ensure exact 64-byte alignment
} OrderStruct;

typedef struct {
    OrderStruct slots[RING_BUFFER_CAPACITY];
    _Atomic uint64_t head;       // Consumer pointer
    _Atomic uint64_t tail;       // Producer pointer
} LockFreeRingBuffer;

static inline bool ring_buffer_push(LockFreeRingBuffer* rb, const OrderStruct* order) {
    uint64_t tail = atomic_load_explicit(&rb->tail, memory_order_relaxed);
    uint64_t head = atomic_load_explicit(&rb->head, memory_order_acquire);
    
    if ((tail - head) >= RING_BUFFER_CAPACITY) {
        return false; // Zero-allocation backpressure rejection
    }
    
    rb->slots[tail & RING_BUFFER_MASK] = *order;
    atomic_store_explicit(&rb->tail, tail + 1, memory_order_release);
    return true;
}`;

  const pythonEngineCode = `"""
GF-T3-167: Python 3.12 / C-Types Matching Engine Wrapper
Zero-Copy Ring-Buffer Ingestion & B-Tree Ladder Dispatch
"""
import ctypes
from dataclasses import dataclass
from typing import Optional, List, Tuple
import time

class OrderStruct(ctypes.Structure):
    _pack_ = 64
    _fields_ = [
        ("sequence_id", ctypes.c_uint64),
        ("timestamp_ns", ctypes.c_uint64),
        ("order_id", ctypes.c_uint64),
        ("trader_id", ctypes.c_uint32),
        ("instrument_id", ctypes.c_uint32),
        ("price_fixed", ctypes.c_uint32),
        ("quantity", ctypes.c_uint32),
        ("side", ctypes.c_uint8),
        ("order_type", ctypes.c_uint8),
        ("flags", ctypes.c_uint8),
        ("padding", ctypes.c_uint8 * 21)
    ]

class L2DynamicCoreEngine:
    def __init__(self, instrument_symbol: str = "LC500-DYN"):
        self.symbol = instrument_symbol
        self.monotonic_sequence = 1_000_000
        self.bids: dict[int, list[OrderStruct]] = {}  # Price (fixed) -> FIFO queue
        self.asks: dict[int, list[OrderStruct]] = {}
        
    def match_order(self, incoming: OrderStruct) -> List[Tuple[int, int]]:
        matches = []
        target_book = self.asks if incoming.side == 0 else self.bids
        # Lock-free crossing resolution logic:
        # Passive Maker price rule honored with zero jitter.
        return matches
`;

  return (
    <div className="space-y-7">
      {/* Top Engine Overview Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-mono text-sm font-bold uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            Core Execution Architecture
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Dual B+ Tree Price Ladders with Lock-Free Ring Buffer
          </h2>
          <p className="text-zinc-300 text-sm sm:text-base mt-1.5 leading-relaxed max-w-3xl">
            Deterministic nanosecond price-time FIFO matching. 64-byte cache-line aligned C-structs eliminate memory fragmentation and GC pauses.
          </p>
        </div>

        {/* Spread Telemetry Box */}
        <div className="bg-zinc-950 border border-zinc-700 px-5 py-3.5 rounded-xl flex items-center gap-5 text-mono self-stretch md:self-auto justify-between md:justify-start shadow-md">
          <div>
            <div className="text-xs sm:text-sm font-mono text-zinc-400 uppercase font-bold">Current Spread</div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">
              ${spread.toFixed(2)}
            </div>
          </div>
          <div className="border-l border-zinc-800 pl-5">
            <div className="text-xs sm:text-sm font-mono text-zinc-400 uppercase font-bold">Spread (BPS)</div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-0.5">
              {spreadBps} <span className="text-sm font-bold">bps</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: L2 Order Book Ladder (Left) + Order Injection & Ring Buffer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: L2 ORDER BOOK DEPTH LADDER (7 Cols) */}
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800 mb-4">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-amber-400" />
              <h3 className="font-mono text-base sm:text-lg font-bold text-white uppercase tracking-wider">
                L2 Depth Ladder // LC500-DYN
              </h3>
            </div>
            <span className="text-xs sm:text-sm font-mono font-bold text-zinc-200 bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-700">
              Top 6 Levels
            </span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-4 text-xs sm:text-sm font-mono font-bold text-zinc-400 uppercase pb-2.5 px-3 border-b border-zinc-800">
            <div>Price (USD)</div>
            <div className="text-right">Size</div>
            <div className="text-right">Orders</div>
            <div className="text-right">Total Depth</div>
          </div>

          {/* ASKS (Sells) - In reverse so lowest ask is closest to spread */}
          <div className="divide-y divide-zinc-800/60 my-1.5">
            {[...asks].reverse().map((ask) => (
              <div
                key={`ask-${ask.price}`}
                className="grid grid-cols-4 items-center text-sm sm:text-base font-mono py-2.5 px-3 hover:bg-rose-950/30 rounded-lg relative group transition-colors"
              >
                {/* Visual Depth Bar */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-rose-500/15 pointer-events-none rounded-lg"
                  style={{ width: `${ask.depthPercent}%` }}
                />
                <div className="font-bold text-rose-400 flex items-center gap-1.5 z-10">
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                  ${ask.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-right text-zinc-100 font-semibold z-10">{ask.quantity}</div>
                <div className="text-right text-zinc-400 font-medium z-10">{ask.ordersCount}</div>
                <div className="text-right text-zinc-200 font-bold z-10">{ask.cumulativeQty}</div>
              </div>
            ))}
          </div>

          {/* SPREAD DIVIDER BAR */}
          <div className="bg-zinc-950 border-y border-zinc-800 py-3 px-4 my-2.5 flex items-center justify-between text-sm sm:text-base font-mono rounded-xl">
            <span className="text-zinc-300 flex items-center gap-2 font-bold">
              <ArrowDownUp className="w-4 h-4 text-amber-400" />
              MARKET SPREAD
            </span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-bold">${bestBid.toFixed(2)} BID</span>
              <span className="text-zinc-600 font-bold">/</span>
              <span className="text-rose-400 font-bold">${bestAsk.toFixed(2)} ASK</span>
              <span className="bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-md font-bold border border-amber-500/40">
                ${spread.toFixed(2)}
              </span>
            </div>
          </div>

          {/* BIDS (Buys) - Highest bid first */}
          <div className="divide-y divide-zinc-800/60 my-1.5">
            {bids.map((bid) => (
              <div
                key={`bid-${bid.price}`}
                className="grid grid-cols-4 items-center text-sm sm:text-base font-mono py-2.5 px-3 hover:bg-emerald-950/30 rounded-lg relative group transition-colors"
              >
                {/* Visual Depth Bar */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 pointer-events-none rounded-lg"
                  style={{ width: `${bid.depthPercent}%` }}
                />
                <div className="font-bold text-emerald-400 flex items-center gap-1.5 z-10">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  ${bid.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-right text-zinc-100 font-semibold z-10">{bid.quantity}</div>
                <div className="text-right text-zinc-400 font-medium z-10">{bid.ordersCount}</div>
                <div className="text-right text-zinc-200 font-bold z-10">{bid.cumulativeQty}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: MANUAL ORDER INJECTION & RING BUFFER HUD (5 Cols) */}
        <div className="lg:col-span-5 space-y-7">
          
          {/* Order Injection Panel */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-xl">
            <div className="flex items-center justify-between pb-4.5 border-b border-zinc-800 mb-5">
              <div className="flex items-center gap-3">
                <PlusCircle className="w-6 h-6 text-emerald-400" />
                <h3 className="font-mono text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                  Direct Ingress Injector
                </h3>
              </div>
              <span className="text-sm sm:text-base font-mono text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-xl">
                ZERO-ALLOC
              </span>
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-5 font-mono">
              {/* Side Selector (BUY vs SELL) */}
              <div>
                <label className="block text-base font-bold text-zinc-300 uppercase mb-2">
                  Execution Side
                </label>
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setOrderSide('BUY')}
                    className={`py-3.5 px-4 rounded-xl font-black text-base sm:text-lg transition-all border ${
                      orderSide === 'BUY'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-950'
                        : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    BUY (BID)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderSide('SELL')}
                    className={`py-3.5 px-4 rounded-xl font-black text-base sm:text-lg transition-all border ${
                      orderSide === 'SELL'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950'
                        : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    SELL (ASK)
                  </button>
                </div>
              </div>

              {/* Order Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-bold text-zinc-300 uppercase mb-2">
                    Order Type
                  </label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as OrderType)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-base sm:text-lg text-zinc-100 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="LIMIT">LIMIT</option>
                    <option value="MARKET">MARKET</option>
                    <option value="IOC">IOC (Immediate-or-Cancel)</option>
                    <option value="FOK">FOK (Fill-or-Kill)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-base font-bold text-zinc-300 uppercase mb-2">
                    Trader ID
                  </label>
                  <input
                    type="text"
                    value={traderIdInput}
                    onChange={(e) => setTraderIdInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-base sm:text-lg text-zinc-100 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Price & Quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-bold text-zinc-300 uppercase mb-2">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    step="5"
                    disabled={orderType === 'MARKET'}
                    value={orderType === 'MARKET' ? (orderSide === 'BUY' ? bestAsk : bestBid) : priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-base sm:text-lg text-zinc-100 font-mono font-bold focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-base font-bold text-zinc-300 uppercase mb-2">
                    Quantity (Lots)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={qtyInput}
                    onChange={(e) => setQtyInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-base sm:text-lg text-zinc-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full py-4 px-6 rounded-xl font-mono font-black text-base sm:text-lg tracking-wider uppercase transition-all shadow-lg active:scale-98 ${
                  orderSide === 'BUY'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                }`}
              >
                Inject {orderSide} Order ({orderType})
              </button>
            </form>
          </div>

          {/* Ring Buffer Telemetry Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-xl font-mono">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4.5">
              <span className="text-base uppercase font-black text-zinc-300 flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-cyan-400" />
                Ring-Buffer Hardware Topology
              </span>
              <span className="text-sm font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1 rounded-xl">
                64-BYTE ALIGNED
              </span>
            </div>

            <div className="space-y-4.5">
              <div>
                <div className="flex justify-between text-base text-zinc-300 mb-2 font-bold">
                  <span>Circular Slot Occupancy</span>
                  <span className="text-white font-black">{ringBufferOccupancy}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-3.5 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(5, ringBufferOccupancy)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3.5 text-center pt-2">
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                  <div className="text-xs sm:text-sm text-zinc-400 uppercase font-bold">Head Ptr</div>
                  <div className="text-base font-black text-zinc-100 mt-1">0x{ringBufferHead.toString(16).toUpperCase()}</div>
                </div>
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                  <div className="text-xs sm:text-sm text-zinc-400 uppercase font-bold">Tail Ptr</div>
                  <div className="text-base font-black text-zinc-100 mt-1">0x{ringBufferTail.toString(16).toUpperCase()}</div>
                </div>
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                  <div className="text-xs sm:text-sm text-zinc-400 uppercase font-bold">Capacity</div>
                  <div className="text-base font-black text-emerald-400 mt-1">65,536</div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Code Viewer: C-Struct vs Python 3.12 Engine */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-zinc-950 px-6 py-4.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCodeViewTab('C_STRUCT')}
              className={`px-5 py-2.5 rounded-xl text-base font-mono font-bold transition-all ${
                codeViewTab === 'C_STRUCT'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              order_struct.h (C11 Memory Layout)
            </button>
            <button
              onClick={() => setCodeViewTab('PYTHON_ENGINE')}
              className={`px-5 py-2.5 rounded-xl text-base font-mono font-bold transition-all ${
                codeViewTab === 'PYTHON_ENGINE'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              engine_core.py (Python 3.12 Dispatcher)
            </button>
          </div>

          <button
            onClick={() => handleCopyCode(codeViewTab === 'C_STRUCT' ? cStructCode : pythonEngineCode)}
            className="flex items-center gap-2.5 text-base font-mono font-bold text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-700 px-5 py-2.5 rounded-xl transition-colors"
          >
            {copiedCode ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            <span>{copiedCode ? 'Copied to Clipboard' : 'Copy Code'}</span>
          </button>
        </div>

        <div className="p-6 bg-zinc-950/80 overflow-x-auto text-base sm:text-lg font-mono leading-relaxed text-zinc-200">
          <pre className="selection:bg-amber-500/30">
            <code>{codeViewTab === 'C_STRUCT' ? cStructCode : pythonEngineCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
