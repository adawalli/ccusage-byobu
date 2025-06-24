/**
 * Simple in-memory cache with TTL support for ccusage-byobu
 * Designed to cache ccusage command output to reduce frequent execution
 *
 * NOTE: Cache is DISABLED by default for byobu compatibility.
 * Set CCUSAGE_ENABLE_CACHE=1 to enable caching for interactive CLI usage.
 *
 * Configuration options:
 * - cleanupIntervalMs: Interval in milliseconds for automatic cleanup (default: 30000)
 * - maxKeys: Maximum number of keys before LRU eviction (default: null = unlimited)
 * - windowSize: Number of operations to track in rolling window (default: 100)
 * - intervalDuration: Duration in milliseconds for time-based statistics intervals (default: 60000)
 *
 * Environment variables:
 * - CCUSAGE_ENABLE_CACHE: Set to '1' or 'true' to enable caching (default: disabled)
 * - CCUSAGE_BYOBU_CACHE_CLEANUP_INTERVAL: Override cleanup interval in milliseconds
 * - CCUSAGE_BYOBU_CACHE_MAX_KEYS: Override max keys limit
 * - CCUSAGE_BYOBU_CACHE_WINDOW_SIZE: Override rolling window size
 *
 * Events emitted:
 * - 'set': { key, valueSize, ttl, timestamp } - When a value is stored
 * - 'get': { key, hit, timestamp } - When a value is requested
 * - 'eviction': { key, reason, timestamp } - When a value is evicted ('ttl', 'lru', 'manual')
 * - 'clear': { keysCleared, timestamp } - When cache is cleared
 * - 'cleanup': { evictedCount, timestamp } - When automatic cleanup runs
 */

import { EventEmitter } from 'node:events';

class Cache extends EventEmitter {
  constructor(options = {}) {
    super();

    // Default configuration
    const defaultConfig = {
      cleanupIntervalMs: 30000, // 30 seconds
      maxKeys: null, // No limit by default
      windowSize: 100, // Rolling window size
      intervalDuration: 60000, // 1 minute intervals for time-based stats
    };

    // Environment variable overrides
    const envConfig = {
      cleanupIntervalMs: process.env.CCUSAGE_BYOBU_CACHE_CLEANUP_INTERVAL
        ? parseInt(process.env.CCUSAGE_BYOBU_CACHE_CLEANUP_INTERVAL, 10)
        : undefined,
      maxKeys: process.env.CCUSAGE_BYOBU_CACHE_MAX_KEYS
        ? parseInt(process.env.CCUSAGE_BYOBU_CACHE_MAX_KEYS, 10)
        : undefined,
      windowSize: process.env.CCUSAGE_BYOBU_CACHE_WINDOW_SIZE
        ? parseInt(process.env.CCUSAGE_BYOBU_CACHE_WINDOW_SIZE, 10)
        : undefined,
    };

    // Merge configurations: defaults < environment < options
    this.config = {
      ...defaultConfig,
      ...Object.fromEntries(Object.entries(envConfig).filter(([, value]) => value !== undefined)),
      ...options,
    };

    // Validate configuration
    if (this.config.cleanupIntervalMs <= 0) {
      throw new Error('cleanupIntervalMs must be positive');
    }
    if (this.config.maxKeys !== null && this.config.maxKeys <= 0) {
      throw new Error('maxKeys must be positive or null');
    }
    if (this.config.windowSize <= 0) {
      throw new Error('windowSize must be positive');
    }

    this.store = new Map();
    this.accessOrder = new Map(); // Track access order for LRU eviction
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      lruEvictions: 0, // Track LRU evictions separately
    };

    // Rolling window statistics
    this.rollingWindow = {
      windowSize: this.config.windowSize,
      operations: [], // Array of { type: 'hit'|'miss', timestamp: Date.now() }
      windowStats: {
        hits: 0,
        misses: 0,
        hitRate: 0,
      },
    };

    // Time-based statistics
    this.timeBasedStats = {
      intervals: [], // Array of { startTime, endTime, hits, misses }
      currentInterval: {
        startTime: Date.now(),
        hits: 0,
        misses: 0,
      },
      intervalDuration: this.config.intervalDuration,
    };

