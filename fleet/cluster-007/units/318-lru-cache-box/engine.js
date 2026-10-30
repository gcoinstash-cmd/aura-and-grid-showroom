/**
 * Unit #318: Key-Value In-Memory LRU Cache Cache-Box
 * Track 1 (Lean Tuner) — High-Performance O(1) In-Memory Cache Rig
 * 
 * GhostFactoryOS Architecture: Cluster-007
 * Pure ESM | Zero External Dependencies (Node.js Standard Library Only)
 */

export class CacheError extends Error {
  constructor(message, code = 'ERR_CACHE') {
    super(message);
    this.name = 'CacheError';
    this.code = code;
  }
}

/**
 * High-performance, zero-dependency Least Recently Used (LRU) Cache
 * utilizing JavaScript Map insertion-order mechanics for true O(1) lookups and updates.
 */
export class LruCache {
  /**
   * @param {number} [maxSize=1000] - Maximum item capacity before eviction
   * @param {number} [defaultTtlMs=0] - Default TTL in ms (0 = indefinite)
   * @param {((key: string, value: any, reason: 'eviction'|'expired') => void)} [onEvict] 
   */
  constructor(maxSize = 1000, defaultTtlMs = 0, onEvict = null) {
    if (maxSize <= 0) throw new CacheError('Cache maxSize must be greater than 0');
    this.maxSize = maxSize;
    this.defaultTtlMs = defaultTtlMs;
    this.onEvict = onEvict;
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
      sets: 0
    };
  }

  /**
   * Sets a key-value entry with optional custom TTL.
   * 
   * @param {string} key 
   * @param {any} value 
   * @param {number} [ttlMs] 
   * @returns {this}
   */
  set(key, value, ttlMs = this.defaultTtlMs) {
    if (key === undefined || key === null) {
      throw new CacheError('Cache key cannot be null or undefined');
    }
    const strKey = String(key);

    // If key exists, delete it first to refresh insertion order on re-set
    if (this.cache.has(strKey)) {
      this.cache.delete(strKey);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest item (first key in Map iterator)
      const oldestKey = this.cache.keys().next().value;
      const oldestEntry = this.cache.get(oldestKey);
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      if (typeof this.onEvict === 'function') {
        this.onEvict(oldestKey, oldestEntry?.value, 'eviction');
      }
    }

    const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : null;
    this.cache.set(strKey, { value, expiresAt });
    this.stats.sets++;
    return this;
  }

  /**
   * Retrieves an item from cache. Refreshes LRU priority.
   * 
   * @param {string} key 
   * @returns {any|undefined} Value if found and unexpired, else undefined
   */
  get(key) {
    const strKey = String(key);
    const entry = this.cache.get(strKey);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check TTL expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(strKey);
      this.stats.expirations++;
      this.stats.misses++;
      if (typeof this.onEvict === 'function') {
        this.onEvict(strKey, entry.value, 'expired');
      }
      return undefined;
    }

    // Refresh LRU order: delete and re-insert at end of Map
    this.cache.delete(strKey);
    this.cache.set(strKey, entry);
    this.stats.hits++;
    return entry.value;
  }

  /**
   * Checks if key exists and is unexpired without altering LRU order.
   * @param {string} key 
   * @returns {boolean}
   */
  has(key) {
    const strKey = String(key);
    const entry = this.cache.get(strKey);
    if (!entry) return false;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(strKey);
      this.stats.expirations++;
      return false;
    }
    return true;
  }

  /**
   * Deletes a key from cache.
   * @param {string} key 
   * @returns {boolean}
   */
  delete(key) {
    const strKey = String(key);
    return this.cache.delete(strKey);
  }

  /**
   * Clears all cache entries.
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Returns current cache size.
   */
  get size() {
    return this.cache.size;
  }

  /**
   * Returns telemetry performance metrics.
   */
  getTelemetry() {
    const totalLookups = this.stats.hits + this.stats.misses;
    const hitRatePct = totalLookups > 0 ? Number(((this.stats.hits / totalLookups) * 100).toFixed(2)) : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      expirations: this.stats.expirations,
      sets: this.stats.sets,
      hitRatePct
    };
  }
}

/**
 * Performance benchmark.
 * @param {number} [iterations=2000] 
 */
export function benchmarkLruCache(iterations = 2000) {
  const cache = new LruCache(500);
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    cache.set(`k_${i % 600}`, i);
    cache.get(`k_${(i - 10) % 600}`);
  }
  const totalMs = performance.now() - start;

  return {
    iterations,
    totalMs: Number(totalMs.toFixed(3)),
    avgLatencyUs: Number(((totalMs * 1000) / iterations).toFixed(2)),
    opsPerSec: Math.round((iterations / totalMs) * 1000),
    telemetry: cache.getTelemetry()
  };
}
