#!/usr/bin/env node

import { main } from '../lib/index.js';
import { displayConfig, loadConfigFile } from '../lib/config.js';

// Parse command line arguments
const args = process.argv.slice(2);
let configFile = null;
let showConfig = false;

// Parse arguments
for (const arg of args) {
  if (arg === '--config') {
    showConfig = true;
  } else if (arg.startsWith('--config=')) {
    configFile = arg.split('=')[1];
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

// Show configuration if requested (do this after loading)
if (showConfig) {
  console.log(displayConfig());
  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
