#!/usr/bin/env bash
# Verify Messmass resolves the published GDS packages required by the current SSOT.
set -euo pipefail

EXPECTED_VERSION="${GDS_VERSION:-3.9.0}"
PACKAGES=(
  "@sovereignsquad/gds-theme@${EXPECTED_VERSION}"
  "@sovereignsquad/gds-core@${EXPECTED_VERSION}"
  "@sovereignsquad/gds-admin@${EXPECTED_VERSION}"
)

echo "Verifying published GDS packages at ${EXPECTED_VERSION}..."
npm ls "${PACKAGES[@]}" --depth=0

echo "GDS package resolution is current."
