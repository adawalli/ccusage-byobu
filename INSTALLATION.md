# ccusage-byobu Installation Guide

This guide provides comprehensive installation instructions for ccusage-byobu, covering all supported installation methods.

## Overview

ccusage-byobu is a CLI tool that integrates Claude Code usage metrics with byobu/tmux status bars. It requires Node.js 18+ and optionally byobu for status bar integration.

## Prerequisites

Before installing ccusage-byobu, ensure you have the following requirements:

- **Node.js 18.0.0 or higher** - Required for running the tool
- **npm** - Usually bundled with Node.js, required for npm-based installations
- **ccusage CLI** - The underlying Claude usage tool (automatically installed as dependency)
- **byobu** - Optional, required only for status bar integration

### Checking Prerequisites

```bash
# Check Node.js version (required: 18+)
node --version

# Check npm version
npm --version

# Check if byobu is installed (optional)
byobu --version
```

## Installation Methods

### 1. One-Liner Installer Script (Recommended)

The easiest way to install ccusage-byobu with full setup and configuration.

#### Using curl

```bash
curl -fsSL https://raw.githubusercontent.com/adawalli/ccusage-byobu/main/install-ccusage-byobu.sh | bash
```

#### Using wget

```bash
wget -qO- https://raw.githubusercontent.com/adawalli/ccusage-byobu/main/install-ccusage-byobu.sh | bash
```

#### What the installer does:

1. **Prerequisite checks** - Verifies Node.js, npm, and byobu installation
2. **Interactive configuration** - Prompts for Claude plan type, config directory, and refresh interval
3. **Global npm installation** - Installs ccusage-byobu globally via npm
4. **Byobu integration** - Sets up status bar scripts automatically
5. **Shell profile updates** - Adds environment variables to your shell profile
6. **Verification** - Tests the installation and provides next steps

#### Expected output:

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

Please specify your Claude configuration directory:
Default: /Users/username/.claude

Enter directory path (or press Enter for default): 

Please specify the refresh interval for byobu status (in seconds):
Default: 60 seconds
Range: 5-3600 seconds

Enter refresh interval (or press Enter for default): 

Configuration summary:
  Claude plan type: max_5x
  Claude config directory: /Users/username/.claude
  Refresh interval: 60 seconds

Proceed with installation? (y/N): y

[STEP 3/6] Installing ccusage-byobu globally via npm
✓ ccusage-byobu installed globally

[STEP 4/6] Setting up byobu integration
✓ byobu integration installed successfully

[STEP 5/6] Updating shell profile
✓ Added environment variables to /Users/username/.zshrc

[STEP 6/6] Installation completed successfully!

🎉 ccusage-byobu has been installed successfully!

Configuration:
  ✓ Claude plan type: max_5x
  ✓ Claude config directory: /Users/username/.claude
  ✓ Refresh interval: 60 seconds
  ✓ byobu integration: Active

Next steps:
  1. Restart your terminal or run: source ~/.zshrc
  2. Start byobu: byobu
  3. Your Claude usage metrics will appear in the byobu status bar
```

#### Pros:
- Complete setup with interactive configuration
- Automatic prerequisite checking
- Shell profile configuration
- Error handling and rollback
- Migration support for legacy configurations

#### Cons:
- Requires internet connection
- Downloads and executes script (security consideration)

#### When to use:
- First-time installation
- Want full automated setup
- Need interactive configuration guidance

---

### 2. NPM Global Install

Install ccusage-byobu globally using npm for system-wide access.

#### Installation

```bash
# Install globally
npm install -g ccusage-byobu

# Verify installation
ccusage-byobu --help
```

#### Manual byobu setup (after npm install)

```bash
# Install byobu integration with default settings
ccusage-byobu --install

# Or install with custom refresh interval
ccusage-byobu --install --refresh=30

# Test the installation
ccusage-byobu --test
```

#### Setting environment variables manually

Add to your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
# Required: Your Claude plan type
export CLAUDE_PLAN_TYPE="max_5x"  # or "free", "pro", "max_20x", "enterprise"

# Optional: Custom Claude config directory (default: ~/.claude)
export CLAUDE_CONFIG_DIR="$HOME/.claude"

# Optional: Custom refresh interval (default: 60)
export CCUSAGE_BYOBU_REFRESH="60"
```

