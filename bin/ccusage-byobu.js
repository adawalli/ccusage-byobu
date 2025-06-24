#!/usr/bin/env node

import { main as runMain } from '../lib/index.js';
import { loadConfigFile } from '../lib/config.js';

async function main() {
  const startupStartTime = process.hrtime.bigint();

  // Parse command line arguments
  const args = process.argv.slice(2);
  let configFile = null;
  let showConfig = false;
  let installMode = false;
  let uninstallMode = false;
  let uninstallAllMode = false;
  let refreshInterval = null;
  let testMode = false;

  // Parse arguments
  for (const arg of args) {
    if (arg === '--config') {
      showConfig = true;
    } else if (arg.startsWith('--config=')) {
      configFile = arg.split('=')[1];
    } else if (arg === '--install') {
      installMode = true;
    } else if (arg === '--uninstall') {
      uninstallMode = true;
    } else if (arg === '--uninstall-all') {
      uninstallAllMode = true;
    } else if (arg.startsWith('--refresh=')) {
      refreshInterval = arg.split('=')[1];
    } else if (arg === '--test') {
      testMode = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`ccusage-byobu - A CLI tool for visualizing Claude Code usage metrics

Usage:
  ccusage-byobu [options]

Options:
  --config              Show current configuration
  --config=<file>       Load configuration from file
  --install             Install byobu status script
  --uninstall           Uninstall byobu status script
  --uninstall-all       Uninstall all ccusage byobu scripts
  --refresh=<seconds>   Set custom refresh interval for byobu (default: 60)
  --test                Test installation and command availability
  --help, -h            Show this help message

Environment Variables:
  CCUSAGE_BYOBU_REFRESH Set default refresh interval for byobu script
  CCUSAGE_BYOBU_DEBUG   Enable debug output

Examples:
  ccusage-byobu                    # Show current usage in terminal
  ccusage-byobu --install          # Install byobu status script
  ccusage-byobu --install --refresh=30  # Install with 30-second refresh
  ccusage-byobu --uninstall        # Remove byobu status script
  ccusage-byobu --uninstall-all    # Remove all ccusage scripts
  ccusage-byobu --config           # Show configuration`);
      process.exit(0);
    }
  }

  // Load configuration file if specified (do this first)
  if (configFile) {
    try {
      loadConfigFile(configFile);
    } catch (error) {
      console.error(`Error loading config file "${configFile}":`, error.message);
      process.exit(1);
    }
  }

  // Handle install/uninstall modes
  if (installMode) {
    try {
      const { install } = await import('../lib/install.js');
      const options = {};
      if (refreshInterval) {
        options.refreshInterval = refreshInterval;
      }
      const success = install(options);
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('Failed to load install module:', error.message);
      process.exit(1);
    }
  }

  if (uninstallMode) {
    try {
      const { uninstall } = await import('../lib/install.js');
      const options = {};
      if (refreshInterval) {
        options.refreshInterval = refreshInterval;
      }
      const success = uninstall(options);
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('Failed to load install module:', error.message);
      process.exit(1);
    }
  }

  if (uninstallAllMode) {
    try {
      const { uninstallAll } = await import('../lib/install.js');
      const result = uninstallAll();
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error('Failed to load install module:', error.message);
      process.exit(1);
    }
  }

  // Show configuration if requested (do this after loading)
  if (showConfig) {
    try {
      const { displayConfig } = await import('../lib/config.js');
      console.log(displayConfig());
      process.exit(0);
    } catch (error) {
      console.error('Failed to load config module:', error.message);
      process.exit(1);
    }
  }

  // Handle test mode
  if (testMode) {
    try {
      const { testInstallation } = await import('../lib/index.js');
      await testInstallation();
      process.exit(0);
    } catch (error) {
      console.error('Test failed:', error.message);
      process.exit(1);
    }
  } else {
    try {
      // Log startup time if debug mode is enabled
      if (process.env.CCUSAGE_BYOBU_DEBUG) {
        const { getMemoryUsage } = await import('../lib/performance.js');

        // Calculate startup duration directly using high-resolution time
        const startupEndTime = process.hrtime.bigint();
        const startupDurationNs = startupEndTime - startupStartTime;
        const startupDurationMs = Number(startupDurationNs) / 1000000;

        // Format duration similar to PerformanceTimer.format()
        let formattedDuration;
        if (startupDurationMs < 1) {
          formattedDuration = `${Number(startupDurationNs)}ns`;
        } else if (startupDurationMs < 1000) {
          formattedDuration = `${startupDurationMs.toFixed(2)}ms`;
        } else {
          formattedDuration = `${(startupDurationMs / 1000).toFixed(3)}s`;
        }

        const memoryAfterStartup = getMemoryUsage();
        console.error(`Startup time: ${formattedDuration}`);
        console.error(
          `Startup memory: RSS ${memoryAfterStartup.rss.mb}MB, Heap ${memoryAfterStartup.heapUsed.mb}MB`
        );

        // Track lazy loading effectiveness
        // Note: In ES modules, we can't easily track module count like CommonJS
        // Instead, we measure the memory footprint which reflects loaded modules
        console.error(`Module loading optimization: Lazy loading enabled`);
      }

      await runMain();
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }
}

// Run the main function
main().catch((error) => {
  console.error('Startup failed:', error.message);
  process.exit(1);
});
