// WHAT: Pure, file-content-in/matches-out helpers for the docs consistency
//     audit's version-header and contract-freshness checks.
// WHY: Split out from scripts/docs-consistency-audit.js (which does file I/O
//     and process.exit at module scope) so the matching logic is directly
//     unit-testable without executing the whole audit.

// Matches a version-field line in ANY of the real formats found across this
// repo's docs: **Version**: X / **Version:** X / *Version: X / Version: X --
// zero-to-two asterisks, then "Version", then a MANDATORY colon (which may
// sit before or after 0-2 closing asterisks), then the semver value. The
// colon is what distinguishes a real "this tracks package.json" stamp from an
// unrelated contract/spec version like "*Version 1.2.0 | 2026-01-15 |
// LayoutV2*" (no colon at all) -- those are never flagged. Anchored to the
// start of a (whitespace-trimmed) line so a mid-sentence example like
// "accept `**Version:** X`" in prose is never mistaken for a real header.
const VERSION_LINE_RE = /^[ \t]*\*{0,2}Version\*{0,2}:\*{0,2}\s+([0-9]+\.[0-9]+\.[0-9]+)\b/gm;

// WHAT: Walks the ORIGINAL content line-by-line, tracking fenced-```-block
//     state, and returns only the lines that are real prose (not inside a
//     fence) alongside their true byte offset in the original content.
// WHY: a version-bump example inside a code fence (e.g. "Version: 9.1.0 ->
//     9.2.0 (MINOR - new prop)" demonstrating this repo's own semver
//     convention) is not a real header/footer stamp and must never be
//     flagged as one. Line-by-line (rather than blank-and-re-scan) keeps
//     every returned index a true offset into the caller's own original
//     string, so callers can safely slice/replace at that position -- an
//     earlier version of this function computed indices against a
//     "fenced content blanked out" copy, silently pointing at the wrong byte
//     offset in the real file the moment any fence appeared earlier in it.
function* nonFencedLines(content) {
  let offset = 0;
  let inFence = false;
  for (const line of content.split('\n')) {
    const isFenceMarker = /^\s*```/.test(line);
    if (isFenceMarker) {
      inFence = !inFence;
    } else if (!inFence) {
      yield { line, offset };
    }
    offset += line.length + 1; // +1 for the '\n' this split() consumed
  }
}

/**
 * @param {string} content
 * @returns {Array<{value: string, index: number, line: string}>}
 */
function findVersionStamps(content) {
  const stamps = [];
  for (const { line, offset } of nonFencedLines(content)) {
    VERSION_LINE_RE.lastIndex = 0;
    const match = VERSION_LINE_RE.exec(line);
    if (match) {
      stamps.push({ value: match[1], index: offset, line });
    }
  }
  return stamps;
}

function hasVersionStamp(content) {
  for (const { line } of nonFencedLines(content)) {
    VERSION_LINE_RE.lastIndex = 0;
    if (VERSION_LINE_RE.test(line)) return true;
  }
  return false;
}

// Matches this repo's fleet-map verification convention, e.g.:
//   "Verified against: messmass `6d28c7f3` · camera `97c1f67` · ..."
//   "Verified messmass `6d28c7f3` · fanmass `1d173e9`."
// Captures each (repo, sha) pair on the line.
const VERIFIED_LINE_RE = /^Verified(?:\s+against)?:?\s+(.+)$/gm;
const REPO_SHA_PAIR_RE = /([a-zA-Z][\w-]*)\s+`([0-9a-f]{6,40})`/g;

/**
 * @param {string} content
 * @returns {Array<{repo: string, sha: string, line: string}>}
 */
function findVerificationStamps(content) {
  const results = [];
  VERIFIED_LINE_RE.lastIndex = 0;
  let lineMatch;
  while ((lineMatch = VERIFIED_LINE_RE.exec(content)) !== null) {
    const line = lineMatch[0];
    REPO_SHA_PAIR_RE.lastIndex = 0;
    let pairMatch;
    while ((pairMatch = REPO_SHA_PAIR_RE.exec(lineMatch[1])) !== null) {
      results.push({ repo: pairMatch[1], sha: pairMatch[2], line });
    }
  }
  return results;
}

// WHAT: Which tracked markdown files are current docs bound to package.json's
//     version (the set the docs audit enforces and version:update bumps).
// WHY: One definition shared by both, so the bump can never touch a file the
//     audit does not check (archives, audit snapshots, the append-only logs).
function isCurrentDocFile(file) {
  if (!/\.(md|mdx)$/.test(file)) return false;
  if (!file.startsWith('docs/') && file !== 'README.md' && file !== 'READMEDEV.md') return false;
  if (file.startsWith('docs/archive/')) return false;
  if (file.startsWith('docs/audits/')) return false;
  if (file === 'docs/operations/operations-release-notes.md') return false;
  if (file === 'docs/operations/operations-learnings.md') return false;
  if (file === 'docs/operations/operations-action-plan.md') return false;
  return true;
}

// WHAT: Rewrites the version value inside real (non-fenced) Version: stamp
//     lines only, returning the new content and how many stamps changed.
// WHY: Bumps used to be a find-and-replace of the old version string across
//     docs/, which also rewrote history -- "fixed in v12.3.22" became "fixed in
//     v12.3.36" three bumps later. Touching only the stamp line's own value
//     leaves every prose and code-fence mention alone.
function bumpVersionStamps(content, newVersion) {
  const stamps = findVersionStamps(content).filter((s) => s.value !== newVersion);
  let out = content;
  // Right to left, so earlier offsets stay valid after each replacement.
  for (const stamp of [...stamps].reverse()) {
    const lineEnd = stamp.index + stamp.line.length;
    const segment = out.slice(stamp.index, lineEnd).replace(stamp.value, newVersion);
    out = out.slice(0, stamp.index) + segment + out.slice(lineEnd);
  }
  return { content: out, changed: stamps.length };
}

module.exports = {
  findVersionStamps,
  hasVersionStamp,
  findVerificationStamps,
  nonFencedLines,
  isCurrentDocFile,
  bumpVersionStamps,
  VERSION_LINE_RE,
};
