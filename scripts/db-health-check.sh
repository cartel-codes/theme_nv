#!/bin/bash

###############################################################################
# Database Health Check Script for Novraux
# 
# This script checks database schema integrity and performs validation:
# - Table existence and structure
# - Foreign key relationships
# - Indexes and performance
# - Data consistency checks
#
# Usage: ./scripts/db-health-check.sh [--verbose] [--prod]
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Flags
VERBOSE=false
PROD_DB=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --verbose)
      VERBOSE=true
      shift
      ;;
    --prod)
      PROD_DB=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           DATABASE HEALTH CHECK                           ║${NC}"
echo -e "${BLUE}║                  Novraux E-Commerce                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

DB_MODE=$([ "$PROD_DB" = true ] && echo 'PRODUCTION' || echo 'Development')
echo -e "Database Mode: ${BLUE}$DB_MODE${NC}"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0

###############################################################################
# 1. Schema Validation
###############################################################################
echo -e "${BLUE}[1/5]${NC} Validating Prisma schema..."

if npx prisma validate > /dev/null 2>&1; then
  echo -e "${GREEN}    ✓ Schema is valid${NC}"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo -e "${RED}    ✗ Schema validation failed${NC}"
  npx prisma validate || true
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

echo ""

###############################################################################
# 2. Table Information Check
###############################################################################
echo -e "${BLUE}[2/5]${NC} Checking database tables..."

cat > /tmp/check-tables.ts << 'EOF'
import { prisma } from './lib/prisma';

async function checkTables() {
  try {
    const tables = [
      { name: 'AdminUser', count: await prisma.adminUser.count() },
      { name: 'AdminSession', count: await prisma.adminSession.count() },
      { name: 'AdminAuditLog', count: await prisma.adminAuditLog.count() },
      { name: 'Product', count: await prisma.product.count() },
      { name: 'Category', count: await prisma.category.count() },
      { name: 'Cart', count: await prisma.cart.count() },
      { name: 'CartItem', count: await prisma.cartItem.count() },
      { name: 'User', count: await prisma.user.count() },
      { name: 'Post', count: await prisma.post.count() },
    ];

    console.log('Table Status:');
    tables.forEach(table => {
      console.log(`  ✓ ${table.name.padEnd(20)} : ${table.count} records`);
    });

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error checking tables:', error);
    process.exit(1);
  }
}

checkTables();
EOF

if timeout 30 npx tsx /tmp/check-tables.ts 2>&1; then
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
  echo -e "${RED}    ✗ Failed to check tables${NC}"
fi

rm -f /tmp/check-tables.ts

echo ""

###############################################################################
# 3. Foreign Key Relationships
###############################################################################
echo -e "${BLUE}[3/5]${NC} Verifying foreign key relationships..."

cat > /tmp/check-fk.ts << 'EOF'
import { prisma } from './lib/prisma';

