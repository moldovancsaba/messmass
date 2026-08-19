---
name: Fleet re-audit (quarterly)
about: Re-verify docs/API/architecture truth across the four SEYU apps
title: "Fleet re-audit — <quarter>"
labels: fleet-remediation, type:docs
---

## Method (do not skip)
- Code is truth; docs are claims. Every claim gets a verdict (CURRENT/STALE/
  WRONG/MISSING) with `file:line` evidence.
- Both-sides rule: an integration is CURRENT only when BOTH repos' code agree.
- Regenerate inventories: `python3 scripts/fleet-audit-inventory.py` (in messmass);
  diff `docs/_audit/*.json` per repo.

## Checklist
- [ ] Inventories regenerated; endpoint/collection/env drift reviewed.
- [ ] `docs/_audit/fleet-architecture.md` edges re-verified + SHAs re-stamped.
- [ ] Each repo's `docs/_audit/api-reference.md` re-checked for new/removed routes.
- [ ] All four apps still on the same version (`docs/_audit/fleet-version-policy.md`).
- [ ] Contract-first rule honoured since last audit (spot-check recent cross-app commits).
- [ ] Security posture re-checked (auth on new routes; no new unauthenticated mutations).
- [ ] Drift register updated; WRONG findings fixed or ticketed.
