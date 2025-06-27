/**
 * Configuration module for ccusage-byobu
 * Handles environment variable validation and default values
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Default configuration values
const DEFAULT_CONFIG = {
  format: 'compact',
  colors: 'auto',
  threshold: 80,
  refresh: 60,
  maxWidth: 50,
};

// Valid values for each configuration option
const VALID_VALUES = {
  format: ['compact', 'full'],
  colors: ['auto', 'true', 'false'],
  threshold: (value) => {
    // Use strict regex to ensure entire string is a valid integer
    if (!/^(0|[1-9]\d*)$/.test(value)) return false;
    const num = Number(value);
    return num >= 0 && num <= 100;
  },
  refresh: (value) => {
    // Use strict regex to ensure entire string is a valid positive integer
    if (!/^[1-9]\d*$/.test(value)) return false;
    const num = Number(value);
    return num > 0;
  },
  maxWidth: (value) => {
    // Use strict regex to ensure entire string is a valid positive integer
    if (!/^[1-9]\d*$/.test(value)) return false;
    const num = Number(value);
    return num >= 10 && num <= 200; // Reasonable bounds for display width
  },
};

/**
 * Validates a configuration value
 * @param {string} key - Configuration key
 * @param {string} value - Value to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateValue(key, value) {
  const validator = VALID_VALUES[key];

  if (Array.isArray(validator)) {
    return validator.includes(value);
  }

  if (typeof validator === 'function') {
    return validator(value);
  }

  return false;
}

/**
 * Gets configuration from environment variables with validation and defaults
 * @returns {Object} Configuration object
 */
export function getConfig() {
  const config = {};
  const errors = [];

  // Process each configuration option
  for (const [key, defaultValue] of Object.entries(DEFAULT_CONFIG)) {
    const envKey = `CCUSAGE_BYOBU_${key.toUpperCase()}`;
    const envValue = process.env[envKey];

    if (envValue !== undefined) {
      if (validateValue(key, envValue)) {
        // Convert numeric values
        if (key === 'threshold' || key === 'refresh') {
          config[key] = Number(envValue);
        } else {
          config[key] = envValue;
        }
      } else {
        errors.push(`Invalid value for ${envKey}: "${envValue}"`);
        config[key] = defaultValue;
      }
    } else {
      config[key] = defaultValue;
    }
  }

  // Store validation errors for potential reporting
  config._errors = errors;

  return config;
}

/**
 * Validates plan type and provides migration guidance if needed
 * @param {string} planType - The plan type to validate
 * @returns {Object} Validation result with warnings if applicable
 */
function validatePlanType(planType) {
  if (!planType) {
    return { isValid: true, warnings: [] };
  }

  const validPlans = ['free', 'pro', 'max_5x', 'max_20x', 'enterprise'];
  const legacyPlans = ['team'];

  if (validPlans.includes(planType)) {
    return { isValid: true, warnings: [] };
  }

  if (legacyPlans.includes(planType)) {
    return {
      isValid: false,
      isLegacy: true,
      warnings: [
        `⚠️  Legacy plan type detected: "${planType}"`,
        `The "${planType}" plan has been replaced with new Max tier options:`,
        `  • max_5x - For moderate usage scaling`,
        `  • max_20x - For high usage scaling`,
        `Please update your CLAUDE_PLAN_TYPE environment variable.`,
        `Run: ./install-ccusage-byobu.sh --migrate`,
      ],
    };
  }

  return {
    isValid: false,
    isLegacy: false,
    warnings: [
      `⚠️  Invalid plan type: "${planType}"`,
      `Valid plan types: ${validPlans.join(', ')}`,
    ],
  };
}

/**
 * Gets pass-through environment variables for ccusage
 * @returns {Object} Environment variables to pass through
 */
export function getPassThroughEnv() {
  const passThroughVars = [
    'CLAUDE_CONFIG_DIR',
    'CCUSAGE_DATA_DIR',
    'CLAUDE_PLAN_TYPE',
    'CLAUDE_API_KEY',
  ];

  const env = {};
  for (const varName of passThroughVars) {
    if (process.env[varName] !== undefined) {
      env[varName] = process.env[varName];
    }
  }

  // Validate plan type if present
  if (env.CLAUDE_PLAN_TYPE) {
    const validation = validatePlanType(env.CLAUDE_PLAN_TYPE);
    if (!validation.isValid) {
      // For legacy plans, still pass through but show warnings
      if (validation.isLegacy) {
        console.warn('\n' + validation.warnings.join('\n'));
        console.warn(''); // Empty line for better readability
      } else {
        // For invalid plans, remove from pass-through
        delete env.CLAUDE_PLAN_TYPE;
        console.warn('\n' + validation.warnings.join('\n'));
        console.warn('CLAUDE_PLAN_TYPE has been removed from environment.\n');
      }
    }
  }

  return env;
}

