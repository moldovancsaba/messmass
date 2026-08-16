#!/usr/bin/env bash
# Verify Messmass resolves the GDS packages required by the current SSOT.
# As of 6.1.0, these install from the GitHub Packages registry
# (@sovereignsquad:registry in .npmrc, authenticated via GITHUB_TOKEN) rather
# than a vendored tarball -- vendored GitHub Release tarballs are documented
# upstream as "not a documented consumer install path", kept only for
# release-notes visibility/offline audit, not as something package.json
# depends on. This drift-guard exists because that exact gap (package.json
# declaring one version while node_modules resolved a stale, unrelated one)
# went undetected for three majors before an audit caught it.
set -euo pipefail

EXPECTED_VERSION="${GDS_VERSION:-6.1.0}"
PACKAGES=(
  "@sovereignsquad/gds-theme@${EXPECTED_VERSION}"
  "@sovereignsquad/gds-core@${EXPECTED_VERSION}"
  "@sovereignsquad/gds-admin@${EXPECTED_VERSION}"
)

echo "Verifying GDS packages at ${EXPECTED_VERSION}..."
npm ls "${PACKAGES[@]}" --depth=0

echo "GDS package resolution is current."
