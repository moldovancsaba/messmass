#!/usr/bin/env python3
"""Fleet audit inventory scanner + anti-rot check.

Scans a SEYU fleet repo and writes machine-readable surface inventories to
<repo>/docs/_audit/: endpoints, Mongo collections, env vars, outbound hosts,
and markdown docs. These files are the denominator for every coverage claim
in the fleet documentation audit - "194 routes documented" only means
something against a generated, committed list of routes.

Modes (fleet remediation messmass#355 — the same file is vendored into every
fleet repo so each CI runs the identical check):

  --write            regenerate docs/_audit/*.json for this repo (default
                     repo = the current directory; pass --repo <path>).
  --check            rescan and compare against the committed inventories;
                     exit 1 and print the drift when they differ. This is the
                     CI gate: a route, collection, env var, outbound host or
                     doc added without regenerating the inventory fails CI.
  --self-test        prove the check can fail: mutate the fresh scan in memory
                     and assert the comparison reports drift. Exit 0 = the
                     gate works; exit 1 = the gate is broken (would never fail).

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

SKIP_DIRS = {"node_modules", ".next", ".git", "vendor", ".venv311", ".venv", "coverage", "queue", "outputs", "gfpgan", "__pycache__", ".claude"}

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
    api_root = repo / "app" / "api"
    if not api_root.is_dir():
        return routes
    for route_file in sorted(api_root.rglob("route.ts")):
        rel = route_file.relative_to(repo)
        url = "/" + str(route_file.parent.relative_to(repo / "app")).replace("\\", "/")
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


def check(repo: Path) -> int:
    drift = diff_inventory(load_committed(repo), scan_repo(repo))
    if not drift:
        print("inventory check: docs/_audit/*.json match the code")
        return 0
    print("inventory check: DRIFT - the code changed but docs/_audit/*.json was not regenerated")
    for line in drift:
        print("  " + line)
    print("fix: python3 scripts/fleet-audit-inventory.py --write  (then document the change and commit both)")
    return 1


def self_test(repo: Path) -> int:
    fresh = scan_repo(repo)
    assert diff_inventory(fresh, fresh) == [], "identical inventories must not report drift"
    mutated = {k: list(v) for k, v in fresh.items()}
    mutated["endpoints.json"] = mutated["endpoints.json"] + [{"path": "/api/__self_test__", "methods": ["GET"], "file": "x", "auth_markers": [], "no_auth_marker": True}]
    mutated["env.json"] = [e for e in mutated["env.json"] if e != mutated["env.json"][0]] if mutated["env.json"] else ["__SELF_TEST__"]
    drift = diff_inventory(fresh, mutated)
    ok = any("__self_test__" in d for d in drift) and len(drift) >= 2
    print(f"self-test: {'PASS' if ok else 'FAIL'} - a stale inventory {'is' if ok else 'is NOT'} detected ({len(drift)} drift lines)")
    return 0 if ok else 1


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
