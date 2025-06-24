#!/bin/bash

# Example byobu status script integration
# Place this file as ~/.byobu/bin/60_ccusage to integrate with byobu

# Cache is disabled by default for byobu compatibility
# No environment variable needed - ccusage-byobu works out of the box

# Run ccusage-byobu and capture output
ccusage-byobu 2>/dev/null || echo ""

# The process will terminate properly without hanging byobu status updates