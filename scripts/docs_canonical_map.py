from __future__ import annotations

import datetime
import re
from pathlib import Path


def parse_header(text: str) -> dict:
    meta = {'title': None, 'status': None, 'last_updated': None, 'canonical': None, 'owner': None}
    for line in text.splitlines()[:40]:
        if meta['title'] is None and line.startswith('# '):
            meta['title'] = line[2:].strip()
        m = re.match(r'^(Status|Last Updated|Canonical|Owner):\s*(.+?)\s*$', line)
        if m:
            key = m.group(1)
            val = m.group(2)
            if key == 'Status':
                meta['status'] = val
            elif key == 'Last Updated':
                meta['last_updated'] = val
            elif key == 'Canonical':
                meta['canonical'] = val
            elif key == 'Owner':
                meta['owner'] = val
    return meta


def classify(path: Path, meta: dict) -> tuple[str, str]:
    p = str(path)

    if '/_meta/' in p:
        return ('generated', 'Auto-generated inventory/triage artifacts. Do not edit by hand.')

    if '/_archive/' in p or '/archive/' in p:
        return ('archive', 'Historical material. Not a source of truth; keep for traceability.')

    canonical = (meta.get('canonical') or '').strip().lower()
    status = (meta.get('status') or '').strip().lower()

    if canonical in ('yes', 'true'):
        return ('canonical', 'Primary source of truth for this topic.')

    if status in ('planning', 'draft'):
        return ('work_in_progress', 'Active planning doc; update as work changes.')

    if status in ('reference', 'delivered'):
        return ('reference', 'Reference-only doc; keep if it still explains the system.')

    return ('reference', 'Reference-only doc; keep if still used, otherwise archive.')


def main() -> None:
    root = Path('docs')
    rows = []

    for path in sorted(root.rglob('*.md')):
        try:
            text = path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            text = path.read_bytes().decode('utf-8', errors='replace')
        meta = parse_header(text)
        kind, note = classify(path, meta)
        rows.append({
            'path': str(path),
            'kind': kind,
            'note': note,
            **meta,
        })

    now = datetime.datetime.utcnow().replace(microsecond=0).isoformat() + 'Z'
    out: list[str] = []
    out.append('# Canonical Map')
    out.append('Status: Active')
    out.append(f'Last Updated: {now}')
    out.append('Canonical: Yes')
    out.append('Owner: Documentation')
    out.append('')
    out.append('This is the current classification of the documentation set. Use it to prune, merge, or update content without accidentally relying on archival sources.')
    out.append('')

    # summary counts
    counts = {}
    for r in rows:
        counts[r['kind']] = counts.get(r['kind'], 0) + 1
    out.append('## Counts')
    for k in sorted(counts):
        out.append(f"- {k}: {counts[k]}")
    out.append('')

    out.append('## Table')
    out.append('| Kind | Path | Title | Status | Canonical | Owner | Last Updated | Note |')
    out.append('|---:|---|---|---:|---:|---|---|---|')
    for r in rows:
        out.append('| {kind} | {path} | {title} | {status} | {canonical} | {owner} | {last_updated} | {note} |'.format(
            kind=r['kind'],
            path=r['path'],
            title=r.get('title') or '',
            status=r.get('status') or '',
            canonical=r.get('canonical') or '',
            owner=r.get('owner') or '',
            last_updated=r.get('last_updated') or '',
            note=r.get('note') or '',
        ))
    out.append('')

    Path('docs/_meta/meta-canonical-map.md').write_text('\n'.join(out) + '\n', encoding='utf-8')
    print('wrote docs/_meta/meta-canonical-map.md')


if __name__ == '__main__':
    main()