    // Cleanup timer to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
      this.rotateTimeBasedStats();
    }, this.config.cleanupIntervalMs);
  }

  /**
   * Set a value in the cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlMs - Time to live in milliseconds (default: 15000)
   */
  set(key, value, ttlMs = 15000) {
    const now = Date.now();
    const expiresAt = now + ttlMs;

    // If key already exists, update access order
    if (this.store.has(key)) {
      this.accessOrder.delete(key);
    } else if (this.config.maxKeys !== null && this.store.size >= this.config.maxKeys) {
      // Need to evict oldest entry (LRU)
      const oldestKey = this.accessOrder.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
        this.accessOrder.delete(oldestKey);
        this.stats.lruEvictions++;
        this.stats.evictions++;

        // Emit eviction event
        this.emit('eviction', {
          key: oldestKey,
          reason: 'lru',
          timestamp: now,
        });
      }
    }

    this.store.set(key, {
      value,
      expiresAt,
      createdAt: now,
    });

    // Update access order (most recently used goes to end)
    this.accessOrder.set(key, now);

    // Emit set event
    const valueSize = this._getValueSize(value);
    this.emit('set', {
      key,
      valueSize,
      ttl: ttlMs,
      timestamp: now,
    });
  }

  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or null if not found/expired
   */
  get(key) {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      this.stats.misses++;
      this.recordOperation('miss');

      // Emit get event (miss)
      this.emit('get', {
        key,
        hit: false,
        timestamp: now,
      });

      return null;
    }

    if (now > entry.expiresAt) {
      // Expired entry
      this.store.delete(key);
      this.accessOrder.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      this.recordOperation('miss');

      // Emit eviction event for expired entry
      this.emit('eviction', {
        key,
        reason: 'ttl',
        timestamp: now,
      });

      // Emit get event (miss)
      this.emit('get', {
        key,
        hit: false,
        timestamp: now,
      });

      return null;
    }

    // Update access order (move to end as most recently used)
    this.accessOrder.delete(key);
    this.accessOrder.set(key, now);

    this.stats.hits++;
    this.recordOperation('hit');

    // Emit get event (hit)
    this.emit('get', {
      key,
      hit: true,
      timestamp: now,
    });

    return entry.value;
  }

  /**
   * Check if a key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and is valid
   */
  has(key) {
    const entry = this.store.get(key);
    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.store.delete(key);
      this.accessOrder.delete(key);
      this.stats.evictions++;

      // Emit eviction event for expired entry
      this.emit('eviction', {
        key,
        reason: 'ttl',
        timestamp: now,
      });

      return false;
    }

    return true;
  }

  /**
   * Remove expired entries from cache
   */
  cleanup() {
    const now = Date.now();
    let evicted = 0;
    const evictedKeys = [];

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        this.accessOrder.delete(key);
        evicted++;
        evictedKeys.push(key);

        // Emit individual eviction events
        this.emit('eviction', {
          key,
          reason: 'ttl',
          timestamp: now,
        });
      }
    }

    this.stats.evictions += evicted;

    // Emit cleanup event if any keys were evicted
    if (evicted > 0) {
      this.emit('cleanup', {
        evictedCount: evicted,
        evictedKeys,
        timestamp: now,
      });
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    const size = this.store.size;
    const now = Date.now();

    // Get all keys before clearing
    const clearedKeys = Array.from(this.store.keys());

    this.store.clear();
    this.accessOrder.clear();
    this.stats.evictions += size;

    // Emit clear event
    if (size > 0) {
      this.emit('clear', {
        keysCleared: size,
        clearedKeys,
        timestamp: now,
      });
    }
  }

  /**
   * Record an operation for rolling window statistics
   * @param {'hit'|'miss'} type - Operation type
   */
  recordOperation(type) {
    const now = Date.now();

    // Add to rolling window
    this.rollingWindow.operations.push({ type, timestamp: now });

    // Update window stats
    if (type === 'hit') {
      this.rollingWindow.windowStats.hits++;
      this.timeBasedStats.currentInterval.hits++;
    } else {
      this.rollingWindow.windowStats.misses++;
      this.timeBasedStats.currentInterval.misses++;
    }

    // Trim window if needed
    if (this.rollingWindow.operations.length > this.rollingWindow.windowSize) {
      const removed = this.rollingWindow.operations.shift();
      if (removed.type === 'hit') {
        this.rollingWindow.windowStats.hits--;
      } else {
        this.rollingWindow.windowStats.misses--;
      }
    }

    // Update rolling window hit rate
    const windowTotal = this.rollingWindow.windowStats.hits + this.rollingWindow.windowStats.misses;
    this.rollingWindow.windowStats.hitRate =
      windowTotal > 0 ? ((this.rollingWindow.windowStats.hits / windowTotal) * 100).toFixed(2) : 0;
  }

  /**
   * Rotate time-based statistics
   */
  rotateTimeBasedStats() {
    const now = Date.now();

    // Check if current interval should be rotated
    if (
      now - this.timeBasedStats.currentInterval.startTime >=
      this.timeBasedStats.intervalDuration
    ) {
      // Save current interval
      this.timeBasedStats.intervals.push({
        ...this.timeBasedStats.currentInterval,
        endTime: now,
      });

      // Keep only last 60 intervals (1 hour worth)
      if (this.timeBasedStats.intervals.length > 60) {
        this.timeBasedStats.intervals.shift();
      }

      // Start new interval
      this.timeBasedStats.currentInterval = {
        startTime: now,
        hits: 0,
        misses: 0,
      };
    }
  }

  /**
   * Get rolling window statistics
   * @returns {Object} Rolling window stats
   */
  getRollingWindowStats() {
    return {
      windowSize: this.rollingWindow.windowSize,
      currentOperations: this.rollingWindow.operations.length,
      ...this.rollingWindow.windowStats,
      recentOperations: this.rollingWindow.operations.slice(-10), // Last 10 operations
    };
  }

  /**
   * Get time-based statistics
   * @returns {Object} Time-based stats
   */
  getTimeBasedStats() {
    const intervals = [...this.timeBasedStats.intervals];

    // Include current interval if it has data
    if (
      this.timeBasedStats.currentInterval.hits > 0 ||
      this.timeBasedStats.currentInterval.misses > 0
    ) {
      intervals.push({
        ...this.timeBasedStats.currentInterval,
        endTime: Date.now(),
        isCurrentInterval: true,
      });
    }

    // Calculate aggregate stats
    const totalHits = intervals.reduce((sum, interval) => sum + interval.hits, 0);
    const totalMisses = intervals.reduce((sum, interval) => sum + interval.misses, 0);
    const hitRate =
      totalHits + totalMisses > 0 ? ((totalHits / (totalHits + totalMisses)) * 100).toFixed(2) : 0;

    return {
      intervalDuration: this.timeBasedStats.intervalDuration,
      intervals: intervals.slice(-5), // Last 5 intervals
      aggregate: {
        totalHits,
        totalMisses,
        hitRate: `${hitRate}%`,
        periodCovered: intervals.length > 0 ? Date.now() - intervals[0].startTime : 0,
      },
    };
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
        : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.store.size,
      maxKeys: this.config.maxKeys,
      cleanupIntervalMs: this.config.cleanupIntervalMs,
      memory: this.getMemoryUsage(),
      rollingWindow: this.getRollingWindowStats(),
      timeBased: this.getTimeBasedStats(),
      config: { ...this.config },
    };
  }

  /**
   * Calculate the size of a value in bytes
   * @param {any} value - The value to measure
   * @returns {number} Size in bytes
   * @private
   */
  _getValueSize(value) {
    try {
      return JSON.stringify(value).length * 2; // Unicode characters = 2 bytes each
    } catch {
      return 0; // Fallback for non-serializable values
    }
  }

  /**
   * Get approximate memory usage of cache
   * @returns {Object} Memory usage information
   */
  getMemoryUsage() {
    let totalSize = 0;

    for (const [key, entry] of this.store.entries()) {
      // Rough estimate of memory usage
      totalSize += key.length * 2; // Unicode string
      totalSize += JSON.stringify(entry.value).length * 2;
      totalSize += 24; // Overhead for timestamps and metadata
    }

    return {
      bytes: totalSize,
      kb: (totalSize / 1024).toFixed(2),
      mb: (totalSize / (1024 * 1024)).toFixed(4),
    };
  }

  /**
   * Destroy the cache and cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Global cache instance
let globalCache = null;

/**
 * Get the global cache instance
 * @param {Object} options - Cache configuration options (only used on first call)
 * @returns {Cache} Cache instance
 */
