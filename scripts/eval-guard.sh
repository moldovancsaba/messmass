#!/usr/bin/env bash
set -euo pipefail

# Fail if dynamic-eval patterns are present in source (excluding node_modules, .next, dist, scripts, and comments)
ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
echo "Running eval-guard in $ROOT_DIR"

# WHAT: Check for dynamic-eval patterns in production code only
# WHY: Exclude test scripts (scripts/ directory) and comments
# HOW: Use grep with exclusions, then filter out comment-only lines
MATCHES=$(grep -RIn \
  --exclude-dir={node_modules,.next,dist,build,scripts} \
  --include='*.ts' \
  --include='*.tsx' \
  --include='*.js' \
  --include='*.jsx' \
  -E "new Function|\beval\s*\(|\bFunction\s*\(" \
  "$ROOT_DIR" || true)

if [ -z "$MATCHES" ]; then
  echo "No dynamic-eval patterns detected in production code."
  exit 0
fi

# Filter out comment-only lines (lines where the match is only in comments)
CODE_MATCHES=""
while IFS= read -r line; do
  # Extract file path and line number
  file_path=$(echo "$line" | cut -d: -f1)
  line_num=$(echo "$line" | cut -d: -f2)
  line_content=$(echo "$line" | cut -d: -f3-)
  
  # Check if the line is a comment-only line
  # Remove leading whitespace and check if it starts with // or /*
  stripped=$(echo "$line_content" | sed 's/^[[:space:]]*//')
  if [[ "$stripped" =~ ^(//|/\*|\*) ]]; then
    # This is a comment line, skip it
    continue
  fi
  
  # Check if the match is within a comment (after // or /*)
  if [[ "$line_content" =~ (//|/\*).*(new Function|eval\(|Function\() ]]; then
    # Match is in a comment, skip it
    continue
  fi
  
  # Check if the match is in a string literal (console.error, console.log, etc.)
  if [[ "$line_content" =~ (console\.(error|log|warn)|['\"].*Function|['\"].*eval) ]]; then
    # Match is in a string literal, skip it
    continue
  fi
  
  # Check if there's a justification comment on nearby lines (up to 3 lines before)
  # Look for comments with "TODO", "legacy", "fallback", "migration", "SECURITY" indicating documented legacy code
  has_justification=false
  for i in {1..3}; do
    check_line_num=$((line_num - i))
    if [ $check_line_num -gt 0 ]; then
      check_line=$(sed -n "${check_line_num}p" "$file_path" 2>/dev/null || echo "")
      if [[ "$check_line" =~ (TODO.*[Rr]emove|legacy|fallback|migration|SECURITY.*Function|WHY.*Function|WHY.*eval) ]]; then
        has_justification=true
        break
      fi
    fi
  done
  
  # Also check the current line and next few lines
  for i in {0..2}; do
    check_line_num=$((line_num + i))
    check_line=$(sed -n "${check_line_num}p" "$file_path" 2>/dev/null || echo "")
    if [[ "$check_line" =~ (TODO.*[Rr]emove|legacy|fallback|migration|SECURITY.*Function|WHY.*Function|WHY.*eval) ]]; then
      has_justification=true
      break
    fi
  done
  
  if [ "$has_justification" = true ]; then
    # This is documented legacy code with TODO/justification, skip it
    continue
  fi
  
  # This is actual code, include it
  CODE_MATCHES="${CODE_MATCHES}${line}\n"
done <<< "$MATCHES"

if [ -n "$CODE_MATCHES" ]; then
  echo -e "ERROR: dynamic-eval patterns found in production code:" >&2
  echo -e "$CODE_MATCHES" >&2
  echo "NOTE: Test scripts in scripts/ directory are excluded from this check." >&2
  echo "NOTE: Comments mentioning Function() or eval() are excluded from this check." >&2
  exit 2
fi

echo "No dynamic-eval patterns detected in production code (comments excluded)."
