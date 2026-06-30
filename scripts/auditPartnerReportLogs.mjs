#!/usr/bin/env node

/**
 * WHAT: Audit partner-report production runtime health using Vercel log queries.
 * WHY: Native Vercel alerts cover project-level anomalies, but partner-report incidents
 * need a deterministic route-specific query for fast operator verification.
 * HOW: Query Vercel runtime logs, summarize statuses/domains/sources, and optionally
 * fail when partner-report 4xx or 5xx traffic is present in the requested time window.
 */

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');

function parseArgs(argv) {
  const options = {
    since: '24h',
    environment: 'production',
    limit: 500,
    query: 'partner-report',
    json: false,
    failOnErrors: false,
    project: null,
  };

  for (const arg of argv) {
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--fail-on-errors') {
      options.failOnErrors = true;
      continue;
    }
    if (arg.startsWith('--since=')) {
      options.since = arg.slice('--since='.length);
      continue;
    }
    if (arg.startsWith('--environment=')) {
      options.environment = arg.slice('--environment='.length);
      continue;
    }
    if (arg.startsWith('--limit=')) {
      const parsedLimit = Number(arg.slice('--limit='.length));
      if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
        throw new Error(`Invalid --limit value: ${arg}`);
      }
      options.limit = parsedLimit;
      continue;
    }
    if (arg.startsWith('--query=')) {
      options.query = arg.slice('--query='.length);
      continue;
    }
    if (arg.startsWith('--project=')) {
      options.project = arg.slice('--project='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function runVercelLogs(options, extraArgs = []) {
  const args = [
    'vercel',
    'logs',
    '--since',
    options.since,
    '--query',
    options.query,
    '--environment',
    options.environment,
    '--no-branch',
    '-n',
    String(options.limit),
    '--json',
    ...extraArgs,
  ];

  if (options.project) {
    args.splice(2, 0, '--project', options.project);
  }

  const result = spawnSync('npx', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0) {
    const stderr = result.stderr.trim();
    const stdout = result.stdout.trim();
    throw new Error(
      [
        `Vercel logs query failed with exit code ${result.status}.`,
        stderr || stdout || 'No error output returned.',
      ].join('\n')
    );
  }

  return result.stdout
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line));
}

function countBy(entries, keyFn) {
  const counts = {};
  for (const entry of entries) {
    const key = keyFn(entry);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function formatTimestamp(timestamp) {
  return typeof timestamp === 'number' ? new Date(timestamp).toISOString() : null;
}

function buildSummary(options) {
  const sampleEntries = runVercelLogs(options);
  const fourHundreds = runVercelLogs(options, ['--status-code', '4xx']);
  const fiveHundreds = runVercelLogs(options, ['--status-code', '5xx']);

  const timestamps = sampleEntries
    .map(entry => entry.timestamp)
    .filter(timestamp => typeof timestamp === 'number')
    .sort((left, right) => left - right);

  return {
    scope: {
      project: options.project || 'linked-project',
      query: options.query,
      since: options.since,
      environment: options.environment,
      limit: options.limit,
    },
    sample: {
      totalEntries: sampleEntries.length,
      limitReached: sampleEntries.length === options.limit,
      oldest: timestamps.length > 0 ? formatTimestamp(timestamps[0]) : null,
      newest: timestamps.length > 0 ? formatTimestamp(timestamps[timestamps.length - 1]) : null,
      byStatus: countBy(sampleEntries, entry => String(entry.responseStatusCode ?? 'unknown')),
      byLevel: countBy(sampleEntries, entry => String(entry.level ?? 'unknown')),
      byDomain: countBy(sampleEntries, entry => String(entry.domain ?? 'unknown')),
      bySource: countBy(sampleEntries, entry => String(entry.source ?? 'unknown')),
    },
    errors: {
      fourHundreds: fourHundreds.length,
      fiveHundreds: fiveHundreds.length,
      failingEntriesSample: [...fourHundreds, ...fiveHundreds].slice(0, 20).map(entry => ({
        timestamp: formatTimestamp(entry.timestamp),
        status: entry.responseStatusCode ?? null,
        level: entry.level ?? null,
        domain: entry.domain ?? null,
        path: entry.requestPath ?? null,
        source: entry.source ?? null,
        message: entry.message ?? null,
      })),
    },
    healthy: fourHundreds.length === 0 && fiveHundreds.length === 0,
  };
}

function printTextSummary(summary) {
  const { scope, sample, errors, healthy } = summary;

  console.log('Partner Report Runtime Audit');
  console.log(`  Project: ${scope.project}`);
  console.log(`  Query: ${scope.query}`);
  console.log(`  Window: ${scope.since}`);
  console.log(`  Environment: ${scope.environment}`);
  console.log(`  Sample entries: ${sample.totalEntries}${sample.limitReached ? ` (limit ${scope.limit} reached)` : ''}`);
  console.log(`  Sample oldest: ${sample.oldest || 'n/a'}`);
  console.log(`  Sample newest: ${sample.newest || 'n/a'}`);
  console.log(`  Status counts: ${JSON.stringify(sample.byStatus)}`);
  console.log(`  Domain counts: ${JSON.stringify(sample.byDomain)}`);
  console.log(`  Source counts: ${JSON.stringify(sample.bySource)}`);
  console.log(`  4xx count: ${errors.fourHundreds}`);
  console.log(`  5xx count: ${errors.fiveHundreds}`);

  if (!healthy && errors.failingEntriesSample.length > 0) {
    console.log('  Failing entry sample:');
    for (const entry of errors.failingEntriesSample) {
      console.log(`    - ${entry.timestamp} ${entry.status} ${entry.path} (${entry.domain})`);
    }
  }
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const summary = buildSummary(options);

    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      printTextSummary(summary);
    }

    if (options.failOnErrors && !summary.healthy) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

await main();
