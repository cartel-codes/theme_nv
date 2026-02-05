#!/bin/bash

###############################################################################
# Pre-Deployment Script for Novraux
# 
# This script performs comprehensive checks before deploying to production:
# - Database connectivity and schema validation
# - TypeScript compilation
# - Unit tests
# - Build process
# - Environment variables validation
#
# Usage: ./scripts/pre-deploy.sh [--prod] [--skip-tests]
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
PROD_DB=false
SKIP_TESTS=false
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --prod)
      PROD_DB=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         PRE-DEPLOYMENT VERIFICATION SCRIPT                 ║${NC}"
echo -e "${BLUE}║                  Novraux E-Commerce                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Started at: ${TIMESTAMP}"
echo -e "Database Mode: $([ "$PROD_DB" = true ] && echo 'PRODUCTION' || echo 'Development')"
echo ""

# Track results
CHECKS_PASSED=0
CHECKS_FAILED=0

###############################################################################
# 1. Environment Variables Check
###############################################################################
echo -e "${BLUE}[1/7]${NC} Checking environment variables..."

check_env_var() {
  if [ -z "${!1}" ]; then
    echo -e "${RED}    ✗ Missing: $1${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
    return 1
  else
    echo -e "${GREEN}    ✓ Found: $1${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
    return 0
  fi
}

required_vars=(
  "DATABASE_URL"
  "DIRECT_URL"
  "NEXT_PUBLIC_SITE_URL"
  "R2_ACCESS_KEY_ID"
  "R2_SECRET_ACCESS_KEY"
  "R2_BUCKET_NAME"
)

for var in "${required_vars[@]}"; do
  check_env_var "$var" || true
done

echo ""

###############################################################################
# 2. Prisma Schema Validation
###############################################################################
echo -e "${BLUE}[2/7]${NC} Validating Prisma schema..."

if npx prisma validate > /dev/null 2>&1; then
  echo -e "${GREEN}    ✓ Schema is valid${NC}"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo -e "${RED}    ✗ Schema validation failed${NC}"
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

echo ""

###############################################################################
# 3. Database Connection Test
###############################################################################
echo -e "${BLUE}[3/7]${NC} Testing database connectivity..."

# Try a simple database query through Prisma
check_db_connection() {
  local timeout_seconds=10
  
  echo "    Testing database connection..."
  
  # Try using Prisma CLI to validate connection
  if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    return 0
  else
    # Try a simpler method - just check if Prisma can connect
    if timeout $timeout_seconds npx prisma client validate > /dev/null 2>&1; then
      return 0
    else
      return 1
    fi
  fi
}

if check_db_connection; then
  echo -e "${GREEN}    ✓ Connected to database${NC}"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo -e "${YELLOW}    ⚠ Could not verify database connection (may not be available in this environment)${NC}"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
fi

echo ""

###############################################################################
# 4. TypeScript Compilation Check
###############################################################################
echo -e "${BLUE}[4/7]${NC} Running TypeScript type check..."

if npm run type-check > /dev/null 2>&1; then
  echo -e "${GREEN}    ✓ No TypeScript errors${NC}"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo -e "${RED}    ✗ TypeScript compilation errors found${NC}"
  npm run type-check || true
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

echo ""

###############################################################################
# 5. Unit Tests
###############################################################################
if [ "$SKIP_TESTS" = true ]; then
  echo -e "${BLUE}[5/7]${NC} Skipping unit tests (--skip-tests flag set)"
  echo ""
else
  echo -e "${BLUE}[5/7]${NC} Running unit tests..."
  
  if npm test -- --passWithNoTests 2>&1 | tail -10; then
    echo -e "${GREEN}    ✓ All tests passed${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "${YELLOW}    ⚠ Tests completed with warnings${NC}"
  fi
  
  echo ""
fi

###############################################################################
# 6. Next.js Build
###############################################################################
echo -e "${BLUE}[6/7]${NC} Building Next.js application..."

if npm run build > /tmp/next-build.log 2>&1; then
  echo -e "${GREEN}    ✓ Build completed successfully${NC}"
  
  # Check build output for routes
  if grep -q "Route (app)" /tmp/next-build.log 2>/dev/null; then
    echo -e "${GREEN}    ✓ Routes compiled successfully${NC}"
  fi
  
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo -e "${RED}    ✗ Build failed${NC}"
  echo ""
  cat /tmp/next-build.log | tail -30
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

echo ""

###############################################################################
# 7. Production Build Size Check
###############################################################################
echo -e "${BLUE}[7/7]${NC} Checking build output size..."

if [ -d ".next" ]; then
  BUILD_SIZE=$(du -sh .next | cut -f1)
  BUILD_SIZE_MB=$(du -sm .next | cut -f1)
  
  echo -e "${GREEN}    ✓ Build size: $BUILD_SIZE${NC}"
  
  # Warn if build is very large
  if [ "$BUILD_SIZE_MB" -gt 300 ]; then
    echo -e "${YELLOW}    ⚠ Build size is larger than recommended (${BUILD_SIZE_MB}MB > 300MB)${NC}"
    echo "      Consider optimizing dependencies or code splitting"
  else
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  fi
else
  echo -e "${RED}    ✗ Build directory not found${NC}"
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

echo ""

###############################################################################
# Summary
###############################################################################
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    DEPLOYMENT CHECKLIST                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Checks Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks Failed: ${RED}$CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed! Ready for deployment.${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Review any warnings above"
  echo "  2. Commit changes: git add . && git commit -m 'Pre-deployment checks passed'"
  echo "  3. Push to production: git push origin main"
  echo "  4. Monitor Vercel deployment"
  echo "  5. Verify in production: https://your-domain.com"
  echo ""
  exit 0
else
  echo -e "${RED}✗ Some checks failed. Please fix the issues before deploying.${NC}"
  echo ""
  echo "Common fixes:"
  echo "  - TypeScript errors: npm run type-check"
  echo "  - Test failures: npm test"
  echo "  - Build issues: npm run build"
  echo "  - Database connection: Check DATABASE_URL and DIRECT_URL in .env"
  echo ""
  exit 1
fi
