import { execSync } from 'child_process';
import { getConfig, getPassThroughEnv } from './config.js';

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

    // Test JSON parsing
    try {
      const data = JSON.parse(output);
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

  console.log('\n🔧 Test complete!');
}

export async function main() {
  try {
    // Get configuration
    const config = getConfig();
    const passThroughEnv = getPassThroughEnv();

    // Validate required commands
    const validation = validateRequiredCommands();
    if (!validation.success) {
      const errorMsg = validation.errors.join(' ');
      throw new Error(errorMsg);
    }

    // Execute ccusage command as in tmux reference
    let jsonOutput;
    try {
      jsonOutput = execSync('ccusage blocks --json --offline', {
        encoding: 'utf-8',
        env: { ...process.env, ...passThroughEnv },
        timeout: 30000, // 30 second timeout
      });
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

    // Parse JSON output
    let data;
    try {
      data = JSON.parse(jsonOutput);
    } catch (parseError) {
      const errorMsg = `Failed to parse ccusage JSON output: ${parseError.message}`;
      if (process.env.CCUSAGE_BYOBU_DEBUG) {
        console.error('JSON Parse Error:', errorMsg);
        console.error('Raw output:', jsonOutput);
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

    // Calculate usage percentage (used time) for color coding
    const usagePercent = Math.max(0, 100 - remainingPercent);

    // Determine color based on usage percentage
    function getColorCode(usagePercent, config) {
      if (config.colors === false || config.colors === 'false') {
        return '';
      }

      // Use configurable threshold for color transitions
      const threshold = config.threshold;
      const warningThreshold = Math.max(threshold - 25, 0);

      if (usagePercent >= threshold) {
        return '#[fg=red]';
      } else if (usagePercent >= warningThreshold) {
        return '#[fg=yellow]';
      } else {
        return '#[fg=green]';
      }
    }

    const colorCode = getColorCode(usagePercent, config);
    const resetColor = colorCode ? '#[default]' : '';

    // Format remaining time
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    const timeStr = hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}m` : `${minutes}m`;

    // Format output based on configuration
    let output;

    if (config.format === 'full') {
      // Full format: includes progress bar and detailed info
      const filled = Math.round(remainingPercent / 10);
      const empty = 10 - filled;
      const progressBar = '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
      output = `${colorCode}${progressBar} ${timeStr} $${currentCost.toFixed(2)}${resetColor}`;
    } else {
      // Compact format: minimal info
      output = `${colorCode}${timeStr} $${currentCost.toFixed(2)}${resetColor}`;
    }

    process.stdout.write(output);
  } catch (error) {
    // Log error for debugging but still provide graceful fallback
    if (process.env.CCUSAGE_BYOBU_DEBUG) {
      console.error('ccusage-byobu error:', error.message);
    }
    // Graceful fallback - output empty string
    process.stdout.write('');
  }
}
