#!/usr/bin/env node
/**
 * Benchmark mode for ccusage-byobu
 * Runs standardized performance tests for measuring optimizations
 */

import { createTimer, getMemoryUsage } from '../lib/performance.js';
import { getPerformanceTracker, resetPerformanceTracker } from '../lib/performance-tracker.js';
import { clearCache, destroyCache } from '../lib/cache.js';
import { main } from '../lib/index.js';

/**
 * Run a benchmark suite
 * @param {string} name - Suite name
 * @param {number} iterations - Number of iterations
 * @param {Function} setup - Setup function (optional)
 * @param {Function} teardown - Teardown function (optional)
 */
async function runBenchmarkSuite(name, iterations, setup, teardown) {
  console.log(`\n🏃 Running benchmark suite: ${name}`);
  console.log(`   Iterations: ${iterations}`);

  const results = {
    name,
    iterations,
    runs: [],
    stats: {
      avgDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      stdDev: 0,
    },
  };

  // Initial warmup
  console.log('   Warming up...');
  if (setup) await setup();
  await main();
  if (teardown) await teardown();

  // Run iterations
  console.log('   Running iterations...');
  const progressInterval = Math.max(1, Math.floor(iterations / 10));

  for (let i = 0; i < iterations; i++) {
    if (i % progressInterval === 0) {
      process.stdout.write(`   Progress: ${Math.round((i / iterations) * 100)}%\r`);
    }

    if (setup) await setup();

    const timer = createTimer().start();
    const memBefore = getMemoryUsage();

    await main();

    timer.stop();
    const memAfter = getMemoryUsage();

    const run = {
      iteration: i + 1,
      duration: timer.getDuration().milliseconds,
      memoryDelta: {
        rss: (memAfter.rss.bytes - memBefore.rss.bytes) / 1024 / 1024,
        heap: (memAfter.heapUsed.bytes - memBefore.heapUsed.bytes) / 1024 / 1024,
      },
    };

    results.runs.push(run);

    if (teardown) await teardown();
  }

  console.log('   Progress: 100%    ');

  // Calculate statistics
  const durations = results.runs.map((r) => r.duration);
  results.stats.avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  results.stats.minDuration = Math.min(...durations);
  results.stats.maxDuration = Math.max(...durations);

  // Standard deviation
  const variance =
    durations.reduce((sum, val) => {
      const diff = val - results.stats.avgDuration;
      return sum + diff * diff;
    }, 0) / durations.length;
  results.stats.stdDev = Math.sqrt(variance);

  return results;
}

/**
 * Display benchmark results
 * @param {Object} results - Benchmark results
 */
function displayResults(results) {
  console.log(`\n📊 Results for: ${results.name}`);
  console.log(`   Iterations: ${results.iterations}`);
  console.log(`   Average: ${results.stats.avgDuration.toFixed(2)}ms`);
  console.log(`   Min: ${results.stats.minDuration.toFixed(2)}ms`);
  console.log(`   Max: ${results.stats.maxDuration.toFixed(2)}ms`);
  console.log(`   Std Dev: ${results.stats.stdDev.toFixed(2)}ms`);

  // Show percentiles
  const sorted = results.runs.map((r) => r.duration).sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];

  console.log(`   P50: ${p50.toFixed(2)}ms`);
  console.log(`   P95: ${p95.toFixed(2)}ms`);
  console.log(`   P99: ${p99.toFixed(2)}ms`);

  // Memory stats
  const memDeltas = results.runs.map((r) => r.memoryDelta.rss);
  const avgMemDelta = memDeltas.reduce((a, b) => a + b, 0) / memDeltas.length;
  console.log(`   Avg Memory Delta: ${avgMemDelta.toFixed(2)}MB RSS`);
}

/**
 * Compare two benchmark results
 * @param {Object} baseline - Baseline results
 * @param {Object} current - Current results
 */
