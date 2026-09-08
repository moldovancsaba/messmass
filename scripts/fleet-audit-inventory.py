#!/usr/bin/env python3
"""Fleet audit inventory scanner + docs anti-rot check.

Scans a SEYU fleet repo and writes machine-readable surface inventories to
<repo>/docs/_audit/: endpoints, Mongo collections, env vars, outbound hosts,
and markdown docs. These files are the denominator for every coverage claim
in the fleet documentation audit - "194 routes documented" only means
something against a generated, committed list of routes.

Modes (fleet remediation messmass#355 - the same file is vendored into every
fleet repo so each CI runs the identical check):

  --write            regenerate docs/_audit/*.json for this repo (default
                     repo = the current directory; pass --repo <path>).
  --check            the CI gate, three parts:
                       1. inventory drift: rescan and compare against the
                          committed inventories; a route, collection, env var,
                          outbound host or doc added without regenerating them
                          FAILS.
                       2. broken links: every relative markdown link in docs/
                          and the root *.md files must resolve; a broken one
                          FAILS.
                       3. contract freshness: "verified @ <sha>" /
                          "Verified <repo> `<sha>`" stamps in docs/_audit and
                          the contract docs are measured against HEAD; more
                          than 30 commits behind WARNS (commit distance alone
                          is a reason to look, not proof of drift); a sha that
                          does not resolve in this repo's history at all, or
                          one more than 90 commits behind HEAD, FAILS (see
                          CONTRACT_FRESHNESS_FAIL_THRESHOLD below).
  --self-test        prove the gate can fail: mutate a fresh scan in memory and
                     feed a broken link to the link resolver; exit 0 only if
                     both are detected.

Legacy fleet mode (no flag, optional repo names) still writes all four repos
under /Users/Shared/Projects for the audit workstation.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

FLEET = ["messmass", "camera", "fanmass", "try-on"]
PROJECTS = Path("/Users/Shared/Projects")

SKIP_DIRS = {"node_modules", ".next", ".git", "vendor", ".venv311", ".venv", "coverage", "queue", "outputs", "gfpgan", "__pycache__", ".claude", ".pytest_cache", ".ruff_cache", ".mypy_cache"}

# Auth markers looked for inside a route handler file. Presence is recorded
# verbatim; absence of all of them flags the route "no-auth-marker" for the
# P2 audit to adjudicate (some routes are legitimately public).
AUTH_MARKERS = [
    "requireAuth", "requireAdminSession", "requirePageAccess", "requireFanmassIntegrationAuth",
    "requireCameraIntegrationAuth", "getServerSession", "isGlobalAdminSession", "getAdminUser",
    "validateApiKey", "require_api_key", "api_key", "verifyMachineToken", "checkAuth",
    "withErrorHandler", "assertAdmin", "requireSession", "requireAdmin",
]

HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]
INVENTORY_FILES = ["endpoints.json", "collections.json", "env.json", "outbound-hosts.json", "docs.json"]

# Contract freshness: how many commits behind HEAD a verification stamp may be
# before it is worth re-verifying the edge it describes (mirrors messmass's
# docs-consistency-audit.js threshold). 30 commits behind is "look at this
# soon" - a warning, not proof the contract is wrong.
CONTRACT_FRESHNESS_COMMIT_THRESHOLD = 30
# 3x the warn threshold. A stamp this far behind HEAD has gone stale enough
# that keeping the check green is actively misleading, not just "worth a
# look" - so it's a hard fail, not a warning. A sha that doesn't resolve in
# this repo's history at all (typo, rewritten history, copied from another
# repo without naming it) fails for the same reason: the "verified" claim
# can't even be checked, let alone trusted.
CONTRACT_FRESHNESS_FAIL_THRESHOLD = 90
# Group 1 = the repo the stamp names (empty for the bare "verified @ <sha>" form), group 2 = the sha.
STAMP_RE = re.compile(r"[Vv]erified\s+(?:@\s*|(messmass|camera|fanmass|try-on)\s+)?`?([0-9a-f]{7,40})`?")
LINK_RE = re.compile(r"\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")


def source_files(root: Path, exts: tuple[str, ...]) -> list[Path]:
    out = []
    for path in root.rglob("*"):
        if path.suffix not in exts or not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        out.append(path)
    return out


def scan_next_routes(repo: Path) -> list[dict]:
    routes = []
    # Next.js app router lives at app/ or src/app/ (savetheworld uses src/).
    app_root = next((r for r in (repo / "app", repo / "src" / "app") if (r / "api").is_dir()), None)
    if app_root is None:
        return routes
    api_root = app_root / "api"
    for route_file in sorted(api_root.rglob("route.ts")):
        rel = route_file.relative_to(repo)
        url = "/" + str(route_file.parent.relative_to(app_root)).replace("\\", "/")
        text = route_file.read_text(errors="replace")
        methods = [m for m in HTTP_METHODS if re.search(rf"export\s+(async\s+)?function\s+{m}\b|export\s+const\s+{m}\b", text)]
        markers = sorted({m for m in AUTH_MARKERS if m in text})
        routes.append({
            "path": url,
            "methods": methods or ["?"],
            "file": str(rel),
            "auth_markers": markers,
            "no_auth_marker": not [m for m in markers if m != "withErrorHandler"],
        })
    return routes


def scan_py_routes(repo: Path) -> list[dict]:
    routes = []
    decorator = re.compile(r"@(?:fastapi_app|app)\.(get|post|put|patch|delete|options|head)\(\s*[\"']([^\"']+)[\"']")
    for py in source_files(repo, (".py",)):
        text = py.read_text(errors="replace")
        for match in decorator.finditer(text):
            line = text[: match.start()].count("\n") + 1
            routes.append({
                "path": match.group(2),
                "methods": [match.group(1).upper()],
                "file": f"{py.relative_to(repo)}:{line}",
                "auth_markers": [],
                "no_auth_marker": True,  # python apps: adjudicated in P2 (api_key middleware vs localhost bind)
            })
    routes.sort(key=lambda r: (r["path"], r["methods"]))
    return routes


def scan_collections(repo: Path) -> list[str]:
    names: set[str] = set()
    patterns = [
        re.compile(r"\.collection(?:<[^>]+>)?\(\s*[\"']([A-Za-z0-9_.-]+)[\"']"),
        re.compile(r"db\[\s*[\"']([A-Za-z0-9_.-]+)[\"']\s*\]"),
        re.compile(r"COLLECTIONS\.[A-Z_]+\s*[:=]\s*[\"']([A-Za-z0-9_.-]+)[\"']"),
        re.compile(r"[\"']([a-z][a-z0-9_]{2,})[\"']\s*:\s*[\"'][a-z][a-z0-9_]+[\"'],?\s*//\s*collection", re.I),
    ]
    for src in source_files(repo, (".ts", ".tsx", ".py")):
        text = src.read_text(errors="replace")
        for pat in patterns:
            names.update(pat.findall(text))
    return sorted(names)


def scan_env(repo: Path) -> list[str]:
    names: set[str] = set()
    pats = [
        re.compile(r"process\.env\.([A-Z][A-Z0-9_]+)"),
        re.compile(r"process\.env\[[\"']([A-Z][A-Z0-9_]+)[\"']\]"),
        re.compile(r"os\.getenv\(\s*[\"']([A-Z][A-Z0-9_]+)[\"']"),
        re.compile(r"os\.environ(?:\.get)?[\(\[]\s*[\"']([A-Z][A-Z0-9_]+)[\"']"),
    ]
    for src in source_files(repo, (".ts", ".tsx", ".py", ".mjs")):
        text = src.read_text(errors="replace")
        for pat in pats:
            names.update(pat.findall(text))
    return sorted(names)


def scan_outbound(repo: Path) -> list[str]:
    hosts: set[str] = set()
    pat = re.compile(r"https?://([A-Za-z0-9.-]+\.[A-Za-z]{2,})")
    for src in source_files(repo, (".ts", ".tsx", ".py", ".mjs")):
        for host in pat.findall(src.read_text(errors="replace")):
            if host.endswith(("localhost", "127.0.0.1")) or "example" in host or host.endswith((".test", ".local")):
                continue
            hosts.add(host.lower())
    return sorted(hosts)


def scan_docs(repo: Path) -> list[dict]:
    docs = []
    for md in sorted(repo.rglob("*.md")):
        if any(part in SKIP_DIRS for part in md.parts):
            continue
        first_heading = ""
        for line in md.read_text(errors="replace").splitlines():
            if line.startswith("#"):
                first_heading = line.lstrip("# ").strip()
                break
        docs.append({"file": str(md.relative_to(repo)), "title": first_heading})
    return docs


def git_head(repo: Path) -> str:
    return subprocess.run(["git", "-C", str(repo), "rev-parse", "--short", "HEAD"],
                          capture_output=True, text=True).stdout.strip()


def scan_repo(repo: Path) -> dict[str, list]:
    routes = scan_next_routes(repo) or scan_py_routes(repo)
    return {
        "endpoints.json": routes,
        "collections.json": scan_collections(repo),
        "env.json": scan_env(repo),
        "outbound-hosts.json": scan_outbound(repo),
        "docs.json": scan_docs(repo),
    }


def write_inventory(repo: Path, name: str, inventory: dict[str, list]) -> dict:
    out_dir = repo / "docs" / "_audit"
    out_dir.mkdir(parents=True, exist_ok=True)
    meta = {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "repo": name,
        "head": git_head(repo),
        "counts": {k.split(".")[0]: len(v) for k, v in inventory.items()},
    }
    for filename, payload in inventory.items():
        (out_dir / filename).write_text(json.dumps({"_meta": meta, "items": payload}, indent=1) + "\n")
    no_auth = [r for r in inventory["endpoints.json"] if r.get("no_auth_marker")]
    print(f"{name} @ {meta['head']}: {meta['counts']} | routes without auth marker: {len(no_auth)}")
    return meta


def load_committed(repo: Path) -> dict[str, list]:
    out: dict[str, list] = {}
    for filename in INVENTORY_FILES:
        path = repo / "docs" / "_audit" / filename
        if not path.is_file():
            out[filename] = None  # type: ignore[assignment]
            continue
        out[filename] = json.loads(path.read_text()).get("items", [])
    return out


def _key(item) -> str:
    return json.dumps(item, sort_keys=True) if isinstance(item, (dict, list)) else str(item)


def diff_inventory(committed: dict[str, list], fresh: dict[str, list]) -> list[str]:
    """Return human-readable drift lines; empty means the inventories agree.

    Only the items are compared - never `_meta` (timestamp / head), so a
    regenerated-but-unchanged inventory is not drift."""
    lines: list[str] = []
    for filename in INVENTORY_FILES:
        old = committed.get(filename)
        new = fresh[filename]
        if old is None:
            lines.append(f"{filename}: missing from docs/_audit (never generated)")
            continue
        old_keys = {_key(i) for i in old}
        new_keys = {_key(i) for i in new}
        for k in sorted(new_keys - old_keys):
            lines.append(f"{filename}: + {k}")
        for k in sorted(old_keys - new_keys):
            lines.append(f"{filename}: - {k}")
    return lines


# ---------------------------------------------------------------------------
# Broken-link check
# ---------------------------------------------------------------------------

def _link_targets(text: str) -> list[str]:
    text = re.sub(r"```[\s\S]*?```", " ", text)  # fenced code is not navigation
    text = re.sub(r"`[^`\n]*`", " ", text)       # neither is inline code
    return [m.group(1) for m in LINK_RE.finditer(text)]


def broken_links(repo: Path, md: Path, text: str) -> list[tuple[str, str]]:
    """(link, resolved-path) pairs for relative links in `text` that do not exist."""
    out: list[tuple[str, str]] = []
    for target in _link_targets(text):
        t = target.strip()
        if t.startswith(("http://", "https://", "mailto:", "#", "<")) or "://" in t:
            continue
        t = t.split("#", 1)[0].strip()
        t = re.sub(r":\d+(?::\d+)?$", "", t)  # editor-style path:line[:col] references point at the file
        if not t or t.startswith("$") or "{" in t:
            continue
        candidate = (repo / t.lstrip("/")) if t.startswith("/") else (md.parent / t)
        try:
            resolved = candidate.resolve(strict=False)
        except OSError:
            resolved = candidate
        if not resolved.exists():
            # repo-root-relative links are common in this fleet's docs. A link that
            # starts with "/" is always taken as repo-root-relative, never as a path on
            # the author's machine: a machine-absolute link resolves on one laptop and
            # on nothing else (found in CI, where /Users/... does not exist).
            root_rel = (repo / t.lstrip("/")).resolve(strict=False)
            if root_rel.exists():
                continue
            out.append((target, str(resolved.relative_to(repo.resolve()) if str(resolved).startswith(str(repo.resolve())) else resolved)))
    return out


def link_check(repo: Path) -> list[str]:
    files = [p for p in (repo / "docs").rglob("*.md") if not any(part in SKIP_DIRS for part in p.parts)] if (repo / "docs").is_dir() else []
    files += [p for p in repo.glob("*.md")]
    lines: list[str] = []
    checked = 0
    for md in sorted(files):
        text = md.read_text(errors="replace")
        checked += len(_link_targets(text))
        for link, resolved in broken_links(repo, md, text):
            lines.append(f"{md.relative_to(repo)}: broken link {link} -> {resolved}")
    print(f"link check: {checked} relative/absolute links in {len(files)} markdown files, {len(lines)} broken")
    return lines


# ---------------------------------------------------------------------------
# Contract freshness (warn only)
# ---------------------------------------------------------------------------

def repo_slug(repo: Path) -> str:
    """Name of this repo as the fleet map spells it (from the origin URL, else the directory name)."""
    proc = subprocess.run(["git", "-C", str(repo), "remote", "get-url", "origin"], capture_output=True, text=True)
    url = proc.stdout.strip() if proc.returncode == 0 else ""
    name = re.sub(r"\.git$", "", url.rstrip("/").split("/")[-1]) if url else repo.name
    return name or repo.name


def freshness_check(repo: Path) -> tuple[list[str], list[str]]:
    """Check "verified @ <sha>" contract stamps against HEAD.

    Returns (warnings, failures):
      - a sha that does not resolve to a commit reachable from HEAD at all
        (typo, rewritten history, or a stamp copied from another repo
        without naming it) FAILS - the "verified" claim can't even be
        checked, let alone trusted.
      - a sha that resolves but is more than CONTRACT_FRESHNESS_FAIL_THRESHOLD
        commits behind HEAD FAILS - stale enough that keeping the check
        green is actively misleading.
      - anything else more than CONTRACT_FRESHNESS_COMMIT_THRESHOLD commits
        behind HEAD WARNS only, as before (commit distance is a reason to
        look, not proof of drift).
    """
    files = list((repo / "docs" / "_audit").glob("*.md")) if (repo / "docs" / "_audit").is_dir() else []
    files += list((repo / "docs").glob("*CONTRACT*.md")) if (repo / "docs").is_dir() else []
    warnings: list[str] = []
    failures: list[str] = []
    seen: set[str] = set()
    me = repo_slug(repo)
    shallow = subprocess.run(["git", "-C", str(repo), "rev-parse", "--is-shallow-repository"], capture_output=True, text=True).stdout.strip() == "true"
    if shallow:
        # A shallow CI checkout (fetch-depth 1) cannot count commits behind HEAD; the
        # stamps are measured on developer machines instead of producing false alarms.
        print("freshness: skipped on a shallow checkout (run locally on a full clone)")
        return warnings, failures
    for md in sorted(files):
        for named_repo, sha in STAMP_RE.findall(md.read_text(errors="replace")):
            # Stamps naming another fleet repo cannot be measured here (and a 7-char
            # prefix may collide with an unrelated local commit), so only this repo's
            # own stamps and the bare "verified @ <sha>" form are checked.
            if named_repo and named_repo != me:
                continue
            if sha in seen:
                continue
            seen.add(sha)
            resolves = subprocess.run(["git", "-C", str(repo), "cat-file", "-t", sha], capture_output=True, text=True).returncode == 0
            is_ancestor = resolves and subprocess.run(["git", "-C", str(repo), "merge-base", "--is-ancestor", sha, "HEAD"], capture_output=True, text=True).returncode == 0
            if not is_ancestor:
                failures.append(f"{md.relative_to(repo)}: verified @ {sha} does not resolve to a commit reachable from HEAD in this repo (rewritten history, a typo, or a stamp copied from another repo without its name) - the 'verified' claim cannot even be checked")
                continue
            behind = int(subprocess.run(["git", "-C", str(repo), "rev-list", "--count", f"{sha}..HEAD"], capture_output=True, text=True).stdout.strip() or 0)
            if behind > CONTRACT_FRESHNESS_FAIL_THRESHOLD:
                failures.append(f"{md.relative_to(repo)}: verified @ {sha} is {behind} commits behind HEAD (fail threshold {CONTRACT_FRESHNESS_FAIL_THRESHOLD}) - this contract claim has gone stale enough that keeping the check green is actively misleading, re-verify it")
            elif behind > CONTRACT_FRESHNESS_COMMIT_THRESHOLD:
                warnings.append(f"{md.relative_to(repo)}: verified @ {sha} is {behind} commits behind HEAD (warn threshold {CONTRACT_FRESHNESS_COMMIT_THRESHOLD}) - re-verify that contract")
    return warnings, failures


def check(repo: Path) -> int:
    failed = False
    drift = diff_inventory(load_committed(repo), scan_repo(repo))
    if drift:
        failed = True
        print("inventory check: DRIFT - the code changed but docs/_audit/*.json was not regenerated")
        for line in drift:
            print("  " + line)
        print("fix: python3 scripts/fleet-audit-inventory.py --write  (then document the change and commit both)")
    else:
        print("inventory check: docs/_audit/*.json match the code")

    broken = link_check(repo)
    if broken:
        failed = True
        for line in broken:
            print("  " + line)

    warnings, freshness_failures = freshness_check(repo)
    for w in warnings:
        print("freshness warning: " + w)
    if freshness_failures:
        failed = True
        for f in freshness_failures:
            print("freshness FAILURE: " + f)

    return 1 if failed else 0


def self_test(repo: Path) -> int:
    fresh = scan_repo(repo)
    assert diff_inventory(fresh, fresh) == [], "identical inventories must not report drift"
    mutated = {k: list(v) for k, v in fresh.items()}
    mutated["endpoints.json"] = mutated["endpoints.json"] + [{"path": "/api/__self_test__", "methods": ["GET"], "file": "x", "auth_markers": [], "no_auth_marker": True}]
    mutated["env.json"] = [e for e in mutated["env.json"] if e != mutated["env.json"][0]] if mutated["env.json"] else ["__SELF_TEST__"]
    drift = diff_inventory(fresh, mutated)
    drift_ok = any("__self_test__" in d for d in drift) and len(drift) >= 2
    link_ok = broken_links(repo, repo / "docs" / "__self_test__.md", "[x](./does-not-exist-__self_test__.md) and [ok](https://example.com)") != []
    print(f"self-test: {'PASS' if drift_ok else 'FAIL'} - a stale inventory {'is' if drift_ok else 'is NOT'} detected ({len(drift)} drift lines)")
    print(f"self-test: {'PASS' if link_ok else 'FAIL'} - a broken markdown link {'is' if link_ok else 'is NOT'} detected")
    return 0 if (drift_ok and link_ok) else 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--repo", default=None, help="repo root (default: current directory in --write/--check/--self-test mode)")
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("fleet", nargs="*", help="legacy fleet mode: repo names under /Users/Shared/Projects")
    args = parser.parse_args()

    if args.write or args.check or args.self_test:
        repo = Path(args.repo or ".").resolve()
        if args.self_test:
            return self_test(repo)
        if args.check:
            return check(repo)
        write_inventory(repo, repo.name, scan_repo(repo))
        return 0

    for name in args.fleet or FLEET:
        repo = PROJECTS / name
        if not repo.is_dir():
            print(f"skip {name}: not found")
            continue
        write_inventory(repo, name, scan_repo(repo))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
