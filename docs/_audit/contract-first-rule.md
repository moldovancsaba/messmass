# Contract-first rule (fleet)

Enforced from 2026-08-20 (fleet remediation #355). Applies to all four repos.

**Rule:** any change to a cross-app surface must update its contract doc IN THE
SAME COMMIT:
- a shared MongoDB collection or its shape → update `docs/_audit/fleet-architecture.md`
  (canonical, in messmass) and, for camera/try-on, `docs/TRYON_ATLAS_CONTRACT.md`.
- a cross-app endpoint or integration token → update the fleet map's affected
  edge card and re-stamp its `verified @ <sha>` on both sides.
- an env var that gates a cross-app call → update the repo's
  `docs/_audit/api-reference.md` and `.env.example`.

**Version rule:** every release bumps ALL FOUR apps to the same new version in one
coordinated change (`docs/_audit/fleet-version-policy.md`), even for a
version-only commit.

**Inventory rule:** regenerate `docs/_audit/*.json` with
`scripts/fleet-audit-inventory.py` when routes/collections/env change, and commit
the diff in the same PR (that diff IS the contract-first signal).

**Quarterly:** re-run the audit method (both-sides, code-is-truth) using the
issue template at `.github/ISSUE_TEMPLATE/fleet-reaudit.md`.