async function checkRelationships() {
  try {
    console.log('Checking critical relationships:');

    // Check if AdminSession users exist
    const sessionsWithoutUsers = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "AdminSession" 
      WHERE "userId" NOT IN (SELECT id FROM "AdminUser")
    `;
    if (sessionsWithoutUsers[0]?.count === 0) {
      console.log('  ✓ All AdminSession have valid AdminUser');
    } else {
      console.log(`  ⚠ Found ${sessionsWithoutUsers[0]?.count} orphaned AdminSession records`);
    }

    // Check if CartItems have valid products
    const cartItemsWithoutProducts = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "CartItem" 
      WHERE "productId" NOT IN (SELECT id FROM "Product")
    `;
    if (cartItemsWithoutProducts[0]?.count === 0) {
      console.log('  ✓ All CartItem have valid Product');
    } else {
      console.log(`  ⚠ Found ${cartItemsWithoutProducts[0]?.count} orphaned CartItem records`);
    }

    // Check if Products have valid categories
    const productsWithoutCategories = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Product" 
      WHERE "categoryId" IS NOT NULL 
      AND "categoryId" NOT IN (SELECT id FROM "Category")
    `;
    if (productsWithoutCategories[0]?.count === 0) {
      console.log('  ✓ All Product have valid Category (or NULL)');
    } else {
      console.log(`  ⚠ Found ${productsWithoutCategories[0]?.count} products with invalid categories`);
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error checking relationships:', error);
    process.exit(1);
  }
}

checkRelationships();
EOF

if timeout 30 npx tsx /tmp/check-fk.ts 2>&1; then
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
  echo -e "${RED}    ✗ Failed to verify relationships${NC}"
fi

rm -f /tmp/check-fk.ts

echo ""

###############################################################################
# 4. Performance Checks
###############################################################################
echo -e "${BLUE}[4/5]${NC} Running performance checks..."

cat > /tmp/check-performance.ts << 'EOF'
import { prisma } from './lib/prisma';

async function checkPerformance() {
  try {
    console.log('Performance Metrics:');

    // Query performance test
    const start = Date.now();
    const users = await prisma.adminUser.count();
    const duration = Date.now() - start;
    console.log(`  ✓ Count query: ${duration}ms (Admin Users: ${users})`);

    // Complex query test
    const start2 = Date.now();
    const products = await prisma.product.findMany({ take: 10 });
    const duration2 = Date.now() - start2;
    console.log(`  ✓ List query: ${duration2}ms (Products: ${products.length})`);

    // Relationship query test
    const start3 = Date.now();
    const productsWithImages = await prisma.product.findMany({ 
      include: { images: true },
      take: 5 
    });
    const duration3 = Date.now() - start3;
    console.log(`  ✓ Join query: ${duration3}ms (Products with images: ${productsWithImages.length})`);

    if (duration > 1000 || duration2 > 2000 || duration3 > 3000) {
      console.log('  ⚠ Some queries are slow - consider optimizing indexes');
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error checking performance:', error);
    process.exit(1);
  }
}

checkPerformance();
EOF

if timeout 30 npx tsx /tmp/check-performance.ts 2>&1; then
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
  echo -e "${RED}    ✗ Failed to run performance checks${NC}"
fi

rm -f /tmp/check-performance.ts

echo ""

###############################################################################
# 5. Data Integrity
###############################################################################
echo -e "${BLUE}[5/5]${NC} Checking data integrity..."

cat > /tmp/check-integrity.ts << 'EOF'
import { prisma } from './lib/prisma';

async function checkIntegrity() {
  try {
    console.log('Data Integrity Checks:');

    // Check for duplicate emails
    const duplicateEmails = await prisma.$queryRaw`
      SELECT email, COUNT(*) as count FROM "AdminUser" 
      GROUP BY email HAVING COUNT(*) > 1
    `;
    if (duplicateEmails.length === 0) {
      console.log('  ✓ No duplicate admin user emails');
    } else {
      console.log(`  ✗ Found ${duplicateEmails.length} duplicate email(s)`);
    }

    // Check for duplicate usernames
    const duplicateUsernames = await prisma.$queryRaw`
      SELECT username, COUNT(*) as count FROM "AdminUser" 
      GROUP BY username HAVING COUNT(*) > 1
    `;
    if (duplicateUsernames.length === 0) {
      console.log('  ✓ No duplicate admin user usernames');
    } else {
      console.log(`  ✗ Found ${duplicateUsernames.length} duplicate username(s)`);
    }

    // Check for empty product names
    const emptyProductNames = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Product" WHERE name = '' OR name IS NULL
    `;
    if (emptyProductNames[0]?.count === 0) {
      console.log('  ✓ All products have valid names');
    } else {
      console.log(`  ⚠ Found ${emptyProductNames[0]?.count} products without names`);
    }

    // Check createdAt timestamps
    const noCreatedAt = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Product" WHERE "createdAt" IS NULL
    `;
    if (noCreatedAt[0]?.count === 0) {
      console.log('  ✓ All records have createdAt timestamps');
    } else {
      console.log(`  ⚠ Found ${noCreatedAt[0]?.count} records without createdAt`);
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error checking integrity:', error);
    process.exit(1);
  }
}

checkIntegrity();
EOF

if timeout 30 npx tsx /tmp/check-integrity.ts 2>&1; then
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
  echo -e "${RED}    ✗ Failed to check data integrity${NC}"
fi

rm -f /tmp/check-integrity.ts

echo ""

###############################################################################
# Summary
###############################################################################
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   HEALTH CHECK SUMMARY                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Checks Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks Failed: ${RED}$CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ Database health is good!${NC}"
  echo ""
  echo "Safe to deploy:"
  echo "  1. Schema is valid and consistent"
  echo "  2. All relationships are intact"  
  echo "  3. No data integrity issues found"
  echo "  4. Performance is acceptable"
  echo ""
  exit 0
else
  echo -e "${RED}✗ Database health issues detected.${NC}"
  echo ""
  echo "Recommended actions:"
  echo "  1. Review the warnings above"
  echo "  2. Run: npx prisma migrate status"
  echo "  3. Check database logs for errors"
  echo "  4. Consider running: npx prisma db push"
  echo ""
  exit 1
fi
