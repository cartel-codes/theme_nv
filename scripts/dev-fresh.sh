#!/bin/bash
# Fresh development start - clears all caches and restarts cleanly

echo "🧹 Cleaning development environment..."

# Kill any running Next.js process
echo "Stopping any running servers..."
fuser -k 3001/tcp 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# Wait for port to be free
sleep 2

# Remove all caches
echo "Removing build caches..."
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .turbo 2>/dev/null || true

# Clear TypeScript build info
rm -f tsconfig.tsbuildinfo 2>/dev/null || true

echo "✅ Environment cleaned!"
echo "🚀 Starting dev server..."
echo ""

# Start fresh dev server
npm run dev
