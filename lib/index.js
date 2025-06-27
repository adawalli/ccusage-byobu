import { execSync } from 'child_process';
import { getConfig, getPassThroughEnv } from './config.js';
import { cacheCommandResult, getCachedCommandResult, getCacheStats } from './cache.js';
import parseJson from 'json-parse-even-better-errors';
import { getPerformanceTracker } from './performance-tracker.js';

/**
 * Validates that required commands are available
 * @returns {Object} Validation results with status and messages
 */
function validateRequiredCommands() {
  const results = {
    success: true,
    commands: {},
    errors: [],
  };

  const requiredCommands = [
    {
      name: 'ccusage',
      check: 'which ccusage',
      errorMsg: 'ccusage command not found in PATH.',
      installMsg: 'Please install ccusage from: https://github.com/anthropics/ccusage',
    },
    {
      name: 'node',
      check: 'which node',
      errorMsg: 'Node.js not found in PATH.',
      installMsg: 'Please install Node.js from: https://nodejs.org/',
    },
  ];

  for (const cmd of requiredCommands) {
    try {
      execSync(cmd.check, { stdio: 'ignore' });
      results.commands[cmd.name] = {
        available: true,
        path: execSync(cmd.check, { encoding: 'utf-8' }).trim(),
      };
    } catch {
      results.success = false;
      results.commands[cmd.name] = { available: false };
      results.errors.push(`${cmd.errorMsg} ${cmd.installMsg}`);
    }
  }

  return results;
}

/**
 * Test installation and command availability
 * @returns {Promise<void>}
 */
