#!/bin/bash

# Script: validate-input-patterns.sh
# Purpose: Detect aggressive parsing anti-patterns in form inputs
# Usage: ./scripts/validate-input-patterns.sh
# Exit: 0 if no issues, 1 if anti-patterns found

echo "🔍 Scanning for aggressive parsing anti-patterns..."
echo ""

FOUND_ISSUES=0

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to check for patterns (exclude select elements and comments)
check_pattern() {
  local pattern=$1
  local description=$2
  local files=$(grep -rn "$pattern" app/ components/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | grep -v ".next" | grep -v "<select" | grep -v "// " | grep -v "/\*")
  
  if [ ! -z "$files" ]; then
    echo -e "${RED}❌ Found: $description${NC}"
    echo "$files"
    echo ""
    FOUND_ISSUES=1
  fi
}

echo "Checking for parseInt/parseFloat in onChange..."
check_pattern "parseInt.*onChange" "parseInt() in onChange handler"
check_pattern "parseFloat.*onChange" "parseFloat() in onChange handler"
check_pattern "onChange.*parseInt" "parseInt() in onChange handler"
check_pattern "onChange.*parseFloat" "parseFloat() in onChange handler"

echo "Checking for Math operations in onChange..."
check_pattern "onChange.*Math\.max" "Math.max() in onChange handler"
check_pattern "onChange.*Math\.min" "Math.min() in onChange handler"
check_pattern "onChange.*Math\.floor" "Math.floor() in onChange handler"
check_pattern "onChange.*Math\.ceil" "Math.ceil() in onChange handler"
check_pattern "onChange.*Math\.round" "Math.round() in onChange handler"

echo "Checking for Number() constructor in onChange..."
check_pattern "onChange.*Number\(" "Number() constructor in onChange handler"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $FOUND_ISSUES -eq 0 ]; then
  echo -e "${GREEN}✅ No aggressive parsing anti-patterns found!${NC}"
  echo ""
  echo "All numeric inputs appear to follow blur-based parsing pattern."
  exit 0
else
  echo -e "${RED}⚠️  Found aggressive parsing anti-patterns!${NC}"
  echo ""
  echo "These patterns cause poor UX:"
  echo "  • Users can't delete '0' to enter new values"
  echo "  • Values reset immediately while typing"
  echo "  • Inconsistent with unified input system"
  echo ""
  echo "Fix by using one of these patterns:"
  echo ""
  echo "1. Use UnifiedNumberInput component:"
  echo "   import UnifiedNumberInput from '@/components/UnifiedNumberInput';"
  echo "   <UnifiedNumberInput value={val} onSave={setVal} min={0} />"
  echo ""
  echo "2. Use blur-based parsing:"
  echo "   onChange={(e) => setVal(e.target.value as any)}"
  echo "   onBlur={() => setVal(Math.max(0, parseInt(String(val)) || 0))}"
  echo ""
  echo "See docs/guides/FORM_INPUT_MIGRATION_GUIDE.md for details."
  echo ""
  exit 1
fi
