import { execSync } from 'child_process';
import { getConfig, getPassThroughEnv } from './config.js';

export async function main() {
  try {
    // Get configuration
    const config = getConfig();
    const passThroughEnv = getPassThroughEnv();

    // Check if ccusage command is available
    try {
      execSync('which ccusage', { stdio: 'ignore' });
    } catch {
      throw new Error('ccusage command not found in PATH. Please install ccusage first.');
    }

    // Execute ccusage command as in tmux reference
    let jsonOutput;
    try {
      jsonOutput = execSync('ccusage blocks --json --offline', {
        encoding: 'utf-8',
        env: { ...process.env, ...passThroughEnv },
      });
    } catch (error) {
      throw new Error(`Failed to execute ccusage command: ${error.message}`);
    }

    // Parse JSON output
    const data = JSON.parse(jsonOutput);
    let activeSession = null;

    // Find active session
    for (const block of data.blocks) {
      if (block.isActive) {
        activeSession = block;
        break;
      }
    }

    if (!activeSession) {
      // Output empty string for byobu (no session)
      process.stdout.write('');
      return;
    }

    // Extract values from active session
    const remainingMinutes = activeSession.projection?.remainingMinutes || 0;
    const currentCost = activeSession.costUSD || 0;

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
