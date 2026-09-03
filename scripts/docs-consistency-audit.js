#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { findVersionStamps, findVerificationStamps } = require('./lib/docs-version-check');

// How many commits behind HEAD a fleet-map "Verified messmass `sha`" stamp
// can be before it's flagged as worth a fresh look. Chosen against this
// repo's own commit velocity (dozens of commits/week) -- low enough to catch
// real drift, high enough not to fire on every routine push.
const CONTRACT_FRESHNESS_COMMIT_THRESHOLD = 30;

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const packageVersion = packageJson.version;
const packageScripts = new Set(Object.keys(packageJson.scripts || {}));

const trackedFiles = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

const markdownFiles = trackedFiles.filter((file) => /\.(md|mdx)$/.test(file));
const currentDocFiles = markdownFiles.filter((file) => {
  if (!file.startsWith('docs/') && file !== 'README.md' && file !== 'READMEDEV.md') return false;
  if (file.startsWith('docs/archive/')) return false;
  if (file.startsWith('docs/audits/')) return false;
  if (file === 'docs/operations/operations-release-notes.md') return false;
  if (file === 'docs/operations/operations-learnings.md') return false;
  if (file === 'docs/operations/operations-action-plan.md') return false;
  return true;
});

const failures = [];
const warnings = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function addFailure(file, message) {
  failures.push({ file, message });
}

function addWarning(file, message) {
  warnings.push({ file, message });
}

const forbiddenCurrentDocPatterns = [
  {
    pattern: /\/api\/public\/events\/\[id\]\/stats/g,
    message: 'References deleted public stats write endpoint.'
  },
  {
    pattern: /\/api\/projects\/\[id\]\/google-sheet\/(?:pull|push)/g,
    message: 'References missing project-scoped Google Sheets sync endpoint.'
  },
  {
    pattern: /\/api\/admin\/hashtag-categories/g,
    message: 'References nonexistent admin hashtag category route.'
  },
  {
    pattern: /components\/DynamicChart\.tsx/g,
    message: 'References removed DynamicChart component as active implementation.'
  },
  {
    pattern: /TECH_AUDIT_REPORTING_SYSTEM\.md/g,
    message: 'References missing technical audit file.'
  },
  {
    pattern: /docs\/operations\/WARP\.md/g,
    message: 'References missing WARP path; use docs/operations/ops-warp.md.'
  },
  {
    pattern: /docs\/NEXT_PHASES\.md|TASKLIST\.md|(?<!operations-)ROADMAP\.md|(?<!operations-)RELEASE_NOTES\.md|CODING_STANDARDS\.md/g,
    message: 'References obsolete root governance file path.'
  },
  {
    pattern: /docs\/APP_NAVIGATION\.md|docs\/BRAIN_DUMP\.md|docs\/INGESTION\.md|docs\/conventions\/VARIABLE_MANAGEMENT_GUIDE\.md|docs\/fixes\/NUMERIC_INPUT_CONSISTENCY_FIX\.md|docs\/api-reference\.md|LEARNINGS\.md/g,
    message: 'References a missing or moved documentation path.'
  }
];

for (const file of currentDocFiles) {
  const content = read(file);

  for (const { pattern, message } of forbiddenCurrentDocPatterns) {
    if (pattern.test(content)) {
      addFailure(file, message);
    }
    pattern.lastIndex = 0;
  }

  const npmRunPattern = /npm run ([A-Za-z0-9:_-]+)/g;
  for (const match of content.matchAll(npmRunPattern)) {
    const script = match[1];
    if (!packageScripts.has(script)) {
      addFailure(file, `References missing npm script "${script}".`);
    }
  }
}

