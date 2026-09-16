#!/usr/bin/env bash
# scripts/preflight.sh
# WHAT: Regenerate every derived artifact, then run the same gates CI runs, in
#     the same order, stopping on the first failure.
# WHY: architecture:check failed on two pushes in one session (423894e2,
#     4e907f7e) because the agent working this repo read truncated `tail -N`
#     output from separate commands and committed before noticing a nonzero
#     result sitting a few lines above the cut. The gate did its job both
#     times; nothing read it. This exists so "run the gates" means one command
#     with one exit code, not a sequence of greppable summaries.
# HOW: Regeneration first — architecture sections and the fleet inventory are
#     BUILT FROM the code, so they must be rebuilt before being checked, not
#     just checked. Then the full CI gate list from .github/workflows/ci.yml,
#     in its order. `set -e` means the script stops at the first failure with
#     that failure's real output on screen, not a summary of it.
#
#   npm run preflight

set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Regenerating derived artifacts"
# Order matters: generate-architecture-sections.js reads docs/_audit/endpoints.json
# to build the route tables, so the inventory must be rebuilt from the filesystem
# FIRST. Reversed, architecture.md gets generated from the previous run's stale
# inventory and architecture:check fails immediately afterward — which is exactly
# what happened the first time this script ran.
python3 scripts/fleet-audit-inventory.py --write
node scripts/generate-architecture-sections.js

echo "==> type-check"
npm run type-check

echo "==> lint"
npm run lint

echo "==> style:check"
npm run style:check

echo "==> version:verify"
npm run version:verify

echo "==> docs:audit"
npm run docs:audit

echo "==> inventory:check"
npm run inventory:check

echo "==> comments:check"
npm run comments:check

echo "==> comments:versions"
npm run comments:versions

echo "==> architecture:check"
npm run architecture:check

echo "==> gds-compliance"
npx gds-compliance check --manifest ./gds-adoption.json

echo "==> test"
npm test

echo "==> build"
npm run build

echo ""
echo "✅ preflight passed — safe to commit and push."
