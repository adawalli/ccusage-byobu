#!/usr/bin/env node

/**
 * Test script to verify process termination behavior with cache disabled
 * This simulates how ccusage-byobu would be called from byobu status scripts
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test function to run ccusage-byobu with different cache settings
async function testProcessTermination() {
  console.log('Testing process termination behavior...\n');

  // Test 1: Run with default behavior (cache disabled, should terminate quickly)
  console.log('Test 1: Running with default settings (cache disabled)');
  const defaultBehaviorResult = await runWithTimeout({
    env: {},
    timeout: 5000, // 5 second timeout
    testName: 'default (cache disabled)',
  });

  // Test 2: Run with cache enabled (for comparison)
  console.log('\nTest 2: Running with CCUSAGE_ENABLE_CACHE=1');
  const cacheEnabledResult = await runWithTimeout({
    env: { CCUSAGE_ENABLE_CACHE: '1' },
    timeout: 5000, // 5 second timeout
    testName: 'cache enabled',
  });

  // Test 3: Run multiple times in succession with default settings
  console.log('\nTest 3: Running multiple times with default settings (succession test)');
  const promises = [];
  for (let i = 0; i < 3; i++) {
    promises.push(
      runWithTimeout({
        env: {},
        timeout: 5000,
        testName: `succession ${i + 1}`,
      })
    );
  }
  const successionResults = await Promise.all(promises);

  // Summary
  console.log('\n=== Test Results Summary ===');
  console.log(
    `Default behavior test: ${defaultBehaviorResult.success ? '✅ PASSED' : '❌ FAILED'} (${defaultBehaviorResult.duration}ms)`
  );
  console.log(
    `Cache enabled test: ${cacheEnabledResult.success ? '✅ PASSED' : '❌ FAILED'} (${cacheEnabledResult.duration}ms)`
  );

  const successionSuccess = successionResults.every((r) => r.success);
  const avgSuccessionTime =
    successionResults.reduce((sum, r) => sum + r.duration, 0) / successionResults.length;
  console.log(
    `Succession tests: ${successionSuccess ? '✅ PASSED' : '❌ FAILED'} (avg ${avgSuccessionTime.toFixed(0)}ms)`
  );

  // Verify no hanging processes
  console.log('\n=== Process Check ===');
  try {
    const { execSync } = await import('child_process');
    const processes = execSync('ps aux | grep "ccusage-byobu" | grep -v grep', {
      encoding: 'utf8',
    }).trim();
    if (processes) {
      console.log('⚠️  Found hanging ccusage-byobu processes:');
      console.log(processes);
    } else {
      console.log('✅ No hanging ccusage-byobu processes found');
    }
  } catch {
    console.log('✅ No hanging ccusage-byobu processes found (ps returned no results)');
  }

  return {
    defaultBehavior: defaultBehaviorResult,
    cacheEnabled: cacheEnabledResult,
    succession: successionResults,
    overallSuccess: defaultBehaviorResult.success && successionSuccess,
  };
}

// Helper function to run ccusage-byobu with timeout
function runWithTimeout({ env, timeout, testName }) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const binPath = join(__dirname, 'bin', 'ccusage-byobu');

    console.log(`  Starting ${testName} test...`);

    const child = spawn('node', [binPath], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let finished = false;

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('exit', (code, signal) => {
      if (!finished) {
        finished = true;
        const duration = Date.now() - startTime;
        const success = code === 0 && !signal;

        console.log(
          `  ${testName}: ${success ? '✅' : '❌'} terminated in ${duration}ms (code: ${code}, signal: ${signal})`
        );
        if (stdout)
          console.log(`    stdout: ${stdout.slice(0, 100)}${stdout.length > 100 ? '...' : ''}`);
        if (stderr && env.CCUSAGE_BYOBU_DEBUG)
          console.log(`    stderr: ${stderr.slice(0, 200)}${stderr.length > 200 ? '...' : ''}`);

        resolve({ success, duration, code, signal, stdout, stderr });
      }
    });

    child.on('error', (error) => {
      if (!finished) {
        finished = true;
        const duration = Date.now() - startTime;
        console.log(`  ${testName}: ❌ error after ${duration}ms - ${error.message}`);
        resolve({ success: false, duration, error: error.message, stdout, stderr });
      }
    });

    // Set timeout
    setTimeout(() => {
      if (!finished) {
        finished = true;
        const duration = Date.now() - startTime;
        console.log(`  ${testName}: ⏰ TIMEOUT after ${duration}ms - killing process`);

        child.kill('SIGTERM');

        // Force kill after 1 second if it doesn't respond to SIGTERM
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 1000);

        resolve({ success: false, duration, timeout: true, stdout, stderr });
      }
    }, timeout);
  });
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testProcessTermination()
    .then((results) => {
      console.log('\n=== Final Results ===');
      if (results.overallSuccess) {
        console.log('🎉 All tests passed! Process termination is working correctly.');
        process.exit(0);
      } else {
        console.log('❌ Some tests failed. Process termination issue may still exist.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Test suite error:', error);
      process.exit(1);
    });
}
