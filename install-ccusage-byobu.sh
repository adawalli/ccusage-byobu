#!/bin/bash
# ccusage-byobu installer script
# Installs ccusage-byobu globally and sets up byobu integration

set -e

# Color codes for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Progress tracking
STEP=0
TOTAL_STEPS=6

# Configuration variables
CLAUDE_PLAN_TYPE=""
CLAUDE_CONFIG_DIR=""
REFRESH_INTERVAL="60"
ROLLBACK_COMMANDS=()

# Utility functions
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

progress() {
    STEP=$((STEP + 1))
    echo -e "${BLUE}[STEP ${STEP}/${TOTAL_STEPS}]${NC} $1"
}

# Rollback function
rollback() {
    if [ ${#ROLLBACK_COMMANDS[@]} -eq 0 ]; then
        log_info "No rollback actions needed."
        return
    fi
    
    log_warning "Rolling back installation..."
    for ((i=${#ROLLBACK_COMMANDS[@]}-1; i>=0; i--)); do
        log_info "Executing rollback: ${ROLLBACK_COMMANDS[i]}"
        eval "${ROLLBACK_COMMANDS[i]}" || true
    done
    log_info "Rollback completed."
}

# Error handler
error_exit() {
    log_error "$1"
    rollback
    exit 1
}

# Trap errors and cleanup
trap 'error_exit "Installation failed unexpectedly"' ERR

# Prerequisite check functions
check_command() {
    if ! command -v "$1" &> /dev/null; then
        return 1
    fi
    return 0
}

check_node_version() {
    local node_version
    node_version=$(node --version 2>/dev/null | sed 's/v//')
    local major_version
    major_version=$(echo "$node_version" | cut -d. -f1)
    
    if [ "$major_version" -lt 18 ]; then
        return 1
    fi
    return 0
}

check_npm_permissions() {
    # Check if npm can install globally without sudo
    local npm_prefix
    npm_prefix=$(npm config get prefix 2>/dev/null || echo "")
    
    if [ -z "$npm_prefix" ]; then
        return 1
    fi
    
    # Check if the user has write permissions to the npm prefix
    if [ ! -w "$npm_prefix" ]; then
        return 1
    fi
    
    return 0
}

# Prerequisite checks
perform_prerequisite_checks() {
    progress "Performing prerequisite checks"
    
    # Check for byobu
    if ! check_command byobu; then
        error_exit "byobu is not installed. Please install byobu first:
        Ubuntu/Debian: sudo apt-get install byobu
        macOS: brew install byobu
        CentOS/RHEL: sudo yum install byobu"
    fi
    log_success "byobu is installed"
    
    # Check for Node.js
    if ! check_command node; then
        error_exit "Node.js is not installed. Please install Node.js 18+ first:
        Visit: https://nodejs.org/
        Ubuntu/Debian: sudo apt-get install nodejs
        macOS: brew install node
        CentOS/RHEL: sudo yum install nodejs"
    fi
    
    # Check Node.js version
    if ! check_node_version; then
        local current_version
        current_version=$(node --version 2>/dev/null || echo "unknown")
        error_exit "Node.js version $current_version is not supported. Please install Node.js 18+ first."
    fi
    log_success "Node.js $(node --version) is installed"
    
    # Check for npm
    if ! check_command npm; then
        error_exit "npm is not installed. Please install npm first:
        Ubuntu/Debian: sudo apt-get install npm
        macOS: brew install npm
        CentOS/RHEL: sudo yum install npm"
    fi
    log_success "npm $(npm --version) is installed"
    
    # Check npm permissions
    if ! check_npm_permissions; then
        log_warning "npm may require sudo for global installation"
        log_info "You may need to configure npm permissions or use sudo"
    fi
    
    # Check for git (optional but recommended)
    if check_command git; then
        log_success "git is installed"
    else
        log_warning "git is not installed (optional but recommended)"
    fi
    
    # Check system compatibility
    local os_type
    os_type=$(uname -s)
    case "$os_type" in
        Linux*)
            log_success "Linux system detected"
            ;;
        Darwin*)
            log_success "macOS system detected"
            ;;
        *)
            log_warning "Unknown system type: $os_type (installation may still work)"
            ;;
    esac
    
    log_success "All prerequisite checks passed"
}

# Interactive prompts
get_claude_plan_type() {
    echo
    log_info "Please select your Claude plan type:"
    echo "1) Free"
    echo "2) Pro"
    echo "3) Team"
    echo "4) Enterprise"
    echo
    
    while true; do
        read -r -p "Enter your choice (1-4): " choice
        case $choice in
            1) CLAUDE_PLAN_TYPE="free"; break ;;
            2) CLAUDE_PLAN_TYPE="pro"; break ;;
            3) CLAUDE_PLAN_TYPE="team"; break ;;
            4) CLAUDE_PLAN_TYPE="enterprise"; break ;;
            *) echo "Please enter a number between 1-4" ;;
        esac
    done
    
    log_success "Selected plan type: $CLAUDE_PLAN_TYPE"
}

