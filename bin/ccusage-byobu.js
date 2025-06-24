#!/usr/bin/env node

import { main } from '../lib/index.js';
import { displayConfig, loadConfigFile } from '../lib/config.js';
import { install, uninstall, uninstallAll } from '../lib/install.js';

// Parse command line arguments
const args = process.argv.slice(2);
let configFile = null;
let showConfig = false;
let installMode = false;
let uninstallMode = false;
let uninstallAllMode = false;
let refreshInterval = null;

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
  const options = {};
  if (refreshInterval) {
    options.refreshInterval = refreshInterval;
  }
  const success = install(options);
  process.exit(success ? 0 : 1);
}

if (uninstallMode) {
  const options = {};
  if (refreshInterval) {
    options.refreshInterval = refreshInterval;
  }
  const success = uninstall(options);
  process.exit(success ? 0 : 1);
}

if (uninstallAllMode) {
  const result = uninstallAll();
  process.exit(result.success ? 0 : 1);
}

// Show configuration if requested (do this after loading)
if (showConfig) {
  console.log(displayConfig());
  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
