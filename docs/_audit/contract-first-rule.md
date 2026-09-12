# Contract-first rule (fleet)

Enforced from 2026-08-20 (fleet remediation #355). Applies to all five repos
(messmass, camera, fanmass, try-on, savetheworld).

**Rule:** any change to a cross-app surface must update its contract doc IN THE
SAME COMMIT:
- a shared MongoDB collection or its shape → update `docs/_audit/fleet-architecture.md`
  (canonical, in messmass) and, for camera/try-on, `docs/TRYON_ATLAS_CONTRACT.md`.
- a cross-app endpoint or integration token → update the fleet map's affected
  edge card and re-stamp its `verified @ <sha>` on both sides.
- an env var that gates a cross-app call → update the repo's
  `docs/_audit/api-reference.md` and `.env.example`.

**Version rule:** every release bumps ALL FIVE apps to the same new version in one
coordinated change (`docs/_audit/fleet-version-policy.md`), even for a
version-only commit. Re-aligned to 12.3.33 on 2026-09-08 after a month of
independent bumps; the rule is a convention, not a CI check.

**Inventory rule:** regenerate `docs/_audit/*.json` with
`python3 scripts/fleet-audit-inventory.py --write` when routes/collections/env
change, and commit the diff in the same PR (that diff IS the contract-first
signal). CI runs `python3 scripts/fleet-audit-inventory.py --check` (npm alias
`inventory:check`) in all four repos and fails when the committed JSON no longer
matches the code, so a forgotten `--write` blocks the push (messmass#355).

**Quarterly:** re-run the audit method (both-sides, code-is-truth) using the
issue template at `.github/ISSUE_TEMPLATE/fleet-reaudit.md`.