Then restart your terminal or run:
```bash
source ~/.bashrc  # or ~/.zshrc
```

#### Expected output:

```bash
$ npm install -g ccusage-byobu
added 3 packages in 2s

$ ccusage-byobu --install
✓ Successfully installed ccusage-byobu status script
  Location: /Users/username/.byobu/bin/60_ccusage
  Refresh interval: 60 seconds
  Script is now active in byobu status bar

$ ccusage-byobu
2h45m $0.87
```

#### Troubleshooting npm permissions

If you get permission errors:

```bash
# Option 1: Use sudo (not recommended)
sudo npm install -g ccusage-byobu

# Option 2: Configure npm to use a different directory (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Add to your shell profile
export PATH=~/.npm-global/bin:$PATH

# Then install without sudo
npm install -g ccusage-byobu
```

#### Pros:
- Standard Node.js installation method
- Easy to update with `npm update -g ccusage-byobu`
- No script execution security concerns
- Familiar to Node.js developers

#### Cons:
- Requires manual configuration
- May need npm permission setup
- Separate byobu integration step

#### When to use:
- Prefer standard npm workflow
- Want to control each installation step
- Already have npm permissions configured
- Building automated deployment scripts

---

### 3. NPX Usage (No Installation)

Use ccusage-byobu without installing it globally via npx.

#### Basic usage

```bash
# Run directly without installation
npx ccusage-byobu

# Show current configuration
npx ccusage-byobu --config

# Test functionality
npx ccusage-byobu --test
```

#### Byobu integration with npx

Note: byobu integration requires the tool to be globally accessible, so npx usage is limited for this feature.

For one-time setup, you can use:

```bash
# This works but creates a script that may not persist
npx ccusage-byobu --install
```

However, the created byobu script may fail if the npx cache is cleared. For reliable byobu integration, use global installation instead.

#### Expected output:

```bash
$ npx ccusage-byobu
Need to install the following packages:
  ccusage-byobu@1.0.6
Ok to proceed? (y) y

2h45m $0.87
```

#### Creating a wrapper script for npx

If you prefer npx but need reliable byobu integration:

```bash
# Create a wrapper script
mkdir -p ~/.local/bin
cat > ~/.local/bin/ccusage-byobu << 'EOF'
#!/bin/bash
npx ccusage-byobu "$@"
EOF
chmod +x ~/.local/bin/ccusage-byobu

# Add to PATH if not already
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Now install byobu integration
ccusage-byobu --install
```

#### Pros:
- No global installation required
- Always uses latest version
- Good for testing/evaluation
- No npm permission issues

#### Cons:
- Slower startup (downloads on first use)
- Unreliable for byobu integration
- Network dependency
- Cache may be cleared

#### When to use:
- Testing the tool before installing
- Occasional usage without permanent installation
- CI/CD environments
- Want to always use latest version

---

### 4. Local Development Setup

Set up ccusage-byobu for development, contribution, or customization.

#### Clone and setup

```bash
# Clone the repository
git clone https://github.com/adawalli/ccusage-byobu.git
cd ccusage-byobu

# Install dependencies
npm install

# Create global symlink for development
npm link

# Verify development setup
ccusage-byobu --test
```

#### Development environment setup

```bash
# Install development dependencies
npm install

# Set up git hooks (for contributors)
npm run prepare

# Run linting
npm run lint

# Run formatting
npm run format

# Check for secrets (security)
npm run secrets:check
```

#### Development configuration

Create a `.env` file for development (optional):

```bash
# Create development environment file
cat > .env << 'EOF'
CLAUDE_PLAN_TYPE=max_5x
CLAUDE_CONFIG_DIR=$HOME/.claude
CCUSAGE_BYOBU_REFRESH=10
CCUSAGE_BYOBU_DEBUG=true
EOF
```

#### Testing your changes

```bash
# Test basic functionality
node bin/ccusage-byobu.js

# Test installation
node bin/ccusage-byobu.js --install --refresh=10

# Test with debug output
CCUSAGE_BYOBU_DEBUG=true node bin/ccusage-byobu.js
```

