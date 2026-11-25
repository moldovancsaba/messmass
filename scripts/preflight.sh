#!/usr/bin/env bash
# scripts/preflight.sh
# WHAT: Regenerate every derived artifact cleanly, then run the exact 100% gate
#     suite from .github/workflows/ci.yml in deterministic order, stopping on
#     the first failure.
# WHY: Guarantees zero drift between local pre-push validation, GitHub Actions
#     CI, and Vercel production builds.
#
#   npm run preflight

set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Regenerating derived artifacts (inventory -> architecture)"
python3 scripts/fleet-audit-inventory.py --write
node scripts/generate-architecture-sections.js

echo "==> type-check"
npm run type-check

echo "==> lint"
npm run lint

echo "==> test"
npm test

echo "==> style:check"
npm run style:check

echo "==> version:verify"
npm run version:verify

echo "==> docs:audit"
npm run docs:audit

echo "==> inventory:check"
npm run inventory:check

echo "==> gds:sync"
npm run gds:sync

echo "==> gds-compliance"
npx gds-compliance check --manifest ./gds-adoption.json

echo "==> comments:check"
npm run comments:check

echo "==> comments:versions"
npm run comments:versions

echo "==> architecture:check"
npm run architecture:check

echo "==> check-dependency-guardrail"
npx tsx scripts/check-dependency-guardrail.ts

echo "==> check-layout-grammar-guardrail"
npx tsx scripts/check-layout-grammar-guardrail.ts

echo "==> build"
npm run build

echo ""
echo "✅ preflight passed — safe to commit and push."
