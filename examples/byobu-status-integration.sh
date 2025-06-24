#!/bin/bash

# Example byobu status script integration
# Place this file as ~/.byobu/bin/60_ccusage to integrate with byobu

# Set environment variable to disable cache for byobu status scripts
export CCUSAGE_DISABLE_CACHE=1

# Run ccusage-byobu and capture output
ccusage-byobu 2>/dev/null || echo ""

# The process will now terminate properly and not hang byobu status updates