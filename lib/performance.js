/**
 * Performance measurement utilities for ccusage-byobu
 * Used to benchmark startup time and optimization effectiveness
 */

/**
 * Simple performance timer
 */
class PerformanceTimer {
  constructor() {
    this.startTime = null;
    this.endTime = null;
  }

  start() {
    this.startTime = process.hrtime.bigint();
    return this;
  }

  stop() {
    this.endTime = process.hrtime.bigint();
    return this;
  }

  getDuration() {
    if (!this.startTime || !this.endTime) {
      throw new Error('Timer not properly started/stopped');
    }

    const durationNs = this.endTime - this.startTime;
    const durationMs = Number(durationNs) / 1000000; // Convert to milliseconds

    return {
      nanoseconds: Number(durationNs),
      milliseconds: durationMs,
      seconds: durationMs / 1000,
    };
  }

  format() {
    const duration = this.getDuration();

    if (duration.milliseconds < 1) {
      return `${duration.nanoseconds}ns`;
    } else if (duration.milliseconds < 1000) {
      return `${duration.milliseconds.toFixed(2)}ms`;
    } else {
      return `${duration.seconds.toFixed(3)}s`;
    }
  }
}

/**
 * Create a new performance timer
 * @returns {PerformanceTimer} New timer instance
 */
export function createTimer() {
  return new PerformanceTimer();
}

/**
 * Measure memory usage
 * @returns {Object} Memory usage information
 */
export function getMemoryUsage() {
  const usage = process.memoryUsage();

  return {
    rss: {
      bytes: usage.rss,
      mb: (usage.rss / 1024 / 1024).toFixed(2),
    },
    heapTotal: {
      bytes: usage.heapTotal,
      mb: (usage.heapTotal / 1024 / 1024).toFixed(2),
    },
    heapUsed: {
      bytes: usage.heapUsed,
      mb: (usage.heapUsed / 1024 / 1024).toFixed(2),
    },
    external: {
      bytes: usage.external,
      mb: (usage.external / 1024 / 1024).toFixed(2),
    },
  };
}

/**
 * Benchmark a function execution
 * @param {Function} fn - Function to benchmark
 * @param {string} name - Name for the benchmark
 * @returns {Promise<Object>} Benchmark results
 */
export async function benchmark(fn, name = 'operation') {
  const timer = createTimer();
  const initialMemory = getMemoryUsage();

  timer.start();
  let result;
  let error = null;

  try {
    result = fn();
    // Check if result is a Promise by verifying it has a then method
    if (result && typeof result.then === 'function') {
      result = await result;
    }
  } catch (err) {
    error = err;
  }

  timer.stop();
  const finalMemory = getMemoryUsage();

  const memoryDelta = {
    rss: finalMemory.rss.bytes - initialMemory.rss.bytes,
    heapUsed: finalMemory.heapUsed.bytes - initialMemory.heapUsed.bytes,
  };

  return {
    name,
    duration: timer.getDuration(),
    durationFormatted: timer.format(),
    memory: {
      initial: initialMemory,
      final: finalMemory,
      delta: {
        rss: {
          bytes: memoryDelta.rss,
          mb: (memoryDelta.rss / 1024 / 1024).toFixed(2),
        },
        heapUsed: {
          bytes: memoryDelta.heapUsed,
          mb: (memoryDelta.heapUsed / 1024 / 1024).toFixed(2),
        },
      },
    },
    result,
    error,
    success: error === null,
  };
}

/**
 * Log benchmark results in a readable format
 * @param {Object} benchmark - Benchmark results from benchmark()
 */
export function logBenchmark(benchmark) {
  const status = benchmark.success ? '✅' : '❌';
  console.log(`${status} ${benchmark.name}: ${benchmark.durationFormatted}`);

  if (process.env.CCUSAGE_BYOBU_DEBUG) {
    console.log(
      `   Memory delta: RSS ${benchmark.memory.delta.rss.mb}MB, Heap ${benchmark.memory.delta.heapUsed.mb}MB`
    );

    if (benchmark.error) {
      console.log(`   Error: ${benchmark.error.message}`);
    }
  }
}