// WHAT: Scans each doc's WHOLE content (not just the first 25 lines) for
//     every version stamp -- header AND footer -- via scripts/lib/docs-
//     version-check.js's shared matcher.
// WHY: the prior 25-line window silently missed footer-only stamps entirely
//     (docs/operations/ops-warp.md, docs/design/design-chart-height-
//     system.md -- both frozen at 12.1.16 with zero CI signal), and the
//     prior regex only recognized double-asterisk headers, missing the
//     single-asterisk "*Version: X | Last Updated: ... *" footer format used
//     by several older docs. Files can carry more than one stamp (a stale
//     header AND a separately-stale footer); each stale stamp is reported.
for (const file of currentDocFiles) {
  const content = read(file);
  for (const stamp of findVersionStamps(content)) {
    if (stamp.value !== packageVersion) {
      addFailure(file, `Version header ${stamp.value} does not match package version ${packageVersion}.`);
    }
  }
}

// WHAT: Contract-freshness check -- warns when the fleet map's own
//     "Verified messmass `sha`" stamps are far behind this repo's current
//     HEAD, i.e. long enough that the integration they describe may have
//     drifted without anyone re-verifying.
// WHY: messmass#354. Deliberately WARNS, never fails: (a) it can only
//     resolve messmass's own SHA in a single-repo CI job -- camera/fanmass/
//     try-on's cited SHAs aren't resolvable here and are skipped outright;
//     (b) commit-count drift is a proxy for "worth a look", not proof the
//     contract is actually wrong.
const fleetMapPath = 'docs/_audit/fleet-architecture.md';
const fleetMapFull = path.join(root, fleetMapPath);
if (fs.existsSync(fleetMapFull)) {
  const fleetMapContent = fs.readFileSync(fleetMapFull, 'utf8');
  const seenShas = new Set();
  for (const stamp of findVerificationStamps(fleetMapContent)) {
    if (stamp.repo !== 'messmass' || stamp.sha === 'n/a' || seenShas.has(stamp.sha)) continue;
    seenShas.add(stamp.sha);
    let behindCount;
    try {
      behindCount = parseInt(
        execFileSync('git', ['rev-list', '--count', `${stamp.sha}..HEAD`], { cwd: root, encoding: 'utf8' }).trim(),
        10
      );
    } catch {
      addWarning(fleetMapPath, `"Verified messmass \`${stamp.sha}\`" cites a commit not found in this repo's history -- stamp may be a typo or the branch was rewritten.`);
      continue;
    }
    if (behindCount > CONTRACT_FRESHNESS_COMMIT_THRESHOLD) {
      addWarning(
        fleetMapPath,
        `"Verified messmass \`${stamp.sha}\`" is ${behindCount} commits behind HEAD (over the ${CONTRACT_FRESHNESS_COMMIT_THRESHOLD}-commit freshness threshold) -- worth re-verifying this edge is still accurate.`
      );
    }
  }
}

const reportLines = [
  '# Docs Consistency Audit',
  'Status: Active',
  `Last Updated: ${new Date().toISOString()}`,
  'Canonical: Yes',
  'Owner: Documentation',
  '',
  `Package version: ${packageVersion}`,
  `Current docs scanned: ${currentDocFiles.length}`,
  `Failures: ${failures.length}`,
  `Warnings: ${warnings.length}`,
  ''
];

if (failures.length) {
  reportLines.push('## Failures', '');
  for (const failure of failures) {
    reportLines.push(`- ${failure.file}: ${failure.message}`);
  }
  reportLines.push('');
} else {
  reportLines.push('## Result', '', 'No current documentation consistency failures found.', '');
}

if (warnings.length) {
  reportLines.push('## Warnings (non-blocking)', '');
  for (const warning of warnings) {
    reportLines.push(`- ${warning.file}: ${warning.message}`);
  }
}

const reportPath = path.join(root, 'docs/_meta/meta-docs-consistency-audit.md');
fs.writeFileSync(reportPath, `${reportLines.join('\n')}\n`);

if (warnings.length) {
  console.warn(`Docs consistency audit: ${warnings.length} non-blocking warning(s).`);
  for (const warning of warnings) {
    console.warn(`- ${warning.file}: ${warning.message}`);
  }
}

if (failures.length) {
  console.error(`Docs consistency audit failed with ${failures.length} issue(s).`);
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.message}`);
  }
  process.exit(1);
}

console.log(`Docs consistency audit passed for ${currentDocFiles.length} current doc file(s).`);