get_claude_config_dir() {
    echo
    local default_dir="$HOME/.claude"
    log_info "Please specify your Claude configuration directory:"
    log_info "Default: $default_dir"
    echo
    
    read -r -p "Enter directory path (or press Enter for default): " config_dir
    
    if [ -z "$config_dir" ]; then
        CLAUDE_CONFIG_DIR="$default_dir"
    else
        # Expand tilde if present
        CLAUDE_CONFIG_DIR="${config_dir/#\~/$HOME}"
    fi
    
    log_success "Claude config directory: $CLAUDE_CONFIG_DIR"
}

get_refresh_interval() {
    echo
    log_info "Please specify the refresh interval for byobu status (in seconds):"
    log_info "Default: 60 seconds"
    log_info "Range: 5-3600 seconds"
    echo
    
    while true; do
        read -r -p "Enter refresh interval (or press Enter for default): " interval
        
        if [ -z "$interval" ]; then
            REFRESH_INTERVAL="60"
            break
        fi
        
        # Validate input is a number
        if ! [[ "$interval" =~ ^[0-9]+$ ]]; then
            log_error "Please enter a valid number"
            continue
        fi
        
        # Validate range
        if [ "$interval" -lt 5 ] || [ "$interval" -gt 3600 ]; then
            log_error "Please enter a value between 5 and 3600 seconds"
            continue
        fi
        
        REFRESH_INTERVAL="$interval"
        break
    done
    
    log_success "Refresh interval: $REFRESH_INTERVAL seconds"
}

# Interactive configuration
interactive_prompts() {
    progress "Gathering configuration options"
    
    echo
    log_info "Welcome to ccusage-byobu installer!"
    log_info "This installer will set up ccusage-byobu with byobu integration."
    echo
    
    get_claude_plan_type
    get_claude_config_dir
    get_refresh_interval
    
    echo
    log_info "Configuration summary:"
    log_info "  Claude plan type: $CLAUDE_PLAN_TYPE"
    log_info "  Claude config directory: $CLAUDE_CONFIG_DIR"
    log_info "  Refresh interval: $REFRESH_INTERVAL seconds"
    echo
    
    read -r -p "Proceed with installation? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log_info "Installation cancelled by user"
        exit 0
    fi
}

# Global npm installation
install_global_npm() {
    progress "Installing ccusage-byobu globally via npm"
    
    log_info "Installing ccusage-byobu..."
    
    # Try to install globally
    if npm install -g ccusage-byobu; then
        ROLLBACK_COMMANDS+=("npm uninstall -g ccusage-byobu")
        log_success "ccusage-byobu installed globally"
    else
        log_warning "Global installation failed, trying with sudo..."
        if sudo npm install -g ccusage-byobu; then
            ROLLBACK_COMMANDS+=("sudo npm uninstall -g ccusage-byobu")
            log_success "ccusage-byobu installed globally with sudo"
        else
            error_exit "Failed to install ccusage-byobu globally"
        fi
    fi
    
    # Verify installation
    if ! check_command ccusage-byobu; then
        error_exit "ccusage-byobu command not found after installation"
    fi
    
    log_success "ccusage-byobu is now available as a global command"
}

