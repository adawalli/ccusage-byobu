#!/bin/bash
# Custom formatted display for ccusage-byobu
# Transforms standard output into a more stylized format
# Place as ~/.byobu/bin/66_ccusage_custom

# Get the standard ccusage-byobu output
output=$(ccusage-byobu 2>/dev/null)

if [ -n "$output" ]; then
    # Parse the output to extract components
    if [[ $output =~ \[([█░]+)\].*([0-9]+h[0-9]+m|[0-9]+m).*\$([0-9]+\.[0-9]+) ]]; then
        # Full format with progress bar
        progress="${BASH_REMATCH[1]}"
        time="${BASH_REMATCH[2]}"
        cost="${BASH_REMATCH[3]}"
        
        # Count filled blocks for percentage
        filled=$(echo "$progress" | tr -cd '█' | wc -c)
        total=$(echo "$progress" | wc -c)
        percent=$((filled * 100 / total))
        
        # Custom format with emoji indicators
        if [ $percent -ge 80 ]; then
            echo "🔴 ⏱️$time 💰\$$cost"
        elif [ $percent -ge 60 ]; then
            echo "🟡 ⏱️$time 💰\$$cost"
        else
            echo "🟢 ⏱️$time 💰\$$cost"
        fi
    elif [[ $output =~ ([0-9]+h[0-9]+m|[0-9]+m).*\$([0-9]+\.[0-9]+) ]]; then
        # Compact format
        time="${BASH_REMATCH[1]}"
        cost="${BASH_REMATCH[2]}"
        echo "⚡ $time 💰 \$$cost"
    else
        # Fallback to original output
        echo "🤖 $output"
    fi
else
    # No output - Claude not active
    echo ""
fi