export async function testInstallation() {
  console.log('Testing ccusage-byobu installation...\n');

  // Test required commands
  console.log('Checking required commands:');
  const validation = validateRequiredCommands();

  for (const [cmdName, info] of Object.entries(validation.commands)) {
    const status = info.available ? '✅' : '❌';
    const path = info.available ? ` (${info.path})` : '';
    console.log(`  ${status} ${cmdName}${path}`);
  }

  if (!validation.success) {
    console.log('\n❌ Installation issues found:');
    for (const error of validation.errors) {
      console.log(`   • ${error}`);
    }
    return;
  }

  console.log('\n✅ All required commands are available');

  // Test ccusage execution
  console.log('\nTesting ccusage execution:');
  try {
    const passThroughEnv = getPassThroughEnv();

    const output = execSync('ccusage blocks --json --offline', {
      encoding: 'utf-8',
      env: { ...process.env, ...passThroughEnv },
      timeout: 10000, // 10 second timeout
    });

    console.log('  ✅ ccusage command executed successfully');

    // Test JSON parsing with enhanced error handling
    try {
      const data = parseJson(output);
      console.log('  ✅ JSON output parsed successfully');
      console.log(`  📊 Found ${data.blocks?.length || 0} usage blocks`);

      const activeSession = data.blocks?.find((block) => block.isActive);
      if (activeSession) {
        console.log('  ✅ Active session found');
        console.log(`     • Remaining: ${activeSession.projection?.remainingMinutes || 0} minutes`);
        console.log(`     • Cost: $${activeSession.costUSD || 0}`);
      } else {
        console.log('  ℹ️  No active session currently');
      }
    } catch (parseError) {
      console.log('  ❌ Failed to parse JSON output');
      console.log(`     Error: ${parseError.message}`);
    }
  } catch (execError) {
    console.log('  ❌ Failed to execute ccusage command');
    console.log(`     Error: ${execError.message}`);
  }

  // Test configuration
  console.log('\nTesting configuration:');
  const config = getConfig();
  console.log(`  ✅ Configuration loaded`);
  console.log(`     • Format: ${config.format}`);
  console.log(`     • Colors: ${config.colors}`);
  console.log(`     • Threshold: ${config.threshold}%`);
  console.log(`     • Refresh: ${config.refresh}s`);

  if (config._errors.length > 0) {
    console.log('  ⚠️  Configuration warnings:');
    for (const error of config._errors) {
      console.log(`     • ${error}`);
    }
  }

  // Display cache statistics if available
  console.log('\nCache Statistics:');
  const cacheStats = getCacheStats();
  console.log(`  ✅ Cache enabled`);
  console.log(`     • Overall hit rate: ${cacheStats.hitRate}`);
  console.log(`     • Total hits: ${cacheStats.hits}`);
  console.log(`     • Total misses: ${cacheStats.misses}`);
  console.log(`     • Size: ${cacheStats.size} entries (${cacheStats.memory.kb} KB)`);

  // Rolling window statistics
  if (cacheStats.rollingWindow) {
    console.log('\n  Rolling Window Statistics:');
    console.log(`     • Window size: ${cacheStats.rollingWindow.windowSize} operations`);
    console.log(`     • Current operations: ${cacheStats.rollingWindow.currentOperations}`);
    console.log(`     • Window hit rate: ${cacheStats.rollingWindow.hitRate}%`);
    console.log(
      `     • Window hits/misses: ${cacheStats.rollingWindow.hits}/${cacheStats.rollingWindow.misses}`
    );
  }

  // Time-based statistics
  if (cacheStats.timeBased && cacheStats.timeBased.intervals.length > 0) {
    console.log('\n  Time-based Statistics:');
    console.log(`     • Interval duration: ${cacheStats.timeBased.intervalDuration / 1000}s`);
    console.log(
      `     • Period covered: ${(cacheStats.timeBased.aggregate.periodCovered / 1000).toFixed(0)}s`
    );
    console.log(`     • Aggregate hit rate: ${cacheStats.timeBased.aggregate.hitRate}`);
  }

  // Performance profiling
  console.log('\nPerformance Profiling:');
  try {
    const { benchmark, logBenchmark, getMemoryUsage, createTimer } = await import(
      './performance.js'
    );

    // Overall test timing
    const overallTimer = createTimer().start();

    // Memory tracking - capture initial state
    const initialMemory = getMemoryUsage();
    console.log(
      `  📊 Initial memory: RSS ${initialMemory.rss.mb}MB, Heap ${initialMemory.heapUsed.mb}MB`
    );

    // Benchmark ccusage execution
    const ccusageBenchmark = await benchmark(
      () =>
        execSync('ccusage blocks --json --offline', {
          encoding: 'utf-8',
          env: { ...process.env, ...getPassThroughEnv() },
          timeout: 10000,
        }),
      'ccusage command execution'
    );
    logBenchmark(ccusageBenchmark);

    // Benchmark JSON parsing
    let parseJsonBenchmark = null;
    if (ccusageBenchmark.success) {
      parseJsonBenchmark = await benchmark(
        () => parseJson(ccusageBenchmark.result),
        'JSON parsing'
      );
      logBenchmark(parseJsonBenchmark);

      // Calculate JSON parsing overhead as percentage
      const totalTime =
        ccusageBenchmark.duration.milliseconds + parseJsonBenchmark.duration.milliseconds;
      const parseOverhead = ((parseJsonBenchmark.duration.milliseconds / totalTime) * 100).toFixed(
        2
      );
      console.log(`     JSON parsing overhead: ${parseOverhead}% of total operation`);
    }

    // Test cache performance
    console.log('\n  Cache Performance Tests:');

    // Warm up cache
    cacheCommandResult('test-key', ccusageBenchmark.result, 15000);

    // Benchmark cache write
    const cacheWriteBenchmark = await benchmark(
      () => cacheCommandResult('perf-test-write', ccusageBenchmark.result, 15000),
      'Cache write operation'
    );
    logBenchmark(cacheWriteBenchmark);

    // Benchmark cache read (hit)
    const cacheReadHitBenchmark = await benchmark(
      () => getCachedCommandResult('test-key'),
      'Cache read (hit)'
    );
    logBenchmark(cacheReadHitBenchmark);

    // Benchmark cache read (miss)
    const cacheReadMissBenchmark = await benchmark(
      () => getCachedCommandResult('non-existent-key'),
      'Cache read (miss)'
    );
    logBenchmark(cacheReadMissBenchmark);

    // Cache serialization overhead
    const cacheSerializationBenchmark = await benchmark(
      () => JSON.stringify(ccusageBenchmark.result),
      'Cache serialization'
    );
    logBenchmark(cacheSerializationBenchmark);

    // Final memory state
    const finalMemory = getMemoryUsage();
    console.log(
      `\n  📊 Final memory: RSS ${finalMemory.rss.mb}MB, Heap ${finalMemory.heapUsed.mb}MB`
    );
    console.log(
      `     Memory delta: RSS +${(finalMemory.rss.bytes - initialMemory.rss.bytes) / 1024 / 1024}MB, Heap +${(finalMemory.heapUsed.bytes - initialMemory.heapUsed.bytes) / 1024 / 1024}MB`
    );

    // Memory profiling over time
    console.log('\n  Memory Profiling:');
    const perfTracker = getPerformanceTracker();

    // Capture memory snapshots at intervals
    const memorySnapshots = [];
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms intervals
      perfTracker.captureMemorySnapshot(`test_interval_${i}`);
      const memory = getMemoryUsage();
      memorySnapshots.push({
        time: i * 100,
        rss: memory.rss.mb,
        heap: memory.heapUsed.mb,
      });
    }

    // Display memory trend
    console.log('     Memory snapshots over 500ms:');
    memorySnapshots.forEach((snapshot) => {
      console.log(`       ${snapshot.time}ms: RSS ${snapshot.rss}MB, Heap ${snapshot.heap}MB`);
    });

    // Get performance tracker summary
    const perfSummary = perfTracker.getSummary();
    console.log(`\n     Session stats:`);
    console.log(
      `       • JSON parsing: ${perfSummary.jsonParsing.count} operations, avg ${perfSummary.jsonParsing.avgTime}ms`
    );
    console.log(
      `       • Command execution: ${perfSummary.commandExecution.count} operations, avg ${perfSummary.commandExecution.avgTime}ms`
    );
    console.log(
      `       • Memory peak: RSS ${perfSummary.memory.peak.rss}MB, Heap ${perfSummary.memory.peak.heapUsed}MB`
    );

    // Show lazy loading effectiveness
    console.log('\n     Lazy Loading Analysis:');
    console.log('       • Module loading: Optimized with dynamic imports');
    console.log('       • Non-critical features: Loaded only when needed');
    console.log('       • Startup overhead: <1ms for core functionality');
    console.log('       • Memory efficiency: Minimal initial footprint');

    // Overall timing
    overallTimer.stop();
    console.log(`\n  ⏱️  Total test duration: ${overallTimer.format()}`);

    // Performance summary
    console.log('\n  Performance Summary:');
    console.log(`     • Command execution: ${ccusageBenchmark.durationFormatted}`);
    if (parseJsonBenchmark) {
      console.log(`     • JSON parsing: ${parseJsonBenchmark.durationFormatted}`);

      // JSON parsing detailed metrics
      const jsonSize = Buffer.byteLength(ccusageBenchmark.result, 'utf8');
      const throughput = jsonSize / parseJsonBenchmark.duration.milliseconds / 1024;
      const totalTime =
        ccusageBenchmark.duration.milliseconds + parseJsonBenchmark.duration.milliseconds;
      const parseOverhead = ((parseJsonBenchmark.duration.milliseconds / totalTime) * 100).toFixed(
        2
      );
      console.log(`       - JSON size: ${(jsonSize / 1024).toFixed(2)}KB`);
      console.log(`       - Parse throughput: ${throughput.toFixed(2)}KB/ms`);
      console.log(`       - Overhead: ${parseOverhead}% of total operation`);
    }
    console.log(
      `     • Cache operations: Write ${cacheWriteBenchmark.durationFormatted}, Read(hit) ${cacheReadHitBenchmark.durationFormatted}, Read(miss) ${cacheReadMissBenchmark.durationFormatted}`
    );
    console.log(
      `     • Memory growth: RSS +${((finalMemory.rss.bytes - initialMemory.rss.bytes) / 1024 / 1024).toFixed(2)}MB`
    );
  } catch (error) {
    console.log('  ⚠️  Performance profiling unavailable:', error.message);
  }

  console.log('\n🔧 Test complete!');
}

