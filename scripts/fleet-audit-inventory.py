#!/usr/bin/env python3
"""Fleet audit inventory scanner (audit P0).

Scans each SEYU fleet repo and writes machine-readable surface inventories to
<repo>/docs/_audit/: endpoints, Mongo collections, env vars, outbound hosts,
and markdown docs. These files are the denominator for every coverage claim
in the fleet documentation audit - "194 routes documented" only means
something against a generated, committed list of routes.

Usage: python3 scripts/fleet-audit-inventory.py [repo ...]
Defaults to the four umbrella repos under /Users/Shared/Projects.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

FLEET = ["messmass", "camera", "fanmass", "try-on"]
PROJECTS = Path("/Users/Shared/Projects")

SKIP_DIRS = {"node_modules", ".next", ".git", "vendor", ".venv311", ".venv", "coverage", "queue", "outputs", "gfpgan", "__pycache__"}

# Auth markers looked for inside a route handler file. Presence is recorded
# verbatim; absence of all of them flags the route "no-auth-marker" for the
# P2 audit to adjudicate (some routes are legitimately public).
AUTH_MARKERS = [
    "requireAuth", "requireAdminSession", "requirePageAccess", "requireFanmassIntegrationAuth",
    "requireCameraIntegrationAuth", "getServerSession", "isGlobalAdminSession", "getAdminUser",
    "validateApiKey", "require_api_key", "api_key", "verifyMachineToken", "checkAuth",
    "withErrorHandler", "assertAdmin",
]

HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]


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


def main() -> int:
    targets = sys.argv[1:] or FLEET
    for name in targets:
        repo = PROJECTS / name
        if not repo.is_dir():
            print(f"skip {name}: not found")
            continue
        out_dir = repo / "docs" / "_audit"
        out_dir.mkdir(parents=True, exist_ok=True)
        routes = scan_next_routes(repo) or scan_py_routes(repo)
        inventory = {
            "endpoints.json": routes,
            "collections.json": scan_collections(repo),
            "env.json": scan_env(repo),
            "outbound-hosts.json": scan_outbound(repo),
            "docs.json": scan_docs(repo),
        }
        meta = {
            "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "repo": name,
            "head": git_head(repo),
            "counts": {k.split(".")[0]: len(v) for k, v in inventory.items()},
        }
        for filename, payload in inventory.items():
            (out_dir / filename).write_text(json.dumps({"_meta": meta, "items": payload}, indent=1) + "\n")
        no_auth = [r for r in routes if r.get("no_auth_marker")]
        print(f"{name} @ {meta['head']}: {meta['counts']} | routes without auth marker: {len(no_auth)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
