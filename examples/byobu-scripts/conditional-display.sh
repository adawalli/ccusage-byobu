#!/bin/bash
# Smart conditional display for ccusage-byobu
# Only shows usage when Claude is actively being used
# Place as ~/.byobu/bin/65_ccusage_smart

# Check if Claude Code processes are running
claude_running=false

# Check for various Claude process patterns
if pgrep -f "claude.*code\|code.*claude\|anthropic" > /dev/null 2>&1; then
    claude_running=true
fi

# Check if there's an active Claude session via ccusage
if ccusage blocks --json --offline 2>/dev/null | grep -q '"isActive":true'; then
    session_active=true
else
    session_active=false
fi

# Display logic
if [ "$claude_running" = true ] && [ "$session_active" = true ]; then
    # Both process and session active - show with active indicator
    output=$(ccusage-byobu 2>/dev/null)
    if [ -n "$output" ]; then
        echo "🤖 $output"
    fi
elif [ "$session_active" = true ]; then
    # Session active but no visible process - show basic usage
    ccusage-byobu 2>/dev/null || echo ""
else
    # No active session - show nothing
    echo ""
fi