from __future__ import annotations

import re
from pathlib import Path
from datetime import datetime, timezone

LINK_RE = re.compile(r"\[[^\]]+\]\(([^)]+)\)")


def is_url(s: str) -> bool:
    return s.startswith('http://') or s.startswith('https://') or s.startswith('mailto:')


def normalize_target(src: Path, target: str) -> Path | None:
    # ignore anchors
    target = target.strip()
    if is_url(target):
        return None
    # strip fragment
    target = target.split('#', 1)[0].strip()
    if not target:
        return None

    # Ignore non-md assets and in-page refs
    # Repo-root-ish links are common in this repo's docs.
    # Treat these as repo-root relative (rather than relative to the current doc).
    repo_root_prefixes = (
        'docs/',
        'app/',
        'components/',
        'lib/',
        'scripts/',
        'hooks/',
        'server/',
        'public/',
    )

    if target.startswith('/'):
        t = Path(target.lstrip('/'))
    elif target.startswith(repo_root_prefixes):
        t = Path(target)
    else:
        t = (src.parent / target)

    # Normalize `..` segments without requiring existence.
    try:
        return t.resolve(strict=False)
    except Exception:
        return t


def main() -> None:
    docs_root = Path('docs')
    md_files = sorted(docs_root.rglob('*.md'))

    broken = []
    checked = 0

    for p in md_files:
        try:
            text = p.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            text = p.read_bytes().decode('utf-8', errors='replace')

        # Ignore links inside fenced code blocks. We commonly embed snippets or even archived text
        # that may contain markdown-looking links that shouldn't be treated as navigational docs links.
        text = re.sub(r"```[\s\S]*?```", " ", text)

        for m in LINK_RE.finditer(text):
            target = m.group(1)
            # Ignore special patterns
            if target.startswith('`'):
                continue
            tpath = normalize_target(p, target)
            if tpath is None:
                continue
            checked += 1
            # If link has no extension, allow directories
            if tpath.suffix == '' and tpath.exists():
                continue
            if not tpath.exists():
                broken.append((str(p), target, str(tpath)))

    out = []
    out.append('# Docs Link Check')
    out.append('Status: Active')
    last_updated = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')
    out.append(f'Last Updated: {last_updated}')
    out.append('Canonical: Yes')
    out.append('Owner: Documentation')
    out.append('')
    out.append(f'Checked {checked} markdown links under `docs/`.')
    out.append(f'Broken links found: {len(broken)}')
    out.append('')

    out.append('| Source | Link | Resolved Path |')
    out.append('|---|---|---|')
    for src, link, resolved in broken:
        out.append(f'| {src} | {link} | {resolved} |')
    out.append('')

    Path('docs/_meta/meta-docs-link-check.md').write_text('\n'.join(out) + '\n', encoding='utf-8')
    print('wrote docs/_meta/meta-docs-link-check.md')


if __name__ == '__main__':
    main()
