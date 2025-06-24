/**
 * Performance tracking module for ccusage-byobu
 * Tracks performance metrics over time including JSON parsing
 */

class PerformanceTracker {
  constructor() {
    this.metrics = {
      jsonParsing: {
        operations: [],
        totalTime: 0,
        totalBytes: 0,
        count: 0,
        avgTime: 0,
        avgThroughput: 0,
        minTime: Infinity,
        maxTime: 0,
        minThroughput: Infinity,
        maxThroughput: 0,
      },
      commandExecution: {
        operations: [],
        totalTime: 0,
        count: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
      },
      cacheOperations: {
        reads: { hits: 0, misses: 0, totalTime: 0 },
        writes: { count: 0, totalTime: 0 },
      },
      memory: {
        snapshots: [],
        startMemory: null,
        currentMemory: null,
        peakMemory: { rss: 0, heapUsed: 0 },
      },
    };

    // Track session start time
    this.sessionStartTime = Date.now();
    this.captureMemorySnapshot('session_start');
  }

  /**
   * Track JSON parsing performance
   * @param {number} parseTime - Parse time in milliseconds
   * @param {number} jsonSize - Size of JSON in bytes
   */
  trackJsonParsing(parseTime, jsonSize) {
    const throughput = jsonSize / parseTime / 1024; // KB/ms

    const operation = {
      timestamp: Date.now(),
      parseTime,
      jsonSize,
      throughput,
    };

    this.metrics.jsonParsing.operations.push(operation);
    this.metrics.jsonParsing.totalTime += parseTime;
    this.metrics.jsonParsing.totalBytes += jsonSize;
    this.metrics.jsonParsing.count++;

    // Update statistics
    this.metrics.jsonParsing.avgTime =
      this.metrics.jsonParsing.totalTime / this.metrics.jsonParsing.count;
    this.metrics.jsonParsing.avgThroughput =
      this.metrics.jsonParsing.totalBytes / this.metrics.jsonParsing.totalTime / 1024;

    this.metrics.jsonParsing.minTime = Math.min(this.metrics.jsonParsing.minTime, parseTime);
    this.metrics.jsonParsing.maxTime = Math.max(this.metrics.jsonParsing.maxTime, parseTime);
    this.metrics.jsonParsing.minThroughput = Math.min(
      this.metrics.jsonParsing.minThroughput,
      throughput
    );
    this.metrics.jsonParsing.maxThroughput = Math.max(
      this.metrics.jsonParsing.maxThroughput,
      throughput
    );

    // Keep only last 100 operations
    if (this.metrics.jsonParsing.operations.length > 100) {
      this.metrics.jsonParsing.operations.shift();
    }
  }

  /**
   * Track command execution performance
   * @param {number} executionTime - Execution time in milliseconds
   */
  trackCommandExecution(executionTime) {
    const operation = {
      timestamp: Date.now(),
      executionTime,
    };

    this.metrics.commandExecution.operations.push(operation);
    this.metrics.commandExecution.totalTime += executionTime;
    this.metrics.commandExecution.count++;

    // Update statistics
    this.metrics.commandExecution.avgTime =
      this.metrics.commandExecution.totalTime / this.metrics.commandExecution.count;
    this.metrics.commandExecution.minTime = Math.min(
      this.metrics.commandExecution.minTime,
      executionTime
    );
    this.metrics.commandExecution.maxTime = Math.max(
      this.metrics.commandExecution.maxTime,
      executionTime
    );

    // Keep only last 100 operations
    if (this.metrics.commandExecution.operations.length > 100) {
      this.metrics.commandExecution.operations.shift();
    }
  }

  /**
   * Track cache read operation
   * @param {boolean} hit - Whether it was a cache hit
   * @param {number} readTime - Read time in nanoseconds
   */
  trackCacheRead(hit, readTime) {
    if (hit) {
      this.metrics.cacheOperations.reads.hits++;
    } else {
      this.metrics.cacheOperations.reads.misses++;
    }
    this.metrics.cacheOperations.reads.totalTime += readTime;
  }

  /**
   * Track cache write operation
   * @param {number} writeTime - Write time in nanoseconds
   */
  trackCacheWrite(writeTime) {
    this.metrics.cacheOperations.writes.count++;
    this.metrics.cacheOperations.writes.totalTime += writeTime;
  }

