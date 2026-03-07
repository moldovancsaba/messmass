#!/usr/bin/env node
/**
 * Version consistency helper
 *
 * Source of truth: package.json -> version
 * Verification targets:
 * - package-lock.json top-level version
 * - package-lock.json packages[""].version
 * - docs/operations/operations-release-notes.md contains the current version
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const mode = process.argv.includes('--verify') ? 'verify' : 'update';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function writeText(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), value, 'utf8');
}

const packageJson = readJson('package.json');
const packageLock = readJson('package-lock.json');
const releaseNotesPath = 'docs/operations/operations-release-notes.md';
const version = packageJson.version;

if (mode === 'verify') {
  const failures = [];

  if (packageLock.version !== version) {
    failures.push(`package-lock.json version (${packageLock.version}) does not match package.json (${version})`);
  }

  if (!packageLock.packages || !packageLock.packages[''] || packageLock.packages[''].version !== version) {
    const actual = packageLock.packages && packageLock.packages[''] ? packageLock.packages[''].version : 'missing';
    failures.push(`package-lock.json packages[\"\"].version (${actual}) does not match package.json (${version})`);
  }

  const releaseNotes = readText(releaseNotesPath);
  if (!releaseNotes.includes(`[v${version}]`)) {
    failures.push(`${releaseNotesPath} does not contain an entry for v${version}`);
  }

  if (failures.length > 0) {
    console.error('Version verification failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log(`Version verification passed for ${version}`);
  process.exit(0);
}

packageLock.version = version;
if (!packageLock.packages) {
  packageLock.packages = {};
}
if (!packageLock.packages['']) {
  packageLock.packages[''] = {};
}
packageLock.packages[''].version = version;
writeJson('package-lock.json', packageLock);

const releaseNotes = readText(releaseNotesPath);
if (!releaseNotes.includes(`[v${version}]`)) {
  console.warn(`Warning: ${releaseNotesPath} does not contain an entry for v${version}`);
}

console.log(`Updated version artifacts for ${version}`);
