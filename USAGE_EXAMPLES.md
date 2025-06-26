# ccusage-byobu Usage Examples

This document provides comprehensive usage examples for ccusage-byobu, a tool that integrates Claude Code usage metrics into byobu status bars.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation Examples](#installation-examples)
3. [Configuration Examples](#configuration-examples)
4. [Basic Usage Examples](#basic-usage-examples)
5. [Byobu Integration Examples](#byobu-integration-examples)
6. [Advanced Configuration](#advanced-configuration)
7. [Performance and Caching](#performance-and-caching)
8. [Troubleshooting Examples](#troubleshooting-examples)
9. [Plan Type Configuration](#plan-type-configuration)
10. [Customization Examples](#customization-examples)

## Quick Start

### Basic Installation and Setup

```bash
# Install globally via npm
npm install -g ccusage-byobu

# Quick setup with byobu integration
ccusage-byobu --install

# Start byobu to see usage metrics
byobu
```

## Installation Examples

### 1. Automated Installation Script

```bash
# Download and run the complete installer
curl -fsSL https://raw.githubusercontent.com/adawalli/ccusage-byobu/main/install-ccusage-byobu.sh | bash

# Or clone and run locally
git clone https://github.com/adawalli/ccusage-byobu.git
cd ccusage-byobu
./install-ccusage-byobu.sh
```

**Example interactive session:**

```
ccusage-byobu Installer
=======================

[STEP 1/6] Performing prerequisite checks
✓ byobu is installed
✓ Node.js v18.17.0 is installed
✓ npm 9.6.7 is installed
✓ All prerequisite checks passed

[STEP 2/6] Gathering configuration options

Please select your Claude plan type:
1) Free
2) Pro
3) Max (5x)
4) Max (20x)
5) Enterprise

Enter your choice (1-5): 3
✓ Selected plan type: max_5x

Please specify your Claude configuration directory:
Default: /home/user/.claude

Enter directory path (or press Enter for default):
✓ Claude config directory: /home/user/.claude

Please specify the refresh interval for byobu status (in seconds):
Default: 60 seconds
Range: 5-3600 seconds

Enter refresh interval (or press Enter for default): 30
✓ Refresh interval: 30 seconds

Configuration summary:
  Claude plan type: max_5x
  Claude config directory: /home/user/.claude
  Refresh interval: 30 seconds

Proceed with installation? (y/N): y
```

### 2. Manual Installation

```bash
# Install ccusage prerequisite
npm install -g ccusage

# Install ccusage-byobu
npm install -g ccusage-byobu

# Set up byobu integration
ccusage-byobu --install --refresh=60

# Configure environment variables
echo 'export CLAUDE_PLAN_TYPE="pro"' >> ~/.bashrc
echo 'export CLAUDE_CONFIG_DIR="$HOME/.claude"' >> ~/.bashrc
source ~/.bashrc
```

### 3. Development Installation

```bash
# Clone repository for development
git clone https://github.com/adawalli/ccusage-byobu.git
cd ccusage-byobu

# Install dependencies
npm install

# Link for development
npm link

# Test installation
ccusage-byobu --test
```

## Configuration Examples

### 1. Environment Variables Configuration

```bash
# Basic configuration
export CLAUDE_PLAN_TYPE="max_5x"
export CLAUDE_CONFIG_DIR="$HOME/.claude"
export CCUSAGE_BYOBU_REFRESH="30"

# Display customization
export CCUSAGE_BYOBU_FORMAT="full"        # or "compact"
export CCUSAGE_BYOBU_COLORS="true"        # or "false", "auto"
export CCUSAGE_BYOBU_THRESHOLD="75"       # percentage for color changes

# Performance tuning
export CCUSAGE_ENABLE_CACHE="1"           # Enable caching (disabled by default)
export CCUSAGE_BYOBU_DEBUG="1"            # Enable debug output
```

### 2. Configuration File Examples

**JSON Configuration (`~/.ccusage-byobu.json`):**

```json
{
  "CLAUDE_PLAN_TYPE": "pro",
  "CLAUDE_CONFIG_DIR": "/home/user/.claude",
  "CCUSAGE_BYOBU_FORMAT": "full",
  "CCUSAGE_BYOBU_COLORS": "true",
  "CCUSAGE_BYOBU_THRESHOLD": "80",
  "CCUSAGE_BYOBU_REFRESH": "45"
}
```

**Environment File (`.env` format):**

```bash
# Claude configuration
CLAUDE_PLAN_TYPE="max_20x"
CLAUDE_CONFIG_DIR="/home/user/.claude"

# Display settings
CCUSAGE_BYOBU_FORMAT="compact"
CCUSAGE_BYOBU_COLORS="auto"
CCUSAGE_BYOBU_THRESHOLD="70"
CCUSAGE_BYOBU_REFRESH="60"

# Performance settings
CCUSAGE_ENABLE_CACHE="true"
```

**Usage with config file:**

```bash
# Load from JSON config
ccusage-byobu --config=~/.ccusage-byobu.json

# Load from environment file
ccusage-byobu --config=~/ccusage.env
```

### 3. Shell Profile Configuration

**Bash (`~/.bashrc`):**

```bash
# ccusage-byobu configuration
export CLAUDE_PLAN_TYPE="pro"
export CLAUDE_CONFIG_DIR="$HOME/.claude"
export CCUSAGE_BYOBU_FORMAT="full"
export CCUSAGE_BYOBU_COLORS="true"
export CCUSAGE_BYOBU_THRESHOLD="80"
export CCUSAGE_BYOBU_REFRESH="60"
```

**Zsh (`~/.zshrc`):**

```zsh
# ccusage-byobu configuration
export CLAUDE_PLAN_TYPE="max_5x"
export CLAUDE_CONFIG_DIR="$HOME/.claude"
export CCUSAGE_BYOBU_FORMAT="compact"
export CCUSAGE_BYOBU_COLORS="auto"
export CCUSAGE_BYOBU_THRESHOLD="75"
```

**Fish (`~/.config/fish/config.fish`):**

```fish
# ccusage-byobu configuration
set -x CLAUDE_PLAN_TYPE "enterprise"
set -x CLAUDE_CONFIG_DIR "$HOME/.claude"
set -x CCUSAGE_BYOBU_FORMAT "full"
set -x CCUSAGE_BYOBU_COLORS "true"
set -x CCUSAGE_BYOBU_THRESHOLD "85"
```

## Basic Usage Examples

### 1. Command Line Usage

```bash
# Display current usage (terminal output)
ccusage-byobu

# Example output:
# [████████░░] 4h12m $2.35

# Show current configuration
ccusage-byobu --config

# Test installation and dependencies
ccusage-byobu --test

# Get help
ccusage-byobu --help
```

### 2. Different Display Formats

**Compact Format:**

```bash
export CCUSAGE_BYOBU_FORMAT="compact"
ccusage-byobu
# Output: 4h12m $2.35
```

**Full Format:**

```bash
export CCUSAGE_BYOBU_FORMAT="full"
ccusage-byobu
# Output: [████████░░] 4h12m $2.35
```

### 3. Color Schemes

**With Colors (default):**

```bash
export CCUSAGE_BYOBU_COLORS="true"
ccusage-byobu
# Output: Green text when usage < 55%, yellow when 55-80%, red when > 80%
```

**Without Colors:**

```bash
export CCUSAGE_BYOBU_COLORS="false"
ccusage-byobu
# Output: Plain text without color coding
```

**Auto Colors (terminal detection):**

```bash
export CCUSAGE_BYOBU_COLORS="auto"
ccusage-byobu
# Output: Colors enabled if terminal supports them
```

## Byobu Integration Examples

### 1. Installation with Different Refresh Intervals

```bash
# Install with default 60-second refresh
ccusage-byobu --install

# Install with custom refresh interval
ccusage-byobu --install --refresh=30

# Install with fast refresh for development
ccusage-byobu --install --refresh=10

# Install with slow refresh for production
ccusage-byobu --install --refresh=300
```

### 2. Managing Multiple Refresh Intervals

```bash
# Install multiple scripts with different intervals
ccusage-byobu --install --refresh=30
ccusage-byobu --install --refresh=60
ccusage-byobu --install --refresh=120

# List all installed scripts
ls ~/.byobu/bin/*_ccusage
# Output:
# ~/.byobu/bin/30_ccusage
# ~/.byobu/bin/60_ccusage
# ~/.byobu/bin/120_ccusage

# Uninstall specific interval
ccusage-byobu --uninstall --refresh=30

# Uninstall all ccusage scripts
ccusage-byobu --uninstall-all
```

### 3. Custom Byobu Status Script

Create `~/.byobu/bin/61_ccusage_custom`:

```bash
#!/bin/bash

# Custom ccusage-byobu integration with error handling
output=$(ccusage-byobu 2>/dev/null)
if [ $? -eq 0 ] && [ -n "$output" ]; then
    echo "Claude: $output"
else
    echo "Claude: --"
fi
```

Make it executable:

```bash
chmod +x ~/.byobu/bin/61_ccusage_custom
```

### 4. Conditional Display Script

Create `~/.byobu/bin/62_ccusage_conditional`:

```bash
#!/bin/bash

# Only show ccusage when Claude is active
if pgrep -f "claude" > /dev/null 2>&1; then
    ccusage-byobu 2>/dev/null || echo ""
else
    echo ""
fi
```

## Advanced Configuration

### 1. Different Claude Tier Configurations

**Free Tier Setup:**

```bash
export CLAUDE_PLAN_TYPE="free"
export CCUSAGE_BYOBU_THRESHOLD="90"  # Higher threshold for free limits
export CCUSAGE_BYOBU_FORMAT="compact"
ccusage-byobu --install --refresh=120  # Slower refresh for free tier
```

**Pro Tier Setup:**

```bash
export CLAUDE_PLAN_TYPE="pro"
export CCUSAGE_BYOBU_THRESHOLD="80"
export CCUSAGE_BYOBU_FORMAT="full"
ccusage-byobu --install --refresh=60
```

**Max Tier Setup:**

```bash
export CLAUDE_PLAN_TYPE="max_20x"
export CCUSAGE_BYOBU_THRESHOLD="75"  # Lower threshold for higher limits
export CCUSAGE_BYOBU_FORMAT="full"
ccusage-byobu --install --refresh=30  # Faster refresh for active development
```

**Enterprise Setup:**

```bash
export CLAUDE_PLAN_TYPE="enterprise"
export CCUSAGE_BYOBU_THRESHOLD="70"
export CCUSAGE_BYOBU_FORMAT="full"
export CCUSAGE_BYOBU_COLORS="true"
ccusage-byobu --install --refresh=30
```

### 2. Development vs Production Configurations

**Development Configuration:**

```bash
# Fast refresh, detailed output, caching enabled
export CCUSAGE_BYOBU_FORMAT="full"
export CCUSAGE_BYOBU_REFRESH="15"
export CCUSAGE_BYOBU_THRESHOLD="70"
export CCUSAGE_ENABLE_CACHE="1"
export CCUSAGE_BYOBU_DEBUG="1"
```

**Production Configuration:**

```bash
# Slower refresh, compact output, no debug
export CCUSAGE_BYOBU_FORMAT="compact"
export CCUSAGE_BYOBU_REFRESH="120"
export CCUSAGE_BYOBU_THRESHOLD="85"
export CCUSAGE_BYOBU_DEBUG="0"
```

### 3. Team Environment Configuration

**Shared Team Settings:**

```bash
# Create team configuration file
cat > /shared/ccusage-team.env << EOF
CLAUDE_PLAN_TYPE="max_5x"
CLAUDE_CONFIG_DIR="/shared/claude-config"
CCUSAGE_BYOBU_FORMAT="full"
CCUSAGE_BYOBU_THRESHOLD="75"
CCUSAGE_BYOBU_REFRESH="45"
EOF

# Load team configuration
ccusage-byobu --config=/shared/ccusage-team.env
```

## Performance and Caching

### 1. Enable Caching for Interactive Use

```bash
# Enable caching (disabled by default for byobu compatibility)
export CCUSAGE_ENABLE_CACHE="1"

# Configure cache settings
export CCUSAGE_BYOBU_CACHE_CLEANUP_INTERVAL="30000"  # 30 seconds
export CCUSAGE_BYOBU_CACHE_MAX_KEYS="100"
export CCUSAGE_BYOBU_CACHE_WINDOW_SIZE="50"

# Test with caching enabled
ccusage-byobu --test
```

### 2. Performance Benchmarking

```bash
# Run basic benchmark
ccusage-byobu-benchmark

# Run specific benchmark suites
ccusage-byobu-benchmark cold warm --iterations=50

# Compare cold vs warm performance
ccusage-byobu-benchmark all --compare

# Run startup time benchmark
ccusage-byobu-benchmark startup --iterations=100
```

**Example benchmark output:**

```
🏃 Running benchmark suite: Cold Start (no cache)
   Iterations: 10
   Running iterations...
   Progress: 100%

📊 Results for: Cold Start (no cache)
   Iterations: 10
   Average: 125.45ms
   Min: 98.23ms
   Max: 156.78ms
   Std Dev: 18.92ms
   P50: 122.34ms
   P95: 151.23ms
   P99: 156.78ms
   Avg Memory Delta: 2.34MB RSS
```

### 3. Debug Performance Analysis

```bash
# Enable debug mode for performance insights
export CCUSAGE_BYOBU_DEBUG="1"
ccusage-byobu

# Example debug output:
# Cache miss - executed ccusage command in 95.23ms
# JSON parsed in 2.15ms
# JSON size: 1.23KB
# Parse throughput: 572.09KB/ms
# Parse overhead: 2.21% of total operation
#
# Performance Summary:
#   Session duration: 12.3s
#   Memory: Current 25MB RSS, Peak 28MB RSS
#   Memory growth: 3MB RSS, 1.2MB Heap
```

## Troubleshooting Examples

### 1. Installation Issues

**Problem: ccusage command not found**

```bash
# Check if ccusage is installed
which ccusage
# If not found, install it:
npm install -g ccusage

# Verify installation
ccusage --version
```

**Problem: Permission denied during installation**

```bash
# Try with sudo
sudo npm install -g ccusage-byobu

# Or configure npm to install globally without sudo
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g ccusage-byobu
```

**Problem: Node.js version incompatibility**

```bash
# Check Node.js version
node --version
# If version < 18, update Node.js:

# Using nvm (recommended)
nvm install 18
nvm use 18

# Or install latest Node.js from https://nodejs.org/
```

### 2. Byobu Integration Issues

**Problem: Status not appearing in byobu**

```bash
# Check if script is installed
ls -la ~/.byobu/bin/*ccusage*

# Check script permissions
chmod +x ~/.byobu/bin/60_ccusage

# Test script manually
~/.byobu/bin/60_ccusage

# Restart byobu
byobu kill-server
byobu
```

**Problem: Status shows empty output**

```bash
# Test ccusage-byobu directly
ccusage-byobu --test

# Check for error messages
ccusage-byobu 2>&1

# Enable debug mode
export CCUSAGE_BYOBU_DEBUG="1"
ccusage-byobu
```

### 3. Configuration Issues

**Problem: Invalid plan type error**

```bash
# Check current configuration
ccusage-byobu --config

# Valid plan types
export CLAUDE_PLAN_TYPE="free"      # or "pro", "max_5x", "max_20x", "enterprise"

# Migrate from legacy 'team' plan
./install-ccusage-byobu.sh --migrate
```

**Problem: Configuration not loading**

```bash
# Verify environment variables
env | grep CLAUDE
env | grep CCUSAGE

# Source shell profile
source ~/.bashrc  # or ~/.zshrc

# Test with explicit config file
ccusage-byobu --config=/path/to/config.json
```

### 4. Performance Issues

**Problem: Slow response times**

```bash
# Enable caching for repeated calls
export CCUSAGE_ENABLE_CACHE="1"

# Increase refresh interval
ccusage-byobu --uninstall
ccusage-byobu --install --refresh=120

# Check performance
ccusage-byobu-benchmark
```

**Problem: High memory usage**

```bash
# Disable debug mode
unset CCUSAGE_BYOBU_DEBUG

# Check memory usage
ccusage-byobu --test | grep Memory

# Configure cache limits
export CCUSAGE_BYOBU_CACHE_MAX_KEYS="50"
```

## Plan Type Configuration

### 1. Plan Migration Examples

**Migrating from Legacy 'team' Plan:**

```bash
# Check current plan
echo $CLAUDE_PLAN_TYPE
# Output: team

# Run migration tool
./install-ccusage-byobu.sh --migrate

# Interactive migration:
# 🔄 Claude Plan Migration Tool
# ==============================
#
# Legacy 'team' plan detected in your environment.
# The 'team' plan has been discontinued and replaced with:
#   • Max (5x) - Moderate usage scaling, suitable for most teams
#   • Max (20x) - High usage scaling, for intensive development
#
# Available options:
# 1) Free
# 2) Pro
# 3) Max (5x) - Recommended for most team users
# 4) Max (20x) - For high-usage teams
# 5) Enterprise
#
# Select your new plan (1-5) [recommended: 3]: 3
# ✅ Migration complete: team → max_5x
```

### 2. Plan-Specific Optimizations

**Free Tier Optimization:**

```bash
export CLAUDE_PLAN_TYPE="free"
export CCUSAGE_BYOBU_FORMAT="compact"      # Minimize space usage
export CCUSAGE_BYOBU_THRESHOLD="95"        # Higher threshold for limited usage
export CCUSAGE_BYOBU_REFRESH="300"         # Slower refresh to reduce load
export CCUSAGE_BYOBU_COLORS="false"        # Minimize processing
```

**Max Tier Optimization:**

```bash
export CLAUDE_PLAN_TYPE="max_20x"
export CCUSAGE_BYOBU_FORMAT="full"         # Show detailed progress bar
export CCUSAGE_BYOBU_THRESHOLD="70"        # Earlier warning for heavy usage
export CCUSAGE_BYOBU_REFRESH="30"          # Faster refresh for active development
export CCUSAGE_ENABLE_CACHE="1"            # Enable caching for performance
```

## Customization Examples

### 1. Custom Display Formats

**Creating a Custom Format Script:**

```bash
# Create custom formatter
cat > ~/.byobu/bin/65_ccusage_custom << 'EOF'
#!/bin/bash

# Get raw ccusage data
output=$(ccusage-byobu 2>/dev/null)

if [ -n "$output" ]; then
    # Extract time and cost using pattern matching
    if [[ $output =~ ([0-9]+h[0-9]+m|[0-9]+m).*\$([0-9]+\.[0-9]+) ]]; then
        time="${BASH_REMATCH[1]}"
        cost="${BASH_REMATCH[2]}"
        echo "⚡ $time 💰 \$$cost"
    else
        echo "$output"
    fi
else
    echo ""
fi
EOF

chmod +x ~/.byobu/bin/65_ccusage_custom
```

### 2. Integration with Other Tools

**Integration with tmux:**

```bash
# Add to tmux status bar
cat >> ~/.tmux.conf << 'EOF'
set -g status-right '#(ccusage-byobu 2>/dev/null) | %Y-%m-%d %H:%M'
EOF

# Reload tmux config
tmux source-file ~/.tmux.conf
```

**Integration with Starship Prompt:**

```toml
# Add to ~/.config/starship.toml
[custom.claude_usage]
command = "ccusage-byobu 2>/dev/null"
when = "command -v ccusage-byobu >/dev/null"
format = "[$output]($style) "
style = "bold blue"
```

### 3. Conditional Display Logic

**Show Only During Active Claude Sessions:**

```bash
cat > ~/.byobu/bin/66_ccusage_smart << 'EOF'
#!/bin/bash

# Check if Claude Code is running
if pgrep -f "claude.*code\|code.*claude" > /dev/null 2>&1; then
    # Show usage with active indicator
    output=$(ccusage-byobu 2>/dev/null)
    if [ -n "$output" ]; then
        echo "🤖 $output"
    fi
elif ccusage blocks --json --offline 2>/dev/null | grep -q '"isActive":true'; then
    # Show usage without active indicator
    ccusage-byobu 2>/dev/null
else
    # No active session
    echo ""
fi
EOF

chmod +x ~/.byobu/bin/66_ccusage_smart
```

### 4. Multi-Environment Setup

**Development Machine Configuration:**

```bash
# ~/.ccusage-dev.env
CLAUDE_PLAN_TYPE="max_20x"
CCUSAGE_BYOBU_FORMAT="full"
CCUSAGE_BYOBU_THRESHOLD="70"
CCUSAGE_BYOBU_REFRESH="15"
CCUSAGE_ENABLE_CACHE="1"
CCUSAGE_BYOBU_DEBUG="1"
```

**Production Server Configuration:**

```bash
# ~/.ccusage-prod.env
CLAUDE_PLAN_TYPE="pro"
CCUSAGE_BYOBU_FORMAT="compact"
CCUSAGE_BYOBU_THRESHOLD="85"
CCUSAGE_BYOBU_REFRESH="120"
CCUSAGE_BYOBU_DEBUG="0"
```

**Dynamic Environment Detection:**

```bash
cat > ~/.byobu/bin/67_ccusage_env << 'EOF'
#!/bin/bash

# Detect environment and load appropriate config
if [ -f "/etc/production" ]; then
    source ~/.ccusage-prod.env
elif [ "$USER" = "developer" ]; then
    source ~/.ccusage-dev.env
fi

ccusage-byobu 2>/dev/null || echo ""
EOF

chmod +x ~/.byobu/bin/67_ccusage_env
```

## Summary

This comprehensive guide covers all aspects of ccusage-byobu usage, from basic installation to advanced customization. Key takeaways:

1. **Installation**: Use the automated installer for best results, or install manually for custom setups
2. **Configuration**: Leverage environment variables, config files, and shell profiles for persistent settings
3. **Byobu Integration**: Multiple refresh intervals and custom scripts provide flexibility
4. **Performance**: Enable caching for interactive use, use benchmarking tools for optimization
5. **Troubleshooting**: Common issues have well-documented solutions
6. **Customization**: Extensive customization options for different environments and use cases

For additional help, use `ccusage-byobu --help` or `ccusage-byobu --test` to diagnose issues.