#### Expected development workflow:

```bash
$ git clone https://github.com/adawalli/ccusage-byobu.git
Cloning into 'ccusage-byobu'...

$ cd ccusage-byobu

$ npm install
added 50 packages in 3s

$ npm link
/usr/local/bin/ccusage-byobu -> /usr/local/lib/node_modules/ccusage-byobu/bin/ccusage-byobu.js

$ ccusage-byobu --test
✓ Node.js version: v18.17.0 (supported)
✓ ccusage command available
✓ byobu command available
✓ Configuration loaded successfully
✓ All tests passed
```

#### Pros:
- Full source code access
- Can modify and customize
- Immediate testing of changes
- Contribute back to project
- Debug capabilities

#### Cons:
- Requires git and development knowledge
- More complex setup
- Need to manage updates manually
- Larger disk footprint

#### When to use:
- Contributing to the project
- Need custom modifications
- Learning how the tool works
- Debugging issues
- Creating organization-specific versions

---

### 5. Manual Installation

Download and set up ccusage-byobu manually without using package managers.

#### Download and extract

```bash
# Create installation directory
mkdir -p ~/ccusage-byobu
cd ~/ccusage-byobu

# Download latest release (replace VERSION with actual version)
VERSION="1.0.6"
curl -L "https://registry.npmjs.org/ccusage-byobu/-/ccusage-byobu-${VERSION}.tgz" -o ccusage-byobu.tgz

# Extract the package
tar -xzf ccusage-byobu.tgz
cd package

# Install dependencies
npm install --production
```

#### Create executable wrapper

```bash
# Create a wrapper script
mkdir -p ~/.local/bin
cat > ~/.local/bin/ccusage-byobu << EOF
#!/bin/bash
cd "$(dirname "$(readlink -f "\$0")")/../ccusage-byobu/package"
node bin/ccusage-byobu.js "\$@"
EOF

chmod +x ~/.local/bin/ccusage-byobu

# Add to PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Manual byobu integration

```bash
# Install byobu integration
ccusage-byobu --install

# Set environment variables
cat >> ~/.bashrc << 'EOF'
export CLAUDE_PLAN_TYPE="max_5x"
export CLAUDE_CONFIG_DIR="$HOME/.claude"
export CCUSAGE_BYOBU_REFRESH="60"
EOF

source ~/.bashrc
```

#### Alternative: Direct file placement

```bash
# Create byobu script directory
mkdir -p ~/.byobu/bin

# Create the byobu status script directly
cat > ~/.byobu/bin/60_ccusage << 'EOF'
#!/bin/bash
cd ~/ccusage-byobu/package
node bin/ccusage-byobu.js 2>/dev/null || echo ""
EOF

chmod +x ~/.byobu/bin/60_ccusage
```

#### Verification

```bash
# Test the installation
ccusage-byobu --test

# Check if byobu script is working
ls -la ~/.byobu/bin/60_ccusage

# Test the byobu script directly
~/.byobu/bin/60_ccusage
```

#### Expected output:

```bash
$ curl -L "https://registry.npmjs.org/ccusage-byobu/-/ccusage-byobu-1.0.6.tgz" -o ccusage-byobu.tgz
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 15234  100 15234    0     0  45890      0 --:--:-- --:--:-- --:--:-- 45890

$ tar -xzf ccusage-byobu.tgz

$ cd package && npm install --production
added 3 packages in 1s

