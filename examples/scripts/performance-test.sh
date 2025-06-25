#!/bin/bash
# Performance testing script for ccusage-byobu
# Tests various configurations and provides performance recommendations

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

echo "🏃 ccusage-byobu Performance Test Suite"
echo "======================================"
echo

# Check if ccusage-byobu is installed
if ! command -v ccusage-byobu >/dev/null 2>&1; then
    log_error "ccusage-byobu is not installed. Please install it first:"
    echo "  npm install -g ccusage-byobu"
    exit 1
fi

# Check if benchmark tool is available
if ! command -v ccusage-byobu-benchmark >/dev/null 2>&1; then
    log_warning "ccusage-byobu-benchmark not found. Performance benchmarks will be limited."
    BENCHMARK_AVAILABLE=false
else
    BENCHMARK_AVAILABLE=true
fi

# Test basic functionality
log_info "Testing basic functionality..."
if ccusage-byobu --test >/dev/null 2>&1; then
    log_success "Basic functionality test passed"
else
    log_error "Basic functionality test failed. Check your configuration."
    exit 1
fi

# Test different configurations
log_info "Testing configuration performance..."

# Store original environment
ORIG_FORMAT="${CCUSAGE_BYOBU_FORMAT:-}"
ORIG_COLORS="${CCUSAGE_BYOBU_COLORS:-}"
ORIG_CACHE="${CCUSAGE_ENABLE_CACHE:-}"
ORIG_DEBUG="${CCUSAGE_BYOBU_DEBUG:-}"

# Test compact vs full format
echo
log_info "Comparing compact vs full format performance..."

export CCUSAGE_BYOBU_FORMAT="compact"
export CCUSAGE_BYOBU_DEBUG="0"
export CCUSAGE_ENABLE_CACHE="0"

start_time=$(date +%s%N)
for i in {1..5}; do
    ccusage-byobu >/dev/null 2>&1
done
end_time=$(date +%s%N)
compact_time=$((($end_time - $start_time) / 1000000 / 5))  # Average in ms

export CCUSAGE_BYOBU_FORMAT="full"

start_time=$(date +%s%N)
for i in {1..5}; do
    ccusage-byobu >/dev/null 2>&1
done
end_time=$(date +%s%N)
full_time=$((($end_time - $start_time) / 1000000 / 5))  # Average in ms

echo "  Compact format: ${compact_time}ms average"
echo "  Full format: ${full_time}ms average"

if [ $compact_time -lt $full_time ]; then
    echo "  ✅ Compact format is faster by $((full_time - compact_time))ms"
else
    echo "  ⚠️  Full format is not significantly slower"
fi

# Test caching impact
echo
log_info "Testing cache performance impact..."

export CCUSAGE_BYOBU_FORMAT="full"
export CCUSAGE_ENABLE_CACHE="0"

start_time=$(date +%s%N)
for i in {1..3}; do
    ccusage-byobu >/dev/null 2>&1
done
end_time=$(date +%s%N)
no_cache_time=$((($end_time - $start_time) / 1000000 / 3))

export CCUSAGE_ENABLE_CACHE="1"

# Warm up cache
ccusage-byobu >/dev/null 2>&1

start_time=$(date +%s%N)
for i in {1..3}; do
    ccusage-byobu >/dev/null 2>&1
done
end_time=$(date +%s%N)
cached_time=$((($end_time - $start_time) / 1000000 / 3))

echo "  No cache: ${no_cache_time}ms average"
echo "  With cache: ${cached_time}ms average"

if [ $cached_time -lt $no_cache_time ]; then
    speedup=$(((no_cache_time - cached_time) * 100 / no_cache_time))
    echo "  ✅ Cache provides ${speedup}% speedup"
else
    echo "  ⚠️  Cache does not provide significant speedup"
fi

# Test color processing impact
echo
log_info "Testing color processing impact..."

export CCUSAGE_BYOBU_COLORS="false"
export CCUSAGE_ENABLE_CACHE="0"

start_time=$(date +%s%N)
for i in {1..3}; do
    ccusage-byobu >/dev/null 2>&1
