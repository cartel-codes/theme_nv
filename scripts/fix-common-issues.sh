#!/bin/bash
# Quick fix for common development issues

echo "🔍 Diagnosing common issues..."

# Check if port is in use
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 3001 is in use"
    echo "   Killing process..."
    fuser -k 3001/tcp 2>/dev/null || pkill -f "next dev"
    sleep 1
    echo "   ✅ Port freed"
else
    echo "✅ Port 3001 is available"
fi

# Check for stale cache
if [ -d ".next" ]; then
    echo "⚠️  Build cache exists"
    echo "   Cleaning .next directory..."
    rm -rf .next
    echo "   ✅ Cache cleared"
else
    echo "✅ No stale build cache"
fi

# Check for node_modules cache issues
if [ -d "node_modules/.cache" ]; then
    echo "⚠️  Node modules cache exists"
    echo "   Cleaning node cache..."
    rm -rf node_modules/.cache
    echo "   ✅ Node cache cleared"
else
    echo "✅ Node cache is clean"
fi

# Check TypeScript build info
if [ -f "tsconfig.tsbuildinfo" ]; then
    echo "⚠️  Stale TypeScript build info"
    echo "   Removing..."
    rm -f tsconfig.tsbuildinfo
    echo "   ✅ Removed"
else
    echo "✅ TypeScript build info is clean"
fi

echo ""
echo "🎉 All common issues fixed!"
echo "💡 You can now run: npm run dev"
