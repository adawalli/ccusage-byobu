# ccusage-byobu Examples

This directory contains practical examples and configurations for ccusage-byobu. These examples demonstrate various usage patterns, integrations, and customizations.

## Directory Structure

```
examples/
├── README.md                           # This file
├── byobu-status-integration.sh         # Basic byobu integration example
├── configurations/                     # Environment-specific configs
│   ├── development.env                 # Development environment setup
│   ├── production.env                  # Production environment setup
│   ├── free-tier.env                   # Free tier optimized config
│   └── team-shared.json                # Shared team configuration
├── byobu-scripts/                      # Custom byobu status scripts
│   ├── conditional-display.sh          # Smart conditional display
│   ├── custom-format.sh                # Custom output formatting
│   └── environment-aware.sh            # Environment-specific display
├── integrations/                       # Integration with other tools
│   ├── tmux-integration.conf           # tmux status bar integration
│   └── starship-integration.toml       # Starship prompt integration
└── scripts/                           # Utility scripts
    └── quick-setup.sh                  # Quick interactive setup
```

## Quick Start Examples

### 1. Load a Pre-configured Environment

```bash
# Development environment with fast refresh and debug
source examples/configurations/development.env
ccusage-byobu --install

# Production environment with conservative settings
source examples/configurations/production.env
ccusage-byobu --install

# Free tier optimized configuration
source examples/configurations/free-tier.env
ccusage-byobu --install
```

### 2. Use Custom Byobu Scripts

```bash
# Install a smart conditional display script
cp examples/byobu-scripts/conditional-display.sh ~/.byobu/bin/65_ccusage_smart
chmod +x ~/.byobu/bin/65_ccusage_smart

# Install a custom formatted display
cp examples/byobu-scripts/custom-format.sh ~/.byobu/bin/66_ccusage_custom
chmod +x ~/.byobu/bin/66_ccusage_custom

# Install environment-aware display
cp examples/byobu-scripts/environment-aware.sh ~/.byobu/bin/67_ccusage_env
chmod +x ~/.byobu/bin/67_ccusage_env
```

### 3. Quick Interactive Setup

```bash
# Run the interactive setup script
./examples/scripts/quick-setup.sh
```

## Configuration Examples

### Environment Variables

Each configuration file demonstrates different approaches:

- **development.env**: Fast refresh (15s), debug enabled, caching enabled
- **production.env**: Slower refresh (120s), compact format, debug disabled
- **free-tier.env**: Very slow refresh (300s), minimal processing, high threshold
- **team-shared.json**: Balanced settings for team environments

### JSON Configuration

The `team-shared.json` shows how to use JSON format for shared team settings:

```bash
ccusage-byobu --config=examples/configurations/team-shared.json
```

## Integration Examples

### tmux Integration

Add ccusage-byobu to your tmux status bar:

```bash
# Add to ~/.tmux.conf
cat examples/integrations/tmux-integration.conf >> ~/.tmux.conf
tmux source-file ~/.tmux.conf
```

### Starship Prompt Integration

Add Claude usage to your Starship prompt:

```bash
# Add to ~/.config/starship.toml
cat examples/integrations/starship-integration.toml >> ~/.config/starship.toml
```

## Custom Script Examples

### Conditional Display

The `conditional-display.sh` script only shows usage when Claude is actively running:

- Detects Claude Code processes
- Checks for active Claude sessions
- Shows different indicators based on activity level

### Custom Format

The `custom-format.sh` script transforms the output with emoji indicators:

- 🟢 for low usage (< 60%)
- 🟡 for medium usage (60-80%)
- 🔴 for high usage (> 80%)
- ⚡ for compact format
- 🤖 for fallback display

### Environment Aware

The `environment-aware.sh` script automatically adjusts settings based on environment:

- Detects production/staging/development environments
- Loads appropriate configurations automatically
- Adds environment prefixes to output

## Usage Patterns

### Development Workflow

1. Load development configuration:
   ```bash
   source examples/configurations/development.env
   ```

2. Install with fast refresh:
   ```bash
   ccusage-byobu --install
   ```

3. Use conditional display for active development:
   ```bash
   cp examples/byobu-scripts/conditional-display.sh ~/.byobu/bin/65_ccusage_smart
   chmod +x ~/.byobu/bin/65_ccusage_smart
   ```

### Production Deployment

1. Load production configuration:
   ```bash
   source examples/configurations/production.env
   ```

2. Install with conservative settings:
   ```bash
   ccusage-byobu --install
   ```

3. Use environment-aware script for multi-environment setups:
   ```bash
   cp examples/byobu-scripts/environment-aware.sh ~/.byobu/bin/67_ccusage_env
   chmod +x ~/.byobu/bin/67_ccusage_env
   ```

### Team Environment

1. Share configuration file:
   ```bash
   # On shared storage
   ccusage-byobu --config=/shared/team/ccusage-config.json
   ```

2. Use consistent refresh intervals:
   ```bash
   ccusage-byobu --install --refresh=45
   ```

## Troubleshooting

### Test Your Configuration

```bash
# Test with current configuration
ccusage-byobu --test

# Test with specific config file
ccusage-byobu --config=examples/configurations/development.env --test
```

### Debug Output

Enable debug mode to see detailed performance information:

```bash
export CCUSAGE_BYOBU_DEBUG="1"
ccusage-byobu
```

### Verify Installation

```bash
# Check installed byobu scripts
ls -la ~/.byobu/bin/*ccusage*

# Test script manually
~/.byobu/bin/60_ccusage
```

## Customization

### Creating Your Own Configuration

1. Copy an existing configuration:
   ```bash
   cp examples/configurations/development.env ~/.ccusage-custom.env
   ```

2. Modify as needed:
   ```bash
   vim ~/.ccusage-custom.env
   ```

3. Load and test:
   ```bash
   source ~/.ccusage-custom.env
   ccusage-byobu --test
   ```

### Creating Custom Scripts

1. Start with an existing script:
   ```bash
   cp examples/byobu-scripts/custom-format.sh ~/.byobu/bin/70_my_custom
   ```

2. Modify the formatting logic
3. Make executable and test:
   ```bash
   chmod +x ~/.byobu/bin/70_my_custom
   ~/.byobu/bin/70_my_custom
   ```

For more detailed information, see the main [USAGE_EXAMPLES.md](../USAGE_EXAMPLES.md) file.