done
end_time=$(date +%s%N)
no_color_time=$((($end_time - $start_time) / 1000000 / 3))

export CCUSAGE_BYOBU_COLORS="true"

start_time=$(date +%s%N)
for i in {1..3}; do
    ccusage-byobu >/dev/null 2>&1
done
end_time=$(date +%s%N)
color_time=$((($end_time - $start_time) / 1000000 / 3))

echo "  No colors: ${no_color_time}ms average"
echo "  With colors: ${color_time}ms average"

if [ $no_color_time -lt $color_time ]; then
    overhead=$(((color_time - no_color_time) * 100 / no_color_time))
    echo "  ⚠️  Color processing adds ${overhead}% overhead"
else
    echo "  ✅ Color processing has minimal impact"
fi

# Run benchmark suite if available
if [ "$BENCHMARK_AVAILABLE" = true ]; then
    echo
    log_info "Running comprehensive benchmark suite..."
    
    # Quick benchmark run
    ccusage-byobu-benchmark cold warm --iterations=10 --compare
    
    echo
    log_info "For detailed benchmarks, run: ccusage-byobu-benchmark all --iterations=50 --compare"
fi

# Memory usage test
echo
log_info "Testing memory usage..."

export CCUSAGE_BYOBU_DEBUG="1"
memory_output=$(ccusage-byobu 2>&1 | grep "memory" || echo "Memory info not available")
echo "  $memory_output"

# Performance recommendations
echo
log_success "🎯 Performance Recommendations"
echo "================================"

echo "For byobu integration (default use case):"
echo "  • Cache is disabled by default (recommended for byobu)"
echo "  • Use refresh interval ≥ 60 seconds to avoid excessive load"
echo "  • Compact format is slightly faster than full format"

echo
echo "For interactive CLI usage:"
echo "  • Enable cache: export CCUSAGE_ENABLE_CACHE=1"
echo "  • Use shorter refresh intervals (30-60 seconds)"
echo "  • Full format provides better visual feedback"

echo
echo "For production environments:"
echo "  • Use refresh interval ≥ 120 seconds"
echo "  • Disable debug: export CCUSAGE_BYOBU_DEBUG=0"
echo "  • Consider disabling colors: export CCUSAGE_BYOBU_COLORS=false"

echo
echo "For development environments:"
echo "  • Enable debug for insights: export CCUSAGE_BYOBU_DEBUG=1"
echo "  • Enable cache for faster repeated calls"
echo "  • Use shorter refresh intervals (15-30 seconds)"

# Configuration recommendations based on test results
echo
log_info "Configuration recommendations based on test results:"

if [ $compact_time -lt 50 ]; then
    echo "  ✅ Performance is excellent - any format is suitable"
elif [ $compact_time -lt 100 ]; then
    echo "  👍 Performance is good - full format recommended"
else
    echo "  ⚠️  Performance is slow - consider compact format and caching"
fi

if [ $cached_time -lt $((no_cache_time / 2)) ]; then
    echo "  ✅ Caching provides significant benefit - enable for interactive use"
else
    echo "  ℹ️  Caching provides modest benefit - use based on preference"
fi

# Restore original environment
export CCUSAGE_BYOBU_FORMAT="$ORIG_FORMAT"
export CCUSAGE_BYOBU_COLORS="$ORIG_COLORS" 
export CCUSAGE_ENABLE_CACHE="$ORIG_CACHE"
export CCUSAGE_BYOBU_DEBUG="$ORIG_DEBUG"

echo
log_success "Performance testing complete!"
echo
log_info "To apply optimizations:"
echo "  1. Choose appropriate refresh interval for your use case"
echo "  2. Enable/disable cache based on usage pattern"
echo "  3. Select format based on performance requirements"
echo "  4. Use environment-specific configurations"

echo
echo "Example optimized configurations are available in:"
echo "  examples/configurations/development.env    # Fast, debug enabled"
echo "  examples/configurations/production.env     # Conservative, stable"
echo "  examples/configurations/free-tier.env      # Minimal overhead"