function compareResults(baseline, current) {
  console.log(`\n📈 Comparison: ${baseline.name} vs ${current.name}`);

  const improvement =
    ((baseline.stats.avgDuration - current.stats.avgDuration) / baseline.stats.avgDuration) * 100;
  const faster = improvement > 0;

  console.log(
    `   Performance: ${faster ? '🟢' : '🔴'} ${Math.abs(improvement).toFixed(2)}% ${faster ? 'faster' : 'slower'}`
  );
  console.log(`   Baseline avg: ${baseline.stats.avgDuration.toFixed(2)}ms`);
  console.log(`   Current avg: ${current.stats.avgDuration.toFixed(2)}ms`);
  console.log(
    `   Difference: ${(current.stats.avgDuration - baseline.stats.avgDuration).toFixed(2)}ms`
  );
}

/**
 * Main benchmark runner
 */
async function runBenchmarks() {
  console.log('🚀 ccusage-byobu Benchmark Tool');
  console.log('================================\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const iterations = parseInt(
    args.find((a) => a.startsWith('--iterations='))?.split('=')[1] || '10'
  );
  const suites = args.filter((a) => !a.startsWith('--'));

  if (args.includes('--help')) {
    console.log('Usage: ccusage-byobu-benchmark [suites...] [options]');
    console.log('\nSuites:');
    console.log('  cold     - Cold start performance (no cache)');
    console.log('  warm     - Warm cache performance');
    console.log('  startup  - Startup time measurement');
    console.log('  all      - Run all benchmark suites');
    console.log('\nOptions:');
    console.log('  --iterations=N   Number of iterations per suite (default: 10)');
    console.log('  --compare        Compare cold vs warm performance');
    console.log('\nExamples:');
    console.log('  ccusage-byobu-benchmark cold warm --iterations=50');
    console.log('  ccusage-byobu-benchmark all --compare');
    process.exit(0);
  }

  const runAll = suites.length === 0 || suites.includes('all');
  const runCold = runAll || suites.includes('cold');
  const runWarm = runAll || suites.includes('warm');
  const runStartup = runAll || suites.includes('startup');
  const compare = args.includes('--compare');

  const results = {};

  // Cold start benchmark
  if (runCold) {
    results.cold = await runBenchmarkSuite(
      'Cold Start (no cache)',
      iterations,
      async () => {
        clearCache();
        resetPerformanceTracker();
      },
      null
    );
    displayResults(results.cold);
  }

  // Warm cache benchmark
  if (runWarm) {
    // Pre-warm the cache
    console.log('\n🔥 Pre-warming cache...');
    await main(); // Run once to populate cache

    results.warm = await runBenchmarkSuite(
      'Warm Cache',
      iterations,
      null, // No setup needed, cache stays warm
      null
    );
    displayResults(results.warm);
  }

  // Startup time benchmark
  if (runStartup) {
    results.startup = await runBenchmarkSuite(
      'Startup Time',
      iterations,
      async () => {
        // Clear cache for fresh startup measurement
        destroyCache();
        resetPerformanceTracker();
      },
      null
    );
    displayResults(results.startup);
  }

  // Compare results if requested
  if (compare && results.cold && results.warm) {
    compareResults(results.cold, results.warm);
  }

  // Final summary
  console.log('\n✅ Benchmark complete!');

  // Get performance tracker summary
  const perfTracker = getPerformanceTracker();
  const summary = perfTracker.getSummary();

  console.log('\n📊 Overall Performance Summary:');
  console.log(`   Total operations: ${summary.jsonParsing.count + summary.commandExecution.count}`);
  console.log(
    `   JSON parsing: ${summary.jsonParsing.count} ops, avg ${summary.jsonParsing.avgTime}ms`
  );
  console.log(
    `   Command execution: ${summary.commandExecution.count} ops, avg ${summary.commandExecution.avgTime}ms`
  );
  console.log(`   Cache hit rate: ${summary.cacheOperations.hitRate}%`);
  console.log(`   Peak memory: RSS ${summary.memory.peak.rss}MB`);

  // Cleanup
  destroyCache();
}

// Run benchmarks
runBenchmarks().catch(console.error);
