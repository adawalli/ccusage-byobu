# Frequently Asked Questions (FAQ)

## Table of Contents
- [General Questions](#general-questions)
- [Installation Questions](#installation-questions)
- [Configuration Questions](#configuration-questions)
- [Usage Questions](#usage-questions)
- [Integration Questions](#integration-questions)
- [Performance Questions](#performance-questions)
- [Troubleshooting Questions](#troubleshooting-questions)
- [Plan & Billing Questions](#plan--billing-questions)
- [Development Questions](#development-questions)

---

## General Questions

### What is ccusage-byobu?
ccusage-byobu is a command-line tool that displays your Claude AI API usage statistics directly in your byobu/tmux status bar. It shows read/write tokens, caching metrics, and cost tracking in real-time, helping you monitor your API consumption efficiently.

### Why should I use ccusage-byobu instead of just checking the Anthropic dashboard?
- **Real-time visibility**: See usage as you work without leaving your terminal
- **Immediate feedback**: Know when you're approaching limits before hitting them
- **Cost awareness**: Track expenses as they accumulate
- **Cache efficiency**: Monitor how well you're utilizing prompt caching
- **Workflow integration**: No context switching to check usage

### How does it get my usage data?
The tool uses the official Anthropic API to fetch usage statistics from your organization. It requires your API key and organization ID to authenticate and retrieve the data. All data is fetched directly from Anthropic's servers - nothing is stored or transmitted elsewhere.

### Is my API key safe?
Yes, your API key is only used to authenticate with Anthropic's API and is never transmitted to any third-party services. The tool runs entirely on your local machine. For maximum security, use environment variables rather than hardcoding keys in configuration files.

### Does it work with Claude.ai (web interface)?
No, ccusage-byobu only tracks API usage through the Anthropic API. It doesn't monitor usage through the Claude.ai web interface, Claude mobile apps, or other interfaces.

---

## Installation Questions

### Which installation method should I choose?
- **npm (global)**: Best for most users - simple, automatic updates, works everywhere
- **npm (local)**: Good for project-specific installations or testing
- **Homebrew**: Ideal for macOS users who prefer brew for package management
- **Direct download**: Best for air-gapped systems or when you need a specific version
- **From source**: For developers who want to modify or contribute to the project

### Why is the npm installation failing?
Common causes:
1. **Permission issues**: Use a Node version manager (nvm, fnm) instead of sudo
2. **Old Node.js**: Requires Node.js 16+. Check with `node --version`
3. **Network issues**: Try using a different npm registry or check your proxy settings

### Can I install it without npm/Node.js?
Yes! Use the direct download method:
```bash
curl -sSL https://github.com/adammcdonagh/ccusage-byobu/releases/latest/download/ccusage-byobu-linux-x64.tar.gz | tar xz
sudo mv ccusage-byobu /usr/local/bin/
```

### How do I know if it's installed correctly?
Run `ccusage --version`. If you see a version number, it's installed. If you get "command not found", check your PATH or reinstall.

### Do I need to install byobu separately?
Yes, byobu must be installed separately. ccusage-byobu integrates with existing byobu installations. Install byobu first using your system's package manager.

---

## Configuration Questions

### What's the minimal configuration needed?
Just two things:
```bash
export ANTHROPIC_API_KEY="your-api-key"
export ANTHROPIC_ORGANIZATION_ID="your-org-id"
```
Everything else has sensible defaults.

### Where should I put my configuration?
- **Environment variables**: In `~/.bashrc`, `~/.zshrc`, or `~/.config/ccusage/config`
- **Byobu widget**: Create `~/.byobu/bin/5_ccusage`
- **Config file**: Use `~/.config/ccusage/config.json` for advanced settings

### How do I find my Organization ID?
1. Log into [console.anthropic.com](https://console.anthropic.com)
2. Go to Settings → API Keys
3. Your Organization ID is displayed at the top of the page

### Can I track multiple organizations?
Not simultaneously in a single status bar, but you can:
- Switch between organizations by changing environment variables
- Run multiple instances with different configs
- Use the direct CLI with different `--organization-id` flags

### What's the best update interval?
- **Default (60s)**: Good balance of freshness and API calls
- **30s**: For active development with frequent API calls
- **120s+**: For cost-conscious users or light usage
- **300s+**: For monitoring long-running processes

### How do I customize the display format?
The display format uses templates in the configuration file. See the [Usage Examples](./usage-examples.md#custom-display-formats) for detailed formatting options.

---

## Usage Questions

### What do the different numbers mean?
```
Claude: Max/$49.32 ⚡4.2K/72.8K$0.95 💵48.37 📊52%
```
- `Max/$49.32`: Your plan and current month's total cost
- `⚡4.2K/72.8K$0.95`: Cache read/write tokens and cache savings
- `💵48.37`: Total API costs this month
- `📊52%`: Cache hit rate

### Why does my usage show as $0.00?
- You might be on the Free plan (shows as "Free" instead of cost)
- No API calls made yet this month
- Incorrect organization ID
- API key lacks proper permissions

### How accurate is the cost calculation?
Very accurate - costs are calculated by Anthropic's API, not estimated by the tool. The displayed costs match what you'll see on your invoice.

### Can I see historical usage?
The tool shows current month data only. For historical data:
- Check the Anthropic dashboard
- Use `ccusage --format json` to log data over time
- Set up your own logging solution

### How do I reset the cache?
```bash
ccusage --cache-dir ~/.cache/ccusage --clear-cache
```
Or simply delete the cache directory:
```bash
rm -rf ~/.cache/ccusage
```

---

## Integration Questions

### Does it work with tmux (without byobu)?
Yes! See the [Usage Examples](./usage-examples.md#tmux-only-setup) for tmux configuration. The tool outputs text that can be used in any status bar system.

### Can I use it with other terminal multiplexers?
Yes, any system that can run shell commands periodically:
- **GNU Screen**: Add to `.screenrc`
- **Zellij**: Use in status bar configuration
- **Custom scripts**: Parse the output programmatically

### Does it work in WSL/WSL2?
Yes, it works perfectly in WSL. Install it the same way as on Linux. Make sure your environment variables are set in your WSL shell configuration.

### Can I use it with oh-my-zsh/starship/powerlevel10k?
Yes, but it's designed for persistent status bars (byobu/tmux). For shell prompts, consider using it as an on-demand command rather than in your prompt.

### How do I integrate it with monitoring systems?
Use JSON output mode:
```bash
ccusage --format json | jq '.usage_usd'
```
This makes it easy to pipe into monitoring tools, log aggregators, or alerting systems.

---

## Performance Questions

### How much memory does it use?
Typically 30-50MB, including:
- Node.js runtime (~25MB)
- Application code (~5MB)
- Cache data (<1MB)

### Does it slow down my terminal?
No noticeable impact. The tool:
- Runs asynchronously in the background
- Updates infrequently (default 60 seconds)
- Uses minimal CPU when not updating

### How many API calls does it make?
- One API call per update interval
- Default: ~1,440 calls/month (every 60 seconds)
- Cached responses prevent redundant calls

### Is the caching effective?
Very effective:
- 5-minute cache prevents rapid repeated calls
- File-based cache survives restarts
- Typically 50-90% cache hit rate in normal usage

### Can I reduce API calls further?
Yes:
- Increase update interval: `CCUSAGE_UPDATE_INTERVAL=300`
- Use on-demand updates: Remove from status bar, run manually
- Enable aggressive caching (increase cache TTL)

---

## Troubleshooting Questions

### Why does it show "Invalid Key 🔒"?
Your API key is invalid or not set correctly:
1. Check the key format (should start with `sk-ant-api`)
2. Verify environment variable: `echo $ANTHROPIC_API_KEY`
3. Ensure no extra spaces or quotes
4. Regenerate the key if needed

### Why is there no output in byobu?
1. Check if the script is executable: `chmod +x ~/.byobu/bin/5_ccusage`
2. Verify it's running: `~/.byobu/bin/5_ccusage`
3. Check logs: Look for errors in `/tmp/ccusage.log`
4. Ensure environment variables are available to byobu

### The cache savings show as $0.00, why?
- You're not using cache-eligible models (Claude 3.5 Sonnet, Claude 3 Haiku)
- Your prompts are too short for caching benefits
- Cache tokens aren't being reused effectively
- API calls are too varied for cache hits

### Why do I get "process not found" errors?
- The tool might be crashing. Check logs in `/tmp/ccusage-errors.log`
- Node.js might not be in byobu's PATH
- Try using full paths in your byobu script

### Updates stopped working suddenly?
1. Check if your API key expired
2. Verify internet connectivity
3. Clear the cache: `rm -rf ~/.cache/ccusage`
4. Check if Anthropic's API is down

---

## Plan & Billing Questions

### Which Claude plans are supported?
All plans are supported:
- Free
- Pro Build ($5)
- Scale ($25)
- Custom (Enterprise)

Plan limits are displayed when known.

### How does it know my plan type?
Starting from v1.4.0, the tool infers your plan from billing data. It also supports custom plan names via `ANTHROPIC_PLAN_NAME` environment variable.

### Why doesn't it show my usage limits?
- Free and some custom plans don't report limits via API
- The tool only shows what Anthropic's API provides
- Check the Anthropic dashboard for complete limit information

### Is the cost tracking accurate for different models?
Yes, the tool uses Anthropic's official pricing:
- Input/output tokens priced per model
- Cache discounts applied automatically
- Batch API pricing reflected accurately

### Can I set up usage alerts?
Not directly in the tool, but you can:
- Parse JSON output for monitoring scripts
- Set up shell aliases to check thresholds
- Use the data in external alerting systems

---

## Development Questions

### How can I contribute?
1. Fork the repository on GitHub
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request
See [CONTRIBUTING.md](https://github.com/adammcdonagh/ccusage-byobu/blob/main/CONTRIBUTING.md) for details.

### Can I customize the display colors?
Currently, colors are hardcoded, but you can:
- Modify the source code
- Use terminal color codes in your wrapper script
- Submit a PR to add color configuration

### How do I add support for new shells?
The tool is shell-agnostic (outputs text), but for auto-setup:
1. Add shell detection logic
2. Create setup templates
3. Submit a PR with the new integration

### Can I use this as a library?
Yes! Install locally and import:
```javascript
const ccusage = require('ccusage-byobu');
```
See the source code for available functions.

### Where can I report bugs?
- GitHub Issues: [Create an issue](https://github.com/adammcdonagh/ccusage-byobu/issues)
- Include: OS, Node version, error messages, and steps to reproduce
- Check existing issues first

### How do I debug issues?
1. Run directly: `ccusage --verbose`
2. Check logs: `/tmp/ccusage.log`
3. Test components: `ccusage --format json`
4. Verify environment: `ccusage --show-config`

---

## Quick Reference

### Essential Commands
```bash
# Test installation
ccusage --version

# Check current usage
ccusage

# Clear cache
ccusage --clear-cache

# Debug issues
ccusage --verbose

# JSON output
ccusage --format json
```

### Essential Environment Variables
```bash
ANTHROPIC_API_KEY="sk-ant-api..."
ANTHROPIC_ORGANIZATION_ID="org-..."
CCUSAGE_UPDATE_INTERVAL="60"
CCUSAGE_DISPLAY_FORMAT="default"
```

### Useful File Locations
- Widget script: `~/.byobu/bin/5_ccusage`
- Cache: `~/.cache/ccusage/`
- Config: `~/.config/ccusage/config.json`
- Logs: `/tmp/ccusage.log`

---

For more detailed information, see:
- [Installation Guide](./installation.md)
- [Usage Examples](./usage-examples.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [README](../README.md)