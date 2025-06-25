#!/bin/bash
# Environment-aware ccusage-byobu display
# Automatically loads different configurations based on environment
# Place as ~/.byobu/bin/67_ccusage_env

# Detect environment
ENVIRONMENT="default"

# Check for production indicators
if [ -f "/etc/production" ] || [ -f "/opt/production" ] || [ "$HOSTNAME" = "prod-server" ]; then
    ENVIRONMENT="production"
elif [ -f "/etc/staging" ] || [[ "$HOSTNAME" == *"staging"* ]]; then
    ENVIRONMENT="staging"
elif [ "$USER" = "developer" ] || [[ "$PWD" == */dev/* ]] || [ -f ".development" ]; then
    ENVIRONMENT="development"
fi

# Load environment-specific configuration
case $ENVIRONMENT in
    "production")
        # Production settings
        export CCUSAGE_BYOBU_FORMAT="compact"
        export CCUSAGE_BYOBU_REFRESH="120"
        export CCUSAGE_BYOBU_COLORS="false"
        export CCUSAGE_BYOBU_DEBUG="0"
        PREFIX="PROD"
        ;;
    "staging")
        # Staging settings
        export CCUSAGE_BYOBU_FORMAT="full"
        export CCUSAGE_BYOBU_REFRESH="60"
        export CCUSAGE_BYOBU_COLORS="true"
        export CCUSAGE_BYOBU_DEBUG="0"
        PREFIX="STAGE"
        ;;
    "development")
        # Development settings
        export CCUSAGE_BYOBU_FORMAT="full"
        export CCUSAGE_BYOBU_REFRESH="30"
        export CCUSAGE_BYOBU_COLORS="true"
        export CCUSAGE_BYOBU_DEBUG="1"
        export CCUSAGE_ENABLE_CACHE="1"
        PREFIX="DEV"
        ;;
    *)
        # Default settings
        PREFIX=""
        ;;
esac

# Get ccusage output
output=$(ccusage-byobu 2>/dev/null)

# Display with environment prefix
if [ -n "$output" ]; then
    if [ -n "$PREFIX" ]; then
        echo "[$PREFIX] $output"
    else
        echo "$output"
    fi
else
    echo ""
fi