# Run installation command
run_installation_command() {
    progress "Setting up byobu integration"
    
    log_info "Running ccusage-byobu --install..."
    
    # Set environment variables for the installation
    export CCUSAGE_BYOBU_REFRESH="$REFRESH_INTERVAL"
    
    if ccusage-byobu --install --refresh="$REFRESH_INTERVAL"; then
        log_success "byobu integration installed successfully"
    else
        error_exit "Failed to install byobu integration"
    fi
}

# Shell profile modification
modify_shell_profile() {
    progress "Updating shell profile"
    
    # Detect shell type
    local shell_name
    shell_name=$(basename "$SHELL")
    
    local profile_file=""
    case "$shell_name" in
        bash)
            if [ -f "$HOME/.bashrc" ]; then
                profile_file="$HOME/.bashrc"
            elif [ -f "$HOME/.bash_profile" ]; then
                profile_file="$HOME/.bash_profile"
            else
                profile_file="$HOME/.bashrc"
                touch "$profile_file"
            fi
            ;;
        zsh)
            profile_file="$HOME/.zshrc"
            ;;
        fish)
            profile_file="$HOME/.config/fish/config.fish"
            ;;
        *)
            log_warning "Unknown shell: $shell_name, skipping profile modification"
            return
            ;;
    esac
    
    log_info "Updating $profile_file"
    
    # Create backup
    local backup_file
    backup_file="${profile_file}.ccusage-backup.$(date +%Y%m%d_%H%M%S)"
    if [ -f "$profile_file" ]; then
        cp "$profile_file" "$backup_file"
        ROLLBACK_COMMANDS+=("mv '$backup_file' '$profile_file'")
        log_info "Created backup: $backup_file"
    fi
    
    # Add environment variables
    local env_vars=""
    if [ -n "$CLAUDE_PLAN_TYPE" ]; then
        env_vars="${env_vars}export CLAUDE_PLAN_TYPE=\"$CLAUDE_PLAN_TYPE\"\n"
    fi
    if [ -n "$CLAUDE_CONFIG_DIR" ]; then
        env_vars="${env_vars}export CLAUDE_CONFIG_DIR=\"$CLAUDE_CONFIG_DIR\"\n"
    fi
    if [ -n "$REFRESH_INTERVAL" ] && [ "$REFRESH_INTERVAL" != "60" ]; then
        env_vars="${env_vars}export CCUSAGE_BYOBU_REFRESH=\"$REFRESH_INTERVAL\"\n"
    fi
    
    if [ -n "$env_vars" ]; then
        {
            echo ""
            echo "# ccusage-byobu configuration"
            echo -e "$env_vars"
        } >> "$profile_file"
        log_success "Added environment variables to $profile_file"
    fi
}

# Final success message
show_success_message() {
    progress "Installation completed successfully!"
    
    echo
    log_success "🎉 ccusage-byobu has been installed successfully!"
    echo
    log_info "Configuration:"
    log_info "  ✓ Claude plan type: $CLAUDE_PLAN_TYPE"
    log_info "  ✓ Claude config directory: $CLAUDE_CONFIG_DIR"
    log_info "  ✓ Refresh interval: $REFRESH_INTERVAL seconds"
    log_info "  ✓ byobu integration: Active"
    echo
    log_info "Next steps:"
    log_info "  1. Restart your terminal or run: source ~/.$(basename "$SHELL")rc"
    log_info "  2. Start byobu: byobu"
    log_info "  3. Your Claude usage metrics will appear in the byobu status bar"
    echo
    log_info "Useful commands:"
    log_info "  ccusage-byobu --help       Show help"
    log_info "  ccusage-byobu --status     Check installation status"
    log_info "  ccusage-byobu --uninstall  Remove byobu integration"
    echo
    log_success "Installation complete! Enjoy tracking your Claude usage!"
}

# Main installation flow
main() {
    echo "ccusage-byobu Installer"
    echo "======================="
    echo
    
    perform_prerequisite_checks
    interactive_prompts
    install_global_npm
    run_installation_command
    modify_shell_profile
    show_success_message
}

# Run main function
main "$@"