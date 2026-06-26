#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
  if (file === 'docs/HANDOVER.md') return false;
  if (file === 'docs/operations/operations-release-notes.md') return false;
  if (file === 'docs/operations/operations-learnings.md') return false;
  if (file === 'docs/operations/operations-action-plan.md') return false;
  return true;
});

const failures = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function addFailure(file, message) {
  failures.push({ file, message });
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

const versionHeaderFiles = currentDocFiles.filter((file) => {
  const content = read(file);
  return /\*\*Version\*\*:|\*\*Version\*\s*:/.test(content);
});

for (const file of versionHeaderFiles) {
  const content = read(file);
  const versionMatch = content.match(/\*\*Version\*\*\s*:?\s*`?([0-9]+\.[0-9]+\.[0-9]+)`?/);
  if (versionMatch && versionMatch[1] !== packageVersion) {
    addFailure(file, `Version header ${versionMatch[1]} does not match package version ${packageVersion}.`);
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
  ''
];

if (failures.length) {
  reportLines.push('## Failures', '');
  for (const failure of failures) {
    reportLines.push(`- ${failure.file}: ${failure.message}`);
  }
} else {
  reportLines.push('## Result', '', 'No current documentation consistency failures found.');
}

const reportPath = path.join(root, 'docs/_meta/meta-docs-consistency-audit.md');
fs.writeFileSync(reportPath, `${reportLines.join('\n')}\n`);

if (failures.length) {
  console.error(`Docs consistency audit failed with ${failures.length} issue(s).`);
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.message}`);
  }
  process.exit(1);
}

console.log(`Docs consistency audit passed for ${currentDocFiles.length} current doc file(s).`);