export function getCache(options = {}) {
  if (!globalCache) {
    globalCache = new Cache(options);
  }
  return globalCache;
}

/**
 * Cache a ccusage command result
 * @param {string} command - The command that was executed
 * @param {string} result - The command result to cache
 * @param {number} ttlMs - TTL in milliseconds (default: 15000)
 */
export function cacheCommandResult(command, result, ttlMs = 15000) {
  const cache = getCache();
  const key = `ccusage_command:${command}`;
  cache.set(key, result, ttlMs);
}

/**
 * Get cached ccusage command result
 * @param {string} command - The command to look up
 * @returns {string|null} Cached result or null if not found
 */
export function getCachedCommandResult(command) {
  const cache = getCache();
  const key = `ccusage_command:${command}`;
  return cache.get(key);
}

/**
 * Get cache statistics for debugging
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  const cache = getCache();
  return cache.getStats();
}

/**
 * Clear all cache entries
 */
export function clearCache() {
  const cache = getCache();
  cache.clear();
}

/**
 * Destroy the global cache (useful for testing)
 */
export function destroyCache() {
  if (globalCache) {
    globalCache.destroy();
    globalCache = null;
  }
}

/**
 * Add event listeners to cache for debugging and monitoring
 * This is an example of how to use the cache event system
 * @param {Cache} cache - Cache instance to monitor
 * @param {Object} options - Monitoring options
 * @param {boolean} options.logSet - Log set operations (default: true)
 * @param {boolean} options.logGet - Log get operations (default: false)
 * @param {boolean} options.logEvictions - Log eviction events (default: true)
 * @param {boolean} options.logCleanup - Log cleanup events (default: true)
 * @param {boolean} options.logClear - Log clear events (default: true)
 */
