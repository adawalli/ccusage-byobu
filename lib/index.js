import { execSync } from 'child_process';

export async function main() {
  try {
    // Execute ccusage command as in tmux reference
    const jsonOutput = execSync('ccusage blocks --json --offline', {
      encoding: 'utf-8',
    });

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

    // Format remaining time
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    const timeStr = hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}m` : `${minutes}m`;

    // Create progress bar (adapted for byobu - simpler format)
    const filled = Math.round(remainingPercent / 10);
    const empty = 10 - filled;
    const progressBar = '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';

    // Format output for byobu (max 25 chars, no tmux color codes)
    const output = `${progressBar} ${timeStr} $${currentCost.toFixed(2)}`;

    // Truncate if necessary to fit 25 character limit
    const finalOutput = output.length > 25 ? output.substring(0, 25) : output;

    process.stdout.write(finalOutput);
  } catch {
    // Graceful fallback - output empty string
    process.stdout.write('');
  }
}