$ ccusage-byobu --test
✓ Manual installation test passed
```

#### Pros:
- No package manager dependencies
- Full control over installation location
- Works in restricted environments
- Can create custom deployment packages

#### Cons:
- Complex manual steps
- Manual update process
- Requires understanding of the file structure
- More error-prone

#### When to use:
- Package managers not available
- Restricted environments
- Creating deployment packages
- Corporate environments with specific requirements
- Want complete control over file placement

---

## Post-Installation Configuration

### Claude Plan Configuration

ccusage-byobu needs to know your Claude plan type for accurate usage calculations:

```bash
# Set your Claude plan type (required)
export CLAUDE_PLAN_TYPE="max_5x"
```

Valid plan types:
- `free` - Claude Free plan
- `pro` - Claude Pro plan  
- `max_5x` - Claude Max (5x) plan
- `max_20x` - Claude Max (20x) plan
- `enterprise` - Claude Enterprise plan

### Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `CLAUDE_PLAN_TYPE` | Your Claude plan type (required) | none | `max_5x` |
| `CLAUDE_CONFIG_DIR` | Claude configuration directory | `~/.claude` | `/custom/path` |
| `CCUSAGE_BYOBU_REFRESH` | Byobu refresh interval (seconds) | `60` | `30` |
| `CCUSAGE_BYOBU_DEBUG` | Enable debug output | `false` | `true` |

### Byobu Status Bar Configuration

The byobu integration creates scripts in `~/.byobu/bin/` with names like `60_ccusage` (where 60 is the refresh interval).

#### Custom refresh intervals

```bash
# 30-second refresh
ccusage-byobu --install --refresh=30

# 2-minute refresh  
ccusage-byobu --install --refresh=120
```

#### Multiple refresh intervals

You can have multiple refresh intervals installed simultaneously:

```bash
# Fast refresh for development
ccusage-byobu --install --refresh=10

# Standard refresh for normal use
ccusage-byobu --install --refresh=60

# List installed scripts
ls ~/.byobu/bin/*_ccusage
```

## Verification and Testing

### Basic functionality test

```bash
# Comprehensive installation test
ccusage-byobu --test
```

Expected output:
```
✓ Node.js version: v18.17.0 (supported)
✓ ccusage command available
✓ Environment variables configured
✓ Claude configuration directory exists
✓ byobu integration installed
✓ All tests passed
```

### Manual verification

```bash
# Show current usage
ccusage-byobu

# Show configuration
ccusage-byobu --config

# Check byobu script
~/.byobu/bin/60_ccusage

# Start byobu and check status bar
byobu
```

## Troubleshooting

### Common Installation Issues

#### Node.js version too old

```
Error: ccusage-byobu requires Node.js 18.0.0 or higher
```

**Solution:**
```bash
# Update Node.js using Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

#### NPM permission errors

```
Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
```

**Solution:**
```bash
# Configure npm to use home directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

#### ccusage command not found

```
Error: ccusage command not found
```

**Solution:**
```bash
# Install ccusage separately
npm install -g ccusage

# Or check if it's in PATH
which ccusage
```

#### Byobu integration not working

```
No ccusage metrics showing in byobu status bar
```

**Solutions:**
```bash
# Check if script exists and is executable
ls -la ~/.byobu/bin/*_ccusage

# Test script directly
~/.byobu/bin/60_ccusage

# Reinstall byobu integration
ccusage-byobu --uninstall
ccusage-byobu --install

# Check byobu configuration
byobu-config
```

#### Environment variables not set

```
Warning: CLAUDE_PLAN_TYPE not configured
```

**Solution:**
```bash
# Add to shell profile
echo 'export CLAUDE_PLAN_TYPE="max_5x"' >> ~/.bashrc
source ~/.bashrc
```

### Getting Help

If you encounter issues:

1. Run the diagnostic test: `ccusage-byobu --test`
2. Check the configuration: `ccusage-byobu --config`
3. Review the logs with debug mode: `CCUSAGE_BYOBU_DEBUG=true ccusage-byobu`
4. Check the [GitHub Issues](https://github.com/adawalli/ccusage-byobu/issues)
5. Review the [Usage Examples](USAGE_EXAMPLES.md) documentation

---

## Summary

| Method | Complexity | Best For | Byobu Integration |
|--------|------------|----------|-------------------|
| **One-liner installer** | Low | First-time users, complete setup | ✅ Automatic |
| **NPM global** | Medium | Node.js users, standard workflow | ✅ Manual setup |
| **NPX** | Low | Testing, occasional use | ⚠️ Limited |
| **Development** | High | Contributors, customization | ✅ Manual setup |
| **Manual** | High | Restricted environments | ✅ Manual setup |

Choose the installation method that best fits your needs and environment. The one-liner installer is recommended for most users, while npm global install offers more control for experienced Node.js users.