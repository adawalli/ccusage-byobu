# ccusage-byobu Troubleshooting Guide

A comprehensive troubleshooting reference for the ccusage-byobu project. This guide covers common error scenarios, integration issues, and solutions for optimal performance.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Installation Issues](#installation-issues)
3. [Configuration Problems](#configuration-problems)
4. [Runtime Errors](#runtime-errors)
5. [Display Issues](#display-issues)
6. [Performance Issues](#performance-issues)
7. [Claude Integration](#claude-integration)
8. [Environment Issues](#environment-issues)
9. [Debug and Logging](#debug-and-logging)
10. [Advanced Troubleshooting](#advanced-troubleshooting)

---

## Quick Diagnostics

**Run these commands first to quickly identify issues:**

```bash
# Test complete installation
ccusage-byobu --test

# Show current configuration
ccusage-byobu --config

# Check raw output
ccusage-byobu

# Enable debug mode for detailed info
CCUSAGE_BYOBU_DEBUG=1 ccusage-byobu
```

---

## Installation Issues

### Missing Dependencies

**Symptoms:**

- `ccusage command not found`
- `ccusage-byobu: command not found`
- `Node.js not found in PATH`

**Diagnostic Commands:**

```bash
# Check prerequisites
which node && node --version
which npm && npm --version
which ccusage && ccusage --version
which ccusage-byobu && ccusage-byobu --version
which byobu && byobu --version
```

**Solutions:**

1. **Install Node.js (version 18+):**

   ```bash
   # Using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18

   # Or download from https://nodejs.org/
   ```

2. **Install ccusage:**

   ```bash
   npm install -g ccusage

   # Verify installation
   ccusage --version
   ```

3. **Install ccusage-byobu:**

   ```bash
   npm install -g ccusage-byobu

   # Or from source
   git clone https://github.com/adawalli/ccusage-byobu.git
   cd ccusage-byobu
   npm install && npm link
   ```

4. **Install byobu:**

   ```bash
   # Ubuntu/Debian
   sudo apt-get install byobu

   # macOS
   brew install byobu

   # CentOS/RHEL
   sudo yum install byobu
   ```

### Permission Errors

**Symptoms:**

- `EACCES: permission denied`
- `EPERM: operation not permitted`
- `Permission denied creating byobu bin directory`

**Solutions:**

1. **Fix npm global permissions:**

   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   npm install -g ccusage-byobu
   ```

2. **Manual byobu directory creation:**

   ```bash
   mkdir -p ~/.byobu/bin
   chmod 755 ~/.byobu/bin
   ```

3. **Fix script permissions:**

   ```bash
   # Make scripts executable
   chmod +x ~/.byobu/bin/*_ccusage

   # Check permissions
   ls -la ~/.byobu/bin/
   ```

### Version Compatibility

**Symptoms:**

- `SyntaxError: Unexpected token 'import'`
- `ReferenceError: fetch is not defined`

**Solutions:**

1. **Update Node.js to version 18+:**

   ```bash
   node --version  # Should be 18.0.0 or higher

   # Update if needed
   nvm install 18 && nvm use 18
   ```

2. **Clear npm cache if needed:**
   ```bash
   npm cache clean --force
   npm install -g ccusage-byobu
   ```

---

## Configuration Problems

### Invalid Environment Variables

**Symptoms:**

- `Invalid value for CCUSAGE_BYOBU_THRESHOLD`
- `Invalid refresh interval`
- `Invalid plan type`

**Diagnostic Commands:**

```bash
# Check all ccusage-related variables
env | grep -E "CLAUDE|CCUSAGE"

# View configuration errors
ccusage-byobu --config
```

**Solutions:**

1. **Valid threshold values (0-100):**

   ```bash
   export CCUSAGE_BYOBU_THRESHOLD="80"  # Valid
   unset CCUSAGE_BYOBU_THRESHOLD="abc"  # Invalid
   ```

2. **Valid refresh intervals (5-3600 seconds):**

   ```bash
   export CCUSAGE_BYOBU_REFRESH="60"    # Valid
   unset CCUSAGE_BYOBU_REFRESH="0"      # Invalid (too low)
   unset CCUSAGE_BYOBU_REFRESH="5000"   # Invalid (too high)
   ```

3. **Valid plan types:**

   ```bash
   # Current valid plan types
   export CLAUDE_PLAN_TYPE="free"       # Valid
   export CLAUDE_PLAN_TYPE="pro"        # Valid
   export CLAUDE_PLAN_TYPE="max_5x"     # Valid
   export CLAUDE_PLAN_TYPE="max_20x"    # Valid
   export CLAUDE_PLAN_TYPE="enterprise" # Valid

   # Legacy plan migration
   unset CLAUDE_PLAN_TYPE="team"        # Legacy - use migration tool
   ```

### Legacy Plan Type Migration

**Symptoms:**

- `Legacy plan type detected: "team"`
- Plan migration warnings

**Solutions:**

1. **Use migration tool:**

   ```bash
   ./install-ccusage-byobu.sh --migrate
   ```

2. **Manual migration:**

   ```bash
   # Replace legacy 'team' plan
   unset CLAUDE_PLAN_TYPE
   export CLAUDE_PLAN_TYPE="max_5x"  # or "max_20x" for high usage

   # Update shell profile
   sed -i 's/CLAUDE_PLAN_TYPE="team"/CLAUDE_PLAN_TYPE="max_5x"/' ~/.bashrc
   source ~/.bashrc
   ```

### Configuration File Issues

**Symptoms:**

- `Configuration file not found`
- `Invalid JSON in configuration file`
- `Configuration validation errors`

**Solutions:**

1. **Fix JSON syntax:**

   ```bash
   # Validate JSON file
   cat ~/.ccusage-byobu.json | jq .

   # Example valid JSON
   cat > ~/.ccusage-byobu.json << 'EOF'
   {
     "CLAUDE_PLAN_TYPE": "pro",
     "CCUSAGE_BYOBU_FORMAT": "full",
     "CCUSAGE_BYOBU_COLORS": "true",
     "CCUSAGE_BYOBU_THRESHOLD": "80"
   }
   EOF
   ```

2. **Check file permissions:**

   ```bash
   chmod 644 ~/.ccusage-byobu.json
   ```

3. **Environment file format:**
   ```bash
   # Example .env format
   cat > ~/.ccusage.env << 'EOF'
   CLAUDE_PLAN_TYPE="pro"
   CCUSAGE_BYOBU_FORMAT="full"
   CCUSAGE_BYOBU_COLORS="true"
   CCUSAGE_BYOBU_THRESHOLD="80"
   EOF
   ```

---

## Runtime Errors

### ccusage Command Execution Failures

**Symptoms:**

- `Failed to execute ccusage command`
- `ccusage command timed out`
- `ccusage command failed with exit code N`

**Diagnostic Commands:**

```bash
# Test ccusage directly
ccusage blocks --json --offline

# Check ccusage configuration
ccusage --help

# Test with timeout
timeout 30s ccusage blocks --json --offline
```

**Solutions:**

1. **Command not found (ENOENT):**

   ```bash
   # Reinstall ccusage
   npm install -g ccusage

   # Check PATH
   echo $PATH | grep npm
   ```

2. **Permission denied (EACCES):**

   ```bash
   # Check ccusage permissions
   ls -la $(which ccusage)

   # Fix if needed
   chmod +x $(which ccusage)
   ```

3. **Timeout issues:**

   ```bash
   # Check network connectivity
   ping api.anthropic.com

   # Test offline mode
   ccusage blocks --json --offline

   # Increase timeout (30s default)
   # Code automatically handles timeouts
   ```

4. **API authentication issues:**

   ```bash
   # Check Claude credentials
   ccusage auth status

   # Re-authenticate if needed
   ccusage auth login
   ```

### JSON Parsing Errors

**Symptoms:**

- `Failed to parse ccusage JSON output`
- `Invalid ccusage output: expected JSON object`
- `Unexpected token in JSON`

**Diagnostic Commands:**

```bash
# Check raw ccusage output
ccusage blocks --json --offline > /tmp/ccusage-output.json
cat /tmp/ccusage-output.json

# Validate JSON
jq . /tmp/ccusage-output.json
```

**Solutions:**

1. **Corrupted output:**

   ```bash
   # Clear any cached data
   ccusage cache clear

   # Test fresh output
   ccusage blocks --json --offline
   ```

2. **Unexpected output format:**

   ```bash
   # Check ccusage version compatibility
   ccusage --version

   # Update if needed
   npm update -g ccusage
   ```

3. **Debug JSON parsing:**
   ```bash
   CCUSAGE_BYOBU_DEBUG=1 ccusage-byobu
   # Look for "JSON Parse Error" details
   ```

### Process and Memory Issues

**Symptoms:**

- `Process killed by signal SIGTERM`
- High memory usage
- Hanging processes

**Solutions:**

1. **Process cleanup:**

   ```bash
   # Kill hanging ccusage processes
   pkill -f ccusage

   # Restart byobu
   byobu kill-server && byobu
   ```

2. **Memory optimization:**

   ```bash
   # Disable debug mode
   unset CCUSAGE_BYOBU_DEBUG

   # Use compact format
   export CCUSAGE_BYOBU_FORMAT="compact"

   # Increase refresh interval
   export CCUSAGE_BYOBU_REFRESH="120"
   ```

---

## Display Issues

### Byobu Status Not Updating

**Symptoms:**

- Status bar shows old data
- No ccusage information in byobu
- Empty status bar section

**Diagnostic Commands:**

```bash
# Check installed scripts
ls -la ~/.byobu/bin/*ccusage*

# Test script manually
~/.byobu/bin/60_ccusage

# Check byobu status configuration
byobu-status --list
```

**Solutions:**

1. **Script not installed:**

   ```bash
   ccusage-byobu --install

   # Or reinstall with specific interval
   ccusage-byobu --uninstall
   ccusage-byobu --install --refresh=60
   ```

2. **Script not executable:**

   ```bash
   chmod +x ~/.byobu/bin/*_ccusage
   ```

3. **Byobu configuration:**

   ```bash
   # Restart byobu server
   byobu kill-server
   byobu

   # Check byobu status
   byobu-status
   ```

4. **Multiple script conflicts:**

   ```bash
   # List all installed scripts
   ls ~/.byobu/bin/*_ccusage

   # Remove conflicting scripts
   ccusage-byobu --uninstall-all
   ccusage-byobu --install --refresh=60
   ```

### Color and Formatting Issues

**Symptoms:**

- No colors in output
- Malformed progress bars
- Incorrect text formatting

**Solutions:**

1. **Terminal color support:**

   ```bash
   # Test color support
   echo $TERM

   # Force colors
   export CCUSAGE_BYOBU_COLORS="true"

   # Or disable colors
   export CCUSAGE_BYOBU_COLORS="false"
   ```

2. **Progress bar formatting:**

   ```bash
   # Switch to compact format if full format has issues
   export CCUSAGE_BYOBU_FORMAT="compact"

   # Test output
   ccusage-byobu
   ```

3. **Font and encoding issues:**

   ```bash
   # Check locale
   locale

   # Set UTF-8 if needed
   export LC_ALL=en_US.UTF-8
   export LANG=en_US.UTF-8
   ```

### Incorrect Usage Data

**Symptoms:**

- Wrong time remaining
- Incorrect cost calculations
- Missing session data

**Solutions:**

1. **Session synchronization:**

   ```bash
   # Refresh ccusage data
   ccusage sync

   # Clear cache
   ccusage cache clear
   ```

2. **Plan type mismatch:**

   ```bash
   # Verify plan type
   ccusage account info

   # Update environment
   export CLAUDE_PLAN_TYPE="your_actual_plan"
   ```

---

## Performance Issues

### Slow Response Times

**Symptoms:**

- Long delays before status updates
- High CPU usage
- Frequent timeouts

**Diagnostic Commands:**

```bash
# Benchmark performance
ccusage-byobu-benchmark

# Check with debug info
CCUSAGE_BYOBU_DEBUG=1 ccusage-byobu
```

**Solutions:**

1. **Enable caching:**

   ```bash
   # Enable caching for interactive use
   export CCUSAGE_ENABLE_CACHE="1"

   # Adjust cache settings
   export CCUSAGE_BYOBU_CACHE_CLEANUP_INTERVAL="30000"
   export CCUSAGE_BYOBU_CACHE_MAX_KEYS="100"
   ```

2. **Optimize refresh interval:**

   ```bash
   # Increase refresh interval
   ccusage-byobu --uninstall
   ccusage-byobu --install --refresh=120
   ```

3. **Reduce processing overhead:**
   ```bash
   export CCUSAGE_BYOBU_FORMAT="compact"
   export CCUSAGE_BYOBU_COLORS="false"
   unset CCUSAGE_BYOBU_DEBUG
   ```

### Memory Usage Problems

**Symptoms:**

- High memory consumption
- Memory leaks
- System slowdown

**Solutions:**

1. **Monitor memory usage:**

   ```bash
   # Check memory usage
   CCUSAGE_BYOBU_DEBUG=1 ccusage-byobu --test

   # Look for memory growth patterns
   ```

2. **Cache optimization:**

   ```bash
   # Limit cache size
   export CCUSAGE_BYOBU_CACHE_MAX_KEYS="50"
   export CCUSAGE_BYOBU_CACHE_CLEANUP_INTERVAL="15000"

   # Or disable caching entirely
   unset CCUSAGE_ENABLE_CACHE
   ```

3. **Process management:**

   ```bash
   # Kill old processes
   pkill -f ccusage-byobu

   # Restart byobu
   byobu kill-server && byobu
   ```

### Cache Performance Issues

**Symptoms:**

- Cache misses despite enabled caching
- Inconsistent performance
- Cache-related errors

**Solutions:**

1. **Cache configuration:**

   ```bash
   # Enable cache explicitly
   export CCUSAGE_ENABLE_CACHE="1"

   # Check cache stats
   CCUSAGE_BYOBU_DEBUG=1 ccusage-byobu --test | grep -A 10 "Cache Statistics"
   ```

2. **Cache troubleshooting:**

   ```bash
   # Clear cache
   rm -rf ~/.cache/ccusage* 2>/dev/null

   # Restart with fresh cache
   ccusage-byobu
   ```

---

## Claude Integration

### API Key and Authentication Issues

**Symptoms:**

- `Authentication failed`
- `API key not found`
- `Unauthorized` errors

**Solutions:**

1. **Check Claude authentication:**

   ```bash
   # Check auth status
   ccusage auth status

   # Re-authenticate
   ccusage auth login
   ```

2. **API key configuration:**

   ```bash
   # Check if API key is set
   echo $CLAUDE_API_KEY

   # Or check ccusage config
   ccusage config list
   ```

3. **Configuration directory:**

   ```bash
   # Check Claude config directory
   echo $CLAUDE_CONFIG_DIR
   ls -la ~/.claude/

   # Set if needed
   export CLAUDE_CONFIG_DIR="$HOME/.claude"
   ```

### Plan Type and Limit Issues

**Symptoms:**

- Wrong usage limits displayed
- Incorrect plan type warnings
- Usage calculations don't match Claude Code

**Solutions:**

1. **Verify actual plan:**

   ```bash
   # Check your actual Claude plan
   ccusage account info

   # Update environment variable
   export CLAUDE_PLAN_TYPE="your_actual_plan_type"
   ```

2. **Plan type validation:**

   ```bash
   # Valid plan types (2024)
   export CLAUDE_PLAN_TYPE="free"       # Free tier
   export CLAUDE_PLAN_TYPE="pro"        # Pro plan
   export CLAUDE_PLAN_TYPE="max_5x"     # Max 5x plan
   export CLAUDE_PLAN_TYPE="max_20x"    # Max 20x plan
   export CLAUDE_PLAN_TYPE="enterprise" # Enterprise
   ```

3. **Usage sync issues:**

   ```bash
   # Force usage sync
   ccusage sync --force

   # Clear local cache
   ccusage cache clear
   ```

### Rate Limiting

**Symptoms:**

- `Rate limit exceeded`
- Frequent request failures
- Slow API responses

**Solutions:**

1. **Increase refresh interval:**

   ```bash
   # Reduce API call frequency
   ccusage-byobu --uninstall
   ccusage-byobu --install --refresh=300  # 5 minutes
   ```

2. **Enable caching:**

   ```bash
   export CCUSAGE_ENABLE_CACHE="1"
   ```

3. **Optimize usage:**
   ```bash
   # Use offline mode when possible
   ccusage blocks --json --offline
   ```

---

## Environment Issues

### Operating System Compatibility

**macOS Issues:**

```bash
# Install dependencies via Homebrew
brew install node npm byobu

# Fix PATH issues
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Linux Distribution Issues:**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install nodejs npm byobu

# CentOS/RHEL
sudo yum install nodejs npm
sudo yum install byobu

# Arch Linux
sudo pacman -S nodejs npm byobu
```

**Windows (WSL) Issues:**

```bash
# Install Node.js in WSL
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install byobu
sudo apt-get install byobu
```

### Shell Compatibility

**Bash Configuration (`~/.bashrc`):**

```bash
# Add to ~/.bashrc
export CLAUDE_PLAN_TYPE="pro"
export CCUSAGE_BYOBU_FORMAT="full"
export CCUSAGE_BYOBU_REFRESH="60"
export PATH="$HOME/.npm-global/bin:$PATH"
```

**Zsh Configuration (`~/.zshrc`):**

```bash
# Add to ~/.zshrc
export CLAUDE_PLAN_TYPE="pro"
export CCUSAGE_BYOBU_FORMAT="full"
export CCUSAGE_BYOBU_REFRESH="60"
export PATH="$HOME/.npm-global/bin:$PATH"
```

**Fish Configuration (`~/.config/fish/config.fish`):**

```fish
# Add to config.fish
set -x CLAUDE_PLAN_TYPE "pro"
set -x CCUSAGE_BYOBU_FORMAT "full"
set -x CCUSAGE_BYOBU_REFRESH "60"
set -x PATH "$HOME/.npm-global/bin" $PATH
```

### tmux vs byobu Compatibility

**tmux Integration:**

```bash
# Add to ~/.tmux.conf
set -g status-right '#(ccusage-byobu 2>/dev/null) | %Y-%m-%d %H:%M'
set -g status-interval 60

# Reload config
tmux source-file ~/.tmux.conf
```

**byobu-tmux Backend:**

```bash
# Check byobu backend
byobu-launcher-install

# Switch to tmux backend if needed
byobu-select-backend tmux
```

---

## Debug and Logging

### Enable Debug Mode

```bash
# Enable comprehensive debugging
export CCUSAGE_BYOBU_DEBUG="1"

# Run with debug output
ccusage-byobu 2>&1 | tee debug.log

# Test with debug info
ccusage-byobu --test 2>&1 | tee test-debug.log
```

### Performance Debugging

```bash
# Run performance benchmark
ccusage-byobu-benchmark all --iterations=20

# Check startup performance
CCUSAGE_BYOBU_DEBUG=1 ccusage-byobu

# Monitor memory usage
CCUSAGE_BYOBU_DEBUG=1 ccusage-byobu --test | grep -A 20 "Memory Profiling"
```

### Log Analysis

**Common Debug Output Patterns:**

1. **Cache Performance:**

   ```
   Cache hit - retrieved cached result in 0.123ms
   Cache miss - executed ccusage command in 95.23ms
   ```

2. **JSON Parsing:**

   ```
   JSON parsed in 2.15ms
   JSON size: 1.23KB
   Parse throughput: 572.09KB/ms
   ```

3. **Memory Usage:**

   ```
   Startup memory: RSS 25MB, Heap 15MB
   Memory growth: 3MB RSS, 1.2MB Heap
   ```

4. **Performance Summary:**
   ```
   Performance Summary:
     Session duration: 12.3s
     Memory: Current 25MB RSS, Peak 28MB RSS
   ```

### Log File Locations

```bash
# Check common log locations
ls -la ~/.byobu/
ls -la ~/.cache/ccusage*
ls -la /tmp/ccusage*

# Byobu logs
ls -la ~/.byobu/.tmux.conf
cat ~/.byobu/status
```

---

## Advanced Troubleshooting

### Network and Connectivity

**Test connectivity:**

```bash
# Test API connectivity
curl -I https://api.anthropic.com

# Test ccusage API calls
ccusage auth status

# Test with different timeouts
timeout 10s ccusage blocks --json --offline
```

**Proxy configuration:**

```bash
# Set proxy if needed
export HTTP_PROXY="http://proxy.company.com:8080"
export HTTPS_PROXY="http://proxy.company.com:8080"

# Test with proxy
ccusage blocks --json --offline
```

### Process Debugging

**Check running processes:**

```bash
# Find ccusage processes
ps aux | grep ccusage

# Check byobu processes
ps aux | grep byobu

# Monitor process lifecycle
strace -e trace=process ccusage-byobu
```

**Resource monitoring:**

```bash
# Monitor during execution
top -p $(pgrep ccusage)

# Check file descriptors
lsof -p $(pgrep ccusage)

# Monitor system calls
strace -c ccusage-byobu
```

### File System Issues

**Permission debugging:**

```bash
# Check file permissions
ls -la ~/.byobu/bin/
ls -la $(which ccusage)
ls -la $(which ccusage-byobu)

# Check directory permissions
ls -ld ~/.byobu/
ls -ld ~/.npm-global/

# Test file access
test -r ~/.byobu/bin/60_ccusage && echo "readable" || echo "not readable"
test -x ~/.byobu/bin/60_ccusage && echo "executable" || echo "not executable"
```

**Disk space issues:**

```bash
# Check disk space
df -h ~
df -h /tmp

# Check for large cache files
du -sh ~/.cache/
du -sh ~/.npm/
```

### Recovery Procedures

**Complete reset:**

```bash
# 1. Remove all ccusage-byobu components
ccusage-byobu --uninstall-all
npm uninstall -g ccusage-byobu

# 2. Clear caches
rm -rf ~/.cache/ccusage* 2>/dev/null
npm cache clean --force

# 3. Remove configuration
rm -f ~/.ccusage-byobu.json ~/.ccusage.env

# 4. Reinstall
npm install -g ccusage-byobu
ccusage-byobu --test
```

**Byobu reset:**

```bash
# Reset byobu configuration
mv ~/.byobu ~/.byobu.backup
byobu-config

# Reinstall ccusage integration
ccusage-byobu --install
```

**Environment reset:**

```bash
# Clear all ccusage environment variables
unset $(env | grep -E "^(CLAUDE|CCUSAGE)" | cut -d= -f1)

# Reload shell configuration
source ~/.bashrc  # or ~/.zshrc
```

---

## Getting Help

### Support Resources

1. **Built-in diagnostics:**

   ```bash
   ccusage-byobu --help
   ccusage-byobu --test
   ccusage-byobu --config
   ```

2. **Community support:**
   - GitHub Issues: [ccusage-byobu/issues](https://github.com/adawalli/ccusage-byobu/issues)
   - Documentation: [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)

3. **Upstream tools:**
   - ccusage: [anthropics/ccusage](https://github.com/anthropics/ccusage)
   - byobu: [byobu.org](https://byobu.org/)

### Creating Bug Reports

**Gather information:**

```bash
# System information
uname -a
node --version
npm --version
ccusage --version
ccusage-byobu --version 2>/dev/null || echo "not installed"

# Configuration
ccusage-byobu --config

# Test results
ccusage-byobu --test

# Debug output
CCUSAGE_BYOBU_DEBUG=1 ccusage-byobu 2>&1 | head -50
```

**Include in bug report:**

- Operating system and version
- Node.js and npm versions
- Complete error messages
- Steps to reproduce
- Configuration settings
- Debug output (if applicable)

---

_This troubleshooting guide covers the most common issues. For additional help, run `ccusage-byobu --test` to diagnose your specific setup._