  /**
   * Capture memory snapshot
   * @param {string} label - Label for the snapshot
   */
  captureMemorySnapshot(label = 'snapshot') {
    const usage = process.memoryUsage();
    const snapshot = {
      timestamp: Date.now(),
      label,
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
    };

    this.metrics.memory.snapshots.push(snapshot);

    // Update current memory
    this.metrics.memory.currentMemory = snapshot;

    // Update peak memory
    this.metrics.memory.peakMemory.rss = Math.max(this.metrics.memory.peakMemory.rss, usage.rss);
    this.metrics.memory.peakMemory.heapUsed = Math.max(
      this.metrics.memory.peakMemory.heapUsed,
      usage.heapUsed
    );

    // Set start memory if not set
    if (!this.metrics.memory.startMemory) {
      this.metrics.memory.startMemory = snapshot;
    }

    // Keep only last 50 snapshots
    if (this.metrics.memory.snapshots.length > 50) {
      this.metrics.memory.snapshots.shift();
    }
  }

  /**
   * Get performance summary
   * @returns {Object} Performance summary
   */
  getSummary() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    const memoryGrowth =
      this.metrics.memory.currentMemory && this.metrics.memory.startMemory
        ? {
            rss: this.metrics.memory.currentMemory.rss - this.metrics.memory.startMemory.rss,
            heapUsed:
              this.metrics.memory.currentMemory.heapUsed - this.metrics.memory.startMemory.heapUsed,
          }
        : { rss: 0, heapUsed: 0 };

    return {
      sessionDuration: sessionDuration / 1000, // seconds
      jsonParsing: {
        count: this.metrics.jsonParsing.count,
        avgTime: this.metrics.jsonParsing.avgTime.toFixed(3),
        minTime:
          this.metrics.jsonParsing.minTime === Infinity
            ? 0
            : this.metrics.jsonParsing.minTime.toFixed(3),
        maxTime: this.metrics.jsonParsing.maxTime.toFixed(3),
        avgThroughput: this.metrics.jsonParsing.avgThroughput.toFixed(2),
        totalBytes: this.metrics.jsonParsing.totalBytes,
      },
      commandExecution: {
        count: this.metrics.commandExecution.count,
        avgTime: this.metrics.commandExecution.avgTime.toFixed(0),
        minTime:
          this.metrics.commandExecution.minTime === Infinity
            ? 0
            : this.metrics.commandExecution.minTime.toFixed(0),
        maxTime: this.metrics.commandExecution.maxTime.toFixed(0),
      },
      cacheOperations: {
        hitRate:
          this.metrics.cacheOperations.reads.hits + this.metrics.cacheOperations.reads.misses > 0
            ? (
                (this.metrics.cacheOperations.reads.hits /
                  (this.metrics.cacheOperations.reads.hits +
                    this.metrics.cacheOperations.reads.misses)) *
                100
              ).toFixed(2)
            : 0,
        reads: this.metrics.cacheOperations.reads,
        writes: this.metrics.cacheOperations.writes,
      },
      memory: {
        current: {
          rss: (this.metrics.memory.currentMemory?.rss / 1024 / 1024).toFixed(2),
          heapUsed: (this.metrics.memory.currentMemory?.heapUsed / 1024 / 1024).toFixed(2),
        },
        peak: {
          rss: (this.metrics.memory.peakMemory.rss / 1024 / 1024).toFixed(2),
          heapUsed: (this.metrics.memory.peakMemory.heapUsed / 1024 / 1024).toFixed(2),
        },
        growth: {
          rss: (memoryGrowth.rss / 1024 / 1024).toFixed(2),
          heapUsed: (memoryGrowth.heapUsed / 1024 / 1024).toFixed(2),
        },
      },
    };
  }

  /**
   * Get detailed report
   * @returns {Object} Detailed performance report
   */
  getDetailedReport() {
    return {
      summary: this.getSummary(),
      recentOperations: {
        jsonParsing: this.metrics.jsonParsing.operations.slice(-10),
        commandExecution: this.metrics.commandExecution.operations.slice(-10),
      },
      memoryTimeline: this.metrics.memory.snapshots.slice(-20),
    };
  }
}

// Global performance tracker instance
let globalTracker = null;

/**
 * Get the global performance tracker instance
 * @returns {PerformanceTracker} Performance tracker instance
 */
export function getPerformanceTracker() {
  if (!globalTracker) {
    globalTracker = new PerformanceTracker();
  }
  return globalTracker;
}

/**
 * Reset the global performance tracker
 */
export function resetPerformanceTracker() {
  if (globalTracker) {
    globalTracker = new PerformanceTracker();
  }
}

export { PerformanceTracker };
