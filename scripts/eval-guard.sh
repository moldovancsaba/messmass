#!/usr/bin/env bash
set -euo pipefail

# Fail if dynamic-eval patterns are present in source (excluding node_modules, .next, dist)
ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
echo "Running eval-guard in $ROOT_DIR"
if grep -RIn --exclude-dir={node_modules,.next,dist,build} --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' -E "new Function|\beval\s*\(|\bFunction\s*\(" "$ROOT_DIR"; then
  echo "ERROR: dynamic-eval patterns found. Please remove or justify." >&2
  exit 2
fi
echo "No dynamic-eval patterns detected."
