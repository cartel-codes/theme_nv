#!/bin/bash
# Check for common code errors before running dev server

echo "🔍 Checking for common errors..."
echo ""

ERROR_COUNT=0

# Check for missing imports
echo "📦 Checking imports..."
if grep -r "from '@/" app components lib 2>/dev/null | grep -v "node_modules" | grep -v ".next" > /tmp/imports.txt; then
    # Check if any imported files don't exist
    while IFS= read -r line; do
        file=$(echo "$line" | grep -oP "@/\K[^'\"]*")
        if [ ! -z "$file" ]; then
            full_path="${file}.tsx"
            if [ ! -f "$full_path" ] && [ ! -f "${file}.ts" ] && [ ! -f "${file}.js" ]; then
                echo "  ⚠️  Potential missing import: $file"
                ((ERROR_COUNT++))
            fi
        fi
    done < /tmp/imports.txt
fi

if [ $ERROR_COUNT -eq 0 ]; then
    echo "  ✅ All imports look good"
fi

# Check for duplicate keys in Tailwind config
echo ""
echo "🎨 Checking Tailwind config..."
if [ -f "tailwind.config.ts" ]; then
    if grep -A 50 "extend:" tailwind.config.ts | grep "colors:" | uniq -d | wc -l | grep -qv "^0$"; then
        echo "  ⚠️  Possible duplicate color definitions"
        ((ERROR_COUNT++))
    else
        echo "  ✅ Tailwind config looks good"
    fi
fi

# Check for console.logs (should be removed in production)
echo ""
echo "🐛 Checking for debug code..."
DEBUG_COUNT=$(grep -r "console.log" app components lib 2>/dev/null | grep -v "node_modules" | grep -v ".next" | wc -l)
if [ $DEBUG_COUNT -gt 0 ]; then
    echo "  ⚠️  Found $DEBUG_COUNT console.log statements"
    echo "     (These should be removed before production)"
else
    echo "  ✅ No debug statements found"
fi

# Check for TypeScript errors (quick check)
echo ""
echo "📘 Running TypeScript check..."
if npx tsc --noEmit --pretty false 2>&1 | grep -q "error TS"; then
    echo "  ⚠️  TypeScript errors detected"
    echo "     Run 'npx tsc --noEmit' for details"
    ((ERROR_COUNT++))
else
    echo "  ✅ No TypeScript errors"
fi

echo ""
echo "================================"
if [ $ERROR_COUNT -eq 0 ]; then
    echo "✅ All checks passed! Safe to run dev server."
else
    echo "⚠️  Found $ERROR_COUNT potential issues"
    echo "   Review and fix before continuing"
fi
echo "================================"
