#!/usr/bin/env bash
# Verify Messmass resolves the GDS packages required by the current SSOT.
# package.json currently pins these to vendored GitHub Release tarballs
# (file:vendor/gds/*.tgz), not a live registry install -- a prior registry
# install attempt was abandoned (see HANDOVER.md section 2 history). This
# drift-guard exists because that exact gap (package.json declaring one
# version while node_modules resolved a stale, unrelated one) went
# undetected for three majors before an audit caught it.
set -euo pipefail

EXPECTED_VERSION="${GDS_VERSION:-6.3.0}"
PACKAGES=(
  "@sovereignsquad/gds-theme@${EXPECTED_VERSION}"
  "@sovereignsquad/gds-core@${EXPECTED_VERSION}"
  "@sovereignsquad/gds-admin@${EXPECTED_VERSION}"
)

echo "Verifying GDS packages at ${EXPECTED_VERSION}..."
npm ls "${PACKAGES[@]}" --depth=0

echo "GDS package resolution is current."
