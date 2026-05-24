#!/usr/bin/env bash
# Copy built @gds/* artifacts from a separate general-design-system checkout into Messmass.
set -euo pipefail

GDS_ROOT="${GDS_ROOT:-${GDS_SSOT_ROOT:-/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM}}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ ! -d "$GDS_ROOT/packages/gds-core/dist" ]]; then
  echo "GDS package dist not found at: $GDS_ROOT"
  echo "Make sure the general-design-system repo is built first:"
  echo "  cd $GDS_ROOT && npm run build"
  exit 1
fi

echo "Copying @gds packages from: $GDS_ROOT"
mkdir -p "$ROOT/packages/gds-theme" "$ROOT/packages/gds-core" "$ROOT/packages/gds-admin"

# Copy package files (package.json, dist)
cp "$GDS_ROOT/packages/gds-theme/package.json" "$ROOT/packages/gds-theme/"
rm -rf "$ROOT/packages/gds-theme/dist"
cp -R "$GDS_ROOT/packages/gds-theme/dist" "$ROOT/packages/gds-theme/"

cp "$GDS_ROOT/packages/gds-core/package.json" "$ROOT/packages/gds-core/"
rm -rf "$ROOT/packages/gds-core/dist"
cp -R "$GDS_ROOT/packages/gds-core/dist" "$ROOT/packages/gds-core/"

cp "$GDS_ROOT/packages/gds-admin/package.json" "$ROOT/packages/gds-admin/"
rm -rf "$ROOT/packages/gds-admin/dist"
cp -R "$GDS_ROOT/packages/gds-admin/dist" "$ROOT/packages/gds-admin/"

echo "GDS packages successfully synced into Messmass!"
