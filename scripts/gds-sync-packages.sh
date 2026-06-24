#!/usr/bin/env bash
# Verify Messmass resolves the published GDS packages required by the current SSOT.
set -euo pipefail

EXPECTED_VERSION="${GDS_VERSION:-3.4.6}"
PACKAGES=(
  "@doneisbetter/gds-theme@${EXPECTED_VERSION}"
  "@doneisbetter/gds-core@${EXPECTED_VERSION}"
  "@doneisbetter/gds-admin@${EXPECTED_VERSION}"
)

echo "Verifying published GDS packages at ${EXPECTED_VERSION}..."
npm ls "${PACKAGES[@]}" --depth=0

echo "GDS package resolution is current."
