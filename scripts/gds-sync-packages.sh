#!/usr/bin/env bash
# Verify Messmass resolves the GDS packages required by the current SSOT.
# As of 6.0.0, these are vendored tarballs under vendor/gds/ (file: dependencies
# in package.json) rather than resolved from the public registry -- npm ls still
# reports the package's own declared version regardless of install source, so
# this check works unchanged against the vendored packages.
set -euo pipefail

EXPECTED_VERSION="${GDS_VERSION:-6.0.0}"
PACKAGES=(
  "@sovereignsquad/gds-theme@${EXPECTED_VERSION}"
  "@sovereignsquad/gds-core@${EXPECTED_VERSION}"
  "@sovereignsquad/gds-admin@${EXPECTED_VERSION}"
)

echo "Verifying vendored GDS packages at ${EXPECTED_VERSION}..."
npm ls "${PACKAGES[@]}" --depth=0

echo "GDS package resolution is current."
