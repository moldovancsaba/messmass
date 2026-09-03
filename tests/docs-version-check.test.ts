import {
  findVersionStamps,
  hasVersionStamp,
  findVerificationStamps,
  nonFencedLines,
} from '@/scripts/lib/docs-version-check';

describe('findVersionStamps', () => {
  it('matches **Version**: X (colon outside closing stars)', () => {
    expect(findVersionStamps('**Version**: 12.1.16\n').map((s) => s.value)).toEqual(['12.1.16']);
  });

  it('matches **Version:** X (colon inside closing stars)', () => {
    expect(findVersionStamps('**Version:** 12.3.10\n').map((s) => s.value)).toEqual(['12.3.10']);
  });

  it('matches *Version: X (single star, colon) -- the real regex gap this issue closes', () => {
    expect(
      findVersionStamps('*Version: 12.1.16 | Last Updated: 2026-06-26T10:00:00.000Z (UTC) | Status: Production*\n').map(
        (s) => s.value
      )
    ).toEqual(['12.1.16']);
  });

  it('matches bare Version: X with no asterisks at all', () => {
    expect(findVersionStamps('Version: 12.3.10\n').map((s) => s.value)).toEqual(['12.3.10']);
  });

  it('finds a footer stamp regardless of how far into the file it is', () => {
    const content = 'line\n'.repeat(200) + '**Version**: 12.1.16\n';
    expect(findVersionStamps(content).map((s) => s.value)).toEqual(['12.1.16']);
  });

  it('finds both a stale header AND a stale footer in the same file', () => {
    const content = '**Version**: 12.3.10\n' + 'body\n'.repeat(50) + '*Version: 12.1.33 | Last Updated: x*\n';
    expect(findVersionStamps(content).map((s) => s.value)).toEqual(['12.3.10', '12.1.33']);
  });

  it('does NOT match a contract-specific version with no colon (e.g. "*Version 1.0.0 | ... *")', () => {
    expect(findVersionStamps('*Report Layout V2 Renderer Contract*  \n*Version 1.0.0 | 2026-01-15 | LayoutV2*\n')).toEqual(
      []
    );
  });

  it('does NOT match "Spec Version: X" (a different, independently-versioned label)', () => {
    expect(findVersionStamps('Spec Version: 1.0.0\n')).toEqual([]);
  });

  it('does NOT match a version pattern mentioned mid-sentence in prose', () => {
    expect(
      findVersionStamps('3. Fix the docs:audit version regex to accept `**Version:** X` (3 canonical docs)\n')
    ).toEqual([]);
    expect(
      findVersionStamps('- **Version:** Bump to 11.58.0 in `package.json`, README, and docs that display version.\n')
    ).toEqual([]);
  });

  it('does NOT match a version-bump example inside a fenced code block', () => {
    const content = '#### Step 5\n```\nVersion: 9.1.0 -> 9.2.0 (MINOR - new prop)\n```\n';
    expect(findVersionStamps(content)).toEqual([]);
  });

  it('does NOT match a non-semver placeholder value (no crash, just no match)', () => {
    expect(findVersionStamps('**Version**: 12.1.x (Phase 2 Delivered)\n')).toEqual([]);
  });
});

describe('hasVersionStamp', () => {
  it('is true when a real stamp exists', () => {
    expect(hasVersionStamp('**Version:** 12.3.10\n')).toBe(true);
  });

  it('is false for a contract-version-only file', () => {
    expect(hasVersionStamp('*Version 1.0.0 | 2026-01-15 | LayoutV2*\n')).toBe(false);
  });
});

describe('nonFencedLines', () => {
  it('skips lines inside a fenced code block', () => {
    const content = 'before\n```\nfenced line 1\nfenced line 2\n```\nafter\n';
    const kept = [...nonFencedLines(content)].map((l) => l.line);
    // "before" and "after" bracket the fence; the trailing "" is the empty
    // line produced by the file's own final newline, not fenced content.
    expect(kept).toEqual(['before', 'after', '']);
  });

  it('reports each kept line at its true byte offset in the ORIGINAL content', () => {
    // Regression test: an earlier implementation computed offsets against a
    // separately fence-stripped copy of the content, which silently drifted
    // out of sync with the real file the moment a fence appeared earlier in
    // it -- findVersionStamps' index would then point at the wrong line
    // entirely in any file with a code fence before its version stamp.
    const content = 'header\n```\ncode\n```\nfooter: real content here\n';
    const [footerEntry] = [...nonFencedLines(content)].filter((l) => l.line.startsWith('footer'));
    expect(content.slice(footerEntry.offset, footerEntry.offset + footerEntry.line.length)).toEqual(footerEntry.line);
  });
});

describe('findVersionStamps index correctness', () => {
  it('reports an index that truly points at the stamp line, even after an earlier fenced code block', () => {
    const content = '# Doc\n```\nVersion: 9.1.0 -> 9.2.0 (MINOR - new prop)\n```\n' + 'padding\n'.repeat(500) + '**Version**: 12.1.16\n';
    const stamps = findVersionStamps(content);
    expect(stamps).toHaveLength(1);
    const [stamp] = stamps;
    expect(stamp.value).toEqual('12.1.16');
    expect(content.slice(stamp.index, stamp.index + stamp.line.length)).toEqual(stamp.line);
  });
});

describe('findVerificationStamps', () => {
  it('extracts every repo/sha pair from a "Verified..." line, including multi-repo lines', () => {
    const content = 'Verified against: messmass `6d28c7f3` · camera `97c1f67` · fanmass `1d173e9`\n';
    expect(findVerificationStamps(content)).toEqual([
      { repo: 'messmass', sha: '6d28c7f3', line: content.trim() },
      { repo: 'camera', sha: '97c1f67', line: content.trim() },
      { repo: 'fanmass', sha: '1d173e9', line: content.trim() },
    ]);
  });

  it('handles the shorter "Verified <repo> `sha` · <repo> `sha`." form', () => {
    const content = 'Verified messmass `6d28c7f3` · fanmass `1d173e9`. fanmass is always the caller.\n';
    const result = findVerificationStamps(content);
    expect(result.map((r) => r.repo)).toEqual(['messmass', 'fanmass']);
    expect(result.map((r) => r.sha)).toEqual(['6d28c7f3', '1d173e9']);
  });

  it('returns nothing when no Verified line is present', () => {
    expect(findVerificationStamps('Nothing to see here.\n')).toEqual([]);
  });
});
