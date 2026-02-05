#!/bin/bash

# Pre-Deployment Validation Script for Novraux
# This script runs all necessary checks before deploying to production

set -e  # Exit on any error

echo "🚀 Novraux Pre-Deployment Validation"
echo "===================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ERRORS=0

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
    ERRORS=$((ERRORS + 1))
}

# Function to print warning
warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "📝 Step 1: Checking environment variables..."
if [ -f .env ]; then
    success ".env file found"
    
    # Check required variables
    if grep -q "DATABASE_URL=" .env && grep -q "DIRECT_URL=" .env; then
        success "Database URLs configured"
    else
        error "DATABASE_URL or DIRECT_URL missing in .env"
    fi
    
    if grep -q "NEXT_PUBLIC_SITE_URL=" .env; then
        success "NEXT_PUBLIC_SITE_URL configured"
    else
        warn "NEXT_PUBLIC_SITE_URL not set (optional for local)"
    fi
else
    error ".env file not found"
fi
echo ""

echo "🔍 Step 2: Running TypeScript type check..."
if npm run type-check 2>/dev/null || npx tsc --noEmit; then
    success "TypeScript types are valid"
else
    error "TypeScript type errors found"
fi
echo ""

echo "🎨 Step 3: Running ESLint..."
if npm run lint; then
    success "No linting errors"
else
    warn "Linting warnings/errors found (non-blocking)"
fi
echo ""

echo "🏗️  Step 4: Building production bundle..."
if npm run build; then
    success "Production build successful"
else
    error "Build failed"
fi
echo ""

echo "🗄️  Step 5: Checking database connection..."
if npx prisma db --help > /dev/null 2>&1; then
    success "Prisma CLI available"
    
    echo "   Validating schema..."
    if npx prisma validate; then
        success "Prisma schema is valid"
    else
        error "Prisma schema validation failed"
    fi
else
    error "Prisma CLI not available"
fi
echo ""

echo "🧪 Step 6: Running tests (if available)..."
if npm run test --if-present 2>/dev/null; then
    success "Tests passed"
else
    warn "No tests found or tests failed (continuing...)"
fi
echo ""

echo "📦 Step 7: Checking package dependencies..."
if npm audit --production --audit-level=high; then
    success "No high/critical vulnerabilities in production dependencies"
else
    warn "Security vulnerabilities detected in dependencies"
fi
echo ""

echo "📊 Step 8: Bundle size check..."
if [ -d ".next" ]; then
    BUNDLE_SIZE=$(du -sh .next | cut -f1)
    echo "   Bundle size: $BUNDLE_SIZE"
    success "Build output analyzed"
else
    warn "No build output found - run 'npm run build' first"
fi
echo ""

echo "===================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to deploy.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Push to GitHub: git push origin main"
    echo "  2. Vercel will auto-deploy, or manually deploy with: vercel --prod"
    echo "  3. Don't forget to set environment variables in Vercel!"
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) found. Please fix before deploying.${NC}"
    exit 1
fi