/**
 * Displays current configuration (for --config flag)
 * @returns {string} Formatted configuration display
 */
export function displayConfig() {
  const config = getConfig();
  const passThroughEnv = getPassThroughEnv();

  let output = 'Current Configuration:\n';
  output += '=====================\n\n';

  output += 'ccusage-byobu Settings:\n';
  output += `-----------------------\n`;
  output += `Format: ${config.format} (CCUSAGE_BYOBU_FORMAT)\n`;
  output += `Colors: ${config.colors} (CCUSAGE_BYOBU_COLORS)\n`;
  output += `Threshold: ${config.threshold}% (CCUSAGE_BYOBU_THRESHOLD)\n`;
  output += `Refresh: ${config.refresh}s (CCUSAGE_BYOBU_REFRESH)\n`;
  output += `Max Width: ${config.maxWidth} chars (CCUSAGE_BYOBU_MAXWIDTH)\n`;

  if (config._errors.length > 0) {
    output += '\nValidation Errors:\n';
    output += '------------------\n';
    for (const error of config._errors) {
      output += `⚠️  ${error}\n`;
    }
  }

  output += '\nPass-through Variables:\n';
  output += '-----------------------\n';
  const passThroughVarNames = [
    'CLAUDE_CONFIG_DIR',
    'CCUSAGE_DATA_DIR',
    'CLAUDE_PLAN_TYPE',
    'CLAUDE_API_KEY',
  ];
  for (const varName of passThroughVarNames) {
    const value = passThroughEnv[varName];
    if (value !== undefined) {
      // Mask sensitive values
      const displayValue = varName === 'CLAUDE_API_KEY' ? `${value.substring(0, 8)}...` : value;
      output += `${varName}: ${displayValue}\n`;
    } else {
      output += `${varName}: (not set)\n`;
    }
  }

  return output;
}

/**
 * Loads configuration from a file and sets environment variables
 * @param {string} filePath - Path to the configuration file
 */
export function loadConfigFile(filePath) {
  const resolvedPath = resolve(filePath);

  try {
    const fileContent = readFileSync(resolvedPath, 'utf-8');

    // Support different file formats
    let config;
    if (filePath.endsWith('.json')) {
      config = JSON.parse(fileContent);
    } else {
      // Parse as .env format (KEY=VALUE lines)
      config = {};
      const lines = fileContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) continue;

        const equalIndex = trimmed.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmed.substring(0, equalIndex).trim();
          const value = trimmed.substring(equalIndex + 1).trim();
          // Remove matching quotes if present
          config[key] = value.replace(/^(['"])(.*)\1$/g, '$2');
        }
      }
    }

    // Set environment variables from config
    const configPrefix = 'CCUSAGE_BYOBU_';
    const passThroughVars = [
      'CLAUDE_CONFIG_DIR',
      'CCUSAGE_DATA_DIR',
      'CLAUDE_PLAN_TYPE',
      'CLAUDE_API_KEY',
    ];

    for (const [key, value] of Object.entries(config)) {
      // Handle ccusage-byobu specific variables (with or without prefix)
      if (
        key.startsWith(configPrefix) ||
        ['FORMAT', 'COLORS', 'THRESHOLD', 'REFRESH', 'MAXWIDTH'].includes(key.toUpperCase())
      ) {
        const envKey = key.startsWith(configPrefix) ? key : `${configPrefix}${key.toUpperCase()}`;
        process.env[envKey] = String(value);
      }
      // Handle pass-through variables
      else if (passThroughVars.includes(key)) {
        process.env[key] = String(value);
      }
    }

    // Validate the loaded configuration
    const validatedConfig = getConfig();
    if (validatedConfig._errors.length > 0) {
      throw new Error(`Configuration validation errors:\n${validatedConfig._errors.join('\n')}`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Configuration file not found: ${resolvedPath}`);
    } else if (error.code === 'EACCES') {
      throw new Error(
        `Permission denied reading configuration file: ${resolvedPath}. Please check file permissions.`
      );
    } else if (error.code === 'EPERM') {
      throw new Error(
        `Insufficient permissions to read configuration file: ${resolvedPath}. Please check file permissions or run with appropriate privileges.`
      );
    } else if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in configuration file: ${error.message}`);
    } else {
      throw error;
    }
  }
}