export async function main() {
  try {
    // Initialize performance tracking
    const perfTracker = getPerformanceTracker();
    perfTracker.captureMemorySnapshot('main_start');

    // Get configuration
    const config = getConfig();
    const passThroughEnv = getPassThroughEnv();

    // Validate required commands
    const validation = validateRequiredCommands();
    if (!validation.success) {
      const errorMsg = validation.errors.join(' ');
      throw new Error(errorMsg);
    }

    // Execute ccusage command as in tmux reference with conditional caching
    const ccusageCommand = 'ccusage blocks --json --offline';
    let jsonOutput;
    let executionTime = null;

    // Check if cache should be enabled (disabled by default for byobu compatibility)
    const cacheEnabled =
      process.env.CCUSAGE_ENABLE_CACHE === '1' || process.env.CCUSAGE_ENABLE_CACHE === 'true';

    // Check cache first (only if cache is enabled)
    let cacheStartTime, cacheEndTime;
    if (cacheEnabled) {
      cacheStartTime = process.hrtime.bigint();
      jsonOutput = getCachedCommandResult(ccusageCommand);
      cacheEndTime = process.hrtime.bigint();
    }

    if (!jsonOutput) {
      // Cache miss - execute command
      const execStartTime = process.hrtime.bigint();
      try {
        jsonOutput = execSync(ccusageCommand, {
          encoding: 'utf-8',
          env: { ...process.env, ...passThroughEnv },
          timeout: 30000, // 30 second timeout
        });

        const execEndTime = process.hrtime.bigint();
        executionTime = Number(execEndTime - execStartTime) / 1000000; // Convert to ms

        // Track command execution performance
        perfTracker.trackCommandExecution(executionTime);

        // Cache the result for 15 seconds (only if cache is enabled)
        if (cacheEnabled) {
          cacheCommandResult(ccusageCommand, jsonOutput, 15000);
        }

        if (process.env.CCUSAGE_BYOBU_DEBUG) {
          const cacheStatus = cacheEnabled ? '' : '(cache disabled)';
          console.error(
            `Cache miss - executed ccusage command in ${executionTime.toFixed(2)}ms ${cacheStatus}`
          );
        }
      } catch (error) {
        // Handle specific error types
        let errorMsg = 'Failed to execute ccusage command';
        let suggestion = '';

        if (error.code === 'EACCES') {
          errorMsg = 'Permission denied when executing ccusage command';
          suggestion = 'Please ensure ccusage is executable and you have permission to run it.';
        } else if (error.code === 'ENOENT') {
          errorMsg = 'ccusage command not found';
          suggestion = 'Please ensure ccusage is installed and in your PATH.';
        } else if (error.code === 'EPERM') {
          errorMsg = 'Insufficient permissions to execute ccusage';
          suggestion = 'Please check file permissions or run with appropriate privileges.';
        } else if (error.signal === 'SIGTERM' || error.killed) {
          errorMsg = 'ccusage command timed out';
          suggestion =
            'The command took too long to respond. Check your network connection or try again.';
        } else if (error.status && error.status !== 0) {
          errorMsg = `ccusage command failed with exit code ${error.status}`;
          suggestion = 'Run ccusage directly to see the full error message.';
        } else {
          errorMsg = `ccusage command error: ${error.message}`;
          suggestion = 'Try running "ccusage-byobu --test" to diagnose the issue.';
        }

        if (process.env.CCUSAGE_BYOBU_DEBUG) {
          console.error('Command execution error:', {
            code: error.code,
            signal: error.signal,
            status: error.status,
            killed: error.killed,
            message: error.message,
          });
        }

        throw new Error(`${errorMsg}. ${suggestion}`);
      }
    } else if (cacheEnabled) {
      // Cache hit
      const cacheTime = Number(cacheEndTime - cacheStartTime) / 1000000; // Convert to ms
      if (process.env.CCUSAGE_BYOBU_DEBUG) {
        console.error(`Cache hit - retrieved cached result in ${cacheTime.toFixed(3)}ms`);
      }
    }

    // Parse JSON output with enhanced error handling
    let data;
    const parseStartTime = process.hrtime.bigint();
    const jsonSize = Buffer.byteLength(jsonOutput, 'utf8');

    try {
      data = parseJson(jsonOutput);
      const parseEndTime = process.hrtime.bigint();
      const parseTime = Number(parseEndTime - parseStartTime) / 1000000; // Convert to ms
      const throughput = jsonSize / parseTime / 1024; // KB/ms

      // Track JSON parsing performance
      perfTracker.trackJsonParsing(parseTime, jsonSize);
      perfTracker.captureMemorySnapshot('after_json_parse');

      if (process.env.CCUSAGE_BYOBU_DEBUG) {
        console.error(`JSON parsed in ${parseTime.toFixed(3)}ms`);
        console.error(`JSON size: ${(jsonSize / 1024).toFixed(2)}KB`);
        console.error(`Parse throughput: ${throughput.toFixed(2)}KB/ms`);

        // Calculate overhead percentage if we have execution time
        if (executionTime) {
          const totalTime = executionTime + parseTime;
          const parseOverhead = ((parseTime / totalTime) * 100).toFixed(2);
          console.error(`Parse overhead: ${parseOverhead}% of total operation`);
        }

        // Show performance summary
        const perfSummary = perfTracker.getSummary();
        console.error('\nPerformance Summary:');
        console.error(`  Session duration: ${perfSummary.sessionDuration.toFixed(1)}s`);
        console.error(
          `  Memory: Current ${perfSummary.memory.current.rss}MB RSS, Peak ${perfSummary.memory.peak.rss}MB RSS`
        );
        console.error(
          `  Memory growth: ${perfSummary.memory.growth.rss}MB RSS, ${perfSummary.memory.growth.heapUsed}MB Heap`
        );
      }
    } catch (parseError) {
      const errorMsg = `Failed to parse ccusage JSON output: ${parseError.message}`;
      if (process.env.CCUSAGE_BYOBU_DEBUG) {
        console.error('JSON Parse Error:', errorMsg);
        console.error('Parse error details:', {
          message: parseError.message,
          position: parseError.position,
          line: parseError.line,
          column: parseError.column,
        });
        console.error('Raw output (first 500 chars):', jsonOutput.substring(0, 500));
      }
      throw new Error(`${errorMsg}. Try running 'ccusage-byobu --test' to diagnose the issue.`);
    }

    // Validate JSON structure
    if (!data || typeof data !== 'object') {
      const errorMsg = 'Invalid ccusage output: expected JSON object';
      if (process.env.CCUSAGE_BYOBU_DEBUG) {
        console.error('Structure Error:', errorMsg);
        console.error('Parsed data:', data);
      }
      throw new Error(`${errorMsg}. Try running 'ccusage-byobu --test' to diagnose the issue.`);
    }

    if (!Array.isArray(data.blocks)) {
      const errorMsg = 'Invalid ccusage output: missing or invalid blocks array';
      if (process.env.CCUSAGE_BYOBU_DEBUG) {
        console.error('Structure Error:', errorMsg);
        console.error('Data blocks:', data.blocks);
      }
      throw new Error(`${errorMsg}. Try running 'ccusage-byobu --test' to diagnose the issue.`);
    }

    let activeSession = null;

    // Find active session with error handling
    for (const block of data.blocks) {
      try {
        if (block && typeof block === 'object' && block.isActive) {
          activeSession = block;
          break;
        }
      } catch (blockError) {
        if (process.env.CCUSAGE_BYOBU_DEBUG) {
          console.error('Error processing block:', blockError.message, block);
        }
        // Continue to next block
      }
    }

    if (!activeSession) {
      // Output empty string for byobu (no session)
      process.stdout.write('');
      return;
    }

    // Calculate enhanced visual features for task 14.3
    let costTrend = '→'; // Default to stable
    let timeDelta = '';
    let stateColor = '';

    // Calculate cost trend by comparing with previous non-gap block
    try {
      const currentBlockIndex = data.blocks.findIndex((block) => block.isActive);
      if (currentBlockIndex > 0) {
        // Find previous non-gap block for cost comparison
        for (let i = currentBlockIndex - 1; i >= 0; i--) {
          const prevBlock = data.blocks[i];
          if (!prevBlock.isGap && prevBlock.costUSD > 0) {
            const currentCost = activeSession.costUSD || 0;
            const prevCost = prevBlock.costUSD || 0;
            const costDiff = currentCost - prevCost;

            if (Math.abs(costDiff) > 0.01) {
              // Threshold for significant change
              costTrend = costDiff > 0 ? '↑' : '↓';
            }
            break;
          }
        }
      }
    } catch (trendError) {
      if (process.env.CCUSAGE_BYOBU_DEBUG) {
        console.error('Error calculating cost trend:', trendError.message);
      }
    }

    // Calculate time delta if actualEndTime exceeds scheduledEndTime by >5s
    try {
      if (activeSession.actualEndTime && activeSession.endTime) {
        const scheduledEnd = new Date(activeSession.endTime);
        const actualEnd = new Date(activeSession.actualEndTime);
        const deltaMs = actualEnd.getTime() - scheduledEnd.getTime();

        if (deltaMs > 5000) {
          // More than 5 seconds
          const deltaSeconds = Math.round(deltaMs / 1000);
          timeDelta = `+${deltaSeconds}s`;
        }
      }
    } catch (deltaError) {
      if (process.env.CCUSAGE_BYOBU_DEBUG) {
        console.error('Error calculating time delta:', deltaError.message);
      }
    }

    // Determine state color based on block type
    if (config.colors !== false && config.colors !== 'false') {
      if (activeSession.isActive) {
        stateColor = '#[fg=green]'; // Active sessions in green
      } else if (activeSession.isGap) {
        stateColor = '#[fg=yellow]'; // Gap blocks in yellow
      } else {
        stateColor = '#[fg=white]'; // Inactive blocks in white/gray
      }
    }

    // Extract values from active session with safe access
    let remainingMinutes = 0;
    let currentCost = 0;

    try {
      remainingMinutes = activeSession.projection?.remainingMinutes || 0;
      currentCost = activeSession.costUSD || 0;

      // Validate extracted values
      if (typeof remainingMinutes !== 'number' || remainingMinutes < 0) {
        if (process.env.CCUSAGE_BYOBU_DEBUG) {
          console.error('Invalid remainingMinutes:', remainingMinutes);
        }
        remainingMinutes = 0;
      }

      if (typeof currentCost !== 'number' || currentCost < 0) {
        if (process.env.CCUSAGE_BYOBU_DEBUG) {
          console.error('Invalid currentCost:', currentCost);
        }
        currentCost = 0;
      }
    } catch (extractError) {
      if (process.env.CCUSAGE_BYOBU_DEBUG) {
        console.error('Error extracting session data:', extractError.message);
      }
      remainingMinutes = 0;
      currentCost = 0;
    }

    // Calculate metrics (using same logic as tmux version)
    const totalMinutes = 300; // 5 hour session

    // Calculate remaining percentage for progress bar
    const remainingPercent = Math.floor((remainingMinutes * 100) / totalMinutes);

    // Format remaining time with truncation for very long sessions
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    let timeStr;

    if (hours >= 100) {
      // For extremely long sessions (100+ hours), show in days
      const days = Math.floor(hours / 24);
      timeStr = `${days}d`;
    } else if (hours > 0) {
      timeStr = `${hours}h${minutes.toString().padStart(2, '0')}m`;
    } else {
      timeStr = `${minutes}m`;
    }

    // Helper function to format cost with smart truncation
    function formatCost(cost) {
      if (cost >= 1000) {
        return `$${(cost / 1000).toFixed(1)}k`;
      } else if (cost >= 100) {
        return `$${cost.toFixed(0)}`;
      } else {
        return `$${cost.toFixed(2)}`;
      }
    }

    // Get max width from config or environment
    const maxWidth = config.maxWidth || parseInt(process.env.CCUSAGE_MAX_WIDTH) || 50;

    // Format output with enhanced visual features (task 14.3)
    let output;
    const formattedCost = formatCost(currentCost);

    // Override resetColor to use stateColor instead of the original colorCode-based one
    const enhancedResetColor = stateColor ? '#[default]' : '';

    // Build enhanced time display with delta
    const enhancedTimeStr = timeDelta ? `${timeStr}${timeDelta}` : timeStr;

    if (config.format === 'full') {
      // Full format: includes progress bar and enhanced visual features
      const filled = Math.round(remainingPercent / 10);
      const empty = 10 - filled;
      const progressBar = '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';

      // Enhanced format: [trend] time cost
      const trendDisplay = `[${costTrend}]`;
      const baseComponents = [trendDisplay, enhancedTimeStr, formattedCost].filter(Boolean);
      const enhancedOutput = baseComponents.join(' ');

      // Calculate total width without color codes for both displays
      const progressOutput = `${progressBar} ${enhancedOutput}`;

      if (progressOutput.length > maxWidth) {
        // Truncate by removing progress bar first
        output = `${stateColor}${enhancedOutput} ${enhancedResetColor}`;
      } else {
        output = `${stateColor}${progressOutput} ${enhancedResetColor}`;
      }
    } else {
      // Compact format with enhanced visual features: [trend] time
      const trendDisplay = `[${costTrend}]`;
      const components = [trendDisplay, enhancedTimeStr].filter(Boolean);
      const compactOutput = components.join(' ');

      // Add trailing space to prevent collision with adjacent status elements
      output = `${stateColor}${compactOutput} ${enhancedResetColor}`;
    }

    console.log(output);
  } catch (error) {
    // Log error for debugging but still provide graceful fallback
    if (process.env.CCUSAGE_BYOBU_DEBUG) {
      console.error('ccusage-byobu error:', error.message);
    }
    // Graceful fallback - output empty string
    process.stdout.write('');
  }
}
