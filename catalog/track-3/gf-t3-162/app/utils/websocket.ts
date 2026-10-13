/**
 * Ghost FactoryOS Track 3 F1 Skunkworks Engine — GF-T3-162 (Sovereign Ledger)
 * Ultra-low latency WebSocket & Real-Time Event Dispatch Manager
 */

export interface WebSocketTradePayload {
  trade_id: string;
  seq_num: number;
  taker_order_id: string;
  maker_order_id: string;
  price: number;
  qty: number;
  taker_side: 'BUY' | 'SELL';
  timestamp_ns: number;
}

export interface WebSocketDepthLevel {
  price: number;
  volume: number;
  cumulative: number;
  orders_count?: number;
  ordersCount?: number;
}

export interface WebSocketDepthPayload {
  instrument_id: string;
  seq_num: number;
  timestamp_ns: number;
  best_bid: number | null;
  best_ask: number | null;
  spread: number | null;
  spread_bps: number | null;
  bids: WebSocketDepthLevel[];
  asks: WebSocketDepthLevel[];
}

export interface WebSocketOrderPayload {
  order_id: string;
  client_order_id: string;
  side: 'BUY' | 'SELL';
  price: number;
  qty: number;
  filled_qty: number;
  status: 'ACCEPTED' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  timestamp_ns: number;
}

export type MessageHandler<T> = (data: T) => void;

export class OrderBookWebSocketManager {
  private url: string;
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectInterval: number = 2000;
  private maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private tradeListeners: Set<MessageHandler<WebSocketTradePayload>> = new Set();
  private depthListeners: Set<MessageHandler<WebSocketDepthPayload>> = new Set();
  private orderListeners: Set<MessageHandler<WebSocketOrderPayload>> = new Set();
  private statusListeners: Set<(connected: boolean) => void> = new Set();

  constructor(url: string = 'ws://localhost:8000/ws/v1/stream') {
    this.url = url;
  }

  public connect(): void {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyStatus(true);
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          this.handleIncomingMessage(message);
        } catch {
          // invalid json payload ignored
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyStatus(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        if (this.ws) {
          this.ws.close();
        }
      };
    } catch {
      this.isConnected = false;
      this.notifyStatus(false);
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.notifyStatus(false);
  }

  public subscribeTrades(handler: MessageHandler<WebSocketTradePayload>): () => void {
    this.tradeListeners.add(handler);
    return () => this.tradeListeners.delete(handler);
  }

  public subscribeDepth(handler: MessageHandler<WebSocketDepthPayload>): () => void {
    this.depthListeners.add(handler);
    return () => this.depthListeners.delete(handler);
  }

  public subscribeOrders(handler: MessageHandler<WebSocketOrderPayload>): () => void {
    this.orderListeners.add(handler);
    return () => this.orderListeners.delete(handler);
  }

  public subscribeStatus(handler: (connected: boolean) => void): () => void {
    this.statusListeners.add(handler);
    handler(this.isConnected);
    return () => this.statusListeners.delete(handler);
  }

  /**
   * Broadcast local simulated event (for offline / deterministic browser engine mode)
   */
  public broadcastSimulatedTrade(trade: WebSocketTradePayload): void {
    this.tradeListeners.forEach((handler) => handler(trade));
  }

  public broadcastSimulatedDepth(depth: WebSocketDepthPayload): void {
    this.depthListeners.forEach((handler) => handler(depth));
  }

  public broadcastSimulatedOrder(order: WebSocketOrderPayload): void {
    this.orderListeners.forEach((handler) => handler(order));
  }

  private handleIncomingMessage(message: { type: string; data: any }): void {
    if (!message || !message.type) return;

    switch (message.type) {
      case 'TRADE':
        this.tradeListeners.forEach((fn) => fn(message.data));
        break;
      case 'DEPTH':
        this.depthListeners.forEach((fn) => fn(message.data));
        break;
      case 'ORDER':
        this.orderListeners.forEach((fn) => fn(message.data));
        break;
      default:
        break;
    }
  }

  private notifyStatus(status: boolean): void {
    this.statusListeners.forEach((fn) => fn(status));
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectInterval * Math.min(this.reconnectAttempts, 4));
  }
}

export const wsManager = new OrderBookWebSocketManager();
