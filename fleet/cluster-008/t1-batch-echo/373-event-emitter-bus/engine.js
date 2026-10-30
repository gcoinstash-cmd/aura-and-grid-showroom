/**
 * Unit #373: Wildcard Telemetry Event Bus & Topic Dispatcher
 * Track 1 (Lean Tuner) — Pattern-Matching Event Hub
 */

export class TelemetryEventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(topic, handler) {
    if (typeof handler !== 'function') throw new TypeError('Handler must be a function');
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic).add(handler);

    return () => this.off(topic, handler);
  }

  once(topic, handler) {
    const wrapped = (...args) => {
      this.off(topic, wrapped);
      handler(...args);
    };
    wrapped._original = handler;
    return this.on(topic, wrapped);
  }

  off(topic, handler) {
    if (!this.listeners.has(topic)) return;
    const set = this.listeners.get(topic);
    set.delete(handler);
    for (const h of set) {
      if (h._original === handler) {
        set.delete(h);
      }
    }
    if (set.size === 0) {
      this.listeners.delete(topic);
    }
  }

  emit(topic, payload) {
    let dispatchCount = 0;

    for (const [registeredTopic, handlerSet] of this.listeners.entries()) {
      if (this._matchesTopic(registeredTopic, topic)) {
        for (const handler of Array.from(handlerSet)) {
          handler(payload, topic);
          dispatchCount++;
        }
      }
    }

    return dispatchCount;
  }

  _matchesTopic(pattern, topic) {
    if (pattern === '*' || pattern === topic) return true;
    if (pattern.endsWith(':*')) {
      const prefix = pattern.slice(0, -2);
      return topic === prefix || topic.startsWith(prefix + ':');
    }
    return false;
  }

  clear() {
    this.listeners.clear();
  }
}
