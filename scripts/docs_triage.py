from __future__ import annotations

import datetime
import re
from collections import Counter
from pathlib import Path


def parse_header(text: str) -> dict:
    lines = text.splitlines()
    title = None
    status = None
    last_updated = None
    canonical = None
    owner = None

    for line in lines[:40]:
        if title is None and line.startswith('# '):
            title = line[2:].strip()

        m = re.match(r'^(Status|Last Updated|Canonical|Owner):\s*(.+?)\s*$', line)
        if not m:
            continue

        key, val = m.group(1), m.group(2)
        if key == 'Status':
            status = val
        elif key == 'Last Updated':
            last_updated = val
        elif key == 'Canonical':
            canonical = val
        elif key == 'Owner':
            owner = val

    return {
        'title': title,
        'status': status,
        'last_updated': last_updated,
        'canonical': canonical,
        'owner': owner,
    }


def tokenize(text: str) -> list[str]:
    # Very rough tokenizer for similarity. Avoid code blocks by stripping fenced content.
    text = re.sub(r"```[\s\S]*?```", " ", text)
    text = text.lower()
    # keep words and path-like tokens
    return re.findall(r"[a-z0-9_/\.-]{3,}", text)


def shingles(tokens: list[str], k: int = 5) -> set[int]:
    if len(tokens) < k:
        return set()
    out: set[int] = set()
    # rolling hash of k-word shingles
    for i in range(len(tokens) - k + 1):
        s = ' '.join(tokens[i:i+k])
        out.add(hash(s))
    return out


def jaccard(a: set[int], b: set[int]) -> float:
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0


def main() -> None:
    root = Path('docs')
    docs = []
    for path in sorted(root.rglob('*.md')):
        p = str(path)
        try:
            text = path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            text = path.read_bytes().decode('utf-8', errors='replace')
        meta = parse_header(text)
        # Treat explicit "Status: Archived" as archive-tier, even if the path is in the active tree.
        # This keeps redirect stubs and legacy entrypoints from polluting the near-duplicate scan.
        tier = 'archive' if ('/archive/' in p or '/_archive/' in p or meta.get('status') == 'Archived') else 'active'
        lines = text.count('\n') + 1
        docs.append({'path': p, 'tier': tier, 'text': text, 'lines': lines, **meta})

    active = [d for d in docs if d['tier'] == 'active']
    archive = [d for d in docs if d['tier'] == 'archive']

    missing_meta = []
    suspicious_titles = []
    for d in active:
        if not d['status'] or not d['canonical'] or not d['owner'] or not d['last_updated']:
            missing_meta.append(d)
        t = d['title'] or ''
        if t.endswith('.md') or 'docs/' in t or t.strip() == Path(d['path']).name:
            suspicious_titles.append(d)

    # Similarity scan among active docs, excluding massive ones and redirect stubs.
    sim_candidates = [
        d for d in active
        if d['lines'] <= 1200
        and len(d['text']) <= 250_000
        and d.get('status') != 'Archived'
    ]
    sh = {}
    for d in sim_candidates:
        sh[d['path']] = shingles(tokenize(d['text']), k=5)

    pairs = []
    for i in range(len(sim_candidates)):
        a = sim_candidates[i]
        for j in range(i + 1, len(sim_candidates)):
            b = sim_candidates[j]
            score = jaccard(sh[a['path']], sh[b['path']])
            if score >= 0.35:
                pairs.append((score, a['path'], b['path']))

    pairs.sort(reverse=True)

    now = datetime.datetime.utcnow().replace(microsecond=0).isoformat() + 'Z'
    out = []
    out.append('# Docs Triage')
    out.append('Status: Active')
    out.append(f'Last Updated: {now}')
    out.append('Canonical: Yes')
    out.append('Owner: Documentation')
    out.append('')
    out.append('This report highlights actionable doc-cleanup work: missing metadata, suspicious titles, and potential near-duplicates in the ACTIVE docs tree.')
    out.append('')
    out.append('## Counts')
    out.append(f'- Active Markdown files: {len(active)}')
    out.append(f'- Archived Markdown files: {len(archive)}')
    out.append(f'- Active files missing header metadata fields: {len(missing_meta)}')
    out.append(f'- Active files with suspicious titles: {len(suspicious_titles)}')
    out.append(f'- Near-duplicate candidate pairs (Jaccard >= 0.35): {len(pairs)}')
    out.append('')

    out.append('## Action List (Fixed Order)')
    out.append('1. Fix header blocks (Status/Last Updated/Canonical/Owner) for active files that are missing them.')
    out.append('2. Fix any broken titles (titles that look like filenames or paths).')
    out.append('3. Review near-duplicate candidates and merge where appropriate; leave an archived pointer if history must remain.')
    out.append('4. Re-run `scripts/docs_inventory.py` and `scripts/docs_triage.py` until the counts stabilize.')
    out.append('')

    out.append('## Active Files Missing Metadata')
    out.append('| Path | Title | Missing | Lines |')
    out.append('|---|---|---|---:|')
    for d in sorted(missing_meta, key=lambda x: x['path']):
        missing = []
        for k in ['status','last_updated','canonical','owner']:
            if not d[k]:
                missing.append(k)
        out.append(f"| {d['path']} | {d['title'] or ''} | {', '.join(missing)} | {d['lines']} |")
    out.append('')

    out.append('## Active Files With Suspicious Titles')
    out.append('| Path | Title |')
    out.append('|---|---|')
    for d in sorted(suspicious_titles, key=lambda x: x['path']):
        out.append(f"| {d['path']} | {d['title'] or ''} |")
    out.append('')

    out.append('## Near-Duplicate Candidates (Active Tree)')
    out.append('These pairs are likely mergeable or at least should cross-link clearly.')
    out.append('')
    out.append('| Score | A | B |')
    out.append('|---:|---|---|')
    for score, a, b in pairs[:60]:
        out.append(f'| {score:.2f} | {a} | {b} |')
    out.append('')

    Path('docs/_meta/DOCS_TRIAGE.md').write_text('\n'.join(out) + '\n', encoding='utf-8')
    print('wrote docs/_meta/DOCS_TRIAGE.md')


if __name__ == '__main__':
    main()
