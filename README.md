# ccusage-byobu

A CLI tool for visualizing Claude Code usage metrics with byobu/tmux integration. Display real-time API usage, remaining session time, and costs directly in your terminal status bar.

## 🚀 Project Overview

`ccusage-byobu` provides seamless integration between [ccusage](https://github.com/anthropics/ccusage) and byobu/tmux status bars. It offers real-time monitoring of Claude Code API usage with persistent caching, colored status indicators, and automated byobu integration.

## ✨ Key Features

- **Real-time Usage Tracking**: Monitor Claude Code API usage, session time, and costs
- **Persistent Cache**: Intelligent caching system for improved performance and reduced API calls
- **Byobu/Tmux Integration**: Automated installation and configuration for byobu status bars
- **Color-coded Status**: Visual indicators based on usage thresholds (green → yellow → red)
- **Flexible Configuration**: Customizable display formats, refresh intervals, and thresholds
- **Performance Optimized**: Fast startup times with lazy loading and memory efficiency
- **Error Handling**: Graceful fallbacks and comprehensive error reporting

## 📊 Status Bar Preview

```
# Compact format (default)
2h45m $0.87

# Full format with progress bar
[████████░░] 2h45m $0.87

# Color-coded examples:
🟢 4h20m $0.23  # Green: plenty of time remaining
🟡 1h15m $2.45  # Yellow: moderate usage
🔴 12m $4.78    # Red: high usage/low time
```

## 📋 Requirements

- **Node.js** 18.0.0 or higher
- **ccusage** CLI tool ([installation guide](https://github.com/anthropics/ccusage))
- **byobu** or **tmux** (optional, for status bar integration)
- Active Claude Code session with API access

## 🏃 Quick Start

### Installation

```bash
# Install from npm (recommended)
npm install -g ccusage-byobu

# Or clone and install locally
git clone https://github.com/adawalli/ccusage-byobu.git
cd ccusage-byobu
npm install
npm link  # Makes ccusage-byobu globally available
```

### Basic Usage

```bash
# Display current usage in terminal
ccusage-byobu

# Test installation and dependencies
ccusage-byobu --test

# Show current configuration
ccusage-byobu --config
```

### Byobu Integration

```bash
# Install byobu status script (60-second refresh)
ccusage-byobu --install

# Install with custom refresh interval
ccusage-byobu --install --refresh=30

# Remove byobu integration
ccusage-byobu --uninstall

# Remove all ccusage scripts
ccusage-byobu --uninstall-all
```

## ⚙️ Configuration Preview

The tool supports various configuration options:

- **Display Format**: `compact` (default) or `full` with progress bar
- **Color Coding**: Enable/disable color-coded status indicators
- **Usage Threshold**: Customize when colors change (default: 75%)
- **Refresh Interval**: Set byobu update frequency (5-3600 seconds)
- **Cache Settings**: Control caching behavior for performance

_For comprehensive configuration options and examples, see [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)._

## 🔧 How It Works

1. **Data Collection**: Executes `ccusage blocks --json --offline` to gather usage metrics
2. **Intelligent Caching**: Caches results for 15 seconds to minimize API calls and improve performance
3. **Processing**: Parses JSON output and calculates remaining time, usage percentages, and costs
4. **Display Logic**: Applies color coding and formatting based on configuration
5. **Byobu Integration**: Installed scripts automatically refresh at specified intervals

### Technical Architecture

- **ES Modules**: Modern JavaScript with dynamic imports for lazy loading
- **Performance Tracking**: Built-in profiling and memory usage monitoring
- **Error Resilience**: Comprehensive error handling with graceful fallbacks
- **Process Management**: Proper cleanup to prevent byobu hanging

## 📚 Documentation and Examples

### Comprehensive Usage Guide

For detailed examples, configurations, and integrations, see **[USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)** which includes:

- **Installation Examples**: Automated installer, manual setup, development installation
- **Configuration Examples**: Environment variables, config files, shell profiles
- **Byobu Integration**: Multiple refresh intervals, custom scripts, troubleshooting
- **Advanced Configuration**: Different Claude tiers, development vs production
- **Performance Tuning**: Caching, benchmarking, optimization recommendations
- **Integrations**: tmux, Starship prompt, custom displays
- **Troubleshooting**: Common issues and solutions

### Quick Examples

```bash
# Basic usage monitoring
ccusage-byobu

# Quick interactive setup
./examples/scripts/quick-setup.sh

# Load development configuration
source examples/configurations/development.env
ccusage-byobu --install

# Test with performance profiling
ccusage-byobu --test

# Custom configuration file
ccusage-byobu --config=examples/configurations/team-shared.json
```

### Example Configurations

The `examples/` directory contains ready-to-use configurations:

- `examples/configurations/development.env` - Fast refresh, debug enabled
- `examples/configurations/production.env` - Conservative settings
- `examples/configurations/free-tier.env` - Optimized for free Claude plan
- `examples/byobu-scripts/` - Custom byobu status scripts
- `examples/integrations/` - tmux and Starship prompt integration

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for:

- Code style and formatting requirements
- Commit message conventions
- Testing procedures
- Pull request process

The project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for git hooks
- **Conventional Commits** for commit messages

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [ccusage](https://github.com/anthropics/ccusage) - Claude Code usage tracking
- [byobu](https://byobu.org/) - Text-based window manager and terminal multiplexer
- [tmux](https://github.com/tmux/tmux) - Terminal multiplexer

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/adawalli/ccusage-byobu/issues)
- **Documentation**: Run `ccusage-byobu --help` for command-line help
- **Testing**: Use `ccusage-byobu --test` to diagnose installation issues

---

_Built with ❤️ for the Claude Code community_