export function addCacheEventLogging(cache, options = {}) {
  const opts = {
    logSet: true,
    logGet: false, // Can be noisy
    logEvictions: true,
    logCleanup: true,
    logClear: true,
    ...options,
  };

  if (opts.logSet) {
    cache.on('set', (data) => {
      console.log(`[Cache] SET key="${data.key}" size=${data.valueSize}B ttl=${data.ttl}ms`);
    });
  }

  if (opts.logGet) {
    cache.on('get', (data) => {
      const hitMiss = data.hit ? 'HIT' : 'MISS';
      console.log(`[Cache] GET key="${data.key}" result=${hitMiss}`);
    });
  }

  if (opts.logEvictions) {
    cache.on('eviction', (data) => {
      console.log(`[Cache] EVICTION key="${data.key}" reason=${data.reason}`);
    });
  }

  if (opts.logCleanup) {
    cache.on('cleanup', (data) => {
      console.log(`[Cache] CLEANUP evicted ${data.evictedCount} expired entries`);
    });
  }

  if (opts.logClear) {
    cache.on('clear', (data) => {
      console.log(`[Cache] CLEAR removed ${data.keysCleared} entries`);
    });
  }
}

/**
 * Create a cache statistics collector using events
 * This shows how to use events for monitoring cache performance
 * @param {Cache} cache - Cache instance to monitor
 * @returns {Object} Statistics collector with getStats() method
 */
export function createCacheStatsCollector(cache) {
  const stats = {
    operations: {
      sets: 0,
      gets: 0,
      hits: 0,
      misses: 0,
      evictions: { ttl: 0, lru: 0, manual: 0 },
      cleanups: 0,
      clears: 0,
    },
    recentOperations: [], // Last 20 operations
  };

  // Track set operations
  cache.on('set', (data) => {
    stats.operations.sets++;
    stats.recentOperations.push({
      type: 'set',
      key: data.key,
      timestamp: data.timestamp,
    });
    trimRecentOperations();
  });

  // Track get operations
  cache.on('get', (data) => {
    stats.operations.gets++;
    if (data.hit) {
      stats.operations.hits++;
    } else {
      stats.operations.misses++;
    }
    stats.recentOperations.push({
      type: data.hit ? 'hit' : 'miss',
      key: data.key,
      timestamp: data.timestamp,
    });
    trimRecentOperations();
  });

  // Track evictions
  cache.on('eviction', (data) => {
    stats.operations.evictions[data.reason]++;
    stats.recentOperations.push({
      type: 'eviction',
      key: data.key,
      reason: data.reason,
      timestamp: data.timestamp,
    });
    trimRecentOperations();
  });

  // Track cleanup operations
  cache.on('cleanup', (data) => {
    stats.operations.cleanups++;
    stats.recentOperations.push({
      type: 'cleanup',
      evictedCount: data.evictedCount,
      timestamp: data.timestamp,
    });
    trimRecentOperations();
  });

  // Track clear operations
  cache.on('clear', (data) => {
    stats.operations.clears++;
    stats.recentOperations.push({
      type: 'clear',
      keysCleared: data.keysCleared,
      timestamp: data.timestamp,
    });
    trimRecentOperations();
  });

  function trimRecentOperations() {
    if (stats.recentOperations.length > 20) {
      stats.recentOperations = stats.recentOperations.slice(-20);
    }
  }

  return {
    getStats: () => ({ ...stats }),
    reset: () => {
      stats.operations = {
        sets: 0,
        gets: 0,
        hits: 0,
        misses: 0,
        evictions: { ttl: 0, lru: 0, manual: 0 },
        cleanups: 0,
        clears: 0,
      };
      stats.recentOperations = [];
    },
  };
}
