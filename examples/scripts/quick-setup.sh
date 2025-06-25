#!/bin/bash
# Quick setup script for ccusage-byobu
# Provides an interactive setup experience for common configurations

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚀 ccusage-byobu Quick Setup"
echo "============================"
echo

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v node >/dev/null 2>&1; then
    log_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    log_error "npm is not installed. Please install npm first."
    exit 1
fi

if ! command -v byobu >/dev/null 2>&1; then
    log_error "byobu is not installed. Please install byobu first."
    exit 1
fi

log_success "All prerequisites found"

# Check if ccusage is installed
if ! command -v ccusage >/dev/null 2>&1; then
    log_warning "ccusage not found. Installing..."
    npm install -g ccusage
fi

# Check if ccusage-byobu is installed
if ! command -v ccusage-byobu >/dev/null 2>&1; then
    log_info "Installing ccusage-byobu..."
    npm install -g ccusage-byobu
    log_success "ccusage-byobu installed"
else
    log_success "ccusage-byobu is already installed"
fi

echo
log_info "Select your setup type:"
echo "1) Quick setup (recommended defaults)"
echo "2) Development setup (fast refresh, debug enabled)"
echo "3) Production setup (conservative settings)"
echo "4) Free tier setup (optimized for free plan)"
echo "5) Custom setup (manual configuration)"

read -p "Enter your choice (1-5): " setup_type

case $setup_type in
    1)
        log_info "Setting up with recommended defaults..."
        export CLAUDE_PLAN_TYPE="pro"
        export CCUSAGE_BYOBU_FORMAT="full"
        export CCUSAGE_BYOBU_REFRESH="60"
        ;;
    2)
        log_info "Setting up for development..."
        export CLAUDE_PLAN_TYPE="max_5x"
        export CCUSAGE_BYOBU_FORMAT="full"
        export CCUSAGE_BYOBU_REFRESH="30"
        export CCUSAGE_BYOBU_DEBUG="1"
        export CCUSAGE_ENABLE_CACHE="1"
        ;;
    3)
        log_info "Setting up for production..."
        export CLAUDE_PLAN_TYPE="pro"
        export CCUSAGE_BYOBU_FORMAT="compact"
        export CCUSAGE_BYOBU_REFRESH="120"
        export CCUSAGE_BYOBU_COLORS="false"
        ;;
    4)
        log_info "Setting up for free tier..."
        export CLAUDE_PLAN_TYPE="free"
        export CCUSAGE_BYOBU_FORMAT="compact"
        export CCUSAGE_BYOBU_REFRESH="300"
        export CCUSAGE_BYOBU_COLORS="false"
        export CCUSAGE_BYOBU_THRESHOLD="95"
        ;;
    5)
        log_info "Custom setup selected. Please configure manually after installation."
        ;;
    *)
        log_error "Invalid choice. Using defaults."
        export CLAUDE_PLAN_TYPE="pro"
        export CCUSAGE_BYOBU_FORMAT="full"
        export CCUSAGE_BYOBU_REFRESH="60"
        ;;
esac

# Install byobu integration
log_info "Installing byobu integration..."
ccusage-byobu --install --refresh="${CCUSAGE_BYOBU_REFRESH:-60}"

# Test installation
log_info "Testing installation..."
if ccusage-byobu --test >/dev/null 2>&1; then
    log_success "Installation test passed"
else
    log_warning "Installation test failed. You may need to configure your environment manually."
fi

echo
log_success "🎉 Setup complete!"
echo
log_info "Next steps:"
log_info "1. Start byobu: byobu"
log_info "2. Check your status bar for Claude usage metrics"
log_info "3. Run 'ccusage-byobu --help' for more options"

if [ "${CCUSAGE_BYOBU_DEBUG:-0}" = "1" ]; then
    echo
    log_info "Debug mode is enabled. You can see detailed performance info in the logs."
fi

echo
log_info "Useful commands:"
log_info "  ccusage-byobu --config     # Show current configuration"
log_info "  ccusage-byobu --uninstall  # Remove byobu integration"
log_info "  ccusage-byobu --test       # Test installation"